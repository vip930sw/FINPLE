"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const {
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  OBSERVATION_SET_HASH_DOMAIN,
  SPECS,
  VERSIONS,
  buildObservationSetHash,
  buildPreparationSummary,
  buildValidPreparationPacket,
  evaluateTestDatabaseExecutionGatePreparation,
  sealContract,
  validateAuthorizationEnvelope,
  validateAuthorizationEnvelopeContext,
  validateCertificateObservation,
  validateContract,
  validateDatabaseObservation,
  validateNetworkObservation,
  validateNamespaceObservation,
  validatePreparationSummary,
} = require("./lib/metrics-cutover-test-database-execution-gate-preparation.cjs");
const {
  hashWithDomain,
} = require("./lib/metrics-cutover-guarded-executor-contracts.cjs");
const {
  FUTURE_SCENARIOS,
} = require("./lib/metrics-cutover-postgresql-test-package.cjs");
const {
  evaluateCliRequest,
} = require("./check-metrics-cutover-test-database-execution-gate-preparation.cjs");

function assertAuthorityFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.preparationSummary, {});
  assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

function reseal(packet, name) {
  const value = packet.contracts[name];
  delete value[SPECS[name].idField];
  delete value[SPECS[name].hashField];
  packet.contracts[name] = sealContract(value, name);
}

function evaluateMutation(name, mutate) {
  const packet = buildValidPreparationPacket();
  mutate(packet.contracts[name], packet);
  reseal(packet, name);
  return evaluateTestDatabaseExecutionGatePreparation(packet);
}

const SYNTHETIC_OBSERVED_AT = "2026-07-18T00:00:00.000Z";
const SYNTHETIC_EVALUATION_CLOCK = "2026-07-18T00:05:00.000Z";
const SYNTHETIC_EXPIRES_AT = "2026-07-18T00:10:00.000Z";
const SYNTHETIC_ENVIRONMENT_BINDING_HASH = "e".repeat(64);
const SYNTHETIC_NAMESPACE_EVIDENCE_HASH = "4".repeat(64);

function syntheticObservationBase(packet, policyName, environmentBindingHash) {
  const bindings = packet.contracts[policyName].upstreamBindings;
  return {
    packageSummaryId: bindings.packageSummaryId,
    packageSummaryHash: bindings.packageSummaryHash,
    testDatabaseGateId: bindings.testDatabaseGateId,
    testDatabaseGateHash: bindings.testDatabaseGateHash,
    environmentBindingHash,
    policyId: packet.contracts[policyName][SPECS[policyName].idField],
    policyHash: packet.contracts[policyName][SPECS[policyName].hashField],
    observerAttestationHash: "1".repeat(64),
    observedAt: SYNTHETIC_OBSERVED_AT,
    expiresAt: SYNTHETIC_EXPIRES_AT,
  };
}

function buildSanitizedSyntheticFutureFixture(
  environmentBindingHash = SYNTHETIC_ENVIRONMENT_BINDING_HASH,
) {
  const packet = buildValidPreparationPacket();
  const observations = {
    network: sealContract({
      contractVersion: VERSIONS.networkObservation,
      ...syntheticObservationBase(packet, "network", environmentBindingHash),
      destinationAllowlistHash: "2".repeat(64),
      observedDestinationCount: 1,
      wildcardObserved: false, redirectObserved: false,
      dnsRebindingObserved: false, loopbackObserved: false,
      privateNetworkObserved: false, metadataServiceObserved: false,
      productionDestinationObserved: false, stagingDestinationObserved: false,
      unrelatedDestinationObserved: false, manualReviewRequired: false,
      rawMaterialPresent: false,
    }, "networkObservation"),
    database: sealContract({
      contractVersion: VERSIONS.databaseObservation,
      ...syntheticObservationBase(packet, "database", environmentBindingHash),
      databaseFingerprintHash: "3".repeat(64),
      disposableNamespaceEvidenceHash: SYNTHETIC_NAMESPACE_EVIDENCE_HASH,
      purposeClassification: "disposable_isolated_conformance_only",
      serverCapabilityCategory: "supported_postgresql_capability_category",
      utcBehaviorAttestationHash: "5".repeat(64),
      transactionIsolationAttestationHash: "6".repeat(64),
      schemaPackageState: "expected_package_absent_before_migration",
      applicationObjectObserved: false, unrelatedObjectObserved: false,
      namespaceIsolationValidated: true, manualReviewRequired: false,
      rawMaterialPresent: false,
    }, "databaseObservation"),
    certificate: sealContract({
      contractVersion: VERSIONS.certificateObservation,
      ...syntheticObservationBase(packet, "certificate", environmentBindingHash),
      certificateFingerprintHash: "7".repeat(64),
      tlsValidated: true, certificateChainValidated: true,
      hostnameVerificationValidated: true, rotationAmbiguous: false,
      expired: false, manualReviewRequired: false, rawMaterialPresent: false,
    }, "certificateObservation"),
    namespace: sealContract({
      contractVersion: VERSIONS.namespaceObservation,
      ...syntheticObservationBase(packet, "environment", environmentBindingHash),
      disposableNamespaceEvidenceHash: SYNTHETIC_NAMESPACE_EVIDENCE_HASH,
      namespaceCategory: "new_empty_disposable_namespace",
      namespaceEmpty: true, namespaceIsolated: true,
      applicationObjectObserved: false, unrelatedObjectObserved: false,
      manualReviewRequired: false, rawMaterialPresent: false,
    }, "namespaceObservation"),
  };
  const bindings = packet.contracts.authorization.upstreamBindings;
  const authorizationEnvelope = sealContract({
    contractVersion: VERSIONS.authorizationEnvelope,
    packageSummaryId: bindings.packageSummaryId,
    packageSummaryHash: bindings.packageSummaryHash,
    testDatabaseGateId: bindings.testDatabaseGateId,
    testDatabaseGateHash: bindings.testDatabaseGateHash,
    authorizationPolicyId: packet.contracts.authorization.authorizationPolicyId,
    authorizationPolicyHash: packet.contracts.authorization.authorizationPolicyHash,
    environmentClassificationId:
      packet.contracts.environment.environmentClassificationId,
    environmentClassificationHash:
      packet.contracts.environment.environmentClassificationHash,
    environmentBindingHash,
    observationSetHash: buildObservationSetHash(
      environmentBindingHash, observations,
    ),
    networkObservationId: observations.network.observationId,
    networkObservationHash: observations.network.observationHash,
    databaseObservationId: observations.database.observationId,
    databaseObservationHash: observations.database.observationHash,
    certificateObservationId: observations.certificate.observationId,
    certificateObservationHash: observations.certificate.observationHash,
    namespaceObservationId: observations.namespace.observationId,
    namespaceObservationHash: observations.namespace.observationHash,
    credentialPolicyId: packet.contracts.credential.credentialPolicyId,
    credentialPolicyHash: packet.contracts.credential.credentialPolicyHash,
    futureEvidenceSpecId: bindings.futureEvidenceSpecId,
    futureEvidenceSpecHash: bindings.futureEvidenceSpecHash,
    exactScenarioCount: FUTURE_SCENARIOS.length,
    scenarioOrder: [...FUTURE_SCENARIOS],
    sanitizedApproverIdentityHash: "9".repeat(64),
    issuedAt: "2026-07-18T00:04:00.000Z",
    expiresAt: "2026-07-18T00:09:00.000Z",
    nonceHash: "a".repeat(64), maximumExecutionCount: 1,
    allowedOperationSet: [...packet.contracts.authorization.allowedOperationSet],
    manualReviewRequired: false, rawMaterialPresent: false,
  }, "authorizationEnvelope");
  return {
    packet, observations, authorizationEnvelope,
    observationContext: { upstream: packet.upstream, contracts: packet.contracts },
    authorizationContext: {
      upstream: packet.upstream, contracts: packet.contracts, observations,
      priorNonceHashes: [],
    },
  };
}

function resealSynthetic(value, name) {
  const next = structuredClone(value);
  delete next[SPECS[name].idField];
  delete next[SPECS[name].hashField];
  return sealContract(next, name);
}

function resealObservationBinding(fixture, name) {
  fixture.observations[name] = resealSynthetic(
    fixture.observations[name], `${name}Observation`,
  );
  fixture.authorizationEnvelope[`${name}ObservationId`] =
    fixture.observations[name].observationId;
  fixture.authorizationEnvelope[`${name}ObservationHash`] =
    fixture.observations[name].observationHash;
  fixture.authorizationEnvelope.observationSetHash = buildObservationSetHash(
    fixture.authorizationEnvelope.environmentBindingHash,
    fixture.observations,
  );
}

function resealCredentialAuthorizationChain(fixture) {
  reseal(fixture.packet, "credential");
  fixture.packet.contracts.authorization.credentialPolicyId =
    fixture.packet.contracts.credential.credentialPolicyId;
  fixture.packet.contracts.authorization.credentialPolicyHash =
    fixture.packet.contracts.credential.credentialPolicyHash;
  reseal(fixture.packet, "authorization");
  fixture.authorizationEnvelope.credentialPolicyId =
    fixture.packet.contracts.credential.credentialPolicyId;
  fixture.authorizationEnvelope.credentialPolicyHash =
    fixture.packet.contracts.credential.credentialPolicyHash;
  fixture.authorizationEnvelope.authorizationPolicyId =
    fixture.packet.contracts.authorization.authorizationPolicyId;
  fixture.authorizationEnvelope.authorizationPolicyHash =
    fixture.packet.contracts.authorization.authorizationPolicyHash;
  fixture.authorizationEnvelope = resealSynthetic(
    fixture.authorizationEnvelope, "authorizationEnvelope",
  );
}

test("valid preparation packet is ready without any authority", () => {
  const result = evaluateTestDatabaseExecutionGatePreparation(
    buildValidPreparationPacket(),
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "test_database_execution_gate_prepared");
  assert.equal(result.preparationSummary.gatePrepared, true);
  assert.equal(result.preparationSummary.environmentObserved, false);
  assert.equal(result.preparationSummary.authorizationIssued, false);
  assert.equal(result.preparationSummary.authorizationConsumed, false);
  assertAuthorityFalse(result);
  for (const field of FIXED_FALSE_FIELDS) {
    assert.equal(result.preparationSummary[field], false, field);
  }
});

test("idle, malformed, CLI rejection, and runtime exception are fixed false", () => {
  const idle = evaluateTestDatabaseExecutionGatePreparation();
  assert.equal(idle.status, "idle");
  assertAuthorityFalse(idle);
  assert.deepEqual(idle.preparationSummary, {});

  assertBlocked(
    evaluateTestDatabaseExecutionGatePreparation({}),
    "preparation_packet_fields_invalid",
  );
  assertBlocked(evaluateCliRequest(["forbidden-environment-value"]), "cli_arguments_forbidden");
  const failed = evaluateCliRequest([], { runCheck() { throw new Error("private"); } });
  assertBlocked(failed, "execution_gate_preparation_check_failed");
  assert.equal(JSON.stringify(failed).includes("private"), false);
});

test("CLI emits one sanitized ready line and rejects arguments without echo", () => {
  const script = path.join(
    __dirname, "check-metrics-cutover-test-database-execution-gate-preparation.cjs",
  );
  const ready = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(ready.status, 0);
  assert.equal(ready.stdout.trim().split(/\r?\n/).length, 1);
  assert.equal(JSON.parse(ready.stdout).status, "test_database_execution_gate_prepared");
  const rejected = spawnSync(process.execPath, [script, "raw-private-host"], { encoding: "utf8" });
  assert.equal(rejected.status, 2);
  assert.equal(rejected.stdout.includes("raw-private-host"), false);
  assertAuthorityFalse(JSON.parse(rejected.stdout));
});

test("missing, extra, version, ID, and hash contract fields block", () => {
  for (const [kind, mutate, issue] of [
    ["missing", (value) => { delete value.purposeClassification; }, "environment_fields_invalid"],
    ["extra", (value) => { value.rawEndpoint = "forbidden"; }, "environment_fields_invalid"],
    ["version", (value) => { value.contractVersion = "wrong"; }, "environment_contract_version_invalid"],
  ]) {
    const result = evaluateMutation("environment", mutate);
    assertBlocked(result, issue);
    assert.ok(kind);
  }
  const packet = buildValidPreparationPacket();
  packet.contracts.environment.environmentClassificationId =
    `metrics-cutover-test-database-environment-${"a".repeat(64)}`;
  assertBlocked(
    evaluateTestDatabaseExecutionGatePreparation(packet),
    "environment_id_mismatch",
  );
  const hash = buildValidPreparationPacket();
  hash.contracts.environment.environmentClassificationHash = "b".repeat(64);
  assertBlocked(
    evaluateTestDatabaseExecutionGatePreparation(hash),
    "environment_hash_mismatch",
  );
});

test("all merged Step 114-2X-E artifacts and ID/hash pairs are required", () => {
  const cases = [
    (packet) => { delete packet.upstream.postgresqlPackage.migrationSpec; },
    (packet) => { packet.upstream.postgresqlPackage.querySpec.querySpecHash = "c".repeat(64); },
    (packet) => { packet.upstream.postgresqlPackage.introspectionSpec.introspectionSpecHash = "c".repeat(64); },
    (packet) => { packet.upstream.postgresqlPackage.testDatabaseGate.testDatabaseGateHash = "c".repeat(64); },
    (packet) => { packet.upstream.postgresqlPackage.futureEvidenceSpec.futureEvidenceSpecHash = "c".repeat(64); },
    (packet) => { packet.upstream.packageSummary.packageSummaryHash = "c".repeat(64); },
  ];
  for (const mutate of cases) {
    const packet = buildValidPreparationPacket();
    mutate(packet);
    const result = evaluateTestDatabaseExecutionGatePreparation(packet);
    assert.equal(result.status, "blocked");
    assertAuthorityFalse(result);
  }
  const binding = evaluateMutation("network", (value) => {
    value.upstreamBindings.packageSummaryHash = "d".repeat(64);
  });
  assertBlocked(binding, "network_upstream_binding_mismatch");
});

test("environment classification is disposable isolated conformance only", () => {
  const drift = evaluateMutation("environment", (value) => {
    value.purposeClassification = "shared_environment";
  });
  assertBlocked(drift, "environment_field_invalid:purposeClassification");
  for (const field of [
    "production", "staging", "sharedDevelopment", "applicationDataStorage",
    "analyticsOrReportingStorage", "existingFinpleApplicationDatabase",
    "containsUnrelatedData",
  ]) {
    const result = evaluateMutation("environment", (value) => { value[field] = true; });
    assertBlocked(result, `environment_field_invalid:${field}`);
  }
  const namespace = evaluateMutation("environment", (value) => {
    value.allowedNamespaceCategories.push("existing_namespace");
  });
  assertBlocked(namespace, "environment_field_invalid:allowedNamespaceCategories");
});

test("network destination policy stays sanitized fresh exact and fail closed", () => {
  for (const field of [
    "wildcardAllowed", "redirectAllowed", "dnsRebindingAllowed",
    "loopbackAllowed", "privateNetworkAllowed", "metadataServiceAllowed",
    "productionDestinationAllowed", "stagingDestinationAllowed",
    "unrelatedDestinationAllowed", "observationExecuted",
  ]) {
    const result = evaluateMutation("network", (value) => { value[field] = true; });
    assertBlocked(result, `network_field_invalid:${field}`);
  }
  for (const [field, value] of [
    ["maximumAgeSeconds", 0], ["allowedClockSkewSeconds", -1],
    ["exactDestinationCount", 2], ["ambiguityPolicy", "continue"],
  ]) {
    const result = evaluateMutation("network", (policy) => { policy[field] = value; });
    assertBlocked(result, `network_field_invalid:${field}`);
  }
});

test("database fingerprint and namespace policy cannot be weakened", () => {
  for (const field of [
    "serverCapabilityCategoryRequired", "utcBehaviorAttestationRequired",
    "transactionIsolationAttestationRequired", "applicationObjectAbsenceRequired",
    "unrelatedObjectAbsenceRequired",
  ]) {
    const result = evaluateMutation("database", (value) => { value[field] = false; });
    assertBlocked(result, `database_field_invalid:${field}`);
  }
  for (const field of ["catalogQueryExecuted", "observationExecuted"]) {
    const result = evaluateMutation("database", (value) => { value[field] = true; });
    assertBlocked(result, `database_field_invalid:${field}`);
  }
  const state = evaluateMutation("database", (value) => {
    value.schemaPackageStates = ["accept_any_package"];
  });
  assertBlocked(state, "database_field_invalid:schemaPackageStates");
});

test("certificate policy requires TLS chain and hostname verification", () => {
  for (const field of ["tlsRequired", "hostnameVerificationRequired"]) {
    const result = evaluateMutation("certificate", (value) => { value[field] = false; });
    assertBlocked(result, `certificate_field_invalid:${field}`);
  }
  for (const field of ["chainVerificationCategory", "rotationPolicy", "mismatchPolicy", "expiryPolicy"]) {
    const result = evaluateMutation("certificate", (value) => { value[field] = "accept"; });
    assertBlocked(result, `certificate_field_invalid:${field}`);
  }
  const observed = evaluateMutation("certificate", (value) => { value.observationExecuted = true; });
  assertBlocked(observed, "certificate_field_invalid:observationExecuted");
});

test("credential categories remain distinct future-only least-privilege abstractions", () => {
  for (const [field, value] of [
    ["runtimeCredentialCategory", "future_dedicated_test_migration_credential"],
    ["categoriesDistinct", false], ["futureSecretInjectionBoundaryOnly", false],
    ["runtimeSchemaOwner", true], ["runtimeSuperuser", true],
    ["migrationCredentialUsedForAdapterScenarios", true],
    ["rotationRequired", false], ["revocationRequired", false],
    ["expiryRequired", false], ["credentialValuesPresent", true],
  ]) {
    const result = evaluateMutation("credential", (policy) => { policy[field] = value; });
    assertBlocked(result, `credential_field_invalid:${field}`);
  }
  const fallback = evaluateMutation("credential", (value) => {
    value.forbiddenInjectionSources = ["cli"];
  });
  assertBlocked(fallback, "credential_field_invalid:forbiddenInjectionSources");
  const privilege = evaluateMutation("credential", (value) => {
    value.runtimeDeniedPrivileges = ["DROP"];
  });
  assertBlocked(privilege, "credential_field_invalid:runtimeDeniedPrivileges");
});

test("one-time authorization policy is exact single-use and never issued", () => {
  for (const [field, value] of [
    ["maximumExecutionCount", 2], ["productionScopeAllowed", true],
    ["productionCutoverScopeAllowed", true], ["reuseAllowed", true],
    ["extensionAllowed", true], ["transferAllowed", true],
    ["deleteToRetryAllowed", true], ["automaticReissueAllowed", true],
    ["authorizationIssued", true], ["authorizationConsumed", true],
    ["ambiguousIssuePolicy", "retry"], ["ambiguousConsumePolicy", "retry"],
  ]) {
    const result = evaluateMutation("authorization", (policy) => { policy[field] = value; });
    assertBlocked(result, `authorization_field_invalid:${field}`);
  }
  for (const field of [
    "environmentClassificationHash", "networkPolicyHash", "databasePolicyHash",
    "certificatePolicyHash", "credentialPolicyHash",
  ]) {
    const result = evaluateMutation("authorization", (value) => {
      value[field] = "e".repeat(64);
    });
    assertBlocked(result, `authorization_field_invalid:${field}`);
  }
});

test("preparation summary binds every policy and fixes every authority false", () => {
  const packet = buildValidPreparationPacket();
  const summary = buildPreparationSummary(packet.upstream, packet.contracts);
  assert.deepEqual(
    validatePreparationSummary(summary, packet.upstream, packet.contracts), [],
  );
  for (const field of FIXED_FALSE_FIELDS) {
    const tampered = structuredClone(summary);
    tampered[field] = true;
    assert.ok(validatePreparationSummary(
      tampered, packet.upstream, packet.contracts,
    ).includes(`summary_fixed_false_invalid:${field}`));
  }
  const hash = structuredClone(summary);
  hash.networkPolicyHash = "f".repeat(64);
  assert.ok(validatePreparationSummary(
    hash, packet.upstream, packet.contracts,
  ).includes("summary_field_invalid:networkPolicyHash"));
});

test("all contract field sets and versions are exact", () => {
  const packet = buildValidPreparationPacket();
  for (const name of Object.keys(packet.contracts)) {
    assert.equal(packet.contracts[name].contractVersion, VERSIONS[name]);
    assert.deepEqual(
      Object.keys(packet.contracts[name]).sort(), [...FIELD_SETS[name]].sort(),
    );
    assert.deepEqual(validateContract(
      packet.contracts[name], name, packet.upstream, packet.contracts,
    ), []);
  }
});

test("valid sanitized synthetic observations and authorization envelope validate", () => {
  const fixture = buildSanitizedSyntheticFutureFixture();
  assert.deepEqual(validateNetworkObservation(
    fixture.observations.network, fixture.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
  assert.deepEqual(validateDatabaseObservation(
    fixture.observations.database, fixture.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
  assert.deepEqual(validateCertificateObservation(
    fixture.observations.certificate, fixture.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
  assert.deepEqual(validateNamespaceObservation(
    fixture.observations.namespace, fixture.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
  assert.deepEqual(validateAuthorizationEnvelope(
    fixture.authorizationEnvelope, fixture.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
});

test("observation exact keys, IDs, and hashes fail closed", () => {
  const missing = buildSanitizedSyntheticFutureFixture();
  delete missing.observations.network.observedDestinationCount;
  assert.ok(validateNetworkObservation(
    missing.observations.network, missing.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("networkObservation_fields_invalid"));

  const extra = buildSanitizedSyntheticFutureFixture();
  extra.observations.network.rawEndpoint = "forbidden";
  assert.ok(validateNetworkObservation(
    extra.observations.network, extra.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("networkObservation_fields_invalid"));

  const id = buildSanitizedSyntheticFutureFixture();
  id.observations.network.observationId =
    `metrics-cutover-test-database-networkObservation-${"b".repeat(64)}`;
  assert.ok(validateNetworkObservation(
    id.observations.network, id.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("networkObservation_id_mismatch"));

  const hash = buildSanitizedSyntheticFutureFixture();
  hash.observations.network.observationHash = "b".repeat(64);
  assert.ok(validateNetworkObservation(
    hash.observations.network, hash.observationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("networkObservation_hash_mismatch"));
});

test("observation package gate and policy binding drift blocks", () => {
  for (const [field, issue] of [
    ["packageSummaryHash", "networkObservation_package_binding_mismatch"],
    ["testDatabaseGateHash", "networkObservation_gate_binding_mismatch"],
    ["policyHash", "networkObservation_policy_binding_mismatch"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.observations.network[field] = "c".repeat(64);
    fixture.observations.network = resealSynthetic(
      fixture.observations.network, "networkObservation",
    );
    assert.ok(validateNetworkObservation(
      fixture.observations.network, fixture.observationContext,
      SYNTHETIC_EVALUATION_CLOCK,
    ).includes(issue));
  }
});

test("observations reject stale expired future-dated and inverted timestamps", () => {
  for (const [field, value, clock, issue] of [
    ["observedAt", "2026-07-17T23:40:00.000Z", SYNTHETIC_EVALUATION_CLOCK, "networkObservation_stale"],
    ["expiresAt", "2026-07-18T00:04:59.000Z", SYNTHETIC_EVALUATION_CLOCK, "networkObservation_expired"],
    ["observedAt", "2026-07-18T00:06:00.000Z", SYNTHETIC_EVALUATION_CLOCK, "networkObservation_future_dated"],
    ["observedAt", "2026-07-18T00:10:00.000Z", SYNTHETIC_EVALUATION_CLOCK, "networkObservation_timestamp_inversion"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.observations.network[field] = value;
    fixture.observations.network = resealSynthetic(
      fixture.observations.network, "networkObservation",
    );
    const issues = validateNetworkObservation(
      fixture.observations.network, fixture.observationContext, clock,
    );
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
    assert.ok(issues.includes("networkObservation_manual_review_required"));
  }
});

test("network destination count and safety drift require manual review", () => {
  for (const [field, value, issue] of [
    ["observedDestinationCount", 2, "network_observation_destination_count_invalid"],
    ["wildcardObserved", true, "network_observation_unsafe_result:wildcardObserved"],
    ["redirectObserved", true, "network_observation_unsafe_result:redirectObserved"],
    ["dnsRebindingObserved", true, "network_observation_unsafe_result:dnsRebindingObserved"],
    ["privateNetworkObserved", true, "network_observation_unsafe_result:privateNetworkObserved"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.observations.network[field] = value;
    fixture.observations.network = resealSynthetic(
      fixture.observations.network, "networkObservation",
    );
    const issues = validateNetworkObservation(
      fixture.observations.network, fixture.observationContext,
      SYNTHETIC_EVALUATION_CLOCK,
    );
    assert.ok(issues.includes(issue));
    assert.ok(issues.includes("networkObservation_manual_review_required"));
  }
});

test("database purpose namespace and application-object drift blocks", () => {
  for (const [field, value, issue] of [
    ["purposeClassification", "production", "database_observation_purpose_invalid"],
    ["namespaceIsolationValidated", false, "database_observation_namespace_isolation_invalid"],
    ["applicationObjectObserved", true, "database_observation_unexpected_object:applicationObjectObserved"],
    ["unrelatedObjectObserved", true, "database_observation_unexpected_object:unrelatedObjectObserved"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.observations.database[field] = value;
    fixture.observations.database = resealSynthetic(
      fixture.observations.database, "databaseObservation",
    );
    assert.ok(validateDatabaseObservation(
      fixture.observations.database, fixture.observationContext,
      SYNTHETIC_EVALUATION_CLOCK,
    ).includes(issue));
  }
});

test("certificate fingerprint TLS chain hostname and rotation drift blocks", () => {
  for (const [field, value, issue] of [
    ["certificateFingerprintHash", "bad", "certificate_observation_fingerprint_invalid"],
    ["tlsValidated", false, "certificate_observation_validation_invalid:tlsValidated"],
    ["certificateChainValidated", false, "certificate_observation_validation_invalid:certificateChainValidated"],
    ["hostnameVerificationValidated", false, "certificate_observation_validation_invalid:hostnameVerificationValidated"],
    ["rotationAmbiguous", true, "certificate_observation_unsafe_result:rotationAmbiguous"],
    ["expired", true, "certificate_observation_unsafe_result:expired"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.observations.certificate[field] = value;
    fixture.observations.certificate = resealSynthetic(
      fixture.observations.certificate, "certificateObservation",
    );
    assert.ok(validateCertificateObservation(
      fixture.observations.certificate, fixture.observationContext,
      SYNTHETIC_EVALUATION_CLOCK,
    ).includes(issue));
  }
});

test("namespace observation requires empty isolated disposable state", () => {
  for (const [field, value, issue] of [
    ["namespaceCategory", "existing_namespace", "namespace_observation_category_invalid"],
    ["namespaceEmpty", false, "namespace_observation_validation_invalid:namespaceEmpty"],
    ["namespaceIsolated", false, "namespace_observation_validation_invalid:namespaceIsolated"],
    ["applicationObjectObserved", true, "namespace_observation_unexpected_object:applicationObjectObserved"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.observations.namespace[field] = value;
    fixture.observations.namespace = resealSynthetic(
      fixture.observations.namespace, "namespaceObservation",
    );
    assert.ok(validateNamespaceObservation(
      fixture.observations.namespace, fixture.observationContext,
      SYNTHETIC_EVALUATION_CLOCK,
    ).includes(issue));
  }
});

test("authorization envelope requires every observation binding", () => {
  const missing = buildSanitizedSyntheticFutureFixture();
  delete missing.authorizationEnvelope.networkObservationHash;
  assert.ok(validateAuthorizationEnvelope(
    missing.authorizationEnvelope, missing.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorizationEnvelope_fields_invalid"));

  const drift = buildSanitizedSyntheticFutureFixture();
  drift.authorizationEnvelope.databaseObservationHash = "d".repeat(64);
  drift.authorizationEnvelope = resealSynthetic(
    drift.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    drift.authorizationEnvelope, drift.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_observation_binding_mismatch:database"));
});

test("all observations and the envelope share one sanitized environment binding", () => {
  const fixture = buildSanitizedSyntheticFutureFixture();
  for (const name of ["network", "database", "certificate", "namespace"]) {
    assert.equal(
      fixture.observations[name].environmentBindingHash,
      SYNTHETIC_ENVIRONMENT_BINDING_HASH,
    );
  }
  assert.equal(
    fixture.authorizationEnvelope.environmentBindingHash,
    SYNTHETIC_ENVIRONMENT_BINDING_HASH,
  );
  assert.equal(
    fixture.observations.database.disposableNamespaceEvidenceHash,
    fixture.observations.namespace.disposableNamespaceEvidenceHash,
  );
  assert.equal(
    fixture.authorizationEnvelope.observationSetHash,
    buildObservationSetHash(
      SYNTHETIC_ENVIRONMENT_BINDING_HASH, fixture.observations,
    ),
  );
  assert.deepEqual(validateAuthorizationEnvelope(
    fixture.authorizationEnvelope, fixture.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
  assertAuthorityFalse(evaluateTestDatabaseExecutionGatePreparation(
    fixture.packet,
  ));
});

test("environment binding drift and cross-environment observation swaps block", () => {
  for (const name of ["network", "certificate"]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.observations[name].environmentBindingHash = "f".repeat(64);
    resealObservationBinding(fixture, name);
    fixture.authorizationEnvelope = resealSynthetic(
      fixture.authorizationEnvelope, "authorizationEnvelope",
    );
    assert.ok(validateAuthorizationEnvelope(
      fixture.authorizationEnvelope, fixture.authorizationContext,
      SYNTHETIC_EVALUATION_CLOCK,
    ).includes("authorization_envelope_environment_binding_mismatch"));
  }

  const fixture = buildSanitizedSyntheticFutureFixture();
  const otherEnvironment = buildSanitizedSyntheticFutureFixture("f".repeat(64));
  fixture.observations.certificate = structuredClone(
    otherEnvironment.observations.certificate,
  );
  resealObservationBinding(fixture, "certificate");
  fixture.authorizationEnvelope = resealSynthetic(
    fixture.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    fixture.authorizationEnvelope, fixture.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_environment_binding_mismatch"));
});

test("database and namespace observations bind the same namespace evidence", () => {
  const fixture = buildSanitizedSyntheticFutureFixture();
  fixture.observations.namespace.disposableNamespaceEvidenceHash = "f".repeat(64);
  resealObservationBinding(fixture, "namespace");
  fixture.authorizationEnvelope = resealSynthetic(
    fixture.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    fixture.authorizationEnvelope, fixture.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_namespace_evidence_binding_mismatch"));
});

test("envelope environment and ordered observation-set hashes fail closed", () => {
  const environmentDrift = buildSanitizedSyntheticFutureFixture();
  environmentDrift.authorizationEnvelope.environmentBindingHash = "f".repeat(64);
  environmentDrift.authorizationEnvelope.observationSetHash = buildObservationSetHash(
    environmentDrift.authorizationEnvelope.environmentBindingHash,
    environmentDrift.observations,
  );
  environmentDrift.authorizationEnvelope = resealSynthetic(
    environmentDrift.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    environmentDrift.authorizationEnvelope,
    environmentDrift.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_environment_binding_mismatch"));

  const orderTamper = buildSanitizedSyntheticFutureFixture();
  orderTamper.authorizationEnvelope.observationSetHash = hashWithDomain(
    OBSERVATION_SET_HASH_DOMAIN,
    {
      environmentBindingHash:
        orderTamper.authorizationEnvelope.environmentBindingHash,
      observations: ["namespace", "certificate", "database", "network"].map(
        (name) => ({
          observationName: name,
          observationId: orderTamper.observations[name].observationId,
          observationHash: orderTamper.observations[name].observationHash,
        }),
      ),
    },
  );
  orderTamper.authorizationEnvelope = resealSynthetic(
    orderTamper.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    orderTamper.authorizationEnvelope, orderTamper.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_observation_set_hash_mismatch"));
});

test("authorization context directly revalidates every policy after a full reseal", () => {
  for (const [field, value] of [
    ["runtimeDeniedPrivileges", ["ALTER", "DELETE", "DROP", "TRUNCATE"]],
    ["runtimeSchemaOwner", true],
    ["runtimeSuperuser", true],
    ["migrationCredentialUsedForAdapterScenarios", true],
    ["categoriesDistinct", false],
    ["credentialValuesPresent", true],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.packet.contracts.credential[field] = value;
    resealCredentialAuthorizationChain(fixture);
    const issues = validateAuthorizationEnvelope(
      fixture.authorizationEnvelope, fixture.authorizationContext,
      SYNTHETIC_EVALUATION_CLOCK,
    );
    assert.ok(issues.includes(`credential_field_invalid:${field}`), `${field}: ${issues}`);
    assert.ok(issues.includes("authorization_envelope_manual_review_required"));
  }
});

test("authorization context requires the exact six policy keys", () => {
  const missing = buildSanitizedSyntheticFutureFixture();
  delete missing.authorizationContext.contracts.credential;
  assert.ok(validateAuthorizationEnvelopeContext(
    missing.authorizationContext,
  ).includes("authorization_envelope_contracts_fields_invalid"));

  const extra = buildSanitizedSyntheticFutureFixture();
  extra.authorizationContext.contracts.unexpected = {};
  assert.ok(validateAuthorizationEnvelopeContext(
    extra.authorizationContext,
  ).includes("authorization_envelope_contracts_fields_invalid"));
});

test("authorization issuance and expiry are bounded by every observation", () => {
  const oneLater = buildSanitizedSyntheticFutureFixture();
  oneLater.observations.network.observedAt = "2026-07-18T00:04:30.000Z";
  resealObservationBinding(oneLater, "network");
  oneLater.authorizationEnvelope = resealSynthetic(
    oneLater.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    oneLater.authorizationEnvelope, oneLater.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_issued_before_observation"));

  const allLater = buildSanitizedSyntheticFutureFixture();
  for (const name of ["network", "database", "certificate", "namespace"]) {
    allLater.observations[name].observedAt = "2026-07-18T00:04:30.000Z";
    resealObservationBinding(allLater, name);
  }
  allLater.authorizationEnvelope = resealSynthetic(
    allLater.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    allLater.authorizationEnvelope, allLater.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_issued_before_observation"));

  const outlives = buildSanitizedSyntheticFutureFixture();
  outlives.observations.database.expiresAt = "2026-07-18T00:08:00.000Z";
  resealObservationBinding(outlives, "database");
  outlives.authorizationEnvelope = resealSynthetic(
    outlives.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    outlives.authorizationEnvelope, outlives.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_outlives_observation"));
});

test("observation validation precedes normal authorization issuance", () => {
  const ordered = buildSanitizedSyntheticFutureFixture();
  assert.deepEqual(validateAuthorizationEnvelope(
    ordered.authorizationEnvelope, ordered.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);

  const sameObservedAt = buildSanitizedSyntheticFutureFixture();
  for (const name of ["network", "database", "certificate", "namespace"]) {
    sameObservedAt.observations[name].observedAt = "2026-07-18T00:04:00.000Z";
    resealObservationBinding(sameObservedAt, name);
  }
  sameObservedAt.authorizationEnvelope.issuedAt = "2026-07-18T00:04:00.000Z";
  sameObservedAt.authorizationEnvelope = resealSynthetic(
    sameObservedAt.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.deepEqual(validateAuthorizationEnvelope(
    sameObservedAt.authorizationEnvelope, sameObservedAt.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
});

test("prior nonce hashes require an array of unique canonically sorted hashes", () => {
  for (const [value, issue] of [
    ["not-an-array", "authorization_envelope_prior_nonce_hashes_invalid"],
    [["not-a-hash"], "authorization_envelope_prior_nonce_hash_invalid:0"],
    [["0".repeat(64), "0".repeat(64)], "authorization_envelope_prior_nonce_hashes_duplicate"],
    [["b".repeat(64), "0".repeat(64)], "authorization_envelope_prior_nonce_hashes_unsorted"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.authorizationContext.priorNonceHashes = value;
    assert.ok(validateAuthorizationEnvelopeContext(
      fixture.authorizationContext,
    ).includes(issue), `${issue}`);
  }

  const valid = buildSanitizedSyntheticFutureFixture();
  valid.authorizationContext.priorNonceHashes = [
    "0".repeat(64), "b".repeat(64),
  ];
  assert.deepEqual(validateAuthorizationEnvelope(
    valid.authorizationEnvelope, valid.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ), []);
});

test("authorization envelope rejects expiry inversion future issue and excess lifetime", () => {
  for (const [field, value, clock, issue] of [
    ["expiresAt", "2026-07-18T00:04:59.000Z", SYNTHETIC_EVALUATION_CLOCK, "authorization_envelope_expired"],
    ["issuedAt", "2026-07-18T00:10:00.000Z", SYNTHETIC_EVALUATION_CLOCK, "authorization_envelope_timestamp_inversion"],
    ["issuedAt", "2026-07-18T00:06:00.000Z", SYNTHETIC_EVALUATION_CLOCK, "authorization_envelope_future_dated"],
    ["expiresAt", "2026-07-18T00:20:00.000Z", SYNTHETIC_EVALUATION_CLOCK, "authorization_envelope_lifetime_excessive"],
  ]) {
    const fixture = buildSanitizedSyntheticFutureFixture();
    fixture.authorizationEnvelope[field] = value;
    fixture.authorizationEnvelope = resealSynthetic(
      fixture.authorizationEnvelope, "authorizationEnvelope",
    );
    const issues = validateAuthorizationEnvelope(
      fixture.authorizationEnvelope, fixture.authorizationContext, clock,
    );
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
    assert.ok(issues.includes("authorization_envelope_manual_review_required"));
  }
});

test("authorization nonce replay count and operation ordering fail closed", () => {
  const replay = buildSanitizedSyntheticFutureFixture();
  replay.authorizationContext.priorNonceHashes.push(
    replay.authorizationEnvelope.nonceHash,
  );
  assert.ok(validateAuthorizationEnvelope(
    replay.authorizationEnvelope, replay.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_nonce_replay_manual_review"));

  const count = buildSanitizedSyntheticFutureFixture();
  count.authorizationEnvelope.maximumExecutionCount = 2;
  count.authorizationEnvelope = resealSynthetic(
    count.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    count.authorizationEnvelope, count.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_execution_count_invalid"));

  const order = buildSanitizedSyntheticFutureFixture();
  order.authorizationEnvelope.allowedOperationSet.reverse();
  order.authorizationEnvelope = resealSynthetic(
    order.authorizationEnvelope, "authorizationEnvelope",
  );
  assert.ok(validateAuthorizationEnvelope(
    order.authorizationEnvelope, order.authorizationContext,
    SYNTHETIC_EVALUATION_CLOCK,
  ).includes("authorization_envelope_operation_order_invalid"));
  assert.deepEqual(order.packet.contracts.authorization.allowedOperationSet, [
    "connect_once_to_disposable_test_database",
    "apply_exact_bound_migration_package",
    "execute_exact_15_scenario_conformance_run",
    "collect_sanitized_hash_chained_evidence",
  ]);
});

test("core and CLI contain no environment filesystem network TLS DB or provider boundary", () => {
  const corePath = path.join(
    __dirname, "lib", "metrics-cutover-test-database-execution-gate-preparation.cjs",
  );
  const cliPath = path.join(
    __dirname, "check-metrics-cutover-test-database-execution-gate-preparation.cjs",
  );
  const source = `${fs.readFileSync(corePath, "utf8")}\n${fs.readFileSync(cliPath, "utf8")}`;
  for (const forbidden of [
    "node:fs", "node:child_process", "node:net", "node:dns", "node:tls",
    "node:http", "node:https", "require(\"pg\")", "require('pg')",
    "postgresql://", "process.env", "process.stdin", "Date.now(",
    "new Date()", "execSync", "spawn",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
  const exported = require(corePath);
  for (const name of [
    "connect", "query", "migrate", "executeSql", "observeNetwork",
    "issueAuthorization", "consumeAuthorization", "createClaim", "createLock",
  ]) assert.equal(typeof exported[name], "undefined", name);
});

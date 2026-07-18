"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const plan = require("./lib/metrics-cutover-disposable-test-database-execution-plan.cjs");
const gate = require("./lib/metrics-cutover-test-database-execution-gate-preparation.cjs");
const { FUTURE_SCENARIOS } = require("./lib/metrics-cutover-postgresql-test-package.cjs");
const { evaluateCliRequest } = require("./check-metrics-cutover-disposable-test-database-execution-plan.cjs");

const OBSERVED_AT = "2026-07-18T00:00:00.000Z";
const AUTH_ISSUED_AT = "2026-07-18T00:04:00.000Z";
const MANIFEST_ISSUED_AT = "2026-07-18T00:05:00.000Z";
const EVALUATION_CLOCK = "2026-07-18T00:06:00.000Z";
const MANIFEST_EXPIRES_AT = "2026-07-18T00:08:00.000Z";
const AUTH_EXPIRES_AT = "2026-07-18T00:09:00.000Z";
const OBSERVATION_EXPIRES_AT = "2026-07-18T00:10:00.000Z";
const ENVIRONMENT_BINDING_HASH = "e".repeat(64);
const NAMESPACE_EVIDENCE_HASH = "4".repeat(64);

function assertAuthorityFalse(result) {
  for (const field of plan.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.executionPreflightSummary, {});
  assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

function observationBase(packet, policyName, environmentBindingHash) {
  const bindings = packet.contracts[policyName].upstreamBindings;
  return {
    packageSummaryId: bindings.packageSummaryId,
    packageSummaryHash: bindings.packageSummaryHash,
    testDatabaseGateId: bindings.testDatabaseGateId,
    testDatabaseGateHash: bindings.testDatabaseGateHash,
    environmentBindingHash,
    policyId: packet.contracts[policyName][gate.SPECS[policyName].idField],
    policyHash: packet.contracts[policyName][gate.SPECS[policyName].hashField],
    observerAttestationHash: "1".repeat(64),
    observedAt: OBSERVED_AT,
    expiresAt: OBSERVATION_EXPIRES_AT,
  };
}

function buildFutureAuthorizationFixture(stepFPacket) {
  const observations = {
    network: gate.sealContract({
      contractVersion: gate.VERSIONS.networkObservation,
      ...observationBase(stepFPacket, "network", ENVIRONMENT_BINDING_HASH),
      destinationAllowlistHash: "2".repeat(64), observedDestinationCount: 1,
      wildcardObserved: false, redirectObserved: false, dnsRebindingObserved: false,
      loopbackObserved: false, privateNetworkObserved: false,
      metadataServiceObserved: false, productionDestinationObserved: false,
      stagingDestinationObserved: false, unrelatedDestinationObserved: false,
      manualReviewRequired: false, rawMaterialPresent: false,
    }, "networkObservation"),
    database: gate.sealContract({
      contractVersion: gate.VERSIONS.databaseObservation,
      ...observationBase(stepFPacket, "database", ENVIRONMENT_BINDING_HASH),
      databaseFingerprintHash: "3".repeat(64),
      disposableNamespaceEvidenceHash: NAMESPACE_EVIDENCE_HASH,
      purposeClassification: "disposable_isolated_conformance_only",
      serverCapabilityCategory: "supported_postgresql_capability_category",
      utcBehaviorAttestationHash: "5".repeat(64),
      transactionIsolationAttestationHash: "6".repeat(64),
      schemaPackageState: "expected_package_absent_before_migration",
      applicationObjectObserved: false, unrelatedObjectObserved: false,
      namespaceIsolationValidated: true, manualReviewRequired: false,
      rawMaterialPresent: false,
    }, "databaseObservation"),
    certificate: gate.sealContract({
      contractVersion: gate.VERSIONS.certificateObservation,
      ...observationBase(stepFPacket, "certificate", ENVIRONMENT_BINDING_HASH),
      certificateFingerprintHash: "7".repeat(64), tlsValidated: true,
      certificateChainValidated: true, hostnameVerificationValidated: true,
      rotationAmbiguous: false, expired: false, manualReviewRequired: false,
      rawMaterialPresent: false,
    }, "certificateObservation"),
    namespace: gate.sealContract({
      contractVersion: gate.VERSIONS.namespaceObservation,
      ...observationBase(stepFPacket, "environment", ENVIRONMENT_BINDING_HASH),
      disposableNamespaceEvidenceHash: NAMESPACE_EVIDENCE_HASH,
      namespaceCategory: "new_empty_disposable_namespace",
      namespaceEmpty: true, namespaceIsolated: true,
      applicationObjectObserved: false, unrelatedObjectObserved: false,
      manualReviewRequired: false, rawMaterialPresent: false,
    }, "namespaceObservation"),
  };
  const bindings = stepFPacket.contracts.authorization.upstreamBindings;
  const authorizationEnvelope = gate.sealContract({
    contractVersion: gate.VERSIONS.authorizationEnvelope,
    packageSummaryId: bindings.packageSummaryId,
    packageSummaryHash: bindings.packageSummaryHash,
    testDatabaseGateId: bindings.testDatabaseGateId,
    testDatabaseGateHash: bindings.testDatabaseGateHash,
    authorizationPolicyId: stepFPacket.contracts.authorization.authorizationPolicyId,
    authorizationPolicyHash: stepFPacket.contracts.authorization.authorizationPolicyHash,
    environmentClassificationId: stepFPacket.contracts.environment.environmentClassificationId,
    environmentClassificationHash: stepFPacket.contracts.environment.environmentClassificationHash,
    environmentBindingHash: ENVIRONMENT_BINDING_HASH,
    observationSetHash: gate.buildObservationSetHash(ENVIRONMENT_BINDING_HASH, observations),
    networkObservationId: observations.network.observationId,
    networkObservationHash: observations.network.observationHash,
    databaseObservationId: observations.database.observationId,
    databaseObservationHash: observations.database.observationHash,
    certificateObservationId: observations.certificate.observationId,
    certificateObservationHash: observations.certificate.observationHash,
    namespaceObservationId: observations.namespace.observationId,
    namespaceObservationHash: observations.namespace.observationHash,
    credentialPolicyId: stepFPacket.contracts.credential.credentialPolicyId,
    credentialPolicyHash: stepFPacket.contracts.credential.credentialPolicyHash,
    futureEvidenceSpecId: bindings.futureEvidenceSpecId,
    futureEvidenceSpecHash: bindings.futureEvidenceSpecHash,
    exactScenarioCount: FUTURE_SCENARIOS.length,
    scenarioOrder: [...FUTURE_SCENARIOS],
    sanitizedApproverIdentityHash: "9".repeat(64),
    issuedAt: AUTH_ISSUED_AT, expiresAt: AUTH_EXPIRES_AT,
    nonceHash: "a".repeat(64), maximumExecutionCount: 1,
    allowedOperationSet: [...stepFPacket.contracts.authorization.allowedOperationSet],
    manualReviewRequired: false, rawMaterialPresent: false,
  }, "authorizationEnvelope");
  return { observations, authorizationEnvelope };
}

function buildManifestFixture() {
  const packet = plan.buildValidPreparationPacket();
  const stepFPacket = packet.upstream.preparationPacket;
  const { observations, authorizationEnvelope } = buildFutureAuthorizationFixture(stepFPacket);
  const bindings = plan.buildUpstreamBindings(packet.upstream);
  const manifest = plan.sealContract({
    contractVersion: plan.VERSIONS.manifest,
    preparationSummaryId: bindings.preparationSummaryId,
    preparationSummaryHash: bindings.preparationSummaryHash,
    targetSelectionPolicyId: packet.contracts.targetSelection.targetSelectionPolicyId,
    targetSelectionPolicyHash: packet.contracts.targetSelection.targetSelectionPolicyHash,
    sequencePolicyId: packet.contracts.sequence.sequencePolicyId,
    sequencePolicyHash: packet.contracts.sequence.sequencePolicyHash,
    rollbackPolicyId: packet.contracts.rollback.rollbackPolicyId,
    rollbackPolicyHash: packet.contracts.rollback.rollbackPolicyHash,
    evidenceCollectionPlanId: packet.contracts.evidence.evidenceCollectionPlanId,
    evidenceCollectionPlanHash: packet.contracts.evidence.evidenceCollectionPlanHash,
    environmentClassificationId: bindings.environmentClassificationId,
    environmentClassificationHash: bindings.environmentClassificationHash,
    environmentBindingHash: ENVIRONMENT_BINDING_HASH,
    observationSetHash: authorizationEnvelope.observationSetHash,
    networkObservationId: observations.network.observationId,
    networkObservationHash: observations.network.observationHash,
    databaseObservationId: observations.database.observationId,
    databaseObservationHash: observations.database.observationHash,
    certificateObservationId: observations.certificate.observationId,
    certificateObservationHash: observations.certificate.observationHash,
    namespaceObservationId: observations.namespace.observationId,
    namespaceObservationHash: observations.namespace.observationHash,
    namespaceEvidenceHash: NAMESPACE_EVIDENCE_HASH,
    credentialPolicyId: bindings.credentialPolicyId,
    credentialPolicyHash: bindings.credentialPolicyHash,
    authorizationPolicyId: bindings.authorizationPolicyId,
    authorizationPolicyHash: bindings.authorizationPolicyHash,
    authorizationEnvelopeId: authorizationEnvelope.authorizationEnvelopeId,
    authorizationEnvelopeHash: authorizationEnvelope.authorizationEnvelopeHash,
    packageSummaryId: bindings.packageSummaryId,
    packageSummaryHash: bindings.packageSummaryHash,
    testDatabaseGateId: bindings.testDatabaseGateId,
    testDatabaseGateHash: bindings.testDatabaseGateHash,
    futureEvidenceSpecId: bindings.futureEvidenceSpecId,
    futureEvidenceSpecHash: bindings.futureEvidenceSpecHash,
    exactScenarioCount: FUTURE_SCENARIOS.length,
    scenarioOrder: [...FUTURE_SCENARIOS],
    allowedOperationOrder: [...stepFPacket.contracts.authorization.allowedOperationSet],
    maximumExecutionCount: 1,
    testPurpose: "exact_15_scenario_disposable_conformance_run",
    issuedAt: MANIFEST_ISSUED_AT, expiresAt: MANIFEST_EXPIRES_AT,
    manifestNonceHash: "b".repeat(64), sanitizedPlanApproverHash: "c".repeat(64),
    manualReviewRequired: false, rawMaterialPresent: false,
  }, "manifest");
  const context = {
    upstream: packet.upstream, contracts: packet.contracts, observations,
    authorizationEnvelope, priorAuthorizationNonceHashes: [],
    priorManifestNonceHashes: [],
  };
  return { packet, manifest, context };
}

function resealManifest(fixture, mutate) {
  const value = { ...fixture.manifest };
  delete value.executionManifestId;
  delete value.executionManifestHash;
  mutate(value, fixture.context, fixture);
  fixture.manifest = plan.sealContract(value, "manifest");
  return plan.validateExecutionManifest(fixture.manifest, fixture.context, EVALUATION_CLOCK);
}

function resealPlanContract(packet, name) {
  const value = packet.contracts[name];
  delete value[plan.SPECS[name].idField];
  delete value[plan.SPECS[name].hashField];
  packet.contracts[name] = plan.sealContract(value, name);
}

test("focused preparation produces a plan-only fixed-false result", () => {
  const packet = plan.buildValidPreparationPacket();
  const result = plan.evaluateDisposableTestDatabaseExecutionPlan(packet);
  assert.equal(result.ok, true);
  assert.equal(result.status, "disposable_test_database_execution_plan_prepared");
  assert.equal(result.planPrepared, true);
  assert.equal(result.executionPreflightSummary.planPrepared, true);
  assert.equal(result.executionPreflightSummary.targetSelected, false);
  assert.equal(result.executionPreflightSummary.manifestGenerated, false);
  assert.deepEqual(result.blockingIssues, []);
  assertAuthorityFalse(result);
});

test("idle and malformed packets remain fail-closed", () => {
  const idle = plan.evaluateDisposableTestDatabaseExecutionPlan();
  assert.equal(idle.status, "idle");
  assertAuthorityFalse(idle);
  assertBlocked(
    plan.evaluateDisposableTestDatabaseExecutionPlan({ upstream: {}, contracts: {}, extra: true }),
    "execution_plan_packet_fields_invalid",
  );
});

test("all required policy and summary contracts are exact and sealed", () => {
  const packet = plan.buildValidPreparationPacket();
  for (const name of ["targetSelection", "sequence", "rollback", "evidence"]) {
    assert.deepEqual(plan.validateContract(packet.contracts[name], name, packet.upstream), []);
    assert.deepEqual(Object.keys(packet.contracts[name]).sort(), [...plan.FIELD_SETS[name]].sort());
  }
  const summary = plan.buildExecutionPreflightSummary(packet.upstream, packet.contracts);
  assert.deepEqual(plan.validateExecutionPreflightSummary(summary, packet.upstream, packet.contracts), []);
  assert.deepEqual(Object.keys(summary).sort(), [...plan.FIELD_SETS.summary].sort());
});

test("upstream Step F summary and every policy are directly revalidated", () => {
  const packet = plan.buildValidPreparationPacket();
  packet.upstream.preparationPacket.contracts.credential.runtimeSuperuser = true;
  const credential = packet.upstream.preparationPacket.contracts.credential;
  delete credential.credentialPolicyId;
  delete credential.credentialPolicyHash;
  packet.upstream.preparationPacket.contracts.credential = gate.sealContract(credential, "credential");
  assertBlocked(
    plan.evaluateDisposableTestDatabaseExecutionPlan(packet),
    "credential_field_invalid:runtimeSuperuser",
  );
});

test("target policy rejects production, shared, application and substitution weakening", () => {
  for (const [field, value] of [
    ["productionAllowed", true], ["stagingAllowed", true],
    ["sharedDevelopmentAllowed", true], ["applicationStorageAllowed", true],
    ["targetSubstitutionAfterAuthorizationAllowed", true],
  ]) {
    const packet = plan.buildValidPreparationPacket();
    packet.contracts.targetSelection[field] = value;
    resealPlanContract(packet, "targetSelection");
    assertBlocked(
      plan.evaluateDisposableTestDatabaseExecutionPlan(packet),
      `targetSelection_field_invalid:${field}`,
    );
  }
});

test("target policy requires exactly one unselected disposable target", () => {
  for (const [field, value] of [
    ["exactDestinationCount", 2], ["targetSelected", true],
    ["targetPurpose", "shared_development"],
  ]) {
    const packet = plan.buildValidPreparationPacket();
    packet.contracts.targetSelection[field] = value;
    resealPlanContract(packet, "targetSelection");
    assertBlocked(plan.evaluateDisposableTestDatabaseExecutionPlan(packet),
      `targetSelection_field_invalid:${field}`);
  }
});

test("sequence is exact, serial, single-use, and never retry-by-delete", () => {
  for (const mutate of [
    (v) => v.operationSequence.splice(4, 1),
    (v) => v.operationSequence.reverse(),
    (v) => v.operationSequence.splice(3, 0, v.operationSequence[3]),
    (v) => { v.parallelExecutionAllowed = true; },
    (v) => { v.automaticRetryAllowed = true; },
    (v) => { v.deleteToRetryAllowed = true; },
    (v) => { v.secondConnectionAllowed = true; },
  ]) {
    const packet = plan.buildValidPreparationPacket();
    mutate(packet.contracts.sequence);
    resealPlanContract(packet, "sequence");
    const result = plan.evaluateDisposableTestDatabaseExecutionPlan(packet);
    assert.equal(result.status, "blocked", result.blockingIssues.join(","));
    assertAuthorityFalse(result);
  }
});

test("rollback is unavailable and requires environment disposal", () => {
  const packet = plan.buildValidPreparationPacket();
  const rollback = packet.contracts.rollback;
  assert.equal(rollback.safeReversibleMigrationAvailable, false);
  assert.equal(rollback.rollbackAvailability, "unavailable_environment_disposal_required");
  assert.equal(rollback.rollbackPlanPrepared, false);
  assert.equal(rollback.rollbackExecuted, false);
  assert.equal(rollback.environmentDisposalExecuted, false);
});

test("rollback weakening or fabricated availability is rejected", () => {
  for (const [field, value] of [
    ["safeReversibleMigrationAvailable", true],
    ["rollbackAvailability", "available"],
    ["destructiveGenericCleanupAllowed", true],
    ["applicationObjectsMayBeTouched", true],
    ["unrelatedObjectsMayBeTouched", true],
    ["deleteToRetryAllowed", true], ["resetToRetryAllowed", true],
    ["rollbackPlanPrepared", true], ["rollbackExecuted", true],
  ]) {
    const packet = plan.buildValidPreparationPacket();
    packet.contracts.rollback[field] = value;
    resealPlanContract(packet, "rollback");
    assertBlocked(plan.evaluateDisposableTestDatabaseExecutionPlan(packet),
      `rollback_field_invalid:${field}`);
  }
});

test("evidence plan binds manifest and summary, exact order, chain, and raw-material ban", () => {
  const packet = plan.buildValidPreparationPacket();
  const evidence = packet.contracts.evidence;
  assert.deepEqual(evidence.evidenceStageOrder, plan.EVIDENCE_STAGE_ORDER);
  assert.equal(evidence.scenarioResultCount, 15);
  assert.equal(evidence.hashChainRequired, true);
  assert.equal(evidence.firstPredecessor, "ZERO_HASH");
  assert.equal(evidence.evidenceCollectionStarted, false);
  assert.ok(evidence.rawMaterialForbidden.includes("credential"));
  assert.ok(evidence.rawMaterialForbidden.includes("database_identity"));
});

test("evidence order, hash-chain, or collection-start weakening is rejected", () => {
  for (const [field, value] of [
    ["evidenceStageOrder", [...plan.EVIDENCE_STAGE_ORDER].reverse()],
    ["hashChainRequired", false], ["firstPredecessor", "NONE"],
    ["scenarioResultCount", 14], ["evidenceCollectionStarted", true],
  ]) {
    const packet = plan.buildValidPreparationPacket();
    packet.contracts.evidence[field] = value;
    resealPlanContract(packet, "evidence");
    assertBlocked(plan.evaluateDisposableTestDatabaseExecutionPlan(packet),
      `evidence_field_invalid:${field}`);
  }
});

test("future manifest validator accepts only the complete synthetic bound fixture", () => {
  const { manifest, context } = buildManifestFixture();
  assert.deepEqual(plan.validateExecutionManifest(manifest, context, EVALUATION_CLOCK), []);
  assert.deepEqual(Object.keys(manifest).sort(), [...plan.FIELD_SETS.manifest].sort());
});

test("future manifest exact keys, ID, and hash are enforced", () => {
  for (const mutate of [
    (fixture) => { delete fixture.manifest.packageSummaryHash; },
    (fixture) => { fixture.manifest.extra = false; },
    (fixture) => { fixture.manifest.executionManifestId = "wrong"; },
    (fixture) => { fixture.manifest.executionManifestHash = "f".repeat(64); },
  ]) {
    const fixture = buildManifestFixture();
    mutate(fixture);
    const issues = plan.validateExecutionManifest(fixture.manifest, fixture.context, EVALUATION_CLOCK);
    assert.ok(issues.some((issue) => issue.startsWith("manifest_")), issues.join(","));
  }
});

test("malformed future manifest contexts return blocking issues without throwing", () => {
  const fixture = buildManifestFixture();
  for (const context of [
    {},
    { ...fixture.context, upstream: {} },
    { ...fixture.context, contracts: { ...fixture.context.contracts, extra: {} } },
    { ...fixture.context, observations: { network: fixture.context.observations.network } },
  ]) {
    assert.doesNotThrow(() => {
      const issues = plan.validateExecutionManifest(fixture.manifest, context, EVALUATION_CLOCK);
      assert.ok(issues.length > 0);
    });
  }
});

test("manifest blocks package, gate, policy, and evidence binding drift", () => {
  for (const [field, issue] of [
    ["packageSummaryHash", "execution_manifest_upstream_binding_mismatch:packageSummaryHash"],
    ["testDatabaseGateHash", "execution_manifest_upstream_binding_mismatch:testDatabaseGateHash"],
    ["targetSelectionPolicyHash", "execution_manifest_policy_binding_mismatch:targetSelection"],
    ["evidenceCollectionPlanHash", "execution_manifest_policy_binding_mismatch:evidence"],
  ]) {
    const fixture = buildManifestFixture();
    const issues = resealManifest(fixture, (manifest) => { manifest[field] = "d".repeat(64); });
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("manifest binds all observations to one environment and observation set", () => {
  for (const [mutate, issue] of [
    [(manifest) => { manifest.networkObservationHash = "d".repeat(64); },
      "execution_manifest_observation_binding_mismatch:network"],
    [(manifest) => { manifest.environmentBindingHash = "d".repeat(64); },
      "execution_manifest_environment_binding_mismatch"],
    [(manifest) => { manifest.observationSetHash = "d".repeat(64); },
      "execution_manifest_observation_set_mismatch"],
    [(manifest) => { manifest.namespaceEvidenceHash = "d".repeat(64); },
      "execution_manifest_namespace_evidence_mismatch"],
  ]) {
    const fixture = buildManifestFixture();
    const issues = resealManifest(fixture, mutate);
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("swapping an observation from another synthetic environment is blocked", () => {
  const fixture = buildManifestFixture();
  const foreign = buildFutureAuthorizationFixture(fixture.packet.upstream.preparationPacket);
  const certificate = { ...foreign.observations.certificate };
  delete certificate.observationId;
  delete certificate.observationHash;
  certificate.environmentBindingHash = "d".repeat(64);
  fixture.context.observations.certificate = gate.sealContract(certificate, "certificateObservation");
  const issues = plan.validateExecutionManifest(fixture.manifest, fixture.context, EVALUATION_CLOCK);
  assert.ok(issues.includes("execution_manifest_environment_binding_mismatch"), issues.join(","));
});

test("database and namespace evidence must cross-bind", () => {
  const fixture = buildManifestFixture();
  const namespace = { ...fixture.context.observations.namespace };
  delete namespace.observationId;
  delete namespace.observationHash;
  namespace.disposableNamespaceEvidenceHash = "8".repeat(64);
  fixture.context.observations.namespace = gate.sealContract(namespace, "namespaceObservation");
  const issues = plan.validateExecutionManifest(fixture.manifest, fixture.context, EVALUATION_CLOCK);
  assert.ok(issues.includes("execution_manifest_namespace_evidence_mismatch"), issues.join(","));
});

test("manifest exact 15-scenario order and authorized operation order are required", () => {
  for (const [mutate, issue] of [
    [(v) => { v.exactScenarioCount = 14; }, "execution_manifest_scenario_order_invalid"],
    [(v) => { [v.scenarioOrder[0], v.scenarioOrder[1]] = [v.scenarioOrder[1], v.scenarioOrder[0]]; },
      "execution_manifest_scenario_order_invalid"],
    [(v) => { v.allowedOperationOrder.reverse(); }, "execution_manifest_operation_order_invalid"],
  ]) {
    const fixture = buildManifestFixture();
    const issues = resealManifest(fixture, mutate);
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("manifest scope, nonce, approver, and raw-material boundaries fail closed", () => {
  for (const [mutate, issue] of [
    [(v) => { v.maximumExecutionCount = 2; }, "execution_manifest_scope_invalid"],
    [(v) => { v.manifestNonceHash = "bad"; }, "execution_manifest_nonce_hash_invalid"],
    [(v) => { v.sanitizedPlanApproverHash = "bad"; }, "execution_manifest_approver_hash_invalid"],
    [(v) => { v.rawMaterialPresent = true; }, "execution_manifest_raw_material_boundary_invalid"],
  ]) {
    const fixture = buildManifestFixture();
    const issues = resealManifest(fixture, mutate);
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("manifest replay and malformed prior nonce contexts are blocked", () => {
  const replay = buildManifestFixture();
  replay.context.priorManifestNonceHashes = [replay.manifest.manifestNonceHash];
  let issues = plan.validateExecutionManifest(replay.manifest, replay.context, EVALUATION_CLOCK);
  assert.ok(issues.includes("execution_manifest_nonce_replay_manual_review"), issues.join(","));

  for (const hashes of [["bad"], ["b".repeat(64), "b".repeat(64)], ["f".repeat(64), "a".repeat(64)]]) {
    const fixture = buildManifestFixture();
    fixture.context.priorManifestNonceHashes = hashes;
    issues = plan.validateExecutionManifest(fixture.manifest, fixture.context, EVALUATION_CLOCK);
    assert.ok(issues.some((issue) => issue.startsWith("prior_manifest_nonce_hashes_")), issues.join(","));
  }
});

test("manifest chronology must follow authorization and expire within it", () => {
  for (const [mutate, issue] of [
    [(v) => { v.issuedAt = "2026-07-18T00:03:00.000Z"; }, "execution_manifest_issued_before_authorization"],
    [(v) => { v.expiresAt = "2026-07-18T00:09:30.000Z"; }, "execution_manifest_outlives_authorization"],
    [(v) => { v.expiresAt = v.issuedAt; }, "execution_manifest_timestamp_inversion"],
  ]) {
    const fixture = buildManifestFixture();
    const issues = resealManifest(fixture, mutate);
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("manifest expiry, future dating, and noncanonical instants are rejected", () => {
  for (const [clock, mutate, issue] of [
    ["2026-07-18T00:08:00.000Z", () => {}, "execution_manifest_expired"],
    ["2026-07-18T00:04:00.000Z", () => {}, "execution_manifest_future_dated"],
    [EVALUATION_CLOCK, (v) => { v.issuedAt = "2026-07-18T00:05:00Z"; }, "execution_manifest_issued_at_invalid"],
  ]) {
    const fixture = buildManifestFixture();
    const value = { ...fixture.manifest };
    delete value.executionManifestId;
    delete value.executionManifestHash;
    mutate(value);
    fixture.manifest = plan.sealContract(value, "manifest");
    const issues = plan.validateExecutionManifest(fixture.manifest, fixture.context, clock);
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("manual review flag is false only for a completely valid manifest", () => {
  const valid = buildManifestFixture();
  let issues = resealManifest(valid, (value) => { value.manualReviewRequired = true; });
  assert.ok(issues.includes("execution_manifest_manual_review_unexpected"), issues.join(","));

  const invalid = buildManifestFixture();
  issues = resealManifest(invalid, (value) => {
    value.rawMaterialPresent = true;
    value.manualReviewRequired = false;
  });
  assert.ok(issues.includes("execution_manifest_manual_review_required"), issues.join(","));
});

test("CLI accepts no arguments and emits one sanitized JSON result", () => {
  const cli = path.join(__dirname, "check-metrics-cutover-disposable-test-database-execution-plan.cjs");
  const result = spawnSync(process.execPath, [cli], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout.trim().split(/\r?\n/).length, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, "disposable_test_database_execution_plan_prepared");
  assertAuthorityFalse(parsed);
});

test("CLI arguments and exceptions fail closed", () => {
  assertBlocked(evaluateCliRequest(["--target", "anything"]), "cli_arguments_forbidden");
  assertBlocked(evaluateCliRequest([], { runCheck() { throw new Error("synthetic"); } }),
    "execution_plan_check_failed");
});

test("plan and CLI source contain no execution or ambient-input capability", () => {
  const sources = [
    path.join(__dirname, "lib", "metrics-cutover-disposable-test-database-execution-plan.cjs"),
    path.join(__dirname, "check-metrics-cutover-disposable-test-database-execution-plan.cjs"),
  ].map((file) => fs.readFileSync(file, "utf8"));
  for (const source of sources) {
    assert.doesNotMatch(source, /require\(["'](?:pg|postgres|node:net|node:tls|node:dns|node:http|node:https|node:child_process|node:fs)["']\)/);
    assert.doesNotMatch(source, /process\.env|process\.stdin|readFileSync|writeFileSync|fetch\s*\(|execSync|spawnSync/);
  }
});

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const {
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  SPECS,
  VERSIONS,
  buildPreparationSummary,
  buildValidPreparationPacket,
  evaluateTestDatabaseExecutionGatePreparation,
  sealContract,
  validateContract,
  validatePreparationSummary,
} = require("./lib/metrics-cutover-test-database-execution-gate-preparation.cjs");
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
    "postgresql://", "process.env", "process.stdin", "execSync", "spawn",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
  const exported = require(corePath);
  for (const name of [
    "connect", "query", "migrate", "executeSql", "observeNetwork",
    "issueAuthorization", "consumeAuthorization", "createClaim", "createLock",
  ]) assert.equal(typeof exported[name], "undefined", name);
});

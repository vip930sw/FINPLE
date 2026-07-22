"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  FAILURE_CLASSIFICATIONS, PUBLIC_STATES, buildHistoricalContracts,
  evaluateCurrentMainProvenanceBridge,
} = require("./lib/metrics-cutover-current-main-provenance-bridge.cjs");
const { runCli } = require("./check-metrics-cutover-current-main-provenance-bridge.cjs");
const {
  clone, h, validPacket,
} = require("./test-support/metrics-cutover-current-main-provenance-bridge-fixture.cjs");

test("zero input and zero-argument CLI return exact awaiting state", () => {
  assert.equal(evaluateCurrentMainProvenanceBridge().status, PUBLIC_STATES[0]);
  let output = "";
  assert.equal(runCli([], (value) => { output = value; }), 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.status, "awaiting_production_adapter_and_provenance_material");
  assert.deepEqual(Object.values(parsed.capabilityInvocationCounts), Array(7).fill(0));
});

test("exact production adapter and current-main binding is verified non-executingly", () => {
  const result = evaluateCurrentMainProvenanceBridge(validPacket());
  assert.equal(result.status, "production_adapter_and_current_main_binding_verified");
  assert.equal(result.currentMainBound, true);
  assert.equal(result.historicalContractsPreserved, true);
  assert.equal(result.productionAdaptersValidated, true);
  assert.equal(result.productionConfigured, false);
  assert.equal(result.explicitInvocationStillRequired, true);
  for (const field of ["cutoverExecutorInvoked", "capabilityMethodInvoked",
    "productionWritePerformed", "selectorMutationPerformed", "rollbackInvoked",
    "loaderActivationPerformed", "deploymentPerformed", "rawMaterialPresent"]) {
    assert.equal(result[field], false, field);
  }
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.provenanceBridge), true);
  assert.equal(typeof result.provenanceBridge.provenanceBridgeId, "string");
  assert.match(result.provenanceBridge.provenanceBridgeHash, /^[0-9a-f]{64}$/);
});

test("adapter manifest drift blocks before provenance validation", () => {
  const packet = validPacket();
  packet.adapterManifest = clone(packet.adapterManifest);
  packet.adapterManifest.capabilities[0].hardTimeoutMilliseconds = 101;
  const result = evaluateCurrentMainProvenanceBridge(packet);
  assert.equal(result.status, PUBLIC_STATES[2]);
  assert.equal(result.failureClassification, FAILURE_CLASSIFICATIONS[0]);
  assert.ok(result.blockingIssues.some((issue) => issue.includes("capability_invalid")));
});

test("current head, tree, source blob, and content drift fail closed", () => {
  for (const mutate of [
    (packet) => { packet.repositorySnapshot.headSha = "0".repeat(40); },
    (packet) => { packet.repositorySnapshot.treeSha = "1".repeat(40); },
    (packet) => { packet.observedSourceIdentities[0].sourceBlobIdentityHash = h("tampered-blob"); },
    (packet) => { packet.observedSourceIdentities[1].sourceContentSha256 = h("tampered-content"); },
  ]) {
    const packet = validPacket(); mutate(packet);
    const result = evaluateCurrentMainProvenanceBridge(packet);
    assert.equal(result.status, PUBLIC_STATES[2]);
    assert.equal(result.failureClassification, FAILURE_CLASSIFICATIONS[1]);
  }
});

test("historical Step Z, ZA, and ZB baselines are preserved exactly", () => {
  const historical = buildHistoricalContracts();
  assert.deepEqual(historical, {
    stepZ: { mergedMainSha: "c9dec6491643c03d2b7a14c0c91986a1c88351e7",
      contractVersion: "finple.step114-2x-z.production-single-use-cutover-executor.v1" },
    stepZA: { mergedMainSha: "6fee85ba9e676336b4fa458880b15d9c8918795a",
      contractVersion: "finple.step114-2x-za.production-cutover-runtime-ceremony.v1" },
    stepZB: { mergedMainSha: "07117880d21adee760c145f7ae865703532c210c",
      contractVersion: "finple.step114-2x-zb.production-explicit-invocation-package.v1" },
  });
  const packet = validPacket();
  packet.historicalContracts = clone(packet.historicalContracts);
  packet.historicalContracts.stepZB.mergedMainSha = packet.executionMainSha;
  const result = evaluateCurrentMainProvenanceBridge(packet);
  assert.equal(result.status, PUBLIC_STATES[2]);
  assert.ok(result.blockingIssues.includes("historical_contract_baseline_or_version_drift"));
});

test("target, selector, and current preimage path drift is rejected", () => {
  const packet = validPacket();
  packet.currentPreimageManifest = clone(packet.currentPreimageManifest);
  packet.currentPreimageManifest.targetPreimageIdentities[0].pathIdentityHash = h("wrong-path");
  const result = evaluateCurrentMainProvenanceBridge(packet);
  assert.equal(result.failureClassification, FAILURE_CLASSIFICATIONS[2]);
  assert.ok(result.blockingIssues.includes("current_preimage_manifest_seal_invalid") ||
    result.blockingIssues.includes("preimage_path_binding_invalid"));
});

test("merge, CI, Vercel, health, and ownership never imply execution authority", () => {
  for (const signal of ["merge", "ci", "vercel", "healthCheck", "repositoryOwnership"]) {
    const packet = validPacket(); packet.authoritySignals[signal] = true;
    const result = evaluateCurrentMainProvenanceBridge(packet);
    assert.equal(result.status, PUBLIC_STATES[2]);
    assert.deepEqual(result.blockingIssues, ["external_signal_execution_authority_forbidden"]);
  }
});

test("nonce replay, upstream collision, expiration, and excessive lifetime block", () => {
  const replay = validPacket();
  replay.provenanceNonceContext.priorNonceHashes.push(
    replay.provenanceNonceContext.provenanceNonceHash);
  replay.provenanceNonceContext.priorNonceHashes.sort();
  assert.ok(evaluateCurrentMainProvenanceBridge(replay).blockingIssues.includes(
    "provenance_nonce_replay_or_collision"));
  const collision = validPacket();
  collision.provenanceNonceContext.upstreamNonceHashes.push(
    collision.provenanceNonceContext.provenanceNonceHash);
  collision.provenanceNonceContext.upstreamNonceHashes.sort();
  assert.ok(evaluateCurrentMainProvenanceBridge(collision).blockingIssues.includes(
    "provenance_nonce_replay_or_collision"));
  const expired = validPacket(); expired.evaluationClockInstant = expired.effectiveExpiresAt;
  assert.ok(evaluateCurrentMainProvenanceBridge(expired).blockingIssues.includes(
    "provenance_chronology_or_expiry_invalid"));
  const long = validPacket(); long.effectiveExpiresAt = "2026-07-22T03:05:00.001Z";
  assert.ok(evaluateCurrentMainProvenanceBridge(long).blockingIssues.includes(
    "provenance_chronology_or_expiry_invalid"));
});

test("optional operator identities are accepted only as sanitized hashes", () => {
  const packet = validPacket();
  packet.operatorMaterialIdentities = { operatorAllowlistIdentityHash: h("allowlist"),
    operatorAuthorizationIdentityHash: h("authorization") };
  assert.equal(evaluateCurrentMainProvenanceBridge(packet).ok, true);
  packet.operatorMaterialIdentities.operatorAuthorizationIdentityHash = "raw-signature";
  assert.deepEqual(evaluateCurrentMainProvenanceBridge(packet).blockingIssues,
    ["operator_material_identities_invalid"]);
});

test("N/Q/W historical chain identities remain bound through the bridge non-executingly", () => {
  const packet = validPacket();
  assert.deepEqual(packet.historicalContracts, buildHistoricalContracts());
  const bridgeResult = evaluateCurrentMainProvenanceBridge(validPacket());
  assert.equal(bridgeResult.ok, true);
  assert.deepEqual(Object.values(bridgeResult.capabilityInvocationCounts), Array(7).fill(0));
  assert.equal(bridgeResult.commandConstructionCount, 0);
});

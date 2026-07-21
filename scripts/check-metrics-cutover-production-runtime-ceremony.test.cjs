"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const subject = require("./lib/metrics-cutover-production-runtime-ceremony.cjs");
const fixture = require("./test-support/metrics-cutover-production-runtime-ceremony-fixture.cjs");

function assertNoCalls(built) { assert.deepEqual(built.calls, []); }
function assertFixedFalse(result) {
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}
function assertDeepFrozen(value) {
  if (value && typeof value === "object") {
    assert.equal(Object.isFrozen(value), true);
    for (const child of Object.values(value)) assertDeepFrozen(child);
  }
}
function assertSanitized(value) {
  assert.equal(Buffer.isBuffer(value), false);
  assert.notEqual(typeof value, "function");
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!["contentBase64", "signatureBase64", "publicKeyPem", "targetPath",
        "selectorPath", "credential", "endpoint", "command"].includes(key), key);
      assertSanitized(child);
    }
  }
}
function expectBlocked(mutator, issue, classification) {
  const built = fixture.buildFixture();
  mutator(built.packet, built);
  const result = subject.evaluateProductionCutoverRuntimeCeremony(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[2]);
  assert.ok(result.blockingIssues.some((item) => item.includes(issue)),
    JSON.stringify(result.blockingIssues));
  if (classification) assert.equal(result.failureClassification, classification);
  assert.deepEqual(result.explicitExecutionHandoff, {});
  assertNoCalls(built);
  assertFixedFalse(result);
  return result;
}

test("public states, zero input, and zero-argument CLI are exact", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_production_cutover_runtime_material",
    "ready_for_explicit_production_cutover_execution", "blocked",
  ]);
  const idle = subject.evaluateProductionCutoverRuntimeCeremony();
  assert.equal(idle.status, subject.PUBLIC_STATES[0]);
  assert.equal(idle.ok, false);
  assertFixedFalse(idle);
  assertDeepFrozen(idle);
  const cli = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-production-runtime-ceremony.cjs")], { encoding: "utf8" });
  assert.equal(cli.status, 0);
  assert.equal(JSON.parse(cli.stdout).status, subject.PUBLIC_STATES[0]);
  const forbidden = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-production-runtime-ceremony.cjs"), "--execute"],
  { encoding: "utf8" });
  assert.equal(forbidden.status, 1);
  assert.equal(JSON.parse(forbidden.stdout).status, subject.PUBLIC_STATES[2]);
});

test("complete synthetic runtime material becomes ready without any invocation", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateProductionCutoverRuntimeCeremony(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  assert.equal(result.mergedMainShaBound, true);
  assert.equal(result.stepZContractValidated, true);
  assert.equal(result.completeStepZYXWVUTSChainValidated, true);
  assert.equal(result.runtimeMaterialValidated, true);
  assert.equal(result.operatorChecklistValidated, true);
  assert.equal(result.nonExecuting, true);
  assert.equal(result.explicitInvocationRequired, true);
  assertNoCalls(built);
  assertFixedFalse(result);
  assertDeepFrozen(result);
  assertSanitized(result);
});

test("merged Step Z contract and complete Step Y/X/W/V/U/T/S chain validate directly", () => {
  const built = fixture.buildFixture();
  assert.deepEqual(subject.validateMergedStepZContract(), []);
  const validated = subject.validateStepZPacket(built.packet.stepZPacket);
  assert.deepEqual(validated.issues, []);
  assert.ok(validated.direct.envelope.singleUseProductionCutoverEnvelopeId);
  assertNoCalls(built);
});

test("runtime inventory binds all descriptors, policies, methods, and artifacts", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateProductionCutoverRuntimeCeremony(built.packet);
  const inventory = result.runtimeMaterialInventory;
  assert.equal(inventory.capabilityCount, 7);
  assert.deepEqual(inventory.capabilities.map((entry) => entry.capabilityName),
    subject.RUNTIME_MATERIAL_INVENTORY);
  for (const entry of inventory.capabilities) {
    assert.match(entry.descriptorHash, /^[0-9a-f]{64}$/);
    assert.match(entry.runtimeArtifactSha256, /^[0-9a-f]{64}$/);
    assert.match(entry.sourceTreeSha256, /^[0-9a-f]{64}$/);
    assert.match(entry.capabilityManifestSha256, /^[0-9a-f]{64}$/);
    assert.equal(entry.materialPresent, true);
    assert.equal(entry.descriptorValidated, true);
    assert.equal(entry.methodInvocationCount, 0);
  }
  assert.equal(inventory.operationPlan.length, 12);
  assert.deepEqual(inventory.executorTrace,
    require("./lib/metrics-cutover-production-single-use-executor.cjs").EXECUTION_TRACE);
  assert.equal(inventory.noCapabilityInvoked, true);
  assertNoCalls(built);
});

test("handoff seals Step Z through S identities, nonce, clock, expiry, and fixed-false flags", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateProductionCutoverRuntimeCeremony(built.packet);
  const handoff = result.explicitExecutionHandoff;
  assert.match(handoff.explicitExecutionHandoffId,
    /^step114-2x-za-explicit-execution-handoff-[0-9a-f]{64}$/);
  assert.match(handoff.explicitExecutionHandoffHash, /^[0-9a-f]{64}$/);
  assert.equal(handoff.ceremonyNonceHash, built.packet.runtimeMaterial.ceremonyNonceHash);
  assert.equal(handoff.evaluationClockInstant, built.packet.evaluationClockInstant);
  assert.equal(handoff.effectiveExpiry, built.stepZBase.envelope.effectiveCutoverExpiresAt);
  assert.equal(handoff.nonExecuting, true);
  assert.equal(handoff.explicitInvocationRequired, true);
  assert.equal(handoff.runtimeMaterialValidated, true);
  for (const field of ["cutoverExecutorInvoked", "capabilityMethodInvoked",
    "productionWritePerformed", "selectorMutationPerformed",
    "loaderActivationPerformed", "deploymentPerformed", "rawMaterialPresent"]) {
    assert.equal(handoff[field], false, field);
  }
  assert.ok(handoff.chainIdentities.stepSLaunchPackageId);
  assertNoCalls(built);
});

test("main SHA and Step Z/Y/X chain tampering fail before runtime validation", () => {
  expectBlocked((packet) => { packet.mergedMainSha = "0".repeat(40); },
    "merged_main_sha_mismatch", subject.FAILURE_CLASSIFICATIONS[0]);
  expectBlocked((packet) => { packet.stepZPacket = { ...packet.stepZPacket,
    mergedMainSha: "0".repeat(40) }; }, "step_z_merged_main_sha_mismatch");
  expectBlocked((packet) => {
    const stepYPacket = fixture.clone(packet.stepZPacket.stepYPacket);
    stepYPacket.stepXResult.productionCutoverReadinessSummary
      .productionCutoverReadinessSummaryHash = "f".repeat(64);
    packet.stepZPacket = { ...packet.stepZPacket, stepYPacket };
  }, "step_z:step_y_packet_or_result_canonical_mismatch");
});

test("capability method and descriptor mismatches fail without calling methods", () => {
  expectBlocked((packet) => {
    const capability = packet.stepZPacket.atomicProductionCsvReplacer;
    packet.stepZPacket = { ...packet.stepZPacket,
      atomicProductionCsvReplacer: { ...capability,
        replaceProductionCsvAtomically: null } };
  }, "atomicProductionCsvReplacer_method_invalid");
  expectBlocked((packet) => {
    const capability = packet.stepZPacket.cutoverReceiptStore;
    packet.stepZPacket = { ...packet.stepZPacket,
      cutoverReceiptStore: { ...capability, descriptor: { ...capability.descriptor,
        automaticRetryAllowed: true } } };
  }, "cutoverReceiptStore_descriptor_invalid");
});

test("runtime artifact, source-tree, manifest, descriptor, and method sets are exact", () => {
  for (const [field, issue] of [
    ["runtimeArtifactSha256", "runtime_capability_binding_invalid"],
    ["sourceTreeSha256", "runtime_capability_binding_invalid"],
    ["capabilityManifestSha256", "runtime_capability_binding_invalid"],
    ["descriptorHash", "runtime_capability_binding_invalid"],
    ["methodSetHash", "runtime_capability_binding_invalid"],
  ]) {
    expectBlocked((packet) => { packet.runtimeMaterial.capabilityBindings[0][field] =
      "0".repeat(64); }, issue, subject.FAILURE_CLASSIFICATIONS[1]);
  }
});

test("externally attested artifact and source identities reseal one exact manifest", () => {
  const built = fixture.buildFixture();
  const index = subject.RUNTIME_MATERIAL_INVENTORY.indexOf("cutoverClock");
  built.packet.runtimeMaterial.capabilityBindings[index] =
    subject.expectedCapabilityBinding("cutoverClock", {
      runtimeArtifactSha256: subject.hashContract(
        "FINPLE_STEP114_2X_ZA_TEST_EXTERNAL_ARTIFACT\0", "cutoverClock"),
      sourceTreeSha256: subject.hashContract(
        "FINPLE_STEP114_2X_ZA_TEST_EXTERNAL_SOURCE_TREE\0", "cutoverClock"),
    });
  const result = subject.evaluateProductionCutoverRuntimeCeremony(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  assert.equal(result.runtimeMaterialInventory.capabilities[index]
    .runtimeArtifactSha256,
  built.packet.runtimeMaterial.capabilityBindings[index].runtimeArtifactSha256);
  assertNoCalls(built);
});

test("missing rollback, receipt, terminalization, and restoration readiness block", () => {
  for (const field of ["rollbackAvailable", "restorationVerificationAvailable",
    "receiptPersistenceAvailable", "claimTerminalizationAvailable"]) {
    expectBlocked((packet) => { packet.runtimeMaterial.availability[field] = false; },
      "runtime_material_availability_incomplete");
  }
});

test("candidate, preimage, selector, repository, and operation drift block", () => {
  expectBlocked((packet) => { packet.runtimeMaterial.targetReadiness.targets[0]
    .contentSha256 = "0".repeat(64); }, "runtime_target_preimage");
  expectBlocked((packet) => { packet.runtimeMaterial.targetReadiness.targets.reverse(); },
    "runtime_target_preimage");
  expectBlocked((packet) => { packet.runtimeMaterial.targetReadiness.selector
    .preimageSha256 = "0".repeat(64); }, "runtime_target_preimage");
  expectBlocked((packet) => { packet.runtimeMaterial.targetReadiness.repository
    .repositoryTreeSha = "0".repeat(40); }, "runtime_target_preimage");
  expectBlocked((packet) => { packet.runtimeMaterial.operationPlan[2].operationId =
    packet.runtimeMaterial.operationPlan[3].operationId; }, "runtime_operation_plan_invalid");
});

test("nonce replay, malformed context, chronology, and expiry equality fail closed", () => {
  expectBlocked((packet) => { packet.priorCeremonyNonceHashes =
    [packet.runtimeMaterial.ceremonyNonceHash]; }, "runtime_ceremony_nonce_replayed");
  expectBlocked((packet) => { packet.priorCeremonyNonceHashes =
    ["b".repeat(64), "a".repeat(64)]; }, "prior_ceremony_nonce_hashes_invalid");
  expectBlocked((packet) => { packet.priorCeremonyNonceHashes =
    ["a".repeat(64), "a".repeat(64)]; }, "prior_ceremony_nonce_hashes_invalid");
  expectBlocked((packet) => { packet.evaluationClockInstant =
    "2026-07-18T00:03:27.000Z"; }, "chronology_or_expiry");
  expectBlocked((packet) => { packet.evaluationClockInstant =
    packet.runtimeMaterial.effectiveExpiry;
    packet.stepZPacket = { ...packet.stepZPacket,
      executionClockInstant: packet.runtimeMaterial.effectiveExpiry };
  }, "cutover_execution_clock_invalid_or_expired");
});

test("checklist incompleteness and inferred approval block after material validation", () => {
  expectBlocked((packet) => { packet.operatorChecklistConfirmations
    .rollbackMaterialAvailable = false; }, "operator_checklist_incomplete",
  subject.FAILURE_CLASSIFICATIONS[2]);
  for (const field of subject.CHECKLIST_FALSE_FIELDS) {
    expectBlocked((packet) => { packet.operatorChecklistConfirmations[field] = true; },
      "operator_checklist_forbidden", subject.FAILURE_CLASSIFICATIONS[2]);
  }
});

test("merge, CI, Vercel, ownership, retry, loader, deployment, provider, DB and network imply no authority", () => {
  for (const field of Object.keys(fixture.buildFixture().packet.runtimeMaterial.authority)) {
    expectBlocked((packet) => { packet.runtimeMaterial.authority[field] = true; },
      "runtime_material_authority_not_fixed_false");
  }
});

test("handoff is deterministic, recursively frozen, sanitized, and nonce-specific", () => {
  const first = fixture.buildFixture();
  const second = fixture.buildFixture();
  const left = subject.evaluateProductionCutoverRuntimeCeremony(first.packet);
  const right = subject.evaluateProductionCutoverRuntimeCeremony(second.packet);
  assert.deepEqual(left, right);
  const third = fixture.buildFixture({ runtimeMaterialOverrides: {
    ceremonyNonceHash: subject.hashContract(
      "FINPLE_STEP114_2X_ZA_TEST_DISTINCT_CEREMONY_NONCE\0", "distinct"),
  } });
  const changed = subject.evaluateProductionCutoverRuntimeCeremony(third.packet);
  assert.equal(changed.status, subject.PUBLIC_STATES[1]);
  assert.notEqual(left.explicitExecutionHandoff.explicitExecutionHandoffHash,
    changed.explicitExecutionHandoff.explicitExecutionHandoffHash);
  assertDeepFrozen(left);
  assertSanitized(left);
  assertNoCalls(first); assertNoCalls(second); assertNoCalls(third);
});

test("source exposes no ambient execution, filesystem, network, DB, route, worker, or deployment capability", () => {
  const source = fs.readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-production-runtime-ceremony.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:http", "node:https", "node:net",
    "child_process", "process.env", "fetch(", "executeSingleUseProductionCutover(",
    "acquireEnvelopeClaim(", "replaceProductionCsvAtomically(",
    "mutateSelectorExactlyOnce(", "persistCutoverReceipt(",
    "terminalizeEnvelopeClaim(", "restoreBoundPreimages("]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("unknown, extra, and raw runtime material fields fail closed", () => {
  expectBlocked((packet) => { packet.runtimeMaterial.endpoint = "forbidden"; },
    "runtime_material_fields_invalid");
  expectBlocked((packet) => { delete packet.runtimeMaterial.targetReadiness; },
    "runtime_material_fields_invalid");
  expectBlocked((packet) => { packet.runtimeMaterial.materialState = "ambiguous"; },
    "runtime_material_incomplete");
  expectBlocked((packet) => { packet.extra = true; },
    "runtime_ceremony_packet_fields_invalid");
});

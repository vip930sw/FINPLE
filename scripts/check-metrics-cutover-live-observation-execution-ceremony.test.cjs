"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const stepT = require("./lib/metrics-cutover-live-observation-controlled-runner.cjs");
const subject = require("./lib/metrics-cutover-live-observation-execution-ceremony.cjs");
const fixture = require("./test-support/metrics-cutover-live-observation-execution-ceremony-fixture.cjs");

function assertFixedFalse(result) {
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}
function assertDeepFrozen(value) {
  if (value && typeof value === "object") {
    assert.equal(Object.isFrozen(value), true);
    for (const item of Object.values(value)) assertDeepFrozen(item);
  }
}
function assertNoBinaryMaterial(value) {
  assert.equal(Buffer.isBuffer(value), false);
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) assertNoBinaryMaterial(item);
  }
}
async function expectBlocked(mutator, issue) {
  const built = fixture.buildFixture();
  mutator(built.packet, built);
  const result = subject.evaluateExecutionCeremony(built.packet);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.some((item) => item.includes(issue)),
    JSON.stringify(result.blockingIssues));
  assert.deepEqual(built.calls, []);
  assertFixedFalse(result);
  return result;
}

test("public states, zero input, and CLI default are exact", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_runtime_material",
    "ready_for_explicit_external_execution",
    "blocked",
  ]);
  const idle = subject.evaluateExecutionCeremony();
  assert.equal(idle.status, subject.PUBLIC_STATES[0]);
  assert.equal(idle.ok, false);
  assert.deepEqual(idle.runtimeMaterialInventory, {});
  assert.deepEqual(idle.runtimeMaterialManifest, {});
  assertFixedFalse(idle);
  assertDeepFrozen(idle);
  const cli = JSON.parse(execFileSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-execution-ceremony.cjs")],
  { encoding: "utf8" }));
  assert.equal(cli.status, subject.PUBLIC_STATES[0]);
});

test("complete synthetic material becomes ready without invoking any capability", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExecutionCeremony(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], JSON.stringify(result.blockingIssues));
  assert.equal(result.mergedMainShaBound, true);
  assert.equal(result.stepSValidated, true);
  assert.equal(result.stepTContractValidated, true);
  assert.deepEqual(built.calls, []);
  assertFixedFalse(result);
  assertDeepFrozen(result);
});

test("merged Step T contract and complete Step S package are directly validated", () => {
  const built = fixture.buildFixture();
  assert.deepEqual(subject.validateMergedStepTContract(), []);
  assert.deepEqual(stepT.validateDirectStepSPackage(built.stepSPackage), []);
  assert.deepEqual(subject.validateRuntimeCapabilities(
    built.packet.runtimeCapabilities), []);
  assert.deepEqual(built.calls, []);
});

test("runtime inventory is exact, descriptor-bound, and invocation-free", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExecutionCeremony(built.packet);
  const inventory = result.runtimeMaterialInventory;
  assert.equal(inventory.mergedMainSha, subject.MERGED_MAIN_SHA);
  assert.equal(inventory.capabilityCount, 10);
  assert.deepEqual(inventory.capabilities.map((item) => item.capabilityName),
    subject.RUNTIME_MATERIAL_INVENTORY);
  for (const item of inventory.capabilities) {
    assert.equal(item.descriptorHash,
      built.packet.runtimeCapabilities[item.capabilityName].descriptor.descriptorHash);
    assert.equal(item.present, true);
    assert.equal(item.descriptorValidated, true);
    assert.equal(item.methodInvocationCount, 0);
  }
  assert.equal(inventory.noCapabilityInvoked, true);
  assert.equal(inventory.rawMaterialPresent, false);
  assert.match(inventory.runtimeMaterialInventoryId,
    /^step114-2x-u-runtime-material-inventory-[0-9a-f]{64}$/);
  assert.match(inventory.runtimeMaterialInventoryHash, /^[0-9a-f]{64}$/);
  assert.deepEqual(subject.validateRuntimeMaterialInventory(inventory,
    built.packet.stepSPackage, built.packet.runtimeCapabilities,
    built.packet.runtimeMaterial), []);
  assert.deepEqual(built.calls, []);
});

test("runtime material manifest binds nonce plan inventory availability and authority", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExecutionCeremony(built.packet);
  const manifest = result.runtimeMaterialManifest;
  assert.equal(manifest.ceremonyNonceHash, built.packet.runtimeMaterial.ceremonyNonceHash);
  assert.equal(manifest.operationPlanHash,
    stepT.hashOperationPlan(built.packet.runtimeMaterial.operationPlan));
  assert.equal(manifest.runtimeMaterialInventoryId,
    result.runtimeMaterialInventory.runtimeMaterialInventoryId);
  assert.equal(manifest.runtimeMaterialInventoryHash,
    result.runtimeMaterialInventory.runtimeMaterialInventoryHash);
  assert.equal(manifest.executionLeaseRequestId,
    built.packet.runtimeMaterial.singleUseIdentities.executionLeaseRequestId);
  assert.equal(manifest.claimRequestId,
    built.packet.runtimeMaterial.singleUseIdentities.claimRequestId);
  assert.deepEqual(subject.validateRuntimeMaterialManifest(manifest,
    built.packet.stepSPackage, built.packet.runtimeMaterial,
    result.runtimeMaterialInventory, built.packet.priorCeremonyNonceHashes), []);
  assert.deepEqual(built.calls, []);
});

test("nonce and operation plan changes produce distinct sanitized manifest hashes", () => {
  const first = fixture.buildFixture();
  const second = fixture.buildFixture({ runtimeMaterialOverrides: {
    ceremonyNonceHash: "b".repeat(64),
  } });
  const left = subject.evaluateExecutionCeremony(first.packet);
  const right = subject.evaluateExecutionCeremony(second.packet);
  assert.equal(left.status, subject.PUBLIC_STATES[1]);
  assert.equal(right.status, subject.PUBLIC_STATES[1]);
  assert.notEqual(left.runtimeMaterialManifest.runtimeMaterialManifestHash,
    right.runtimeMaterialManifest.runtimeMaterialManifestHash);
  assert.notEqual(left.evidenceHandoffManifest.evidenceHandoffManifestHash,
    right.evidenceHandoffManifest.evidenceHandoffManifestHash);

  const changedMaterial = fixture.clone(first.packet.runtimeMaterial);
  changedMaterial.operationPlan = stepT.buildOperationPlan("9".repeat(64));
  changedMaterial.singleUseIdentities.executionLeaseRequestId =
    changedMaterial.operationPlan.find((entry) =>
      entry.stage === "execution_lease_acquisition").operationId;
  changedMaterial.singleUseIdentities.claimRequestId = changedMaterial.operationPlan.find(
    (entry) => entry.stage === "claim_acquisition").operationId;
  const changedInventory = subject.buildRuntimeMaterialInventory(first.packet.stepSPackage,
    first.packet.runtimeCapabilities, changedMaterial);
  const changedManifest = subject.buildRuntimeMaterialManifest(first.packet.stepSPackage,
    changedMaterial, changedInventory, first.packet.priorCeremonyNonceHashes);
  assert.notEqual(changedInventory.operationPlanHash,
    left.runtimeMaterialInventory.operationPlanHash);
  assert.notEqual(changedManifest.runtimeMaterialManifestHash,
    left.runtimeMaterialManifest.runtimeMaterialManifestHash);
  assert.deepEqual(first.calls, []);
  assert.deepEqual(second.calls, []);
});

test("runtime inventory and material manifest hash tampering is rejected", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExecutionCeremony(built.packet);
  const inventory = fixture.clone(result.runtimeMaterialInventory);
  inventory.runtimeMaterialInventoryHash = "0".repeat(64);
  assert.deepEqual(subject.validateRuntimeMaterialInventory(inventory,
    built.packet.stepSPackage, built.packet.runtimeCapabilities,
    built.packet.runtimeMaterial), ["runtime_material_inventory_invalid"]);
  const manifest = fixture.clone(result.runtimeMaterialManifest);
  manifest.runtimeMaterialManifestHash = "0".repeat(64);
  assert.deepEqual(subject.validateRuntimeMaterialManifest(manifest,
    built.packet.stepSPackage, built.packet.runtimeMaterial,
    result.runtimeMaterialInventory, built.packet.priorCeremonyNonceHashes),
  ["runtime_material_manifest_invalid"]);
  assert.deepEqual(built.calls, []);
});

test("missing and extra runtime capabilities block before all method calls", async () => {
  await expectBlocked((packet) => { delete packet.runtimeCapabilities.atomicClaimStore; },
    "runtime_capability_bundle_fields_invalid");
  await expectBlocked((packet) => { packet.runtimeCapabilities.extraCapability = {}; },
    "runtime_capability_bundle_fields_invalid");
});

test("missing, extra, and ambiguous runtime material blocks", async () => {
  await expectBlocked((packet) => { delete packet.runtimeMaterial.availability; },
    "runtime_material_fields_invalid");
  await expectBlocked((packet) => { packet.runtimeMaterial.endpoint = "forbidden"; },
    "runtime_material_fields_invalid");
  await expectBlocked((packet) => { packet.runtimeMaterial.runtimeMaterialState = "ambiguous"; },
    "runtime_material_state_ambiguous");
});

test("expiry, replay, and malformed prior nonce contexts fail closed", async () => {
  await expectBlocked((packet) => {
    packet.evaluationClockInstant = packet.runtimeMaterial.effectiveExpiry;
  }, "runtime_material_expired");
  await expectBlocked((packet) => {
    packet.priorCeremonyNonceHashes = [packet.runtimeMaterial.ceremonyNonceHash];
  }, "runtime_material_nonce_replayed");
  await expectBlocked((packet) => {
    packet.priorCeremonyNonceHashes = ["b".repeat(64), "a".repeat(64)];
  }, "prior_ceremony_nonce_hashes_invalid");
  await expectBlocked((packet) => {
    packet.priorCeremonyNonceHashes = ["b".repeat(64), "b".repeat(64)];
  }, "prior_ceremony_nonce_hashes_invalid");
});

test("merged main SHA drift and Step S root tampering block", async () => {
  await expectBlocked((packet) => { packet.mergedMainSha = "0".repeat(40); },
    "merged_main_sha_mismatch");
  await expectBlocked((packet) => {
    packet.stepSPackage = fixture.clone(packet.stepSPackage);
    delete packet.stepSPackage.runnerLaunchSummary;
  }, "step_s:step_s_package_fields_invalid");
});

test("Step T descriptor policy drift blocks even when resealed", async () => {
  await expectBlocked((packet) => {
    const capability = packet.runtimeCapabilities.atomicClaimStore;
    const body = { ...capability.descriptor, automaticRetryAllowed: true };
    delete body.descriptorHash;
    capability.descriptor = { ...body, descriptorHash: stepT.hashContract(
      "FINPLE_STEP114_2X_T_CAPABILITY_DESCRIPTOR\0", body) };
  }, "runtime_capability_descriptor_invalid:atomicClaimStore");
});

test("mutation, retry, fallback, trigger, route, worker, and deployment authority block", async () => {
  for (const field of ["providerMutationAllowed", "productionMutationAllowed",
    "automaticRetryAllowed", "fallbackAllowed", "automaticTriggerAllowed",
    "runtimeRouteAllowed", "cronAllowed", "workerAllowed", "deploymentWorkflowAllowed",
    "externalExecutionApproved"]) {
    await expectBlocked((packet) => { packet.runtimeMaterial.authority[field] = true; },
      "runtime_material_authority_not_fixed_false");
  }
});

test("single-use identities bind Step S and the exact lease and claim operations", async () => {
  await expectBlocked((packet) => {
    packet.runtimeMaterial.singleUseIdentities.invocationHash = "0".repeat(64);
  }, "single_use_identity_mismatch:invocationHash");
  await expectBlocked((packet) => {
    packet.runtimeMaterial.singleUseIdentities.claimUnused = false;
  }, "single_use_identity_not_unused:claimUnused");
  await expectBlocked((packet) => {
    packet.runtimeMaterial.singleUseIdentities.claimRequestId =
      packet.runtimeMaterial.singleUseIdentities.executionLeaseRequestId;
  }, "claim_request_identity_mismatch");
  await expectBlocked((packet) => {
    packet.runtimeMaterial.singleUseIdentities.executionLeaseRequestId =
      packet.runtimeMaterial.operationPlan.find((entry) =>
        entry.stage === "claim_acquisition").operationId;
  }, "execution_lease_request_identity_mismatch");
});

test("Step T and Step U use the exact same canonical operation plan", async () => {
  const built = fixture.buildFixture();
  const expected = stepT.buildOperationPlan(built.stepSPackage.oneRunRunnerLaunchPackage
    .oneRunRunnerLaunchPackageHash);
  assert.deepEqual(built.packet.runtimeMaterial.operationPlan, expected);
  await expectBlocked((packet) => {
    packet.runtimeMaterial.operationPlan[6].operationId =
      `step114-2x-t-operation-${"1".repeat(64)}`;
  }, "runtime_operation_plan_mismatch");
  await expectBlocked((packet) => {
    packet.runtimeMaterial.operationPlan[6].idempotencyKey = "2".repeat(64);
  }, "runtime_operation_plan_mismatch");
  await expectBlocked((packet) => {
    packet.runtimeMaterial.operationPlan.reverse();
  }, "runtime_operation_plan_mismatch");
});

test("destination and observation counts must both remain one", async () => {
  await expectBlocked((packet) => { packet.runtimeMaterial.destinationCount = 2; },
    "runtime_material_destination_count_invalid");
  await expectBlocked((packet) => { packet.runtimeMaterial.observationCount = 0; },
    "runtime_material_observation_count_invalid");
});

test("availability requires artifacts kill switch stores disposal and terminalization", async () => {
  for (const field of ["runnerArtifactBytesAvailable", "adapterArtifactBytesAvailable",
    "killSwitchAvailable", "killSwitchInitiallySafe", "receiptStoreAvailable",
    "evidenceStoreAvailable", "disposalCoordinatorAvailable",
    "leaseTerminalizationAvailable"]) {
    await expectBlocked((packet) => { packet.runtimeMaterial.availability[field] = false; },
      "runtime_material_availability_incomplete");
  }
});

test("operator checklist requires every safety confirmation", async () => {
  for (const field of subject.CHECKLIST_TRUE_FIELDS) {
    await expectBlocked((packet) => {
      packet.operatorChecklistConfirmations[field] = false;
    }, `operator_checklist_incomplete:${field}`);
  }
});

test("PR merge or CI can never imply or grant later external execution approval", async () => {
  await expectBlocked((packet) => {
    packet.operatorChecklistConfirmations.externalExecutionApproved = true;
  }, "operator_checklist_forbidden:externalExecutionApproved");
  await expectBlocked((packet) => {
    packet.operatorChecklistConfirmations.mergeOrCiImpliesExternalApproval = true;
  }, "operator_checklist_forbidden:mergeOrCiImpliesExternalApproval");
  const ready = subject.evaluateExecutionCeremony(fixture.buildFixture().packet);
  assert.equal(ready.operatorChecklist.externalExecutionApprovalInferred, false);
  assert.equal(ready.operatorChecklist.externalExecutionApproved, false);
});

test("evidence handoff binds only sanitized approved identities policies counts and booleans", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExecutionCeremony(built.packet);
  const manifest = result.evidenceHandoffManifest;
  assert.equal(manifest.mergedMainSha, subject.MERGED_MAIN_SHA);
  assert.equal(manifest.oneRunRunnerLaunchPackageId,
    built.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageId);
  assert.equal(manifest.oneRunRunnerLaunchPackageHash,
    built.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash);
  assert.equal(manifest.destinationCount, 1);
  assert.equal(manifest.observationCount, 1);
  assert.equal(manifest.capabilityCount, 10);
  assert.equal(manifest.ceremonyNonceHash,
    result.runtimeMaterialManifest.ceremonyNonceHash);
  assert.equal(manifest.operationPlanHash,
    result.runtimeMaterialManifest.operationPlanHash);
  assert.equal(manifest.runtimeMaterialInventoryId,
    result.runtimeMaterialInventory.runtimeMaterialInventoryId);
  assert.equal(manifest.runtimeMaterialInventoryHash,
    result.runtimeMaterialInventory.runtimeMaterialInventoryHash);
  assert.equal(manifest.runtimeMaterialManifestId,
    result.runtimeMaterialManifest.runtimeMaterialManifestId);
  assert.equal(manifest.runtimeMaterialManifestHash,
    result.runtimeMaterialManifest.runtimeMaterialManifestHash);
  assert.equal(manifest.externalExecutionApproved, false);
  assert.equal(manifest.stepTRunnerInvoked, false);
  assert.equal(manifest.capabilityMethodInvoked, false);
  assert.equal(manifest.rawMaterialPresent, false);
  const body = { ...manifest }; delete body.evidenceHandoffManifestHash;
  assert.equal(manifest.evidenceHandoffManifestHash, subject.hashContract(
    "FINPLE_STEP114_2X_U_EVIDENCE_HANDOFF_HASH\0", body));
});

test("output is deterministic canonical frozen and contains no sensitive material", () => {
  const first = fixture.buildFixture();
  const second = fixture.buildFixture();
  const left = subject.evaluateExecutionCeremony(first.packet);
  const right = subject.evaluateExecutionCeremony(second.packet);
  assert.equal(subject.canonicalJson(left), subject.canonicalJson(right));
  assertDeepFrozen(left);
  assertNoBinaryMaterial(left);
  const serialized = JSON.stringify(left).toLowerCase();
  for (const forbidden of ["credential=", "endpoint=", "hostname=", "account=",
    "database=", "rawobservation", "select *", "sourcepath",
    "stacktrace", "commandoutput"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.deepEqual(first.calls, []);
  assert.deepEqual(second.calls, []);
});

test("packet and checklist extra sensitive fields fail closed", async () => {
  await expectBlocked((packet) => { packet.endpoint = "forbidden"; },
    "ceremony_packet_fields_invalid");
  await expectBlocked((packet) => {
    packet.operatorChecklistConfirmations.providerIdentity = "forbidden";
  }, "operator_checklist_fields_invalid");
});

test("CLI rejects arguments without accepting runtime material", () => {
  const cli = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-execution-ceremony.cjs"), "forbidden"],
  { encoding: "utf8" });
  assert.equal(cli.status, 2);
  const output = JSON.parse(cli.stdout);
  assert.equal(output.status, "blocked");
  assert.deepEqual(output.blockingIssues, ["cli_arguments_forbidden"]);
  assertFixedFalse(output);
});

test("production source has no ambient external execution or Step T invocation capability", () => {
  const core = readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-live-observation-execution-ceremony.cjs"), "utf8");
  const cli = readFileSync(path.join(__dirname,
    "check-metrics-cutover-live-observation-execution-ceremony.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:child_process", "node:http", "node:https",
    "node:net", "node:tls", "node:dns", "process.env", "process.stdin",
    "runControlledLiveObservation(", "require(\"pg\"", "require('pg'",
    "fetch(", "XMLHttpRequest", "WebSocket", "exec(", "spawn("]) {
    assert.equal(core.includes(forbidden), false, forbidden);
  }
  for (const forbidden of ["node:fs", "process.env", "process.stdin",
    "runControlledLiveObservation("]) assert.equal(cli.includes(forbidden), false, forbidden);
  assert.match(core, /require\("node:crypto"\)/);
});

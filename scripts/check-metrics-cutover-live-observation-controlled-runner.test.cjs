"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const subject = require("./lib/metrics-cutover-live-observation-controlled-runner.cjs");
const fixture = require("./test-support/metrics-cutover-live-observation-controlled-runner-fixture.cjs");

function assertFixedFalse(result) {
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}
async function expectBlocked(options, issue, expectedCalls = {}) {
  const built = fixture.buildFixture(options);
  const result = await subject.runControlledLiveObservation(built.packet);
  assert.equal(result.status, "blocked");
  assert.equal(result.ok, false);
  assert.ok(result.blockingIssues.some((item) => item.includes(issue)),
    JSON.stringify(result.blockingIssues));
  for (const [name, count] of Object.entries(expectedCalls)) {
    assert.equal(built.calls.filter((item) => item === name).length, count, name);
  }
  assertFixedFalse(result);
  return { built, result };
}

test("public states, runtime sequence, zero-input and CLI states are exact", async () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_controlled_live_observation_execution",
    "controlled_live_observation_execution_completed",
    "blocked",
  ]);
  assert.deepEqual(subject.RUNTIME_SEQUENCE, [
    "step_s_package_revalidated", "runtime_capabilities_validated",
    "runner_artifact_bytes_read", "runner_artifact_digest_verified",
    "adapter_artifact_bytes_read", "adapter_artifact_digest_verified",
    "runtime_dependencies_bound", "single_use_execution_lease_acquired",
    "single_use_claim_acquired", "execution_confirmation_consumed",
    "operator_authorization_consumed", "invocation_consumed", "runner_loaded",
    "adapter_loaded", "read_only_observation_invoked_once",
    "sanitized_observation_validated", "sanitized_execution_receipt_persisted",
    "sanitized_evidence_finalized", "environment_disposal_completed",
    "controlled_live_observation_execution_completed",
  ]);
  const idle = await subject.runControlledLiveObservation();
  assert.equal(idle.status, subject.PUBLIC_STATES[0]);
  assertFixedFalse(idle);
  const cli = JSON.parse(execFileSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-controlled-runner.cjs")], { encoding: "utf8" }));
  assert.equal(cli.status, subject.PUBLIC_STATES[0]);
  const bad = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-controlled-runner.cjs"), "forbidden"],
  { encoding: "utf8" });
  assert.equal(bad.status, 2);
  assert.equal(JSON.parse(bad.stdout).status, "blocked");
});

test("complete synthetic run directly revalidates Step S and follows exact sequence", async () => {
  const built = fixture.buildFixture();
  assert.deepEqual(subject.validateDirectStepSPackage(built.stepSPackage), []);
  const result = await subject.runControlledLiveObservation(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], JSON.stringify(result.blockingIssues));
  assert.deepEqual(result.runtimeStateSequence, subject.RUNTIME_SEQUENCE);
  assert.equal(result.adapterInvocationCount, 1);
  assert.equal(result.disposalAttempted, true);
  assert.equal(result.disposalCompleted, true);
  assert.equal(built.calls.filter((item) => item === "invokeReadOnlyObservation").length, 1);
  assert.equal(built.calls.filter((item) => item === "disposeEnvironment").length, 1);
  assert.equal(built.calls.filter((item) => item === "finalizeExecutionLease").length, 1);
  assert.equal(result.executionTerminalState, "completed");
  assert.match(result.sanitizedExecutionReceipt.sanitizedExecutionReceiptHash, /^[0-9a-f]{64}$/);
  assert.match(result.sanitizedEvidence.sanitizedEvidenceHash, /^[0-9a-f]{64}$/);
  assert.equal(result.sanitizedExecutionReceipt.rawMaterialPresent, false);
  assert.equal(result.sanitizedExecutionReceipt.receiptPhase,
    "pre_disposal_candidate");
  assert.equal(result.sanitizedEvidence.rawMaterialPresent, false);
  const closure = result.sanitizedExecutionClosureReceipt;
  assert.equal(closure.disposalStatus, "completed");
  assert.equal(closure.disposalReceiptHash, "5".repeat(64));
  assert.equal(closure.leaseTerminalState, "completed");
  assert.deepEqual(closure.runtimeStateTrace, subject.RUNTIME_SEQUENCE);
  assert.equal(closure.runtimeStateTraceHash, subject.hashContract(
    "FINPLE_STEP114_2X_T_COMPLETE_RUNTIME_TRACE\0", subject.RUNTIME_SEQUENCE));
  assert.equal(closure.oneRunRunnerLaunchPackageId,
    built.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageId);
  assert.equal(closure.oneRunRunnerLaunchPackageHash,
    built.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash);
  assert.equal(closure.rawMaterialPresent, false);
  assert.match(closure.executionClosureReceiptHash, /^[0-9a-f]{64}$/);
  assertFixedFalse(result);
});

test("capability contracts use exact keys sealed descriptors and no discovery", async () => {
  const built = fixture.buildFixture();
  assert.deepEqual(subject.validateCapabilityBundle(built.packet.runtimeCapabilities), []);
  for (const capability of Object.values(built.packet.runtimeCapabilities)) {
    const descriptor = capability.descriptor;
    assert.equal(descriptor.cooperativeCancellationRequired, true);
    assert.equal(descriptor.deadlineEnforcementRequired, true);
    assert.equal(descriptor.postTimeoutOutcomeReconciliationRequired, true);
    assert.equal(descriptor.lateCompletionForbidden, false);
    assert.equal(descriptor.lateOutcomePolicy,
      "read_only_terminal_outcome_reconciliation_required");
    assert.deepEqual(descriptor.terminalOutcomes,
      ["aborted", "not_committed", "committed", "ambiguous"]);
    assert.deepEqual(descriptor.invocationContextFields,
      ["operationId", "idempotencyKey", "deadline", "abortSignal"]);
  }
  delete built.packet.runtimeCapabilities.atomicClaimStore;
  const missing = await subject.runControlledLiveObservation(built.packet);
  assert.equal(missing.status, "blocked");
  assert.ok(missing.blockingIssues.includes("runtime_capability_bundle_fields_invalid"));
  assert.deepEqual(built.calls, []);

  const extra = fixture.buildFixture();
  extra.packet.runtimeCapabilities.executionClock.endpoint = "forbidden";
  const extraResult = await subject.runControlledLiveObservation(extra.packet);
  assert.equal(extraResult.status, "blocked");
  assert.ok(extraResult.blockingIssues.some((item) => item.includes("executionClock")));
  assert.deepEqual(extra.calls, []);

  const tampered = fixture.buildFixture();
  tampered.packet.runtimeCapabilities.atomicClaimStore.descriptor = {
    ...tampered.packet.runtimeCapabilities.atomicClaimStore.descriptor,
    automaticRetryAllowed: true,
  };
  const tamperedResult = await subject.runControlledLiveObservation(tampered.packet);
  assert.equal(tamperedResult.status, "blocked");
  assert.deepEqual(tampered.calls, []);

  const cancellationDrift = fixture.buildFixture();
  const descriptor = cancellationDrift.packet.runtimeCapabilities.atomicClaimStore.descriptor;
  const driftBody = { ...descriptor, cooperativeCancellationRequired: false };
  delete driftBody.descriptorHash;
  cancellationDrift.packet.runtimeCapabilities.atomicClaimStore.descriptor = {
    ...driftBody, descriptorHash: subject.hashContract(
      "FINPLE_STEP114_2X_T_CAPABILITY_DESCRIPTOR\0", driftBody),
  };
  const cancellationResult = await subject.runControlledLiveObservation(
    cancellationDrift.packet);
  assert.equal(cancellationResult.status, "blocked");
  assert.ok(cancellationResult.blockingIssues.includes(
    "runtime_capability_descriptor_invalid:atomicClaimStore"));
  assert.deepEqual(cancellationDrift.calls, []);
});

test("capabilities receive deterministic operation identity deadline and AbortSignal", async () => {
  const contexts = [];
  const built = fixture.buildFixture({
    lease: (input, context) => {
      contexts.push(context);
      return { outcome: "acquired", leaseHash: "3".repeat(64) };
    },
    receipt: (receipt, context) => {
      contexts.push(context);
      return { outcome: "persisted",
        persistedReceiptHash: receipt.sanitizedExecutionReceiptHash };
    },
  });
  const result = await subject.runControlledLiveObservation(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], JSON.stringify(result.blockingIssues));
  assert.equal(contexts.length, 2);
  for (const context of contexts) {
    assert.deepEqual(Object.keys(context),
      ["operationId", "idempotencyKey", "deadline", "abortSignal"]);
    assert.match(context.operationId, /^step114-2x-t-operation-[0-9a-f]{64}$/);
    assert.match(context.idempotencyKey, /^[0-9a-f]{64}$/);
    assert.equal(context.deadline, "2026-07-18T00:03:27.000Z");
    assert.ok(context.abortSignal instanceof AbortSignal);
    assert.equal(context.abortSignal.aborted, false);
  }
  assert.notEqual(contexts[0].operationId, contexts[1].operationId);
});

test("capability mutability policies are role-specific and resealed drift blocks", async () => {
  const built = fixture.buildFixture();
  const policies = Object.fromEntries(Object.entries(built.packet.runtimeCapabilities)
    .map(([name, value]) => [name, value.descriptor.mutabilityPolicy.mode]));
  assert.equal(policies.readOnlyObservationTransport, "external_target_read_only");
  assert.equal(policies.singleUseExecutionLeaseStore,
    "exact_atomic_namespace_mutation_only");
  assert.equal(policies.atomicClaimStore, "exact_atomic_namespace_mutation_only");
  assert.equal(policies.executionReceiptStore,
    "sanitized_named_namespace_persistence_only");
  assert.equal(policies.evidenceFinalizer,
    "sanitized_named_namespace_persistence_only");
  assert.equal(policies.environmentDisposalCoordinator,
    "bound_disposable_environment_mutation_only");
  for (const capability of Object.values(built.packet.runtimeCapabilities)) {
    assert.equal(capability.descriptor.mutabilityPolicy.productionMutationAllowed, false);
    assert.equal(capability.descriptor.mutabilityPolicy.providerMutationAllowed, false);
  }
  const capability = built.packet.runtimeCapabilities.atomicClaimStore;
  const body = { ...capability.descriptor,
    mutabilityPolicy: { ...capability.descriptor.mutabilityPolicy,
      mode: "external_target_read_only", atomicNamespaceMutationOnly: false,
      externalTargetReadOnly: true } };
  delete body.descriptorHash;
  capability.descriptor = { ...body, descriptorHash: subject.hashContract(
    "FINPLE_STEP114_2X_T_CAPABILITY_DESCRIPTOR\0", body) };
  const result = await subject.runControlledLiveObservation(built.packet);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes(
    "runtime_capability_descriptor_invalid:atomicClaimStore"));
  assert.deepEqual(built.calls, []);
});

test("tampered Step S root blocks before every runtime capability", async () => {
  const built = fixture.buildFixture();
  built.packet.stepSPackage = fixture.clone(built.stepSPackage);
  delete built.packet.stepSPackage.runnerLaunchSummary;
  const result = await subject.runControlledLiveObservation(built.packet);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("step_s_package_fields_invalid"));
  assert.deepEqual(built.calls, []);
});

test("execution clock and both artifact digests block before lease and observation", async () => {
  await expectBlocked({ clock: "2026-07-18T00:03:39.000Z" },
    "controlled_runner_execution_clock_invalid", { acquireExecutionLease: 0,
      invokeReadOnlyObservation: 0 });
  await expectBlocked({ runnerBytes: Buffer.from("wrong runner") },
    "runner_artifact_digest_mismatch", { acquireExecutionLease: 0,
      readAdapterArtifactBytes: 0, invokeReadOnlyObservation: 0 });
  await expectBlocked({ adapterBytes: Buffer.from("wrong adapter") },
    "adapter_artifact_digest_mismatch", { acquireExecutionLease: 0,
      invokeReadOnlyObservation: 0 });
  await expectBlocked({ runnerSourceTreeSha256: "0".repeat(64) },
    "runner_artifact_digest_mismatch", { acquireExecutionLease: 0 });
  await expectBlocked({ adapterCapabilityManifestSha256: "0".repeat(64) },
    "adapter_artifact_digest_mismatch", { acquireExecutionLease: 0 });
});

test("non-acquired lease and claim fail closed without adapter invocation or retry", async () => {
  const lease = await expectBlocked({ lease: { outcome: "already_exists", leaseHash: "3".repeat(64) } },
    "single_use_execution_lease_not_acquired", { acquireExecutionLease: 1,
      acquireClaim: 0, invokeReadOnlyObservation: 0, disposeEnvironment: 1 });
  assert.equal(lease.result.failureClassification, "blocked_before_lease");
  const claim = await expectBlocked({ claim: { outcome: "ambiguous", claimReceiptHash: "4".repeat(64) } },
    "single_use_claim_not_acquired", { acquireClaim: 1,
      invokeReadOnlyObservation: 0, disposeEnvironment: 1 });
  assert.equal(claim.result.failureClassification, "blocked_before_observation");
});

test("all three single-use consumptions precede loading and stop on first failure", async () => {
  const failed = await expectBlocked({ authorization: { outcome: "already_consumed" } },
    "operator_authorization_consumption_not_consumed", { consumeExecutionConfirmation: 1,
      consumeOperatorAuthorization: 1, consumeInvocation: 0, loadRunner: 0,
      invokeReadOnlyObservation: 0 });
  assert.ok(failed.built.calls.indexOf("acquireClaim") <
    failed.built.calls.indexOf("consumeExecutionConfirmation"));
});

test("loader failures and observation failure never retry", async () => {
  await expectBlocked({ adapterLoad: { outcome: "failed", adapterHandleHash: "2".repeat(64) } },
    "adapter_load_invalid_outcome", { loadAdapter: 1, invokeReadOnlyObservation: 0 });
  const observed = await expectBlocked({ observation: { outcome: "ambiguous" } },
    "sanitized_observation_fields_invalid", { invokeReadOnlyObservation: 1,
      persistSanitizedReceipt: 0, finalizeSanitizedEvidence: 0,
      disposeEnvironment: 1 });
  assert.equal(observed.result.failureClassification, "blocked_after_observation");
});

test("kill switch is checked immediately before the only observation", async () => {
  const blocked = await expectBlocked({ killSwitch: { outcome: "blocked",
    checkedAt: fixture.CLOCK } }, "read_only_observation_kill_switch_not_clear",
  { checkKillSwitch: 1, invokeReadOnlyObservation: 0 });
  assert.ok(blocked.built.calls.indexOf("loadAdapter") <
    blocked.built.calls.indexOf("checkKillSwitch"));
});

test("sanitized observation rejects order, raw material and malformed hashes", async () => {
  const base = fixture.buildFixture().stepSPackage;
  const observation = fixture.buildObservation(base);
  assert.deepEqual(subject.validateSanitizedObservation(observation, base, fixture.CLOCK), []);
  assert.ok(subject.validateSanitizedObservation({ ...observation,
    observationSequence: [...observation.observationSequence].reverse() }, base, fixture.CLOCK)
    .includes("sanitized_observation_order_invalid"));
  assert.ok(subject.validateSanitizedObservation({ ...observation,
    rawMaterialPresent: true }, base, fixture.CLOCK)
    .includes("sanitized_observation_boundary_invalid"));
  assert.ok(subject.validateSanitizedObservation({ ...observation,
    hashOutputs: { ...observation.hashOutputs,
      [Object.keys(observation.hashOutputs)[0]]: "not-a-hash" } }, base, fixture.CLOCK)
    .includes("sanitized_observation_hash_outputs_invalid"));
  assert.ok(subject.validateSanitizedObservation({ ...observation,
    destinationCount: 2 }, base, fixture.CLOCK)
    .includes("sanitized_observation_boundary_invalid"));
});

test("receipt and evidence failures block after one observation and still dispose", async () => {
  await expectBlocked({ receipt: { outcome: "ambiguous", persistedReceiptHash: "0".repeat(64) } },
    "sanitized_receipt_persistence_invalid_outcome", { invokeReadOnlyObservation: 1,
      persistSanitizedReceipt: 1, finalizeSanitizedEvidence: 0, disposeEnvironment: 1 });
  await expectBlocked({ evidence: { outcome: "failed", finalizedEvidenceHash: "0".repeat(64) } },
    "sanitized_evidence_finalization_invalid_outcome", { invokeReadOnlyObservation: 1,
      persistSanitizedReceipt: 1, finalizeSanitizedEvidence: 1, disposeEnvironment: 1 });
});

test("disposal uncertainty overrides success and post-observation failures", async () => {
  const failed = await expectBlocked({ disposal: { outcome: "ambiguous",
    disposalReceiptHash: "5".repeat(64) } }, "environment_disposal_invalid_outcome",
  { invokeReadOnlyObservation: 1, disposeEnvironment: 1 });
  assert.equal(failed.result.failureClassification, "disposal_uncertain");
  assert.equal(failed.result.disposalAttempted, true);
  assert.equal(failed.result.disposalCompleted, false);
  assert.equal(failed.result.executionTerminalState, "disposal_uncertain");
  assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
});

test("ambiguous atomic lease terminalization blocks completed publication", async () => {
  const failed = await expectBlocked({ terminal: { outcome: "ambiguous",
    terminalState: "completed" } }, "execution_lease_terminalization_invalid_outcome",
  { invokeReadOnlyObservation: 1, disposeEnvironment: 1, finalizeExecutionLease: 1 });
  assert.equal(failed.result.failureClassification, "blocked_after_observation");
});

test("hanging bound capability times out once then disposes and terminalizes", async () => {
  const failed = await expectBlocked({ claim: () => new Promise(() => {}) },
    "claim_acquisition_timeout_aborted", { acquireClaim: 1,
      reconcileAtomicClaimStore: 1, invokeReadOnlyObservation: 0,
      disposeEnvironment: 1, finalizeExecutionLease: 1 });
  assert.equal(failed.result.failureClassification, "blocked_before_observation");
});

test("hanging observation times out without a second invocation", async () => {
  const failed = await expectBlocked({ observation: () => new Promise(() => {}) },
    "read_only_observation_timeout_aborted", { invokeReadOnlyObservation: 1,
      reconcileObservationTransport: 1,
      persistSanitizedReceipt: 0, disposeEnvironment: 1,
      finalizeExecutionLease: 1 });
  assert.equal(failed.result.adapterInvocationCount, 1);
  assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
});

test("hanging disposal becomes disposal_uncertain without retry or closure receipt", async () => {
  const failed = await expectBlocked({ disposal: () => new Promise(() => {}) },
    "environment_disposal_timeout_aborted", { invokeReadOnlyObservation: 1,
      reconcileEnvironmentDisposal: 1,
      disposeEnvironment: 1, finalizeExecutionLease: 1 });
  assert.equal(failed.result.failureClassification, "disposal_uncertain");
  assert.equal(failed.result.executionTerminalState, "disposal_uncertain");
  assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
});

test("late committed lease is reconciled and terminalized without claim or retry", async () => {
  const failed = await expectBlocked({
    lease: () => new Promise(() => {}),
    leaseStoreReconciliation: { outcome: "committed", acknowledgment: "settled",
      resourceHash: "3".repeat(64) },
  }, "execution_lease_acquisition_timeout_committed", {
    acquireExecutionLease: 1, reconcileExecutionLeaseStore: 1,
    acquireClaim: 0, invokeReadOnlyObservation: 0, disposeEnvironment: 1,
    finalizeExecutionLease: 1,
  });
  assert.equal(failed.result.adapterInvocationCount, 0);
  assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
});

test("late committed claim is reconciled and cannot reach observation", async () => {
  const failed = await expectBlocked({
    claim: () => new Promise(() => {}),
    claimReconciliation: { outcome: "committed", acknowledgment: "settled",
      resourceHash: "4".repeat(64) },
  }, "claim_acquisition_timeout_committed", {
    acquireClaim: 1, reconcileAtomicClaimStore: 1,
    invokeReadOnlyObservation: 0, disposeEnvironment: 1,
    finalizeExecutionLease: 1,
  });
  assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
});

test("observation abort acknowledgment precedes disposal and blocks delayed side effect", async () => {
  let delayedSideEffectCount = 0;
  const failed = await expectBlocked({
    observation: (input, context) => new Promise((resolve) => {
      const timer = setTimeout(() => {
        delayedSideEffectCount++;
        resolve(input);
      }, 5200);
      context.abortSignal.addEventListener("abort", () => clearTimeout(timer), { once: true });
    }),
  }, "read_only_observation_timeout_aborted", {
    invokeReadOnlyObservation: 1, reconcileObservationTransport: 1,
    disposeEnvironment: 1,
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(delayedSideEffectCount, 0);
  assert.ok(failed.built.calls.indexOf("reconcileObservationTransport") <
    failed.built.calls.indexOf("disposeEnvironment"));
  assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
});

test("abort-ignoring observation becomes ambiguous and disposal is forbidden", async () => {
  const failed = await expectBlocked({
    observation: () => new Promise(() => {}),
    observationReconciliation: () => new Promise(() => {}),
  }, "read_only_observation_timeout_ambiguous", {
    invokeReadOnlyObservation: 1, reconcileObservationTransport: 1,
    disposeEnvironment: 0, finalizeExecutionLease: 1,
  });
  assert.equal(failed.result.failureClassification, "disposal_uncertain");
  assert.equal(failed.result.manualReviewRequired, true);
  assert.equal(failed.result.disposalAttempted, false);
  assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
});

test("mid-run effective expiry blocks the next capability before claim", async () => {
  const expiry = fixture.buildFixture().stepSPackage.oneRunRunnerLaunchPackage.earliestExpiry;
  const failed = await expectBlocked({ clockSequence: [fixture.CLOCK, fixture.CLOCK, expiry] },
    "pre_claim_clock_effective_expiry_reached", {
      acquireExecutionLease: 1, acquireClaim: 0, invokeReadOnlyObservation: 0,
      disposeEnvironment: 1, finalizeExecutionLease: 1,
    });
  assert.equal(failed.result.adapterInvocationCount, 0);
});

test("late observation resolution or rejection never publishes a closure or retries", async () => {
  for (const rejects of [false, true]) {
    const failed = await expectBlocked({
      observation: () => new Promise((resolve, reject) => setTimeout(() => {
        if (rejects) reject(new Error("sensitive late failure"));
        else resolve({ late: true });
      }, 5200)),
      observationReconciliation: { outcome: "ambiguous", acknowledgment: "settled",
        resourceHash: null },
    }, "read_only_observation_timeout_ambiguous", {
      invokeReadOnlyObservation: 1, reconcileObservationTransport: 1,
      disposeEnvironment: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(failed.built.calls.filter((item) =>
      item === "invokeReadOnlyObservation").length, 1);
    assert.deepEqual(failed.result.sanitizedExecutionClosureReceipt, {});
    assert.equal(JSON.stringify(failed.result).includes("sensitive late failure"), false);
  }
});

test("external sensitive Error details are replaced with a fixed issue code", async () => {
  const sensitive = "endpoint=db.internal credential=secret token=abc certificate=x host=h db=prod";
  const failed = await expectBlocked({ runnerLoad: () => { throw new Error(sensitive); } },
    "runner_load_failed", { loadRunner: 1, invokeReadOnlyObservation: 0,
      disposeEnvironment: 1, finalizeExecutionLease: 1 });
  const serialized = JSON.stringify(failed.result);
  assert.equal(serialized.includes(sensitive), false);
  for (const fragment of ["db.internal", "secret", "token=abc", "db=prod"]) {
    assert.equal(serialized.includes(fragment), false);
  }
  assert.deepEqual(failed.result.blockingIssues, ["runner_load_failed"]);
});

test("production core has no ambient filesystem network DB provider or process capability", () => {
  const source = readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-live-observation-controlled-runner.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:child_process", "node:http", "node:https",
    "node:net", "node:tls", "node:dns", "process.env", "process.stdin", "require(\"pg\"",
    "require('pg'", "Date.now(", "new Date()"] ) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.match(source, /require\("node:crypto"\)/);
});

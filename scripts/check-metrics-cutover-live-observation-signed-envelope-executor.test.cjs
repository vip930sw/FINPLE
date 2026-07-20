"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const stepT = require("./lib/metrics-cutover-live-observation-controlled-runner.cjs");
const subject = require("./lib/metrics-cutover-live-observation-signed-envelope-executor.cjs");
const fixture = require("./test-support/metrics-cutover-live-observation-signed-envelope-executor-fixture.cjs");

const BASE = fixture.buildFixture();
let SUCCESS_STEP_T_RESULT;
function packetWithStore(options = {}, overrides = {}) {
  const envelopeStore = fixture.buildEnvelopeStore(options);
  return { packet: { ...BASE.packet,
    singleUseExternalExecutionEnvelopeStore: envelopeStore.store, ...overrides },
  envelopeStore };
}
async function withRunnerResult(value, run) {
  const original = stepT.runControlledLiveObservation;
  stepT.runControlledLiveObservation = async () => value;
  try { return await run(); } finally { stepT.runControlledLiveObservation = original; }
}
async function withRunnerFunction(implementation, run) {
  const original = stepT.runControlledLiveObservation;
  stepT.runControlledLiveObservation = implementation;
  try { return await run(); } finally { stepT.runControlledLiveObservation = original; }
}
function canonicalBlockedStepTResult({ adapterInvocationCount = 0,
  failureClassification = adapterInvocationCount ? "blocked_after_observation" :
    "blocked_before_observation", disposalAttempted = true,
  disposalCompleted = true } = {}) {
  const observationReached = adapterInvocationCount === 1;
  return { ...SUCCESS_STEP_T_RESULT, ok: false, status: "blocked",
    failureClassification,
    executionTerminalState: failureClassification === "disposal_uncertain"
      ? "disposal_uncertain" : adapterInvocationCount
        ? "failed_after_invocation" : "failed_before_invocation",
    blockingIssues: ["synthetic_step_t_blocked"], manualReviewRequired: true,
    runtimeStateSequence: stepT.RUNTIME_SEQUENCE.slice(0, observationReached ? 15 : 8),
    adapterInvocationCount, disposalAttempted, disposalCompleted,
    sanitizedExecutionReceipt: {}, sanitizedEvidence: {},
    sanitizedExecutionClosureReceipt: {} };
}

test("zero input returns exact awaiting state with every authority false", async () => {
  const result = await subject.executeSignedEnvelopeOnce();
  assert.equal(result.status, "awaiting_explicit_signed_envelope_execution");
  assert.equal(result.ok, false);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});

test("valid signed envelope invokes Step T exactly once and seals canonical closeout", async () => {
  const original = stepT.runControlledLiveObservation;
  let observedRunnerCalls = 0;
  stepT.runControlledLiveObservation = async (packet) => {
    observedRunnerCalls++;
    SUCCESS_STEP_T_RESULT = await original(packet);
    return SUCCESS_STEP_T_RESULT;
  };
  let result;
  try { result = await subject.executeSignedEnvelopeOnce(BASE.packet); }
  finally { stepT.runControlledLiveObservation = original; }
  assert.equal(result.status,
    "signed_envelope_controlled_observation_execution_completed");
  assert.deepEqual(result.executionSequence, subject.EXECUTION_SEQUENCE);
  assert.equal(result.envelopeClaimAcquisitionCount, 1);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
  assert.equal(result.stepTRunnerInvocationCount, 1);
  assert.equal(result.adapterInvocationCount, 1);
  assert.equal(result.envelopeClaimTerminalState, "completed");
  assert.equal(observedRunnerCalls, 1);
  assert.deepEqual(BASE.envelopeStore.calls,
    ["acquireExecutionEnvelopeClaim", "finalizeExecutionEnvelopeClaim"]);
  assert.deepEqual(subject.validateCompletedStepTResult(SUCCESS_STEP_T_RESULT,
    BASE.packet.stepVPacket.stepUPacket.stepSPackage), []);
  assert.equal(result.stepTExecutionSummary.resultKind, "completed");
  assert.equal(Object.hasOwn(result, "stepTExecutionResult"), false);
  const claim = subject.buildEnvelopeClaim(
    BASE.packet.stepVResult.singleUseExecutionEnvelope,
    BASE.packet.stepVPacket.stepUPacket,
    BASE.packet.stepVPacket.stepUCeremonyResult);
  assert.equal(result.executionCloseoutReceipt.executionEnvelopeClaimId,
    claim.executionEnvelopeClaimId);
  assert.equal(result.executionCloseoutReceipt.disposalStatus, "completed");
  assert.equal(result.executionCloseoutReceipt.rawMaterialPresent, false);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.executionCloseoutReceipt));
});

test("Step V, U, T, S and bound artifact tampering blocks before envelope claim", async () => {
  const mutations = [
    ["step_v_envelope", (value) => { value.singleUseExecutionEnvelope.operationPlanHash = "0".repeat(64); }],
    ["step_u_material", (value) => { value.singleUseExecutionEnvelope.stepURuntimeMaterialManifestHash = "1".repeat(64); }],
    ["step_t_plan", (value) => { value.singleUseExecutionEnvelope.operationPlan[0].operationId += "-drift"; }],
    ["step_s_launch", (value) => { value.singleUseExecutionEnvelope.oneRunRunnerLaunchPackageHash = "2".repeat(64); }],
    ["inventory", (value) => { value.singleUseExecutionEnvelope.stepURuntimeMaterialInventoryHash = "3".repeat(64); }],
    ["evidence", (value) => { value.singleUseExecutionEnvelope.stepUEvidenceHandoffManifestHash = "4".repeat(64); }],
  ];
  for (const [name, mutate] of mutations) {
    const altered = fixture.clone(BASE.packet.stepVResult); mutate(altered);
    const { packet, envelopeStore } = packetWithStore({}, { stepVResult: altered });
    const result = await subject.executeSignedEnvelopeOnce(packet);
    assert.equal(result.status, "blocked", name);
    assert.equal(result.failureClassification, "blocked_before_envelope_claim", name);
    assert.equal(result.stepTRunnerInvocationCount, 0, name);
    assert.deepEqual(envelopeStore.calls, [], name);
  }
});

test("capability descriptor drift and expiry equality block before claim", async () => {
  const drift = packetWithStore({ descriptorOverrides: { automaticRetryAllowed: true } });
  const driftResult = await subject.executeSignedEnvelopeOnce(drift.packet);
  assert.equal(driftResult.status, "blocked");
  assert.deepEqual(drift.envelopeStore.calls, []);
  const atExpiry = packetWithStore({}, { executionClockInstant:
    BASE.packet.stepVResult.singleUseExecutionEnvelope.effectiveExecutionExpiresAt });
  const expiryResult = await subject.executeSignedEnvelopeOnce(atExpiry.packet);
  assert.equal(expiryResult.blockingIssues[0], "execution_clock_invalid_or_expired");
  assert.deepEqual(atExpiry.envelopeStore.calls, []);
});

test("already-consumed, failed, and ambiguous claims never invoke Step T", async () => {
  for (const outcome of ["already_consumed", "failed", "ambiguous"]) {
    const built = packetWithStore({ acquire: { outcome, claimHash: null } });
    const result = await subject.executeSignedEnvelopeOnce(built.packet);
    assert.equal(result.status, "blocked");
    assert.equal(result.stepTRunnerInvocationCount, 0);
    assert.equal(result.envelopeClaimTerminalizationCount, 0);
    assert.deepEqual(built.envelopeStore.calls, ["acquireExecutionEnvelopeClaim"]);
    assert.equal(result.manualReviewRequired, outcome === "ambiguous");
  }
});

test("timeout with late committed reconciliation runs once and terminalizes", async () => {
  const operationContexts = [];
  const built = packetWithStore({ acquireHang: true,
    operationContexts,
    reconciliation: { outcome: "committed", resourceHash: "6".repeat(64) } });
  const result = await subject.executeSignedEnvelopeOnce(built.packet);
  assert.equal(result.status,
    "signed_envelope_controlled_observation_execution_completed");
  assert.equal(result.stepTRunnerInvocationCount, 1);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
  assert.deepEqual(built.envelopeStore.calls, ["acquireExecutionEnvelopeClaim",
    "reconcileOperationOutcome", "finalizeExecutionEnvelopeClaim"]);
  const [primary, reconciliation] = operationContexts;
  assert.equal(primary.name, "acquireExecutionEnvelopeClaim");
  assert.equal(reconciliation.name, "reconcileOperationOutcome");
  assert.notEqual(primary.abortSignal, reconciliation.abortSignal);
  assert.equal(primary.abortSignal.aborted, true);
  assert.equal(reconciliation.abortSignal.aborted, false);
  assert.ok(Date.parse(reconciliation.deadline) > Date.parse(primary.deadline));
  assert.equal(primary.operationId, reconciliation.operationId);
  assert.equal(primary.idempotencyKey, reconciliation.idempotencyKey);
});

test("timeout with ambiguous reconciliation blocks without Step T", async () => {
  const built = packetWithStore({ acquireHang: true,
    reconciliation: { outcome: "ambiguous", resourceHash: null } });
  const result = await subject.executeSignedEnvelopeOnce(built.packet);
  assert.equal(result.failureClassification, "execution_outcome_uncertain");
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.stepTRunnerInvocationCount, 0);
  assert.equal(result.envelopeClaimTerminalizationCount, 0);
});

test("acquire and finalize reconciliation permanent hangs are bounded and ambiguous", async () => {
  const acquire = packetWithStore({ acquireHang: true, reconciliationHang: true });
  const acquireResult = await subject.executeSignedEnvelopeOnce(acquire.packet);
  assert.equal(acquireResult.failureClassification, "execution_outcome_uncertain");
  assert.equal(acquireResult.manualReviewRequired, true);
  assert.equal(acquireResult.stepTRunnerInvocationCount, 0);
  assert.deepEqual(acquire.envelopeStore.calls,
    ["acquireExecutionEnvelopeClaim", "reconcileOperationOutcome"]);

  const finalize = packetWithStore({ finalizeHang: true, reconciliationHang: true });
  const finalizeResult = await subject.executeSignedEnvelopeOnce(finalize.packet);
  assert.equal(finalizeResult.failureClassification, "execution_outcome_uncertain");
  assert.equal(finalizeResult.manualReviewRequired, true);
  assert.equal(finalizeResult.stepTRunnerInvocationCount, 1);
  assert.equal(finalizeResult.envelopeClaimTerminalizationCount, 1);
  assert.deepEqual(finalizeResult.executionCloseoutReceipt, {});
  assert.deepEqual(finalize.envelopeStore.calls,
    ["acquireExecutionEnvelopeClaim", "finalizeExecutionEnvelopeClaim",
      "reconcileOperationOutcome"]);
});

test("reconciliation outcome resourceHash contract is exact before Step T", async () => {
  for (const reconciliation of [
    { outcome: "committed", resourceHash: null },
    { outcome: "committed", resourceHash: "malformed" },
    { outcome: "aborted", resourceHash: "6".repeat(64) },
    { outcome: "not_committed", resourceHash: "6".repeat(64) },
  ]) {
    const built = packetWithStore({ acquireHang: true, reconciliation });
    const result = await subject.executeSignedEnvelopeOnce(built.packet);
    assert.equal(result.failureClassification, "execution_outcome_uncertain");
    assert.equal(result.manualReviewRequired, true);
    assert.equal(result.stepTRunnerInvocationCount, 0);
    assert.equal(built.envelopeStore.calls.filter((name) =>
      name === "reconcileOperationOutcome").length, 1);
  }
});

test("terminalization committed reconciliation requires a SHA-256 hash", async () => {
  const built = packetWithStore({ finalizeHang: true,
    reconciliation: { outcome: "committed", resourceHash: null } });
  const result = await subject.executeSignedEnvelopeOnce(built.packet);
  assert.equal(result.failureClassification, "execution_outcome_uncertain");
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.stepTRunnerInvocationCount, 1);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
  assert.deepEqual(result.executionCloseoutReceipt, {});
});

test("Step T blocked before or after observation is terminalized without retry", async () => {
  for (const adapterInvocationCount of [0, 1]) {
    const fake = canonicalBlockedStepTResult({ adapterInvocationCount });
    assert.deepEqual(subject.validateBlockedStepTResult(fake), []);
    const built = packetWithStore();
    const result = await withRunnerResult(fake,
      () => subject.executeSignedEnvelopeOnce(built.packet));
    assert.equal(result.status, "blocked");
    assert.equal(result.stepTRunnerInvocationCount, 1);
    assert.equal(result.envelopeClaimTerminalizationCount, 1);
    assert.deepEqual(result.executionCloseoutReceipt, {});
    assert.equal(result.blockingIssues[0], "step_t_canonical_blocked_result");
    assert.equal(result.stepTExecutionSummary.resultKind, "blocked");
    assert.equal(built.envelopeStore.calls.filter((name) =>
      name === "finalizeExecutionEnvelopeClaim").length, 1);
  }
});

test("Step T runner throw is uncertain, terminalized once, and sanitized", async () => {
  const sensitive = "endpoint=private-db token=secret credential=raw";
  const built = packetWithStore();
  const result = await withRunnerFunction(async () => { throw new Error(sensitive); },
    () => subject.executeSignedEnvelopeOnce(built.packet));
  const serialized = JSON.stringify(result);
  assert.equal(result.failureClassification, "execution_outcome_uncertain");
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.stepTRunnerInvocationCount, 1);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
  assert.equal(result.blockingIssues[0], "step_t_execution_result_uncertain");
  assert.equal(serialized.includes(sensitive), false);
  assert.deepEqual(result.executionCloseoutReceipt, {});
});

test("disposal_uncertain has priority even with adapter invocation count zero", async () => {
  const fake = canonicalBlockedStepTResult({ adapterInvocationCount: 0,
    failureClassification: "disposal_uncertain", disposalAttempted: true,
    disposalCompleted: false });
  assert.deepEqual(subject.validateBlockedStepTResult(fake), []);
  const built = packetWithStore();
  const result = await withRunnerResult(fake,
    () => subject.executeSignedEnvelopeOnce(built.packet));
  assert.equal(result.failureClassification, "execution_outcome_uncertain");
  assert.equal(result.envelopeClaimTerminalState, "execution_outcome_uncertain");
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
  assert.deepEqual(result.executionCloseoutReceipt, {});
});

test("canonical blocked and malformed Step T results remain distinguishable", async () => {
  const canonical = packetWithStore();
  const canonicalResult = await withRunnerResult(canonicalBlockedStepTResult(),
    () => subject.executeSignedEnvelopeOnce(canonical.packet));
  assert.equal(canonicalResult.failureClassification, "blocked_after_runner_invocation");
  assert.equal(canonicalResult.blockingIssues[0], "step_t_canonical_blocked_result");
  assert.equal(canonicalResult.stepTExecutionSummary.resultKind, "blocked");

  const malformed = packetWithStore();
  const malformedRaw = { status: "blocked", adapterInvocationCount: 0,
    sensitiveField: "credential=raw endpoint=private-db" };
  const malformedResult = await withRunnerResult(malformedRaw,
    () => subject.executeSignedEnvelopeOnce(malformed.packet));
  const serialized = JSON.stringify(malformedResult);
  assert.equal(malformedResult.failureClassification, "execution_outcome_uncertain");
  assert.equal(malformedResult.blockingIssues[0], "step_t_execution_result_uncertain");
  assert.equal(malformedResult.stepTExecutionSummary.resultKind, "uncertain");
  assert.equal(malformedResult.manualReviewRequired, true);
  assert.equal(serialized.includes("credential=raw"), false);
  assert.equal(serialized.includes("private-db"), false);
  assert.equal(Object.hasOwn(malformedResult, "stepTExecutionResult"), false);
  assert.equal(malformedResult.envelopeClaimTerminalizationCount, 1);
});

test("malformed Step T receipt, evidence, closure, disposal, or lease blocks closeout", async () => {
  const cases = [
    (v) => { v.sanitizedExecutionReceipt.sanitizedExecutionReceiptHash = "0".repeat(64); },
    (v) => { v.sanitizedEvidence.sanitizedEvidenceHash = "0".repeat(64); },
    (v) => { v.sanitizedExecutionClosureReceipt.executionClosureReceiptHash = "0".repeat(64); },
    (v) => { v.disposalCompleted = false; },
    (v) => { v.executionTerminalState = "disposal_uncertain"; },
  ];
  for (const mutate of cases) {
    const fake = fixture.clone(SUCCESS_STEP_T_RESULT); mutate(fake);
    const built = packetWithStore();
    const result = await withRunnerResult(fake,
      () => subject.executeSignedEnvelopeOnce(built.packet));
    assert.equal(result.status, "blocked");
    assert.deepEqual(result.executionCloseoutReceipt, {});
    assert.equal(result.stepTRunnerInvocationCount, 1);
    assert.equal(result.envelopeClaimTerminalizationCount, 1);
    assert.equal(result.failureClassification, "execution_outcome_uncertain");
    assert.equal(result.manualReviewRequired, true);
    assert.equal(result.stepTExecutionSummary.resultKind, "uncertain");
  }
});

test("terminalization ambiguity is uncertain and never seals completed closeout", async () => {
  const built = packetWithStore({ finalize: { outcome: "ambiguous",
    terminalState: "completed", terminalizationHash: null } });
  const result = await subject.executeSignedEnvelopeOnce(built.packet);
  assert.equal(result.failureClassification, "execution_outcome_uncertain");
  assert.equal(result.manualReviewRequired, true);
  assert.deepEqual(result.executionCloseoutReceipt, {});
  assert.equal(result.stepTRunnerInvocationCount, 1);
  assert.equal(result.stepTExecutionSummary.resultKind, "completed");
});

test("the same envelope store rejects a second execution without a second runner call", async () => {
  const built = packetWithStore();
  const first = await subject.executeSignedEnvelopeOnce(built.packet);
  const second = await subject.executeSignedEnvelopeOnce(built.packet);
  assert.equal(first.ok, true);
  assert.equal(second.status, "blocked");
  assert.equal(second.stepTRunnerInvocationCount, 0);
  assert.equal(built.envelopeStore.calls.filter((name) =>
    name === "acquireExecutionEnvelopeClaim").length, 2);
  assert.equal(built.envelopeStore.calls.filter((name) =>
    name === "finalizeExecutionEnvelopeClaim").length, 1);
});

test("closeout canonical reconstruction rejects tampering", () => {
  const claim = subject.buildEnvelopeClaim(
    BASE.packet.stepVResult.singleUseExecutionEnvelope,
    BASE.packet.stepVPacket.stepUPacket,
    BASE.packet.stepVPacket.stepUCeremonyResult);
  const receipt = subject.buildCloseoutReceipt(BASE.packet, claim, "7".repeat(64),
    SUCCESS_STEP_T_RESULT);
  assert.deepEqual(subject.validateCloseoutReceipt(receipt, BASE.packet, claim,
    "7".repeat(64), SUCCESS_STEP_T_RESULT), []);
  assert.notDeepEqual(subject.validateCloseoutReceipt({ ...receipt,
    destinationCount: 2 }, BASE.packet, claim, "7".repeat(64),
  SUCCESS_STEP_T_RESULT), []);
});

test("external exception detail is replaced with a fixed sanitized issue code", async () => {
  const sensitive = "token=secret endpoint=private-db.example credential=raw";
  const built = packetWithStore({ acquireError: sensitive });
  const result = await subject.executeSignedEnvelopeOnce(built.packet);
  const serialized = JSON.stringify(result);
  assert.equal(result.status, "blocked");
  assert.equal(serialized.includes(sensitive), false);
  assert.equal(serialized.includes("private-db"), false);
  assert.deepEqual(result.blockingIssues, ["execution_envelope_claim_not_acquired"]);
});

test("successful output is deterministic, recursively frozen, and sanitized", async () => {
  const one = packetWithStore(); const two = packetWithStore();
  const left = await subject.executeSignedEnvelopeOnce(one.packet);
  const right = await subject.executeSignedEnvelopeOnce(two.packet);
  assert.equal(subject.canonicalJson(left), subject.canonicalJson(right));
  assert.ok(Object.isFrozen(left));
  assert.ok(Object.isFrozen(left.stepTExecutionSummary));
  assert.equal(/token=|credential=|private-db|postgres(?:ql)?:\/\/|BEGIN PRIVATE|raw endpoint/i.test(
    subject.canonicalJson(left)), false);
});

test("CLI defaults to awaiting, rejects arguments, and has no automatic trigger", () => {
  const script = path.join(__dirname,
    "check-metrics-cutover-live-observation-signed-envelope-executor.cjs");
  const idle = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(idle.status, 0);
  assert.equal(JSON.parse(idle.stdout).status,
    "awaiting_explicit_signed_envelope_execution");
  const blocked = spawnSync(process.execPath, [script, "--packet"], { encoding: "utf8" });
  assert.equal(blocked.status, 1);
  assert.deepEqual(JSON.parse(blocked.stdout).blockingIssues,
    ["step_w_cli_arguments_forbidden"]);
});

test("source boundary contains no ambient discovery, route, worker, or external client", () => {
  const source = fs.readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-live-observation-signed-envelope-executor.cjs"), "utf8");
  for (const forbidden of ["process.env", "node:fs", "node:http", "node:https",
    "node:net", "node:tls", "node:dns", "require(\"pg\")", "fetch(",
    "setInterval(", "cron.schedule", "express", "router."]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

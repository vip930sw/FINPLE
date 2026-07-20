"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const stepT = require("./lib/metrics-cutover-live-observation-controlled-runner.cjs");
const stepW = require("./lib/metrics-cutover-live-observation-signed-envelope-executor.cjs");
const subject = require("./lib/metrics-cutover-controlled-observation-evidence-reconciliation.cjs");
const fixture = require("./test-support/metrics-cutover-controlled-observation-evidence-reconciliation-fixture.cjs");

const BASE = fixture.buildFixture();
function packetWith(overrides = {}) { return { ...BASE.packet, ...overrides }; }
function resealObservation(observation) {
  const stepSPackage = BASE.packet.stepWPacket.stepVPacket.stepUPacket.stepSPackage;
  const stepTResult = fixture.buildCompletedStepTResult(stepSPackage, observation);
  const closeout = stepW.buildCloseoutReceipt(BASE.packet.stepWPacket, BASE.claim,
    fixture.TERMINALIZATION_HASH, stepTResult);
  const stepWResult = stepW.safeResult(stepW.PUBLIC_STATES[1], {
    executionSequence: [...stepW.EXECUTION_SEQUENCE],
    envelopeClaimAcquisitionCount: 1, envelopeClaimTerminalizationCount: 1,
    stepTRunnerInvocationCount: 1, adapterInvocationCount: 1,
    envelopeClaimTerminalState: "completed",
    stepTExecutionSummary: stepW.sanitizedStepTSummary("completed", stepTResult),
    executionCloseoutReceipt: closeout,
  });
  return packetWith({ persistedSanitizedObservation: observation,
    stepTCompletedResult: stepTResult, stepWResult });
}

test("zero input and zero-argument CLI return exact awaiting state", () => {
  const result = subject.evaluateControlledObservationEvidence();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  const cli = spawnSync(process.execPath,
    [path.join(__dirname,
      "check-metrics-cutover-controlled-observation-evidence-reconciliation.cjs")],
    { encoding: "utf8" });
  assert.equal(cli.status, 0);
  assert.equal(JSON.parse(cli.stdout).status, subject.PUBLIC_STATES[0]);
});

test("complete synthetic Step W closeout reconciles without capability invocation", () => {
  const result = subject.evaluateControlledObservationEvidence(BASE.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  assert.equal(result.reconciledEvidenceManifest.evidenceReconciled, true);
  assert.equal(result.productionCutoverReadinessPackage
    .eligibleForSeparateProductionCutoverApproval, true);
  assert.equal(result.productionCutoverReadinessPackage.productionWriteAuthorized, false);
  assert.deepEqual(BASE.stepWFixture.envelopeStore.calls, []);
  assert.deepEqual(BASE.stepWFixture.runnerCalls, []);
});

test("Step W closeout, claim, terminalization, and Step T artifact tampering block", () => {
  const closeout = fixture.clone(BASE.packet.stepWResult);
  closeout.executionCloseoutReceipt.executionCloseoutReceiptHash = "0".repeat(64);
  assert.equal(subject.evaluateControlledObservationEvidence(
    packetWith({ stepWResult: closeout })).status, "blocked");
  assert.equal(subject.evaluateControlledObservationEvidence(packetWith({
    envelopeClaimTerminalizationHash: "1".repeat(64),
  })).status, "blocked");
  const t = fixture.clone(BASE.packet.stepTCompletedResult);
  t.sanitizedEvidence.sanitizedEvidenceHash = "2".repeat(64);
  assert.equal(subject.evaluateControlledObservationEvidence(
    packetWith({ stepTCompletedResult: t })).status, "blocked");
});

test("Step V/U/T/S plan, material, inventory, evidence, approval, and launch tampering block", () => {
  const vResult = fixture.clone(BASE.packet.stepWPacket.stepVResult);
  vResult.singleUseExecutionEnvelope.operationPlanHash = "3".repeat(64);
  const wPacket = { ...BASE.packet.stepWPacket, stepVResult: vResult };
  const result = subject.evaluateControlledObservationEvidence(packetWith({ stepWPacket: wPacket }));
  assert.equal(result.status, "blocked");
  assert.equal(result.failureClassification,
    "blocked_before_closeout_validation");
});

test("blocked or uncertain Step W public results are never accepted", () => {
  for (const classification of ["blocked_after_runner_invocation",
    "execution_outcome_uncertain"]) {
    const result = stepW.safeResult(stepW.PUBLIC_STATES[2], {
      failureClassification: classification,
      blockingIssues: ["synthetic_block"], manualReviewRequired: true,
    });
    const evaluated = subject.evaluateControlledObservationEvidence(
      packetWith({ stepWResult: result }));
    assert.equal(evaluated.status, "blocked");
  }
});

test("missing, extra, reordered, malformed, and unknown observation fields block", () => {
  const missing = fixture.clone(BASE.packet.persistedSanitizedObservation);
  delete missing.hashOutputs;
  const extra = { ...BASE.packet.persistedSanitizedObservation, unknownObservedField: "x" };
  const reordered = fixture.clone(BASE.packet.persistedSanitizedObservation);
  reordered.hashOutputs = Object.fromEntries(Object.entries(reordered.hashOutputs).reverse());
  const malformed = fixture.clone(BASE.packet.persistedSanitizedObservation);
  malformed.hashOutputs[Object.keys(malformed.hashOutputs)[0]] = "not-a-hash";
  for (const observation of [missing, extra, reordered, malformed]) {
    assert.equal(subject.evaluateControlledObservationEvidence(
      packetWith({ persistedSanitizedObservation: observation })).status, "blocked");
  }
});

test("observation digest mismatch blocks", () => {
  const observation = fixture.clone(BASE.packet.persistedSanitizedObservation);
  observation.completedAt = "2026-07-18T00:03:23.000Z";
  const result = subject.evaluateControlledObservationEvidence(
    packetWith({ persistedSanitizedObservation: observation }));
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("observation_digest_mismatch") ||
    result.blockingIssues.includes("sanitized_observation_chronology_invalid"));
});

test("normally resealed hash and timestamp output drift still blocks upstream reconciliation", () => {
  const hashDrift = fixture.clone(BASE.packet.persistedSanitizedObservation);
  hashDrift.hashOutputs[Object.keys(hashDrift.hashOutputs)[0]] = "9".repeat(64);
  const hashResult = subject.evaluateControlledObservationEvidence(
    resealObservation(hashDrift));
  assert.equal(hashResult.status, "blocked");
  assert.equal(hashResult.failureClassification,
    "blocked_during_observation_reconciliation");
  const timeDrift = fixture.clone(BASE.packet.persistedSanitizedObservation);
  timeDrift.timestampOutputs[Object.keys(timeDrift.timestampOutputs)[0]] =
    "2026-07-18T00:03:21.000Z";
  const timeResult = subject.evaluateControlledObservationEvidence(
    resealObservation(timeDrift));
  assert.equal(timeResult.status, "blocked");
});

test("destination, observation, runner, and adapter counts other than one block", () => {
  const observation = fixture.clone(BASE.packet.persistedSanitizedObservation);
  observation.destinationCount = 2;
  assert.equal(subject.evaluateControlledObservationEvidence(
    packetWith({ persistedSanitizedObservation: observation })).status, "blocked");
  const w = fixture.clone(BASE.packet.stepWResult);
  w.stepTRunnerInvocationCount = 2;
  assert.equal(subject.evaluateControlledObservationEvidence(
    packetWith({ stepWResult: w })).status, "blocked");
});

test("incomplete disposal, lease, or claim terminalization blocks", () => {
  const t = fixture.clone(BASE.packet.stepTCompletedResult);
  t.disposalCompleted = false;
  assert.equal(subject.evaluateControlledObservationEvidence(
    packetWith({ stepTCompletedResult: t })).status, "blocked");
  const closure = fixture.clone(BASE.packet.stepTCompletedResult);
  closure.sanitizedExecutionClosureReceipt.leaseTerminalState = "ambiguous";
  assert.equal(subject.evaluateControlledObservationEvidence(
    packetWith({ stepTCompletedResult: closure })).status, "blocked");
  assert.equal(subject.evaluateControlledObservationEvidence(packetWith({
    envelopeClaimTerminalizationHash: null,
  })).status, "blocked");
});

test("malformed, duplicate, unsorted, replayed, ceremony-equal, and approval-equal nonces block", () => {
  const ceremony = BASE.packet.stepWPacket.stepVPacket.stepUPacket.runtimeMaterial
    .ceremonyNonceHash;
  const approval = BASE.packet.stepWPacket.stepVPacket.externalExecutionApproval
    .approvalNonceHash;
  const cases = [
    { priorReconciliationNonceHashes: ["bad"] },
    { priorReconciliationNonceHashes: ["1".repeat(64), "1".repeat(64)] },
    { priorReconciliationNonceHashes: ["2".repeat(64), "1".repeat(64)] },
    { priorReconciliationNonceHashes: [fixture.RECONCILIATION_NONCE_HASH] },
    { reconciliationNonceHash: ceremony },
    { reconciliationNonceHash: approval },
  ];
  for (const overrides of cases) {
    const result = subject.evaluateControlledObservationEvidence(packetWith(overrides));
    assert.equal(result.status, "blocked");
    assert.equal(result.manualReviewRequired, true);
  }
});

test("expiry-age and reconciliation chronology fail closed", () => {
  assert.equal(subject.evaluateControlledObservationEvidence(packetWith({
    reconciliationClockInstant: "2026-07-18T00:03:21.000Z",
  })).status, "blocked");
  assert.equal(subject.evaluateControlledObservationEvidence(packetWith({
    reconciliationClockInstant: "2026-07-20T00:03:26.000Z",
  })).status, "blocked");
});

test("output is deterministic, canonical, recursively frozen, and non-authorizing", () => {
  const first = subject.evaluateControlledObservationEvidence(BASE.packet);
  const second = subject.evaluateControlledObservationEvidence(BASE.packet);
  assert.equal(subject.canonicalJson(first), subject.canonicalJson(second));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.reconciledEvidenceManifest));
  assert.ok(Object.isFrozen(first.reconciledEvidenceManifest.productionCutoverIdentities));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(first[field], false);
  assert.equal(first.productionCutoverReadinessPackage.externalExecutionPerformed, false);
});

test("merge, CI, and Vercel metadata cannot imply production authority", () => {
  for (const extra of [{ mergeSucceeded: true }, { ciSucceeded: true },
    { vercelSucceeded: true }]) {
    const result = subject.evaluateControlledObservationEvidence({ ...BASE.packet, ...extra });
    assert.equal(result.status, "blocked");
  }
});

test("production reconciliation source has no ambient or executor invocation capability", () => {
  const source = fs.readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-controlled-observation-evidence-reconciliation.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:http", "node:https", "node:net",
    "node:tls", "node:child_process", "process.env", "runControlledLiveObservation(",
    "executeSignedEnvelopeOnce(", "acquireExecutionEnvelopeClaim(",
    "finalizeExecutionEnvelopeClaim("]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.deepEqual(BASE.stepWFixture.envelopeStore.calls, []);
  assert.deepEqual(BASE.stepWFixture.runnerCalls, []);
});

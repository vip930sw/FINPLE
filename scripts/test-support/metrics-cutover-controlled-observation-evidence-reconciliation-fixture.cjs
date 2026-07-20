"use strict";

const stepT = require("../lib/metrics-cutover-live-observation-controlled-runner.cjs");
const stepW = require("../lib/metrics-cutover-live-observation-signed-envelope-executor.cjs");
const stepTFixture = require("./metrics-cutover-live-observation-controlled-runner-fixture.cjs");
const stepWFixture = require("./metrics-cutover-live-observation-signed-envelope-executor-fixture.cjs");
const subject = require("../lib/metrics-cutover-controlled-observation-evidence-reconciliation.cjs");

const RECONCILIATION_CLOCK = "2026-07-18T00:03:26.000Z";
const TERMINALIZATION_HASH = "7".repeat(64);
const RECONCILIATION_NONCE_HASH = "e".repeat(64);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function buildCompletedStepTResult(stepSPackage, observation) {
  const completedAt = observation.completedAt;
  const receipt = stepT.makePreDisposalReceipt(stepSPackage, observation,
    completedAt, "3".repeat(64), "4".repeat(64));
  const evidence = stepT.makeEvidence(stepSPackage, receipt, completedAt);
  const closure = stepT.makeExecutionClosureReceipt(stepSPackage, receipt, evidence,
    "5".repeat(64), "completed", stepT.RUNTIME_SEQUENCE, completedAt);
  const capabilityInvocationCounts = {
    runtimeArtifactSource: 2,
    runnerArtifactLoader: 1,
    adapterArtifactLoader: 1,
    singleUseExecutionLeaseStore: 5,
    atomicClaimStore: 1,
    readOnlyObservationTransport: 2,
    executionReceiptStore: 1,
    evidenceFinalizer: 1,
    environmentDisposalCoordinator: 1,
    executionClock: 4,
  };
  return deepFreeze({
    ok: true, status: stepT.PUBLIC_STATES[1], contractVersion: stepT.VERSION,
    failureClassification: null, executionTerminalState: "completed",
    blockingIssues: [], manualReviewRequired: false,
    runtimeStateSequence: [...stepT.RUNTIME_SEQUENCE], capabilityInvocationCounts,
    adapterInvocationCount: 1, disposalAttempted: true, disposalCompleted: true,
    sanitizedExecutionReceipt: receipt, sanitizedEvidence: evidence,
    sanitizedExecutionClosureReceipt: closure,
    ...Object.fromEntries(stepT.FIXED_FALSE_FIELDS.map((field) => [field, false])),
  });
}

let cached;
function buildFixture() {
  if (cached) return cached;
  const w = stepWFixture.buildFixture();
  const stepSPackage = w.packet.stepVPacket.stepUPacket.stepSPackage;
  const binding = subject.buildExpectedObservationBindings(stepSPackage);
  const baseObservation = stepTFixture.buildObservation(stepSPackage);
  const observation = deepFreeze({
    ...baseObservation,
    hashOutputs: binding.unresolvedHashFields.length === 0
      ? binding.hashOutputs : baseObservation.hashOutputs,
    timestampOutputs: binding.unresolvedTimestampFields.length === 0
      ? binding.timestampOutputs : baseObservation.timestampOutputs,
  });
  const stepTCompletedResult = buildCompletedStepTResult(stepSPackage, observation);
  const envelope = w.packet.stepVResult.singleUseExecutionEnvelope;
  const claim = stepW.buildEnvelopeClaim(envelope, w.packet.stepVPacket.stepUPacket,
    w.packet.stepVPacket.stepUCeremonyResult);
  const closeout = stepW.buildCloseoutReceipt(w.packet, claim,
    TERMINALIZATION_HASH, stepTCompletedResult);
  const stepWResult = stepW.safeResult(stepW.PUBLIC_STATES[1], {
    executionSequence: [...stepW.EXECUTION_SEQUENCE],
    envelopeClaimAcquisitionCount: 1,
    envelopeClaimTerminalizationCount: 1,
    stepTRunnerInvocationCount: 1,
    adapterInvocationCount: 1,
    envelopeClaimTerminalState: "completed",
    stepTExecutionSummary: stepW.sanitizedStepTSummary("completed", stepTCompletedResult),
    executionCloseoutReceipt: closeout,
  });
  const packet = deepFreeze({
    mergedMainSha: subject.MERGED_MAIN_SHA,
    stepWPacket: w.packet,
    stepWResult,
    persistedSanitizedObservation: observation,
    stepTCompletedResult,
    envelopeClaimTerminalizationHash: TERMINALIZATION_HASH,
    reconciliationClockInstant: RECONCILIATION_CLOCK,
    priorReconciliationNonceHashes: [],
    reconciliationNonceHash: RECONCILIATION_NONCE_HASH,
  });
  cached = { packet, binding, claim, closeout, stepTCompletedResult,
    stepWResult, stepWFixture: w };
  return cached;
}

module.exports = {
  RECONCILIATION_CLOCK, RECONCILIATION_NONCE_HASH, TERMINALIZATION_HASH,
  buildCompletedStepTResult, buildFixture, clone,
};

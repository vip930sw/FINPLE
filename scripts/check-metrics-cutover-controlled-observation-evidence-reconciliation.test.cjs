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
function cutoverPacket(mutator) {
  const evidence = fixture.clone(BASE.packet.productionCutoverEvidence);
  mutator(evidence);
  return packetWith({ productionCutoverEvidence: evidence });
}
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

test("Step W result requires exact full canonical reconstruction", () => {
  assert.deepEqual(subject.validateStepWChain(BASE.packet).issues, []);
  for (const extra of [
    { unknownField: true },
    { productionWriteAuthorized: true },
    { rawObservation: { value: "forbidden" } },
    { credential: "forbidden" },
    { endpoint: "forbidden" },
  ]) {
    const stepWResult = { ...BASE.packet.stepWResult, ...extra };
    const result = subject.evaluateControlledObservationEvidence(
      packetWith({ stepWResult }));
    assert.equal(result.status, "blocked");
    assert.equal(result.failureClassification, "blocked_before_closeout_validation");
    assert.deepEqual(result.blockingIssues, ["step_w_completed_result_invalid"]);
  }
  const missing = fixture.clone(BASE.packet.stepWResult);
  delete missing.stepTExecutionSummary;
  assert.equal(subject.evaluateControlledObservationEvidence(
    packetWith({ stepWResult: missing })).status, "blocked");
});

test("empty and partial production cutover identities cannot create readiness", () => {
  for (const identities of [{}, { contractVersion:
    "finple.step114-2x-x.production-cutover-identities.v1" }]) {
    const result = subject.evaluateControlledObservationEvidence(cutoverPacket(
      (evidence) => { evidence.productionCutoverIdentities = identities; }));
    assert.equal(result.status, "blocked");
    assert.equal(result.failureClassification,
      "blocked_during_cutover_candidate_reconciliation");
    assert.deepEqual(result.reconciledEvidenceManifest, {});
    assert.deepEqual(result.productionCutoverReadinessPackage, {});
  }
});

test("every mandatory canonical production identity is required", () => {
  const paths = [
    ["candidatePackage", "candidatePackageId"],
    ["candidatePackage", "candidatePackageHash"],
    ["candidatePackage", "zipPackageSha256"],
    ["candidatePackage", "cutoverRehearsalEvidenceHash"],
    ["executionPackage", "executionPackageHash"],
    ["selector", "selectorPreimageSha256"],
    ["selector", "selectorPostimageSha256"],
    ["repository", "repositoryPreimageSha256"],
    ["repository", "repositoryTreeSha"],
    ["repository", "repositoryHeadSha"],
    ["repository", "repositoryIdentityHash"],
    ["authority", "authorityPackageId"],
    ["authority", "authorityPackageHash"],
    ["invocation", "invocationId"],
    ["invocation", "invocationHash"],
    ["invocation", "invokedAt"],
    ["attestations", "targetAbsenceAttestationHash"],
    ["attestations", "noDriftAttestationHash"],
  ];
  for (const pathParts of paths) {
    const result = subject.evaluateControlledObservationEvidence(cutoverPacket(
      (evidence) => { delete evidence.productionCutoverIdentities[pathParts[0]][pathParts[1]]; }));
    assert.equal(result.status, "blocked", pathParts.join("."));
    assert.deepEqual(result.productionCutoverReadinessPackage, {});
  }
  for (const topLevel of ["datasets", "datasetPackageHash", "candidatePackage",
    "executionPackage", "selector", "repository", "authority", "invocation",
    "attestations"]) {
    const result = subject.evaluateControlledObservationEvidence(cutoverPacket(
      (evidence) => { delete evidence.productionCutoverIdentities[topLevel]; }));
    assert.equal(result.status, "blocked", topLevel);
  }
});

test("conflicting duplicate and stale upstream production identities block", () => {
  const conflict = cutoverPacket((evidence) => {
    evidence.prepared.packageB.executionPackage.candidatePackageId += "-conflict";
  });
  assert.equal(subject.evaluateControlledObservationEvidence(conflict).status, "blocked");
  for (const mutate of [
    (evidence) => { evidence.prepared.packageB.executionPackage.targetFiles[0].sha256 =
      "a".repeat(64); },
    (evidence) => { evidence.prepared.packageB.executionPackage.selectorPreimage
      .selectorSha256 = "a".repeat(64); },
    (evidence) => { evidence.prepared.packageB.executionPackage.repositoryPreimage
      .repositoryTreeSha = "a".repeat(40); },
  ]) {
    const result = subject.evaluateControlledObservationEvidence(cutoverPacket(mutate));
    assert.equal(result.status, "blocked");
  }
});

test("candidate, selector, repository, attestation, type, and US/KR drift block", () => {
  const mutators = [
    (ids) => { ids.candidatePackage.candidatePackageHash = "a".repeat(64); },
    (ids) => { ids.datasets[0].contentSha256 = "a".repeat(64); },
    (ids) => { ids.datasets[1].contentSha256 = "b".repeat(64); },
    (ids) => { ids.selector.selectorPreimageSha256 = "c".repeat(64); },
    (ids) => { ids.selector.selectorPostimageSha256 = "d".repeat(64); },
    (ids) => { ids.repository.repositoryHeadSha = "e".repeat(40); },
    (ids) => { ids.attestations.targetAbsenceAttestationHash = "f".repeat(64); },
    (ids) => { delete ids.attestations.noDriftAttestationHash; },
    (ids) => { ids.datasets[0].rowCount = "1"; },
    (ids) => { ids.datasets[0].byteCount = null; },
    (ids) => { ids.invocation.invokedAt = 0; },
  ];
  for (const mutate of mutators) {
    const result = subject.evaluateControlledObservationEvidence(cutoverPacket(
      (evidence) => mutate(evidence.productionCutoverIdentities)));
    assert.equal(result.status, "blocked");
    assert.equal(result.failureClassification,
      "blocked_during_cutover_candidate_reconciliation");
  }
});

test("canonical manifest, readiness package, and summary reject tampering", () => {
  const result = subject.evaluateControlledObservationEvidence(BASE.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  const chain = subject.validateStepWChain(BASE.packet);
  const observation = subject.validateObservationReconciliation(BASE.packet, chain);
  const identities = BASE.packet.productionCutoverEvidence.productionCutoverIdentities;
  assert.deepEqual(subject.validateReconciledEvidenceManifest(
    result.reconciledEvidenceManifest, BASE.packet, chain, observation, identities), []);
  assert.deepEqual(subject.validateProductionCutoverReadinessPackage(
    result.productionCutoverReadinessPackage, result.reconciledEvidenceManifest), []);
  assert.deepEqual(subject.validateReadinessSummary(
    result.productionCutoverReadinessSummary,
    result.productionCutoverReadinessPackage), []);
  const manifest = fixture.clone(result.reconciledEvidenceManifest);
  delete manifest.productionCutoverIdentities.authority.authorityPackageHash;
  assert.notDeepEqual(subject.validateReconciledEvidenceManifest(
    manifest, BASE.packet, chain, observation, identities), []);
  const readiness = { ...result.productionCutoverReadinessPackage,
    eligibleForSeparateProductionCutoverApproval: false };
  assert.notDeepEqual(subject.validateProductionCutoverReadinessPackage(
    readiness, result.reconciledEvidenceManifest), []);
  const summary = { ...result.productionCutoverReadinessSummary,
    unknownAuthority: true };
  assert.notDeepEqual(subject.validateReadinessSummary(
    summary, result.productionCutoverReadinessPackage), []);
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

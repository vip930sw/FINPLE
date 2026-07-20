"use strict";

const { createHash } = require("node:crypto");
const stepT = require("./metrics-cutover-live-observation-controlled-runner.cjs");
const stepW = require("./metrics-cutover-live-observation-signed-envelope-executor.cjs");

const MERGED_MAIN_SHA = "a2bd8736fa331c1ef03a8e149e898f2ec328653b";
const VERSION = "finple.step114-2x-x.observation-evidence-reconciliation.v1";
const PUBLIC_STATES = Object.freeze([
  "awaiting_external_execution_closeout_evidence",
  "production_cutover_evidence_reconciled",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_closeout_validation",
  "blocked_during_observation_reconciliation",
  "blocked_during_cutover_candidate_reconciliation",
  "manual_review_required",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "productionWriteAuthorized", "selectorMutationAuthorized",
  "loaderActivationAuthorized", "deploymentAuthorized",
  "automaticRetryAllowed", "secondObservationAllowed",
  "externalExecutionPerformed", "rawMaterialPresent",
]);
const INPUT_FIELDS = Object.freeze([
  "mergedMainSha", "stepWPacket", "stepWResult", "persistedSanitizedObservation",
  "stepTCompletedResult", "envelopeClaimTerminalizationHash",
  "reconciliationClockInstant", "priorReconciliationNonceHashes",
  "reconciliationNonceHash",
]);
const MAXIMUM_EVIDENCE_INTAKE_AGE_MILLISECONDS = 24 * 60 * 60 * 1000;
const CUTOVER_IDENTITY_FIELDS = Object.freeze([
  "candidatePackageId", "candidatePackageHash", "executionPackageHash",
  "selectorPreimageSha256", "selectorPostimageSha256", "repositoryPreimageSha256",
  "repositoryTreeSha256", "repositoryHeadSha", "repositoryBranchHash",
  "trackedPathsSha256", "usCandidateContentSha256", "krCandidateContentSha256",
  "usCandidateRowCount", "krCandidateRowCount", "usCandidateByteCount",
  "krCandidateByteCount", "usSchemaHeaderSha256", "krSchemaHeaderSha256",
  "datasetPackageHash", "authorityPackageId", "authorityPackageHash",
  "invocationId", "invocationHash", "targetAbsenceAttestationHash",
  "noDriftAttestationHash", "candidateGeneratedAt", "approvalIssuedAt",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null);
}
function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  throw new TypeError("unsupported_canonical_value");
}
function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}
function hashContract(domain, value) {
  return createHash("sha256").update(domain).update(canonicalJson(value)).digest("hex");
}
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function exactKeys(value, keys) {
  return isRecord(value) && canonicalEqual(Object.keys(value).sort(), [...keys].sort());
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}
function safeResult(status, overrides = {}) {
  return deepFreeze({
    ok: status === PUBLIC_STATES[1], status, contractVersion: VERSION,
    failureClassification: status === PUBLIC_STATES[2]
      ? overrides.failureClassification || FAILURE_CLASSIFICATIONS[0] : null,
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: overrides.manualReviewRequired === true,
    reconciledEvidenceManifest: overrides.reconciledEvidenceManifest || {},
    productionCutoverReadinessPackage:
      overrides.productionCutoverReadinessPackage || {},
    productionCutoverReadinessSummary:
      overrides.productionCutoverReadinessSummary || {},
    ...fixedFalse(),
  });
}
function block(classification, issue, manualReviewRequired = false) {
  return safeResult(PUBLIC_STATES[2], {
    failureClassification: classification,
    blockingIssues: [issue], manualReviewRequired,
  });
}

function nested(stepSPackage) {
  const stepRPacket = stepSPackage.inputPacket.context.upstream;
  const qPacket = stepRPacket.upstream.stepQPacket;
  const pPacket = qPacket.context.upstream.stepPPacket;
  const oPacket = pPacket.context.upstream.stepOPacket;
  return { stepRPacket, qPacket, pPacket, oPacket };
}

function collectFieldValues(root, requestedFields) {
  const requested = new Set(requestedFields);
  const found = Object.fromEntries([...requested].map((field) => [field, []]));
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) { for (const item of value) visit(item); return; }
    for (const [key, child] of Object.entries(value)) {
      if (requested.has(key) && (typeof child === "string" ||
          typeof child === "number" || typeof child === "boolean")) {
        found[key].push(child);
      }
      visit(child);
    }
  };
  visit(root);
  return Object.fromEntries(Object.entries(found).map(([field, values]) =>
    [field, [...new Set(values.map((value) => canonicalJson(value)))].map(JSON.parse)]));
}

function buildExpectedObservationBindings(stepSPackage) {
  const { oPacket } = nested(stepSPackage);
  const input = oPacket.executorInput;
  const hashFields = input.requiredHashPlaceholders;
  const timestampFields = input.requiredTimestampPlaceholders;
  let approvalRequest;
  try {
    const nPacket = oPacket.context.upstream.stepNPacket;
    const mPacket = nPacket.context.upstream.stepMPacket;
    approvalRequest = mPacket.context.upstream.stepLPacket.approvalRequest;
  } catch { approvalRequest = {}; }
  const hashOutputs = {};
  const timestampOutputs = {};
  const unresolvedHashFields = [];
  const unresolvedTimestampFields = [];
  for (const field of hashFields) {
    if (isSha(approvalRequest[field])) hashOutputs[field] = approvalRequest[field];
    else unresolvedHashFields.push(field);
  }
  for (const field of timestampFields) {
    if (field === "observationWindowStartsAt") {
      timestampOutputs[field] = input.observationWindowStartsAt;
    } else if (field === "observationWindowExpiresAt") {
      timestampOutputs[field] = input.observationWindowExpiresAt;
    } else unresolvedTimestampFields.push(field);
  }
  return { hashOutputs, timestampOutputs, unresolvedHashFields,
    unresolvedTimestampFields };
}

function collectProductionCutoverIdentities(stepSPackage) {
  const values = collectFieldValues(stepSPackage, CUTOVER_IDENTITY_FIELDS);
  const result = {};
  for (const field of CUTOVER_IDENTITY_FIELDS) {
    if (values[field].length === 1) result[field] = values[field][0];
  }
  const { oPacket } = nested(stepSPackage);
  result.requiredHashPlaceholders = [...oPacket.executorInput.requiredHashPlaceholders];
  result.requiredTimestampPlaceholders =
    [...oPacket.executorInput.requiredTimestampPlaceholders];
  return result;
}

function validateNonceContext(prior, fresh, packet) {
  const issues = [];
  if (!Array.isArray(prior) || prior.some((item) => !isSha(item))) {
    issues.push("prior_reconciliation_nonce_context_invalid");
  } else {
    if (new Set(prior).size !== prior.length) {
      issues.push("prior_reconciliation_nonce_context_duplicate");
    }
    if (!canonicalEqual(prior, [...prior].sort())) {
      issues.push("prior_reconciliation_nonce_context_unsorted");
    }
  }
  if (!isSha(fresh)) issues.push("reconciliation_nonce_invalid");
  if (Array.isArray(prior) && prior.includes(fresh)) issues.push("reconciliation_nonce_replay");
  try {
    const ceremonyNonce = packet.stepVPacket.stepUPacket.runtimeMaterial.ceremonyNonceHash;
    const approvalNonce = packet.stepVPacket.externalExecutionApproval.approvalNonceHash;
    if (fresh === ceremonyNonce) issues.push("reconciliation_nonce_matches_ceremony_nonce");
    if (fresh === approvalNonce) issues.push("reconciliation_nonce_matches_approval_nonce");
  } catch { issues.push("upstream_nonce_binding_invalid"); }
  return [...new Set(issues)].sort();
}

function validateStepWChain(packet) {
  const issues = [];
  if (!exactKeys(packet.stepWPacket, ["mergedMainSha", "stepVPacket", "stepVResult",
    "singleUseExternalExecutionEnvelopeStore", "executionClockInstant"])) {
    return { issues: ["step_w_packet_fields_invalid"] };
  }
  if (packet.stepWPacket.mergedMainSha !== stepW.MERGED_MAIN_SHA) {
    issues.push("step_w_merged_main_binding_invalid");
  }
  const direct = stepW.directValidateStepV(packet.stepWPacket.stepVPacket,
    packet.stepWPacket.stepVResult);
  issues.push(...direct.issues);
  issues.push(...stepW.validateExecutionEnvelopeStore(
    packet.stepWPacket.singleUseExternalExecutionEnvelopeStore));
  const stepSPackage = packet.stepWPacket.stepVPacket.stepUPacket.stepSPackage;
  issues.push(...stepT.validateDirectStepSPackage(stepSPackage));
  issues.push(...stepT.validateCapabilityBundle(
    packet.stepWPacket.stepVPacket.stepUPacket.runtimeCapabilities));
  const expectedPlan = stepT.buildOperationPlan(stepSPackage.oneRunRunnerLaunchPackage
    .oneRunRunnerLaunchPackageHash);
  const expectedPlanHash = stepT.hashOperationPlan(expectedPlan);
  const envelope = packet.stepWPacket.stepVResult.singleUseExecutionEnvelope;
  if (expectedPlan.length !== 21 || envelope.operationPlanHash !== expectedPlanHash ||
      !canonicalEqual(envelope.operationPlan, expectedPlan)) {
    issues.push("step_t_operation_plan_invalid");
  }
  issues.push(...stepW.validateCompletedStepTResult(packet.stepTCompletedResult,
    stepSPackage));
  const claim = stepW.buildEnvelopeClaim(envelope,
    packet.stepWPacket.stepVPacket.stepUPacket,
    packet.stepWPacket.stepVPacket.stepUCeremonyResult);
  if (!isSha(packet.envelopeClaimTerminalizationHash)) {
    issues.push("envelope_claim_terminalization_hash_invalid");
  }
  const expectedCloseout = stepW.buildCloseoutReceipt(packet.stepWPacket, claim,
    packet.envelopeClaimTerminalizationHash, packet.stepTCompletedResult);
  issues.push(...stepW.validateCloseoutReceipt(packet.stepWResult.executionCloseoutReceipt,
    packet.stepWPacket, claim, packet.envelopeClaimTerminalizationHash,
    packet.stepTCompletedResult));
  const expectedSummary = stepW.sanitizedStepTSummary("completed",
    packet.stepTCompletedResult);
  if (!isRecord(packet.stepWResult) || packet.stepWResult.ok !== true ||
      packet.stepWResult.status !== stepW.PUBLIC_STATES[1] ||
      packet.stepWResult.contractVersion !== stepW.VERSION ||
      packet.stepWResult.failureClassification !== null ||
      packet.stepWResult.manualReviewRequired !== false ||
      !canonicalEqual(packet.stepWResult.executionSequence, stepW.EXECUTION_SEQUENCE) ||
      packet.stepWResult.envelopeClaimAcquisitionCount !== 1 ||
      packet.stepWResult.envelopeClaimTerminalizationCount !== 1 ||
      packet.stepWResult.stepTRunnerInvocationCount !== 1 ||
      packet.stepWResult.adapterInvocationCount !== 1 ||
      packet.stepWResult.envelopeClaimTerminalState !== "completed" ||
      !canonicalEqual(packet.stepWResult.stepTExecutionSummary, expectedSummary) ||
      !canonicalEqual(packet.stepWResult.executionCloseoutReceipt, expectedCloseout)) {
    issues.push("step_w_completed_result_invalid");
  }
  for (const field of stepW.FIXED_FALSE_FIELDS) {
    if (packet.stepWResult[field] !== false) issues.push("step_w_fixed_false_invalid");
  }
  return { issues: [...new Set(issues)].sort(), stepSPackage, expectedPlan,
    expectedPlanHash, envelope, claim, expectedCloseout };
}

function validateObservationReconciliation(packet, chain) {
  const observation = packet.persistedSanitizedObservation;
  const issues = stepT.validateSanitizedObservation(observation,
    chain.stepSPackage, packet.reconciliationClockInstant);
  const expectedDigest = stepT.hashContract(
    "FINPLE_STEP114_2X_T_SANITIZED_OBSERVATION\0", observation);
  if (packet.stepTCompletedResult.sanitizedExecutionReceipt.observationDigest !==
      expectedDigest) issues.push("observation_digest_mismatch");
  const expected = buildExpectedObservationBindings(chain.stepSPackage);
  if (expected.unresolvedHashFields.length || expected.unresolvedTimestampFields.length) {
    issues.push("unknown_required_observation_placeholder");
  }
  if (!canonicalEqual(observation.hashOutputs, expected.hashOutputs)) {
    issues.push("observation_hash_output_upstream_drift");
  }
  if (!canonicalEqual(observation.timestampOutputs, expected.timestampOutputs)) {
    issues.push("observation_timestamp_output_upstream_drift");
  }
  const { oPacket } = nested(chain.stepSPackage);
  const starts = parseInstant(oPacket.executorInput.observationWindowStartsAt);
  const expires = parseInstant(oPacket.executorInput.observationWindowExpiresAt);
  for (const value of Object.values(observation.timestampOutputs || {})) {
    const instant = parseInstant(value);
    if (instant === null || instant < starts || instant > expires) {
      issues.push("observation_timestamp_outside_approved_window");
    }
  }
  return { issues: [...new Set(issues)].sort(), expectedDigest,
    hashOutputsDigest: hashContract(
      "FINPLE_STEP114_2X_X_ORDERED_HASH_OUTPUTS\0", observation.hashOutputs),
    timestampOutputsDigest: hashContract(
      "FINPLE_STEP114_2X_X_ORDERED_TIMESTAMP_OUTPUTS\0", observation.timestampOutputs) };
}

function validateChronology(packet) {
  const reconciliation = parseInstant(packet.reconciliationClockInstant);
  const observation = parseInstant(packet.persistedSanitizedObservation.completedAt);
  const closeout = parseInstant(packet.stepWResult.executionCloseoutReceipt
    .executionClockInstant);
  const closure = parseInstant(packet.stepTCompletedResult
    .sanitizedExecutionClosureReceipt.completedAt);
  if ([reconciliation, observation, closeout, closure].includes(null) ||
      reconciliation < Math.max(observation, closeout, closure)) {
    return ["reconciliation_chronology_invalid"];
  }
  if (reconciliation - Math.max(observation, closeout, closure) >
      MAXIMUM_EVIDENCE_INTAKE_AGE_MILLISECONDS) {
    return ["reconciliation_evidence_intake_stale"];
  }
  return [];
}

function buildReconciledEvidenceManifest(packet, chain, observation) {
  const uResult = packet.stepWPacket.stepVPacket.stepUCeremonyResult;
  const approval = packet.stepWPacket.stepVPacket.externalExecutionApproval;
  const tResult = packet.stepTCompletedResult;
  const closeout = packet.stepWResult.executionCloseoutReceipt;
  const productionIdentities = collectProductionCutoverIdentities(chain.stepSPackage);
  const body = {
    contractVersion: "finple.step114-2x-x.reconciled-evidence-manifest.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    stepWCloseoutReceiptId: closeout.executionCloseoutReceiptId,
    stepWCloseoutReceiptHash: closeout.executionCloseoutReceiptHash,
    stepWEnvelopeClaimId: chain.claim.executionEnvelopeClaimId,
    stepWEnvelopeClaimHash: chain.claim.executionEnvelopeClaimHash,
    envelopeClaimTerminalizationHash: packet.envelopeClaimTerminalizationHash,
    externalExecutionApprovalId: chain.envelope.externalExecutionApprovalId,
    externalExecutionApprovalHash: chain.envelope.externalExecutionApprovalHash,
    singleUseExecutionEnvelopeId: chain.envelope.singleUseExecutionEnvelopeId,
    singleUseExecutionEnvelopeHash: chain.envelope.singleUseExecutionEnvelopeHash,
    stepUEvidenceHandoffManifestId: uResult.evidenceHandoffManifest.evidenceHandoffManifestId,
    stepUEvidenceHandoffManifestHash: uResult.evidenceHandoffManifest.evidenceHandoffManifestHash,
    stepURuntimeMaterialManifestId: uResult.runtimeMaterialManifest.runtimeMaterialManifestId,
    stepURuntimeMaterialManifestHash: uResult.runtimeMaterialManifest.runtimeMaterialManifestHash,
    stepURuntimeMaterialInventoryId: uResult.runtimeMaterialInventory.runtimeMaterialInventoryId,
    stepURuntimeMaterialInventoryHash: uResult.runtimeMaterialInventory.runtimeMaterialInventoryHash,
    sanitizedExecutionReceiptId: tResult.sanitizedExecutionReceipt.sanitizedExecutionReceiptId,
    sanitizedExecutionReceiptHash: tResult.sanitizedExecutionReceipt.sanitizedExecutionReceiptHash,
    sanitizedEvidenceId: tResult.sanitizedEvidence.sanitizedEvidenceId,
    sanitizedEvidenceHash: tResult.sanitizedEvidence.sanitizedEvidenceHash,
    executionClosureReceiptId: tResult.sanitizedExecutionClosureReceipt.executionClosureReceiptId,
    executionClosureReceiptHash: tResult.sanitizedExecutionClosureReceipt.executionClosureReceiptHash,
    operationPlanHash: chain.expectedPlanHash,
    completeRuntimeTraceHash: tResult.sanitizedExecutionClosureReceipt.runtimeStateTraceHash,
    stepSLaunchPackageId: chain.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageId,
    stepSLaunchPackageHash: chain.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash,
    sanitizedObservationDigest: observation.expectedDigest,
    orderedHashOutputsDigest: observation.hashOutputsDigest,
    orderedTimestampOutputsDigest: observation.timestampOutputsDigest,
    productionCutoverIdentities: productionIdentities,
    destinationCount: 1, observationCount: 1, runnerInvocationCount: 1,
    adapterInvocationCount: 1, disposalStatus: "completed",
    stepTLeaseTerminalState: "completed", envelopeClaimTerminalState: "completed",
    observationCompletedAt: packet.persistedSanitizedObservation.completedAt,
    executionCompletedAt: tResult.sanitizedExecutionClosureReceipt.completedAt,
    closeoutCompletedAt: closeout.executionClockInstant,
    reconciledAt: packet.reconciliationClockInstant,
    reconciliationNonceHash: packet.reconciliationNonceHash,
    priorNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_X_PRIOR_NONCE_CONTEXT\0",
      packet.priorReconciliationNonceHashes),
    evidenceReconciled: true,
    productionWriteAuthorized: false, selectorMutationAuthorized: false,
    loaderActivationAuthorized: false, deploymentAuthorized: false,
    automaticRetryAllowed: false, secondObservationAllowed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_X_RECONCILED_EVIDENCE_ID\0", body);
  const withId = { ...body,
    reconciledEvidenceManifestId: `step114-2x-x-reconciled-evidence-${idHash}` };
  return { ...withId, reconciledEvidenceManifestHash: hashContract(
    "FINPLE_STEP114_2X_X_RECONCILED_EVIDENCE_HASH\0", withId) };
}

function buildProductionCutoverReadinessPackage(manifest) {
  const body = {
    contractVersion: "finple.step114-2x-x.production-cutover-readiness.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    reconciledEvidenceManifestId: manifest.reconciledEvidenceManifestId,
    reconciledEvidenceManifestHash: manifest.reconciledEvidenceManifestHash,
    stepWCloseoutReceiptId: manifest.stepWCloseoutReceiptId,
    stepWCloseoutReceiptHash: manifest.stepWCloseoutReceiptHash,
    evidenceReconciled: true,
    eligibleForSeparateProductionCutoverApproval: true,
    productionWriteAuthorized: false, selectorMutationAuthorized: false,
    loaderActivationAuthorized: false, deploymentAuthorized: false,
    externalExecutionPerformed: false, automaticRetryAllowed: false,
    secondObservationAllowed: false, rawMaterialPresent: false,
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_X_PRODUCTION_CUTOVER_READINESS_ID\0", body);
  const withId = { ...body,
    productionCutoverReadinessPackageId:
      `step114-2x-x-production-cutover-readiness-${idHash}` };
  return { ...withId, productionCutoverReadinessPackageHash: hashContract(
    "FINPLE_STEP114_2X_X_PRODUCTION_CUTOVER_READINESS_HASH\0", withId) };
}

function buildReadinessSummary(readinessPackage) {
  const body = {
    contractVersion: "finple.step114-2x-x.production-cutover-readiness-summary.v1",
    publicState: PUBLIC_STATES[1],
    productionCutoverReadinessPackageId:
      readinessPackage.productionCutoverReadinessPackageId,
    productionCutoverReadinessPackageHash:
      readinessPackage.productionCutoverReadinessPackageHash,
    evidenceReconciled: true,
    eligibleForSeparateProductionCutoverApproval: true,
    productionWriteAuthorized: false, selectorMutationAuthorized: false,
    loaderActivationAuthorized: false, deploymentAuthorized: false,
    externalExecutionPerformed: false, rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_X_READINESS_SUMMARY_ID\0", body);
  const withId = { ...body,
    productionCutoverReadinessSummaryId: `step114-2x-x-readiness-summary-${idHash}` };
  return { ...withId, productionCutoverReadinessSummaryHash: hashContract(
    "FINPLE_STEP114_2X_X_READINESS_SUMMARY_HASH\0", withId) };
}

function evaluateControlledObservationEvidence(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(packet, INPUT_FIELDS)) {
    return block(FAILURE_CLASSIFICATIONS[0], "reconciliation_packet_fields_invalid");
  }
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) {
    return block(FAILURE_CLASSIFICATIONS[0], "merged_main_sha_invalid");
  }
  let chain;
  try { chain = validateStepWChain(packet); }
  catch { return block(FAILURE_CLASSIFICATIONS[0], "closeout_chain_validation_failed"); }
  if (chain.issues.length) {
    return block(FAILURE_CLASSIFICATIONS[0], chain.issues[0]);
  }
  const nonceIssues = validateNonceContext(packet.priorReconciliationNonceHashes,
    packet.reconciliationNonceHash, packet.stepWPacket);
  if (nonceIssues.length) {
    return block(FAILURE_CLASSIFICATIONS[3], nonceIssues[0], true);
  }
  const chronologyIssues = validateChronology(packet);
  if (chronologyIssues.length) {
    return block(FAILURE_CLASSIFICATIONS[3], chronologyIssues[0], true);
  }
  let observation;
  try { observation = validateObservationReconciliation(packet, chain); }
  catch { return block(FAILURE_CLASSIFICATIONS[1], "observation_reconciliation_failed"); }
  if (observation.issues.length) {
    return block(FAILURE_CLASSIFICATIONS[1], observation.issues[0]);
  }
  let manifest;
  try { manifest = buildReconciledEvidenceManifest(packet, chain, observation); }
  catch { return block(FAILURE_CLASSIFICATIONS[2], "cutover_identity_reconciliation_failed"); }
  const readiness = buildProductionCutoverReadinessPackage(manifest);
  const summary = buildReadinessSummary(readiness);
  return safeResult(PUBLIC_STATES[1], {
    reconciledEvidenceManifest: manifest,
    productionCutoverReadinessPackage: readiness,
    productionCutoverReadinessSummary: summary,
  });
}

module.exports = {
  CUTOVER_IDENTITY_FIELDS, FAILURE_CLASSIFICATIONS, FIXED_FALSE_FIELDS,
  INPUT_FIELDS, MAXIMUM_EVIDENCE_INTAKE_AGE_MILLISECONDS, MERGED_MAIN_SHA,
  PUBLIC_STATES, VERSION,
  buildExpectedObservationBindings, buildProductionCutoverReadinessPackage,
  buildReadinessSummary, buildReconciledEvidenceManifest, canonicalJson,
  collectProductionCutoverIdentities, evaluateControlledObservationEvidence,
  hashContract, safeResult, validateNonceContext, validateObservationReconciliation,
  validateStepWChain,
};

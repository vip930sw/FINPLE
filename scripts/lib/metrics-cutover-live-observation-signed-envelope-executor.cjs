"use strict";

const { createHash } = require("node:crypto");
const stepT = require("./metrics-cutover-live-observation-controlled-runner.cjs");
const stepU = require("./metrics-cutover-live-observation-execution-ceremony.cjs");
const stepV = require("./metrics-cutover-live-observation-external-execution-approval.cjs");

const MERGED_MAIN_SHA = "a1c298f5f15ba44ed229f58e255e26d1be6949fd";
const VERSION = "finple.step114-2x-w.signed-envelope-executor.v1";
const PUBLIC_STATES = Object.freeze([
  "awaiting_explicit_signed_envelope_execution",
  "signed_envelope_controlled_observation_execution_completed",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_envelope_claim",
  "blocked_before_runner_invocation",
  "blocked_after_runner_invocation",
  "execution_outcome_uncertain",
]);
const EXECUTION_SEQUENCE = Object.freeze([
  "step_v_package_revalidated",
  "single_use_execution_envelope_revalidated",
  "execution_bridge_capability_validated",
  "execution_clock_validated",
  "execution_envelope_claim_acquired",
  "step_t_execution_packet_bound",
  "step_t_runner_invoked_once",
  "step_t_execution_result_validated",
  "step_t_closure_receipt_validated",
  "execution_envelope_claim_terminalized",
  "execution_closeout_receipt_sealed",
  "signed_envelope_controlled_observation_execution_completed",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "automaticRetryAllowed", "fallbackAllowed", "secondRunnerInvocationAllowed",
  "secondObservationAllowed", "providerMutationAllowed", "productionMutationAllowed",
  "runtimeRouteAdded", "cronAdded", "workerAdded", "deploymentWorkflowChanged",
  "rawMaterialPresent",
]);
const STORE_METHODS = Object.freeze([
  "acquireExecutionEnvelopeClaim", "reconcileOperationOutcome",
  "finalizeExecutionEnvelopeClaim",
]);
const TERMINAL_STATES = Object.freeze([
  "completed", "blocked_before_observation", "blocked_after_observation",
  "execution_outcome_uncertain",
]);
const directStepVValidationCache = new WeakMap();

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
function canonicalEqual(left, right) { return canonicalJson(left) === canonicalJson(right); }
function hashContract(domain, value) {
  return createHash("sha256").update(domain).update(canonicalJson(value)).digest("hex");
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function exactKeys(value, keys) {
  return isRecord(value) && canonicalEqual(Object.keys(value).sort(), [...keys].sort());
}
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value
    ? milliseconds : null;
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value); for (const item of Object.values(value)) deepFreeze(item);
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
      ? overrides.failureClassification || "blocked_before_envelope_claim" : null,
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: overrides.manualReviewRequired || false,
    executionSequence: overrides.executionSequence || [],
    envelopeClaimAcquisitionCount: overrides.envelopeClaimAcquisitionCount || 0,
    envelopeClaimTerminalizationCount: overrides.envelopeClaimTerminalizationCount || 0,
    stepTRunnerInvocationCount: overrides.stepTRunnerInvocationCount || 0,
    adapterInvocationCount: overrides.adapterInvocationCount || 0,
    envelopeClaimTerminalState: overrides.envelopeClaimTerminalState || null,
    stepTExecutionSummary: overrides.stepTExecutionSummary || {},
    executionCloseoutReceipt: overrides.executionCloseoutReceipt || {},
    ...fixedFalse(),
  });
}

function sanitizedStepTSummary(kind, value = {}) {
  const blocked = kind === "blocked";
  const completed = kind === "completed";
  return deepFreeze({
    resultKind: kind,
    status: completed ? stepT.PUBLIC_STATES[1] : blocked ? stepT.PUBLIC_STATES[2] : "unknown",
    failureClassification: blocked ? value.failureClassification :
      (kind === "uncertain" ? "execution_outcome_uncertain" : null),
    executionTerminalState: completed ? "completed" :
      (blocked ? value.executionTerminalState : "execution_outcome_uncertain"),
    adapterInvocationCount: Number.isInteger(value.adapterInvocationCount)
      ? value.adapterInvocationCount : 0,
    disposalAttempted: value.disposalAttempted === true,
    disposalCompleted: value.disposalCompleted === true,
    executionClosureReceiptId: completed
      ? value.sanitizedExecutionClosureReceipt.executionClosureReceiptId : null,
    executionClosureReceiptHash: completed
      ? value.sanitizedExecutionClosureReceipt.executionClosureReceiptHash : null,
    manualReviewRequired: blocked ? value.manualReviewRequired === true : kind === "uncertain",
    rawMaterialPresent: false,
  });
}

function buildExecutionEnvelopeStoreDescriptor(overrides = {}) {
  const body = {
    capabilityName: "singleUseExternalExecutionEnvelopeStore",
    capabilityClass: "finple_step114_2x_w_single_use_external_execution_envelope_store",
    contractVersion: VERSION,
    methodNames: [...STORE_METHODS],
    hardTimeoutMilliseconds: 5000,
    invocationContextFields: ["operationId", "idempotencyKey", "deadline", "abortSignal"],
    cooperativeCancellationRequired: true,
    deadlineEnforcementRequired: true,
    postTimeoutOutcomeReconciliationRequired: true,
    lateCompletionForbidden: false,
    lateOutcomePolicy: "read_only_terminal_outcome_reconciliation_required",
    terminalOutcomes: ["aborted", "not_committed", "committed", "ambiguous"],
    atomicNamespaceMutationOnly: true,
    automaticRetryAllowed: false,
    fallbackAllowed: false,
    discoveryAllowed: false,
    providerAccessAllowed: false,
    productionMutationAllowed: false,
    unboundedMutationAllowed: false,
    rawMaterialPresent: false,
    ...overrides,
  };
  return { ...body, descriptorHash: hashContract(
    "FINPLE_STEP114_2X_W_ENVELOPE_STORE_DESCRIPTOR\0", body) };
}
function validateExecutionEnvelopeStore(value) {
  if (!exactKeys(value, ["descriptor", ...STORE_METHODS])) {
    return ["execution_envelope_store_fields_invalid"];
  }
  if (!canonicalEqual(value.descriptor, buildExecutionEnvelopeStoreDescriptor())) {
    return ["execution_envelope_store_descriptor_invalid"];
  }
  return STORE_METHODS.every((method) => typeof value[method] === "function")
    ? [] : ["execution_envelope_store_method_invalid"];
}

function buildEnvelopeClaimPlan(envelopeHash) {
  return ["execution_envelope_claim_acquisition", "execution_envelope_claim_terminalization"]
    .map((stage, index) => {
      const seed = { envelopeHash, sequence: index + 1, stage };
      return {
        sequence: index + 1, stage,
        operationId: `step114-2x-w-${stage}-${hashContract(
          "FINPLE_STEP114_2X_W_OPERATION_ID\0", seed)}`,
        idempotencyKey: hashContract("FINPLE_STEP114_2X_W_IDEMPOTENCY_KEY\0", seed),
      };
    });
}
function buildEnvelopeClaim(envelope, stepUPacket, stepUResult) {
  const identities = stepUPacket.runtimeMaterial.singleUseIdentities;
  const body = {
    contractVersion: "finple.step114-2x-w.execution-envelope-claim.v1",
    singleUseExecutionEnvelopeId: envelope.singleUseExecutionEnvelopeId,
    singleUseExecutionEnvelopeHash: envelope.singleUseExecutionEnvelopeHash,
    externalExecutionApprovalId: envelope.externalExecutionApprovalId,
    externalExecutionApprovalHash: envelope.externalExecutionApprovalHash,
    approvalNonceHash: envelope.approvalNonceHash,
    stepUEvidenceHandoffManifestId: envelope.stepUEvidenceHandoffManifestId,
    stepUEvidenceHandoffManifestHash: envelope.stepUEvidenceHandoffManifestHash,
    stepURuntimeMaterialManifestId: envelope.stepURuntimeMaterialManifestId,
    stepURuntimeMaterialManifestHash: envelope.stepURuntimeMaterialManifestHash,
    stepURuntimeMaterialInventoryId: envelope.stepURuntimeMaterialInventoryId,
    stepURuntimeMaterialInventoryHash: envelope.stepURuntimeMaterialInventoryHash,
    operationPlanHash: envelope.operationPlanHash,
    oneRunRunnerLaunchPackageId: envelope.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: envelope.oneRunRunnerLaunchPackageHash,
    executionLeaseRequestId: identities.executionLeaseRequestId,
    claimRequestId: identities.claimRequestId,
    destinationCount: 1, observationCount: 1,
    effectiveExecutionExpiresAt: envelope.effectiveExecutionExpiresAt,
    automaticRetryAllowed: false, secondRunnerInvocationAllowed: false,
    secondObservationAllowed: false, rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_W_ENVELOPE_CLAIM_ID\0", body);
  const withId = { ...body, executionEnvelopeClaimId: `step114-2x-w-claim-${idHash}` };
  return { ...withId, executionEnvelopeClaimHash: hashContract(
    "FINPLE_STEP114_2X_W_ENVELOPE_CLAIM_HASH\0", withId) };
}

function directValidateStepV(stepVPacket, suppliedResult) {
  if (isRecord(stepVPacket) && isRecord(suppliedResult) &&
      Object.isFrozen(stepVPacket) && Object.isFrozen(suppliedResult)) {
    const cached = directStepVValidationCache.get(stepVPacket);
    if (cached?.result === suppliedResult) return { ...cached.value,
      issues: [...cached.value.issues] };
  }
  const issues = [];
  let rebuilt;
  try { rebuilt = stepV.evaluateExternalExecutionApproval(stepVPacket); }
  catch { return { issues: ["step_v_canonical_reconstruction_failed"] }; }
  if (!rebuilt.ok || !canonicalEqual(rebuilt, suppliedResult)) {
    issues.push("step_v_packet_or_result_canonical_mismatch");
    return { issues, rebuilt };
  }
  const uDirect = stepV.directValidateStepU(stepVPacket.stepUPacket,
    stepVPacket.stepUCeremonyResult);
  issues.push(...uDirect.issues);
  issues.push(...stepV.validateSignedExternalExecutionApproval(
    stepVPacket.externalExecutionApproval, stepVPacket.externalExecutionApproverAllowlist,
    stepVPacket.stepUPacket, stepVPacket.stepUCeremonyResult,
    stepVPacket.priorApprovalNonceHashes, stepVPacket.evaluationClockInstant));
  issues.push(...stepV.validateSingleUseExecutionEnvelope(
    suppliedResult.singleUseExecutionEnvelope, stepVPacket.stepUPacket,
    stepVPacket.stepUCeremonyResult, stepVPacket.externalExecutionApproval,
    stepVPacket.externalExecutionApproverAllowlist));
  issues.push(...stepV.validateExecutionEnvelopeSummary(
    suppliedResult.executionEnvelopeSummary, suppliedResult.singleUseExecutionEnvelope));
  const uPacket = stepVPacket.stepUPacket;
  const uResult = stepVPacket.stepUCeremonyResult;
  const uRebuilt = stepU.evaluateExecutionCeremony(uPacket);
  if (!uRebuilt.ok || !canonicalEqual(uRebuilt, uResult)) {
    issues.push("step_u_packet_or_result_canonical_mismatch");
  }
  issues.push(...stepU.validateMergedStepTContract());
  issues.push(...stepU.validateRuntimeCapabilities(uPacket.runtimeCapabilities));
  issues.push(...stepU.validateRuntimeMaterial(uPacket.runtimeMaterial, uPacket.stepSPackage,
    uPacket.runtimeCapabilities, uPacket.evaluationClockInstant,
    uPacket.priorCeremonyNonceHashes));
  issues.push(...stepU.validateChecklistConfirmations(uPacket.operatorChecklistConfirmations));
  issues.push(...stepU.validateRuntimeMaterialInventory(uResult.runtimeMaterialInventory,
    uPacket.stepSPackage, uPacket.runtimeCapabilities, uPacket.runtimeMaterial,
    uPacket.priorCeremonyNonceHashes));
  issues.push(...stepU.validateRuntimeMaterialManifest(uResult.runtimeMaterialManifest,
    uPacket.stepSPackage, uPacket.runtimeMaterial, uResult.runtimeMaterialInventory,
    uPacket.priorCeremonyNonceHashes));
  issues.push(...stepT.validateDirectStepSPackage(uPacket.stepSPackage));
  issues.push(...stepT.validateCapabilityBundle(uPacket.runtimeCapabilities));
  const expectedPlan = stepT.buildOperationPlan(uPacket.stepSPackage
    .oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash);
  const expectedPlanHash = stepT.hashOperationPlan(expectedPlan);
  if (expectedPlan.length !== 21 ||
      !canonicalEqual(uPacket.runtimeMaterial.operationPlan, expectedPlan) ||
      suppliedResult.singleUseExecutionEnvelope.operationPlanHash !== expectedPlanHash) {
    issues.push("step_t_operation_plan_binding_invalid");
  }
  const value = { issues: [...new Set(issues)].sort(), rebuilt, expectedPlan, expectedPlanHash };
  if (Object.isFrozen(stepVPacket) && Object.isFrozen(suppliedResult)) {
    directStepVValidationCache.set(stepVPacket, { result: suppliedResult, value });
  }
  return { ...value, issues: [...value.issues] };
}

const STEP_T_RESULT_FIELDS = Object.freeze([
  "ok", "status", "contractVersion", "failureClassification",
  "executionTerminalState", "blockingIssues", "manualReviewRequired",
  "runtimeStateSequence", "capabilityInvocationCounts", "adapterInvocationCount",
  "disposalAttempted", "disposalCompleted", "sanitizedExecutionReceipt",
  "sanitizedEvidence", "sanitizedExecutionClosureReceipt", ...stepT.FIXED_FALSE_FIELDS,
]);

function validateCompletedStepTResult(value, stepSPackage) {
  const issues = [];
  if (!exactKeys(value, STEP_T_RESULT_FIELDS) ||
      value.status !== stepT.PUBLIC_STATES[1] || value.ok !== true ||
      value.contractVersion !== stepT.VERSION || value.failureClassification !== null ||
      value.manualReviewRequired !== false ||
      !canonicalEqual(value.runtimeStateSequence, stepT.RUNTIME_SEQUENCE) ||
      value.adapterInvocationCount !== 1 || value.disposalAttempted !== true ||
      value.disposalCompleted !== true || value.executionTerminalState !== "completed") {
    return ["step_t_completed_result_invalid"];
  }
  const receipt = value.sanitizedExecutionReceipt;
  const evidence = value.sanitizedEvidence;
  const closure = value.sanitizedExecutionClosureReceipt;
  const launch = stepSPackage.oneRunRunnerLaunchPackage;
  for (const [record, idField, hashField, idDomain, hashDomain] of [
    [receipt, "sanitizedExecutionReceiptId", "sanitizedExecutionReceiptHash",
      "FINPLE_STEP114_2X_T_RECEIPT_ID\0", "FINPLE_STEP114_2X_T_RECEIPT_HASH\0"],
    [evidence, "sanitizedEvidenceId", "sanitizedEvidenceHash",
      "FINPLE_STEP114_2X_T_EVIDENCE_ID\0", "FINPLE_STEP114_2X_T_EVIDENCE_HASH\0"],
    [closure, "executionClosureReceiptId", "executionClosureReceiptHash",
      "FINPLE_STEP114_2X_T_EXECUTION_CLOSURE_ID\0",
      "FINPLE_STEP114_2X_T_EXECUTION_CLOSURE_HASH\0"],
  ]) {
    if (!isRecord(record) || !isSha(record[hashField])) { issues.push("step_t_artifact_invalid"); continue; }
    const withoutHash = { ...record }; delete withoutHash[hashField];
    const withoutId = { ...withoutHash }; delete withoutId[idField];
    const expectedIdHash = hashContract(idDomain, withoutId);
    if (record[idField] !== `step114-2x-t-${idField === "sanitizedExecutionReceiptId"
      ? "receipt" : idField === "sanitizedEvidenceId" ? "evidence" : "closure"}-${expectedIdHash}` ||
        record[hashField] !== hashContract(hashDomain, withoutHash)) {
      issues.push("step_t_artifact_canonical_hash_invalid");
    }
  }
  if (closure.oneRunRunnerLaunchPackageId !== launch.oneRunRunnerLaunchPackageId ||
      closure.oneRunRunnerLaunchPackageHash !== launch.oneRunRunnerLaunchPackageHash ||
      closure.sanitizedExecutionReceiptId !== receipt.sanitizedExecutionReceiptId ||
      closure.sanitizedExecutionReceiptHash !== receipt.sanitizedExecutionReceiptHash ||
      closure.sanitizedEvidenceId !== evidence.sanitizedEvidenceId ||
      closure.sanitizedEvidenceHash !== evidence.sanitizedEvidenceHash ||
      closure.disposalStatus !== "completed" || !isSha(closure.disposalReceiptHash) ||
      closure.leaseTerminalState !== "completed" ||
      !canonicalEqual(closure.runtimeStateTrace, stepT.RUNTIME_SEQUENCE) ||
      closure.runtimeStateTraceHash !== stepT.hashContract(
        "FINPLE_STEP114_2X_T_COMPLETE_RUNTIME_TRACE\0", stepT.RUNTIME_SEQUENCE) ||
      closure.adapterInvocationCount !== 1 || closure.rawMaterialPresent !== false) {
    issues.push("step_t_closure_binding_invalid");
  }
  for (const field of stepT.FIXED_FALSE_FIELDS) if (value[field] !== false) {
    issues.push("step_t_fixed_false_invalid"); break;
  }
  return [...new Set(issues)].sort();
}

function validateBlockedStepTResult(value) {
  const issues = [];
  if (!exactKeys(value, STEP_T_RESULT_FIELDS)) {
    return ["step_t_blocked_result_fields_invalid"];
  }
  if (value.ok !== false || value.status !== stepT.PUBLIC_STATES[2] ||
      value.contractVersion !== stepT.VERSION || value.manualReviewRequired !== true ||
      !stepT.FAILURE_CLASSIFICATIONS.includes(value.failureClassification) ||
      !Array.isArray(value.blockingIssues) || value.blockingIssues.length === 0 ||
      value.blockingIssues.some((issue) => typeof issue !== "string" ||
        !/^[a-z0-9_:.-]+$/.test(issue))) {
    issues.push("step_t_blocked_result_header_invalid");
  }
  const trace = value.runtimeStateSequence;
  if (!Array.isArray(trace) || trace.length >= stepT.RUNTIME_SEQUENCE.length ||
      !canonicalEqual(trace, stepT.RUNTIME_SEQUENCE.slice(0, trace.length))) {
    issues.push("step_t_blocked_runtime_trace_invalid");
  }
  if (!exactKeys(value.capabilityInvocationCounts, stepT.CAPABILITY_NAMES) ||
      Object.values(value.capabilityInvocationCounts).some((count) =>
        !Number.isInteger(count) || count < 0)) {
    issues.push("step_t_blocked_capability_counts_invalid");
  }
  const observationReached = Array.isArray(trace) &&
    trace.includes("read_only_observation_invoked_once");
  if (![0, 1].includes(value.adapterInvocationCount) ||
      value.adapterInvocationCount !== (observationReached ? 1 : 0) ||
      typeof value.disposalAttempted !== "boolean" ||
      typeof value.disposalCompleted !== "boolean" ||
      !isRecord(value.sanitizedExecutionReceipt) || !isRecord(value.sanitizedEvidence) ||
      !exactKeys(value.sanitizedExecutionClosureReceipt, [])) {
    issues.push("step_t_blocked_result_boundary_invalid");
  }
  if (value.failureClassification === "disposal_uncertain" &&
      value.executionTerminalState !== "disposal_uncertain") {
    issues.push("step_t_blocked_disposal_uncertainty_invalid");
  }
  for (const field of stepT.FIXED_FALSE_FIELDS) if (value[field] !== false) {
    issues.push("step_t_blocked_fixed_false_invalid"); break;
  }
  return [...new Set(issues)].sort();
}

function validateStepTResult(value, stepSPackage) {
  return validateCompletedStepTResult(value, stepSPackage);
}

function buildCloseoutReceipt(packet, claim, terminalizationHash, stepTResult) {
  const envelope = packet.stepVResult.singleUseExecutionEnvelope;
  const uResult = packet.stepVPacket.stepUCeremonyResult;
  const closure = stepTResult.sanitizedExecutionClosureReceipt;
  const body = {
    contractVersion: "finple.step114-2x-w.execution-closeout-receipt.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    externalExecutionApprovalId: envelope.externalExecutionApprovalId,
    externalExecutionApprovalHash: envelope.externalExecutionApprovalHash,
    singleUseExecutionEnvelopeId: envelope.singleUseExecutionEnvelopeId,
    singleUseExecutionEnvelopeHash: envelope.singleUseExecutionEnvelopeHash,
    executionEnvelopeClaimId: claim.executionEnvelopeClaimId,
    executionEnvelopeClaimHash: claim.executionEnvelopeClaimHash,
    envelopeClaimTerminalizationHash: terminalizationHash,
    stepUEvidenceHandoffManifestId: uResult.evidenceHandoffManifest.evidenceHandoffManifestId,
    stepUEvidenceHandoffManifestHash: uResult.evidenceHandoffManifest.evidenceHandoffManifestHash,
    stepURuntimeMaterialManifestId: uResult.runtimeMaterialManifest.runtimeMaterialManifestId,
    stepURuntimeMaterialManifestHash: uResult.runtimeMaterialManifest.runtimeMaterialManifestHash,
    stepURuntimeMaterialInventoryId: uResult.runtimeMaterialInventory.runtimeMaterialInventoryId,
    stepURuntimeMaterialInventoryHash: uResult.runtimeMaterialInventory.runtimeMaterialInventoryHash,
    operationPlanHash: envelope.operationPlanHash,
    oneRunRunnerLaunchPackageId: envelope.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: envelope.oneRunRunnerLaunchPackageHash,
    sanitizedExecutionReceiptId: stepTResult.sanitizedExecutionReceipt.sanitizedExecutionReceiptId,
    sanitizedExecutionReceiptHash: stepTResult.sanitizedExecutionReceipt.sanitizedExecutionReceiptHash,
    sanitizedEvidenceId: stepTResult.sanitizedEvidence.sanitizedEvidenceId,
    sanitizedEvidenceHash: stepTResult.sanitizedEvidence.sanitizedEvidenceHash,
    executionClosureReceiptId: closure.executionClosureReceiptId,
    executionClosureReceiptHash: closure.executionClosureReceiptHash,
    completeRuntimeTraceHash: closure.runtimeStateTraceHash,
    destinationCount: 1, observationCount: 1, adapterInvocationCount: 1,
    disposalStatus: "completed", stepTLeaseTerminalState: "completed",
    envelopeClaimTerminalState: "completed",
    effectiveExecutionExpiresAt: envelope.effectiveExecutionExpiresAt,
    executionClockInstant: packet.executionClockInstant,
    singleUse: true, automaticRetryAllowed: false,
    secondRunnerInvocationAllowed: false, secondObservationAllowed: false,
    providerMutationAllowed: false, productionMutationAllowed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_W_CLOSEOUT_RECEIPT_ID\0", body);
  const withId = { ...body,
    executionCloseoutReceiptId: `step114-2x-w-closeout-${idHash}` };
  return { ...withId, executionCloseoutReceiptHash: hashContract(
    "FINPLE_STEP114_2X_W_CLOSEOUT_RECEIPT_HASH\0", withId) };
}
function validateCloseoutReceipt(value, packet, claim, terminalizationHash, stepTResult) {
  return canonicalEqual(value, buildCloseoutReceipt(packet, claim, terminalizationHash,
    stepTResult)) ? [] : ["execution_closeout_receipt_invalid"];
}

async function callStore(store, method, payload, operation, clockInstant, expiry) {
  const clockMs = parseInstant(clockInstant);
  const expiryMs = parseInstant(expiry);
  const remaining = expiryMs - clockMs;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { kind: "expired", issue: "execution_envelope_effective_expiry_reached" };
  }
  const timeoutMs = Math.min(store.descriptor.hardTimeoutMilliseconds, remaining);
  const primaryController = new AbortController();
  const primaryDeadlineMs = clockMs + timeoutMs;
  const primaryContext = { operationId: operation.operationId,
    idempotencyKey: operation.idempotencyKey,
    deadline: new Date(primaryDeadlineMs).toISOString(),
    abortSignal: primaryController.signal };
  const raceOnce = async (invoke, milliseconds) => {
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve({ timeout: true }), Math.max(0, milliseconds));
    });
    try {
      return await Promise.race([Promise.resolve().then(invoke)
        .then((value) => ({ value }), () => ({ error: true })), timeout]);
    } finally { clearTimeout(timer); }
  };
  const raced = await raceOnce(() => store[method](payload, primaryContext), timeoutMs);
  if (raced?.timeout) {
    primaryController.abort();
    const reconciliationController = new AbortController();
    const reconciliationDeadlineMs = Math.min(expiryMs,
      primaryDeadlineMs + store.descriptor.hardTimeoutMilliseconds);
    const reconciliationContext = { operationId: operation.operationId,
      idempotencyKey: operation.idempotencyKey,
      deadline: new Date(reconciliationDeadlineMs).toISOString(),
      abortSignal: reconciliationController.signal };
    const reconciliationRace = await raceOnce(() => store.reconcileOperationOutcome({
      operationId: operation.operationId, idempotencyKey: operation.idempotencyKey,
    }, reconciliationContext), reconciliationDeadlineMs - primaryDeadlineMs);
    if (reconciliationRace?.timeout) {
      reconciliationController.abort();
      return { kind: "ambiguous",
        issue: "execution_envelope_operation_reconciliation_timeout" };
    }
    if (reconciliationRace?.error) return { kind: "ambiguous",
      issue: "execution_envelope_operation_reconciliation_failed" };
    const reconciliation = reconciliationRace.value;
    const outcomeValid = exactKeys(reconciliation, ["outcome", "resourceHash"]) &&
      ["aborted", "not_committed", "committed", "ambiguous"]
        .includes(reconciliation.outcome) &&
      (reconciliation.outcome === "committed"
        ? isSha(reconciliation.resourceHash)
        : reconciliation.resourceHash === null);
    if (!outcomeValid) {
      return { kind: "ambiguous", issue: "execution_envelope_operation_reconciliation_invalid" };
    }
    return { kind: reconciliation.outcome, resourceHash: reconciliation.resourceHash };
  }
  if (raced?.error) return { kind: "failed", issue: `execution_envelope_${method}_failed` };
  return { kind: "result", value: raced.value };
}

async function executeSignedEnvelopeOnce(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  let sequence = []; let acquisitions = 0; let terminalizations = 0; let runnerCalls = 0;
  let adapterCount = 0; let claimHash = null;
  let terminalState = null; let stepTSummary = {};
  const block = (classification, issue, manualReviewRequired = false) => safeResult(
    PUBLIC_STATES[2], { failureClassification: classification, blockingIssues: [issue],
      manualReviewRequired, executionSequence: sequence,
      envelopeClaimAcquisitionCount: acquisitions,
      envelopeClaimTerminalizationCount: terminalizations,
      stepTRunnerInvocationCount: runnerCalls, adapterInvocationCount: adapterCount,
      envelopeClaimTerminalState: terminalState, stepTExecutionSummary: stepTSummary });
  if (!exactKeys(packet, ["mergedMainSha", "stepVPacket", "stepVResult",
    "singleUseExternalExecutionEnvelopeStore", "executionClockInstant"])) {
    return block("blocked_before_envelope_claim", "step_w_packet_fields_invalid");
  }
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) {
    return block("blocked_before_envelope_claim", "merged_main_sha_mismatch");
  }
  const direct = directValidateStepV(packet.stepVPacket, packet.stepVResult);
  if (direct.issues.length) return block("blocked_before_envelope_claim", direct.issues[0]);
  sequence.push(EXECUTION_SEQUENCE[0]);
  const envelope = packet.stepVResult.singleUseExecutionEnvelope;
  sequence.push(EXECUTION_SEQUENCE[1]);
  const storeIssues = validateExecutionEnvelopeStore(
    packet.singleUseExternalExecutionEnvelopeStore);
  if (storeIssues.length) return block("blocked_before_envelope_claim", storeIssues[0]);
  sequence.push(EXECUTION_SEQUENCE[2]);
  const clock = parseInstant(packet.executionClockInstant);
  const approvalClock = parseInstant(envelope.approvalEvaluationClockInstant);
  const expiry = parseInstant(envelope.effectiveExecutionExpiresAt);
  if (clock === null || approvalClock === null || expiry === null ||
      clock < approvalClock || clock >= expiry) {
    return block("blocked_before_envelope_claim", "execution_clock_invalid_or_expired");
  }
  sequence.push(EXECUTION_SEQUENCE[3]);
  const store = packet.singleUseExternalExecutionEnvelopeStore;
  const claim = buildEnvelopeClaim(envelope, packet.stepVPacket.stepUPacket,
    packet.stepVPacket.stepUCeremonyResult);
  const plan = buildEnvelopeClaimPlan(envelope.singleUseExecutionEnvelopeHash);
  acquisitions++;
  const acquired = await callStore(store, "acquireExecutionEnvelopeClaim", claim,
    plan[0], packet.executionClockInstant, envelope.effectiveExecutionExpiresAt);
  if (acquired.kind === "committed" && isSha(acquired.resourceHash)) {
    claimHash = acquired.resourceHash;
  }
  else if (acquired.kind === "result" && exactKeys(acquired.value, ["outcome", "claimHash"]) &&
      acquired.value.outcome === "acquired" && isSha(acquired.value.claimHash)) {
    claimHash = acquired.value.claimHash;
  } else {
    const uncertain = acquired.kind === "ambiguous" ||
      acquired.value?.outcome === "ambiguous";
    return block(uncertain ? "execution_outcome_uncertain" :
      "blocked_before_runner_invocation", uncertain
        ? "execution_envelope_claim_outcome_ambiguous"
        : "execution_envelope_claim_not_acquired", uncertain);
  }
  sequence.push(EXECUTION_SEQUENCE[4]);
  const stepTPacket = { stepSPackage: packet.stepVPacket.stepUPacket.stepSPackage,
    runtimeCapabilities: packet.stepVPacket.stepUPacket.runtimeCapabilities,
    executionClockInstant: packet.executionClockInstant };
  sequence.push(EXECUTION_SEQUENCE[5]);
  runnerCalls++;
  let rawStepTResult; let runnerThrew = false;
  try { rawStepTResult = await stepT.runControlledLiveObservation(stepTPacket); }
  catch { runnerThrew = true; }
  sequence.push(EXECUTION_SEQUENCE[6]);
  const completedIssues = runnerThrew ? ["runner_threw"] :
    validateCompletedStepTResult(rawStepTResult, stepTPacket.stepSPackage);
  const completed = completedIssues.length === 0;
  const blockedIssues = completed || runnerThrew ? ["not_blocked"] :
    validateBlockedStepTResult(rawStepTResult);
  const canonicalBlocked = !completed && !runnerThrew && blockedIssues.length === 0;
  if (completed) {
    adapterCount = 1;
    stepTSummary = sanitizedStepTSummary("completed", rawStepTResult);
    sequence.push(EXECUTION_SEQUENCE[7], EXECUTION_SEQUENCE[8]);
  } else if (canonicalBlocked) {
    adapterCount = rawStepTResult.adapterInvocationCount;
    stepTSummary = sanitizedStepTSummary("blocked", rawStepTResult);
    sequence.push(EXECUTION_SEQUENCE[7]);
  } else {
    adapterCount = 0;
    stepTSummary = sanitizedStepTSummary("uncertain");
  }
  terminalState = completed ? "completed" :
    (canonicalBlocked && rawStepTResult.failureClassification !== "disposal_uncertain"
      ? (adapterCount === 0 ? "blocked_before_observation" : "blocked_after_observation")
      : "execution_outcome_uncertain");
  const terminalInput = {
    executionEnvelopeClaimHash: claimHash,
    singleUseExecutionEnvelopeId: envelope.singleUseExecutionEnvelopeId,
    singleUseExecutionEnvelopeHash: envelope.singleUseExecutionEnvelopeHash,
    stepTResultState: stepTSummary.status,
    adapterInvocationCount: adapterCount,
    executionClosureReceiptId: stepTSummary.executionClosureReceiptId,
    executionClosureReceiptHash: stepTSummary.executionClosureReceiptHash,
    disposalState: stepTSummary.disposalCompleted ? "completed" : "not_completed",
    executionClockInstant: packet.executionClockInstant,
    terminalState, automaticRetryAllowed: false,
    secondRunnerInvocationAllowed: false, secondObservationAllowed: false,
    rawMaterialPresent: false,
  };
  terminalizations++;
  const finalized = await callStore(store, "finalizeExecutionEnvelopeClaim", terminalInput,
    plan[1], packet.executionClockInstant, envelope.effectiveExecutionExpiresAt);
  let terminalizationHash = null;
  if (finalized.kind === "committed" && isSha(finalized.resourceHash)) {
    terminalizationHash = finalized.resourceHash;
  }
  else if (finalized.kind === "result" && exactKeys(finalized.value,
    ["outcome", "terminalState", "terminalizationHash"]) &&
    finalized.value.outcome === "finalized" && finalized.value.terminalState === terminalState &&
    isSha(finalized.value.terminalizationHash)) {
    terminalizationHash = finalized.value.terminalizationHash;
  }
  if (!terminalizationHash) return block("execution_outcome_uncertain",
    "execution_envelope_claim_terminalization_uncertain", true);
  sequence.push(EXECUTION_SEQUENCE[9]);
  if (!completed) return block(terminalState === "execution_outcome_uncertain"
    ? "execution_outcome_uncertain" : "blocked_after_runner_invocation",
  canonicalBlocked ? "step_t_canonical_blocked_result" :
    "step_t_execution_result_uncertain", terminalState === "execution_outcome_uncertain");
  const closeout = buildCloseoutReceipt(packet, claim, terminalizationHash, rawStepTResult);
  if (validateCloseoutReceipt(closeout, packet, claim, terminalizationHash,
    rawStepTResult).length) return block("blocked_after_runner_invocation",
    "execution_closeout_receipt_invalid");
  sequence.push(EXECUTION_SEQUENCE[10], EXECUTION_SEQUENCE[11]);
  return safeResult(PUBLIC_STATES[1], { executionSequence: sequence,
    envelopeClaimAcquisitionCount: acquisitions,
    envelopeClaimTerminalizationCount: terminalizations,
    stepTRunnerInvocationCount: runnerCalls, adapterInvocationCount: adapterCount,
    envelopeClaimTerminalState: terminalState, stepTExecutionSummary: stepTSummary,
    executionCloseoutReceipt: closeout });
}

module.exports = {
  EXECUTION_SEQUENCE, FAILURE_CLASSIFICATIONS, FIXED_FALSE_FIELDS, MERGED_MAIN_SHA,
  PUBLIC_STATES, STORE_METHODS, TERMINAL_STATES, VERSION,
  buildCloseoutReceipt, buildEnvelopeClaim, buildEnvelopeClaimPlan,
  buildExecutionEnvelopeStoreDescriptor, canonicalJson, directValidateStepV,
  executeSignedEnvelopeOnce, hashContract, safeResult,
  sanitizedStepTSummary, validateBlockedStepTResult, validateCloseoutReceipt,
  validateCompletedStepTResult, validateExecutionEnvelopeStore, validateStepTResult,
};

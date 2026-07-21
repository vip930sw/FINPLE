"use strict";

const { createHash } = require("node:crypto");
const stepY = require("./metrics-cutover-production-approval-envelope.cjs");
const productionPreparation = require("./metrics-cutover-production-execution-preparation.cjs");

const MERGED_MAIN_SHA = "c9dec6491643c03d2b7a14c0c91986a1c88351e7";
const VERSION = "finple.step114-2x-z.production-single-use-cutover-executor.v1";
const PUBLIC_STATES = Object.freeze([
  "awaiting_explicit_single_use_production_cutover_execution",
  "single_use_production_cutover_execution_completed",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_capability_invocation",
  "blocked_before_cutover_mutation",
  "blocked_during_cutover_execution",
  "rollback_completed",
  "manual_review_required",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "automaticRetryAllowed", "secondCutoverAttemptAllowed",
  "loaderActivationAllowed", "loaderActivationPerformed",
  "deploymentAllowed", "deploymentPerformed", "providerAccessAllowed",
  "databaseAccessAllowed", "networkAccessAllowed", "rawMaterialPresent",
]);
const INPUT_FIELDS = Object.freeze([
  "mergedMainSha", "stepYPacket", "stepYResult", "executionClockInstant",
  "singleUseCutoverEnvelopeStore", "cutoverClock", "cutoverPreimageReader",
  "atomicProductionCsvReplacer", "selectorMutationCoordinator",
  "cutoverReceiptStore", "rollbackCoordinator",
]);
const CAPABILITY_NAMES = Object.freeze([
  "singleUseCutoverEnvelopeStore", "cutoverClock", "cutoverPreimageReader",
  "atomicProductionCsvReplacer", "selectorMutationCoordinator",
  "cutoverReceiptStore", "rollbackCoordinator",
]);
const EXECUTION_TRACE = Object.freeze([
  "single_use_envelope_claim_acquired",
  "exact_preimages_re_read",
  "bound_preimages_no_drift_verified",
  "us_production_csv_atomically_replaced",
  "us_production_csv_result_verified",
  "kr_production_csv_atomically_replaced",
  "kr_production_csv_result_verified",
  "selector_mutated_exactly_once",
  "selector_postimage_and_cutover_result_verified",
  "sanitized_cutover_receipt_persisted",
  "single_use_envelope_claim_terminalized",
]);
const OPERATION_STAGES = Object.freeze([
  "acquire_envelope_claim", "read_exact_preimages", "replace_us_csv",
  "verify_us_csv", "replace_kr_csv", "verify_kr_csv", "mutate_selector",
  "verify_post_cutover_state", "persist_cutover_receipt",
  "terminalize_envelope_claim", "restore_bound_preimages",
  "verify_restored_preimages",
]);
const MUTATING_CAPABILITIES = Object.freeze(new Set([
  "singleUseCutoverEnvelopeStore", "atomicProductionCsvReplacer",
  "selectorMutationCoordinator", "cutoverReceiptStore", "rollbackCoordinator",
]));

const CAPABILITY_METHODS = Object.freeze({
  singleUseCutoverEnvelopeStore: Object.freeze([
    "acquireEnvelopeClaim", "reconcileOperationOutcome", "terminalizeEnvelopeClaim",
  ]),
  cutoverClock: Object.freeze(["readCutoverClock"]),
  cutoverPreimageReader: Object.freeze([
    "readBoundPreimages", "readProductionCsvIdentity", "readPostCutoverState",
  ]),
  atomicProductionCsvReplacer: Object.freeze([
    "replaceProductionCsvAtomically", "reconcileOperationOutcome",
  ]),
  selectorMutationCoordinator: Object.freeze([
    "mutateSelectorExactlyOnce", "reconcileOperationOutcome",
  ]),
  cutoverReceiptStore: Object.freeze([
    "persistCutoverReceipt", "reconcileOperationOutcome",
  ]),
  rollbackCoordinator: Object.freeze([
    "restoreBoundPreimages", "reconcileOperationOutcome",
  ]),
});

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
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isGitSha(value) { return typeof value === "string" && /^[0-9a-f]{40}$/.test(value); }
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function exactKeys(value, fields) {
  return isRecord(value) && canonicalEqual(Object.keys(value).sort(), [...fields].sort());
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
function uniqueSorted(values) { return [...new Set(values)].sort(); }
function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}
function emptyCounts() {
  return Object.fromEntries(CAPABILITY_NAMES.map((name) => [name, 0]));
}
function safeResult(status, overrides = {}) {
  return deepFreeze({
    ok: status === PUBLIC_STATES[1], status, contractVersion: VERSION,
    failureClassification: status === PUBLIC_STATES[2]
      ? overrides.failureClassification || FAILURE_CLASSIFICATIONS[0] : null,
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: overrides.manualReviewRequired === true,
    directValidationCompleted: overrides.directValidationCompleted === true,
    stepYDirectlyValidated: overrides.stepYDirectlyValidated === true,
    cutoverIdentityReconciled: overrides.cutoverIdentityReconciled === true,
    capabilityContractsValidated: overrides.capabilityContractsValidated === true,
    executionTrace: overrides.executionTrace || [],
    capabilityInvocationCounts: overrides.capabilityInvocationCounts || emptyCounts(),
    envelopeClaimAcquisitionCount: overrides.envelopeClaimAcquisitionCount || 0,
    envelopeClaimTerminalizationCount:
      overrides.envelopeClaimTerminalizationCount || 0,
    productionCsvReplacementCount: overrides.productionCsvReplacementCount || 0,
    selectorMutationCount: overrides.selectorMutationCount || 0,
    cutoverReceiptPersistenceCount: overrides.cutoverReceiptPersistenceCount || 0,
    rollbackInvocationCount: overrides.rollbackInvocationCount || 0,
    rollbackCompleted: overrides.rollbackCompleted === true,
    envelopeClaimTerminalState: overrides.envelopeClaimTerminalState || null,
    cutoverReceipt: overrides.cutoverReceipt || {},
    executionCloseout: overrides.executionCloseout || {},
    ...fixedFalse(),
  });
}

function buildCapabilityDescriptor(capabilityName) {
  if (!CAPABILITY_NAMES.includes(capabilityName)) throw new TypeError("unknown_capability");
  const mutating = MUTATING_CAPABILITIES.has(capabilityName);
  const body = {
    capabilityName,
    capabilityClass: `finple_step114_2x_z_${capabilityName}`,
    contractVersion: VERSION,
    methodNames: [...CAPABILITY_METHODS[capabilityName]],
    hardTimeoutMilliseconds: 100,
    invocationContextFields: [
      "operationId", "idempotencyKey", "deadline", "abortSignal",
    ],
    cooperativeCancellationRequired: true,
    deadlineEnforcementRequired: true,
    timeoutPolicy: mutating
      ? "cancel_then_read_only_reconcile_once_no_retry"
      : "cancel_then_fail_closed_no_retry",
    cancellationPolicy: "abort_signal_and_fixed_deadline",
    reconciliationPolicy: mutating
      ? "same_operation_and_idempotency_key_read_only_once"
      : "not_applicable_read_only_capability",
    idempotencyPolicy: mutating
      ? "one_domain_separated_key_per_bound_operation"
      : "read_only_operation_identity_only",
    namespacePolicy: `exact_step114_2x_z_${capabilityName}_namespace_only`,
    sanitizationPolicy: "identities_counts_states_and_hashes_only_no_raw_output",
    atomicMutationRequired: mutating,
    automaticRetryAllowed: false,
    fallbackAllowed: false,
    dynamicDiscoveryAllowed: false,
    ambientFilesystemLookupAllowed: false,
    providerAccessAllowed: false,
    databaseAccessAllowed: false,
    networkAccessAllowed: false,
    loaderActivationAllowed: false,
    deploymentAllowed: false,
    unboundedExecutionAllowed: false,
    rawMaterialOutputAllowed: false,
  };
  return deepFreeze({ ...body, descriptorHash: hashContract(
    "FINPLE_STEP114_2X_Z_CAPABILITY_DESCRIPTOR\0", body) });
}

function validateCapability(capabilityName, value) {
  const methods = CAPABILITY_METHODS[capabilityName];
  if (!exactKeys(value, ["descriptor", ...methods])) {
    return [`${capabilityName}_fields_invalid`];
  }
  if (!canonicalEqual(value.descriptor, buildCapabilityDescriptor(capabilityName))) {
    return [`${capabilityName}_descriptor_invalid`];
  }
  return methods.every((method) => typeof value[method] === "function")
    ? [] : [`${capabilityName}_method_invalid`];
}

function validateAllCapabilities(packet) {
  return uniqueSorted(CAPABILITY_NAMES.flatMap((name) =>
    validateCapability(name, packet[name])));
}

function candidateRows(bytes) {
  const text = bytes.toString("utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  return lines.length > 0 ? lines.length - 1 : -1;
}

function datasetIdentity(target) {
  return hashContract("FINPLE_STEP114_2X_X_DATASET_IDENTITY\0", {
    role: target.role, market: target.market, contentSha256: target.contentSha256,
    schemaVersion: target.schemaVersion, rowCount: target.rowCount,
    byteCount: target.byteCount,
  });
}

function validateExecutionMaterial(direct, envelope) {
  const issues = [];
  const executionPackage = direct.bound?.executionPackage;
  const targets = envelope.criticalBindings?.productionCsvTargets;
  const identities = envelope.criticalBindings?.productionCutoverIdentityManifest;
  if (!isRecord(executionPackage) || !Array.isArray(targets) || targets.length !== 2 ||
      !isRecord(identities) || !Array.isArray(identities.datasets) ||
      identities.datasets.length !== 2) return ["cutover_execution_material_invalid"];
  if (!canonicalEqual(targets.map((target) => target.market), ["US", "KR"]) ||
      !canonicalEqual(executionPackage.targetFiles.map((target) => target.market),
        ["US", "KR"])) issues.push("production_csv_target_order_invalid");
  for (let index = 0; index < 2; index++) {
    const source = executionPackage.targetFiles[index];
    const target = targets[index];
    let bytes;
    try { bytes = Buffer.from(source.contentBase64, "base64"); }
    catch { issues.push(`candidate_bytes_invalid:${target.market}`); continue; }
    if (bytes.toString("base64") !== source.contentBase64 ||
        sha256(bytes) !== target.contentSha256 || bytes.length !== target.byteCount ||
        candidateRows(bytes) !== target.rowCount ||
        target.datasetIdentityHash !== datasetIdentity(target) ||
        target.datasetIdentityHash !== identities.datasets[index].datasetIdentityHash ||
        target.schemaIdentitySha256 !== identities.datasets[index].schemaIdentitySha256 ||
        target.targetPath !== source.path || target.schemaVersion !== source.schemaVersion ||
        target.writeMode !== "create_only") {
      issues.push(`candidate_identity_invalid:${target.market}`);
    }
  }
  let selectorPreimage; let selectorPostimage;
  try {
    selectorPreimage = Buffer.from(executionPackage.selectorPreimage.selectorContentBase64,
      "base64");
    selectorPostimage = Buffer.from(executionPackage.selectorPostimage.selectorContentBase64,
      "base64");
  } catch { return uniqueSorted([...issues, "selector_bytes_invalid"]); }
  if (sha256(selectorPreimage) !== envelope.criticalBindings.selectorPreimageSha256 ||
      sha256(selectorPostimage) !==
        envelope.criticalBindings.selectorExpectedPostimageSha256 ||
      executionPackage.selectorPreimage.selectorPath !== identities.selector.selectorPath ||
      executionPackage.selectorPostimage.selectorPath !== identities.selector.selectorPath) {
    issues.push("selector_identity_invalid");
  }
  return uniqueSorted(issues);
}

function directValidateStepY(packet) {
  const issues = [];
  let rebuilt; let direct; let envelope;
  try { rebuilt = stepY.evaluateProductionCutoverApproval(packet.stepYPacket); }
  catch { return { issues: ["step_y_canonical_evaluation_failed"] }; }
  if (!rebuilt.ok || rebuilt.status !== stepY.PUBLIC_STATES[1] ||
      !canonicalEqual(rebuilt, packet.stepYResult)) {
    return { issues: ["step_y_packet_or_result_canonical_mismatch"], rebuilt };
  }
  try {
    direct = stepY.directValidateStepX(packet.stepYPacket.stepXPacket,
      packet.stepYPacket.stepXResult);
  } catch { return { issues: ["step_x_direct_validation_failed"], rebuilt }; }
  issues.push(...direct.issues);
  const approvalValidation = stepY.validateSignedProductionCutoverApproval(
    packet.stepYPacket.signedProductionCutoverApproval,
    packet.stepYPacket.productionCutoverApproverAllowlist,
    packet.stepYPacket.stepXPacket, packet.stepYPacket.stepXResult,
    packet.stepYPacket.priorApprovalNonceHashes,
    packet.stepYPacket.evaluationClockInstant, direct);
  issues.push(...approvalValidation.issues);
  envelope = rebuilt.singleUseProductionCutoverEnvelope;
  issues.push(...stepY.validateSingleUseProductionCutoverEnvelope(
    envelope, packet.stepYPacket.stepXPacket, packet.stepYPacket.stepXResult,
    packet.stepYPacket.signedProductionCutoverApproval,
    packet.stepYPacket.productionCutoverApproverAllowlist, direct));
  if (envelope.mergedMainSha !== stepY.MERGED_MAIN_SHA || envelope.singleUse !== true ||
      envelope.approvalVerified !== true ||
      envelope.productionWriteAuthorizedForLaterExplicitInvocation !== true ||
      envelope.rollbackPreimageRestorationRequired !== true ||
      envelope.maximumProductionCsvReplacementCount !== 2 ||
      envelope.maximumSelectorMutationCount !== 1 ||
      envelope.maximumLoaderActivationCount !== 0 ||
      envelope.maximumDeploymentCount !== 0 ||
      !canonicalEqual(envelope.criticalBindings.futureCutoverOperationOrder,
        productionPreparation.OPERATION_ORDER)) {
    issues.push("single_use_envelope_constraints_invalid");
  }
  for (const field of stepY.FIXED_FALSE_FIELDS) {
    if (envelope[field] !== false || packet.stepYResult[field] !== false) {
      issues.push(`step_y_fixed_false_invalid:${field}`);
    }
  }
  issues.push(...validateExecutionMaterial(direct, envelope));
  const executionClock = parseInstant(packet.executionClockInstant);
  const approvalClock = parseInstant(packet.stepYPacket.evaluationClockInstant);
  const expiry = parseInstant(envelope.effectiveCutoverExpiresAt);
  if (executionClock === null || approvalClock === null || expiry === null ||
      executionClock < approvalClock || executionClock >= expiry) {
    issues.push("cutover_execution_clock_invalid_or_expired");
  }
  return { issues: uniqueSorted(issues), rebuilt, direct, envelope,
    executionPackage: direct.bound?.executionPackage };
}

function buildOperationPlan(envelopeHash) {
  return deepFreeze(OPERATION_STAGES.map((stage, index) => {
    const seed = { envelopeHash, sequence: index + 1, stage };
    return {
      sequence: index + 1, stage,
      operationId: `step114-2x-z-${stage}-${hashContract(
        "FINPLE_STEP114_2X_Z_OPERATION_ID\0", seed)}`,
      idempotencyKey: hashContract(
        "FINPLE_STEP114_2X_Z_IDEMPOTENCY_KEY\0", seed),
    };
  }));
}

async function raceCall(invoke, milliseconds) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ kind: "timeout" }), Math.max(0, milliseconds));
  });
  try {
    return await Promise.race([
      Promise.resolve().then(invoke).then((value) => ({ kind: "result", value }),
        () => ({ kind: "error" })),
      timeout,
    ]);
  } finally { clearTimeout(timer); }
}

async function invokeCapability(capabilityName, capability, method, payload,
  operation, executionClockInstant, effectiveExpiry, counts) {
  counts[capabilityName]++;
  const clockMs = parseInstant(executionClockInstant);
  const expiryMs = parseInstant(effectiveExpiry);
  const remaining = expiryMs - clockMs;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { kind: "expired", issue: `${operation.stage}_expired` };
  }
  const timeoutMs = Math.min(capability.descriptor.hardTimeoutMilliseconds, remaining);
  const controller = new AbortController();
  const deadlineMs = clockMs + timeoutMs;
  const context = { operationId: operation.operationId,
    idempotencyKey: operation.idempotencyKey,
    deadline: new Date(deadlineMs).toISOString(), abortSignal: controller.signal };
  const primary = await raceCall(() => capability[method](payload, context), timeoutMs);
  if (primary.kind === "result") return { kind: "result", value: primary.value };
  controller.abort();
  if (!MUTATING_CAPABILITIES.has(capabilityName)) {
    return { kind: primary.kind, issue: `${operation.stage}_${primary.kind}` };
  }
  const reconciliationController = new AbortController();
  const reconciliationDeadlineMs = Math.min(expiryMs,
    deadlineMs + capability.descriptor.hardTimeoutMilliseconds);
  const reconciliationContext = { operationId: operation.operationId,
    idempotencyKey: operation.idempotencyKey,
    deadline: new Date(reconciliationDeadlineMs).toISOString(),
    abortSignal: reconciliationController.signal };
  counts[capabilityName]++;
  const reconciled = await raceCall(() => capability.reconcileOperationOutcome({
    operationId: operation.operationId, idempotencyKey: operation.idempotencyKey,
  }, reconciliationContext), reconciliationDeadlineMs - deadlineMs);
  if (reconciled.kind !== "result") {
    reconciliationController.abort();
    return { kind: "ambiguous", issue: `${operation.stage}_reconciliation_${reconciled.kind}` };
  }
  const value = reconciled.value;
  if (!exactKeys(value, ["outcome", "resourceHash"]) ||
      !["committed", "not_committed", "ambiguous"].includes(value.outcome) ||
      (value.outcome === "committed" ? !isSha(value.resourceHash) :
        value.resourceHash !== null)) {
    return { kind: "ambiguous", issue: `${operation.stage}_reconciliation_invalid` };
  }
  return { kind: value.outcome, resourceHash: value.resourceHash,
    issue: `${operation.stage}_${value.outcome}` };
}

function expectedPreimageSnapshot(validation) {
  const bindings = validation.envelope.criticalBindings;
  const executionPackage = validation.executionPackage;
  return {
    repositoryPreimageSha256: bindings.repositoryPreimageSha256,
    repositoryHeadSha: bindings.repositoryHeadSha,
    repositoryTreeSha: bindings.repositoryTreeSha,
    trackedPathsSha256:
      bindings.productionCutoverIdentityManifest.repository.trackedPathsSha256,
    targetAbsenceAttestationHash: bindings.targetAbsenceAttestationHash,
    noDriftAttestationHash: bindings.noDriftAttestationHash,
    selectorPath: executionPackage.selectorPreimage.selectorPath,
    selectorPreimageSha256: bindings.selectorPreimageSha256,
    targets: bindings.productionCsvTargets.map((target) => ({
      market: target.market, targetPath: target.targetPath,
      exists: false, preimageSha256: null,
    })),
  };
}

function expectedCsvIdentity(target) {
  return {
    market: target.market, targetPath: target.targetPath,
    contentSha256: target.contentSha256,
    schemaVersion: target.schemaVersion,
    schemaIdentitySha256: target.schemaIdentitySha256,
    datasetIdentityHash: target.datasetIdentityHash,
    rowCount: target.rowCount, byteCount: target.byteCount,
  };
}

function buildCutoverReceipt(validation, claimHash, trace, results,
  executionClockInstant) {
  const envelope = validation.envelope;
  const bindings = envelope.criticalBindings;
  const body = {
    contractVersion: "finple.step114-2x-z.sanitized-cutover-receipt.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    singleUseProductionCutoverEnvelopeId:
      envelope.singleUseProductionCutoverEnvelopeId,
    singleUseProductionCutoverEnvelopeHash:
      envelope.singleUseProductionCutoverEnvelopeHash,
    envelopeClaimHash: claimHash,
    productionCutoverApprovalId: envelope.productionCutoverApprovalId,
    productionCutoverApprovalHash: envelope.productionCutoverApprovalHash,
    stepXReconciledEvidenceManifestId: bindings.stepXReconciledEvidenceManifestId,
    stepXReconciledEvidenceManifestHash: bindings.stepXReconciledEvidenceManifestHash,
    repositoryPreimageSha256: bindings.repositoryPreimageSha256,
    repositoryHeadSha: bindings.repositoryHeadSha,
    repositoryTreeSha: bindings.repositoryTreeSha,
    productionCsvResults: results.productionCsvResults,
    selectorPath: bindings.productionCutoverIdentityManifest.selector.selectorPath,
    selectorPreimageSha256: bindings.selectorPreimageSha256,
    selectorPostimageSha256: bindings.selectorExpectedPostimageSha256,
    executionTrace: [...trace],
    executionTraceHash: hashContract("FINPLE_STEP114_2X_Z_EXECUTION_TRACE\0", trace),
    executionClockInstant,
    maximumProductionCsvReplacementCount: 2,
    maximumSelectorMutationCount: 1,
    productionCsvReplacementCount: 2,
    selectorMutationCount: 1,
    receiptPersistenceCount: 1,
    claimTerminalizationPending: true,
    rollbackRequiredOnTerminalizationFailure: true,
    automaticRetryAllowed: false,
    secondCutoverAttemptAllowed: false,
    loaderActivationPerformed: false,
    deploymentPerformed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_Z_CUTOVER_RECEIPT_ID\0", body);
  const withId = { ...body,
    cutoverReceiptId: `step114-2x-z-cutover-receipt-${idHash}` };
  return deepFreeze({ ...withId, cutoverReceiptHash: hashContract(
    "FINPLE_STEP114_2X_Z_CUTOVER_RECEIPT_HASH\0", withId) });
}

function buildExecutionCloseout(validation, receipt, receiptStoreHash,
  claimTerminalizationHash, executionClockInstant) {
  const body = {
    contractVersion: "finple.step114-2x-z.execution-closeout.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    singleUseProductionCutoverEnvelopeId:
      validation.envelope.singleUseProductionCutoverEnvelopeId,
    singleUseProductionCutoverEnvelopeHash:
      validation.envelope.singleUseProductionCutoverEnvelopeHash,
    cutoverReceiptId: receipt.cutoverReceiptId,
    cutoverReceiptHash: receipt.cutoverReceiptHash,
    cutoverReceiptStoreHash: receiptStoreHash,
    envelopeClaimTerminalizationHash: claimTerminalizationHash,
    executionClockInstant,
    terminalState: "completed",
    exactOnce: true,
    manualReviewRequired: false,
    automaticRetryAllowed: false,
    secondCutoverAttemptAllowed: false,
    loaderActivationPerformed: false,
    deploymentPerformed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_Z_EXECUTION_CLOSEOUT_ID\0", body);
  const withId = { ...body,
    executionCloseoutId: `step114-2x-z-execution-closeout-${idHash}` };
  return deepFreeze({ ...withId, executionCloseoutHash: hashContract(
    "FINPLE_STEP114_2X_Z_EXECUTION_CLOSEOUT_HASH\0", withId) });
}

async function executeSingleUseProductionCutover(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  const counts = emptyCounts();
  const state = {
    trace: [], claimAcquisitions: 0, claimTerminalizations: 0,
    replacements: 0, selectorMutations: 0, receiptPersistences: 0,
    rollbackInvocations: 0, claimTerminalState: null, claimHash: null,
  };
  let validation;
  const result = (classification, issue, manualReviewRequired = false, extra = {}) =>
    safeResult(PUBLIC_STATES[2], {
      failureClassification: classification, blockingIssues: [issue],
      manualReviewRequired, directValidationCompleted: validation?.issues.length === 0,
      stepYDirectlyValidated: validation?.issues.length === 0,
      cutoverIdentityReconciled: validation?.issues.length === 0,
      capabilityContractsValidated: extra.capabilityContractsValidated === true,
      executionTrace: [...state.trace], capabilityInvocationCounts: { ...counts },
      envelopeClaimAcquisitionCount: state.claimAcquisitions,
      envelopeClaimTerminalizationCount: state.claimTerminalizations,
      productionCsvReplacementCount: state.replacements,
      selectorMutationCount: state.selectorMutations,
      cutoverReceiptPersistenceCount: state.receiptPersistences,
      rollbackInvocationCount: state.rollbackInvocations,
      rollbackCompleted: extra.rollbackCompleted === true,
      envelopeClaimTerminalState: state.claimTerminalState,
    });
  if (!exactKeys(packet, INPUT_FIELDS)) {
    return result(FAILURE_CLASSIFICATIONS[0], "step_z_packet_fields_invalid");
  }
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) {
    return result(FAILURE_CLASSIFICATIONS[0], "merged_main_sha_invalid");
  }
  try { validation = directValidateStepY(packet); }
  catch { return result(FAILURE_CLASSIFICATIONS[0], "direct_validation_failed"); }
  if (validation.issues.length) {
    return result(FAILURE_CLASSIFICATIONS[0], validation.issues[0]);
  }
  const capabilityIssues = validateAllCapabilities(packet);
  if (capabilityIssues.length) {
    return result(FAILURE_CLASSIFICATIONS[0], capabilityIssues[0]);
  }
  const capabilityContractsValidated = true;
  const envelope = validation.envelope;
  const expiry = envelope.effectiveCutoverExpiresAt;
  const plan = buildOperationPlan(envelope.singleUseProductionCutoverEnvelopeHash);
  const clockSeed = { envelopeHash: envelope.singleUseProductionCutoverEnvelopeHash,
    sequence: 0, stage: "read_cutover_clock" };
  const clockOperation = {
    sequence: 0, stage: "read_cutover_clock",
    operationId: `step114-2x-z-read_cutover_clock-${hashContract(
      "FINPLE_STEP114_2X_Z_OPERATION_ID\0", clockSeed)}`,
    idempotencyKey: hashContract(
      "FINPLE_STEP114_2X_Z_IDEMPOTENCY_KEY\0", clockSeed),
  };
  const clockInvocation = await invokeCapability("cutoverClock", packet.cutoverClock,
    "readCutoverClock", {
      expectedInstant: packet.executionClockInstant,
      effectiveExpiry: expiry,
    }, clockOperation, packet.executionClockInstant, expiry, counts);
  if (clockInvocation.kind !== "result") {
    return result(FAILURE_CLASSIFICATIONS[1], "cutover_clock_failed", false,
      { capabilityContractsValidated });
  }
  const clockResult = clockInvocation.value;
  if (!exactKeys(clockResult, ["instant"]) ||
      clockResult.instant !== packet.executionClockInstant ||
      parseInstant(clockResult.instant) >= parseInstant(expiry)) {
    return result(FAILURE_CLASSIFICATIONS[1], "cutover_clock_drift_or_expired", false,
      { capabilityContractsValidated });
  }

  const invoke = (name, method, payload, operation) => invokeCapability(
    name, packet[name], method, payload, operation, packet.executionClockInstant,
    expiry, counts);
  const terminalize = async (terminalState, receipt = null) => {
    if (state.claimTerminalizations !== 0) return { kind: "ambiguous",
      issue: "second_claim_terminalization_forbidden" };
    state.claimTerminalizations++;
    const response = await invoke("singleUseCutoverEnvelopeStore",
      "terminalizeEnvelopeClaim", {
        envelopeId: envelope.singleUseProductionCutoverEnvelopeId,
        envelopeHash: envelope.singleUseProductionCutoverEnvelopeHash,
        claimHash: state.claimHash, terminalState,
        cutoverReceiptId: receipt?.cutoverReceiptId || null,
        cutoverReceiptHash: receipt?.cutoverReceiptHash || null,
        automaticRetryAllowed: false, secondCutoverAttemptAllowed: false,
        rawMaterialPresent: false,
      }, plan[9]);
    if (response.kind === "committed") return response;
    if (response.kind === "result" && exactKeys(response.value,
      ["outcome", "terminalState", "terminalizationHash"]) &&
      response.value.outcome === "terminalized" &&
      response.value.terminalState === terminalState &&
      isSha(response.value.terminalizationHash)) {
      return { kind: "terminalized", resourceHash: response.value.terminalizationHash };
    }
    return { kind: response.kind === "ambiguous" ? "ambiguous" : "failed",
      issue: response.issue || "claim_terminalization_failed" };
  };

  const rollback = async (failureStage, manualHint = false) => {
    state.rollbackInvocations++;
    const restored = await invoke("rollbackCoordinator", "restoreBoundPreimages", {
      failureStage, envelopeId: envelope.singleUseProductionCutoverEnvelopeId,
      envelopeHash: envelope.singleUseProductionCutoverEnvelopeHash,
      exactPreimages: expectedPreimageSnapshot(validation),
      restoreUsTarget: state.replacements >= 1 || failureStage === "replace_us_csv",
      restoreKrTarget: state.replacements >= 2 || failureStage === "replace_kr_csv",
      restoreSelector: state.selectorMutations >= 1 || failureStage === "mutate_selector",
      receiptMayExist: state.receiptPersistences >= 1 ||
        failureStage === "persist_cutover_receipt" ||
        failureStage === "terminalize_envelope_claim",
      rawMaterialPresent: false,
    }, plan[10]);
    if (!(restored.kind === "committed" ||
        (restored.kind === "result" && exactKeys(restored.value,
          ["outcome", "restorationHash"]) &&
          restored.value.outcome === "restored" && isSha(restored.value.restorationHash)))) {
      if (state.claimTerminalizations === 0) {
        const terminal = await terminalize("manual_review_required");
        state.claimTerminalState = terminal.kind === "terminalized" ||
          terminal.kind === "committed" ? "manual_review_required" :
          "terminalization_uncertain";
      }
      return { ok: false, manual: true,
        issue: restored.issue || "rollback_outcome_ambiguous" };
    }
    const verification = await invoke("cutoverPreimageReader", "readBoundPreimages", {
      envelopeId: envelope.singleUseProductionCutoverEnvelopeId,
      expectedPreimages: expectedPreimageSnapshot(validation),
      verificationPurpose: "rollback_preimage_restoration",
    }, plan[11]);
    if (verification.kind !== "result" ||
        !canonicalEqual(verification.value, expectedPreimageSnapshot(validation))) {
      if (state.claimTerminalizations === 0) {
        const terminal = await terminalize("manual_review_required");
        state.claimTerminalState = terminal.kind === "terminalized" ||
          terminal.kind === "committed" ? "manual_review_required" :
          "terminalization_uncertain";
      }
      return { ok: false, manual: true, issue: "rollback_verification_ambiguous" };
    }
    if (state.claimTerminalizations === 0) {
      const terminal = await terminalize("rolled_back");
      if (!(terminal.kind === "terminalized" || terminal.kind === "committed")) {
        state.claimTerminalState = "terminalization_uncertain";
        return { ok: false, manual: true,
          issue: terminal.issue || "rollback_claim_terminalization_ambiguous" };
      }
      state.claimTerminalState = "rolled_back";
    }
    return { ok: true, manual: manualHint, issue: "rollback_completed" };
  };

  state.claimAcquisitions++;
  const claim = await invoke("singleUseCutoverEnvelopeStore", "acquireEnvelopeClaim", {
    envelopeId: envelope.singleUseProductionCutoverEnvelopeId,
    envelopeHash: envelope.singleUseProductionCutoverEnvelopeHash,
    approvalNonceHash: envelope.approvalNonceHash,
    effectiveCutoverExpiresAt: expiry,
    singleUse: true, automaticRetryAllowed: false,
    secondCutoverAttemptAllowed: false, rawMaterialPresent: false,
  }, plan[0]);
  if (claim.kind === "committed") state.claimHash = claim.resourceHash;
  else if (claim.kind === "result" && exactKeys(claim.value,
    ["outcome", "claimHash"]) && claim.value.outcome === "acquired" &&
    isSha(claim.value.claimHash)) state.claimHash = claim.value.claimHash;
  else {
    const ambiguous = claim.kind === "ambiguous" ||
      claim.value?.outcome === "ambiguous";
    return result(ambiguous ? FAILURE_CLASSIFICATIONS[4] : FAILURE_CLASSIFICATIONS[1],
      ambiguous ? "envelope_claim_outcome_ambiguous" :
        claim.value?.outcome === "already_consumed" ? "envelope_already_consumed" :
          "envelope_claim_not_acquired", ambiguous,
      { capabilityContractsValidated });
  }
  state.trace.push(EXECUTION_TRACE[0]);

  const preimage = await invoke("cutoverPreimageReader", "readBoundPreimages", {
    envelopeId: envelope.singleUseProductionCutoverEnvelopeId,
    expectedPreimages: expectedPreimageSnapshot(validation),
    verificationPurpose: "immediate_pre_mutation_no_drift",
  }, plan[1]);
  if (preimage.kind !== "result") {
    await terminalize("blocked_before_mutation");
    state.claimTerminalState = "blocked_before_mutation";
    return result(FAILURE_CLASSIFICATIONS[1], "preimage_read_failed", false,
      { capabilityContractsValidated });
  }
  state.trace.push(EXECUTION_TRACE[1]);
  if (!canonicalEqual(preimage.value, expectedPreimageSnapshot(validation))) {
    await terminalize("blocked_before_mutation");
    state.claimTerminalState = "blocked_before_mutation";
    return result(FAILURE_CLASSIFICATIONS[1], "bound_preimage_drift_detected", false,
      { capabilityContractsValidated });
  }
  state.trace.push(EXECUTION_TRACE[2]);

  const targets = envelope.criticalBindings.productionCsvTargets;
  const sourceTargets = validation.executionPackage.targetFiles;
  const csvResults = [];
  for (let index = 0; index < 2; index++) {
    const target = targets[index];
    const stage = index === 0 ? "replace_us_csv" : "replace_kr_csv";
    const replaced = await invoke("atomicProductionCsvReplacer",
      "replaceProductionCsvAtomically", {
        market: target.market, targetPath: target.targetPath,
        candidateContentBase64: sourceTargets[index].contentBase64,
        expectedContentSha256: target.contentSha256,
        expectedByteCount: target.byteCount, expectedRowCount: target.rowCount,
        expectedSchemaVersion: target.schemaVersion,
        requireCreateOnlyPreimage: true,
        stagingRenameAtomicityRequired: true,
        replaceCountLimit: 2, sequence: index + 1,
        rawMaterialOutputAllowed: false,
      }, plan[index === 0 ? 2 : 4]);
    if (!(replaced.kind === "committed" ||
        (replaced.kind === "result" && exactKeys(replaced.value,
          ["outcome", "replacementHash"]) && replaced.value.outcome === "replaced" &&
          isSha(replaced.value.replacementHash)))) {
      const rolled = await rollback(stage, replaced.kind === "ambiguous");
      return result(rolled.manual ? FAILURE_CLASSIFICATIONS[4] :
        FAILURE_CLASSIFICATIONS[3], rolled.issue, rolled.manual,
      { capabilityContractsValidated, rollbackCompleted: rolled.ok });
    }
    state.replacements++;
    state.trace.push(EXECUTION_TRACE[index === 0 ? 3 : 5]);
    const verified = await invoke("cutoverPreimageReader", "readProductionCsvIdentity", {
      market: target.market, targetPath: target.targetPath,
      expectedIdentity: expectedCsvIdentity(target),
    }, plan[index === 0 ? 3 : 5]);
    if (verified.kind !== "result" ||
        !canonicalEqual(verified.value, expectedCsvIdentity(target))) {
      const rolled = await rollback(index === 0 ? "verify_us_csv" : "verify_kr_csv",
        verified.kind === "ambiguous");
      return result(rolled.manual ? FAILURE_CLASSIFICATIONS[4] :
        FAILURE_CLASSIFICATIONS[3], rolled.issue, rolled.manual,
      { capabilityContractsValidated, rollbackCompleted: rolled.ok });
    }
    csvResults.push(verified.value);
    state.trace.push(EXECUTION_TRACE[index === 0 ? 4 : 6]);
  }

  const selector = validation.executionPackage.selectorPreimage;
  const selectorPostimage = validation.executionPackage.selectorPostimage;
  const mutated = await invoke("selectorMutationCoordinator",
    "mutateSelectorExactlyOnce", {
      selectorPath: selector.selectorPath,
      selectorPreimageBase64: selector.selectorContentBase64,
      selectorPreimageSha256: envelope.criticalBindings.selectorPreimageSha256,
      selectorPostimageBase64: selectorPostimage.selectorContentBase64,
      selectorExpectedPostimageSha256:
        envelope.criticalBindings.selectorExpectedPostimageSha256,
      exactReplacementCount: 2, selectorMutationCountLimit: 1,
      atomicStagingRenameRequired: true, rawMaterialOutputAllowed: false,
    }, plan[6]);
  if (!(mutated.kind === "committed" ||
      (mutated.kind === "result" && exactKeys(mutated.value,
        ["outcome", "mutationHash"]) && mutated.value.outcome === "mutated" &&
        isSha(mutated.value.mutationHash)))) {
    const rolled = await rollback("mutate_selector", mutated.kind === "ambiguous");
    return result(rolled.manual ? FAILURE_CLASSIFICATIONS[4] : FAILURE_CLASSIFICATIONS[3],
      rolled.issue, rolled.manual,
      { capabilityContractsValidated, rollbackCompleted: rolled.ok });
  }
  state.selectorMutations++;
  state.trace.push(EXECUTION_TRACE[7]);
  const expectedPostState = {
    repositoryHeadSha: envelope.criticalBindings.repositoryHeadSha,
    repositoryTreeSha: envelope.criticalBindings.repositoryTreeSha,
    changedPaths: [...targets.map((target) => target.targetPath), selector.selectorPath],
    productionCsvResults: csvResults,
    selectorPath: selector.selectorPath,
    selectorPostimageSha256: envelope.criticalBindings.selectorExpectedPostimageSha256,
    productionCsvReplacementCount: 2, selectorMutationCount: 1,
    loaderActivationCount: 0, deploymentCount: 0,
  };
  const postState = await invoke("cutoverPreimageReader", "readPostCutoverState", {
    envelopeId: envelope.singleUseProductionCutoverEnvelopeId,
    expectedPostState,
  }, plan[7]);
  if (postState.kind !== "result" ||
      !canonicalEqual(postState.value, expectedPostState)) {
    const rolled = await rollback("verify_post_cutover_state",
      postState.kind === "ambiguous");
    return result(rolled.manual ? FAILURE_CLASSIFICATIONS[4] : FAILURE_CLASSIFICATIONS[3],
      rolled.issue, rolled.manual,
      { capabilityContractsValidated, rollbackCompleted: rolled.ok });
  }
  state.trace.push(EXECUTION_TRACE[8]);

  const receipt = buildCutoverReceipt(validation, state.claimHash,
    [...state.trace, EXECUTION_TRACE[9]], { productionCsvResults: csvResults },
    packet.executionClockInstant);
  const persisted = await invoke("cutoverReceiptStore", "persistCutoverReceipt",
    receipt, plan[8]);
  let receiptStoreHash = null;
  if (persisted.kind === "committed") receiptStoreHash = persisted.resourceHash;
  else if (persisted.kind === "result" && exactKeys(persisted.value,
    ["outcome", "receiptStoreHash"]) && persisted.value.outcome === "persisted" &&
    isSha(persisted.value.receiptStoreHash)) receiptStoreHash = persisted.value.receiptStoreHash;
  if (!receiptStoreHash) {
    const rolled = await rollback("persist_cutover_receipt", persisted.kind === "ambiguous");
    return result(rolled.manual ? FAILURE_CLASSIFICATIONS[4] : FAILURE_CLASSIFICATIONS[3],
      rolled.issue, rolled.manual,
      { capabilityContractsValidated, rollbackCompleted: rolled.ok });
  }
  state.receiptPersistences++;
  state.trace.push(EXECUTION_TRACE[9]);
  const terminal = await terminalize("completed", receipt);
  if (!(terminal.kind === "terminalized" || terminal.kind === "committed")) {
    const rolled = await rollback("terminalize_envelope_claim", true);
    return result(FAILURE_CLASSIFICATIONS[4], rolled.issue, true,
      { capabilityContractsValidated, rollbackCompleted: rolled.ok });
  }
  state.claimTerminalState = "completed";
  state.trace.push(EXECUTION_TRACE[10]);
  const closeout = buildExecutionCloseout(validation, receipt, receiptStoreHash,
    terminal.resourceHash, packet.executionClockInstant);
  return safeResult(PUBLIC_STATES[1], {
    directValidationCompleted: true, stepYDirectlyValidated: true,
    cutoverIdentityReconciled: true, capabilityContractsValidated: true,
    executionTrace: [...state.trace], capabilityInvocationCounts: { ...counts },
    envelopeClaimAcquisitionCount: state.claimAcquisitions,
    envelopeClaimTerminalizationCount: state.claimTerminalizations,
    productionCsvReplacementCount: state.replacements,
    selectorMutationCount: state.selectorMutations,
    cutoverReceiptPersistenceCount: state.receiptPersistences,
    rollbackInvocationCount: state.rollbackInvocations,
    envelopeClaimTerminalState: state.claimTerminalState,
    cutoverReceipt: receipt, executionCloseout: closeout,
  });
}

module.exports = {
  CAPABILITY_METHODS, CAPABILITY_NAMES, EXECUTION_TRACE, FAILURE_CLASSIFICATIONS,
  FIXED_FALSE_FIELDS, INPUT_FIELDS, MERGED_MAIN_SHA, OPERATION_STAGES,
  PUBLIC_STATES, VERSION,
  buildCapabilityDescriptor, buildCutoverReceipt, buildExecutionCloseout,
  buildOperationPlan, canonicalJson, datasetIdentity, deepFreeze,
  directValidateStepY, executeSingleUseProductionCutover, hashContract,
  safeResult, validateAllCapabilities, validateCapability,
};

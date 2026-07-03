import {
  STEP124_CLEARANCE_PREFLIGHT_FLAGS,
  buildAdminManualApprovalOrderDraftClearancePreflightStatus,
} from "./tradingManualApprovalOrderDraftClearancePreflightGate.js";

export const STEP125_CLEARANCE_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP124_CLEARANCE_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const REDACTED_MANUAL_APPROVAL_CLEARANCE_REVIEW_RESULT_SCHEMA = Object.freeze({
  receiptId: "string",
  receiptType: "manual_approval_clearance_review_result",
  sourceStep: "step125",
  sourcePreflightStep: "step124",
  preflightStatus: "blocked | pending_review | not_ready",
  reviewStatus: "review_recorded",
  decision: "clearance_not_granted",
  blockerCount: "number",
  recordedAt: "iso8601",
  storage: "in_memory_only",
  flags: "all_false",
  redaction: "metadata_only_no_private_values",
});

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sanitizeBlockerCodes(blockers) {
  if (!Array.isArray(blockers)) return [];
  return blockers.map((_, index) => `redacted_clearance_review_blocker_${index + 1}`);
}

function makeRedaction() {
  return {
    schema: "step125_redacted_manual_approval_clearance_review_result_v1",
    metadataOnly: true,
    containsCredential: false,
    containsAccountIdentifier: false,
    containsProviderPayload: false,
    containsOrderPayload: false,
    containsPrivatePath: false,
    containsRawReceipt: false,
    containsHashValue: false,
    containsDigestValue: false,
  };
}

export function reviewManualApprovalClearancePreflight(input = {}, options = {}) {
  const preflightStatus =
    input.preflightStatus || buildAdminManualApprovalOrderDraftClearancePreflightStatus(input.preflightInput || {}, options);
  const preflight = preflightStatus.preflight || {};
  const blockers = unique([
    "manual_approval_clearance_review_defaults_to_not_granted",
    preflight.clearanceStatus === "pending_review" ? "clearance_preflight_pending_review" : null,
    preflight.clearanceStatus === "blocked" ? "clearance_preflight_blocked" : null,
    ...(Array.isArray(preflight.blockers) ? preflight.blockers : []),
  ]);

  return {
    reviewId: options.reviewId || "step125_manual_approval_clearance_review_redacted",
    reviewType: "manual_approval_clearance_review",
    sourceStep: "step125",
    sourcePreflightStep: "step124",
    status: "review_recorded",
    decision: "clearance_not_granted",
    preflightStatus: preflight.clearanceStatus || "blocked",
    blockerCount: blockers.length,
    blockerCodes: sanitizeBlockerCodes(blockers),
    reviewedAt: options.reviewedAt || new Date().toISOString(),
    flags: { ...STEP125_CLEARANCE_REVIEW_RESULT_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function createRedactedManualApprovalClearanceReviewResultReceipt(reviewResult = {}, options = {}) {
  const blockers = Array.isArray(reviewResult.blockerCodes) ? reviewResult.blockerCodes : [];
  const index = Number.isInteger(options.index) && options.index >= 0 ? options.index : 0;

  return {
    receiptId: `step125_manual_approval_clearance_review_result_${index + 1}`,
    receiptType: "manual_approval_clearance_review_result",
    sourceStep: "step125",
    sourcePreflightStep: "step124",
    preflightStatus: reviewResult.preflightStatus || "blocked",
    reviewStatus: "review_recorded",
    decision: "clearance_not_granted",
    blockerCount: Number(reviewResult.blockerCount || blockers.length || 0),
    blockerCodes: sanitizeBlockerCodes(blockers),
    recordedAt: options.recordedAt || new Date().toISOString(),
    storage: "in_memory_only",
    persistentStorageUsed: false,
    dbWriteUsed: false,
    flags: { ...STEP125_CLEARANCE_REVIEW_RESULT_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
  };
}

export function createInMemoryManualApprovalClearanceReviewResultRecorder(seedReceipts = []) {
  const receipts = seedReceipts.map((receipt, index) =>
    createRedactedManualApprovalClearanceReviewResultReceipt(receipt, { index }),
  );

  return {
    storage: "memory",
    persistentStorageUsed: false,
    dbWriteUsed: false,
    record(reviewResults = [], options = {}) {
      const nextReceipts = (Array.isArray(reviewResults) ? reviewResults : []).map((reviewResult, index) =>
        createRedactedManualApprovalClearanceReviewResultReceipt(reviewResult, {
          index: receipts.length + index,
          recordedAt: options.recordedAt,
        }),
      );
      receipts.push(...nextReceipts);
      return nextReceipts;
    },
    snapshot() {
      return {
        storage: "memory",
        persistentStorageUsed: false,
        dbWriteUsed: false,
        receiptCount: receipts.length,
        receipts: receipts.slice(),
      };
    },
  };
}

export function recordManualApprovalClearanceReviewResults(input = {}, options = {}) {
  const reviewResult =
    input.reviewResult || reviewManualApprovalClearancePreflight(input.reviewInput || {}, options);
  const recorder = options.recorder || createInMemoryManualApprovalClearanceReviewResultRecorder();
  const receipts = recorder.record([reviewResult], { recordedAt: options.recordedAt });
  const snapshot = recorder.snapshot();

  return {
    ok: true,
    step: "Step 125: Add manual approval clearance review result recording gate",
    status: "manual_approval_clearance_review_result_recorded_fail_closed",
    receiptSchema: REDACTED_MANUAL_APPROVAL_CLEARANCE_REVIEW_RESULT_SCHEMA,
    review: {
      status: reviewResult.status || "review_recorded",
      decision: "clearance_not_granted",
      preflightStatus: reviewResult.preflightStatus || "blocked",
      blockerCount: reviewResult.blockerCount || 0,
      readinessPromoted: false,
    },
    receipts,
    recorder: snapshot,
    flags: { ...STEP125_CLEARANCE_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminManualApprovalClearanceReviewResultGateStatus(input = {}, options = {}) {
  const recording = recordManualApprovalClearanceReviewResults(input, options);

  return {
    ok: true,
    step: "Step 125: Add manual approval clearance review result recording gate",
    status: "admin_only_manual_approval_clearance_review_result_gate_fail_closed",
    receiptSchema: REDACTED_MANUAL_APPROVAL_CLEARANCE_REVIEW_RESULT_SCHEMA,
    recording,
    receiptCount: recording.receipts.length,
    receipts: recording.receipts,
    flags: { ...STEP125_CLEARANCE_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

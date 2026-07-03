import {
  STEP122_ORDER_DRAFT_FLAGS,
  buildAdminManualApprovalOrderDraftPreflightStatus,
} from "./tradingManualApprovalOrderDraftPreflight.js";

export const STEP123_DRAFT_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP122_ORDER_DRAFT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const REDACTED_MANUAL_APPROVAL_ORDER_DRAFT_REVIEW_RESULT_SCHEMA = Object.freeze({
  receiptId: "string",
  receiptType: "manual_approval_order_draft_review_result",
  sourceStep: "step123",
  sourceDraftStep: "step122",
  draftId: "redacted_placeholder_id",
  reviewStatus: "recorded_fail_closed",
  decision: "blocked",
  blockerCount: "number",
  recordedAt: "iso8601",
  storage: "in_memory_only",
  flags: "all_false",
  redaction: "metadata_only_no_private_values",
});

function clean(value) {
  return String(value ?? "").trim();
}

function safeId(value, fallback) {
  const normalized = clean(value).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return normalized || fallback;
}

function sanitizeBlockerCodes(blockers) {
  if (!Array.isArray(blockers)) return [];
  return blockers.map((_, index) => `redacted_draft_review_blocker_${index + 1}`);
}

function makeRedaction() {
  return {
    schema: "step123_redacted_manual_approval_order_draft_review_result_v1",
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

export function createRedactedManualApprovalOrderDraftReviewResult(reviewResult = {}, options = {}) {
  const index = Number.isInteger(options.index) && options.index >= 0 ? options.index : 0;
  const blockers = Array.isArray(reviewResult.blockers) ? reviewResult.blockers : [];
  const draftId = safeId(reviewResult.draftId, "step122_manual_approval_order_draft_placeholder");

  return {
    receiptId: `step123_manual_approval_order_draft_review_result_${index + 1}`,
    receiptType: "manual_approval_order_draft_review_result",
    sourceStep: "step123",
    sourceDraftStep: "step122",
    draftId,
    reviewStatus: "recorded_fail_closed",
    decision: "blocked",
    blockerCount: blockers.length,
    blockerCodes: sanitizeBlockerCodes(blockers),
    recordedAt: options.recordedAt || new Date().toISOString(),
    storage: "in_memory_only",
    persistentStorageUsed: false,
    dbWriteUsed: false,
    flags: { ...STEP123_DRAFT_REVIEW_RESULT_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
  };
}

export function createInMemoryManualApprovalOrderDraftReviewResultRecorder(seedReceipts = []) {
  const receipts = seedReceipts.map((receipt, index) =>
    createRedactedManualApprovalOrderDraftReviewResult(receipt, { index }),
  );

  return {
    storage: "memory",
    persistentStorageUsed: false,
    dbWriteUsed: false,
    record(reviewResults = [], options = {}) {
      const nextReceipts = (Array.isArray(reviewResults) ? reviewResults : []).map((reviewResult, index) =>
        createRedactedManualApprovalOrderDraftReviewResult(reviewResult, {
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

export function recordManualApprovalOrderDraftReviewResults(input = {}, options = {}) {
  const draftPreflight =
    input.draftPreflight || buildAdminManualApprovalOrderDraftPreflightStatus(input.preflightInput || {}, options);
  const draft = draftPreflight.draft || draftPreflight.preflight?.draft || {};
  const preflightBlockers = Array.isArray(draftPreflight.preflight?.blockers) ? draftPreflight.preflight.blockers : [];
  const reviewResults = [
    {
      draftId: draft.draftId,
      blockers: [
        "manual_approval_order_draft_review_result_defaults_to_blocked",
        ...preflightBlockers,
      ],
    },
  ];
  const recorder = options.recorder || createInMemoryManualApprovalOrderDraftReviewResultRecorder();
  const receipts = recorder.record(reviewResults, { recordedAt: options.recordedAt });
  const snapshot = recorder.snapshot();

  return {
    ok: true,
    step: "Step 123: Add manual approval order draft review result recording gate",
    status: "manual_approval_order_draft_review_result_recorded_fail_closed",
    receiptSchema: REDACTED_MANUAL_APPROVAL_ORDER_DRAFT_REVIEW_RESULT_SCHEMA,
    draftPreflight: {
      status: draftPreflight.status || "admin_only_manual_approval_order_draft_preflight_fail_closed",
      draftId: draft.draftId || "step122_manual_approval_order_draft_placeholder",
      preflightStatus: draftPreflight.preflight?.preflightStatus || "blocked",
      readinessPromoted: false,
    },
    receipts,
    recorder: snapshot,
    flags: { ...STEP123_DRAFT_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminManualApprovalOrderDraftReviewResultGateStatus(input = {}, options = {}) {
  const recording = recordManualApprovalOrderDraftReviewResults(input, options);

  return {
    ok: true,
    step: "Step 123: Add manual approval order draft review result recording gate",
    status: "admin_only_manual_approval_order_draft_review_result_gate_fail_closed",
    receiptSchema: REDACTED_MANUAL_APPROVAL_ORDER_DRAFT_REVIEW_RESULT_SCHEMA,
    recording,
    receiptCount: recording.receipts.length,
    receipts: recording.receipts,
    flags: { ...STEP123_DRAFT_REVIEW_RESULT_FLAGS },
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

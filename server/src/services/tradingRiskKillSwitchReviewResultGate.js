import {
  STEP120_REVIEW_FLAGS,
  buildAdminRiskKillSwitchReviewStatus,
} from "./tradingRiskKillSwitchReviewCore.js";

export const STEP121_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP120_REVIEW_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const REDACTED_REVIEW_RESULT_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  receiptType: "risk_kill_switch_review_result",
  sourceStep: "step121",
  sourceReviewStep: "step120",
  reviewType: "risk_gate | kill_switch | unknown_review",
  status: "recorded_fail_closed",
  decision: "blocked",
  blockerCount: "number",
  recordedAt: "iso8601",
  storage: "in_memory_only",
  flags: "all_false",
  redaction: "metadata_only_no_private_values",
});

const ALLOWED_REVIEW_TYPES = Object.freeze(["risk_gate", "kill_switch"]);

function clean(value) {
  return String(value ?? "").trim();
}

function safeReviewType(value) {
  const normalized = clean(value).toLowerCase();
  return ALLOWED_REVIEW_TYPES.includes(normalized) ? normalized : "unknown_review";
}

function makeReceiptId(reviewType, index) {
  const normalizedType = safeReviewType(reviewType).replace(/[^a-z0-9_-]/g, "_");
  return `step121_${normalizedType}_receipt_${index + 1}`;
}

function sanitizeBlockerCodes(blockers) {
  if (!Array.isArray(blockers)) return [];
  return blockers.map((_, index) => `redacted_blocker_${index + 1}`);
}

function makeRedaction() {
  return {
    schema: "step121_redacted_review_result_receipt_v1",
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

export function createRedactedReviewResultReceipt(reviewResult = {}, options = {}) {
  const blockers = Array.isArray(reviewResult.blockers) ? reviewResult.blockers : [];
  const reviewType = safeReviewType(reviewResult.reviewType);
  const index = Number.isInteger(options.index) && options.index >= 0 ? options.index : 0;

  return {
    receiptId: makeReceiptId(reviewType, index),
    receiptType: "risk_kill_switch_review_result",
    sourceStep: "step121",
    sourceReviewStep: "step120",
    reviewType,
    status: "recorded_fail_closed",
    decision: "blocked",
    blockerCount: blockers.length,
    blockerCodes: sanitizeBlockerCodes(blockers),
    recordedAt: options.recordedAt || new Date().toISOString(),
    storage: "in_memory_only",
    persistentStorageUsed: false,
    dbWriteUsed: false,
    flags: { ...STEP121_REVIEW_RESULT_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
  };
}

export function createInMemoryRiskKillSwitchReviewResultRecorder(seedReceipts = []) {
  const receipts = seedReceipts.map((receipt, index) => createRedactedReviewResultReceipt(receipt, { index }));

  return {
    storage: "memory",
    persistentStorageUsed: false,
    dbWriteUsed: false,
    record(reviewResults = [], options = {}) {
      const nextReceipts = (Array.isArray(reviewResults) ? reviewResults : []).map((reviewResult, index) =>
        createRedactedReviewResultReceipt(reviewResult, {
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

export function recordRiskKillSwitchReviewResults(input = {}, options = {}) {
  const reviewStatus = input.reviewStatus || buildAdminRiskKillSwitchReviewStatus(input.reviewInput || {}, options);
  const recorder = options.recorder || createInMemoryRiskKillSwitchReviewResultRecorder();
  const reviewResults = Array.isArray(reviewStatus.reviewResults) ? reviewStatus.reviewResults : [];
  const receipts = recorder.record(reviewResults, { recordedAt: options.recordedAt });
  const snapshot = recorder.snapshot();

  return {
    ok: true,
    step: "Step 121: Add admin-only risk and kill-switch review result recording gate",
    status: "risk_kill_switch_review_result_recorded_fail_closed",
    receiptSchema: REDACTED_REVIEW_RESULT_RECEIPT_SCHEMA,
    reviewStatus: {
      status: reviewStatus.status || "admin_only_risk_kill_switch_review_fail_closed",
      blockerCount: Array.isArray(reviewStatus.blockers) ? reviewStatus.blockers.length : 0,
      reviewResultCount: reviewResults.length,
      readinessPromoted: false,
    },
    receipts,
    recorder: snapshot,
    flags: { ...STEP121_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminRiskKillSwitchReviewResultGateStatus(input = {}, options = {}) {
  const recording = recordRiskKillSwitchReviewResults(input, options);

  return {
    ok: true,
    step: "Step 121: Add admin-only risk and kill-switch review result recording gate",
    status: "admin_only_risk_kill_switch_review_result_gate_fail_closed",
    receiptSchema: REDACTED_REVIEW_RESULT_RECEIPT_SCHEMA,
    recording,
    receiptCount: recording.receipts.length,
    receipts: recording.receipts,
    flags: { ...STEP121_REVIEW_RESULT_FLAGS },
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

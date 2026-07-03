import {
  STEP123_DRAFT_REVIEW_RESULT_FLAGS,
  buildAdminManualApprovalOrderDraftReviewResultGateStatus,
} from "./tradingManualApprovalOrderDraftReviewResultGate.js";
import { buildAdminRiskKillSwitchReviewStatus } from "./tradingRiskKillSwitchReviewCore.js";
import { buildAdminShadowReviewGateStatus } from "./tradingShadowReviewGate.js";

export const STEP124_CLEARANCE_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP123_DRAFT_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const CLEARANCE_CANDIDATE_STATUS_SCHEMA = Object.freeze({
  candidateId: "string",
  candidateType: "manual_approval_order_draft_clearance_candidate",
  sourceStep: "step124",
  draftReviewStatus: "recorded_fail_closed | missing | pending",
  shadowReviewStatus: "admin_only_shadow_review_gate_fail_closed | missing | pending",
  riskStatus: "blocked",
  killSwitchStatus: "active_blocking",
  clearanceStatus: "blocked | pending_review | not_ready",
  flags: "all_false",
  redaction: "metadata_only_no_private_values",
});

export const REDACTED_CLEARANCE_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  preflightId: "string",
  preflightType: "manual_approval_order_draft_clearance_preflight",
  sourceStep: "step124",
  candidateStatus: "blocked | pending_review | not_ready",
  blockerCount: "number",
  checkedAt: "iso8601",
  flags: "all_false",
  redaction: "metadata_only_no_private_values",
});

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function makeRedaction() {
  return {
    schema: "step124_redacted_manual_approval_order_draft_clearance_preflight_v1",
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

function hasDraftReviewReceipt(status) {
  return Number(status?.receiptCount || 0) > 0 || (Array.isArray(status?.receipts) && status.receipts.length > 0);
}

function hasShadowReviewResult(status) {
  return Array.isArray(status?.reviewResults) && status.reviewResults.length > 0;
}

export function buildManualApprovalOrderDraftClearanceCandidate(input = {}, options = {}) {
  const draftReviewStatus =
    input.draftReviewStatus ?? buildAdminManualApprovalOrderDraftReviewResultGateStatus(input.draftReviewInput || {}, options);
  const shadowReviewStatus =
    input.shadowReviewStatus ?? buildAdminShadowReviewGateStatus(input.shadowReviewInput || {}, options);
  const riskKillSwitchStatus =
    input.riskKillSwitchStatus ?? buildAdminRiskKillSwitchReviewStatus(input.riskKillSwitchInput || {}, options);

  const draftReviewMissing = !hasDraftReviewReceipt(draftReviewStatus);
  const shadowReviewMissing = !hasShadowReviewResult(shadowReviewStatus);
  const riskBlocking = riskKillSwitchStatus.riskGate?.blocking !== false;
  const killSwitchBlocking = riskKillSwitchStatus.killSwitch?.blocking !== false;
  const blockers = unique([
    riskBlocking ? "risk_gate_blocking" : null,
    killSwitchBlocking ? "kill_switch_blocking" : null,
    draftReviewMissing ? "manual_approval_order_draft_review_result_missing_or_pending" : null,
    shadowReviewMissing ? "shadow_review_result_missing_or_pending" : null,
    "step124_clearance_preflight_defaults_to_blocked",
  ]);
  const clearanceStatus = riskBlocking || killSwitchBlocking ? "blocked" : draftReviewMissing || shadowReviewMissing ? "pending_review" : "not_ready";

  return {
    candidateId: options.candidateId || "step124_manual_approval_order_draft_clearance_candidate",
    candidateType: "manual_approval_order_draft_clearance_candidate",
    sourceStep: "step124",
    draftReviewStatus: draftReviewMissing ? "missing_or_pending" : draftReviewStatus.status,
    shadowReviewStatus: shadowReviewMissing ? "missing_or_pending" : shadowReviewStatus.status,
    riskStatus: riskKillSwitchStatus.riskGate?.status || "blocked",
    killSwitchStatus: riskKillSwitchStatus.killSwitch?.status || "active_blocking",
    clearanceStatus,
    blockers,
    flags: { ...STEP124_CLEARANCE_PREFLIGHT_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function runManualApprovalOrderDraftClearancePreflight(input = {}, options = {}) {
  const candidate = input.candidate || buildManualApprovalOrderDraftClearanceCandidate(input, options);
  const blockers = unique([
    ...(Array.isArray(candidate.blockers) ? candidate.blockers : []),
    candidate.clearanceStatus === "blocked" ? "clearance_candidate_blocked" : null,
    candidate.clearanceStatus === "pending_review" ? "clearance_candidate_pending_review" : null,
    "order_submission_still_forbidden",
  ]);

  return {
    ok: true,
    step: "Step 124: Add manual approval order draft clearance preflight gate",
    preflightId: options.preflightId || "step124_manual_approval_order_draft_clearance_preflight",
    preflightType: "manual_approval_order_draft_clearance_preflight",
    status: "manual_approval_order_draft_clearance_preflight_fail_closed",
    clearanceStatus: candidate.clearanceStatus === "pending_review" ? "pending_review" : "blocked",
    candidate,
    blockerCount: blockers.length,
    blockers,
    checkedAt: options.checkedAt || new Date().toISOString(),
    resultSchema: REDACTED_CLEARANCE_PREFLIGHT_RESULT_SCHEMA,
    flags: { ...STEP124_CLEARANCE_PREFLIGHT_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminManualApprovalOrderDraftClearancePreflightStatus(input = {}, options = {}) {
  const preflight = runManualApprovalOrderDraftClearancePreflight(input, options);

  return {
    ok: true,
    step: "Step 124: Add manual approval order draft clearance preflight gate",
    status: "admin_only_manual_approval_order_draft_clearance_preflight_fail_closed",
    candidateSchema: CLEARANCE_CANDIDATE_STATUS_SCHEMA,
    resultSchema: REDACTED_CLEARANCE_PREFLIGHT_RESULT_SCHEMA,
    candidate: preflight.candidate,
    preflight,
    flags: { ...STEP124_CLEARANCE_PREFLIGHT_FLAGS },
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

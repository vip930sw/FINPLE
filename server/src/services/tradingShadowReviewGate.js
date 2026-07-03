import { STEP118_SHADOW_FLAGS, buildReadOnlyShadowStatusHistory, runDryRunReplay } from "./tradingShadowLedger.js";

export const STEP119_REVIEW_FLAGS = Object.freeze({
  ...STEP118_SHADOW_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const REDACTED_REVIEW_RESULT_SCHEMA = Object.freeze({
  reviewId: "string",
  reviewType: "shadow_history | dry_run_replay",
  sourceStep: "step118",
  mode: "shadow | dry_run",
  status: "review_blocked | review_recorded",
  decision: "blocked",
  candidateCount: "number",
  auditEventCount: "number",
  blockers: "string[]",
  reviewedAt: "iso8601",
  flags: "all_false",
  redaction: "metadata_only_no_private_values",
});

function clean(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeId(value, fallback) {
  const normalized = clean(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return normalized || fallback;
}

function makeReviewResult(input = {}) {
  const blockers = unique(input.blockers);

  return {
    reviewId: safeId(input.reviewId, `${input.reviewType || "review"}_redacted_result`),
    reviewType: input.reviewType,
    sourceStep: "step118",
    mode: input.mode,
    status: blockers.length > 0 ? "review_blocked" : "review_recorded",
    decision: "blocked",
    candidateCount: Number(input.candidateCount || 0),
    auditEventCount: Number(input.auditEventCount || 0),
    blockers,
    reviewedAt: input.reviewedAt || new Date().toISOString(),
    flags: { ...STEP119_REVIEW_FLAGS },
    redaction: {
      schema: "step119_redacted_review_result_v1",
      metadataOnly: true,
      containsCredential: false,
      containsAccountIdentifier: false,
      containsProviderPayload: false,
      containsOrderPayload: false,
      containsPrivatePath: false,
      containsRawReceipt: false,
      containsDigestValue: false,
    },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    persistentStorageUsed: false,
  };
}

export function reviewShadowHistory(input = {}, options = {}) {
  const history = buildReadOnlyShadowStatusHistory(input);
  const blockers = unique([
    history.providerCallsAllowed ? "provider_calls_opened" : null,
    history.orderSubmissionAllowed ? "order_submission_opened" : null,
    history.networkCallAttempted ? "network_call_attempted" : null,
    history.persistentStorageUsed ? "persistent_storage_used" : null,
    history.boundaries?.adminOnly === true ? null : "admin_only_boundary_missing",
    history.boundaries?.myPageDashboardExposed ? "mypage_review_ui_exposed" : null,
    history.boundaries?.homepageDashboardExposed ? "homepage_review_ui_exposed" : null,
    history.boundaries?.providerOrderPayloadStored ? "provider_order_payload_stored" : null,
    history.boundaries?.credentialStored ? "credential_stored" : null,
    history.boundaries?.accountIdentifierStored ? "account_identifier_stored" : null,
  ]);

  return makeReviewResult({
    reviewId: options.reviewId || "shadow_history_review_redacted",
    reviewType: "shadow_history",
    mode: "shadow",
    candidateCount: history.candidateCount,
    auditEventCount: history.auditEventCount,
    blockers,
    reviewedAt: options.reviewedAt,
  });
}

export function reviewDryRunReplayResult(input = {}, options = {}) {
  const replay = input.replayResult || runDryRunReplay(input.replayInput || {});
  const blockers = unique([
    replay.providerCallsAllowed ? "provider_calls_opened" : null,
    replay.orderSubmissionAllowed ? "order_submission_opened" : null,
    replay.networkCallAttempted ? "network_call_attempted" : null,
    replay.persistentStorageUsed ? "persistent_storage_used" : null,
    replay.flags?.readyForOrderSubmission ? "order_readiness_opened" : null,
    replay.flags?.readyForLiveGuardedTrading ? "live_guarded_readiness_opened" : null,
  ]);

  return makeReviewResult({
    reviewId: options.reviewId || "dry_run_replay_review_redacted",
    reviewType: "dry_run_replay",
    mode: "dry_run",
    candidateCount: replay.candidateCount,
    auditEventCount: replay.audit?.eventCount,
    blockers,
    reviewedAt: options.reviewedAt,
  });
}

export function buildAdminShadowReviewGateStatus(input = {}, options = {}) {
  const shadowHistoryReview = reviewShadowHistory(input.shadowHistoryInput || {}, {
    reviewedAt: options.reviewedAt,
  });
  const dryRunReplayReview = reviewDryRunReplayResult(input.dryRunInput || {}, {
    reviewedAt: options.reviewedAt,
  });
  const reviewResults = [shadowHistoryReview, dryRunReplayReview];
  const blockers = unique(reviewResults.flatMap((result) => result.blockers));

  return {
    ok: true,
    step: "Step 119: Add admin-only shadow history review gate",
    status: "admin_only_shadow_review_gate_fail_closed",
    schema: REDACTED_REVIEW_RESULT_SCHEMA,
    reviewResults,
    blockers,
    flags: { ...STEP119_REVIEW_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
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
      digestValueExposed: false,
      dbMigrationRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

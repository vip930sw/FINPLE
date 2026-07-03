import { evaluateKillSwitch } from "./tradingLabPolicy.js";
import { evaluateTradingRiskGate } from "./tradingRiskEngine.js";
import { STEP119_REVIEW_FLAGS } from "./tradingShadowReviewGate.js";

export const STEP120_REVIEW_FLAGS = Object.freeze({
  ...STEP119_REVIEW_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const REDACTED_RISK_KILL_SWITCH_REVIEW_SCHEMA = Object.freeze({
  reviewId: "string",
  reviewType: "risk_gate | kill_switch",
  sourceStep: "step120",
  status: "blocked",
  decision: "blocked",
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

function missingApprovalReasons(approvals = {}) {
  return unique([
    approvals.manualPermissionPacketValidationReceipt === true ? null : "missing_manual_permission_packet_validation_receipt",
    approvals.killSwitchClearanceReview === true ? null : "missing_kill_switch_clearance_review",
    approvals.riskGateClearanceReview === true ? null : "missing_risk_gate_clearance_review",
    approvals.dryRunReplayExecutionResult === true ? null : "missing_dry_run_replay_execution_result",
    approvals.shadowHistoryReview === true ? null : "missing_shadow_history_review",
    approvals.liveGuardedAdapterReview === true ? null : "missing_live_guarded_adapter_review",
  ]);
}

function makeRedactedResult(input = {}) {
  return {
    reviewId: safeId(input.reviewId, `${input.reviewType || "review"}_redacted_step120`),
    reviewType: input.reviewType,
    sourceStep: "step120",
    status: "blocked",
    decision: "blocked",
    blockers: unique(input.blockers),
    reviewedAt: input.reviewedAt || new Date().toISOString(),
    flags: { ...STEP120_REVIEW_FLAGS },
    redaction: {
      schema: "step120_redacted_risk_kill_switch_review_v1",
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
    readinessPromoted: false,
    persistentStorageUsed: false,
  };
}

export function buildRiskGatePolicyCore(input = {}) {
  const evaluation = evaluateTradingRiskGate(input.intent, input.limits, input.runtime);
  const approvalReasons = missingApprovalReasons(input.approvals);
  const blockers = unique([
    "step120_risk_gate_defaults_to_blocked",
    ...approvalReasons,
    ...evaluation.reasons,
    evaluation.providerCallsAllowed ? "provider_calls_opened" : null,
    evaluation.orderSubmissionAllowed ? "order_submission_opened" : null,
    evaluation.liveOrderIntentEligible ? "live_order_intent_still_requires_manual_review" : null,
  ]);

  return {
    ok: true,
    policy: "risk_gate",
    status: "blocked",
    blocking: true,
    actionAllowed: false,
    intentPromotionAllowed: false,
    paperFillAllowed: false,
    shadowRecordAllowed: false,
    liveOrderIntentEligible: false,
    blockers,
    evaluationStatus: evaluation.status,
    evaluationMode: evaluation.mode,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    flags: { ...STEP120_REVIEW_FLAGS },
  };
}

export function buildKillSwitchPolicyCore(input = {}) {
  const killSwitch = evaluateKillSwitch({
    mode: input.mode,
    globalTradingDisabled: true,
    dailyLossLimitBreached: input.dailyLossLimitBreached,
    dailyOrderCountLimitBreached: input.dailyOrderCountLimitBreached,
    symbolAllowlisted: input.symbolAllowlisted,
    quoteFresh: input.quoteFresh,
    fxFresh: input.fxFresh,
    accountStateMatched: input.accountStateMatched,
    kisAuthOk: input.kisAuthOk,
    kisRateLimited: input.kisRateLimited,
    strategyReviewed: input.strategyReviewed,
    auditLoggerReady: input.auditLoggerReady,
    manualOperatorStop: input.manualOperatorStop ?? true,
  });
  const blockers = unique([
    "step120_kill_switch_defaults_to_active",
    ...missingApprovalReasons(input.approvals),
    ...killSwitch.reasons.map((reason) => `kill_switch_${reason}`),
  ]);

  return {
    ok: true,
    policy: "kill_switch",
    status: "active_blocking",
    active: true,
    blocking: true,
    actionAllowed: false,
    blockers,
    killSwitchMode: killSwitch.mode,
    orderSubmissionAllowed: false,
    providerCallsAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    flags: { ...STEP120_REVIEW_FLAGS },
  };
}

export function reviewRiskGatePolicy(input = {}, options = {}) {
  const policy = buildRiskGatePolicyCore(input);

  return makeRedactedResult({
    reviewId: options.reviewId || "risk_gate_policy_review_redacted",
    reviewType: "risk_gate",
    blockers: policy.blockers,
    reviewedAt: options.reviewedAt,
  });
}

export function reviewKillSwitchPolicy(input = {}, options = {}) {
  const policy = buildKillSwitchPolicyCore(input);

  return makeRedactedResult({
    reviewId: options.reviewId || "kill_switch_policy_review_redacted",
    reviewType: "kill_switch",
    blockers: policy.blockers,
    reviewedAt: options.reviewedAt,
  });
}

export function buildAdminRiskKillSwitchReviewStatus(input = {}, options = {}) {
  const riskGate = buildRiskGatePolicyCore(input.riskGateInput || {});
  const killSwitch = buildKillSwitchPolicyCore(input.killSwitchInput || {});
  const reviewResults = [
    reviewRiskGatePolicy(input.riskGateInput || {}, { reviewedAt: options.reviewedAt }),
    reviewKillSwitchPolicy(input.killSwitchInput || {}, { reviewedAt: options.reviewedAt }),
  ];
  const blockers = unique([...riskGate.blockers, ...killSwitch.blockers, ...reviewResults.flatMap((result) => result.blockers)]);

  return {
    ok: true,
    step: "Step 120: Add admin-only risk and kill-switch review core",
    status: "admin_only_risk_kill_switch_review_fail_closed",
    schema: REDACTED_RISK_KILL_SWITCH_REVIEW_SCHEMA,
    riskGate,
    killSwitch,
    reviewResults,
    blockers,
    flags: { ...STEP120_REVIEW_FLAGS },
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

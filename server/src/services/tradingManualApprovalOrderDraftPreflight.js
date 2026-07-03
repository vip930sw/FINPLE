import { buildAdminRiskKillSwitchReviewStatus } from "./tradingRiskKillSwitchReviewCore.js";
import { STEP121_REVIEW_RESULT_FLAGS } from "./tradingRiskKillSwitchReviewResultGate.js";

export const STEP122_ORDER_DRAFT_FLAGS = Object.freeze({
  ...STEP121_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const REDACTED_MANUAL_APPROVAL_ORDER_DRAFT_SCHEMA = Object.freeze({
  draftId: "string",
  draftType: "manual_approval_order_draft_placeholder",
  sourceStep: "step122",
  mode: "mock | dry_run | shadow",
  symbol: "redacted_test_symbol_placeholder",
  side: "placeholder",
  quantity: "placeholder",
  estimatedAmount: "placeholder",
  riskStatus: "blocked",
  killSwitchStatus: "active_blocking",
  preflightStatus: "blocked",
  readinessFlags: "all_false",
  createdAt: "iso8601",
  redaction: "metadata_only_no_private_values",
});

const SAFE_MODES = Object.freeze(["mock", "dry_run", "shadow"]);

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeMode(value) {
  const normalized = clean(value).toLowerCase().replace(/-/g, "_");
  return SAFE_MODES.includes(normalized) ? normalized : "mock";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function makeRedaction() {
  return {
    schema: "step122_redacted_manual_approval_order_draft_v1",
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

export function createManualApprovalOrderDraft(input = {}, options = {}) {
  const reviewStatus = input.reviewStatus || buildAdminRiskKillSwitchReviewStatus(input.reviewInput || {}, options);
  const riskStatus = reviewStatus.riskGate?.status || "blocked";
  const killSwitchStatus = reviewStatus.killSwitch?.status || "active_blocking";
  const riskBlocking = reviewStatus.riskGate?.blocking !== false;
  const killSwitchBlocking = reviewStatus.killSwitch?.blocking !== false;
  const blockers = unique([
    riskBlocking ? "risk_gate_blocking" : null,
    killSwitchBlocking ? "kill_switch_blocking" : null,
    "manual_approval_receipt_not_recorded",
    "broker_order_payload_not_allowed",
  ]);

  return {
    draftId: options.draftId || "step122_manual_approval_order_draft_placeholder",
    draftType: "manual_approval_order_draft_placeholder",
    sourceStep: "step122",
    mode: normalizeMode(input.mode),
    symbol: "REDACTED_TEST_SYMBOL",
    side: "placeholder_side",
    quantity: "placeholder_quantity",
    estimatedAmount: "placeholder_estimated_amount",
    riskStatus,
    killSwitchStatus,
    preflightStatus: "blocked",
    blockers,
    readinessFlags: { ...STEP122_ORDER_DRAFT_FLAGS },
    createdAt: options.createdAt || new Date().toISOString(),
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function runManualApprovalOrderDraftPreflight(input = {}, options = {}) {
  const draft = input.draft || createManualApprovalOrderDraft(input, options);
  const riskBlocking = draft.riskStatus !== "approved_for_shadow" && draft.riskStatus !== "approved_for_paper";
  const killSwitchBlocking = draft.killSwitchStatus !== "inactive" && draft.killSwitchStatus !== "cleared";
  const blockers = unique([
    "step122_preflight_defaults_to_blocked",
    riskBlocking ? "risk_gate_blocking" : null,
    killSwitchBlocking ? "kill_switch_blocking" : null,
    ...((Array.isArray(draft.blockers) ? draft.blockers : [])),
  ]);

  return {
    ok: true,
    step: "Step 122: Add manual approval order draft preflight core",
    status: "manual_approval_order_draft_preflight_blocked",
    preflightStatus: "blocked",
    draft,
    blockers,
    flags: { ...STEP122_ORDER_DRAFT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminManualApprovalOrderDraftPreflightStatus(input = {}, options = {}) {
  const preflight = runManualApprovalOrderDraftPreflight(input, options);

  return {
    ok: true,
    step: "Step 122: Add manual approval order draft preflight core",
    status: "admin_only_manual_approval_order_draft_preflight_fail_closed",
    draftSchema: REDACTED_MANUAL_APPROVAL_ORDER_DRAFT_SCHEMA,
    draft: preflight.draft,
    preflight,
    flags: { ...STEP122_ORDER_DRAFT_FLAGS },
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

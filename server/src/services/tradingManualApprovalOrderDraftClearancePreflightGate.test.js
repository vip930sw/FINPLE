import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminManualApprovalOrderDraftClearancePreflightStatus,
  buildManualApprovalOrderDraftClearanceCandidate,
  runManualApprovalOrderDraftClearancePreflight,
} from "./tradingManualApprovalOrderDraftClearancePreflightGate.js";

const CLEARED_RISK_KILL_SWITCH = Object.freeze({
  riskGate: { status: "approved_for_shadow", blocking: false },
  killSwitch: { status: "cleared", blocking: false },
  reviewResults: [],
  blockers: [],
});

const PRESENT_DRAFT_REVIEW = Object.freeze({
  status: "admin_only_manual_approval_order_draft_review_result_gate_fail_closed",
  receiptCount: 1,
  receipts: [{ receiptId: "redacted_receipt" }],
});

const PRESENT_SHADOW_REVIEW = Object.freeze({
  status: "admin_only_shadow_review_gate_fail_closed",
  reviewResults: [{ reviewId: "redacted_shadow_review" }],
  blockers: [],
});

test("clearance preflight does not call provider or submit order", () => {
  const preflight = runManualApprovalOrderDraftClearancePreflight({}, { checkedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.networkCallAttempted, false);
  assert.equal(preflight.readinessPromoted, false);
  assert.equal(preflight.persistentStorageUsed, false);
  assert.equal(preflight.dbWriteUsed, false);
});

test("clearance preflight result is redacted and contains no private values", () => {
  const preflight = runManualApprovalOrderDraftClearancePreflight(
    {
      credential: "secret",
      accountIdentifier: "50195326-01",
      providerPayload: { raw: true },
      orderPayload: { raw: true },
      privatePacketPath: "C:/private/packet.json",
      rawReceipt: "raw-value",
      hashValue: "hash-value",
    },
    { checkedAt: "2026-07-03T00:00:00.000Z" },
  );
  const text = JSON.stringify(preflight);

  assert.equal(preflight.redaction.containsCredential, false);
  assert.equal(preflight.redaction.containsAccountIdentifier, false);
  assert.equal(preflight.redaction.containsProviderPayload, false);
  assert.equal(preflight.redaction.containsOrderPayload, false);
  assert.equal(preflight.redaction.containsPrivatePath, false);
  assert.equal(preflight.redaction.containsRawReceipt, false);
  assert.equal(preflight.redaction.containsHashValue, false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("C:/private"), false);
  assert.equal(text.includes("raw-value"), false);
  assert.equal(text.includes("hash-value"), false);
});

test("risk gate blocking keeps clearance blocked", () => {
  const candidate = buildManualApprovalOrderDraftClearanceCandidate({
    riskKillSwitchStatus: {
      riskGate: { status: "blocked", blocking: true },
      killSwitch: { status: "cleared", blocking: false },
    },
    draftReviewStatus: PRESENT_DRAFT_REVIEW,
    shadowReviewStatus: PRESENT_SHADOW_REVIEW,
  });

  assert.equal(candidate.clearanceStatus, "blocked");
  assert.match(candidate.blockers.join("|"), /risk_gate_blocking/);
  assert.equal(candidate.orderSubmissionAllowed, false);
});

test("kill-switch blocking keeps clearance blocked", () => {
  const candidate = buildManualApprovalOrderDraftClearanceCandidate({
    riskKillSwitchStatus: {
      riskGate: { status: "approved_for_shadow", blocking: false },
      killSwitch: { status: "active_blocking", blocking: true },
    },
    draftReviewStatus: PRESENT_DRAFT_REVIEW,
    shadowReviewStatus: PRESENT_SHADOW_REVIEW,
  });

  assert.equal(candidate.clearanceStatus, "blocked");
  assert.match(candidate.blockers.join("|"), /kill_switch_blocking/);
  assert.equal(candidate.providerCallsAllowed, false);
});

test("missing draft review keeps clearance pending without opening readiness", () => {
  const candidate = buildManualApprovalOrderDraftClearanceCandidate({
    riskKillSwitchStatus: CLEARED_RISK_KILL_SWITCH,
    draftReviewStatus: { status: "pending", receiptCount: 0, receipts: [] },
    shadowReviewStatus: PRESENT_SHADOW_REVIEW,
  });

  assert.equal(candidate.clearanceStatus, "pending_review");
  assert.match(candidate.blockers.join("|"), /manual_approval_order_draft_review_result_missing_or_pending/);
  assert.equal(candidate.flags.readyForOrderSubmission, false);
});

test("missing shadow review keeps clearance pending without opening readiness", () => {
  const candidate = buildManualApprovalOrderDraftClearanceCandidate({
    riskKillSwitchStatus: CLEARED_RISK_KILL_SWITCH,
    draftReviewStatus: PRESENT_DRAFT_REVIEW,
    shadowReviewStatus: { status: "pending", reviewResults: [] },
  });

  assert.equal(candidate.clearanceStatus, "pending_review");
  assert.match(candidate.blockers.join("|"), /shadow_review_result_missing_or_pending/);
  assert.equal(candidate.flags.readyForLiveGuardedTrading, false);
});

test("admin clearance preflight status keeps readiness flags false and boundaries private", () => {
  const status = buildAdminManualApprovalOrderDraftClearancePreflightStatus(
    {},
    { checkedAt: "2026-07-03T00:00:00.000Z" },
  );

  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.boundaries.credentialExposed, false);
  assert.equal(status.boundaries.accountIdentifierExposed, false);
  assert.equal(status.boundaries.providerOrderPayloadExposed, false);
  assert.equal(status.boundaries.privatePathExposed, false);
  assert.equal(status.boundaries.rawReceiptExposed, false);
  assert.equal(status.boundaries.hashValueExposed, false);
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.runtimeRouteAllowed, false);
  assert.equal(status.flags.publicUiAllowed, false);
  assert.equal(status.flags.dbMigrationAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
});

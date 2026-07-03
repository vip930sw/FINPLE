import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminRiskKillSwitchReviewStatus,
  buildKillSwitchPolicyCore,
  buildRiskGatePolicyCore,
  reviewKillSwitchPolicy,
  reviewRiskGatePolicy,
} from "./tradingRiskKillSwitchReviewCore.js";

test("risk gate defaults to blocked and missing env values keep trading blocked", () => {
  const policy = buildRiskGatePolicyCore();

  assert.equal(policy.status, "blocked");
  assert.equal(policy.blocking, true);
  assert.equal(policy.actionAllowed, false);
  assert.equal(policy.providerCallsAllowed, false);
  assert.equal(policy.orderSubmissionAllowed, false);
  assert.equal(policy.flags.readyForOrderSubmission, false);
  assert.match(policy.blockers.join("|"), /step120_risk_gate_defaults_to_blocked/);
  assert.match(policy.blockers.join("|"), /missing_manual_permission_packet_validation_receipt/);
});

test("kill-switch defaults to active blocking state", () => {
  const policy = buildKillSwitchPolicyCore();

  assert.equal(policy.status, "active_blocking");
  assert.equal(policy.active, true);
  assert.equal(policy.blocking, true);
  assert.equal(policy.actionAllowed, false);
  assert.equal(policy.providerCallsAllowed, false);
  assert.equal(policy.orderSubmissionAllowed, false);
  assert.match(policy.blockers.join("|"), /step120_kill_switch_defaults_to_active/);
  assert.match(policy.blockers.join("|"), /kill_switch_global_trading_disabled/);
});

test("risk and kill-switch reviews do not call provider or submit order", () => {
  const riskReview = reviewRiskGatePolicy({}, { reviewedAt: "2026-07-03T00:00:00.000Z" });
  const killReview = reviewKillSwitchPolicy({}, { reviewedAt: "2026-07-03T00:00:00.000Z" });

  for (const review of [riskReview, killReview]) {
    assert.equal(review.providerCallsAllowed, false);
    assert.equal(review.orderSubmissionAllowed, false);
    assert.equal(review.networkCallAttempted, false);
    assert.equal(review.flags.providerCallsAllowed, false);
    assert.equal(review.flags.readyForLiveGuardedTrading, false);
  }
});

test("review result is redacted and contains no credential, account identifier, payload, private path, raw receipt, or digest value", () => {
  const status = buildAdminRiskKillSwitchReviewStatus({
    riskGateInput: {
      credential: "secret",
      accountIdentifier: "50195326-01",
      providerPayload: { raw: true },
      orderPayload: { raw: true },
      privatePacketPath: "C:/private/packet.json",
      validationReceiptRaw: "raw-value",
      digestValue: "digest-value",
    },
  }, { reviewedAt: "2026-07-03T00:00:00.000Z" });
  const text = JSON.stringify(status);

  assert.equal(status.boundaries.credentialExposed, false);
  assert.equal(status.boundaries.accountIdentifierExposed, false);
  assert.equal(status.boundaries.providerOrderPayloadExposed, false);
  assert.equal(status.boundaries.privatePathExposed, false);
  assert.equal(status.boundaries.rawReceiptExposed, false);
  assert.equal(status.boundaries.digestValueExposed, false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("C:/private"), false);
  assert.equal(text.includes("raw-value"), false);
  assert.equal(text.includes("digest-value"), false);
});

test("admin risk and kill-switch status keeps readiness flags false", () => {
  const status = buildAdminRiskKillSwitchReviewStatus({}, { reviewedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.readinessPromoted, false);
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.runtimeRouteAllowed, false);
  assert.equal(status.flags.publicUiAllowed, false);
  assert.equal(status.flags.dbMigrationAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminShadowReviewGateStatus,
  reviewDryRunReplayResult,
  reviewShadowHistory,
} from "./tradingShadowReviewGate.js";

test("shadow review does not call provider or submit order", () => {
  const review = reviewShadowHistory({
    candidates: [{ symbol: "SPY", side: "buy", quantity: 1, estimatedPrice: 400 }],
    auditEvents: [{ eventId: "shadow-event-1" }],
  }, { reviewedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(review.reviewType, "shadow_history");
  assert.equal(review.providerCallsAllowed, false);
  assert.equal(review.orderSubmissionAllowed, false);
  assert.equal(review.networkCallAttempted, false);
  assert.equal(review.flags.readyForLiveGuardedTrading, false);
});

test("dry-run review does not call provider or submit order", () => {
  const review = reviewDryRunReplayResult({
    replayInput: {
      initialCash: 1000,
      candidates: [{ symbol: "SPY", side: "buy", quantity: 1, estimatedPrice: 400 }],
    },
  }, { reviewedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(review.reviewType, "dry_run_replay");
  assert.equal(review.candidateCount, 1);
  assert.equal(review.auditEventCount, 1);
  assert.equal(review.providerCallsAllowed, false);
  assert.equal(review.orderSubmissionAllowed, false);
  assert.equal(review.flags.readyForOrderSubmission, false);
});

test("review result is redacted and contains no credential, account identifier, payload, private path, raw receipt, or digest value", () => {
  const status = buildAdminShadowReviewGateStatus({
    shadowHistoryInput: {
      candidates: [{
        symbol: "QQQ",
        side: "sell",
        quantity: 1,
        estimatedPrice: 500,
        credential: "secret",
        accountIdentifier: "50195326-01",
        privatePacketPath: "C:/private/packet.json",
      }],
      auditEvents: [{
        eventId: "event-1",
        providerPayload: { raw: true },
        orderPayload: { raw: true },
        receiptRaw: "raw-value",
        digestValue: "digest-value",
      }],
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

test("admin shadow review gate keeps all readiness flags false", () => {
  const status = buildAdminShadowReviewGateStatus({}, { reviewedAt: "2026-07-03T00:00:00.000Z" });

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

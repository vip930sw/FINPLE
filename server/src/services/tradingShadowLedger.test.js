import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReadOnlyShadowStatusHistory,
  createInMemoryAuditLedger,
  createShadowOrderCandidate,
  runDryRunReplay,
} from "./tradingShadowLedger.js";

test("shadow candidate creation does not submit order", () => {
  const candidate = createShadowOrderCandidate({
    symbol: "spy",
    side: "buy",
    quantity: 1,
    estimatedPrice: 400,
    credential: "secret",
    accountIdentifier: "50195326-01",
  });
  const text = JSON.stringify(candidate);

  assert.equal(candidate.valid, true);
  assert.equal(candidate.symbol, "SPY");
  assert.equal(candidate.providerCallsAllowed, false);
  assert.equal(candidate.orderSubmissionAllowed, false);
  assert.equal(candidate.networkCallAttempted, false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("50195326-01"), false);
});

test("dry-run replay does not call provider or submit order", () => {
  const replay = runDryRunReplay({
    initialCash: 1000,
    candidates: [{ symbol: "SPY", side: "buy", quantity: 1, estimatedPrice: 400 }],
  });

  assert.equal(replay.ok, true);
  assert.equal(replay.appliedCount, 1);
  assert.equal(replay.ledger.cash, 600);
  assert.equal(replay.providerCallsAllowed, false);
  assert.equal(replay.orderSubmissionAllowed, false);
  assert.equal(replay.networkCallAttempted, false);
  assert.equal(replay.replayEvents[0].simulatedFill.providerCallsAllowed, false);
  assert.equal(replay.replayEvents[0].simulatedFill.orderSubmissionAllowed, false);
});

test("audit event contains no credential, account identifier, or provider/order payload", () => {
  const ledger = createInMemoryAuditLedger();
  const event = ledger.append({
    eventId: "audit-safe",
    credential: "secret",
    accountIdentifier: "50195326-01",
    providerPayload: { raw: true },
    orderPayload: { raw: true },
    candidate: createShadowOrderCandidate({ symbol: "QQQ", side: "sell", quantity: 1, estimatedPrice: 500 }),
  });
  const text = JSON.stringify(event);

  assert.equal(event.containsCredential, false);
  assert.equal(event.containsAccountIdentifier, false);
  assert.equal(event.containsProviderPayload, false);
  assert.equal(event.containsOrderPayload, false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("raw"), false);
});

test("shadow status/history is read-only and fail-closed", () => {
  const status = buildReadOnlyShadowStatusHistory({
    candidates: [{ symbol: "SPY", side: "buy", quantity: 1, estimatedPrice: 400 }],
    auditEvents: [{ eventId: "history-event", eventType: "step118_shadow_audit_event" }],
  });

  assert.equal(status.status, "read_only_shadow_history");
  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
});

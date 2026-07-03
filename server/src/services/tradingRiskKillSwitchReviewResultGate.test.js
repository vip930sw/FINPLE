import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminRiskKillSwitchReviewResultGateStatus,
  createInMemoryRiskKillSwitchReviewResultRecorder,
  createRedactedReviewResultReceipt,
  recordRiskKillSwitchReviewResults,
} from "./tradingRiskKillSwitchReviewResultGate.js";

test("risk/kill-switch review result recording does not call provider or submit order", () => {
  const recording = recordRiskKillSwitchReviewResults({}, { recordedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(recording.providerCallsAllowed, false);
  assert.equal(recording.orderSubmissionAllowed, false);
  assert.equal(recording.networkCallAttempted, false);
  assert.equal(recording.readinessPromoted, false);
  assert.equal(recording.persistentStorageUsed, false);
  assert.equal(recording.dbWriteUsed, false);
  assert.equal(recording.flags.readyForLiveGuardedTrading, false);
});

test("review result receipt is redacted and contains no credential, account identifier, payload, private path, raw receipt, or hash value", () => {
  const receipt = createRedactedReviewResultReceipt({
    reviewType: "risk_gate",
    credential: "secret",
    accountIdentifier: "50195326-01",
    providerPayload: { raw: true },
    orderPayload: { raw: true },
    privatePacketPath: "C:/private/packet.json",
    rawReceipt: "raw-value",
    hashValue: "hash-value",
    digestValue: "digest-value",
    blockers: [
      "secret",
      "50195326-01",
      "C:/private/packet.json",
      "raw-value",
      "hash-value",
    ],
  }, { recordedAt: "2026-07-03T00:00:00.000Z" });
  const text = JSON.stringify(receipt);

  assert.equal(receipt.redaction.containsCredential, false);
  assert.equal(receipt.redaction.containsAccountIdentifier, false);
  assert.equal(receipt.redaction.containsProviderPayload, false);
  assert.equal(receipt.redaction.containsOrderPayload, false);
  assert.equal(receipt.redaction.containsPrivatePath, false);
  assert.equal(receipt.redaction.containsRawReceipt, false);
  assert.equal(receipt.redaction.containsHashValue, false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("C:/private"), false);
  assert.equal(text.includes("raw-value"), false);
  assert.equal(text.includes("hash-value"), false);
});

test("in-memory recorder records only redacted receipts without persistent DB writes", () => {
  const recorder = createInMemoryRiskKillSwitchReviewResultRecorder();
  const receipts = recorder.record([
    { reviewType: "risk_gate", blockers: ["one"] },
    { reviewType: "kill_switch", blockers: ["two", "three"] },
  ], { recordedAt: "2026-07-03T00:00:00.000Z" });
  const snapshot = recorder.snapshot();

  assert.equal(receipts.length, 2);
  assert.equal(snapshot.receiptCount, 2);
  assert.equal(snapshot.persistentStorageUsed, false);
  assert.equal(snapshot.dbWriteUsed, false);
  assert.deepEqual(snapshot.receipts.map((receipt) => receipt.reviewType), ["risk_gate", "kill_switch"]);
  assert.deepEqual(snapshot.receipts.map((receipt) => receipt.decision), ["blocked", "blocked"]);
});

test("admin review result gate keeps readiness flags false and boundaries private", () => {
  const status = buildAdminRiskKillSwitchReviewResultGateStatus({}, { recordedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.boundaries.credentialExposed, false);
  assert.equal(status.boundaries.accountIdentifierExposed, false);
  assert.equal(status.boundaries.providerOrderPayloadExposed, false);
  assert.equal(status.boundaries.privatePathExposed, false);
  assert.equal(status.boundaries.rawReceiptExposed, false);
  assert.equal(status.boundaries.hashValueExposed, false);
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

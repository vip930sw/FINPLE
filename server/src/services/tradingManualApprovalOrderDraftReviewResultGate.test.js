import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminManualApprovalOrderDraftReviewResultGateStatus,
  createInMemoryManualApprovalOrderDraftReviewResultRecorder,
  createRedactedManualApprovalOrderDraftReviewResult,
  recordManualApprovalOrderDraftReviewResults,
} from "./tradingManualApprovalOrderDraftReviewResultGate.js";

test("manual approval draft review result does not call provider or submit order", () => {
  const receipt = createRedactedManualApprovalOrderDraftReviewResult({}, { recordedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(receipt.providerCallsAllowed, false);
  assert.equal(receipt.orderSubmissionAllowed, false);
  assert.equal(receipt.networkCallAttempted, false);
  assert.equal(receipt.readinessPromoted, false);
  assert.equal(receipt.persistentStorageUsed, false);
  assert.equal(receipt.dbWriteUsed, false);
});

test("manual approval draft review result recording does not call provider or submit order", () => {
  const recording = recordManualApprovalOrderDraftReviewResults({}, { recordedAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(recording.providerCallsAllowed, false);
  assert.equal(recording.orderSubmissionAllowed, false);
  assert.equal(recording.networkCallAttempted, false);
  assert.equal(recording.readinessPromoted, false);
  assert.equal(recording.persistentStorageUsed, false);
  assert.equal(recording.dbWriteUsed, false);
});

test("review result receipt is redacted and contains no credential, account identifier, payload, private path, raw receipt, or hash value", () => {
  const receipt = createRedactedManualApprovalOrderDraftReviewResult(
    {
      draftId: "Step 122 Manual Approval Order Draft Placeholder",
      credential: "secret",
      accountIdentifier: "50195326-01",
      providerPayload: { raw: true },
      orderPayload: { raw: true },
      privatePathInput: "local-private-path",
      rawReceipt: "raw-value",
      hashValue: "hash-value",
      blockers: ["raw-secret-blocker"],
    },
    { recordedAt: "2026-07-03T00:00:00.000Z" },
  );
  const text = JSON.stringify(receipt);

  assert.equal(receipt.redaction.containsCredential, false);
  assert.equal(receipt.redaction.containsAccountIdentifier, false);
  assert.equal(receipt.redaction.containsProviderPayload, false);
  assert.equal(receipt.redaction.containsOrderPayload, false);
  assert.equal(receipt.redaction.containsPrivatePath, false);
  assert.equal(receipt.redaction.containsRawReceipt, false);
  assert.equal(receipt.redaction.containsHashValue, false);
  assert.equal(receipt.redaction.containsDigestValue, false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("local-private-path"), false);
  assert.equal(text.includes("raw-value"), false);
  assert.equal(text.includes("hash-value"), false);
  assert.equal(text.includes("raw-secret-blocker"), false);
});

test("in-memory recorder records only redacted receipts without persistent DB writes", () => {
  const recorder = createInMemoryManualApprovalOrderDraftReviewResultRecorder();
  const receipts = recorder.record([{ draftId: "draft-1", blockers: ["private-review-note"] }], {
    recordedAt: "2026-07-03T00:00:00.000Z",
  });
  const snapshot = recorder.snapshot();

  assert.equal(receipts.length, 1);
  assert.equal(snapshot.storage, "memory");
  assert.equal(snapshot.persistentStorageUsed, false);
  assert.equal(snapshot.dbWriteUsed, false);
  assert.equal(JSON.stringify(snapshot).includes("private-review-note"), false);
});

test("admin review result gate keeps readiness flags false and boundaries private", () => {
  const status = buildAdminManualApprovalOrderDraftReviewResultGateStatus(
    {},
    { recordedAt: "2026-07-03T00:00:00.000Z" },
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

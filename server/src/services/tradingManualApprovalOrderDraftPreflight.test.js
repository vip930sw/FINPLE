import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminManualApprovalOrderDraftPreflightStatus,
  createManualApprovalOrderDraft,
  runManualApprovalOrderDraftPreflight,
} from "./tradingManualApprovalOrderDraftPreflight.js";

test("order draft creation does not call provider or submit order", () => {
  const draft = createManualApprovalOrderDraft({}, { createdAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(draft.providerCallsAllowed, false);
  assert.equal(draft.orderSubmissionAllowed, false);
  assert.equal(draft.networkCallAttempted, false);
  assert.equal(draft.readinessPromoted, false);
  assert.equal(draft.persistentStorageUsed, false);
  assert.equal(draft.dbWriteUsed, false);
});

test("order draft is redacted and contains no credential, account identifier, payload, private path, raw receipt, or hash value", () => {
  const draft = createManualApprovalOrderDraft({
    symbol: "SECRET",
    credential: "secret",
    accountIdentifier: "50195326-01",
    providerPayload: { raw: true },
    orderPayload: { raw: true },
    privatePacketPath: "C:/private/packet.json",
    rawReceipt: "raw-value",
    hashValue: "hash-value",
  }, { createdAt: "2026-07-03T00:00:00.000Z" });
  const text = JSON.stringify(draft);

  assert.equal(draft.symbol, "REDACTED_TEST_SYMBOL");
  assert.equal(draft.redaction.containsCredential, false);
  assert.equal(draft.redaction.containsAccountIdentifier, false);
  assert.equal(draft.redaction.containsProviderPayload, false);
  assert.equal(draft.redaction.containsOrderPayload, false);
  assert.equal(draft.redaction.containsPrivatePath, false);
  assert.equal(draft.redaction.containsRawReceipt, false);
  assert.equal(draft.redaction.containsHashValue, false);
  assert.equal(text.includes("secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("C:/private"), false);
  assert.equal(text.includes("raw-value"), false);
  assert.equal(text.includes("hash-value"), false);
});

test("preflight defaults to blocked and risk gate blocking keeps it blocked", () => {
  const preflight = runManualApprovalOrderDraftPreflight({}, { createdAt: "2026-07-03T00:00:00.000Z" });

  assert.equal(preflight.preflightStatus, "blocked");
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.providerCallsAllowed, false);
  assert.match(preflight.blockers.join("|"), /step122_preflight_defaults_to_blocked/);
  assert.match(preflight.blockers.join("|"), /risk_gate_blocking/);
});

test("kill-switch blocking keeps preflight blocked", () => {
  const draft = createManualApprovalOrderDraft({
    reviewStatus: {
      riskGate: { status: "approved_for_shadow", blocking: false },
      killSwitch: { status: "active_blocking", blocking: true },
      reviewResults: [],
      blockers: [],
    },
  }, { createdAt: "2026-07-03T00:00:00.000Z" });
  const preflight = runManualApprovalOrderDraftPreflight({ draft });

  assert.equal(preflight.preflightStatus, "blocked");
  assert.match(preflight.blockers.join("|"), /kill_switch_blocking/);
  assert.equal(preflight.orderSubmissionAllowed, false);
});

test("admin order draft preflight status keeps readiness flags false and boundaries private", () => {
  const status = buildAdminManualApprovalOrderDraftPreflightStatus({}, { createdAt: "2026-07-03T00:00:00.000Z" });

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

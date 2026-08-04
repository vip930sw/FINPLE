import test from "node:test";
import assert from "node:assert/strict";

import {
  assessKisShadowFeedApproval,
  REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS,
  REQUIRED_KIS_SHADOW_READ_SCOPES,
} from "./tradingKisReadOnlyApproval.js";

function validReceipt() {
  return {
    approvalId: "approval-1",
    approvedBy: "operator",
    approvedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2026-09-01T00:00:00Z",
    scope: "trading_read_only_market_data",
    environment: "virtual_shadow",
    baseUrl: "https://openapi.koreainvestment.com:9443",
    accountIdHash: "not_applicable_market_data_only",
    allowedReadScopes: [...REQUIRED_KIS_SHADOW_READ_SCOPES],
    forbiddenActions: [...REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS],
    evidenceTicket: "ISSUE-441",
    revocationPlan: "disable feature flag and revoke credentials",
    redactionVersion: "v1",
  };
}

const enabledEnv = {
  FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED: "true",
  KIS_TRADING_APP_KEY: "configured-app-key",
  KIS_TRADING_APP_SECRET: "configured-app-secret",
};

test("blocks provider calls without explicit admin start", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: false },
    { env: enabledEnv, nowMs: Date.parse("2026-08-05T00:00:00Z") },
  );
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("explicit_admin_start_required"));
  assert.equal(result.providerCallsAllowed, false);
});

test("allows only approved read-only market-data scope", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: true },
    { env: enabledEnv, nowMs: Date.parse("2026-08-05T00:00:00Z") },
  );
  assert.equal(result.ready, true);
  assert.equal(result.providerCallsAllowed, true);
  assert.equal(result.accountCallsAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.credentials.valuesExposed, false);
});

test("fails closed when approval expired or a forbidden action is missing", () => {
  const receipt = validReceipt();
  receipt.expiresAt = "2026-08-04T00:00:00Z";
  receipt.forbiddenActions = receipt.forbiddenActions.filter((item) => item !== "order_submission");
  const result = assessKisShadowFeedApproval(
    { receipt, explicitStartRequested: true },
    { env: enabledEnv, nowMs: Date.parse("2026-08-05T00:00:00Z") },
  );
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("approval_expired"));
  assert.ok(result.reasons.includes("missing_forbidden_action_order_submission"));
});

test("never returns credential values", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: true },
    { env: enabledEnv, nowMs: Date.parse("2026-08-05T00:00:00Z") },
  );
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /configured-app-key|configured-app-secret/);
  assert.equal(result.receipt.rawReceiptStored, false);
});

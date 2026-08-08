import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import process from "node:process";
import test from "node:test";

import { requireAdminStartAccess } from "../middleware/adminGuard.js";
import {
  KIS_ACCOUNT_LIVE_READ_APPROVAL_VERSION,
  KIS_ACCOUNT_LIVE_READ_ENVIRONMENT,
  KIS_ACCOUNT_LIVE_READ_SCOPE,
  REQUIRED_KIS_ACCOUNT_LIVE_READ_FORBIDDEN_ACTIONS,
  assessKisAccountLiveReadApproval,
  createKisAccountLiveReadAccessDecision,
  isKisAccountLiveReadAccessDecisionValid,
} from "./tradingKisAccountLiveReadApproval.js";
import { KIS_READ_ONLY_BASE_URLS } from "./tradingKisReadOnlyApproval.js";

const nowMs = Date.parse("2026-08-08T00:00:00.000Z");
const accountId = "12345678-01";

function binding(value = accountId) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function adminStartAuthorization() {
  const previous = process.env.FINPLE_ADMIN_TOKEN;
  process.env.FINPLE_ADMIN_TOKEN = "test-admin-token";
  let authorization;
  try {
    requireAdminStartAccess(
      { get: (name) => name === "x-finple-admin-token" ? "test-admin-token" : "" },
      { status() { return this; }, json(payload) { assert.fail(payload.code); } },
      (value) => { authorization = value; },
    );
  } finally {
    if (previous === undefined) delete process.env.FINPLE_ADMIN_TOKEN;
    else process.env.FINPLE_ADMIN_TOKEN = previous;
  }
  return authorization;
}

function liveEnv(overrides = {}) {
  return {
    FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
    KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
    KIS_TRADING_ACCOUNT_ID: accountId,
    ...overrides,
  };
}

function receipt(overrides = {}) {
  return {
    approvalId: "synthetic-approval",
    approvedBy: "synthetic-operator",
    approvedAt: "2026-08-07T00:00:00.000Z",
    expiresAt: "2026-08-30T00:00:00.000Z",
    scope: KIS_ACCOUNT_LIVE_READ_SCOPE,
    environment: KIS_ACCOUNT_LIVE_READ_ENVIRONMENT,
    baseUrl: KIS_READ_ONLY_BASE_URLS.live,
    accountIdHash: binding(),
    forbiddenActions: REQUIRED_KIS_ACCOUNT_LIVE_READ_FORBIDDEN_ACTIONS,
    evidenceTicket: "synthetic-evidence",
    revocationPlan: "synthetic-revocation",
    redactionVersion: "v1",
    ...overrides,
  };
}

function assess(receiptOverrides = {}, envOverrides = {}) {
  return assessKisAccountLiveReadApproval(
    { receipt: receipt(receiptOverrides) },
    { env: liveEnv(envOverrides), nowMs },
  );
}

test("valid live account approval is structural, redacted and bound to the canonical account", () => {
  const approval = assess();
  assert.equal(approval.version, KIS_ACCOUNT_LIVE_READ_APPROVAL_VERSION);
  assert.equal(approval.ready, true);
  assert.equal(approval.approvalActive, true);
  assert.equal(approval.scopeMatch, true);
  assert.equal(approval.environmentMatch, true);
  assert.equal(approval.baseUrlMatch, true);
  assert.equal(approval.accountBindingPresent, true);
  assert.equal(approval.accountBindingMatch, true);
  assert.equal(approval.requiredForbiddenActionsPresent, true);
  assert.equal(approval.rawReceiptStored, false);
  assert.equal(approval.orderSubmissionAllowed, false);
  assert.equal(approval.positionMutationAllowed, false);
  assert.equal(approval.liveActivationAllowed, false);

  const serialized = JSON.stringify(approval);
  for (const value of [accountId, binding(), "synthetic-approval", "synthetic-operator", "synthetic-evidence"]) {
    assert.equal(serialized.includes(value), false);
  }
});

test("live approval fails closed with stable redacted reasons", () => {
  const cases = [
    [{ approvalId: "" }, {}, "kis_account_read_live_approval_required"],
    [{ approvedAt: "invalid" }, {}, "kis_account_read_live_approved_at_invalid"],
    [{ approvedAt: "2026-08-09T00:00:00.000Z" }, {}, "kis_account_read_live_approval_inactive"],
    [{ expiresAt: "2026-08-07T12:00:00.000Z" }, {}, "kis_account_read_live_approval_expired"],
    [{ scope: "trading_read_only_market_data" }, {}, "kis_account_read_live_scope_mismatch"],
    [{ environment: "virtual_shadow" }, {}, "kis_account_read_live_environment_mismatch"],
    [{ baseUrl: KIS_READ_ONLY_BASE_URLS.paper }, {}, "kis_account_read_live_base_url_mismatch"],
    [{ accountIdHash: binding("87654321-01") }, {}, "kis_account_read_live_account_binding_mismatch"],
    [{ forbiddenActions: REQUIRED_KIS_ACCOUNT_LIVE_READ_FORBIDDEN_ACTIONS.slice(1) }, {}, "kis_account_read_live_forbidden_actions_incomplete"],
    [{}, { FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "paper" }, "kis_account_read_live_environment_mismatch"],
    [{}, { KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.paper }, "kis_account_read_live_base_url_mismatch"],
  ];
  for (const [receiptOverrides, envOverrides, reason] of cases) {
    const approval = assess(receiptOverrides, envOverrides);
    assert.equal(approval.ready, false);
    assert.equal(approval.reasons.includes(reason), true);
  }
});

test("only a genuine admin proof and original assessment can mint an opaque live decision", () => {
  const approval = assess();
  for (const authorization of [undefined, true, {}, JSON.parse("{}")]) {
    assert.equal(createKisAccountLiveReadAccessDecision(approval, authorization), null);
  }
  assert.equal(
    createKisAccountLiveReadAccessDecision(JSON.parse(JSON.stringify(approval)), adminStartAuthorization()),
    null,
  );

  const authorization = adminStartAuthorization();
  const decision = createKisAccountLiveReadAccessDecision(approval, authorization);
  assert.equal(Object.keys(decision).length, 0);
  assert.equal(isKisAccountLiveReadAccessDecisionValid(decision, { accountId, nowMs }), true);
  assert.equal(isKisAccountLiveReadAccessDecisionValid({}, { accountId, nowMs }), false);
  assert.equal(isKisAccountLiveReadAccessDecisionValid(true, { accountId, nowMs }), false);
  assert.equal(isKisAccountLiveReadAccessDecisionValid(decision, { accountId: "87654321-01", nowMs }), false);
  assert.equal(isKisAccountLiveReadAccessDecisionValid(decision, { accountId, nowMs: Date.parse("2026-09-01T00:00:00.000Z") }), false);
  assert.equal(createKisAccountLiveReadAccessDecision(approval, authorization), null);
});

test("an invalid or paper approval cannot authorize live account access", () => {
  for (const approval of [
    assess({ scope: "trading_read_only_market_data" }),
    assess({ environment: "virtual_shadow", baseUrl: KIS_READ_ONLY_BASE_URLS.paper }),
    assess({ expiresAt: "2026-08-07T00:00:00.000Z" }),
  ]) {
    const decision = createKisAccountLiveReadAccessDecision(approval, adminStartAuthorization());
    assert.equal(isKisAccountLiveReadAccessDecisionValid(decision, { accountId, nowMs }), false);
  }
});

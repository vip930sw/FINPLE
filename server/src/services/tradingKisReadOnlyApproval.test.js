import test from "node:test";
import assert from "node:assert/strict";

import {
  assessKisShadowFeedApproval,
  KIS_READ_ONLY_BASE_URLS,
  REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS,
  REQUIRED_KIS_SHADOW_READ_SCOPES,
} from "./tradingKisReadOnlyApproval.js";

function validReceipt(overrides = {}) {
  return {
    approvalId: "approval-1",
    approvedBy: "operator",
    approvedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2026-09-01T00:00:00Z",
    scope: "trading_read_only_market_data",
    environment: "virtual_shadow",
    baseUrl: KIS_READ_ONLY_BASE_URLS.paper,
    accountIdHash: "not_applicable_market_data_only",
    allowedReadScopes: [...REQUIRED_KIS_SHADOW_READ_SCOPES],
    forbiddenActions: [...REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS],
    evidenceTicket: "ISSUE-441",
    revocationPlan: "disable feature flag and revoke credentials",
    redactionVersion: "v1",
    ...overrides,
  };
}

function enabledEnv(overrides = {}) {
  return {
    FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED: "true",
    FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "paper",
    KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.paper,
    KIS_TRADING_APP_KEY: "configured-app-key",
    KIS_TRADING_APP_SECRET: "configured-app-secret",
    ...overrides,
  };
}

const nowMs = Date.parse("2026-08-05T00:00:00Z");

test("requires explicit admin start for an otherwise valid paper contract", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: false },
    { env: enabledEnv(), nowMs },
  );
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("explicit_admin_start_required"));
  assert.equal(result.providerCallsAllowed, false);
});

test("allows Staging paper receipt, endpoint, and credential marker only with explicit start", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: true },
    { env: enabledEnv(), nowMs },
  );
  assert.equal(result.ready, true);
  assert.equal(result.credentialEnvironment, "paper");
  assert.equal(result.baseUrlEnvironment, "paper");
  assert.equal(result.environmentCredentialMatch, true);
  assert.equal(result.environmentBaseUrlMatch, true);
  assert.equal(result.providerCallsAllowed, true);
  assert.equal(result.accountCallsAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.liveActivationAllowed, false);
});

test("blocks a Staging paper receipt with the live endpoint", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt({ baseUrl: KIS_READ_ONLY_BASE_URLS.live }), explicitStartRequested: true },
    { env: enabledEnv({ KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live }), nowMs },
  );
  assert.equal(result.ready, false);
  assert.equal(result.baseUrlEnvironment, "live");
  assert.equal(result.environmentBaseUrlMatch, false);
  assert.ok(result.reasons.includes("approval_environment_base_url_mismatch"));
});

test("blocks a Staging paper receipt with a live credential marker", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: true },
    { env: enabledEnv({ FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live" }), nowMs },
  );
  assert.equal(result.ready, false);
  assert.equal(result.credentialEnvironment, "live");
  assert.equal(result.environmentCredentialMatch, false);
  assert.ok(result.reasons.includes("approval_environment_credential_mismatch"));
});

test("allows a Production live receipt, endpoint, and credential marker", () => {
  const result = assessKisShadowFeedApproval(
    {
      receipt: validReceipt({ environment: "production_live", baseUrl: KIS_READ_ONLY_BASE_URLS.live }),
      explicitStartRequested: true,
    },
    {
      env: enabledEnv({
        FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
        KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
      }),
      nowMs,
    },
  );
  assert.equal(result.ready, true);
  assert.equal(result.credentialEnvironment, "live");
  assert.equal(result.baseUrlEnvironment, "live");
  assert.equal(result.environmentCredentialMatch, true);
  assert.equal(result.environmentBaseUrlMatch, true);
  assert.equal(result.accountCallsAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.liveActivationAllowed, false);
});

test("blocks a Production live receipt with the paper endpoint", () => {
  const result = assessKisShadowFeedApproval(
    {
      receipt: validReceipt({ environment: "production_live", baseUrl: KIS_READ_ONLY_BASE_URLS.paper }),
      explicitStartRequested: true,
    },
    {
      env: enabledEnv({
        FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
        KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.paper,
      }),
      nowMs,
    },
  );
  assert.equal(result.ready, false);
  assert.equal(result.environmentBaseUrlMatch, false);
});

test("blocks arbitrary endpoints and missing credential-environment markers", () => {
  const arbitrary = assessKisShadowFeedApproval(
    { receipt: validReceipt({ baseUrl: "https://example.invalid" }), explicitStartRequested: true },
    { env: enabledEnv({ KIS_TRADING_BASE_URL: "https://example.invalid" }), nowMs },
  );
  assert.equal(arbitrary.baseUrlEnvironment, "invalid");
  assert.ok(arbitrary.reasons.includes("kis_trading_base_url_not_allowed"));
  assert.ok(arbitrary.reasons.includes("approval_base_url_not_allowed"));

  const missingMarker = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: true },
    { env: enabledEnv({ FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "" }), nowMs },
  );
  assert.equal(missingMarker.credentialEnvironment, "unknown");
  assert.ok(missingMarker.reasons.includes("kis_credential_environment_required"));

  const invalidMarker = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: true },
    { env: enabledEnv({ FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "sandbox" }), nowMs },
  );
  assert.equal(invalidMarker.credentialEnvironment, "invalid");
  assert.ok(invalidMarker.reasons.includes("kis_credential_environment_invalid"));
});

test("fails closed when approval expired or a forbidden action is missing", () => {
  const receipt = validReceipt({
    expiresAt: "2026-08-04T00:00:00Z",
    forbiddenActions: REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS.filter((item) => item !== "order_submission"),
  });
  const result = assessKisShadowFeedApproval(
    { receipt, explicitStartRequested: true },
    { env: enabledEnv(), nowMs },
  );
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("approval_expired"));
  assert.ok(result.reasons.includes("missing_forbidden_action_order_submission"));
});

test("never serializes credential values", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(), explicitStartRequested: true },
    { env: enabledEnv(), nowMs },
  );
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /configured-app-key|configured-app-secret/);
  assert.equal(result.credentials.valuesExposed, false);
  assert.equal(result.credentials.valuesPersisted, false);
  assert.equal(result.receipt.rawReceiptStored, false);
});

import test from "node:test";
import assert from "node:assert/strict";

import { requireAdminStartAccess } from "../middleware/adminGuard.js";
import { authenticatedAdminStartAuthorization } from "../../test-utils/adminStartAuthorization.js";
import {
  assessKisShadowFeedApproval,
  createKisProviderAccessDecision,
  KIS_READ_ONLY_BASE_URLS,
  KIS_READ_ONLY_WEBSOCKET_URLS,
  projectKisShadowFeedApprovalPublic,
  readKisProviderAccessDecision,
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

const receiptSentinels = {
  approvalId: "SENSITIVE_APPROVAL_ID_SENTINEL",
  approvedBy: "SENSITIVE_APPROVER_SENTINEL",
  approvedAt: "SENSITIVE_APPROVED_AT_SENTINEL",
  expiresAt: "SENSITIVE_EXPIRES_AT_SENTINEL",
  evidenceTicket: "SENSITIVE_EVIDENCE_TICKET_SENTINEL",
  revocationPlan: "SENSITIVE_REVOCATION_PLAN_SENTINEL",
  accountIdHash: "SENSITIVE_ACCOUNT_HASH_SENTINEL",
  redactionVersion: "SENSITIVE_REDACTION_VERSION_SENTINEL",
};

test("configuration assessment never authorizes provider calls", () => {
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
  assert.equal(result.explicitStartRequired, undefined);
  assert.equal(result.providerCallsAllowed, false);
  assert.equal(createKisProviderAccessDecision(result), null);
  assert.equal(createKisProviderAccessDecision(result, {}), null);
});

test("admin-start authorization is not issued by dev-open or an invalid token", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousPreview = process.env.FINPLE_ADMIN_PREVIEW_ENABLED;
  const previousToken = process.env.FINPLE_ADMIN_TOKEN;
  const attempts = [];
  try {
    process.env.NODE_ENV = "test";
    process.env.FINPLE_ADMIN_PREVIEW_ENABLED = "true";
    delete process.env.FINPLE_ADMIN_TOKEN;
    requireAdminStartAccess(
      { get: () => "" },
      { status(code) { this.code = code; return this; }, json(payload) { attempts.push([this.code, payload.code]); } },
      () => assert.fail("dev-open must not mint an admin-start authorization"),
    );
    process.env.FINPLE_ADMIN_TOKEN = "expected-test-token";
    requireAdminStartAccess(
      { get: (name) => name === "x-finple-admin-token" ? "wrong-test-token" : "" },
      { status(code) { this.code = code; return this; }, json(payload) { attempts.push([this.code, payload.code]); } },
      () => assert.fail("an invalid token must not mint an admin-start authorization"),
    );
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousPreview === undefined) delete process.env.FINPLE_ADMIN_PREVIEW_ENABLED;
    else process.env.FINPLE_ADMIN_PREVIEW_ENABLED = previousPreview;
    if (previousToken === undefined) delete process.env.FINPLE_ADMIN_TOKEN;
    else process.env.FINPLE_ADMIN_TOKEN = previousToken;
  }
  assert.deepEqual(attempts, [[403, "ADMIN_TOKEN_REQUIRED"], [403, "ADMIN_TOKEN_REQUIRED"]]);
});

test("blocks the unsupported Staging paper realtime feed even with a matching contract", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt() },
    { env: enabledEnv(), nowMs },
  );
  assert.equal(result.ready, false);
  assert.equal(result.credentialEnvironment, "paper");
  assert.equal(result.baseUrlEnvironment, "paper");
  assert.equal(result.websocketEnvironment, "paper");
  assert.equal(result.environmentCredentialMatch, true);
  assert.equal(result.environmentBaseUrlMatch, true);
  assert.equal(result.environmentWebsocketMatch, true);
  assert.equal(KIS_READ_ONLY_WEBSOCKET_URLS[result.websocketEnvironment], "ws://ops.koreainvestment.com:31000/tryitout");
  assert.ok(result.reasons.includes("paper_realtime_trade_scope_unsupported"));
  assert.ok(result.reasons.includes("paper_realtime_quote_scope_unsupported"));
  assert.ok(result.reasons.includes("paper_shadow_feed_not_supported"));
  assert.equal(result.providerCallsAllowed, false);
  assert.equal(result.accountCallsAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.liveActivationAllowed, false);
});

test("blocks a Staging paper receipt with the live endpoint", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt({ baseUrl: KIS_READ_ONLY_BASE_URLS.live }) },
    { env: enabledEnv({ KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live }), nowMs },
  );
  assert.equal(result.ready, false);
  assert.equal(result.baseUrlEnvironment, "live");
  assert.equal(result.environmentBaseUrlMatch, false);
  assert.equal(result.environmentWebsocketMatch, false);
  assert.ok(result.reasons.includes("approval_environment_base_url_mismatch"));
});

test("blocks a Staging paper receipt with a live credential marker", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt() },
    { env: enabledEnv({ FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live" }), nowMs },
  );
  assert.equal(result.ready, false);
  assert.equal(result.credentialEnvironment, "live");
  assert.equal(result.environmentCredentialMatch, false);
  assert.equal(result.environmentWebsocketMatch, false);
  assert.ok(result.reasons.includes("approval_environment_credential_mismatch"));
});

test("allows a Production live receipt, endpoint, and credential marker", () => {
  const result = assessKisShadowFeedApproval(
    {
      receipt: validReceipt({ environment: "production_live", baseUrl: KIS_READ_ONLY_BASE_URLS.live }),
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
  assert.equal(result.websocketEnvironment, "live");
  assert.equal(result.environmentCredentialMatch, true);
  assert.equal(result.environmentBaseUrlMatch, true);
  assert.equal(result.environmentWebsocketMatch, true);
  assert.equal(KIS_READ_ONLY_WEBSOCKET_URLS[result.websocketEnvironment], "ws://ops.koreainvestment.com:21000/tryitout");
  assert.equal(result.accountCallsAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.liveActivationAllowed, false);
});

test("blocks a Production live receipt with the paper endpoint", () => {
  const result = assessKisShadowFeedApproval(
    {
      receipt: validReceipt({ environment: "production_live", baseUrl: KIS_READ_ONLY_BASE_URLS.paper }),
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
    { receipt: validReceipt({ baseUrl: "https://example.invalid" }) },
    { env: enabledEnv({ KIS_TRADING_BASE_URL: "https://example.invalid" }), nowMs },
  );
  assert.equal(arbitrary.baseUrlEnvironment, "invalid");
  assert.ok(arbitrary.reasons.includes("kis_trading_base_url_not_allowed"));
  assert.ok(arbitrary.reasons.includes("approval_base_url_not_allowed"));

  const missingMarker = assessKisShadowFeedApproval(
    { receipt: validReceipt() },
    { env: enabledEnv({ FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "" }), nowMs },
  );
  assert.equal(missingMarker.credentialEnvironment, "unknown");
  assert.ok(missingMarker.reasons.includes("kis_credential_environment_required"));

  const invalidMarker = assessKisShadowFeedApproval(
    { receipt: validReceipt() },
    { env: enabledEnv({ FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "sandbox" }), nowMs },
  );
  assert.equal(invalidMarker.credentialEnvironment, "invalid");
  assert.ok(invalidMarker.reasons.includes("kis_credential_environment_invalid"));

  const invalidReceiptEnvironment = assessKisShadowFeedApproval(
    { receipt: validReceipt({ environment: "sandbox" }) },
    { env: enabledEnv(), nowMs },
  );
  assert.equal(invalidReceiptEnvironment.websocketEnvironment, "invalid");
  assert.equal(invalidReceiptEnvironment.environmentWebsocketMatch, false);
});

test("fails closed when approval expired or a forbidden action is missing", () => {
  const receipt = validReceipt({
    expiresAt: "2026-08-04T00:00:00Z",
    forbiddenActions: REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS.filter((item) => item !== "order_submission"),
  });
  const result = assessKisShadowFeedApproval(
    { receipt },
    { env: enabledEnv(), nowMs },
  );
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("approval_expired"));
  assert.ok(result.reasons.includes("missing_forbidden_action_order_submission"));
});

test("never serializes credential values", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt() },
    { env: enabledEnv(), nowMs },
  );
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /configured-app-key|configured-app-secret/);
  assert.equal(result.credentials.valuesExposed, false);
  assert.equal(result.credentials.valuesPersisted, false);
  assert.equal(result.receipt.rawReceiptStored, false);
});

test("public approval projections never serialize raw receipt metadata", () => {
  const result = assessKisShadowFeedApproval(
    { receipt: validReceipt(receiptSentinels) },
    { env: enabledEnv(), nowMs },
  );
  const serialized = JSON.stringify(projectKisShadowFeedApprovalPublic(result));
  for (const sentinel of Object.values(receiptSentinels)) {
    assert.equal(serialized.includes(sentinel), false);
  }
  assert.equal(result.receipt.approvalIdPresent, true);
  assert.equal(result.receipt.approvedAtValid, false);
  assert.equal(result.receipt.expiryStatus, "INVALID");
});

test("provider access decisions reject fabricated objects and preserve canonical environments", () => {
  assert.equal(createKisProviderAccessDecision({
    ready: true,
    providerCallsAllowed: true,
    environmentWebsocketMatch: true,
  }, authenticatedAdminStartAuthorization()), null);
  assert.equal(readKisProviderAccessDecision({}), null);

  const liveApproval = assessKisShadowFeedApproval(
    {
      receipt: validReceipt({ environment: "production_live", baseUrl: KIS_READ_ONLY_BASE_URLS.live }),
    },
    {
      env: enabledEnv({
        FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
        KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
      }),
      nowMs,
    },
  );
  const authorization = authenticatedAdminStartAuthorization();
  const decision = createKisProviderAccessDecision(liveApproval, authorization);
  const access = readKisProviderAccessDecision(decision);
  assert.equal(access.authorized, true);
  assert.equal(access.baseUrlEnvironment, "live");
  assert.equal(access.credentialEnvironment, "live");
  assert.equal(access.websocketEnvironment, "live");
  assert.deepEqual(JSON.parse(JSON.stringify(authorization)), {});
  assert.equal(createKisProviderAccessDecision(liveApproval, authorization), null);
});

test("mutating a returned assessment cannot forge provider authorization", () => {
  const paperApproval = assessKisShadowFeedApproval(
    { receipt: validReceipt() },
    { env: enabledEnv(), nowMs },
  );
  paperApproval.ready = true;
  paperApproval.providerCallsAllowed = true;
  paperApproval.reasons = [];
  paperApproval.baseUrlEnvironment = "live";
  paperApproval.credentialEnvironment = "live";
  paperApproval.websocketEnvironment = "live";
  const access = readKisProviderAccessDecision(createKisProviderAccessDecision(
    paperApproval,
    authenticatedAdminStartAuthorization(),
  ));
  assert.equal(access.authorized, false);
  assert.equal(access.baseUrlEnvironment, "paper");
  assert.ok(access.reasons.includes("paper_shadow_feed_not_supported"));
});

test("canonical paper access remains configuration-valid but provider-unsupported", () => {
  const paperApproval = assessKisShadowFeedApproval(
    { receipt: validReceipt() },
    { env: enabledEnv(), nowMs },
  );
  const access = readKisProviderAccessDecision(createKisProviderAccessDecision(
    paperApproval,
    authenticatedAdminStartAuthorization(),
  ));
  assert.equal(access.authorized, false);
  assert.equal(access.environmentWebsocketMatch, true);
  assert.ok(access.reasons.includes("paper_realtime_trade_scope_unsupported"));
  assert.ok(access.reasons.includes("paper_realtime_quote_scope_unsupported"));
  assert.ok(access.reasons.includes("paper_shadow_feed_not_supported"));
});

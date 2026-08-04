export const KIS_SHADOW_FEED_APPROVAL_VERSION = "kis-shadow-feed-read-only-approval-v1";

export const REQUIRED_KIS_SHADOW_READ_SCOPES = Object.freeze([
  "current_quotes",
  "market_session_state",
  "provider_rate_limit_state",
]);

export const REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS = Object.freeze([
  "order_submission",
  "order_cancellation",
  "position_mutation",
  "live_trading_endpoint",
  "raw_provider_response_persistence",
]);

const KIS_APPROVAL_BASE_URL = "https://openapi.koreainvestment.com:9443";

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(clean(value).toLowerCase());
}

function list(value) {
  if (Array.isArray(value)) return [...new Set(value.map(clean).filter(Boolean))];
  return [...new Set(clean(value).split(",").map(clean).filter(Boolean))];
}

function epoch(value) {
  const parsed = Date.parse(clean(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function missing(actual, required) {
  const values = new Set(actual);
  return required.filter((item) => !values.has(item));
}

export function loadKisShadowReadOnlyApprovalFromEnv(env = process.env) {
  return {
    approvalVersion: KIS_SHADOW_FEED_APPROVAL_VERSION,
    approvalId: clean(env.FINPLE_TRADING_READ_ONLY_APPROVAL_ID),
    approvedBy: clean(env.FINPLE_TRADING_READ_ONLY_APPROVED_BY),
    approvedAt: clean(env.FINPLE_TRADING_READ_ONLY_APPROVED_AT),
    expiresAt: clean(env.FINPLE_TRADING_READ_ONLY_EXPIRES_AT),
    scope: clean(env.FINPLE_TRADING_READ_ONLY_SCOPE),
    environment: clean(env.FINPLE_TRADING_READ_ONLY_ENVIRONMENT),
    baseUrl: clean(env.FINPLE_TRADING_READ_ONLY_BASE_URL),
    accountIdHash: clean(env.FINPLE_TRADING_READ_ONLY_ACCOUNT_ID_HASH),
    allowedReadScopes: list(env.FINPLE_TRADING_READ_ONLY_ALLOWED_SCOPES),
    forbiddenActions: list(env.FINPLE_TRADING_READ_ONLY_FORBIDDEN_ACTIONS),
    evidenceTicket: clean(env.FINPLE_TRADING_READ_ONLY_EVIDENCE_TICKET),
    revocationPlan: clean(env.FINPLE_TRADING_READ_ONLY_REVOCATION_PLAN),
    redactionVersion: clean(env.FINPLE_TRADING_READ_ONLY_REDACTION_VERSION),
  };
}

export function assessKisShadowFeedApproval(input = {}, options = {}) {
  const env = options.env ?? process.env;
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const receipt = input.receipt ?? loadKisShadowReadOnlyApprovalFromEnv(env);
  const approvedAtMs = epoch(receipt.approvedAt);
  const expiresAtMs = epoch(receipt.expiresAt);
  const allowedReadScopes = list(receipt.allowedReadScopes);
  const forbiddenActions = list(receipt.forbiddenActions);
  const missingReadScopes = missing(allowedReadScopes, REQUIRED_KIS_SHADOW_READ_SCOPES);
  const missingForbiddenActions = missing(forbiddenActions, REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS);
  const featureEnabled = normalizeBoolean(env.FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED, false);
  const appKeyConfigured = Boolean(clean(options.appKey ?? env.KIS_TRADING_APP_KEY));
  const appSecretConfigured = Boolean(clean(options.appSecret ?? env.KIS_TRADING_APP_SECRET));
  const explicitStartRequested = input.explicitStartRequested === true;

  const reasons = [
    featureEnabled ? null : "kis_shadow_feed_feature_flag_disabled",
    explicitStartRequested ? null : "explicit_admin_start_required",
    clean(receipt.approvalId) ? null : "approval_id_required",
    clean(receipt.approvedBy) ? null : "approved_by_required",
    approvedAtMs !== null ? null : "approved_at_invalid",
    expiresAtMs !== null ? null : "expires_at_invalid",
    approvedAtMs !== null && approvedAtMs <= nowMs ? null : "approval_not_active_yet",
    expiresAtMs !== null && expiresAtMs > nowMs ? null : "approval_expired",
    clean(receipt.scope) === "trading_read_only_market_data" ? null : "approval_scope_must_be_market_data_read_only",
    clean(receipt.environment) === "virtual_shadow" ? null : "approval_environment_must_be_virtual_shadow",
    clean(receipt.baseUrl).replace(/\/+$/, "") === KIS_APPROVAL_BASE_URL ? null : "approval_base_url_mismatch",
    clean(receipt.accountIdHash) ? null : "account_id_hash_marker_required",
    clean(receipt.evidenceTicket) ? null : "evidence_ticket_required",
    clean(receipt.revocationPlan) ? null : "revocation_plan_required",
    clean(receipt.redactionVersion) ? null : "redaction_version_required",
    ...missingReadScopes.map((scope) => `missing_read_scope_${scope}`),
    ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
    appKeyConfigured ? null : "kis_trading_app_key_missing",
    appSecretConfigured ? null : "kis_trading_app_secret_missing",
  ].filter(Boolean);

  return {
    version: KIS_SHADOW_FEED_APPROVAL_VERSION,
    ready: reasons.length === 0,
    reasons,
    featureEnabled,
    explicitStartRequested,
    credentials: {
      appKeyConfigured,
      appSecretConfigured,
      valuesExposed: false,
      valuesPersisted: false,
    },
    receipt: {
      approvalId: clean(receipt.approvalId) || null,
      approvedBy: clean(receipt.approvedBy) || null,
      approvedAt: clean(receipt.approvedAt) || null,
      expiresAt: clean(receipt.expiresAt) || null,
      scope: clean(receipt.scope) || null,
      environment: clean(receipt.environment) || null,
      baseUrl: clean(receipt.baseUrl) || null,
      accountIdHashPresent: Boolean(clean(receipt.accountIdHash)),
      evidenceTicket: clean(receipt.evidenceTicket) || null,
      revocationPlanPresent: Boolean(clean(receipt.revocationPlan)),
      redactionVersion: clean(receipt.redactionVersion) || null,
      allowedReadScopes,
      forbiddenActions,
      rawReceiptStored: false,
    },
    providerCallsAllowed: reasons.length === 0,
    accountCallsAllowed: false,
    orderSubmissionAllowed: false,
    liveActivationAllowed: false,
  };
}

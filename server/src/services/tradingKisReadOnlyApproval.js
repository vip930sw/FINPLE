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

export const KIS_READ_ONLY_BASE_URLS = Object.freeze({
  paper: "https://openapivts.koreainvestment.com:29443",
  live: "https://openapi.koreainvestment.com:9443",
});

export const KIS_READ_ONLY_WEBSOCKET_URLS = Object.freeze({
  paper: "ws://ops.koreainvestment.com:31000/tryitout",
  live: "ws://ops.koreainvestment.com:21000/tryitout",
});

export const KIS_OVERSEAS_REALTIME_SUPPORT = Object.freeze({
  paper: Object.freeze({ HDFSCNT0: false, HDFSASP0: false }),
  live: Object.freeze({ HDFSCNT0: true, HDFSASP0: true }),
});

const KIS_READ_ONLY_ENVIRONMENTS = Object.freeze({
  virtual_shadow: "paper",
  production_live: "live",
});

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1_000;
const approvalAssessments = new WeakMap();
const providerAccessDecisions = new WeakMap();

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

function normalizedBaseUrl(value) {
  return clean(value).replace(/\/+$/, "");
}

function credentialEnvironment(value) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return "unknown";
  return normalized === "paper" || normalized === "live" ? normalized : "invalid";
}

function baseUrlEnvironment(value) {
  const normalized = normalizedBaseUrl(value);
  if (normalized === KIS_READ_ONLY_BASE_URLS.paper) return "paper";
  if (normalized === KIS_READ_ONLY_BASE_URLS.live) return "live";
  return "invalid";
}

function expiryStatus({ approvedAtMs, expiresAtMs, nowMs }) {
  if (approvedAtMs === null || expiresAtMs === null || expiresAtMs <= approvedAtMs) return "INVALID";
  if (approvedAtMs > nowMs) return "NOT_ACTIVE_YET";
  if (expiresAtMs <= nowMs) return "EXPIRED";
  return expiresAtMs - nowMs <= SEVEN_DAYS_MS ? "EXPIRING_SOON" : "ACTIVE";
}

export function projectKisShadowFeedApprovalPublic(approval = {}) {
  const receipt = approval.receipt || {};
  const credentials = approval.credentials || {};
  return {
    version: approval.version || KIS_SHADOW_FEED_APPROVAL_VERSION,
    ready: approval.ready === true,
    reasons: Array.isArray(approval.reasons) ? [...approval.reasons] : [],
    featureEnabled: approval.featureEnabled === true,
    explicitStartRequested: approval.explicitStartRequested === true,
    providerCallsAllowed: approval.providerCallsAllowed === true,
    credentialEnvironment: approval.credentialEnvironment || "unknown",
    baseUrlEnvironment: approval.baseUrlEnvironment || "invalid",
    websocketEnvironment: approval.websocketEnvironment || "invalid",
    environmentCredentialMatch: approval.environmentCredentialMatch === true,
    environmentBaseUrlMatch: approval.environmentBaseUrlMatch === true,
    environmentWebsocketMatch: approval.environmentWebsocketMatch === true,
    receipt: {
      approvalIdPresent: receipt.approvalIdPresent === true,
      approvedByPresent: receipt.approvedByPresent === true,
      approvedAtValid: receipt.approvedAtValid === true,
      approvalActive: receipt.approvalActive === true,
      expiresAtValid: receipt.expiresAtValid === true,
      approvalExpired: receipt.approvalExpired === true,
      expiresWithin7Days: receipt.expiresWithin7Days === true,
      expiryStatus: receipt.expiryStatus || "INVALID",
      scopeMatch: receipt.scopeMatch === true,
      environmentMatch: receipt.environmentMatch === true,
      baseUrlConfigured: receipt.baseUrlConfigured === true,
      accountIdHashPresent: receipt.accountIdHashPresent === true,
      evidenceTicketPresent: receipt.evidenceTicketPresent === true,
      revocationPlanPresent: receipt.revocationPlanPresent === true,
      redactionVersionPresent: receipt.redactionVersionPresent === true,
      rawReceiptStored: false,
    },
    credentials: {
      appKeyConfigured: credentials.appKeyConfigured === true,
      appSecretConfigured: credentials.appSecretConfigured === true,
      valuesExposed: false,
      valuesPersisted: false,
    },
    safety: {
      providerCallsAllowedWithoutExplicitStart: false,
      accountCallsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      liveActivationAllowed: false,
      rawProviderPayloadStored: false,
    },
  };
}

export function createKisProviderAccessDecision(approval) {
  const assessment = approvalAssessments.get(approval);
  if (!assessment || assessment.explicitStartRequested !== true) return null;
  const decision = Object.freeze({});
  providerAccessDecisions.set(decision, Object.freeze({
    authorized: assessment.authorized,
    reasons: assessment.reasons,
    baseUrlEnvironment: assessment.baseUrlEnvironment,
    credentialEnvironment: assessment.credentialEnvironment,
    websocketEnvironment: assessment.websocketEnvironment,
    environmentWebsocketMatch: assessment.environmentWebsocketMatch,
    approvalExpiresAtMs: assessment.expiresAtMs,
    publicApproval: assessment.publicApproval,
    appKey: assessment.appKey,
    appSecret: assessment.appSecret,
  }));
  return decision;
}

export function readKisProviderAccessDecision(decision) {
  const value = providerAccessDecisions.get(decision);
  return value ? {
    authorized: value.authorized,
    reasons: [...value.reasons],
    baseUrlEnvironment: value.baseUrlEnvironment,
    credentialEnvironment: value.credentialEnvironment,
    websocketEnvironment: value.websocketEnvironment,
    environmentWebsocketMatch: value.environmentWebsocketMatch,
    approvalExpiresAtMs: value.approvalExpiresAtMs,
    publicApproval: projectKisShadowFeedApprovalPublic(value.publicApproval),
  } : null;
}

export function kisProviderAccessCredentialsMatch(decision, appKey, appSecret) {
  const value = providerAccessDecisions.get(decision);
  return Boolean(value && value.appKey === clean(appKey) && value.appSecret === clean(appSecret));
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
  const appKey = clean(options.appKey ?? env.KIS_TRADING_APP_KEY);
  const appSecret = clean(options.appSecret ?? env.KIS_TRADING_APP_SECRET);
  const appKeyConfigured = Boolean(appKey);
  const appSecretConfigured = Boolean(appSecret);
  const explicitStartRequested = input.explicitStartRequested === true;
  const expectedEnvironment = KIS_READ_ONLY_ENVIRONMENTS[clean(receipt.environment)] || null;
  const resolvedCredentialEnvironment = credentialEnvironment(env.FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT);
  const resolvedBaseUrlEnvironment = baseUrlEnvironment(env.KIS_TRADING_BASE_URL);
  const receiptBaseUrlEnvironment = baseUrlEnvironment(receipt.baseUrl);
  const environmentCredentialMatch = Boolean(
    expectedEnvironment && resolvedCredentialEnvironment === expectedEnvironment,
  );
  const environmentBaseUrlMatch = Boolean(
    expectedEnvironment
      && resolvedBaseUrlEnvironment === expectedEnvironment
      && receiptBaseUrlEnvironment === expectedEnvironment
      && normalizedBaseUrl(env.KIS_TRADING_BASE_URL) === normalizedBaseUrl(receipt.baseUrl),
  );
  const websocketEnvironment = KIS_READ_ONLY_WEBSOCKET_URLS[expectedEnvironment] ? expectedEnvironment : "invalid";
  const environmentWebsocketMatch = Boolean(
    websocketEnvironment !== "invalid"
      && environmentCredentialMatch
      && environmentBaseUrlMatch,
  );
  const realtimeSupport = KIS_OVERSEAS_REALTIME_SUPPORT[websocketEnvironment];
  const resolvedExpiryStatus = expiryStatus({ approvedAtMs, expiresAtMs, nowMs });

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
    expectedEnvironment ? null : "approval_environment_not_allowed",
    resolvedCredentialEnvironment !== "unknown" ? null : "kis_credential_environment_required",
    resolvedCredentialEnvironment !== "invalid" ? null : "kis_credential_environment_invalid",
    resolvedBaseUrlEnvironment !== "invalid" ? null : "kis_trading_base_url_not_allowed",
    receiptBaseUrlEnvironment !== "invalid" ? null : "approval_base_url_not_allowed",
    environmentCredentialMatch ? null : "approval_environment_credential_mismatch",
    environmentBaseUrlMatch ? null : "approval_environment_base_url_mismatch",
    environmentWebsocketMatch ? null : "approval_environment_websocket_mismatch",
    websocketEnvironment === "paper" && realtimeSupport?.HDFSCNT0 !== true
      ? "paper_realtime_trade_scope_unsupported"
      : null,
    websocketEnvironment === "paper" && realtimeSupport?.HDFSASP0 !== true
      ? "paper_realtime_quote_scope_unsupported"
      : null,
    websocketEnvironment === "paper" && (realtimeSupport?.HDFSCNT0 !== true || realtimeSupport?.HDFSASP0 !== true)
      ? "paper_shadow_feed_not_supported"
      : null,
    clean(receipt.accountIdHash) ? null : "account_id_hash_marker_required",
    clean(receipt.evidenceTicket) ? null : "evidence_ticket_required",
    clean(receipt.revocationPlan) ? null : "revocation_plan_required",
    clean(receipt.redactionVersion) ? null : "redaction_version_required",
    ...missingReadScopes.map((scope) => `missing_read_scope_${scope}`),
    ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
    appKeyConfigured ? null : "kis_trading_app_key_missing",
    appSecretConfigured ? null : "kis_trading_app_secret_missing",
  ].filter(Boolean);

  const result = {
    version: KIS_SHADOW_FEED_APPROVAL_VERSION,
    ready: reasons.length === 0,
    reasons,
    featureEnabled,
    explicitStartRequested,
    credentialEnvironment: resolvedCredentialEnvironment,
    baseUrlEnvironment: resolvedBaseUrlEnvironment,
    environmentCredentialMatch,
    environmentBaseUrlMatch,
    websocketEnvironment,
    environmentWebsocketMatch,
    credentials: {
      appKeyConfigured,
      appSecretConfigured,
      valuesExposed: false,
      valuesPersisted: false,
    },
    receipt: {
      approvalIdPresent: Boolean(clean(receipt.approvalId)),
      approvedByPresent: Boolean(clean(receipt.approvedBy)),
      approvedAtValid: approvedAtMs !== null,
      approvalActive: approvedAtMs !== null && expiresAtMs !== null && approvedAtMs <= nowMs && expiresAtMs > nowMs,
      expiresAtValid: expiresAtMs !== null,
      approvalExpired: expiresAtMs !== null && expiresAtMs <= nowMs,
      expiresWithin7Days: expiresAtMs !== null && expiresAtMs > nowMs && expiresAtMs - nowMs <= SEVEN_DAYS_MS,
      expiryStatus: resolvedExpiryStatus,
      scopeMatch: clean(receipt.scope) === "trading_read_only_market_data",
      environmentMatch: Boolean(expectedEnvironment),
      baseUrlConfigured: Boolean(clean(receipt.baseUrl)),
      accountIdHashPresent: Boolean(clean(receipt.accountIdHash)),
      evidenceTicketPresent: Boolean(clean(receipt.evidenceTicket)),
      revocationPlanPresent: Boolean(clean(receipt.revocationPlan)),
      redactionVersionPresent: Boolean(clean(receipt.redactionVersion)),
      rawReceiptStored: false,
    },
    providerCallsAllowed: reasons.length === 0,
    accountCallsAllowed: false,
    orderSubmissionAllowed: false,
    liveActivationAllowed: false,
  };
  approvalAssessments.set(result, Object.freeze({
    authorized: result.ready === true && result.providerCallsAllowed === true,
    explicitStartRequested: result.explicitStartRequested,
    reasons: Object.freeze([...result.reasons]),
    baseUrlEnvironment: result.baseUrlEnvironment,
    credentialEnvironment: result.credentialEnvironment,
    websocketEnvironment: result.websocketEnvironment,
    environmentWebsocketMatch: result.environmentWebsocketMatch,
    expiresAtMs,
    publicApproval: projectKisShadowFeedApprovalPublic(result),
    appKey,
    appSecret,
  }));
  return result;
}

import { normalizeTradingMode } from "./tradingLabPolicy.js";

export const TRADING_ENV_NAMES = Object.freeze({
  mode: "FINPLE_TRADING_MODE",
  killSwitch: "FINPLE_TRADING_KILL_SWITCH",
  allowedMarkets: "FINPLE_TRADING_ALLOWED_MARKETS",
  allowedAssetTypesByMarket: "FINPLE_TRADING_ALLOWED_ASSET_TYPES_BY_MARKET",
  allowedSymbols: "FINPLE_TRADING_ALLOWED_SYMBOLS",
  orderPermissionApprovedAt: "FINPLE_TRADING_ORDER_PERMISSION_APPROVED_AT",
  orderPermissionApprovedBy: "FINPLE_TRADING_ORDER_PERMISSION_APPROVED_BY",
  appKey: "KIS_TRADING_APP_KEY",
  appSecret: "KIS_TRADING_APP_SECRET",
  accountId: "KIS_TRADING_ACCOUNT_ID",
  baseUrl: "KIS_TRADING_BASE_URL",
});

const SECRET_ENV_NAMES = Object.freeze([
  TRADING_ENV_NAMES.appKey,
  TRADING_ENV_NAMES.appSecret,
  TRADING_ENV_NAMES.accountId,
]);

const TRUE_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off", "disabled"]);
const TOKEN_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const SYMBOL_PATTERN = /^[A-Z0-9._-]+$/;
const KIS_ACCOUNT_ID_PATTERN = /^\d{8}-\d{2}$/;

function clean(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function redactPresence(env = {}) {
  return Object.fromEntries(
    Object.values(TRADING_ENV_NAMES).map((name) => [
      name,
      {
        present: clean(env[name]).length > 0,
        valueStored: false,
        secret: SECRET_ENV_NAMES.includes(name),
      },
    ]),
  );
}

function parseBooleanFlag(value, defaultValue = true) {
  const raw = clean(value).toLowerCase();
  if (!raw) return { value: defaultValue, valid: false, reason: "missing_boolean_flag" };
  if (TRUE_VALUES.has(raw)) return { value: true, valid: true, reason: null };
  if (FALSE_VALUES.has(raw)) return { value: false, valid: true, reason: null };
  return { value: defaultValue, valid: false, reason: "invalid_boolean_flag" };
}

function parseList(value, options = {}) {
  const raw = clean(value);
  const allowWildcard = options.allowWildcard === true;
  if (!raw) return { values: [], wildcard: false, reasons: ["missing_list"] };
  if (allowWildcard && raw === "*") return { values: ["*"], wildcard: true, reasons: [] };

  const values = unique(
    raw
      .split(",")
      .map((part) => clean(part).toUpperCase())
      .filter(Boolean),
  );
  const pattern = options.symbols === true ? SYMBOL_PATTERN : TOKEN_PATTERN;
  const invalid = values.filter((part) => !pattern.test(part));

  return {
    values,
    wildcard: false,
    reasons: invalid.map((part) => `invalid_token_${part}`),
  };
}

function parseAllowedAssetTypesByMarket(value) {
  const raw = clean(value);
  if (!raw) return { value: {}, reasons: ["missing_allowed_asset_types_by_market"] };

  const entries = raw
    .split(";")
    .map((part) => clean(part))
    .filter(Boolean);
  const output = {};
  const reasons = [];

  for (const entry of entries) {
    const [marketRaw, assetTypesRaw, extra] = entry.split(":");
    const market = clean(marketRaw).toUpperCase();
    if (extra !== undefined || !market || !assetTypesRaw) {
      reasons.push(`invalid_asset_type_mapping_${entry}`);
      continue;
    }
    if (!TOKEN_PATTERN.test(market)) {
      reasons.push(`invalid_market_${market}`);
      continue;
    }
    const parsedTypes = parseList(assetTypesRaw);
    if (parsedTypes.reasons.length > 0 || parsedTypes.values.length === 0) {
      reasons.push(`invalid_asset_types_for_${market}`);
      continue;
    }
    output[market] = parsedTypes.values;
  }

  return {
    value: output,
    reasons: unique([
      ...reasons,
      entries.length === 0 ? "missing_allowed_asset_types_by_market" : null,
      Object.keys(output).length === 0 ? "no_valid_asset_type_mappings" : null,
    ]),
  };
}

function parseKisBaseUrl(value) {
  const raw = clean(value);
  if (!raw) return { valid: false, mode: "missing", host: "", reasons: ["missing_kis_trading_base_url"] };
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const virtual = host === "openapivts.koreainvestment.com";
    const production = host === "openapi.koreainvestment.com";
    return {
      valid: url.protocol === "https:" && (virtual || production),
      mode: virtual ? "virtual_trading" : production ? "production_trading" : "unknown",
      host,
      reasons: unique([
        url.protocol === "https:" ? null : "kis_trading_base_url_must_use_https",
        virtual || production ? null : "kis_trading_base_url_host_not_allowlisted",
      ]),
    };
  } catch {
    return { valid: false, mode: "invalid", host: "", reasons: ["invalid_kis_trading_base_url"] };
  }
}

function parseApprovalTimestamp(value) {
  const raw = clean(value);
  if (!raw) return { valid: false, normalized: "", reasons: ["missing_order_permission_approved_at"] };
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { valid: false, normalized: "", reasons: ["invalid_order_permission_approved_at"] };
  }
  return { valid: true, normalized: date.toISOString(), reasons: [] };
}

export function validateTradingEnvConfig(env = {}) {
  const modeRaw = clean(env[TRADING_ENV_NAMES.mode]);
  const mode = normalizeTradingMode(modeRaw);
  const modeKnown = modeRaw.length > 0 && mode === modeRaw.toLowerCase();
  const killSwitch = parseBooleanFlag(env[TRADING_ENV_NAMES.killSwitch], true);
  const allowedMarkets = parseList(env[TRADING_ENV_NAMES.allowedMarkets]);
  const allowedAssetTypesByMarket = parseAllowedAssetTypesByMarket(env[TRADING_ENV_NAMES.allowedAssetTypesByMarket]);
  const allowedSymbols = parseList(env[TRADING_ENV_NAMES.allowedSymbols], { allowWildcard: true, symbols: true });
  const accountId = clean(env[TRADING_ENV_NAMES.accountId]);
  const baseUrl = parseKisBaseUrl(env[TRADING_ENV_NAMES.baseUrl]);
  const approvedAt = parseApprovalTimestamp(env[TRADING_ENV_NAMES.orderPermissionApprovedAt]);
  const approvedBy = clean(env[TRADING_ENV_NAMES.orderPermissionApprovedBy]);

  const missingSecrets = [TRADING_ENV_NAMES.appKey, TRADING_ENV_NAMES.appSecret].filter((name) => !clean(env[name]));
  const allowedAssetMarkets = Object.keys(allowedAssetTypesByMarket.value);
  const assetMarketsMissingFromAllowedMarkets = allowedAssetMarkets.filter(
    (market) => !allowedMarkets.values.includes(market),
  );
  const allowedMarketsMissingAssetTypes = allowedMarkets.values.filter(
    (market) => !allowedAssetMarkets.includes(market),
  );
  const wildcardSymbols = allowedSymbols.wildcard;
  const shapeReasons = unique([
    modeRaw ? null : "missing_trading_mode",
    modeKnown ? null : "unknown_trading_mode_normalized_to_live_blocked",
    killSwitch.reason,
    ...allowedMarkets.reasons.map((reason) => `allowed_markets_${reason}`),
    ...allowedAssetTypesByMarket.reasons,
    ...allowedSymbols.reasons.map((reason) => `allowed_symbols_${reason}`),
    accountId ? null : "missing_kis_trading_account_id",
    accountId && !KIS_ACCOUNT_ID_PATTERN.test(accountId) ? "invalid_kis_trading_account_id_format" : null,
    ...baseUrl.reasons,
    ...approvedAt.reasons,
    approvedBy ? null : "missing_order_permission_approved_by",
    ...missingSecrets.map((name) => `missing_${name}`),
    ...assetMarketsMissingFromAllowedMarkets.map((market) => `asset_type_market_not_allowlisted_${market}`),
    ...allowedMarketsMissingAssetTypes.map((market) => `allowed_market_missing_asset_types_${market}`),
  ]);
  const warnings = unique([
    wildcardSymbols ? "wildcard_allowed_symbols_must_be_narrowed_before_live_guarded" : null,
    baseUrl.mode === "production_trading" ? "production_trading_base_url_requires_separate_live_review" : null,
    approvedAt.valid ? "order_permission_metadata_recorded_but_order_submission_still_blocked" : null,
  ]);
  const runtimeBlockers = unique([
    "runtime_integration_not_implemented",
    killSwitch.value === true ? "kill_switch_enabled" : null,
    mode !== "shadow" && mode !== "paper" ? "mode_not_shadow_or_paper" : null,
    mode === "shadow" && baseUrl.mode !== "virtual_trading" ? "shadow_mode_requires_virtual_trading_base_url_for_now" : null,
  ]);

  return {
    validShape: shapeReasons.length === 0,
    mode,
    currentState: {
      valuesStored: false,
      productionSecretsRequiredNow: false,
      readOnlyRuntimeIntegrationAllowed: false,
      adapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeActivationAllowed: false,
    },
    presence: redactPresence(env),
    normalized: {
      mode,
      killSwitchEnabled: killSwitch.value,
      allowedMarkets: allowedMarkets.values,
      allowedAssetTypesByMarket: allowedAssetTypesByMarket.value,
      allowedSymbols: allowedSymbols.values,
      wildcardAllowedSymbols: wildcardSymbols,
      kisTradingAccountIdFormatValid: KIS_ACCOUNT_ID_PATTERN.test(accountId),
      kisTradingBaseUrlMode: baseUrl.mode,
      kisTradingBaseUrlHost: baseUrl.host,
      orderPermissionApprovedAt: approvedAt.normalized,
      orderPermissionApprovedByPresent: Boolean(approvedBy),
    },
    shapeReasons,
    runtimeBlockers,
    warnings,
  };
}

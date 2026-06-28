export const TRADING_MODES = Object.freeze({
  paper: Object.freeze({
    mode: "paper",
    externalOrderCall: false,
    providerDataCall: false,
  }),
  shadow: Object.freeze({
    mode: "shadow",
    externalOrderCall: false,
    providerDataCall: "read_only_future_contract",
  }),
  live_guarded: Object.freeze({
    mode: "live_guarded",
    externalOrderCall: true,
    providerDataCall: true,
  }),
  live_blocked: Object.freeze({
    mode: "live_blocked",
    externalOrderCall: false,
    providerDataCall: false,
  }),
});

export const DEFAULT_TRADING_MODE = "live_blocked";

export const REQUIRED_RISK_LIMIT_KEYS = Object.freeze([
  "maxAccountCapitalAllocated",
  "maxCashDepletionPerDay",
  "maxSingleSymbolExposure",
  "maxSingleOrderNotional",
  "maxDailyTurnover",
  "maxOrderAttemptsPerDay",
  "maxConsecutiveFailedOrderAttempts",
  "maxSlippageTolerance",
  "allowedMarketSessions",
  "allowedSymbols",
  "blockedInstruments",
]);

function clean(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function toNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeList(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => clean(value).toUpperCase()).filter(Boolean);
}

export function normalizeTradingMode(mode) {
  const normalized = clean(mode).toLowerCase();
  return TRADING_MODES[normalized] ? normalized : DEFAULT_TRADING_MODE;
}

export function getTradingModePolicy(mode = DEFAULT_TRADING_MODE) {
  return TRADING_MODES[normalizeTradingMode(mode)];
}

export function validateRiskLimits(limits = {}) {
  const allowedMarketSessions = normalizeList(limits.allowedMarketSessions);
  const allowedSymbols = normalizeList(limits.allowedSymbols);
  const blockedInstruments = normalizeList(limits.blockedInstruments);
  const normalized = {
    maxAccountCapitalAllocated: toPositiveNumber(limits.maxAccountCapitalAllocated),
    maxCashDepletionPerDay: toNonNegativeNumber(limits.maxCashDepletionPerDay),
    maxSingleSymbolExposure: toPositiveNumber(limits.maxSingleSymbolExposure),
    maxSingleOrderNotional: toPositiveNumber(limits.maxSingleOrderNotional),
    maxDailyTurnover: toPositiveNumber(limits.maxDailyTurnover),
    maxOrderAttemptsPerDay: toPositiveNumber(limits.maxOrderAttemptsPerDay),
    maxConsecutiveFailedOrderAttempts: toPositiveNumber(limits.maxConsecutiveFailedOrderAttempts),
    maxSlippageTolerance: toNonNegativeNumber(limits.maxSlippageTolerance),
    allowedMarketSessions,
    allowedSymbols,
    blockedInstruments,
  };

  const missing = REQUIRED_RISK_LIMIT_KEYS.filter((key) => {
    const value = normalized[key];
    return Array.isArray(value) ? value.length === 0 : value === null;
  });
  const invalid = [
    normalized.maxSingleOrderNotional !== null &&
    normalized.maxAccountCapitalAllocated !== null &&
    normalized.maxSingleOrderNotional > normalized.maxAccountCapitalAllocated
      ? "maxSingleOrderNotional_exceeds_maxAccountCapitalAllocated"
      : null,
    normalized.maxCashDepletionPerDay !== null &&
    normalized.maxAccountCapitalAllocated !== null &&
    normalized.maxCashDepletionPerDay > normalized.maxAccountCapitalAllocated
      ? "maxCashDepletionPerDay_exceeds_maxAccountCapitalAllocated"
      : null,
    normalized.maxSlippageTolerance !== null && normalized.maxSlippageTolerance > 1
      ? "maxSlippageTolerance_must_be_decimal_fraction"
      : null,
  ];
  const reasons = unique([...missing.map((key) => `missing_${key}`), ...invalid]);

  return {
    valid: reasons.length === 0,
    reasons,
    limits: normalized,
  };
}

export function evaluateKillSwitch(state = {}) {
  const mode = normalizeTradingMode(state.mode);
  const reasons = unique([
    state.globalTradingDisabled !== false ? "global_trading_disabled" : null,
    mode !== "live_guarded" ? "mode_not_live_guarded" : null,
    state.dailyLossLimitBreached === true ? "daily_loss_limit_breached" : null,
    state.dailyOrderCountLimitBreached === true ? "daily_order_count_limit_breached" : null,
    state.symbolAllowlisted !== true ? "symbol_not_allowlisted" : null,
    state.quoteFresh !== true || state.fxFresh !== true ? "stale_quote_or_fx_input" : null,
    state.accountStateMatched !== true ? "account_balance_or_position_mismatch" : null,
    state.kisAuthOk !== true || state.kisRateLimited === true ? "kis_auth_failure_or_rate_limit" : null,
    state.strategyReviewed !== true ? "unreviewed_strategy_version" : null,
    state.auditLoggerReady !== true ? "missing_audit_logger" : null,
    state.manualOperatorStop !== false ? "manual_operator_stop" : null,
  ]);

  return {
    mode,
    blocked: reasons.length > 0,
    reasons,
    orderSubmissionAllowed: mode === "live_guarded" && reasons.length === 0,
  };
}

export function validateOrderIntent(intent = {}, limits = {}, state = {}) {
  const risk = validateRiskLimits(limits);
  const killSwitch = evaluateKillSwitch(state);
  const symbol = clean(intent.symbol).toUpperCase();
  const side = clean(intent.side).toLowerCase();
  const quantity = toPositiveNumber(intent.quantity);
  const estimatedPrice = toPositiveNumber(intent.estimatedPrice);
  const estimatedFxRate = toPositiveNumber(intent.estimatedFxRate ?? 1);
  const notional = quantity !== null && estimatedPrice !== null ? quantity * estimatedPrice * (estimatedFxRate ?? 1) : null;
  const allowedSymbols = risk.limits.allowedSymbols ?? [];
  const blockedInstruments = risk.limits.blockedInstruments ?? [];

  const reasons = unique([
    ...(risk.valid ? [] : risk.reasons.map((reason) => `risk_${reason}`)),
    ...(killSwitch.blocked ? killSwitch.reasons.map((reason) => `kill_switch_${reason}`) : []),
    symbol ? null : "missing_symbol",
    ["buy", "sell"].includes(side) ? null : "invalid_side",
    quantity === null ? "invalid_quantity" : null,
    estimatedPrice === null ? "invalid_estimatedPrice" : null,
    estimatedFxRate === null ? "invalid_estimatedFxRate" : null,
    allowedSymbols.length > 0 && !allowedSymbols.includes(symbol) ? "symbol_not_in_allowedSymbols" : null,
    blockedInstruments.includes(symbol) ? "symbol_in_blockedInstruments" : null,
    notional !== null &&
    risk.limits.maxSingleOrderNotional !== null &&
    notional > risk.limits.maxSingleOrderNotional
      ? "notional_exceeds_maxSingleOrderNotional"
      : null,
  ]);

  return {
    valid: reasons.length === 0,
    reasons,
    orderSubmissionAllowed: false,
    providerCallsAllowed: false,
    normalizedIntent: {
      symbol,
      side,
      quantity,
      estimatedPrice,
      estimatedFxRate,
      notional,
    },
    risk,
    killSwitch,
  };
}

import {
  TRADING_MODES,
  normalizeTradingMode,
  validateRiskLimits,
  evaluateKillSwitch,
} from "./tradingLabPolicy.js";

export const RISK_GATE_STATUSES = Object.freeze({
  blocked: "blocked",
  approvedForPaper: "approved_for_paper",
  approvedForShadow: "approved_for_shadow",
  liveReviewRequired: "live_review_required",
});

const MODE_ALLOWED_STATUSES = Object.freeze({
  paper: RISK_GATE_STATUSES.approvedForPaper,
  shadow: RISK_GATE_STATUSES.approvedForShadow,
  live_guarded: RISK_GATE_STATUSES.liveReviewRequired,
});

const NON_LIVE_KILL_SWITCH_EXEMPTIONS = Object.freeze([
  "mode_not_live_guarded",
  "kis_auth_failure_or_rate_limit",
]);

function clean(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPositiveNumber(value) {
  const number = toNumber(value);
  return number !== null && number > 0 ? number : null;
}

function toNonNegativeNumber(value) {
  const number = toNumber(value);
  return number !== null && number >= 0 ? number : null;
}

function normalizeList(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => clean(value).toUpperCase()).filter(Boolean);
}

function normalizeIntent(intent = {}) {
  const symbol = clean(intent.symbol).toUpperCase();
  const side = clean(intent.side).toLowerCase();
  const quantity = toPositiveNumber(intent.quantity);
  const estimatedPrice = toPositiveNumber(intent.estimatedPrice);
  const estimatedFxRate = toPositiveNumber(intent.estimatedFxRate ?? 1);
  const notional =
    quantity !== null && estimatedPrice !== null && estimatedFxRate !== null
      ? quantity * estimatedPrice * estimatedFxRate
      : null;

  return {
    symbol,
    side,
    quantity,
    estimatedPrice,
    estimatedFxRate,
    notional,
  };
}

function validateIntentShape(intent) {
  return unique([
    intent.symbol ? null : "missing_symbol",
    ["buy", "sell"].includes(intent.side) ? null : "invalid_side",
    intent.quantity === null ? "invalid_quantity" : null,
    intent.estimatedPrice === null ? "invalid_estimatedPrice" : null,
    intent.estimatedFxRate === null ? "invalid_estimatedFxRate" : null,
  ]);
}

function normalizeRuntime(runtime = {}) {
  return {
    mode: normalizeTradingMode(runtime.mode),
    rawMode: clean(runtime.mode).toLowerCase(),
    currentSession: clean(runtime.currentSession).toUpperCase(),
    dailyLossAmount: toNonNegativeNumber(runtime.dailyLossAmount),
    dailyCashDepletion: toNonNegativeNumber(runtime.dailyCashDepletion),
    dailyTurnover: toNonNegativeNumber(runtime.dailyTurnover),
    dailyOrderAttempts: toNonNegativeNumber(runtime.dailyOrderAttempts),
    consecutiveFailedOrderAttempts: toNonNegativeNumber(runtime.consecutiveFailedOrderAttempts),
    allocatedCapital: toNonNegativeNumber(runtime.allocatedCapital),
    currentSymbolExposure: toNonNegativeNumber(runtime.currentSymbolExposure),
    estimatedSlippage: toNonNegativeNumber(runtime.estimatedSlippage),
    killSwitchState: {
      mode: normalizeTradingMode(runtime.mode),
      globalTradingDisabled: runtime.globalTradingDisabled,
      dailyLossLimitBreached: runtime.dailyLossLimitBreached,
      dailyOrderCountLimitBreached: runtime.dailyOrderCountLimitBreached,
      symbolAllowlisted: runtime.symbolAllowlisted,
      quoteFresh: runtime.quoteFresh,
      fxFresh: runtime.fxFresh,
      accountStateMatched: runtime.accountStateMatched,
      kisAuthOk: runtime.kisAuthOk,
      kisRateLimited: runtime.kisRateLimited,
      strategyReviewed: runtime.strategyReviewed,
      auditLoggerReady: runtime.auditLoggerReady,
      manualOperatorStop: runtime.manualOperatorStop,
    },
  };
}

function runtimeMissingReasons(runtime) {
  return unique([
    runtime.currentSession ? null : "missing_currentSession",
    runtime.dailyLossAmount === null ? "missing_dailyLossAmount" : null,
    runtime.dailyCashDepletion === null ? "missing_dailyCashDepletion" : null,
    runtime.dailyTurnover === null ? "missing_dailyTurnover" : null,
    runtime.dailyOrderAttempts === null ? "missing_dailyOrderAttempts" : null,
    runtime.consecutiveFailedOrderAttempts === null ? "missing_consecutiveFailedOrderAttempts" : null,
    runtime.allocatedCapital === null ? "missing_allocatedCapital" : null,
    runtime.currentSymbolExposure === null ? "missing_currentSymbolExposure" : null,
    runtime.estimatedSlippage === null ? "missing_estimatedSlippage" : null,
  ]);
}

function evaluateRuntimeLimits(intent, riskLimits, runtime) {
  const allowedSessions = normalizeList(riskLimits.allowedMarketSessions);
  const buyNotional = intent.side === "buy" && intent.notional !== null ? intent.notional : 0;
  const projectedCashDepletion =
    runtime.dailyCashDepletion !== null && intent.notional !== null
      ? runtime.dailyCashDepletion + buyNotional
      : null;
  const projectedTurnover =
    runtime.dailyTurnover !== null && intent.notional !== null ? runtime.dailyTurnover + intent.notional : null;
  const projectedSymbolExposure =
    runtime.currentSymbolExposure !== null && intent.notional !== null
      ? intent.side === "sell"
        ? Math.max(0, runtime.currentSymbolExposure - intent.notional)
        : runtime.currentSymbolExposure + intent.notional
      : null;
  const projectedAllocatedCapital =
    runtime.allocatedCapital !== null && intent.notional !== null
      ? runtime.allocatedCapital + buyNotional
      : null;

  return unique([
    allowedSessions.length > 0 && runtime.currentSession && !allowedSessions.includes(runtime.currentSession)
      ? "session_not_allowed"
      : null,
    runtime.dailyLossAmount !== null &&
    riskLimits.maxCashDepletionPerDay !== null &&
    runtime.dailyLossAmount > riskLimits.maxCashDepletionPerDay
      ? "daily_loss_exceeds_maxCashDepletionPerDay"
      : null,
    projectedCashDepletion !== null &&
    riskLimits.maxCashDepletionPerDay !== null &&
    projectedCashDepletion > riskLimits.maxCashDepletionPerDay
      ? "cash_depletion_exceeds_maxCashDepletionPerDay"
      : null,
    projectedTurnover !== null &&
    riskLimits.maxDailyTurnover !== null &&
    projectedTurnover > riskLimits.maxDailyTurnover
      ? "turnover_exceeds_maxDailyTurnover"
      : null,
    runtime.dailyOrderAttempts !== null &&
    riskLimits.maxOrderAttemptsPerDay !== null &&
    runtime.dailyOrderAttempts >= riskLimits.maxOrderAttemptsPerDay
      ? "order_attempts_exceed_or_equal_maxOrderAttemptsPerDay"
      : null,
    runtime.consecutiveFailedOrderAttempts !== null &&
    riskLimits.maxConsecutiveFailedOrderAttempts !== null &&
    runtime.consecutiveFailedOrderAttempts >= riskLimits.maxConsecutiveFailedOrderAttempts
      ? "consecutive_failures_exceed_or_equal_maxConsecutiveFailedOrderAttempts"
      : null,
    projectedSymbolExposure !== null &&
    riskLimits.maxSingleSymbolExposure !== null &&
    projectedSymbolExposure > riskLimits.maxSingleSymbolExposure
      ? "symbol_exposure_exceeds_maxSingleSymbolExposure"
      : null,
    projectedAllocatedCapital !== null &&
    riskLimits.maxAccountCapitalAllocated !== null &&
    projectedAllocatedCapital > riskLimits.maxAccountCapitalAllocated
      ? "allocated_capital_exceeds_maxAccountCapitalAllocated"
      : null,
    runtime.estimatedSlippage !== null &&
    riskLimits.maxSlippageTolerance !== null &&
    runtime.estimatedSlippage > riskLimits.maxSlippageTolerance
      ? "slippage_exceeds_maxSlippageTolerance"
      : null,
  ]);
}

function selectKillSwitchReasons(mode, killSwitch) {
  if (mode === "live_guarded") return killSwitch.reasons;
  return killSwitch.reasons.filter((reason) => !NON_LIVE_KILL_SWITCH_EXEMPTIONS.includes(reason));
}

function selectStatus(mode, reasons) {
  if (reasons.length > 0) return RISK_GATE_STATUSES.blocked;
  return MODE_ALLOWED_STATUSES[mode] ?? RISK_GATE_STATUSES.blocked;
}

export function buildTradingRiskEvent(evaluation = {}, overrides = {}) {
  const blocked = evaluation.status === RISK_GATE_STATUSES.blocked;
  return {
    eventType: "trading_risk_gate",
    severity: blocked ? "block" : "info",
    status: evaluation.status ?? RISK_GATE_STATUSES.blocked,
    mode: evaluation.mode ?? "live_blocked",
    symbol: evaluation.normalizedIntent?.symbol ?? "",
    side: evaluation.normalizedIntent?.side ?? "",
    reasons: Array.isArray(evaluation.reasons) ? evaluation.reasons : [],
    orderSubmissionAllowed: false,
    providerCallsAllowed: false,
    ...overrides,
  };
}

export function evaluateTradingRiskGate(intentInput = {}, limitsInput = {}, runtimeInput = {}) {
  const normalizedIntent = normalizeIntent(intentInput);
  const runtime = normalizeRuntime(runtimeInput);
  const risk = validateRiskLimits(limitsInput);
  const killSwitch = evaluateKillSwitch(runtime.killSwitchState);
  const rawModeKnown = Boolean(TRADING_MODES[runtime.rawMode]);
  const killSwitchReasons = selectKillSwitchReasons(runtime.mode, killSwitch);
  const reasons = unique([
    rawModeKnown ? null : "unknown_mode_normalized_to_live_blocked",
    runtime.mode === "live_blocked" ? "mode_live_blocked" : null,
    ...validateIntentShape(normalizedIntent),
    ...(risk.valid ? [] : risk.reasons.map((reason) => `risk_${reason}`)),
    ...runtimeMissingReasons(runtime),
    ...killSwitchReasons.map((reason) => `kill_switch_${reason}`),
    ...evaluateRuntimeLimits(normalizedIntent, risk.limits, runtime),
    risk.limits.allowedSymbols.length > 0 && !risk.limits.allowedSymbols.includes(normalizedIntent.symbol)
      ? "symbol_not_in_allowedSymbols"
      : null,
    risk.limits.blockedInstruments.includes(normalizedIntent.symbol) ? "symbol_in_blockedInstruments" : null,
    normalizedIntent.notional !== null &&
    risk.limits.maxSingleOrderNotional !== null &&
    normalizedIntent.notional > risk.limits.maxSingleOrderNotional
      ? "notional_exceeds_maxSingleOrderNotional"
      : null,
  ]);
  const status = selectStatus(runtime.mode, reasons);
  const evaluation = {
    valid: reasons.length === 0,
    status,
    mode: runtime.mode,
    reasons,
    normalizedIntent,
    risk,
    killSwitch,
    runtime: {
      currentSession: runtime.currentSession,
      dailyLossAmount: runtime.dailyLossAmount,
      dailyCashDepletion: runtime.dailyCashDepletion,
      dailyTurnover: runtime.dailyTurnover,
      dailyOrderAttempts: runtime.dailyOrderAttempts,
      consecutiveFailedOrderAttempts: runtime.consecutiveFailedOrderAttempts,
      allocatedCapital: runtime.allocatedCapital,
      currentSymbolExposure: runtime.currentSymbolExposure,
      estimatedSlippage: runtime.estimatedSlippage,
    },
    intentPromotionAllowed: reasons.length === 0,
    paperFillAllowed: reasons.length === 0 && runtime.mode === "paper",
    shadowRecordAllowed: reasons.length === 0 && runtime.mode === "shadow",
    liveOrderIntentEligible: reasons.length === 0 && runtime.mode === "live_guarded",
    orderSubmissionAllowed: false,
    providerCallsAllowed: false,
  };

  return {
    ...evaluation,
    riskEvent: buildTradingRiskEvent(evaluation),
  };
}

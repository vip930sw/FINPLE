export const TRADING_SCALPING_PROMOTION_POLICY_VERSION = "trading-scalping-promotion-policy-v1";

export const DEFAULT_SCALPING_PROMOTION_POLICY = Object.freeze({
  minimumObservationSessions: 60,
  minimumCompletedTrades: 100,
  minimumPositiveRollingWindows: 2,
  rollingWindowSessions: 20,
  rollingWindowCount: 3,
  referenceTargetNetReturnPct: 3,
  minimumProfitFactor: 1.25,
  maximumDrawdownPct: 5,
  minimumFillRatePct: 70,
  maximumAverageSlippageBps: 5,
  maximumSingleDayPnlContributionPct: 35,
  maximumConsecutiveLosses: 8,
  minimumProfitableSymbols: 2,
  requirePositiveNetReturn: true,
});

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, digits = 4) {
  const number = finite(value);
  if (number === null) return null;
  const factor = 10 ** digits;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function normalizePolicy(input = {}) {
  const merged = { ...DEFAULT_SCALPING_PROMOTION_POLICY, ...input };
  return {
    minimumObservationSessions: Math.max(1, Math.floor(finite(merged.minimumObservationSessions) ?? 0)),
    minimumCompletedTrades: Math.max(1, Math.floor(finite(merged.minimumCompletedTrades) ?? 0)),
    minimumPositiveRollingWindows: Math.max(1, Math.floor(finite(merged.minimumPositiveRollingWindows) ?? 0)),
    rollingWindowSessions: Math.max(5, Math.floor(finite(merged.rollingWindowSessions) ?? 0)),
    rollingWindowCount: Math.max(1, Math.floor(finite(merged.rollingWindowCount) ?? 0)),
    referenceTargetNetReturnPct: Math.max(0, finite(merged.referenceTargetNetReturnPct) ?? 0),
    minimumProfitFactor: Math.max(0, finite(merged.minimumProfitFactor) ?? 0),
    maximumDrawdownPct: Math.max(0, finite(merged.maximumDrawdownPct) ?? 0),
    minimumFillRatePct: Math.max(0, finite(merged.minimumFillRatePct) ?? 0),
    maximumAverageSlippageBps: Math.max(0, finite(merged.maximumAverageSlippageBps) ?? 0),
    maximumSingleDayPnlContributionPct: Math.max(0, finite(merged.maximumSingleDayPnlContributionPct) ?? 0),
    maximumConsecutiveLosses: Math.max(0, Math.floor(finite(merged.maximumConsecutiveLosses) ?? 0)),
    minimumProfitableSymbols: Math.max(1, Math.floor(finite(merged.minimumProfitableSymbols) ?? 0)),
    requirePositiveNetReturn: merged.requirePositiveNetReturn !== false,
  };
}

function dailyContributionPct(dailyPnl = []) {
  const rows = Array.isArray(dailyPnl) ? dailyPnl : [];
  const positiveTotal = rows.reduce((sum, row) => sum + Math.max(0, finite(row?.pnl) ?? 0), 0);
  if (positiveTotal <= 0) return null;
  const maximum = rows.reduce((best, row) => Math.max(best, Math.max(0, finite(row?.pnl) ?? 0)), 0);
  return round(maximum / positiveTotal * 100, 4);
}

function positiveRollingWindows(rollingWindows = []) {
  return (Array.isArray(rollingWindows) ? rollingWindows : []).filter((window) => (finite(window?.netReturnPct) ?? 0) > 0).length;
}

function profitableSymbols(breakdown = {}) {
  return Object.values(breakdown || {}).filter((row) => (finite(row?.netPnl) ?? 0) > 0).length;
}

function gate(label, actual, target, comparator, blocking = true) {
  const unavailable = actual === null || actual === undefined || !Number.isFinite(Number(actual));
  if (unavailable) {
    return { label, actual: null, target, status: "insufficient_evidence", blocking };
  }
  const numeric = Number(actual);
  const met = comparator === "minimum"
    ? numeric >= target
    : comparator === "positive"
      ? numeric > 0
      : numeric <= target;
  return { label, actual: numeric, target, status: met ? "met" : "missed", blocking };
}

export function assessScalpingShadowPromotion(input = {}) {
  const policy = normalizePolicy(input.policy);
  const metrics = input.metrics || {};
  const rollingWindows = Array.isArray(input.rollingWindows) ? input.rollingWindows : [];
  const observationSessions = finite(input.observationSessions);
  const completedTrades = finite(metrics.trades ?? input.completedTrades);
  const netReturnPct = finite(metrics.totalReturnPct ?? input.netReturnPct);
  const profitFactor = finite(metrics.profitFactor);
  const maxDrawdownPct = finite(metrics.maxDrawdownPct);
  const fillRatePct = finite(metrics.fillRatePct);
  const averageSlippageBps = finite(metrics.averageSlippageBps);
  const maxConsecutiveLosses = finite(metrics.maxConsecutiveLosses);
  const rollingPositive = positiveRollingWindows(rollingWindows);
  const singleDayContribution = dailyContributionPct(input.dailyPnl);
  const profitableSymbolCount = profitableSymbols(input.breakdown?.bySymbol);

  const gates = [
    gate("관찰 거래일", observationSessions, policy.minimumObservationSessions, "minimum"),
    gate("완결 거래 수", completedTrades, policy.minimumCompletedTrades, "minimum"),
    gate("20일 rolling window 수", rollingWindows.length, policy.rollingWindowCount, "minimum"),
    gate("양수 20일 창", rollingPositive, policy.minimumPositiveRollingWindows, "minimum"),
    gate("Profit Factor", profitFactor, policy.minimumProfitFactor, "minimum"),
    gate("최대 낙폭", maxDrawdownPct, policy.maximumDrawdownPct, "maximum"),
    gate("체결률", fillRatePct, policy.minimumFillRatePct, "minimum"),
    gate("평균 슬리피지", averageSlippageBps, policy.maximumAverageSlippageBps, "maximum"),
    gate("단일일 수익기여도", singleDayContribution, policy.maximumSingleDayPnlContributionPct, "maximum"),
    gate("최대 연속손실", maxConsecutiveLosses, policy.maximumConsecutiveLosses, "maximum"),
    gate("수익 종목 수", profitableSymbolCount, policy.minimumProfitableSymbols, "minimum"),
    ...(policy.requirePositiveNetReturn ? [gate("누적 순수익률 양수", netReturnPct, 0, "positive")] : []),
    gate("20일 3% 상향 목표", netReturnPct, policy.referenceTargetNetReturnPct, "minimum", false),
  ];

  const insufficient = gates.some((item) => item.status === "insufficient_evidence" && item.blocking);
  const missed = gates.some((item) => item.status === "missed" && item.blocking);
  const status = insufficient ? "insufficient_evidence" : missed ? "blocked" : "shadow_candidate";

  return {
    version: TRADING_SCALPING_PROMOTION_POLICY_VERSION,
    status,
    policy,
    gates,
    summary: {
      met: gates.filter((item) => item.status === "met").length,
      missed: gates.filter((item) => item.status === "missed").length,
      insufficient: gates.filter((item) => item.status === "insufficient_evidence").length,
      blockingMissed: gates.filter((item) => item.status === "missed" && item.blocking).length,
      total: gates.length,
    },
    targetInterpretation: {
      referenceTargetNetReturnPct: policy.referenceTargetNetReturnPct,
      referenceTargetBlocking: false,
      meaning: "stretch_target_not_live_promotion_requirement",
    },
    automaticLiveActivationAllowed: false,
    manualReviewRequired: true,
  };
}

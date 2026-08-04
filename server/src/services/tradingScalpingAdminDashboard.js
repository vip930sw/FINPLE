import {
  DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG,
  DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE,
  LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
} from "./tradingLeveragedEtfScalpingStrategy.js";
import {
  DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
  LEVERAGED_ETF_PAIR_GROUPS,
  normalizeScalpingPortfolioConstraints,
  validateScalpingPortfolioConstraints,
} from "./tradingLeveragedEtfPortfolioCoordinator.js";

export const TRADING_SCALPING_ADMIN_DASHBOARD_VERSION = "trading-scalping-admin-dashboard-v2";
export const TRADING_SCALPING_DRAFT_VERSION = "leveraged-etf-scalping-admin-draft-v2";

const ALLOWED_SYMBOLS = new Set(DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE);

export const DEFAULT_SCALPING_RESEARCH_OBJECTIVES = Object.freeze({
  evaluationWindowSessions: 20,
  targetNetReturnPct: 3,
  maximumDrawdownPct: 8,
  minimumProfitFactor: 1.2,
  minimumFillRatePct: 70,
  maximumAverageSlippageBps: 5,
  minimumTrades: 30,
});

const EDITABLE_STRATEGY_KEYS = Object.freeze([
  "allowedSymbols",
  "minimumBars",
  "fastEmaPeriod",
  "slowEmaPeriod",
  "marketOpenBufferMinutes",
  "marketCloseBufferMinutes",
  "maxSpreadBps",
  "minMomentumBps",
  "minVolumeZScore",
  "minEntryProbability",
  "maxExitProbability",
  "minExpectedNetEdgeBps",
  "costSafetyMultiple",
  "commissionRoundTripBps",
  "slippageRoundTripBps",
  "minStopBps",
  "stopAtrMultiple",
  "trailingAtrMultiple",
  "takeProfitRiskMultiple",
  "maximumHoldBars",
  "riskPerTradeFraction",
  "maximumPositionFraction",
  "maximumOrderNotional",
  "requireModelSignal",
]);

const OBJECTIVE_KEYS = Object.freeze(Object.keys(DEFAULT_SCALPING_RESEARCH_OBJECTIVES));
const PORTFOLIO_CONSTRAINT_KEYS = Object.freeze(Object.keys(DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS));

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positive(value) {
  const number = finite(value);
  return number !== null && number > 0 ? number : null;
}

function nonNegative(value) {
  const number = finite(value);
  return number !== null && number >= 0 ? number : null;
}

function integer(value) {
  const number = finite(value);
  return number !== null && Number.isInteger(number) ? number : null;
}

function round(value, digits = 6) {
  const number = finite(value);
  if (number === null) return null;
  const factor = 10 ** digits;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function pick(source, keys) {
  return Object.fromEntries(keys.filter((key) => Object.prototype.hasOwnProperty.call(source, key)).map((key) => [key, source[key]]));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSymbols(value) {
  if (!Array.isArray(value)) return [];
  return unique(value.map((symbol) => clean(symbol).toUpperCase()).filter(Boolean));
}

function defaultStrategy() {
  return {
    ...pick(DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG, EDITABLE_STRATEGY_KEYS),
    allowedSymbols: [...DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE],
  };
}

function normalizeStrategy(input = {}) {
  const merged = { ...defaultStrategy(), ...pick(input, EDITABLE_STRATEGY_KEYS) };
  merged.allowedSymbols = normalizeSymbols(input.allowedSymbols ?? merged.allowedSymbols);
  merged.requireModelSignal = input.requireModelSignal === undefined
    ? Boolean(merged.requireModelSignal)
    : input.requireModelSignal === true;
  merged.maximumOrderNotional = input.maximumOrderNotional === null || input.maximumOrderNotional === ""
    ? null
    : positive(input.maximumOrderNotional);
  return merged;
}

function normalizeObjectives(input = {}) {
  const merged = { ...DEFAULT_SCALPING_RESEARCH_OBJECTIVES, ...pick(input, OBJECTIVE_KEYS) };
  return Object.fromEntries(OBJECTIVE_KEYS.map((key) => [key, finite(merged[key])]));
}

function normalizePortfolioConstraints(input = {}) {
  return normalizeScalpingPortfolioConstraints(pick(input, PORTFOLIO_CONSTRAINT_KEYS));
}

export function validateScalpingAdminDraft(input = {}) {
  const strategy = normalizeStrategy(input.strategy ?? input);
  const objectives = normalizeObjectives(input.objectives ?? {});
  const portfolioValidation = validateScalpingPortfolioConstraints(
    normalizePortfolioConstraints(input.portfolioConstraints ?? {}),
  );
  const portfolioConstraints = portfolioValidation.constraints;
  const unknownSymbols = strategy.allowedSymbols.filter((symbol) => !ALLOWED_SYMBOLS.has(symbol));
  const reasons = unique([
    strategy.allowedSymbols.length > 0 ? null : "allowed_symbols_required",
    ...unknownSymbols.map((symbol) => `unsupported_symbol_${symbol}`),
    integer(strategy.minimumBars) !== null && strategy.minimumBars >= 20 ? null : "minimum_bars_must_be_integer_at_least_20",
    integer(strategy.fastEmaPeriod) !== null && strategy.fastEmaPeriod > 0 ? null : "invalid_fast_ema_period",
    integer(strategy.slowEmaPeriod) !== null && strategy.slowEmaPeriod > 0 ? null : "invalid_slow_ema_period",
    integer(strategy.fastEmaPeriod) !== null && integer(strategy.slowEmaPeriod) !== null && strategy.fastEmaPeriod < strategy.slowEmaPeriod
      ? null
      : "fast_ema_must_be_below_slow_ema",
    nonNegative(strategy.marketOpenBufferMinutes) !== null ? null : "invalid_market_open_buffer",
    nonNegative(strategy.marketCloseBufferMinutes) !== null ? null : "invalid_market_close_buffer",
    positive(strategy.maxSpreadBps) !== null ? null : "invalid_max_spread_bps",
    finite(strategy.minVolumeZScore) !== null ? null : "invalid_min_volume_z_score",
    finite(strategy.minEntryProbability) !== null && strategy.minEntryProbability >= 0 && strategy.minEntryProbability <= 1
      ? null
      : "invalid_min_entry_probability",
    finite(strategy.maxExitProbability) !== null && strategy.maxExitProbability >= 0 && strategy.maxExitProbability <= 1
      ? null
      : "invalid_max_exit_probability",
    finite(strategy.minEntryProbability) !== null && finite(strategy.maxExitProbability) !== null && strategy.maxExitProbability < strategy.minEntryProbability
      ? null
      : "exit_probability_must_be_below_entry_probability",
    positive(strategy.minExpectedNetEdgeBps) !== null ? null : "invalid_min_expected_net_edge_bps",
    positive(strategy.costSafetyMultiple) !== null ? null : "invalid_cost_safety_multiple",
    nonNegative(strategy.commissionRoundTripBps) !== null ? null : "invalid_commission_round_trip_bps",
    nonNegative(strategy.slippageRoundTripBps) !== null ? null : "invalid_slippage_round_trip_bps",
    positive(strategy.minStopBps) !== null ? null : "invalid_min_stop_bps",
    positive(strategy.stopAtrMultiple) !== null ? null : "invalid_stop_atr_multiple",
    positive(strategy.trailingAtrMultiple) !== null ? null : "invalid_trailing_atr_multiple",
    positive(strategy.takeProfitRiskMultiple) !== null ? null : "invalid_take_profit_risk_multiple",
    integer(strategy.maximumHoldBars) !== null && strategy.maximumHoldBars > 0 ? null : "invalid_maximum_hold_bars",
    positive(strategy.riskPerTradeFraction) !== null && strategy.riskPerTradeFraction <= 0.1 ? null : "risk_per_trade_fraction_out_of_range",
    positive(strategy.maximumPositionFraction) !== null && strategy.maximumPositionFraction <= 1 ? null : "maximum_position_fraction_out_of_range",
    positive(strategy.riskPerTradeFraction) !== null && positive(strategy.maximumPositionFraction) !== null && strategy.riskPerTradeFraction <= strategy.maximumPositionFraction
      ? null
      : "risk_fraction_exceeds_position_fraction",
    strategy.maximumOrderNotional === null || positive(strategy.maximumOrderNotional) !== null ? null : "invalid_maximum_order_notional",
    integer(objectives.evaluationWindowSessions) !== null && objectives.evaluationWindowSessions >= 5 ? null : "evaluation_window_sessions_must_be_at_least_5",
    finite(objectives.targetNetReturnPct) !== null ? null : "invalid_target_net_return_pct",
    positive(objectives.maximumDrawdownPct) !== null && objectives.maximumDrawdownPct <= 100 ? null : "invalid_maximum_drawdown_pct",
    positive(objectives.minimumProfitFactor) !== null ? null : "invalid_minimum_profit_factor",
    finite(objectives.minimumFillRatePct) !== null && objectives.minimumFillRatePct >= 0 && objectives.minimumFillRatePct <= 100
      ? null
      : "invalid_minimum_fill_rate_pct",
    nonNegative(objectives.maximumAverageSlippageBps) !== null ? null : "invalid_maximum_average_slippage_bps",
    integer(objectives.minimumTrades) !== null && objectives.minimumTrades > 0 ? null : "invalid_minimum_trades",
    ...portfolioValidation.reasons,
    portfolioConstraints.maxConcurrentPositions <= strategy.allowedSymbols.length
      ? null
      : "max_concurrent_positions_exceeds_selected_symbols",
  ]);

  return {
    valid: reasons.length === 0,
    reasons,
    draft: {
      draftVersion: TRADING_SCALPING_DRAFT_VERSION,
      strategyVersion: LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
      strategy,
      objectives,
      portfolioConstraints,
    },
  };
}

function createInitialDraft() {
  const validation = validateScalpingAdminDraft({
    strategy: defaultStrategy(),
    objectives: DEFAULT_SCALPING_RESEARCH_OBJECTIVES,
    portfolioConstraints: DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
  });
  return {
    ...validation.draft,
    revision: 1,
    lifecycleStatus: "draft",
    updatedAt: null,
    updatedBy: "system_default",
  };
}

let draftState = createInitialDraft();
let performanceState = null;

export function readScalpingAdminDraft() {
  return clone(draftState);
}

export function replaceScalpingAdminDraftForRegistry(draft) {
  if (!draft) return readScalpingAdminDraft();
  const validation = validateScalpingAdminDraft(draft);
  if (!validation.valid) return readScalpingAdminDraft();
  draftState = {
    ...validation.draft,
    revision: integer(draft.revision) ?? draftState.revision,
    lifecycleStatus: clean(draft.lifecycleStatus) || "draft",
    updatedAt: draft.updatedAt || null,
    updatedBy: clean(draft.updatedBy) || "strategy_registry",
  };
  return readScalpingAdminDraft();
}

export function updateScalpingAdminDraft(input = {}, options = {}) {
  const expectedRevision = integer(input.expectedRevision);
  if (expectedRevision !== null && expectedRevision !== draftState.revision) {
    return {
      ok: false,
      statusCode: 409,
      code: "SCALPING_DRAFT_REVISION_CONFLICT",
      reasons: ["revision_conflict"],
      draft: readScalpingAdminDraft(),
    };
  }
  const validation = validateScalpingAdminDraft(input);
  if (!validation.valid) {
    return {
      ok: false,
      statusCode: 400,
      code: "INVALID_SCALPING_DRAFT",
      reasons: validation.reasons,
      draft: readScalpingAdminDraft(),
    };
  }
  draftState = {
    ...validation.draft,
    revision: draftState.revision + 1,
    lifecycleStatus: "draft",
    updatedAt: options.updatedAt || new Date().toISOString(),
    updatedBy: clean(options.updatedBy) || "admin_console",
  };
  return {
    ok: true,
    statusCode: 200,
    code: "SCALPING_DRAFT_UPDATED",
    reasons: [],
    draft: readScalpingAdminDraft(),
  };
}

export function resetScalpingAdminDraftForTest() {
  draftState = createInitialDraft();
  performanceState = null;
}

export function setScalpingPerformanceSnapshotForTest(snapshot) {
  performanceState = snapshot ? clone(snapshot) : null;
}

function deriveDrawdownCurve(equityCurve = []) {
  let peak = null;
  return equityCurve.map((point) => {
    const equity = positive(point?.equity);
    if (equity === null) return null;
    peak = peak === null ? equity : Math.max(peak, equity);
    return {
      timestamp: clean(point.timestamp),
      drawdownPct: round((equity / peak - 1) * 100, 4),
    };
  }).filter(Boolean);
}

function deriveDailyPnl(equityCurve = []) {
  const byDate = new Map();
  for (const point of equityCurve) {
    const date = clean(point?.timestamp).slice(0, 10);
    const equity = positive(point?.equity);
    if (!date || equity === null) continue;
    if (!byDate.has(date)) byDate.set(date, { date, first: equity, last: equity });
    else byDate.get(date).last = equity;
  }
  return [...byDate.values()].map((row) => ({
    date: row.date,
    pnl: round(row.last - row.first, 4),
    returnPct: row.first > 0 ? round((row.last / row.first - 1) * 100, 4) : null,
  }));
}

function objectiveComparison(label, target, actual, direction, unit) {
  if (actual === null || actual === undefined || !Number.isFinite(Number(actual))) {
    return { label, target, actual: null, unit, status: "unavailable" };
  }
  const numericActual = Number(actual);
  const met = direction === "minimum" ? numericActual >= target : numericActual <= target;
  return { label, target, actual: numericActual, unit, status: met ? "met" : "missed" };
}

function buildObjectiveComparisons(objectives, metrics) {
  if (!metrics) {
    return [
      objectiveComparison("순수익률", objectives.targetNetReturnPct, null, "minimum", "%"),
      objectiveComparison("최대 낙폭", objectives.maximumDrawdownPct, null, "maximum", "%"),
      objectiveComparison("Profit Factor", objectives.minimumProfitFactor, null, "minimum", ""),
      objectiveComparison("체결률", objectives.minimumFillRatePct, null, "minimum", "%"),
      objectiveComparison("평균 슬리피지", objectives.maximumAverageSlippageBps, null, "maximum", "bp"),
      objectiveComparison("완결 거래", objectives.minimumTrades, null, "minimum", "건"),
    ];
  }
  return [
    objectiveComparison("순수익률", objectives.targetNetReturnPct, round(metrics.totalReturn * 100, 4), "minimum", "%"),
    objectiveComparison("최대 낙폭", objectives.maximumDrawdownPct, round(Math.abs(metrics.maxDrawdown * 100), 4), "maximum", "%"),
    objectiveComparison("Profit Factor", objectives.minimumProfitFactor, finite(metrics.profitFactor), "minimum", ""),
    objectiveComparison("체결률", objectives.minimumFillRatePct, metrics.fillRate === null ? null : round(metrics.fillRate * 100, 4), "minimum", "%"),
    objectiveComparison("평균 슬리피지", objectives.maximumAverageSlippageBps, finite(metrics.averageSlippageBps), "maximum", "bp"),
    objectiveComparison("완결 거래", objectives.minimumTrades, finite(metrics.trades), "minimum", "건"),
  ];
}

function buildUnavailablePerformance(objectives) {
  return {
    status: "unavailable_no_persisted_replay_or_shadow_snapshot",
    mode: "none",
    asOf: null,
    sourceVersion: null,
    metrics: {
      initialEquity: null,
      endingEquity: null,
      netPnl: null,
      totalReturnPct: null,
      maxDrawdownPct: null,
      profitFactor: null,
      fillRatePct: null,
      averageSlippageBps: null,
      trades: null,
      wins: null,
      losses: null,
      totalFees: null,
      turnover: null,
    },
    objectiveComparisons: buildObjectiveComparisons(objectives, null),
    charts: {
      equityCurve: [],
      drawdownCurve: [],
      dailyPnl: [],
    },
    breakdown: { bySymbol: {}, byRegime: {}, byEntryHour: {} },
    latestTrades: [],
  };
}

export function buildScalpingPerformanceView(snapshot, objectives) {
  const result = snapshot?.result ?? snapshot;
  const metrics = result?.metrics;
  const ledger = result?.ledger;
  if (!result?.ok || !metrics || !ledger) return buildUnavailablePerformance(objectives);
  const equityCurve = Array.isArray(ledger.equityCurve)
    ? ledger.equityCurve.map((point) => ({
        timestamp: clean(point.timestamp),
        equity: finite(point.equity),
        cash: finite(point.cash),
      })).filter((point) => point.timestamp && point.equity !== null)
    : [];
  return {
    status: "ready_replay_snapshot",
    mode: clean(snapshot?.mode) || "replay",
    asOf: clean(snapshot?.asOf) || equityCurve.at(-1)?.timestamp || null,
    sourceVersion: clean(result.version) || null,
    metrics: {
      initialEquity: finite(metrics.initialEquity),
      endingEquity: finite(metrics.endingEquity),
      netPnl: finite(metrics.netPnl),
      totalReturnPct: metrics.totalReturn === null ? null : round(metrics.totalReturn * 100, 4),
      maxDrawdownPct: metrics.maxDrawdown === null ? null : round(Math.abs(metrics.maxDrawdown * 100), 4),
      profitFactor: finite(metrics.profitFactor),
      fillRatePct: metrics.fillRate === null ? null : round(metrics.fillRate * 100, 4),
      averageSlippageBps: finite(metrics.averageSlippageBps),
      trades: finite(metrics.trades),
      wins: finite(metrics.wins),
      losses: finite(metrics.losses),
      totalFees: finite(metrics.totalFees),
      turnover: finite(metrics.turnover),
    },
    objectiveComparisons: buildObjectiveComparisons(objectives, metrics),
    charts: {
      equityCurve,
      drawdownCurve: deriveDrawdownCurve(equityCurve),
      dailyPnl: deriveDailyPnl(equityCurve),
    },
    breakdown: clone(metrics.breakdown ?? { bySymbol: {}, byRegime: {}, byEntryHour: {} }),
    latestTrades: Array.isArray(ledger.trades) ? clone(ledger.trades.slice(-20).reverse()) : [],
  };
}

export function buildTradingScalpingAdminDashboard(options = {}) {
  const draft = options.draft ? clone(options.draft) : readScalpingAdminDraft();
  const snapshot = Object.prototype.hasOwnProperty.call(options, "performanceSnapshot")
    ? options.performanceSnapshot
    : performanceState;
  const performance = buildScalpingPerformanceView(snapshot, draft.objectives);
  const registry = options.registry ?? null;
  return {
    ok: true,
    dashboardVersion: TRADING_SCALPING_ADMIN_DASHBOARD_VERSION,
    checkedAt: options.checkedAt || new Date().toISOString(),
    title: "레버리지 ETF 스캘핑 전략",
    status: performance.status === "ready_replay_snapshot" ? "replay_snapshot_ready" : "strategy_draft_ready_performance_unavailable",
    draft,
    registry,
    multiAsset: {
      multiSelectSupported: true,
      selectedSymbolCount: draft.strategy.allowedSymbols.length,
      maximumSelectableSymbols: DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE.length,
      selectedSymbols: [...draft.strategy.allowedSymbols],
      pairGroups: clone(LEVERAGED_ETF_PAIR_GROUPS),
      evaluationMode: "independent_per_symbol_then_portfolio_coordination",
      simultaneousHoldingLimit: draft.portfolioConstraints.maxConcurrentPositions,
      maximumNewIntentsPerCycle: draft.portfolioConstraints.maximumNewIntentsPerCycle,
      opposingPairDefault: draft.portfolioConstraints.allowOpposingPairSimultaneously ? "explicitly_allowed" : "blocked",
    },
    performance,
    controls: {
      editableInAdminConsole: true,
      persistenceMode: registry?.status?.schemaReady ? "postgres_registry" : "process_memory_draft",
      survivesProcessRestart: Boolean(registry?.status?.schemaReady),
      appliesToTradingRuntime: false,
      activationRequiresSeparateApproval: true,
      objectiveMeaning: "research_acceptance_threshold_not_return_guarantee",
    },
    safety: {
      adminOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      liveActivationAllowed: false,
      databaseWriteUsed: Boolean(registry?.status?.schemaReady),
      publicUiExposed: false,
    },
  };
}

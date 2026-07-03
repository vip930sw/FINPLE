import { STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS } from "./tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js";

export const STEP131_ADMIN_TRADING_LAB_DASHBOARD_FLAGS = Object.freeze({
  ...STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP132_ADMIN_TRADING_LAB_VISUALIZATION_FLAGS = Object.freeze({
  ...STEP131_ADMIN_TRADING_LAB_DASHBOARD_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS = Object.freeze({
  ...STEP132_ADMIN_TRADING_LAB_VISUALIZATION_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS = Object.freeze({
  ...STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP135_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_FLAGS = Object.freeze({
  ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const TRADING_LAB_STRATEGY_CONFIG_SCHEMA = Object.freeze({
  strategyId: "string",
  strategyType: "admin_trading_lab_strategy_config",
  sourceStep: "step131",
  mode: "mock | dry_run | shadow",
  redaction: "metadata_only_no_private_values",
  flags: "all_false",
});

export const TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA = Object.freeze({
  strategyDraftId: "string",
  draftType: "admin_only_mock_strategy_config_draft",
  sourceStep: "step134",
  strategyName: "string",
  mode: "mock | dry_run | shadow",
  allowedSymbols: "placeholder_symbol[]",
  targetWeights: "target_weight_draft[]",
  rebalanceRule: "rebalance_rule_draft",
  riskLimits: "risk_limit_draft",
  status: "draft | blocked | mock_only | validation_required",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL = Object.freeze({
  symbol: "placeholder_symbol",
  weightPct: "number",
  status: "mock_only | validation_required",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL = Object.freeze({
  ruleId: "string",
  interval: "manual_review | weekly_mock | monthly_mock",
  thresholdPct: "number",
  status: "mock_only",
});

export const TRADING_LAB_RISK_LIMIT_DRAFT_MODEL = Object.freeze({
  maxOrderAmount: "number | placeholder",
  maxDailyLossPct: "number | placeholder",
  maxPositionWeightPct: "number | placeholder",
  killSwitchRequired: true,
  riskGateRequired: true,
  status: "blocked_by_default",
});

export const TRADING_LAB_STRATEGY_DRAFT_COMPARISON_SCHEMA = Object.freeze({
  comparisonId: "string",
  strategyDraftId: "string",
  sourceStep: "step135",
  baseStrategyName: "string",
  draftStrategyName: "string",
  changedSymbols: "placeholder_symbol[]",
  addedSymbols: "placeholder_symbol[]",
  removedSymbols: "placeholder_symbol[]",
  validationStatus: "blocked | validation_required | mock_only",
  reviewStatus: "blocked | validation_required | review_pending | mock_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_STRATEGY_DRAFT_CHANGE_HISTORY_MODEL = Object.freeze({
  changeId: "string",
  changedAt: "placeholder_timestamp",
  changedBy: "admin_placeholder",
  changeType: "target_weight | risk_limit | mode | allowed_symbols | rebalance_rule",
  status: "draft | validation_required | blocked | reviewed",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_RISK_IMPACT_PREVIEW_SCHEMA = Object.freeze({
  previewId: "string",
  sourceStep: "step135",
  dataSource: "mock_ledger_calculation_result",
  cumulativeReturnDeltaPct: "number",
  mddDeltaPct: "number",
  cashWeightDeltaPct: "number",
  maxPositionWeightDeltaPct: "number",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_SCHEMA = Object.freeze({
  reviewResultId: "string",
  sourceStep: "step135",
  status: "blocked | validation_required | review_pending | review_recorded | not_ready | mock_only",
  storageMode: "in_memory_placeholder_only",
  redacted: true,
});

export const TRADING_LAB_DAILY_RETURN_SERIES_SCHEMA = Object.freeze({
  seriesId: "string",
  seriesType: "mock_daily_return_series",
  sourceStep: "step131",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_CUMULATIVE_PERFORMANCE_SCHEMA = Object.freeze({
  performanceId: "string",
  performanceType: "mock_cumulative_performance",
  sourceStep: "step131",
  dataSource: "static_placeholder_only",
  rawProviderResponse: false,
});

export const TRADING_LAB_KPI_SUMMARY_CARD_SCHEMA = Object.freeze({
  cardId: "string",
  cardType: "mock_kpi_summary_card",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_EQUITY_VISUALIZATION_SCHEMA = Object.freeze({
  visualizationId: "string",
  visualizationType: "mock_daily_equity_line",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_RETURN_VISUALIZATION_SCHEMA = Object.freeze({
  visualizationId: "string",
  visualizationType: "mock_return_bar_series",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_ALLOCATION_VISUALIZATION_SCHEMA = Object.freeze({
  visualizationId: "string",
  visualizationType: "mock_allocation_table_bars",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  accountIdentifier: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_MOCK_LEDGER_SCHEMA = Object.freeze({
  ledgerId: "string",
  ledgerType: "admin_only_mock_trading_ledger",
  sourceStep: "step133",
  mode: "mock | dry_run | shadow",
  strategyId: "string",
  events: "mock_trade_event[]",
  positions: "mock_position_calculation[]",
  cash: "number",
  equitySeries: "mock_daily_equity_calculation[]",
  status: "mock_calculated_fail_closed",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_MOCK_TRADE_EVENT_SCHEMA = Object.freeze({
  eventId: "string",
  eventType: "admin_only_mock_trade_event",
  sourceStep: "step133",
  side: "buy | sell | hold",
  source: "mock_ledger",
  status: "mock_calculation_only",
  credential: false,
  accountIdentifier: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_POSITION_SNAPSHOT_SCHEMA = Object.freeze({
  snapshotId: "string",
  snapshotType: "mock_position_snapshot",
  sourceStep: "step131",
  accountIdentifier: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_ORDER_CANDIDATE_SUMMARY_SCHEMA = Object.freeze({
  summaryId: "string",
  summaryType: "mock_order_candidate_summary",
  sourceStep: "step131",
  orderSubmissionAllowed: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_AUDIT_LOG_SUMMARY_SCHEMA = Object.freeze({
  summaryId: "string",
  summaryType: "mock_audit_log_summary",
  sourceStep: "step131",
  storageMode: "static_in_memory_placeholder_only",
  rawProviderResponse: false,
});

function makeLabRedaction(overrides = {}) {
  return {
    schema: "step131_admin_trading_lab_dashboard_shell_v1",
    metadataOnly: true,
    containsCredential: false,
    containsAccountIdentifier: false,
    containsProviderPayload: false,
    containsOrderPayload: false,
    containsPrivatePath: false,
    containsRawReceipt: false,
    containsHashValue: false,
    containsDigestValue: false,
    containsRawProviderResponse: false,
    containsRawEnvValue: false,
    ...overrides,
  };
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMoney(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function roundPct(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 10_000) / 10_000;
}

function safeRatio(numerator, denominator) {
  const safeDenominator = toFiniteNumber(denominator);
  if (safeDenominator === 0) return 0;
  return toFiniteNumber(numerator) / safeDenominator;
}

function normalizeStrategyDraftMode(mode) {
  const normalized = String(mode || "mock").toLowerCase();
  return ["mock", "dry_run", "shadow"].includes(normalized) ? normalized : "blocked";
}

function normalizePlaceholderSymbols(symbols = []) {
  const input = Array.isArray(symbols) ? symbols : String(symbols || "").split(",");
  const normalized = input
    .map((symbol) => String(symbol || "").trim().toUpperCase())
    .filter(Boolean)
    .filter((symbol) => symbol !== "*" && symbol !== "ALL" && symbol !== "ALL_SYMBOLS");
  const unique = [...new Set(normalized)];
  return unique.length > 0
    ? unique
    : ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER", "SYMBOL_C_PLACEHOLDER"];
}

function normalizeTargetWeightDrafts(targetWeights = [], allowedSymbols = []) {
  const bySymbol = new Map(
    (Array.isArray(targetWeights) ? targetWeights : []).map((target) => [
      String(target?.symbol || "").trim().toUpperCase(),
      Math.max(0, toFiniteNumber(target?.weightPct)),
    ]),
  );
  return allowedSymbols.map((symbol, index) => ({
    targetWeightDraftId: `step134_target_weight_${index + 1}`,
    symbol,
    weightPct: roundPct(bySymbol.has(symbol) ? bySymbol.get(symbol) : 0),
    status: "mock_only",
    providerPayloadStored: false,
    orderPayloadStored: false,
  }));
}

function normalizeRiskLimitDraft(riskLimits = {}) {
  return {
    riskLimitDraftId: "step134_risk_limit_draft",
    maxOrderAmount: Math.max(0, toFiniteNumber(riskLimits.maxOrderAmount, 0)),
    maxDailyLossPct: Math.max(0, toFiniteNumber(riskLimits.maxDailyLossPct, 0)),
    maxPositionWeightPct: Math.max(0, toFiniteNumber(riskLimits.maxPositionWeightPct, 0)),
    killSwitchRequired: true,
    riskGateRequired: true,
    status: "blocked_by_default",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function normalizeRebalanceRuleDraft(rebalanceRule = {}) {
  const interval = String(rebalanceRule.interval || "manual_review").toLowerCase();
  const safeInterval = ["manual_review", "weekly_mock", "monthly_mock"].includes(interval) ? interval : "manual_review";
  return {
    rebalanceRuleDraftId: "step134_rebalance_rule_draft",
    interval: safeInterval,
    thresholdPct: Math.max(0, toFiniteNumber(rebalanceRule.thresholdPct, 5)),
    status: "mock_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function buildMockEventsFromStrategyDraft(strategyDraft = {}, options = {}) {
  const priceSeries = getMockPriceSeries(options);
  const firstDate = getPriceDates(priceSeries)[0] || "2026-07-01";
  const firstPrices = priceSeries[firstDate] || {};
  const initialCash = roundMoney(options.initialCash ?? 100000);
  const deployableCash = roundMoney(initialCash * 0.75);

  return (strategyDraft.targetWeights || [])
    .filter((target) => toFiniteNumber(target.weightPct) > 0)
    .map((target, index) => {
      const mockPrice = Math.max(1, toFiniteNumber(firstPrices[target.symbol], 1000));
      const allocationAmount = roundMoney(deployableCash * safeRatio(target.weightPct, 100));
      return normalizeMockTradeEvent(
        {
          eventId: `step134_mock_recalculation_event_${index + 1}`,
          date: firstDate,
          symbol: target.symbol,
          side: "buy",
          quantity: roundQuantity(allocationAmount / mockPrice),
          mockPrice,
          fee: 0,
          mode: strategyDraft.mode || "mock",
        },
        index,
      );
    });
}

function makeTargetWeightMap(targetWeights = []) {
  return new Map((Array.isArray(targetWeights) ? targetWeights : []).map((target) => [
    String(target?.symbol || "").trim().toUpperCase(),
    toFiniteNumber(target?.weightPct),
  ]));
}

function makeStrategyDraftBaseline(options = {}) {
  return buildTradingLabStrategyConfigDraft(
    {
      strategyDraftId: "step135_admin_trading_lab_strategy_baseline",
      strategyName: "Admin mock strategy baseline",
      mode: "mock",
      allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER", "SYMBOL_C_PLACEHOLDER"],
      targetWeights: [
        { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 45 },
        { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 30 },
        { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
      ],
      rebalanceRule: { interval: "manual_review", thresholdPct: 5 },
      riskLimits: { maxOrderAmount: 1000, maxDailyLossPct: 2, maxPositionWeightPct: 50 },
    },
    options,
  );
}

function buildStrategyDiffRows(baseDraft = {}, draft = {}) {
  const rows = [];
  const baseWeights = makeTargetWeightMap(baseDraft.targetWeights);
  const draftWeights = makeTargetWeightMap(draft.targetWeights);
  const symbols = [...new Set([...baseWeights.keys(), ...draftWeights.keys()])].sort();

  for (const symbol of symbols) {
    const beforeValue = roundPct(baseWeights.get(symbol) || 0);
    const afterValue = roundPct(draftWeights.get(symbol) || 0);
    const delta = roundPct(afterValue - beforeValue);
    if (delta !== 0) {
      rows.push({
        field: "target_weight",
        symbol,
        beforeValue,
        afterValue,
        deltaPctPoint: delta,
        summary: `${symbol} weight ${delta > 0 ? "+" : ""}${delta.toFixed(2)}pp`,
        status: "mock_only",
      });
    }
  }

  const compareField = (field, beforeValue, afterValue) => {
    if (String(beforeValue) !== String(afterValue)) {
      rows.push({
        field,
        beforeValue,
        afterValue,
        summary: `${field} changed from ${beforeValue} to ${afterValue}`,
        status: "mock_only",
      });
    }
  };

  compareField("mode", baseDraft.mode || "mock", draft.mode || "mock");
  compareField("rebalance_rule", baseDraft.rebalanceRule?.interval || "manual_review", draft.rebalanceRule?.interval || "manual_review");
  compareField("max_order_amount", baseDraft.riskLimits?.maxOrderAmount || 0, draft.riskLimits?.maxOrderAmount || 0);
  compareField("max_daily_loss_pct", baseDraft.riskLimits?.maxDailyLossPct || 0, draft.riskLimits?.maxDailyLossPct || 0);
  compareField("max_position_weight_pct", baseDraft.riskLimits?.maxPositionWeightPct || 0, draft.riskLimits?.maxPositionWeightPct || 0);

  return rows.length > 0
    ? rows
    : [{ field: "no_change", summary: "strategy draft has no mock comparison changes", status: "mock_only" }];
}

function classifyChangeType(field) {
  if (field === "target_weight") return "target_weight";
  if (field === "mode") return "mode";
  if (field === "rebalance_rule") return "rebalance_rule";
  if (field.includes("risk") || field.includes("loss") || field.includes("position") || field.includes("amount")) return "risk_limit";
  return "allowed_symbols";
}

function normalizeMockTradeEvent(event = {}, index = 0) {
  const side = String(event.side || "hold").toLowerCase();
  const quantity = Math.max(0, toFiniteNumber(event.quantity));
  const mockPrice = Math.max(0, toFiniteNumber(event.mockPrice));
  const fee = Math.max(0, toFiniteNumber(event.fee));
  const mockAmount = roundMoney(quantity * mockPrice + (side === "buy" ? fee : -fee));

  return {
    eventId: event.eventId || `step133_mock_trade_event_${index + 1}`,
    eventType: "admin_only_mock_trade_event",
    date: event.date || "2026-07-01",
    symbol: event.symbol || "SYMBOL_A_PLACEHOLDER",
    side: ["buy", "sell", "hold"].includes(side) ? side : "hold",
    quantity,
    mockPrice,
    mockAmount,
    fee,
    mode: event.mode || "mock",
    source: "mock_ledger",
    status: "mock_calculation_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_mock_trade_event_v1" }),
  };
}

function getMockPriceSeries(options = {}) {
  return options.priceSeries || {
    "2026-07-01": {
      SYMBOL_A_PLACEHOLDER: 1008,
      SYMBOL_B_PLACEHOLDER: 1492,
      SYMBOL_C_PLACEHOLDER: 900,
    },
    "2026-07-02": {
      SYMBOL_A_PLACEHOLDER: 1012,
      SYMBOL_B_PLACEHOLDER: 1488,
      SYMBOL_C_PLACEHOLDER: 902,
    },
    "2026-07-03": {
      SYMBOL_A_PLACEHOLDER: 1015,
      SYMBOL_B_PLACEHOLDER: 1505,
      SYMBOL_C_PLACEHOLDER: 904,
    },
  };
}

function getPriceDates(priceSeries = {}) {
  return Object.keys(priceSeries).sort((left, right) => left.localeCompare(right));
}

function applyMockEventToState(state, event) {
  if (!["buy", "sell"].includes(event.side) || event.quantity <= 0 || event.mockPrice <= 0) return state;
  const current = state.positions.get(event.symbol) || {
    symbol: event.symbol,
    quantity: 0,
    averagePrice: 0,
    realizedPnl: 0,
  };

  if (event.side === "buy") {
    const totalCost = roundMoney(event.quantity * event.mockPrice + event.fee);
    const nextQuantity = roundQuantity(current.quantity + event.quantity);
    const nextCostBasis = roundMoney(current.quantity * current.averagePrice + totalCost);
    state.cash = roundMoney(state.cash - totalCost);
    state.positions.set(event.symbol, {
      ...current,
      quantity: nextQuantity,
      averagePrice: nextQuantity > 0 ? roundMoney(nextCostBasis / nextQuantity) : 0,
    });
    return state;
  }

  const sellQuantity = Math.min(current.quantity, event.quantity);
  if (sellQuantity <= 0) return state;
  const proceeds = roundMoney(sellQuantity * event.mockPrice - event.fee);
  const realizedPnl = roundMoney(proceeds - sellQuantity * current.averagePrice);
  const nextQuantity = roundQuantity(current.quantity - sellQuantity);
  state.cash = roundMoney(state.cash + proceeds);
  if (nextQuantity === 0) {
    state.positions.delete(event.symbol);
  } else {
    state.positions.set(event.symbol, {
      ...current,
      quantity: nextQuantity,
      realizedPnl: roundMoney(current.realizedPnl + realizedPnl),
    });
  }
  return state;
}

function buildPositionRows(state, priceMap = {}) {
  const totalMarketValue = [...state.positions.values()].reduce((sum, position) => {
    const currentPrice = Math.max(0, toFiniteNumber(priceMap[position.symbol] || position.averagePrice));
    return roundMoney(sum + position.quantity * currentPrice);
  }, 0);
  const totalEquity = roundMoney(state.cash + totalMarketValue);

  return [...state.positions.values()]
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
    .map((position) => {
      const mockCurrentPrice = Math.max(0, toFiniteNumber(priceMap[position.symbol] || position.averagePrice));
      const marketValue = roundMoney(position.quantity * mockCurrentPrice);
      const unrealizedPnl = roundMoney(marketValue - position.quantity * position.averagePrice);
      return {
        symbol: position.symbol,
        name: `${position.symbol} mock position`,
        quantity: roundQuantity(position.quantity),
        averagePrice: roundMoney(position.averagePrice),
        mockCurrentPrice,
        marketValue,
        unrealizedPnl,
        realizedPnl: roundMoney(position.realizedPnl || 0),
        weightPct: roundPct(safeRatio(marketValue, totalEquity) * 100),
        status: "mock_calculated",
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
      };
    });
}

function calculateDailyEquityRows(inputLedger = {}, options = {}) {
  const events = Array.isArray(inputLedger.events)
    ? inputLedger.events.map(normalizeMockTradeEvent)
    : buildTradingLabMockTradeEvents(options).events;
  const priceSeries = getMockPriceSeries(options);
  const dates = getPriceDates(priceSeries);
  const initialCash = roundMoney(inputLedger.initialCash ?? options.initialCash ?? 100000);
  const state = {
    cash: initialCash,
    positions: new Map(),
  };
  const sortedEvents = events.sort((left, right) => left.date.localeCompare(right.date) || left.eventId.localeCompare(right.eventId));
  let appliedEventIndex = 0;
  let previousEquity = initialCash;
  let peakEquity = initialCash;

  return dates.map((date, index) => {
    while (appliedEventIndex < sortedEvents.length && sortedEvents[appliedEventIndex].date <= date) {
      applyMockEventToState(state, sortedEvents[appliedEventIndex]);
      appliedEventIndex += 1;
    }
    const priceMap = priceSeries[date] || {};
    const positions = buildPositionRows(state, priceMap);
    const positionsMarketValue = roundMoney(positions.reduce((sum, position) => sum + position.marketValue, 0));
    const equity = roundMoney(state.cash + positionsMarketValue);
    const dailyReturnPct = index === 0
      ? roundPct((safeRatio(equity, initialCash) - 1) * 100)
      : roundPct((safeRatio(equity, previousEquity) - 1) * 100);
    peakEquity = Math.max(peakEquity, equity);
    const row = {
      date,
      cash: roundMoney(state.cash),
      positionsMarketValue,
      equity,
      equityPlaceholder: equity,
      dailyReturnPct,
      cumulativeReturnPct: roundPct((safeRatio(equity, initialCash) - 1) * 100),
      drawdownPct: roundPct((safeRatio(equity, peakEquity) - 1) * 100),
      benchmarkReturnPct: 0,
      positionCount: positions.length,
      status: "mock_calculated",
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
    };
    previousEquity = equity;
    return row;
  });
}

export function buildTradingLabMockTradeEvents(options = {}) {
  const events = options.events || [
    { eventId: "step133_mock_trade_event_1", date: "2026-07-01", symbol: "SYMBOL_A_PLACEHOLDER", side: "buy", quantity: 12, mockPrice: 1000, fee: 12, mode: "mock" },
    { eventId: "step133_mock_trade_event_2", date: "2026-07-01", symbol: "SYMBOL_B_PLACEHOLDER", side: "buy", quantity: 8, mockPrice: 1500, fee: 12, mode: "dry_run" },
    { eventId: "step133_mock_trade_event_3", date: "2026-07-02", symbol: "SYMBOL_A_PLACEHOLDER", side: "hold", quantity: 0, mockPrice: 1012, fee: 0, mode: "shadow" },
    { eventId: "step133_mock_trade_event_4", date: "2026-07-03", symbol: "SYMBOL_C_PLACEHOLDER", side: "buy", quantity: 5, mockPrice: 900, fee: 8, mode: "mock" },
  ];

  return {
    summaryId: options.summaryId || "step133_mock_trade_event_summary",
    summaryType: "admin_only_mock_trade_events",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_input",
    events: events.map(normalizeMockTradeEvent),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_mock_trade_events_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabPositionLedger(ledger = {}, options = {}) {
  const events = Array.isArray(ledger.events)
    ? ledger.events.map(normalizeMockTradeEvent)
    : buildTradingLabMockTradeEvents(options).events;
  const priceSeries = getMockPriceSeries(options);
  const latestDate = getPriceDates(priceSeries).at(-1);
  const state = {
    cash: roundMoney(ledger.initialCash ?? options.initialCash ?? 100000),
    positions: new Map(),
  };

  for (const event of events.sort((left, right) => left.date.localeCompare(right.date) || left.eventId.localeCompare(right.eventId))) {
    applyMockEventToState(state, event);
  }

  const positions = buildPositionRows(state, priceSeries[latestDate] || {});
  const totalMarketValue = roundMoney(positions.reduce((sum, position) => sum + position.marketValue, 0));
  return {
    calculationId: options.calculationId || "step133_mock_position_ledger_calculation",
    calculationType: "mock_position_ledger_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    asOfDate: latestDate,
    cash: roundMoney(state.cash),
    positions,
    totalMarketValue,
    totalEquity: roundMoney(state.cash + totalMarketValue),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_position_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabDailyEquitySeries(ledger = {}, options = {}) {
  const rows = calculateDailyEquityRows(ledger, options);
  return {
    seriesId: options.seriesId || "step133_mock_daily_equity_calculation",
    seriesType: "mock_daily_equity_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    rows,
    finalCash: rows.at(-1)?.cash ?? roundMoney(ledger.initialCash ?? options.initialCash ?? 100000),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_daily_equity_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabDailyReturnSeries(ledger = {}, options = {}) {
  const dailyEquity = options.dailyEquity || calculateTradingLabDailyEquitySeries(ledger, options);
  return {
    seriesId: options.seriesId || "step133_mock_daily_return_calculation",
    seriesType: "mock_daily_return_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    rows: dailyEquity.rows.map((row) => ({
      date: row.date,
      dailyReturnPct: row.dailyReturnPct,
      cumulativeReturnPct: row.cumulativeReturnPct,
      drawdownPct: row.drawdownPct,
      equity: row.equity,
      equityPlaceholder: row.equity,
      benchmarkReturnPct: row.benchmarkReturnPct,
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_daily_return_calculation_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function calculateTradingLabCumulativeReturnSeries(ledger = {}, options = {}) {
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(ledger, options);
  return {
    seriesId: options.seriesId || "step133_mock_cumulative_return_calculation",
    seriesType: "mock_cumulative_return_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    rows: dailyReturns.rows.map((row) => ({
      date: row.date,
      cumulativeReturnPct: row.cumulativeReturnPct,
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_cumulative_return_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function calculateTradingLabDrawdownSummary(ledger = {}, options = {}) {
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(ledger, options);
  const rows = dailyReturns.rows;
  const mddPct = rows.reduce((min, row) => Math.min(min, toFiniteNumber(row.drawdownPct)), 0);
  const trough = rows.find((row) => row.drawdownPct === mddPct) || rows.at(-1) || null;
  return {
    summaryId: options.summaryId || "step133_mock_drawdown_mdd_calculation",
    summaryType: "mock_drawdown_mdd_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    mddPct: roundPct(mddPct),
    troughDate: trough?.date || null,
    rows: rows.map((row) => ({ date: row.date, drawdownPct: row.drawdownPct })),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_drawdown_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function calculateTradingLabAllocationSummary(positionLedger = calculateTradingLabPositionLedger(), options = {}) {
  const positionWeightTotalPct = roundPct(positionLedger.positions.reduce((sum, position) => sum + toFiniteNumber(position.weightPct), 0));
  const residualCashWeightPct = roundPct(Math.max(0, 100 - positionWeightTotalPct));
  return {
    summaryId: options.summaryId || "step133_mock_allocation_calculation",
    summaryType: "mock_allocation_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    allocations: [
      ...positionLedger.positions.map((position) => ({
        symbol: position.symbol,
        name: position.name,
        marketValue: position.marketValue,
        weightPct: position.weightPct,
        unrealizedPnl: position.unrealizedPnl,
        status: "mock_calculated",
      })),
      ...(residualCashWeightPct > 0 ? [{
        symbol: "CASH_PLACEHOLDER",
        name: "Mock cash residual",
        marketValue: roundMoney(positionLedger.cash),
        weightPct: residualCashWeightPct,
        unrealizedPnl: 0,
        status: "mock_calculated_residual",
      }] : []),
    ],
    positionWeightTotalPct,
    residualCashWeightPct,
    totalWeightPct: roundPct(positionWeightTotalPct + residualCashWeightPct),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_allocation_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabPerformanceSummary(ledger = {}, options = {}) {
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(ledger, options);
  const rows = dailyReturns.rows;
  const latest = rows.at(-1) || {};
  const gains = rows.filter((row) => row.dailyReturnPct > 0).map((row) => row.dailyReturnPct);
  const losses = rows.filter((row) => row.dailyReturnPct < 0).map((row) => Math.abs(row.dailyReturnPct));
  const averageReturn = safeRatio(rows.reduce((sum, row) => sum + toFiniteNumber(row.dailyReturnPct), 0), rows.length || 1);
  const variance = safeRatio(
    rows.reduce((sum, row) => sum + (toFiniteNumber(row.dailyReturnPct) - averageReturn) ** 2, 0),
    rows.length || 1,
  );
  const mddSummary = calculateTradingLabDrawdownSummary(ledger, { ...options, dailyReturns });
  const profitFactor = losses.length > 0
    ? roundPct(gains.reduce((sum, value) => sum + value, 0) / losses.reduce((sum, value) => sum + value, 0))
    : 0;

  return {
    performanceId: options.performanceId || "step133_mock_performance_summary_calculation",
    performanceType: "mock_performance_summary_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    status: "mock_calculated",
    totalReturnPct: roundPct(latest.cumulativeReturnPct || 0),
    cumulativeReturnPct: roundPct(latest.cumulativeReturnPct || 0),
    periodReturnPct: roundPct(latest.cumulativeReturnPct || 0),
    dailyReturnLatestPct: roundPct(latest.dailyReturnPct || 0),
    mddPct: mddSummary.mddPct,
    volatilityPct: roundPct(Math.sqrt(variance)),
    winRatePct: roundPct(safeRatio(gains.length, rows.length || 1) * 100),
    profitFactor,
    profitLossRatio: profitFactor,
    profitFactorStatus: "mock_calculated_placeholder",
    periodStart: rows[0]?.date || null,
    periodEnd: latest.date || null,
    benchmarkStatus: "mock_static_placeholder",
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_performance_calculation_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockLedger(options = {}) {
  const events = buildTradingLabMockTradeEvents(options).events;
  const ledger = {
    ledgerId: options.ledgerId || "step133_admin_only_mock_trading_ledger",
    ledgerType: "admin_only_mock_trading_ledger",
    sourceStep: "step133",
    mode: options.mode || "mock",
    strategyId: options.strategyId || "step131_admin_trading_lab_strategy_placeholder",
    createdAt: options.createdAt || "2026-07-03T00:00:00.000Z",
    initialCash: roundMoney(options.initialCash ?? 100000),
    events,
    status: "mock_calculated_fail_closed",
  };
  const positionLedger = calculateTradingLabPositionLedger(ledger, options);
  const dailyEquity = calculateTradingLabDailyEquitySeries(ledger, options);

  return {
    ...ledger,
    cash: dailyEquity.finalCash,
    positions: positionLedger.positions,
    equitySeries: dailyEquity.rows,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_mock_ledger_v1" }),
    flags: { ...STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function buildTradingLabStrategyConfigDraft(input = {}, options = {}) {
  const allowedSymbols = normalizePlaceholderSymbols(input.allowedSymbols || options.allowedSymbols);
  const mode = normalizeStrategyDraftMode(input.mode || options.mode);
  const targetWeights = normalizeTargetWeightDrafts(
    input.targetWeights || options.targetWeights || [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    allowedSymbols,
  );
  const targetWeightTotalPct = roundPct(targetWeights.reduce((sum, target) => sum + toFiniteNumber(target.weightPct), 0));
  const residualWeightPct = roundPct(100 - targetWeightTotalPct);
  const riskLimits = normalizeRiskLimitDraft(input.riskLimits || options.riskLimits);
  const rebalanceRule = normalizeRebalanceRuleDraft(input.rebalanceRule || options.rebalanceRule);
  const initialStatus = mode === "blocked" ? "blocked" : Math.abs(residualWeightPct) <= 0.01 ? "mock_only" : "validation_required";

  return {
    strategyDraftId: input.strategyDraftId || options.strategyDraftId || "step134_admin_trading_lab_strategy_draft",
    draftType: "admin_only_mock_strategy_config_draft",
    sourceStep: "step134",
    strategyName: input.strategyName || options.strategyName || "Admin mock strategy draft",
    mode,
    allowedModes: ["mock", "dry_run", "shadow"],
    allowedSymbols,
    allowedSymbolsStatus: allowedSymbols.length > 0 ? "placeholder_only" : "blocked",
    targetWeights,
    targetWeightTotalPct,
    residualWeightPct,
    rebalanceRule,
    entryRulePlaceholder: input.entryRulePlaceholder || "mock_entry_rule_placeholder_only",
    exitRulePlaceholder: input.exitRulePlaceholder || "mock_exit_rule_placeholder_only",
    riskLimits,
    maxOrderAmount: riskLimits.maxOrderAmount,
    maxDailyLossPct: riskLimits.maxDailyLossPct,
    maxPositionWeightPct: riskLimits.maxPositionWeightPct,
    killSwitchRequired: true,
    riskGateRequired: true,
    status: initialStatus,
    createdAt: input.createdAt || "2026-07-04T00:00:00.000Z",
    updatedAtPlaceholder: "in_memory_preview_only",
    storageMode: "admin_only_in_memory_placeholder",
    redaction: makeLabRedaction({ schema: "step134_admin_trading_lab_strategy_draft_v1" }),
    flags: { ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function validateTradingLabStrategyConfigDraft(draft = {}) {
  const targetWeightTotalPct = roundPct(
    (draft.targetWeights || []).reduce((sum, target) => sum + toFiniteNumber(target.weightPct), 0),
  );
  const residualWeightPct = roundPct(100 - targetWeightTotalPct);
  const blockers = [];
  const warnings = [];
  const mode = normalizeStrategyDraftMode(draft.mode);
  const allowedSymbols = normalizePlaceholderSymbols(draft.allowedSymbols);

  if (mode === "blocked") blockers.push("unsupported_or_live_strategy_mode");
  if (String(draft.mode || "").match(/live|real|production|order_submit|submit_order/i)) {
    blockers.push("live_or_order_submission_mode_rejected");
  }
  if ((draft.allowedSymbols || []).some((symbol) => ["*", "ALL", "ALL_SYMBOLS"].includes(String(symbol || "").toUpperCase()))) {
    blockers.push("wildcard_all_symbols_rejected");
  }
  if (allowedSymbols.length === 0) blockers.push("allowed_symbols_missing");
  if (Math.abs(residualWeightPct) > 0.01) warnings.push("target_weight_residual_review_required");
  if (toFiniteNumber(draft.riskLimits?.maxOrderAmount, 0) <= 0) warnings.push("max_order_amount_placeholder_only");
  if (toFiniteNumber(draft.riskLimits?.maxDailyLossPct, 0) <= 0) warnings.push("max_daily_loss_placeholder_only");
  if (toFiniteNumber(draft.riskLimits?.maxPositionWeightPct, 0) <= 0) warnings.push("max_position_weight_placeholder_only");

  const status = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "mock_only";
  return {
    validationId: "step134_strategy_draft_validation",
    sourceStep: "step134",
    status,
    targetWeightTotalPct,
    residualWeightPct,
    blockers,
    warnings,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readinessPromoted: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step134_admin_trading_lab_strategy_draft_validation_v1" }),
  };
}

export function buildTradingLabMockRecalculationBoundary(strategyDraft = buildTradingLabStrategyConfigDraft(), options = {}) {
  const validation = options.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const events = validation.status === "blocked" ? [] : buildMockEventsFromStrategyDraft(strategyDraft, options);
  const mockLedger = buildTradingLabMockLedger({
    ...options,
    mode: strategyDraft.mode,
    strategyId: strategyDraft.strategyDraftId,
    events,
  });
  const dailyReturns = calculateTradingLabDailyReturnSeries(mockLedger);
  const performance = calculateTradingLabPerformanceSummary(mockLedger, { dailyReturns });

  return {
    boundaryId: "step134_mock_recalculation_boundary",
    sourceStep: "step134",
    status: validation.status === "blocked" ? "blocked" : "mock_recalculated",
    calculationMode: "strategy_draft_mock_recalculation_admin_only",
    strategyDraftId: strategyDraft.strategyDraftId,
    reflectedFields: ["targetWeights", "mode", "allowedSymbols", "riskLimits"],
    mockLedger,
    dailyReturns,
    performance,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step134_admin_trading_lab_mock_recalculation_boundary_v1" }),
  };
}

export function buildAdminTradingLabStrategyDraftStatus(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRecalculationBoundary = input.mockRecalculationBoundary || buildTradingLabMockRecalculationBoundary(
    strategyDraft,
    { ...options, validation },
  );

  return {
    ok: true,
    step: "Step 134: Admin trading lab strategy config draft controls",
    status: "admin_only_strategy_draft_controls_fail_closed",
    strategyDraftSchema: TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA,
    targetWeightDraftModel: TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL,
    rebalanceRuleDraftModel: TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL,
    riskLimitDraftModel: TRADING_LAB_RISK_LIMIT_DRAFT_MODEL,
    strategyDraft,
    validation,
    mockRecalculationBoundary,
    flags: { ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      rawProviderResponseExposed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function buildTradingLabStrategyDraftComparison(input = {}, options = {}) {
  const baseStrategyDraft = input.baseStrategyDraft || makeStrategyDraftBaseline(options);
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const diffRows = buildStrategyDiffRows(baseStrategyDraft, strategyDraft);
  const baseSymbols = normalizePlaceholderSymbols(baseStrategyDraft.allowedSymbols);
  const draftSymbols = normalizePlaceholderSymbols(strategyDraft.allowedSymbols);
  const changedSymbols = [...new Set(diffRows.filter((row) => row.symbol).map((row) => row.symbol))].sort();
  const addedSymbols = draftSymbols.filter((symbol) => !baseSymbols.includes(symbol));
  const removedSymbols = baseSymbols.filter((symbol) => !draftSymbols.includes(symbol));
  const reviewStatus = validation.status === "blocked"
    ? "blocked"
    : validation.status === "validation_required"
      ? "validation_required"
      : "review_pending";

  return {
    comparisonId: "step135_strategy_draft_comparison",
    comparisonType: "admin_only_strategy_draft_before_after_comparison",
    sourceStep: "step135",
    strategyDraftId: strategyDraft.strategyDraftId,
    baseStrategyName: baseStrategyDraft.strategyName,
    draftStrategyName: strategyDraft.strategyName,
    modeBefore: baseStrategyDraft.mode,
    modeAfter: strategyDraft.mode,
    targetWeightsBefore: baseStrategyDraft.targetWeights,
    targetWeightsAfter: strategyDraft.targetWeights,
    changedSymbols,
    addedSymbols,
    removedSymbols,
    rebalanceRuleBefore: baseStrategyDraft.rebalanceRule,
    rebalanceRuleAfter: strategyDraft.rebalanceRule,
    riskLimitBefore: baseStrategyDraft.riskLimits,
    riskLimitAfter: strategyDraft.riskLimits,
    diffRows,
    validationStatus: validation.status,
    reviewStatus,
    createdAt: "2026-07-04T00:00:00.000Z",
    redaction: makeLabRedaction({ schema: "step135_strategy_draft_comparison_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function buildTradingLabStrategyDraftChangeHistory(comparison = buildTradingLabStrategyDraftComparison()) {
  const changes = (comparison.diffRows || []).map((row, index) => ({
    changeId: `step135_strategy_draft_change_${index + 1}`,
    changedAt: "2026-07-04T00:00:00.000Z",
    changedBy: "admin_placeholder",
    changeType: classifyChangeType(row.field || "target_weight"),
    summary: row.summary || "mock strategy draft comparison change",
    status: comparison.reviewStatus === "blocked" ? "blocked" : "draft",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  }));

  return {
    historyId: "step135_strategy_draft_change_history",
    sourceStep: "step135",
    storageMode: "static_in_memory_placeholder_only",
    changes,
    redaction: makeLabRedaction({ schema: "step135_strategy_draft_change_history_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    rawProviderResponseStored: false,
  };
}

export function buildTradingLabStrategyRiskImpactPreview(input = {}, options = {}) {
  const baseStrategyDraft = input.baseStrategyDraft || makeStrategyDraftBaseline(options);
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const baseBoundary = buildTradingLabMockRecalculationBoundary(baseStrategyDraft, options);
  const draftBoundary = buildTradingLabMockRecalculationBoundary(strategyDraft, options);
  const baseAllocation = calculateTradingLabAllocationSummary(calculateTradingLabPositionLedger(baseBoundary.mockLedger), options);
  const draftAllocation = calculateTradingLabAllocationSummary(calculateTradingLabPositionLedger(draftBoundary.mockLedger), options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);

  return {
    previewId: "step135_strategy_risk_impact_preview",
    sourceStep: "step135",
    dataSource: "mock_ledger_calculation_result",
    status: validation.status === "blocked" ? "blocked" : "mock_only",
    cumulativeReturnDeltaPct: roundPct((draftBoundary.performance?.cumulativeReturnPct || 0) - (baseBoundary.performance?.cumulativeReturnPct || 0)),
    mddDeltaPct: roundPct((draftBoundary.performance?.mddPct || 0) - (baseBoundary.performance?.mddPct || 0)),
    cashWeightDeltaPct: roundPct((draftAllocation.residualCashWeightPct || 0) - (baseAllocation.residualCashWeightPct || 0)),
    maxPositionWeightDeltaPct: roundPct(
      Math.max(...(draftAllocation.allocations || []).map((item) => item.weightPct || 0), 0)
        - Math.max(...(baseAllocation.allocations || []).map((item) => item.weightPct || 0), 0),
    ),
    validationStatus: validation.status,
    riskStatus: validation.status === "blocked" ? "blocked" : "review_pending",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step135_strategy_risk_impact_preview_v1" }),
  };
}

export function buildTradingLabStrategyDraftReviewGate(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const blockers = [...(validation.blockers || [])];
  const warnings = [...(validation.warnings || [])];
  const status = blockers.length > 0
    ? "blocked"
    : warnings.length > 0
      ? "validation_required"
      : comparison.diffRows?.length > 0
        ? "review_pending"
        : "mock_only";

  return {
    reviewGateId: "step135_strategy_draft_review_gate",
    sourceStep: "step135",
    status,
    reviewStatus: status,
    blockers,
    warnings,
    comparisonId: comparison.comparisonId,
    redactedReviewResult: {
      reviewResultId: "step135_redacted_strategy_draft_review_result",
      sourceStep: "step135",
      status: status === "review_pending" ? "not_ready" : status,
      storageMode: "in_memory_placeholder_only",
      redacted: true,
      credentialStored: false,
      accountIdentifierStored: false,
      providerPayloadStored: false,
      orderPayloadStored: false,
      rawProviderResponseStored: false,
    },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step135_strategy_draft_review_gate_v1" }),
  };
}

export function buildAdminTradingLabStrategyDraftReviewStatus(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const changeHistory = input.changeHistory || buildTradingLabStrategyDraftChangeHistory(comparison);
  const riskImpactPreview = input.riskImpactPreview || buildTradingLabStrategyRiskImpactPreview({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);

  return {
    ok: true,
    step: "Step 135: Admin trading lab strategy draft comparison review gate",
    status: "admin_only_strategy_draft_review_gate_fail_closed",
    strategyDraftComparisonSchema: TRADING_LAB_STRATEGY_DRAFT_COMPARISON_SCHEMA,
    strategyDraftChangeHistoryModel: TRADING_LAB_STRATEGY_DRAFT_CHANGE_HISTORY_MODEL,
    strategyRiskImpactPreviewSchema: TRADING_LAB_STRATEGY_RISK_IMPACT_PREVIEW_SCHEMA,
    strategyDraftReviewResultSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_SCHEMA,
    comparison,
    changeHistory,
    riskImpactPreview,
    reviewGate,
    flags: { ...STEP135_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      rawProviderResponseExposed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function buildTradingLabStrategyConfig(options = {}) {
  const strategyDraft = options.strategyDraft || buildTradingLabStrategyConfigDraft({}, options);
  return {
    strategyId: options.strategyId || strategyDraft.strategyDraftId || "step131_admin_trading_lab_strategy_placeholder",
    strategyType: "admin_trading_lab_strategy_config",
    sourceStep: "step134",
    name: strategyDraft.strategyName || "Admin mock strategy draft",
    allowedModes: ["mock", "dry_run", "shadow"],
    activeMode: strategyDraft.mode || "mock",
    allowedSymbolsStatus: strategyDraft.allowedSymbolsStatus || "placeholder_only",
    allowedSymbols: strategyDraft.allowedSymbols || ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER", "SYMBOL_C_PLACEHOLDER"],
    targetWeights: strategyDraft.targetWeights || [],
    rebalanceCondition: strategyDraft.rebalanceRule?.interval || "manual_review",
    maxOrderAmountStatus: strategyDraft.riskLimits?.maxOrderAmount > 0 ? "mock_limit_configured" : "not_configured_placeholder",
    maxDailyLossStatus: strategyDraft.riskLimits?.maxDailyLossPct > 0 ? "mock_limit_configured" : "blocked_by_default",
    maxPositionWeightStatus: strategyDraft.riskLimits?.maxPositionWeightPct > 0 ? "mock_limit_configured" : "blocked_by_default",
    killSwitchRequired: true,
    riskGateRequired: true,
    currentStatus: strategyDraft.status || "blocked",
    calculationSource: "step134_strategy_draft_mock_recalculation_boundary",
    flags: { ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS },
    redaction: makeLabRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
  };
}

export function buildTradingLabDailyReturnSeries(options = {}) {
  const mockLedger = options.mockLedger || buildTradingLabMockLedger(options);
  const calculated = options.dailyReturns || calculateTradingLabDailyReturnSeries(mockLedger, options);
  return {
    seriesId: options.seriesId || "step131_mock_daily_return_series",
    seriesType: "mock_daily_return_series",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    rows: calculated.rows,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_daily_return_series_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabCumulativePerformance(options = {}) {
  const mockLedger = options.mockLedger || buildTradingLabMockLedger(options);
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(mockLedger, options);
  const summary = calculateTradingLabPerformanceSummary(mockLedger, { ...options, dailyReturns });
  return {
    performanceId: options.performanceId || "step131_mock_cumulative_performance",
    performanceType: "mock_cumulative_performance",
    ...summary,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_cumulative_performance_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabKpiSummaryCards(input = {}, options = {}) {
  const performance = input.performance || buildTradingLabCumulativePerformance(options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries(options);
  const positions = input.positions || buildTradingLabPositionSnapshot(options);
  const orderCandidates = input.orderCandidates || buildTradingLabOrderCandidateSummary(options);
  const latestRow = dailyReturns.rows.at(-1) || {};
  const positionWeight = positions.positions.reduce((sum, position) => sum + Number(position.weightPct || 0), 0);

  return {
    summaryId: options.summaryId || "step132_mock_kpi_summary_cards",
    summaryType: "mock_kpi_summary_cards",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    cards: [
      {
        cardId: "mock_total_equity",
        label: "Mock equity",
        value: Number(latestRow.equityPlaceholder || 0),
        valueType: "placeholder_currency",
        status: "mock_only",
      },
      {
        cardId: "mock_cumulative_return",
        label: "Cumulative return",
        value: Number(performance.cumulativeReturnPct || 0),
        suffix: "%",
        status: "mock_only",
      },
      {
        cardId: "mock_daily_return",
        label: "Latest daily return",
        value: Number(latestRow.dailyReturnPct || 0),
        suffix: "%",
        status: "mock_only",
      },
      {
        cardId: "mock_mdd",
        label: "Max drawdown",
        value: Number(performance.mddPct || 0),
        suffix: "%",
        status: "mock_only",
      },
      {
        cardId: "mock_position_weight",
        label: "Position weight",
        value: positionWeight,
        suffix: "%",
        status: "placeholder_only",
      },
      {
        cardId: "mock_order_candidates",
        label: "Order candidates",
        value: orderCandidates.candidates.length,
        status: "blocked",
      },
    ],
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    accountIdentifierStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabEquityVisualization(dailyReturns = buildTradingLabDailyReturnSeries(), options = {}) {
  return {
    visualizationId: options.visualizationId || "step132_mock_daily_equity_visualization",
    visualizationType: "mock_daily_equity_line",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    points: dailyReturns.rows.map((row, index) => ({
      index,
      date: row.date,
      equity: Number(row.equity || row.equityPlaceholder || 0),
      equityPlaceholder: Number(row.equityPlaceholder || row.equity || 0),
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    accountIdentifierStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabReturnVisualization(dailyReturns = buildTradingLabDailyReturnSeries(), options = {}) {
  return {
    visualizationId: options.visualizationId || "step132_mock_return_visualization",
    visualizationType: "mock_return_bar_series",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    points: dailyReturns.rows.map((row, index) => ({
      index,
      date: row.date,
      dailyReturnPct: Number(row.dailyReturnPct || 0),
      cumulativeReturnPct: Number(row.cumulativeReturnPct || 0),
      drawdownPct: Number(row.drawdownPct || 0),
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    accountIdentifierStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabAllocationVisualization(
  positions = buildTradingLabPositionSnapshot(),
  strategy = buildTradingLabStrategyConfig(),
  options = {},
) {
  const targetWeights = new Map((strategy.targetWeights || []).map((target) => [target.symbol, Number(target.weightPct || 0)]));
  const allocationSummary = options.allocationSummary || calculateTradingLabAllocationSummary({
    positions: positions.positions || [],
    totalMarketValue: positions.totalMarketValue || 0,
    totalEquity: positions.totalEquity || 0,
    cash: positions.cash || 0,
  });

  return {
    visualizationId: options.visualizationId || "step132_mock_allocation_visualization",
    visualizationType: "mock_allocation_table_bars",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    allocations: allocationSummary.allocations.map((position) => ({
      symbol: position.symbol,
      name: position.name,
      weightPct: Number(position.weightPct || 0),
      marketValue: Number(position.marketValue || 0),
      unrealizedPnl: Number(position.unrealizedPnl || 0),
      targetWeightPct: targetWeights.get(position.symbol) || 0,
      status: position.status || "mock_calculated",
    })),
    positionWeightTotalPct: allocationSummary.positionWeightTotalPct,
    residualCashWeightPct: allocationSummary.residualCashWeightPct,
    totalWeightPct: allocationSummary.totalWeightPct,
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabPositionSnapshot(options = {}) {
  const mockLedger = options.mockLedger || buildTradingLabMockLedger(options);
  const calculated = options.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  return {
    snapshotId: options.snapshotId || "step131_mock_position_snapshot",
    snapshotType: "mock_position_snapshot",
    sourceStep: "step133",
    status: "mock_calculated",
    dataSource: "mock_ledger_calculation_result",
    positions: calculated.positions.map((position) => ({
      ...position,
      quantityPlaceholder: position.quantity,
      averagePricePlaceholder: position.averagePrice,
      currentPricePlaceholder: position.mockCurrentPrice,
      marketValuePlaceholder: position.marketValue,
      unrealizedPnLPlaceholder: position.unrealizedPnl,
    })),
    cash: calculated.cash,
    totalMarketValue: calculated.totalMarketValue,
    totalEquity: calculated.totalEquity,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_position_snapshot_v1" }),
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabOrderCandidateSummary(options = {}) {
  return {
    summaryId: options.summaryId || "step131_mock_order_candidate_summary",
    summaryType: "mock_order_candidate_summary",
    sourceStep: "step131",
    status: "blocked",
    candidates: [
      {
        draftId: "step131_mock_draft_candidate_1",
        mode: "mock",
        sidePlaceholder: "mock_side_only",
        quantityPlaceholder: "mock_quantity_only",
        estimatedAmountPlaceholder: "mock_amount_only",
        riskStatus: "blocked",
        killSwitchStatus: "active_blocking",
        preflightStatus: "not_ready",
      },
    ],
    redaction: makeLabRedaction(),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    orderSubmissionAttempted: false,
  };
}

export function buildTradingLabAuditLogSummary(options = {}) {
  return {
    summaryId: options.summaryId || "step131_mock_audit_log_summary",
    summaryType: "mock_audit_log_summary",
    sourceStep: "step131",
    storageMode: "static_in_memory_placeholder_only",
    events: [
      {
        eventId: "step131_mock_audit_event_1",
        eventType: "trading_lab_dashboard_snapshot",
        status: "blocked",
        createdAt: "2026-07-03T00:00:00.000Z",
        redactedReason: "metadata_only_no_private_values",
        blockedReason: "live_provider_and_order_paths_disabled",
      },
    ],
    redaction: makeLabRedaction(),
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildAdminTradingLabDashboardStatus(input = {}, options = {}) {
  const strategyDraftStatus = input.strategyDraftStatus || buildAdminTradingLabStrategyDraftStatus(input.strategyDraft || {}, options);
  const strategyDraftReviewStatus = input.strategyDraftReviewStatus || buildAdminTradingLabStrategyDraftReviewStatus(
    { ...input, strategyDraft: strategyDraftStatus.strategyDraft, validation: strategyDraftStatus.validation },
    options,
  );
  const mockRecalculationBoundary = input.mockRecalculationBoundary || strategyDraftStatus.mockRecalculationBoundary;
  const mockLedger = input.mockLedger || mockRecalculationBoundary.mockLedger || buildTradingLabMockLedger(options);
  const mockTradeEvents = input.mockTradeEvents || buildTradingLabMockTradeEvents({ ...options, events: mockLedger.events });
  const positionLedger = input.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  const dailyEquity = input.dailyEquity || calculateTradingLabDailyEquitySeries(mockLedger, options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries({ ...options, mockLedger, dailyReturns: calculateTradingLabDailyReturnSeries(mockLedger, { ...options, dailyEquity }) });
  const cumulativeReturns = input.cumulativeReturns || calculateTradingLabCumulativeReturnSeries(mockLedger, { ...options, dailyReturns });
  const drawdownSummary = input.drawdownSummary || calculateTradingLabDrawdownSummary(mockLedger, { ...options, dailyReturns });
  const allocationSummary = input.allocationSummary || calculateTradingLabAllocationSummary(positionLedger, options);
  const performance = input.performance || buildTradingLabCumulativePerformance({ ...options, mockLedger, dailyReturns });
  const strategy = input.strategy || buildTradingLabStrategyConfig({ ...options, strategyDraft: strategyDraftStatus.strategyDraft });
  const positions = input.positions || buildTradingLabPositionSnapshot({ ...options, mockLedger, positionLedger });
  const orderCandidates = input.orderCandidates || buildTradingLabOrderCandidateSummary(options);
  const auditLogs = input.auditLogs || buildTradingLabAuditLogSummary(options);
  const kpiCards = input.kpiCards || buildTradingLabKpiSummaryCards(
    { performance, dailyReturns, positions, orderCandidates },
    options,
  );
  const equityVisualization = input.equityVisualization || buildTradingLabEquityVisualization(dailyReturns, options);
  const returnVisualization = input.returnVisualization || buildTradingLabReturnVisualization(dailyReturns, options);
  const allocationVisualization = input.allocationVisualization || buildTradingLabAllocationVisualization(
    positions,
    strategy,
    { ...options, allocationSummary },
  );

  return {
    ok: true,
    step: "Step 135: Admin trading lab strategy draft comparison review gate",
    status: "admin_only_trading_lab_dashboard_shell_fail_closed",
    calculationMode: "strategy_draft_mock_recalculation_admin_only",
    step133CalculationMode: "mock_ledger_calculation_admin_only",
    step133Compatibility: {
      calculationMode: "mock_ledger_calculation_admin_only",
      mockLedgerCalculationCoreRetained: true,
    },
    visualizationMode: "mock_static_admin_only",
    strategyConfigSchema: TRADING_LAB_STRATEGY_CONFIG_SCHEMA,
    strategyDraftStatus,
    strategyDraftReviewStatus,
    strategyDraftSchema: TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA,
    strategyDraftComparisonSchema: TRADING_LAB_STRATEGY_DRAFT_COMPARISON_SCHEMA,
    strategyDraftChangeHistoryModel: TRADING_LAB_STRATEGY_DRAFT_CHANGE_HISTORY_MODEL,
    strategyRiskImpactPreviewSchema: TRADING_LAB_STRATEGY_RISK_IMPACT_PREVIEW_SCHEMA,
    strategyDraftReviewResultSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_SCHEMA,
    targetWeightDraftModel: TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL,
    rebalanceRuleDraftModel: TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL,
    riskLimitDraftModel: TRADING_LAB_RISK_LIMIT_DRAFT_MODEL,
    mockRecalculationBoundary,
    dailyReturnSeriesSchema: TRADING_LAB_DAILY_RETURN_SERIES_SCHEMA,
    cumulativePerformanceSchema: TRADING_LAB_CUMULATIVE_PERFORMANCE_SCHEMA,
    kpiSummaryCardSchema: TRADING_LAB_KPI_SUMMARY_CARD_SCHEMA,
    equityVisualizationSchema: TRADING_LAB_EQUITY_VISUALIZATION_SCHEMA,
    returnVisualizationSchema: TRADING_LAB_RETURN_VISUALIZATION_SCHEMA,
    allocationVisualizationSchema: TRADING_LAB_ALLOCATION_VISUALIZATION_SCHEMA,
    mockLedgerSchema: TRADING_LAB_MOCK_LEDGER_SCHEMA,
    mockTradeEventSchema: TRADING_LAB_MOCK_TRADE_EVENT_SCHEMA,
    positionSnapshotSchema: TRADING_LAB_POSITION_SNAPSHOT_SCHEMA,
    orderCandidateSummarySchema: TRADING_LAB_ORDER_CANDIDATE_SUMMARY_SCHEMA,
    auditLogSummarySchema: TRADING_LAB_AUDIT_LOG_SUMMARY_SCHEMA,
    mockLedger,
    mockTradeEvents,
    positionLedger,
    dailyEquity,
    cumulativeReturns,
    drawdownSummary,
    allocationSummary,
    strategy,
    dailyReturns,
    performance,
    kpiCards,
    equityVisualization,
    returnVisualization,
    allocationVisualization,
    positions,
    orderCandidates,
    auditLogs,
    flags: { ...STEP135_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

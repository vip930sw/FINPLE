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

export const TRADING_LAB_STRATEGY_CONFIG_SCHEMA = Object.freeze({
  strategyId: "string",
  strategyType: "admin_trading_lab_strategy_config",
  sourceStep: "step131",
  mode: "mock | dry_run | shadow",
  redaction: "metadata_only_no_private_values",
  flags: "all_false",
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

export function buildTradingLabStrategyConfig(options = {}) {
  return {
    strategyId: options.strategyId || "step131_admin_trading_lab_strategy_placeholder",
    strategyType: "admin_trading_lab_strategy_config",
    sourceStep: "step131",
    name: "관리자 모의 전략",
    allowedModes: ["mock", "dry_run", "shadow"],
    activeMode: "mock",
    allowedSymbolsStatus: "placeholder_only",
    allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER", "SYMBOL_C_PLACEHOLDER"],
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40, status: "mock_only" },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35, status: "dry_run_only" },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25, status: "shadow_only" },
    ],
    rebalanceCondition: "mock_threshold_review_only",
    maxOrderAmountStatus: "not_configured_placeholder",
    maxDailyLossStatus: "blocked_by_default",
    killSwitchRequired: true,
    currentStatus: "blocked",
    calculationSource: "step133_mock_ledger_calculation_core",
    flags: { ...STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS },
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
  const mockLedger = input.mockLedger || buildTradingLabMockLedger(options);
  const mockTradeEvents = input.mockTradeEvents || buildTradingLabMockTradeEvents({ ...options, events: mockLedger.events });
  const positionLedger = input.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  const dailyEquity = input.dailyEquity || calculateTradingLabDailyEquitySeries(mockLedger, options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries({ ...options, mockLedger, dailyReturns: calculateTradingLabDailyReturnSeries(mockLedger, { ...options, dailyEquity }) });
  const cumulativeReturns = input.cumulativeReturns || calculateTradingLabCumulativeReturnSeries(mockLedger, { ...options, dailyReturns });
  const drawdownSummary = input.drawdownSummary || calculateTradingLabDrawdownSummary(mockLedger, { ...options, dailyReturns });
  const allocationSummary = input.allocationSummary || calculateTradingLabAllocationSummary(positionLedger, options);
  const performance = input.performance || buildTradingLabCumulativePerformance({ ...options, mockLedger, dailyReturns });
  const strategy = input.strategy || buildTradingLabStrategyConfig(options);
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
    step: "Step 133: Admin trading lab mock ledger return calculation core",
    status: "admin_only_trading_lab_dashboard_shell_fail_closed",
    calculationMode: "mock_ledger_calculation_admin_only",
    visualizationMode: "mock_static_admin_only",
    strategyConfigSchema: TRADING_LAB_STRATEGY_CONFIG_SCHEMA,
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
    flags: { ...STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS },
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

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
    flags: { ...STEP131_ADMIN_TRADING_LAB_DASHBOARD_FLAGS },
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
  return {
    seriesId: options.seriesId || "step131_mock_daily_return_series",
    seriesType: "mock_daily_return_series",
    sourceStep: "step131",
    dataSource: "static_placeholder_only",
    rows: [
      { date: "2026-07-01", dailyReturnPct: 0.12, cumulativeReturnPct: 0.12, drawdownPct: 0, equityPlaceholder: 100120 },
      { date: "2026-07-02", dailyReturnPct: -0.08, cumulativeReturnPct: 0.04, drawdownPct: -0.08, equityPlaceholder: 100040 },
      { date: "2026-07-03", dailyReturnPct: 0.05, cumulativeReturnPct: 0.09, drawdownPct: -0.03, equityPlaceholder: 100090 },
    ],
    redaction: makeLabRedaction(),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabCumulativePerformance(options = {}) {
  return {
    performanceId: options.performanceId || "step131_mock_cumulative_performance",
    performanceType: "mock_cumulative_performance",
    sourceStep: "step131",
    status: "mock_only",
    cumulativeReturnPct: 0.09,
    periodReturnPct: 0.09,
    mddPct: -0.08,
    volatilityPct: 0.18,
    winRatePct: 66.67,
    profitLossRatio: 1.5,
    benchmarkStatus: "mock_static_placeholder",
    redaction: makeLabRedaction(),
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
    sourceStep: "step132",
    dataSource: "static_placeholder_only",
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
    sourceStep: "step132",
    dataSource: "static_placeholder_only",
    points: dailyReturns.rows.map((row, index) => ({
      index,
      date: row.date,
      equityPlaceholder: Number(row.equityPlaceholder || 0),
      status: "mock_only",
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
    sourceStep: "step132",
    dataSource: "static_placeholder_only",
    points: dailyReturns.rows.map((row, index) => ({
      index,
      date: row.date,
      dailyReturnPct: Number(row.dailyReturnPct || 0),
      cumulativeReturnPct: Number(row.cumulativeReturnPct || 0),
      drawdownPct: Number(row.drawdownPct || 0),
      status: "mock_only",
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

  return {
    visualizationId: options.visualizationId || "step132_mock_allocation_visualization",
    visualizationType: "mock_allocation_table_bars",
    sourceStep: "step132",
    dataSource: "static_placeholder_only",
    allocations: positions.positions.map((position) => ({
      symbol: position.symbol,
      name: position.name,
      weightPct: Number(position.weightPct || 0),
      targetWeightPct: targetWeights.get(position.symbol) || 0,
      status: "mock_only",
    })),
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
  return {
    snapshotId: options.snapshotId || "step131_mock_position_snapshot",
    snapshotType: "mock_position_snapshot",
    sourceStep: "step131",
    status: "mock_only",
    positions: [
      {
        symbol: "SYMBOL_A_PLACEHOLDER",
        name: "모의 보유자산 A",
        quantityPlaceholder: "mock_quantity_only",
        averagePricePlaceholder: "mock_average_price_only",
        currentPricePlaceholder: "mock_current_price_only",
        marketValuePlaceholder: "mock_market_value_only",
        unrealizedPnLPlaceholder: "mock_unrealized_pl_only",
        weightPct: 40,
      },
      {
        symbol: "SYMBOL_B_PLACEHOLDER",
        name: "모의 보유자산 B",
        quantityPlaceholder: "mock_quantity_only",
        averagePricePlaceholder: "mock_average_price_only",
        currentPricePlaceholder: "mock_current_price_only",
        marketValuePlaceholder: "mock_market_value_only",
        unrealizedPnLPlaceholder: "mock_unrealized_pl_only",
        weightPct: 35,
      },
    ],
    redaction: makeLabRedaction(),
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
  const strategy = input.strategy || buildTradingLabStrategyConfig(options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries(options);
  const performance = input.performance || buildTradingLabCumulativePerformance(options);
  const positions = input.positions || buildTradingLabPositionSnapshot(options);
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
    options,
  );

  return {
    ok: true,
    step: "Step 132: Separate admin trading safety panel and visualize trading lab dashboard",
    status: "admin_only_trading_lab_dashboard_shell_fail_closed",
    visualizationMode: "mock_static_admin_only",
    strategyConfigSchema: TRADING_LAB_STRATEGY_CONFIG_SCHEMA,
    dailyReturnSeriesSchema: TRADING_LAB_DAILY_RETURN_SERIES_SCHEMA,
    cumulativePerformanceSchema: TRADING_LAB_CUMULATIVE_PERFORMANCE_SCHEMA,
    kpiSummaryCardSchema: TRADING_LAB_KPI_SUMMARY_CARD_SCHEMA,
    equityVisualizationSchema: TRADING_LAB_EQUITY_VISUALIZATION_SCHEMA,
    returnVisualizationSchema: TRADING_LAB_RETURN_VISUALIZATION_SCHEMA,
    allocationVisualizationSchema: TRADING_LAB_ALLOCATION_VISUALIZATION_SCHEMA,
    positionSnapshotSchema: TRADING_LAB_POSITION_SNAPSHOT_SCHEMA,
    orderCandidateSummarySchema: TRADING_LAB_ORDER_CANDIDATE_SUMMARY_SCHEMA,
    auditLogSummarySchema: TRADING_LAB_AUDIT_LOG_SUMMARY_SCHEMA,
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
    flags: { ...STEP132_ADMIN_TRADING_LAB_VISUALIZATION_FLAGS },
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

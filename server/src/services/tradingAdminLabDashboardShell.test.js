import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminTradingLabMockExecutionReviewResultStatus,
  buildAdminTradingLabMockFillSimulationCorePreflightStatus,
  buildAdminTradingLabMockFillSimulationCoreReviewResultStatus,
  buildAdminTradingLabMockFillSimulationCoreStatus,
  buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus,
  buildAdminTradingLabMockFillSimulationPreflightStatus,
  buildAdminTradingLabMockFillSimulationReviewResultStatus,
  buildAdminTradingLabStrategyDraftStatus,
  buildAdminTradingLabMockExecutionPreflightStatus,
  buildAdminTradingLabMockOrderGenerationPreflightStatus,
  buildAdminTradingLabMockOrderGenerationReviewResultStatus,
  buildAdminTradingLabMockRunCandidatePreflightStatus,
  buildAdminTradingLabStrategyDraftClearancePreflightStatus,
  buildAdminTradingLabStrategyDraftClearanceReviewResultStatus,
  buildAdminTradingLabStrategyDraftReviewStatus,
  buildAdminTradingLabStrategyDraftReviewResultStatus,
  buildAdminTradingLabDashboardStatus,
  buildTradingLabMockLedger,
  buildTradingLabMockTradeEvents,
  buildTradingLabAuditLogSummary,
  buildTradingLabAllocationVisualization,
  calculateTradingLabAllocationSummary,
  calculateTradingLabCumulativeReturnSeries,
  calculateTradingLabDailyEquitySeries,
  calculateTradingLabDailyReturnSeries,
  calculateTradingLabDrawdownSummary,
  calculateTradingLabPerformanceSummary,
  calculateTradingLabPositionLedger,
  buildTradingLabMockRecalculationBoundary,
  buildTradingLabDailyReturnSeries,
  buildTradingLabEquityVisualization,
  buildTradingLabKpiSummaryCards,
  buildTradingLabOrderCandidateSummary,
  buildTradingLabPositionSnapshot,
  buildTradingLabReturnVisualization,
  buildTradingLabStrategyConfig,
  buildTradingLabStrategyConfigDraft,
  buildTradingLabStrategyDraftChangeHistory,
  buildTradingLabStrategyDraftComparison,
  buildTradingLabStrategyDraftReviewBlockerSummary,
  buildTradingLabStrategyDraftReviewGate,
  buildTradingLabStrategyDraftReviewReceipt,
  buildTradingLabStrategyDraftReviewResult,
  buildTradingLabStrategyDraftReviewResultRecordingGate,
  buildTradingLabStrategyDraftClearanceBlockerSummary,
  buildTradingLabStrategyDraftClearanceCandidate,
  buildTradingLabStrategyDraftClearanceReviewBlockerSummary,
  buildTradingLabStrategyDraftClearanceReviewDecisionSummary,
  buildTradingLabStrategyDraftClearanceReviewReceipt,
  buildTradingLabStrategyDraftClearanceReviewResult,
  buildTradingLabStrategyDraftClearanceReviewResultRecordingGate,
  buildTradingLabStrategyDraftClearancePreflight,
  buildTradingLabStrategyDraftClearancePreflightResult,
  buildTradingLabMockRunCandidate,
  buildTradingLabMockRunCandidatePreflight,
  buildTradingLabMockRunInitialCapital,
  buildTradingLabMockRunInputBundle,
  buildTradingLabMockRunPreflightResult,
  buildTradingLabMockRunUniverseSnapshot,
  buildTradingLabMockBuySellSignalPlaceholders,
  buildTradingLabMockOrderGenerationPreflight,
  buildTradingLabMockOrderGenerationPreflightResult,
  buildTradingLabMockOrderGenerationRiskGuardPreflight,
  buildTradingLabMockOrderGenerationReviewDecisionSummary,
  buildTradingLabMockOrderGenerationReviewReceipt,
  buildTradingLabMockOrderGenerationReviewResult,
  buildTradingLabMockOrderGenerationReviewResultRecordingGate,
  buildTradingLabMockOrderIntentReviewSummary,
  buildTradingLabMockExecutionCashImpactPreview,
  buildTradingLabMockExecutionIntents,
  buildTradingLabMockExecutionPositionImpactPreview,
  buildTradingLabMockExecutionPreflight,
  buildTradingLabMockExecutionPreflightResult,
  buildTradingLabMockExecutionReviewDecisionSummary,
  buildTradingLabMockExecutionReviewReceipt,
  buildTradingLabMockExecutionReviewResult,
  buildTradingLabMockExecutionReviewResultRecordingGate,
  buildTradingLabMockExecutionRiskGuardPreflight,
  buildTradingLabMockExecutionCashImpactReviewSummary,
  buildTradingLabMockExecutionIntentReviewSummary,
  buildTradingLabMockExecutionPositionImpactReviewSummary,
  buildTradingLabMockFillSimulationCandidates,
  buildTradingLabMockFillSimulationPreflight,
  buildTradingLabMockFillSimulationPreflightResult,
  buildTradingLabMockFillSimulationReviewDecisionSummary,
  buildTradingLabMockFillSimulationReviewImpactSummary,
  buildTradingLabMockFillSimulationReviewReceipt,
  buildTradingLabMockFillSimulationReviewResult,
  buildTradingLabMockFillSimulationReviewResultRecordingGate,
  buildTradingLabMockFillSimulationCorePreflight,
  buildTradingLabMockFillSimulationCorePreflightResult,
  buildTradingLabMockFillSimulationCoreReviewResult,
  buildTradingLabMockFillSimulationCoreReviewResultRecordingGate,
  buildTradingLabMockFillSimulationCore,
  buildTradingLabMockPortfolioLedgerUpdatePreflight,
  buildTradingLabMockLedgerUpdateCandidates,
  buildTradingLabMockFillCalculationInputs,
  calculateTradingLabMockFillResult,
  buildTradingLabMockFillCorePolicyReviewSummary,
  buildTradingLabMockFillCoreReviewDecisionSummary,
  buildTradingLabMockFillCoreReviewReceipt,
  buildTradingLabMockFillCoreInputBundle,
  buildTradingLabMockFillScenario,
  buildTradingLabMockFillSlippageFeePreview,
  buildTradingLabMockFillPlanReviewSummary,
  buildTradingLabMockFillPlanPlaceholders,
  buildTradingLabMockOrderIntents,
  buildTradingLabMockRebalanceDeltas,
  buildTradingLabMockTargetAllocationGapSummary,
  buildTradingLabStrategyRiskImpactPreview,
  validateTradingLabMockOrderGenerationPreflight,
  validateTradingLabMockOrderGenerationReviewResult,
  validateTradingLabMockExecutionPreflight,
  validateTradingLabMockExecutionReviewResult,
  validateTradingLabMockFillCashImpact,
  validateTradingLabMockFillPolicyAndPriceSource,
  validateTradingLabMockFillPositionImpact,
  validateTradingLabMockFillSimulationPreflight,
  validateTradingLabMockFillSimulationReviewResult,
  validateTradingLabMockFillSimulationCorePreflight,
  validateTradingLabMockFillSimulationCoreReviewResult,
  validateTradingLabMockFillSimulationCore,
  validateTradingLabMockPortfolioLedgerUpdatePreflight,
  validateTradingLabMockFillCoreCashAvailability,
  validateTradingLabMockFillCorePositionImpact,
  validateTradingLabMockFillCorePricingSlippageFeePolicy,
  validateTradingLabMockFillDeterministicCalculationReadiness,
  validateTradingLabMockRunCandidatePreflight,
  validateTradingLabStrategyDraftClearanceReviewResult,
  validateTradingLabStrategyDraftClearancePreflight,
  validateTradingLabStrategyDraftReviewResult,
  validateTradingLabStrategyConfigDraft,
} from "./tradingAdminLabDashboardShell.js";

test("trading lab dashboard data does not call provider, issue token, query quote, or submit order", () => {
  const status = buildAdminTradingLabDashboardStatus();

  assert.equal(status.ok, true);
  assert.equal(status.status, "admin_only_trading_lab_dashboard_shell_fail_closed");
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.tokenIssuanceAttempted, false);
  assert.equal(status.quoteRequestAttempted, false);
  assert.equal(status.networkCallAttempted, false);
  assert.equal(status.orderSubmissionAttempted, false);
  assert.equal(status.persistentStorageUsed, false);
  assert.equal(status.dbWriteUsed, false);
});

test("strategy config result is redacted and contains no credential or account identifier", () => {
  const strategy = buildTradingLabStrategyConfig();
  const serialized = JSON.stringify(strategy);

  assert.equal(strategy.redaction.containsCredential, false);
  assert.equal(strategy.redaction.containsAccountIdentifier, false);
  assert.equal(strategy.redaction.containsProviderPayload, false);
  assert.equal(strategy.redaction.containsOrderPayload, false);
  assert.equal(strategy.providerCallsAllowed, false);
  assert.equal(strategy.orderSubmissionAllowed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountIdentifier"), false);
});

test("performance and daily returns mock data contain no provider or order payload", () => {
  const dailyReturns = buildTradingLabDailyReturnSeries();
  const status = buildAdminTradingLabDashboardStatus();

  assert.ok(Array.isArray(dailyReturns.rows));
  assert.equal(dailyReturns.providerPayloadStored, false);
  assert.equal(dailyReturns.orderPayloadStored, false);
  assert.equal(status.performance.providerPayloadStored, false);
  assert.equal(status.performance.orderPayloadStored, false);
  assert.equal(status.performance.rawProviderResponseStored, false);
});

test("positions mock data contains no account identifier", () => {
  const positions = buildTradingLabPositionSnapshot();

  assert.ok(Array.isArray(positions.positions));
  assert.equal(positions.accountIdentifierStored, false);
  assert.equal(positions.providerPayloadStored, false);
  assert.equal(positions.orderPayloadStored, false);
});

test("order candidate summary contains no provider or order payload and cannot submit", () => {
  const orderCandidates = buildTradingLabOrderCandidateSummary();

  assert.ok(Array.isArray(orderCandidates.candidates));
  assert.equal(orderCandidates.status, "blocked");
  assert.equal(orderCandidates.providerPayloadStored, false);
  assert.equal(orderCandidates.orderPayloadStored, false);
  assert.equal(orderCandidates.orderSubmissionAllowed, false);
  assert.equal(orderCandidates.orderSubmissionAttempted, false);
});

test("audit log mock data contains no raw provider response or persistent write", () => {
  const auditLogs = buildTradingLabAuditLogSummary();

  assert.ok(Array.isArray(auditLogs.events));
  assert.equal(auditLogs.rawProviderResponseStored, false);
  assert.equal(auditLogs.providerPayloadStored, false);
  assert.equal(auditLogs.orderPayloadStored, false);
  assert.equal(auditLogs.persistentStorageUsed, false);
  assert.equal(auditLogs.dbWriteUsed, false);
});

test("admin dashboard status keeps boundaries admin-only and readiness flags false", () => {
  const status = buildAdminTradingLabDashboardStatus();

  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.publicDashboardExposed, false);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.boundaries.rawProviderResponseExposed, false);
  assert.equal(status.boundaries.dbMigrationRequired, false);
  assert.equal(status.boundaries.persistentDbWriteRequired, false);
  assert.equal(status.boundaries.scenarioMonthlyReturnsTouched, false);
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
});

test("Step 132 dashboard visualization exposes mock KPI cards only", () => {
  const kpiCards = buildTradingLabKpiSummaryCards();
  const status = buildAdminTradingLabDashboardStatus();

  assert.equal(status.visualizationMode, "mock_static_admin_only");
  assert.ok(Array.isArray(kpiCards.cards));
  assert.ok(kpiCards.cards.length >= 6);
  assert.equal(kpiCards.providerPayloadStored, false);
  assert.equal(kpiCards.orderPayloadStored, false);
  assert.equal(kpiCards.accountIdentifierStored, false);
  assert.equal(status.kpiCards.providerCallsAllowed, false);
  assert.equal(status.kpiCards.orderSubmissionAllowed, false);
});

test("Step 132 equity and return visualization points are static and redacted", () => {
  const equityVisualization = buildTradingLabEquityVisualization();
  const returnVisualization = buildTradingLabReturnVisualization();

  assert.ok(Array.isArray(equityVisualization.points));
  assert.ok(Array.isArray(returnVisualization.points));
  assert.equal(equityVisualization.dataSource, "mock_ledger_calculation_result");
  assert.equal(returnVisualization.dataSource, "mock_ledger_calculation_result");
  assert.equal(equityVisualization.staticPlaceholderSourceRetained, "static_placeholder_only");
  assert.equal(returnVisualization.staticPlaceholderSourceRetained, "static_placeholder_only");
  assert.equal(equityVisualization.providerPayloadStored, false);
  assert.equal(equityVisualization.orderPayloadStored, false);
  assert.equal(returnVisualization.rawProviderResponseStored, false);
  assert.equal(returnVisualization.providerCallsAllowed, false);
  assert.equal(returnVisualization.orderSubmissionAllowed, false);
});

test("Step 132 allocation visualization contains no account identifier or provider payload", () => {
  const allocationVisualization = buildTradingLabAllocationVisualization();
  const serialized = JSON.stringify(allocationVisualization);

  assert.ok(Array.isArray(allocationVisualization.allocations));
  assert.equal(allocationVisualization.accountIdentifierStored, false);
  assert.equal(allocationVisualization.providerPayloadStored, false);
  assert.equal(allocationVisualization.orderPayloadStored, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("accountNo"), false);
});

test("Step 133 mock ledger model and trade events stay provider-free and redacted", () => {
  const mockLedger = buildTradingLabMockLedger();
  const mockTradeEvents = buildTradingLabMockTradeEvents();
  const serialized = JSON.stringify({ mockLedger, mockTradeEvents });

  assert.equal(mockLedger.ledgerType, "admin_only_mock_trading_ledger");
  assert.equal(mockLedger.sourceStep, "step133");
  assert.equal(mockLedger.status, "mock_calculated_fail_closed");
  assert.ok(Array.isArray(mockLedger.events));
  assert.ok(Array.isArray(mockLedger.positions));
  assert.ok(Array.isArray(mockLedger.equitySeries));
  assert.equal(mockLedger.providerCallsAllowed, false);
  assert.equal(mockLedger.orderSubmissionAllowed, false);
  assert.equal(mockLedger.tokenIssuanceAttempted, false);
  assert.equal(mockLedger.quoteRequestAttempted, false);
  assert.equal(mockLedger.networkCallAttempted, false);
  assert.equal(mockLedger.orderSubmissionAttempted, false);
  assert.equal(mockLedger.credentialStored, false);
  assert.equal(mockLedger.accountIdentifierStored, false);
  assert.equal(mockLedger.providerPayloadStored, false);
  assert.equal(mockLedger.orderPayloadStored, false);
  assert.equal(mockLedger.rawProviderResponseStored, false);
  assert.equal(mockTradeEvents.events.every((event) => event.source === "mock_ledger"), true);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 133 position, daily equity, return, cumulative return, and drawdown calculations are deterministic", () => {
  const mockLedger = buildTradingLabMockLedger();
  const positionLedger = calculateTradingLabPositionLedger(mockLedger);
  const dailyEquity = calculateTradingLabDailyEquitySeries(mockLedger);
  const dailyReturns = calculateTradingLabDailyReturnSeries(mockLedger, { dailyEquity });
  const cumulativeReturns = calculateTradingLabCumulativeReturnSeries(mockLedger, { dailyReturns });
  const drawdownSummary = calculateTradingLabDrawdownSummary(mockLedger, { dailyReturns });

  assert.equal(positionLedger.dataSource, "mock_ledger_calculation_result");
  assert.equal(positionLedger.positions.length, 3);
  assert.equal(positionLedger.providerCallsAllowed, false);
  assert.equal(positionLedger.orderSubmissionAllowed, false);
  assert.deepEqual(dailyEquity.rows.map((row) => row.date), ["2026-07-01", "2026-07-02", "2026-07-03"]);
  assert.equal(dailyEquity.rows.at(-1).equity, 100208);
  assert.equal(dailyReturns.rows.at(-1).cumulativeReturnPct, 0.208);
  assert.equal(cumulativeReturns.rows.at(-1).cumulativeReturnPct, 0.208);
  assert.equal(drawdownSummary.mddPct, 0);
});

test("Step 133 allocation and performance summary calculations remain admin-only mock results", () => {
  const mockLedger = buildTradingLabMockLedger();
  const positionLedger = calculateTradingLabPositionLedger(mockLedger);
  const allocationSummary = calculateTradingLabAllocationSummary(positionLedger);
  const dailyReturns = calculateTradingLabDailyReturnSeries(mockLedger);
  const performance = calculateTradingLabPerformanceSummary(mockLedger, { dailyReturns });
  const status = buildAdminTradingLabDashboardStatus();

  assert.equal(allocationSummary.totalWeightPct, 100);
  assert.equal(allocationSummary.providerPayloadStored, false);
  assert.equal(allocationSummary.orderPayloadStored, false);
  assert.equal(performance.dataSource, "mock_ledger_calculation_result");
  assert.equal(performance.rawProviderResponseStored, false);
  assert.equal(performance.providerCallsAllowed, false);
  assert.equal(performance.orderSubmissionAllowed, false);
  assert.equal(status.step133CalculationMode, "mock_ledger_calculation_admin_only");
  assert.equal(status.mockLedger.sourceStep, "step133");
  assert.equal(status.positionLedger.positions.length, 3);
  assert.equal(status.allocationSummary.totalWeightPct, 100);
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
});

test("Step 134 strategy draft schema is redacted and keeps all trading flags false", () => {
  const draftStatus = buildAdminTradingLabStrategyDraftStatus();
  const draft = draftStatus.strategyDraft;
  const serialized = JSON.stringify(draftStatus);

  assert.equal(draftStatus.ok, true);
  assert.equal(draftStatus.status, "admin_only_strategy_draft_controls_fail_closed");
  assert.equal(draft.draftType, "admin_only_mock_strategy_config_draft");
  assert.equal(draft.sourceStep, "step134");
  assert.equal(draft.providerCallsAllowed, false);
  assert.equal(draft.orderSubmissionAllowed, false);
  assert.equal(draft.tokenIssuanceAttempted, false);
  assert.equal(draft.quoteRequestAttempted, false);
  assert.equal(draft.networkCallAttempted, false);
  assert.equal(draft.orderSubmissionAttempted, false);
  assert.equal(draft.persistentStorageUsed, false);
  assert.equal(draft.dbWriteUsed, false);
  assert.equal(draftStatus.flags.providerCallsAllowed, false);
  assert.equal(draftStatus.flags.orderSubmissionAllowed, false);
  assert.equal(draftStatus.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(draftStatus.flags.readyForOrderSubmission, false);
  assert.equal(draftStatus.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 134 strategy validation rejects unsafe modes and wildcard symbols", () => {
  const draft = buildTradingLabStrategyConfigDraft({
    mode: "live_order_submit",
    allowedSymbols: ["*"],
    targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
  });
  const validation = validateTradingLabStrategyConfigDraft({ ...draft, mode: "live_order_submit", allowedSymbols: ["*"] });

  assert.equal(validation.status, "blocked");
  assert.ok(validation.blockers.includes("unsupported_or_live_strategy_mode"));
  assert.ok(validation.blockers.includes("live_or_order_submission_mode_rejected"));
  assert.ok(validation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(validation.providerCallsAllowed, false);
  assert.equal(validation.orderSubmissionAllowed, false);
  assert.equal(validation.readinessPromoted, false);
});

test("Step 134 strategy validation handles target weight residual safely", () => {
  const draft = buildTradingLabStrategyConfigDraft({
    allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER"],
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 50 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 25 },
    ],
  });
  const validation = validateTradingLabStrategyConfigDraft(draft);

  assert.equal(validation.status, "validation_required");
  assert.equal(validation.targetWeightTotalPct, 75);
  assert.equal(validation.residualWeightPct, 25);
  assert.ok(validation.warnings.includes("target_weight_residual_review_required"));
});

test("Step 134 mock recalculation boundary uses mock data only and preserves Step 133 calculations", () => {
  const draft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER"],
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 60 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 40 },
    ],
    riskLimits: {
      maxOrderAmount: 1000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const boundary = buildTradingLabMockRecalculationBoundary(draft);
  const dashboard = buildAdminTradingLabDashboardStatus({ strategyDraft: draft });

  assert.equal(boundary.status, "mock_recalculated");
  assert.equal(boundary.calculationMode, "strategy_draft_mock_recalculation_admin_only");
  assert.equal(boundary.providerCallsAllowed, false);
  assert.equal(boundary.orderSubmissionAllowed, false);
  assert.equal(boundary.networkCallAttempted, false);
  assert.equal(boundary.persistentStorageUsed, false);
  assert.equal(boundary.dbWriteUsed, false);
  assert.ok(boundary.mockLedger.events.length >= 2);
  assert.equal(boundary.performance.dataSource, "mock_ledger_calculation_result");
  assert.equal(dashboard.strategyDraftStatus.step, "Step 134: Admin trading lab strategy config draft controls");
  assert.equal(dashboard.mockLedger.sourceStep, "step133");
  assert.equal(dashboard.strategy.sourceStep, "step134");
  assert.equal(dashboard.strategyDraftStatus.validation.status, "mock_only");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
});

test("Step 135 strategy draft comparison is deterministic and redacted", () => {
  const draft = buildTradingLabStrategyConfigDraft({
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
  });
  const comparison = buildTradingLabStrategyDraftComparison({ strategyDraft: draft });
  const serialized = JSON.stringify(comparison);

  assert.equal(comparison.sourceStep, "step135");
  assert.equal(comparison.changedSymbols.includes("SYMBOL_A_PLACEHOLDER"), true);
  assert.equal(comparison.changedSymbols.includes("SYMBOL_B_PLACEHOLDER"), true);
  assert.ok(comparison.diffRows.some((row) => row.summary === "SYMBOL_A_PLACEHOLDER weight -5.00pp"));
  assert.ok(comparison.diffRows.some((row) => row.summary === "SYMBOL_B_PLACEHOLDER weight +5.00pp"));
  assert.equal(comparison.providerCallsAllowed, false);
  assert.equal(comparison.orderSubmissionAllowed, false);
  assert.equal(comparison.persistentStorageUsed, false);
  assert.equal(comparison.dbWriteUsed, false);
  assert.equal(comparison.credentialStored, false);
  assert.equal(comparison.accountIdentifierStored, false);
  assert.equal(comparison.providerPayloadStored, false);
  assert.equal(comparison.orderPayloadStored, false);
  assert.equal(comparison.rawProviderResponseStored, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("accountNumber"), false);
});

test("Step 135 change history and risk impact preview stay mock-only without DB writes", () => {
  const comparison = buildTradingLabStrategyDraftComparison();
  const history = buildTradingLabStrategyDraftChangeHistory(comparison);
  const riskImpactPreview = buildTradingLabStrategyRiskImpactPreview();

  assert.equal(history.storageMode, "static_in_memory_placeholder_only");
  assert.ok(history.changes.length >= 1);
  assert.equal(history.changes.every((change) => change.redacted === true), true);
  assert.equal(history.persistentStorageUsed, false);
  assert.equal(history.dbWriteUsed, false);
  assert.equal(riskImpactPreview.dataSource, "mock_ledger_calculation_result");
  assert.equal(riskImpactPreview.providerCallsAllowed, false);
  assert.equal(riskImpactPreview.orderSubmissionAllowed, false);
  assert.equal(riskImpactPreview.networkCallAttempted, false);
  assert.equal(riskImpactPreview.persistentStorageUsed, false);
  assert.equal(riskImpactPreview.dbWriteUsed, false);
});

test("Step 135 review gate blocks unsafe draft modes and never promotes readiness", () => {
  const unsafeDraft = buildTradingLabStrategyConfigDraft({
    mode: "live_order_submit",
    allowedSymbols: ["*"],
    targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
  });
  const validation = validateTradingLabStrategyConfigDraft({ ...unsafeDraft, mode: "live_order_submit", allowedSymbols: ["*"] });
  const gate = buildTradingLabStrategyDraftReviewGate({ strategyDraft: unsafeDraft, validation });

  assert.equal(gate.status, "blocked");
  assert.ok(gate.blockers.includes("unsupported_or_live_strategy_mode"));
  assert.ok(gate.blockers.includes("live_or_order_submission_mode_rejected"));
  assert.equal(gate.providerCallsAllowed, false);
  assert.equal(gate.orderSubmissionAllowed, false);
  assert.equal(gate.readyForReadOnlyProviderCalls, false);
  assert.equal(gate.readyForOrderSubmission, false);
  assert.equal(gate.readyForLiveGuardedTrading, false);
  assert.equal(gate.readinessPromoted, false);
  assert.equal(gate.redactedReviewResult.redacted, true);
  assert.equal(gate.redactedReviewResult.providerPayloadStored, false);
  assert.equal(gate.redactedReviewResult.rawProviderResponseStored, false);
});

test("Step 135 admin review status and dashboard integration remain admin-only fail-closed", () => {
  const reviewStatus = buildAdminTradingLabStrategyDraftReviewStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ reviewStatus, dashboard });

  assert.equal(reviewStatus.status, "admin_only_strategy_draft_review_gate_fail_closed");
  assert.equal(reviewStatus.boundaries.adminOnly, true);
  assert.equal(reviewStatus.boundaries.publicDashboardExposed, false);
  assert.equal(reviewStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(reviewStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(reviewStatus.providerCallsAllowed, false);
  assert.equal(reviewStatus.orderSubmissionAllowed, false);
  assert.equal(reviewStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(reviewStatus.readyForOrderSubmission, false);
  assert.equal(reviewStatus.readyForLiveGuardedTrading, false);
  assert.equal(reviewStatus.persistentStorageUsed, false);
  assert.equal(reviewStatus.dbWriteUsed, false);
  assert.equal(dashboard.strategyDraftReviewStatus.step, "Step 135: Admin trading lab strategy draft comparison review gate");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 136 review result can record a redacted mock receipt without opening readiness", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 1000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const validation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const reviewResultValidation = validateTradingLabStrategyDraftReviewResult({ strategyDraft, validation });
  const reviewResult = buildTradingLabStrategyDraftReviewResult({ strategyDraft, reviewResultValidation });
  const receipt = buildTradingLabStrategyDraftReviewReceipt(reviewResult);
  const recordingGate = buildTradingLabStrategyDraftReviewResultRecordingGate({ strategyDraft, validation });
  const serialized = JSON.stringify({ reviewResult, receipt, recordingGate });

  assert.equal(reviewResultValidation.reviewStatus, "recorded");
  assert.equal(reviewResult.decision, "mock_review_recorded");
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.readinessImpact, "none");
  assert.equal(receipt.providerCallImpact, "blocked");
  assert.equal(receipt.orderSubmissionImpact, "blocked");
  assert.equal(recordingGate.storageMode, "in_memory_placeholder_only");
  assert.equal(recordingGate.mockHistory.length, 1);
  assert.equal(recordingGate.providerCallsAllowed, false);
  assert.equal(recordingGate.orderSubmissionAllowed, false);
  assert.equal(recordingGate.readyForReadOnlyProviderCalls, false);
  assert.equal(recordingGate.readyForOrderSubmission, false);
  assert.equal(recordingGate.readyForLiveGuardedTrading, false);
  assert.equal(recordingGate.persistentStorageUsed, false);
  assert.equal(recordingGate.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 136 review result rejects unsafe private or payload-shaped input", () => {
  const reviewResultValidation = validateTradingLabStrategyDraftReviewResult({
    reviewResultInput: {
      credential: "APP_SECRET_SHOULD_NOT_BE_RECORDED",
    },
  });
  const blockerSummary = buildTradingLabStrategyDraftReviewBlockerSummary(reviewResultValidation);

  assert.equal(reviewResultValidation.reviewStatus, "blocked");
  assert.ok(reviewResultValidation.blockers.includes("unsafe_private_or_payload_value_rejected"));
  assert.equal(blockerSummary.redacted, true);
  assert.equal(blockerSummary.providerCallImpact, "blocked");
  assert.equal(blockerSummary.orderSubmissionImpact, "blocked");
  assert.equal(blockerSummary.persistentStorageUsed, false);
  assert.equal(blockerSummary.dbWriteUsed, false);
});

test("Step 136 review result keeps unsafe live and wildcard drafts blocked", () => {
  const unsafeDraft = buildTradingLabStrategyConfigDraft({
    mode: "live_order_submit",
    allowedSymbols: ["*"],
    targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
  });
  const validation = validateTradingLabStrategyConfigDraft({ ...unsafeDraft, mode: "live_order_submit", allowedSymbols: ["*"] });
  const reviewResultValidation = validateTradingLabStrategyDraftReviewResult({ strategyDraft: unsafeDraft, validation });

  assert.equal(reviewResultValidation.reviewStatus, "blocked");
  assert.ok(reviewResultValidation.blockers.includes("unsupported_or_live_strategy_mode"));
  assert.ok(reviewResultValidation.blockers.includes("live_or_order_submission_mode_rejected"));
  assert.ok(reviewResultValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(reviewResultValidation.providerCallsAllowed, false);
  assert.equal(reviewResultValidation.orderSubmissionAllowed, false);
  assert.equal(reviewResultValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(reviewResultValidation.readyForOrderSubmission, false);
  assert.equal(reviewResultValidation.readyForLiveGuardedTrading, false);
});

test("Step 136 admin review result status and dashboard integration remain admin-only fail-closed", () => {
  const reviewResultStatus = buildAdminTradingLabStrategyDraftReviewResultStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ reviewResultStatus, dashboard });

  assert.equal(reviewResultStatus.status, "admin_only_strategy_draft_review_result_recording_gate_fail_closed");
  assert.equal(reviewResultStatus.boundaries.adminOnly, true);
  assert.equal(reviewResultStatus.boundaries.publicDashboardExposed, false);
  assert.equal(reviewResultStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(reviewResultStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(reviewResultStatus.providerCallsAllowed, false);
  assert.equal(reviewResultStatus.orderSubmissionAllowed, false);
  assert.equal(reviewResultStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(reviewResultStatus.readyForOrderSubmission, false);
  assert.equal(reviewResultStatus.readyForLiveGuardedTrading, false);
  assert.equal(reviewResultStatus.persistentStorageUsed, false);
  assert.equal(reviewResultStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.strategyDraftReviewStatus.step, "Step 135: Admin trading lab strategy draft comparison review gate");
  assert.equal(dashboard.strategyDraftReviewResultStatus.step, "Step 136: Admin trading lab strategy draft review result recording gate");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 137 clearance preflight can produce a mock-only candidate without creating orders", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 1000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const validation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const reviewResultStatus = buildAdminTradingLabStrategyDraftReviewResultStatus({ strategyDraft, validation });
  const clearanceValidation = validateTradingLabStrategyDraftClearancePreflight({ strategyDraft, validation, reviewResultStatus });
  const candidate = buildTradingLabStrategyDraftClearanceCandidate({ strategyDraft, clearanceValidation });
  const result = buildTradingLabStrategyDraftClearancePreflightResult({ strategyDraft, clearanceValidation, candidate });
  const preflight = buildTradingLabStrategyDraftClearancePreflight({ strategyDraft, validation, reviewResultStatus, clearanceValidation, candidate, result });
  const blockerSummary = buildTradingLabStrategyDraftClearanceBlockerSummary(clearanceValidation);
  const serialized = JSON.stringify({ clearanceValidation, candidate, result, preflight, blockerSummary });

  assert.equal(clearanceValidation.clearanceStatus, "mock_only_clearance_candidate");
  assert.equal(candidate.status, "candidate");
  assert.equal(candidate.scope, "mock_only");
  assert.equal(candidate.orderCandidateCreated, false);
  assert.equal(candidate.orderDraftCreated, false);
  assert.equal(result.nextAllowedStep, "mock_review_only");
  assert.equal(result.providerCallsAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.readyForReadOnlyProviderCalls, false);
  assert.equal(preflight.readyForOrderSubmission, false);
  assert.equal(preflight.readyForLiveGuardedTrading, false);
  assert.equal(preflight.persistentStorageUsed, false);
  assert.equal(preflight.dbWriteUsed, false);
  assert.equal(blockerSummary.providerCallImpact, "blocked");
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("orderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("orderDraftCreated\":true"), false);
});

test("Step 137 clearance preflight blocks missing or unsafe review receipts", () => {
  const missingReceiptValidation = validateTradingLabStrategyDraftClearancePreflight({
    reviewResultStatus: {
      reviewResult: {
        reviewResultId: "review_without_receipt",
        reviewStatus: "recorded",
        blockers: [],
        warnings: [],
      },
    },
  });
  const unsafeReceiptValidation = validateTradingLabStrategyDraftClearancePreflight({
    reviewResultStatus: {
      reviewResult: {
        reviewResultId: "review_with_unsafe_receipt",
        reviewStatus: "recorded",
        blockers: [],
        warnings: [],
      },
      receipt: {
        receiptId: "unsafe_receipt",
        reviewStatus: "recorded",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
    },
  });

  assert.equal(missingReceiptValidation.clearanceStatus, "blocked");
  assert.ok(missingReceiptValidation.blockers.includes("review_receipt_missing"));
  assert.equal(unsafeReceiptValidation.clearanceStatus, "blocked");
  assert.ok(unsafeReceiptValidation.blockers.includes("review_receipt_not_redacted"));
  assert.equal(unsafeReceiptValidation.providerCallsAllowed, false);
  assert.equal(unsafeReceiptValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeReceiptValidation.readyForLiveGuardedTrading, false);
});

test("Step 137 clearance preflight keeps unsafe live and wildcard drafts blocked", () => {
  const unsafeDraft = buildTradingLabStrategyConfigDraft({
    mode: "live_order_submit",
    allowedSymbols: ["*"],
    targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
  });
  const validation = validateTradingLabStrategyConfigDraft({ ...unsafeDraft, mode: "live_order_submit", allowedSymbols: ["*"] });
  const clearanceValidation = validateTradingLabStrategyDraftClearancePreflight({ strategyDraft: unsafeDraft, validation });
  const candidate = buildTradingLabStrategyDraftClearanceCandidate({ strategyDraft: unsafeDraft, clearanceValidation });

  assert.equal(clearanceValidation.clearanceStatus, "blocked");
  assert.ok(clearanceValidation.blockers.includes("unsupported_or_live_strategy_mode"));
  assert.ok(clearanceValidation.blockers.includes("live_or_order_submission_mode_rejected"));
  assert.ok(clearanceValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(candidate.status, "blocked");
  assert.equal(candidate.orderCandidateCreated, false);
  assert.equal(candidate.orderDraftCreated, false);
  assert.equal(clearanceValidation.providerCallsAllowed, false);
  assert.equal(clearanceValidation.orderSubmissionAllowed, false);
  assert.equal(clearanceValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(clearanceValidation.readyForOrderSubmission, false);
  assert.equal(clearanceValidation.readyForLiveGuardedTrading, false);
});

test("Step 137 admin clearance status and dashboard integration remain admin-only fail-closed", () => {
  const clearanceStatus = buildAdminTradingLabStrategyDraftClearancePreflightStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ clearanceStatus, dashboard });

  assert.equal(clearanceStatus.status, "admin_only_strategy_draft_clearance_preflight_fail_closed");
  assert.equal(clearanceStatus.boundaries.adminOnly, true);
  assert.equal(clearanceStatus.boundaries.publicDashboardExposed, false);
  assert.equal(clearanceStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(clearanceStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(clearanceStatus.providerCallsAllowed, false);
  assert.equal(clearanceStatus.orderSubmissionAllowed, false);
  assert.equal(clearanceStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(clearanceStatus.readyForOrderSubmission, false);
  assert.equal(clearanceStatus.readyForLiveGuardedTrading, false);
  assert.equal(clearanceStatus.persistentStorageUsed, false);
  assert.equal(clearanceStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.strategyDraftReviewResultStatus.step, "Step 136: Admin trading lab strategy draft review result recording gate");
  assert.equal(dashboard.strategyDraftClearancePreflightStatus.step, "Step 137: Admin trading lab strategy draft clearance preflight");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("orderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("orderDraftCreated\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 138 clearance review result records a redacted mock receipt without opening gates", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 1000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const validation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const clearanceReviewValidation = validateTradingLabStrategyDraftClearanceReviewResult({ strategyDraft, validation });
  const reviewResult = buildTradingLabStrategyDraftClearanceReviewResult({ strategyDraft, validation, clearanceReviewValidation });
  const receipt = buildTradingLabStrategyDraftClearanceReviewReceipt(reviewResult);
  const recordingGate = buildTradingLabStrategyDraftClearanceReviewResultRecordingGate({ strategyDraft, validation, clearanceReviewValidation, reviewResult, receipt });
  const blockerSummary = buildTradingLabStrategyDraftClearanceReviewBlockerSummary(clearanceReviewValidation);
  const decisionSummary = buildTradingLabStrategyDraftClearanceReviewDecisionSummary(reviewResult);
  const serialized = JSON.stringify({ clearanceReviewValidation, reviewResult, receipt, recordingGate, blockerSummary, decisionSummary });

  assert.equal(clearanceReviewValidation.reviewStatus, "recorded");
  assert.equal(reviewResult.decision, "mock_clearance_review_recorded");
  assert.equal(reviewResult.redacted, true);
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.nextAllowedStep, "mock_review_only");
  assert.equal(recordingGate.storageMode, "in_memory_placeholder_only");
  assert.equal(recordingGate.mockHistory.length, 1);
  assert.equal(recordingGate.providerCallsAllowed, false);
  assert.equal(recordingGate.orderSubmissionAllowed, false);
  assert.equal(recordingGate.readyForReadOnlyProviderCalls, false);
  assert.equal(recordingGate.readyForOrderSubmission, false);
  assert.equal(recordingGate.readyForLiveGuardedTrading, false);
  assert.equal(recordingGate.orderCandidateCreated, false);
  assert.equal(recordingGate.orderDraftCreated, false);
  assert.equal(recordingGate.persistentStorageUsed, false);
  assert.equal(recordingGate.dbWriteUsed, false);
  assert.equal(blockerSummary.providerCallImpact, "blocked");
  assert.equal(decisionSummary.readinessImpact, "none");
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("orderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("orderDraftCreated\":true"), false);
});

test("Step 138 clearance review result depends on a safe redacted clearance preflight", () => {
  const missingPreflightValidation = validateTradingLabStrategyDraftClearanceReviewResult({
    clearancePreflightStatus: {
      blockerSummary: { blockers: [], warnings: [] },
    },
  });
  const unsafePreflightValidation = validateTradingLabStrategyDraftClearanceReviewResult({
    clearancePreflightStatus: {
      result: {
        clearancePreflightId: "unsafe_clearance_preflight",
        candidateId: "unsafe_candidate",
        strategyDraftId: "unsafe_strategy",
        reviewResultId: "unsafe_review",
        receiptId: "unsafe_receipt",
        clearanceStatus: "mock_only_clearance_candidate",
        clearanceScope: "live_order",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      candidate: {
        candidateId: "unsafe_candidate",
        scope: "mock_only",
        status: "candidate",
        orderCandidateCreated: false,
        orderDraftCreated: false,
      },
      blockerSummary: { blockers: [], warnings: [] },
    },
  });

  assert.equal(missingPreflightValidation.reviewStatus, "blocked");
  assert.ok(missingPreflightValidation.blockers.includes("clearance_preflight_missing"));
  assert.equal(unsafePreflightValidation.reviewStatus, "blocked");
  assert.ok(unsafePreflightValidation.blockers.includes("clearance_preflight_not_redacted"));
  assert.ok(unsafePreflightValidation.blockers.includes("clearance_scope_not_mock_only"));
  assert.equal(unsafePreflightValidation.providerCallsAllowed, false);
  assert.equal(unsafePreflightValidation.orderSubmissionAllowed, false);
  assert.equal(unsafePreflightValidation.readyForLiveGuardedTrading, false);
});

test("Step 138 clearance review result keeps unsafe live, wildcard, and residual drafts blocked or validation-required", () => {
  const unsafeDraft = buildTradingLabStrategyConfigDraft({
    mode: "live_order_submit",
    allowedSymbols: ["*"],
    targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
  });
  const unsafeValidation = validateTradingLabStrategyConfigDraft({ ...unsafeDraft, mode: "live_order_submit", allowedSymbols: ["*"] });
  const unsafeReviewValidation = validateTradingLabStrategyDraftClearanceReviewResult({ strategyDraft: unsafeDraft, validation: unsafeValidation });
  const residualDraft = buildTradingLabStrategyConfigDraft({
    allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER"],
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 50 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 1000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const residualValidation = validateTradingLabStrategyConfigDraft(residualDraft);
  const residualReviewValidation = validateTradingLabStrategyDraftClearanceReviewResult({ strategyDraft: residualDraft, validation: residualValidation });

  assert.equal(unsafeReviewValidation.reviewStatus, "blocked");
  assert.ok(unsafeReviewValidation.blockers.includes("unsupported_or_live_strategy_mode"));
  assert.ok(unsafeReviewValidation.blockers.includes("live_or_order_submission_mode_rejected"));
  assert.ok(unsafeReviewValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(residualReviewValidation.reviewStatus, "validation_required");
  assert.ok(residualReviewValidation.warnings.includes("target_weight_residual_review_required"));
  assert.equal(residualReviewValidation.providerCallsAllowed, false);
  assert.equal(residualReviewValidation.orderSubmissionAllowed, false);
  assert.equal(residualReviewValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(residualReviewValidation.readyForOrderSubmission, false);
  assert.equal(residualReviewValidation.readyForLiveGuardedTrading, false);
});

test("Step 138 admin clearance review result status and dashboard integration remain admin-only fail-closed", () => {
  const clearanceReviewStatus = buildAdminTradingLabStrategyDraftClearanceReviewResultStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ clearanceReviewStatus, dashboard });

  assert.equal(clearanceReviewStatus.status, "admin_only_strategy_draft_clearance_review_result_recording_gate_fail_closed");
  assert.equal(clearanceReviewStatus.boundaries.adminOnly, true);
  assert.equal(clearanceReviewStatus.boundaries.publicDashboardExposed, false);
  assert.equal(clearanceReviewStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(clearanceReviewStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(clearanceReviewStatus.providerCallsAllowed, false);
  assert.equal(clearanceReviewStatus.orderSubmissionAllowed, false);
  assert.equal(clearanceReviewStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(clearanceReviewStatus.readyForOrderSubmission, false);
  assert.equal(clearanceReviewStatus.readyForLiveGuardedTrading, false);
  assert.equal(clearanceReviewStatus.orderCandidateCreated, false);
  assert.equal(clearanceReviewStatus.orderDraftCreated, false);
  assert.equal(clearanceReviewStatus.persistentStorageUsed, false);
  assert.equal(clearanceReviewStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.strategyDraftReviewResultStatus.step, "Step 136: Admin trading lab strategy draft review result recording gate");
  assert.equal(dashboard.strategyDraftClearancePreflightStatus.step, "Step 137: Admin trading lab strategy draft clearance preflight");
  assert.equal(dashboard.strategyDraftClearanceReviewResultStatus.step, "Step 138: Admin trading lab strategy draft clearance review result recording gate");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("orderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("orderDraftCreated\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 139 mock run candidate preflight builds a mock-only candidate without creating order artifacts", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 1000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const validation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const universeSnapshot = buildTradingLabMockRunUniverseSnapshot({ strategyDraft });
  const initialCapital = buildTradingLabMockRunInitialCapital();
  const inputBundle = buildTradingLabMockRunInputBundle({ strategyDraft, validation, universeSnapshot, initialCapital });
  const readiness = validateTradingLabMockRunCandidatePreflight({ strategyDraft, validation, universeSnapshot, initialCapital, inputBundle });
  const candidate = buildTradingLabMockRunCandidate({ strategyDraft, inputBundle, readiness });
  const result = buildTradingLabMockRunPreflightResult({ readiness });
  const preflight = buildTradingLabMockRunCandidatePreflight({ strategyDraft, validation, universeSnapshot, initialCapital, inputBundle, readiness, candidate, result });
  const serialized = JSON.stringify({ universeSnapshot, initialCapital, inputBundle, readiness, candidate, result, preflight });

  assert.equal(readiness.status, "mock_run_candidate");
  assert.equal(readiness.dependencyStatus, "ready");
  assert.equal(candidate.status, "mock_run_candidate");
  assert.equal(candidate.scope, "mock_only");
  assert.equal(candidate.orderCandidateCreated, false);
  assert.equal(candidate.orderDraftCreated, false);
  assert.equal(candidate.executionCreated, false);
  assert.equal(candidate.accountBalanceQueried, false);
  assert.equal(result.nextAllowedStep, "mock_order_generation_preflight");
  assert.equal(result.providerCallsAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.readyForReadOnlyProviderCalls, false);
  assert.equal(preflight.readyForOrderSubmission, false);
  assert.equal(preflight.readyForLiveGuardedTrading, false);
  assert.equal(preflight.persistentStorageUsed, false);
  assert.equal(preflight.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("orderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("orderDraftCreated\":true"), false);
  assert.equal(serialized.includes("executionCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 139 mock run candidate preflight blocks unsafe or unredacted clearance review results", () => {
  const missingReviewValidation = validateTradingLabMockRunCandidatePreflight({
    clearanceReviewResultStatus: {
      blockerSummary: { blockers: [], warnings: [] },
    },
  });
  const unsafeReviewValidation = validateTradingLabMockRunCandidatePreflight({
    clearanceReviewResultStatus: {
      reviewResult: {
        clearanceReviewResultId: "unsafe_clearance_review_result",
        reviewStatus: "recorded",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      receipt: {
        receiptId: "unsafe_clearance_review_receipt",
        redacted: true,
      },
      blockerSummary: { blockers: [], warnings: [] },
    },
  });

  assert.equal(missingReviewValidation.status, "blocked");
  assert.ok(missingReviewValidation.blockers.includes("clearance_review_result_missing"));
  assert.equal(unsafeReviewValidation.status, "blocked");
  assert.ok(unsafeReviewValidation.blockers.includes("clearance_review_result_not_redacted"));
  assert.equal(unsafeReviewValidation.providerCallsAllowed, false);
  assert.equal(unsafeReviewValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeReviewValidation.readyForLiveGuardedTrading, false);
});

test("Step 139 mock run candidate preflight keeps live, wildcard, residual, and price dependency issues closed", () => {
  const unsafeDraft = buildTradingLabStrategyConfigDraft({
    mode: "live_order_submit",
    allowedSymbols: ["*"],
    targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
  });
  const unsafeValidation = validateTradingLabStrategyConfigDraft({ ...unsafeDraft, mode: "live_order_submit", allowedSymbols: ["*"] });
  const unsafeReadiness = validateTradingLabMockRunCandidatePreflight({ strategyDraft: unsafeDraft, validation: unsafeValidation });
  const residualDraft = buildTradingLabStrategyConfigDraft({
    allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER"],
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 50 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 1000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const residualValidation = validateTradingLabStrategyConfigDraft(residualDraft);
  const residualReadiness = validateTradingLabMockRunCandidatePreflight({ strategyDraft: residualDraft, validation: residualValidation });
  const missingPriceSeriesReadiness = validateTradingLabMockRunCandidatePreflight({
    strategyDraft: buildTradingLabStrategyConfigDraft({
      targetWeights: [
        { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
        { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
        { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
      ],
      riskLimits: {
        maxOrderAmount: 1000,
        maxDailyLossPct: 1,
        maxPositionWeightPct: 60,
      },
    }),
    mockPriceSeriesAvailable: false,
  });

  assert.equal(unsafeReadiness.status, "blocked");
  assert.ok(unsafeReadiness.blockers.includes("unsupported_or_live_strategy_mode"));
  assert.ok(unsafeReadiness.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(residualReadiness.status, "validation_required");
  assert.ok(residualReadiness.warnings.includes("target_weight_residual_review_required"));
  assert.equal(missingPriceSeriesReadiness.status, "validation_required");
  assert.ok(missingPriceSeriesReadiness.warnings.includes("mock_price_series_dependency_validation_required"));
  assert.equal(missingPriceSeriesReadiness.providerCallsAllowed, false);
  assert.equal(missingPriceSeriesReadiness.orderSubmissionAllowed, false);
  assert.equal(missingPriceSeriesReadiness.readyForReadOnlyProviderCalls, false);
  assert.equal(missingPriceSeriesReadiness.readyForOrderSubmission, false);
  assert.equal(missingPriceSeriesReadiness.readyForLiveGuardedTrading, false);
});

test("Step 139 admin mock run candidate status and dashboard integration remain admin-only fail-closed", () => {
  const mockRunStatus = buildAdminTradingLabMockRunCandidatePreflightStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockRunStatus, dashboard });

  assert.equal(mockRunStatus.status, "admin_only_trading_lab_mock_run_candidate_preflight_fail_closed");
  assert.equal(mockRunStatus.boundaries.adminOnly, true);
  assert.equal(mockRunStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockRunStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockRunStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockRunStatus.providerCallsAllowed, false);
  assert.equal(mockRunStatus.orderSubmissionAllowed, false);
  assert.equal(mockRunStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockRunStatus.readyForOrderSubmission, false);
  assert.equal(mockRunStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockRunStatus.orderCandidateCreated, false);
  assert.equal(mockRunStatus.orderDraftCreated, false);
  assert.equal(mockRunStatus.executionCreated, false);
  assert.equal(mockRunStatus.accountBalanceQueried, false);
  assert.equal(mockRunStatus.persistentStorageUsed, false);
  assert.equal(mockRunStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.strategyDraftClearanceReviewResultStatus.step, "Step 138: Admin trading lab strategy draft clearance review result recording gate");
  assert.equal(dashboard.mockRunCandidatePreflightStatus.step, "Step 139: Admin trading lab mock run candidate preflight");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("orderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("orderDraftCreated\":true"), false);
  assert.equal(serialized.includes("executionCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});

test("Step 140 mock order generation preflight builds redacted mock-only intents without actual order artifacts", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 200000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const validation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRunCandidatePreflightStatus = buildAdminTradingLabMockRunCandidatePreflightStatus({
    strategyDraft,
    validation,
    initialCapitalPlaceholder: 100000,
    cashPlaceholder: 100000,
  });
  const inputBundle = mockRunCandidatePreflightStatus.inputBundle;
  const deltas = buildTradingLabMockRebalanceDeltas({ inputBundle });
  const allocationGapSummary = buildTradingLabMockTargetAllocationGapSummary(deltas);
  const signals = buildTradingLabMockBuySellSignalPlaceholders(deltas);
  const mockOrderIntents = buildTradingLabMockOrderIntents({ mockRunCandidate: mockRunCandidatePreflightStatus.candidate, inputBundle, deltas });
  const riskGuard = buildTradingLabMockOrderGenerationRiskGuardPreflight({ inputBundle, mockOrderIntents });
  const mockOrderGenerationValidation = validateTradingLabMockOrderGenerationPreflight({
    mockRunCandidatePreflightStatus,
    inputBundle,
    deltas,
    allocationGapSummary,
    mockOrderIntents,
    riskGuard,
  });
  const result = buildTradingLabMockOrderGenerationPreflightResult({ mockOrderGenerationValidation });
  const preflight = buildTradingLabMockOrderGenerationPreflight({
    mockRunCandidatePreflightStatus,
    inputBundle,
    deltas,
    allocationGapSummary,
    signals,
    mockOrderIntents,
    riskGuard,
    mockOrderGenerationValidation,
    result,
  });
  const serialized = JSON.stringify({ deltas, allocationGapSummary, signals, mockOrderIntents, riskGuard, mockOrderGenerationValidation, result, preflight });

  assert.equal(mockOrderGenerationValidation.status, "mock_order_generation_candidate");
  assert.equal(result.status, "mock_order_generation_candidate");
  assert.equal(result.scope, "mock_only");
  assert.equal(result.nextAllowedStep, "mock_order_generation_review");
  assert.ok(mockOrderIntents.length > 0);
  assert.equal(mockOrderIntents.every((intent) => intent.status === "mock_only"), true);
  assert.equal(mockOrderIntents.every((intent) => intent.actualOrderCandidateCreated === false), true);
  assert.equal(mockOrderIntents.every((intent) => intent.actualOrderDraftCreated === false), true);
  assert.equal(mockOrderIntents.every((intent) => intent.kisOrderPayloadCreated === false), true);
  assert.equal(mockOrderIntents.every((intent) => intent.fillCreated === false), true);
  assert.equal(mockOrderIntents.every((intent) => intent.accountBalanceQueried === false), true);
  assert.equal(riskGuard.status, "mock_only");
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.readyForReadOnlyProviderCalls, false);
  assert.equal(preflight.readyForOrderSubmission, false);
  assert.equal(preflight.readyForLiveGuardedTrading, false);
  assert.equal(preflight.persistentStorageUsed, false);
  assert.equal(preflight.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 140 mock order generation preflight depends on Step139 mock run candidate safety", () => {
  const missingCandidateValidation = validateTradingLabMockOrderGenerationPreflight({
    mockRunCandidatePreflightStatus: {
      blockerSummary: { blockers: [], warnings: [] },
    },
  });
  const unsafeCandidateValidation = validateTradingLabMockOrderGenerationPreflight({
    mockRunCandidatePreflightStatus: {
      candidate: {
        candidateId: "unsafe_mock_run_candidate",
        status: "mock_run_candidate",
        scope: "mock_only",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      inputBundle: {
        inputBundleId: "unsafe_input_bundle",
        strategyDraftId: "unsafe_strategy",
        scope: "mock_only",
        mode: "mock",
        redacted: true,
        symbols: ["SYMBOL_A_PLACEHOLDER"],
        targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
        riskLimits: { maxOrderAmount: 200000, maxDailyLossPct: 1, maxPositionWeightPct: 60, killSwitchRequired: true, riskGateRequired: true },
        priceSeriesStatus: "available",
      },
      blockerSummary: { blockers: [], warnings: [] },
    },
  });

  assert.equal(missingCandidateValidation.status, "blocked");
  assert.ok(missingCandidateValidation.blockers.includes("mock_run_candidate_missing"));
  assert.ok(missingCandidateValidation.blockers.includes("mock_run_input_bundle_missing"));
  assert.equal(unsafeCandidateValidation.status, "blocked");
  assert.ok(unsafeCandidateValidation.blockers.includes("mock_run_candidate_not_redacted"));
  assert.equal(unsafeCandidateValidation.providerCallsAllowed, false);
  assert.equal(unsafeCandidateValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeCandidateValidation.readyForLiveGuardedTrading, false);
});

test("Step 140 mock order generation preflight keeps unsafe strategy and missing dependencies closed", () => {
  const unsafeDraft = buildTradingLabStrategyConfigDraft({
    mode: "live_order_submit",
    allowedSymbols: ["*"],
    targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
  });
  const unsafeValidation = validateTradingLabStrategyConfigDraft({ ...unsafeDraft, mode: "live_order_submit", allowedSymbols: ["*"] });
  const unsafeOrderValidation = validateTradingLabMockOrderGenerationPreflight({ strategyDraft: unsafeDraft, validation: unsafeValidation });
  const residualDraft = buildTradingLabStrategyConfigDraft({
    allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER"],
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 50 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 200000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const residualValidation = validateTradingLabStrategyConfigDraft(residualDraft);
  const residualOrderValidation = validateTradingLabMockOrderGenerationPreflight({ strategyDraft: residualDraft, validation: residualValidation });
  const missingPriceSeriesValidation = validateTradingLabMockOrderGenerationPreflight({
    strategyDraft: buildTradingLabStrategyConfigDraft({
      targetWeights: [
        { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
        { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
        { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
      ],
      riskLimits: {
        maxOrderAmount: 200000,
        maxDailyLossPct: 1,
        maxPositionWeightPct: 60,
      },
    }),
    mockPriceSeriesAvailable: false,
  });
  const missingAllocationValidation = validateTradingLabMockOrderGenerationPreflight({
    strategyDraft: buildTradingLabStrategyConfigDraft({
      targetWeights: [
        { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
        { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
        { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
      ],
      riskLimits: {
        maxOrderAmount: 200000,
        maxDailyLossPct: 1,
        maxPositionWeightPct: 60,
      },
    }),
    mockAllocationAvailable: false,
  });

  assert.equal(unsafeOrderValidation.status, "blocked");
  assert.ok(unsafeOrderValidation.blockers.includes("unsupported_or_live_strategy_mode"));
  assert.ok(unsafeOrderValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(residualOrderValidation.status, "validation_required");
  assert.ok(residualOrderValidation.warnings.includes("target_weight_residual_review_required"));
  assert.equal(missingPriceSeriesValidation.status, "validation_required");
  assert.ok(missingPriceSeriesValidation.warnings.includes("mock_price_series_dependency_validation_required"));
  assert.equal(missingAllocationValidation.status, "validation_required");
  assert.ok(missingAllocationValidation.warnings.includes("mock_allocation_dependency_validation_required"));
  assert.equal(missingAllocationValidation.providerCallsAllowed, false);
  assert.equal(missingAllocationValidation.orderSubmissionAllowed, false);
  assert.equal(missingAllocationValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(missingAllocationValidation.readyForOrderSubmission, false);
  assert.equal(missingAllocationValidation.readyForLiveGuardedTrading, false);
});

test("Step 140 risk guard blocks unsafe mock order intent without opening provider or order gates", () => {
  const unsafeRiskGuard = buildTradingLabMockOrderGenerationRiskGuardPreflight({
    inputBundle: {
      inputBundleId: "risk_guard_input_bundle",
      scope: "mock_only",
      riskLimits: { maxOrderAmount: 100, maxDailyLossPct: 0, maxPositionWeightPct: 0, killSwitchRequired: false, riskGateRequired: false },
      cashPlaceholder: 0,
    },
    mockOrderIntents: [
      {
        mockOrderIntentId: "blocked_mock_intent",
        symbol: "SYMBOL_A_PLACEHOLDER",
        status: "blocked",
        mockEstimatedAmount: 1000,
        actualOrderCandidateCreated: false,
        actualOrderDraftCreated: false,
        kisOrderPayloadCreated: false,
      },
    ],
  });

  assert.equal(unsafeRiskGuard.status, "blocked");
  assert.ok(unsafeRiskGuard.blockers.includes("kill_switch_requirement_missing"));
  assert.ok(unsafeRiskGuard.blockers.includes("risk_gate_requirement_missing"));
  assert.ok(unsafeRiskGuard.blockers.includes("mock_order_intent_blocked"));
  assert.equal(unsafeRiskGuard.providerCallsAllowed, false);
  assert.equal(unsafeRiskGuard.orderSubmissionAllowed, false);
  assert.equal(unsafeRiskGuard.actualOrderCandidateCreated, false);
  assert.equal(unsafeRiskGuard.actualOrderDraftCreated, false);
  assert.equal(unsafeRiskGuard.kisOrderPayloadCreated, false);
});

test("Step 140 admin mock order generation status and dashboard integration remain admin-only fail-closed", () => {
  const mockOrderStatus = buildAdminTradingLabMockOrderGenerationPreflightStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockOrderStatus, dashboard });

  assert.equal(mockOrderStatus.status, "admin_only_trading_lab_mock_order_generation_preflight_fail_closed");
  assert.equal(mockOrderStatus.boundaries.adminOnly, true);
  assert.equal(mockOrderStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockOrderStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockOrderStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockOrderStatus.providerCallsAllowed, false);
  assert.equal(mockOrderStatus.orderSubmissionAllowed, false);
  assert.equal(mockOrderStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockOrderStatus.readyForOrderSubmission, false);
  assert.equal(mockOrderStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockOrderStatus.actualOrderCandidateCreated, false);
  assert.equal(mockOrderStatus.actualOrderDraftCreated, false);
  assert.equal(mockOrderStatus.kisOrderPayloadCreated, false);
  assert.equal(mockOrderStatus.fillCreated, false);
  assert.equal(mockOrderStatus.accountBalanceQueried, false);
  assert.equal(mockOrderStatus.persistentStorageUsed, false);
  assert.equal(mockOrderStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockRunCandidatePreflightStatus.step, "Step 139: Admin trading lab mock run candidate preflight");
  assert.equal(dashboard.mockOrderGenerationPreflightStatus.step, "Step 140: Admin trading lab mock order generation preflight");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
});
test("Step 141 mock order generation review records a redacted receipt without live order artifacts", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 200000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const validation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRunCandidatePreflightStatus = buildAdminTradingLabMockRunCandidatePreflightStatus({ strategyDraft, validation });
  const mockOrderGenerationPreflightStatus = buildAdminTradingLabMockOrderGenerationPreflightStatus({ mockRunCandidatePreflightStatus });
  const intentReviewSummary = buildTradingLabMockOrderIntentReviewSummary({ mockOrderGenerationPreflightStatus });
  const reviewValidation = validateTradingLabMockOrderGenerationReviewResult({ mockOrderGenerationPreflightStatus, intentReviewSummary });
  const decisionSummary = buildTradingLabMockOrderGenerationReviewDecisionSummary({ validation: reviewValidation });
  const reviewResult = buildTradingLabMockOrderGenerationReviewResult({ mockOrderGenerationPreflightStatus, validation: reviewValidation, intentReviewSummary, decisionSummary });
  const receipt = buildTradingLabMockOrderGenerationReviewReceipt({ reviewResult });
  const gate = buildTradingLabMockOrderGenerationReviewResultRecordingGate({ mockOrderGenerationPreflightStatus });
  const serialized = JSON.stringify({ intentReviewSummary, reviewValidation, decisionSummary, reviewResult, receipt, gate });

  assert.equal(reviewValidation.reviewStatus, "recorded");
  assert.equal(reviewValidation.decision, "mock_order_generation_review_recorded");
  assert.equal(intentReviewSummary.status, "mock_only");
  assert.ok(intentReviewSummary.rows.length > 0);
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.reviewStatus, "recorded");
  assert.equal(receipt.nextAllowedStep, "mock_execution_preflight");
  assert.equal(reviewResult.providerCallsAllowed, false);
  assert.equal(reviewResult.orderSubmissionAllowed, false);
  assert.equal(reviewResult.readyForReadOnlyProviderCalls, false);
  assert.equal(reviewResult.readyForOrderSubmission, false);
  assert.equal(reviewResult.readyForLiveGuardedTrading, false);
  assert.equal(reviewResult.actualOrderCandidateCreated, false);
  assert.equal(reviewResult.actualOrderDraftCreated, false);
  assert.equal(reviewResult.kisOrderPayloadCreated, false);
  assert.equal(reviewResult.fillCreated, false);
  assert.equal(reviewResult.accountBalanceQueried, false);
  assert.equal(reviewResult.persistentStorageUsed, false);
  assert.equal(reviewResult.dbWriteUsed, false);
  assert.equal(gate.mockHistory.length, 1);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 141 mock order generation review depends on Step140 preflight redaction and scope", () => {
  const missingPreflight = validateTradingLabMockOrderGenerationReviewResult({
    mockOrderGenerationPreflightStatus: {},
  });
  const nonRedactedPreflight = validateTradingLabMockOrderGenerationReviewResult({
    mockOrderGenerationPreflightStatus: {
      preflight: {
        mockOrderGenerationPreflightId: "unsafe_preflight",
        redacted: false,
        result: {
          mockOrderGenerationPreflightId: "unsafe_preflight",
          mockRunCandidateId: "mock_run",
          inputBundleId: "input_bundle",
          strategyDraftId: "strategy",
          status: "mock_order_generation_candidate",
          scope: "mock_only",
          redacted: false,
          readinessImpact: "none",
          providerCallImpact: "blocked",
          orderSubmissionImpact: "blocked",
          liveTradingImpact: "blocked",
          actualOrderCandidateCreated: false,
          actualOrderDraftCreated: false,
          kisOrderPayloadCreated: false,
        },
      },
      result: {
        mockOrderGenerationPreflightId: "unsafe_preflight",
        mockRunCandidateId: "mock_run",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        status: "mock_order_generation_candidate",
        scope: "mock_only",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
        actualOrderCandidateCreated: false,
        actualOrderDraftCreated: false,
        kisOrderPayloadCreated: false,
      },
      mockOrderIntents: [],
    },
  });

  assert.equal(missingPreflight.reviewStatus, "blocked");
  assert.ok(missingPreflight.blockers.includes("mock_order_generation_preflight_missing"));
  assert.ok(missingPreflight.blockers.includes("mock_order_generation_preflight_result_missing"));
  assert.equal(nonRedactedPreflight.reviewStatus, "blocked");
  assert.ok(nonRedactedPreflight.blockers.includes("mock_order_generation_preflight_not_redacted"));
  assert.ok(nonRedactedPreflight.blockers.includes("mock_order_generation_preflight_result_not_redacted"));
  assert.equal(nonRedactedPreflight.providerCallsAllowed, false);
  assert.equal(nonRedactedPreflight.orderSubmissionAllowed, false);
  assert.equal(nonRedactedPreflight.readyForLiveGuardedTrading, false);
});

test("Step 141 mock order generation review blocks unsafe modes, wildcard symbols, residuals, and risk guard blockers", () => {
  const unsafeReview = validateTradingLabMockOrderGenerationReviewResult({
    mockOrderGenerationPreflightStatus: {
      preflight: {
        mockOrderGenerationPreflightId: "unsafe_preflight",
        inputBundle: { mode: "live_order_submit", symbols: ["*"] },
        riskGuard: { status: "mock_only" },
        result: {
          mockOrderGenerationPreflightId: "unsafe_preflight",
          mockRunCandidateId: "mock_run",
          inputBundleId: "input_bundle",
          strategyDraftId: "strategy",
          status: "mock_order_generation_candidate",
          scope: "mock_only",
          redacted: true,
          readinessImpact: "none",
          providerCallImpact: "blocked",
          orderSubmissionImpact: "blocked",
          liveTradingImpact: "blocked",
          actualOrderCandidateCreated: false,
          actualOrderDraftCreated: false,
          kisOrderPayloadCreated: false,
        },
        validation: { status: "mock_order_generation_candidate", warnings: [] },
        mockOrderIntents: [],
      },
      result: {
        mockOrderGenerationPreflightId: "unsafe_preflight",
        mockRunCandidateId: "mock_run",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        status: "mock_order_generation_candidate",
        scope: "mock_only",
        redacted: true,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
        actualOrderCandidateCreated: false,
        actualOrderDraftCreated: false,
        kisOrderPayloadCreated: false,
      },
      mockOrderIntents: [],
    },
  });
  const residualReview = validateTradingLabMockOrderGenerationReviewResult({
    mockOrderGenerationPreflightStatus: {
      preflight: {
        mockOrderGenerationPreflightId: "residual_preflight",
        inputBundle: { mode: "mock", symbols: ["SYMBOL_A_PLACEHOLDER"] },
        riskGuard: { status: "mock_only" },
        validation: { status: "validation_required", warnings: ["target_weight_residual_review_required"] },
        result: {
          mockOrderGenerationPreflightId: "residual_preflight",
          mockRunCandidateId: "mock_run",
          inputBundleId: "input_bundle",
          strategyDraftId: "strategy",
          status: "validation_required",
          scope: "mock_only",
          redacted: true,
          readinessImpact: "none",
          providerCallImpact: "blocked",
          orderSubmissionImpact: "blocked",
          liveTradingImpact: "blocked",
          actualOrderCandidateCreated: false,
          actualOrderDraftCreated: false,
          kisOrderPayloadCreated: false,
        },
        mockOrderIntents: [],
      },
    },
  });
  const riskBlockedReview = validateTradingLabMockOrderGenerationReviewResult({
    mockOrderGenerationPreflightStatus: buildAdminTradingLabMockOrderGenerationPreflightStatus({
      riskGuard: { status: "blocked", blockers: ["mock_order_intent_blocked"], warnings: [], blockedIntentCount: 1, warningIntentCount: 0 },
    }),
  });

  assert.equal(unsafeReview.reviewStatus, "blocked");
  assert.ok(unsafeReview.blockers.includes("unsafe_live_or_order_mode_rejected"));
  assert.ok(unsafeReview.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(residualReview.reviewStatus, "validation_required");
  assert.ok(residualReview.warnings.includes("target_weight_residual_review_required"));
  assert.equal(riskBlockedReview.reviewStatus, "blocked");
  assert.ok(riskBlockedReview.blockers.includes("mock_order_generation_risk_guard_blocked"));
  assert.equal(riskBlockedReview.providerCallsAllowed, false);
  assert.equal(riskBlockedReview.orderSubmissionAllowed, false);
  assert.equal(riskBlockedReview.readyForReadOnlyProviderCalls, false);
  assert.equal(riskBlockedReview.readyForOrderSubmission, false);
  assert.equal(riskBlockedReview.readyForLiveGuardedTrading, false);
});

test("Step 141 admin mock order generation review status and dashboard integration remain admin-only fail-closed", () => {
  const reviewStatus = buildAdminTradingLabMockOrderGenerationReviewResultStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ reviewStatus, dashboard });

  assert.equal(reviewStatus.status, "admin_only_trading_lab_mock_order_generation_review_result_recording_gate_fail_closed");
  assert.equal(reviewStatus.boundaries.adminOnly, true);
  assert.equal(reviewStatus.boundaries.publicDashboardExposed, false);
  assert.equal(reviewStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(reviewStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(reviewStatus.reviewResult.actualOrderCandidateCreated, false);
  assert.equal(reviewStatus.reviewResult.actualOrderDraftCreated, false);
  assert.equal(reviewStatus.reviewResult.kisOrderPayloadCreated, false);
  assert.equal(reviewStatus.receipt.redacted, true);
  assert.equal(reviewStatus.providerCallsAllowed, false);
  assert.equal(reviewStatus.orderSubmissionAllowed, false);
  assert.equal(reviewStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(reviewStatus.readyForOrderSubmission, false);
  assert.equal(reviewStatus.readyForLiveGuardedTrading, false);
  assert.equal(reviewStatus.persistentStorageUsed, false);
  assert.equal(reviewStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockOrderGenerationPreflightStatus.step, "Step 140: Admin trading lab mock order generation preflight");
  assert.equal(dashboard.mockOrderGenerationReviewResultStatus.step, "Step 141: Admin trading lab mock order generation review result recording gate");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 142 mock execution preflight builds redacted mock-only execution previews without live artifacts", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 200000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const validation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRunCandidatePreflightStatus = buildAdminTradingLabMockRunCandidatePreflightStatus({
    strategyDraft,
    validation,
    initialCapitalPlaceholder: 100000,
    cashPlaceholder: 100000,
  });
  const mockOrderGenerationPreflightStatus = buildAdminTradingLabMockOrderGenerationPreflightStatus({ mockRunCandidatePreflightStatus });
  const mockOrderGenerationReviewResultStatus = buildAdminTradingLabMockOrderGenerationReviewResultStatus({ mockOrderGenerationPreflightStatus });
  const mockExecutionIntents = buildTradingLabMockExecutionIntents({ mockOrderGenerationReviewResultStatus });
  const fillPlans = buildTradingLabMockFillPlanPlaceholders({ mockOrderGenerationReviewResultStatus, mockExecutionIntents });
  const cashImpactPreview = buildTradingLabMockExecutionCashImpactPreview({ mockOrderGenerationReviewResultStatus, mockExecutionIntents });
  const positionImpactPreview = buildTradingLabMockExecutionPositionImpactPreview({ mockOrderGenerationReviewResultStatus, mockExecutionIntents });
  const riskGuard = buildTradingLabMockExecutionRiskGuardPreflight({ mockOrderGenerationReviewResultStatus, mockExecutionIntents, cashImpactPreview });
  const mockExecutionValidation = validateTradingLabMockExecutionPreflight({
    mockOrderGenerationReviewResultStatus,
    mockExecutionIntents,
    fillPlans,
    cashImpactPreview,
    positionImpactPreview,
    riskGuard,
  });
  const result = buildTradingLabMockExecutionPreflightResult({ validation: mockExecutionValidation });
  const preflight = buildTradingLabMockExecutionPreflight({
    mockOrderGenerationReviewResultStatus,
    mockExecutionIntents,
    fillPlans,
    cashImpactPreview,
    positionImpactPreview,
    riskGuard,
    validation: mockExecutionValidation,
    result,
  });
  const serialized = JSON.stringify({ mockExecutionIntents, fillPlans, cashImpactPreview, positionImpactPreview, riskGuard, mockExecutionValidation, result, preflight });

  assert.equal(mockExecutionValidation.status, "mock_execution_candidate");
  assert.equal(result.status, "mock_execution_candidate");
  assert.equal(result.scope, "mock_only");
  assert.equal(result.nextAllowedStep, "mock_execution_review");
  assert.ok(mockExecutionIntents.length > 0);
  assert.equal(mockExecutionIntents.every((intent) => intent.status === "mock_only"), true);
  assert.equal(mockExecutionIntents.every((intent) => intent.actualOrderCandidateCreated === false), true);
  assert.equal(mockExecutionIntents.every((intent) => intent.actualOrderDraftCreated === false), true);
  assert.equal(mockExecutionIntents.every((intent) => intent.kisOrderPayloadCreated === false), true);
  assert.equal(mockExecutionIntents.every((intent) => intent.kisExecutionPayloadCreated === false), true);
  assert.equal(mockExecutionIntents.every((intent) => intent.actualExecutionCreated === false), true);
  assert.equal(mockExecutionIntents.every((intent) => intent.fillCreated === false), true);
  assert.equal(mockExecutionIntents.every((intent) => intent.accountBalanceQueried === false), true);
  assert.equal(fillPlans.every((plan) => plan.mockPriceSource === "static_mock_series"), true);
  assert.equal(fillPlans.every((plan) => plan.networkCallAttempted === false), true);
  assert.equal(cashImpactPreview.accountBalanceQueried, false);
  assert.equal(positionImpactPreview.accountBalanceQueried, false);
  assert.equal(riskGuard.status, "mock_only");
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.readyForReadOnlyProviderCalls, false);
  assert.equal(preflight.readyForOrderSubmission, false);
  assert.equal(preflight.readyForLiveGuardedTrading, false);
  assert.equal(preflight.persistentStorageUsed, false);
  assert.equal(preflight.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 142 mock execution preflight depends on Step141 redacted review result safety", () => {
  const missingReviewValidation = validateTradingLabMockExecutionPreflight({
    mockOrderGenerationReviewResultStatus: {},
  });
  const unsafeReviewValidation = validateTradingLabMockExecutionPreflight({
    mockOrderGenerationReviewResultStatus: {
      reviewResult: {
        mockOrderGenerationReviewResultId: "unsafe_review",
        mockOrderGenerationPreflightId: "preflight",
        mockRunCandidateId: "candidate",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        reviewStatus: "recorded",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
        actualOrderCandidateCreated: false,
        actualOrderDraftCreated: false,
        kisOrderPayloadCreated: false,
      },
      receipt: {
        receiptId: "unsafe_receipt",
        redacted: false,
        nextAllowedStep: "mock_execution_preflight",
      },
      recordingGate: {
        mockOrderGenerationPreflightStatus: {
          preflight: {
            inputBundle: {
              inputBundleId: "input_bundle",
              scope: "mock_only",
              mode: "mock",
              symbols: ["SYMBOL_A_PLACEHOLDER"],
              targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
              riskLimits: { maxOrderAmount: 200000, maxDailyLossPct: 1, maxPositionWeightPct: 60, killSwitchRequired: true, riskGateRequired: true },
              cashPlaceholder: 100000,
              priceSeriesStatus: "available",
            },
          },
        },
      },
    },
  });

  assert.equal(missingReviewValidation.status, "blocked");
  assert.ok(missingReviewValidation.blockers.includes("mock_order_generation_review_result_missing"));
  assert.ok(missingReviewValidation.blockers.includes("mock_order_generation_review_receipt_missing"));
  assert.equal(unsafeReviewValidation.status, "blocked");
  assert.ok(unsafeReviewValidation.blockers.includes("mock_order_generation_review_result_not_redacted"));
  assert.ok(unsafeReviewValidation.blockers.includes("mock_order_generation_review_receipt_not_redacted"));
  assert.equal(unsafeReviewValidation.providerCallsAllowed, false);
  assert.equal(unsafeReviewValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeReviewValidation.readyForLiveGuardedTrading, false);
});

test("Step 142 mock execution preflight keeps unsafe dependencies validation-required or blocked", () => {
  const unsafeExecutionValidation = validateTradingLabMockExecutionPreflight({
    mockOrderGenerationReviewResultStatus: {
      reviewResult: {
        mockOrderGenerationReviewResultId: "unsafe_review",
        mockOrderGenerationPreflightId: "preflight",
        mockRunCandidateId: "candidate",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        reviewStatus: "recorded",
        redacted: true,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      receipt: { receiptId: "receipt", redacted: true, nextAllowedStep: "mock_execution_preflight" },
      recordingGate: {
        mockOrderGenerationPreflightStatus: {
          preflight: {
            inputBundle: {
              inputBundleId: "input_bundle",
              scope: "mock_only",
              mode: "live_order_submit",
              symbols: ["*"],
              targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
              riskLimits: { maxOrderAmount: 200000, maxDailyLossPct: 1, maxPositionWeightPct: 60, killSwitchRequired: true, riskGateRequired: true },
              cashPlaceholder: 100000,
              priceSeriesStatus: "available",
            },
            validation: { warnings: [] },
          },
        },
      },
    },
  });
  const missingDependencyValidation = validateTradingLabMockExecutionPreflight({
    mockOrderGenerationReviewResultStatus: buildAdminTradingLabMockOrderGenerationReviewResultStatus(),
    mockPositionDependencyAvailable: false,
  });
  const riskBlockedValidation = validateTradingLabMockExecutionPreflight({
    mockOrderGenerationReviewResultStatus: buildAdminTradingLabMockOrderGenerationReviewResultStatus(),
    riskGuard: {
      status: "blocked",
      blockedExecutionIntentCount: 1,
      warningExecutionIntentCount: 0,
      blockers: ["mock_execution_intent_blocked"],
      warnings: [],
    },
  });

  assert.equal(unsafeExecutionValidation.status, "blocked");
  assert.ok(unsafeExecutionValidation.blockers.includes("unsafe_live_or_order_mode_rejected"));
  assert.ok(unsafeExecutionValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.equal(missingDependencyValidation.status, "validation_required");
  assert.ok(missingDependencyValidation.warnings.includes("mock_position_dependency_validation_required"));
  assert.equal(riskBlockedValidation.status, "blocked");
  assert.ok(riskBlockedValidation.blockers.includes("mock_execution_risk_guard_blocked"));
  assert.equal(riskBlockedValidation.providerCallsAllowed, false);
  assert.equal(riskBlockedValidation.orderSubmissionAllowed, false);
  assert.equal(riskBlockedValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(riskBlockedValidation.readyForOrderSubmission, false);
  assert.equal(riskBlockedValidation.readyForLiveGuardedTrading, false);
});

test("Step 142 admin mock execution status and dashboard integration remain admin-only fail-closed", () => {
  const mockExecutionStatus = buildAdminTradingLabMockExecutionPreflightStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockExecutionStatus, dashboard });

  assert.equal(mockExecutionStatus.status, "admin_only_trading_lab_mock_execution_preflight_fail_closed");
  assert.equal(mockExecutionStatus.boundaries.adminOnly, true);
  assert.equal(mockExecutionStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockExecutionStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockExecutionStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockExecutionStatus.actualOrderCandidateCreated, false);
  assert.equal(mockExecutionStatus.actualOrderDraftCreated, false);
  assert.equal(mockExecutionStatus.kisOrderPayloadCreated, false);
  assert.equal(mockExecutionStatus.kisExecutionPayloadCreated, false);
  assert.equal(mockExecutionStatus.actualExecutionCreated, false);
  assert.equal(mockExecutionStatus.fillCreated, false);
  assert.equal(mockExecutionStatus.accountBalanceQueried, false);
  assert.equal(mockExecutionStatus.providerCallsAllowed, false);
  assert.equal(mockExecutionStatus.orderSubmissionAllowed, false);
  assert.equal(mockExecutionStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockExecutionStatus.readyForOrderSubmission, false);
  assert.equal(mockExecutionStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockExecutionStatus.persistentStorageUsed, false);
  assert.equal(mockExecutionStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockOrderGenerationReviewResultStatus.step, "Step 141: Admin trading lab mock order generation review result recording gate");
  assert.equal(dashboard.mockExecutionPreflightStatus.step, "Step 142: Admin trading lab mock execution preflight");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 143 mock execution review result records redacted mock-only receipt without live artifacts", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 200000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const strategyValidation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRunCandidatePreflightStatus = buildAdminTradingLabMockRunCandidatePreflightStatus({
    strategyDraft,
    validation: strategyValidation,
    initialCapitalPlaceholder: 100000,
    cashPlaceholder: 100000,
  });
  const mockOrderGenerationPreflightStatus = buildAdminTradingLabMockOrderGenerationPreflightStatus({ mockRunCandidatePreflightStatus });
  const mockOrderGenerationReviewResultStatus = buildAdminTradingLabMockOrderGenerationReviewResultStatus({ mockOrderGenerationPreflightStatus });
  const mockExecutionPreflightStatus = buildAdminTradingLabMockExecutionPreflightStatus({ mockOrderGenerationReviewResultStatus });
  const intentReviewSummary = buildTradingLabMockExecutionIntentReviewSummary({ mockExecutionPreflightStatus });
  const fillPlanReviewSummary = buildTradingLabMockFillPlanReviewSummary({ mockExecutionPreflightStatus });
  const cashImpactReviewSummary = buildTradingLabMockExecutionCashImpactReviewSummary({ mockExecutionPreflightStatus });
  const positionImpactReviewSummary = buildTradingLabMockExecutionPositionImpactReviewSummary({ mockExecutionPreflightStatus });
  const validation = validateTradingLabMockExecutionReviewResult({
    mockExecutionPreflightStatus,
    intentReviewSummary,
    fillPlanReviewSummary,
    cashImpactReviewSummary,
    positionImpactReviewSummary,
  });
  const decisionSummary = buildTradingLabMockExecutionReviewDecisionSummary({ validation });
  const reviewResult = buildTradingLabMockExecutionReviewResult({ validation });
  const receipt = buildTradingLabMockExecutionReviewReceipt({ validation, reviewResult });
  const recordingGate = buildTradingLabMockExecutionReviewResultRecordingGate({
    mockExecutionPreflightStatus,
    intentReviewSummary,
    fillPlanReviewSummary,
    cashImpactReviewSummary,
    positionImpactReviewSummary,
    validation,
    reviewResult,
    receipt,
    decisionSummary,
  });
  const serialized = JSON.stringify({ intentReviewSummary, fillPlanReviewSummary, cashImpactReviewSummary, positionImpactReviewSummary, validation, decisionSummary, reviewResult, receipt, recordingGate });

  assert.equal(mockExecutionPreflightStatus.result.status, "mock_execution_candidate");
  assert.equal(validation.reviewStatus, "recorded");
  assert.equal(validation.decision, "mock_execution_review_recorded");
  assert.equal(reviewResult.reviewStatus, "recorded");
  assert.equal(reviewResult.redacted, true);
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.nextAllowedStep, "mock_fill_simulation_preflight");
  assert.equal(recordingGate.status, "recorded");
  assert.equal(intentReviewSummary.actualExecutionCreated, false);
  assert.equal(fillPlanReviewSummary.providerQuoteQueried, false);
  assert.equal(cashImpactReviewSummary.accountBalanceQueried, false);
  assert.equal(positionImpactReviewSummary.accountBalanceQueried, false);
  assert.equal(recordingGate.providerCallsAllowed, false);
  assert.equal(recordingGate.orderSubmissionAllowed, false);
  assert.equal(recordingGate.readyForReadOnlyProviderCalls, false);
  assert.equal(recordingGate.readyForOrderSubmission, false);
  assert.equal(recordingGate.readyForLiveGuardedTrading, false);
  assert.equal(recordingGate.actualOrderCandidateCreated, false);
  assert.equal(recordingGate.actualOrderDraftCreated, false);
  assert.equal(recordingGate.kisOrderPayloadCreated, false);
  assert.equal(recordingGate.kisExecutionPayloadCreated, false);
  assert.equal(recordingGate.actualExecutionCreated, false);
  assert.equal(recordingGate.fillCreated, false);
  assert.equal(recordingGate.accountBalanceQueried, false);
  assert.equal(recordingGate.persistentStorageUsed, false);
  assert.equal(recordingGate.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 143 mock execution review result depends on Step142 redacted preflight safety", () => {
  const missingPreflightValidation = validateTradingLabMockExecutionReviewResult({
    mockExecutionPreflightStatus: {},
  });
  const unsafePreflightValidation = validateTradingLabMockExecutionReviewResult({
    mockExecutionPreflightStatus: {
      result: {
        mockExecutionPreflightId: "unsafe_preflight",
        mockOrderGenerationReviewResultId: "review",
        mockRunCandidateId: "candidate",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        status: "mock_execution_candidate",
        scope: "mock_only",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      validation: {
        mockOrderGenerationPreflightId: "order_generation_preflight",
      },
      preflight: {
        mockExecutionIntents: [],
        fillPlans: [],
        cashImpactPreview: { status: "mock_only" },
        positionImpactPreview: { status: "mock_only", rows: [] },
        riskGuard: { status: "mock_only" },
      },
    },
  });

  assert.equal(missingPreflightValidation.reviewStatus, "blocked");
  assert.ok(missingPreflightValidation.blockers.includes("mock_execution_preflight_result_missing"));
  assert.equal(unsafePreflightValidation.reviewStatus, "blocked");
  assert.ok(unsafePreflightValidation.blockers.includes("mock_execution_preflight_result_not_redacted"));
  assert.equal(unsafePreflightValidation.providerCallsAllowed, false);
  assert.equal(unsafePreflightValidation.orderSubmissionAllowed, false);
  assert.equal(unsafePreflightValidation.readyForLiveGuardedTrading, false);
});

test("Step 143 mock execution review result blocks unsafe live wildcard and actual execution artifacts", () => {
  const unsafeReviewValidation = validateTradingLabMockExecutionReviewResult({
    mockExecutionPreflightStatus: {
      result: {
        mockExecutionPreflightId: "unsafe_preflight",
        mockOrderGenerationReviewResultId: "review",
        mockRunCandidateId: "candidate",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        status: "mock_execution_candidate",
        scope: "mock_only",
        redacted: true,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
        fillPlanStatus: "mock_only",
        cashImpactStatus: "mock_only",
        positionImpactStatus: "mock_only",
        riskGuardStatus: "mock_only",
      },
      validation: {
        mockOrderGenerationPreflightId: "order_generation_preflight",
        warnings: ["target_weight_residual_review_required"],
      },
      preflight: {
        mockExecutionIntents: [
          {
            mockExecutionIntentId: "intent_1",
            symbol: "SYMBOL_A_PLACEHOLDER",
            side: "mock_buy",
            status: "mock_only",
            actualOrderCandidateCreated: true,
            actualOrderDraftCreated: false,
            kisOrderPayloadCreated: false,
            kisExecutionPayloadCreated: true,
            actualExecutionCreated: true,
            executionRecordCreated: false,
            fillCreated: false,
            accountBalanceQueried: false,
          },
        ],
        fillPlans: [],
        cashImpactPreview: { status: "mock_only" },
        positionImpactPreview: { status: "mock_only", rows: [] },
        riskGuard: { status: "blocked" },
        mockOrderGenerationReviewResultStatus: {
          recordingGate: {
            mockOrderGenerationPreflightStatus: {
              preflight: {
                inputBundle: {
                  inputBundleId: "input_bundle",
                  scope: "mock_only",
                  mode: "live_order_submit",
                  symbols: ["*"],
                },
              },
            },
          },
        },
      },
    },
  });

  assert.equal(unsafeReviewValidation.reviewStatus, "blocked");
  assert.ok(unsafeReviewValidation.blockers.includes("unsafe_live_or_order_mode_rejected"));
  assert.ok(unsafeReviewValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.ok(unsafeReviewValidation.blockers.includes("mock_execution_risk_guard_blocked"));
  assert.ok(unsafeReviewValidation.blockers.includes("actual_order_candidate_must_not_be_created"));
  assert.ok(unsafeReviewValidation.blockers.includes("kis_execution_payload_must_not_be_created"));
  assert.ok(unsafeReviewValidation.blockers.includes("actual_execution_must_not_be_created"));
  assert.ok(unsafeReviewValidation.warnings.includes("target_weight_residual_review_required"));
  assert.equal(unsafeReviewValidation.providerCallsAllowed, false);
  assert.equal(unsafeReviewValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeReviewValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(unsafeReviewValidation.readyForOrderSubmission, false);
  assert.equal(unsafeReviewValidation.readyForLiveGuardedTrading, false);
});

test("Step 143 admin mock execution review status and dashboard integration remain admin-only fail-closed", () => {
  const mockExecutionReviewStatus = buildAdminTradingLabMockExecutionReviewResultStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockExecutionReviewStatus, dashboard });

  assert.equal(mockExecutionReviewStatus.status, "admin_only_trading_lab_mock_execution_review_result_recording_gate_fail_closed");
  assert.equal(mockExecutionReviewStatus.boundaries.adminOnly, true);
  assert.equal(mockExecutionReviewStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockExecutionReviewStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockExecutionReviewStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockExecutionReviewStatus.actualOrderCandidateCreated, false);
  assert.equal(mockExecutionReviewStatus.actualOrderDraftCreated, false);
  assert.equal(mockExecutionReviewStatus.kisOrderPayloadCreated, false);
  assert.equal(mockExecutionReviewStatus.kisExecutionPayloadCreated, false);
  assert.equal(mockExecutionReviewStatus.actualExecutionCreated, false);
  assert.equal(mockExecutionReviewStatus.fillCreated, false);
  assert.equal(mockExecutionReviewStatus.accountBalanceQueried, false);
  assert.equal(mockExecutionReviewStatus.providerCallsAllowed, false);
  assert.equal(mockExecutionReviewStatus.orderSubmissionAllowed, false);
  assert.equal(mockExecutionReviewStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockExecutionReviewStatus.readyForOrderSubmission, false);
  assert.equal(mockExecutionReviewStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockExecutionReviewStatus.persistentStorageUsed, false);
  assert.equal(mockExecutionReviewStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockExecutionPreflightStatus.step, "Step 142: Admin trading lab mock execution preflight");
  assert.equal(dashboard.mockExecutionReviewResultStatus.step, "Step 143: Admin trading lab mock execution review result recording gate");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 144 mock fill simulation preflight builds redacted mock-only fill candidates without live artifacts", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 200000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const strategyValidation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRunCandidatePreflightStatus = buildAdminTradingLabMockRunCandidatePreflightStatus({
    strategyDraft,
    validation: strategyValidation,
    initialCapitalPlaceholder: 100000,
    cashPlaceholder: 100000,
  });
  const mockOrderGenerationPreflightStatus = buildAdminTradingLabMockOrderGenerationPreflightStatus({ mockRunCandidatePreflightStatus });
  const mockOrderGenerationReviewResultStatus = buildAdminTradingLabMockOrderGenerationReviewResultStatus({ mockOrderGenerationPreflightStatus });
  const mockExecutionPreflightStatus = buildAdminTradingLabMockExecutionPreflightStatus({ mockOrderGenerationReviewResultStatus });
  const mockExecutionReviewResultStatus = buildAdminTradingLabMockExecutionReviewResultStatus({ mockExecutionPreflightStatus });
  const fillCandidates = buildTradingLabMockFillSimulationCandidates({ mockExecutionReviewResultStatus });
  const policyValidation = validateTradingLabMockFillPolicyAndPriceSource({ mockExecutionReviewResultStatus, fillCandidates });
  const slippageFeePreview = buildTradingLabMockFillSlippageFeePreview({ mockExecutionReviewResultStatus, fillCandidates });
  const cashImpactValidation = validateTradingLabMockFillCashImpact({ mockExecutionReviewResultStatus, fillCandidates });
  const positionImpactValidation = validateTradingLabMockFillPositionImpact({ mockExecutionReviewResultStatus, fillCandidates });
  const validation = validateTradingLabMockFillSimulationPreflight({
    mockExecutionReviewResultStatus,
    fillCandidates,
    policyValidation,
    slippageFeePreview,
    cashImpactValidation,
    positionImpactValidation,
  });
  const result = buildTradingLabMockFillSimulationPreflightResult({ validation });
  const preflight = buildTradingLabMockFillSimulationPreflight({
    mockExecutionReviewResultStatus,
    fillCandidates,
    policyValidation,
    slippageFeePreview,
    cashImpactValidation,
    positionImpactValidation,
    validation,
    result,
  });
  const serialized = JSON.stringify({ fillCandidates, policyValidation, slippageFeePreview, cashImpactValidation, positionImpactValidation, validation, result, preflight });

  assert.equal(mockExecutionReviewResultStatus.reviewResult.reviewStatus, "recorded");
  assert.equal(validation.status, "mock_fill_simulation_candidate");
  assert.equal(result.status, "mock_fill_simulation_candidate");
  assert.equal(result.scope, "mock_only");
  assert.equal(result.nextAllowedStep, "mock_fill_simulation_review");
  assert.ok(fillCandidates.length > 0);
  assert.equal(fillCandidates.every((candidate) => candidate.status === "mock_only"), true);
  assert.equal(fillCandidates.every((candidate) => candidate.mockPriceSource === "static_mock_series"), true);
  assert.equal(fillCandidates.every((candidate) => candidate.actualOrderCandidateCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.actualOrderDraftCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.kisOrderPayloadCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.kisExecutionPayloadCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.kisFillPayloadCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.actualExecutionCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.actualFillRecordCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.fillCreated === false), true);
  assert.equal(fillCandidates.every((candidate) => candidate.accountBalanceQueried === false), true);
  assert.equal(policyValidation.providerQuoteQueried, false);
  assert.equal(policyValidation.kisQuoteQueryAttempted, false);
  assert.equal(policyValidation.kisExecutionPayloadCreated, false);
  assert.equal(slippageFeePreview.actualFeeScheduleQueried, false);
  assert.equal(slippageFeePreview.actualFillPriceLookupAttempted, false);
  assert.equal(cashImpactValidation.accountBalanceQueried, false);
  assert.equal(cashImpactValidation.dbWriteUsed, false);
  assert.equal(positionImpactValidation.actualBalanceQueried, false);
  assert.equal(positionImpactValidation.actualFillRecordCreated, false);
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.readyForReadOnlyProviderCalls, false);
  assert.equal(preflight.readyForOrderSubmission, false);
  assert.equal(preflight.readyForLiveGuardedTrading, false);
  assert.equal(preflight.persistentStorageUsed, false);
  assert.equal(preflight.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 144 mock fill simulation preflight depends on Step143 redacted review result safety", () => {
  const missingReviewValidation = validateTradingLabMockFillSimulationPreflight({
    mockExecutionReviewResultStatus: {},
  });
  const unsafeReviewValidation = validateTradingLabMockFillSimulationPreflight({
    mockExecutionReviewResultStatus: {
      reviewResult: {
        mockExecutionReviewResultId: "unsafe_review",
        mockExecutionPreflightId: "execution_preflight",
        mockOrderGenerationReviewResultId: "order_review",
        mockRunCandidateId: "candidate",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        reviewStatus: "recorded",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      receipt: {
        receiptId: "unsafe_receipt",
        redacted: false,
        nextAllowedStep: "mock_fill_simulation_preflight",
      },
      recordingGate: {
        mockExecutionPreflightStatus: {
          preflight: {
            mockExecutionIntents: [],
            fillPlans: [],
            cashImpactPreview: { startingCashPlaceholder: 100000, status: "mock_only" },
            positionImpactPreview: { status: "mock_only", rows: [] },
            riskGuard: { status: "mock_only" },
            mockOrderGenerationReviewResultStatus: {
              recordingGate: {
                mockOrderGenerationPreflightStatus: {
                  preflight: {
                    inputBundle: {
                      inputBundleId: "input_bundle",
                      scope: "mock_only",
                      mode: "mock",
                      symbols: ["SYMBOL_A_PLACEHOLDER"],
                      targetWeights: [{ symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 100 }],
                      cashPlaceholder: 100000,
                      priceSeriesStatus: "available",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  assert.equal(missingReviewValidation.status, "blocked");
  assert.ok(missingReviewValidation.blockers.includes("mock_execution_review_result_missing"));
  assert.ok(missingReviewValidation.blockers.includes("mock_execution_review_receipt_missing"));
  assert.equal(unsafeReviewValidation.status, "blocked");
  assert.ok(unsafeReviewValidation.blockers.includes("mock_execution_review_result_not_redacted"));
  assert.ok(unsafeReviewValidation.blockers.includes("mock_execution_review_receipt_not_redacted"));
  assert.equal(unsafeReviewValidation.providerCallsAllowed, false);
  assert.equal(unsafeReviewValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeReviewValidation.readyForLiveGuardedTrading, false);
});

test("Step 144 mock fill simulation preflight blocks unsafe fill policy price source live wildcard and actual artifacts", () => {
  const unsafeValidation = validateTradingLabMockFillSimulationPreflight({
    mockExecutionReviewResultStatus: {
      reviewResult: {
        mockExecutionReviewResultId: "review",
        mockExecutionPreflightId: "execution_preflight",
        mockOrderGenerationReviewResultId: "order_review",
        mockRunCandidateId: "candidate",
        inputBundleId: "input_bundle",
        strategyDraftId: "strategy",
        reviewStatus: "recorded",
        redacted: true,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      receipt: {
        receiptId: "receipt",
        redacted: true,
        nextAllowedStep: "mock_fill_simulation_preflight",
      },
      recordingGate: {
        mockExecutionPreflightStatus: {
          validation: { warnings: ["target_weight_residual_review_required"] },
          preflight: {
            mockExecutionIntents: [],
            fillPlans: [],
            cashImpactPreview: { status: "mock_only", startingCashPlaceholder: 100000 },
            positionImpactPreview: { status: "mock_only", rows: [] },
            riskGuard: { status: "mock_only" },
            mockOrderGenerationReviewResultStatus: {
              recordingGate: {
                mockOrderGenerationPreflightStatus: {
                  preflight: {
                    inputBundle: {
                      inputBundleId: "input_bundle",
                      scope: "mock_only",
                      mode: "live_order_submit",
                      symbols: ["*"],
                      cashPlaceholder: 100000,
                      priceSeriesStatus: "missing",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    mockPositionDependencyAvailable: false,
    fillCandidates: [
      {
        mockFillSimulationCandidateId: "unsafe_candidate",
        mockExecutionIntentId: "intent",
        symbol: "SYMBOL_A_PLACEHOLDER",
        side: "mock_buy",
        mockQuantityPlaceholder: 1,
        fillPolicy: "live_best_price",
        fillTiming: "live_now",
        mockPriceSource: "provider_quote",
        mockFillPricePlaceholder: 100,
        mockSlippagePlaceholder: 1,
        mockFeePlaceholder: 1,
        mockGrossAmount: 100,
        mockNetAmount: 102,
        status: "mock_only",
        redacted: true,
        actualOrderCandidateCreated: true,
        actualOrderDraftCreated: false,
        kisOrderPayloadCreated: false,
        kisExecutionPayloadCreated: true,
        kisFillPayloadCreated: true,
        actualExecutionCreated: true,
        executionRecordCreated: false,
        actualFillRecordCreated: true,
        fillRecordCreated: false,
        fillCreated: false,
        accountBalanceQueried: false,
      },
    ],
  });

  assert.equal(unsafeValidation.status, "blocked");
  assert.ok(unsafeValidation.blockers.includes("unsafe_live_or_order_mode_rejected"));
  assert.ok(unsafeValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.ok(unsafeValidation.blockers.includes("invalid_mock_fill_policy"));
  assert.ok(unsafeValidation.blockers.includes("invalid_mock_fill_timing"));
  assert.ok(unsafeValidation.blockers.includes("non_mock_price_source_rejected"));
  assert.ok(unsafeValidation.blockers.includes("actual_order_candidate_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("kis_execution_payload_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("kis_fill_payload_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("actual_execution_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("actual_fill_must_not_be_created"));
  assert.ok(unsafeValidation.warnings.includes("target_weight_residual_review_required"));
  assert.ok(unsafeValidation.warnings.includes("mock_price_series_dependency_validation_required"));
  assert.ok(unsafeValidation.warnings.includes("mock_position_dependency_validation_required"));
  assert.equal(unsafeValidation.providerCallsAllowed, false);
  assert.equal(unsafeValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(unsafeValidation.readyForOrderSubmission, false);
  assert.equal(unsafeValidation.readyForLiveGuardedTrading, false);
});

test("Step 144 admin mock fill simulation status and dashboard integration remain admin-only fail-closed", () => {
  const mockFillSimulationStatus = buildAdminTradingLabMockFillSimulationPreflightStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockFillSimulationStatus, dashboard });

  assert.equal(mockFillSimulationStatus.status, "admin_only_trading_lab_mock_fill_simulation_preflight_fail_closed");
  assert.equal(mockFillSimulationStatus.boundaries.adminOnly, true);
  assert.equal(mockFillSimulationStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockFillSimulationStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockFillSimulationStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockFillSimulationStatus.actualOrderCandidateCreated, false);
  assert.equal(mockFillSimulationStatus.actualOrderDraftCreated, false);
  assert.equal(mockFillSimulationStatus.kisOrderPayloadCreated, false);
  assert.equal(mockFillSimulationStatus.kisExecutionPayloadCreated, false);
  assert.equal(mockFillSimulationStatus.kisFillPayloadCreated, false);
  assert.equal(mockFillSimulationStatus.actualExecutionCreated, false);
  assert.equal(mockFillSimulationStatus.actualFillRecordCreated, false);
  assert.equal(mockFillSimulationStatus.fillCreated, false);
  assert.equal(mockFillSimulationStatus.accountBalanceQueried, false);
  assert.equal(mockFillSimulationStatus.providerCallsAllowed, false);
  assert.equal(mockFillSimulationStatus.orderSubmissionAllowed, false);
  assert.equal(mockFillSimulationStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockFillSimulationStatus.readyForOrderSubmission, false);
  assert.equal(mockFillSimulationStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockFillSimulationStatus.persistentStorageUsed, false);
  assert.equal(mockFillSimulationStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockExecutionReviewResultStatus.step, "Step 143: Admin trading lab mock execution review result recording gate");
  assert.equal(dashboard.mockFillSimulationPreflightStatus.step, "Step 144: Admin trading lab mock fill simulation preflight");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 145 mock fill simulation review records redacted mock-only receipt without live artifacts", () => {
  const strategyDraft = buildTradingLabStrategyConfigDraft({
    mode: "shadow",
    targetWeights: [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    riskLimits: {
      maxOrderAmount: 200000,
      maxDailyLossPct: 1,
      maxPositionWeightPct: 60,
    },
  });
  const strategyValidation = validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRunCandidatePreflightStatus = buildAdminTradingLabMockRunCandidatePreflightStatus({
    strategyDraft,
    validation: strategyValidation,
    initialCapitalPlaceholder: 100000,
    cashPlaceholder: 100000,
  });
  const mockOrderGenerationPreflightStatus = buildAdminTradingLabMockOrderGenerationPreflightStatus({ mockRunCandidatePreflightStatus });
  const mockOrderGenerationReviewResultStatus = buildAdminTradingLabMockOrderGenerationReviewResultStatus({ mockOrderGenerationPreflightStatus });
  const mockExecutionPreflightStatus = buildAdminTradingLabMockExecutionPreflightStatus({ mockOrderGenerationReviewResultStatus });
  const mockExecutionReviewResultStatus = buildAdminTradingLabMockExecutionReviewResultStatus({ mockExecutionPreflightStatus });
  const mockFillSimulationPreflightStatus = buildAdminTradingLabMockFillSimulationPreflightStatus({ mockExecutionReviewResultStatus });
  const impactSummary = buildTradingLabMockFillSimulationReviewImpactSummary({ mockFillSimulationPreflightStatus });
  const validation = validateTradingLabMockFillSimulationReviewResult({ mockFillSimulationPreflightStatus, impactSummary });
  const reviewResult = buildTradingLabMockFillSimulationReviewResult({ validation });
  const receipt = buildTradingLabMockFillSimulationReviewReceipt({ validation, reviewResult });
  const decisionSummary = buildTradingLabMockFillSimulationReviewDecisionSummary({ validation });
  const recordingGate = buildTradingLabMockFillSimulationReviewResultRecordingGate({
    mockFillSimulationPreflightStatus,
    impactSummary,
    validation,
    reviewResult,
    receipt,
    decisionSummary,
  });
  const serialized = JSON.stringify({ impactSummary, validation, reviewResult, receipt, decisionSummary, recordingGate });

  assert.equal(mockFillSimulationPreflightStatus.result.status, "mock_fill_simulation_candidate");
  assert.equal(validation.reviewStatus, "recorded");
  assert.equal(validation.decision, "mock_fill_review_recorded");
  assert.equal(reviewResult.redacted, true);
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.nextAllowedStep, "mock_fill_simulation_core_preflight");
  assert.equal(impactSummary.redacted, true);
  assert.equal(impactSummary.actualFillPriceLookupAttempted, false);
  assert.equal(impactSummary.actualFeeScheduleQueried, false);
  assert.equal(impactSummary.accountBalanceQueried, false);
  assert.equal(impactSummary.actualPositionQueried, false);
  assert.equal(recordingGate.providerCallsAllowed, false);
  assert.equal(recordingGate.orderSubmissionAllowed, false);
  assert.equal(recordingGate.readyForReadOnlyProviderCalls, false);
  assert.equal(recordingGate.readyForOrderSubmission, false);
  assert.equal(recordingGate.readyForLiveGuardedTrading, false);
  assert.equal(recordingGate.persistentStorageUsed, false);
  assert.equal(recordingGate.dbWriteUsed, false);
  assert.equal(reviewResult.actualOrderCandidateCreated, false);
  assert.equal(reviewResult.actualOrderDraftCreated, false);
  assert.equal(reviewResult.kisOrderPayloadCreated, false);
  assert.equal(reviewResult.kisExecutionPayloadCreated, false);
  assert.equal(reviewResult.kisFillPayloadCreated, false);
  assert.equal(reviewResult.actualExecutionCreated, false);
  assert.equal(reviewResult.actualFillRecordCreated, false);
  assert.equal(reviewResult.fillCreated, false);
  assert.equal(reviewResult.accountBalanceQueried, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 145 mock fill simulation review depends on Step144 redacted preflight safety", () => {
  const missingValidation = validateTradingLabMockFillSimulationReviewResult({
    mockFillSimulationPreflightStatus: {},
  });
  const unsafeValidation = validateTradingLabMockFillSimulationReviewResult({
    mockFillSimulationPreflightStatus: {
      preflight: {
        mockFillSimulationPreflightId: "unsafe_preflight",
        sourceStep: "step144",
        scope: "mock_only",
      },
      result: {
        mockFillSimulationPreflightId: "unsafe_preflight",
        sourceStep: "step144",
        status: "mock_fill_simulation_candidate",
        scope: "mock_only",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
        nextAllowedStep: "mock_fill_simulation_review",
      },
      fillCandidates: [],
    },
  });

  assert.equal(missingValidation.reviewStatus, "blocked");
  assert.ok(missingValidation.blockers.includes("mock_fill_simulation_preflight_missing"));
  assert.ok(missingValidation.blockers.includes("mock_fill_simulation_preflight_result_missing"));
  assert.equal(unsafeValidation.reviewStatus, "blocked");
  assert.ok(unsafeValidation.blockers.includes("mock_fill_simulation_preflight_result_not_redacted"));
  assert.equal(unsafeValidation.providerCallsAllowed, false);
  assert.equal(unsafeValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeValidation.readyForLiveGuardedTrading, false);
});

test("Step 145 mock fill simulation review blocks unsafe live wildcard residual and actual artifacts", () => {
  const mockFillSimulationPreflightStatus = buildAdminTradingLabMockFillSimulationPreflightStatus();
  const unsafeCandidate = {
    ...mockFillSimulationPreflightStatus.fillCandidates[0],
    actualOrderCandidateCreated: true,
    actualOrderDraftCreated: true,
    kisOrderPayloadCreated: true,
    kisExecutionPayloadCreated: true,
    kisFillPayloadCreated: true,
    actualExecutionCreated: true,
    actualFillRecordCreated: true,
    accountBalanceQueried: true,
  };
  const unsafeValidation = validateTradingLabMockFillSimulationReviewResult({
    mockFillSimulationPreflightStatus: {
      ...mockFillSimulationPreflightStatus,
      validation: {
        ...mockFillSimulationPreflightStatus.validation,
        blockers: ["unsafe_live_or_order_mode_rejected", "wildcard_all_symbols_rejected"],
        warnings: ["target_weight_residual_review_required"],
      },
      fillCandidates: [unsafeCandidate],
    },
  });

  assert.equal(unsafeValidation.reviewStatus, "blocked");
  assert.ok(unsafeValidation.blockers.includes("unsafe_live_or_order_mode_rejected"));
  assert.ok(unsafeValidation.blockers.includes("wildcard_all_symbols_rejected"));
  assert.ok(unsafeValidation.blockers.includes("actual_order_candidate_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("actual_order_draft_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("kis_order_payload_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("kis_execution_payload_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("kis_fill_payload_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("actual_execution_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("actual_fill_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("account_balance_query_must_not_run"));
  assert.ok(unsafeValidation.warnings.includes("target_weight_residual_review_required"));
  assert.equal(unsafeValidation.providerCallsAllowed, false);
  assert.equal(unsafeValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(unsafeValidation.readyForOrderSubmission, false);
  assert.equal(unsafeValidation.readyForLiveGuardedTrading, false);
});

test("Step 145 admin mock fill simulation review status and dashboard integration remain admin-only fail-closed", () => {
  const mockFillSimulationReviewStatus = buildAdminTradingLabMockFillSimulationReviewResultStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockFillSimulationReviewStatus, dashboard });

  assert.equal(mockFillSimulationReviewStatus.status, "admin_only_trading_lab_mock_fill_simulation_review_result_recording_gate_fail_closed");
  assert.equal(mockFillSimulationReviewStatus.boundaries.adminOnly, true);
  assert.equal(mockFillSimulationReviewStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockFillSimulationReviewStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockFillSimulationReviewStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockFillSimulationReviewStatus.actualOrderCandidateCreated, false);
  assert.equal(mockFillSimulationReviewStatus.actualOrderDraftCreated, false);
  assert.equal(mockFillSimulationReviewStatus.kisOrderPayloadCreated, false);
  assert.equal(mockFillSimulationReviewStatus.kisExecutionPayloadCreated, false);
  assert.equal(mockFillSimulationReviewStatus.kisFillPayloadCreated, false);
  assert.equal(mockFillSimulationReviewStatus.actualExecutionCreated, false);
  assert.equal(mockFillSimulationReviewStatus.actualFillRecordCreated, false);
  assert.equal(mockFillSimulationReviewStatus.fillCreated, false);
  assert.equal(mockFillSimulationReviewStatus.accountBalanceQueried, false);
  assert.equal(mockFillSimulationReviewStatus.providerCallsAllowed, false);
  assert.equal(mockFillSimulationReviewStatus.orderSubmissionAllowed, false);
  assert.equal(mockFillSimulationReviewStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockFillSimulationReviewStatus.readyForOrderSubmission, false);
  assert.equal(mockFillSimulationReviewStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockFillSimulationReviewStatus.persistentStorageUsed, false);
  assert.equal(mockFillSimulationReviewStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockFillSimulationPreflightStatus.step, "Step 144: Admin trading lab mock fill simulation preflight");
  assert.equal(dashboard.mockFillSimulationReviewResultStatus.step, "Step 145: Admin trading lab mock fill simulation review result recording gate");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 146 mock fill simulation core preflight builds redacted mock-only inputs without live artifacts", () => {
  const mockFillSimulationReviewResultStatus = buildAdminTradingLabMockFillSimulationReviewResultStatus();
  const inputBundle = buildTradingLabMockFillCoreInputBundle({ mockFillSimulationReviewResultStatus });
  const scenario = buildTradingLabMockFillScenario({ mockFillSimulationReviewResultStatus });
  const policyValidation = validateTradingLabMockFillCorePricingSlippageFeePolicy({ mockFillSimulationReviewResultStatus });
  const cashAvailability = validateTradingLabMockFillCoreCashAvailability({ mockFillSimulationReviewResultStatus });
  const positionImpact = validateTradingLabMockFillCorePositionImpact({ mockFillSimulationReviewResultStatus });
  const deterministicReadiness = validateTradingLabMockFillDeterministicCalculationReadiness({
    mockFillSimulationReviewResultStatus,
    inputBundle,
    scenario,
  });
  const validation = validateTradingLabMockFillSimulationCorePreflight({
    mockFillSimulationReviewResultStatus,
    inputBundle,
    scenario,
    policyValidation,
    cashAvailability,
    positionImpact,
    deterministicReadiness,
  });
  const result = buildTradingLabMockFillSimulationCorePreflightResult({ validation });
  const preflight = buildTradingLabMockFillSimulationCorePreflight({
    mockFillSimulationReviewResultStatus,
    inputBundle,
    scenario,
    policyValidation,
    cashAvailability,
    positionImpact,
    deterministicReadiness,
    validation,
    result,
  });
  const serialized = JSON.stringify({ inputBundle, scenario, policyValidation, cashAvailability, positionImpact, deterministicReadiness, validation, result, preflight });

  assert.equal(inputBundle.redacted, true);
  assert.equal(inputBundle.scope, "mock_only");
  assert.equal(scenario.priceSource, "static_mock_series");
  assert.equal(policyValidation.providerQuoteUsed, false);
  assert.equal(policyValidation.kisQuoteQueryUsed, false);
  assert.equal(policyValidation.actualFillPriceLookupAttempted, false);
  assert.equal(cashAvailability.accountBalanceQueried, false);
  assert.equal(positionImpact.actualFillRecordCreated, false);
  assert.equal(deterministicReadiness.deterministicInputsOnly, true);
  assert.equal(result.redacted, true);
  assert.equal(result.nextAllowedStep, "mock_fill_simulation_core");
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.readyForReadOnlyProviderCalls, false);
  assert.equal(preflight.readyForOrderSubmission, false);
  assert.equal(preflight.readyForLiveGuardedTrading, false);
  assert.equal(preflight.actualOrderCandidateCreated, false);
  assert.equal(preflight.actualOrderDraftCreated, false);
  assert.equal(preflight.kisOrderPayloadCreated, false);
  assert.equal(preflight.kisExecutionPayloadCreated, false);
  assert.equal(preflight.kisFillPayloadCreated, false);
  assert.equal(preflight.actualExecutionCreated, false);
  assert.equal(preflight.actualFillRecordCreated, false);
  assert.equal(preflight.fillCreated, false);
  assert.equal(preflight.actualCashUpdated, false);
  assert.equal(preflight.actualPositionUpdated, false);
  assert.equal(preflight.persistentStorageUsed, false);
  assert.equal(preflight.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("actualCashUpdated\":true"), false);
  assert.equal(serialized.includes("actualPositionUpdated\":true"), false);
});

test("Step 146 mock fill simulation core preflight depends on Step145 redacted review receipt", () => {
  const missingValidation = validateTradingLabMockFillSimulationCorePreflight({
    mockFillSimulationReviewResultStatus: {},
  });
  const unsafeValidation = validateTradingLabMockFillSimulationCorePreflight({
    mockFillSimulationReviewResultStatus: {
      reviewResult: {
        fillSimulationReviewResultId: "unsafe_review",
        sourceStep: "step145",
        reviewStatus: "recorded",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      receipt: {
        receiptId: "unsafe_receipt",
        reviewStatus: "recorded",
        redacted: false,
        nextAllowedStep: "mock_fill_simulation_core_preflight",
      },
    },
  });

  assert.equal(missingValidation.status, "blocked");
  assert.ok(missingValidation.blockers.includes("mock_fill_simulation_review_result_missing"));
  assert.ok(missingValidation.blockers.includes("mock_fill_simulation_review_receipt_missing"));
  assert.equal(unsafeValidation.status, "blocked");
  assert.ok(unsafeValidation.blockers.includes("mock_fill_simulation_review_result_not_redacted"));
  assert.ok(unsafeValidation.blockers.includes("mock_fill_simulation_review_receipt_not_redacted"));
  assert.equal(unsafeValidation.providerCallsAllowed, false);
  assert.equal(unsafeValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeValidation.readyForLiveGuardedTrading, false);
});

test("Step 146 mock fill simulation core preflight blocks unsafe policies and actual artifacts", () => {
  const mockFillSimulationReviewResultStatus = buildAdminTradingLabMockFillSimulationReviewResultStatus();
  const unsafeCandidate = {
    ...mockFillSimulationReviewResultStatus.recordingGate.mockFillSimulationPreflightStatus.fillCandidates[0],
    fillPolicy: "live_market",
    mockPriceSource: "provider_quote",
    actualOrderCandidateCreated: true,
    actualOrderDraftCreated: true,
    kisOrderPayloadCreated: true,
    kisExecutionPayloadCreated: true,
    kisFillPayloadCreated: true,
    actualExecutionCreated: true,
    actualFillRecordCreated: true,
    accountBalanceQueried: true,
  };
  const validation = validateTradingLabMockFillSimulationCorePreflight({
    mockFillSimulationReviewResultStatus: {
      ...mockFillSimulationReviewResultStatus,
      recordingGate: {
        ...mockFillSimulationReviewResultStatus.recordingGate,
        mockFillSimulationPreflightStatus: {
          ...mockFillSimulationReviewResultStatus.recordingGate.mockFillSimulationPreflightStatus,
          fillCandidates: [unsafeCandidate],
        },
      },
    },
  });

  assert.equal(validation.status, "blocked");
  assert.ok(validation.blockers.includes("invalid_mock_fill_policy_rejected"));
  assert.ok(validation.blockers.includes("non_mock_price_source_rejected"));
  assert.ok(validation.blockers.includes("actual_order_candidate_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_order_draft_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_order_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_execution_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_fill_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_execution_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_fill_must_not_be_created"));
  assert.ok(validation.blockers.includes("account_balance_query_must_not_run"));
  assert.equal(validation.providerCallsAllowed, false);
  assert.equal(validation.orderSubmissionAllowed, false);
  assert.equal(validation.readyForReadOnlyProviderCalls, false);
  assert.equal(validation.readyForOrderSubmission, false);
  assert.equal(validation.readyForLiveGuardedTrading, false);
});

test("Step 146 admin mock fill simulation core preflight status and dashboard integration remain admin-only fail-closed", () => {
  const mockFillSimulationCorePreflightStatus = buildAdminTradingLabMockFillSimulationCorePreflightStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockFillSimulationCorePreflightStatus, dashboard });

  assert.equal(mockFillSimulationCorePreflightStatus.status, "admin_only_trading_lab_mock_fill_simulation_core_preflight_fail_closed");
  assert.equal(mockFillSimulationCorePreflightStatus.boundaries.adminOnly, true);
  assert.equal(mockFillSimulationCorePreflightStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockFillSimulationCorePreflightStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockFillSimulationCorePreflightStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockFillSimulationCorePreflightStatus.actualOrderCandidateCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.actualOrderDraftCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.kisOrderPayloadCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.kisExecutionPayloadCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.kisFillPayloadCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.actualExecutionCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.actualFillRecordCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.fillCreated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.actualCashUpdated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.actualPositionUpdated, false);
  assert.equal(mockFillSimulationCorePreflightStatus.accountBalanceQueried, false);
  assert.equal(mockFillSimulationCorePreflightStatus.providerCallsAllowed, false);
  assert.equal(mockFillSimulationCorePreflightStatus.orderSubmissionAllowed, false);
  assert.equal(mockFillSimulationCorePreflightStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockFillSimulationCorePreflightStatus.readyForOrderSubmission, false);
  assert.equal(mockFillSimulationCorePreflightStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockFillSimulationCorePreflightStatus.persistentStorageUsed, false);
  assert.equal(mockFillSimulationCorePreflightStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockFillSimulationReviewResultStatus.step, "Step 145: Admin trading lab mock fill simulation review result recording gate");
  assert.equal(dashboard.mockFillSimulationCorePreflightStatus.step, "Step 146: Admin trading lab mock fill simulation core preflight");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("actualCashUpdated\":true"), false);
  assert.equal(serialized.includes("actualPositionUpdated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 147 mock fill simulation core review result records a redacted mock-only receipt without live artifacts", () => {
  const mockFillSimulationCorePreflightStatus = buildAdminTradingLabMockFillSimulationCorePreflightStatus();
  const policyReviewSummary = buildTradingLabMockFillCorePolicyReviewSummary({ mockFillSimulationCorePreflightStatus });
  const validation = validateTradingLabMockFillSimulationCoreReviewResult({ mockFillSimulationCorePreflightStatus, policyReviewSummary });
  const reviewResult = buildTradingLabMockFillSimulationCoreReviewResult({ validation });
  const receipt = buildTradingLabMockFillCoreReviewReceipt({ validation, reviewResult });
  const decisionSummary = buildTradingLabMockFillCoreReviewDecisionSummary({ validation });
  const recordingGate = buildTradingLabMockFillSimulationCoreReviewResultRecordingGate({
    mockFillSimulationCorePreflightStatus,
    policyReviewSummary,
    validation,
    reviewResult,
    receipt,
    decisionSummary,
  });
  const serialized = JSON.stringify({ policyReviewSummary, validation, reviewResult, receipt, decisionSummary, recordingGate });

  assert.equal(policyReviewSummary.redacted, true);
  assert.equal(validation.redacted, true);
  assert.equal(reviewResult.redacted, true);
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.nextAllowedStep, "mock_fill_simulation_core");
  assert.equal(decisionSummary.messages.includes("Not an actual fill result."), true);
  assert.equal(recordingGate.providerCallsAllowed, false);
  assert.equal(recordingGate.orderSubmissionAllowed, false);
  assert.equal(recordingGate.readyForReadOnlyProviderCalls, false);
  assert.equal(recordingGate.readyForOrderSubmission, false);
  assert.equal(recordingGate.readyForLiveGuardedTrading, false);
  assert.equal(recordingGate.actualOrderCandidateCreated, false);
  assert.equal(recordingGate.actualOrderDraftCreated, false);
  assert.equal(recordingGate.kisOrderPayloadCreated, false);
  assert.equal(recordingGate.kisExecutionPayloadCreated, false);
  assert.equal(recordingGate.kisFillPayloadCreated, false);
  assert.equal(recordingGate.actualExecutionCreated, false);
  assert.equal(recordingGate.actualFillRecordCreated, false);
  assert.equal(recordingGate.fillCreated, false);
  assert.equal(recordingGate.actualCashUpdated, false);
  assert.equal(recordingGate.actualPositionUpdated, false);
  assert.equal(recordingGate.accountBalanceQueried, false);
  assert.equal(recordingGate.persistentStorageUsed, false);
  assert.equal(recordingGate.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("hashValueStored\":true"), false);
  assert.equal(serialized.includes("digestValueStored\":true"), false);
  assert.equal(serialized.includes("actualCashUpdated\":true"), false);
  assert.equal(serialized.includes("actualPositionUpdated\":true"), false);
});

test("Step 147 mock fill simulation core review result depends on Step146 redacted core preflight", () => {
  const missingValidation = validateTradingLabMockFillSimulationCoreReviewResult({
    mockFillSimulationCorePreflightStatus: {},
  });
  const unsafeValidation = validateTradingLabMockFillSimulationCoreReviewResult({
    mockFillSimulationCorePreflightStatus: {
      preflight: {},
      result: {
        mockFillSimulationCorePreflightId: "unsafe_core_preflight",
        status: "mock_fill_core_ready",
        scope: "mock_only",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
        nextAllowedStep: "mock_fill_simulation_core",
      },
      inputBundle: {
        inputBundleId: "unsafe_core_input_bundle",
        redacted: false,
        mode: "mock",
      },
    },
  });

  assert.equal(missingValidation.reviewStatus, "blocked");
  assert.ok(missingValidation.blockers.includes("mock_fill_simulation_core_preflight_missing"));
  assert.ok(missingValidation.blockers.includes("mock_fill_simulation_core_preflight_result_missing"));
  assert.equal(unsafeValidation.reviewStatus, "blocked");
  assert.ok(unsafeValidation.blockers.includes("mock_fill_simulation_core_preflight_result_not_redacted"));
  assert.ok(unsafeValidation.blockers.includes("mock_fill_core_input_bundle_not_redacted"));
  assert.equal(unsafeValidation.providerCallsAllowed, false);
  assert.equal(unsafeValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeValidation.readyForLiveGuardedTrading, false);
});

test("Step 147 mock fill simulation core review result blocks unsafe artifacts and cash or position mutation", () => {
  const mockFillSimulationReviewResultStatus = buildAdminTradingLabMockFillSimulationReviewResultStatus();
  const mockFillSimulationCorePreflightStatus = buildAdminTradingLabMockFillSimulationCorePreflightStatus({
    mockFillSimulationReviewResultStatus,
  });
  const unsafeCandidate = {
    ...mockFillSimulationReviewResultStatus.recordingGate.mockFillSimulationPreflightStatus.fillCandidates[0],
    actualOrderCandidateCreated: true,
    actualOrderDraftCreated: true,
    kisOrderPayloadCreated: true,
    kisExecutionPayloadCreated: true,
    kisFillPayloadCreated: true,
    actualExecutionCreated: true,
    actualFillRecordCreated: true,
    accountBalanceQueried: true,
  };
  const unsafeStatus = {
    ...mockFillSimulationCorePreflightStatus,
    result: {
      ...mockFillSimulationCorePreflightStatus.result,
      actualCashUpdated: true,
      actualPositionUpdated: true,
    },
    cashAvailability: {
      ...mockFillSimulationCorePreflightStatus.cashAvailability,
      actualCashUpdated: true,
    },
    positionImpact: {
      ...mockFillSimulationCorePreflightStatus.positionImpact,
      actualPositionUpdated: true,
    },
  };
  const unsafeReviewStatus = {
    ...mockFillSimulationReviewResultStatus,
    recordingGate: {
      ...mockFillSimulationReviewResultStatus.recordingGate,
      mockFillSimulationPreflightStatus: {
        ...mockFillSimulationReviewResultStatus.recordingGate.mockFillSimulationPreflightStatus,
        fillCandidates: [unsafeCandidate],
      },
    },
  };
  const validation = validateTradingLabMockFillSimulationCoreReviewResult({
    mockFillSimulationCorePreflightStatus: unsafeStatus,
    mockFillSimulationReviewResultStatus: unsafeReviewStatus,
  });

  assert.equal(validation.reviewStatus, "blocked");
  assert.ok(validation.blockers.includes("actual_order_candidate_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_order_draft_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_order_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_execution_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_fill_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_execution_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_fill_must_not_be_created"));
  assert.ok(validation.blockers.includes("account_balance_query_must_not_run"));
  assert.ok(validation.blockers.includes("actual_cash_update_must_not_run"));
  assert.ok(validation.blockers.includes("actual_position_update_must_not_run"));
  assert.equal(validation.providerCallsAllowed, false);
  assert.equal(validation.orderSubmissionAllowed, false);
  assert.equal(validation.readyForReadOnlyProviderCalls, false);
  assert.equal(validation.readyForOrderSubmission, false);
  assert.equal(validation.readyForLiveGuardedTrading, false);
});

test("Step 147 admin mock fill simulation core review result status and dashboard integration remain admin-only fail-closed", () => {
  const mockFillSimulationCoreReviewResultStatus = buildAdminTradingLabMockFillSimulationCoreReviewResultStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockFillSimulationCoreReviewResultStatus, dashboard });

  assert.equal(mockFillSimulationCoreReviewResultStatus.status, "admin_only_trading_lab_mock_fill_simulation_core_review_result_recording_gate_fail_closed");
  assert.equal(mockFillSimulationCoreReviewResultStatus.boundaries.adminOnly, true);
  assert.equal(mockFillSimulationCoreReviewResultStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.actualOrderCandidateCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.actualOrderDraftCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.kisOrderPayloadCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.kisExecutionPayloadCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.kisFillPayloadCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.actualExecutionCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.actualFillRecordCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.fillCreated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.actualCashUpdated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.actualPositionUpdated, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.accountBalanceQueried, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.providerCallsAllowed, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.orderSubmissionAllowed, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.readyForOrderSubmission, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.persistentStorageUsed, false);
  assert.equal(mockFillSimulationCoreReviewResultStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockFillSimulationCorePreflightStatus.step, "Step 146: Admin trading lab mock fill simulation core preflight");
  assert.equal(dashboard.mockFillSimulationCoreReviewResultStatus.step, "Step 147: Admin trading lab mock fill simulation core review result recording gate");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("actualCashUpdated\":true"), false);
  assert.equal(serialized.includes("actualPositionUpdated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 148 mock fill simulation core builds deterministic redacted mock fill results without live artifacts", () => {
  const mockFillSimulationCoreReviewResultStatus = buildAdminTradingLabMockFillSimulationCoreReviewResultStatus();
  const calculationInputs = buildTradingLabMockFillCalculationInputs({ mockFillSimulationCoreReviewResultStatus });
  const validation = validateTradingLabMockFillSimulationCore({ mockFillSimulationCoreReviewResultStatus, calculationInputs });
  const status = buildTradingLabMockFillSimulationCore({ mockFillSimulationCoreReviewResultStatus, calculationInputs, validation });
  const serialized = JSON.stringify({ calculationInputs, validation, status });

  assert.equal(validation.redacted, true);
  assert.equal(status.status, "admin_only_trading_lab_mock_fill_simulation_core_fail_closed");
  assert.equal(status.mockFillResultSchema.nextAllowedStep, "mock_portfolio_ledger_update_preflight");
  assert.ok(status.fillResults.length >= 1);
  assert.equal(status.fillResults.every((result) => result.redacted === true), true);
  assert.equal(status.fillResults.every((result) => result.deterministic === true), true);
  assert.equal(status.summary.deterministic, true);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.actualOrderCandidateCreated, false);
  assert.equal(status.actualOrderDraftCreated, false);
  assert.equal(status.kisOrderPayloadCreated, false);
  assert.equal(status.kisExecutionPayloadCreated, false);
  assert.equal(status.kisFillPayloadCreated, false);
  assert.equal(status.actualExecutionCreated, false);
  assert.equal(status.actualFillRecordCreated, false);
  assert.equal(status.fillCreated, false);
  assert.equal(status.accountBalanceQueried, false);
  assert.equal(status.actualCashUpdated, false);
  assert.equal(status.actualPositionUpdated, false);
  assert.equal(status.persistentStorageUsed, false);
  assert.equal(status.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderId"), false);
  assert.equal(serialized.includes("actualExecutionId"), false);
  assert.equal(serialized.includes("actualFillId"), false);
});

test("Step 148 deterministic mock fill calculation handles buy sell partial and rejected modes", () => {
  const baseInput = {
    calculationInputId: "buy_input",
    fillSimulationCandidateId: "buy_candidate",
    fillCoreReviewResultId: "review",
    fillCorePreflightId: "preflight",
    fillCoreInputBundleId: "bundle",
    symbol: "QQQ",
    side: "mock_buy",
    requestedQuantity: 10,
    mockReferencePrice: 100,
    mockSlippageRate: 0.01,
    mockFeeRate: 0.001,
    fillMode: "full_fill",
  };
  const buy = calculateTradingLabMockFillResult(baseInput);
  const sell = calculateTradingLabMockFillResult({
    ...baseInput,
    calculationInputId: "sell_input",
    fillSimulationCandidateId: "sell_candidate",
    side: "mock_sell",
  });
  const partial = calculateTradingLabMockFillResult({
    ...baseInput,
    calculationInputId: "partial_input",
    fillSimulationCandidateId: "partial_candidate",
    fillMode: "partial_fill_placeholder",
    partialFillRatioPlaceholder: 0.4,
  });
  const rejected = calculateTradingLabMockFillResult({
    ...baseInput,
    calculationInputId: "rejected_input",
    fillSimulationCandidateId: "rejected_candidate",
    fillMode: "rejected_placeholder",
  });
  const stableBuy = calculateTradingLabMockFillResult(baseInput);

  assert.equal(buy.fillStatus, "mock_filled");
  assert.equal(buy.cashDelta < 0, true);
  assert.equal(buy.positionDelta > 0, true);
  assert.equal(sell.cashDelta > 0, true);
  assert.equal(sell.positionDelta < 0, true);
  assert.equal(partial.fillStatus, "mock_partial");
  assert.equal(partial.filledQuantity < partial.requestedQuantity, true);
  assert.equal(rejected.fillStatus, "mock_rejected");
  assert.equal(rejected.filledQuantity, 0);
  assert.equal(rejected.cashDelta, 0);
  assert.equal(rejected.positionDelta, 0);
  assert.deepEqual(stableBuy, buy);
});

test("Step 148 mock fill simulation core depends on Step147 redacted review result", () => {
  const missingValidation = validateTradingLabMockFillSimulationCore({
    mockFillSimulationCoreReviewResultStatus: {},
  });
  const unsafeValidation = validateTradingLabMockFillSimulationCore({
    mockFillSimulationCoreReviewResultStatus: {
      reviewResult: {
        fillCoreReviewResultId: "unsafe_review",
        reviewStatus: "recorded",
        redacted: false,
        readinessImpact: "none",
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
      receipt: {
        receiptId: "unsafe_receipt",
        redacted: false,
        nextAllowedStep: "mock_fill_simulation_core",
      },
    },
  });

  assert.equal(missingValidation.status, "blocked");
  assert.ok(missingValidation.blockers.includes("mock_fill_core_review_result_missing"));
  assert.ok(missingValidation.blockers.includes("mock_fill_core_review_receipt_missing"));
  assert.equal(unsafeValidation.status, "blocked");
  assert.ok(unsafeValidation.blockers.includes("mock_fill_core_review_result_not_redacted"));
  assert.ok(unsafeValidation.blockers.includes("mock_fill_core_review_receipt_not_redacted"));
  assert.equal(unsafeValidation.providerCallsAllowed, false);
  assert.equal(unsafeValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeValidation.readyForLiveGuardedTrading, false);
});

test("Step 148 mock fill simulation core blocks unsafe inputs and actual record mutations", () => {
  const mockFillSimulationCoreReviewResultStatus = buildAdminTradingLabMockFillSimulationCoreReviewResultStatus();
  const unsafeInputs = buildTradingLabMockFillCalculationInputs({ mockFillSimulationCoreReviewResultStatus }).map((input, index) => ({
    ...input,
    fillMode: index === 0 ? "live_market_fill" : input.fillMode,
    actualOrderCandidateCreated: true,
    actualOrderDraftCreated: true,
    kisOrderPayloadCreated: true,
    kisExecutionPayloadCreated: true,
    kisFillPayloadCreated: true,
    actualExecutionCreated: true,
    actualFillRecordCreated: true,
    accountBalanceQueried: true,
    actualCashUpdated: true,
    actualPositionUpdated: true,
  }));
  const validation = validateTradingLabMockFillSimulationCore({
    mockFillSimulationCoreReviewResultStatus,
    calculationInputs: unsafeInputs,
  });

  assert.equal(validation.status, "blocked");
  assert.ok(validation.blockers.includes("unsafe_fill_mode_rejected"));
  assert.ok(validation.blockers.includes("actual_order_candidate_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_order_draft_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_order_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_execution_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("kis_fill_payload_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_execution_must_not_be_created"));
  assert.ok(validation.blockers.includes("actual_fill_must_not_be_created"));
  assert.ok(validation.blockers.includes("account_balance_query_must_not_run"));
  assert.ok(validation.blockers.includes("actual_cash_update_must_not_run"));
  assert.ok(validation.blockers.includes("actual_position_update_must_not_run"));
  assert.equal(validation.providerCallsAllowed, false);
  assert.equal(validation.orderSubmissionAllowed, false);
  assert.equal(validation.readyForReadOnlyProviderCalls, false);
  assert.equal(validation.readyForOrderSubmission, false);
  assert.equal(validation.readyForLiveGuardedTrading, false);
});

test("Step 148 admin mock fill simulation core status and dashboard integration remain admin-only fail-closed", () => {
  const mockFillSimulationCoreStatus = buildAdminTradingLabMockFillSimulationCoreStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockFillSimulationCoreStatus, dashboard });

  assert.equal(mockFillSimulationCoreStatus.status, "admin_only_trading_lab_mock_fill_simulation_core_fail_closed");
  assert.equal(mockFillSimulationCoreStatus.boundaries.adminOnly, true);
  assert.equal(mockFillSimulationCoreStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockFillSimulationCoreStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockFillSimulationCoreStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockFillSimulationCoreStatus.actualOrderCandidateCreated, false);
  assert.equal(mockFillSimulationCoreStatus.actualOrderDraftCreated, false);
  assert.equal(mockFillSimulationCoreStatus.kisOrderPayloadCreated, false);
  assert.equal(mockFillSimulationCoreStatus.kisExecutionPayloadCreated, false);
  assert.equal(mockFillSimulationCoreStatus.kisFillPayloadCreated, false);
  assert.equal(mockFillSimulationCoreStatus.actualExecutionCreated, false);
  assert.equal(mockFillSimulationCoreStatus.actualFillRecordCreated, false);
  assert.equal(mockFillSimulationCoreStatus.fillCreated, false);
  assert.equal(mockFillSimulationCoreStatus.actualCashUpdated, false);
  assert.equal(mockFillSimulationCoreStatus.actualPositionUpdated, false);
  assert.equal(mockFillSimulationCoreStatus.accountBalanceQueried, false);
  assert.equal(mockFillSimulationCoreStatus.providerCallsAllowed, false);
  assert.equal(mockFillSimulationCoreStatus.orderSubmissionAllowed, false);
  assert.equal(mockFillSimulationCoreStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockFillSimulationCoreStatus.readyForOrderSubmission, false);
  assert.equal(mockFillSimulationCoreStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockFillSimulationCoreStatus.persistentStorageUsed, false);
  assert.equal(mockFillSimulationCoreStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockFillSimulationCoreReviewResultStatus.step, "Step 147: Admin trading lab mock fill simulation core review result recording gate");
  assert.equal(dashboard.mockFillSimulationCoreStatus.step, "Step 148: Admin trading lab mock fill simulation core");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("fillCreated\":true"), false);
  assert.equal(serialized.includes("actualCashUpdated\":true"), false);
  assert.equal(serialized.includes("actualPositionUpdated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

test("Step 149 mock portfolio ledger update preflight builds redacted mock-only candidates without ledger mutation", () => {
  const mockFillSimulationCoreStatus = buildAdminTradingLabMockFillSimulationCoreStatus();
  const ledgerUpdateCandidates = buildTradingLabMockLedgerUpdateCandidates({ mockFillSimulationCoreStatus });
  const validation = validateTradingLabMockPortfolioLedgerUpdatePreflight({ mockFillSimulationCoreStatus, ledgerUpdateCandidates });
  const status = buildTradingLabMockPortfolioLedgerUpdatePreflight({ mockFillSimulationCoreStatus, ledgerUpdateCandidates, validation });
  const serialized = JSON.stringify({ ledgerUpdateCandidates, validation, status });

  assert.equal(validation.redacted, true);
  assert.equal(status.status, "admin_only_trading_lab_mock_portfolio_ledger_update_preflight_fail_closed");
  assert.equal(status.result.scope, "mock_only");
  assert.equal(status.result.redacted, true);
  assert.equal(status.result.nextAllowedStep, "mock_portfolio_ledger_update_review_result");
  assert.ok(status.ledgerUpdateCandidates.length >= 1);
  assert.equal(status.ledgerUpdateCandidates.every((candidate) => candidate.redacted === true), true);
  assert.equal(status.ledgerUpdateCandidates.every((candidate) => candidate.scope === "mock_only"), true);
  assert.equal(status.summary.deterministic, true);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.actualLedgerEntryCreated, false);
  assert.equal(status.actualPortfolioLedgerUpdated, false);
  assert.equal(status.actualCashUpdated, false);
  assert.equal(status.actualPositionUpdated, false);
  assert.equal(status.accountBalanceQueried, false);
  assert.equal(status.persistentStorageUsed, false);
  assert.equal(status.dbWriteUsed, false);
  assert.equal(serialized.includes("APP_KEY"), false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderId"), false);
  assert.equal(serialized.includes("actualExecutionId"), false);
  assert.equal(serialized.includes("actualFillId"), false);
});

test("Step 149 ledger consistency validation handles buy sell rejected and negative previews", () => {
  const baseInput = {
    calculationInputId: "buy_input",
    fillSimulationCandidateId: "buy_candidate",
    fillCoreReviewResultId: "review",
    fillCorePreflightId: "preflight",
    fillCoreInputBundleId: "bundle",
    symbol: "QQQ",
    side: "mock_buy",
    requestedQuantity: 10,
    mockReferencePrice: 100,
    mockSlippageRate: 0.01,
    mockFeeRate: 0.001,
    fillMode: "full_fill",
  };
  const buy = calculateTradingLabMockFillResult(baseInput);
  const sell = calculateTradingLabMockFillResult({
    ...baseInput,
    calculationInputId: "sell_input",
    fillSimulationCandidateId: "sell_candidate",
    side: "mock_sell",
  });
  const rejected = calculateTradingLabMockFillResult({
    ...baseInput,
    calculationInputId: "rejected_input",
    fillSimulationCandidateId: "rejected_candidate",
    fillMode: "rejected_placeholder",
  });
  const mockFillSimulationCoreStatus = buildTradingLabMockFillSimulationCore({
    calculationInputs: [],
    validation: {
      status: "mock_fill_result_ready",
      blockerCount: 0,
      warningCount: 0,
      blockers: [],
      warnings: [],
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
  });
  mockFillSimulationCoreStatus.fillResults = [buy, sell, rejected];
  const candidates = buildTradingLabMockLedgerUpdateCandidates({
    mockFillSimulationCoreStatus,
    cashBeforePlaceholder: 50,
    positionBeforePlaceholder: 0,
  });
  const validation = validateTradingLabMockPortfolioLedgerUpdatePreflight({
    mockFillSimulationCoreStatus,
    ledgerUpdateCandidates: candidates,
  });

  assert.ok(candidates.some((candidate) => candidate.cashDelta < 0 && candidate.positionDelta > 0));
  assert.ok(candidates.some((candidate) => candidate.cashDelta > 0 && candidate.positionDelta < 0));
  assert.ok(candidates.some((candidate) => candidate.cashDelta === 0 && candidate.positionDelta === 0));
  assert.equal(validation.status, "validation_required");
  assert.ok(validation.warnings.includes("cash_after_preview_negative") || validation.warnings.includes("position_after_preview_negative"));
  assert.equal(validation.providerCallsAllowed, false);
  assert.equal(validation.orderSubmissionAllowed, false);
  assert.equal(validation.readyForLiveGuardedTrading, false);
});

test("Step 149 mock portfolio ledger update preflight blocks missing or unsafe Step148 fill results", () => {
  const missingValidation = validateTradingLabMockPortfolioLedgerUpdatePreflight({
    mockFillSimulationCoreStatus: {},
  });
  const unsafeValidation = validateTradingLabMockPortfolioLedgerUpdatePreflight({
    mockFillSimulationCoreStatus: {
      status: "admin_only_trading_lab_mock_fill_simulation_core_fail_closed",
      validation: { status: "mock_fill_result_ready" },
      fillResults: [
        {
          mockFillResultId: "unsafe_fill",
          scope: "live",
          redacted: false,
          readinessImpact: "ready",
          providerCallImpact: "allowed",
          orderSubmissionImpact: "allowed",
          liveTradingImpact: "ready",
          side: "mock_buy",
          fillStatus: "mock_filled",
          cashDelta: 10,
          positionDelta: -1,
          actualFillRecordCreated: true,
          actualExecutionCreated: true,
          actualCashUpdated: true,
          actualPositionUpdated: true,
          accountBalanceQueried: true,
          kisFillPayloadCreated: true,
        },
      ],
    },
  });

  assert.equal(missingValidation.status, "blocked");
  assert.ok(missingValidation.blockers.includes("mock_fill_result_missing"));
  assert.equal(unsafeValidation.status, "blocked");
  assert.ok(unsafeValidation.blockers.includes("mock_fill_result_not_redacted"));
  assert.ok(unsafeValidation.blockers.includes("mock_fill_result_scope_not_mock_only"));
  assert.ok(unsafeValidation.blockers.includes("fill_result_readiness_impact_not_none"));
  assert.ok(unsafeValidation.blockers.includes("actual_fill_record_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("actual_execution_record_must_not_be_created"));
  assert.ok(unsafeValidation.blockers.includes("actual_cash_update_must_not_run"));
  assert.ok(unsafeValidation.blockers.includes("actual_position_update_must_not_run"));
  assert.equal(unsafeValidation.providerCallsAllowed, false);
  assert.equal(unsafeValidation.orderSubmissionAllowed, false);
  assert.equal(unsafeValidation.readyForReadOnlyProviderCalls, false);
  assert.equal(unsafeValidation.readyForOrderSubmission, false);
  assert.equal(unsafeValidation.readyForLiveGuardedTrading, false);
});

test("Step 149 admin mock portfolio ledger update preflight status and dashboard integration remain admin-only fail-closed", () => {
  const mockPortfolioLedgerUpdatePreflightStatus = buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus();
  const dashboard = buildAdminTradingLabDashboardStatus();
  const serialized = JSON.stringify({ mockPortfolioLedgerUpdatePreflightStatus, dashboard });

  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.status, "admin_only_trading_lab_mock_portfolio_ledger_update_preflight_fail_closed");
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.boundaries.adminOnly, true);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.boundaries.publicDashboardExposed, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.boundaries.myPageDashboardExposed, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.boundaries.homepageDashboardExposed, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.actualLedgerEntryCreated, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.actualPortfolioLedgerUpdated, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.actualCashUpdated, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.actualPositionUpdated, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.accountBalanceQueried, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.providerCallsAllowed, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.orderSubmissionAllowed, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.readyForReadOnlyProviderCalls, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.readyForOrderSubmission, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.readyForLiveGuardedTrading, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.persistentStorageUsed, false);
  assert.equal(mockPortfolioLedgerUpdatePreflightStatus.dbWriteUsed, false);
  assert.equal(dashboard.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.mockFillSimulationCoreStatus.step, "Step 148: Admin trading lab mock fill simulation core");
  assert.equal(dashboard.mockPortfolioLedgerUpdatePreflightStatus.step, "Step 149: Admin trading lab mock portfolio ledger update preflight");
  assert.equal(dashboard.flags.providerCallsAllowed, false);
  assert.equal(dashboard.flags.orderSubmissionAllowed, false);
  assert.equal(dashboard.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(dashboard.flags.readyForOrderSubmission, false);
  assert.equal(dashboard.flags.readyForLiveGuardedTrading, false);
  assert.equal(serialized.includes("APP_SECRET"), false);
  assert.equal(serialized.includes("accountNumber"), false);
  assert.equal(serialized.includes("providerPayloadStored\":true"), false);
  assert.equal(serialized.includes("orderPayloadStored\":true"), false);
  assert.equal(serialized.includes("rawProviderResponseStored\":true"), false);
  assert.equal(serialized.includes("actualOrderCandidateCreated\":true"), false);
  assert.equal(serialized.includes("actualOrderDraftCreated\":true"), false);
  assert.equal(serialized.includes("kisOrderPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisExecutionPayloadCreated\":true"), false);
  assert.equal(serialized.includes("kisFillPayloadCreated\":true"), false);
  assert.equal(serialized.includes("actualExecutionCreated\":true"), false);
  assert.equal(serialized.includes("actualFillRecordCreated\":true"), false);
  assert.equal(serialized.includes("actualLedgerEntryCreated\":true"), false);
  assert.equal(serialized.includes("actualPortfolioLedgerUpdated\":true"), false);
  assert.equal(serialized.includes("actualCashUpdated\":true"), false);
  assert.equal(serialized.includes("actualPositionUpdated\":true"), false);
  assert.equal(serialized.includes("accountBalanceQueried\":true"), false);
});

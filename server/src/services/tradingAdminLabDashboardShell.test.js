import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminTradingLabStrategyDraftStatus,
  buildAdminTradingLabMockOrderGenerationPreflightStatus,
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
  buildTradingLabMockOrderIntents,
  buildTradingLabMockRebalanceDeltas,
  buildTradingLabMockTargetAllocationGapSummary,
  buildTradingLabStrategyRiskImpactPreview,
  validateTradingLabMockOrderGenerationPreflight,
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
  assert.equal(dashboard.step, "Step 140: Admin trading lab mock order generation preflight");
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
  assert.equal(dashboard.step, "Step 140: Admin trading lab mock order generation preflight");
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
  assert.equal(dashboard.step, "Step 140: Admin trading lab mock order generation preflight");
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
  assert.equal(dashboard.step, "Step 140: Admin trading lab mock order generation preflight");
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
  const mockRunCandidatePreflightStatus = buildAdminTradingLabMockRunCandidatePreflightStatus({ strategyDraft, validation });
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
  assert.equal(dashboard.step, "Step 140: Admin trading lab mock order generation preflight");
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

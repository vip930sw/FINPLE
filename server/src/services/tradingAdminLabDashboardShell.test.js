import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminTradingLabStrategyDraftStatus,
  buildAdminTradingLabStrategyDraftClearancePreflightStatus,
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
  buildTradingLabStrategyDraftClearancePreflight,
  buildTradingLabStrategyDraftClearancePreflightResult,
  buildTradingLabStrategyRiskImpactPreview,
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
  assert.equal(dashboard.step, "Step 137: Admin trading lab strategy draft clearance preflight");
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
  assert.equal(dashboard.step, "Step 137: Admin trading lab strategy draft clearance preflight");
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

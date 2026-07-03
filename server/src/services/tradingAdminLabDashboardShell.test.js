import assert from "node:assert/strict";
import test from "node:test";

import {
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
  buildTradingLabDailyReturnSeries,
  buildTradingLabEquityVisualization,
  buildTradingLabKpiSummaryCards,
  buildTradingLabOrderCandidateSummary,
  buildTradingLabPositionSnapshot,
  buildTradingLabReturnVisualization,
  buildTradingLabStrategyConfig,
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
  assert.equal(status.calculationMode, "mock_ledger_calculation_admin_only");
  assert.equal(status.mockLedger.sourceStep, "step133");
  assert.equal(status.positionLedger.positions.length, 3);
  assert.equal(status.allocationSummary.totalWeightPct, 100);
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 158 checker covers mock performance core implementation and safety boundaries", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step158-admin-trading-lab-mock-portfolio-performance-recalculation-core.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");

  assert.match(checkText, /STEP158_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_EQUITY_SERIES_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_DAILY_RETURN_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_CUMULATIVE_RETURN_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_DRAWDOWN_MDD_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_ALLOCATION_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_KPI_SUMMARY_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_CHART_DATA_RESULT_MODEL/);
  assert.match(checkText, /calculateTradingLabMockPortfolioPerformanceResult/);
  assert.match(checkText, /validateTradingLabMockPortfolioPerformanceRecalculationCore/);
  assert.match(checkText, /buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus/);
  assert.match(checkText, /trading-lab-mock-portfolio-performance-recalculation-core/);
  assert.match(checkText, /requireAdminAccess/);
  assert.match(checkText, /AccountPages\.jsx/);
  assert.match(checkText, /src\/App\.jsx/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /scenario runtime files must remain untouched/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /orderSubmissionAllowed: true/);
  assert.match(checkText, /actualPerformanceRecordCreated: true/);
  assert.match(checkText, /actualCashUpdated: true/);
  assert.match(checkText, /actualPositionUpdated: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /actualInvestmentPerformanceConfirmed: true/);
  assert.match(checkText, /returnGuaranteeProvided: true/);
  assert.match(checkText, /investmentAdviceProvided: true/);
  assert.match(packageText, /check:trading-step158-admin-trading-lab-mock-portfolio-performance-recalculation-core/);
});

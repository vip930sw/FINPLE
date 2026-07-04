const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 154 checker is wired to mock portfolio performance recalculation preflight guardrails", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step154-admin-trading-lab-mock-portfolio-performance-recalculation-preflight.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");
  const serviceText = fs.readFileSync("server/src/services/tradingAdminLabDashboardShell.js", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const uiText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");

  assert.match(packageText, /check:trading-step154-admin-trading-lab-mock-portfolio-performance-recalculation-preflight/);
  assert.match(checkText, /STEP154_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_INPUT_BUNDLE_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_SCENARIO_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_PREFLIGHT_RESULT_SCHEMA/);
  assert.match(checkText, /validateTradingLabMockPortfolioPerformanceRecalculationPreflight/);
  assert.match(checkText, /buildTradingLabMockPortfolioPerformanceRecalculationPreflight/);
  assert.match(checkText, /admin_only_trading_lab_mock_portfolio_performance_recalculation_preflight_fail_closed/);
  assert.match(checkText, /actualPerformanceRecordUpdated: true/);
  assert.match(checkText, /actualPortfolioLedgerUpdated: true/);
  assert.match(checkText, /actualCashUpdated: true/);
  assert.match(checkText, /actualPositionUpdated: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /persistentStorageUsed: true/);
  assert.match(checkText, /dbWriteUsed: true/);
  assert.match(serviceText, /buildAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus/);
  assert.match(routeText, /router\.get\("\/trading-lab-mock-portfolio-performance-recalculation-preflight"/);
  assert.match(routeText, /requireAdminAccess/);
  assert.match(uiText, /tradingLabMockPerformanceRecalculationPreflight/);
  assert.match(uiText, /Mock portfolio performance recalculation preflight/);
  assert.doesNotMatch(uiText, /\/mypage/);
});

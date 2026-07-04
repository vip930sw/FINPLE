const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 156 checker is wired to mock portfolio performance recalculation core preflight guardrails", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step156-admin-trading-lab-mock-portfolio-performance-recalculation-core-preflight.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");
  const serviceText = fs.readFileSync("server/src/services/tradingAdminLabDashboardShell.js", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const uiText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");

  assert.match(packageText, /check:trading-step156-admin-trading-lab-mock-portfolio-performance-recalculation-core-preflight/);
  assert.match(checkText, /STEP156_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_CORE_INPUT_BUNDLE_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_CORE_SCENARIO_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_CORE_PREFLIGHT_RESULT_SCHEMA/);
  assert.match(checkText, /validateTradingLabMockPortfolioPerformanceRecalculationCorePreflight/);
  assert.match(checkText, /buildTradingLabMockPortfolioPerformanceRecalculationCorePreflight/);
  assert.match(checkText, /admin_only_trading_lab_mock_portfolio_performance_recalculation_core_preflight_fail_closed/);
  assert.match(checkText, /actualPerformanceRecordCreated: true/);
  assert.match(checkText, /actualPerformanceRecordUpdated: true/);
  assert.match(checkText, /actualPortfolioLedgerUpdated: true/);
  assert.match(checkText, /actualCashUpdated: true/);
  assert.match(checkText, /actualPositionUpdated: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /persistentStorageUsed: true/);
  assert.match(checkText, /dbWriteUsed: true/);
  assert.match(serviceText, /buildAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus/);
  assert.match(routeText, /router\.get\("\/trading-lab-mock-portfolio-performance-recalculation-core-preflight"/);
  assert.match(routeText, /requireAdminAccess/);
  assert.match(uiText, /tradingLabMockPerformanceCorePreflight/);
  assert.match(uiText, /Mock portfolio performance recalculation core preflight/);
  assert.doesNotMatch(uiText, /\/mypage/);
});

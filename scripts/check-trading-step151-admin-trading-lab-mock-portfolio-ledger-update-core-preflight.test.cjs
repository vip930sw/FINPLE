const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 151 checker is wired to mock portfolio ledger update core preflight guardrails", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step151-admin-trading-lab-mock-portfolio-ledger-update-core-preflight.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");
  const serviceText = fs.readFileSync("server/src/services/tradingAdminLabDashboardShell.js", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const uiText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");

  assert.match(packageText, /check:trading-step151-admin-trading-lab-mock-portfolio-ledger-update-core-preflight/);
  assert.match(checkText, /STEP151_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_PREFLIGHT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_LEDGER_CORE_INPUT_BUNDLE_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_LEDGER_UPDATE_SCENARIO_MODEL/);
  assert.match(checkText, /validateTradingLabMockCashLedgerUpdatePolicy/);
  assert.match(checkText, /validateTradingLabMockPositionLedgerUpdatePolicy/);
  assert.match(checkText, /validateTradingLabMockPortfolioValuationPolicy/);
  assert.match(checkText, /validateTradingLabMockPnlPlaceholderPolicy/);
  assert.match(checkText, /validateTradingLabMockLedgerConsistencyReadiness/);
  assert.match(checkText, /validateTradingLabMockLedgerDeterministicUpdateReadiness/);
  assert.match(checkText, /admin_only_trading_lab_mock_portfolio_ledger_update_core_preflight_fail_closed/);
  assert.match(checkText, /mock_portfolio_ledger_update_core/);
  assert.match(checkText, /actualLedgerEntryCreated: true/);
  assert.match(checkText, /actualPortfolioLedgerUpdated: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /persistentStorageUsed: true/);
  assert.match(checkText, /dbWriteUsed: true/);
  assert.match(serviceText, /buildAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus/);
  assert.match(routeText, /router\.get\("\/trading-lab-mock-portfolio-ledger-update-core-preflight"/);
  assert.match(routeText, /requireAdminAccess/);
  assert.match(uiText, /tradingLabMockLedgerUpdateCorePreflight/);
  assert.match(uiText, /Mock portfolio ledger update core preflight/);
  assert.doesNotMatch(uiText, /\/mypage/);
});

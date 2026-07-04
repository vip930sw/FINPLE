const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 153 checker is wired to mock portfolio ledger update core guardrails", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step153-admin-trading-lab-mock-portfolio-ledger-update-core.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");
  const serviceText = fs.readFileSync("server/src/services/tradingAdminLabDashboardShell.js", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const uiText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");

  assert.match(packageText, /check:trading-step153-admin-trading-lab-mock-portfolio-ledger-update-core/);
  assert.match(checkText, /STEP153_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_CASH_LEDGER_UPDATE_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_POSITION_LEDGER_UPDATE_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PORTFOLIO_VALUE_UPDATE_RESULT_MODEL/);
  assert.match(checkText, /validateTradingLabMockPortfolioLedgerUpdateCore/);
  assert.match(checkText, /calculateTradingLabMockPortfolioLedgerUpdateResult/);
  assert.match(checkText, /admin_only_trading_lab_mock_portfolio_ledger_update_core_fail_closed/);
  assert.match(checkText, /cashAfter = roundMoney\(cashBefore \+ cashDelta\)/);
  assert.match(checkText, /positionAfter = roundQuantity\(positionBefore \+ positionDelta\)/);
  assert.match(checkText, /actualLedgerEntryCreated: true/);
  assert.match(checkText, /actualPortfolioLedgerUpdated: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /persistentStorageUsed: true/);
  assert.match(checkText, /dbWriteUsed: true/);
  assert.match(serviceText, /buildAdminTradingLabMockPortfolioLedgerUpdateCoreStatus/);
  assert.match(routeText, /router\.get\("\/trading-lab-mock-portfolio-ledger-update-core"/);
  assert.match(routeText, /requireAdminAccess/);
  assert.match(uiText, /tradingLabMockLedgerUpdateCoreResult/);
  assert.match(uiText, /Mock portfolio ledger update result/);
  assert.doesNotMatch(uiText, /\/mypage/);
});

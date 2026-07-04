const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 152 checker is wired to mock portfolio ledger update core review result guardrails", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step152-admin-trading-lab-mock-portfolio-ledger-update-core-review-result-recording-gate.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");
  const serviceText = fs.readFileSync("server/src/services/tradingAdminLabDashboardShell.js", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const uiText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");

  assert.match(packageText, /check:trading-step152-admin-trading-lab-mock-portfolio-ledger-update-core-review-result-recording-gate/);
  assert.match(checkText, /STEP152_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_DECISION_SUMMARY_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_POLICY_REVIEW_SUMMARY_MODEL/);
  assert.match(checkText, /validateTradingLabMockPortfolioLedgerUpdateCoreReviewResult/);
  assert.match(checkText, /admin_only_trading_lab_mock_portfolio_ledger_update_core_review_result_fail_closed/);
  assert.match(checkText, /mock_portfolio_ledger_update_core/);
  assert.match(checkText, /actualLedgerEntryCreated: true/);
  assert.match(checkText, /actualPortfolioLedgerUpdated: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /persistentStorageUsed: true/);
  assert.match(checkText, /dbWriteUsed: true/);
  assert.match(serviceText, /buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus/);
  assert.match(routeText, /router\.get\("\/trading-lab-mock-portfolio-ledger-update-core-review-result"/);
  assert.match(routeText, /requireAdminAccess/);
  assert.match(uiText, /tradingLabMockLedgerUpdateCoreReviewResult/);
  assert.match(uiText, /Mock portfolio ledger update core review result/);
  assert.doesNotMatch(uiText, /\/mypage/);
});

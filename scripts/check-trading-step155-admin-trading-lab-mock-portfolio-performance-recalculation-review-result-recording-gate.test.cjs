const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 155 checker is wired to mock portfolio performance recalculation review result recording guardrails", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step155-admin-trading-lab-mock-portfolio-performance-recalculation-review-result-recording-gate.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");
  const serviceText = fs.readFileSync("server/src/services/tradingAdminLabDashboardShell.js", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const uiText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");

  assert.match(packageText, /check:trading-step155-admin-trading-lab-mock-portfolio-performance-recalculation-review-result-recording-gate/);
  assert.match(checkText, /STEP155_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /validateTradingLabMockPortfolioPerformanceRecalculationReviewResult/);
  assert.match(checkText, /buildTradingLabMockPortfolioPerformanceRecalculationReviewResultRecordingGate/);
  assert.match(checkText, /admin_only_trading_lab_mock_portfolio_performance_recalculation_review_result_fail_closed/);
  assert.match(checkText, /actualPerformanceRecordUpdated: true/);
  assert.match(checkText, /actualPortfolioLedgerUpdated: true/);
  assert.match(checkText, /actualCashUpdated: true/);
  assert.match(checkText, /actualPositionUpdated: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /persistentStorageUsed: true/);
  assert.match(checkText, /dbWriteUsed: true/);
  assert.match(serviceText, /buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus/);
  assert.match(routeText, /router\.get\("\/trading-lab-mock-portfolio-performance-recalculation-review-result"/);
  assert.match(routeText, /requireAdminAccess/);
  assert.match(uiText, /tradingLabMockPerformanceRecalculationReviewResult/);
  assert.match(uiText, /Mock portfolio performance recalculation review result/);
  assert.doesNotMatch(uiText, /\/mypage/);
});

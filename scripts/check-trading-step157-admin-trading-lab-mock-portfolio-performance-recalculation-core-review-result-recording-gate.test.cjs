const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 157 checker is wired to mock portfolio performance recalculation core review result guardrails", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step157-admin-trading-lab-mock-portfolio-performance-recalculation-core-review-result-recording-gate.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");
  const serviceText = fs.readFileSync("server/src/services/tradingAdminLabDashboardShell.js", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const uiText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");

  assert.match(packageText, /check:trading-step157-admin-trading-lab-mock-portfolio-performance-recalculation-core-review-result-recording-gate/);
  assert.match(checkText, /TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_PERFORMANCE_CORE_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /validateTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult/);
  assert.match(checkText, /trading-lab-mock-portfolio-performance-recalculation-core-review-result/);
  assert.match(checkText, /requireAdminAccess/);
  assert.match(checkText, /actualPerformanceRecordCreated: true/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /AccountPages\.jsx/);
  assert.match(serviceText, /buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus/);
  assert.match(serviceText, /mock_performance_core_review_recorded/);
  assert.match(serviceText, /providerCallsAllowed: false/);
  assert.match(serviceText, /orderSubmissionAllowed: false/);
  assert.match(serviceText, /readyForLiveGuardedTrading: false/);
  assert.match(routeText, /router\.get\("\/trading-lab-mock-portfolio-performance-recalculation-core-review-result"/);
  assert.match(uiText, /tradingLabMockPerformanceCoreReviewResult/);
  assert.doesNotMatch(uiText, /자동매매 시작|실전 거래 시작|주문 실행|체결 완료|수익 보장|투자 추천/);
});

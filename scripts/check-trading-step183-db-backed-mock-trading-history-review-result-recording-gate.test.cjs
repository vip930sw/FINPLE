const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step183 checker is wired to DB-backed mock trading history review result guardrails", () => {
  const checkText = read("scripts/check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const serviceText = read("server/src/services/tradingAdminLabDashboardShell.js");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const cssText = read("src/App.css");

  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /validateDbBackedMockTradingHistoryReviewResult/);
  assert.match(checkText, /FORBIDDEN_SERVICE_SNIPPETS/);
  assert.match(checkText, /PUBLIC_SURFACE_FILES/);
  assert.match(checkText, /SCENARIO_FILES/);

  assert.match(
    packageJson.scripts["check:trading-step183-db-backed-mock-trading-history-review-result-recording-gate"],
    /check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate\.cjs/,
  );

  assert.match(serviceText, /buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus/);
  assert.match(serviceText, /db_backed_mock_history_review_recorded/);
  assert.match(serviceText, /db_backed_mock_trading_history_migration_preflight/);
  assert.match(serviceText, /supabaseMutationStatus: "blocked"/);
  assert.match(serviceText, /persistentStorageUsed: false/);
  assert.match(serviceText, /actualTradingRunCreated: false/);
  assert.match(serviceText, /accountBalanceQueried: false/);

  assert.match(routeText, /router\.get\("\/trading-lab-db-backed-mock-trading-history-review-result"/);
  assert.match(clientText, /fetchAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus/);
  assert.match(panelText, /trading-lab-db-backed-mock-trading-history-review-result/);
  assert.match(panelText, /DB 저장형 mock trading history 검토 결과/);
  assert.match(panelText, /실제 DB 저장을 수행하지 않습니다/);
  assert.match(cssText, /\.tradingLabDbHistoryReviewSummary/);
});

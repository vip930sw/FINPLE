const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step185 checker is wired to DB-backed mock trading history migration review result guardrails", () => {
  const checkText = read("scripts/check-trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const serviceText = read("server/src/services/tradingAdminLabDashboardShell.js");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const cssText = read("src/App.css");

  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /validateDbBackedMockTradingHistoryMigrationReviewResult/);
  assert.match(checkText, /FORBIDDEN_SERVICE_SNIPPETS/);
  assert.match(checkText, /PUBLIC_SURFACE_FILES/);
  assert.match(checkText, /SCENARIO_FILES/);

  assert.match(
    packageJson.scripts["check:trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate"],
    /check-trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate\.cjs/,
  );

  assert.match(serviceText, /STEP185_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_REVIEW_RESULT_FLAGS/);
  assert.match(serviceText, /buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus/);
  assert.match(serviceText, /migration_draft_review_recorded/);
  assert.match(serviceText, /reviewed_not_created/);
  assert.match(serviceText, /migrationFileStatus: "not_created"/);
  assert.match(serviceText, /sqlFileStatus: "not_created"/);
  assert.match(serviceText, /db_backed_mock_trading_history_sql_draft_preflight/);
  assert.match(serviceText, /mock_trading_strategy_presets/);
  assert.match(serviceText, /mock_trading_risk_snapshots/);
  assert.match(serviceText, /dbMigrationExecuted: false/);
  assert.match(serviceText, /persistentDbWriteAttempted: false/);
  assert.match(serviceText, /supabaseInsertAttempted: false/);

  assert.match(routeText, /router\.get\("\/trading-lab-db-backed-mock-trading-history-migration-review-result"/);
  assert.match(clientText, /fetchAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus/);
  assert.match(panelText, /trading-lab-db-backed-mock-trading-history-migration-review-result/);
  assert.match(panelText, /Migration 후보 검토 결과/);
  assert.match(panelText, /DB schema 변경 전 검토 receipt/);
  assert.match(panelText, /실제 SQL 또는 DB 변경을 수행하지 않습니다/);
  assert.match(cssText, /\.tradingLabDbHistoryMigrationReviewDetails/);
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step184 checker is wired to DB-backed mock trading history migration preflight guardrails", () => {
  const checkText = read("scripts/check-trading-step184-db-backed-mock-trading-history-migration-preflight.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const serviceText = read("server/src/services/tradingAdminLabDashboardShell.js");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const cssText = read("src/App.css");

  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_PREFLIGHT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_CANDIDATE_TABLE_DRAFT/);
  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_INDEX_CONSTRAINT_RLS_DRAFT/);
  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_PREFLIGHT_READINESS_CHECKLIST/);
  assert.match(checkText, /FORBIDDEN_SERVICE_SNIPPETS/);
  assert.match(checkText, /PUBLIC_SURFACE_FILES/);
  assert.match(checkText, /SCENARIO_FILES/);

  assert.match(
    packageJson.scripts["check:trading-step184-db-backed-mock-trading-history-migration-preflight"],
    /check-trading-step184-db-backed-mock-trading-history-migration-preflight\.cjs/,
  );

  assert.match(serviceText, /buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus/);
  assert.match(serviceText, /mock_trading_strategy_presets/);
  assert.match(serviceText, /mock_trading_risk_snapshots/);
  assert.match(serviceText, /admin_only_mock_history_select/);
  assert.match(serviceText, /migrationFileCreated: false/);
  assert.match(serviceText, /sqlFileCreated: false/);
  assert.match(serviceText, /supabaseMigrationCreated: false/);
  assert.match(serviceText, /dbSchemaChanged: false/);
  assert.match(serviceText, /persistentDbWriteAttempted: false/);

  assert.match(routeText, /router\.get\("\/trading-lab-db-backed-mock-trading-history-migration-preflight"/);
  assert.match(clientText, /fetchAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus/);
  assert.match(panelText, /trading-lab-db-backed-mock-trading-history-migration-preflight/);
  assert.match(panelText, /DB 저장형 mock trading history migration 사전검토/);
  assert.match(panelText, /SQL migration 파일은 아직 생성하지 않았고/);
  assert.match(cssText, /\.tradingLabDbHistoryMigrationPreflightSummary/);
});

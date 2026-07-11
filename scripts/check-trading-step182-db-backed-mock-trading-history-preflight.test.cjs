const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step182 checker is wired to DB-backed mock trading history preflight guardrails", () => {
  const checkText = read("scripts/check-trading-step182-db-backed-mock-trading-history-preflight.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const serviceText = read("server/src/services/tradingAdminLabDashboardShell.js");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");

  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_PREFLIGHT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_CANDIDATE_TABLE_SCHEMA_DRAFT/);
  assert.match(checkText, /REQUIRED_FORBIDDEN_VALUE_SNIPPETS/);
  assert.match(checkText, /dbWriteUsed: true/);
  assert.match(checkText, /supabaseInsertAttempted: true/);
  assert.match(checkText, /PUBLIC_SURFACE_FILES/);
  assert.match(checkText, /SCENARIO_FILES/);

  assert.match(
    packageJson.scripts["check:trading-step182-db-backed-mock-trading-history-preflight"],
    /check-trading-step182-db-backed-mock-trading-history-preflight\.cjs/,
  );

  assert.match(serviceText, /buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus/);
  assert.match(serviceText, /strategy_preset/);
  assert.match(serviceText, /mock_trading_run_summary/);
  assert.match(serviceText, /mock_order_summary/);
  assert.match(serviceText, /mock_fill_summary/);
  assert.match(serviceText, /mock_portfolio_ledger_snapshot/);
  assert.match(serviceText, /mock_performance_snapshot/);
  assert.match(serviceText, /allocation_snapshot/);
  assert.match(serviceText, /risk_metric_snapshot/);
  assert.match(serviceText, /persistentDbWriteAllowed: false/);

  assert.match(routeText, /router\.get\("\/trading-lab-db-backed-mock-trading-history-preflight"/);
  assert.match(clientText, /fetchAdminTradingLabDbBackedMockTradingHistoryPreflightStatus/);
  assert.match(panelText, /trading-lab-db-backed-mock-trading-history-preflight/);
  assert.match(panelText, /DB write blocked confirmation/);
});

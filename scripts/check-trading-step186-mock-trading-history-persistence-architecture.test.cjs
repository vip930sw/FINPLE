const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step186 checker is wired to mock trading history persistence architecture guardrails", () => {
  const checkText = read("scripts/check-trading-step186-mock-trading-history-persistence-architecture.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const serviceText = read("server/src/services/tradingAdminLabDashboardShell.js");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const cssText = read("src/App.css");

  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_HISTORY_PERSISTENCE_ARCHITECTURE_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_HISTORY_PERSISTENCE_STORAGE_DOMAINS/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_HISTORY_ENTITY_RELATIONSHIP_ARCHITECTURE/);
  assert.match(checkText, /assertNoNewRuntimeRoute/);
  assert.match(checkText, /PUBLIC_SURFACE_FILES/);
  assert.match(checkText, /SCENARIO_FILES/);

  assert.match(
    packageJson.scripts["check:trading-step186-mock-trading-history-persistence-architecture"],
    /check-trading-step186-mock-trading-history-persistence-architecture\.cjs/,
  );

  assert.match(serviceText, /STEP186_MOCK_TRADING_HISTORY_PERSISTENCE_ARCHITECTURE_FLAGS/);
  assert.match(serviceText, /buildAdminTradingLabMockTradingHistoryPersistenceArchitectureStatus/);
  assert.match(serviceText, /StrategyPreset/);
  assert.match(serviceText, /StrategyVersion/);
  assert.match(serviceText, /MockTradingRun/);
  assert.match(serviceText, /MockOrderSummary/);
  assert.match(serviceText, /MockFillSummary/);
  assert.match(serviceText, /LedgerSnapshot/);
  assert.match(serviceText, /PerformanceSnapshot/);
  assert.match(serviceText, /AllocationSnapshot/);
  assert.match(serviceText, /RiskSnapshot/);
  assert.match(serviceText, /db_backed_mock_trading_history_sql_draft_preflight/);
  assert.match(serviceText, /persistentDbWriteAttempted: false/);

  assert.doesNotMatch(routeText, /mock-trading-history-persistence-architecture/);
  assert.match(panelText, /mock-trading-history-persistence-architecture/);
  assert.match(panelText, /tradingLabPersistenceArchitectureDetails/);
  assert.match(panelText, /Step187-190 구현 계약/);
  assert.match(cssText, /\.tradingLabPersistenceArchitectureDetails/);
});

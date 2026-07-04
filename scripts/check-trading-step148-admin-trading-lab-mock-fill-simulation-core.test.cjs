const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { execFileSync } = require("node:child_process");

const CHECK_PATH = "scripts/check-trading-step148-admin-trading-lab-mock-fill-simulation-core.cjs";

test("Step 148 mock fill simulation core checker passes", () => {
  const output = execFileSync(process.execPath, [CHECK_PATH], { encoding: "utf8" });
  assert.match(output, /\[check-trading-step148-admin-trading-lab-mock-fill-simulation-core\] ok/);
});

test("Step 148 checker guards route, UI scope, no-go terms, and scenario files", () => {
  const checkerText = fs.readFileSync(CHECK_PATH, "utf8");

  for (const requiredTerm of [
    "trading-lab-mock-fill-simulation-core",
    "buildAdminTradingLabMockFillSimulationCoreStatus",
    "fetchAdminTradingLabMockFillSimulationCoreStatus",
    "tradingLabMockFillSimulationCoreStatus",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
    "actualOrderId",
    "actualExecutionId",
    "actualFillId",
    "readyForLiveGuardedTrading: true",
    "scenario_monthly_returns.csv",
    "AccountPages.jsx",
    "src/App.jsx",
  ]) {
    assert.ok(checkerText.includes(requiredTerm), `checker must cover ${requiredTerm}`);
  }
});

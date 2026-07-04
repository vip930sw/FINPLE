const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step146 checker passes against the current repository", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step146-admin-trading-lab-mock-fill-simulation-core-preflight.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step146-admin-trading-lab-mock-fill-simulation-core-preflight\] ok/);
});

test("Step146 checker tracks admin-only mock fill simulation core preflight guardrails", () => {
  const checkerText = fs.readFileSync(
    "scripts/check-trading-step146-admin-trading-lab-mock-fill-simulation-core-preflight.cjs",
    "utf8",
  );

  for (const snippet of [
    "trading-lab-mock-fill-simulation-core-preflight",
    "buildAdminTradingLabMockFillSimulationCorePreflightStatus",
    "fetchAdminTradingLabMockFillSimulationCorePreflightStatus",
    "tradingLabMockFillSimulationCorePreflight",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
    "readyForLiveGuardedTrading: true",
    "scenario_monthly_returns.csv",
    "AccountPages.jsx",
    "src/App.jsx",
  ]) {
    assert.ok(checkerText.includes(snippet), `checker should include ${snippet}`);
  }
});

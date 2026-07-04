const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step147 checker passes against the current repository", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step147-admin-trading-lab-mock-fill-simulation-core-review-result-recording-gate.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step147-admin-trading-lab-mock-fill-simulation-core-review-result-recording-gate\] ok/);
});

test("Step147 checker tracks admin-only mock fill simulation core review guardrails", () => {
  const checkerText = fs.readFileSync(
    "scripts/check-trading-step147-admin-trading-lab-mock-fill-simulation-core-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const snippet of [
    "trading-lab-mock-fill-simulation-core-review-result",
    "buildAdminTradingLabMockFillSimulationCoreReviewResultStatus",
    "fetchAdminTradingLabMockFillSimulationCoreReviewResultStatus",
    "tradingLabMockFillSimulationCoreReviewResult",
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

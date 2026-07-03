const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 132 admin trading lab dashboard visualization check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step132-admin-trading-lab-dashboard-visualization.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step132-admin-trading-lab-dashboard-visualization\] ok/);
});

test("Step 132 check requires separated safety and lab dashboard panels", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step132-admin-trading-lab-dashboard-visualization.cjs",
    "utf8",
  );

  assert.match(scriptText, /tradingSafetyPanel/);
  assert.match(scriptText, /tradingLabDashboardPanel/);
  assert.match(scriptText, /tradingLabKpiGrid/);
  assert.match(scriptText, /tradingLabLineChart/);
  assert.match(scriptText, /tradingLabAllocationBars/);
});

test("Step 132 check blocks public exposure and live readiness promotion", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step132-admin-trading-lab-dashboard-visualization.cjs",
    "utf8",
  );

  for (const term of [
    "trading lab dashboard must not be exposed on /mypage",
    "trading lab dashboard must not be exposed on homepage or public router",
    "issueAccessToken(",
    "queryKisQuote(",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
  ]) {
    assert.match(scriptText, new RegExp(term.replace(/[()]/g, "\\$&")));
  }
});

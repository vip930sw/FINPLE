const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 133 admin trading lab mock ledger return calculation core check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step133-admin-trading-lab-mock-ledger-return-calculation-core.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step133-admin-trading-lab-mock-ledger-return-calculation-core\] ok/);
});

test("Step 133 check requires mock ledger calculation core and admin-only route", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step133-admin-trading-lab-mock-ledger-return-calculation-core.cjs",
    "utf8",
  );

  for (const term of [
    "buildTradingLabMockLedger",
    "buildTradingLabMockTradeEvents",
    "calculateTradingLabPositionLedger",
    "calculateTradingLabDailyEquitySeries",
    "calculateTradingLabDailyReturnSeries",
    "calculateTradingLabCumulativeReturnSeries",
    "calculateTradingLabDrawdownSummary",
    "calculateTradingLabAllocationSummary",
    "calculateTradingLabPerformanceSummary",
    "requireAdminAccess",
    "trading-lab-dashboard",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 133 check protects public exposure and fail-closed trading flags", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step133-admin-trading-lab-mock-ledger-return-calculation-core.cjs",
    "utf8",
  );

  for (const term of [
    "trading lab dashboard must not be exposed on /mypage",
    "trading lab dashboard must not be exposed on homepage or public router",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
    "orderSubmissionAttempted: true",
    "scenario runtime files must remain untouched",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

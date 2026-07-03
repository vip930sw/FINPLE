const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 132C admin trading dashboard layout CSS check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step132c-admin-trading-dashboard-layout-css.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step132c-admin-trading-dashboard-layout-css\] ok/);
});

test("Step 132C check protects top spacing and unsafe panel positioning", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step132c-admin-trading-dashboard-layout-css.cjs",
    "utf8",
  );

  for (const term of [
    "scroll-margin-top: 104px",
    "adminTradingConsoleLayout",
    "position:\\s*(fixed|sticky|absolute)",
    "margin-top:\\s*-\\d",
    "transform:\\s*(translate|scale|rotate)",
    "tradingLabDashboardPanel",
    "tradingSafetyPanel",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 132C check protects overflow-safe tables and public exposure boundary", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step132c-admin-trading-dashboard-layout-css.cjs",
    "utf8",
  );

  for (const term of [
    "overflow-x: auto",
    "overscroll-behavior-inline: contain",
    "trading lab dashboard must not be exposed on /mypage",
    "trading lab dashboard must not be exposed on homepage or public router",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForLiveGuardedTrading: true",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

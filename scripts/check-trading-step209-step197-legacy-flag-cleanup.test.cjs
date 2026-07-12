const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step209 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step209-step197-legacy-flag-cleanup.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step209-step197-legacy-flag-cleanup\] ok/);
});

test("Step209 package script links legacy cleanup and regression checker tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step209-step197-legacy-flag-cleanup/);
  assert.match(packageJson, /scripts\/check-trading-step209-step197-legacy-flag-cleanup\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step209-step197-legacy-flag-cleanup\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step208-ai-ml-contract-primitives-step197-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step207-ai-ml-contract-primitives-step198-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step206-finple-test-temp-guard\.test\.cjs/);
});

test("Step209 keeps cleanup service-only without UI or dashboard markers", () => {
  for (const file of [
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "server/src/services/tradingAdminLabDashboardShell.js",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Step209/);
    assert.doesNotMatch(source, /legacy-flag-cleanup/);
  }
});

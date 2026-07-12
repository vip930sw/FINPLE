const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step206 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step206-finple-test-temp-guard.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step206-finple-test-temp-guard\] ok/);
});

test("Step206 package scripts wire guard commands and regression links", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:finple-temp-guard:ai-ml/);
  assert.match(packageJson, /diagnose:finple-temp-guard:full/);
  assert.match(packageJson, /check:trading-step206-finple-test-temp-guard/);
  assert.match(packageJson, /scripts\/finple-test-temp-guard\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step205-ai-ml-collapsed-summary-polish\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step203-ai-ml-grouped-regression\.test\.cjs/);
});

test("Step206 guard stays script-only without endpoint or UI markers", () => {
  for (const file of [
    "src/components/TradingAiMlPanelGroup.jsx",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "server/src/services/tradingAdminLabDashboardShell.js",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Step206/);
    assert.doesNotMatch(source, /finple-test-temp-guard/);
  }
});

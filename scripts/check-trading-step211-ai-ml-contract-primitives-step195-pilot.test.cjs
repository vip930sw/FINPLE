const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step211 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step211-ai-ml-contract-primitives-step195-pilot\] ok/);
});

test("Step211 package script links Step195 service and historical checker regression tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step211-ai-ml-contract-primitives-step195-pilot/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlReadinessGateSummary\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step211-ai-ml-contract-primitives-step195-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step195-ai-ml-readiness-gate-summary\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step210-ai-ml-contract-primitives-step196-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step209-step197-legacy-flag-cleanup\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step208-ai-ml-contract-primitives-step197-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step207-ai-ml-contract-primitives-step198-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step202-ai-ml-contract-primitives-step199-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step206-finple-test-temp-guard\.test\.cjs/);
});

test("Step211 remains service-only without UI or dashboard markers", () => {
  for (const file of [
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "server/src/services/tradingAdminLabDashboardShell.js",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Step211/);
    assert.doesNotMatch(source, /STEP195_METADATA_ONLY_ALLOWED_FLAGS/);
  }
});

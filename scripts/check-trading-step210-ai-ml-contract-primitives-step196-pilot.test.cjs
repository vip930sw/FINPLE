const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step210 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step210-ai-ml-contract-primitives-step196-pilot\] ok/);
});

test("Step210 package script links Step196 service and historical checker regression tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step210-ai-ml-contract-primitives-step196-pilot/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlBatchContractReview\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step210-ai-ml-contract-primitives-step196-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step196-ai-ml-batch-contract-review\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step209-step197-legacy-flag-cleanup\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step208-ai-ml-contract-primitives-step197-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step207-ai-ml-contract-primitives-step198-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step202-ai-ml-contract-primitives-step199-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step206-finple-test-temp-guard\.test\.cjs/);
});

test("Step210 remains service-only without UI or dashboard markers", () => {
  for (const file of [
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "server/src/services/tradingAdminLabDashboardShell.js",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Step210/);
    assert.doesNotMatch(source, /STEP196_METADATA_ONLY_ALLOWED_FLAGS/);
  }
});

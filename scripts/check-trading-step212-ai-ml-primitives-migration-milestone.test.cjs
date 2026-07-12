const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step212 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step212-ai-ml-primitives-migration-milestone\] ok/);
});

test("Step212 package script links audit, checker, and regression checker tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step212-ai-ml-primitives-migration-milestone/);
  assert.match(packageJson, /scripts\/trading-ai-ml-primitives-migration-audit\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step212-ai-ml-primitives-migration-milestone\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step211-ai-ml-contract-primitives-step195-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step210-ai-ml-contract-primitives-step196-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step209-step197-legacy-flag-cleanup\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step208-ai-ml-contract-primitives-step197-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step207-ai-ml-contract-primitives-step198-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step202-ai-ml-contract-primitives-step199-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step206-finple-test-temp-guard\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step203-ai-ml-grouped-regression\.test\.cjs/);
});

test("Step212 remains script-only without UI or route markers", () => {
  for (const file of [
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "server/src/services/tradingAdminLabDashboardShell.js",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Step212/);
    assert.doesNotMatch(source, /AI_ML_PRIMITIVE_MIGRATION_STAGES/);
  }
});

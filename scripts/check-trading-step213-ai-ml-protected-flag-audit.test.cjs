const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step213 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step213-ai-ml-protected-flag-audit\] ok/);
});

test("Step213 package script links audit, checkers, and regression checker tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step213-ai-ml-protected-flag-audit/);
  assert.match(packageJson, /scripts\/trading-ai-ml-primitives-migration-audit\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step212-ai-ml-primitives-migration-milestone\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step213-ai-ml-protected-flag-audit\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step211-ai-ml-contract-primitives-step195-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step210-ai-ml-contract-primitives-step196-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step209-step197-legacy-flag-cleanup\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step208-ai-ml-contract-primitives-step197-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step207-ai-ml-contract-primitives-step198-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step202-ai-ml-contract-primitives-step199-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step206-finple-test-temp-guard\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step203-ai-ml-grouped-regression\.test\.cjs/);
});

test("Step213 remains compatible after Step194 service migration without UI or route edits", () => {
  const touched = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  for (const forbidden of [
    "server/src/services/tradingAiMlBatchContractReview.js",
    "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
    "server/src/services/tradingAiMlManifestValidationReport.js",
    "server/src/services/tradingAiMlManifestHandoffEligibility.js",
    "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

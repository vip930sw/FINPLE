const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step214 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step214-ai-ml-contract-primitives-step194-pilot\] ok/);
});

test("Step214 package script links Step194 migration and audit regression tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step214-ai-ml-contract-primitives-step194-pilot/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlFeaturePipelinePreflight\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step214-ai-ml-contract-primitives-step194-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step194-ai-ml-feature-pipeline-preflight\.test\.cjs/);
  assert.match(packageJson, /scripts\/trading-ai-ml-primitives-migration-audit\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step213-ai-ml-protected-flag-audit\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step212-ai-ml-primitives-migration-milestone\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step211-ai-ml-contract-primitives-step195-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step203-ai-ml-grouped-regression\.test\.cjs/);
});

test("Step214 touches only allowed migration, audit, checker, and package files", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
  for (const forbidden of [
    "server/src/services/tradingAiMlReadinessGateSummary.js",
    "server/src/services/tradingAiMlBatchContractReview.js",
    "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
    "server/src/services/tradingAiMlManifestValidationReport.js",
    "server/src/services/tradingAiMlManifestHandoffEligibility.js",
    "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
    "server/src/services/tradingAiMlContractPrimitives.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "scripts/run-trading-ai-ml-regression-group.cjs",
    "scripts/finple-test-temp-guard.cjs",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

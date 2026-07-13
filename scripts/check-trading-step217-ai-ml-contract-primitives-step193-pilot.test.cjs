const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step217 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step217-ai-ml-contract-primitives-step193-pilot\] ok/);
});

test("Step217 package script links Step193 primitive migration coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step217-ai-ml-contract-primitives-step193-pilot/);
  assert.match(packageJson, /scripts\/check-trading-step217-ai-ml-contract-primitives-step193-pilot\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step217-ai-ml-contract-primitives-step193-pilot\.test\.cjs/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlFeaturePipelineArchitecture\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step216-ai-ml-migration-runner-result-contract\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step212-ai-ml-primitives-migration-milestone\.test\.cjs/);
});

test("Step217 stays scoped to Step193 primitive migration without runtime or UI edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
  for (const forbidden of [
    "server/src/services/tradingAiMlStrategyManagement.js",
    "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
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

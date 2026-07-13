const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step216 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step216-ai-ml-migration-runner-result-contract\] ok/);
});

test("Step216 package script links runner result contract coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step216-ai-ml-migration-runner-result-contract/);
  assert.match(packageJson, /scripts\/check-trading-step216-ai-ml-migration-runner-result-contract\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step216-ai-ml-migration-runner-result-contract\.test\.cjs/);
  assert.match(packageJson, /scripts\/run-trading-ai-ml-primitives-migration-regression\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step215-ai-ml-migration-regression-consolidation\.test\.cjs/);
});

test("Step216 remains runner-contract only without service runtime or UI edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
  for (const forbidden of [
    "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
    "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
    "server/src/services/tradingAiMlReadinessGateSummary.js",
    "server/src/services/tradingAiMlBatchContractReview.js",
    "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
    "server/src/services/tradingAiMlManifestValidationReport.js",
    "server/src/services/tradingAiMlManifestHandoffEligibility.js",
    "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
    "server/src/services/tradingAiMlContractPrimitives.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "scripts/run-trading-ai-ml-regression-group.cjs",
    "scripts/finple-test-temp-guard.cjs",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

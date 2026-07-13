const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step215 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step215-ai-ml-migration-regression-consolidation\] ok/);
});

test("Step215 package scripts link consolidated runner and checker regression", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step215-ai-ml-migration-regression-consolidation/);
  assert.match(packageJson, /check:trading-ai-ml-primitives-migration-regression/);
  assert.match(packageJson, /scripts\/run-trading-ai-ml-primitives-migration-regression\.cjs/);
  assert.match(packageJson, /scripts\/run-trading-ai-ml-primitives-migration-regression\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step215-ai-ml-migration-regression-consolidation\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step214-ai-ml-contract-primitives-step194-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step213-ai-ml-protected-flag-audit\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step212-ai-ml-primitives-migration-milestone\.test\.cjs/);
});

test("Step215 remains script and test only without service runtime or UI edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
  for (const forbidden of [
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

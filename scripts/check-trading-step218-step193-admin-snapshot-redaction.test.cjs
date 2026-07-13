const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step218 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step218-step193-admin-snapshot-redaction\] ok/);
});

test("Step218 package script links admin snapshot redaction coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step218-step193-admin-snapshot-redaction/);
  assert.match(packageJson, /scripts\/check-trading-step218-step193-admin-snapshot-redaction\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step218-step193-admin-snapshot-redaction\.test\.cjs/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlFeaturePipelineArchitecture\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step217-ai-ml-contract-primitives-step193-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step216-ai-ml-migration-runner-result-contract\.test\.cjs/);
});

test("Step218 stays scoped to Step193 admin snapshot redaction", () => {
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
    "server/src/services/tradingAdminLabDashboardShell.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "scripts/run-trading-ai-ml-regression-group.cjs",
    "scripts/finple-test-temp-guard.cjs",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

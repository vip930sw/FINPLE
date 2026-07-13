const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step236A checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step236a-rules-based-trading-eligibility.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step236a-rules-based-trading-eligibility\] ok/);
  assert.match(output, /"mode": "offline_rules_based_research_baseline"/);
  assert.match(output, /"total": 28/);
  assert.match(output, /"minimumObservationCount": 13/);
  assert.match(output, /"nullFeatureImputationAllowed": false/);
  assert.match(output, /"modelTrainingAllowed": false/);
  assert.match(output, /"performanceClaimAllowed": false/);
  assert.match(output, /"orderSubmissionAllowed": false/);
  assert.match(output, /"actualLiveTradingReady": false/);
});

test("Step236A package script is dedicated to the rules-based eligibility checker", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step236a-rules-based-trading-eligibility/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlRulesBasedTradingEligibility\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step236a-rules-based-trading-eligibility\.test\.cjs/);
});

test("Step236A keeps prior contracts registry workflow UI and scenario files untouched", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    ".github/workflows/trading-offline-data-quality-report.yml",
    "server/src/services/tradingAiMlTradingFeatureContract.js",
    "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
    "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlDatasetContractManifest.js",
    "server/src/services/tradingAiMlRealFormatDatasetAdapter.js",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.jsx",
    "src/App.css",
    "server/src/index.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step236B checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step236b-offline-research-position-policy.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step236b-offline-research-position-policy\] ok/);
  assert.match(output, /"mode": "offline_research_position_policy"/);
  assert.match(output, /"totalDecisions": 28/);
  assert.match(output, /"appliedTransitions": 27/);
  assert.match(output, /"unappliedFinalDecisions": 1/);
  assert.match(output, /"samePeriodExecutionAllowed": false/);
  assert.match(output, /"leverageAllowed": false/);
  assert.match(output, /"shortExposureAllowed": false/);
  assert.match(output, /"performanceClaimAllowed": false/);
  assert.match(output, /"orderSubmissionAllowed": false/);
  assert.match(output, /"actualLiveTradingReady": false/);
});

test("Step236B package script is dedicated to the research position policy checker", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step236b-offline-research-position-policy/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlResearchPositionPolicy\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step236b-offline-research-position-policy\.test\.cjs/);
});

test("Step236B keeps prior contracts registry workflow UI and scenario files untouched", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    ".github/workflows/trading-offline-data-quality-report.yml",
    "server/src/services/tradingAiMlTradingFeatureContract.js",
    "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
    "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
    "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
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

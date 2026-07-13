const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step235B checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step235b-offline-feature-coverage.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step235b-offline-feature-coverage\] ok/);
  assert.match(output, /"reportMode": "offline_synthetic_feature_coverage"/);
  assert.match(output, /"total": 28/);
  assert.match(output, /"featuresFullyCovered": 5/);
  assert.match(output, /"featureUsesFutureData": false/);
  assert.match(output, /"orderSubmissionAllowed": false/);
  assert.match(output, /"actualLiveTradingReady": false/);
});

test("Step235B package scripts are dedicated to report and checker", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /report:trading-step235b-offline-feature-coverage/);
  assert.match(packageJson, /check:trading-step235b-offline-feature-coverage/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlTradingFeatureCoverageReport\.test\.js/);
  assert.match(packageJson, /scripts\/report-trading-step235b-offline-feature-coverage\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step235b-offline-feature-coverage\.test\.cjs/);
});

test("Step235B keeps Step235A prior schema policy registry workflow UI and scenario files untouched", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    ".github/workflows/trading-offline-data-quality-report.yml",
    "server/src/services/tradingAiMlTradingFeatureContract.js",
    "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
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

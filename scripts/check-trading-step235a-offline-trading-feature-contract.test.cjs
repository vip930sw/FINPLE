const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step235A checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step235a-offline-trading-feature-contract.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step235a-offline-trading-feature-contract\] ok/);
  assert.match(output, /"mode": "offline_synthetic_feature_pilot"/);
  assert.match(output, /"total": 28/);
  assert.match(output, /"featureUsesFutureData": false/);
  assert.match(output, /"orderSubmissionAllowed": false/);
  assert.match(output, /"liveTradingAllowed": false/);
});

test("Step235A package script is dedicated to contract and builder tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step235a-offline-trading-feature-contract/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlTradingFeatureContract\.test\.js/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlOfflineFeatureBuilder\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step235a-offline-trading-feature-contract\.test\.cjs/);
});

test("Step235A keeps prior schema policy registry workflow UI and scenario files untouched", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    ".github/workflows/trading-offline-data-quality-report.yml",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlDatasetContractManifest.js",
    "server/src/services/tradingAiMlDatasetQualityProfile.js",
    "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
    "server/src/services/tradingAiMlDatasetQualityGate.js",
    "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
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

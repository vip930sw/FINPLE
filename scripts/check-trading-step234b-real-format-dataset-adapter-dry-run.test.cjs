const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step234B checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step234b-real-format-dataset-adapter-dry-run.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step234b-real-format-dataset-adapter-dry-run\] ok/);
  assert.match(output, /"sourceRows": \{\s+"total": 10,\s+"us": 5,\s+"kr": 5/s);
  assert.match(output, /"adaptedRecords": \{\s+"total": 10,\s+"train": 6,\s+"validation": 2,\s+"test": 2/s);
  assert.match(output, /"decision": "allow_offline_promotion"/);
  assert.match(output, /"actualLiveTradingReady": false/);
  assert.match(output, /"state": "blocked"/);
});

test("Step234B package scripts are dedicated to report and checker", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /report:trading-step234b-real-format-dataset-dry-run/);
  assert.match(packageJson, /check:trading-step234b-real-format-dataset-adapter-dry-run/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlRealFormatDatasetAdapter\.test\.js/);
  assert.match(packageJson, /scripts\/report-trading-step234b-real-format-dataset-dry-run\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step234b-real-format-dataset-adapter-dry-run\.test\.cjs/);
});

test("Step234B keeps prior pipeline registry workflow UI and scenario files untouched", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    ".github/workflows/trading-offline-data-quality-report.yml",
    "docs/trading-ai-ml/FINPLE_STEP234A_REAL_FORMAT_DATASET_INVENTORY.md",
    "server/src/services/tradingAiMlDatasetQualityProfile.js",
    "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
    "server/src/services/tradingAiMlDatasetQualityGate.js",
    "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlDatasetContractManifest.js",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.jsx",
    "src/App.css",
    "server/src/index.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

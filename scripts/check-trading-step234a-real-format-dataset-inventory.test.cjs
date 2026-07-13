const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step234A checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step234a-real-format-dataset-inventory.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step234a-real-format-dataset-inventory\] ok/);
  assert.match(output, /"eligible_for_sanitized_dry_run": 2/);
  assert.match(output, /"requires_adapter": 2/);
  assert.match(output, /"requires_manual_review": 6/);
  assert.match(output, /"prohibited": 4/);
  assert.match(output, /"actualLiveTradingReady": false/);
  assert.match(output, /"state": "blocked"/);
});

test("Step234A package script is dedicated to the inventory checker", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step234a-real-format-dataset-inventory/);
  assert.match(packageJson, /scripts\/check-trading-step234a-real-format-dataset-inventory\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step234a-real-format-dataset-inventory\.test\.cjs/);
});

test("Step234A document records all required classification statuses", () => {
  const doc = fs.readFileSync("docs/trading-ai-ml/FINPLE_STEP234A_REAL_FORMAT_DATASET_INVENTORY.md", "utf8");

  for (const status of [
    "eligible_for_sanitized_dry_run",
    "requires_adapter",
    "requires_manual_review",
    "prohibited",
  ]) {
    assert.match(doc, new RegExp(status));
  }

  assert.match(doc, /src\/data\/tickers\/us_screener_candidates\.sample\.csv/);
  assert.match(doc, /src\/data\/tickers\/kr_screener_candidates\.sample\.csv/);
  assert.match(doc, /data\/processed\/scenario_monthly_returns\.schema\.csv/);
  assert.match(doc, /data\/processed\/scenario_p0_source_policy_matrix\.csv/);
});

test("Step234A keeps execution workflow UI DB scenario and runtime files untouched", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    ".github/workflows/trading-offline-data-quality-report.yml",
    "scripts/report-trading-offline-data-quality-ci.cjs",
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

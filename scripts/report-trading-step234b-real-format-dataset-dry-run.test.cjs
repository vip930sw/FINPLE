const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

const {
  buildCurrentStep234BDryRunReport,
} = require("./report-trading-step234b-real-format-dataset-dry-run.cjs");

test("Step234B report script prints the sanitized pass report", () => {
  const output = execFileSync(process.execPath, ["scripts/report-trading-step234b-real-format-dataset-dry-run.cjs"], {
    encoding: "utf8",
  });
  const report = JSON.parse(output);

  assert.equal(report.reportMode, "sanitized_real_format_adapter_dry_run");
  assert.deepEqual(report.sourceRows, { total: 10, us: 5, kr: 5 });
  assert.deepEqual(report.adaptedRecords, { total: 10, train: 6, validation: 2, test: 2 });
  assert.equal(report.qualityProfile.status, "pass");
  assert.equal(report.batchSummary.overallStatus, "pass");
  assert.equal(report.gate.decision, "allow_offline_promotion");
  assert.equal(report.gate.offlineDatasetPromotion, true);
  assert.equal(report.readiness.status, "ready_for_standalone_dry_run");
  assert.equal(report.readiness.actualLiveTradingReady, false);
  assert.equal(report.readiness.state, "blocked");
});

test("Step234B report is deterministic and leaves source CSV files unchanged", async () => {
  const beforeUs = fs.readFileSync("src/data/tickers/us_screener_candidates.sample.csv", "utf8");
  const beforeKr = fs.readFileSync("src/data/tickers/kr_screener_candidates.sample.csv", "utf8");
  const first = await buildCurrentStep234BDryRunReport();
  const second = await buildCurrentStep234BDryRunReport();

  assert.deepEqual(first, second);
  assert.equal(fs.readFileSync("src/data/tickers/us_screener_candidates.sample.csv", "utf8"), beforeUs);
  assert.equal(fs.readFileSync("src/data/tickers/kr_screener_candidates.sample.csv", "utf8"), beforeKr);
});

test("Step234B report excludes ticker lists raw payloads paths and hashes", async () => {
  const report = await buildCurrentStep234BDryRunReport();
  const serialized = JSON.stringify(report);

  for (const forbidden of [
    "VOO",
    "QQQ",
    "SCHD",
    "NVDA",
    "069500",
    "005930",
    "rawProviderPayload",
    "providerPayload",
    "orderPayload",
    "rawResponse",
    "credential",
    "secret",
    "token",
    "hash",
    "digest",
    "fingerprint",
    "C:\\",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

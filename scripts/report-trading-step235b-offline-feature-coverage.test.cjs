const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

const {
  buildCurrentStep235BOfflineFeatureCoverageReport,
  formatCurrentStep235BOfflineFeatureCoverageReport,
} = require("./report-trading-step235b-offline-feature-coverage.cjs");

test("Step235B report script prints read-only console summary", () => {
  const output = execFileSync(process.execPath, ["scripts/report-trading-step235b-offline-feature-coverage.cjs"], {
    encoding: "utf8",
  });

  assert.match(output, /FINPLE OFFLINE FEATURE COVERAGE/);
  assert.match(output, /Records: 28/);
  assert.match(output, /Train \/ Validation \/ Test: 20 \/ 4 \/ 4/);
  assert.match(output, /Feature contract: 1\.0\.0/);
  assert.match(output, /Features fully covered: 5 \/ 10/);
  assert.match(output, /Label available: 28 \/ 28/);
  assert.match(output, /Leakage detected: No/);
  assert.match(output, /Model training allowed: No/);
  assert.match(output, /Order submission allowed: No/);
  assert.match(output, /Live trading readiness: Blocked/);
});

test("Step235B report builder is deterministic and leaves no tracked output", async () => {
  const first = await buildCurrentStep235BOfflineFeatureCoverageReport();
  const second = await buildCurrentStep235BOfflineFeatureCoverageReport();
  const text = await formatCurrentStep235BOfflineFeatureCoverageReport();

  assert.deepEqual(first, second);
  assert.equal(text.includes("assetKey"), false);
  assert.equal(text.includes("synthetic-us-core"), false);
  assert.equal(text.includes("2020-"), false);
});

test("Step235B console output excludes prohibited material", async () => {
  const text = await formatCurrentStep235BOfflineFeatureCoverageReport();

  for (const forbidden of [
    "assetKey",
    "ticker",
    "recordId",
    "synthetic-us-core",
    "synthetic-kr-core",
    "providerPayload",
    "orderPayload",
    "credential",
    "secret",
    "token",
    "hash",
    "digest",
    "fingerprint",
    "close",
    "monthlyReturn",
    "C:\\",
  ]) {
    assert.equal(text.includes(forbidden), false, forbidden);
  }
});

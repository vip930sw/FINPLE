const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

test("Step229 checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step229-offline-dataset-quality-profile.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step229-offline-dataset-quality-profile\] ok/);
  assert.match(output, /"schemaVersion": "1.0.0"/);
  assert.match(output, /"profileMode": "offline_fixture"/);
  assert.match(output, /"status": "pass"/);
  assert.match(output, new RegExp(`"step228BaselineCommit": "${BASELINE_COMMIT}"`));
});

test("Step229 package script runs through the dedicated checker and tests only", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step229-offline-dataset-quality-profile/);
  assert.match(packageJson, /scripts\/check-trading-step229-offline-dataset-quality-profile\.cjs/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlDatasetQualityProfile\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step229-offline-dataset-quality-profile\.test\.cjs/);
});

test("Step229 keeps the Step228 snapshot counts and baseline unchanged", () => {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));

  assert.equal(snapshot.baselineCommit, BASELINE_COMMIT);
  assert.deepEqual(snapshot.coveredSteps, [223, 224, 225, 226, 227]);
  assert.equal(snapshot.coreAudit.counts.sourceCheckerCount, 13);
  assert.equal(snapshot.coreAudit.counts.uniqueServiceTestCount, 10);
  assert.equal(snapshot.coreAudit.counts.uniqueMigrationCheckerTestCount, 14);
  assert.equal(snapshot.coreAudit.counts.uniqueSupportingTestCount, 11);
  assert.equal(snapshot.coreAudit.counts.uniqueCheckerTestCount, 25);
  assert.equal(snapshot.coreAudit.counts.uniqueTestFileCount, 35);
  assert.equal(snapshot.supplementalGuards.count, 1);
  assert.equal(snapshot.totals.totalSourceCheckerCount, 14);
  assert.equal(snapshot.totals.totalUniqueCheckerTestCount, 26);
  assert.equal(snapshot.totals.totalUniqueTestFileCount, 37);
  assert.equal(snapshot.duplicates.duplicateFileCount, 0);
  assert.equal(snapshot.readiness.actualLiveTradingReady, false);
  assert.equal(snapshot.readiness.state, "blocked");
});

test("Step229 dirty file boundary excludes registries, Step192 runtime, UI, DB, and scenario assets", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));
  for (const forbidden of [
    "data/processed/trading-ai-ml/step192_contract_hardening_snapshot.json",
    "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
    "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
    "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
    "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
    "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs",
    "scripts/check-trading-step228-contract-hardening-handoff.cjs",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlDatasetContractManifest.js",
    "server/src/index.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.jsx",
    "src/App.css",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

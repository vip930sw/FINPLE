const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");
const {
  SNAPSHOT_PATH,
  SNAPSHOT_TOP_LEVEL_KEYS,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

test("Step228 checker passes and leaves working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step228-contract-hardening-handoff.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step228-contract-hardening-handoff\] ok/);
  assert.match(output, /"baselineCommit": "c306dc775a1d5dcba32271934ed112d7ef97a768"/);
  assert.match(output, /"coreScope": "step192_to_step200"/);
});

test("Step228 package scripts link snapshot generation and read-only check", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /snapshot:trading-step192-contract-hardening-audit/);
  assert.match(packageJson, /check:trading-step228-contract-hardening-handoff/);
  assert.match(packageJson, /scripts\/snapshot-trading-step192-contract-hardening-audit\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step228-contract-hardening-handoff\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step228-contract-hardening-handoff\.test\.cjs/);
});

test("Step228 snapshot exact schema and baseline values are frozen", () => {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));

  assert.deepEqual(Object.keys(snapshot), SNAPSHOT_TOP_LEVEL_KEYS);
  assert.equal(snapshot.baselineCommit, "c306dc775a1d5dcba32271934ed112d7ef97a768");
  assert.deepEqual(snapshot.coveredSteps, [223, 224, 225, 226, 227]);
  assert.equal(snapshot.coreAudit.scope, "step192_to_step200");
  assert.equal(snapshot.coreAudit.expectedStageCount, 9);
  assert.equal(snapshot.coreAudit.counts.sourceCheckerCount, 13);
  assert.equal(snapshot.coreAudit.counts.uniqueServiceTestCount, 10);
  assert.equal(snapshot.coreAudit.counts.uniqueMigrationCheckerTestCount, 14);
  assert.equal(snapshot.coreAudit.counts.uniqueSupportingTestCount, 11);
  assert.equal(snapshot.coreAudit.counts.uniqueCheckerTestCount, 25);
  assert.equal(snapshot.coreAudit.counts.uniqueTestFileCount, 35);
  assert.equal(snapshot.supplementalGuards.count, 1);
  assert.deepEqual(snapshot.supplementalGuards.checks, ["step225_step192_dataset_contract_manifest"]);
  assert.equal(snapshot.totals.totalSourceCheckerCount, 14);
  assert.equal(snapshot.totals.totalUniqueCheckerTestCount, 26);
  assert.equal(snapshot.totals.totalUniqueTestFileCount, 37);
  assert.equal(snapshot.duplicates.duplicateFileCount, 0);
  assert.deepEqual(snapshot.duplicates.duplicateSourceCheckers, []);
  assert.equal(snapshot.readiness.actualLiveTradingReady, false);
  assert.equal(snapshot.readiness.state, "blocked");
});

test("Step228 handoff includes required reproduction commands", () => {
  const handoff = fs.readFileSync("docs/trading-ai-ml/FINPLE_STEP192_CONTRACT_HARDENING_HANDOFF.md", "utf8");
  for (const command of [
    "npm.cmd run check:trading-step228-contract-hardening-handoff",
    "npm.cmd run check:trading-step227-ai-ml-audit-reporting-baseline",
    "npm.cmd run report:trading-ai-ml-audit-summary",
    "npm.cmd run check:trading-step226-step225-supplemental-audit-registration",
    "npm.cmd run check:trading-step225-step192-dataset-contract-manifest",
    "npm.cmd run check:trading-step224-step192-dataset-contract-compatibility",
    "npm.cmd run check:trading-step223-ai-ml-contract-primitives-step192-pilot",
    "npm.cmd run check:trading-ai-ml-primitives-migration-regression",
    "npm.cmd run check:trading-ai-ml-regression",
  ]) {
    assert.match(handoff, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step228 remains documentation snapshot and validation only", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));
  for (const forbidden of [
    "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlDatasetContractManifest.js",
    "server/src/index.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.jsx",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

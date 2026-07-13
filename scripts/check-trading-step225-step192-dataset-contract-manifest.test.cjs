const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step225 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step225-step192-dataset-contract-manifest.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step225-step192-dataset-contract-manifest\] ok/);
});

test("Step225 package script links manifest service and checker coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step225-step192-dataset-contract-manifest/);
  assert.match(packageJson, /scripts\/check-trading-step225-step192-dataset-contract-manifest\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step225-step192-dataset-contract-manifest\.test\.cjs/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlDatasetContractManifest\.test\.js/);
});

test("Step225 stays out of audit runner UI endpoint TEMP DB and simulator files", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
    "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
    "scripts/finple-test-temp-guard.cjs",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "server/src/index.js",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

test("Step225 checker preserves previous audit and runner counts", () => {
  const checker = fs.readFileSync("scripts/check-trading-step225-step192-dataset-contract-manifest.cjs", "utf8");

  for (const snippet of [
    "audit.expectedStageCount, 9",
    "regressionPlan.sourceCheckerCount, 13",
    "regressionPlan.uniqueServiceTestCount, 10",
    "regressionPlan.uniqueMigrationCheckerTestCount, 14",
    "regressionPlan.uniqueSupportingTestCount, 11",
    "regressionPlan.uniqueCheckerTestCount, 25",
    "regressionPlan.uniqueTestFileCount, 35",
    "regressionPlan.duplicateFileCount, 0",
  ]) {
    assert.match(checker, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

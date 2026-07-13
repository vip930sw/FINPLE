const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step224 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step224-step192-dataset-contract-compatibility\] ok/);
});

test("Step224 package script links Step192 dataset contract compatibility coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step224-step192-dataset-contract-compatibility/);
  assert.match(packageJson, /scripts\/check-trading-step224-step192-dataset-contract-compatibility\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step224-step192-dataset-contract-compatibility\.test\.cjs/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlDatasetArchitecture\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step223-ai-ml-contract-primitives-step192-pilot\.test\.cjs/);
});

test("Step224 stays scoped away from runtime provider UI DB and simulator files", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));

  for (const forbidden of [
    "server/src/services/tradingAiMlStrategyManagement.js",
    "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
    "server/src/services/tradingAiMlContractPrimitives.js",
    "server/src/services/tradingAdminLabDashboardShell.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
    "scripts/finple-test-temp-guard.cjs",
    "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
    "scripts/check-trading-step222-finple-temp-producer-attribution.cjs",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

test("Step224 checker strengthens Step223 exact Step192 output vocabulary", () => {
  const step223Checker = fs.readFileSync("scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs", "utf8");
  const step224Checker = fs.readFileSync("scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs", "utf8");

  for (const snippet of [
    "STEP192_LABEL_KEYS",
    "STEP192_SPLIT_POLICY_KEYS",
    "STEP192_WALK_FORWARD_POLICY_KEYS",
    "threshold: 0",
    "purgeOverlapRequired",
    "leakageReviewRequired",
    "unknownPolicyKey",
  ]) {
    assert.match(step223Checker + step224Checker, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

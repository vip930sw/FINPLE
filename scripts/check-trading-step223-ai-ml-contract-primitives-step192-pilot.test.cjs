const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step223 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step223-ai-ml-contract-primitives-step192-pilot\] ok/);
});

test("Step223 package script links Step192 primitive migration coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step223-ai-ml-contract-primitives-step192-pilot/);
  assert.match(packageJson, /scripts\/check-trading-step223-ai-ml-contract-primitives-step192-pilot\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step223-ai-ml-contract-primitives-step192-pilot\.test\.cjs/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlDatasetArchitecture\.test\.js/);
});

test("Step223 stays scoped to Step192 primitive migration without runtime or UI edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
  for (const forbidden of [
    "server/src/services/tradingAiMlStrategyManagement.js",
    "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
    "server/src/services/tradingAiMlContractPrimitives.js",
    "server/src/services/tradingAdminLabDashboardShell.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "scripts/finple-test-temp-guard.cjs",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});

test("Step192 read-only audit preserved", () => {
  const checker = fs.readFileSync("scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs", "utf8");

  assert.match(checker, /audit\.scope === "step192_to_step200"/);
  assert.match(checker, /audit\.expectedStageCount === 9/);
  assert.match(checker, /audit\.unexpectedTruePermissionCount === 0/);
  assert.match(checker, /regressionPlan\.sourceCheckerCount === 13/);
  assert.match(checker, /regressionPlan\.uniqueTestFileCount === 35/);
});

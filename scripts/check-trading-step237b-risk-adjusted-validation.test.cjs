const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const CHECKER = "scripts/check-trading-step237b-risk-adjusted-validation.cjs";
const SERVICE = "server/src/services/tradingAiMlRiskAdjustedValidation.js";
const SERVICE_TEST = "server/src/services/tradingAiMlRiskAdjustedValidation.test.js";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step237B checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync("node", [CHECKER], { encoding: "utf8" });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  assert.equal(after, before);
  assert.match(output, /\[check-trading-step237b-risk-adjusted-validation\] ok/);
  assert.match(output, /"metricMode": "offline_synthetic_risk_adjusted_validation"/);
  assert.match(output, /"riskFreeRate": 0/);
  assert.match(output, /"foldMetricCount": 3/);
  assert.match(output, /"regimeMetricCount": 5/);
  assert.doesNotMatch(output, /assetKey|ticker|monthlyReturn|forwardReturn1m|labelClass/);
});

test("Step237B package script is dedicated to risk-adjusted validation tests", () => {
  const packageJson = read("package.json");
  assert.match(packageJson, /"check:trading-step237b-risk-adjusted-validation"/);
  assert.match(packageJson, /check-trading-step237b-risk-adjusted-validation\.cjs/);
  assert.match(packageJson, /tradingAiMlRiskAdjustedValidation\.test\.js/);
  assert.match(packageJson, /check-trading-step237b-risk-adjusted-validation\.test\.cjs/);
});

test("Step237B stays scoped away from Step235A through Step237A and runtime surfaces", () => {
  const touched = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const allowed = new Set([
    "package.json",
    SERVICE,
    SERVICE_TEST,
    CHECKER,
    "scripts/check-trading-step237b-risk-adjusted-validation.test.cjs",
  ]);
  for (const file of touched) {
    assert.equal(allowed.has(file), true, `unexpected touched file: ${file}`);
  }
  for (const forbidden of [
    "server/src/services/tradingAiMlTradingFeatureContract.js",
    "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
    "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
    "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
    "server/src/services/tradingAiMlResearchPositionPolicy.js",
    "server/src/services/tradingAiMlBacktestCostPolicy.js",
    "server/src/services/tradingAiMlOfflineBacktest.js",
    "server/src/services/tradingAiMlWalkForwardRegimeValidation.js",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/index.js",
    ".github/workflows/trading-offline-data-quality-report.yml",
  ]) {
    assert.equal(touched.some((file) => file === forbidden || file.startsWith(`${forbidden}/`)), false);
  }
});

test("Step237B source documents risk-free observation cost and safety policies", () => {
  const source = read(SERVICE);
  for (const snippet of [
    "riskFreeRate: 0",
    "synthetic_zero_assumption",
    "minimumSharpePeriods: 12",
    "minimumCalmarPeriods: 12",
    "sharpeRatio",
    "calmarRatio",
    "zero_cost",
    "base_synthetic_cost",
    "elevated_synthetic_cost",
    "costMonotonicityViolationDetected",
    "paperTradingAllowed: false",
    "shadowTradingAllowed: false",
    "actualLiveTradingReady: false",
  ]) {
    assert.equal(source.includes(snippet), true, `missing snippet: ${snippet}`);
  }
  for (const forbidden of [
    "fetch(",
    "axios",
    "createClient(",
    "writeFile",
    "appendFile",
    "Math.random",
    "Date.now",
    "performanceClaimAllowed: true",
    "modelTrainingAllowed: true",
    "providerAccessAllowed: true",
    "orderSubmissionAllowed: true",
    "liveTradingAllowed: true",
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden source snippet: ${forbidden}`);
  }
});

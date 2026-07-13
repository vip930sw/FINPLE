const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const CHECKER = "scripts/check-trading-step237a-walk-forward-regime-validation.cjs";
const SERVICE = "server/src/services/tradingAiMlWalkForwardRegimeValidation.js";
const SERVICE_TEST = "server/src/services/tradingAiMlWalkForwardRegimeValidation.test.js";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step237A checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync("node", [CHECKER], { encoding: "utf8" });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  assert.equal(after, before);
  assert.match(output, /\[check-trading-step237a-walk-forward-regime-validation\] ok/);
  assert.match(output, /"foldCounts"/);
  assert.match(output, /"regimeCounts"/);
  assert.match(output, /"overallStatus": "review_required"/);
  assert.doesNotMatch(output, /assetKey|ticker|monthlyReturn|forwardReturn1m|labelClass/);
});

test("Step237A package script is dedicated to validation service and checker tests", () => {
  const packageJson = read("package.json");
  assert.match(packageJson, /"check:trading-step237a-walk-forward-regime-validation"/);
  assert.match(packageJson, /check-trading-step237a-walk-forward-regime-validation\.cjs/);
  assert.match(packageJson, /tradingAiMlWalkForwardRegimeValidation\.test\.js/);
  assert.match(packageJson, /check-trading-step237a-walk-forward-regime-validation\.test\.cjs/);
});

test("Step237A stays scoped away from prior contracts registry workflow UI and scenario files", () => {
  const touched = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const allowed = new Set([
    "package.json",
    SERVICE,
    SERVICE_TEST,
    CHECKER,
    "scripts/check-trading-step237a-walk-forward-regime-validation.test.cjs",
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
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/index.js",
    ".github/workflows/trading-offline-data-quality-report.yml",
  ]) {
    assert.equal(touched.some((file) => file === forbidden || file.startsWith(`${forbidden}/`)), false);
  }
});

test("Step237A source documents all required safety and fixture boundaries", () => {
  const source = read(SERVICE);
  for (const snippet of [
    "rising_market",
    "falling_market",
    "sideways_market",
    "high_volatility_market",
    "event_shock_market",
    "eligible_for_research",
    "hold",
    "risk_off",
    "insufficient_history",
    "buildStep236BResearchPositionTransitionLedger",
    "buildStep236COfflineBacktestReport",
    "policyOptimizationDetected",
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

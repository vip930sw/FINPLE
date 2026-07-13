const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP236C_SCRIPT = "check:trading-step236c-cost-aware-offline-backtest";
const STEP236C_COST_POLICY = "server/src/services/tradingAiMlBacktestCostPolicy.js";
const STEP236C_COST_POLICY_TEST = "server/src/services/tradingAiMlBacktestCostPolicy.test.js";
const STEP236C_BACKTEST = "server/src/services/tradingAiMlOfflineBacktest.js";
const STEP236C_BACKTEST_TEST = "server/src/services/tradingAiMlOfflineBacktest.test.js";
const STEP236C_CHECKER = "scripts/check-trading-step236c-cost-aware-offline-backtest.cjs";
const STEP236C_CHECKER_TEST = "scripts/check-trading-step236c-cost-aware-offline-backtest.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP236C_COST_POLICY,
  STEP236C_COST_POLICY_TEST,
  STEP236C_BACKTEST,
  STEP236C_BACKTEST_TEST,
  STEP236C_CHECKER,
  STEP236C_CHECKER_TEST,
  "server/src/services/tradingAiMlResearchPositionPolicy.js",
  "scripts/check-trading-step236b-offline-research-position-policy.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP236C_COST_POLICY,
  STEP236C_COST_POLICY_TEST,
  STEP236C_BACKTEST,
  STEP236C_BACKTEST_TEST,
  STEP236C_CHECKER,
  STEP236C_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
  "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
  "server/src/services/tradingAiMlResearchPositionPolicy.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/services/tradingAiMlRealFormatDatasetAdapter.js",
  "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "server/src/index.js",
  "server/db/migrations",
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, snippet, label) {
  assert(source.includes(snippet), `${label} missing: ${snippet}`);
}

function assertNotIncludes(source, snippet, label) {
  assert(!source.includes(snippet), `${label} must not include: ${snippet}`);
}

function getStatus() {
  return execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .sort();
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  return [...new Set([...tracked, ...getStatus()])].map((file) => file.replace(/\\/g, "/")).sort();
}

async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const costPolicySource = read(STEP236C_COST_POLICY);
  const backtestSource = read(STEP236C_BACKTEST);
  const backtestTest = read(STEP236C_BACKTEST_TEST);

  for (const snippet of [
    `"${STEP236C_SCRIPT}"`,
    STEP236C_COST_POLICY_TEST,
    STEP236C_BACKTEST_TEST,
    STEP236C_CHECKER,
    STEP236C_CHECKER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step236C script");
  }

  for (const snippet of [
    "synthetic_research_cost_model",
    "commissionBps: 5",
    "slippageBps: 5",
    "taxBps: 0",
    "fixedFeeUsed: false",
    "leverageAllowed: false",
    "shortExposureAllowed: false",
    "actualMarketCostClaimed: false",
  ]) {
    assertIncludes(costPolicySource, snippet, "Step236C cost policy source");
  }

  for (const snippet of [
    "offline_synthetic_cost_aware_pilot",
    "buildStep236BResearchPositionTransitionLedger",
    "effectiveExposure",
    "researchPeriodReturn",
    "transactionCostRate",
    "grossPeriodReturn",
    "netPeriodReturn",
    "grossEquity",
    "netEquity",
    "alwaysFlat",
    "alwaysExposed",
    "performanceClaimAllowed: false",
    "modelTrainingAllowed: false",
    "providerAccessAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(backtestSource, snippet, "Step236C backtest source");
  }

  for (const snippet of [
    "default Step236B all-flat exposure produces zero strategy returns and costs",
    "applies exposure only to aligned future research return periods",
    "positive costs reduce net return",
    "always-flat and always-exposed baselines",
    "label changes do not affect backtest",
    "failure fixtures reject alignment exposure non-finite cost label and claim risks",
  ]) {
    assertIncludes(backtestTest, snippet, "Step236C backtest test");
  }

  for (const forbidden of [
    "fet" + "ch(",
    "axi" + "os",
    "create" + "Client(",
    "supabase" + ".from(",
    "write" + "File",
    "append" + "File",
    "create" + "Write" + "Stream",
    "Date" + ".now",
    "new Date()",
    "Math" + ".random",
    "kis" + "Token",
    "kis" + "Quote",
    "actualMarketCostClaimed: true",
    "performanceClaimAllowed: true",
    "modelTrainingAllowed: true",
    "providerAccessAllowed: true",
    "orderSubmissionAllowed: true",
    "liveTradingAllowed: true",
  ]) {
    assertNotIncludes(`${costPolicySource}\n${backtestSource}`, forbidden, "Step236C source");
  }

  const service = await import(`${pathToFileURL(`${process.cwd()}/${STEP236C_BACKTEST}`).href}?check=${process.pid}`);
  const report = service.buildStep236COfflineBacktestReport();
  const ledger = service.buildStep236COfflineBacktestLedger();
  const text = service.formatStep236COfflineBacktestReport(report);

  assertStrict.deepEqual(Object.keys(report), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.topLevelKeys);
  assertStrict.deepEqual(Object.keys(report.recordCounts), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.recordCountKeys);
  assertStrict.deepEqual(Object.keys(report.turnover), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.turnoverKeys);
  assertStrict.deepEqual(Object.keys(report.costs), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.costKeys);
  assertStrict.deepEqual(Object.keys(report.performance), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.performanceKeys);
  assertStrict.deepEqual(Object.keys(report.checks), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.checkKeys);
  assertStrict.deepEqual(Object.keys(report.usage), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.usageKeys);
  assertStrict.deepEqual(Object.keys(report.readiness), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.readinessKeys);
  assertStrict.deepEqual(Object.keys(ledger[0]), service.STEP236C_OFFLINE_BACKTEST_CONTRACT.ledgerKeys);
  assert(report.recordCounts.totalPeriods === 27, "default total periods changed");
  assert(report.recordCounts.exposedPeriods === 0, "default Step236B exposure opened");
  assert(report.costModel.actualMarketCostClaimed === false, "actual cost claim opened");
  assert(report.usage.researchOnly === true, "researchOnly not true");
  assert(report.usage.performanceClaimAllowed === false, "performance claim opened");
  assert(report.usage.modelTrainingAllowed === false, "model training opened");
  assert(report.usage.providerAccessAllowed === false, "provider access opened");
  assert(report.usage.orderSubmissionAllowed === false, "order submission opened");
  assert(report.usage.liveTradingAllowed === false, "live trading opened");
  assert(report.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(report.readiness.state === "blocked", "readiness state changed");
  service.validateStep236COfflineBacktestReport(report);
  service.validateStep236COfflineBacktestLedger(ledger);
  service.assertNoStep236CBacktestPublicSensitiveMaterial(report);
  service.assertNoStep236CBacktestPublicSensitiveMaterial(text);

  for (const forbiddenText of [
    "guaranteed return",
    "expected excess return",
    "safe strategy",
    "validated alpha",
    "no loss",
    "buy recommendation",
    "sell recommendation",
    "suitable for users",
  ]) {
    assertNotIncludes(text.toLowerCase(), forbiddenText, "Step236C console report");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step236C touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step236C touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step236C checker modified the working tree");

  console.log("[check-trading-step236c-cost-aware-offline-backtest] ok");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    backtestMode: report.backtestMode,
    positionPolicyVersion: report.positionPolicyVersion,
    costModel: report.costModel,
    recordCounts: report.recordCounts,
    turnover: report.turnover,
    costs: report.costs,
    performance: report.performance,
    baselines: {
      alwaysFlat: report.baselines.alwaysFlat.performance,
      alwaysExposed: report.baselines.alwaysExposed.performance,
    },
    checks: report.checks,
    usage: report.usage,
    readiness: report.readiness,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

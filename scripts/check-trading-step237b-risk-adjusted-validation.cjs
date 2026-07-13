const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP237B_SCRIPT = "check:trading-step237b-risk-adjusted-validation";
const STEP237B_SERVICE = "server/src/services/tradingAiMlRiskAdjustedValidation.js";
const STEP237B_SERVICE_TEST = "server/src/services/tradingAiMlRiskAdjustedValidation.test.js";
const STEP237B_CHECKER = "scripts/check-trading-step237b-risk-adjusted-validation.cjs";
const STEP237B_CHECKER_TEST = "scripts/check-trading-step237b-risk-adjusted-validation.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP237B_SERVICE,
  STEP237B_SERVICE_TEST,
  STEP237B_CHECKER,
  STEP237B_CHECKER_TEST,
  "server/src/services/tradingAiMlWalkForwardRegimeValidation.js",
  "scripts/check-trading-step237a-walk-forward-regime-validation.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP237B_SERVICE,
  STEP237B_SERVICE_TEST,
  STEP237B_CHECKER,
  STEP237B_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
  "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
  "server/src/services/tradingAiMlResearchPositionPolicy.js",
  "server/src/services/tradingAiMlBacktestCostPolicy.js",
  "server/src/services/tradingAiMlOfflineBacktest.js",
  "server/src/services/tradingAiMlWalkForwardRegimeValidation.js",
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
  const serviceSource = read(STEP237B_SERVICE);
  const serviceTest = read(STEP237B_SERVICE_TEST);

  for (const snippet of [
    `"${STEP237B_SCRIPT}"`,
    STEP237B_SERVICE_TEST,
    STEP237B_CHECKER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step237B script");
  }

  for (const snippet of [
    "offline_synthetic_risk_adjusted_validation",
    "synthetic_zero_assumption",
    "riskFreeRate: 0",
    "actualMarketRiskFreeRateClaimed: false",
    "actualMarketPerformanceClaimed: false",
    "minimumSharpePeriods: 12",
    "minimumCalmarPeriods: 12",
    "sharpeRatio",
    "calmarRatio",
    "zero_cost",
    "base_synthetic_cost",
    "elevated_synthetic_cost",
    "costMonotonicityViolationDetected",
    "buildStep237AWalkForwardRegimeValidationReport",
    "paperTradingAllowed: false",
    "shadowTradingAllowed: false",
    "providerAccessAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(serviceSource, snippet, "Step237B source");
  }

  for (const snippet of [
    "calculates Sharpe Calmar and risk-free zero assumption exactly",
    "keeps annualized Sharpe and Calmar unavailable below twelve periods",
    "keeps Sharpe unavailable when volatility is zero",
    "keeps Calmar unavailable when maximum drawdown is zero",
    "cost sensitivity preserves source and cost monotonicity",
    "fold and regime metric arrays match Step237A counts",
    "public report and console text avoid sensitive material and claims",
  ]) {
    assertIncludes(serviceTest, snippet, "Step237B test source");
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
    "performanceClaimAllowed: true",
    "modelTrainingAllowed: true",
    "paperTradingAllowed: true",
    "shadowTradingAllowed: true",
    "providerAccessAllowed: true",
    "orderSubmissionAllowed: true",
    "liveTradingAllowed: true",
    "actualLiveTradingReady: true",
  ]) {
    assertNotIncludes(serviceSource, forbidden, "Step237B source");
  }

  const service = await import(`${pathToFileURL(`${process.cwd()}/${STEP237B_SERVICE}`).href}?check=${process.pid}`);
  const report = service.buildStep237BRiskAdjustedValidationReport();
  const text = service.formatStep237BRiskAdjustedValidationReport(report);

  assertStrict.deepEqual(Object.keys(report), service.STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.topLevelKeys);
  assertStrict.deepEqual(Object.keys(report.assumptions), service.STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.assumptionKeys);
  assertStrict.deepEqual(Object.keys(report.aggregateMetrics), service.STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.metricKeys);
  assert(report.metricMode === "offline_synthetic_risk_adjusted_validation", "Step237B mode changed");
  assert(report.assumptions.riskFreeRate === 0, "riskFreeRate changed");
  assert(report.assumptions.riskFreeRateMode === "synthetic_zero_assumption", "risk-free mode changed");
  assert(report.foldMetrics.length === 3, "fold metric count changed");
  assert(report.regimeMetrics.length === 5, "regime metric count changed");
  assert(report.costSensitivity.length === 3, "cost scenario count changed");
  assert(report.costSensitivity.every((row) => row.sameExposureAndReturnSource === true), "cost source changed");
  assert(report.costSensitivity[0].netTotalReturn >= report.costSensitivity[1].netTotalReturn, "zero/base cost monotonicity changed");
  assert(report.costSensitivity[1].netTotalReturn >= report.costSensitivity[2].netTotalReturn, "base/elevated cost monotonicity changed");
  assert(report.checks.futureLeakageDetected === false, "future leakage opened");
  assert(report.checks.samePeriodExecutionDetected === false, "same-period execution opened");
  assert(report.checks.nonFiniteValueDetected === false, "non-finite opened");
  assert(report.checks.costMonotonicityViolationDetected === false, "cost monotonicity violated");
  assert(report.checks.performanceClaimDetected === false, "performance claim detected");
  assert(report.usage.researchOnly === true, "researchOnly not true");
  assert(report.usage.performanceClaimAllowed === false, "performance claim opened");
  assert(report.usage.modelTrainingAllowed === false, "model training opened");
  assert(report.usage.paperTradingAllowed === false, "paper trading opened");
  assert(report.usage.shadowTradingAllowed === false, "shadow trading opened");
  assert(report.usage.providerAccessAllowed === false, "provider access opened");
  assert(report.usage.orderSubmissionAllowed === false, "order submission opened");
  assert(report.usage.liveTradingAllowed === false, "live trading opened");
  assert(report.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(report.readiness.state === "blocked", "readiness state changed");
  service.validateStep237BRiskAdjustedValidationReport(report);
  service.assertNoStep237BPublicSensitiveMaterial(report);
  service.assertNoStep237BPublicSensitiveMaterial(text);

  for (const forbiddenText of [
    "guaranteed return",
    "expected excess return",
    "safe strategy",
    "validated alpha",
    "market beating",
    "outperform",
    "no loss",
    "buy recommendation",
    "sell recommendation",
    "suitable for users",
    "real account return",
  ]) {
    assertNotIncludes(text.toLowerCase(), forbiddenText, "Step237B console report");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step237B touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step237B touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step237B checker modified the working tree");

  console.log("[check-trading-step237b-risk-adjusted-validation] ok");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    metricMode: report.metricMode,
    assumptions: report.assumptions,
    observationPolicy: report.observationPolicy,
    aggregateMetrics: report.aggregateMetrics,
    foldMetricCount: report.foldMetrics.length,
    regimeMetricCount: report.regimeMetrics.length,
    stabilityRanges: report.stabilityRanges,
    costSensitivity: report.costSensitivity,
    checks: report.checks,
    overallStatus: report.overallStatus,
    usage: report.usage,
    readiness: report.readiness,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

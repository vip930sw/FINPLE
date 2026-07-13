const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP237A_SCRIPT = "check:trading-step237a-walk-forward-regime-validation";
const STEP237A_SERVICE = "server/src/services/tradingAiMlWalkForwardRegimeValidation.js";
const STEP237A_SERVICE_TEST = "server/src/services/tradingAiMlWalkForwardRegimeValidation.test.js";
const STEP237A_CHECKER = "scripts/check-trading-step237a-walk-forward-regime-validation.cjs";
const STEP237A_CHECKER_TEST = "scripts/check-trading-step237a-walk-forward-regime-validation.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP237A_SERVICE,
  STEP237A_SERVICE_TEST,
  STEP237A_CHECKER,
  STEP237A_CHECKER_TEST,
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
  "server/src/services/tradingAiMlResearchPositionPolicy.js",
  "server/src/services/tradingAiMlOfflineBacktest.js",
  "server/src/services/tradingAiMlBacktestCostPolicy.js",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP237A_SERVICE,
  STEP237A_SERVICE_TEST,
  STEP237A_CHECKER,
  STEP237A_CHECKER_TEST,
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
  const serviceSource = read(STEP237A_SERVICE);
  const serviceTest = read(STEP237A_SERVICE_TEST);

  for (const snippet of [
    `"${STEP237A_SCRIPT}"`,
    STEP237A_SERVICE_TEST,
    STEP237A_CHECKER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step237A script");
  }

  for (const snippet of [
    "offline_synthetic_walk_forward_regime_pilot",
    "rising_market",
    "falling_market",
    "sideways_market",
    "high_volatility_market",
    "event_shock_market",
    "buildStep236BResearchPositionTransitionLedger",
    "buildStep236COfflineBacktestReport",
    "buildStep236COfflineBacktestLedger",
    "futureLeakageDetected",
    "crossFoldOverlapDetected",
    "crossSplitOverlapDetected",
    "samePeriodExecutionDetected",
    "policyOptimizationDetected",
    "nonFiniteValueDetected",
    "paperTradingAllowed: false",
    "shadowTradingAllowed: false",
    "providerAccessAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(serviceSource, snippet, "Step237A source");
  }

  for (const snippet of [
    "runs three folds and five required regimes",
    "state fixtures include eligible hold risk-off and insufficient history",
    "event shock waits until the next decision period",
    "missing risk-off after the shock is unstable",
    "blocked failure flags close the validation",
    "output is canonical for shuffled fold and regime input",
    "public report and console text avoid sensitive material",
  ]) {
    assertIncludes(serviceTest, snippet, "Step237A test source");
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
    assertNotIncludes(serviceSource, forbidden, "Step237A source");
  }

  const service = await import(`${pathToFileURL(`${process.cwd()}/${STEP237A_SERVICE}`).href}?check=${process.pid}`);
  const report = service.buildStep237AWalkForwardRegimeValidationReport();
  const text = service.formatStep237AWalkForwardRegimeValidationReport(report);

  assertStrict.deepEqual(Object.keys(report), service.STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.topLevelKeys);
  assertStrict.deepEqual(Object.keys(report.policyVersions), service.STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.policyVersionKeys);
  assertStrict.deepEqual(Object.keys(report.aggregateMetrics), service.STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.metricKeys);
  assertStrict.deepEqual(report.regimeResults.map((item) => item.regime), service.STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.regimeOrder);
  assert(report.foldCounts.total === 3, "Step237A fold count changed");
  assert(report.regimeCounts.total === 5, "Step237A regime count changed");
  assert(report.regimeCounts.completed === 5, "Step237A completed regime count changed");
  assert(report.regimeCounts.blocked === 0, "Step237A default blocked regime count changed");
  assert(report.overallStatus === "review_required", "Step237A default status changed");
  assert(report.aggregateMetrics.totalPeriods === 240, "Step237A aggregate period count changed");
  assert(report.aggregateMetrics.totalTurnover === 26, "Step237A aggregate turnover changed");
  assert(report.aggregateMetrics.totalCostRate === 0.026, "Step237A aggregate cost changed");
  assert(report.checks.futureLeakageDetected === false, "future leakage opened");
  assert(report.checks.samePeriodExecutionDetected === false, "same-period execution opened");
  assert(report.checks.policyOptimizationDetected === false, "policy optimization opened");
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
  service.validateStep237AWalkForwardRegimeValidationReport(report);
  service.assertNoStep237APublicSensitiveMaterial(report);
  service.assertNoStep237APublicSensitiveMaterial(text);

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
  ]) {
    assertNotIncludes(text.toLowerCase(), forbiddenText, "Step237A console report");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step237A touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step237A touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step237A checker modified the working tree");

  console.log("[check-trading-step237a-walk-forward-regime-validation] ok");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    validationMode: report.validationMode,
    policyVersions: report.policyVersions,
    foldCounts: report.foldCounts,
    regimeCounts: report.regimeCounts,
    aggregateMetrics: report.aggregateMetrics,
    foldStability: report.foldStability,
    regimeResults: report.regimeResults.map((item) => ({
      regime: item.regime,
      status: item.status,
      metrics: item.metrics,
    })),
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

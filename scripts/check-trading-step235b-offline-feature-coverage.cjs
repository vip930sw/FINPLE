const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP235B_SCRIPT = "check:trading-step235b-offline-feature-coverage";
const STEP235B_REPORT_SCRIPT = "report:trading-step235b-offline-feature-coverage";
const STEP235B_SERVICE = "server/src/services/tradingAiMlTradingFeatureCoverageReport.js";
const STEP235B_SERVICE_TEST = "server/src/services/tradingAiMlTradingFeatureCoverageReport.test.js";
const STEP235B_REPORTER = "scripts/report-trading-step235b-offline-feature-coverage.cjs";
const STEP235B_REPORTER_TEST = "scripts/report-trading-step235b-offline-feature-coverage.test.cjs";
const STEP235B_CHECKER = "scripts/check-trading-step235b-offline-feature-coverage.cjs";
const STEP235B_CHECKER_TEST = "scripts/check-trading-step235b-offline-feature-coverage.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP235B_SERVICE,
  STEP235B_SERVICE_TEST,
  STEP235B_REPORTER,
  STEP235B_REPORTER_TEST,
  STEP235B_CHECKER,
  STEP235B_CHECKER_TEST,
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "scripts/check-trading-step235a-offline-trading-feature-contract.cjs",
  "scripts/check-trading-step234b-real-format-dataset-adapter-dry-run.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP235B_SERVICE,
  STEP235B_SERVICE_TEST,
  STEP235B_REPORTER,
  STEP235B_REPORTER_TEST,
  STEP235B_CHECKER,
  STEP235B_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/services/tradingAiMlDatasetQualityProfile.js",
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
  "server/src/services/tradingAiMlDatasetQualityGate.js",
  "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
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
  const serviceSource = read(STEP235B_SERVICE);
  const serviceTest = read(STEP235B_SERVICE_TEST);
  const reporterSource = read(STEP235B_REPORTER);

  for (const snippet of [
    `"${STEP235B_SCRIPT}"`,
    `"${STEP235B_REPORT_SCRIPT}"`,
    STEP235B_SERVICE_TEST,
    STEP235B_REPORTER_TEST,
    STEP235B_CHECKER,
    STEP235B_CHECKER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step235B script");
  }

  for (const snippet of [
    "offline_synthetic_feature_coverage",
    "buildStep235AOfflineFeatureDataset",
    "buildStep235ATradingFeatureContract",
    "featureCoverage",
    "labelCoverage",
    "splitCoverage",
    "offlineFeatureInspectionAllowed: true",
    "modelTrainingAllowed: false",
    "performanceClaimAllowed: false",
    "runtimeServingAllowed: false",
    "providerAccessAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(serviceSource, snippet, "Step235B service source");
  }

  for (const snippet of [
    "exact top-level and nested key sets",
    "feature coverage follows Step235A contract canonical order",
    "coverage rates and observation-shortage counts",
    "leakage-true input is reported while permissions stay false",
    "report and console text do not expose asset keys raw rows or timestamps",
  ]) {
    assertIncludes(serviceTest, snippet, "Step235B service test");
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
    "model" + "Training" + "Allowed: true",
    "order" + "Submission" + "Allowed: true",
    "live" + "Trading" + "Allowed: true",
  ]) {
    assertNotIncludes(`${serviceSource}\n${reporterSource}`, forbidden, "Step235B source");
  }

  const service = await import(`${pathToFileURL(`${process.cwd()}/${STEP235B_SERVICE}`).href}?check=${process.pid}`);
  const report = service.buildStep235BOfflineFeatureCoverageReport();
  const text = service.formatStep235BOfflineFeatureCoverageReport(report);

  assertStrict.deepEqual(Object.keys(report), service.STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.topLevelKeys);
  assertStrict.deepEqual(report.recordCounts, { total: 28, train: 20, validation: 4, test: 4 });
  assertStrict.deepEqual(report.featureCoverage.map((entry) => entry.feature), service.STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.featureOrder);
  assertStrict.deepEqual(report.leakageChecks, {
    featureUsesFutureData: false,
    featureLabelOverlap: false,
    crossSplitOverlap: false,
    normalizationLeakage: false,
  });
  assert(report.labelCoverage.forwardReturn1mAvailableCount === 28, "label available mismatch");
  assert(report.usage.modelTrainingAllowed === false, "model training opened");
  assert(report.usage.performanceClaimAllowed === false, "performance claim opened");
  assert(report.usage.runtimeServingAllowed === false, "runtime serving opened");
  assert(report.usage.providerAccessAllowed === false, "provider access opened");
  assert(report.usage.orderSubmissionAllowed === false, "order submission opened");
  assert(report.usage.liveTradingAllowed === false, "live trading opened");
  assert(report.usage.offlineFeatureInspectionAllowed === true, "offline inspection not enabled");
  assert(report.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(report.readiness.state === "blocked", "readiness state changed");
  service.assertNoStep235BReportSensitiveMaterial(report);
  service.assertNoStep235BReportSensitiveMaterial(text);

  for (const snippet of [
    "FINPLE OFFLINE FEATURE COVERAGE",
    "Records: 28",
    "Train / Validation / Test: 20 / 4 / 4",
    "Feature contract: 1.0.0",
    "Leakage detected: No",
    "Model training allowed: No",
    "Order submission allowed: No",
    "Live trading readiness: Blocked",
  ]) {
    assertIncludes(text, snippet, "Step235B console report");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step235B touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step235B touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step235B checker modified the working tree");

  console.log("[check-trading-step235b-offline-feature-coverage] ok");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    reportMode: report.reportMode,
    featureContractVersion: report.featureContractVersion,
    recordCounts: report.recordCounts,
    featuresFullyCovered: report.featureCoverage.filter((entry) => entry.availableCount === report.recordCounts.total).length,
    labelCoverage: report.labelCoverage,
    leakageChecks: report.leakageChecks,
    usage: report.usage,
    readiness: report.readiness,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

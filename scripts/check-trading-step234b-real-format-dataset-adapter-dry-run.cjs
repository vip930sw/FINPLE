const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP234B_SCRIPT = "check:trading-step234b-real-format-dataset-adapter-dry-run";
const STEP234B_REPORT_SCRIPT = "report:trading-step234b-real-format-dataset-dry-run";
const STEP234B_SERVICE = "server/src/services/tradingAiMlRealFormatDatasetAdapter.js";
const STEP234B_SERVICE_TEST = "server/src/services/tradingAiMlRealFormatDatasetAdapter.test.js";
const STEP234B_REPORTER = "scripts/report-trading-step234b-real-format-dataset-dry-run.cjs";
const STEP234B_REPORTER_TEST = "scripts/report-trading-step234b-real-format-dataset-dry-run.test.cjs";
const STEP234B_CHECKER = "scripts/check-trading-step234b-real-format-dataset-adapter-dry-run.cjs";
const STEP234B_CHECKER_TEST = "scripts/check-trading-step234b-real-format-dataset-adapter-dry-run.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP234B_SERVICE,
  STEP234B_SERVICE_TEST,
  STEP234B_REPORTER,
  STEP234B_REPORTER_TEST,
  STEP234B_CHECKER,
  STEP234B_CHECKER_TEST,
  "src/data/tickers/us_screener_candidates.sample.csv",
  "src/data/tickers/kr_screener_candidates.sample.csv",
  "data/processed/scenario_monthly_returns.schema.csv",
  "scripts/check-trading-step234a-real-format-dataset-inventory.cjs",
  "scripts/check-trading-step233-non-blocking-data-quality-ci-report.cjs",
  "server/src/services/tradingAiMlDatasetQualityProfile.js",
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
  "server/src/services/tradingAiMlDatasetQualityGate.js",
  "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP234B_SERVICE,
  STEP234B_SERVICE_TEST,
  STEP234B_REPORTER,
  STEP234B_REPORTER_TEST,
  STEP234B_CHECKER,
  STEP234B_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "docs/trading-ai-ml/FINPLE_STEP234A_REAL_FORMAT_DATASET_INVENTORY.md",
  "server/src/services/tradingAiMlDatasetQualityProfile.js",
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
  "server/src/services/tradingAiMlDatasetQualityGate.js",
  "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "scripts/check-trading-step233-non-blocking-data-quality-ci-report.cjs",
  "scripts/check-trading-step234a-real-format-dataset-inventory.cjs",
  "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "server/src/index.js",
  "server/db/migrations",
];

const EXPECTED_LINE_COUNTS = Object.freeze({
  "src/data/tickers/us_screener_candidates.sample.csv": 6,
  "src/data/tickers/kr_screener_candidates.sample.csv": 6,
  "data/processed/scenario_monthly_returns.schema.csv": 1,
});

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

function lineCount(filePath) {
  return read(filePath).split(/\r?\n/).filter((line, index, lines) => line.length > 0 || index < lines.length - 1).length;
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
  const serviceSource = read(STEP234B_SERVICE);
  const serviceTest = read(STEP234B_SERVICE_TEST);
  const reporter = read(STEP234B_REPORTER);

  for (const snippet of [
    `"${STEP234B_SCRIPT}"`,
    `"${STEP234B_REPORT_SCRIPT}"`,
    STEP234B_CHECKER,
    STEP234B_CHECKER_TEST,
    STEP234B_SERVICE_TEST,
    STEP234B_REPORTER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step234B script");
  }

  for (const [file, expected] of Object.entries(EXPECTED_LINE_COUNTS)) {
    assert(lineCount(file) === expected, `line count changed for ${file}`);
  }

  for (const snippet of [
    "buildStep234BRealFormatDatasetDryRun",
    "buildStep229OfflineDatasetQualityProfile",
    "buildStep230OfflineDatasetQualityBatchSummary",
    "buildStep231OfflineDataQualityGateDecision",
    "buildStep232OfflineDataQualityGateReadiness",
    "adapter_conformance_only",
    "synthetic_for_adapter_dry_run",
    "repository_sanitized_sample",
    "test_fixture_only",
    "internal_adapter_validation_only",
    "sourceMutationDetected: false",
    "modelTraining: false",
    "providerAccess: false",
    "orderSubmission: false",
    "liveTrading: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(serviceSource, snippet, "Step234B service source");
  }

  for (const snippet of [
    "This label is for adapter conformance testing only",
    "must not be used for model training",
    "trading signals",
    "investment decisions",
  ]) {
    assertIncludes(serviceSource, snippet, "Step234B label disclaimer");
  }

  for (const snippet of [
    "fewer than five selected rows",
    "provider payload shape",
    "threshold type violation",
    "deterministic despite source row",
    "no sensitive or trading-signal material",
  ]) {
    assertIncludes(serviceTest, snippet, "Step234B service test");
  }

  for (const forbidden of [
    "fet" + "ch(",
    "axi" + "os",
    "create" + "Client(",
    "supabase" + ".from(",
    "write" + "File",
    "append" + "File",
    "create" + "Write" + "Stream",
    "Math" + ".random",
    "Date" + ".now",
    "new Date()",
    "kis" + "Token",
    "kis" + "Quote",
    "order" + "Submission" + "Allowed=true",
    "actual" + "Live" + "Trading" + "Ready=true",
  ]) {
    assertNotIncludes(`${serviceSource}\n${reporter}`, forbidden, "Step234B source");
  }

  const moduleUrl = pathToFileURL(`${process.cwd()}/${STEP234B_SERVICE}`).href;
  const service = await import(`${moduleUrl}?check=${process.pid}`);
  const reportModule = require("./report-trading-step234b-real-format-dataset-dry-run.cjs");
  const report = await reportModule.buildCurrentStep234BDryRunReport();

  assertStrict.deepEqual(Object.keys(report), service.STEP234B_REAL_FORMAT_DATASET_ADAPTER_CONTRACT.reportTopLevelKeys);
  assertStrict.deepEqual(report.sourceRows, { total: 10, us: 5, kr: 5 });
  assertStrict.deepEqual(report.adaptedRecords, { total: 10, train: 6, validation: 2, test: 2 });
  assert(report.adapter.labelPurpose === "adapter_conformance_only", "label purpose mismatch");
  assert(report.adapter.timestampMode === "synthetic_for_adapter_dry_run", "timestamp mode mismatch");
  assert(report.adapter.sourceMutationDetected === false, "source mutation flag changed");
  assert(report.qualityProfile.status === "pass", "Step229 status mismatch");
  assert(report.batchSummary.overallStatus === "pass", "Step230 status mismatch");
  assert(report.gate.decision === "allow_offline_promotion", "Step231 decision mismatch");
  assert(report.gate.offlineDatasetPromotion === true, "Step231 offline promotion mismatch");
  assert(report.gate.allowedActions.modelTraining === false, "model training opened");
  assert(report.gate.allowedActions.providerAccess === false, "provider access opened");
  assert(report.gate.allowedActions.orderSubmission === false, "order submission opened");
  assert(report.gate.allowedActions.liveTrading === false, "live trading opened");
  assert(report.readiness.status === "ready_for_standalone_dry_run", "Step232 readiness mismatch");
  assert(report.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(report.readiness.state === "blocked", "readiness state changed");
  assert(report.readiness.allowedIntegrationTargets.modelTrainingGate === false, "model training gate opened");
  assert(report.readiness.allowedIntegrationTargets.providerGate === false, "provider gate opened");
  assert(report.readiness.allowedIntegrationTargets.orderGate === false, "order gate opened");
  assert(report.readiness.allowedIntegrationTargets.liveTradingGate === false, "live trading gate opened");
  service.assertNoStep234BSensitiveMaterial(report);

  const serialized = JSON.stringify(report);
  for (const forbidden of ["VOO", "QQQ", "SCHD", "NVDA", "005930", "rawProviderPayload", "credential", "secret", "token", "hash", "digest", "fingerprint"]) {
    assert(!serialized.includes(forbidden), `report leaked forbidden material: ${forbidden}`);
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step234B touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step234B touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step234B checker modified the working tree");

  console.log("[check-trading-step234b-real-format-dataset-adapter-dry-run] ok");
  console.log(JSON.stringify({
    sourceRows: report.sourceRows,
    adaptedRecords: report.adaptedRecords,
    qualityProfile: report.qualityProfile,
    batchSummary: report.batchSummary,
    gate: {
      decision: report.gate.decision,
      offlineDatasetPromotion: report.gate.offlineDatasetPromotion,
      modelTraining: report.gate.allowedActions.modelTraining,
      providerAccess: report.gate.allowedActions.providerAccess,
      orderSubmission: report.gate.allowedActions.orderSubmission,
      liveTrading: report.gate.allowedActions.liveTrading,
    },
    readiness: {
      status: report.readiness.status,
      actualLiveTradingReady: report.readiness.actualLiveTradingReady,
      state: report.readiness.state,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

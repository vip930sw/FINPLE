const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP235A_SCRIPT = "check:trading-step235a-offline-trading-feature-contract";
const STEP235A_CONTRACT_SERVICE = "server/src/services/tradingAiMlTradingFeatureContract.js";
const STEP235A_CONTRACT_TEST = "server/src/services/tradingAiMlTradingFeatureContract.test.js";
const STEP235A_BUILDER_SERVICE = "server/src/services/tradingAiMlOfflineFeatureBuilder.js";
const STEP235A_BUILDER_TEST = "server/src/services/tradingAiMlOfflineFeatureBuilder.test.js";
const STEP235A_CHECKER = "scripts/check-trading-step235a-offline-trading-feature-contract.cjs";
const STEP235A_CHECKER_TEST = "scripts/check-trading-step235a-offline-trading-feature-contract.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP235A_CONTRACT_SERVICE,
  STEP235A_CONTRACT_TEST,
  STEP235A_BUILDER_SERVICE,
  STEP235A_BUILDER_TEST,
  STEP235A_CHECKER,
  STEP235A_CHECKER_TEST,
  "scripts/check-trading-step234b-real-format-dataset-adapter-dry-run.cjs",
  "scripts/check-trading-step234a-real-format-dataset-inventory.cjs",
  "server/src/services/tradingAiMlRealFormatDatasetAdapter.js",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP235A_CONTRACT_SERVICE,
  STEP235A_CONTRACT_TEST,
  STEP235A_BUILDER_SERVICE,
  STEP235A_BUILDER_TEST,
  STEP235A_CHECKER,
  STEP235A_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/services/tradingAiMlDatasetQualityProfile.js",
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
  "server/src/services/tradingAiMlDatasetQualityGate.js",
  "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
  "server/src/services/tradingAiMlRealFormatDatasetAdapter.js",
  "scripts/check-trading-step234b-real-format-dataset-adapter-dry-run.cjs",
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
  const contractSource = read(STEP235A_CONTRACT_SERVICE);
  const builderSource = read(STEP235A_BUILDER_SERVICE);
  const builderTest = read(STEP235A_BUILDER_TEST);

  for (const snippet of [
    `"${STEP235A_SCRIPT}"`,
    STEP235A_CHECKER,
    STEP235A_CHECKER_TEST,
    STEP235A_CONTRACT_TEST,
    STEP235A_BUILDER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step235A script");
  }

  for (const snippet of [
    "offline_synthetic_feature_pilot",
    "return1m",
    "return3m",
    "return6m",
    "return12m",
    "volatility3m",
    "volatility6m",
    "drawdown12m",
    "trend3mVs12m",
    "feature_window_end_lte_featureTimestamp",
    "label_window_strictly_after_featureTimestamp",
    "modelTrainingAllowed: false",
    "providerAccessAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
  ]) {
    assertIncludes(`${contractSource}\n${builderSource}`, snippet, "Step235A source");
  }

  for (const snippet of [
    "future value changes do not affect prior features",
    "label value changes do not affect feature values",
    "leakage validator catches failure fixtures",
    "summary hides asset keys",
    "output excludes sensitive provider payload",
  ]) {
    assertIncludes(builderTest, snippet, "Step235A builder test");
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
    assertNotIncludes(`${contractSource}\n${builderSource}`, forbidden, "Step235A source");
  }

  const contractModule = await import(`${pathToFileURL(`${process.cwd()}/${STEP235A_CONTRACT_SERVICE}`).href}?check=${process.pid}`);
  const builderModule = await import(`${pathToFileURL(`${process.cwd()}/${STEP235A_BUILDER_SERVICE}`).href}?check=${process.pid}`);
  const contract = contractModule.buildStep235ATradingFeatureContract();
  const dataset = builderModule.buildStep235AOfflineFeatureDataset();
  const summary = builderModule.buildStep235AOfflineFeatureSummary();

  assertStrict.deepEqual(Object.keys(contract), contractModule.STEP235A_TRADING_FEATURE_CONTRACT.topLevelKeys);
  assertStrict.deepEqual(contract.featureDefinitions.map((definition) => definition.name), contractModule.STEP235A_TRADING_FEATURE_CONTRACT.featureNames);
  assertStrict.deepEqual(Object.keys(dataset), builderModule.STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT.outputTopLevelKeys);
  assertStrict.deepEqual(Object.keys(dataset.records[0].features), builderModule.STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT.featureKeys);
  assertStrict.deepEqual(Object.keys(dataset.records[0].label), builderModule.STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT.labelKeys);
  assertStrict.deepEqual(dataset.leakageChecks, {
    featureUsesFutureData: false,
    featureLabelOverlap: false,
    crossSplitOverlap: false,
    normalizationLeakage: false,
  });
  assertStrict.deepEqual(summary.recordCounts, {
    total: 28,
    train: 20,
    validation: 4,
    test: 4,
  });
  assert(dataset.usage.modelTrainingAllowed === false, "model training opened");
  assert(dataset.usage.backtestClaimAllowed === false, "backtest claim opened");
  assert(dataset.usage.providerAccessAllowed === false, "provider access opened");
  assert(dataset.usage.orderSubmissionAllowed === false, "order submission opened");
  assert(dataset.usage.liveTradingAllowed === false, "live trading opened");
  builderModule.assertNoStep235ASensitiveMaterial(dataset);
  builderModule.assertNoStep235ASensitiveMaterial(summary);
  const summaryText = JSON.stringify(summary);
  assert(!summaryText.includes("assetKey"), "summary leaked assetKey key");
  assert(!summaryText.includes("synthetic-us-core"), "summary leaked synthetic asset key");

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step235A touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step235A touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step235A checker modified the working tree");

  console.log("[check-trading-step235a-offline-trading-feature-contract] ok");
  console.log(JSON.stringify({
    schemaVersion: dataset.schemaVersion,
    featureContractVersion: dataset.featureContractVersion,
    mode: dataset.mode,
    recordCounts: summary.recordCounts,
    leakageChecks: dataset.leakageChecks,
    usage: dataset.usage,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

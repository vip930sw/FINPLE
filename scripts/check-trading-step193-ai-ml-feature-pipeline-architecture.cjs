const fs = require("node:fs");

const STEP193_SCRIPT = "check:trading-step193-ai-ml-feature-pipeline-architecture";
const STEP193_PANEL_KEY = "ai-ml-feature-pipeline-architecture";
const STEP193_MODULE = "server/src/services/tradingAiMlFeaturePipelineArchitecture.js";

const REQUIRED_FILES = [
  STEP193_MODULE,
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.cjs",
  "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.test.cjs",
  "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.cjs",
];

const REQUIRED_MODULE_SNIPPETS = [
  "STEP193_AI_ML_FEATURE_PIPELINE_FLAGS",
  "TRADING_AI_ML_FEATURE_PIPELINE_MODEL",
  "buildAiMlFeaturePipelineArchitecture",
  "buildAdminTradingAiMlFeaturePipelineStatus",
  "deterministic_mock_feature_pipeline_registry",
  "featureSourceMappings",
  "pointInTimeJoinPolicy",
  "rollingFeatureContracts",
  "missingValuePolicy",
  "trainOnlyNormalizationPolicy",
  "featureVersioningLineage",
  "leakageGuards",
  "featureQualityValidation",
  "datasetTrainingInterfaces",
  "futureFeatureStoreContract",
  "asset master",
  "daily price",
  "monthly return",
  "dividend",
  "benchmark",
  "foreign exchange",
  "market regime",
  "portfolio snapshot",
  "dataset label registry",
  "feature.availableAt <= predictionTime",
  "labelStartTime > predictionTime",
  "return_1d",
  "return_20d",
  "momentum_60d",
  "volatility_20d",
  "downside_volatility_20d",
  "rolling_drawdown_60d",
  "rolling_mdd_252d",
  "volume_zscore_20d",
  "beta_252d",
  "correlation_to_benchmark_252d",
  "dividend_yield_ttm",
  "fx_return_20d",
  "noUnconditionalZeroFill: true",
  "normalizerFitScope: \"training_split_only\"",
  "FeatureBatchRequest",
  "TrainingPipelineFeatureInput",
  "getOfflineFeaturesContract",
  "getOnlineFeaturesContract",
  "getPointInTimeFeaturesContract",
  "validateFeatureFreshnessContract",
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "pythonFeatureJobAllowed: false",
  "modelTrainingAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
  "persistentStorageAllowed: false",
  "providerCallsAllowed: false",
  "quoteCallsAllowed: false",
  "kisCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
];

const REQUIRED_PANEL_SNIPPETS = [
  STEP193_PANEL_KEY,
  "AI/ML feature pipeline architecture",
  "Feature source mapping",
  "Point-in-time joins",
  "Rolling feature contracts",
  "Missing-value policy",
  "Train-only normalization",
  "Feature versioning and lineage",
  "Leakage guards",
  "Feature quality validation",
  "Dataset/training interfaces",
  "Future feature store contract",
  "feature generation blocked",
  "dataset build blocked",
  "training blocked",
  "file creation blocked",
  "DB read/write blocked",
  "provider/KIS/order blocked",
  "public UI exposure blocked",
  "tradingLabAiMlFeatureStatusGrid",
];

const REQUIRED_CSS_SNIPPETS = [
  ".tradingLabAiMlFeaturePipelineArchitecture",
  ".tradingLabAiMlFeatureStatusGrid",
  ".tradingLabAiMlFeatureSourceGrid",
  ".tradingLabAiMlFeatureContractGrid",
  ".tradingLabAiMlFeatureSafetyGrid",
];

const FORBIDDEN_SNIPPETS = [
  "actualDataDownloadAllowed: true",
  "featureGenerationAllowed: true",
  "featureFileCreationAllowed: true",
  "datasetBuildAllowed: true",
  "pythonFeatureJobAllowed: true",
  "modelTrainingAllowed: true",
  "modelArtifactCreationAllowed: true",
  "modelDeploymentAllowed: true",
  "modelAutoApprovalAllowed: true",
  "dbMigrationAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "persistentStorageAllowed: true",
  "providerCallsAllowed: true",
  "quoteCallsAllowed: true",
  "kisCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
  "actualDataDownloadAttempted: true",
  "featureGenerationAttempted: true",
  "datasetBuildAttempted: true",
  "pythonJobAttempted: true",
  "modelTrainingAttempted: true",
  "modelArtifactCreated: true",
  "csvCreated: true",
  "parquetCreated: true",
  "featureFileCreated: true",
  "supabaseSelectAttempted: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "persistentDbWriteAttempted: true",
  "providerCallAttempted: true",
  "quoteCallAttempted: true",
  "kisCallAttempted: true",
  "orderSubmissionAttempted: true",
  "createClient(",
  "supabase.from(",
  "supabase.select(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "python ",
  "python.exe",
  "pandas",
  "numpy",
  "scikit-learn",
  "torch",
  "tensorflow",
  "transformers",
  "xgboost",
  "lightgbm",
  "writeFile",
  "appendFile",
];

const PUBLIC_SURFACE_FILES = [
  "src/App.jsx",
  "src/components/AccountPages.jsx",
  "src/components/mypage/MyPageRoute.jsx",
  "src/components/mypage/MyPageSidebar.jsx",
  "src/components/mypage/MyPageLayout.jsx",
  "src/components/SiteHeader.jsx",
];

const SCENARIO_FILES = [
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "server/src/routes/scenarioRoutes.js",
  "server/src/services/scenarioRuntime.js",
];

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function assertRequiredFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    if (!fs.existsSync(filePath)) fail(`required file missing: ${filePath}`);
  }
}

function assertPackageScript(packageJson) {
  const script = packageJson.scripts?.[STEP193_SCRIPT];
  if (!script) fail(`${STEP193_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.cjs",
    "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
    "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.test.cjs",
    "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step193 npm check missing ${snippet}`);
  }
}

function assertFeaturePipelineModule() {
  const moduleText = readText(STEP193_MODULE);
  for (const snippet of REQUIRED_MODULE_SNIPPETS) {
    if (!moduleText.includes(snippet)) fail(`Step193 module missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (moduleText.includes(snippet)) fail(`Step193 module contains forbidden snippet: ${snippet}`);
  }
}

function assertDashboardShellAndUi() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");

  for (const snippet of [
    "tradingAiMlFeaturePipelineArchitecture.js",
    "buildAdminTradingAiMlFeaturePipelineStatus",
    "aiMlFeaturePipelineStatus",
    "aiMlFeaturePipelineModel",
  ]) {
    if (!serviceText.includes(snippet)) fail(`dashboard shell missing ${snippet}`);
  }
  for (const snippet of REQUIRED_PANEL_SNIPPETS) {
    if (!panelText.includes(snippet)) fail(`admin panel missing ${snippet}`);
  }
  for (const snippet of REQUIRED_CSS_SNIPPETS) {
    if (!cssText.includes(snippet)) fail(`CSS missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (serviceText.includes(snippet) || panelText.includes(snippet)) fail(`Step193 UI/shell contains forbidden snippet: ${snippet}`);
  }
}

function assertNoEndpointAdded() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (routeText.includes(STEP193_PANEL_KEY) || routeText.includes("AiMlFeaturePipeline")) {
    fail("Step193 must not add a runtime endpoint");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only GET endpoints");
}

function assertNoPublicExposureOrForbiddenArtifacts() {
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP193_PANEL_KEY) || text.includes("AI/ML feature pipeline architecture")) {
      fail(`Step193 must not expose AI ML feature UI in public/mypage surface: ${filePath}`);
    }
  }
  if (fs.existsSync("data/processed/scenario_monthly_returns.csv")) fail("scenario_monthly_returns.csv must not exist");
  for (const forbiddenPath of ["data/ai-ml", "datasets", "features", "feature-store", "model-artifacts"]) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden feature/model artifact path exists: ${forbiddenPath}`);
  }
  for (const migrationDir of ["supabase/migrations", "migrations", "db/migrations"]) {
    if (!fs.existsSync(migrationDir)) continue;
    const forbidden = fs.readdirSync(migrationDir).filter((name) => name.includes("feature") || name.includes("ai_ml"));
    if (forbidden.length > 0) fail(`forbidden migration artifact exists in ${migrationDir}: ${forbidden.join(", ")}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("aiMlFeature") || text.includes("AI/ML feature pipeline architecture")) {
      fail(`Step193 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
    "check:trading-step192-ai-ml-dataset-and-labeling-architecture",
    "check:trading-step191-ai-ml-strategy-management-console",
    "check:trading-step190-mock-strategy-restore-candidate",
    "check:trading-step189-mock-trading-history-compare-ui",
    "check:trading-step188-mock-trading-history-browser-ui",
    "check:trading-step187-mock-trading-history-supabase-schema-draft",
    "check:trading-step186-mock-trading-history-persistence-architecture",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertPackageScript(packageJson);
  assertFeaturePipelineModule();
  assertDashboardShellAndUi();
  assertNoEndpointAdded();
  assertNoPublicExposureOrForbiddenArtifacts();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step193-ai-ml-feature-pipeline-architecture] ok");
}

main();

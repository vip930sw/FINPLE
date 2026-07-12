const fs = require("node:fs");

const STEP194_SCRIPT = "check:trading-step194-ai-ml-feature-pipeline-preflight";
const STEP194_PANEL_KEY = "ai-ml-feature-pipeline-preflight";
const STEP194_MODULE = "server/src/services/tradingAiMlFeaturePipelinePreflight.js";

const REQUIRED_FILES = [
  STEP194_MODULE,
  "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.cjs",
  "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
  "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.cjs",
];

const REQUIRED_EXPORTS_AND_MODULE_SNIPPETS = [
  "STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS",
  "TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL",
  "buildAiMlFeaturePipelinePreflight",
  "evaluateAiMlFeaturePipelinePreflight",
  "buildAdminTradingAiMlFeaturePipelinePreflightStatus",
  "createDeterministicMockFeaturePipelinePreflightRequest",
  "validateFeaturePipelinePreflightRequest",
  "buildFeaturePipelinePreflightCheckResults",
  "metadataOnlyPreflightEvaluationAllowed: true",
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "datasetFileCreationAllowed: false",
  "pythonFeatureJobAllowed: false",
  "modelTrainingAllowed: false",
  "modelDeploymentAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
  "providerCallsAllowed: false",
  "quoteCallsAllowed: false",
  "kisCallsAllowed: false",
  "kisTokenIssuanceAllowed: false",
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForFeatureGeneration: false",
  "readyForDatasetBuild: false",
  "readyForModelTraining: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
  "requestIdentity",
  "datasetSpecReference",
  "featureSetReference",
  "labelSpecReference",
  "predictionSchedule",
  "temporalBoundaries",
  "splitPolicy",
  "missingValuePolicy",
  "normalizationPolicy",
  "qualityGatePolicy",
  "lineagePolicy",
  "executionIntent",
  "feature.availableAt <= predictionTime",
  "feature.eventTime <= featureCutoffTime",
  "featureCutoffTime <= predictionTime",
  "labelStartTime > predictionTime",
  "labelEndTime >= labelStartTime",
  "training_split_only",
  "unconditionalZeroFillAllowed",
  "PROHIBITED_EXECUTION_INTENTS",
];

const REQUIRED_VALIDATION_CATEGORIES = [
  "request_identity",
  "feature_registry",
  "dataset_label_compatibility",
  "point_in_time_validation",
  "rolling_history_requirements",
  "missing_value_policy",
  "train_only_normalization",
  "split_and_leakage_policy",
  "feature_quality_gate_configuration",
  "lineage_and_reproducibility",
  "prohibited_execution_intent",
];

const REQUIRED_FEATURE_KEYS = [
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
];

const REQUIRED_SCENARIOS = [
  "scenario_a_valid_metadata_contract",
  "scenario_b_unknown_feature",
  "scenario_c_future_available_at_leakage",
  "scenario_d_label_overlap",
  "scenario_e_insufficient_rolling_history",
  "scenario_f_invalid_normalization_scope",
  "scenario_g_unconditional_zero_fill",
  "scenario_h_unpinned_version",
  "scenario_i_prohibited_execution_intent",
];

const REQUIRED_QUALITY_GATES = [
  "schema_validation",
  "dtype_validation",
  "range_validation",
  "finite_value_validation",
  "missing_rate_threshold",
  "staleness_threshold",
  "coverage_threshold",
  "duplicate_key_validation",
  "monotonic_timestamp_validation",
  "feature_drift_placeholder",
  "distribution_shift_placeholder",
];

const REQUIRED_PANEL_SNIPPETS = [
  STEP194_PANEL_KEY,
  "AI/ML feature pipeline preflight",
  "contract status",
  "execution status",
  "overall status",
  "metadata validation only",
  "validation categories",
  "pass / fail / blocked",
  "version pinning",
  "PIT validation",
  "rolling history contract",
  "missing-value policy",
  "train-only normalization",
  "leakage guard",
  "quality gate configuration",
  "lineage/reproducibility",
  "safety restrictions",
  "feature generation blocked",
  "dataset build blocked",
  "training blocked",
  "file creation blocked",
  "DB read/write blocked",
  "provider/KIS/order blocked",
  "public UI exposure blocked",
];

const REQUIRED_CSS_SNIPPETS = [
  ".tradingLabAiMlFeaturePipelinePreflight",
  ".tradingLabAiMlFeaturePreflightStatusGrid",
  ".tradingLabAiMlFeaturePreflightContractGrid",
  ".tradingLabAiMlFeaturePreflightCheckGrid",
  ".tradingLabAiMlFeaturePreflightSafetyGrid",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "actualDataDownloadAllowed: true",
  "featureGenerationAllowed: true",
  "featureFileCreationAllowed: true",
  "datasetBuildAllowed: true",
  "modelTrainingAllowed: true",
  "modelDeploymentAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "providerCallsAllowed: true",
  "quoteCallsAllowed: true",
  "kisCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "readyForFeatureGeneration: true",
  "readyForDatasetBuild: true",
  "readyForModelTraining: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
];

const FORBIDDEN_EXECUTION_CODE = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "supabase.select(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "writeFile",
  "appendFile",
  "child_process",
  "spawn(",
  "exec(",
  "python ",
  "python.exe",
  "pandas",
  "numpy",
  "scikit-learn",
  "torch",
  "tensorflow",
  "xgboost",
  "lightgbm",
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
  const script = packageJson.scripts?.[STEP194_SCRIPT];
  if (!script) fail(`${STEP194_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.cjs",
    "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
    "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
    "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step194 npm check missing ${snippet}`);
  }
}

function assertPreflightModule() {
  const moduleText = readText(STEP194_MODULE);
  for (const snippet of REQUIRED_EXPORTS_AND_MODULE_SNIPPETS) {
    if (!moduleText.includes(snippet)) fail(`Step194 module missing ${snippet}`);
  }
  for (const category of REQUIRED_VALIDATION_CATEGORIES) {
    if (!moduleText.includes(category)) fail(`Step194 module missing validation category ${category}`);
  }
  for (const featureKey of REQUIRED_FEATURE_KEYS) {
    if (!moduleText.includes(featureKey)) fail(`Step194 module missing rolling feature ${featureKey}`);
  }
  for (const scenarioId of REQUIRED_SCENARIOS) {
    if (!moduleText.includes(scenarioId)) fail(`Step194 module missing mock scenario ${scenarioId}`);
  }
  for (const qualityGate of REQUIRED_QUALITY_GATES) {
    if (!moduleText.includes(qualityGate)) fail(`Step194 module missing quality gate ${qualityGate}`);
  }
  for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
    if (moduleText.includes(snippet)) fail(`Step194 module contains forbidden true flag: ${snippet}`);
  }
  for (const snippet of FORBIDDEN_EXECUTION_CODE) {
    if (moduleText.includes(snippet)) fail(`Step194 module contains forbidden execution code: ${snippet}`);
  }
}

function assertDashboardShellAndUi() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");

  for (const snippet of [
    "tradingAiMlFeaturePipelinePreflight.js",
    "buildAdminTradingAiMlFeaturePipelinePreflightStatus",
    "aiMlFeaturePipelinePreflightStatus",
    "aiMlFeaturePipelinePreflightModel",
  ]) {
    if (!serviceText.includes(snippet)) fail(`dashboard shell missing ${snippet}`);
  }
  for (const snippet of REQUIRED_PANEL_SNIPPETS) {
    if (!panelText.includes(snippet)) fail(`admin panel missing ${snippet}`);
  }
  for (const snippet of REQUIRED_CSS_SNIPPETS) {
    if (!cssText.includes(snippet)) fail(`CSS missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
    if (serviceText.includes(snippet) || panelText.includes(snippet)) fail(`Step194 UI/shell contains forbidden true flag: ${snippet}`);
  }
  for (const snippet of FORBIDDEN_EXECUTION_CODE) {
    if (serviceText.includes(snippet) || panelText.includes(snippet)) fail(`Step194 UI/shell contains forbidden execution code: ${snippet}`);
  }
}

function assertNoEndpointAdded() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (routeText.includes(STEP194_PANEL_KEY) || routeText.includes("AiMlFeaturePipelinePreflight")) {
    fail("Step194 must not add a runtime endpoint");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only GET endpoints");
}

function assertNoPublicExposureOrForbiddenArtifacts() {
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP194_PANEL_KEY) || text.includes("AI/ML feature pipeline preflight")) {
      fail(`Step194 must not expose feature preflight UI in public/mypage surface: ${filePath}`);
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
    if (text.includes("aiMlFeaturePipelinePreflight") || text.includes("AI/ML feature pipeline preflight")) {
      fail(`Step194 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
    "check:trading-step193-ai-ml-feature-pipeline-architecture",
    "check:trading-step192-ai-ml-dataset-and-labeling-architecture",
    "check:trading-step191-ai-ml-strategy-management-console",
    "check:trading-step190-mock-strategy-restore-candidate",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertPackageScript(packageJson);
  assertPreflightModule();
  assertDashboardShellAndUi();
  assertNoEndpointAdded();
  assertNoPublicExposureOrForbiddenArtifacts();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step194-ai-ml-feature-pipeline-preflight] ok");
}

main();

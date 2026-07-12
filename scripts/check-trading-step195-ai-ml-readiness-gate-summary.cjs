const fs = require("node:fs");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlReadinessGateSummary.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/check-trading-step195-ai-ml-readiness-gate-summary.cjs",
  "scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs",
];

const REQUIRED_EXPORTS = [
  "STEP195_AI_ML_READINESS_GATE_FLAGS",
  "TRADING_AI_ML_READINESS_GATE_MODEL",
  "buildAiMlReadinessGateSummary",
  "evaluateAiMlReadinessGates",
  "buildAdminTradingAiMlReadinessGateStatus",
  "collectAiMlReadinessSourceStatuses",
  "buildAiMlReadinessGateResults",
  "deriveAiMlReadinessOverallStatus",
];

const REQUIRED_SOURCE_REFERENCES = [
  "tradingAiMlStrategyManagement.js",
  "tradingAiMlDatasetArchitecture.js",
  "tradingAiMlFeaturePipelineArchitecture.js",
  "tradingAiMlFeaturePipelinePreflight.js",
  "step191_ai_ml_strategy_management",
  "step192_ai_ml_dataset_architecture",
  "step193_ai_ml_feature_pipeline_architecture",
  "step194_ai_ml_feature_pipeline_preflight",
];

const REQUIRED_GATE_CATEGORIES = [
  "strategy_management_contract",
  "dataset_labeling_contract",
  "feature_pipeline_contract",
  "feature_pipeline_preflight",
  "data_access_permission",
  "feature_generation_permission",
  "dataset_build_permission",
  "model_training_permission",
  "model_deployment_permission",
  "provider_connectivity_permission",
  "order_authority",
  "live_trading_permission",
  "public_exposure_permission",
];

const REQUIRED_STATUS_SNIPPETS = [
  "contract_preflight_only",
  "documented_and_validated",
  "internal_contracts_valid_execution_blocked",
  "internal_contracts_incomplete",
  "invalid_internal_contract",
  "blocked_by_safety_policy",
  "external_blocker",
  "adminReadOnlyReadinessAggregationAllowed: true",
  "deterministicStatusCompositionAllowed: true",
  "orderAuthorityStatus: \"external_blocker\"",
  "metadataPreflightStatus",
  "executionPermissionStatus: \"blocked\"",
];

const REQUIRED_SCENARIOS = [
  "scenario_a_current_valid_internal_contracts",
  "scenario_b_missing_source_contract",
  "scenario_c_invalid_preflight",
  "scenario_d_prohibited_permission_conflict",
  "scenario_e_public_exposure_conflict",
  "scenario_f_external_order_authority_blocker",
  "scenario_g_deterministic_ordering",
  "scenario_h_mutation_resistance",
];

const REQUIRED_FALSE_SNIPPETS = [
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "datasetFileCreationAllowed: false",
  "pythonFeatureJobAllowed: false",
  "modelTrainingAllowed: false",
  "modelArtifactCreationAllowed: false",
  "modelDeploymentAllowed: false",
  "modelAutoApprovalAllowed: false",
  "dbMigrationAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
  "persistentStorageAllowed: false",
  "providerCallsAllowed: false",
  "quoteCallsAllowed: false",
  "kisCallsAllowed: false",
  "kisTokenIssuanceAllowed: false",
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForActualDataDownload: false",
  "readyForFeatureGeneration: false",
  "readyForDatasetBuild: false",
  "readyForModelTraining: false",
  "readyForModelDeployment: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
];

const FORBIDDEN_READY_SNIPPETS = [
  "ready: true",
  "aiMlReady: true",
  "productionReady: true",
  "operationalReady: true",
  "tradingReady: true",
  "liveReady: true",
  "production_ready",
  "operational_ready",
  "trading_ready",
  "live_ready",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "actualDataDownloadAllowed: true",
  "featureGenerationAllowed: true",
  "datasetBuildAllowed: true",
  "modelTrainingAllowed: true",
  "modelDeploymentAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
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

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const service = read("server/src/services/tradingAiMlReadinessGateSummary.js");
const serviceTest = read("server/src/services/tradingAiMlReadinessGateSummary.test.js");
const shell = read("server/src/services/tradingAdminLabDashboardShell.js");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");
const combinedRuntime = [service, shell, panel].join("\n");
const combinedSource = [service, serviceTest, shell, panel, css, packageJson].join("\n");

assert(packageJson.includes("\"check:trading-step195-ai-ml-readiness-gate-summary\""), "package script missing");
assert(packageJson.includes("tradingAiMlReadinessGateSummary.test.js"), "service test not wired");
assert(packageJson.includes("check-trading-step195-ai-ml-readiness-gate-summary.test.cjs"), "checker test not wired");
assert(packageJson.includes("check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs"), "Step194 checker test coupling missing");

for (const snippet of REQUIRED_EXPORTS) {
  assert(service.includes(snippet), `missing export or helper: ${snippet}`);
}
for (const snippet of REQUIRED_SOURCE_REFERENCES) {
  assert(service.includes(snippet), `missing source reference: ${snippet}`);
}
for (const snippet of REQUIRED_GATE_CATEGORIES) {
  assert(service.includes(snippet), `missing gate category: ${snippet}`);
}
for (const snippet of REQUIRED_STATUS_SNIPPETS) {
  assert(service.includes(snippet), `missing status snippet: ${snippet}`);
}
for (const snippet of REQUIRED_SCENARIOS) {
  assert(service.includes(snippet) && serviceTest.includes(snippet), `missing scenario coverage: ${snippet}`);
}
for (const snippet of REQUIRED_FALSE_SNIPPETS) {
  assert(service.includes(snippet), `missing fail-closed flag: ${snippet}`);
}
for (const snippet of FORBIDDEN_READY_SNIPPETS) {
  assert(!combinedRuntime.includes(snippet), `forbidden single readiness state found: ${snippet}`);
}
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission found in service: ${snippet}`);
}
for (const snippet of FORBIDDEN_EXECUTION_CODE) {
  assert(!combinedRuntime.includes(snippet), `forbidden execution code found: ${snippet}`);
}

assert(shell.includes("buildAdminTradingAiMlReadinessGateStatus"), "dashboard shell missing Step195 status builder");
assert(shell.includes("aiMlReadinessGateSummaryStatus"), "dashboard shell missing Step195 status output");
assert(shell.includes("TRADING_AI_ML_READINESS_GATE_MODEL"), "dashboard shell missing Step195 model reference");

assert(panel.includes("data-admin-panel-key=\"ai-ml-readiness-gate-summary\""), "admin panel missing Step195 panel key");
assert(panel.includes("contract and metadata preflight only"), "admin panel missing metadata-only warning");
assert(panel.includes("not operational readiness"), "admin panel missing operational boundary text");
assert(panel.includes("feature generation blocked"), "admin panel missing feature generation blocked text");
assert(panel.includes("dataset build blocked"), "admin panel missing dataset build blocked text");
assert(panel.includes("training and deployment blocked"), "admin panel missing training/deployment blocked text");
assert(panel.includes("provider/KIS access blocked"), "admin panel missing provider/KIS blocked text");
assert(panel.includes("order authority externally blocked"), "admin panel missing external order blocker text");
assert(panel.includes("live trading blocked"), "admin panel missing live blocked text");
assert(panel.includes("ai-ml-strategy-management-console"), "Step191 detail panel missing");
assert(panel.includes("ai-ml-dataset-labeling-architecture"), "Step192 detail panel missing");
assert(panel.includes("ai-ml-feature-pipeline-architecture"), "Step193 detail panel missing");
assert(panel.includes("ai-ml-feature-pipeline-preflight"), "Step194 detail panel missing");
assert(!panel.includes("mypageAiMlReadiness"), "unexpected My Page exposure marker");
assert(!panel.includes("publicAiMlReadiness"), "unexpected public exposure marker");

assert(css.includes(".tradingLabAiMlReadinessGateSummary"), "CSS missing Step195 summary class");
assert(css.includes(".tradingLabAiMlReadinessStatusGrid"), "CSS missing Step195 status grid");
assert(css.includes(".tradingLabAiMlReadinessGateGrid"), "CSS missing Step195 gate grid");

const routeFiles = fs.readdirSync("server/src/routes").join("\n");
assert(!routeFiles.includes("aiMlReadinessGate"), "new runtime endpoint route detected");
assert(!combinedSource.includes("scenario_monthly_returns.csv"), "scenario monthly returns file reference should not be added");
assert(!combinedSource.includes("calculatePortfolioResult"), "portfolio calculation logic should remain untouched");

console.log("[check-trading-step195-ai-ml-readiness-gate-summary] ok");

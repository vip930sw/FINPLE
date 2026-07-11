const fs = require("node:fs");

const STEP192_SCRIPT = "check:trading-step192-ai-ml-dataset-and-labeling-architecture";
const STEP192_PANEL_KEY = "ai-ml-dataset-labeling-architecture";
const STEP192_MODULE = "server/src/services/tradingAiMlDatasetArchitecture.js";

const REQUIRED_FILES = [
  STEP192_MODULE,
  "server/src/services/tradingAiMlDatasetArchitecture.test.js",
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.cjs",
  "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.test.cjs",
  "scripts/check-trading-step191-ai-ml-strategy-management-console.cjs",
];

const REQUIRED_MODULE_SNIPPETS = [
  "STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS",
  "TRADING_AI_ML_DATASET_ARCHITECTURE_MODEL",
  "buildAiMlDatasetArchitecture",
  "buildAdminTradingAiMlDatasetArchitectureStatus",
  "deterministic_mock_dataset_registry",
  "datasetFamilies",
  "labelDefinitions",
  "featureTimestampRules",
  "pointInTimeRules",
  "splitPolicies",
  "walkForwardPolicies",
  "leakageControls",
  "versioningPolicy",
  "lineagePolicy",
  "retentionPolicy",
  "downside_1m_negative",
  "downside_3m_below_minus_5pct",
  "forward_volatility_20d",
  "future_drawdown_bucket_60d",
  "market_regime_20d",
  "observationTime",
  "availableAt",
  "predictionTime",
  "labelStartTime",
  "labelEndTime",
  "randomSplitAllowed: false",
  "datasetBuildAllowed: false",
  "featureGenerationAllowed: false",
  "modelTrainingAllowed: false",
  "dbWriteAllowed: false",
];

const REQUIRED_PANEL_SNIPPETS = [
  STEP192_PANEL_KEY,
  "AI/ML dataset and labeling architecture",
  "point-in-time",
  "dataset build / feature generation blocked",
  "tradingLabAiMlDatasetStatusGrid",
  "dataset family definitions",
  "label definitions",
  "feature timestamp rules",
  "train validation test split",
  "walk-forward dataset contract",
  "leakage prevention",
  "versioning and lineage",
  "retention and redaction",
];

const REQUIRED_CSS_SNIPPETS = [
  ".tradingLabAiMlDatasetArchitecture",
  ".tradingLabAiMlDatasetStatusGrid",
  ".tradingLabAiMlDatasetFamilyGrid",
  ".tradingLabAiMlDatasetContractGrid",
];

const FORBIDDEN_SNIPPETS = [
  "datasetBuildAllowed: true",
  "featureGenerationAllowed: true",
  "modelTrainingAllowed: true",
  "modelDeploymentAllowed: true",
  "modelAutoApprovalAllowed: true",
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForLiveGuardedTrading: true",
  "dbMigrationAllowed: true",
  "dbWriteAllowed: true",
  "dbWriteUsed: true",
  "persistentStorageUsed: true",
  "actualDataDownloadAttempted: true",
  "externalFinancialApiCallAttempted: true",
  "providerCallAttempted: true",
  "pythonTrainingJobAttempted: true",
  "modelTrainingAttempted: true",
  "modelArtifactCreated: true",
  "datasetFileCreated: true",
  "csvOrParquetCreated: true",
  "supabaseSelectAttempted: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "persistentDbWriteAttempted: true",
  "orderSubmissionAttempted: true",
  "liveAccountBalanceQueried: true",
  "createClient(",
  "supabase.from(",
  "supabase.select(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "python ",
  "python.exe",
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
  const script = packageJson.scripts?.[STEP192_SCRIPT];
  if (!script) fail(`${STEP192_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.cjs",
    "server/src/services/tradingAiMlDatasetArchitecture.test.js",
    "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.test.cjs",
    "scripts/check-trading-step191-ai-ml-strategy-management-console.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step192 npm check missing ${snippet}`);
  }
}

function assertDatasetModule() {
  const moduleText = readText(STEP192_MODULE);
  for (const snippet of REQUIRED_MODULE_SNIPPETS) {
    if (!moduleText.includes(snippet)) fail(`Step192 module missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (moduleText.includes(snippet)) fail(`Step192 module contains forbidden snippet: ${snippet}`);
  }
}

function assertDashboardShellAndUi() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");

  for (const snippet of [
    "tradingAiMlDatasetArchitecture.js",
    "buildAdminTradingAiMlDatasetArchitectureStatus",
    "aiMlDatasetArchitectureStatus",
    "aiMlDatasetArchitectureModel",
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
    if (serviceText.includes(snippet) || panelText.includes(snippet)) fail(`Step192 UI/shell contains forbidden snippet: ${snippet}`);
  }
}

function assertNoEndpointAdded() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (routeText.includes(STEP192_PANEL_KEY) || routeText.includes("AiMlDatasetArchitecture")) {
    fail("Step192 must not add a runtime endpoint");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only GET endpoints");
}

function assertNoPublicExposureOrForbiddenArtifacts() {
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP192_PANEL_KEY) || text.includes("AI/ML dataset and labeling architecture")) {
      fail(`Step192 must not expose AI ML dataset UI in public/mypage surface: ${filePath}`);
    }
  }
  if (fs.existsSync("data/processed/scenario_monthly_returns.csv")) fail("scenario_monthly_returns.csv must not exist");
  for (const forbiddenPath of ["data/ai-ml", "datasets", "model-artifacts"]) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden dataset/model artifact path exists: ${forbiddenPath}`);
  }
  for (const migrationDir of ["supabase/migrations", "migrations", "db/migrations"]) {
    if (!fs.existsSync(migrationDir)) continue;
    const forbidden = fs.readdirSync(migrationDir).filter((name) => name.includes("dataset") || name.includes("label") || name.includes("ai_ml"));
    if (forbidden.length > 0) fail(`forbidden migration artifact exists in ${migrationDir}: ${forbidden.join(", ")}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("aiMlDataset") || text.includes("AI/ML dataset and labeling architecture")) {
      fail(`Step192 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
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
  assertDatasetModule();
  assertDashboardShellAndUi();
  assertNoEndpointAdded();
  assertNoPublicExposureOrForbiddenArtifacts();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step192-ai-ml-dataset-and-labeling-architecture] ok");
}

main();

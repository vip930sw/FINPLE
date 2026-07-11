const fs = require("node:fs");

const STEP191_SCRIPT = "check:trading-step191-ai-ml-strategy-management-console";
const STEP191_PANEL_KEY = "ai-ml-strategy-management-console";
const STEP191_MODULE = "server/src/services/tradingAiMlStrategyManagement.js";

const REQUIRED_FILES = [
  STEP191_MODULE,
  "server/src/services/tradingAiMlStrategyManagement.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step191-ai-ml-strategy-management-console.cjs",
  "scripts/check-trading-step191-ai-ml-strategy-management-console.test.cjs",
  "scripts/check-trading-step190-mock-strategy-restore-candidate.cjs",
];

const REQUIRED_MODULE_SNIPPETS = [
  "STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS",
  "TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL",
  "buildAiMlStrategyManagementRegistry",
  "buildAdminTradingAiMlStrategyManagementStatus",
  "admin_ai_ml_strategy_lab",
  "deterministic_mock_registry",
  "market_regime_classifier",
  "portfolio_risk_score_model",
  "downside_probability_model",
  "volatility_forecast_model",
  "rebalancing_necessity_model",
  "dataset",
  "featureSets",
  "evaluationProfiles",
  "backtestContract",
  "walkForwardContract",
  "shadowEvaluationContract",
  "approvalWorkflow",
  "implementationContracts",
  "modelTrainingAllowed: false",
  "modelDeploymentAllowed: false",
  "modelAutoApprovalAllowed: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "dbWriteAllowed: false",
];

const REQUIRED_PANEL_SNIPPETS = [
  STEP191_PANEL_KEY,
  "AI/ML strategy management console",
  "deterministic architecture prototype",
  "training/deploy/write blocked",
  "tradingLabAiMlStatusGrid",
  "tradingLabAiMlModelGrid",
  "dataset contracts",
  "feature contracts",
  "evaluation contracts",
  "model lifecycle",
  "future implementation contracts",
  "blocked operations",
];

const REQUIRED_CSS_SNIPPETS = [
  ".tradingLabAiMlStrategyConsole",
  ".tradingLabAiMlStatusGrid",
  ".tradingLabAiMlModelGrid",
  ".tradingLabAiMlContractGrid",
  ".tradingLabAiMlBlockedNotice",
];

const FORBIDDEN_SNIPPETS = [
  "modelTrainingAllowed: true",
  "modelDeploymentAllowed: true",
  "modelAutoApprovalAllowed: true",
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
  "dbMigrationAllowed: true",
  "dbWriteAllowed: true",
  "dbWriteUsed: true",
  "persistentStorageUsed: true",
  "modelTrainingAttempted: true",
  "pythonTrainingJobAttempted: true",
  "modelFileCreatedOrUploaded: true",
  "modelRegistryDbWriteAttempted: true",
  "supabaseSelectAttempted: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "providerCallAttempted: true",
  "tokenIssuanceAttempted: true",
  "quoteQueryAttempted: true",
  "orderSubmissionAttempted: true",
  "liveAccountBalanceQueried: true",
  "actualTradingRunCreated: true",
  "modelAutoApprovalAttempted: true",
  "createClient(",
  "supabase.from(",
  "supabase.select(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "python ",
  "python.exe",
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
  const script = packageJson.scripts?.[STEP191_SCRIPT];
  if (!script) fail(`${STEP191_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step191-ai-ml-strategy-management-console.cjs",
    "server/src/services/tradingAiMlStrategyManagement.test.js",
    "scripts/check-trading-step191-ai-ml-strategy-management-console.test.cjs",
    "scripts/check-trading-step190-mock-strategy-restore-candidate.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step191 npm check missing ${snippet}`);
  }
}

function assertAiMlModule() {
  const moduleText = readText(STEP191_MODULE);
  for (const snippet of REQUIRED_MODULE_SNIPPETS) {
    if (!moduleText.includes(snippet)) fail(`Step191 module missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (moduleText.includes(snippet)) fail(`Step191 module contains forbidden snippet: ${snippet}`);
  }
  for (const forbiddenOutput of ["expected_return", "buy_sell_recommendation", "order_recommendation"]) {
    if (moduleText.includes(forbiddenOutput)) fail(`Step191 module contains unsafe model output: ${forbiddenOutput}`);
  }
}

function assertDashboardShellAndUi() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");

  for (const snippet of [
    "tradingAiMlStrategyManagement.js",
    "buildAdminTradingAiMlStrategyManagementStatus",
    "aiMlStrategyManagementStatus",
    "aiMlStrategyManagementRegistryModel",
  ]) {
    if (!serviceText.includes(snippet)) fail(`dashboard shell missing ${snippet}`);
  }
  for (const snippet of REQUIRED_PANEL_SNIPPETS) {
    if (!panelText.includes(snippet)) fail(`admin panel missing ${snippet}`);
  }
  for (const snippet of REQUIRED_CSS_SNIPPETS) {
    if (!cssText.includes(snippet)) fail(`CSS missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS.filter((item) => ![".from(", ".select(", ".insert(", ".update(", ".delete("].includes(item))) {
    if (serviceText.includes(snippet) || panelText.includes(snippet)) fail(`Step191 UI/shell contains forbidden snippet: ${snippet}`);
  }
}

function assertNoEndpointAdded() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (routeText.includes(STEP191_PANEL_KEY) || routeText.includes("AiMlStrategyManagement")) {
    fail("Step191 must not add a runtime endpoint");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only GET endpoints");
}

function assertNoPublicExposureOrForbiddenArtifacts() {
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP191_PANEL_KEY) || text.includes("AI/ML strategy management console")) {
      fail(`Step191 must not expose AI ML console in public/mypage surface: ${filePath}`);
    }
  }
  if (fs.existsSync("data/processed/scenario_monthly_returns.csv")) fail("scenario_monthly_returns.csv must not exist");
  for (const migrationDir of ["supabase/migrations", "migrations", "db/migrations"]) {
    if (!fs.existsSync(migrationDir)) continue;
    const forbidden = fs.readdirSync(migrationDir).filter((name) => name.includes("model") || name.includes("ai_ml") || name.includes("strategy_management"));
    if (forbidden.length > 0) fail(`forbidden migration artifact exists in ${migrationDir}: ${forbidden.join(", ")}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("aiMlStrategy") || text.includes("AI/ML strategy management console")) {
      fail(`Step191 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
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
  assertAiMlModule();
  assertDashboardShellAndUi();
  assertNoEndpointAdded();
  assertNoPublicExposureOrForbiddenArtifacts();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step191-ai-ml-strategy-management-console] ok");
}

main();

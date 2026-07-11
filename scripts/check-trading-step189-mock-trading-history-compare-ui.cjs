const fs = require("node:fs");

const STEP189_SCRIPT = "check:trading-step189-mock-trading-history-compare-ui";
const STEP189_PANEL_KEY = "mock-trading-history-compare-ui";
const STEP189_MODULE = "server/src/services/tradingMockHistoryCompare.js";

const REQUIRED_FILES = [
  STEP189_MODULE,
  "server/src/services/tradingMockHistoryCompare.test.js",
  "server/src/services/tradingMockHistoryBrowser.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step189-mock-trading-history-compare-ui.cjs",
  "scripts/check-trading-step189-mock-trading-history-compare-ui.test.cjs",
  "scripts/check-trading-step188-mock-trading-history-browser-ui.cjs",
];

const REQUIRED_MODULE_SNIPPETS = [
  "STEP189_MOCK_TRADING_HISTORY_COMPARE_FLAGS",
  "TRADING_LAB_MOCK_HISTORY_COMPARE_MODEL",
  "buildMockHistoryCompare",
  "buildAdminTradingLabMockHistoryCompareStatus",
  "compatibilityStatus",
  "metricComparisons",
  "allocationComparisons",
  "riskComparisons",
  "rankings",
  "highlightedDifferences",
  "restoreCandidateEligibility",
  "mock_strategy_restore_candidate",
  "deterministic_mock_history",
  "dbReadStatus: \"blocked\"",
  "dbWriteStatus: \"blocked\"",
  "supabaseMutationStatus: \"blocked\"",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
];

const REQUIRED_PANEL_SNIPPETS = [
  STEP189_PANEL_KEY,
  "Mock trading history compare",
  "이 비교는 deterministic mock history 기반입니다.",
  "buildMockHistoryCompareUiModel",
  "tradingLabHistoryCompareStatusGrid",
  "tradingLabHistoryCompareCards",
  "tradingLabHistoryCompareTable",
  "allocation comparison",
  "risk comparison",
  "restore candidate eligibility",
  "Step190에서 제공 예정",
];

const REQUIRED_CSS_SNIPPETS = [
  ".tradingLabHistoryCompareDetails",
  ".tradingLabHistoryCompareStatusGrid",
  ".tradingLabHistoryCompareCards",
  ".tradingLabHistoryCompareTable",
  ".tradingLabHistoryCompareGrid",
];

const FORBIDDEN_SNIPPETS = [
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "dbWriteUsed: true",
  "persistentStorageUsed: true",
  "supabaseSelectAttempted: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "networkCallAttempted: true",
  "tokenIssuanceAttempted: true",
  "quoteRequestAttempted: true",
  "orderSubmissionAttempted: true",
  "liveTradingRunCreated: true",
  "liveAccountBalanceQueried: true",
  "createClient(",
  ".from(",
  ".select(",
  ".insert(",
  ".update(",
  ".delete(",
];

const FORBIDDEN_UI_SHELL_SNIPPETS = FORBIDDEN_SNIPPETS.filter((snippet) => ![
  ".from(",
  ".select(",
  ".insert(",
  ".update(",
  ".delete(",
].includes(snippet));

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
  const script = packageJson.scripts?.[STEP189_SCRIPT];
  if (!script) fail(`${STEP189_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step189-mock-trading-history-compare-ui.cjs",
    "server/src/services/tradingMockHistoryCompare.test.js",
    "scripts/check-trading-step189-mock-trading-history-compare-ui.test.cjs",
    "scripts/check-trading-step188-mock-trading-history-browser-ui.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step189 npm check missing ${snippet}`);
  }
}

function assertCompareModule() {
  const moduleText = readText(STEP189_MODULE);
  for (const snippet of REQUIRED_MODULE_SNIPPETS) {
    if (!moduleText.includes(snippet)) fail(`Step189 module missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (moduleText.includes(snippet)) fail(`Step189 module contains forbidden snippet: ${snippet}`);
  }
}

function assertDashboardShellAndUi() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");

  for (const snippet of ["tradingMockHistoryCompare.js", "buildAdminTradingLabMockHistoryCompareStatus", "mockTradingHistoryCompareStatus", "mockTradingHistoryCompareModel"]) {
    if (!serviceText.includes(snippet)) fail(`dashboard shell missing ${snippet}`);
  }
  for (const snippet of REQUIRED_PANEL_SNIPPETS) {
    if (!panelText.includes(snippet)) fail(`admin panel missing ${snippet}`);
  }
  for (const snippet of REQUIRED_CSS_SNIPPETS) {
    if (!cssText.includes(snippet)) fail(`CSS missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_UI_SHELL_SNIPPETS) {
    if (serviceText.includes(snippet) || panelText.includes(snippet)) fail(`Step189 UI/shell contains forbidden snippet: ${snippet}`);
  }
}

function assertNoEndpointAdded() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (routeText.includes(STEP189_PANEL_KEY) || routeText.includes("MockHistoryCompare")) {
    fail("Step189 must not add a runtime endpoint");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only GET endpoints");
}

function assertNoPublicExposureOrForbiddenArtifacts() {
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP189_PANEL_KEY) || text.includes("Mock trading history compare")) {
      fail(`Step189 must not expose compare UI in public/mypage surface: ${filePath}`);
    }
  }
  if (fs.existsSync("data/processed/scenario_monthly_returns.csv")) fail("scenario_monthly_returns.csv must not exist");
  for (const migrationDir of ["supabase/migrations", "migrations", "db/migrations"]) {
    if (!fs.existsSync(migrationDir)) continue;
    const forbidden = fs.readdirSync(migrationDir).filter((name) => name.includes("mock_trading") || name.includes("trading_history"));
    if (forbidden.length > 0) fail(`forbidden migration artifact exists in ${migrationDir}: ${forbidden.join(", ")}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("mockHistoryCompare") || text.includes("Mock trading history compare")) {
      fail(`Step189 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
    "check:trading-step188-mock-trading-history-browser-ui",
    "check:trading-step187-mock-trading-history-supabase-schema-draft",
    "check:trading-step186-mock-trading-history-persistence-architecture",
    "check:trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate",
    "check:trading-step184-db-backed-mock-trading-history-migration-preflight",
    "check:trading-step183-db-backed-mock-trading-history-review-result-recording-gate",
    "check:trading-step182-db-backed-mock-trading-history-preflight",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertPackageScript(packageJson);
  assertCompareModule();
  assertDashboardShellAndUi();
  assertNoEndpointAdded();
  assertNoPublicExposureOrForbiddenArtifacts();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step189-mock-trading-history-compare-ui] ok");
}

main();

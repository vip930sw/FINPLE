const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingAdminLabDashboardShell.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/AccountPages.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/App.jsx",
  "src/App.css",
  "scripts/check-trading-step164-admin-trading-lab-mock-dashboard-cleanup-core.cjs",
  "scripts/check-trading-step164-admin-trading-lab-mock-dashboard-cleanup-core.test.cjs",
  "scripts/check-trading-step163-admin-trading-lab-mock-dashboard-cleanup-review-result-recording-gate.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP164_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_SUMMARY_FIRST_LAYOUT_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_COLLAPSIBLE_DETAIL_GROUP_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardSummaryFirstLayoutResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCollapsibleDetailGroupResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockDashboardCleanupCore"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCleanupCore"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockDashboardCleanupCoreStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_dashboard_cleanup_core_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_dashboard_cleanup_applied"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "step161_summary_result"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardCleanupCorePersistenceAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "existingDashboardSectionDeleted: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockDashboardCleanupCoreStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-dashboard-cleanup-core"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-dashboard-cleanup-core"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockDashboardCleanupCoreStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-dashboard-cleanup-core\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupCoreStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupCoreCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupCoreList"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardSummaryFirstGrid"],
  ["src/components/TradingReadinessPanel.jsx", "data-admin-panel-key=\"trading-lab-mock-dashboard-cleanup-core\""],
  ["src/components/TradingReadinessPanel.jsx", "summary-first grouping result"],
  ["src/App.css", ".tradingLabMockDashboardCleanupCoreCards"],
  ["src/App.css", ".tradingLabMockDashboardCleanupCoreList"],
  ["src/App.css", ".tradingLabDashboardSummaryFirstGrid"],
  ["package.json", "check:trading-step164-admin-trading-lab-mock-dashboard-cleanup-core"],
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/kis",
  "server/src/services/trading/kisQuoteAdapter.js",
  "server/src/services/trading/kisTokenClient.js",
  "server/src/services/trading/kisProviderClient.js",
  "server/src/services/trading/providerCallRuntime.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return fs.readFileSync(filePath, "utf8");
}

function main() {
  const missingFiles = REQUIRED_FILES.filter((filePath) => !fs.existsSync(filePath));
  if (missingFiles.length > 0) fail(`missing required files: ${missingFiles.join(", ")}`);

  const forbiddenPaths = FORBIDDEN_PATHS.filter((filePath) => fs.existsSync(filePath));
  if (forbiddenPaths.length > 0) fail(`forbidden trading artifacts present: ${forbiddenPaths.join(", ")}`);

  const missingSnippets = REQUIRED_SNIPPETS.filter(([filePath, snippet]) => !readText(filePath).includes(snippet));
  if (missingSnippets.length > 0) {
    fail(`missing required snippets: ${missingSnippets.map(([filePath, snippet]) => `${filePath}:${snippet}`).join(", ")}`);
  }

  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const accountPagesText = readText("src/components/AccountPages.jsx");
  const appText = readText("src/App.jsx");

  if (!/router\.get\("\/trading-lab-mock-dashboard-cleanup-core"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockDashboardCleanupCoreStatus/.test(routeText)) {
    fail("mock dashboard cleanup core endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockDashboardCleanupCoreStatus",
    "trading-lab-mock-dashboard-cleanup-core",
    "fetchAdminTradingLabMockDashboardCleanupCoreStatus",
    "buildAdminTradingLabMockDashboardCleanupCoreStatus",
    "buildTradingLabMockDashboardCleanupCore",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock dashboard cleanup core must not be exposed on account pages: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock dashboard cleanup core must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  if (labBranchStart < 0 || labBranchEnd < 0) fail("Step132B tab separation must remain explicit");
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  for (const term of [
    "tradingLabStrategyDraftControls",
    "tradingLabMockRunCandidatePreflight",
    "tradingLabMockOrderGenerationPreflight",
    "tradingLabMockExecutionPreflight",
    "tradingLabMockFillSimulationPreflight",
    "tradingLabMockFillCoreResult",
    "tradingLabMockLedgerUpdateCoreResult",
    "tradingLabMockPerformanceCoreResult",
    "tradingLabMockTradingRunSummaryCore",
    "tradingLabMockDashboardCleanupPreflight",
    "tradingLabMockDashboardCleanupReviewResult",
    "tradingLabMockDashboardCleanupCore",
  ]) {
    if (!labBranch.includes(term)) fail(`lab tab must keep ${term}`);
  }

  const joined = [serviceText, routeText, uiText].join("\n");
  const forbiddenTerms = [
    "axios",
    "submitLiveOrder",
    "placeOrder",
    "issueAccessToken(",
    "queryKisQuote(",
    "queryKisExecution(",
    "queryKisFill(",
    "quotePrice(",
    "DATABASE_URL",
    "providerPayloadStored: true",
    "orderPayloadStored: true",
    "rawProviderResponseStored: true",
    "accountIdentifierStored: true",
    "credentialStored: true",
    "persistentStorageUsed: true",
    "dbWriteUsed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "tokenIssuanceAttempted: true",
    "quoteRequestAttempted: true",
    "networkCallAttempted: true",
    "orderSubmissionAttempted: true",
    "orderPayloadCreated: true",
    "kisOrderPayloadCreated: true",
    "kisExecutionPayloadCreated: true",
    "kisFillPayloadCreated: true",
    "executionRecordCreated: true",
    "fillRecordCreated: true",
    "portfolioLedgerPersisted: true",
    "performanceRecordPersisted: true",
    "accountBalanceQueried: true",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
    "actualPerformanceRecordUpdated: true",
    "realTradingRunIdentifierCreated: true",
    "realOrderIdentifierCreated: true",
    "realExecutionIdentifierCreated: true",
    "realFillIdentifierCreated: true",
    "existingSectionsDeleted: true",
    "actualInvestmentPerformanceConfirmed: true",
    "returnGuaranteeProvided: true",
    "investmentAdviceProvided: true",
    "dashboardCleanupCorePersistenceAllowed: true",
    "dashboardCleanupCoreExecuted: true",
    "existingDashboardSectionDeleted: true",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  for (const forbiddenCopy of [
    "Auto trading start",
    "Start live trading",
    "Order approved",
    "Trading activated",
    "Return guarantee",
    "Buy recommendation",
    "Sell recommendation",
  ]) {
    if (uiText.includes(forbiddenCopy)) fail(`forbidden user-facing trading copy present: ${forbiddenCopy}`);
  }

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 164"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step164-admin-trading-lab-mock-dashboard-cleanup-core] ok");
}

main();

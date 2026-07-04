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
  "scripts/check-trading-step161-admin-trading-lab-mock-trading-run-summary-core.cjs",
  "scripts/check-trading-step161-admin-trading-lab-mock-trading-run-summary-core.test.cjs",
  "scripts/check-trading-step160-admin-trading-lab-mock-trading-run-summary-review-result-recording-gate.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP161_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_STRATEGY_SUMMARY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_ORDER_EXECUTION_FILL_SUMMARY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_LEDGER_SUMMARY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_PERFORMANCE_SUMMARY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_RISK_SAFETY_SUMMARY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_DASHBOARD_AGGREGATION_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_CHART_AGGREGATION_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockTradingRunSummaryCore"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockTradingRunSummaryCore"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockTradingRunDashboardAggregationResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockTradingRunChartAggregationResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockTradingRunSummaryCoreStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_trading_run_summary_core_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_summary_calculated"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_trading_run_dashboard_cleanup_preflight"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "realTradingRunIdentifierCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualCashUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPositionUpdated: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockTradingRunSummaryCoreStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-trading-run-summary-core"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-trading-run-summary-core"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockTradingRunSummaryCoreStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-trading-run-summary-core\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockTradingRunSummaryCoreStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockTradingRunSummaryCoreCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockTradingRunSummaryCoreList"],
  ["src/components/TradingReadinessPanel.jsx", "Mock trading run summary result"],
  ["src/components/TradingReadinessPanel.jsx", "FINPLE internal mock trading run summary only"],
  ["src/App.css", ".tradingLabMockTradingRunSummaryCoreCards"],
  ["src/App.css", ".tradingLabMockTradingRunSummaryCoreList"],
  ["package.json", "check:trading-step161-admin-trading-lab-mock-trading-run-summary-core"],
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

  if (!/router\.get\("\/trading-lab-mock-trading-run-summary-core"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockTradingRunSummaryCoreStatus/.test(routeText)) {
    fail("mock trading run summary core endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockTradingRunSummaryCoreStatus",
    "trading-lab-mock-trading-run-summary-core",
    "fetchAdminTradingLabMockTradingRunSummaryCoreStatus",
    "buildAdminTradingLabMockTradingRunSummaryCoreStatus",
    "buildTradingLabMockTradingRunSummaryCore",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock trading run summary core must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock trading run summary core must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

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
    "tradingLabMockTradingRunSummaryPreflight",
    "tradingLabMockTradingRunSummaryReviewResult",
    "tradingLabMockTradingRunSummaryCore",
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
    "actualInvestmentPerformanceConfirmed: true",
    "returnGuaranteeProvided: true",
    "investmentAdviceProvided: true",
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
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 161"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step161-admin-trading-lab-mock-trading-run-summary-core] ok");
}

main();

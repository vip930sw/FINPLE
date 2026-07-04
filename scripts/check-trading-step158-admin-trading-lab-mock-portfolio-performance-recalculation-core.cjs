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
  "scripts/check-trading-step158-admin-trading-lab-mock-portfolio-performance-recalculation-core.cjs",
  "scripts/check-trading-step158-admin-trading-lab-mock-portfolio-performance-recalculation-core.test.cjs",
  "scripts/check-trading-step157-admin-trading-lab-mock-portfolio-performance-recalculation-core-review-result-recording-gate.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP158_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PERFORMANCE_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_EQUITY_SERIES_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DAILY_RETURN_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_CUMULATIVE_RETURN_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DRAWDOWN_MDD_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_ALLOCATION_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_KPI_SUMMARY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_CHART_DATA_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PERFORMANCE_RESULT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabMockPortfolioPerformanceResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockPortfolioPerformanceRecalculationCore"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPortfolioPerformanceRecalculationCore"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_portfolio_performance_recalculation_core_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_performance_calculated"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualInvestmentPerformanceConfirmed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "returnGuaranteeProvided: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "investmentAdviceProvided: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-portfolio-performance-recalculation-core"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-portfolio-performance-recalculation-core"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-portfolio-performance-recalculation-core\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPortfolioPerformanceRecalculationCoreStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPerformanceCoreResultCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPerformanceCoreResultList"],
  ["src/components/TradingReadinessPanel.jsx", "Mock portfolio performance recalculation core"],
  ["src/components/TradingReadinessPanel.jsx", "FINPLE internal mock performance result only"],
  ["src/App.css", ".tradingLabMockPerformanceCoreResultCards"],
  ["src/App.css", ".tradingLabMockPerformanceCoreResultList"],
  ["package.json", "check:trading-step158-admin-trading-lab-mock-portfolio-performance-recalculation-core"],
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

  if (!/router\.get\("\/trading-lab-mock-portfolio-performance-recalculation-core"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus/.test(routeText)) {
    fail("mock portfolio performance recalculation core endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockPortfolioPerformanceRecalculationCoreStatus",
    "trading-lab-mock-portfolio-performance-recalculation-core",
    "fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus",
    "buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus",
    "buildTradingLabMockPortfolioPerformanceRecalculationCore",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock performance recalculation core must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock performance recalculation core must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  if (labBranchStart < 0 || labBranchEnd < 0) fail("Step132B tab separation must remain explicit");
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  for (const term of [
    "tradingLabStrategyDraftControls",
    "tradingLabStrategyDraftReview",
    "tradingLabStrategyDraftReviewResult",
    "tradingLabStrategyDraftClearancePreflight",
    "tradingLabStrategyDraftClearanceReviewResult",
    "tradingLabMockRunCandidatePreflight",
    "tradingLabMockOrderGenerationPreflight",
    "tradingLabMockOrderGenerationReviewResult",
    "tradingLabMockExecutionPreflight",
    "tradingLabMockExecutionReviewResult",
    "tradingLabMockFillSimulationPreflight",
    "tradingLabMockFillSimulationReview",
    "tradingLabMockFillSimulationCorePreflight",
    "tradingLabMockFillCoreReview",
    "tradingLabMockFillCoreResult",
    "tradingLabMockLedgerUpdatePreflight",
    "tradingLabMockLedgerUpdateReviewResult",
    "tradingLabMockLedgerUpdateCorePreflight",
    "tradingLabMockLedgerUpdateCoreReviewResult",
    "tradingLabMockLedgerUpdateCoreResult",
    "tradingLabMockPerformanceRecalculationPreflight",
    "tradingLabMockPerformanceRecalculationReviewResult",
    "tradingLabMockPerformanceCorePreflight",
    "tradingLabMockPerformanceCoreReviewResult",
    "tradingLabMockPerformanceCoreResult",
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
    "actualOrderCandidateCreated: true",
    "actualOrderDraftCreated: true",
    "kisOrderPayloadCreated: true",
    "kisExecutionPayloadCreated: true",
    "kisFillPayloadCreated: true",
    "actualExecutionCreated: true",
    "executionRecordCreated: true",
    "actualFillRecordCreated: true",
    "fillRecordCreated: true",
    "fillCreated: true",
    "actualLedgerEntryCreated: true",
    "actualPortfolioLedgerUpdated: true",
    "actualPerformanceRecordCreated: true",
    "actualPerformanceRecordUpdated: true",
    "accountBalanceQueried: true",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
    "actualInvestmentPerformanceConfirmed: true",
    "returnGuaranteeProvided: true",
    "investmentAdviceProvided: true",
    "actualOrderId",
    "actualExecutionId",
    "actualFillId",
    "actualAccountBalance",
    "actualPerformanceRecordId",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 158"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step158-admin-trading-lab-mock-portfolio-performance-recalculation-core] ok");
}

main();

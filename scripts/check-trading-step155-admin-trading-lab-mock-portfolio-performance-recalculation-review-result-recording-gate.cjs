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
  "scripts/check-trading-step155-admin-trading-lab-mock-portfolio-performance-recalculation-review-result-recording-gate.cjs",
  "scripts/check-trading-step155-admin-trading-lab-mock-portfolio-performance-recalculation-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step154-admin-trading-lab-mock-portfolio-performance-recalculation-preflight.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP155_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_RECEIPT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_DECISION_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockPortfolioPerformanceRecalculationReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPortfolioPerformanceRecalculationReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPerformanceRecalculationReviewSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPerformanceRecalculationReviewDecisionSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPortfolioPerformanceRecalculationReviewResultRecordingGate"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_portfolio_performance_recalculation_review_result_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_portfolio_performance_recalculation_core"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPerformanceRecordUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualCashUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPositionUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPortfolioLedgerUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountBalanceQueried: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "persistentStorageUsed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-portfolio-performance-recalculation-review-result"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-portfolio-performance-recalculation-review-result"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-portfolio-performance-recalculation-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPortfolioPerformanceRecalculationReviewResultStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPerformanceRecalculationReviewCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPerformanceRecalculationReviewList"],
  ["src/components/TradingReadinessPanel.jsx", "Mock portfolio performance recalculation review result"],
  ["src/components/TradingReadinessPanel.jsx", "It does not confirm real investment performance"],
  ["src/App.css", ".tradingLabMockPerformanceRecalculationReviewCards"],
  ["src/App.css", ".tradingLabMockPerformanceRecalculationReviewList"],
  ["package.json", "check:trading-step155-admin-trading-lab-mock-portfolio-performance-recalculation-review-result-recording-gate"],
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

  if (!/router\.get\("\/trading-lab-mock-portfolio-performance-recalculation-review-result"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus/.test(routeText)) {
    fail("mock portfolio performance recalculation review result endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockPortfolioPerformanceRecalculationReviewResultStatus",
    "trading-lab-mock-portfolio-performance-recalculation-review-result",
    "fetchAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus",
    "buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus",
    "buildTradingLabMockPortfolioPerformanceRecalculationReviewResult",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock performance recalculation review result must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock performance recalculation review result must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

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
    "actualPerformanceRecordUpdated: true",
    "accountBalanceQueried: true",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
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
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 155"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step155-admin-trading-lab-mock-portfolio-performance-recalculation-review-result-recording-gate] ok");
}

main();

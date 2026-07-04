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
  "scripts/check-trading-step163-admin-trading-lab-mock-dashboard-cleanup-review-result-recording-gate.cjs",
  "scripts/check-trading-step163-admin-trading-lab-mock-dashboard-cleanup-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step162-admin-trading-lab-mock-dashboard-cleanup-preflight.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP163_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RECEIPT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_DECISION_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_SECTION_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCleanupReviewSectionSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCleanupReviewDecisionSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockDashboardCleanupReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCleanupReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCleanupReviewResultRecordingGate"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockDashboardCleanupReviewResultStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_dashboard_cleanup_review_result_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_dashboard_cleanup_review_recorded"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_dashboard_cleanup_core"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardCleanupReviewPersistenceAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "realTradingRunIdentifierCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPerformanceRecordUpdated: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockDashboardCleanupReviewResultStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-dashboard-cleanup-review-result"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-dashboard-cleanup-review-result"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockDashboardCleanupReviewResultStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-dashboard-cleanup-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupReviewResultStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupReviewCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupReviewList"],
  ["src/components/TradingReadinessPanel.jsx", "data-admin-panel-key=\"trading-lab-mock-dashboard-cleanup-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "FINPLE internal mock dashboard cleanup review only"],
  ["src/App.css", ".tradingLabMockDashboardCleanupReviewCards"],
  ["src/App.css", ".tradingLabMockDashboardCleanupReviewList"],
  ["package.json", "check:trading-step163-admin-trading-lab-mock-dashboard-cleanup-review-result-recording-gate"],
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

  if (!/router\.get\("\/trading-lab-mock-dashboard-cleanup-review-result"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockDashboardCleanupReviewResultStatus/.test(routeText)) {
    fail("mock dashboard cleanup review result endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockDashboardCleanupReviewResultStatus",
    "trading-lab-mock-dashboard-cleanup-review-result",
    "fetchAdminTradingLabMockDashboardCleanupReviewResultStatus",
    "buildAdminTradingLabMockDashboardCleanupReviewResultStatus",
    "buildTradingLabMockDashboardCleanupReviewResult",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock dashboard cleanup review result must not be exposed on account pages: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock dashboard cleanup review result must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

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
    "tradingLabMockDashboardCleanupPreflight",
    "tradingLabMockDashboardCleanupReviewResult",
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
    "dashboardCleanupReviewPersistenceAllowed: true",
    "actualDashboardCleanupExecuted: true",
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
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 163"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step163-admin-trading-lab-mock-dashboard-cleanup-review-result-recording-gate] ok");
}

main();

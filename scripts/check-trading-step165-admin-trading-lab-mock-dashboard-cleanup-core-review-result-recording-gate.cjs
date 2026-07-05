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
  "scripts/check-trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate.cjs",
  "scripts/check-trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step164-admin-trading-lab-mock-dashboard-cleanup-core.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP165_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_RESULT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_RECEIPT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_DECISION_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCleanupCoreReviewSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockDashboardCleanupCoreReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockDashboardCleanupCoreReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockDashboardCleanupCoreReviewResultStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_dashboard_cleanup_core_review_result_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_dashboard_cleanup_core_review_recorded"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_trading_lab_dashboard_ux_polish_preflight"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardCleanupCoreReviewPersistenceAllowed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockDashboardCleanupCoreReviewResultStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-dashboard-cleanup-core-review-result"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-dashboard-cleanup-core-review-result"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockDashboardCleanupCoreReviewResultStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-dashboard-cleanup-core-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupCoreReviewResultStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupCoreReviewCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockDashboardCleanupCoreReviewList"],
  ["src/components/TradingReadinessPanel.jsx", "data-admin-panel-key=\"trading-lab-mock-dashboard-cleanup-core-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "Step164 dependency required"],
  ["src/App.css", ".tradingLabMockDashboardCleanupCoreReviewCards"],
  ["src/App.css", ".tradingLabMockDashboardCleanupCoreReviewList"],
  ["package.json", "check:trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate"],
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

const FORBIDDEN_SOURCE_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisOrderPayloadCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisExecutionPayloadCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisFillPayloadCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "executionRecordCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "fillRecordCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "portfolioLedgerPersisted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "performanceRecordPersisted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountBalanceQueried: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualCashUpdated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPositionUpdated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPerformanceRecordUpdated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "realTradingRunIdentifierCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardCleanupCoreReviewPersistenceAllowed: true"],
  ["src/components/TradingReadinessPanel.jsx", "auto-trading start"],
  ["src/components/TradingReadinessPanel.jsx", "order execution"],
  ["src/components/TradingReadinessPanel.jsx", "live trading ready"],
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

  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden runtime artifact exists: ${forbiddenPath}`);
  }

  for (const [filePath, snippet] of REQUIRED_SNIPPETS) {
    const text = readText(filePath);
    if (!text.includes(snippet)) fail(`${filePath} missing required snippet: ${snippet}`);
  }

  for (const [filePath, snippet] of FORBIDDEN_SOURCE_SNIPPETS) {
    const text = readText(filePath);
    if (text.includes(snippet)) fail(`${filePath} contains forbidden snippet: ${snippet}`);
  }

  const accountPages = readText("src/components/AccountPages.jsx");
  if (accountPages.includes("mock-dashboard-cleanup-core-review") || accountPages.includes("trading-lab-mock-dashboard-cleanup-core-review-result")) {
    fail("mock dashboard cleanup core review UI must not be exposed in AccountPages");
  }

  const appSource = readText("src/App.jsx");
  if (appSource.includes("mock-dashboard-cleanup-core-review") || appSource.includes("trading-lab-mock-dashboard-cleanup-core-review-result")) {
    fail("mock dashboard cleanup core review UI must not be exposed from public App routes");
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("mock_dashboard_cleanup_core_review")) {
      fail(`scenario runtime files must remain untouched by Step 165: ${filePath}`);
    }
  }

  console.log("[check-trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate] ok");
}

main();

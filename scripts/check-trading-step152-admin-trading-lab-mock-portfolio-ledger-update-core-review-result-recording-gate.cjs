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
  "scripts/check-trading-step152-admin-trading-lab-mock-portfolio-ledger-update-core-review-result-recording-gate.cjs",
  "scripts/check-trading-step152-admin-trading-lab-mock-portfolio-ledger-update-core-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step151-admin-trading-lab-mock-portfolio-ledger-update-core-preflight.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP152_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_RECEIPT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_DECISION_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_POLICY_REVIEW_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockPortfolioLedgerUpdateCoreReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPortfolioLedgerUpdateCoreReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPortfolioLedgerUpdateCoreReviewResultRecordingGate"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockLedgerUpdateCorePolicyReviewSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockLedgerUpdateCoreReviewDecisionSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_portfolio_ledger_update_core_review_result_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_portfolio_ledger_update_core"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualLedgerEntryCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPortfolioLedgerUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualCashUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPositionUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountBalanceQueried: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "persistentStorageUsed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-portfolio-ledger-update-core-review-result"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-portfolio-ledger-update-core-review-result"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-portfolio-ledger-update-core-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockLedgerUpdateCoreReviewCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockLedgerUpdateCoreReviewList"],
  ["src/components/TradingReadinessPanel.jsx", "Mock portfolio ledger update core review result"],
  ["src/components/TradingReadinessPanel.jsx", "It does not update real account ledgers, DB state, cash, positions, fills, executions, orders, KIS payloads, or live/provider/order gates."],
  ["src/App.css", ".tradingLabMockLedgerUpdateCoreReviewCards"],
  ["src/App.css", ".tradingLabMockLedgerUpdateCoreReviewList"],
  ["package.json", "check:trading-step152-admin-trading-lab-mock-portfolio-ledger-update-core-review-result-recording-gate"],
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

  if (!/router\.get\("\/trading-lab-mock-portfolio-ledger-update-core-review-result"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus/.test(routeText)) {
    fail("mock portfolio ledger update core review result endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus",
    "trading-lab-mock-portfolio-ledger-update-core-review-result",
    "fetchAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus",
    "buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus",
    "buildTradingLabMockPortfolioLedgerUpdateCoreReviewResult",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock portfolio ledger update core review result must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock portfolio ledger update core review result must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

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
  ]) {
    if (!labBranch.includes(term)) fail(`lab tab must keep ${term}`);
  }
  if (labBranch.includes("tradingReadinessFlagGrid") || labBranch.includes("tradingKisQuoteAdapterOptInPreflight")) {
    fail("lab tab must not render safety gate details");
  }

  const joined = [serviceText, routeText, uiText].join("\n");
  const forbiddenTerms = [
    "axios",
    "fetch(",
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
    "accountBalanceQueried: true",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
    "actualOrderId",
    "actualExecutionId",
    "actualFillId",
    "actualAccountBalance",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 152"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step152-admin-trading-lab-mock-portfolio-ledger-update-core-review-result-recording-gate] ok");
}

main();

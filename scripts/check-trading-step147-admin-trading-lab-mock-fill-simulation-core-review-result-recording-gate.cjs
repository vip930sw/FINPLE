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
  "scripts/check-trading-step147-admin-trading-lab-mock-fill-simulation-core-review-result-recording-gate.cjs",
  "scripts/check-trading-step147-admin-trading-lab-mock-fill-simulation-core-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step146-admin-trading-lab-mock-fill-simulation-core-preflight.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP147_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_FILL_CORE_REVIEW_RECEIPT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_FILL_CORE_REVIEW_DECISION_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_FILL_CORE_POLICY_REVIEW_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockFillCorePolicyReviewSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockFillSimulationCoreReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockFillSimulationCoreReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockFillCoreReviewReceipt"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockFillCoreReviewDecisionSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockFillSimulationCoreReviewResultRecordingGate"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockFillSimulationCoreReviewResultStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_fill_simulation_core_review_result_recording_gate_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_fill_core_review_recorded"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_fill_simulation_core"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualCashUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPositionUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualOrderCandidateCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualOrderDraftCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisOrderPayloadCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisExecutionPayloadCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisFillPayloadCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualExecutionCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualFillRecordCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "fillCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountBalanceQueried: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "persistentStorageUsed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockFillSimulationCoreReviewResultStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-fill-simulation-core-review-result"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-fill-simulation-core-review-result"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockFillSimulationCoreReviewResultStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-fill-simulation-core-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockFillSimulationCoreReviewResult"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockFillCoreReviewCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockFillCoreReviewList"],
  ["src/components/TradingReadinessPanel.jsx", "Mock fill simulation core review result"],
  ["src/App.css", ".tradingLabMockFillCoreReviewCards"],
  ["src/App.css", ".tradingLabMockFillCoreReviewList"],
  ["package.json", "check:trading-step147-admin-trading-lab-mock-fill-simulation-core-review-result-recording-gate"],
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

  if (!/router\.get\("\/trading-lab-mock-fill-simulation-core-review-result"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockFillSimulationCoreReviewResultStatus/.test(routeText)) {
    fail("mock fill simulation core review result endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockFillSimulationCoreReviewResult",
    "trading-lab-mock-fill-simulation-core-review-result",
    "fetchAdminTradingLabMockFillSimulationCoreReviewResultStatus",
    "buildAdminTradingLabMockFillSimulationCoreReviewResultStatus",
    "buildTradingLabMockFillSimulationCoreReviewResultRecordingGate",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock fill simulation core review result must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock fill simulation core review result must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

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
    "accountBalanceQueried: true",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 147"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step147-admin-trading-lab-mock-fill-simulation-core-review-result-recording-gate] ok");
}

main();

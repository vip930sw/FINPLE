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
  "scripts/check-trading-step149-admin-trading-lab-mock-portfolio-ledger-update-preflight.cjs",
  "scripts/check-trading-step149-admin-trading-lab-mock-portfolio-ledger-update-preflight.test.cjs",
  "scripts/check-trading-step148-admin-trading-lab-mock-fill-simulation-core.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP149_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_LEDGER_UPDATE_CANDIDATE_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_LEDGER_UPDATE_PREFLIGHT_RESULT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockLedgerUpdateCandidates"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabMockPortfolioLedgerUpdatePreflight"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockPortfolioLedgerUpdatePreflight"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_mock_portfolio_ledger_update_preflight_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_portfolio_ledger_update_review_result"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualLedgerEntryCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPortfolioLedgerUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualCashUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPositionUpdated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "persistentStorageUsed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-mock-portfolio-ledger-update-preflight"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-mock-portfolio-ledger-update-preflight"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-mock-portfolio-ledger-update-preflight\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockPortfolioLedgerUpdatePreflightStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockLedgerUpdatePreflightCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMockLedgerUpdatePreflightList"],
  ["src/components/TradingReadinessPanel.jsx", "Mock portfolio ledger update preflight"],
  ["src/components/TradingReadinessPanel.jsx", "It does not update real account ledgers, DB state, cash, positions, fills, executions, orders, or live/provider/order gates."],
  ["src/App.css", ".tradingLabMockLedgerUpdatePreflightCards"],
  ["src/App.css", ".tradingLabMockLedgerUpdatePreflightList"],
  ["package.json", "check:trading-step149-admin-trading-lab-mock-portfolio-ledger-update-preflight"],
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

  if (!/router\.get\("\/trading-lab-mock-portfolio-ledger-update-preflight"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus/.test(routeText)) {
    fail("mock portfolio ledger update preflight endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabMockPortfolioLedgerUpdatePreflightStatus",
    "trading-lab-mock-portfolio-ledger-update-preflight",
    "fetchAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus",
    "buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus",
    "buildTradingLabMockPortfolioLedgerUpdatePreflight",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`mock portfolio ledger update preflight must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`mock portfolio ledger update preflight must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

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
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 149"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step149-admin-trading-lab-mock-portfolio-ledger-update-preflight] ok");
}

main();

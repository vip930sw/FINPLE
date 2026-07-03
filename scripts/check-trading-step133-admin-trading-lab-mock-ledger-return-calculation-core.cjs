const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingAdminLabDashboardShell.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/AdminInquiriesPage.jsx",
  "src/components/AccountPages.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/App.jsx",
  "src/App.css",
  "src/MyPageSidebar.css",
  "scripts/check-trading-step133-admin-trading-lab-mock-ledger-return-calculation-core.cjs",
  "scripts/check-trading-step133-admin-trading-lab-mock-ledger-return-calculation-core.test.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_LEDGER_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_MOCK_TRADE_EVENT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockTradeEvents"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockLedger"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabPositionLedger"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabDailyEquitySeries"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabDailyReturnSeries"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabCumulativeReturnSeries"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabDrawdownSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabAllocationSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "calculateTradingLabPerformanceSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", 'calculationMode: "mock_ledger_calculation_admin_only"'],
  ["server/src/services/tradingAdminLabDashboardShell.js", 'dataSource: "mock_ledger_calculation_result"'],
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-dashboard"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabDashboardStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-dashboard\""],
  ["src/components/TradingReadinessPanel.jsx", "formatPositionField"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardPanel"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabKpiGrid"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabLineChart"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyPanel"],
  ["src/components/AdminInquiriesPage.jsx", "adminTradingConsoleLayout"],
  ["src/MyPageSidebar.css", ".adminTradingConsoleLayout"],
  ["src/App.css", "scroll-margin-top: 104px"],
  ["package.json", "check:trading-step133-admin-trading-lab-mock-ledger-return-calculation-core"],
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

  if (!/router\.get\("\/trading-lab-dashboard"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabDashboardStatus/.test(routeText)) {
    fail("trading lab dashboard endpoint must stay admin-only and return calculated status");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabDashboardStatus",
    "tradingLabDashboardPanel",
    "tradingLabKpiGrid",
    "trading-lab-dashboard",
    "calculateTradingLabDailyEquitySeries",
    "buildTradingLabMockLedger",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`trading lab dashboard must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`trading lab dashboard must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const safetyBranchStart = uiText.indexOf('activeTradingPanelTab === "safety" ? (');
  if (labBranchStart < 0 || safetyBranchStart < 0) fail("Step132B tab separation must remain explicit");
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  if (!labBranch.includes("tradingLabKpiGrid") || !labBranch.includes("tradingLabLineChart")) {
    fail("lab tab must keep KPI and chart dashboard content");
  }
  if (labBranch.includes("tradingReadinessFlagGrid") || labBranch.includes("tradingKisQuoteAdapterOptInPreflight")) {
    fail("lab tab must not render safety gate details");
  }

  const joined = [serviceText, routeText, uiText].join("\n");
  const forbiddenTerms = [
    "axios",
    "submitLiveOrder",
    "placeOrder",
    "issueAccessToken(",
    "queryKisQuote(",
    "quotePrice(",
    "DATABASE_URL",
    "privatePacketPath",
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
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 133"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step133-admin-trading-lab-mock-ledger-return-calculation-core] ok");
}

main();

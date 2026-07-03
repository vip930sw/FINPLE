const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingAdminLabDashboardShell.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/App.css",
  "scripts/check-trading-step132-admin-trading-lab-dashboard-visualization.cjs",
  "scripts/check-trading-step132-admin-trading-lab-dashboard-visualization.test.cjs",
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

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP132_ADMIN_TRADING_LAB_VISUALIZATION_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_KPI_SUMMARY_CARD_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_EQUITY_VISUALIZATION_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_RETURN_VISUALIZATION_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_ALLOCATION_VISUALIZATION_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabKpiSummaryCards"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabEquityVisualization"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabReturnVisualization"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabAllocationVisualization"],
  ["server/src/services/tradingAdminLabDashboardShell.js", 'visualizationMode: "mock_static_admin_only"'],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dataSource: \"static_placeholder_only\""],
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-dashboard"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabDashboardStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-dashboard\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingAdminDashboardStack"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyPanel"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardPanel"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabKpiGrid"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabLineChart"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabReturnBars"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabAllocationBars"],
  ["src/components/TradingReadinessPanel.jsx", "buildSparklinePoints"],
  ["src/components/TradingReadinessPanel.jsx", "Mock, dry-run, shadow placeholder data only"],
  ["src/App.css", "tradingAdminDashboardStack"],
  ["src/App.css", "tradingSafetyPanel"],
  ["src/App.css", "tradingLabDashboardPanel"],
  ["src/App.css", "tradingLabKpiGrid"],
  ["src/App.css", "tradingLabChartGrid"],
  ["src/App.css", "tradingLabLineChart"],
  ["src/App.css", "tradingLabAllocationBars"],
  ["package.json", "check:trading-step132-admin-trading-lab-dashboard-visualization"],
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

  const forbidden = FORBIDDEN_PATHS.filter((filePath) => fs.existsSync(filePath));
  if (forbidden.length > 0) fail(`forbidden trading artifacts present: ${forbidden.join(", ")}`);

  const missingSnippets = REQUIRED_SNIPPETS.filter(([filePath, snippet]) => !readText(filePath).includes(snippet));
  if (missingSnippets.length > 0) {
    fail(`missing required snippets: ${missingSnippets.map(([filePath, snippet]) => `${filePath}:${snippet}`).join(", ")}`);
  }

  const accountPagesText = readText("src/components/AccountPages.jsx");
  const appText = readText("src/App.jsx");
  const publicExposureTerms = [
    "tradingLabDashboardStatus",
    "tradingAdminDashboardStack",
    "tradingLabKpiGrid",
    "trading-lab-dashboard",
    "Mock, dry-run, shadow placeholder data only",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`trading lab dashboard must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`trading lab dashboard must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const safetyIndex = uiText.indexOf("tradingSafetyPanel");
  const labIndex = uiText.indexOf("tradingLabDashboardPanel");
  if (safetyIndex < 0 || labIndex < 0 || safetyIndex >= labIndex) {
    fail("admin trading safety panel must render before separate trading lab dashboard panel");
  }

  const dangerousActionLabels = [
    "지금 주문하기",
    "자동매매 시작",
    "실계좌 운용 시작",
    "거래 기능 활성화",
    "라이브 주문 시작",
    "추천 포트폴리오로 매수",
    "수익률 최적화 주문",
  ];
  const presentDangerousLabels = dangerousActionLabels.filter((term) => uiText.includes(term));
  if (presentDangerousLabels.length > 0) fail(`dangerous action labels present in admin trading panel: ${presentDangerousLabels.join(", ")}`);

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 132"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const joined = [
    readText("server/src/routes/adminTradingReadinessRoutes.js"),
    readText("server/src/services/tradingAdminLabDashboardShell.js"),
    readText("src/components/TradingReadinessPanel.jsx"),
  ].join("\n");
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
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step132-admin-trading-lab-dashboard-visualization] ok");
}

main();

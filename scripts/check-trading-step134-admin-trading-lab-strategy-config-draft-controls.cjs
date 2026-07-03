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
  "scripts/check-trading-step134-admin-trading-lab-strategy-config-draft-controls.cjs",
  "scripts/check-trading-step134-admin-trading-lab-strategy-config-draft-controls.test.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_RISK_LIMIT_DRAFT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyConfigDraft"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabStrategyConfigDraft"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabMockRecalculationBoundary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabStrategyDraftStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", 'calculationMode: "strategy_draft_mock_recalculation_admin_only"'],
  ["server/src/services/tradingAdminLabDashboardShell.js", 'step133CalculationMode: "mock_ledger_calculation_admin_only"'],
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabStrategyDraftStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-strategy-draft"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabStrategyDraftStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-strategy-draft\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabStrategyDraftControls"],
  ["src/components/TradingReadinessPanel.jsx", "handleStrategyDraftPreview"],
  ["src/components/TradingReadinessPanel.jsx", "local_state_only_no_db_write"],
  ["src/App.css", ".tradingLabStrategyDraftControls"],
  ["package.json", "check:trading-step134-admin-trading-lab-strategy-config-draft-controls"],
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

  if (!/router\.get\("\/trading-lab-strategy-draft"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabStrategyDraftStatus/.test(routeText)) {
    fail("strategy draft endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabStrategyDraftControls",
    "trading-lab-strategy-draft",
    "fetchAdminTradingLabStrategyDraftStatus",
    "buildAdminTradingLabStrategyDraftStatus",
    "buildTradingLabStrategyConfigDraft",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`strategy draft controls must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`strategy draft controls must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const safetyBranchStart = uiText.indexOf('activeTradingPanelTab === "safety" ? (');
  if (labBranchStart < 0 || safetyBranchStart < 0) fail("Step132B tab separation must remain explicit");
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  if (!labBranch.includes("tradingLabStrategyDraftControls") || !labBranch.includes("tradingLabKpiGrid")) {
    fail("lab tab must keep strategy draft controls and KPI dashboard content");
  }
  if (labBranch.includes("tradingReadinessFlagGrid") || labBranch.includes("tradingKisQuoteAdapterOptInPreflight")) {
    fail("lab tab must not render safety gate details");
  }
  if (!uiText.includes("tradingAdminSegmentControl") || !uiText.includes("tradingSafetyPanel")) {
    fail("Step132B tab split and Step132C safety panel layout must remain intact");
  }

  const joined = [serviceText, routeText, uiText].join("\n");
  const forbiddenTerms = [
    "axios",
    "fetch(",
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
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 134"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step134-admin-trading-lab-strategy-config-draft-controls] ok");
}

main();

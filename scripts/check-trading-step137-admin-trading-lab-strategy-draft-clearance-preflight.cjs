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
  "scripts/check-trading-step136-admin-trading-lab-strategy-draft-review-result-recording-gate.cjs",
  "scripts/check-trading-step137-admin-trading-lab-strategy-draft-clearance-preflight.cjs",
  "scripts/check-trading-step137-admin-trading-lab-strategy-draft-clearance-preflight.test.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP137_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_CANDIDATE_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_BLOCKER_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_RESULT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabStrategyDraftClearancePreflight"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftClearanceBlockerSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftClearanceCandidate"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftClearancePreflightResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftClearancePreflight"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabStrategyDraftClearancePreflightStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_strategy_draft_clearance_preflight_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderCandidateCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderDraftCreated: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabStrategyDraftClearancePreflightStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-strategy-draft-clearance-preflight"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-strategy-draft-clearance-preflight"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabStrategyDraftClearancePreflightStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-strategy-draft-clearance-preflight\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabStrategyDraftClearancePreflight"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabClearanceCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabClearanceList"],
  ["src/components/TradingReadinessPanel.jsx", "no_order_candidate"],
  ["src/components/TradingReadinessPanel.jsx", "no_order_draft"],
  ["src/App.css", ".tradingLabClearanceCards"],
  ["src/App.css", ".tradingLabClearanceList"],
  ["package.json", "check:trading-step137-admin-trading-lab-strategy-draft-clearance-preflight"],
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

  if (!/router\.get\("\/trading-lab-strategy-draft-clearance-preflight"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabStrategyDraftClearancePreflightStatus/.test(routeText)) {
    fail("strategy draft clearance preflight endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabStrategyDraftClearancePreflight",
    "trading-lab-strategy-draft-clearance-preflight",
    "fetchAdminTradingLabStrategyDraftClearancePreflightStatus",
    "buildAdminTradingLabStrategyDraftClearancePreflightStatus",
    "buildTradingLabStrategyDraftClearancePreflight",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`strategy draft clearance preflight must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`strategy draft clearance preflight must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  if (labBranchStart < 0 || labBranchEnd < 0) fail("Step132B tab separation must remain explicit");
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  if (
    !labBranch.includes("tradingLabStrategyDraftControls")
    || !labBranch.includes("tradingLabStrategyDraftReview")
    || !labBranch.includes("tradingLabStrategyDraftReviewResult")
    || !labBranch.includes("tradingLabStrategyDraftClearancePreflight")
  ) {
    fail("lab tab must keep Step134 controls, Step135 review status, Step136 review result status, and Step137 clearance preflight status");
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
    "orderCandidateCreated: true",
    "orderDraftCreated: true",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 137"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step137-admin-trading-lab-strategy-draft-clearance-preflight] ok");
}

main();

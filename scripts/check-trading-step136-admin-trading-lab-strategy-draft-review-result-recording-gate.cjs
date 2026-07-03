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
  "scripts/check-trading-step135-admin-trading-lab-strategy-draft-comparison-review-gate.cjs",
  "scripts/check-trading-step136-admin-trading-lab-strategy-draft-review-result-recording-gate.cjs",
  "scripts/check-trading-step136-admin-trading-lab-strategy-draft-review-result-recording-gate.test.cjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP136_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_RECORDING_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_DRAFT_REVIEW_RECEIPT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_STRATEGY_DRAFT_REVIEW_BLOCKER_SUMMARY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabStrategyDraftReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftReviewBlockerSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftReviewDecisionSummary"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftReviewResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftReviewReceipt"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabStrategyDraftReviewResultRecordingGate"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabStrategyDraftReviewResultStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_strategy_draft_review_result_recording_gate_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabStrategyDraftReviewResultStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-strategy-draft-review-result"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-strategy-draft-review-result"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabStrategyDraftReviewResultStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-strategy-draft-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabStrategyDraftReviewResult"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabStrategyReviewResultHistory"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabReviewResultCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabReviewResultList"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabStrategyDraftReview"],
  ["src/App.css", ".tradingLabReviewResultCards"],
  ["src/App.css", ".tradingLabReviewResultList"],
  ["package.json", "check:trading-step136-admin-trading-lab-strategy-draft-review-result-recording-gate"],
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

  if (!/router\.get\("\/trading-lab-strategy-draft-review-result"[\s\S]*requireAdminAccess[\s\S]*buildAdminTradingLabStrategyDraftReviewResultStatus/.test(routeText)) {
    fail("strategy draft review result endpoint must stay admin-only and read-only");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) {
    fail("admin trading readiness routes must remain read-only GET endpoints");
  }

  const publicExposureTerms = [
    "tradingLabStrategyDraftReviewResult",
    "trading-lab-strategy-draft-review-result",
    "fetchAdminTradingLabStrategyDraftReviewResultStatus",
    "buildAdminTradingLabStrategyDraftReviewResultStatus",
    "buildTradingLabStrategyDraftReviewResultRecordingGate",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`strategy draft review result must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`strategy draft review result must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  if (labBranchStart < 0 || labBranchEnd < 0) fail("Step132B tab separation must remain explicit");
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  if (!labBranch.includes("tradingLabStrategyDraftControls") || !labBranch.includes("tradingLabStrategyDraftReview") || !labBranch.includes("tradingLabStrategyDraftReviewResult")) {
    fail("lab tab must keep Step134 controls, Step135 review status, and Step136 review result status");
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
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const scenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = scenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 136"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step136-admin-trading-lab-strategy-draft-review-result-recording-gate] ok");
}

main();

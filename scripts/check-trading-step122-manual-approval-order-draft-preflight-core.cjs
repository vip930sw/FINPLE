const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingManualApprovalOrderDraftPreflight.js",
  "server/src/services/tradingManualApprovalOrderDraftPreflight.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "scripts/check-trading-step122-manual-approval-order-draft-preflight-core.cjs",
  "scripts/check-trading-step122-manual-approval-order-draft-preflight-core.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/services/trading/kisOrderAdapter.js",
  "server/src/services/trading/kisReadOnlyProvider.js",
  "server/src/services/trading/readOnlyApprovalImport.js",
  "server/src/services/trading/manualOrderPermissionImport.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "createManualApprovalOrderDraft"],
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "runManualApprovalOrderDraftPreflight"],
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "REDACTED_MANUAL_APPROVAL_ORDER_DRAFT_SCHEMA"],
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "REDACTED_TEST_SYMBOL"],
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "readyForLiveGuardedTrading: false"],
  ["server/src/services/tradingManualApprovalOrderDraftPreflight.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/manual-approval-order-draft-preflight"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingManualApprovalOrderDraftPreflightStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/manual-approval-order-draft-preflight\""],
  ["src/components/TradingReadinessPanel.jsx", "Manual approval draft"],
  ["src/components/TradingReadinessPanel.jsx", "manualApprovalOrderDraftStatus"],
  ["package.json", "check:trading-step122-manual-approval-order-draft-preflight-core"],
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
  if (accountPagesText.includes("manualApprovalOrderDraftStatus") || accountPagesText.includes("Manual approval draft")) {
    fail("manual approval order draft UI must not be exposed on /mypage");
  }
  if (appText.includes("manualApprovalOrderDraftStatus") || appText.includes("Manual approval draft")) {
    fail("manual approval order draft UI must not be exposed on homepage or public router");
  }

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 122"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const serviceText = readText("server/src/services/tradingManualApprovalOrderDraftPreflight.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const joined = `${routeText}\n${serviceText}\n${uiText}`;
  const forbiddenTerms = ["fetch(", "axios", "submitLiveOrder", "placeOrder", "KIS_TRADING", "DATABASE_URL", "privatePacketPath"];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step122-manual-approval-order-draft-preflight-core] ok");
}

main();

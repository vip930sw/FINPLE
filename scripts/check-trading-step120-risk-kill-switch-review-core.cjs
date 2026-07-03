const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingRiskKillSwitchReviewCore.js",
  "server/src/services/tradingRiskKillSwitchReviewCore.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "scripts/check-trading-step120-risk-kill-switch-review-core.cjs",
  "scripts/check-trading-step120-risk-kill-switch-review-core.test.cjs",
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
  ["server/src/services/tradingRiskKillSwitchReviewCore.js", "buildRiskGatePolicyCore"],
  ["server/src/services/tradingRiskKillSwitchReviewCore.js", "buildKillSwitchPolicyCore"],
  ["server/src/services/tradingRiskKillSwitchReviewCore.js", "REDACTED_RISK_KILL_SWITCH_REVIEW_SCHEMA"],
  ["server/src/services/tradingRiskKillSwitchReviewCore.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingRiskKillSwitchReviewCore.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingRiskKillSwitchReviewCore.js", "readyForLiveGuardedTrading: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/risk-kill-switch"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingRiskKillSwitchStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/risk-kill-switch\""],
  ["src/components/TradingReadinessPanel.jsx", "Risk and kill-switch"],
  ["src/components/TradingReadinessPanel.jsx", "riskKillSwitchStatus"],
  ["package.json", "check:trading-step120-risk-kill-switch-review-core"],
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
  if (accountPagesText.includes("TradingReadinessPanel") || accountPagesText.includes("riskKillSwitchStatus")) {
    fail("risk/kill-switch UI must not be exposed on /mypage");
  }
  if (appText.includes("riskKillSwitchStatus") || appText.includes("Risk and kill-switch")) {
    fail("risk/kill-switch UI must not be exposed on homepage or public router");
  }

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 120"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const serviceText = readText("server/src/services/tradingRiskKillSwitchReviewCore.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const joined = `${routeText}\n${serviceText}\n${uiText}`;
  const forbiddenTerms = ["fetch(", "axios", "submitLiveOrder", "placeOrder", "KIS_TRADING", "DATABASE_URL", "privatePacketPath"];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step120-risk-kill-switch-review-core] ok");
}

main();

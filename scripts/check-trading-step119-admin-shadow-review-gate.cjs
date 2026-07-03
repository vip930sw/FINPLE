const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingShadowReviewGate.js",
  "server/src/services/tradingShadowReviewGate.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "scripts/check-trading-step119-admin-shadow-review-gate.cjs",
  "scripts/check-trading-step119-admin-shadow-review-gate.test.cjs",
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
  ["server/src/services/tradingShadowReviewGate.js", "reviewShadowHistory"],
  ["server/src/services/tradingShadowReviewGate.js", "reviewDryRunReplayResult"],
  ["server/src/services/tradingShadowReviewGate.js", "REDACTED_REVIEW_RESULT_SCHEMA"],
  ["server/src/services/tradingShadowReviewGate.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingShadowReviewGate.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingShadowReviewGate.js", "readyForLiveGuardedTrading: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/shadow-review"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingShadowReviewStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/shadow-review\""],
  ["src/components/TradingReadinessPanel.jsx", "Review gate"],
  ["src/components/TradingReadinessPanel.jsx", "shadowReviewStatus"],
  ["package.json", "check:trading-step119-admin-shadow-review-gate"],
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
  if (accountPagesText.includes("TradingReadinessPanel") || accountPagesText.includes("shadowReviewStatus")) {
    fail("trading review UI must not be exposed on /mypage");
  }

  const serviceText = readText("server/src/services/tradingShadowReviewGate.js");
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const joined = `${serviceText}\n${routeText}\n${uiText}`;
  const forbiddenTerms = ["fetch(", "axios", "submitLiveOrder", "placeOrder", "KIS_TRADING", "DATABASE_URL", "providerPayload", "orderPayload", "privatePacketPath"];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step119-admin-shadow-review-gate] ok");
}

main();

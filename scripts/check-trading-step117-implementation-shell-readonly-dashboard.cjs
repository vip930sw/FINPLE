const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingImplementationShell.js",
  "server/src/services/tradingImplementationShell.test.js",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/routes/tradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "scripts/check-trading-step117-implementation-shell-readonly-dashboard.cjs",
  "scripts/check-trading-step117-implementation-shell-readonly-dashboard.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
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
  ["server/src/index.js", 'app.use("/api/trading-readiness", tradingReadinessRoutes);'],
  ["server/src/routes/tradingReadinessRoutes.js", 'router.get("/readiness"'],
  ["server/src/services/tradingImplementationShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingImplementationShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingImplementationShell.js", "networkCallAttempted: false"],
  ["src/components/TradingReadinessPanel.jsx", "Provider calls"],
  ["src/components/TradingReadinessPanel.jsx", "Order submission"],
  ["src/components/TradingReadinessPanel.jsx", "readyForLiveGuardedTrading"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchTradingReadinessStatus"],
  ["src/components/AccountPages.jsx", "<TradingReadinessPanel />"],
  ["package.json", "check:trading-step117-implementation-shell-readonly-dashboard"],
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

  const serviceText = readText("server/src/services/tradingImplementationShell.js");
  const routeText = readText("server/src/routes/tradingReadinessRoutes.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const joined = `${serviceText}\n${routeText}\n${uiText}`;
  const forbiddenTerms = [
    "fetch(",
    "axios",
    "submitLiveOrder",
    "placeOrder",
    "orderButton",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step117-implementation-shell-readonly-dashboard] ok");
}

main();

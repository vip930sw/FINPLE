const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingImplementationShell.js",
  "server/src/services/tradingImplementationShell.test.js",
  "server/src/services/tradingProviderAdapterSkeleton.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "scripts/check-trading-step117-implementation-shell-readonly-dashboard.cjs",
  "scripts/check-trading-step117-implementation-shell-readonly-dashboard.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/routes/tradingReadinessRoutes.test.js",
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
  ["server/src/index.js", 'app.use("/api/admin/trading-readiness", adminTradingReadinessRoutes);'],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/readiness"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/services/tradingImplementationShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingImplementationShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingImplementationShell.js", "networkCallAttempted: false"],
  ["server/src/services/tradingProviderAdapterSkeleton.js", "STEP117_PROVIDER_ADAPTER_INTERFACE"],
  ["server/src/services/tradingProviderAdapterSkeleton.js", "blocked_provider_calls_disabled"],
  ["server/src/services/tradingProviderAdapterSkeleton.js", "not_implemented"],
  ["server/src/services/tradingProviderAdapterSkeleton.js", "fail_closed"],
  ["server/src/services/tradingProviderAdapterSkeleton.js", "mock_only"],
  ["server/src/services/tradingProviderAdapterSkeleton.js", "dry_run_only"],
  ["server/src/services/tradingProviderAdapterSkeleton.js", "shadow_only"],
  ["src/components/TradingReadinessPanel.jsx", "Provider calls"],
  ["src/components/TradingReadinessPanel.jsx", "Order submission"],
  ["src/components/TradingReadinessPanel.jsx", "readyForLiveGuardedTrading"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchTradingReadinessStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/readiness\""],
  ["src/components/AdminInquiriesPage.jsx", "<TradingReadinessPanel"],
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
  const providerAdapterText = readText("server/src/services/tradingProviderAdapterSkeleton.js");
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const joined = `${serviceText}\n${providerAdapterText}\n${routeText}\n${uiText}`;
  const forbiddenTerms = [
    "fetch(",
    "axios",
    "submitLiveOrder",
    "placeOrder",
    "orderButton",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  if (readText("src/components/AccountPages.jsx").includes("<TradingReadinessPanel")) {
    fail("trading readiness panel must stay off /mypage");
  }

  console.log("[check-trading-step117-implementation-shell-readonly-dashboard] ok");
}

main();

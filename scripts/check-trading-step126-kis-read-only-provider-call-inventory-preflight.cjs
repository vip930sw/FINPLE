const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js",
  "server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "scripts/check-trading-step126-kis-read-only-provider-call-inventory-preflight.cjs",
  "scripts/check-trading-step126-kis-read-only-provider-call-inventory-preflight.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/services/trading/kisOrderAdapter.js",
  "server/src/services/trading/kisReadOnlyProvider.js",
  "server/src/services/trading/kisQuoteAdapter.js",
  "server/src/services/trading/kisTokenClient.js",
  "server/src/services/trading/readOnlyApprovalImport.js",
  "server/src/services/trading/manualOrderPermissionImport.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "buildKisReadOnlyProviderCallInventory"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "buildKisReadOnlyProviderCallOptInPreflight"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "KIS_READ_ONLY_PROVIDER_CALL_SAFETY_REQUIREMENT_SCHEMA"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "KIS_READ_ONLY_CACHE_RATE_LIMIT_AUDIT_REQUIREMENT_SCHEMA"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "REDACTED_KIS_PROVIDER_CALL_INVENTORY_RESULT_SCHEMA"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "tokenIssuanceAttempted: false"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "quoteRequestAttempted: false"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "readyForLiveGuardedTrading: false"],
  ["server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/kis-read-only-provider-call-inventory-preflight"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingKisReadOnlyProviderCallInventoryPreflightStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/kis-read-only-provider-call-inventory-preflight\""],
  ["src/components/TradingReadinessPanel.jsx", "KIS provider-call inventory"],
  ["src/components/TradingReadinessPanel.jsx", "kisProviderCallInventoryStatus"],
  ["package.json", "check:trading-step126-kis-read-only-provider-call-inventory-preflight"],
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
  if (
    accountPagesText.includes("kisProviderCallInventoryStatus") ||
    accountPagesText.includes("KIS provider-call inventory")
  ) {
    fail("KIS provider-call inventory UI must not be exposed on /mypage");
  }
  if (appText.includes("kisProviderCallInventoryStatus") || appText.includes("KIS provider-call inventory")) {
    fail("KIS provider-call inventory UI must not be exposed on homepage or public router");
  }

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 126"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const serviceText = readText("server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const joined = `${routeText}\n${serviceText}\n${uiText}`;
  const forbiddenTerms = [
    "fetch(",
    "axios",
    "submitLiveOrder",
    "placeOrder",
    "issueAccessToken(",
    "kisToken",
    "quotePrice(",
    "DATABASE_URL",
    "privatePacketPath",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step126-kis-read-only-provider-call-inventory-preflight] ok");
}

main();

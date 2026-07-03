const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js",
  "server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "scripts/check-trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary.cjs",
  "scripts/check-trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/routes/kis",
  "server/src/services/trading/kisOrderAdapter.js",
  "server/src/services/trading/kisReadOnlyProvider.js",
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
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_BOUNDARY_SCHEMA"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "KIS_QUOTE_ADAPTER_READINESS_PREFLIGHT_SCHEMA"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "REDACTED_KIS_ADAPTER_CONFIG_STATUS_SCHEMA"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "buildRedactedKisAdapterConfigStatus"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "buildKisReadOnlyQuoteAdapterOptInBoundary"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "buildKisQuoteAdapterReadinessPreflight"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "buildAdminKisReadOnlyQuoteAdapterOptInPreflightStatus"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "readyForLiveGuardedTrading: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "tokenIssuanceAttempted: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "quoteRequestAttempted: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "networkCallAttempted: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "adapterCallEnabled: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "liveAdapterImplemented: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "persistentStorageUsed: false"],
  ["server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/kis-read-only-quote-adapter-opt-in-preflight"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingKisReadOnlyQuoteAdapterOptInPreflightStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/kis-read-only-quote-adapter-opt-in-preflight\""],
  ["src/components/TradingReadinessPanel.jsx", "KIS quote adapter opt-in"],
  ["src/components/TradingReadinessPanel.jsx", "kisQuoteAdapterOptInPreflightStatus"],
  ["package.json", "check:trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary"],
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
    "kisQuoteAdapterOptInPreflightStatus",
    "KIS quote adapter opt-in",
    "kis-read-only-quote-adapter-opt-in-preflight",
  ];
  const exposedOnAccountPages = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (exposedOnAccountPages.length > 0) fail(`KIS quote adapter opt-in UI must not be exposed on /mypage: ${exposedOnAccountPages.join(", ")}`);
  const exposedOnApp = publicExposureTerms.filter((term) => appText.includes(term));
  if (exposedOnApp.length > 0) fail(`KIS quote adapter opt-in UI must not be exposed on homepage or public router: ${exposedOnApp.join(", ")}`);

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 130"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const joined = [
    readText("server/src/routes/adminTradingReadinessRoutes.js"),
    readText("server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js"),
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
    "adapterCallEnabled: true",
    "liveAdapterImplemented: true",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const serviceText = readText("server/src/services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js");
  const rawValueTerms = [
    "APP_KEY_SHOULD_NOT_LEAK",
    "APP_SECRET_SHOULD_NOT_LEAK",
    "ACCOUNT_ID_SHOULD_NOT_LEAK",
    "https://kis.example.invalid/private",
  ];
  const rawValueLeakTerms = rawValueTerms.filter((term) => serviceText.includes(term));
  if (rawValueLeakTerms.length > 0) fail(`raw KIS config values must not be stored in service code: ${rawValueLeakTerms.join(", ")}`);

  console.log("[check-trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary] ok");
}

main();

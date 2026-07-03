const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingProviderCallPolicyCore.js",
  "server/src/services/tradingProviderCallPolicyCore.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "scripts/check-trading-step129-provider-call-cache-rate-limit-audit-policy-core.cjs",
  "scripts/check-trading-step129-provider-call-cache-rate-limit-audit-policy-core.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/services/trading/kisOrderAdapter.js",
  "server/src/services/trading/kisReadOnlyProvider.js",
  "server/src/services/trading/kisQuoteAdapter.js",
  "server/src/services/trading/kisTokenClient.js",
  "server/src/services/trading/providerCallRuntime.js",
  "server/src/services/trading/providerCallCacheRuntime.js",
  "server/src/services/trading/providerCallRateLimitRuntime.js",
  "server/src/services/trading/providerCallAuditRuntime.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingProviderCallPolicyCore.js", "PROVIDER_CALL_CACHE_POLICY_SCHEMA"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "PROVIDER_CALL_RATE_LIMIT_POLICY_SCHEMA"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "PROVIDER_CALL_AUDIT_DRY_RUN_POLICY_SCHEMA"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "REDACTED_PROVIDER_CALL_POLICY_STATUS_SCHEMA"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "buildProviderCallCachePolicyCore"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "buildProviderCallRateLimitPolicyCore"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "buildProviderCallAuditDryRunPolicyCore"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "buildAdminProviderCallPolicyStatus"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "readyForLiveGuardedTrading: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "tokenIssuanceAttempted: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "quoteRequestAttempted: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "cacheDbWriteUsed: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "auditDbWriteUsed: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "persistentStorageUsed: false"],
  ["server/src/services/tradingProviderCallPolicyCore.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/provider-call-policy"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingProviderCallPolicyStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/provider-call-policy\""],
  ["src/components/TradingReadinessPanel.jsx", "Provider-call policy"],
  ["src/components/TradingReadinessPanel.jsx", "providerCallPolicyStatus"],
  ["package.json", "check:trading-step129-provider-call-cache-rate-limit-audit-policy-core"],
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
    accountPagesText.includes("providerCallPolicyStatus") ||
    accountPagesText.includes("Provider-call policy")
  ) {
    fail("provider-call policy UI must not be exposed on /mypage");
  }
  if (
    appText.includes("providerCallPolicyStatus") ||
    appText.includes("Provider-call policy")
  ) {
    fail("provider-call policy UI must not be exposed on homepage or public router");
  }

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 129"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const serviceText = readText("server/src/services/tradingProviderCallPolicyCore.js");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const joined = `${routeText}\n${serviceText}\n${uiText}`;
  const forbiddenTerms = [
    "fetch(",
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
    "cacheDbWriteUsed: true",
    "auditDbWriteUsed: true",
    "persistentStorageUsed: true",
    "dbWriteUsed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step129-provider-call-cache-rate-limit-audit-policy-core] ok");
}

main();

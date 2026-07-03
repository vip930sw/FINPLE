const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingProviderResponseValidationReviewResultGate.js",
  "server/src/services/tradingProviderResponseValidationReviewResultGate.test.js",
  "server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "scripts/check-trading-step128-provider-response-validation-review-result-recording-gate.cjs",
  "scripts/check-trading-step128-provider-response-validation-review-result-recording-gate.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/services/trading/kisOrderAdapter.js",
  "server/src/services/trading/kisReadOnlyProvider.js",
  "server/src/services/trading/kisQuoteAdapter.js",
  "server/src/services/trading/kisTokenClient.js",
  "server/src/services/trading/providerResponseRuntime.js",
  "server/src/services/trading/providerResponseReviewRuntime.js",
  "server/src/services/trading/readOnlyApprovalImport.js",
  "server/src/services/trading/manualOrderPermissionImport.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "PROVIDER_RESPONSE_VALIDATION_REVIEW_SCHEMA"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_SCHEMA"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "REDACTED_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_SCHEMA"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "buildProviderResponseValidationReview"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "recordProviderResponseValidationReviewResult"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "buildAdminProviderResponseValidationReviewResultStatus"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "readyForLiveGuardedTrading: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "tokenIssuanceAttempted: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "quoteRequestAttempted: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "rawProviderResponseStored: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "persistentStorageUsed: false"],
  ["server/src/services/tradingProviderResponseValidationReviewResultGate.js", "dbWriteUsed: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/provider-response-validation-review-result"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingProviderResponseValidationReviewResultStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/provider-response-validation-review-result\""],
  ["src/components/TradingReadinessPanel.jsx", "Provider response validation review"],
  ["src/components/TradingReadinessPanel.jsx", "providerResponseValidationReviewResultStatus"],
  ["package.json", "check:trading-step128-provider-response-validation-review-result-recording-gate"],
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
    accountPagesText.includes("providerResponseValidationReviewResultStatus") ||
    accountPagesText.includes("Provider response validation review")
  ) {
    fail("provider response validation review UI must not be exposed on /mypage");
  }
  if (
    appText.includes("providerResponseValidationReviewResultStatus") ||
    appText.includes("Provider response validation review")
  ) {
    fail("provider response validation review UI must not be exposed on homepage or public router");
  }

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 128"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const serviceText = readText("server/src/services/tradingProviderResponseValidationReviewResultGate.js");
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

  console.log("[check-trading-step128-provider-response-validation-review-result-recording-gate] ok");
}

main();

const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js",
  "server/src/services/tradingProviderResponseEnvelopeValidationReceipt.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "scripts/check-trading-step127-read-only-provider-response-envelope-validation-receipt.cjs",
  "scripts/check-trading-step127-read-only-provider-response-envelope-validation-receipt.test.cjs",
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
  "server/src/services/trading/readOnlyApprovalImport.js",
  "server/src/services/trading/manualOrderPermissionImport.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_SCHEMA"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "PROVIDER_RESPONSE_VALIDATION_RECEIPT_SCHEMA"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "PROVIDER_RESPONSE_FIELD_VALIDATION_CORE_SCHEMA"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "buildReadOnlyProviderResponseEnvelope"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "buildRedactedProviderResponseValidationReceipt"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "validateProviderResponseEnvelopeFields"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "readyForLiveGuardedTrading: false"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "tokenIssuanceAttempted: false"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "quoteRequestAttempted: false"],
  ["server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js", "rawProviderResponseStored: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/provider-response-envelope-validation"'],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingProviderResponseEnvelopeValidationStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/provider-response-envelope-validation\""],
  ["src/components/TradingReadinessPanel.jsx", "Provider response validation"],
  ["src/components/TradingReadinessPanel.jsx", "providerResponseEnvelopeValidationStatus"],
  ["package.json", "check:trading-step127-read-only-provider-response-envelope-validation-receipt"],
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
    accountPagesText.includes("providerResponseEnvelopeValidationStatus") ||
    accountPagesText.includes("Provider response validation")
  ) {
    fail("provider response validation UI must not be exposed on /mypage");
  }
  if (
    appText.includes("providerResponseEnvelopeValidationStatus") ||
    appText.includes("Provider response validation")
  ) {
    fail("provider response validation UI must not be exposed on homepage or public router");
  }

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 127"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const serviceText = readText("server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js");
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
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step127-read-only-provider-response-envelope-validation-receipt] ok");
}

main();

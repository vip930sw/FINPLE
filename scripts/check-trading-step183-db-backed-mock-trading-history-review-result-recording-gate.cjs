const fs = require("node:fs");

const STEP183_SCRIPT = "check:trading-step183-db-backed-mock-trading-history-review-result-recording-gate";
const STEP183_ROUTE = "trading-lab-db-backed-mock-trading-history-review-result";
const STEP182_ROUTE = "trading-lab-db-backed-mock-trading-history-preflight";

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingDbBackedMockTradingHistoryReviewResult.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate.cjs",
  "scripts/check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step182-db-backed-mock-trading-history-preflight.cjs",
  "scripts/check-trading-step181-render-api-direct-connectivity-reliability.cjs",
  "scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs",
  "scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs",
  "scripts/check-trading-step176-admin-trading-safety-assessment-layout-polish.cjs",
  "scripts/check-trading-step175-admin-trading-lab-mvp-final-review.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SERVICE_SNIPPETS = [
  "STEP183_DB_BACKED_MOCK_TRADING_HISTORY_REVIEW_RESULT_FLAGS",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_REVIEW_RESULT_MODEL",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_REVIEW_RECEIPT_SCHEMA",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_REVIEW_FORBIDDEN_VALUE_TYPES",
  "validateDbBackedMockTradingHistoryReviewResult",
  "buildDbBackedMockTradingHistoryReviewResult",
  "buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus",
  "db_backed_mock_history_review_recorded",
  "db_backed_mock_trading_history_migration_preflight",
  "candidateSchemaReviewSummary",
  "redactionPolicyReviewSummary",
  "migrationReadinessReviewSummary",
  "dbWriteBlockedConfirmation",
  "dbWriteStatus: \"blocked\"",
  "dbMigrationStatus: \"blocked\"",
  "supabaseMutationStatus: \"blocked\"",
  "dbWriteUsed: false",
  "persistentStorageUsed: false",
  "dbMigrationCreated: false",
  "dbSchemaChanged: false",
  "supabaseInsertAttempted: false",
  "supabaseUpdateAttempted: false",
  "supabaseDeleteAttempted: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "readyForLiveGuardedTrading: false",
  "actualTradingRunCreated: false",
  "accountBalanceQueried: false",
];

const REQUIRED_FORBIDDEN_VALUE_SNIPPETS = [
  "credential",
  "account_identifier",
  "raw_provider_response",
  "provider_payload",
  "order_payload",
  "kis_token",
  "app_key",
  "app_secret",
  "account_number",
  "actual_order_id",
  "actual_execution_id",
  "actual_fill_id",
  "actual_account_balance",
  "actual_trading_run_id",
  "private_path",
  "hash",
  "digest",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/kis",
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

const FORBIDDEN_SERVICE_SNIPPETS = [
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
  "dbWriteUsed: true",
  "persistentStorageUsed: true",
  "dbMigrationCreated: true",
  "dbSchemaChanged: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "networkCallAttempted: true",
  "tokenIssuanceAttempted: true",
  "quoteRequestAttempted: true",
  "orderSubmissionAttempted: true",
  "actualTradingRunCreated: true",
  "accountBalanceQueried: true",
];

const PUBLIC_SURFACE_FILES = [
  "src/App.jsx",
  "src/components/AccountPages.jsx",
  "src/components/mypage/MyPageRoute.jsx",
  "src/components/mypage/MyPageSidebar.jsx",
  "src/components/mypage/MyPageLayout.jsx",
  "src/components/SiteHeader.jsx",
];

const SCENARIO_FILES = [
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "server/src/routes/scenarioRoutes.js",
  "server/src/services/scenarioRuntime.js",
];

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function assertRequiredFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    if (!fs.existsSync(filePath)) fail(`required file missing: ${filePath}`);
  }
}

function assertStep183ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP183_SCRIPT];
  if (!script) fail(`${STEP183_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate.cjs",
    "server/src/services/tradingDbBackedMockTradingHistoryReviewResult.test.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
  ]) {
    if (!script.includes(snippet)) fail(`Step183 npm check missing ${snippet}`);
  }
}

function assertServiceModelAndSafetyBoundaries() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  for (const snippet of REQUIRED_SERVICE_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`Step183 service missing ${snippet}`);
  }
  for (const snippet of REQUIRED_FORBIDDEN_VALUE_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`Step183 redaction review missing forbidden value type ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SERVICE_SNIPPETS) {
    if (serviceText.includes(snippet)) fail(`Step183 service contains forbidden snippet: ${snippet}`);
  }
}

function assertAdminOnlyRouteAndClient() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  const routeIndex = routeText.indexOf(`router.get("/${STEP183_ROUTE}"`);
  if (routeIndex < 0) fail("Step183 admin-only route missing");
  const guardedSnippet = routeText.slice(Math.max(0, routeIndex - 240), routeIndex + 360);
  if (!guardedSnippet.includes("requireAdminAccess")) fail("Step183 route must be guarded by requireAdminAccess");
  if (!guardedSnippet.includes("buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus")) {
    fail("Step183 route must return the review result status builder");
  }
  if (!clientText.includes(`"/admin/trading-readiness/${STEP183_ROUTE}"`)) fail("Step183 frontend client path missing");
  if (!clientText.includes("fetchAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus")) fail("Step183 client function missing");
  if (!routeText.includes(`router.get("/${STEP182_ROUTE}"`)) fail("Step182 preflight route must remain present");
}

function assertAdminTradingUiOnly() {
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");
  for (const snippet of [
    "trading-lab-db-backed-mock-trading-history-review-result",
    "tradingLabDbHistoryReviewSummary",
    "DB 저장형 mock trading history 검토 결과",
    "실제 DB 저장을 수행하지 않습니다",
    "Supabase insert/update/delete는 차단",
    "redacted review receipt",
    "저장 후보 schema 검토",
    "저장 금지 항목 검토",
    "DB write blocked confirmation",
    "provider/order/live readiness 영향 없음",
  ]) {
    if (!panelText.includes(snippet)) fail(`Step183 admin panel missing ${snippet}`);
  }
  for (const snippet of [
    ".tradingLabDbHistoryReviewSummary",
    ".tradingLabDbHistoryReviewStatusGrid",
    ".tradingLabDbHistoryReviewLists",
    ".tradingLabDbHistoryReviewNotice",
  ]) {
    if (!cssText.includes(snippet)) fail(`Step183 CSS missing ${snippet}`);
  }
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP183_ROUTE) || text.includes("tradingLabDbHistoryReviewSummary")) {
      fail(`Step183 must not expose DB-backed mock history review UI in public/mypage surface: ${filePath}`);
    }
  }
}

function assertNoForbiddenArtifactsOrRegression() {
  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden artifact exists: ${forbiddenPath}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("db-backed-mock-trading-history-review") || text.includes("tradingLabDbHistoryReview")) {
      fail(`Step183 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
    "check:trading-step182-db-backed-mock-trading-history-preflight",
    "check:trading-step181-render-api-direct-connectivity-reliability",
    "check:trading-step180-render-api-health-and-deployment-metadata",
    "check:trading-step179-legacy-trading-check-runner-heavy-service-audit",
    "check:trading-step178-remaining-legacy-trading-check-runner-cleanup",
    "check:trading-step177-legacy-trading-check-runner-cleanup",
    "check:trading-step176-admin-trading-safety-assessment-layout-polish",
    "check:trading-step175-admin-trading-lab-mvp-final-review",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertStep183ScriptExists(packageJson);
  assertServiceModelAndSafetyBoundaries();
  assertAdminOnlyRouteAndClient();
  assertAdminTradingUiOnly();
  assertNoForbiddenArtifactsOrRegression();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate] ok");
}

main();

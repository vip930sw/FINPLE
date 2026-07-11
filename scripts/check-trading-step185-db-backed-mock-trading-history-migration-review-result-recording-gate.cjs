const fs = require("node:fs");

const STEP185_SCRIPT = "check:trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate";
const STEP185_ROUTE = "trading-lab-db-backed-mock-trading-history-migration-review-result";
const STEP184_ROUTE = "trading-lab-db-backed-mock-trading-history-migration-preflight";

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingDbBackedMockTradingHistoryMigrationReviewResult.test.js",
  "server/src/services/tradingDbBackedMockTradingHistoryMigrationPreflight.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate.cjs",
  "scripts/check-trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step184-db-backed-mock-trading-history-migration-preflight.cjs",
  "scripts/check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate.cjs",
  "scripts/check-trading-step182-db-backed-mock-trading-history-preflight.cjs",
  "scripts/check-trading-step181-render-api-direct-connectivity-reliability.cjs",
  "scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs",
  "scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SERVICE_SNIPPETS = [
  "STEP185_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_REVIEW_RESULT_FLAGS",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_REVIEW_RESULT_MODEL",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_REVIEW_RECEIPT_SCHEMA",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_REVIEW_FORBIDDEN_VALUE_TYPES",
  "buildDbBackedMockTradingHistoryMigrationTableReviewSummary",
  "validateDbBackedMockTradingHistoryMigrationReviewResult",
  "buildDbBackedMockTradingHistoryMigrationReviewResult",
  "buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus",
  "migration_draft_review_recorded",
  "reviewed_not_created",
  "migrationFileStatus: \"not_created\"",
  "sqlFileStatus: \"not_created\"",
  "db_backed_mock_trading_history_sql_draft_preflight",
  "mock_trading_strategy_presets",
  "mock_trading_runs",
  "mock_trading_order_summaries",
  "mock_trading_fill_summaries",
  "mock_trading_ledger_snapshots",
  "mock_trading_performance_snapshots",
  "mock_trading_allocation_snapshots",
  "mock_trading_risk_snapshots",
  "schemaChangeStatus: \"blocked\"",
  "dbWriteStatus: \"blocked\"",
  "supabaseMutationStatus: \"blocked\"",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "readyForLiveGuardedTrading: false",
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
  "supabase/migrations/trading",
  "db/migrations/trading",
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
  "sqlFileCreated: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "networkCallAttempted: true",
  "tokenIssuanceAttempted: true",
  "quoteRequestAttempted: true",
  "orderSubmissionAttempted: true",
  "actualTradingRunCreated: true",
  "accountBalanceQueried: true",
  "CREATE TABLE",
  "ALTER TABLE",
  "CREATE INDEX",
  "POLICY FOR",
  "supabase migration",
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

function assertStep185ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP185_SCRIPT];
  if (!script) fail(`${STEP185_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate.cjs",
    "server/src/services/tradingDbBackedMockTradingHistoryMigrationReviewResult.test.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
  ]) {
    if (!script.includes(snippet)) fail(`Step185 npm check missing ${snippet}`);
  }
}

function assertServiceModelAndSafetyBoundaries() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  for (const snippet of REQUIRED_SERVICE_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`Step185 service missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SERVICE_SNIPPETS) {
    if (serviceText.includes(snippet)) fail(`Step185 service contains forbidden snippet: ${snippet}`);
  }
}

function assertAdminOnlyRouteAndClient() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  const routeIndex = routeText.indexOf(`router.get("/${STEP185_ROUTE}"`);
  if (routeIndex < 0) fail("Step185 admin-only route missing");
  const guardedSnippet = routeText.slice(Math.max(0, routeIndex - 240), routeIndex + 360);
  if (!guardedSnippet.includes("requireAdminAccess")) fail("Step185 route must be guarded by requireAdminAccess");
  if (!guardedSnippet.includes("buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus")) {
    fail("Step185 route must return the migration review result status builder");
  }
  if (!clientText.includes(`"/admin/trading-readiness/${STEP185_ROUTE}"`)) fail("Step185 frontend client path missing");
  if (!clientText.includes("fetchAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus")) fail("Step185 client function missing");
  if (!routeText.includes(`router.get("/${STEP184_ROUTE}"`)) fail("Step184 migration preflight route must remain present");
}

function assertAdminTradingUiOnly() {
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");
  for (const snippet of [
    "trading-lab-db-backed-mock-trading-history-migration-review-result",
    "tradingLabDbHistoryMigrationReviewDetails",
    "Migration 후보 검토 결과",
    "DB schema 변경 전 검토 receipt",
    "DDL draft 검토 결과",
    "실제 SQL 또는 DB 변경을 수행하지 않습니다",
    "Migration 파일과 SQL 파일은 아직 생성되지 않았습니다",
    "Supabase mutation은 계속 차단",
    "다음 허용 단계: SQL draft 사전검토",
  ]) {
    if (!panelText.includes(snippet)) fail(`Step185 admin panel missing ${snippet}`);
  }
  for (const snippet of [
    ".tradingLabDbHistoryMigrationReviewDetails",
    ".tradingLabDbHistoryMigrationReviewStatusGrid",
    ".tradingLabDbHistoryMigrationReviewLists",
    ".tradingLabDbHistoryMigrationReviewNotice",
  ]) {
    if (!cssText.includes(snippet)) fail(`Step185 CSS missing ${snippet}`);
  }
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP185_ROUTE) || text.includes("tradingLabDbHistoryMigrationReviewDetails")) {
      fail(`Step185 must not expose migration review UI in public/mypage surface: ${filePath}`);
    }
  }
}

function assertNoForbiddenArtifactsOrRegression() {
  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden artifact exists: ${forbiddenPath}`);
  }
  const forbiddenMigrationFiles = [
    ...(fs.existsSync("supabase/migrations") ? fs.readdirSync("supabase/migrations").filter((name) => name.includes("mock_trading")) : []),
    ...(fs.existsSync("migrations") ? fs.readdirSync("migrations").filter((name) => name.includes("mock_trading")) : []),
  ];
  if (forbiddenMigrationFiles.length > 0) fail(`forbidden migration files exist: ${forbiddenMigrationFiles.join(", ")}`);
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("db-backed-mock-trading-history-migration-review") || text.includes("tradingLabDbHistoryMigrationReview")) {
      fail(`Step185 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
    "check:trading-step184-db-backed-mock-trading-history-migration-preflight",
    "check:trading-step183-db-backed-mock-trading-history-review-result-recording-gate",
    "check:trading-step182-db-backed-mock-trading-history-preflight",
    "check:trading-step181-render-api-direct-connectivity-reliability",
    "check:trading-step180-render-api-health-and-deployment-metadata",
    "check:trading-step179-legacy-trading-check-runner-heavy-service-audit",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertStep185ScriptExists(packageJson);
  assertServiceModelAndSafetyBoundaries();
  assertAdminOnlyRouteAndClient();
  assertAdminTradingUiOnly();
  assertNoForbiddenArtifactsOrRegression();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate] ok");
}

main();

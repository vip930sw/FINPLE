const fs = require("node:fs");

const STEP184_SCRIPT = "check:trading-step184-db-backed-mock-trading-history-migration-preflight";
const STEP184_ROUTE = "trading-lab-db-backed-mock-trading-history-migration-preflight";
const STEP183_ROUTE = "trading-lab-db-backed-mock-trading-history-review-result";

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingDbBackedMockTradingHistoryMigrationPreflight.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step184-db-backed-mock-trading-history-migration-preflight.cjs",
  "scripts/check-trading-step184-db-backed-mock-trading-history-migration-preflight.test.cjs",
  "scripts/check-trading-step183-db-backed-mock-trading-history-review-result-recording-gate.cjs",
  "scripts/check-trading-step182-db-backed-mock-trading-history-preflight.cjs",
  "scripts/check-trading-step181-render-api-direct-connectivity-reliability.cjs",
  "scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs",
  "scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SERVICE_SNIPPETS = [
  "STEP184_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_PREFLIGHT_FLAGS",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_PREFLIGHT_MODEL",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_CANDIDATE_TABLE_DRAFT",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_INDEX_CONSTRAINT_RLS_DRAFT",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_PREFLIGHT_READINESS_CHECKLIST",
  "validateDbBackedMockTradingHistoryMigrationPreflight",
  "buildDbBackedMockTradingHistoryMigrationPreflight",
  "buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus",
  "mock_trading_strategy_presets",
  "mock_trading_runs",
  "mock_trading_order_summaries",
  "mock_trading_fill_summaries",
  "mock_trading_ledger_snapshots",
  "mock_trading_performance_snapshots",
  "mock_trading_allocation_snapshots",
  "mock_trading_risk_snapshots",
  "admin_only_mock_history_select",
  "db_backed_mock_trading_history_migration_review_result",
  "migrationMode: \"draft_only\"",
  "ddlDraftStatus: \"draft_only\"",
  "schemaChangeStatus: \"blocked\"",
  "dbWriteStatus: \"blocked\"",
  "supabaseMutationStatus: \"blocked\"",
  "migrationFileCreated: false",
  "sqlFileCreated: false",
  "supabaseMigrationCreated: false",
  "dbSchemaChanged: false",
  "persistentDbWriteAttempted: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "actualTradingRunCreated: false",
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

function assertStep184ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP184_SCRIPT];
  if (!script) fail(`${STEP184_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step184-db-backed-mock-trading-history-migration-preflight.cjs",
    "server/src/services/tradingDbBackedMockTradingHistoryMigrationPreflight.test.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
  ]) {
    if (!script.includes(snippet)) fail(`Step184 npm check missing ${snippet}`);
  }
}

function assertServiceModelAndSafetyBoundaries() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  for (const snippet of REQUIRED_SERVICE_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`Step184 service missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SERVICE_SNIPPETS) {
    if (serviceText.includes(snippet)) fail(`Step184 service contains forbidden snippet: ${snippet}`);
  }
}

function assertAdminOnlyRouteAndClient() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  const routeIndex = routeText.indexOf(`router.get("/${STEP184_ROUTE}"`);
  if (routeIndex < 0) fail("Step184 admin-only route missing");
  const guardedSnippet = routeText.slice(Math.max(0, routeIndex - 240), routeIndex + 360);
  if (!guardedSnippet.includes("requireAdminAccess")) fail("Step184 route must be guarded by requireAdminAccess");
  if (!guardedSnippet.includes("buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus")) {
    fail("Step184 route must return the migration preflight status builder");
  }
  if (!clientText.includes(`"/admin/trading-readiness/${STEP184_ROUTE}"`)) fail("Step184 frontend client path missing");
  if (!clientText.includes("fetchAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus")) fail("Step184 client function missing");
  if (!routeText.includes(`router.get("/${STEP183_ROUTE}"`)) fail("Step183 review route must remain present");
}

function assertAdminTradingUiOnly() {
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");
  for (const snippet of [
    "trading-lab-db-backed-mock-trading-history-migration-preflight",
    "tradingLabDbHistoryMigrationPreflightSummary",
    "DB 저장형 mock trading history migration 사전검토",
    "실제 DB schema를 변경하지 않습니다",
    "SQL migration 파일은 아직 생성하지 않았고",
    "Migration 후보 table 검토",
    "DDL draft 검토",
    "DB migration blocked confirmation",
  ]) {
    if (!panelText.includes(snippet)) fail(`Step184 admin panel missing ${snippet}`);
  }
  for (const snippet of [
    ".tradingLabDbHistoryMigrationPreflightSummary",
    ".tradingLabDbHistoryMigrationStatusGrid",
    ".tradingLabDbHistoryMigrationLists",
    ".tradingLabDbHistoryMigrationNotice",
  ]) {
    if (!cssText.includes(snippet)) fail(`Step184 CSS missing ${snippet}`);
  }
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP184_ROUTE) || text.includes("tradingLabDbHistoryMigrationPreflightSummary")) {
      fail(`Step184 must not expose migration preflight UI in public/mypage surface: ${filePath}`);
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
    if (text.includes("db-backed-mock-trading-history-migration") || text.includes("tradingLabDbHistoryMigration")) {
      fail(`Step184 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
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
  assertStep184ScriptExists(packageJson);
  assertServiceModelAndSafetyBoundaries();
  assertAdminOnlyRouteAndClient();
  assertAdminTradingUiOnly();
  assertNoForbiddenArtifactsOrRegression();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step184-db-backed-mock-trading-history-migration-preflight] ok");
}

main();

const fs = require("node:fs");

const STEP187_SCRIPT = "check:trading-step187-mock-trading-history-supabase-schema-draft";
const STEP187_PANEL_KEY = "mock-trading-history-supabase-schema-draft";
const STEP187_MODULE = "server/src/services/tradingMockHistorySupabaseSchemaDraft.js";

const REQUIRED_FILES = [
  STEP187_MODULE,
  "server/src/services/tradingMockHistorySupabaseSchemaDraft.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step187-mock-trading-history-supabase-schema-draft.cjs",
  "scripts/check-trading-step187-mock-trading-history-supabase-schema-draft.test.cjs",
  "scripts/check-trading-step186-mock-trading-history-persistence-architecture.cjs",
];

const REQUIRED_MODULE_SNIPPETS = [
  "STEP187_MOCK_TRADING_HISTORY_SUPABASE_SCHEMA_DRAFT_FLAGS",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_SCHEMA_DRAFT_MODEL",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_RELATIONSHIP_DRAFTS",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_INDEX_DRAFTS",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_CONSTRAINT_DRAFTS",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_RLS_POLICY_DRAFTS",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_RETENTION_POLICIES",
  "TRADING_LAB_MOCK_HISTORY_SUPABASE_MIGRATION_SEQUENCE",
  "TRADING_LAB_MOCK_HISTORY_BROWSER_QUERY_CONTRACT",
  "TRADING_LAB_MOCK_HISTORY_COMPARE_QUERY_CONTRACT",
  "TRADING_LAB_MOCK_HISTORY_RESTORE_QUERY_CONTRACT",
  "validateMockHistorySupabaseSchemaDraft",
  "buildMockHistorySupabaseSchemaDraft",
  "buildAdminTradingLabMockHistorySupabaseSchemaDraftStatus",
  "mock_trading_strategy_presets",
  "mock_trading_strategy_versions",
  "mock_trading_runs",
  "mock_trading_order_summaries",
  "mock_trading_fill_summaries",
  "mock_trading_ledger_snapshots",
  "mock_trading_performance_snapshots",
  "mock_trading_allocation_snapshots",
  "mock_trading_risk_snapshots",
  "admin_mock_history_select",
  "public_access_denied",
  "mypage_access_denied",
  "cursor",
  "mock_trading_history_browser_ui",
  "sqlFileCreated: false",
  "migrationFileCreated: false",
  "dbSchemaChanged: false",
  "persistentDbWriteAttempted: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
];

const REQUIRED_SHELL_SNIPPETS = [
  "tradingMockHistorySupabaseSchemaDraft.js",
  "buildAdminTradingLabMockHistorySupabaseSchemaDraftStatus",
  "mockTradingHistorySupabaseSchemaDraftStatus",
  "mockTradingHistorySupabaseSchemaDraftModel",
];

const REQUIRED_PANEL_SNIPPETS = [
  STEP187_PANEL_KEY,
  "Mock trading history Supabase schema draft",
  "table drafts",
  "relationships / indexes",
  "browser / compare / restore contract",
  "migration sequencing draft",
  "RLS / retention / blockers",
  "It does not create SQL files, migration files, DB schema changes, Supabase mutations, or persistent DB writes.",
];

const FORBIDDEN_SNIPPETS = [
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
  "migrationFileCreated: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "networkCallAttempted: true",
  "tokenIssuanceAttempted: true",
  "quoteRequestAttempted: true",
  "orderSubmissionAttempted: true",
  "liveTradingRunCreated: true",
  "liveAccountBalanceQueried: true",
  "CREATE TABLE",
  "ALTER TABLE",
  "CREATE INDEX",
  "CREATE POLICY",
  "INSERT INTO",
  "UPDATE ",
  "DELETE FROM",
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

function assertPackageScript(packageJson) {
  const script = packageJson.scripts?.[STEP187_SCRIPT];
  if (!script) fail(`${STEP187_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step187-mock-trading-history-supabase-schema-draft.cjs",
    "server/src/services/tradingMockHistorySupabaseSchemaDraft.test.js",
    "scripts/check-trading-step187-mock-trading-history-supabase-schema-draft.test.cjs",
    "scripts/check-trading-step186-mock-trading-history-persistence-architecture.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step187 npm check missing ${snippet}`);
  }
}

function assertSchemaDraftModule() {
  const moduleText = readText(STEP187_MODULE);
  for (const snippet of REQUIRED_MODULE_SNIPPETS) {
    if (!moduleText.includes(snippet)) fail(`Step187 module missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (moduleText.includes(snippet)) fail(`Step187 module contains forbidden snippet: ${snippet}`);
  }
}

function assertDashboardShellAndUi() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");
  for (const snippet of REQUIRED_SHELL_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`dashboard shell missing ${snippet}`);
  }
  for (const snippet of REQUIRED_PANEL_SNIPPETS) {
    if (!panelText.includes(snippet)) fail(`admin panel missing ${snippet}`);
  }
  if (!cssText.includes(".tradingLabPersistenceArchitectureDetails")) fail("shared collapsed detail CSS missing");

  for (const snippet of [
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
    "dbWriteUsed: true",
    "persistentStorageUsed: true",
  ]) {
    if (serviceText.includes(snippet)) fail(`dashboard shell contains forbidden open gate: ${snippet}`);
  }
}

function assertNoEndpointAdded() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (routeText.includes(STEP187_PANEL_KEY) || routeText.includes("MockHistorySupabaseSchemaDraft")) {
    fail("Step187 must not add a runtime endpoint");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only GET endpoints");
}

function assertNoPublicExposureOrForbiddenArtifacts() {
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP187_PANEL_KEY) || text.includes("Mock trading history Supabase schema draft")) {
      fail(`Step187 must not expose schema draft UI in public/mypage surface: ${filePath}`);
    }
  }

  if (fs.existsSync("data/processed/scenario_monthly_returns.csv")) fail("scenario_monthly_returns.csv must not exist");
  for (const migrationDir of ["supabase/migrations", "migrations", "db/migrations"]) {
    if (!fs.existsSync(migrationDir)) continue;
    const forbidden = fs.readdirSync(migrationDir).filter((name) => name.includes("mock_trading") || name.includes("trading_history"));
    if (forbidden.length > 0) fail(`forbidden migration artifact exists in ${migrationDir}: ${forbidden.join(", ")}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("mockTradingHistorySupabase") || text.includes("Supabase schema draft")) {
      fail(`Step187 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
    "check:trading-step186-mock-trading-history-persistence-architecture",
    "check:trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate",
    "check:trading-step184-db-backed-mock-trading-history-migration-preflight",
    "check:trading-step183-db-backed-mock-trading-history-review-result-recording-gate",
    "check:trading-step182-db-backed-mock-trading-history-preflight",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertPackageScript(packageJson);
  assertSchemaDraftModule();
  assertDashboardShellAndUi();
  assertNoEndpointAdded();
  assertNoPublicExposureOrForbiddenArtifacts();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step187-mock-trading-history-supabase-schema-draft] ok");
}

main();

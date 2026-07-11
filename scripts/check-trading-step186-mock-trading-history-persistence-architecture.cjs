const fs = require("node:fs");

const STEP186_SCRIPT = "check:trading-step186-mock-trading-history-persistence-architecture";
const STEP186_PANEL_KEY = "mock-trading-history-persistence-architecture";
const STEP185_ROUTE = "trading-lab-db-backed-mock-trading-history-migration-review-result";

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingMockTradingHistoryPersistenceArchitecture.test.js",
  "server/src/services/tradingDbBackedMockTradingHistoryMigrationReviewResult.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step186-mock-trading-history-persistence-architecture.cjs",
  "scripts/check-trading-step186-mock-trading-history-persistence-architecture.test.cjs",
  "scripts/check-trading-step185-db-backed-mock-trading-history-migration-review-result-recording-gate.cjs",
];

const REQUIRED_SERVICE_SNIPPETS = [
  "STEP186_MOCK_TRADING_HISTORY_PERSISTENCE_ARCHITECTURE_FLAGS",
  "TRADING_LAB_MOCK_TRADING_HISTORY_PERSISTENCE_ARCHITECTURE_MODEL",
  "TRADING_LAB_MOCK_TRADING_HISTORY_PERSISTENCE_STORAGE_DOMAINS",
  "TRADING_LAB_MOCK_TRADING_HISTORY_ENTITY_RELATIONSHIP_ARCHITECTURE",
  "TRADING_LAB_MOCK_TRADING_HISTORY_SNAPSHOT_VERSIONING_STRATEGY",
  "TRADING_LAB_MOCK_TRADING_HISTORY_LIFECYCLE_ARCHITECTURE",
  "TRADING_LAB_MOCK_TRADING_HISTORY_BROWSER_COMPARE_RESTORE_CONTRACT",
  "TRADING_LAB_MOCK_TRADING_HISTORY_RETENTION_REDACTION_POLICY",
  "TRADING_LAB_MOCK_TRADING_HISTORY_PERSISTENCE_IMPLEMENTATION_CONTRACTS",
  "validateMockTradingHistoryPersistenceArchitecture",
  "buildMockTradingHistoryPersistenceArchitecture",
  "buildAdminTradingLabMockTradingHistoryPersistenceArchitectureStatus",
  "strategy_preset",
  "mock_trading_run",
  "mock_order_fill_summaries",
  "ledger_snapshots",
  "performance_snapshots",
  "allocation_and_risk_snapshots",
  "StrategyPreset",
  "StrategyVersion",
  "MockTradingRun",
  "MockOrderSummary",
  "MockFillSummary",
  "LedgerSnapshot",
  "PerformanceSnapshot",
  "AllocationSnapshot",
  "RiskSnapshot",
  "db_backed_mock_trading_history_sql_draft_preflight",
  "Step 187",
  "Step 188",
  "Step 189",
  "Step 190",
  "architecture_only",
  "persistentDbWriteAttempted: false",
  "dbMigrationCreated: false",
  "dbSchemaChanged: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
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
  "CREATE POLICY",
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

function assertStep186ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP186_SCRIPT];
  if (!script) fail(`${STEP186_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step186-mock-trading-history-persistence-architecture.cjs",
    "server/src/services/tradingMockTradingHistoryPersistenceArchitecture.test.js",
    "scripts/check-trading-step186-mock-trading-history-persistence-architecture.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step186 npm check missing ${snippet}`);
  }
}

function assertServiceModelAndSafetyBoundaries() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  for (const snippet of REQUIRED_SERVICE_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`Step186 service missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SERVICE_SNIPPETS) {
    if (serviceText.includes(snippet)) fail(`Step186 service contains forbidden snippet: ${snippet}`);
  }
}

function assertNoNewRuntimeRoute() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (!routeText.includes(`router.get("/${STEP185_ROUTE}"`)) fail("Step185 route must remain present");
  if (routeText.includes(STEP186_PANEL_KEY)) fail("Step186 must not add a new runtime route");
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only");
}

function assertAdminTradingUiOnly() {
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");
  for (const snippet of [
    STEP186_PANEL_KEY,
    "tradingLabPersistenceArchitectureDetails",
    "Mock trading history persistence architecture",
    "저장 도메인 구조",
    "entity relationship",
    "Step187-190 구현 계약",
    "architecture only",
    "SQL 파일, migration 파일, DB schema 변경, Supabase mutation, persistent DB write는 수행하지 않습니다",
  ]) {
    if (!panelText.includes(snippet)) fail(`Step186 admin panel missing ${snippet}`);
  }
  for (const snippet of [
    ".tradingLabPersistenceArchitectureDetails",
    ".tradingLabPersistenceArchitectureStatusGrid",
    ".tradingLabPersistenceArchitectureLists",
    ".tradingLabPersistenceArchitectureNotice",
  ]) {
    if (!cssText.includes(snippet)) fail(`Step186 CSS missing ${snippet}`);
  }
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP186_PANEL_KEY) || text.includes("tradingLabPersistenceArchitectureDetails")) {
      fail(`Step186 must not expose persistence architecture UI in public/mypage surface: ${filePath}`);
    }
  }
}

function assertNoForbiddenArtifactsOrRegression() {
  if (fs.existsSync("data/processed/scenario_monthly_returns.csv")) fail("scenario_monthly_returns.csv must not exist");
  const migrationDirs = ["supabase/migrations", "migrations", "db/migrations"];
  for (const migrationDir of migrationDirs) {
    if (!fs.existsSync(migrationDir)) continue;
    const forbidden = fs.readdirSync(migrationDir).filter((name) => name.includes("mock_trading") || name.includes("trading_history"));
    if (forbidden.length > 0) fail(`forbidden migration artifact exists in ${migrationDir}: ${forbidden.join(", ")}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("persistence architecture") || text.includes("mockTradingHistoryPersistence")) {
      fail(`Step186 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
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
  assertStep186ScriptExists(packageJson);
  assertServiceModelAndSafetyBoundaries();
  assertNoNewRuntimeRoute();
  assertAdminTradingUiOnly();
  assertNoForbiddenArtifactsOrRegression();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step186-mock-trading-history-persistence-architecture] ok");
}

main();

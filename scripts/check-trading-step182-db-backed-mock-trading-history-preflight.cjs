const fs = require("node:fs");

const STEP182_SCRIPT = "check:trading-step182-db-backed-mock-trading-history-preflight";
const STEP182_ROUTE = "trading-lab-db-backed-mock-trading-history-preflight";

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingDbBackedMockTradingHistoryPreflight.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step182-db-backed-mock-trading-history-preflight.cjs",
  "scripts/check-trading-step182-db-backed-mock-trading-history-preflight.test.cjs",
  "scripts/check-trading-step181-render-api-direct-connectivity-reliability.cjs",
  "scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs",
  "scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs",
  "scripts/check-trading-step176-admin-trading-safety-assessment-layout-polish.cjs",
  "scripts/check-trading-step175-admin-trading-lab-mvp-final-review.cjs",
];

const REQUIRED_SERVICE_SNIPPETS = [
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_PREFLIGHT_MODEL",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_CANDIDATE_TABLE_SCHEMA_DRAFT",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_STORAGE_BOUNDARY_SUMMARY",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_REDACTION_POLICY_SUMMARY",
  "TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_READINESS_CHECKLIST",
  "buildDbBackedMockTradingHistoryPreflight",
  "buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus",
  "strategy_preset",
  "mock_trading_run_summary",
  "mock_order_summary",
  "mock_fill_summary",
  "mock_portfolio_ledger_snapshot",
  "mock_performance_snapshot",
  "allocation_snapshot",
  "risk_metric_snapshot",
  "dbWriteBlockedConfirmation",
  "dbMigrationAllowed: false",
  "persistentDbWriteAllowed: false",
  "supabaseInsertAllowed: false",
  "supabaseUpdateAllowed: false",
  "supabaseDeleteAllowed: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "readyForLiveGuardedTrading: false",
];

const REQUIRED_FORBIDDEN_VALUE_SNIPPETS = [
  "actual_account_number",
  "kis_token",
  "credential",
  "provider_raw_response",
  "order_payload",
  "actual_order_id",
  "actual_fill_id",
  "actual_execution_id",
  "actual_account_balance",
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

const FORBIDDEN_SOURCE_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbWriteUsed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "persistentStorageUsed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbMigrationCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbSchemaChanged: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "supabaseInsertAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "supabaseUpdateAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "supabaseDeleteAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "networkCallAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "tokenIssuanceAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "quoteRequestAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualTradingRunCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountBalanceQueried: true"],
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

function assertStep182ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP182_SCRIPT];
  if (!script) fail(`${STEP182_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step182-db-backed-mock-trading-history-preflight.cjs",
    "server/src/services/tradingDbBackedMockTradingHistoryPreflight.test.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
  ]) {
    if (!script.includes(snippet)) fail(`Step182 npm check missing ${snippet}`);
  }
}

function assertServiceModelAndSafetyBoundaries() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  for (const snippet of REQUIRED_SERVICE_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`Step182 service missing ${snippet}`);
  }
  for (const snippet of REQUIRED_FORBIDDEN_VALUE_SNIPPETS) {
    if (!serviceText.includes(snippet)) fail(`Step182 redaction policy missing forbidden value ${snippet}`);
  }
}

function assertAdminOnlyRouteAndClient() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  const routeIndex = routeText.indexOf(`router.get("/${STEP182_ROUTE}"`);
  if (routeIndex < 0) fail("Step182 admin-only route missing");
  const guardedSnippet = routeText.slice(Math.max(0, routeIndex - 240), routeIndex + 340);
  if (!guardedSnippet.includes("requireAdminAccess")) fail("Step182 route must be guarded by requireAdminAccess");
  if (!guardedSnippet.includes("buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus")) fail("Step182 route must return the preflight status builder");
  if (!clientText.includes(`"/admin/trading-readiness/${STEP182_ROUTE}"`)) fail("Step182 frontend client path missing");
  if (!clientText.includes("fetchAdminTradingLabDbBackedMockTradingHistoryPreflightStatus")) fail("Step182 client function missing");
}

function assertAdminTradingUiOnly() {
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");
  for (const snippet of [
    "trading-lab-db-backed-mock-trading-history-preflight",
    "tradingLabDbHistoryPreflightSummary",
    "DB-backed mock trading history 사전검토",
    "저장 후보 schema draft",
    "저장 금지 항목",
    "DB write blocked confirmation",
    "persistent DB write를 수행하지 않습니다",
  ]) {
    if (!panelText.includes(snippet)) fail(`Step182 admin panel missing ${snippet}`);
  }
  for (const snippet of [
    ".tradingLabDbHistoryPreflightSummary",
    ".tradingLabDbHistoryStatusGrid",
    ".tradingLabDbHistoryLists",
    ".tradingLabDbHistoryNotice",
  ]) {
    if (!cssText.includes(snippet)) fail(`Step182 CSS missing ${snippet}`);
  }
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP182_ROUTE) || text.includes("tradingLabDbHistoryPreflightSummary")) {
      fail(`Step182 must not expose DB-backed mock history UI in public/mypage surface: ${filePath}`);
    }
  }
}

function assertNoForbiddenArtifactsOrRegression() {
  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden artifact exists: ${forbiddenPath}`);
  }
  for (const [filePath, snippet] of FORBIDDEN_SOURCE_SNIPPETS) {
    const text = readText(filePath);
    if (text.includes(snippet)) fail(`${filePath} contains forbidden snippet: ${snippet}`);
  }
  for (const filePath of SCENARIO_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("db-backed-mock-trading-history") || text.includes("tradingLabDbHistory")) {
      fail(`Step182 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
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
  assertStep182ScriptExists(packageJson);
  assertServiceModelAndSafetyBoundaries();
  assertAdminOnlyRouteAndClient();
  assertAdminTradingUiOnly();
  assertNoForbiddenArtifactsOrRegression();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step182-db-backed-mock-trading-history-preflight] ok");
}

main();

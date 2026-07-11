const fs = require("node:fs");

const STEP190_SCRIPT = "check:trading-step190-mock-strategy-restore-candidate";
const STEP190_PANEL_KEY = "mock-strategy-restore-candidate";
const STEP190_MODULE = "server/src/services/tradingMockStrategyRestoreCandidate.js";

const REQUIRED_FILES = [
  STEP190_MODULE,
  "server/src/services/tradingMockStrategyRestoreCandidate.test.js",
  "server/src/services/tradingMockHistoryCompare.js",
  "server/src/services/tradingMockHistoryBrowser.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "package.json",
  "scripts/check-trading-step190-mock-strategy-restore-candidate.cjs",
  "scripts/check-trading-step190-mock-strategy-restore-candidate.test.cjs",
  "scripts/check-trading-step189-mock-trading-history-compare-ui.cjs",
];

const REQUIRED_MODULE_SNIPPETS = [
  "STEP190_MOCK_STRATEGY_RESTORE_CANDIDATE_FLAGS",
  "TRADING_LAB_MOCK_STRATEGY_RESTORE_CANDIDATE_MODEL",
  "buildMockStrategyRestoreCandidate",
  "buildAdminTradingLabMockStrategyRestoreCandidateStatus",
  "restoreEligibility",
  "restorationStatus",
  "targetDraftPreview",
  "copiedFields",
  "excludedFields",
  "transformedFields",
  "validationWarnings",
  "validationBlockers",
  "lineage",
  "immutableSourceConfirmed",
  "strategy_draft_editor_candidate",
  "dbReadStatus: \"blocked\"",
  "dbWriteStatus: \"blocked\"",
  "supabaseMutationStatus: \"blocked\"",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
];

const REQUIRED_PANEL_SNIPPETS = [
  STEP190_PANEL_KEY,
  "Mock strategy restore candidate",
  "복원은 과거 실행 기록을 수정하지 않습니다.",
  "buildMockStrategyRestoreCandidateUiModel",
  "tradingLabStrategyRestoreStatusGrid",
  "tradingLabStrategyRestoreSourcePicker",
  "tradingLabStrategyRestorePreviewGrid",
  "copied fields",
  "excluded fields",
  "transformed fields",
  "target allocation",
  "restore action 없음",
  "DB 저장은 다음 단계에서 검토",
];

const REQUIRED_CSS_SNIPPETS = [
  ".tradingLabStrategyRestoreDetails",
  ".tradingLabStrategyRestoreStatusGrid",
  ".tradingLabStrategyRestoreSourcePicker",
  ".tradingLabStrategyRestorePreviewGrid",
  ".tradingLabStrategyRestoreLists",
  ".tradingLabStrategyRestoreNotice",
];

const FORBIDDEN_SNIPPETS = [
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "dbWriteUsed: true",
  "persistentStorageUsed: true",
  "supabaseSelectAttempted: true",
  "supabaseInsertAttempted: true",
  "supabaseUpdateAttempted: true",
  "supabaseDeleteAttempted: true",
  "networkCallAttempted: true",
  "tokenIssuanceAttempted: true",
  "quoteRequestAttempted: true",
  "orderSubmissionAttempted: true",
  "liveTradingRunCreated: true",
  "liveAccountBalanceQueried: true",
  "sourceRunMutated: true",
  "sourceStrategyVersionMutated: true",
  "restoreActionCreated: true",
  "createClient(",
  ".from(",
  ".select(",
  ".insert(",
  ".update(",
  ".delete(",
];

const FORBIDDEN_UI_SHELL_SNIPPETS = FORBIDDEN_SNIPPETS.filter((snippet) => ![
  ".from(",
  ".select(",
  ".insert(",
  ".update(",
  ".delete(",
].includes(snippet));

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
  const script = packageJson.scripts?.[STEP190_SCRIPT];
  if (!script) fail(`${STEP190_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step190-mock-strategy-restore-candidate.cjs",
    "server/src/services/tradingMockStrategyRestoreCandidate.test.js",
    "scripts/check-trading-step190-mock-strategy-restore-candidate.test.cjs",
    "scripts/check-trading-step189-mock-trading-history-compare-ui.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step190 npm check missing ${snippet}`);
  }
}

function assertRestoreModule() {
  const moduleText = readText(STEP190_MODULE);
  for (const snippet of REQUIRED_MODULE_SNIPPETS) {
    if (!moduleText.includes(snippet)) fail(`Step190 module missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (moduleText.includes(snippet)) fail(`Step190 module contains forbidden snippet: ${snippet}`);
  }
}

function assertDashboardShellAndUi() {
  const serviceText = readText("server/src/services/tradingAdminLabDashboardShell.js");
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const cssText = readText("src/App.css");

  for (const snippet of ["tradingMockStrategyRestoreCandidate.js", "buildAdminTradingLabMockStrategyRestoreCandidateStatus", "mockStrategyRestoreCandidateStatus", "mockStrategyRestoreCandidateModel"]) {
    if (!serviceText.includes(snippet)) fail(`dashboard shell missing ${snippet}`);
  }
  for (const snippet of REQUIRED_PANEL_SNIPPETS) {
    if (!panelText.includes(snippet)) fail(`admin panel missing ${snippet}`);
  }
  for (const snippet of REQUIRED_CSS_SNIPPETS) {
    if (!cssText.includes(snippet)) fail(`CSS missing ${snippet}`);
  }
  for (const snippet of FORBIDDEN_UI_SHELL_SNIPPETS) {
    if (serviceText.includes(snippet) || panelText.includes(snippet)) fail(`Step190 UI/shell contains forbidden snippet: ${snippet}`);
  }
}

function assertNoEndpointAdded() {
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  if (routeText.includes(STEP190_PANEL_KEY) || routeText.includes("MockStrategyRestoreCandidate")) {
    fail("Step190 must not add a runtime endpoint");
  }
  if (/router\.(post|put|patch|delete)\(/.test(routeText)) fail("admin trading readiness routes must remain read-only GET endpoints");
}

function assertNoPublicExposureOrForbiddenArtifacts() {
  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes(STEP190_PANEL_KEY) || text.includes("Mock strategy restore candidate")) {
      fail(`Step190 must not expose restore UI in public/mypage surface: ${filePath}`);
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
    if (text.includes("mockStrategyRestore") || text.includes("Mock strategy restore candidate")) {
      fail(`Step190 must not touch scenario runtime/API/chart calculation: ${filePath}`);
    }
  }
}

function assertPreviousChecksPreserved(packageJson) {
  for (const scriptName of [
    "check:trading-step189-mock-trading-history-compare-ui",
    "check:trading-step188-mock-trading-history-browser-ui",
    "check:trading-step187-mock-trading-history-supabase-schema-draft",
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
  assertRestoreModule();
  assertDashboardShellAndUi();
  assertNoEndpointAdded();
  assertNoPublicExposureOrForbiddenArtifacts();
  assertPreviousChecksPreserved(packageJson);

  console.log("[check-trading-step190-mock-strategy-restore-candidate] ok");
}

main();

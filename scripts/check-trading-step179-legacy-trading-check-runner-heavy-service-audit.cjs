const fs = require("node:fs");

const STEP179_SCRIPT = "check:trading-step179-legacy-trading-check-runner-heavy-service-audit";
const STEP179_CHECKER_FILE = "scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs";
const HEAVY_SERVICE_TEST = "server/src/services/tradingAdminLabDashboardShell.test.js";
const HEAVY_SERVICE_TEST_NORMALIZED = HEAVY_SERVICE_TEST.replaceAll("\\", "/");
const TRADING_STEP_SCRIPT_PREFIX = "check:trading-step";

const REQUIRED_CLEANUP_SCRIPTS = [
  "check:trading-step167-admin-trading-lab-dashboard-ux-polish-preflight",
  "check:trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate",
  "check:trading-step169-admin-trading-lab-dashboard-ux-polish-core",
  "check:trading-step170-admin-trading-lab-dashboard-section-consolidation",
  "check:trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish",
  "check:trading-step172-admin-trading-lab-smoke-preflight-review-result",
  "check:trading-step177-legacy-trading-check-runner-cleanup",
  "check:trading-step178-remaining-legacy-trading-check-runner-cleanup",
];

const EXPECTED_STILL_FOCUSED_CHECKS = [
  "scripts/check-step166-account-plan-mbti.test.mjs",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
];

const CHECK_FILES_GLOB_HINT = "scripts/check-trading-step";

const ALLOWED_BOUNDED_PROCESS_FILES = [
  "scripts/check-trading-step177-legacy-trading-check-runner-cleanup.cjs",
  "scripts/check-trading-step178-remaining-legacy-trading-check-runner-cleanup.cjs",
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
  ["server/src/services/tradingAdminLabDashboardShell.js", "networkCallAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "tokenIssuanceAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "quoteRequestAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAttempted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dbWriteUsed: true"],
];

const PUBLIC_OR_RUNTIME_SURFACES = [
  "src/App.jsx",
  "src/components/AccountPages.jsx",
  "src/components/mypage/MyPageRoute.jsx",
  "src/components/mypage/MyPageSidebar.jsx",
  "src/components/mypage/MyPageLayout.jsx",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "server/src/routes/scenarioRoutes.js",
  "server/src/services/scenarioRuntime.js",
];

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return fs.readFileSync(filePath, "utf8");
}

function listCheckFiles() {
  const entries = fs.readdirSync("scripts", { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => `scripts/${entry.name}`)
    .filter((filePath) => /^scripts\/check-trading-step.*\.cjs$/.test(filePath));
}

function normalizeSlash(value) {
  return value.replaceAll("\\", "/");
}

function assertNoHeavyServiceRunnerInPackage(packageJson) {
  const offenders = [];
  for (const [scriptName, command] of Object.entries(packageJson.scripts || {})) {
    if (!scriptName.startsWith(TRADING_STEP_SCRIPT_PREFIX)) continue;
    if (normalizeSlash(command).includes(HEAVY_SERVICE_TEST_NORMALIZED)) offenders.push(scriptName);
  }
  if (offenders.length > 0) {
    fail(`heavy service test must not be directly invoked by trading step npm checks: ${offenders.join(", ")}`);
  }
}

function assertStep179ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP179_SCRIPT];
  if (!script) fail(`${STEP179_SCRIPT} script missing`);
  if (!script.includes("scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs")) {
    fail("Step179 npm check must run the Step179 checker");
  }
  if (!script.includes("scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.test.cjs")) {
    fail("Step179 npm check must run the Step179 regression test");
  }
}

function assertCleanupChainStillWired(packageJson) {
  for (const scriptName of REQUIRED_CLEANUP_SCRIPTS) {
    const command = packageJson.scripts?.[scriptName];
    if (!command) fail(`${scriptName} script missing`);
    if (normalizeSlash(command).includes(HEAVY_SERVICE_TEST_NORMALIZED)) {
      fail(`${scriptName} regressed to direct heavy service test usage`);
    }
  }

  for (const scriptName of REQUIRED_CLEANUP_SCRIPTS.slice(0, 6)) {
    const command = packageJson.scripts[scriptName];
    for (const focusedCheck of EXPECTED_STILL_FOCUSED_CHECKS) {
      if (!command.includes(focusedCheck)) fail(`${scriptName} missing focused regression: ${focusedCheck}`);
    }
  }
}

function assertNoUnboundedProcessPatterns() {
  const disallowedPatterns = [
    "child_process.exec",
    "exec(",
    "spawn(",
    "execSync(",
    "setInterval(",
    "--watch",
    "watch: true",
    "listen(",
    "createServer(",
  ];
  const offenders = [];
  for (const filePath of listCheckFiles()) {
    if (filePath === STEP179_CHECKER_FILE) continue;
    const text = readText(filePath);
    const isAllowedBounded = ALLOWED_BOUNDED_PROCESS_FILES.includes(filePath);
    for (const pattern of disallowedPatterns) {
      if (text.includes(pattern)) offenders.push(`${filePath}:${pattern}`);
    }
    if (text.includes("spawnSync(") && !text.includes("timeout:")) {
      offenders.push(`${filePath}:spawnSync without timeout`);
    }
  }
  if (offenders.length > 0) fail(`unbounded check runner patterns found: ${offenders.join(", ")}`);
}

function assertNoForbiddenRuntimeArtifacts() {
  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden runtime artifact exists: ${forbiddenPath}`);
  }
  for (const [filePath, snippet] of FORBIDDEN_SOURCE_SNIPPETS) {
    if (fs.existsSync(filePath) && readText(filePath).includes(snippet)) {
      fail(`${filePath} contains forbidden snippet: ${snippet}`);
    }
  }
}

function assertNoStep179UiEndpointOrRuntimeSurface() {
  const forbidden = [
    "legacy-trading-check-runner-heavy-service-audit",
    "fetchAdminTradingLegacyCheckRunnerHeavyServiceAudit",
    "buildAdminTradingLegacyCheckRunnerHeavyServiceAudit",
  ];
  for (const filePath of PUBLIC_OR_RUNTIME_SURFACES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    for (const snippet of forbidden) {
      if (text.includes(snippet)) fail(`Step179 must not touch UI/endpoint/runtime surface: ${filePath}`);
    }
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertStep179ScriptExists(packageJson);
  assertNoHeavyServiceRunnerInPackage(packageJson);
  assertCleanupChainStillWired(packageJson);
  assertNoUnboundedProcessPatterns();
  assertNoForbiddenRuntimeArtifacts();
  assertNoStep179UiEndpointOrRuntimeSurface();

  console.log("[check-trading-step179-legacy-trading-check-runner-heavy-service-audit] ok");
}

main();

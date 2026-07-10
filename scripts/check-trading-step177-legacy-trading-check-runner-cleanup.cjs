const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const STEP172_SCRIPT = "check:trading-step172-admin-trading-lab-smoke-preflight-review-result";
const STEP177_SCRIPT = "check:trading-step177-legacy-trading-check-runner-cleanup";
const HEAVY_SERVICE_TEST = "server/src/services/tradingAdminLabDashboardShell.test.js";
const REQUIRED_STEP172_TESTS = [
  "scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.test.cjs",
  "scripts/check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish.test.cjs",
  "scripts/check-trading-step170-admin-trading-lab-dashboard-section-consolidation.test.cjs",
  "scripts/check-trading-step169-admin-trading-lab-dashboard-ux-polish-core.test.cjs",
  "scripts/check-trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step167-admin-trading-lab-dashboard-ux-polish-preflight.test.cjs",
  "scripts/check-trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step164-admin-trading-lab-mock-dashboard-cleanup-core.test.cjs",
  "scripts/check-trading-step163-admin-trading-lab-mock-dashboard-cleanup-review-result-recording-gate.test.cjs",
  "scripts/check-trading-step162-admin-trading-lab-mock-dashboard-cleanup-preflight.test.cjs",
  "scripts/check-trading-step161-admin-trading-lab-mock-trading-run-summary-core.test.cjs",
  "scripts/check-trading-step160-admin-trading-lab-mock-trading-run-summary-review-result-recording-gate.test.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
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

function assertStep172ScriptIsBounded(packageJson) {
  const step172 = packageJson.scripts?.[STEP172_SCRIPT];
  if (!step172) fail(`${STEP172_SCRIPT} script missing`);
  if (step172.includes(HEAVY_SERVICE_TEST)) {
    fail(`Step172 script must not invoke the heavy service integration runner: ${HEAVY_SERVICE_TEST}`);
  }
  if (!step172.includes("node scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.cjs")) {
    fail("Step172 script must still run the Step172 static checker first");
  }
  if (!step172.includes("node --test ")) {
    fail("Step172 script must still run node --test for focused smoke regressions");
  }
  for (const testPath of REQUIRED_STEP172_TESTS) {
    if (!step172.includes(testPath)) fail(`Step172 script missing focused regression test: ${testPath}`);
  }
}

function assertStep177ScriptExists(packageJson) {
  const step177 = packageJson.scripts?.[STEP177_SCRIPT];
  if (!step177) fail(`${STEP177_SCRIPT} script missing`);
  if (!step177.includes("scripts/check-trading-step177-legacy-trading-check-runner-cleanup.cjs")) {
    fail("Step177 npm check must run the Step177 checker");
  }
  if (!step177.includes("scripts/check-trading-step177-legacy-trading-check-runner-cleanup.test.cjs")) {
    fail("Step177 npm check must run the Step177 regression test");
  }
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

function assertNoNewUiOrEndpoint() {
  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  const publicSurfaceFiles = [
    "src/App.jsx",
    "src/components/AccountPages.jsx",
    "src/components/mypage/MyPageRoute.jsx",
    "src/components/mypage/MyPageSidebar.jsx",
    "src/components/mypage/MyPageLayout.jsx",
  ];

  if (panelText.includes("legacy-trading-check-runner-cleanup")) {
    fail("Step177 must not add a new /admin/trading UI section");
  }
  if (routeText.includes("legacy-trading-check-runner-cleanup")) {
    fail("Step177 must not add a new admin endpoint");
  }
  if (clientText.includes("fetchAdminTradingLegacyCheckRunnerCleanup")) {
    fail("Step177 must not add a new client endpoint helper");
  }
  for (const filePath of publicSurfaceFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("legacy-trading-check-runner-cleanup")) {
      fail(`Step177 must not touch public/mypage surfaces: ${filePath}`);
    }
  }
}

function assertStep172Terminates() {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npm.cmd run ${STEP172_SCRIPT}`]
    : ["run", STEP172_SCRIPT];
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 45_000,
    windowsHide: true,
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;

  if (result.error?.code === "ETIMEDOUT" || result.signal) {
    fail(`Step172 npm check timed out or was terminated; output:\n${output}`);
  }
  if (result.error) {
    fail(`Step172 npm check could not be started (${result.error.code || result.error.message}); output:\n${output}`);
  }
  if (result.status !== 0) {
    fail(`Step172 npm check exited non-zero (${result.status}); output:\n${output}`);
  }
  if (!output.includes("[check-trading-step172-admin-trading-lab-smoke-preflight-review-result] ok")) {
    fail("Step172 npm check did not print its checker pass log");
  }
  if (!/pass\s+\d+/.test(output)) {
    fail("Step172 npm check did not print a node --test pass summary");
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertStep172ScriptIsBounded(packageJson);
  assertStep177ScriptExists(packageJson);
  assertNoForbiddenRuntimeArtifacts();
  assertNoNewUiOrEndpoint();
  assertStep172Terminates();

  console.log("[check-trading-step177-legacy-trading-check-runner-cleanup] ok");
}

main();

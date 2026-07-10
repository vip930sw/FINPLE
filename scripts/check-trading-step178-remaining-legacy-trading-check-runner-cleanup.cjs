const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const STEP178_SCRIPT = "check:trading-step178-remaining-legacy-trading-check-runner-cleanup";
const HEAVY_SERVICE_TEST = "server/src/services/tradingAdminLabDashboardShell.test.js";

const LEGACY_RUNNERS = [
  {
    script: "check:trading-step167-admin-trading-lab-dashboard-ux-polish-preflight",
    checkerLog: "[check-trading-step167-admin-trading-lab-dashboard-ux-polish-preflight] ok",
    requiredTests: [
      "scripts/check-trading-step167-admin-trading-lab-dashboard-ux-polish-preflight.test.cjs",
      "scripts/check-trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate.test.cjs",
      "scripts/check-trading-step164-admin-trading-lab-mock-dashboard-cleanup-core.test.cjs",
      "scripts/check-trading-step163-admin-trading-lab-mock-dashboard-cleanup-review-result-recording-gate.test.cjs",
      "scripts/check-trading-step162-admin-trading-lab-mock-dashboard-cleanup-preflight.test.cjs",
      "scripts/check-trading-step161-admin-trading-lab-mock-trading-run-summary-core.test.cjs",
      "scripts/check-trading-step160-admin-trading-lab-mock-trading-run-summary-review-result-recording-gate.test.cjs",
      "scripts/check-step166-account-plan-mbti.test.mjs",
      "server/src/routes/adminTradingReadinessRoutes.test.js",
    ],
  },
  {
    script: "check:trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate",
    checkerLog: "[check-trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate] ok",
    requiredTests: [
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
    ],
  },
  {
    script: "check:trading-step169-admin-trading-lab-dashboard-ux-polish-core",
    checkerLog: "[check-trading-step169-admin-trading-lab-dashboard-ux-polish-core] ok",
    requiredTests: [
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
    ],
  },
  {
    script: "check:trading-step170-admin-trading-lab-dashboard-section-consolidation",
    checkerLog: "[check-trading-step170-admin-trading-lab-dashboard-section-consolidation] ok",
    requiredTests: [
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
    ],
  },
  {
    script: "check:trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish",
    checkerLog: "[check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish] ok",
    requiredTests: [
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
    ],
  },
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

function getScript(packageJson, scriptName) {
  const script = packageJson.scripts?.[scriptName];
  if (!script) fail(`${scriptName} script missing`);
  return script;
}

function assertRunnerScriptIsBounded(packageJson, runner) {
  const script = getScript(packageJson, runner.script);
  if (script.includes(HEAVY_SERVICE_TEST)) {
    fail(`${runner.script} must not invoke heavy service integration runner: ${HEAVY_SERVICE_TEST}`);
  }
  if (!script.includes("node --test ")) fail(`${runner.script} must still run node --test focused regressions`);
  for (const testPath of runner.requiredTests) {
    if (!script.includes(testPath)) fail(`${runner.script} missing focused regression test: ${testPath}`);
  }
}

function assertStep178ScriptExists(packageJson) {
  const script = getScript(packageJson, STEP178_SCRIPT);
  if (!script.includes("scripts/check-trading-step178-remaining-legacy-trading-check-runner-cleanup.cjs")) {
    fail("Step178 npm check must run the Step178 checker");
  }
  if (!script.includes("scripts/check-trading-step178-remaining-legacy-trading-check-runner-cleanup.test.cjs")) {
    fail("Step178 npm check must run the Step178 regression test");
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

  for (const forbidden of [
    "remaining-legacy-trading-check-runner-cleanup",
    "fetchAdminTradingRemainingLegacyCheckRunnerCleanup",
  ]) {
    if (panelText.includes(forbidden)) fail("Step178 must not add a new /admin/trading UI section");
    if (routeText.includes(forbidden)) fail("Step178 must not add a new admin endpoint");
    if (clientText.includes(forbidden)) fail("Step178 must not add a new client endpoint helper");
  }
  for (const filePath of publicSurfaceFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("remaining-legacy-trading-check-runner-cleanup")) {
      fail(`Step178 must not touch public/mypage surfaces: ${filePath}`);
    }
  }
}

function runNpmScript(scriptName) {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npm.cmd run ${scriptName}`]
    : ["run", scriptName];
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 60_000,
    windowsHide: true,
  });
}

function assertRunnerTerminates(runner) {
  const result = runNpmScript(runner.script);
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;

  if (result.error?.code === "ETIMEDOUT" || result.signal) {
    fail(`${runner.script} timed out or was terminated; output:\n${output}`);
  }
  if (result.error) {
    fail(`${runner.script} could not be started (${result.error.code || result.error.message}); output:\n${output}`);
  }
  if (result.status !== 0) {
    fail(`${runner.script} exited non-zero (${result.status}); output:\n${output}`);
  }
  if (!output.includes(runner.checkerLog)) {
    fail(`${runner.script} did not print checker pass log`);
  }
  if (!/pass\s+\d+/.test(output)) {
    fail(`${runner.script} did not print a node --test pass summary`);
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertStep178ScriptExists(packageJson);
  for (const runner of LEGACY_RUNNERS) {
    assertRunnerScriptIsBounded(packageJson, runner);
  }
  assertNoForbiddenRuntimeArtifacts();
  assertNoNewUiOrEndpoint();
  for (const runner of LEGACY_RUNNERS) {
    assertRunnerTerminates(runner);
  }

  console.log("[check-trading-step178-remaining-legacy-trading-check-runner-cleanup] ok");
}

main();

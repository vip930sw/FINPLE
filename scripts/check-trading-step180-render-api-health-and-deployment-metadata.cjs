const fs = require("node:fs");

const STEP180_SCRIPT = "check:trading-step180-render-api-health-and-deployment-metadata";

const REQUIRED_FILES = [
  "server/src/index.js",
  "server/src/routes/dbRoutes.js",
  "server/src/services/deploymentInfo.js",
  "server/src/services/deploymentInfo.test.js",
  "scripts/check-ai-analysis-production.mjs",
  "scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs",
  "scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs",
  "scripts/check-trading-step180-render-api-health-and-deployment-metadata.test.cjs",
  "package.json",
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

const PUBLIC_OR_TRADING_SURFACES = [
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

const FORBIDDEN_STEP180_SURFACE_SNIPPETS = [
  "render-api-health-and-deployment-metadata",
  "fetchAdminTradingRenderApiHealth",
  "buildAdminTradingRenderApiHealth",
  "trading-step180",
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

function assertHealthRoutesRemainSplit() {
  const indexText = readText("server/src/index.js");
  const dbRoutesText = readText("server/src/routes/dbRoutes.js");

  if (!indexText.includes('app.get("/api/health"')) fail("/api/health route missing");
  if (!indexText.includes("deployment: getDeploymentInfo()")) fail("/api/health must report deployment metadata");
  if (!indexText.includes('app.use("/api/db", dbRoutes);')) fail("/api/db router mount missing");
  if (!dbRoutesText.includes('router.get("/health"')) fail("/api/db/health route missing");
  if (!/checkDatabaseConnection\(\{\s*timeoutMs:/.test(dbRoutesText)) {
    fail("/api/db/health must check DB independently with an explicit timeout");
  }
  if (!/FINPLE_READINESS_DB_TIMEOUT_MS\s*\|\|\s*4500/.test(dbRoutesText)) {
    fail("/api/db/health must retain the readiness DB timeout environment fallback");
  }
}

function assertDeploymentMetadataPrefersRenderPlatform() {
  const deploymentText = readText("server/src/services/deploymentInfo.js");
  const testText = readText("server/src/services/deploymentInfo.test.js");

  for (const snippet of [
    "RENDER_COMMIT_ENV_KEYS",
    '"RENDER_GIT_COMMIT"',
    '"SOURCE_VERSION"',
    "MANUAL_COMMIT_ENV_KEYS",
    "getCommitEnvKeys()",
    "process.env.RENDER",
    "manual_commit_metadata_ignored_in_favor_of_render_platform",
    "render_platform_commit_metadata_missing",
    "commitSourceKind",
    "metadataWarnings",
  ]) {
    if (!deploymentText.includes(snippet)) fail(`deployment metadata source missing: ${snippet}`);
  }

  if (!testText.includes("prefers Render platform commit metadata over stale manual commit metadata")) {
    fail("deploymentInfo test must cover stale manual commit avoidance");
  }
  if (!testText.includes("falls back to manual commit metadata with a Render warning")) {
    fail("deploymentInfo test must cover manual fallback warning");
  }
}

function assertProductionCheckStillUsesHealthMetadata() {
  const productionCheckText = readText("scripts/check-ai-analysis-production.mjs");

  for (const snippet of [
    "https://finple-api.onrender.com/api",
    "requestJson(`${apiBaseUrl}/health`)",
    'deployment?.branch === "main"',
    "deployment?.commitShortSha",
  ]) {
    if (!productionCheckText.includes(snippet)) fail(`production health check missing: ${snippet}`);
  }
}

function assertStep179CleanupPreserved(packageJson) {
  const heavyServiceTest = "server/src/services/tradingAdminLabDashboardShell.test.js";
  const offenders = Object.entries(packageJson.scripts || {})
    .filter(([scriptName, command]) => scriptName.startsWith("check:trading-step") && command.includes(heavyServiceTest))
    .map(([scriptName]) => scriptName);
  if (offenders.length > 0) fail(`Step179 heavy service cleanup regressed: ${offenders.join(", ")}`);

  for (const scriptName of [
    "check:trading-step177-legacy-trading-check-runner-cleanup",
    "check:trading-step178-remaining-legacy-trading-check-runner-cleanup",
    "check:trading-step179-legacy-trading-check-runner-heavy-service-audit",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }
}

function assertStep180ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP180_SCRIPT];
  if (!script) fail(`${STEP180_SCRIPT} script missing`);
  if (!script.includes("scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs")) {
    fail("Step180 npm check must run the Step180 checker");
  }
  if (!script.includes("scripts/check-trading-step180-render-api-health-and-deployment-metadata.test.cjs")) {
    fail("Step180 npm check must run the Step180 regression test");
  }
  if (!script.includes("server/src/services/deploymentInfo.test.js")) {
    fail("Step180 npm check must run deploymentInfo metadata tests");
  }
}

function assertNoForbiddenArtifactsOrTradingPromotion() {
  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden runtime artifact exists: ${forbiddenPath}`);
  }
  for (const [filePath, snippet] of FORBIDDEN_SOURCE_SNIPPETS) {
    if (fs.existsSync(filePath) && readText(filePath).includes(snippet)) {
      fail(`${filePath} contains forbidden snippet: ${snippet}`);
    }
  }
}

function assertNoStep180UiEndpointOrTradingSurface() {
  for (const filePath of PUBLIC_OR_TRADING_SURFACES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    for (const snippet of FORBIDDEN_STEP180_SURFACE_SNIPPETS) {
      if (text.includes(snippet)) fail(`Step180 must not add UI/endpoint/trading surface: ${filePath}`);
    }
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertStep180ScriptExists(packageJson);
  assertHealthRoutesRemainSplit();
  assertDeploymentMetadataPrefersRenderPlatform();
  assertProductionCheckStillUsesHealthMetadata();
  assertStep179CleanupPreserved(packageJson);
  assertNoForbiddenArtifactsOrTradingPromotion();
  assertNoStep180UiEndpointOrTradingSurface();

  console.log("[check-trading-step180-render-api-health-and-deployment-metadata] ok");
}

main();

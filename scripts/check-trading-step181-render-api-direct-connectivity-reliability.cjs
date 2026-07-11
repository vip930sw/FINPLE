const fs = require("node:fs");

const STEP181_SCRIPT = "check:trading-step181-render-api-direct-connectivity-reliability";

const REQUIRED_FILES = [
  "scripts/render-api-direct-connectivity-diagnostic.cjs",
  "scripts/render-api-direct-connectivity-diagnostic.test.cjs",
  "scripts/check-trading-step181-render-api-direct-connectivity-reliability.cjs",
  "scripts/check-trading-step181-render-api-direct-connectivity-reliability.test.cjs",
  "scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs",
  "scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs",
  "server/src/services/deploymentInfo.js",
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

const FORBIDDEN_STEP181_SURFACE_SNIPPETS = [
  "render-api-direct-connectivity-reliability",
  "fetchAdminTradingRenderDirectConnectivity",
  "buildAdminTradingRenderDirectConnectivity",
  "trading-step181",
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

function assertStep181ScriptExists(packageJson) {
  const script = packageJson.scripts?.[STEP181_SCRIPT];
  if (!script) fail(`${STEP181_SCRIPT} script missing`);
  for (const snippet of [
    "scripts/check-trading-step181-render-api-direct-connectivity-reliability.cjs",
    "scripts/render-api-direct-connectivity-diagnostic.test.cjs",
    "scripts/check-trading-step181-render-api-direct-connectivity-reliability.test.cjs",
  ]) {
    if (!script.includes(snippet)) fail(`Step181 npm check missing ${snippet}`);
  }
}

function assertConnectivityDiagnosticCoversRequiredStages() {
  const text = readText("scripts/render-api-direct-connectivity-diagnostic.cjs");
  for (const snippet of [
    "dns_lookup_failed",
    "tcp_connect_failed",
    "tls_handshake_failed",
    "http_response_missing",
    "http_status_unexpected",
    "response_body_invalid",
    "retry_recovered",
    "curl.exe",
    "nodeFetch",
    "Invoke-WebRequest",
    "render_api_health",
    "render_db_health",
    "render_admin_trading_readiness",
    "vercel_production",
  ]) {
    if (!text.includes(snippet)) fail(`connectivity diagnostic missing ${snippet}`);
  }
}

function assertStep180AndStep179Preserved(packageJson) {
  for (const scriptName of [
    "check:trading-step180-render-api-health-and-deployment-metadata",
    "check:trading-step179-legacy-trading-check-runner-heavy-service-audit",
    "check:trading-step178-remaining-legacy-trading-check-runner-cleanup",
    "check:trading-step177-legacy-trading-check-runner-cleanup",
  ]) {
    if (!packageJson.scripts?.[scriptName]) fail(`${scriptName} missing`);
  }

  const deploymentText = readText("server/src/services/deploymentInfo.js");
  for (const snippet of [
    "RENDER_COMMIT_ENV_KEYS",
    "commitSourceKind",
    "metadataWarnings",
    "manual_commit_metadata_ignored_in_favor_of_render_platform",
  ]) {
    if (!deploymentText.includes(snippet)) fail(`Step180 metadata fix missing ${snippet}`);
  }

  const heavyServiceTest = "server/src/services/tradingAdminLabDashboardShell.test.js";
  const heavyOffenders = Object.entries(packageJson.scripts || {})
    .filter(([scriptName, command]) => scriptName.startsWith("check:trading-step") && command.includes(heavyServiceTest))
    .map(([scriptName]) => scriptName);
  if (heavyOffenders.length > 0) fail(`Step179 cleanup regressed: ${heavyOffenders.join(", ")}`);
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

function assertNoStep181UiEndpointOrTradingSurface() {
  for (const filePath of PUBLIC_OR_TRADING_SURFACES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    for (const snippet of FORBIDDEN_STEP181_SURFACE_SNIPPETS) {
      if (text.includes(snippet)) fail(`Step181 must not add UI/endpoint/trading surface: ${filePath}`);
    }
  }
}

function main() {
  const packageJson = readJson("package.json");
  assertRequiredFilesExist();
  assertStep181ScriptExists(packageJson);
  assertConnectivityDiagnosticCoversRequiredStages();
  assertStep180AndStep179Preserved(packageJson);
  assertNoForbiddenArtifactsOrTradingPromotion();
  assertNoStep181UiEndpointOrTradingSurface();

  console.log("[check-trading-step181-render-api-direct-connectivity-reliability] ok");
}

main();

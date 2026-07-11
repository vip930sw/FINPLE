const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step181 checker preserves metadata cleanup and adds only local connectivity diagnostics", () => {
  const checkerText = read("scripts/check-trading-step181-render-api-direct-connectivity-reliability.cjs");
  const diagnosticText = read("scripts/render-api-direct-connectivity-diagnostic.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");

  assert.match(checkerText, /assertConnectivityDiagnosticCoversRequiredStages/);
  assert.match(checkerText, /assertStep180AndStep179Preserved/);
  assert.match(checkerText, /assertNoStep181UiEndpointOrTradingSurface/);
  assert.match(checkerText, /FORBIDDEN_PATHS/);
  assert.match(checkerText, /FORBIDDEN_SOURCE_SNIPPETS/);

  for (const snippet of [
    "dns_lookup_failed",
    "tcp_connect_failed",
    "tls_handshake_failed",
    "http_response_missing",
    "curl.exe",
    "nodeFetch",
    "Invoke-WebRequest",
    "runLiveDiagnostic",
  ]) {
    assert.match(diagnosticText, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(
    packageJson.scripts["check:trading-step181-render-api-direct-connectivity-reliability"],
    /check-trading-step181-render-api-direct-connectivity-reliability\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step181-render-api-direct-connectivity-reliability"],
    /render-api-direct-connectivity-diagnostic\.test\.cjs/,
  );
  assert.match(packageJson.scripts["check:trading-step180-render-api-health-and-deployment-metadata"], /deploymentInfo\.test\.js/);
  assert.doesNotMatch(JSON.stringify(packageJson.scripts), /server\/src\/services\/tradingAdminLabDashboardShell\.test\.js/);

  assert.doesNotMatch(routeText, /render-api-direct-connectivity-reliability/);
  assert.doesNotMatch(panelText, /render-api-direct-connectivity-reliability/);
  assert.doesNotMatch(clientText, /fetchAdminTradingRenderDirectConnectivity/);
});

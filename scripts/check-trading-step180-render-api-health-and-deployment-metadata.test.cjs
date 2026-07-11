const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step180 audits Render API health metadata without adding trading surfaces", () => {
  const checkerText = read("scripts/check-trading-step180-render-api-health-and-deployment-metadata.cjs");
  const deploymentText = read("server/src/services/deploymentInfo.js");
  const deploymentTestText = read("server/src/services/deploymentInfo.test.js");
  const packageJson = JSON.parse(read("package.json"));
  const indexText = read("server/src/index.js");
  const dbRoutesText = read("server/src/routes/dbRoutes.js");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");

  assert.match(checkerText, /assertHealthRoutesRemainSplit/);
  assert.match(checkerText, /assertDeploymentMetadataPrefersRenderPlatform/);
  assert.match(checkerText, /assertStep179CleanupPreserved/);
  assert.match(checkerText, /assertNoStep180UiEndpointOrTradingSurface/);
  assert.match(checkerText, /FORBIDDEN_PATHS/);
  assert.match(checkerText, /FORBIDDEN_SOURCE_SNIPPETS/);

  assert.match(deploymentText, /RENDER_COMMIT_ENV_KEYS/);
  assert.match(deploymentText, /MANUAL_COMMIT_ENV_KEYS/);
  assert.match(deploymentText, /manual_commit_metadata_ignored_in_favor_of_render_platform/);
  assert.match(deploymentText, /render_platform_commit_metadata_missing/);
  assert.match(deploymentText, /commitSourceKind/);
  assert.match(deploymentText, /metadataWarnings/);
  assert.match(deploymentTestText, /prefers Render platform commit metadata over stale manual commit metadata/);

  assert.match(indexText, /app\.get\("\/api\/health"/);
  assert.match(indexText, /deployment: getDeploymentInfo\(\)/);
  assert.match(dbRoutesText, /router\.get\("\/health"/);
  assert.match(dbRoutesText, /checkDatabaseConnection\(\)/);

  assert.match(
    packageJson.scripts["check:trading-step180-render-api-health-and-deployment-metadata"],
    /check-trading-step180-render-api-health-and-deployment-metadata\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step180-render-api-health-and-deployment-metadata"],
    /server\/src\/services\/deploymentInfo\.test\.js/,
  );

  assert.doesNotMatch(routeText, /render-api-health-and-deployment-metadata/);
  assert.doesNotMatch(panelText, /render-api-health-and-deployment-metadata/);
  assert.doesNotMatch(clientText, /fetchAdminTradingRenderApiHealth/);
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step179 audits trading step runners for heavy service usage and preserves cleanup guardrails", () => {
  const checkText = read("scripts/check-trading-step179-legacy-trading-check-runner-heavy-service-audit.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const heavyServiceTest = "server/src/services/tradingAdminLabDashboardShell.test.js";
  const tradingStepScripts = Object.entries(packageJson.scripts)
    .filter(([scriptName]) => scriptName.startsWith("check:trading-step"));

  assert.match(checkText, /HEAVY_SERVICE_TEST/);
  assert.match(checkText, /assertNoHeavyServiceRunnerInPackage/);
  assert.match(checkText, /assertNoUnboundedProcessPatterns/);
  assert.match(checkText, /assertCleanupChainStillWired/);
  assert.match(checkText, /FORBIDDEN_PATHS/);
  assert.match(checkText, /FORBIDDEN_SOURCE_SNIPPETS/);
  assert.match(checkText, /PUBLIC_OR_RUNTIME_SURFACES/);

  assert.ok(tradingStepScripts.length > 50, "trading step script audit should cover the legacy chain");
  for (const [scriptName, command] of tradingStepScripts) {
    assert.equal(
      command.includes(heavyServiceTest),
      false,
      `${scriptName} must not directly invoke the heavy service test`,
    );
  }

  assert.match(
    packageJson.scripts["check:trading-step179-legacy-trading-check-runner-heavy-service-audit"],
    /check-trading-step179-legacy-trading-check-runner-heavy-service-audit\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step179-legacy-trading-check-runner-heavy-service-audit"],
    /check-trading-step179-legacy-trading-check-runner-heavy-service-audit\.test\.cjs/,
  );

  for (const scriptName of [
    "check:trading-step167-admin-trading-lab-dashboard-ux-polish-preflight",
    "check:trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate",
    "check:trading-step169-admin-trading-lab-dashboard-ux-polish-core",
    "check:trading-step170-admin-trading-lab-dashboard-section-consolidation",
    "check:trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish",
    "check:trading-step172-admin-trading-lab-smoke-preflight-review-result",
  ]) {
    assert.match(packageJson.scripts[scriptName], /scripts\/check-step166-account-plan-mbti\.test\.mjs/);
    assert.match(packageJson.scripts[scriptName], /server\/src\/routes\/adminTradingReadinessRoutes\.test\.js/);
  }

  assert.doesNotMatch(routeText, /legacy-trading-check-runner-heavy-service-audit/);
  assert.doesNotMatch(clientText, /legacy-trading-check-runner-heavy-service-audit/);
  assert.doesNotMatch(clientText, /fetchAdminTradingLegacyCheckRunnerHeavyServiceAudit/);
  assert.doesNotMatch(panelText, /legacy-trading-check-runner-heavy-service-audit/);
});

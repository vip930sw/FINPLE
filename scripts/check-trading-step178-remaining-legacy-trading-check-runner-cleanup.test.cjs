const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step178 checker bounds Step167 through Step171 runners and preserves guardrails", () => {
  const checkText = read("scripts/check-trading-step178-remaining-legacy-trading-check-runner-cleanup.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const runnerNames = [
    "check:trading-step167-admin-trading-lab-dashboard-ux-polish-preflight",
    "check:trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate",
    "check:trading-step169-admin-trading-lab-dashboard-ux-polish-core",
    "check:trading-step170-admin-trading-lab-dashboard-section-consolidation",
    "check:trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish",
  ];

  assert.match(checkText, /LEGACY_RUNNERS/);
  assert.match(checkText, /tradingAdminLabDashboardShell\.test\.js/);
  assert.match(checkText, /assertRunnerTerminates/);
  assert.match(checkText, /timeout: 60_000/);
  assert.match(checkText, /FORBIDDEN_PATHS/);
  assert.match(checkText, /FORBIDDEN_SOURCE_SNIPPETS/);

  for (const runnerName of runnerNames) {
    const script = packageJson.scripts[runnerName];
    assert.ok(script, `${runnerName} script exists`);
    assert.doesNotMatch(script, /server\/src\/services\/tradingAdminLabDashboardShell\.test\.js/);
    assert.match(script, /scripts\/check-step166-account-plan-mbti\.test\.mjs/);
    assert.match(script, /server\/src\/routes\/adminTradingReadinessRoutes\.test\.js/);
  }

  assert.match(
    packageJson.scripts["check:trading-step178-remaining-legacy-trading-check-runner-cleanup"],
    /check-trading-step178-remaining-legacy-trading-check-runner-cleanup\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step178-remaining-legacy-trading-check-runner-cleanup"],
    /check-trading-step178-remaining-legacy-trading-check-runner-cleanup\.test\.cjs/,
  );

  assert.doesNotMatch(routeText, /remaining-legacy-trading-check-runner-cleanup/);
  assert.doesNotMatch(clientText, /remaining-legacy-trading-check-runner-cleanup/);
  assert.doesNotMatch(clientText, /fetchAdminTradingRemainingLegacyCheckRunnerCleanup/);
  assert.doesNotMatch(panelText, /remaining-legacy-trading-check-runner-cleanup/);
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step177 checker bounds the Step172 runner and preserves guardrails", () => {
  const checkText = read("scripts/check-trading-step177-legacy-trading-check-runner-cleanup.cjs");
  const packageJson = JSON.parse(read("package.json"));
  const step172Script = packageJson.scripts["check:trading-step172-admin-trading-lab-smoke-preflight-review-result"];
  const step177Script = packageJson.scripts["check:trading-step177-legacy-trading-check-runner-cleanup"];
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");

  assert.match(checkText, /HEAVY_SERVICE_TEST/);
  assert.match(checkText, /tradingAdminLabDashboardShell\.test\.js/);
  assert.match(checkText, /assertStep172Terminates/);
  assert.match(checkText, /spawnSync/);
  assert.match(checkText, /timeout: 45_000/);
  assert.match(checkText, /FORBIDDEN_PATHS/);
  assert.match(checkText, /FORBIDDEN_SOURCE_SNIPPETS/);

  assert.ok(step172Script);
  assert.doesNotMatch(step172Script, /server\/src\/services\/tradingAdminLabDashboardShell\.test\.js/);
  assert.match(step172Script, /scripts\/check-trading-step172-admin-trading-lab-smoke-preflight-review-result\.test\.cjs/);
  assert.match(step172Script, /scripts\/check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish\.test\.cjs/);
  assert.match(step172Script, /scripts\/check-step166-account-plan-mbti\.test\.mjs/);
  assert.match(step172Script, /server\/src\/routes\/adminTradingReadinessRoutes\.test\.js/);

  assert.ok(step177Script);
  assert.match(step177Script, /check-trading-step177-legacy-trading-check-runner-cleanup\.cjs/);
  assert.match(step177Script, /check-trading-step177-legacy-trading-check-runner-cleanup\.test\.cjs/);

  assert.doesNotMatch(routeText, /legacy-trading-check-runner-cleanup/);
  assert.doesNotMatch(clientText, /legacy-trading-check-runner-cleanup/);
  assert.doesNotMatch(clientText, /fetchAdminTradingLegacyCheckRunnerCleanup/);
  assert.doesNotMatch(panelText, /legacy-trading-check-runner-cleanup/);
});

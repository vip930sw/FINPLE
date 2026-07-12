const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step195 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step195-ai-ml-readiness-gate-summary.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step195-ai-ml-readiness-gate-summary\] ok/);
});

test("Step195 package script keeps prior Step194 checker test linked", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step195-ai-ml-readiness-gate-summary/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlReadinessGateSummary\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step195-ai-ml-readiness-gate-summary\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step194-ai-ml-feature-pipeline-preflight\.test\.cjs/);
});

test("Step195 service preserves fail-closed readiness aggregation vocabulary", () => {
  const service = fs.readFileSync("server/src/services/tradingAiMlReadinessGateSummary.js", "utf8");
  for (const snippet of [
    "contract_preflight_only",
    "internal_contracts_valid_execution_blocked",
    "blocked_by_safety_policy",
    "internal_contracts_incomplete",
    "invalid_internal_contract",
    "orderAuthorityStatus: \"external_blocker\"",
    "adminReadOnlyReadinessAggregationAllowed: true",
    "deterministicStatusCompositionAllowed: true",
    "providerCallsAllowed: false",
    "kisCallsAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
    "publicUiExposureAllowed: false",
    "myPageExposureAllowed: false",
  ]) {
    assert.match(service, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step195 admin panel is summary-first and admin-only", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panel, /data-admin-panel-key="ai-ml-readiness-gate-summary"/);
  assert.match(panel, /contract and metadata preflight only/);
  assert.match(panel, /not operational readiness/);
  assert.match(panel, /provider\/KIS access blocked/);
  assert.match(panel, /order authority externally blocked/);
  assert.ok(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-strategy-management-console"));
});

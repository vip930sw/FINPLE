const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step200 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step200-ai-ml-architecture-milestone-review.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step200-ai-ml-architecture-milestone-review\] ok/);
  assert.match(output, /maintenance signal server\/src\/services\/tradingAiMlManifestHandoffEligibility\.js lines=/);
});

test("Step200 package script keeps Step199 checker test linked", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step200-ai-ml-architecture-milestone-review/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlArchitectureMilestoneReview\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step200-ai-ml-architecture-milestone-review\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step199-ai-ml-manifest-handoff-eligibility\.test\.cjs/);
});

test("Step200 service preserves milestone-only and execution-blocked vocabulary", () => {
  const service = fs.readFileSync("server/src/services/tradingAiMlArchitectureMilestoneReview.js", "utf8");
  for (const snippet of [
    "step200_ai_ml_architecture_milestone",
    "step191_to_step199",
    "contract_chain_complete",
    "fail_closed_consistent",
    "runtimeCapabilityStatus: \"not_implemented\"",
    "actualDataCapabilityStatus: \"blocked\"",
    "executionReadinessStatus: \"blocked\"",
    "maintenanceReviewStatus: \"consolidation_required\"",
    "nextPhaseDecision: \"consolidate_before_runtime\"",
    "architecture_milestone_complete_execution_blocked",
    "invalid_milestone_source",
    "blocked_by_safety_policy",
    "milestone_review_requires_revision",
    "providerCallsAllowed: false",
    "orderSubmissionAllowed: false",
    "readyForLiveGuardedTrading: false",
  ]) {
    assert.match(service, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step200 admin panel is first AI ML summary and read-only", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panel, /data-admin-panel-key="ai-ml-architecture-milestone-review"/);
  assert.ok(panel.indexOf("ai-ml-architecture-milestone-review") < panel.indexOf("ai-ml-readiness-gate-summary"));
  assert.ok(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"));
  assert.ok(panel.indexOf("ai-ml-manifest-validation-report") < panel.indexOf("ai-ml-manifest-handoff-eligibility"));
  assert.ok(panel.indexOf("ai-ml-manifest-handoff-eligibility") < panel.indexOf("ai-ml-strategy-management-console"));
  assert.match(panel, /architecture contract milestone only/);
  assert.match(panel, /runtime is not implemented/);
  assert.match(panel, /actual data access remains blocked/);
  assert.match(panel, /provider\/KIS\/order remain blocked/);
  assert.match(panel, /consolidation required before runtime/);
});

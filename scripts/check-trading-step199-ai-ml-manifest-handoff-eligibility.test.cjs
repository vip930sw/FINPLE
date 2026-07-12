const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step199 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step199-ai-ml-manifest-handoff-eligibility\] ok/);
});

test("Step199 package script keeps Step198 checker test linked", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step199-ai-ml-manifest-handoff-eligibility/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlManifestHandoffEligibility\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step199-ai-ml-manifest-handoff-eligibility\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step198-ai-ml-manifest-validation-report\.test\.cjs/);
});

test("Step199 service preserves handoff-only and execution-denied vocabulary", () => {
  const service = fs.readFileSync("server/src/services/tradingAiMlManifestHandoffEligibility.js", "utf8");
  for (const snippet of [
    "metadata_only_non_executable",
    "eligible_for_manual_review",
    "generated_in_memory",
    "handoffApprovalStatus: \"not_granted\"",
    "approvalScope: \"handoff_candidate_review_only\"",
    "handoffAuthorizationStatus: \"denied\"",
    "handoffExecutionStatus: \"blocked\"",
    "targetPreflightAuthorizationStatus: \"denied\"",
    "targetPreflightExecutionStatus: \"blocked\"",
    "handoff_candidate_ready_execution_blocked",
    "invalid_source_report",
    "blocked_by_safety_policy",
    "handoff_requirements_incomplete",
    "handoffPersistenceAllowed: false",
    "handoffTransmissionAllowed: false",
    "targetPreflightExecutionAllowed: false",
    "providerCallsAllowed: false",
    "orderSubmissionAllowed: false",
  ]) {
    assert.match(service, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step199 admin panel follows Step198 and remains read-only", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panel, /data-admin-panel-key="ai-ml-manifest-handoff-eligibility"/);
  assert.ok(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"));
  assert.ok(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-dataset-build-dry-run-manifest"));
  assert.ok(panel.indexOf("ai-ml-dataset-build-dry-run-manifest") < panel.indexOf("ai-ml-manifest-validation-report"));
  assert.ok(panel.indexOf("ai-ml-manifest-validation-report") < panel.indexOf("ai-ml-manifest-handoff-eligibility"));
  assert.ok(panel.indexOf("ai-ml-manifest-handoff-eligibility") < panel.indexOf("ai-ml-strategy-management-console"));
  assert.match(panel, /metadata-only handoff eligibility/);
  assert.match(panel, /handoff package is not persisted or transmitted/);
  assert.match(panel, /manual approval is not granted/);
  assert.match(panel, /handoff authorization denied/);
  assert.match(panel, /target preflight execution blocked/);
  assert.match(panel, /order and live trading blocked/);
});

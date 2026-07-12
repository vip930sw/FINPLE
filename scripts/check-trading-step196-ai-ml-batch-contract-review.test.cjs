const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step196 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step196-ai-ml-batch-contract-review.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step196-ai-ml-batch-contract-review\] ok/);
});

test("Step196 package script keeps Step195 checker test linked", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step196-ai-ml-batch-contract-review/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlBatchContractReview\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step196-ai-ml-batch-contract-review\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step195-ai-ml-readiness-gate-summary\.test\.cjs/);
});

test("Step196 service preserves review-only and execution-denied vocabulary", () => {
  const service = fs.readFileSync("server/src/services/tradingAiMlBatchContractReview.js", "utf8");
  for (const snippet of [
    "metadata_only_batch_contract_review",
    "eligible_for_manual_review",
    "approvalStatus: \"not_granted\"",
    "approvalScope: \"dry_run_manifest_design_only\"",
    "executionAuthorizationStatus: \"denied\"",
    "batchExecutionStatus: \"blocked\"",
    "outputCreationStatus: \"blocked\"",
    "review_ready_execution_blocked",
    "blocked_by_safety_policy",
    "contract_needs_revision",
    "invalid_upstream_contract",
    "manualApprovalPersistenceAllowed: false",
    "executionAuthorizationAllowed: false",
    "providerCallsAllowed: false",
    "orderSubmissionAllowed: false",
  ]) {
    assert.match(service, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step196 admin panel follows Step195 and remains read-only", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panel, /data-admin-panel-key="ai-ml-batch-contract-review"/);
  assert.ok(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"));
  assert.ok(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-strategy-management-console"));
  assert.match(panel, /metadata-only contract review/);
  assert.match(panel, /manual approval not granted/);
  assert.match(panel, /batch execution blocked/);
  assert.match(panel, /output creation blocked/);
  assert.match(panel, /order and live trading blocked/);
});

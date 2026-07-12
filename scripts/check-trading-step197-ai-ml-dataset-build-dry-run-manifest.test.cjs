const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step197 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step197-ai-ml-dataset-build-dry-run-manifest\] ok/);
});

test("Step197 package script keeps Step196 checker test linked", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step197-ai-ml-dataset-build-dry-run-manifest/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlDatasetBuildDryRunManifest\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step197-ai-ml-dataset-build-dry-run-manifest\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step196-ai-ml-batch-contract-review\.test\.cjs/);
});

test("Step197 service preserves non-executable manifest and receipt vocabulary", () => {
  const service = fs.readFileSync("server/src/services/tradingAiMlDatasetBuildDryRunManifest.js", "utf8");
  for (const snippet of [
    "metadata_only_non_executable",
    "generated_not_persisted",
    "design_contract_record_only",
    "approvalStatus: \"not_granted\"",
    "approvalScope: \"dry_run_manifest_design_only\"",
    "executionAuthorizationStatus: \"denied\"",
    "dryRunExecutionStatus: \"blocked\"",
    "materializationStatus: \"blocked\"",
    "outputPathStatus: \"not_assigned\"",
    "manifest_design_ready_execution_blocked",
    "blocked_by_safety_policy",
    "manifest_needs_revision",
    "invalid_upstream_review",
    "reviewReceiptPersistenceAllowed: false",
    "schemaMaterializationAllowed: false",
    "partitionMaterializationAllowed: false",
    "providerCallsAllowed: false",
    "orderSubmissionAllowed: false",
  ]) {
    assert.match(service, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step197 admin panel follows Step196 and remains read-only", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panel, /data-admin-panel-key="ai-ml-dataset-build-dry-run-manifest"/);
  assert.ok(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"));
  assert.ok(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-dataset-build-dry-run-manifest"));
  assert.ok(panel.indexOf("ai-ml-dataset-build-dry-run-manifest") < panel.indexOf("ai-ml-strategy-management-console"));
  assert.match(panel, /metadata-only non-executable manifest/);
  assert.match(panel, /review receipt is not an approval/);
  assert.match(panel, /manifest is not persisted or downloadable/);
  assert.match(panel, /dry-run execution blocked/);
  assert.match(panel, /schema and partition materialization blocked/);
  assert.match(panel, /output path not assigned/);
  assert.match(panel, /dataset and file creation blocked/);
  assert.match(panel, /DB\/provider\/KIS access blocked/);
});

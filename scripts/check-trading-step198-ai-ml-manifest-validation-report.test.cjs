const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step198 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step198-ai-ml-manifest-validation-report.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step198-ai-ml-manifest-validation-report\] ok/);
});

test("Step198 package script keeps Step197 checker test linked", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step198-ai-ml-manifest-validation-report/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlManifestValidationReport\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step198-ai-ml-manifest-validation-report\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step197-ai-ml-dataset-build-dry-run-manifest\.test\.cjs/);
});

test("Step198 service preserves report-only and execution-denied vocabulary", () => {
  const service = fs.readFileSync("server/src/services/tradingAiMlManifestValidationReport.js", "utf8");
  for (const snippet of [
    "metadata_only_non_executable",
    "generated_in_memory",
    "generated_not_persisted",
    "approvalStatus: \"not_granted\"",
    "waiverStatus: \"not_granted\"",
    "executionAuthorizationStatus: \"denied\"",
    "handoffAuthorizationStatus: \"denied\"",
    "validation_report_ready_execution_blocked",
    "invalid_source_manifest",
    "blocked_by_safety_policy",
    "manifest_exceptions_require_revision",
    "reportPersistenceAllowed: false",
    "exceptionPersistenceAllowed: false",
    "remediationPersistenceAllowed: false",
    "waiverGrantAllowed: false",
    "providerCallsAllowed: false",
    "orderSubmissionAllowed: false",
  ]) {
    assert.match(service, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step198 admin panel follows Step197 and remains read-only", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panel, /data-admin-panel-key="ai-ml-manifest-validation-report"/);
  assert.ok(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"));
  assert.ok(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-dataset-build-dry-run-manifest"));
  assert.ok(panel.indexOf("ai-ml-dataset-build-dry-run-manifest") < panel.indexOf("ai-ml-manifest-validation-report"));
  assert.ok(panel.indexOf("ai-ml-manifest-validation-report") < panel.indexOf("ai-ml-strategy-management-console"));
  assert.match(panel, /metadata-only validation report/);
  assert.match(panel, /source manifest was not executed/);
  assert.match(panel, /exceptions are not waivers/);
  assert.match(panel, /no exception grants approval or execution/);
  assert.match(panel, /report and exception registry are not persisted/);
  assert.match(panel, /dry-run and materialization remain blocked/);
});

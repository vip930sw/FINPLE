const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-step116-progress-summary.cjs");
const CONTRACT = "trading_lab_step116_progress_summary.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const TRACKED_CONTRACTS = [
  CONTRACT,
  "trading_lab_step1160_preflight.json",
  "trading_lab_step116_store_schema_draft.json",
  "trading_lab_step116_shadow_mode_contract.json",
  "trading_lab_step116_kis_order_adapter_design_review.json",
  "trading_lab_step116_env_readiness_contract.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_audit_logger_readiness_contract.json",
  "trading_lab_step116_manual_operator_approval_contract.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_order_credential_boundary_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_private_shadow_runtime_preflight.json",
  "trading_lab_step116_read_only_approval_intake_contract.json",
  "trading_lab_step116_read_only_approval_import_preflight.json",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
  "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json",
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
  "trading_lab_step116_read_only_snapshot_normalization_validator_fixtures.json",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
  "trading_lab_step116_read_only_snapshot_risk_input_validator_fixtures.json",
  "trading_lab_step116_private_shadow_order_intent_contract.json",
  "trading_lab_step116_private_shadow_order_intent_validator_fixtures.json",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
  "trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures.json",
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json",
  "trading_lab_step116_private_shadow_runtime_review_packet_validator_fixtures.json",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
  "trading_lab_step116_private_shadow_operator_access_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
  "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_validator_fixtures.json",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
  "trading_lab_step116_redacted_read_only_approval_template.json",
  "trading_lab_step116_redacted_approval_hash_helper_contract.json",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
  "trading_lab_step116_redacted_approval_packet_validation_contract.json",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
  "trading_lab_step116_private_db_storage_implementation_preflight.json",
  "trading_lab_step116_private_runtime_route_implementation_preflight.json",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
  "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json",
  "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-step116-progress-summary-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of TRACKED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.copyFileSync("package.json", path.join(workspace, "package.json"));
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runSummary(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current Step 116 progress summary", () => {
  const workspace = makeWorkspace();
  const result = runSummary(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_progress_summary\.json/);
});

test("summarizes contract progress while keeping trading locked", () => {
  const workspace = makeWorkspace();
  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.progress.trackedContractsTotal, 61);
  assert.equal(report.progress.trackedContractsReady, 61);
  assert.equal(report.progress.trackedContractsRemaining, 0);
  assert.equal(report.progress.requiredNpmScriptsTotal, 81);
  assert.equal(report.readiness.contractStackReady, true);
  assert.equal(report.readiness.readyForReadOnlyProviderCalls, false);
  assert.equal(report.readiness.readyForPrivateShadowRuntime, false);
  assert.equal(report.readiness.readyForOrderSubmission, false);
  assert.equal(report.readiness.readyForLiveGuardedTrading, false);
});

test("records remaining trading gates instead of approving provider calls or orders", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(
    report.remainingTradingGates.join("|"),
    /owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /read_only_provider_call_authorization_blocked_pending_owner_packet_and_provider_review/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /private_operator_access_implementation_review_blocked_pending_private_runtime_review/,
  );
  assert.match(report.remainingTradingGates.join("|"), /manual_order_permission_packet_not_imported/);
  assert.match(report.remainingTradingGates.join("|"), /live_guarded_order_adapter_implementation_review_not_started/);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("rejects stale summary if trading readiness is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.readyForOrderSubmission = true;
  report.readiness.readyForLiveGuardedTrading = true;
  writeJson(workspace, CONTRACT, report);

  const result = runSummary(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_progress_summary\.json is out of date/);
});

test("blocks summary readiness if a tracked contract allows provider calls", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, "trading_lab_step116_env_risk_gate_contract.json");
  envRiskGate.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_env_risk_gate_contract.json", envRiskGate);

  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.trackedContractsReady, false);
  assert.equal(report.readiness.contractStackReady, false);
  assert.match(report.evidence.failedMilestones.join("|"), /envRiskGate/);
});

test("blocks summary readiness if runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.contractStackReady, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

test("blocks summary readiness if scenario monthly returns CSV appears", () => {
  const workspace = makeWorkspace();
  fs.writeFileSync(path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"), "symbol,date,return\n");

  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.scenarioMonthlyReturnsCsvAbsent, false);
  assert.equal(report.readiness.contractStackReady, false);
  assert.match(report.readiness.blockers.join("|"), /scenario_monthly_returns_csv_present/);
});

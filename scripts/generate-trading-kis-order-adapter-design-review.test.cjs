const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-kis-order-adapter-design-review.cjs");
const REVIEW = "trading_lab_step116_kis_order_adapter_design_review.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const SHADOW_CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const STORE_SCHEMA = "trading_lab_step116_store_schema_draft.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DRY_RUN_REPLAY_CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const SHADOW_HISTORY_REVIEW_CONTRACT = "trading_lab_step116_shadow_history_review_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const MANUAL_OPERATOR_APPROVAL_CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const KILL_SWITCH_CLEARANCE_CONTRACT = "trading_lab_step116_kill_switch_clearance_contract.json";
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT = "trading_lab_step116_order_credential_boundary_contract.json";
const RISK_GATE_CLEARANCE_CONTRACT = "trading_lab_step116_risk_gate_clearance_contract.json";
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT = "trading_lab_step116_private_shadow_runtime_preflight.json";
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT =
  "trading_lab_step116_private_shadow_operator_access_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-kis-order-adapter-review-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    REVIEW,
    POLICY,
    PREFLIGHT,
    SHADOW_CONTRACT,
    STORE_SCHEMA,
    ENV_RISK_GATE_CONTRACT,
    DRY_RUN_REPLAY_CONTRACT,
    SHADOW_HISTORY_REVIEW_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
    MANUAL_OPERATOR_APPROVAL_CONTRACT,
    KILL_SWITCH_CLEARANCE_CONTRACT,
    ORDER_CREDENTIAL_BOUNDARY_CONTRACT,
    RISK_GATE_CLEARANCE_CONTRACT,
    PRIVATE_SHADOW_RUNTIME_PREFLIGHT,
    PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runReview(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = REVIEW) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current KIS order adapter design review", () => {
  const workspace = makeWorkspace();
  const result = runReview(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_kis_order_adapter_design_review\.json/);
});

test("keeps KIS order adapter design review implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.designReviewOnly, true);
  assert.equal(report.currentState.adapterImplementationAllowed, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, true);
  assert.equal(report.readiness.adapterImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("requires manual approval, kill switch, risk gate, and dry-run replay before future submission", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.deepEqual(report.futureAdapterBoundary.minimumPreSubmissionGates, [
    "manual_operator_approval",
    "kill_switch_clear",
    "risk_gate_clear",
    "env_risk_gate_contract_fail_closed",
    "shadow_history_reviewed",
    "dry_run_replay_passed",
    "private_shadow_operator_access_reviewed",
    "separate_order_capable_credentials_present",
    "audit_logger_ready",
  ]);
  assert.match(report.futureAdapterBoundary.forbiddenActions.join("|"), /order_submission/);
  assert.match(report.futureAdapterBoundary.forbiddenActions.join("|"), /runtime_provider_call/);
});

test("rejects stale review when adapter implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.adapterImplementationAllowed = true;
  writeJson(workspace, REVIEW, report);

  const result = runReview(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_kis_order_adapter_design_review\.json is out of date/);
});

test("blocks future adapter review if live_guarded stops requiring manual approval", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  const liveGuarded = policy.modes.find((mode) => mode.mode === "live_guarded");
  liveGuarded.requiresManualApproval = false;
  writeJson(workspace, POLICY, policy);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.liveGuardedPolicyReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_policy_not_ready/);
});

test("blocks future adapter review if env risk gate contract stops failing closed", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  envRiskGate.readiness.readyForProviderCalls = true;
  envRiskGate.readiness.providerCallsAllowed = true;
  envRiskGate.checks.riskGateStillDisablesOrderSubmission = false;
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.envRiskGateContractStillFailClosed, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_contract_not_fail_closed/);
});

test("blocks future adapter review if dry-run replay contract is not ready", () => {
  const workspace = makeWorkspace();
  const dryRunReplay = readJson(workspace, DRY_RUN_REPLAY_CONTRACT);
  dryRunReplay.readiness.readyForFutureDryRunReplayImplementationReview = false;
  dryRunReplay.readiness.dryRunReplayImplementationAllowed = true;
  writeJson(workspace, DRY_RUN_REPLAY_CONTRACT, dryRunReplay);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.dryRunReplayContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /dry_run_replay_contract_not_ready/);
});

test("blocks future adapter review if shadow history review contract is not ready", () => {
  const workspace = makeWorkspace();
  const shadowHistory = readJson(workspace, SHADOW_HISTORY_REVIEW_CONTRACT);
  shadowHistory.readiness.readyForFutureShadowHistoryReviewImplementation = false;
  shadowHistory.readiness.shadowHistoryReviewImplementationAllowed = true;
  writeJson(workspace, SHADOW_HISTORY_REVIEW_CONTRACT, shadowHistory);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.shadowHistoryReviewContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /shadow_history_review_contract_not_ready/);
});

test("blocks future adapter review if audit logger readiness contract is not ready", () => {
  const workspace = makeWorkspace();
  const auditLogger = readJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT);
  auditLogger.readiness.readyForFutureAuditLoggerImplementationReview = false;
  auditLogger.readiness.auditLoggerImplementationAllowed = true;
  writeJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT, auditLogger);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.auditLoggerReadinessContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /audit_logger_readiness_contract_not_ready/);
});

test("blocks future adapter review if manual operator approval contract is not ready", () => {
  const workspace = makeWorkspace();
  const manualApproval = readJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT);
  manualApproval.readiness.readyForFutureManualApprovalImplementationReview = false;
  manualApproval.readiness.manualApprovalImplementationAllowed = true;
  writeJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT, manualApproval);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOperatorApprovalContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /manual_operator_approval_contract_not_ready/);
});

test("blocks future adapter review if kill switch clearance contract is not ready", () => {
  const workspace = makeWorkspace();
  const killSwitch = readJson(workspace, KILL_SWITCH_CLEARANCE_CONTRACT);
  killSwitch.readiness.readyForFutureKillSwitchClearanceImplementationReview = false;
  killSwitch.readiness.killSwitchRuntimeImplementationAllowed = true;
  writeJson(workspace, KILL_SWITCH_CLEARANCE_CONTRACT, killSwitch);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.killSwitchClearanceContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /kill_switch_clearance_contract_not_ready/);
});

test("blocks future adapter review if order credential boundary contract is not ready", () => {
  const workspace = makeWorkspace();
  const credentials = readJson(workspace, ORDER_CREDENTIAL_BOUNDARY_CONTRACT);
  credentials.readiness.readyForFutureOrderCredentialImplementationReview = false;
  credentials.readiness.credentialStoreImplementationAllowed = true;
  writeJson(workspace, ORDER_CREDENTIAL_BOUNDARY_CONTRACT, credentials);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.orderCredentialBoundaryContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /order_credential_boundary_contract_not_ready/);
});

test("blocks future adapter review if risk gate clearance contract is not ready", () => {
  const workspace = makeWorkspace();
  const riskGate = readJson(workspace, RISK_GATE_CLEARANCE_CONTRACT);
  riskGate.readiness.readyForFutureRiskGateClearanceImplementationReview = false;
  riskGate.readiness.riskGateClearanceImplementationAllowed = true;
  writeJson(workspace, RISK_GATE_CLEARANCE_CONTRACT, riskGate);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.riskGateClearanceContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /risk_gate_clearance_contract_not_ready/);
});

test("blocks future adapter review if private shadow runtime preflight is not ready", () => {
  const workspace = makeWorkspace();
  const privateShadowRuntime = readJson(workspace, PRIVATE_SHADOW_RUNTIME_PREFLIGHT);
  privateShadowRuntime.readiness.readyForFuturePrivateShadowRuntimeImplementationReview = false;
  privateShadowRuntime.readiness.privateShadowRuntimeImplementationAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_PREFLIGHT, privateShadowRuntime);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowRuntimePreflightReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_runtime_preflight_not_ready/);
});

test("blocks future adapter review if private shadow operator access contract is not ready", () => {
  const workspace = makeWorkspace();
  const operatorAccess = readJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT);
  operatorAccess.readiness.readyForFuturePrivateShadowOperatorAccessImplementationReview = false;
  operatorAccess.readiness.publicUiAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT, operatorAccess);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowOperatorAccessContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_operator_access_contract_not_ready/);
});

test("blocks future adapter review if order adapter runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"), "");

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

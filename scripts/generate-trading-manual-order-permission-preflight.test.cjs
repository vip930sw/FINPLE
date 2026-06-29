const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-manual-order-permission-preflight.cjs");
const CONTRACT = "trading_lab_step116_manual_order_permission_preflight.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const KIS_ORDER_ADAPTER_DESIGN_REVIEW = "trading_lab_step116_kis_order_adapter_design_review.json";
const MANUAL_OPERATOR_APPROVAL_CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const KILL_SWITCH_CLEARANCE_CONTRACT = "trading_lab_step116_kill_switch_clearance_contract.json";
const RISK_GATE_CLEARANCE_CONTRACT = "trading_lab_step116_risk_gate_clearance_contract.json";
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT = "trading_lab_step116_order_credential_boundary_contract.json";
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT =
  "trading_lab_step116_private_shadow_operator_access_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    KIS_ORDER_ADAPTER_DESIGN_REVIEW,
    MANUAL_OPERATOR_APPROVAL_CONTRACT,
    KILL_SWITCH_CLEARANCE_CONTRACT,
    RISK_GATE_CLEARANCE_CONTRACT,
    ORDER_CREDENTIAL_BOUNDARY_CONTRACT,
    PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runContract(workspace, args = ["--check"]) {
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

test("passes with current manual order permission preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_preflight\.json/);
});

test("keeps manual order permission import and trading effects blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionImportReview, true);
  assert.equal(report.readiness.manualOrderPermissionImportedNow, false);
  assert.equal(report.readiness.manualOrderPermissionImportImplementationAllowed, false);
  assert.equal(report.readiness.orderAdapterImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records permission fields, assertions, forbidden content, and redaction rules", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureManualOrderPermissionBoundary;

  assert.match(boundary.requiredPermissionFields.join("|"), /operatorAccessHash/);
  assert.match(boundary.requiredPermissionFields.join("|"), /orderAdapterDesignReviewHash/);
  assert.match(boundary.requiredPermissionAssertions.join("|"), /permission_requires_risk_gate_clearance/);
  assert.match(boundary.requiredPermissionAssertions.join("|"), /permission_success_does_not_submit_orders/);
  assert.match(boundary.forbiddenPermissionContent.join("|"), /raw_order_payload/);
  assert.equal(boundary.packetRules.currentStepCreatesPacket, false);
  assert.equal(boundary.packetRules.secretValuesAllowed, false);
});

test("rejects stale contract if order submission is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_manual_order_permission_preflight\.json is out of date/);
});

test("blocks permission preflight if order adapter design review is not ready", () => {
  const workspace = makeWorkspace();
  const designReview = readJson(workspace, KIS_ORDER_ADAPTER_DESIGN_REVIEW);
  designReview.readiness.readyForFutureOrderAdapterImplementationReview = false;
  designReview.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, KIS_ORDER_ADAPTER_DESIGN_REVIEW, designReview);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.orderAdapterDesignReviewReady, false);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionImportReview, false);
  assert.match(report.readiness.blockers.join("|"), /order_adapter_design_review_not_ready/);
});

test("blocks permission preflight if private shadow operator access is not ready", () => {
  const workspace = makeWorkspace();
  const operatorAccess = readJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT);
  operatorAccess.readiness.readyForFuturePrivateShadowOperatorAccessImplementationReview = false;
  operatorAccess.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT, operatorAccess);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowOperatorAccessContractReady, false);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionImportReview, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_operator_access_contract_not_ready/);
});

test("blocks permission preflight if manual approval is not ready", () => {
  const workspace = makeWorkspace();
  const manualApproval = readJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT);
  manualApproval.readiness.readyForFutureManualApprovalImplementationReview = false;
  manualApproval.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT, manualApproval);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOperatorApprovalContractReady, false);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionImportReview, false);
  assert.match(report.readiness.blockers.join("|"), /manual_operator_approval_contract_not_ready/);
});

test("blocks permission preflight if permission artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "data", "private", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionImportReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

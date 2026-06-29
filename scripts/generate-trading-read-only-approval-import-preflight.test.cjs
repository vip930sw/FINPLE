const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-read-only-approval-import-preflight.cjs");
const CONTRACT = "trading_lab_step116_read_only_approval_import_preflight.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const SHADOW_CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const ENV_READINESS_CONTRACT = "trading_lab_step116_env_readiness_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const READ_ONLY_APPROVAL_INTAKE_CONTRACT = "trading_lab_step116_read_only_approval_intake_contract.json";
const MOCK_APPROVAL_EVIDENCE_RECEIPT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT = "trading_lab_step116_order_credential_boundary_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-import-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    SHADOW_CONTRACT,
    ENV_READINESS_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
    READ_ONLY_APPROVAL_INTAKE_CONTRACT,
    MOCK_APPROVAL_EVIDENCE_RECEIPT,
    ORDER_CREDENTIAL_BOUNDARY_CONTRACT,
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

test("passes with current read-only approval import preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_approval_import_preflight\.json/);
});

test("keeps approval import preflight implementation and provider calls blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.approvalPacketImportedNow, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalImportImplementationReview, true);
  assert.equal(report.readiness.readOnlyApprovalImportImplementationAllowed, false);
  assert.equal(report.readiness.readOnlyRuntimeIntegrationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
});

test("records import validations, rejection reasons, and redacted packet rules", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.futureReadOnlyApprovalImportBoundary.requiredImportValidations.join("|"), /approval_is_not_expired/);
  assert.match(report.futureReadOnlyApprovalImportBoundary.requiredImportValidations.join("|"), /secret_values_absent/);
  assert.match(report.futureReadOnlyApprovalImportBoundary.requiredPacketRejectionReasons.join("|"), /secret_value_present/);
  assert.equal(report.futureReadOnlyApprovalImportBoundary.packetRules.currentStepCreatesPacket, false);
  assert.equal(report.futureReadOnlyApprovalImportBoundary.packetRules.liveEndpointAllowed, false);
});

test("rejects stale preflight when approval import is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.approvalPacketImportedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_read_only_approval_import_preflight\.json is out of date/);
});

test("blocks readiness if read-only approval intake contract is not ready", () => {
  const workspace = makeWorkspace();
  const intake = readJson(workspace, READ_ONLY_APPROVAL_INTAKE_CONTRACT);
  intake.readiness.readyForFutureReadOnlyApprovalIntakeValidation = false;
  intake.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_INTAKE_CONTRACT, intake);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalIntakeContractReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalImportImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_intake_contract_not_ready/);
});

test("blocks readiness if intake contract drops required approval fields", () => {
  const workspace = makeWorkspace();
  const intake = readJson(workspace, READ_ONLY_APPROVAL_INTAKE_CONTRACT);
  intake.futureReadOnlyApprovalIntakeBoundary.requiredApprovalFields =
    intake.futureReadOnlyApprovalIntakeBoundary.requiredApprovalFields.filter((field) => field !== "accountIdHash");
  writeJson(workspace, READ_ONLY_APPROVAL_INTAKE_CONTRACT, intake);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.intakeContractDefinesApprovalFields, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalImportImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /intake_contract_missing_approval_fields/);
});

test("blocks readiness if mock approval evidence receipt is not ready", () => {
  const workspace = makeWorkspace();
  const receipt = readJson(workspace, MOCK_APPROVAL_EVIDENCE_RECEIPT);
  receipt.readiness.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview = false;
  receipt.readiness.providerCallsAllowed = true;
  writeJson(workspace, MOCK_APPROVAL_EVIDENCE_RECEIPT, receipt);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.mockApprovalEvidenceReceiptReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalImportImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /mock_approval_evidence_receipt_not_ready/);
});

test("blocks readiness if a future approval packet appears too early", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalImportImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

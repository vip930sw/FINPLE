const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-mock-approval-evidence-receipt.cjs");
const CONTRACT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_READINESS_CONTRACT = "trading_lab_step116_env_readiness_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const READ_ONLY_APPROVAL_INTAKE_CONTRACT = "trading_lab_step116_read_only_approval_intake_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-mock-approval-evidence-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_READINESS_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
    READ_ONLY_APPROVAL_INTAKE_CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
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

test("passes with current mock approval evidence receipt", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_mock_approval_evidence_receipt\.json/);
});

test("records owner mock confirmation without enabling provider calls or orders", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.receiptOnly, true);
  assert.equal(report.ownerProvidedEvidenceReceipt.kisPortalMockApplicationConfirmed, true);
  assert.equal(report.ownerProvidedEvidenceReceipt.renderEnvMockTradingValuesConfirmed, true);
  assert.equal(report.readiness.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview, true);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps receipt redacted and forbids raw secrets or account identifiers", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);

  assert.match(report.futureRedactedApprovalImportBoundary.requiredReceiptAssertions.join("|"), /secret_values_not_recorded/);
  assert.match(report.futureRedactedApprovalImportBoundary.forbiddenReceiptContent.join("|"), /app_secret/);
  assert.match(report.futureRedactedApprovalImportBoundary.forbiddenReceiptContent.join("|"), /full_account_number/);
  assert.doesNotMatch(serialized, /APP Secret/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
});

test("rejects stale receipt if provider calls are manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_mock_approval_evidence_receipt\.json is out of date/);
});

test("blocks receipt readiness if approval import preflight is not ready", () => {
  const workspace = makeWorkspace();
  const importPreflight = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT);
  importPreflight.readiness.readyForFutureReadOnlyApprovalImportImplementationReview = false;
  importPreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT, importPreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalImportPreflightReady, false);
  assert.equal(report.readiness.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_preflight_not_ready/);
});

test("blocks receipt readiness if a private approval packet appears too early", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

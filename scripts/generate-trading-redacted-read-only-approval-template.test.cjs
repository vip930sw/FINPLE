const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-redacted-read-only-approval-template.cjs");
const CONTRACT = "trading_lab_step116_redacted_read_only_approval_template.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const MOCK_APPROVAL_EVIDENCE_RECEIPT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const READ_ONLY_APPROVAL_INTAKE_CONTRACT = "trading_lab_step116_read_only_approval_intake_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-read-only-approval-template-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    MOCK_APPROVAL_EVIDENCE_RECEIPT,
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

test("passes with current redacted read-only approval template", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_redacted_read_only_approval_template\.json/);
});

test("keeps approval packet creation, provider calls, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.templateOnly, true);
  assert.equal(report.readiness.readyForOwnerRedactedApprovalPacketPreparation, true);
  assert.equal(report.readiness.approvalPacketCreatedNow, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records hash-only owner action fields and redacted sample shape", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const template = report.futureRedactedApprovalPacketTemplate;

  assert.match(template.requiredTemplateFields.join("|"), /approvedByHash/);
  assert.match(template.requiredTemplateFields.join("|"), /accountIdHash/);
  assert.match(template.requiredTemplateAssertions.join("|"), /template_forbids_secret_values/);
  assert.match(template.forbiddenTemplateContent.join("|"), /full_account_number/);
  assert.equal(template.currentStepCreatesPacket, false);
  assert.equal(template.sampleRedactedShape.providerCallsAllowed, false);
});

test("does not include raw KIS secret or account identifiers", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);

  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET/);
});

test("rejects stale template if approval packet creation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.approvalPacketCreatedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_redacted_read_only_approval_template\.json is out of date/);
});

test("blocks template readiness if mock approval evidence receipt is not ready", () => {
  const workspace = makeWorkspace();
  const receipt = readJson(workspace, MOCK_APPROVAL_EVIDENCE_RECEIPT);
  receipt.readiness.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview = false;
  receipt.readiness.providerCallsAllowed = true;
  writeJson(workspace, MOCK_APPROVAL_EVIDENCE_RECEIPT, receipt);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.mockApprovalEvidenceReceiptReady, false);
  assert.equal(report.readiness.readyForOwnerRedactedApprovalPacketPreparation, false);
  assert.match(report.readiness.blockers.join("|"), /mock_approval_evidence_receipt_not_ready/);
});

test("blocks template readiness if private approval packet appears too early", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForOwnerRedactedApprovalPacketPreparation, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

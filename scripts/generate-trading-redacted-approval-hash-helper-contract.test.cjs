const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-redacted-approval-hash-helper-contract.cjs");
const CONTRACT = "trading_lab_step116_redacted_approval_hash_helper_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const MOCK_APPROVAL_EVIDENCE_RECEIPT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const REDACTED_READ_ONLY_APPROVAL_TEMPLATE = "trading_lab_step116_redacted_read_only_approval_template.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-approval-hash-helper-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    MOCK_APPROVAL_EVIDENCE_RECEIPT,
    REDACTED_READ_ONLY_APPROVAL_TEMPLATE,
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

test("passes with current redacted approval hash helper contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_redacted_approval_hash_helper_contract\.json/);
});

test("keeps helper implementation, hash generation, provider calls, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.hashHelperImplementationAllowed, false);
  assert.equal(report.futureLocalHashHelperBoundary.currentStepCreatesHashes, false);
  assert.equal(report.readiness.readyForFutureLocalHashHelperImplementationReview, true);
  assert.equal(report.readiness.hashHelperImplementationAllowed, false);
  assert.equal(report.readiness.approvalPacketCreatedNow, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records required labels, helper rules, forbidden inputs, and no raw secrets", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureLocalHashHelperBoundary;
  const serialized = JSON.stringify(report);

  assert.deepEqual(boundary.requiredHashInputLabels, [
    "approvedByHash",
    "accountIdHash",
    "evidenceTicketHash",
    "revocationPlanHash",
  ]);
  assert.match(boundary.requiredHashHelperRules.join("|"), /hmac_sha256_required/);
  assert.match(boundary.requiredHashHelperRules.join("|"), /private_pepper_required/);
  assert.match(boundary.forbiddenHashInputs.join("|"), /app_secret/);
  assert.match(boundary.forbiddenHashInputs.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY/);
});

test("rejects stale contract if hash helper implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.hashHelperImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_redacted_approval_hash_helper_contract\.json is out of date/);
});

test("blocks readiness if redacted read-only approval template is not ready", () => {
  const workspace = makeWorkspace();
  const template = readJson(workspace, REDACTED_READ_ONLY_APPROVAL_TEMPLATE);
  template.readiness.readyForOwnerRedactedApprovalPacketPreparation = false;
  template.readiness.providerCallsAllowed = true;
  writeJson(workspace, REDACTED_READ_ONLY_APPROVAL_TEMPLATE, template);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.redactedReadOnlyApprovalTemplateReady, false);
  assert.equal(report.readiness.readyForFutureLocalHashHelperImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_read_only_approval_template_not_ready/);
});

test("blocks readiness if mock approval receipt is not ready", () => {
  const workspace = makeWorkspace();
  const receipt = readJson(workspace, MOCK_APPROVAL_EVIDENCE_RECEIPT);
  receipt.readiness.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview = false;
  receipt.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, MOCK_APPROVAL_EVIDENCE_RECEIPT, receipt);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.mockApprovalEvidenceReceiptReady, false);
  assert.equal(report.readiness.readyForFutureLocalHashHelperImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /mock_approval_evidence_receipt_not_ready/);
});

test("blocks if actual hash helper script appears before implementation review", () => {
  const workspace = makeWorkspace();
  const helperPath = path.join(workspace, "scripts", "create-trading-redacted-approval-hashes.cjs");
  fs.mkdirSync(path.dirname(helperPath), { recursive: true });
  fs.writeFileSync(helperPath, "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureLocalHashHelperImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

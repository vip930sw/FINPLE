const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-redacted-approval-hash-helper-preflight.cjs");
const CONTRACT = "trading_lab_step116_redacted_approval_hash_helper_preflight.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const MOCK_APPROVAL_EVIDENCE_RECEIPT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const REDACTED_READ_ONLY_APPROVAL_TEMPLATE = "trading_lab_step116_redacted_read_only_approval_template.json";
const REDACTED_APPROVAL_HASH_HELPER_CONTRACT = "trading_lab_step116_redacted_approval_hash_helper_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-approval-hash-helper-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    MOCK_APPROVAL_EVIDENCE_RECEIPT,
    REDACTED_READ_ONLY_APPROVAL_TEMPLATE,
    REDACTED_APPROVAL_HASH_HELPER_CONTRACT,
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

test("passes with current redacted approval hash helper preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_redacted_approval_hash_helper_preflight\.json/);
});

test("keeps hash preparation deferred and all runtime paths blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.ownerHashPreparationDeferred, true);
  assert.equal(report.currentState.hashHelperImplementationAllowed, false);
  assert.equal(report.currentState.hashGenerationAllowed, false);
  assert.equal(report.readiness.readyForOwnerAssistedHashPreparationLater, true);
  assert.equal(report.readiness.approvalPacketCreatedNow, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records future review inputs without raw account, secret, or operator values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureOwnerAssistedHashPreparationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.futureReviewInputs.join("|"), /explicit_owner_request_to_prepare_hashes/);
  assert.match(boundary.futureReviewInputs.join("|"), /private_pepper_source_outside_repo/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_account_identifier/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_revocation_plan/);
  assert.equal(boundary.currentStepRequestsRawInputs, false);
  assert.equal(boundary.currentStepRequestsPrivatePepper, false);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY/);
});

test("rejects stale preflight if hash generation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.hashGenerationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_redacted_approval_hash_helper_preflight\.json is out of date/);
});

test("blocks readiness if prior hash helper contract is not ready", () => {
  const workspace = makeWorkspace();
  const priorContract = readJson(workspace, REDACTED_APPROVAL_HASH_HELPER_CONTRACT);
  priorContract.readiness.readyForFutureLocalHashHelperImplementationReview = false;
  priorContract.readiness.providerCallsAllowed = true;
  writeJson(workspace, REDACTED_APPROVAL_HASH_HELPER_CONTRACT, priorContract);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.redactedApprovalHashHelperContractReady, false);
  assert.equal(report.readiness.readyForOwnerAssistedHashPreparationLater, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_approval_hash_helper_contract_not_ready/);
});

test("blocks readiness if approval import preflight is not ready", () => {
  const workspace = makeWorkspace();
  const importPreflight = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT);
  importPreflight.readiness.readyForFutureReadOnlyApprovalImportImplementationReview = false;
  importPreflight.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT, importPreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalImportPreflightReady, false);
  assert.equal(report.readiness.readyForOwnerAssistedHashPreparationLater, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_preflight_not_ready/);
});

test("blocks if actual hash helper script appears before explicit owner-assisted step", () => {
  const workspace = makeWorkspace();
  const helperPath = path.join(workspace, "scripts", "create-trading-redacted-approval-hashes.cjs");
  fs.mkdirSync(path.dirname(helperPath), { recursive: true });
  fs.writeFileSync(helperPath, "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForOwnerAssistedHashPreparationLater, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

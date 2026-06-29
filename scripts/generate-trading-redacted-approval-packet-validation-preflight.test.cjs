const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-redacted-approval-packet-validation-preflight.cjs");
const CONTRACT = "trading_lab_step116_redacted_approval_packet_validation_preflight.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const MOCK_APPROVAL_EVIDENCE_RECEIPT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT = "trading_lab_step116_redacted_approval_hash_helper_preflight.json";
const REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT =
  "trading_lab_step116_redacted_approval_packet_validation_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-approval-packet-validation-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    MOCK_APPROVAL_EVIDENCE_RECEIPT,
    REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT,
    REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT,
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

test("passes with current redacted approval packet validation preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_redacted_approval_packet_validation_preflight\.json/);
});

test("allows only future pure local validator review while keeping runtime paths blocked now", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.currentState.validationImplementationAllowedNow, false);
  assert.equal(report.currentState.validationImplementationReviewAllowedLater, true);
  assert.equal(report.futurePureLocalValidatorImplementationBoundary.currentStepImplementsValidator, false);
  assert.equal(report.futurePureLocalValidatorImplementationBoundary.currentStepReadsPrivatePacket, false);
  assert.equal(report.readiness.readyForPureLocalValidatorImplementationReview, true);
  assert.equal(report.readiness.approvalPacketCreatedNow, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records implementation review rules without raw account, secret, or provider values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePureLocalValidatorImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationReviewRules.join("|"), /pure_node_script_only/);
  assert.match(boundary.implementationReviewRules.join("|"), /no_network_access/);
  assert.match(boundary.implementationReviewRules.join("|"), /no_environment_secret_loading/);
  assert.match(boundary.implementationReviewRules.join("|"), /redacted_error_messages_only/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_account_identifier/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY/);
});

test("rejects stale preflight if validation implementation is manually allowed now", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.validationImplementationAllowedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_redacted_approval_packet_validation_preflight\.json is out of date/);
});

test("blocks readiness if validation contract is not ready", () => {
  const workspace = makeWorkspace();
  const validationContract = readJson(workspace, REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT);
  validationContract.readiness.readyForFutureRedactedApprovalPacketValidationImplementationReview = false;
  validationContract.readiness.providerCallsAllowed = true;
  writeJson(workspace, REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT, validationContract);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.redactedApprovalPacketValidationContractReady, false);
  assert.equal(report.readiness.readyForPureLocalValidatorImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_approval_packet_validation_contract_not_ready/);
});

test("blocks readiness if hash helper preflight starts allowing hash generation", () => {
  const workspace = makeWorkspace();
  const hashPreflight = readJson(workspace, REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT);
  hashPreflight.readiness.hashGenerationAllowed = true;
  writeJson(workspace, REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT, hashPreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.redactedApprovalHashHelperPreflightReady, false);
  assert.equal(report.readiness.readyForPureLocalValidatorImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_approval_hash_helper_preflight_not_ready/);
});

test("blocks if validator implementation or private packet appears too early", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  const validatorPath = path.join(workspace, "scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.mkdirSync(path.dirname(validatorPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");
  fs.writeFileSync(validatorPath, "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForPureLocalValidatorImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

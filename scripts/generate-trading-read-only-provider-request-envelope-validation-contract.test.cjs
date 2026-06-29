const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-request-envelope-validation-contract.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json";
const REQUEST_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES =
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json";
const PROGRESS_SUMMARY = "trading_lab_step116_progress_summary.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-provider-request-validation-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    REQUEST_ENVELOPE_CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
    REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES,
    PROGRESS_SUMMARY,
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

test("passes with current read-only provider request envelope validation contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_request_envelope_validation_contract\.json/);
});

test("keeps envelope validator, provider calls, runtime, DB, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.futureReadOnlyProviderRequestEnvelopeValidationBoundary.currentStepImplementsValidator, false);
  assert.equal(report.futureReadOnlyProviderRequestEnvelopeValidationBoundary.currentStepCallsProvider, false);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview, true);
  assert.equal(report.readiness.validationImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records read-only request validation rules and rejection reasons", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureReadOnlyProviderRequestEnvelopeValidationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.requiredEnvelopeFields.join("|"), /approvalIdHash/);
  assert.match(boundary.allowedReadEndpointCategories.join("|"), /account_cash_balance_read/);
  assert.match(boundary.forbiddenEndpointCategories.join("|"), /order_submission/);
  assert.match(boundary.requiredValidationRules.join("|"), /base_url_must_be_openapivts_virtual_trading/);
  assert.match(boundary.requiredValidationRules.join("|"), /provider_call_allowed_must_be_false/);
  assert.match(boundary.requiredRejectionReasons.join("|"), /provider_call_flag_enabled/);
  assert.match(boundary.forbiddenEnvelopeContent.join("|"), /raw_provider_payload/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
});

test("rejects stale contract if provider calls are manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_request_envelope_validation_contract\.json is out of date/,
  );
});

test("blocks readiness if request envelope contract starts allowing provider calls", () => {
  const workspace = makeWorkspace();
  const requestEnvelope = readJson(workspace, REQUEST_ENVELOPE_CONTRACT);
  requestEnvelope.readiness.providerCallsAllowed = true;
  requestEnvelope.readiness.requestEnvelopeImplementationAllowed = true;
  writeJson(workspace, REQUEST_ENVELOPE_CONTRACT, requestEnvelope);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.requestEnvelopeContractReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_provider_request_envelope_contract_not_ready/);
});

test("blocks readiness if approval import preflight is not ready", () => {
  const workspace = makeWorkspace();
  const approvalImport = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT);
  approvalImport.readiness.readyForFutureReadOnlyApprovalImportImplementationReview = false;
  approvalImport.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT, approvalImport);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalImportPreflightReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_preflight_not_ready/);
});

test("blocks readiness if request envelope fields lose providerCallAllowed", () => {
  const workspace = makeWorkspace();
  const requestEnvelope = readJson(workspace, REQUEST_ENVELOPE_CONTRACT);
  requestEnvelope.futureReadOnlyProviderRequestEnvelopeBoundary.requiredEnvelopeFields =
    requestEnvelope.futureReadOnlyProviderRequestEnvelopeBoundary.requiredEnvelopeFields.filter(
      (field) => field !== "providerCallAllowed",
    );
  writeJson(workspace, REQUEST_ENVELOPE_CONTRACT, requestEnvelope);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.envelopeFieldsReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /request_envelope_fields_not_ready/);
});

test("blocks if runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const runtimePath = path.join(workspace, "server", "src", "services", "tradingReadOnlyProvider.js");
  fs.mkdirSync(path.dirname(runtimePath), { recursive: true });
  fs.writeFileSync(runtimePath, "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

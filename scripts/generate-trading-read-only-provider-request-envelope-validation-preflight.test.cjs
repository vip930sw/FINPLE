const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-request-envelope-validation-preflight.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json";
const REQUEST_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_contract.json";
const REQUEST_ENVELOPE_VALIDATION_CONTRACT =
  "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const PROGRESS_SUMMARY = "trading_lab_step116_progress_summary.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-request-envelope-validation-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    REQUEST_ENVELOPE_CONTRACT,
    REQUEST_ENVELOPE_VALIDATION_CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
    PROGRESS_SUMMARY,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
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

test("passes with current read-only provider request envelope validation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_request_envelope_validation_preflight\.json/);
});

test("allows only future pure local validator review while keeping provider calls blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.currentState.validationImplementationAllowedNow, true);
  assert.equal(report.futurePureLocalRequestEnvelopeValidatorBoundary.currentStepImplementsValidator, false);
  assert.equal(report.futurePureLocalRequestEnvelopeValidatorBoundary.currentStepCreatesProviderRequest, false);
  assert.equal(report.futurePureLocalRequestEnvelopeValidatorBoundary.currentStepCallsProvider, false);
  assert.equal(report.readiness.readyForPureLocalRequestEnvelopeValidatorImplementationReview, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records implementation review rules without secrets or raw provider payloads", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePureLocalRequestEnvelopeValidatorBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationReviewRules.join("|"), /pure_node_script_only/);
  assert.match(boundary.implementationReviewRules.join("|"), /no_network_access/);
  assert.match(boundary.implementationReviewRules.join("|"), /no_provider_call/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
});

test("rejects stale preflight if provider calls are manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_request_envelope_validation_preflight\.json is out of date/,
  );
});

test("blocks readiness if validation contract is not ready", () => {
  const workspace = makeWorkspace();
  const validationContract = readJson(workspace, REQUEST_ENVELOPE_VALIDATION_CONTRACT);
  validationContract.readiness.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview = false;
  validationContract.readiness.providerCallsAllowed = true;
  writeJson(workspace, REQUEST_ENVELOPE_VALIDATION_CONTRACT, validationContract);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.requestEnvelopeValidationContractReady, false);
  assert.equal(report.readiness.readyForPureLocalRequestEnvelopeValidatorImplementationReview, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /read_only_provider_request_envelope_validation_contract_not_ready/,
  );
});

test("blocks readiness if progress summary starts allowing read-only provider calls", () => {
  const workspace = makeWorkspace();
  const progressSummary = readJson(workspace, PROGRESS_SUMMARY);
  progressSummary.readiness.readyForReadOnlyProviderCalls = true;
  progressSummary.readiness.providerCallsAllowed = true;
  writeJson(workspace, PROGRESS_SUMMARY, progressSummary);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.progressSummaryStillLocked, false);
  assert.equal(report.readiness.readyForPureLocalRequestEnvelopeValidatorImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /progress_summary_not_locked/);
});

test("blocks if future validator, provider, route, or scenario monthly artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const validatorPath = path.join(workspace, "scripts", "validate-trading-read-only-provider-request-envelope.cjs");
  const providerPath = path.join(workspace, "server", "src", "services", "tradingReadOnlyProvider.js");
  const routePath = path.join(workspace, "server", "src", "routes", "trading");
  const monthlyPath = path.join(workspace, "data", "processed", "scenario_monthly_returns.csv");
  fs.mkdirSync(path.dirname(validatorPath), { recursive: true });
  fs.mkdirSync(path.dirname(providerPath), { recursive: true });
  fs.mkdirSync(routePath, { recursive: true });
  fs.writeFileSync(validatorPath, "module.exports = {};\n");
  fs.writeFileSync(providerPath, "module.exports = {};\n");
  fs.writeFileSync(monthlyPath, "symbol,date,return\n");

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForPureLocalRequestEnvelopeValidatorImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

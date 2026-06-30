const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-call-authorization-review-result-contract.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
  "trading_lab_step116_read_only_provider_call_authorization_preflight_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-provider-call-auth-review-result-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
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

test("passes with current read-only provider call authorization review-result contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_call_authorization_review_result_contract\.json/);
});

test("records review-result readiness while keeping provider calls and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderCallAuthorizationReviewResult, true);
  assert.equal(report.readiness.providerCallAuthorizationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.checks.callAuthorizationPreflightRecorded, true);
  assert.equal(report.checks.responseValidationReviewResultReady, true);
  assert.equal(report.checks.privateReadOnlyProviderImplementationStillBlocked, true);
  assert.equal(report.checks.readOnlyApprovalImportStillBlocked, true);
});

test("rejects stale contract when provider authorization is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.readiness.providerCallsAllowed = true;
  report.currentState.providerCallAuthorizationAllowedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_read_only_provider_call_authorization_review_result_contract\.json is out of date/);
});

test("blocks readiness if call authorization preflight starts allowing provider calls", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_read_only_provider_call_authorization_preflight.json");
  preflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_read_only_provider_call_authorization_preflight.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderCallAuthorizationReviewResult, false);
  assert.match(report.readiness.blockers.join("|"), /call_authorization_preflight_not_recorded/);
});

test("blocks if private provider implementation preflight unexpectedly opens", () => {
  const workspace = makeWorkspace();
  const providerPreflight = readJson(workspace, "trading_lab_step116_private_read_only_provider_implementation_preflight.json");
  providerPreflight.readiness.readyForFuturePrivateReadOnlyProviderImplementationReview = true;
  providerPreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_private_read_only_provider_implementation_preflight.json", providerPreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderCallAuthorizationReviewResult, false);
  assert.match(report.readiness.blockers.join("|"), /private_read_only_provider_implementation_not_blocked/);
});

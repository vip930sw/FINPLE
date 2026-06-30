const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-response-envelope-validation-result-receipt.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt.json";
const INPUTS = [
  CONTRACT,
  "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json",
  "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
];
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-response-envelope.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-provider-response-validation-receipt-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of INPUTS) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
  }
  const validatorTarget = path.join(workspace, VALIDATOR_PATH);
  fs.mkdirSync(path.dirname(validatorTarget), { recursive: true });
  fs.copyFileSync(VALIDATOR_PATH, validatorTarget);
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runReceipt(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current read-only provider response envelope validation result receipt contract", () => {
  const workspace = makeWorkspace();
  const result = runReceipt(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt\.json/,
  );
});

test("records a redacted response validation receipt boundary while keeping provider calls, routes, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runReceipt(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.receiptContractOnly, true);
  assert.equal(report.readiness.readyForFutureResponseEnvelopeValidationResultReceiptReview, true);
  assert.equal(report.readiness.validationReceiptRecordedNow, false);
  assert.equal(report.readiness.responseEnvelopePathRecorded, false);
  assert.equal(report.readiness.rawResponseRecorded, false);
  assert.equal(report.readiness.providerPayloadRecorded, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps response receipt schema redacted and separate from provider authorization", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);

  assert.match(
    report.futureValidationResultReceiptBoundary.requiredReceiptAssertions.join("|"),
    /receipt_does_not_record_raw_response_payload/,
  );
  assert.match(
    report.futureValidationResultReceiptBoundary.requiredReceiptAssertions.join("|"),
    /receipt_requires_separate_provider_authorization_review/,
  );
  assert.match(report.futureValidationResultReceiptBoundary.forbiddenReceiptContent.join("|"), /app_secret/);
  assert.doesNotMatch(serialized, /"app(Key|Secret)"|"access(Token)"/);
  assert.doesNotMatch(serialized, /raw(AccountIdentifier|ProviderPayload|ResponsePayload)/);
});

test("rejects stale receipt if receipt, provider, route, UI, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.validationReceiptRecordedNow = true;
  report.currentState.responseEnvelopePathRecorded = true;
  report.readiness.providerCallsAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runReceipt(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt\.json is out of date/,
  );
});

test("blocks if upstream validation fixtures or provider authorization open too early", () => {
  const workspace = makeWorkspace();
  const fixtures = readJson(workspace, "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json");
  fixtures.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json", fixtures);
  const callAuth = readJson(workspace, "trading_lab_step116_read_only_provider_call_authorization_preflight.json");
  callAuth.readiness.providerCallAuthorizationAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_read_only_provider_call_authorization_preflight.json", callAuth);

  const result = runReceipt(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.validatorFixturesReady, false);
  assert.equal(report.checks.callAuthorizationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /response_envelope_validator_fixtures_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /provider_call_authorization_not_blocked/);
});

test("blocks if provider implementation, private approval packet, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "services", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "server", "src", "routes", "trading", "provider.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runReceipt(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-response-envelope-validation-result-receipt-review-runbook-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_runbook_contract.json";
const INPUTS = [
  CONTRACT,
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight_validator_fixtures.json",
];
const REVIEW_PREFLIGHT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-provider-response-envelope-validation-result-receipt-review-preflight.cjs",
);
const RECEIPT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-provider-response-envelope-validation-result-receipt.cjs",
);
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-provider-response-receipt-review-runbook-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of INPUTS) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
  }
  for (const sourcePath of [REVIEW_PREFLIGHT_VALIDATOR_PATH, RECEIPT_VALIDATOR_PATH]) {
    const target = path.join(workspace, sourcePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(sourcePath, target);
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runRunbook(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current read-only provider response validation result receipt review runbook contract", () => {
  const workspace = makeWorkspace();
  const result = runRunbook(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_runbook_contract\.json/,
  );
});

test("records owner-assisted response receipt review runbook while keeping validation execution, receipt reads, provider calls, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runRunbook(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.runbookOnly, true);
  assert.equal(report.readiness.readyForOwnerAssistedResponseValidationResultReceiptReviewRunbookReview, true);
  assert.equal(report.readiness.currentStepRunsValidator, false);
  assert.equal(report.readiness.currentStepReadsReceipt, false);
  assert.equal(report.readiness.validationReceiptRecordedNow, false);
  assert.equal(report.readiness.validationReceiptReadAllowedNow, false);
  assert.equal(report.readiness.responseEnvelopePathRecorded, false);
  assert.equal(report.readiness.rawResponseRecorded, false);
  assert.equal(report.readiness.providerPayloadRecorded, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps runbook command explicit and redacted", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);

  assert.match(
    report.futureOwnerAssistedResponseValidationResultReceiptReviewRunbook.validatorCommandTemplate,
    /--receipt <owner-supplied-redacted-response-validation-result-receipt-path>/,
  );
  assert.match(
    report.futureOwnerAssistedResponseValidationResultReceiptReviewRunbook.reviewPreflightValidatorCommandTemplate,
    /--contract data\/processed\/trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight\.json/,
  );
  assert.match(
    report.futureOwnerAssistedResponseValidationResultReceiptReviewRunbook.requiredReviewAssertions.join("|"),
    /review_does_not_record_receipt_path/,
  );
  assert.match(
    report.futureOwnerAssistedResponseValidationResultReceiptReviewRunbook.requiredReviewAssertions.join("|"),
    /review_requires_separate_provider_call_authorization_review/,
  );
  const sensitiveNamePattern = new RegExp(
    [
      ["KIS", "TRADING", "APP", "SECRET"].join("_"),
      ["KIS", "TRADING", "APP", "KEY"].join("_"),
      ["APP", "Secret"].join(" "),
      ["APP", "Key"].join(" "),
    ].join("|"),
  );
  assert.doesNotMatch(serialized, /"app(Key|Secret)"|"access(Token)"/);
  assert.doesNotMatch(serialized, sensitiveNamePattern);
  assert.doesNotMatch(serialized, /\b\d{8}\b/);
});

test("rejects stale runbook if validation, receipt read, provider, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.currentStepRunsValidator = true;
  report.currentState.currentStepReadsReceipt = true;
  report.readiness.providerPayloadRecorded = true;
  report.readiness.providerCallsAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runRunbook(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_runbook_contract\.json is out of date/,
  );
});

test("blocks if upstream review preflight or fixtures open too early", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(
    workspace,
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight.json",
  );
  preflight.readiness.validationReceiptReadAllowedNow = true;
  writeJson(
    workspace,
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight.json",
    preflight,
  );
  const fixtures = readJson(
    workspace,
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight_validator_fixtures.json",
  );
  fixtures.readiness.orderSubmissionAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight_validator_fixtures.json",
    fixtures,
  );

  const result = runRunbook(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.reviewPreflightReady, false);
  assert.equal(report.checks.reviewPreflightValidatorFixturesReady, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /read_only_provider_response_envelope_validation_result_receipt_review_preflight_not_ready/,
  );
  assert.match(
    report.readiness.blockers.join("|"),
    /read_only_provider_response_envelope_validation_result_receipt_review_preflight_validator_fixtures_not_ready/,
  );
});

test("blocks if private receipt, provider implementation, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "read_only_provider_response_envelope_validation_result_receipt.redacted.json"),
    path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "services", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "server", "src", "routes", "trading", "provider.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runRunbook(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

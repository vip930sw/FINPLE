const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json";
const INPUTS = [
  CONTRACT,
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_validator_fixtures.json",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
];
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-approval-packet-validation-result-receipt.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-receipt-review-preflight-"));
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

function runPreflight(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current read-only approval validation result receipt review preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight\.json/,
  );
});

test("records future owner receipt review while keeping private reads, provider calls, routes, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight, true);
  assert.equal(report.readiness.validationReceiptRecordedNow, false);
  assert.equal(report.readiness.validationReceiptReadAllowedNow, false);
  assert.equal(report.readiness.packetPathRecorded, false);
  assert.equal(report.readiness.rawValuesRecorded, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps review boundary redacted and requires separate import and provider authorization reviews", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const reviewGates = report.futureValidationResultReceiptReviewBoundary.reviewGates.join("|");

  assert.match(reviewGates, /explicit_owner_validation_receipt_path_required_later/);
  assert.match(reviewGates, /no_approval_packet_import/);
  assert.match(reviewGates, /no_provider_call/);
  assert.match(reviewGates, /requires_separate_approval_import_review/);
  assert.match(reviewGates, /requires_separate_provider_call_authorization_review/);
  assert.match(report.futureValidationResultReceiptReviewBoundary.forbiddenReviewContent.join("|"), /app_secret/);
  assert.doesNotMatch(serialized, /"app(Key|Secret)"|"access(Token)"/);
  assert.doesNotMatch(serialized, /raw(AccountIdentifier|OperatorName|EvidenceText|RevocationPlan|ProviderPayload)/);
});

test("rejects stale preflight if receipt, packet, provider, route, UI, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.validationReceiptReadAllowedNow = true;
  report.currentState.rawValuesRecorded = true;
  report.readiness.approvalPacketImportedNow = true;
  report.readiness.providerCallsAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight\.json is out of date/,
  );
});

test("blocks if upstream receipt contract, fixtures, approval import, or provider implementation open too early", () => {
  const workspace = makeWorkspace();
  const receiptContract = readJson(
    workspace,
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json",
  );
  receiptContract.readiness.rawValuesRecorded = true;
  writeJson(workspace, "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json", receiptContract);
  const fixtures = readJson(
    workspace,
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt_validator_fixtures.json",
  );
  fixtures.readiness.providerCallsAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt_validator_fixtures.json",
    fixtures,
  );
  const importPreflight = readJson(workspace, "trading_lab_step116_read_only_approval_import_implementation_preflight.json");
  importPreflight.readiness.readyForFutureReadOnlyApprovalImportImplementationReview = true;
  importPreflight.readiness.ownerPacketReadAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_read_only_approval_import_implementation_preflight.json", importPreflight);
  const providerPreflight = readJson(workspace, "trading_lab_step116_private_read_only_provider_implementation_preflight.json");
  providerPreflight.readiness.readyForFuturePrivateReadOnlyProviderImplementationReview = true;
  providerPreflight.readiness.providerImplementationAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_private_read_only_provider_implementation_preflight.json", providerPreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.receiptContractReady, false);
  assert.equal(report.checks.receiptValidatorFixturesReady, false);
  assert.equal(report.checks.approvalImportImplementationStillBlocked, false);
  assert.equal(report.checks.privateReadOnlyProviderImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_validation_result_receipt_contract_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_validation_result_receipt_validator_fixtures_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_implementation_preflight_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_read_only_provider_implementation_preflight_not_blocked/);
});

test("blocks if private receipt, approval packet, provider implementation, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "read_only_approval_validation_result_receipt.redacted.json"),
    path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "readOnlyApprovalImport.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "services", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "server", "src", "routes", "trading", "provider.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "migrations", "trading", "001.sql"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

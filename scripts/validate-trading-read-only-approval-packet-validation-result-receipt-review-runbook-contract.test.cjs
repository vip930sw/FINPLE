const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_contract.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-provider-response-receipt-review-runbook-validator-"));
  const filePath = path.join(dir, "provider-response-receipt-review-runbook-contract.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current read-only approval validation result receipt review runbook contract", () => {
  const result = runValidator(["--contract", CONTRACT_PATH]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseStdout(result).valid, true);
});

test("requires an explicit contract path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /contract_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing top-level fields and review assertions", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.requiredReviewAssertions =
    contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.requiredReviewAssertions.filter(
      (assertion) => assertion !== "review_does_not_record_receipt_path",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_review_assertion/);
});

test("rejects validation, receipt read, receipt record, or provider call actions enabled now", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.currentStepRunsValidator = true;
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.currentStepReadsReceipt = true;
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.currentStepRecordsReceipt = true;
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.currentStepCallsProvider = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /runbook_action_enabled/);
});

test("rejects incomplete redacted output fields and forbidden output content lists", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.redactedReviewOutputFields = [
    "approvalValidationReceiptReviewId",
  ];
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.forbiddenReviewOutputContent = ["app_key"];

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_redacted_review_output_field/);
  assert.match(codes, /missing_forbidden_review_output_content/);
});

test("rejects changed future receipt path or validator commands", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.futureValidationResultReceiptPath =
    "data/private/trading/live_order_receipt.json";
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.validatorCommandTemplate =
    "node scripts/validate-trading-read-only-approval-packet-validation-result-receipt.cjs";
  contract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook.reviewPreflightValidatorCommandTemplate =
    "node scripts/validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_validation_result_receipt_path/);
  assert.match(codes, /invalid_validator_command_template/);
  assert.match(codes, /invalid_review_preflight_validator_command_template/);
});

test("rejects trading allow flags and raw secret-shaped values", () => {
  const contract = currentContract();
  contract.currentState.validationReceiptReadAllowedNow = true;
  contract.currentState.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.checks.runtimeRouteAllowed = true;
  contract.evidence.leakedAccount = "12345678";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /allow_flag_enabled/);
  assert.match(codes, /forbidden_raw_value/);
});

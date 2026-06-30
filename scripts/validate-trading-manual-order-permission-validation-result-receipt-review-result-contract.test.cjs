const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-manual-order-permission-validation-result-receipt-review-result-contract.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-validation-receipt-review-result-validator-"));
  const filePath = path.join(dir, "manual-order-validation-receipt-review-result-contract.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current manual order permission validation result receipt review result contract", () => {
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

test("rejects missing top-level fields and review result assertions", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureValidationResultReceiptReviewResultBoundary.requiredReviewResultAssertions =
    contract.futureValidationResultReceiptReviewResultBoundary.requiredReviewResultAssertions.filter(
      (assertion) => assertion !== "review_result_does_not_record_receipt_path",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_review_result_assertion/);
});

test("rejects receipt read, review result record, or permission import actions enabled now", () => {
  const contract = currentContract();
  contract.futureValidationResultReceiptReviewResultBoundary.currentStepReadsReceipt = true;
  contract.futureValidationResultReceiptReviewResultBoundary.currentStepRecordsReviewResult = true;
  contract.futureValidationResultReceiptReviewResultBoundary.currentStepImportsPermissionPacket = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /review_result_action_enabled/);
});

test("rejects incomplete review result fields and forbidden output content lists", () => {
  const contract = currentContract();
  contract.futureValidationResultReceiptReviewResultBoundary.requiredReviewResultFields = [
    "validationReceiptReviewId",
  ];
  contract.futureValidationResultReceiptReviewResultBoundary.forbiddenReviewResultContent = ["app_key"];

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_review_result_field/);
  assert.match(codes, /missing_forbidden_review_result_content/);
});

test("rejects changed future receipt path", () => {
  const contract = currentContract();
  contract.futureValidationResultReceiptReviewResultBoundary.futureValidationResultReceiptPath =
    "data/private/trading/live_order_receipt.json";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_validation_result_receipt_path/);
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

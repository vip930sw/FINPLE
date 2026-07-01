const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-receipt-review-preflight-validator-"));
  const filePath = path.join(dir, "read-only-approval-receipt-review-preflight.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current read-only approval validation result receipt review preflight", () => {
  const result = runValidator(["--contract", CONTRACT_PATH]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseStdout(result).valid, true);
});

test("requires an explicit contract path and does not use private defaults", () => {
  const result = runValidator();

  assert.equal(result.status, 2);
  assert.match(result.stderr, /contract_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing top-level fields and review gates", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureValidationResultReceiptReviewBoundary.reviewGates =
    contract.futureValidationResultReceiptReviewBoundary.reviewGates.filter(
      (gate) => gate !== "requires_separate_provider_call_authorization_review",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_review_gate/);
});

test("rejects receipt, approval packet, provider, or order boundary actions enabled now", () => {
  const contract = currentContract();
  contract.futureValidationResultReceiptReviewBoundary.currentStepReadsReceipt = true;
  contract.futureValidationResultReceiptReviewBoundary.currentStepRecordsReceipt = true;
  contract.futureValidationResultReceiptReviewBoundary.currentStepReadsApprovalPacket = true;
  contract.futureValidationResultReceiptReviewBoundary.currentStepImportsApprovalPacket = true;
  contract.futureValidationResultReceiptReviewBoundary.currentStepCallsProvider = true;
  contract.futureValidationResultReceiptReviewBoundary.currentStepSubmitsOrder = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /boundary_action_enabled/);
});

test("rejects incomplete forbidden review content and changed future paths", () => {
  const contract = currentContract();
  contract.futureValidationResultReceiptReviewBoundary.futureValidationResultReceiptPath =
    "data/private/trading/live_order_receipt.json";
  contract.futureValidationResultReceiptReviewBoundary.futureApprovalPacketPath =
    "data/private/trading/live_order_permission.json";
  contract.futureValidationResultReceiptReviewBoundary.forbiddenReviewContent =
    contract.futureValidationResultReceiptReviewBoundary.forbiddenReviewContent.filter(
      (item) => item !== "raw_revocation_plan",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_validation_result_receipt_path/);
  assert.match(codes, /invalid_future_approval_packet_path/);
  assert.match(codes, /missing_forbidden_review_content/);
});

test("rejects trading allow flags and raw secret-shaped values without echoing the raw value", () => {
  const contract = currentContract();
  contract.currentState.validationReceiptReadAllowedNow = true;
  contract.currentState.rawValuesRecorded = true;
  contract.readiness.approvalPacketImportedNow = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.checks.runtimeRouteAllowed = true;
  contract.evidence.leakedSecretMarker = "app-secret-fixture-value";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /allow_flag_enabled/);
  assert.match(codes, /forbidden_raw_value/);
  assert.doesNotMatch(result.stdout, /app-secret-fixture-value/);
});

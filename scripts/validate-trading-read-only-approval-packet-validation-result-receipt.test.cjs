const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt.cjs",
);

function validReceipt(overrides = {}) {
  return {
    validationReceiptId: "validation_receipt_fixture_001",
    validationStatus: "valid",
    validatedAt: "2026-06-29T00:00:00.000Z",
    validatorVersionHash: "sha256:fixture_validator_version_hash_123456",
    approvalPacketShapeHash: "hmac-sha256:fixture_approval_packet_shape_hash_123456",
    errorCodeHashes: [],
    redactionVersion: "v1",
    packetPathRecorded: false,
    rawValuesRecorded: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    ...overrides,
  };
}

function makeReceiptFile(receipt) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-validation-result-receipt-"));
  const filePath = path.join(dir, "validation_result_receipt.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(receipt, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

test("validates a redacted read-only approval packet validation result receipt", () => {
  const receiptPath = makeReceiptFile(validReceipt());
  const result = runValidator(["--receipt", receiptPath]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit receipt path and does not use a default private approval packet path", () => {
  const result = runValidator();

  assert.equal(result.status, 2);
  assert.match(result.stderr, /receipt_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
  assert.doesNotMatch(result.stderr, /read_only_approval\.redacted\.json/);
});

test("rejects missing fields and unknown fields", () => {
  const receipt = validReceipt({ unexpected: "redacted_value" });
  delete receipt.approvalPacketShapeHash;
  const result = runValidator(["--receipt", makeReceiptFile(receipt)]);
  const codes = JSON.parse(result.stdout).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects malformed ids, hashes, timestamps, statuses, and redaction versions", () => {
  const result = runValidator([
    "--receipt",
    makeReceiptFile(
      validReceipt({
        validationReceiptId: "receipt_123",
        validationStatus: "approved",
        validatedAt: "2026-06-29",
        validatorVersionHash: "not-a-hash",
        approvalPacketShapeHash: "shape",
        errorCodeHashes: ["error_code_raw"],
        redactionVersion: "v2",
      }),
    ),
  ]);
  const codes = JSON.parse(result.stdout).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_validation_receipt_id/);
  assert.match(codes, /invalid_validation_status/);
  assert.match(codes, /malformed_timestamp/);
  assert.match(codes, /malformed_hash_field/);
  assert.match(codes, /malformed_error_code_hash/);
  assert.match(codes, /invalid_redaction_version/);
});

test("rejects enabled approval, provider, order, runtime, and UI flags", () => {
  const result = runValidator([
    "--receipt",
    makeReceiptFile(
      validReceipt({
        packetPathRecorded: true,
        rawValuesRecorded: true,
        approvalPacketImportedNow: true,
        providerCallsAllowed: true,
        orderSubmissionAllowed: true,
        runtimeRouteAllowed: true,
        publicUiAllowed: true,
      }),
    ),
  ]);
  const codes = JSON.parse(result.stdout).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /forbidden_flag_enabled/);
});

test("rejects private paths and raw or secret-like values without echoing them", () => {
  const result = runValidator([
    "--receipt",
    makeReceiptFile(
      validReceipt({
        errorCodeHashes: ["hmac-sha256:APP_SECRET_VALUE"],
        validationReceiptId: "validation_receipt_1234567890",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /forbidden_string_value/);
  assert.doesNotMatch(result.stdout, /APP_SECRET_VALUE/);
  assert.doesNotMatch(result.stdout, /1234567890/);
});

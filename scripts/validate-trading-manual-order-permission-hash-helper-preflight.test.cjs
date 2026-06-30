const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-manual-order-permission-hash-helper-preflight.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-hash-helper-preflight-validator-"));
  const filePath = path.join(dir, "manual-order-hash-helper-preflight.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current manual order permission hash helper preflight", () => {
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

test("rejects missing top-level fields and preflight checks", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.preflightChecks =
    contract.futureOwnerAssistedManualOrderHashPreparationBoundary.preflightChecks.filter(
      (check) => check !== "runtime_routes_remain_disabled",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_preflight_check/);
});

test("rejects helper, hash, raw input, pepper, and permission packet actions enabled now", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.currentStepRequestsRawInputs = true;
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.currentStepRequestsPrivatePepper = true;
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.currentStepImplementsHashHelper = true;
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.currentStepGeneratesHashes = true;
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.currentStepCreatesPermissionPacket = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /boundary_action_enabled/);
});

test("rejects incomplete future review inputs and forbidden preflight content lists", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.futureReviewInputs =
    contract.futureOwnerAssistedManualOrderHashPreparationBoundary.futureReviewInputs.filter(
      (input) => input !== "manual_review_before_permission_packet_import",
    );
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.forbiddenPreflightContent =
    contract.futureOwnerAssistedManualOrderHashPreparationBoundary.forbiddenPreflightContent.filter(
      (item) => item !== "live_order_endpoint",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_future_review_input/);
  assert.match(codes, /missing_forbidden_preflight_content/);
});

test("rejects changed future helper or permission packet paths", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.futureHashHelperPath =
    "scripts/create-live-order-hashes.cjs";
  contract.futureOwnerAssistedManualOrderHashPreparationBoundary.futurePermissionPacketPath =
    "data/private/trading/live_order_permission.json";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_hash_helper_path/);
  assert.match(codes, /invalid_future_permission_packet_path/);
});

test("rejects trading allow flags and raw secret-shaped values", () => {
  const contract = currentContract();
  contract.currentState.hashHelperImplementationAllowed = true;
  contract.currentState.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.checks.runtimeRouteAllowed = true;
  contract.evidence.leakedAccountShape = ["5019", "5326"].join("");

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /allow_flag_enabled/);
  assert.match(codes, /forbidden_raw_value/);
});

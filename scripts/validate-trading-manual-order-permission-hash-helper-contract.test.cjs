const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-manual-order-permission-hash-helper-contract.cjs");
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-hash-helper-contract-"));
  const filePath = path.join(dir, "manual-order-hash-helper-contract.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

function parseCodes(result) {
  return JSON.parse(result.stdout).errors.map((error) => error.code).join("|");
}

test("validates the current manual order permission hash helper contract", () => {
  const result = runValidator(["--contract", CONTRACT_PATH]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit contract path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /contract_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing top-level and hash input labels", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureLocalHashHelperBoundary.requiredHashInputLabels =
    contract.futureLocalHashHelperBoundary.requiredHashInputLabels.filter((label) => label !== "operatorAccessHash");

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseCodes(result);

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_hash_input_label/);
});

test("rejects helper implementation, hash creation, packet creation, or trading flags", () => {
  const contract = currentContract();
  contract.futureLocalHashHelperBoundary.currentStepImplementsHelper = true;
  contract.futureLocalHashHelperBoundary.currentStepCreatesHashes = true;
  contract.futureLocalHashHelperBoundary.currentStepCreatesPermissionPacket = true;
  contract.currentState.hashHelperImplementationAllowed = true;
  contract.currentState.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseCodes(result);

  assert.equal(result.status, 1);
  assert.match(codes, /boundary_action_enabled/);
  assert.match(codes, /allow_flag_enabled/);
});

test("rejects incomplete helper rules and forbidden input list", () => {
  const contract = currentContract();
  contract.futureLocalHashHelperBoundary.requiredHashHelperRules = ["hmac_sha256_required"];
  contract.futureLocalHashHelperBoundary.forbiddenHashInputs = ["app_key"];

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseCodes(result);

  assert.equal(result.status, 1);
  assert.match(codes, /missing_hash_helper_rule/);
  assert.match(codes, /missing_forbidden_hash_input/);
});

test("rejects unsafe secret boundary changes", () => {
  const contract = currentContract();
  contract.futureLocalHashHelperBoundary.acceptedHashAlgorithm = "SHA-256";
  contract.futureLocalHashHelperBoundary.requiredSecretBoundary.pepperRequired = false;
  contract.futureLocalHashHelperBoundary.requiredSecretBoundary.pepperStorage = "repo_env";
  contract.futureLocalHashHelperBoundary.requiredSecretBoundary.rawInputTransport = "argv";
  contract.futureLocalHashHelperBoundary.requiredSecretBoundary.commandLineRawSecretsAllowed = true;
  contract.futureLocalHashHelperBoundary.requiredSecretBoundary.rawInputLoggingAllowed = true;
  contract.futureLocalHashHelperBoundary.requiredSecretBoundary.rawInputPersistenceAllowed = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseCodes(result);

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_hash_algorithm/);
  assert.match(codes, /pepper_not_required/);
  assert.match(codes, /invalid_pepper_storage/);
  assert.match(codes, /invalid_raw_input_transport/);
  assert.match(codes, /secret_boundary_flag_enabled/);
});

test("rejects unsafe sample output values", () => {
  const contract = currentContract();
  contract.futureLocalHashHelperBoundary.sampleOutputShape.operatorAccessHash = ["5019", "5326"].join("");
  contract.futureLocalHashHelperBoundary.sampleOutputShape.approvedByHash = "sha256:<operator_hash>";
  contract.futureLocalHashHelperBoundary.sampleOutputShape.allowedSymbolHashes = ["QQQ"];

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseCodes(result);

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_sample_hash_placeholder/);
  assert.match(codes, /sample_forbidden_value/);
});

test("rejects changed future helper or permission packet paths", () => {
  const contract = currentContract();
  contract.futureLocalHashHelperBoundary.futureHashHelperPath = "scripts/hash-live-order-secret.cjs";
  contract.futureLocalHashHelperBoundary.futurePermissionPacketPath =
    "data/private/trading/live_order_permission.json";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseCodes(result);

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_hash_helper_path/);
  assert.match(codes, /invalid_future_permission_packet_path/);
});

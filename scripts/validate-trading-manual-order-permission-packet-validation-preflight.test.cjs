const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-manual-order-permission-packet-validation-preflight.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-packet-validation-preflight-validator-"));
  const filePath = path.join(dir, "manual-order-packet-validation-preflight.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current manual order permission packet validation preflight", () => {
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

test("rejects missing top-level fields and preflight gates", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureOwnerAssistedValidationBoundary.preflightGates =
    contract.futureOwnerAssistedValidationBoundary.preflightGates.filter(
      (gate) => gate !== "env_risk_gate_fail_closed",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_preflight_gate/);
});

test("rejects private packet read, validation run, or packet import actions enabled now", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedValidationBoundary.currentStepReadsPrivatePacket = true;
  contract.futureOwnerAssistedValidationBoundary.currentStepRunsValidator = true;
  contract.futureOwnerAssistedValidationBoundary.currentStepImportsPacket = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /boundary_action_enabled/);
});

test("rejects incomplete validation rules and forbidden preflight content lists", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedValidationBoundary.validationRules =
    contract.futureOwnerAssistedValidationBoundary.validationRules.filter(
      (rule) => rule !== "validation_success_does_not_import_packet",
    );
  contract.futureOwnerAssistedValidationBoundary.forbiddenPreflightContent =
    contract.futureOwnerAssistedValidationBoundary.forbiddenPreflightContent.filter(
      (item) => item !== "live_order_endpoint",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_validation_rule/);
  assert.match(codes, /missing_forbidden_preflight_content/);
});

test("rejects changed future packet or validator paths", () => {
  const contract = currentContract();
  contract.futureOwnerAssistedValidationBoundary.futurePermissionPacketPath =
    "data/private/trading/live_order_permission.json";
  contract.futureOwnerAssistedValidationBoundary.futureValidatorPath =
    "scripts/validate-live-order-permission-packet.cjs";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_permission_packet_path/);
  assert.match(codes, /invalid_future_validator_path/);
});

test("rejects trading allow flags and raw secret-shaped values", () => {
  const contract = currentContract();
  contract.currentState.ownerPacketReadAllowedNow = true;
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

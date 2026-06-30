const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-redacted-manual-order-permission-template.cjs");
const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_redacted_manual_order_permission_template.json");

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-manual-order-template-validator-"));
  const filePath = path.join(dir, "redacted-manual-order-template.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current redacted manual order permission template", () => {
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

test("rejects missing top-level fields and template fields", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureRedactedManualOrderPermissionTemplate.requiredTemplateFields =
    contract.futureRedactedManualOrderPermissionTemplate.requiredTemplateFields.filter(
      (field) => field !== "approvedByHash",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_template_field/);
});

test("rejects template packet creation or import actions enabled now", () => {
  const contract = currentContract();
  contract.futureRedactedManualOrderPermissionTemplate.currentStepCreatesPacket = true;
  contract.futureRedactedManualOrderPermissionTemplate.currentStepImportsPacket = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /template_action_enabled/);
});

test("rejects incomplete assertions and forbidden content lists", () => {
  const contract = currentContract();
  contract.futureRedactedManualOrderPermissionTemplate.requiredTemplateAssertions =
    contract.futureRedactedManualOrderPermissionTemplate.requiredTemplateAssertions.filter(
      (assertion) => assertion !== "template_forbids_raw_order_payloads",
    );
  contract.futureRedactedManualOrderPermissionTemplate.forbiddenTemplateContent =
    contract.futureRedactedManualOrderPermissionTemplate.forbiddenTemplateContent.filter(
      (item) => item !== "live_order_endpoint",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_template_assertion/);
  assert.match(codes, /missing_forbidden_template_content/);
});

test("rejects changed future permission packet path", () => {
  const contract = currentContract();
  contract.futureRedactedManualOrderPermissionTemplate.futurePermissionPacketPath =
    "data/private/trading/live_order_permission.json";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_permission_packet_path/);
});

test("rejects trading allow flags and raw secret-shaped values", () => {
  const contract = currentContract();
  contract.currentState.permissionPacketCreatedNow = true;
  contract.currentState.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.checks.runtimeRouteAllowed = true;
  contract.evidence.leakedAccount = ["5019", "5326"].join("");

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /allow_flag_enabled/);
  assert.match(codes, /forbidden_raw_value/);
});

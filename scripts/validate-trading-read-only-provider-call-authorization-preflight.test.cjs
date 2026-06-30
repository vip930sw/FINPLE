const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const {
  validateReadOnlyProviderCallAuthorizationPreflightContract,
} = require("./validate-trading-read-only-provider-call-authorization-preflight.cjs");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-read-only-provider-call-authorization-preflight.cjs");
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);

function readContract() {
  return JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function errorCodes(result) {
  return result.errors.map((error) => error.code);
}

function writeTempContract(contract) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-call-auth-validator-"));
  const contractPath = path.join(workspace, "contract.json");
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
  return contractPath;
}

test("validates current read-only provider call authorization preflight contract", () => {
  const result = validateReadOnlyProviderCallAuthorizationPreflightContract(readContract());

  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("requires explicit contract path on the CLI", () => {
  const result = spawnSync(process.execPath, [SCRIPT_PATH], { encoding: "utf8" });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /contract_path_required/);
});

test("CLI validates an explicit contract path", () => {
  const contractPath = writeTempContract(readContract());
  const result = spawnSync(process.execPath, [SCRIPT_PATH, "--contract", contractPath], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"valid": true/);
});

test("rejects missing top-level fields and missing review gates", () => {
  const contract = readContract();
  delete contract.outputFiles;
  contract.futureReadOnlyProviderCallAuthorizationBoundary.reviewGates =
    contract.futureReadOnlyProviderCallAuthorizationBoundary.reviewGates.filter(
      (gate) => gate !== "env_risk_gate_fail_closed",
    );

  const result = validateReadOnlyProviderCallAuthorizationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /missing_required_field/);
  assert.match(errorCodes(result).join("|"), /missing_review_gate/);
});

test("rejects boundary actions that would authorize provider work", () => {
  const contract = readContract();
  contract.futureReadOnlyProviderCallAuthorizationBoundary.currentStepAuthorizesProviderCalls = true;
  contract.futureReadOnlyProviderCallAuthorizationBoundary.currentStepCreatesProviderRequest = true;
  contract.futureReadOnlyProviderCallAuthorizationBoundary.currentStepCallsProvider = true;
  contract.futureReadOnlyProviderCallAuthorizationBoundary.currentStepRefreshesToken = true;
  contract.futureReadOnlyProviderCallAuthorizationBoundary.currentStepWritesDatabase = true;

  const result = validateReadOnlyProviderCallAuthorizationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /provider_call_authorization_action_enabled/);
});

test("rejects missing authorization rules and forbidden preflight content catalog entries", () => {
  const contract = readContract();
  contract.futureReadOnlyProviderCallAuthorizationBoundary.authorizationRules =
    contract.futureReadOnlyProviderCallAuthorizationBoundary.authorizationRules.filter(
      (rule) => rule !== "no_provider_call_now",
    );
  contract.futureReadOnlyProviderCallAuthorizationBoundary.forbiddenPreflightContent =
    contract.futureReadOnlyProviderCallAuthorizationBoundary.forbiddenPreflightContent.filter(
      (content) => content !== "live_order_endpoint",
    );

  const result = validateReadOnlyProviderCallAuthorizationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /missing_authorization_rule/);
  assert.match(errorCodes(result).join("|"), /missing_forbidden_preflight_content/);
});

test("rejects changed future provider service path", () => {
  const contract = readContract();
  contract.futureReadOnlyProviderCallAuthorizationBoundary.futureProviderCallServicePath = path.join(
    "server",
    "src",
    "services",
    "trading",
    "providerCaller.js",
  );

  const result = validateReadOnlyProviderCallAuthorizationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /invalid_future_provider_call_service_path/);
});

test("rejects opened allow flags and raw-shaped values outside catalogs", () => {
  const contract = clone(readContract());
  contract.currentState.providerCallAuthorizationAllowedNow = true;
  contract.checks.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.evidence.syntheticRawShape = ["5019", "5326"].join("");

  const result = validateReadOnlyProviderCallAuthorizationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /allow_flag_enabled/);
  assert.match(errorCodes(result).join("|"), /forbidden_raw_value/);
});

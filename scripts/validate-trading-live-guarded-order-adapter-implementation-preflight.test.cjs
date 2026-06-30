const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-live-guarded-order-adapter-implementation-preflight.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-guarded-adapter-preflight-validator-"));
  const filePath = path.join(dir, "live-guarded-adapter-preflight.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current live-guarded order adapter implementation preflight", () => {
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

test("rejects missing top-level fields and review gates", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureLiveGuardedOrderAdapterBoundary.reviewGates =
    contract.futureLiveGuardedOrderAdapterBoundary.reviewGates.filter(
      (gate) => gate !== "env_risk_gate_fail_closed",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_review_gate/);
});

test("rejects order adapter, provider, order, route, UI, or permission actions enabled now", () => {
  const contract = currentContract();
  contract.futureLiveGuardedOrderAdapterBoundary.currentStepImplementsOrderAdapter = true;
  contract.futureLiveGuardedOrderAdapterBoundary.currentStepImportsManualPermission = true;
  contract.futureLiveGuardedOrderAdapterBoundary.currentStepCallsProvider = true;
  contract.futureLiveGuardedOrderAdapterBoundary.currentStepSubmitsOrder = true;
  contract.futureLiveGuardedOrderAdapterBoundary.currentStepCreatesRuntimeRoute = true;
  contract.futureLiveGuardedOrderAdapterBoundary.currentStepCreatesPublicUi = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /boundary_action_enabled/);
});

test("rejects incomplete implementation rules and forbidden content lists", () => {
  const contract = currentContract();
  contract.futureLiveGuardedOrderAdapterBoundary.implementationRules =
    contract.futureLiveGuardedOrderAdapterBoundary.implementationRules.filter(
      (rule) => rule !== "kill_switch_before_request_signing",
    );
  contract.futureLiveGuardedOrderAdapterBoundary.forbiddenPreflightContent =
    contract.futureLiveGuardedOrderAdapterBoundary.forbiddenPreflightContent.filter(
      (item) => item !== "live_order_endpoint",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_implementation_rule/);
  assert.match(codes, /missing_forbidden_preflight_content/);
});

test("rejects changed future order adapter path", () => {
  const contract = currentContract();
  contract.futureLiveGuardedOrderAdapterBoundary.futureOrderAdapterPath =
    "server/src/services/trading/liveOrderAdapter.js";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_order_adapter_path/);
});

test("rejects trading allow flags and raw secret-shaped values", () => {
  const contract = currentContract();
  contract.currentState.orderAdapterImplementationAllowedNow = true;
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

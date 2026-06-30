const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-manual-order-permission-hash-helper-implementation-review-contract.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
);

function currentContract(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")),
    ...overrides,
  };
}

function makeContractFile(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-hash-helper-review-validator-"));
  const filePath = path.join(dir, "manual-order-hash-helper-review-contract.json");
  fs.writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

function parseStdout(result) {
  return JSON.parse(result.stdout);
}

test("validates the current manual order permission hash helper implementation review contract", () => {
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

test("rejects missing top-level fields and implementation review criteria", () => {
  const contract = currentContract();
  delete contract.outputFiles;
  contract.futureLocalOnlyImplementationReviewBoundary.implementationReviewCriteria =
    contract.futureLocalOnlyImplementationReviewBoundary.implementationReviewCriteria.filter(
      (criterion) => criterion !== "synthetic_test_vectors_only",
    );

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_implementation_review_criterion/);
});

test("rejects helper creation, run, raw input, or private pepper actions enabled now", () => {
  const contract = currentContract();
  contract.futureLocalOnlyImplementationReviewBoundary.currentStepCreatesHelper = true;
  contract.futureLocalOnlyImplementationReviewBoundary.currentStepRunsHelper = true;
  contract.futureLocalOnlyImplementationReviewBoundary.currentStepRequestsRawInputs = true;
  contract.futureLocalOnlyImplementationReviewBoundary.currentStepRequestsPrivatePepper = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /boundary_action_enabled/);
});

test("rejects incomplete helper output labels and forbidden review content lists", () => {
  const contract = currentContract();
  contract.futureLocalOnlyImplementationReviewBoundary.helperOutputLabels = ["approvedByHash"];
  contract.futureLocalOnlyImplementationReviewBoundary.forbiddenReviewContent = ["app_key"];

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_helper_output_label/);
  assert.match(codes, /missing_forbidden_review_content/);
});

test("rejects changed helper or permission packet paths", () => {
  const contract = currentContract();
  contract.futureLocalOnlyImplementationReviewBoundary.futureHashHelperPath = "scripts/hash-live-order-secret.cjs";
  contract.futureLocalOnlyImplementationReviewBoundary.futurePermissionPacketPath =
    "data/private/trading/live_order_permission.json";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_hash_helper_path/);
  assert.match(codes, /invalid_future_permission_packet_path/);
});

test("rejects test or execution boundaries that allow real credentials, network, or packet writes", () => {
  const contract = currentContract();
  contract.futureLocalOnlyImplementationReviewBoundary.requiredTestBoundary.realKisCredentialFixturesAllowed = true;
  contract.futureLocalOnlyImplementationReviewBoundary.requiredExecutionBoundary.networkAccessAllowed = true;
  contract.futureLocalOnlyImplementationReviewBoundary.requiredExecutionBoundary.writesPermissionPacketByDefault = true;

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /test_boundary_flag_enabled/);
  assert.match(codes, /execution_boundary_flag_enabled/);
});

test("rejects trading allow flags and raw secret-shaped values", () => {
  const contract = currentContract();
  contract.currentState.hashGenerationAllowed = true;
  contract.currentState.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.checks.runtimeRouteAllowed = true;
  contract.evidence.leakedAccount = "50195326";

  const result = runValidator(["--contract", makeContractFile(contract)]);
  const codes = parseStdout(result).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /allow_flag_enabled/);
  assert.match(codes, /forbidden_raw_value/);
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const {
  validateReadOnlyProviderEndpointCategoryValidationPreflightContract,
} = require("./validate-trading-read-only-provider-endpoint-category-validation-preflight.cjs");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "validate-trading-read-only-provider-endpoint-category-validation-preflight.cjs",
);
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-category-preflight-validator-"));
  const contractPath = path.join(workspace, "contract.json");
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
  return contractPath;
}

test("validates current read-only provider endpoint category validation preflight", () => {
  const result = validateReadOnlyProviderEndpointCategoryValidationPreflightContract(readContract());

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

test("rejects missing top-level fields and missing required categories", () => {
  const contract = readContract();
  delete contract.outputFiles;
  contract.futureReadOnlyProviderEndpointCategoryValidationBoundary.allowedEndpointCategories =
    contract.futureReadOnlyProviderEndpointCategoryValidationBoundary.allowedEndpointCategories.filter(
      (category) => category !== "current_quotes_read",
    );

  const result = validateReadOnlyProviderEndpointCategoryValidationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /missing_required_field/);
  assert.match(errorCodes(result).join("|"), /missing_allowed_endpoint_category/);
});

test("rejects unknown categories and missing validation rules", () => {
  const contract = readContract();
  contract.futureReadOnlyProviderEndpointCategoryValidationBoundary.allowedEndpointCategories.push(
    "order_submit",
  );
  contract.futureReadOnlyProviderEndpointCategoryValidationBoundary.validationRules =
    contract.futureReadOnlyProviderEndpointCategoryValidationBoundary.validationRules.filter(
      (rule) => rule !== "unknown_endpoint_category_fails_closed",
    );

  const result = validateReadOnlyProviderEndpointCategoryValidationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /unknown_allowed_endpoint_category/);
  assert.match(errorCodes(result).join("|"), /missing_validation_rule/);
});

test("rejects category evidence drift", () => {
  const contract = readContract();
  contract.evidence.requestEnvelopeCategories = contract.evidence.requestEnvelopeCategories.filter(
    (category) => category !== "current_quotes_read",
  );
  contract.evidence.allowlistVsRequestEnvelopeDiff = ["current_quotes_read"];

  const result = validateReadOnlyProviderEndpointCategoryValidationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /endpoint_category_evidence_mismatch/);
  assert.match(errorCodes(result).join("|"), /endpoint_category_evidence_not_empty/);
});

test("rejects opened allow flags and provider-specific raw-shaped values", () => {
  const contract = clone(readContract());
  contract.currentState.categoryValidatorImplementationAllowedNow = true;
  contract.checks.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.evidence.syntheticProviderPath = "/uapi/domestic-stock/v1/trading/inquire-balance";
  contract.evidence.syntheticTransactionId = "VTTC8434R";

  const result = validateReadOnlyProviderEndpointCategoryValidationPreflightContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /allow_flag_enabled/);
  assert.match(errorCodes(result).join("|"), /forbidden_raw_value/);
});

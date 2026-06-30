const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const {
  validateReadOnlyProviderEndpointAllowlistContract,
} = require("./validate-trading-read-only-provider-endpoint-allowlist-contract.cjs");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-read-only-provider-endpoint-allowlist-contract.cjs");
const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-endpoint-allowlist-validator-"));
  const contractPath = path.join(workspace, "contract.json");
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
  return contractPath;
}

test("validates current read-only provider endpoint allowlist contract", () => {
  const result = validateReadOnlyProviderEndpointAllowlistContract(readContract());

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

test("rejects missing top-level fields and missing endpoint catalog entries", () => {
  const contract = readContract();
  delete contract.outputFiles;
  contract.futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories =
    contract.futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories.filter(
      (category) => category !== "current_quotes_read",
    );
  contract.futureReadOnlyProviderEndpointAllowlistBoundary.forbiddenEndpointCategories =
    contract.futureReadOnlyProviderEndpointAllowlistBoundary.forbiddenEndpointCategories.filter(
      (category) => category !== "order_submit",
    );

  const result = validateReadOnlyProviderEndpointAllowlistContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /missing_required_field/);
  assert.match(errorCodes(result).join("|"), /missing_allowed_endpoint_category/);
  assert.match(errorCodes(result).join("|"), /missing_forbidden_endpoint_category/);
});

test("rejects unknown allowed categories and allowed/forbidden overlap", () => {
  const contract = readContract();
  contract.futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories.push("portfolio_report_download");
  contract.futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories.push("order_submit");

  const result = validateReadOnlyProviderEndpointAllowlistContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /unknown_allowed_endpoint_category/);
  assert.match(errorCodes(result).join("|"), /allowed_endpoint_category_overlaps_forbidden/);
});

test("rejects missing endpoint rules and forbidden preflight content", () => {
  const contract = readContract();
  contract.futureReadOnlyProviderEndpointAllowlistBoundary.endpointRules =
    contract.futureReadOnlyProviderEndpointAllowlistBoundary.endpointRules.filter(
      (rule) => rule !== "unknown_endpoint_category_fails_closed",
    );
  contract.futureReadOnlyProviderEndpointAllowlistBoundary.forbiddenPreflightContent =
    contract.futureReadOnlyProviderEndpointAllowlistBoundary.forbiddenPreflightContent.filter(
      (content) => content !== "provider_url_path",
    );

  const result = validateReadOnlyProviderEndpointAllowlistContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /missing_endpoint_rule/);
  assert.match(errorCodes(result).join("|"), /missing_forbidden_preflight_content/);
});

test("rejects opened allow flags and provider-specific raw-shaped values", () => {
  const contract = clone(readContract());
  contract.currentState.providerSpecificEndpointPathsRecordedNow = true;
  contract.checks.providerCallsAllowed = true;
  contract.readiness.orderSubmissionAllowed = true;
  contract.evidence.syntheticProviderPath = "/uapi/domestic-stock/v1/trading/inquire-balance";
  contract.evidence.syntheticTransactionId = "VTTC8434R";

  const result = validateReadOnlyProviderEndpointAllowlistContract(contract);

  assert.equal(result.valid, false);
  assert.match(errorCodes(result).join("|"), /allow_flag_enabled/);
  assert.match(errorCodes(result).join("|"), /forbidden_raw_value/);
});

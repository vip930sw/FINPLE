const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_TOP_LEVEL_FIELDS = [
  "contractVersion",
  "auditedAt",
  "step",
  "scope",
  "sourceFiles",
  "outputFiles",
  "currentState",
  "futureReadOnlyProviderCallAuthorizationBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_REVIEW_GATES = [
  "owner_read_only_approval_import_still_blocked",
  "private_read_only_provider_implementation_still_blocked",
  "response_validation_result_receipt_review_result_contract_ready",
  "response_validation_result_receipt_review_result_validator_fixtures_ready",
  "request_envelope_validation_preflight_ready",
  "request_envelope_contract_ready",
  "response_envelope_contract_ready",
  "snapshot_normalization_contract_ready",
  "snapshot_risk_input_contract_ready",
  "private_shadow_runtime_review_still_blocked",
  "env_risk_gate_fail_closed",
];

const REQUIRED_AUTHORIZATION_RULES = [
  "private_worker_only",
  "read_only_endpoints_only",
  "explicit_validated_request_envelope_required_later",
  "explicit_imported_owner_packet_required_later",
  "no_provider_call_now",
  "no_token_refresh_now",
  "no_order_endpoint",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "redacted_error_messages_only",
  "fail_closed_without_owner_approval_import",
  "fail_closed_without_provider_implementation_review",
];

const REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];

const FUTURE_PROVIDER_CALL_SERVICE_PATH = path.join(
  "server",
  "src",
  "services",
  "trading",
  "kisReadOnlyProvider.js",
);

const BOUNDARY_ACTION_FLAGS = [
  "currentStepAuthorizesProviderCalls",
  "currentStepCreatesProviderRequest",
  "currentStepCallsProvider",
  "currentStepRefreshesToken",
  "currentStepWritesDatabase",
];

const FAIL_CLOSED_ALLOW_FLAGS = [
  "providerCallAuthorizationAllowedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
  "productionSecretsRequiredNow",
];

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?account/i,
  /raw[_-]?provider/i,
  /raw[_-]?order/i,
  /order[_-]?confirmation/i,
  /execution[_-]?id/i,
  /fill[_-]?payload/i,
  /live[_-]?order[_-]?endpoint/i,
  /scenario[_-]?monthly[_-]?return/i,
];

function makeError(code, pathName, message) {
  return { code, path: pathName, message };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function missingValues(actual, required) {
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  return required.filter((value) => !actualSet.has(value));
}

function pushMissingArrayErrors(errors, values, requiredValues, field, code) {
  if (!Array.isArray(values)) {
    errors.push(makeError("field_must_be_array", field, `${field} must be an array`));
    return;
  }
  missingValues(values, requiredValues).forEach((value) => {
    errors.push(makeError(code, field, `${field} is missing ${value}`));
  });
}

function collectStringValues(value, valuePath = "$", output = []) {
  if (typeof value === "string") {
    output.push({ path: valuePath, value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectStringValues(entry, `${valuePath}[${index}]`, output));
    return output;
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, entry]) => collectStringValues(entry, `${valuePath}.${key}`, output));
  }
  return output;
}

function isAllowedCatalogPath(valuePath) {
  return (
    valuePath.includes(".forbiddenPreflightContent[") ||
    valuePath.endsWith(".forbiddenPreflightContent") ||
    valuePath.includes(".authorizationRules[") ||
    valuePath.endsWith(".authorizationRules") ||
    valuePath.includes(".reviewGates[") ||
    valuePath.endsWith(".reviewGates")
  );
}

function validateCallAuthorizationBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futureReadOnlyProviderCallAuthorizationBoundary",
        "call authorization boundary must be an object",
      ),
    );
    return;
  }
  if (boundary.futureProviderCallServicePath !== FUTURE_PROVIDER_CALL_SERVICE_PATH) {
    errors.push(
      makeError(
        "invalid_future_provider_call_service_path",
        "futureReadOnlyProviderCallAuthorizationBoundary.futureProviderCallServicePath",
        "future provider call service path must stay fixed",
      ),
    );
  }
  for (const flag of BOUNDARY_ACTION_FLAGS) {
    if (boundary[flag] !== false) {
      errors.push(
        makeError(
          "provider_call_authorization_action_enabled",
          `futureReadOnlyProviderCallAuthorizationBoundary.${flag}`,
          `${flag} must be false`,
        ),
      );
    }
  }
  pushMissingArrayErrors(
    errors,
    boundary.reviewGates,
    REQUIRED_REVIEW_GATES,
    "futureReadOnlyProviderCallAuthorizationBoundary.reviewGates",
    "missing_review_gate",
  );
  pushMissingArrayErrors(
    errors,
    boundary.authorizationRules,
    REQUIRED_AUTHORIZATION_RULES,
    "futureReadOnlyProviderCallAuthorizationBoundary.authorizationRules",
    "missing_authorization_rule",
  );
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenPreflightContent,
    REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT,
    "futureReadOnlyProviderCallAuthorizationBoundary.forbiddenPreflightContent",
    "missing_forbidden_preflight_content",
  );
}

function validateReadOnlyProviderCallAuthorizationPreflightContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateCallAuthorizationBoundary(errors, contract.futureReadOnlyProviderCallAuthorizationBoundary);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of FAIL_CLOSED_ALLOW_FLAGS) {
      if (Object.hasOwn(container, flag) && container[flag] !== false) {
        errors.push(makeError("allow_flag_enabled", `${containerName}.${flag}`, `${flag} must be false`));
      }
    }
  }

  for (const { path: valuePath, value } of collectStringValues(contract)) {
    if (isAllowedCatalogPath(valuePath)) {
      continue;
    }
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("forbidden_raw_value", valuePath, "contract contains a forbidden raw value shape"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { contractPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--contract") {
      args.contractPath = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--help") {
      args.help = true;
    } else {
      args.unknown = arg;
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log("Usage: node scripts/validate-trading-read-only-provider-call-authorization-preflight.cjs --contract <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.contractPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("contract_path_required", "$", "--contract is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(args.contractPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("contract_read_failed", "$", "contract could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateReadOnlyProviderCallAuthorizationPreflightContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateReadOnlyProviderCallAuthorizationPreflightContract,
};

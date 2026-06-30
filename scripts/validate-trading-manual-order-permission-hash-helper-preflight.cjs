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
  "futureOwnerAssistedManualOrderHashPreparationBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_PREFLIGHT_CHECKS = [
  "prior_manual_order_permission_hash_helper_contract_ready",
  "owner_hash_preparation_deferred",
  "helper_implementation_not_created_now",
  "hash_generation_not_run_now",
  "private_pepper_not_requested_now",
  "raw_inputs_not_requested_now",
  "manual_permission_packet_not_created_now",
  "manual_permission_packet_not_imported_now",
  "provider_calls_remain_disabled",
  "order_submission_remains_disabled",
  "runtime_routes_remain_disabled",
];

const REQUIRED_FUTURE_REVIEW_INPUTS = [
  "explicit_owner_request_to_prepare_manual_order_hashes",
  "local_only_execution_surface",
  "private_pepper_source_outside_repo",
  "stdin_or_interactive_raw_input_collection",
  "no_command_line_raw_secret_arguments",
  "no_raw_input_logs",
  "no_raw_input_file_persistence",
  "deterministic_labelled_hash_output",
  "manual_review_before_permission_packet_import",
];

const REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];

const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-manual-order-permission-hashes.cjs");

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?account/i,
  /raw[_-]?operator/i,
  /raw[_-]?session/i,
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

function validateFutureBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futureOwnerAssistedManualOrderHashPreparationBoundary",
        "future hash preparation boundary must be an object",
      ),
    );
    return;
  }
  if (boundary.futureHashHelperPath !== FUTURE_HASH_HELPER_PATH) {
    errors.push(
      makeError(
        "invalid_future_hash_helper_path",
        "futureOwnerAssistedManualOrderHashPreparationBoundary.futureHashHelperPath",
        "future hash helper path must stay fixed",
      ),
    );
  }
  if (boundary.futurePermissionPacketPath !== FUTURE_PERMISSION_PACKET_PATH) {
    errors.push(
      makeError(
        "invalid_future_permission_packet_path",
        "futureOwnerAssistedManualOrderHashPreparationBoundary.futurePermissionPacketPath",
        "future permission packet path must stay fixed",
      ),
    );
  }
  for (const flag of [
    "currentStepRequestsRawInputs",
    "currentStepRequestsPrivatePepper",
    "currentStepImplementsHashHelper",
    "currentStepGeneratesHashes",
    "currentStepCreatesPermissionPacket",
  ]) {
    if (boundary[flag] !== false) {
      errors.push(
        makeError(
          "boundary_action_enabled",
          `futureOwnerAssistedManualOrderHashPreparationBoundary.${flag}`,
          `${flag} must be false`,
        ),
      );
    }
  }
  pushMissingArrayErrors(
    errors,
    boundary.preflightChecks,
    REQUIRED_PREFLIGHT_CHECKS,
    "futureOwnerAssistedManualOrderHashPreparationBoundary.preflightChecks",
    "missing_preflight_check",
  );
  pushMissingArrayErrors(
    errors,
    boundary.futureReviewInputs,
    REQUIRED_FUTURE_REVIEW_INPUTS,
    "futureOwnerAssistedManualOrderHashPreparationBoundary.futureReviewInputs",
    "missing_future_review_input",
  );
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenPreflightContent,
    REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT,
    "futureOwnerAssistedManualOrderHashPreparationBoundary.forbiddenPreflightContent",
    "missing_forbidden_preflight_content",
  );
}

function validateManualOrderPermissionHashHelperPreflight(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateFutureBoundary(errors, contract.futureOwnerAssistedManualOrderHashPreparationBoundary);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "hashHelperImplementationAllowed",
      "hashGenerationAllowed",
      "permissionPacketCreatedNow",
      "permissionPacketImportedNow",
      "providerCallsAllowed",
      "orderSubmissionAllowed",
      "dbMigrationAllowed",
      "runtimeRouteAllowed",
      "publicUiAllowed",
      "liveTradingAllowed",
    ]) {
      if (Object.hasOwn(container, flag) && container[flag] !== false) {
        errors.push(makeError("allow_flag_enabled", `${containerName}.${flag}`, `${flag} must be false`));
      }
    }
  }

  for (const { path: valuePath, value } of collectStringValues(contract)) {
    if (
      valuePath.endsWith(".forbiddenPreflightContent") ||
      valuePath.includes(".forbiddenPreflightContent[")
    ) {
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
    console.log(
      "Usage: node scripts/validate-trading-manual-order-permission-hash-helper-preflight.cjs --contract <path>",
    );
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
  const result = validateManualOrderPermissionHashHelperPreflight(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateManualOrderPermissionHashHelperPreflight,
};

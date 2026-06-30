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
  "futureLocalHashHelperBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_HASH_INPUT_LABELS = [
  "approvedByHash",
  "operatorAccessHash",
  "manualApprovalPolicyHash",
  "orderAdapterDesignReviewHash",
  "killSwitchClearanceHash",
  "riskGateClearanceHash",
  "orderCredentialBoundaryHash",
  "dryRunReplayHash",
  "shadowHistoryReviewHash",
  "auditLoggerReadinessHash",
  "allowedSymbolHashes",
  "revocationPlanHash",
];

const REQUIRED_HASH_HELPER_RULES = [
  "hmac_sha256_required",
  "private_pepper_required",
  "pepper_must_not_be_committed",
  "raw_inputs_from_stdin_or_interactive_prompt_only",
  "raw_inputs_not_allowed_in_command_args",
  "raw_inputs_not_logged",
  "raw_inputs_not_persisted",
  "symbol_inputs_must_be_normalized_before_hashing",
  "output_labels_are_deterministic",
  "helper_does_not_create_permission_packet",
  "helper_does_not_import_permission_packet",
  "helper_does_not_enable_provider_calls",
  "helper_does_not_enable_order_submission",
  "helper_does_not_create_runtime_route",
];

const REQUIRED_FORBIDDEN_HASH_INPUTS = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number_output",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_provider_payload",
  "raw_order_payload",
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

const FORBIDDEN_OUTPUT_PATTERNS = [
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

function isLabelledPlaceholderHash(value) {
  return typeof value === "string" && /^hmac-sha256:<[^<>]+>$/.test(value);
}

function missingValues(actual, required) {
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  return required.filter((value) => !actualSet.has(value));
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

function pushMissingArrayErrors(errors, values, requiredValues, field, code) {
  if (!Array.isArray(values)) {
    errors.push(makeError("field_must_be_array", field, `${field} must be an array`));
    return;
  }
  missingValues(values, requiredValues).forEach((value) => {
    errors.push(makeError(code, field, `${field} is missing ${value}`));
  });
}

function validateSampleOutputShape(sample, errors) {
  if (!isPlainObject(sample)) {
    errors.push(makeError("sample_output_must_be_object", "sampleOutputShape", "sampleOutputShape must be an object"));
    return;
  }
  pushMissingArrayErrors(errors, Object.keys(sample), REQUIRED_HASH_INPUT_LABELS, "sampleOutputShape", "sample_output_missing_label");
  for (const label of REQUIRED_HASH_INPUT_LABELS) {
    const value = sample[label];
    if (label === "allowedSymbolHashes") {
      if (!Array.isArray(value) || value.some((entry) => !isLabelledPlaceholderHash(entry))) {
        errors.push(
          makeError("invalid_sample_hash_placeholder", `sampleOutputShape.${label}`, `${label} must be HMAC hash placeholders`),
        );
      }
      continue;
    }
    if (!isLabelledPlaceholderHash(value)) {
      errors.push(makeError("invalid_sample_hash_placeholder", `sampleOutputShape.${label}`, `${label} must be an HMAC hash placeholder`));
    }
  }
  for (const { path: valuePath, value } of collectStringValues(sample, "sampleOutputShape")) {
    if (FORBIDDEN_OUTPUT_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("sample_forbidden_value", valuePath, "sample output contains a forbidden raw value"));
    }
  }
}

function validateManualOrderPermissionHashHelperContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");

  const boundary = contract.futureLocalHashHelperBoundary;
  if (!isPlainObject(boundary)) {
    errors.push(makeError("boundary_must_be_object", "futureLocalHashHelperBoundary", "futureLocalHashHelperBoundary must be an object"));
  } else {
    if (boundary.futureHashHelperPath !== FUTURE_HASH_HELPER_PATH) {
      errors.push(makeError("invalid_future_hash_helper_path", "futureLocalHashHelperBoundary.futureHashHelperPath", "future helper path must stay fixed"));
    }
    if (boundary.futurePermissionPacketPath !== FUTURE_PERMISSION_PACKET_PATH) {
      errors.push(
        makeError(
          "invalid_future_permission_packet_path",
          "futureLocalHashHelperBoundary.futurePermissionPacketPath",
          "future permission packet path must stay fixed",
        ),
      );
    }
    for (const flag of ["currentStepImplementsHelper", "currentStepCreatesHashes", "currentStepCreatesPermissionPacket"]) {
      if (boundary[flag] !== false) {
        errors.push(makeError("boundary_action_enabled", `futureLocalHashHelperBoundary.${flag}`, `${flag} must be false`));
      }
    }
    pushMissingArrayErrors(
      errors,
      boundary.requiredHashInputLabels,
      REQUIRED_HASH_INPUT_LABELS,
      "futureLocalHashHelperBoundary.requiredHashInputLabels",
      "missing_hash_input_label",
    );
    pushMissingArrayErrors(
      errors,
      boundary.requiredHashHelperRules,
      REQUIRED_HASH_HELPER_RULES,
      "futureLocalHashHelperBoundary.requiredHashHelperRules",
      "missing_hash_helper_rule",
    );
    pushMissingArrayErrors(
      errors,
      boundary.forbiddenHashInputs,
      REQUIRED_FORBIDDEN_HASH_INPUTS,
      "futureLocalHashHelperBoundary.forbiddenHashInputs",
      "missing_forbidden_hash_input",
    );
    if (boundary.acceptedHashAlgorithm !== "HMAC-SHA256") {
      errors.push(makeError("invalid_hash_algorithm", "futureLocalHashHelperBoundary.acceptedHashAlgorithm", "hash algorithm must be HMAC-SHA256"));
    }
    const secretBoundary = boundary.requiredSecretBoundary;
    if (!isPlainObject(secretBoundary)) {
      errors.push(makeError("secret_boundary_must_be_object", "futureLocalHashHelperBoundary.requiredSecretBoundary", "requiredSecretBoundary must be an object"));
    } else {
      if (secretBoundary.pepperRequired !== true) {
        errors.push(makeError("pepper_not_required", "futureLocalHashHelperBoundary.requiredSecretBoundary.pepperRequired", "pepper must be required"));
      }
      if (secretBoundary.pepperStorage !== "outside_repo_operator_secret") {
        errors.push(makeError("invalid_pepper_storage", "futureLocalHashHelperBoundary.requiredSecretBoundary.pepperStorage", "pepper must stay outside the repo"));
      }
      if (secretBoundary.rawInputTransport !== "stdin_or_interactive_prompt_only") {
        errors.push(makeError("invalid_raw_input_transport", "futureLocalHashHelperBoundary.requiredSecretBoundary.rawInputTransport", "raw inputs must be stdin or interactive only"));
      }
      for (const flag of ["commandLineRawSecretsAllowed", "rawInputLoggingAllowed", "rawInputPersistenceAllowed"]) {
        if (secretBoundary[flag] !== false) {
          errors.push(makeError("secret_boundary_flag_enabled", `futureLocalHashHelperBoundary.requiredSecretBoundary.${flag}`, `${flag} must be false`));
        }
      }
    }
    validateSampleOutputShape(boundary.sampleOutputShape, errors);
  }

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "hashHelperImplementationAllowed",
      "permissionPacketCreatedNow",
      "permissionPacketImportedNow",
      "providerCallsAllowed",
      "orderSubmissionAllowed",
      "runtimeRouteAllowed",
      "publicUiAllowed",
      "liveTradingAllowed",
    ]) {
      if (Object.hasOwn(container, flag) && container[flag] !== false) {
        errors.push(makeError("allow_flag_enabled", `${containerName}.${flag}`, `${flag} must be false`));
      }
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
    console.log("Usage: node scripts/validate-trading-manual-order-permission-hash-helper-contract.cjs --contract <path>");
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
  const result = validateManualOrderPermissionHashHelperContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateManualOrderPermissionHashHelperContract,
};

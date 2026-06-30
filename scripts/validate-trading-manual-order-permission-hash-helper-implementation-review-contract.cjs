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
  "futureLocalOnlyImplementationReviewBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA = [
  "local_only_node_cli_surface",
  "no_network_access_or_provider_clients",
  "crypto_hmac_sha256_only",
  "private_pepper_outside_repo",
  "raw_inputs_from_stdin_or_interactive_prompt_only",
  "raw_inputs_not_allowed_in_command_args",
  "raw_inputs_not_logged",
  "raw_inputs_not_persisted",
  "synthetic_test_vectors_only",
  "deterministic_labelled_hash_output",
  "stdout_only_by_default",
  "no_permission_packet_write",
  "no_permission_packet_import",
  "no_provider_calls",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
];

const REQUIRED_HELPER_OUTPUT_LABELS = [
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

const REQUIRED_FORBIDDEN_REVIEW_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
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

const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-manual-order-permission-hashes.cjs");
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);

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

function validateTestBoundary(errors, boundary) {
  const testBoundary = boundary.requiredTestBoundary;
  if (!isPlainObject(testBoundary)) {
    errors.push(makeError("test_boundary_must_be_object", "futureLocalOnlyImplementationReviewBoundary.requiredTestBoundary", "requiredTestBoundary must be an object"));
    return;
  }
  if (testBoundary.syntheticFixturesOnly !== true) {
    errors.push(makeError("synthetic_fixtures_not_required", "futureLocalOnlyImplementationReviewBoundary.requiredTestBoundary.syntheticFixturesOnly", "synthetic fixtures must be required"));
  }
  for (const flag of [
    "realKisCredentialFixturesAllowed",
    "rawAccountFixturesAllowed",
    "rawOperatorFixturesAllowed",
    "orderSubmissionFixturesAllowed",
  ]) {
    if (testBoundary[flag] !== false) {
      errors.push(makeError("test_boundary_flag_enabled", `futureLocalOnlyImplementationReviewBoundary.requiredTestBoundary.${flag}`, `${flag} must be false`));
    }
  }
}

function validateExecutionBoundary(errors, boundary) {
  const executionBoundary = boundary.requiredExecutionBoundary;
  if (!isPlainObject(executionBoundary)) {
    errors.push(makeError("execution_boundary_must_be_object", "futureLocalOnlyImplementationReviewBoundary.requiredExecutionBoundary", "requiredExecutionBoundary must be an object"));
    return;
  }
  if (executionBoundary.localOnly !== true) {
    errors.push(makeError("local_only_not_required", "futureLocalOnlyImplementationReviewBoundary.requiredExecutionBoundary.localOnly", "execution must stay local-only"));
  }
  for (const flag of [
    "networkAccessAllowed",
    "providerClientImportsAllowed",
    "commandLineRawSecretsAllowed",
    "writesPermissionPacketByDefault",
  ]) {
    if (executionBoundary[flag] !== false) {
      errors.push(makeError("execution_boundary_flag_enabled", `futureLocalOnlyImplementationReviewBoundary.requiredExecutionBoundary.${flag}`, `${flag} must be false`));
    }
  }
}

function validateManualOrderPermissionHashHelperImplementationReviewContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");

  const boundary = contract.futureLocalOnlyImplementationReviewBoundary;
  if (!isPlainObject(boundary)) {
    errors.push(makeError("boundary_must_be_object", "futureLocalOnlyImplementationReviewBoundary", "futureLocalOnlyImplementationReviewBoundary must be an object"));
  } else {
    if (boundary.futureHashHelperPath !== FUTURE_HASH_HELPER_PATH) {
      errors.push(makeError("invalid_future_hash_helper_path", "futureLocalOnlyImplementationReviewBoundary.futureHashHelperPath", "future helper path must stay fixed"));
    }
    if (boundary.futurePermissionPacketPath !== FUTURE_PERMISSION_PACKET_PATH) {
      errors.push(makeError("invalid_future_permission_packet_path", "futureLocalOnlyImplementationReviewBoundary.futurePermissionPacketPath", "future permission packet path must stay fixed"));
    }
    for (const flag of [
      "currentStepCreatesHelper",
      "currentStepRunsHelper",
      "currentStepRequestsRawInputs",
      "currentStepRequestsPrivatePepper",
    ]) {
      if (boundary[flag] !== false) {
        errors.push(makeError("boundary_action_enabled", `futureLocalOnlyImplementationReviewBoundary.${flag}`, `${flag} must be false`));
      }
    }
    pushMissingArrayErrors(
      errors,
      boundary.implementationReviewCriteria,
      REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA,
      "futureLocalOnlyImplementationReviewBoundary.implementationReviewCriteria",
      "missing_implementation_review_criterion",
    );
    pushMissingArrayErrors(
      errors,
      boundary.helperOutputLabels,
      REQUIRED_HELPER_OUTPUT_LABELS,
      "futureLocalOnlyImplementationReviewBoundary.helperOutputLabels",
      "missing_helper_output_label",
    );
    pushMissingArrayErrors(
      errors,
      boundary.forbiddenReviewContent,
      REQUIRED_FORBIDDEN_REVIEW_CONTENT,
      "futureLocalOnlyImplementationReviewBoundary.forbiddenReviewContent",
      "missing_forbidden_review_content",
    );
    validateTestBoundary(errors, boundary);
    validateExecutionBoundary(errors, boundary);
  }

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "helperImplementationCreatedNow",
      "hashHelperImplementationAllowed",
      "hashGenerationAllowed",
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

  for (const { path: valuePath, value } of collectStringValues(contract)) {
    if (valuePath.endsWith(".forbiddenReviewContent") || valuePath.includes(".forbiddenReviewContent[")) {
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
      "Usage: node scripts/validate-trading-manual-order-permission-hash-helper-implementation-review-contract.cjs --contract <path>",
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
  const result = validateManualOrderPermissionHashHelperImplementationReviewContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateManualOrderPermissionHashHelperImplementationReviewContract,
};

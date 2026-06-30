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
  "futurePureLocalValidatorImplementationBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_PREFLIGHT_GATES = [
  "validation_contract_ready",
  "hash_preparation_still_deferred",
  "validator_implementation_not_created_now",
  "private_packet_not_created_now",
  "private_packet_not_imported_now",
  "validator_has_no_provider_dependency",
  "validator_has_no_runtime_route_dependency",
  "validator_has_no_db_dependency",
  "validator_has_no_ui_dependency",
  "provider_calls_remain_disabled",
  "order_submission_remains_disabled",
];

const REQUIRED_IMPLEMENTATION_REVIEW_RULES = [
  "pure_node_script_only",
  "reads_candidate_packet_from_explicit_local_path_later",
  "no_default_private_packet_path_read",
  "no_network_access",
  "no_environment_secret_loading",
  "no_hash_generation",
  "no_packet_write",
  "no_packet_import",
  "no_runtime_route",
  "no_database_write",
  "no_public_ui",
  "deterministic_validation_result",
  "redacted_error_messages_only",
];

const REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_name",
  "raw_evidence_text",
  "raw_revocation_plan",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];

const FUTURE_VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
const FUTURE_APPROVAL_PACKET_PATH = path.join("data", "private", "trading", "read_only_approval.redacted.json");

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

function validateContainer(container, containerName, errors) {
  if (!isPlainObject(container)) {
    errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
    return;
  }

  for (const flag of ["validationImplementationAllowedNow", "validationImplementationReviewAllowedLater"]) {
    if (Object.hasOwn(container, flag) && container[flag] !== true) {
      errors.push(makeError("validation_allow_flag_disabled", `${containerName}.${flag}`, `${flag} must be true`));
    }
  }

  for (const flag of [
    "approvalPacketCreatedNow",
    "approvalPacketImportedNow",
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

function validateRedactedApprovalPacketValidationPreflight(preflight) {
  const errors = [];

  if (!isPlainObject(preflight)) {
    return {
      valid: false,
      errors: [makeError("preflight_must_be_object", "$", "preflight must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(preflight), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");

  const boundary = preflight.futurePureLocalValidatorImplementationBoundary;
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futurePureLocalValidatorImplementationBoundary",
        "futurePureLocalValidatorImplementationBoundary must be an object",
      ),
    );
  } else {
    if (boundary.futureValidatorPath !== FUTURE_VALIDATOR_PATH) {
      errors.push(
        makeError(
          "invalid_future_validator_path",
          "futurePureLocalValidatorImplementationBoundary.futureValidatorPath",
          "future validator path must stay fixed",
        ),
      );
    }
    if (boundary.futureApprovalPacketPath !== FUTURE_APPROVAL_PACKET_PATH) {
      errors.push(
        makeError(
          "invalid_future_approval_packet_path",
          "futurePureLocalValidatorImplementationBoundary.futureApprovalPacketPath",
          "future approval packet path must stay fixed",
        ),
      );
    }
    if (boundary.currentStepImplementsValidator !== true) {
      errors.push(
        makeError(
          "validator_implementation_not_allowed",
          "futurePureLocalValidatorImplementationBoundary.currentStepImplementsValidator",
          "current step must allow only the pure local validator implementation",
        ),
      );
    }
    for (const flag of ["currentStepReadsPrivatePacket", "currentStepCreatesPacket", "currentStepImportsPacket"]) {
      if (boundary[flag] !== false) {
        errors.push(makeError("boundary_action_enabled", `futurePureLocalValidatorImplementationBoundary.${flag}`, `${flag} must be false`));
      }
    }
    pushMissingArrayErrors(
      errors,
      boundary.preflightGates,
      REQUIRED_PREFLIGHT_GATES,
      "futurePureLocalValidatorImplementationBoundary.preflightGates",
      "missing_preflight_gate",
    );
    pushMissingArrayErrors(
      errors,
      boundary.implementationReviewRules,
      REQUIRED_IMPLEMENTATION_REVIEW_RULES,
      "futurePureLocalValidatorImplementationBoundary.implementationReviewRules",
      "missing_implementation_review_rule",
    );
    pushMissingArrayErrors(
      errors,
      boundary.forbiddenPreflightContent,
      REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT,
      "futurePureLocalValidatorImplementationBoundary.forbiddenPreflightContent",
      "missing_forbidden_preflight_content",
    );
  }

  for (const containerName of ["currentState", "checks", "readiness"]) {
    validateContainer(preflight[containerName], containerName, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { preflightPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--preflight") {
      args.preflightPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-redacted-approval-packet-validation-preflight.cjs --preflight <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.preflightPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("preflight_path_required", "$", "--preflight is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let preflight;
  try {
    preflight = JSON.parse(fs.readFileSync(args.preflightPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("preflight_read_failed", "$", "preflight could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateRedactedApprovalPacketValidationPreflight(preflight);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateRedactedApprovalPacketValidationPreflight,
};

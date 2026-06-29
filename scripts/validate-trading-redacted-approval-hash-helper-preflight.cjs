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
  "futureOwnerAssistedHashPreparationBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_PREFLIGHT_CHECKS = [
  "prior_hash_helper_contract_ready",
  "owner_hash_preparation_deferred",
  "helper_implementation_not_created_now",
  "hash_generation_not_run_now",
  "private_pepper_not_requested_now",
  "raw_inputs_not_requested_now",
  "approval_packet_not_created_now",
  "approval_packet_not_imported_now",
  "provider_calls_remain_disabled",
  "order_submission_remains_disabled",
];

const REQUIRED_FUTURE_REVIEW_INPUTS = [
  "explicit_owner_request_to_prepare_hashes",
  "local_only_execution_surface",
  "private_pepper_source_outside_repo",
  "stdin_or_interactive_raw_input_collection",
  "no_command_line_raw_secret_arguments",
  "no_raw_input_logs",
  "no_raw_input_file_persistence",
  "deterministic_labelled_hash_output",
  "manual_review_before_approval_packet_import",
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

const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-redacted-approval-hashes.cjs");
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

function validateRedactedApprovalHashHelperPreflight(preflight) {
  const errors = [];

  if (!isPlainObject(preflight)) {
    return {
      valid: false,
      errors: [makeError("preflight_must_be_object", "$", "preflight must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(preflight), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");

  const boundary = preflight.futureOwnerAssistedHashPreparationBoundary;
  if (!isPlainObject(boundary)) {
    errors.push(makeError("boundary_must_be_object", "futureOwnerAssistedHashPreparationBoundary", "futureOwnerAssistedHashPreparationBoundary must be an object"));
  } else {
    if (boundary.futureHashHelperPath !== FUTURE_HASH_HELPER_PATH) {
      errors.push(makeError("invalid_future_hash_helper_path", "futureOwnerAssistedHashPreparationBoundary.futureHashHelperPath", "future helper path must stay fixed"));
    }
    if (boundary.futureApprovalPacketPath !== FUTURE_APPROVAL_PACKET_PATH) {
      errors.push(makeError("invalid_future_approval_packet_path", "futureOwnerAssistedHashPreparationBoundary.futureApprovalPacketPath", "future approval packet path must stay fixed"));
    }
    for (const flag of [
      "currentStepRequestsRawInputs",
      "currentStepRequestsPrivatePepper",
      "currentStepImplementsHashHelper",
      "currentStepGeneratesHashes",
      "currentStepCreatesApprovalPacket",
    ]) {
      if (boundary[flag] !== false) {
        errors.push(makeError("boundary_action_enabled", `futureOwnerAssistedHashPreparationBoundary.${flag}`, `${flag} must be false`));
      }
    }
    pushMissingArrayErrors(
      errors,
      boundary.preflightChecks,
      REQUIRED_PREFLIGHT_CHECKS,
      "futureOwnerAssistedHashPreparationBoundary.preflightChecks",
      "missing_preflight_check",
    );
    pushMissingArrayErrors(
      errors,
      boundary.futureReviewInputs,
      REQUIRED_FUTURE_REVIEW_INPUTS,
      "futureOwnerAssistedHashPreparationBoundary.futureReviewInputs",
      "missing_future_review_input",
    );
    pushMissingArrayErrors(
      errors,
      boundary.forbiddenPreflightContent,
      REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT,
      "futureOwnerAssistedHashPreparationBoundary.forbiddenPreflightContent",
      "missing_forbidden_preflight_content",
    );
  }

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = preflight[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    if (Object.hasOwn(container, "ownerHashPreparationDeferred") && container.ownerHashPreparationDeferred !== true) {
      errors.push(makeError("owner_hash_preparation_not_deferred", `${containerName}.ownerHashPreparationDeferred`, "owner hash preparation must remain deferred"));
    }
    for (const flag of [
      "hashHelperImplementationAllowed",
      "hashGenerationAllowed",
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
    console.log("Usage: node scripts/validate-trading-redacted-approval-hash-helper-preflight.cjs --preflight <path>");
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
  const result = validateRedactedApprovalHashHelperPreflight(preflight);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateRedactedApprovalHashHelperPreflight,
};

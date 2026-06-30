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
  "futureOwnerAssistedHashPreparationRunbook",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_RUNBOOK_STEPS = [
  "explicit_owner_request_required",
  "confirm_offline_local_shell",
  "confirm_repo_worktree_clean_before_private_inputs",
  "prepare_private_pepper_outside_repo",
  "prepare_raw_inputs_outside_repo",
  "use_stdin_or_interactive_prompts_only",
  "reject_command_line_raw_secret_arguments",
  "generate_labelled_hashes_only",
  "verify_required_output_labels",
  "copy_hashes_only_to_private_permission_packet_outside_repo",
  "manually_review_no_raw_values_in_outputs",
  "delete_private_scratchpad_after_review",
  "keep_kill_switch_enabled_until_separate_clearance",
  "do_not_import_permission_packet_in_this_step",
];

const REQUIRED_OUTPUT_LABELS = [
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

const REQUIRED_FORBIDDEN_RUNBOOK_CONTENT = [
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

function validateRunbookBoundary(errors, runbook) {
  if (!isPlainObject(runbook)) {
    errors.push(makeError("runbook_must_be_object", "futureOwnerAssistedHashPreparationRunbook", "runbook must be an object"));
    return;
  }
  if (runbook.futureHashHelperPath !== FUTURE_HASH_HELPER_PATH) {
    errors.push(makeError("invalid_future_hash_helper_path", "futureOwnerAssistedHashPreparationRunbook.futureHashHelperPath", "future helper path must stay fixed"));
  }
  if (runbook.futurePermissionPacketPath !== FUTURE_PERMISSION_PACKET_PATH) {
    errors.push(makeError("invalid_future_permission_packet_path", "futureOwnerAssistedHashPreparationRunbook.futurePermissionPacketPath", "future permission packet path must stay fixed"));
  }
  for (const flag of [
    "currentStepCreatesHelper",
    "currentStepRunsHelper",
    "currentStepRequestsRawInputs",
    "currentStepRequestsPrivatePepper",
    "currentStepCapturesHashOutput",
    "currentStepCreatesPermissionPacket",
  ]) {
    if (runbook[flag] !== false) {
      errors.push(makeError("runbook_action_enabled", `futureOwnerAssistedHashPreparationRunbook.${flag}`, `${flag} must be false`));
    }
  }
  pushMissingArrayErrors(
    errors,
    runbook.runbookSteps,
    REQUIRED_RUNBOOK_STEPS,
    "futureOwnerAssistedHashPreparationRunbook.runbookSteps",
    "missing_runbook_step",
  );
  pushMissingArrayErrors(
    errors,
    runbook.requiredOutputLabels,
    REQUIRED_OUTPUT_LABELS,
    "futureOwnerAssistedHashPreparationRunbook.requiredOutputLabels",
    "missing_output_label",
  );
  pushMissingArrayErrors(
    errors,
    runbook.forbiddenRunbookContent,
    REQUIRED_FORBIDDEN_RUNBOOK_CONTENT,
    "futureOwnerAssistedHashPreparationRunbook.forbiddenRunbookContent",
    "missing_forbidden_runbook_content",
  );
}

function validateManualOrderPermissionHashPreparationRunbookContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateRunbookBoundary(errors, contract.futureOwnerAssistedHashPreparationRunbook);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "helperImplementationCreatedNow",
      "helperExecutionAllowedNow",
      "rawInputsRequestedNow",
      "privatePepperRequestedNow",
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
    if (valuePath.endsWith(".forbiddenRunbookContent") || valuePath.includes(".forbiddenRunbookContent[")) {
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
    console.log("Usage: node scripts/validate-trading-manual-order-permission-hash-preparation-runbook-contract.cjs --contract <path>");
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
  const result = validateManualOrderPermissionHashPreparationRunbookContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateManualOrderPermissionHashPreparationRunbookContract,
};

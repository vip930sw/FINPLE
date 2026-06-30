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
  "futureOwnerAssistedValidationResultReceiptReviewRunbook",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_REVIEW_ASSERTIONS = [
  "review_uses_explicit_owner_supplied_receipt_path_later",
  "review_runs_local_receipt_validator_later",
  "review_does_not_record_receipt_path",
  "review_does_not_record_raw_values",
  "review_does_not_import_permission_packet",
  "review_does_not_enable_provider_calls",
  "review_does_not_enable_order_submission",
  "review_does_not_create_runtime_route",
  "review_does_not_create_public_ui",
  "review_does_not_write_database",
  "review_requires_separate_permission_import_review",
];

const REQUIRED_REDACTED_REVIEW_OUTPUT_FIELDS = [
  "validationReceiptReviewId",
  "reviewStatus",
  "reviewedAt",
  "receiptShapeHash",
  "validatorVersionHash",
  "reviewErrorCodeHashes",
  "redactionVersion",
  "receiptPathRecorded",
  "rawValuesRecorded",
  "permissionPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

const REQUIRED_FORBIDDEN_REVIEW_OUTPUT_CONTENT = [
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

const FUTURE_VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission_validation_result_receipt.redacted.json",
);
const REQUIRED_VALIDATOR_COMMAND =
  "node scripts/validate-trading-manual-order-permission-validation-result-receipt.cjs --receipt <owner-supplied-redacted-validation-result-receipt-path>";
const REQUIRED_REVIEW_PREFLIGHT_COMMAND =
  "node scripts/validate-trading-manual-order-permission-validation-result-receipt-review-preflight.cjs --contract data/processed/trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json";

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

function isAllowedCatalogPath(valuePath) {
  return (
    valuePath.includes(".forbiddenReviewOutputContent[") ||
    valuePath.endsWith(".forbiddenReviewOutputContent") ||
    valuePath.includes(".redactedReviewOutputFields[") ||
    valuePath.endsWith(".redactedReviewOutputFields")
  );
}

function validateReviewRunbookBoundary(errors, runbook) {
  if (!isPlainObject(runbook)) {
    errors.push(
      makeError(
        "runbook_must_be_object",
        "futureOwnerAssistedValidationResultReceiptReviewRunbook",
        "runbook must be an object",
      ),
    );
    return;
  }
  if (runbook.futureValidationResultReceiptPath !== FUTURE_VALIDATION_RESULT_RECEIPT_PATH) {
    errors.push(
      makeError(
        "invalid_future_validation_result_receipt_path",
        "futureOwnerAssistedValidationResultReceiptReviewRunbook.futureValidationResultReceiptPath",
        "future validation result receipt path must stay fixed",
      ),
    );
  }
  if (runbook.validatorCommandTemplate !== REQUIRED_VALIDATOR_COMMAND) {
    errors.push(
      makeError(
        "invalid_validator_command_template",
        "futureOwnerAssistedValidationResultReceiptReviewRunbook.validatorCommandTemplate",
        "validator command must require an explicit owner-supplied redacted receipt path",
      ),
    );
  }
  if (runbook.reviewPreflightValidatorCommandTemplate !== REQUIRED_REVIEW_PREFLIGHT_COMMAND) {
    errors.push(
      makeError(
        "invalid_review_preflight_validator_command_template",
        "futureOwnerAssistedValidationResultReceiptReviewRunbook.reviewPreflightValidatorCommandTemplate",
        "review preflight validator command must stay fixed",
      ),
    );
  }
  for (const flag of [
    "currentStepRunsValidator",
    "currentStepReadsReceipt",
    "currentStepRecordsReceipt",
    "currentStepImportsPermissionPacket",
  ]) {
    if (runbook[flag] !== false) {
      errors.push(
        makeError(
          "runbook_action_enabled",
          `futureOwnerAssistedValidationResultReceiptReviewRunbook.${flag}`,
          `${flag} must be false`,
        ),
      );
    }
  }
  pushMissingArrayErrors(
    errors,
    runbook.requiredReviewAssertions,
    REQUIRED_REVIEW_ASSERTIONS,
    "futureOwnerAssistedValidationResultReceiptReviewRunbook.requiredReviewAssertions",
    "missing_review_assertion",
  );
  pushMissingArrayErrors(
    errors,
    runbook.redactedReviewOutputFields,
    REQUIRED_REDACTED_REVIEW_OUTPUT_FIELDS,
    "futureOwnerAssistedValidationResultReceiptReviewRunbook.redactedReviewOutputFields",
    "missing_redacted_review_output_field",
  );
  pushMissingArrayErrors(
    errors,
    runbook.forbiddenReviewOutputContent,
    REQUIRED_FORBIDDEN_REVIEW_OUTPUT_CONTENT,
    "futureOwnerAssistedValidationResultReceiptReviewRunbook.forbiddenReviewOutputContent",
    "missing_forbidden_review_output_content",
  );
}

function validateManualOrderPermissionValidationResultReceiptReviewRunbookContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateReviewRunbookBoundary(errors, contract.futureOwnerAssistedValidationResultReceiptReviewRunbook);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "currentStepRunsValidator",
      "currentStepReadsReceipt",
      "validationReceiptRecordedNow",
      "validationReceiptReadAllowedNow",
      "packetPathRecorded",
      "rawValuesRecorded",
      "permissionPacketImportedNow",
      "providerCallsAllowed",
      "orderSubmissionAllowed",
      "dbMigrationAllowed",
      "publicUiAllowed",
      "runtimeRouteAllowed",
      "liveTradingAllowed",
    ]) {
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
    console.log(
      "Usage: node scripts/validate-trading-manual-order-permission-validation-result-receipt-review-runbook-contract.cjs --contract <path>",
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
  const result = validateManualOrderPermissionValidationResultReceiptReviewRunbookContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateManualOrderPermissionValidationResultReceiptReviewRunbookContract,
};

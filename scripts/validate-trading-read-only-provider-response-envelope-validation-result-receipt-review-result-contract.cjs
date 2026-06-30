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
  "futureResponseValidationResultReceiptReviewResultBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_REVIEW_RESULT_FIELDS = [
  "responseValidationReceiptReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "receiptShapeHash",
  "validatorVersionHash",
  "reviewErrorCodeHashes",
  "reviewPolicyHash",
  "redactionVersion",
  "receiptPathRecorded",
  "rawResponseRecorded",
  "providerPayloadRecorded",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

const REQUIRED_REVIEW_RESULT_ASSERTIONS = [
  "review_result_is_redacted_only",
  "review_result_does_not_record_receipt_path",
  "review_result_does_not_record_raw_response",
  "review_result_does_not_record_provider_payload",
  "review_result_does_not_enable_provider_calls",
  "review_result_does_not_enable_order_submission",
  "review_result_does_not_create_runtime_route",
  "review_result_does_not_create_public_ui",
  "review_result_requires_separate_provider_call_authorization_review",
];

const REQUIRED_FORBIDDEN_REVIEW_RESULT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_response_payload",
  "raw_order_payload",
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
  "read_only_provider_response_envelope_validation_result_receipt.redacted.json",
);

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?account/i,
  /raw[_-]?provider/i,
  /raw[_-]?response/i,
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
    valuePath.includes(".forbiddenReviewResultContent[") ||
    valuePath.endsWith(".forbiddenReviewResultContent") ||
    valuePath.includes(".requiredReviewResultFields[") ||
    valuePath.endsWith(".requiredReviewResultFields") ||
    valuePath.includes(".requiredReviewResultAssertions[") ||
    valuePath.endsWith(".requiredReviewResultAssertions")
  );
}

function validateReviewResultBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futureResponseValidationResultReceiptReviewResultBoundary",
        "review result boundary must be an object",
      ),
    );
    return;
  }
  if (boundary.futureValidationResultReceiptPath !== FUTURE_VALIDATION_RESULT_RECEIPT_PATH) {
    errors.push(
      makeError(
        "invalid_future_validation_result_receipt_path",
        "futureResponseValidationResultReceiptReviewResultBoundary.futureValidationResultReceiptPath",
        "future validation result receipt path must stay fixed",
      ),
    );
  }
  for (const flag of ["currentStepReadsReceipt", "currentStepRecordsReviewResult", "currentStepCallsProvider"]) {
    if (boundary[flag] !== false) {
      errors.push(
        makeError(
          "review_result_action_enabled",
          `futureResponseValidationResultReceiptReviewResultBoundary.${flag}`,
          `${flag} must be false`,
        ),
      );
    }
  }
  pushMissingArrayErrors(
    errors,
    boundary.requiredReviewResultFields,
    REQUIRED_REVIEW_RESULT_FIELDS,
    "futureResponseValidationResultReceiptReviewResultBoundary.requiredReviewResultFields",
    "missing_review_result_field",
  );
  pushMissingArrayErrors(
    errors,
    boundary.requiredReviewResultAssertions,
    REQUIRED_REVIEW_RESULT_ASSERTIONS,
    "futureResponseValidationResultReceiptReviewResultBoundary.requiredReviewResultAssertions",
    "missing_review_result_assertion",
  );
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenReviewResultContent,
    REQUIRED_FORBIDDEN_REVIEW_RESULT_CONTENT,
    "futureResponseValidationResultReceiptReviewResultBoundary.forbiddenReviewResultContent",
    "missing_forbidden_review_result_content",
  );
}

function validateReadOnlyProviderResponseValidationResultReceiptReviewResultContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateReviewResultBoundary(errors, contract.futureResponseValidationResultReceiptReviewResultBoundary);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "validationReceiptReviewRecordedNow",
      "validationReceiptReadAllowedNow",
      "receiptPathRecorded",
      "rawResponseRecorded",
      "providerPayloadRecorded",
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
      "Usage: node scripts/validate-trading-read-only-provider-response-envelope-validation-result-receipt-review-result-contract.cjs --contract <path>",
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
  const result = validateReadOnlyProviderResponseValidationResultReceiptReviewResultContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateReadOnlyProviderResponseValidationResultReceiptReviewResultContract,
};

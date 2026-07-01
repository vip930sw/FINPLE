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
  "futureValidationResultReceiptReviewBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_REVIEW_GATES = [
  "validation_result_receipt_contract_ready",
  "validation_result_receipt_validator_ready",
  "validation_result_receipt_validator_fixtures_ready",
  "explicit_owner_validation_receipt_path_required_later",
  "no_default_receipt_read",
  "no_private_approval_packet_path",
  "no_raw_approval_values",
  "no_approval_packet_import",
  "no_provider_call",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "no_live_trading",
  "requires_separate_approval_import_review",
  "requires_separate_provider_call_authorization_review",
];

const REQUIRED_FORBIDDEN_REVIEW_CONTENT = [
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

const FUTURE_VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval_validation_result_receipt.redacted.json",
);
const FUTURE_APPROVAL_PACKET_PATH = path.join("data", "private", "trading", "read_only_approval.redacted.json");

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?account/i,
  /raw[_-]?operator/i,
  /raw[_-]?evidence/i,
  /raw[_-]?revocation/i,
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

function isCatalogOrBoundaryPath(valuePath) {
  return (
    valuePath === "$.futureValidationResultReceiptReviewBoundary.futureValidationResultReceiptPath" ||
    valuePath === "$.futureValidationResultReceiptReviewBoundary.futureApprovalPacketPath" ||
    valuePath.endsWith(".reviewGates") ||
    valuePath.includes(".reviewGates[") ||
    valuePath.endsWith(".forbiddenReviewContent") ||
    valuePath.includes(".forbiddenReviewContent[") ||
    valuePath.endsWith(".promotionRules") ||
    valuePath.includes(".promotionRules[")
  );
}

function validateFutureBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futureValidationResultReceiptReviewBoundary",
        "future approval validation result receipt review boundary must be an object",
      ),
    );
    return;
  }
  if (boundary.futureValidationResultReceiptPath !== FUTURE_VALIDATION_RESULT_RECEIPT_PATH) {
    errors.push(
      makeError(
        "invalid_future_validation_result_receipt_path",
        "futureValidationResultReceiptReviewBoundary.futureValidationResultReceiptPath",
        "future validation result receipt path must stay fixed",
      ),
    );
  }
  if (boundary.futureApprovalPacketPath !== FUTURE_APPROVAL_PACKET_PATH) {
    errors.push(
      makeError(
        "invalid_future_approval_packet_path",
        "futureValidationResultReceiptReviewBoundary.futureApprovalPacketPath",
        "future approval packet path must stay fixed",
      ),
    );
  }
  for (const flag of [
    "currentStepReadsReceipt",
    "currentStepRecordsReceipt",
    "currentStepReadsApprovalPacket",
    "currentStepImportsApprovalPacket",
    "currentStepCallsProvider",
    "currentStepSubmitsOrder",
  ]) {
    if (boundary[flag] !== false) {
      errors.push(
        makeError("boundary_action_enabled", `futureValidationResultReceiptReviewBoundary.${flag}`, `${flag} must be false`),
      );
    }
  }
  pushMissingArrayErrors(
    errors,
    boundary.reviewGates,
    REQUIRED_REVIEW_GATES,
    "futureValidationResultReceiptReviewBoundary.reviewGates",
    "missing_review_gate",
  );
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenReviewContent,
    REQUIRED_FORBIDDEN_REVIEW_CONTENT,
    "futureValidationResultReceiptReviewBoundary.forbiddenReviewContent",
    "missing_forbidden_review_content",
  );
}

function validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateFutureBoundary(errors, contract.futureValidationResultReceiptReviewBoundary);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "validationReceiptRecordedNow",
      "validationReceiptReadAllowedNow",
      "packetPathRecorded",
      "rawValuesRecorded",
      "approvalPacketImportedNow",
      "providerCallsAllowed",
      "orderSubmissionAllowed",
      "runtimeRouteAllowed",
      "publicUiAllowed",
      "dbMigrationAllowed",
      "liveTradingAllowed",
    ]) {
      if (Object.hasOwn(container, flag) && container[flag] !== false) {
        errors.push(makeError("allow_flag_enabled", `${containerName}.${flag}`, `${flag} must be false`));
      }
    }
  }

  for (const { path: valuePath, value } of collectStringValues(contract)) {
    if (isCatalogOrBoundaryPath(valuePath)) {
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
      "Usage: node scripts/validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs --contract <path>",
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
  const result = validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight,
};

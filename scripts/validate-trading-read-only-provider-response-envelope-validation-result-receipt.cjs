const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "responseValidationReceiptId",
  "validationStatus",
  "validatedAt",
  "validatorVersionHash",
  "responseEnvelopeShapeHash",
  "errorCodeHashes",
  "redactionVersion",
  "envelopePathRecorded",
  "rawResponseRecorded",
  "providerPayloadRecorded",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

const REQUIRED_FALSE_FLAGS = [
  "envelopePathRecorded",
  "rawResponseRecorded",
  "providerPayloadRecorded",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

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
  /data[\\/]+private[\\/]+trading/i,
  /read[_-]?only[_-]?approval\.redacted\.json/i,
  /response[_-]?envelope[_-]?validation[_-]?result[_-]?receipt\.redacted\.json/i,
];

function makeError(code, pathName, message) {
  return { code, path: pathName, message };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoTimestamp(value) {
  if (typeof value !== "string") {
    return false;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isLabelledHash(value) {
  return typeof value === "string" && /^(sha256|hmac-sha256):[A-Za-z0-9:_-]{12,}$/.test(value);
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

function validateReadOnlyProviderResponseEnvelopeValidationResultReceipt(receipt) {
  const errors = [];

  if (!isPlainObject(receipt)) {
    return {
      valid: false,
      errors: [makeError("receipt_must_be_object", "$", "receipt must be a JSON object")],
    };
  }

  const receiptKeys = Object.keys(receipt);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(receipt, field)) {
      errors.push(makeError("missing_required_field", field, `${field} is required`));
    }
  }
  for (const field of receiptKeys) {
    if (!REQUIRED_FIELDS.includes(field)) {
      errors.push(makeError("unknown_field", field, "unknown fields are rejected"));
    }
  }

  if (Object.hasOwn(receipt, "responseValidationReceiptId")) {
    if (
      typeof receipt.responseValidationReceiptId !== "string" ||
      !/^response_validation_receipt_[A-Za-z0-9_-]{8,}$/.test(receipt.responseValidationReceiptId)
    ) {
      errors.push(
        makeError(
          "invalid_response_validation_receipt_id",
          "responseValidationReceiptId",
          "responseValidationReceiptId must be opaque",
        ),
      );
    }
  }

  if (Object.hasOwn(receipt, "validationStatus") && !["valid", "invalid"].includes(receipt.validationStatus)) {
    errors.push(makeError("invalid_validation_status", "validationStatus", "validationStatus must be valid or invalid"));
  }

  if (Object.hasOwn(receipt, "validatedAt") && !isIsoTimestamp(receipt.validatedAt)) {
    errors.push(makeError("malformed_timestamp", "validatedAt", "validatedAt must be an ISO timestamp"));
  }

  for (const field of ["validatorVersionHash", "responseEnvelopeShapeHash"]) {
    if (Object.hasOwn(receipt, field) && !isLabelledHash(receipt[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }

  if (Object.hasOwn(receipt, "errorCodeHashes")) {
    if (!Array.isArray(receipt.errorCodeHashes)) {
      errors.push(makeError("error_code_hashes_must_be_array", "errorCodeHashes", "errorCodeHashes must be an array"));
    } else {
      receipt.errorCodeHashes.forEach((value, index) => {
        if (!isLabelledHash(value)) {
          errors.push(
            makeError("malformed_error_code_hash", `errorCodeHashes[${index}]`, "error code entries must be hashes"),
          );
        }
      });
    }
  }

  if (Object.hasOwn(receipt, "redactionVersion") && receipt.redactionVersion !== "v1") {
    errors.push(makeError("invalid_redaction_version", "redactionVersion", "redactionVersion must be v1"));
  }

  for (const field of REQUIRED_FALSE_FLAGS) {
    if (Object.hasOwn(receipt, field) && receipt[field] !== false) {
      errors.push(makeError("forbidden_flag_enabled", field, `${field} must be false`));
    }
  }

  for (const { path, value } of collectStringValues(receipt)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("forbidden_string_value", path, "receipt contains a forbidden redaction boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { receiptPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--receipt") {
      args.receiptPath = argv[index + 1] ?? null;
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
      "Usage: node scripts/validate-trading-read-only-provider-response-envelope-validation-result-receipt.cjs --receipt <path>",
    );
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.receiptPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("receipt_path_required", "$", "--receipt is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let receipt;
  try {
    receipt = JSON.parse(fs.readFileSync(args.receiptPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("receipt_read_failed", "$", "receipt could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateReadOnlyProviderResponseEnvelopeValidationResultReceipt(receipt);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateReadOnlyProviderResponseEnvelopeValidationResultReceipt,
};

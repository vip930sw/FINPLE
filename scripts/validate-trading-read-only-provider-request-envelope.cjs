const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "requestId",
  "mode",
  "approvalIdHash",
  "baseUrl",
  "method",
  "pathTemplate",
  "endpointCategory",
  "queryShape",
  "headerNames",
  "bodyShape",
  "timestamp",
  "idempotencyKey",
  "requestHash",
  "responseHash",
  "redactionVersion",
  "providerCallAllowed",
];

const ALLOWED_ENDPOINT_CATEGORIES = [
  "account_cash_balance_read",
  "account_positions_read",
  "orderable_cash_read",
  "current_quotes_read",
  "fx_rate_read",
  "market_session_state_read",
  "provider_rate_limit_state_read",
];

const SAFE_SHAPE_VALUES = new Set([
  "empty",
  "hash_only",
  "string_shape",
  "number_shape",
  "boolean_shape",
  "date_shape",
  "optional_string_shape",
  "redacted_hash_shape",
]);

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /raw[_-]?account[_-]?identifier/i,
  /raw[_-]?provider/i,
  /raw[_-]?order/i,
  /order[_-]?confirmation/i,
  /execution[_-]?id/i,
  /fill[_-]?payload/i,
  /live[_-]?order[_-]?endpoint/i,
  /scenario[_-]?monthly[_-]?return/i,
];

const UNSAFE_PATH_PATTERNS = [
  /^https?:\/\//i,
  /\?/,
  /\/oauth/i,
  /token/i,
  /order[-_/]?cash/i,
  /order[-_/]?rvsecncl/i,
  /order[-_/]?submit/i,
  /order[-_/]?cancel/i,
  /live[-_/]?order/i,
  /scenario[-_/]?monthly/i,
];

function makeError(code, path, message) {
  return { code, path, message };
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

function isPendingOrLabelledHash(value) {
  return value === "pending_hash" || isLabelledHash(value);
}

function isVirtualTradingBaseUrl(value) {
  return (
    typeof value === "string" &&
    /^https:\/\/openapivts\.koreainvestment\.com(?::29443)?\/?$/.test(value)
  );
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

function validateShapeObject(value, field, errors) {
  if (!isPlainObject(value)) {
    errors.push(makeError("field_must_be_object", field, `${field} must be an object`));
    return;
  }
  Object.entries(value).forEach(([key, entry]) => {
    const keyPath = FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(key)) ? `${field}.*` : `${field}.${key}`;
    if (typeof key !== "string" || FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(key))) {
      errors.push(makeError("secret_value_present", keyPath, `${field} contains an unsafe key`));
    }
    if (typeof entry === "string") {
      if (!SAFE_SHAPE_VALUES.has(entry)) {
        errors.push(makeError("unsafe_shape_value", keyPath, `${field} contains an unsafe shape value`));
      }
      return;
    }
    if (Array.isArray(entry)) {
      errors.push(makeError("unsafe_shape_value", keyPath, `${field} arrays are not allowed`));
      return;
    }
    if (isPlainObject(entry)) {
      validateShapeObject(entry, keyPath, errors);
      return;
    }
    errors.push(makeError("unsafe_shape_value", keyPath, `${field} contains an unsafe shape value`));
  });
}

function validateReadOnlyProviderRequestEnvelope(envelope) {
  const errors = [];

  if (!isPlainObject(envelope)) {
    return {
      valid: false,
      errors: [makeError("envelope_must_be_object", "$", "envelope must be a JSON object")],
    };
  }

  const keys = Object.keys(envelope);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(envelope, field)) {
      errors.push(makeError("missing_required_field", field, `${field} is required`));
    }
  }
  for (const field of keys) {
    if (!REQUIRED_FIELDS.includes(field)) {
      errors.push(makeError("unknown_field", field, "unknown fields are rejected"));
    }
  }

  if (Object.hasOwn(envelope, "requestId")) {
    if (typeof envelope.requestId !== "string" || !/^req_[A-Za-z0-9_-]{8,}$/.test(envelope.requestId)) {
      errors.push(makeError("invalid_request_id", "requestId", "requestId must be opaque"));
    }
  }
  if (envelope.mode !== "shadow") {
    errors.push(makeError("invalid_mode", "mode", "mode must be shadow"));
  }
  if (Object.hasOwn(envelope, "approvalIdHash") && !isLabelledHash(envelope.approvalIdHash)) {
    errors.push(makeError("malformed_hash_field", "approvalIdHash", "approvalIdHash must be a labelled hash"));
  }
  if (!isVirtualTradingBaseUrl(envelope.baseUrl)) {
    errors.push(makeError("invalid_base_url", "baseUrl", "baseUrl must be virtual trading openapivts"));
  }
  if (envelope.method !== "GET") {
    errors.push(makeError("invalid_method", "method", "method must be GET"));
  }
  if (typeof envelope.pathTemplate !== "string" || !envelope.pathTemplate.startsWith("/")) {
    errors.push(makeError("unsafe_path_template", "pathTemplate", "pathTemplate must be a relative path shape"));
  } else if (UNSAFE_PATH_PATTERNS.some((pattern) => pattern.test(envelope.pathTemplate))) {
    errors.push(makeError("unsafe_path_template", "pathTemplate", "pathTemplate contains a forbidden path shape"));
  }
  if (!ALLOWED_ENDPOINT_CATEGORIES.includes(envelope.endpointCategory)) {
    errors.push(makeError("unknown_endpoint_category", "endpointCategory", "endpointCategory must be read-only"));
  }
  if (Object.hasOwn(envelope, "queryShape")) {
    validateShapeObject(envelope.queryShape, "queryShape", errors);
  }
  if (!Array.isArray(envelope.headerNames)) {
    errors.push(makeError("field_must_be_array", "headerNames", "headerNames must be an array"));
  } else {
    envelope.headerNames.forEach((header, index) => {
      if (typeof header !== "string" || FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(header))) {
        errors.push(makeError("secret_value_present", `headerNames[${index}]`, "headerNames must be redacted"));
      }
    });
  }
  if (Object.hasOwn(envelope, "bodyShape")) {
    validateShapeObject(envelope.bodyShape, "bodyShape", errors);
  }
  if (Object.hasOwn(envelope, "timestamp") && !isIsoTimestamp(envelope.timestamp)) {
    errors.push(makeError("malformed_timestamp", "timestamp", "timestamp must be an ISO timestamp"));
  }
  if (
    Object.hasOwn(envelope, "idempotencyKey") &&
    (typeof envelope.idempotencyKey !== "string" || !/^idem_[A-Za-z0-9_-]{8,}$/.test(envelope.idempotencyKey))
  ) {
    errors.push(makeError("invalid_idempotency_key", "idempotencyKey", "idempotencyKey must be opaque"));
  }
  if (Object.hasOwn(envelope, "requestHash") && !isLabelledHash(envelope.requestHash)) {
    errors.push(makeError("malformed_hash_field", "requestHash", "requestHash must be a labelled hash"));
  }
  if (Object.hasOwn(envelope, "responseHash") && !isPendingOrLabelledHash(envelope.responseHash)) {
    errors.push(makeError("malformed_hash_field", "responseHash", "responseHash must be pending or labelled hash"));
  }
  if (envelope.providerCallAllowed !== false) {
    errors.push(makeError("provider_call_flag_enabled", "providerCallAllowed", "providerCallAllowed must be false"));
  }

  for (const { path, value } of collectStringValues(envelope)) {
    if (path === "$.pathTemplate" && envelope.pathTemplate === value) {
      continue;
    }
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "envelope contains a forbidden redaction boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { envelopePath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--envelope") {
      args.envelopePath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-read-only-provider-request-envelope.cjs --envelope <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.envelopePath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("envelope_path_required", "$", "--envelope is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let envelope;
  try {
    envelope = JSON.parse(fs.readFileSync(args.envelopePath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("envelope_read_failed", "$", "envelope could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateReadOnlyProviderRequestEnvelope(envelope);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateReadOnlyProviderRequestEnvelope,
};

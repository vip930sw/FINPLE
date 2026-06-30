const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "requestId",
  "mode",
  "endpointCategory",
  "statusCodeClass",
  "providerStatus",
  "receivedAt",
  "latencyBucket",
  "rateLimitState",
  "normalizedSnapshotType",
  "normalizedSnapshotHash",
  "rawResponseHash",
  "redactionVersion",
  "providerCallAllowed",
  "orderSubmissionAllowed",
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

const ALLOWED_NORMALIZED_SNAPSHOT_TYPES = [
  "account_cash_balance_snapshot",
  "account_positions_snapshot",
  "orderable_cash_snapshot",
  "current_quotes_snapshot",
  "fx_rate_snapshot",
  "market_session_state_snapshot",
  "provider_rate_limit_state_snapshot",
];

const ALLOWED_STATUS_CODE_CLASSES = ["2xx", "4xx", "5xx", "network_error", "timeout"];
const ALLOWED_PROVIDER_STATUSES = ["success", "error", "rate_limited", "unavailable", "timeout"];
const ALLOWED_LATENCY_BUCKETS = ["lt_500ms", "ms_500_1000", "ms_1000_3000", "gt_3000ms", "unknown"];
const ALLOWED_RATE_LIMIT_STATES = ["not_limited", "limited", "unknown"];
const FORBIDDEN_RESPONSE_FIELD_PATTERNS = [
  /access[_-]?token/i,
  /app[_-]?key/i,
  /app[_-]?secret/i,
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

function fieldNameViolatesRedactionBoundary(field) {
  return FORBIDDEN_RESPONSE_FIELD_PATTERNS.some((pattern) => pattern.test(field));
}

function stringViolatesRedactionBoundary(value) {
  return FORBIDDEN_RESPONSE_FIELD_PATTERNS.some((pattern) => pattern.test(value));
}

function validateReadOnlyProviderResponseEnvelope(envelope) {
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
    if (fieldNameViolatesRedactionBoundary(field)) {
      errors.push(
        makeError("raw_provider_payload_shape_present", field, "response envelope contains a forbidden field shape"),
      );
      continue;
    }
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
  if (!ALLOWED_ENDPOINT_CATEGORIES.includes(envelope.endpointCategory)) {
    const code = typeof envelope.endpointCategory === "string" && /order|cancel|execution|fill/i.test(envelope.endpointCategory)
      ? "order_endpoint_category"
      : "unknown_endpoint_category";
    errors.push(makeError(code, "endpointCategory", "endpointCategory must be read-only"));
  }
  if (!ALLOWED_STATUS_CODE_CLASSES.includes(envelope.statusCodeClass)) {
    errors.push(makeError("unknown_status_code_class", "statusCodeClass", "statusCodeClass is not allowed"));
  }
  if (!ALLOWED_PROVIDER_STATUSES.includes(envelope.providerStatus)) {
    errors.push(makeError("unknown_provider_status", "providerStatus", "providerStatus is not allowed"));
  }
  if (Object.hasOwn(envelope, "receivedAt") && !isIsoTimestamp(envelope.receivedAt)) {
    errors.push(makeError("malformed_timestamp", "receivedAt", "receivedAt must be an ISO timestamp"));
  }
  if (!ALLOWED_LATENCY_BUCKETS.includes(envelope.latencyBucket)) {
    errors.push(makeError("unknown_latency_bucket", "latencyBucket", "latencyBucket is not allowed"));
  }
  if (!ALLOWED_RATE_LIMIT_STATES.includes(envelope.rateLimitState)) {
    errors.push(makeError("unknown_rate_limit_state", "rateLimitState", "rateLimitState is not allowed"));
  }
  if (!ALLOWED_NORMALIZED_SNAPSHOT_TYPES.includes(envelope.normalizedSnapshotType)) {
    errors.push(
      makeError(
        "unknown_normalized_snapshot_type",
        "normalizedSnapshotType",
        "normalizedSnapshotType is not allowed",
      ),
    );
  }
  if (Object.hasOwn(envelope, "normalizedSnapshotHash") && !isLabelledHash(envelope.normalizedSnapshotHash)) {
    errors.push(
      makeError("malformed_hash_field", "normalizedSnapshotHash", "normalizedSnapshotHash must be a labelled hash"),
    );
  }
  if (Object.hasOwn(envelope, "rawResponseHash") && !isLabelledHash(envelope.rawResponseHash)) {
    errors.push(makeError("malformed_hash_field", "rawResponseHash", "rawResponseHash must be a labelled hash"));
  }
  if (envelope.redactionVersion !== "v1") {
    errors.push(makeError("invalid_redaction_version", "redactionVersion", "redactionVersion must be v1"));
  }
  if (envelope.providerCallAllowed !== false) {
    errors.push(makeError("provider_call_flag_enabled", "providerCallAllowed", "providerCallAllowed must be false"));
  }
  if (envelope.orderSubmissionAllowed !== false) {
    errors.push(
      makeError("order_submission_flag_enabled", "orderSubmissionAllowed", "orderSubmissionAllowed must be false"),
    );
  }

  for (const { path, value } of collectStringValues(envelope)) {
    if (stringViolatesRedactionBoundary(value)) {
      errors.push(makeError("secret_value_present", path, "response envelope contains a forbidden redaction value"));
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
    console.log("Usage: node scripts/validate-trading-read-only-provider-response-envelope.cjs --envelope <path>");
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
  const result = validateReadOnlyProviderResponseEnvelope(envelope);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateReadOnlyProviderResponseEnvelope,
};

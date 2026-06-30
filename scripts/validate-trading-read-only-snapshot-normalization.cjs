const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "snapshotId",
  "snapshotType",
  "sourceEnvelopeHash",
  "createdAt",
  "market",
  "symbol",
  "currency",
  "accountIdHash",
  "valueHash",
  "freshnessStatus",
  "providerStatus",
  "redactionVersion",
  "rawPayloadStored",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];

const HASH_FIELDS = ["sourceEnvelopeHash", "accountIdHash", "valueHash"];
const ALLOWED_SNAPSHOT_TYPES = [
  "account_cash_balance_snapshot",
  "account_positions_snapshot",
  "orderable_cash_snapshot",
  "current_quotes_snapshot",
  "fx_rate_snapshot",
  "market_session_state_snapshot",
  "provider_rate_limit_state_snapshot",
];
const ALLOWED_MARKETS = new Set(["KR", "US", "GLOBAL", "UNKNOWN"]);
const ALLOWED_CURRENCIES = new Set(["KRW", "USD", "UNKNOWN"]);
const ALLOWED_FRESHNESS_STATUSES = new Set(["fresh", "stale", "missing", "unknown"]);
const ALLOWED_PROVIDER_STATUSES = new Set(["success", "error", "rate_limited", "unavailable", "timeout", "unknown"]);
const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /raw[_-]?account[_-]?identifier/i,
  /raw[_-]?provider/i,
  /raw[_-]?snapshot/i,
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
    Object.entries(value).forEach(([key, entry]) => {
      const keyPath = FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(key))
        ? `${valuePath}.*`
        : `${valuePath}.${key}`;
      collectStringValues(entry, keyPath, output);
    });
  }
  return output;
}

function validateTradingReadOnlySnapshotNormalization(snapshot) {
  const errors = [];

  if (!isPlainObject(snapshot)) {
    return {
      valid: false,
      errors: [makeError("snapshot_must_be_object", "$", "snapshot must be a JSON object")],
    };
  }

  const keys = Object.keys(snapshot);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(snapshot, field)) {
      errors.push(makeError("missing_required_field", field, `${field} is required`));
    }
  }
  for (const field of keys) {
    if (!REQUIRED_FIELDS.includes(field)) {
      const safeField = FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(field)) ? "*" : field;
      errors.push(makeError("unknown_field", safeField, "unknown fields are rejected"));
    }
  }

  if (
    Object.hasOwn(snapshot, "snapshotId") &&
    (typeof snapshot.snapshotId !== "string" || !/^snap_[A-Za-z0-9_-]{8,}$/.test(snapshot.snapshotId))
  ) {
    errors.push(makeError("invalid_snapshot_id", "snapshotId", "snapshotId must be opaque"));
  }
  if (!ALLOWED_SNAPSHOT_TYPES.includes(snapshot.snapshotType)) {
    errors.push(makeError("unknown_snapshot_type", "snapshotType", "snapshotType must be read-only"));
  }
  if (Object.hasOwn(snapshot, "createdAt") && !isIsoTimestamp(snapshot.createdAt)) {
    errors.push(makeError("malformed_timestamp", "createdAt", "createdAt must be an ISO timestamp"));
  }
  if (Object.hasOwn(snapshot, "market") && !ALLOWED_MARKETS.has(snapshot.market)) {
    errors.push(makeError("invalid_market", "market", "market must be an allowed market marker"));
  }
  if (Object.hasOwn(snapshot, "symbol")) {
    const symbolAllowed = snapshot.symbol === null || /^[A-Z0-9][A-Z0-9.-]{0,15}$/.test(snapshot.symbol);
    if (!symbolAllowed) {
      errors.push(makeError("invalid_symbol", "symbol", "symbol must be null or a redaction-safe market symbol"));
    }
  }
  if (Object.hasOwn(snapshot, "currency") && !ALLOWED_CURRENCIES.has(snapshot.currency)) {
    errors.push(makeError("invalid_currency", "currency", "currency must be KRW, USD, or UNKNOWN"));
  }
  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(snapshot, field) && !isLabelledHash(snapshot[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }
  if (Object.hasOwn(snapshot, "freshnessStatus") && !ALLOWED_FRESHNESS_STATUSES.has(snapshot.freshnessStatus)) {
    errors.push(makeError("unknown_freshness_status", "freshnessStatus", "freshnessStatus is not allowed"));
  }
  if (Object.hasOwn(snapshot, "providerStatus") && !ALLOWED_PROVIDER_STATUSES.has(snapshot.providerStatus)) {
    errors.push(makeError("unknown_provider_status", "providerStatus", "providerStatus is not allowed"));
  }
  if (snapshot.redactionVersion !== "v1") {
    errors.push(makeError("invalid_redaction_version", "redactionVersion", "redactionVersion must be v1"));
  }
  if (snapshot.rawPayloadStored !== false) {
    errors.push(makeError("raw_payload_stored", "rawPayloadStored", "rawPayloadStored must be false"));
  }
  if (snapshot.providerCallsAllowed !== false) {
    errors.push(makeError("provider_call_flag_enabled", "providerCallsAllowed", "providerCallsAllowed must be false"));
  }
  if (snapshot.orderSubmissionAllowed !== false) {
    errors.push(
      makeError("order_submission_flag_enabled", "orderSubmissionAllowed", "orderSubmissionAllowed must be false"),
    );
  }

  for (const { path, value } of collectStringValues(snapshot)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "snapshot contains a forbidden redaction boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { snapshotPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--snapshot") {
      args.snapshotPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-read-only-snapshot-normalization.cjs --snapshot <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.snapshotPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("snapshot_path_required", "$", "--snapshot is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let snapshot;
  try {
    snapshot = JSON.parse(fs.readFileSync(args.snapshotPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("snapshot_read_failed", "$", "snapshot could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateTradingReadOnlySnapshotNormalization(snapshot);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTradingReadOnlySnapshotNormalization,
};

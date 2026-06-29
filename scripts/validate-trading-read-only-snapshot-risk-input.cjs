const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "evaluationId",
  "orderIntentHash",
  "mode",
  "generatedAt",
  "market",
  "symbol",
  "side",
  "quantity",
  "estimatedNotionalHash",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "positionsSnapshotHash",
  "fxRateSnapshotHash",
  "marketSessionSnapshotHash",
  "providerRateLimitSnapshotHash",
  "snapshotFreshnessStatus",
  "accountMatchStatus",
  "providerRateLimitStatus",
  "killSwitchStateHash",
  "manualApprovalStateHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];

const HASH_FIELDS = [
  "orderIntentHash",
  "estimatedNotionalHash",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "positionsSnapshotHash",
  "fxRateSnapshotHash",
  "marketSessionSnapshotHash",
  "providerRateLimitSnapshotHash",
  "killSwitchStateHash",
  "manualApprovalStateHash",
];

const ALLOWED_MARKETS = new Set(["KR", "US"]);
const ALLOWED_SIDES = new Set(["BUY", "SELL"]);
const FRESH_SNAPSHOT_STATUSES = new Set(["fresh"]);
const ACCOUNT_MATCH_STATUSES = new Set(["account_hash_matched"]);
const RATE_LIMIT_STATUSES = new Set(["within_limit", "not_rate_limited"]);

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
      const keyPath = FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(key)) ? `${valuePath}.*` : `${valuePath}.${key}`;
      collectStringValues(entry, keyPath, output);
    });
  }
  return output;
}

function validateTradingReadOnlySnapshotRiskInput(input) {
  const errors = [];

  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: [makeError("risk_input_must_be_object", "$", "risk input must be a JSON object")],
    };
  }

  const keys = Object.keys(input);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(input, field)) {
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
    Object.hasOwn(input, "evaluationId") &&
    (typeof input.evaluationId !== "string" || !/^eval_[A-Za-z0-9_-]{8,}$/.test(input.evaluationId))
  ) {
    errors.push(makeError("invalid_evaluation_id", "evaluationId", "evaluationId must be opaque"));
  }
  if (input.mode !== "shadow") {
    errors.push(makeError("invalid_mode", "mode", "mode must be shadow"));
  }
  if (Object.hasOwn(input, "generatedAt") && !isIsoTimestamp(input.generatedAt)) {
    errors.push(makeError("malformed_timestamp", "generatedAt", "generatedAt must be an ISO timestamp"));
  }
  if (Object.hasOwn(input, "market") && !ALLOWED_MARKETS.has(input.market)) {
    errors.push(makeError("invalid_market", "market", "market must be KR or US"));
  }
  if (Object.hasOwn(input, "symbol")) {
    if (typeof input.symbol !== "string" || !/^[A-Z0-9][A-Z0-9.-]{0,15}$/.test(input.symbol)) {
      errors.push(makeError("invalid_symbol", "symbol", "symbol must be a redaction-safe market symbol"));
    }
  }
  if (Object.hasOwn(input, "side") && !ALLOWED_SIDES.has(input.side)) {
    errors.push(makeError("invalid_side", "side", "side must be BUY or SELL"));
  }
  if (
    Object.hasOwn(input, "quantity") &&
    (!Number.isInteger(input.quantity) || input.quantity <= 0 || input.quantity > 1_000_000)
  ) {
    errors.push(makeError("invalid_quantity", "quantity", "quantity must be a bounded positive integer"));
  }
  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(input, field) && !isLabelledHash(input[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }
  if (Object.hasOwn(input, "snapshotFreshnessStatus") && !FRESH_SNAPSHOT_STATUSES.has(input.snapshotFreshnessStatus)) {
    errors.push(makeError("snapshot_not_fresh", "snapshotFreshnessStatus", "snapshot freshness must be fresh"));
  }
  if (Object.hasOwn(input, "accountMatchStatus") && !ACCOUNT_MATCH_STATUSES.has(input.accountMatchStatus)) {
    errors.push(makeError("account_mismatch", "accountMatchStatus", "account hash must match the approval context"));
  }
  if (Object.hasOwn(input, "providerRateLimitStatus") && !RATE_LIMIT_STATUSES.has(input.providerRateLimitStatus)) {
    errors.push(makeError("provider_rate_limit_blocked", "providerRateLimitStatus", "provider rate limit must not block"));
  }
  if (input.providerCallsAllowed !== false) {
    errors.push(makeError("provider_call_flag_enabled", "providerCallsAllowed", "providerCallsAllowed must be false"));
  }
  if (input.orderSubmissionAllowed !== false) {
    errors.push(
      makeError("order_submission_flag_enabled", "orderSubmissionAllowed", "orderSubmissionAllowed must be false"),
    );
  }

  for (const { path, value } of collectStringValues(input)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "risk input contains a forbidden redaction boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { inputPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      args.inputPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-read-only-snapshot-risk-input.cjs --input <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.inputPath) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("input_path_required", "$", "--input is required")] }));
    process.exitCode = 2;
    return;
  }
  let input;
  try {
    input = JSON.parse(fs.readFileSync(args.inputPath, "utf8"));
  } catch {
    console.error(JSON.stringify({ valid: false, errors: [makeError("input_read_failed", "$", "input could not be read")] }));
    process.exitCode = 2;
    return;
  }
  const result = validateTradingReadOnlySnapshotRiskInput(input);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTradingReadOnlySnapshotRiskInput,
};

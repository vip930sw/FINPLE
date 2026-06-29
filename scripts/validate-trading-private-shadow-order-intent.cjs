const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "intentId",
  "mode",
  "strategyIdHash",
  "operatorIdHash",
  "createdAt",
  "market",
  "symbol",
  "side",
  "orderType",
  "quantity",
  "limitPriceHash",
  "estimatedNotionalHash",
  "currency",
  "riskInputHash",
  "riskGateStatus",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "auditEventHash",
  "idempotencyKeyHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];

const HASH_FIELDS = [
  "strategyIdHash",
  "operatorIdHash",
  "estimatedNotionalHash",
  "riskInputHash",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "auditEventHash",
  "idempotencyKeyHash",
];

const OPTIONAL_HASH_FIELDS = ["limitPriceHash"];
const ALLOWED_MARKETS = new Set(["KR", "US"]);
const ALLOWED_SIDES = new Set(["BUY", "SELL"]);
const ALLOWED_ORDER_TYPES = new Set(["MARKET", "LIMIT"]);
const ALLOWED_CURRENCIES = new Set(["KRW", "USD"]);
const ALLOWED_RISK_GATE_STATUSES = new Set(["blocked", "live_review_required"]);

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /raw[_-]?account[_-]?identifier/i,
  /raw[_-]?provider/i,
  /raw[_-]?quote/i,
  /raw[_-]?position/i,
  /raw[_-]?cash/i,
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

function isHashOrNotApplicable(value) {
  return value === "not_applicable" || isLabelledHash(value);
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

function validateTradingPrivateShadowOrderIntent(intent) {
  const errors = [];

  if (!isPlainObject(intent)) {
    return {
      valid: false,
      errors: [makeError("intent_must_be_object", "$", "order intent must be a JSON object")],
    };
  }

  const keys = Object.keys(intent);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(intent, field)) {
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
    Object.hasOwn(intent, "intentId") &&
    (typeof intent.intentId !== "string" || !/^intent_[A-Za-z0-9_-]{8,}$/.test(intent.intentId))
  ) {
    errors.push(makeError("invalid_intent_id", "intentId", "intentId must be opaque"));
  }
  if (intent.mode !== "shadow") {
    errors.push(makeError("invalid_mode", "mode", "mode must be shadow"));
  }
  if (Object.hasOwn(intent, "createdAt") && !isIsoTimestamp(intent.createdAt)) {
    errors.push(makeError("malformed_timestamp", "createdAt", "createdAt must be an ISO timestamp"));
  }
  if (Object.hasOwn(intent, "market") && !ALLOWED_MARKETS.has(intent.market)) {
    errors.push(makeError("invalid_market", "market", "market must be KR or US"));
  }
  if (Object.hasOwn(intent, "symbol")) {
    if (typeof intent.symbol !== "string" || !/^[A-Z0-9][A-Z0-9.-]{0,15}$/.test(intent.symbol)) {
      errors.push(makeError("invalid_symbol", "symbol", "symbol must be a redaction-safe market symbol"));
    }
  }
  if (Object.hasOwn(intent, "side") && !ALLOWED_SIDES.has(intent.side)) {
    errors.push(makeError("invalid_side", "side", "side must be BUY or SELL"));
  }
  if (Object.hasOwn(intent, "orderType") && !ALLOWED_ORDER_TYPES.has(intent.orderType)) {
    errors.push(makeError("invalid_order_type", "orderType", "orderType must be MARKET or LIMIT"));
  }
  if (
    Object.hasOwn(intent, "quantity") &&
    (!Number.isInteger(intent.quantity) || intent.quantity <= 0 || intent.quantity > 1_000_000)
  ) {
    errors.push(makeError("invalid_quantity", "quantity", "quantity must be a bounded positive integer"));
  }
  if (Object.hasOwn(intent, "currency") && !ALLOWED_CURRENCIES.has(intent.currency)) {
    errors.push(makeError("invalid_currency", "currency", "currency must be KRW or USD"));
  }
  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(intent, field) && !isLabelledHash(intent[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }
  for (const field of OPTIONAL_HASH_FIELDS) {
    if (Object.hasOwn(intent, field) && !isHashOrNotApplicable(intent[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash or not_applicable`));
    }
  }
  if (Object.hasOwn(intent, "riskGateStatus") && !ALLOWED_RISK_GATE_STATUSES.has(intent.riskGateStatus)) {
    errors.push(
      makeError("invalid_risk_gate_status", "riskGateStatus", "riskGateStatus must stay blocked or live_review_required"),
    );
  }
  if (intent.providerCallsAllowed !== false) {
    errors.push(makeError("provider_call_flag_enabled", "providerCallsAllowed", "providerCallsAllowed must be false"));
  }
  if (intent.orderSubmissionAllowed !== false) {
    errors.push(
      makeError("order_submission_flag_enabled", "orderSubmissionAllowed", "orderSubmissionAllowed must be false"),
    );
  }

  for (const { path, value } of collectStringValues(intent)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "order intent contains a forbidden redaction boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { intentPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--intent") {
      args.intentPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-private-shadow-order-intent.cjs --intent <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.intentPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("intent_path_required", "$", "--intent is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let intent;
  try {
    intent = JSON.parse(fs.readFileSync(args.intentPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("intent_read_failed", "$", "intent could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateTradingPrivateShadowOrderIntent(intent);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTradingPrivateShadowOrderIntent,
};

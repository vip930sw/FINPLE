const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "eventId",
  "eventType",
  "mode",
  "severity",
  "status",
  "createdAt",
  "operatorIdHash",
  "strategyIdHash",
  "intentIdHash",
  "orderIntentHash",
  "riskInputHash",
  "riskGateStatus",
  "riskEventHash",
  "market",
  "symbol",
  "side",
  "decisionStatus",
  "snapshotFreshnessStatus",
  "killSwitchStateHash",
  "manualApprovalStateHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "payloadHash",
  "previousEventHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];

const HASH_FIELDS = [
  "operatorIdHash",
  "strategyIdHash",
  "intentIdHash",
  "orderIntentHash",
  "riskInputHash",
  "riskEventHash",
  "killSwitchStateHash",
  "manualApprovalStateHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "payloadHash",
];

const ALLOWED_EVENT_TYPES = new Set([
  "private_shadow_order_intent_recorded",
  "private_shadow_order_intent_blocked",
]);
const ALLOWED_SEVERITIES = new Set(["info", "warning"]);
const ALLOWED_STATUSES = new Set(["recorded", "blocked"]);
const ALLOWED_MARKETS = new Set(["KR", "US"]);
const ALLOWED_SIDES = new Set(["BUY", "SELL"]);
const ALLOWED_RISK_GATE_STATUSES = new Set(["blocked", "live_review_required"]);
const ALLOWED_DECISION_STATUSES = new Set(["shadow_recorded", "blocked"]);
const ALLOWED_SNAPSHOT_FRESHNESS_STATUSES = new Set(["fresh", "stale", "missing"]);

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /raw[_-]?account[_-]?identifier/i,
  /raw[_-]?provider/i,
  /raw[_-]?order/i,
  /raw[_-]?payload/i,
  /raw[_-]?quote/i,
  /raw[_-]?position/i,
  /raw[_-]?cash/i,
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

function isPreviousEventHash(value) {
  return value === "genesis_event" || isLabelledHash(value);
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

function validateTradingPrivateShadowIntentAuditEvent(event) {
  const errors = [];

  if (!isPlainObject(event)) {
    return {
      valid: false,
      errors: [makeError("audit_event_must_be_object", "$", "audit event must be a JSON object")],
    };
  }

  const keys = Object.keys(event);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(event, field)) {
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
    Object.hasOwn(event, "eventId") &&
    (typeof event.eventId !== "string" || !/^audit_[A-Za-z0-9_-]{8,}$/.test(event.eventId))
  ) {
    errors.push(makeError("invalid_event_id", "eventId", "eventId must be opaque"));
  }
  if (Object.hasOwn(event, "eventType") && !ALLOWED_EVENT_TYPES.has(event.eventType)) {
    errors.push(makeError("invalid_event_type", "eventType", "eventType must be private shadow intent audit only"));
  }
  if (event.mode !== "shadow") {
    errors.push(makeError("invalid_mode", "mode", "mode must be shadow"));
  }
  if (Object.hasOwn(event, "severity") && !ALLOWED_SEVERITIES.has(event.severity)) {
    errors.push(makeError("invalid_severity", "severity", "severity must be info or warning"));
  }
  if (Object.hasOwn(event, "status") && !ALLOWED_STATUSES.has(event.status)) {
    errors.push(makeError("invalid_status", "status", "status must be recorded or blocked"));
  }
  if (Object.hasOwn(event, "createdAt") && !isIsoTimestamp(event.createdAt)) {
    errors.push(makeError("malformed_timestamp", "createdAt", "createdAt must be an ISO timestamp"));
  }
  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(event, field) && !isLabelledHash(event[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }
  if (Object.hasOwn(event, "previousEventHash") && !isPreviousEventHash(event.previousEventHash)) {
    errors.push(
      makeError("malformed_hash_field", "previousEventHash", "previousEventHash must be genesis or labelled hash"),
    );
  }
  if (Object.hasOwn(event, "riskGateStatus") && !ALLOWED_RISK_GATE_STATUSES.has(event.riskGateStatus)) {
    errors.push(
      makeError("invalid_risk_gate_status", "riskGateStatus", "riskGateStatus must stay blocked or live_review_required"),
    );
  }
  if (Object.hasOwn(event, "market") && !ALLOWED_MARKETS.has(event.market)) {
    errors.push(makeError("invalid_market", "market", "market must be KR or US"));
  }
  if (Object.hasOwn(event, "symbol")) {
    if (typeof event.symbol !== "string" || !/^[A-Z0-9][A-Z0-9.-]{0,15}$/.test(event.symbol)) {
      errors.push(makeError("invalid_symbol", "symbol", "symbol must be a redaction-safe market symbol"));
    }
  }
  if (Object.hasOwn(event, "side") && !ALLOWED_SIDES.has(event.side)) {
    errors.push(makeError("invalid_side", "side", "side must be BUY or SELL"));
  }
  if (Object.hasOwn(event, "decisionStatus") && !ALLOWED_DECISION_STATUSES.has(event.decisionStatus)) {
    errors.push(makeError("invalid_decision_status", "decisionStatus", "decisionStatus must stay shadow or blocked"));
  }
  if (
    Object.hasOwn(event, "snapshotFreshnessStatus") &&
    !ALLOWED_SNAPSHOT_FRESHNESS_STATUSES.has(event.snapshotFreshnessStatus)
  ) {
    errors.push(
      makeError(
        "invalid_snapshot_freshness_status",
        "snapshotFreshnessStatus",
        "snapshot freshness must be fresh, stale, or missing",
      ),
    );
  }
  if (event.providerCallsAllowed !== false) {
    errors.push(makeError("provider_call_flag_enabled", "providerCallsAllowed", "providerCallsAllowed must be false"));
  }
  if (event.orderSubmissionAllowed !== false) {
    errors.push(
      makeError("order_submission_flag_enabled", "orderSubmissionAllowed", "orderSubmissionAllowed must be false"),
    );
  }

  for (const { path, value } of collectStringValues(event)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "audit event contains a forbidden redaction boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { eventPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--event") {
      args.eventPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-private-shadow-intent-audit-event.cjs --event <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.eventPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("event_path_required", "$", "--event is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let event;
  try {
    event = JSON.parse(fs.readFileSync(args.eventPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("event_read_failed", "$", "event could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateTradingPrivateShadowIntentAuditEvent(event);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTradingPrivateShadowIntentAuditEvent,
};

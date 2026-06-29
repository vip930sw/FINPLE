const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "approvalId",
  "approvedByHash",
  "approvedAt",
  "expiresAt",
  "scope",
  "environment",
  "baseUrlScope",
  "accountIdHash",
  "allowedReadScopes",
  "forbiddenActions",
  "evidenceTicketHash",
  "revocationPlanHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

const ALLOWED_READ_SCOPES = [
  "account_cash_balance",
  "account_positions",
  "orderable_cash",
  "current_quotes",
  "fx_rate",
  "market_session_state",
  "provider_rate_limit_state",
];

const REQUIRED_FORBIDDEN_ACTIONS = [
  "order_submission",
  "order_cancellation",
  "scenario_monthly_cache_write",
];

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /raw[_-]?account[_-]?identifier/i,
  /raw[_-]?operator/i,
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

function validateArraySubset(packet, field, allowedValues, errors) {
  const values = packet[field];
  if (!Array.isArray(values)) {
    errors.push(makeError("field_must_be_array", field, `${field} must be an array`));
    return;
  }
  values
    .filter((value) => !allowedValues.includes(value))
    .forEach(() => {
      errors.push(makeError("unknown_array_value", field, `${field} contains an unknown value`));
    });
}

function validateRedactedApprovalPacket(packet, options = {}) {
  const now = options.now ? Date.parse(options.now) : Date.now();
  const errors = [];

  if (!isPlainObject(packet)) {
    return {
      valid: false,
      errors: [makeError("packet_must_be_object", "$", "packet must be a JSON object")],
    };
  }

  const packetKeys = Object.keys(packet);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(packet, field)) {
      errors.push(makeError("missing_required_field", field, `${field} is required`));
    }
  }
  for (const field of packetKeys) {
    if (!REQUIRED_FIELDS.includes(field)) {
      errors.push(makeError("unknown_field", field, "unknown fields are rejected"));
    }
  }

  if (Object.hasOwn(packet, "approvalId")) {
    if (typeof packet.approvalId !== "string" || !/^approval_[A-Za-z0-9_-]{8,}$/.test(packet.approvalId)) {
      errors.push(makeError("invalid_approval_id", "approvalId", "approvalId must be opaque"));
    }
  }

  for (const field of ["approvedByHash", "accountIdHash", "evidenceTicketHash", "revocationPlanHash"]) {
    if (Object.hasOwn(packet, field) && !isLabelledHash(packet[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }

  if (Object.hasOwn(packet, "approvedAt") && !isIsoTimestamp(packet.approvedAt)) {
    errors.push(makeError("malformed_timestamp", "approvedAt", "approvedAt must be an ISO timestamp"));
  }
  if (Object.hasOwn(packet, "expiresAt") && !isIsoTimestamp(packet.expiresAt)) {
    errors.push(makeError("malformed_timestamp", "expiresAt", "expiresAt must be an ISO timestamp"));
  }
  if (isIsoTimestamp(packet.approvedAt) && isIsoTimestamp(packet.expiresAt)) {
    const approvedAt = Date.parse(packet.approvedAt);
    const expiresAt = Date.parse(packet.expiresAt);
    if (expiresAt <= approvedAt) {
      errors.push(makeError("invalid_time_window", "expiresAt", "expiresAt must be after approvedAt"));
    }
    if (Number.isFinite(now) && expiresAt <= now) {
      errors.push(makeError("expired_approval", "expiresAt", "approval packet is expired"));
    }
  }

  if (packet.scope !== "read_only_shadow") {
    errors.push(makeError("invalid_scope", "scope", "scope must be read_only_shadow"));
  }
  if (packet.environment !== "mock") {
    errors.push(makeError("invalid_environment", "environment", "environment must be mock"));
  }
  if (packet.baseUrlScope !== "virtual_trading_openapivts") {
    errors.push(makeError("invalid_base_url_scope", "baseUrlScope", "baseUrlScope must be virtual trading only"));
  }

  if (Object.hasOwn(packet, "allowedReadScopes")) {
    validateArraySubset(packet, "allowedReadScopes", ALLOWED_READ_SCOPES, errors);
  }
  if (Object.hasOwn(packet, "forbiddenActions")) {
    if (!Array.isArray(packet.forbiddenActions)) {
      errors.push(makeError("field_must_be_array", "forbiddenActions", "forbiddenActions must be an array"));
    } else {
      for (const action of REQUIRED_FORBIDDEN_ACTIONS) {
        if (!packet.forbiddenActions.includes(action)) {
          errors.push(
            makeError("missing_forbidden_action", "forbiddenActions", "forbiddenActions must include required actions"),
          );
        }
      }
    }
  }

  for (const field of ["providerCallsAllowed", "orderSubmissionAllowed", "runtimeRouteAllowed", "publicUiAllowed"]) {
    if (Object.hasOwn(packet, field) && packet[field] !== false) {
      errors.push(makeError("forbidden_flag_enabled", field, `${field} must be false`));
    }
  }

  for (const { path, value } of collectStringValues(packet)) {
    if (path.startsWith("$.forbiddenActions")) {
      continue;
    }
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("forbidden_string_value", path, "packet contains a forbidden redaction boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { packetPath: null, now: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--packet") {
      args.packetPath = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--now") {
      args.now = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-redacted-read-only-approval-packet.cjs --packet <path> [--now <ISO>]");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.packetPath) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("packet_path_required", "$", "--packet is required")] }));
    process.exitCode = 2;
    return;
  }
  let packet;
  try {
    packet = JSON.parse(fs.readFileSync(args.packetPath, "utf8"));
  } catch {
    console.error(JSON.stringify({ valid: false, errors: [makeError("packet_read_failed", "$", "packet could not be read")] }));
    process.exitCode = 2;
    return;
  }
  const result = validateRedactedApprovalPacket(packet, { now: args.now });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateRedactedApprovalPacket,
};

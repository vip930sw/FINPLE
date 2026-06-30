const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "permissionId",
  "mode",
  "approvedByHash",
  "approvedAt",
  "expiresAt",
  "operatorAccessHash",
  "manualApprovalPolicyHash",
  "orderAdapterDesignReviewHash",
  "killSwitchClearanceHash",
  "riskGateClearanceHash",
  "orderCredentialBoundaryHash",
  "dryRunReplayHash",
  "shadowHistoryReviewHash",
  "auditLoggerReadinessHash",
  "allowedSymbolHashes",
  "maxOrderNotional",
  "dailyLossLimit",
  "orderAttemptLimit",
  "revocationPlanHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

const HASH_FIELDS = [
  "approvedByHash",
  "operatorAccessHash",
  "manualApprovalPolicyHash",
  "orderAdapterDesignReviewHash",
  "killSwitchClearanceHash",
  "riskGateClearanceHash",
  "orderCredentialBoundaryHash",
  "dryRunReplayHash",
  "shadowHistoryReviewHash",
  "auditLoggerReadinessHash",
  "revocationPlanHash",
];

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?account/i,
  /raw[_-]?operator/i,
  /raw[_-]?session/i,
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

function validatePositiveNumber(packet, field, errors) {
  if (!Object.hasOwn(packet, field)) {
    return;
  }
  if (typeof packet[field] !== "number" || !Number.isFinite(packet[field]) || packet[field] <= 0) {
    errors.push(makeError("invalid_numeric_limit", field, `${field} must be a positive number`));
  }
}

function validateManualOrderPermissionPacket(packet, options = {}) {
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

  if (Object.hasOwn(packet, "permissionId")) {
    if (typeof packet.permissionId !== "string" || !/^permission_[A-Za-z0-9_-]{8,}$/.test(packet.permissionId)) {
      errors.push(makeError("invalid_permission_id", "permissionId", "permissionId must be opaque"));
    }
  }

  if (packet.mode !== "live_guarded") {
    errors.push(makeError("invalid_mode", "mode", "mode must be live_guarded"));
  }

  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(packet, field) && !isLabelledHash(packet[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }

  if (Object.hasOwn(packet, "allowedSymbolHashes")) {
    if (!Array.isArray(packet.allowedSymbolHashes) || packet.allowedSymbolHashes.length === 0) {
      errors.push(makeError("allowed_symbol_hashes_required", "allowedSymbolHashes", "allowedSymbolHashes must be a non-empty array"));
    } else {
      packet.allowedSymbolHashes.forEach((value, index) => {
        if (!isLabelledHash(value)) {
          errors.push(
            makeError("malformed_symbol_hash", `allowedSymbolHashes[${index}]`, "allowed symbol entries must be labelled hashes"),
          );
        }
      });
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
      errors.push(makeError("expired_permission", "expiresAt", "permission packet is expired"));
    }
  }

  validatePositiveNumber(packet, "maxOrderNotional", errors);
  validatePositiveNumber(packet, "dailyLossLimit", errors);
  validatePositiveNumber(packet, "orderAttemptLimit", errors);
  if (Object.hasOwn(packet, "orderAttemptLimit") && !Number.isInteger(packet.orderAttemptLimit)) {
    errors.push(makeError("invalid_order_attempt_limit", "orderAttemptLimit", "orderAttemptLimit must be an integer"));
  }

  if (Object.hasOwn(packet, "redactionVersion") && packet.redactionVersion !== "v1") {
    errors.push(makeError("invalid_redaction_version", "redactionVersion", "redactionVersion must be v1"));
  }

  for (const field of ["providerCallsAllowed", "orderSubmissionAllowed", "runtimeRouteAllowed", "publicUiAllowed"]) {
    if (Object.hasOwn(packet, field) && packet[field] !== false) {
      errors.push(makeError("forbidden_flag_enabled", field, `${field} must be false`));
    }
  }

  for (const { path, value } of collectStringValues(packet)) {
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
    console.log("Usage: node scripts/validate-trading-manual-order-permission-packet.cjs --packet <path> [--now <ISO>]");
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
  const result = validateManualOrderPermissionPacket(packet, { now: args.now });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateManualOrderPermissionPacket,
};

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
  /raw[_-]?operator/i,
  /raw[_-]?session/i,
  /raw[_-]?token/i,
  /raw[_-]?provider/i,
  /raw[_-]?order/i,
  /order[_-]?confirmation/i,
  /execution[_-]?id/i,
  /fill[_-]?payload/i,
  /live[_-]?order[_-]?endpoint/i,
  /scenario[_-]?monthly[_-]?return/i,
  /data[\\/]private/i,
];

const MAX_PERMISSION_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ORDER_NOTIONAL_LIMIT = 100_000_000;
const MAX_DAILY_LOSS_LIMIT = 10_000_000;
const MAX_ORDER_ATTEMPT_LIMIT = 20;

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

function validateHashArray(value, field, errors) {
  if (!Array.isArray(value)) {
    errors.push(makeError("field_must_be_array", field, `${field} must be an array`));
    return;
  }
  if (value.length === 0) {
    errors.push(makeError("hash_array_empty", field, `${field} must not be empty`));
    return;
  }
  value.forEach((entry, index) => {
    if (!isLabelledHash(entry)) {
      errors.push(makeError("malformed_hash_field", `${field}[${index}]`, `${field} entries must be labelled hashes`));
    }
  });
}

function validateBoundedNumber(permission, field, maxValue, errors) {
  if (!Object.hasOwn(permission, field)) {
    return;
  }
  const value = permission[field];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    errors.push(makeError("invalid_numeric_limit", field, `${field} must be a positive finite number`));
    return;
  }
  if (value > maxValue) {
    errors.push(makeError("numeric_limit_too_high", field, `${field} exceeds the local safety bound`));
  }
}

function validateManualOrderPermission(permission, options = {}) {
  const now = options.now ? Date.parse(options.now) : Date.now();
  const errors = [];

  if (!isPlainObject(permission)) {
    return {
      valid: false,
      errors: [makeError("permission_must_be_object", "$", "permission must be a JSON object")],
    };
  }

  const keys = Object.keys(permission);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(permission, field)) {
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
    Object.hasOwn(permission, "permissionId") &&
    (typeof permission.permissionId !== "string" || !/^permission_[A-Za-z0-9_-]{8,}$/.test(permission.permissionId))
  ) {
    errors.push(makeError("invalid_permission_id", "permissionId", "permissionId must be opaque"));
  }
  if (permission.mode !== "live_guarded") {
    errors.push(makeError("invalid_mode", "mode", "mode must be live_guarded"));
  }
  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(permission, field) && !isLabelledHash(permission[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }
  if (Object.hasOwn(permission, "allowedSymbolHashes")) {
    validateHashArray(permission.allowedSymbolHashes, "allowedSymbolHashes", errors);
  }

  if (Object.hasOwn(permission, "approvedAt") && !isIsoTimestamp(permission.approvedAt)) {
    errors.push(makeError("malformed_timestamp", "approvedAt", "approvedAt must be an ISO timestamp"));
  }
  if (Object.hasOwn(permission, "expiresAt") && !isIsoTimestamp(permission.expiresAt)) {
    errors.push(makeError("malformed_timestamp", "expiresAt", "expiresAt must be an ISO timestamp"));
  }
  if (isIsoTimestamp(permission.approvedAt) && isIsoTimestamp(permission.expiresAt)) {
    const approvedAt = Date.parse(permission.approvedAt);
    const expiresAt = Date.parse(permission.expiresAt);
    if (expiresAt <= approvedAt) {
      errors.push(makeError("invalid_time_window", "expiresAt", "expiresAt must be after approvedAt"));
    }
    if (expiresAt - approvedAt > MAX_PERMISSION_WINDOW_MS) {
      errors.push(makeError("permission_window_too_long", "expiresAt", "permission window must be 24 hours or shorter"));
    }
    if (Number.isFinite(now) && expiresAt <= now) {
      errors.push(makeError("expired_permission", "expiresAt", "manual order permission is expired"));
    }
  }

  validateBoundedNumber(permission, "maxOrderNotional", MAX_ORDER_NOTIONAL_LIMIT, errors);
  validateBoundedNumber(permission, "dailyLossLimit", MAX_DAILY_LOSS_LIMIT, errors);
  if (Object.hasOwn(permission, "orderAttemptLimit")) {
    const value = permission.orderAttemptLimit;
    if (!Number.isInteger(value) || value <= 0) {
      errors.push(makeError("invalid_order_attempt_limit", "orderAttemptLimit", "orderAttemptLimit must be a positive integer"));
    } else if (value > MAX_ORDER_ATTEMPT_LIMIT) {
      errors.push(makeError("order_attempt_limit_too_high", "orderAttemptLimit", "orderAttemptLimit exceeds the local safety bound"));
    }
  }

  for (const flag of ["providerCallsAllowed", "orderSubmissionAllowed", "runtimeRouteAllowed", "publicUiAllowed"]) {
    if (permission[flag] !== false) {
      errors.push(makeError("allow_flag_enabled", flag, `${flag} must be false`));
    }
  }

  for (const { path, value } of collectStringValues(permission)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "permission contains a forbidden boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { permissionPath: null, now: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--permission") {
      args.permissionPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-manual-order-permission.cjs --permission <path> [--now <ISO>]");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.permissionPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("permission_path_required", "$", "--permission is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let permission;
  try {
    permission = JSON.parse(fs.readFileSync(args.permissionPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("permission_read_failed", "$", "permission could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateManualOrderPermission(permission, { now: args.now });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateManualOrderPermission,
};

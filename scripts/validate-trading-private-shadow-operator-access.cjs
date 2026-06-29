const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "operatorAccessScopeId",
  "mode",
  "operatorIdHash",
  "roleHash",
  "authContextHash",
  "sessionIdHash",
  "sessionIssuedAt",
  "sessionExpiresAt",
  "allowedActionHashes",
  "deniedActionHashes",
  "approvalPolicyHash",
  "runtimeReviewPacketHash",
  "intentAuditEventHash",
  "killSwitchStateHash",
  "privateNetworkBoundaryHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

const HASH_FIELDS = [
  "operatorIdHash",
  "roleHash",
  "authContextHash",
  "sessionIdHash",
  "approvalPolicyHash",
  "runtimeReviewPacketHash",
  "intentAuditEventHash",
  "killSwitchStateHash",
  "privateNetworkBoundaryHash",
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

function validateTradingPrivateShadowOperatorAccess(access) {
  const errors = [];

  if (!isPlainObject(access)) {
    return {
      valid: false,
      errors: [makeError("operator_access_must_be_object", "$", "operator access must be a JSON object")],
    };
  }

  const keys = Object.keys(access);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(access, field)) {
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
    Object.hasOwn(access, "operatorAccessScopeId") &&
    (typeof access.operatorAccessScopeId !== "string" || !/^access_[A-Za-z0-9_-]{8,}$/.test(access.operatorAccessScopeId))
  ) {
    errors.push(makeError("invalid_access_scope_id", "operatorAccessScopeId", "operatorAccessScopeId must be opaque"));
  }
  if (access.mode !== "shadow") {
    errors.push(makeError("invalid_mode", "mode", "mode must be shadow"));
  }
  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(access, field) && !isLabelledHash(access[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }
  if (Object.hasOwn(access, "allowedActionHashes")) {
    validateHashArray(access.allowedActionHashes, "allowedActionHashes", errors);
  }
  if (Object.hasOwn(access, "deniedActionHashes")) {
    validateHashArray(access.deniedActionHashes, "deniedActionHashes", errors);
  }
  if (Object.hasOwn(access, "sessionIssuedAt") && !isIsoTimestamp(access.sessionIssuedAt)) {
    errors.push(makeError("malformed_timestamp", "sessionIssuedAt", "sessionIssuedAt must be an ISO timestamp"));
  }
  if (Object.hasOwn(access, "sessionExpiresAt") && !isIsoTimestamp(access.sessionExpiresAt)) {
    errors.push(makeError("malformed_timestamp", "sessionExpiresAt", "sessionExpiresAt must be an ISO timestamp"));
  }
  if (isIsoTimestamp(access.sessionIssuedAt) && isIsoTimestamp(access.sessionExpiresAt)) {
    const issuedAt = Date.parse(access.sessionIssuedAt);
    const expiresAt = Date.parse(access.sessionExpiresAt);
    if (expiresAt <= issuedAt) {
      errors.push(makeError("session_not_timeboxed", "sessionExpiresAt", "session must expire after it is issued"));
    }
    if (expiresAt - issuedAt > 60 * 60 * 1000) {
      errors.push(makeError("session_too_long", "sessionExpiresAt", "session must be one hour or shorter"));
    }
  }
  for (const flag of ["providerCallsAllowed", "orderSubmissionAllowed", "runtimeRouteAllowed", "publicUiAllowed"]) {
    if (access[flag] !== false) {
      errors.push(makeError("allow_flag_enabled", flag, `${flag} must be false`));
    }
  }

  for (const { path, value } of collectStringValues(access)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "operator access contains a forbidden boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { accessPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--access") {
      args.accessPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-private-shadow-operator-access.cjs --access <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.accessPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("access_path_required", "$", "--access is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let access;
  try {
    access = JSON.parse(fs.readFileSync(args.accessPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("access_read_failed", "$", "access could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateTradingPrivateShadowOperatorAccess(access);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTradingPrivateShadowOperatorAccess,
};

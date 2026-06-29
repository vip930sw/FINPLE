const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "reviewPacketId",
  "mode",
  "operatorScopeHash",
  "approvalImportPreflightHash",
  "envRiskGateHash",
  "snapshotRiskInputHash",
  "orderIntentContractHash",
  "intentAuditEventContractHash",
  "riskGateClearanceHash",
  "dryRunReplayReferenceHash",
  "shadowHistoryReviewReferenceHash",
  "auditLoggerReadinessHash",
  "killSwitchStateHash",
  "manualApprovalPolicyHash",
  "createdAt",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "dbMigrationAllowed",
  "publicUiAllowed",
];

const HASH_FIELDS = [
  "operatorScopeHash",
  "approvalImportPreflightHash",
  "envRiskGateHash",
  "snapshotRiskInputHash",
  "orderIntentContractHash",
  "intentAuditEventContractHash",
  "riskGateClearanceHash",
  "dryRunReplayReferenceHash",
  "shadowHistoryReviewReferenceHash",
  "auditLoggerReadinessHash",
  "killSwitchStateHash",
  "manualApprovalPolicyHash",
];

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /raw[_-]?account[_-]?identifier/i,
  /raw[_-]?provider/i,
  /raw[_-]?order/i,
  /raw[_-]?snapshot/i,
  /raw[_-]?payload/i,
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

function validateTradingPrivateShadowRuntimeReviewPacket(packet) {
  const errors = [];

  if (!isPlainObject(packet)) {
    return {
      valid: false,
      errors: [makeError("review_packet_must_be_object", "$", "review packet must be a JSON object")],
    };
  }

  const keys = Object.keys(packet);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(packet, field)) {
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
    Object.hasOwn(packet, "reviewPacketId") &&
    (typeof packet.reviewPacketId !== "string" || !/^review_[A-Za-z0-9_-]{8,}$/.test(packet.reviewPacketId))
  ) {
    errors.push(makeError("invalid_review_packet_id", "reviewPacketId", "reviewPacketId must be opaque"));
  }
  if (packet.mode !== "shadow") {
    errors.push(makeError("invalid_mode", "mode", "mode must be shadow"));
  }
  if (Object.hasOwn(packet, "createdAt") && !isIsoTimestamp(packet.createdAt)) {
    errors.push(makeError("malformed_timestamp", "createdAt", "createdAt must be an ISO timestamp"));
  }
  for (const field of HASH_FIELDS) {
    if (Object.hasOwn(packet, field) && !isLabelledHash(packet[field])) {
      errors.push(makeError("malformed_hash_field", field, `${field} must be a labelled hash`));
    }
  }
  for (const flag of [
    "providerCallsAllowed",
    "orderSubmissionAllowed",
    "runtimeRouteAllowed",
    "dbMigrationAllowed",
    "publicUiAllowed",
  ]) {
    if (packet[flag] !== false) {
      errors.push(makeError("allow_flag_enabled", flag, `${flag} must be false`));
    }
  }

  for (const { path, value } of collectStringValues(packet)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "review packet contains a forbidden boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { packetPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--packet") {
      args.packetPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-private-shadow-runtime-review-packet.cjs --packet <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.packetPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("packet_path_required", "$", "--packet is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let packet;
  try {
    packet = JSON.parse(fs.readFileSync(args.packetPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("packet_read_failed", "$", "packet could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateTradingPrivateShadowRuntimeReviewPacket(packet);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTradingPrivateShadowRuntimeReviewPacket,
};

const fs = require("node:fs");

const REQUIRED_FIELDS = [
  "ownerConfirmationAt",
  "kisPortalMockApplicationConfirmed",
  "renderEnvMockTradingValuesConfirmed",
  "baseUrlScope",
  "tradingMode",
  "killSwitchState",
  "accountIdHashPresenceOnly",
  "appKeyPresenceOnly",
  "appSecretPresenceOnly",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /raw[_-]?account/i,
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

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
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

function validateMockApprovalEvidenceReceipt(receipt) {
  const errors = [];

  if (!isPlainObject(receipt)) {
    return {
      valid: false,
      errors: [makeError("receipt_must_be_object", "$", "receipt must be a JSON object")],
    };
  }

  const keys = Object.keys(receipt);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(receipt, field)) {
      errors.push(makeError("missing_required_field", field, `${field} is required`));
    }
  }
  for (const field of keys) {
    if (!REQUIRED_FIELDS.includes(field)) {
      const safeField = FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(field)) ? "*" : field;
      errors.push(makeError("unknown_field", safeField, "unknown fields are rejected"));
    }
  }

  if (Object.hasOwn(receipt, "ownerConfirmationAt") && !isIsoDate(receipt.ownerConfirmationAt)) {
    errors.push(makeError("invalid_confirmation_date", "ownerConfirmationAt", "ownerConfirmationAt must be YYYY-MM-DD"));
  }
  if (receipt.kisPortalMockApplicationConfirmed !== true) {
    errors.push(
      makeError(
        "mock_application_not_confirmed",
        "kisPortalMockApplicationConfirmed",
        "KIS portal mock application must be confirmed",
      ),
    );
  }
  if (receipt.renderEnvMockTradingValuesConfirmed !== true) {
    errors.push(
      makeError(
        "render_env_not_confirmed",
        "renderEnvMockTradingValuesConfirmed",
        "Render mock trading env values must be confirmed",
      ),
    );
  }
  if (receipt.baseUrlScope !== "virtual_trading_openapivts") {
    errors.push(makeError("invalid_base_url_scope", "baseUrlScope", "baseUrlScope must be virtual trading only"));
  }
  if (receipt.tradingMode !== "shadow") {
    errors.push(makeError("invalid_trading_mode", "tradingMode", "tradingMode must be shadow"));
  }
  if (receipt.killSwitchState !== "enabled") {
    errors.push(makeError("kill_switch_not_enabled", "killSwitchState", "kill switch must remain enabled"));
  }
  for (const field of ["accountIdHashPresenceOnly", "appKeyPresenceOnly", "appSecretPresenceOnly"]) {
    if (receipt[field] !== true) {
      errors.push(makeError("presence_only_not_confirmed", field, `${field} must be true`));
    }
  }
  for (const flag of ["providerCallsAllowed", "orderSubmissionAllowed", "runtimeRouteAllowed", "publicUiAllowed"]) {
    if (receipt[flag] !== false) {
      errors.push(makeError("allow_flag_enabled", flag, `${flag} must be false`));
    }
  }

  for (const { path, value } of collectStringValues(receipt)) {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("secret_value_present", path, "receipt contains a forbidden boundary value"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { receiptPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--receipt") {
      args.receiptPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-mock-approval-evidence-receipt.cjs --receipt <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.receiptPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("receipt_path_required", "$", "--receipt is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let receipt;
  try {
    receipt = JSON.parse(fs.readFileSync(args.receiptPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("receipt_read_failed", "$", "receipt could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateMockApprovalEvidenceReceipt(receipt);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateMockApprovalEvidenceReceipt,
};

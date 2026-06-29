const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_TOP_LEVEL_FIELDS = [
  "contractVersion",
  "auditedAt",
  "step",
  "scope",
  "sourceFiles",
  "outputFiles",
  "currentState",
  "futureRedactedApprovalPacketTemplate",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_TEMPLATE_FIELDS = [
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

const REQUIRED_ALLOWED_READ_SCOPES = [
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
  "position_mutation",
  "live_trading_endpoint",
  "raw_provider_response_persistence",
  "public_frontend_secret_access",
  "scenario_monthly_cache_write",
];

const REQUIRED_ASSERTIONS = [
  "template_is_redacted_only",
  "template_does_not_create_private_packet",
  "template_requires_account_id_hash",
  "template_requires_approver_hash",
  "template_forbids_secret_values",
  "template_forbids_live_endpoint",
  "template_does_not_enable_provider_calls",
  "template_does_not_enable_order_submission",
  "template_does_not_create_runtime_route",
];

const REQUIRED_FORBIDDEN_CONTENT = [
  "access_token",
  "app_secret",
  "app_key",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];

const FUTURE_PACKET_PATH = path.join("data", "private", "trading", "read_only_approval.redacted.json");

const FORBIDDEN_SAMPLE_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?account/i,
  /raw[_-]?provider/i,
  /raw[_-]?order/i,
  /order[_-]?confirmation/i,
  /execution[_-]?id/i,
  /fill[_-]?payload/i,
  /live[_-]?order[_-]?endpoint/i,
  /scenario[_-]?monthly[_-]?return/i,
];

function makeError(code, pathName, message) {
  return { code, path: pathName, message };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLabelledPlaceholderHash(value) {
  return typeof value === "string" && /^(sha256|hmac-sha256):<[^<>]+>$/.test(value);
}

function missingValues(actual, required) {
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  return required.filter((value) => !actualSet.has(value));
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

function pushMissingArrayErrors(errors, values, requiredValues, field, code) {
  if (!Array.isArray(values)) {
    errors.push(makeError("field_must_be_array", field, `${field} must be an array`));
    return;
  }
  missingValues(values, requiredValues).forEach((value) => {
    errors.push(makeError(code, field, `${field} is missing ${value}`));
  });
}

function validateSampleShape(sample, errors) {
  if (!isPlainObject(sample)) {
    errors.push(makeError("sample_shape_must_be_object", "sampleRedactedShape", "sampleRedactedShape must be an object"));
    return;
  }

  pushMissingArrayErrors(
    errors,
    Object.keys(sample),
    REQUIRED_TEMPLATE_FIELDS,
    "sampleRedactedShape",
    "sample_missing_required_field",
  );

  if (sample.approvalId !== "approval_<opaque_id>") {
    errors.push(makeError("invalid_sample_approval_id", "sampleRedactedShape.approvalId", "sample approvalId must be opaque"));
  }
  for (const field of ["approvedByHash", "accountIdHash", "evidenceTicketHash", "revocationPlanHash"]) {
    if (!isLabelledPlaceholderHash(sample[field])) {
      errors.push(makeError("invalid_sample_hash_placeholder", `sampleRedactedShape.${field}`, `${field} must be a hash placeholder`));
    }
  }
  if (sample.scope !== "read_only_shadow") {
    errors.push(makeError("invalid_sample_scope", "sampleRedactedShape.scope", "sample scope must be read_only_shadow"));
  }
  if (sample.environment !== "mock") {
    errors.push(makeError("invalid_sample_environment", "sampleRedactedShape.environment", "sample environment must be mock"));
  }
  if (sample.baseUrlScope !== "virtual_trading_openapivts") {
    errors.push(makeError("invalid_sample_base_url_scope", "sampleRedactedShape.baseUrlScope", "sample base URL must be virtual trading only"));
  }
  pushMissingArrayErrors(
    errors,
    sample.allowedReadScopes,
    REQUIRED_ALLOWED_READ_SCOPES,
    "sampleRedactedShape.allowedReadScopes",
    "sample_missing_allowed_read_scope",
  );
  pushMissingArrayErrors(
    errors,
    sample.forbiddenActions,
    REQUIRED_FORBIDDEN_ACTIONS,
    "sampleRedactedShape.forbiddenActions",
    "sample_missing_forbidden_action",
  );
  for (const flag of ["providerCallsAllowed", "orderSubmissionAllowed", "runtimeRouteAllowed", "publicUiAllowed"]) {
    if (sample[flag] !== false) {
      errors.push(makeError("sample_allow_flag_enabled", `sampleRedactedShape.${flag}`, `${flag} must be false`));
    }
  }

  for (const { path: valuePath, value } of collectStringValues(sample, "sampleRedactedShape")) {
    if (valuePath.startsWith("sampleRedactedShape.forbiddenActions")) {
      continue;
    }
    if (FORBIDDEN_SAMPLE_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("sample_forbidden_value", valuePath, "sample shape contains a forbidden raw value"));
    }
  }
}

function validateRedactedReadOnlyApprovalTemplate(template) {
  const errors = [];

  if (!isPlainObject(template)) {
    return {
      valid: false,
      errors: [makeError("template_must_be_object", "$", "template must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(template), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  const packetTemplate = template.futureRedactedApprovalPacketTemplate;
  if (!isPlainObject(packetTemplate)) {
    errors.push(makeError("packet_template_must_be_object", "futureRedactedApprovalPacketTemplate", "futureRedactedApprovalPacketTemplate must be an object"));
  } else {
    if (packetTemplate.futureApprovalPacketPath !== FUTURE_PACKET_PATH) {
      errors.push(makeError("invalid_future_packet_path", "futureRedactedApprovalPacketTemplate.futureApprovalPacketPath", "future packet path must stay fixed"));
    }
    if (packetTemplate.currentStepCreatesPacket !== false) {
      errors.push(makeError("packet_creation_enabled", "futureRedactedApprovalPacketTemplate.currentStepCreatesPacket", "current step must not create packets"));
    }
    pushMissingArrayErrors(
      errors,
      packetTemplate.requiredTemplateFields,
      REQUIRED_TEMPLATE_FIELDS,
      "futureRedactedApprovalPacketTemplate.requiredTemplateFields",
      "missing_template_field",
    );
    pushMissingArrayErrors(
      errors,
      packetTemplate.allowedReadScopes,
      REQUIRED_ALLOWED_READ_SCOPES,
      "futureRedactedApprovalPacketTemplate.allowedReadScopes",
      "missing_allowed_read_scope",
    );
    pushMissingArrayErrors(
      errors,
      packetTemplate.forbiddenActions,
      REQUIRED_FORBIDDEN_ACTIONS,
      "futureRedactedApprovalPacketTemplate.forbiddenActions",
      "missing_forbidden_action",
    );
    pushMissingArrayErrors(
      errors,
      packetTemplate.requiredTemplateAssertions,
      REQUIRED_ASSERTIONS,
      "futureRedactedApprovalPacketTemplate.requiredTemplateAssertions",
      "missing_template_assertion",
    );
    pushMissingArrayErrors(
      errors,
      packetTemplate.forbiddenTemplateContent,
      REQUIRED_FORBIDDEN_CONTENT,
      "futureRedactedApprovalPacketTemplate.forbiddenTemplateContent",
      "missing_forbidden_template_content",
    );
    validateSampleShape(packetTemplate.sampleRedactedShape, errors);
  }

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = template[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "approvalPacketCreatedNow",
      "approvalPacketImportedNow",
      "providerCallsAllowed",
      "orderSubmissionAllowed",
      "runtimeRouteAllowed",
      "publicUiAllowed",
      "liveTradingAllowed",
    ]) {
      if (Object.hasOwn(container, flag) && container[flag] !== false) {
        errors.push(makeError("allow_flag_enabled", `${containerName}.${flag}`, `${flag} must be false`));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { templatePath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--template") {
      args.templatePath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-redacted-read-only-approval-template.cjs --template <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.templatePath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("template_path_required", "$", "--template is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let template;
  try {
    template = JSON.parse(fs.readFileSync(args.templatePath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("template_read_failed", "$", "template could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateRedactedReadOnlyApprovalTemplate(template);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateRedactedReadOnlyApprovalTemplate,
};

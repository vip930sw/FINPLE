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
  "futureRedactedManualOrderPermissionTemplate",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_TEMPLATE_FIELDS = [
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

const REQUIRED_TEMPLATE_ASSERTIONS = [
  "template_is_redacted_only",
  "template_does_not_create_private_packet",
  "template_requires_live_guarded_mode",
  "template_requires_time_box",
  "template_requires_operator_access_hash",
  "template_requires_manual_approval_policy_hash",
  "template_requires_kill_switch_clearance_hash",
  "template_requires_risk_gate_clearance_hash",
  "template_requires_order_credential_boundary_hash",
  "template_requires_dry_run_replay_hash",
  "template_requires_shadow_history_review_hash",
  "template_requires_audit_logger_readiness_hash",
  "template_forbids_secret_values",
  "template_forbids_raw_order_payloads",
  "template_does_not_enable_provider_calls",
  "template_does_not_enable_order_submission",
  "template_does_not_create_runtime_route",
];

const REQUIRED_FORBIDDEN_TEMPLATE_CONTENT = [
  "access_token",
  "app_secret",
  "app_key",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];

const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);

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

function makeError(code, pathName, message) {
  return { code, path: pathName, message };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function missingValues(actual, required) {
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  return required.filter((value) => !actualSet.has(value));
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

function isAllowedCatalogPath(valuePath) {
  return (
    valuePath.includes(".forbiddenTemplateContent[") ||
    valuePath.endsWith(".forbiddenTemplateContent") ||
    valuePath.includes(".requiredTemplateFields[") ||
    valuePath.endsWith(".requiredTemplateFields") ||
    valuePath.includes(".requiredTemplateAssertions[") ||
    valuePath.endsWith(".requiredTemplateAssertions")
  );
}

function validateTemplateBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "template_boundary_must_be_object",
        "futureRedactedManualOrderPermissionTemplate",
        "future redacted manual order permission template must be an object",
      ),
    );
    return;
  }
  if (boundary.futurePermissionPacketPath !== FUTURE_PERMISSION_PACKET_PATH) {
    errors.push(
      makeError(
        "invalid_future_permission_packet_path",
        "futureRedactedManualOrderPermissionTemplate.futurePermissionPacketPath",
        "future permission packet path must stay fixed",
      ),
    );
  }
  for (const flag of ["currentStepCreatesPacket", "currentStepImportsPacket"]) {
    if (boundary[flag] !== false) {
      errors.push(
        makeError("template_action_enabled", `futureRedactedManualOrderPermissionTemplate.${flag}`, `${flag} must be false`),
      );
    }
  }
  pushMissingArrayErrors(
    errors,
    boundary.requiredTemplateFields,
    REQUIRED_TEMPLATE_FIELDS,
    "futureRedactedManualOrderPermissionTemplate.requiredTemplateFields",
    "missing_template_field",
  );
  pushMissingArrayErrors(
    errors,
    boundary.requiredTemplateAssertions,
    REQUIRED_TEMPLATE_ASSERTIONS,
    "futureRedactedManualOrderPermissionTemplate.requiredTemplateAssertions",
    "missing_template_assertion",
  );
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenTemplateContent,
    REQUIRED_FORBIDDEN_TEMPLATE_CONTENT,
    "futureRedactedManualOrderPermissionTemplate.forbiddenTemplateContent",
    "missing_forbidden_template_content",
  );
}

function validateRedactedManualOrderPermissionTemplate(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateTemplateBoundary(errors, contract.futureRedactedManualOrderPermissionTemplate);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "permissionPacketCreatedNow",
      "permissionPacketImportedNow",
      "orderAdapterImplementationAllowedNow",
      "providerCallsAllowed",
      "orderSubmissionAllowed",
      "dbMigrationAllowed",
      "publicUiAllowed",
      "runtimeRouteAllowed",
      "liveTradingAllowed",
    ]) {
      if (Object.hasOwn(container, flag) && container[flag] !== false) {
        errors.push(makeError("allow_flag_enabled", `${containerName}.${flag}`, `${flag} must be false`));
      }
    }
  }

  for (const { path: valuePath, value } of collectStringValues(contract)) {
    if (isAllowedCatalogPath(valuePath)) {
      continue;
    }
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(makeError("forbidden_raw_value", valuePath, "contract contains a forbidden raw value shape"));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseArgs(argv) {
  const args = { contractPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--contract") {
      args.contractPath = argv[index + 1] ?? null;
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
    console.log("Usage: node scripts/validate-trading-redacted-manual-order-permission-template.cjs --contract <path>");
    return;
  }
  if (args.unknown) {
    console.error(JSON.stringify({ valid: false, errors: [makeError("unknown_argument", "$", "unknown argument")] }));
    process.exitCode = 2;
    return;
  }
  if (!args.contractPath) {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("contract_path_required", "$", "--contract is required")] }),
    );
    process.exitCode = 2;
    return;
  }
  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(args.contractPath, "utf8"));
  } catch {
    console.error(
      JSON.stringify({ valid: false, errors: [makeError("contract_read_failed", "$", "contract could not be read")] }),
    );
    process.exitCode = 2;
    return;
  }
  const result = validateRedactedManualOrderPermissionTemplate(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateRedactedManualOrderPermissionTemplate,
};

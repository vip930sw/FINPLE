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
  "futureLiveGuardedOrderAdapterBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_REVIEW_GATES = [
  "manual_order_permission_packet_imported_later",
  "manual_order_permission_validator_fixture_regression_ready",
  "kill_switch_clearance_review_recorded_later",
  "risk_gate_clearance_review_recorded_later",
  "separate_order_capable_credential_review_recorded_later",
  "dry_run_replay_review_recorded_later",
  "shadow_history_review_recorded_later",
  "audit_logger_review_recorded_later",
  "private_shadow_runtime_review_recorded_later",
  "private_operator_access_review_recorded_later",
  "env_risk_gate_fail_closed",
];

const REQUIRED_IMPLEMENTATION_RULES = [
  "private_worker_only",
  "live_guarded_only_after_manual_permission",
  "explicit_order_intent_input",
  "explicit_manual_permission_reference_hash",
  "kill_switch_before_request_signing",
  "risk_gate_before_request_signing",
  "dry_run_replay_before_submission",
  "idempotency_key_required",
  "request_and_response_hashes_only",
  "no_default_private_packet_read",
  "no_runtime_route",
  "no_public_ui",
  "no_database_migration_now",
  "no_scenario_monthly_cache_write",
  "redacted_error_messages_only",
];

const REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];

const FUTURE_ORDER_ADAPTER_PATH = path.join("server", "src", "services", "trading", "kisOrderAdapter.js");

const FORBIDDEN_STRING_PATTERNS = [
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?account/i,
  /raw[_-]?operator/i,
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
    valuePath.includes(".forbiddenPreflightContent[") ||
    valuePath.endsWith(".forbiddenPreflightContent") ||
    valuePath.includes(".reviewGates[") ||
    valuePath.endsWith(".reviewGates") ||
    valuePath.includes(".implementationRules[") ||
    valuePath.endsWith(".implementationRules")
  );
}

function validateFutureBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futureLiveGuardedOrderAdapterBoundary",
        "future live-guarded order adapter boundary must be an object",
      ),
    );
    return;
  }
  if (boundary.futureOrderAdapterPath !== FUTURE_ORDER_ADAPTER_PATH) {
    errors.push(
      makeError(
        "invalid_future_order_adapter_path",
        "futureLiveGuardedOrderAdapterBoundary.futureOrderAdapterPath",
        "future order adapter path must stay fixed",
      ),
    );
  }
  for (const flag of [
    "currentStepImplementsOrderAdapter",
    "currentStepImportsManualPermission",
    "currentStepCallsProvider",
    "currentStepSubmitsOrder",
    "currentStepCreatesRuntimeRoute",
    "currentStepCreatesPublicUi",
  ]) {
    if (boundary[flag] !== false) {
      errors.push(
        makeError("boundary_action_enabled", `futureLiveGuardedOrderAdapterBoundary.${flag}`, `${flag} must be false`),
      );
    }
  }
  pushMissingArrayErrors(
    errors,
    boundary.reviewGates,
    REQUIRED_REVIEW_GATES,
    "futureLiveGuardedOrderAdapterBoundary.reviewGates",
    "missing_review_gate",
  );
  pushMissingArrayErrors(
    errors,
    boundary.implementationRules,
    REQUIRED_IMPLEMENTATION_RULES,
    "futureLiveGuardedOrderAdapterBoundary.implementationRules",
    "missing_implementation_rule",
  );
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenPreflightContent,
    REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT,
    "futureLiveGuardedOrderAdapterBoundary.forbiddenPreflightContent",
    "missing_forbidden_preflight_content",
  );
}

function validateLiveGuardedOrderAdapterImplementationPreflight(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateFutureBoundary(errors, contract.futureLiveGuardedOrderAdapterBoundary);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of [
      "manualOrderPermissionImportedNow",
      "privateShadowRuntimeImplementedNow",
      "privateOperatorAccessImplementedNow",
      "orderAdapterImplementationAllowedNow",
      "providerCallsAllowed",
      "orderSubmissionAllowed",
      "dbMigrationAllowed",
      "publicUiAllowed",
      "runtimeRouteAllowed",
      "liveTradingAllowed",
      "productionSecretsRequiredNow",
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
    console.log(
      "Usage: node scripts/validate-trading-live-guarded-order-adapter-implementation-preflight.cjs --contract <path>",
    );
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
  const result = validateLiveGuardedOrderAdapterImplementationPreflight(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateLiveGuardedOrderAdapterImplementationPreflight,
};

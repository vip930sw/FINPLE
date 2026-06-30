const fs = require("node:fs");

const REQUIRED_TOP_LEVEL_FIELDS = [
  "contractVersion",
  "auditedAt",
  "step",
  "scope",
  "sourceFiles",
  "outputFiles",
  "currentState",
  "futureReadOnlyProviderEndpointAllowlistBoundary",
  "checks",
  "evidence",
  "readiness",
];

const REQUIRED_ALLOWED_ENDPOINT_CATEGORIES = [
  "account_cash_balance_read",
  "account_positions_read",
  "orderable_cash_read",
  "current_quotes_read",
  "fx_rate_read",
  "market_session_state_read",
  "provider_rate_limit_state_read",
];

const REQUIRED_FORBIDDEN_ENDPOINT_CATEGORIES = [
  "order_submit",
  "order_cancel",
  "order_modify",
  "order_replace",
  "execution_fill_download",
  "order_confirmation_download",
  "account_transfer",
  "credential_or_token_introspection",
  "scenario_monthly_data_download",
];

const REQUIRED_ENDPOINT_RULES = [
  "category_allowlist_only",
  "no_provider_specific_endpoint_path_committed_now",
  "unknown_endpoint_category_fails_closed",
  "order_endpoint_category_rejected",
  "execution_endpoint_category_rejected",
  "token_endpoint_category_rejected",
  "scenario_monthly_endpoint_category_rejected",
  "private_worker_only",
  "owner_packet_import_required_later",
  "provider_implementation_review_required_later",
];

const REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT = [
  "provider_url_path",
  "provider_tr_id",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "scenario_monthly_return_row",
];

const FAIL_CLOSED_ALLOW_FLAGS = [
  "providerSpecificEndpointPathsRecordedNow",
  "providerSpecificTransactionIdsRecordedNow",
  "endpointAllowlistImplementationAllowed",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
  "productionSecretsRequiredNow",
];

const FORBIDDEN_STRING_PATTERNS = [
  /\/uapi\//i,
  /tr[_-]?id/i,
  /\b[A-Z]{4}\d{4}[A-Z]?\b/,
  /app[_-]?key/i,
  /app[_-]?secret/i,
  /access[_-]?token/i,
  /full[_-]?account[_-]?number/i,
  /\b\d{8,}\b/,
  /raw[_-]?provider/i,
  /raw[_-]?order/i,
  /order[_-]?confirmation/i,
  /execution[_-]?id/i,
  /fill[_-]?payload/i,
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

function extraValues(actual, allowed) {
  const allowedSet = new Set(allowed);
  return (Array.isArray(actual) ? actual : []).filter((value) => !allowedSet.has(value));
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
    valuePath.includes(".forbiddenEndpointCategories[") ||
    valuePath.endsWith(".forbiddenEndpointCategories") ||
    valuePath.includes(".endpointRules[") ||
    valuePath.endsWith(".endpointRules")
  );
}

function validateEndpointBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futureReadOnlyProviderEndpointAllowlistBoundary",
        "endpoint allowlist boundary must be an object",
      ),
    );
    return;
  }

  pushMissingArrayErrors(
    errors,
    boundary.allowedEndpointCategories,
    REQUIRED_ALLOWED_ENDPOINT_CATEGORIES,
    "futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories",
    "missing_allowed_endpoint_category",
  );
  extraValues(boundary.allowedEndpointCategories, REQUIRED_ALLOWED_ENDPOINT_CATEGORIES).forEach((category) => {
    errors.push(
      makeError(
        "unknown_allowed_endpoint_category",
        "futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories",
        `allowed endpoint category is unknown: ${category}`,
      ),
    );
  });
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenEndpointCategories,
    REQUIRED_FORBIDDEN_ENDPOINT_CATEGORIES,
    "futureReadOnlyProviderEndpointAllowlistBoundary.forbiddenEndpointCategories",
    "missing_forbidden_endpoint_category",
  );
  pushMissingArrayErrors(
    errors,
    boundary.endpointRules,
    REQUIRED_ENDPOINT_RULES,
    "futureReadOnlyProviderEndpointAllowlistBoundary.endpointRules",
    "missing_endpoint_rule",
  );
  pushMissingArrayErrors(
    errors,
    boundary.forbiddenPreflightContent,
    REQUIRED_FORBIDDEN_PREFLIGHT_CONTENT,
    "futureReadOnlyProviderEndpointAllowlistBoundary.forbiddenPreflightContent",
    "missing_forbidden_preflight_content",
  );

  const forbiddenSet = new Set(Array.isArray(boundary.forbiddenEndpointCategories) ? boundary.forbiddenEndpointCategories : []);
  for (const category of Array.isArray(boundary.allowedEndpointCategories) ? boundary.allowedEndpointCategories : []) {
    if (forbiddenSet.has(category)) {
      errors.push(
        makeError(
          "allowed_endpoint_category_overlaps_forbidden",
          "futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories",
          `${category} must not be both allowed and forbidden`,
        ),
      );
    }
  }
}

function validateReadOnlyProviderEndpointAllowlistContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateEndpointBoundary(errors, contract.futureReadOnlyProviderEndpointAllowlistBoundary);

  for (const containerName of ["currentState", "checks", "readiness"]) {
    const container = contract[containerName];
    if (!isPlainObject(container)) {
      errors.push(makeError("container_must_be_object", containerName, `${containerName} must be an object`));
      continue;
    }
    for (const flag of FAIL_CLOSED_ALLOW_FLAGS) {
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
      errors.push(makeError("forbidden_raw_value", valuePath, "contract contains a forbidden provider-specific value shape"));
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
    console.log("Usage: node scripts/validate-trading-read-only-provider-endpoint-allowlist-contract.cjs --contract <path>");
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
  const result = validateReadOnlyProviderEndpointAllowlistContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateReadOnlyProviderEndpointAllowlistContract,
};

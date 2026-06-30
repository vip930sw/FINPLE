const fs = require("node:fs");

const REQUIRED_TOP_LEVEL_FIELDS = [
  "contractVersion",
  "auditedAt",
  "step",
  "scope",
  "sourceFiles",
  "outputFiles",
  "currentState",
  "futureReadOnlyProviderEndpointCategoryValidationBoundary",
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

const REQUIRED_VALIDATION_RULES = [
  "allowed_categories_match_allowlist_contract",
  "allowed_categories_match_request_envelope_contract",
  "allowed_categories_match_local_validator",
  "unknown_endpoint_category_fails_closed",
  "order_endpoint_categories_rejected",
  "scenario_monthly_endpoint_categories_rejected",
  "provider_specific_path_mapping_deferred",
  "provider_calls_remain_blocked",
];

const FAIL_CLOSED_ALLOW_FLAGS = [
  "providerSpecificEndpointPathsRecordedNow",
  "providerSpecificTransactionIdsRecordedNow",
  "categoryValidatorImplementationAllowedNow",
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

function sortedUnique(values) {
  return [...new Set(Array.isArray(values) ? values : [])].sort();
}

function missingValues(actual, required) {
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  return required.filter((value) => !actualSet.has(value));
}

function extraValues(actual, allowed) {
  const allowedSet = new Set(allowed);
  return (Array.isArray(actual) ? actual : []).filter((value) => !allowedSet.has(value));
}

function symmetricDifference(left, right) {
  const leftValues = Array.isArray(left) ? left : [];
  const rightValues = Array.isArray(right) ? right : [];
  const leftSet = new Set(leftValues);
  const rightSet = new Set(rightValues);
  return [...leftValues.filter((value) => !rightSet.has(value)), ...rightValues.filter((value) => !leftSet.has(value))];
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
    valuePath.includes(".allowedEndpointCategories[") ||
    valuePath.endsWith(".allowedEndpointCategories") ||
    valuePath.includes(".validationRules[") ||
    valuePath.endsWith(".validationRules") ||
    valuePath.includes(".promotionRules[") ||
    valuePath.endsWith(".promotionRules")
  );
}

function validateCategoryBoundary(errors, boundary) {
  if (!isPlainObject(boundary)) {
    errors.push(
      makeError(
        "boundary_must_be_object",
        "futureReadOnlyProviderEndpointCategoryValidationBoundary",
        "endpoint category validation boundary must be an object",
      ),
    );
    return;
  }

  pushMissingArrayErrors(
    errors,
    boundary.allowedEndpointCategories,
    REQUIRED_ALLOWED_ENDPOINT_CATEGORIES,
    "futureReadOnlyProviderEndpointCategoryValidationBoundary.allowedEndpointCategories",
    "missing_allowed_endpoint_category",
  );
  extraValues(boundary.allowedEndpointCategories, REQUIRED_ALLOWED_ENDPOINT_CATEGORIES).forEach((category) => {
    errors.push(
      makeError(
        "unknown_allowed_endpoint_category",
        "futureReadOnlyProviderEndpointCategoryValidationBoundary.allowedEndpointCategories",
        `allowed endpoint category is unknown: ${category}`,
      ),
    );
  });
  pushMissingArrayErrors(
    errors,
    boundary.validationRules,
    REQUIRED_VALIDATION_RULES,
    "futureReadOnlyProviderEndpointCategoryValidationBoundary.validationRules",
    "missing_validation_rule",
  );
}

function validateEvidenceAlignment(errors, contract) {
  const boundaryCategories = sortedUnique(
    contract.futureReadOnlyProviderEndpointCategoryValidationBoundary?.allowedEndpointCategories,
  );
  for (const field of ["allowlistCategories", "requestEnvelopeCategories", "validatorCategories"]) {
    const categories = contract.evidence?.[field];
    if (!Array.isArray(categories)) {
      errors.push(makeError("field_must_be_array", `evidence.${field}`, `evidence.${field} must be an array`));
      continue;
    }
    const diff = symmetricDifference(boundaryCategories, sortedUnique(categories));
    if (diff.length > 0) {
      errors.push(makeError("endpoint_category_evidence_mismatch", `evidence.${field}`, `${field} must match boundary categories`));
    }
  }

  for (const field of [
    "missingRequiredAllowedCategories",
    "allowlistVsRequestEnvelopeDiff",
    "allowlistVsValidatorDiff",
    "missingForbiddenCategoryPatterns",
    "missingValidationRules",
  ]) {
    const values = contract.evidence?.[field];
    if (!Array.isArray(values)) {
      errors.push(makeError("field_must_be_array", `evidence.${field}`, `evidence.${field} must be an array`));
    } else if (values.length !== 0) {
      errors.push(makeError("endpoint_category_evidence_not_empty", `evidence.${field}`, `${field} must be empty`));
    }
  }
}

function validateReadOnlyProviderEndpointCategoryValidationPreflightContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return {
      valid: false,
      errors: [makeError("contract_must_be_object", "$", "contract must be a JSON object")],
    };
  }

  pushMissingArrayErrors(errors, Object.keys(contract), REQUIRED_TOP_LEVEL_FIELDS, "$", "missing_required_field");
  validateCategoryBoundary(errors, contract.futureReadOnlyProviderEndpointCategoryValidationBoundary);
  validateEvidenceAlignment(errors, contract);

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
    console.log(
      "Usage: node scripts/validate-trading-read-only-provider-endpoint-category-validation-preflight.cjs --contract <path>",
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
  const result = validateReadOnlyProviderEndpointCategoryValidationPreflightContract(contract);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  validateReadOnlyProviderEndpointCategoryValidationPreflightContract,
};

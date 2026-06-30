const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
);
const ENDPOINT_ALLOWLIST_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
);
const REQUEST_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-request-envelope.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-endpoint-category-validation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_ALLOWED_ENDPOINT_CATEGORIES = [
  "account_cash_balance_read",
  "account_positions_read",
  "orderable_cash_read",
  "current_quotes_read",
  "fx_rate_read",
  "market_session_state_read",
  "provider_rate_limit_state_read",
];
const REQUIRED_FORBIDDEN_CATEGORY_PATTERNS = [
  "order",
  "cancel",
  "execution",
  "confirmation",
  "token",
  "scenario",
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
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "processed", "scenario_monthly_returns.csv"),
];

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function asSortedUnique(values) {
  return [...new Set(values)].sort();
}

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function symmetricDifference(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return [...left.filter((value) => !rightSet.has(value)), ...right.filter((value) => !leftSet.has(value))].sort();
}

function extractValidatorAllowedCategories(validatorText) {
  const match = validatorText.match(/const ALLOWED_ENDPOINT_CATEGORIES = \[([\s\S]*?)\];/);
  if (!match) {
    return [];
  }
  return asSortedUnique(
    [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]).filter((value) => value.endsWith("_read")),
  );
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const endpointAllowlistContract = readJson(ENDPOINT_ALLOWLIST_CONTRACT_PATH);
  const requestEnvelopeContract = readJson(REQUEST_ENVELOPE_CONTRACT_PATH);
  const requestEnvelopeValidationPreflight = readJson(REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH);
  const callAuthorizationPreflight = readJson(CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const validatorText = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const allowlistCategories = asSortedUnique(
    endpointAllowlistContract.futureReadOnlyProviderEndpointAllowlistBoundary?.allowedEndpointCategories ?? [],
  );
  const requestEnvelopeCategories = asSortedUnique(
    requestEnvelopeContract.futureReadOnlyProviderRequestEnvelopeBoundary?.allowedReadEndpointCategories ?? [],
  );
  const validatorCategories = extractValidatorAllowedCategories(validatorText);
  const validationRules = [...REQUIRED_VALIDATION_RULES];
  const missingRequiredAllowedCategories = missingValues(allowlistCategories, REQUIRED_ALLOWED_ENDPOINT_CATEGORIES);
  const missingValidationRules = missingValues(validationRules, REQUIRED_VALIDATION_RULES);
  const allowlistVsRequestEnvelopeDiff = symmetricDifference(allowlistCategories, requestEnvelopeCategories);
  const allowlistVsValidatorDiff = symmetricDifference(allowlistCategories, validatorCategories);
  const missingForbiddenCategoryPatterns = REQUIRED_FORBIDDEN_CATEGORY_PATTERNS.filter(
    (pattern) => !validatorText.includes(pattern),
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    endpointAllowlistContractReady:
      endpointAllowlistContract.readiness?.readyForFutureReadOnlyProviderEndpointAllowlistReview === true &&
      endpointAllowlistContract.readiness?.providerCallsAllowed === false &&
      endpointAllowlistContract.readiness?.orderSubmissionAllowed === false,
    requestEnvelopeContractReady:
      requestEnvelopeContract.readiness?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      requestEnvelopeContract.readiness?.providerCallsAllowed === false,
    requestEnvelopeValidationPreflightReady:
      requestEnvelopeValidationPreflight.readiness?.readyForPureLocalRequestEnvelopeValidatorImplementationReview ===
        true &&
      requestEnvelopeValidationPreflight.readiness?.providerRequestCreatedNow === false &&
      requestEnvelopeValidationPreflight.readiness?.providerCallsAllowed === false,
    callAuthorizationStillBlocked:
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false,
    requiredAllowedCategoriesReady: missingRequiredAllowedCategories.length === 0,
    allowlistMatchesRequestEnvelope: allowlistVsRequestEnvelopeDiff.length === 0,
    allowlistMatchesValidator: allowlistVsValidatorDiff.length === 0,
    forbiddenCategoryPatternsReady: missingForbiddenCategoryPatterns.length === 0,
    validationRulesReady: missingValidationRules.length === 0,
    architectureDocMentionsEndpointCategoryValidation:
      architectureDoc.includes("Trading Read-Only Provider Endpoint Category Validation Preflight") &&
      architectureDoc.includes("read_only_provider_endpoint_category_validation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3H",
    scope: "read_only_provider_endpoint_category_validation_preflight",
    sourceFiles: {
      endpointAllowlistContract: ENDPOINT_ALLOWLIST_CONTRACT_PATH,
      requestEnvelopeContract: REQUEST_ENVELOPE_CONTRACT_PATH,
      requestEnvelopeValidationPreflight: REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH,
      callAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      providerSpecificEndpointPathsRecordedNow: false,
      providerSpecificTransactionIdsRecordedNow: false,
      categoryValidatorImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureReadOnlyProviderEndpointCategoryValidationBoundary: {
      scope: "read_only_provider_endpoint_category_validation_preflight",
      allowedEndpointCategories: allowlistCategories,
      validationRules,
      promotionRules: [
        "this preflight records category alignment only",
        "provider-specific endpoint paths and transaction ids remain deferred",
        "category validation success does not authorize provider calls",
        "category validation success does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      allowlistCategories,
      requestEnvelopeCategories,
      validatorCategories,
      missingRequiredAllowedCategories,
      allowlistVsRequestEnvelopeDiff,
      allowlistVsValidatorDiff,
      missingForbiddenCategoryPatterns,
      missingValidationRules,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      endpointAllowlistContractStatus: endpointAllowlistContract.readiness?.status,
      requestEnvelopeContractStatus: requestEnvelopeContract.readiness?.status,
      requestEnvelopeValidationPreflightStatus: requestEnvelopeValidationPreflight.readiness?.status,
      callAuthorizationPreflightStatus: callAuthorizationPreflight.readiness?.status,
    },
    readiness: {
      status: "preflight_ready_endpoint_categories_aligned_provider_calls_blocked",
      readyForFutureReadOnlyProviderEndpointCategoryValidationReview: true,
      categoryValidatorImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.endpointAllowlistContractReady ? [] : ["endpoint_allowlist_contract_not_ready"]),
        ...(checks.requestEnvelopeContractReady ? [] : ["request_envelope_contract_not_ready"]),
        ...(checks.requestEnvelopeValidationPreflightReady
          ? []
          : ["request_envelope_validation_preflight_not_ready"]),
        ...(checks.callAuthorizationStillBlocked ? [] : ["provider_call_authorization_not_blocked"]),
        ...missingRequiredAllowedCategories.map((category) => `missing_required_allowed_category_${category}`),
        ...allowlistVsRequestEnvelopeDiff.map((category) => `allowlist_request_envelope_category_mismatch_${category}`),
        ...allowlistVsValidatorDiff.map((category) => `allowlist_validator_category_mismatch_${category}`),
        ...missingForbiddenCategoryPatterns.map((pattern) => `missing_forbidden_category_pattern_${pattern}`),
        ...missingValidationRules.map((rule) => `missing_validation_rule_${rule}`),
        ...(checks.architectureDocMentionsEndpointCategoryValidation
          ? []
          : ["architecture_doc_missing_endpoint_category_validation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-endpoint-category-validation-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-endpoint-category-validation-preflight.cjs`);
    }
    console.log("[generate-trading-read-only-provider-endpoint-category-validation-preflight] ok");
    console.log(`[generate-trading-read-only-provider-endpoint-category-validation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-endpoint-category-validation-preflight] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-endpoint-category-validation-preflight] providerCallsAllowed=${parsed.readiness.providerCallsAllowed}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json",
);
const REQUEST_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-request-envelope-validation-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-provider-request-envelope.cjs",
);
const REQUIRED_VALIDATION_RULES = [
  "envelope_must_match_request_contract_fields",
  "unknown_fields_rejected",
  "request_id_must_be_opaque",
  "mode_must_be_shadow",
  "approval_id_must_be_labelled_hash",
  "base_url_must_be_openapivts_virtual_trading",
  "method_must_be_get",
  "path_template_must_be_shape_only",
  "path_template_must_not_include_order_token_or_live_endpoint",
  "endpoint_category_must_be_allowed_read_only_category",
  "query_shape_must_not_contain_values_or_secrets",
  "header_names_must_not_contain_secret_values",
  "body_shape_must_be_empty_or_hash_only",
  "timestamp_must_be_iso",
  "idempotency_key_must_be_opaque",
  "request_hash_must_be_labelled_hash",
  "response_hash_must_be_labelled_hash_or_pending_hash",
  "provider_call_allowed_must_be_false",
  "provider_order_runtime_ui_flags_must_remain_disabled",
  "scenario_monthly_cache_write_must_remain_forbidden",
];
const REQUIRED_REJECTION_REASONS = [
  "missing_required_field",
  "unknown_field",
  "invalid_request_id",
  "invalid_mode",
  "malformed_hash_field",
  "invalid_base_url",
  "invalid_method",
  "unsafe_path_template",
  "unknown_endpoint_category",
  "secret_value_present",
  "raw_provider_payload_present",
  "provider_call_flag_enabled",
  "order_submission_requested",
  "runtime_route_requested",
  "scenario_monthly_cache_write_requested",
];
const FORBIDDEN_ENVELOPE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "token_refresh",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingReadOnlyProviderRequestEnvelopeValidation.js"),
  path.join("server", "src", "services", "trading", "readOnlyProviderRequestEnvelopeValidation.js"),
  path.join("server", "src", "services", "tradingReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const requestEnvelopeContract = readJson(REQUEST_ENVELOPE_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const redactedApprovalPacketValidatorFixtures = readJson(REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const boundary = requestEnvelopeContract.futureReadOnlyProviderRequestEnvelopeBoundary ?? {};
  const requiredEnvelopeFields = boundary.requiredEnvelopeFields ?? [];
  const allowedReadEndpointCategories = boundary.allowedReadEndpointCategories ?? [];
  const forbiddenEndpointCategories = boundary.forbiddenEndpointCategories ?? [];
  const validationRules = [...REQUIRED_VALIDATION_RULES];
  const rejectionReasons = [...REQUIRED_REJECTION_REASONS];
  const forbiddenEnvelopeContent = [...FORBIDDEN_ENVELOPE_CONTENT];
  const missingValidationRules = missingValues(validationRules, REQUIRED_VALIDATION_RULES);
  const missingRejectionReasons = missingValues(rejectionReasons, REQUIRED_REJECTION_REASONS);
  const missingForbiddenEnvelopeContent = missingValues(forbiddenEnvelopeContent, FORBIDDEN_ENVELOPE_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    requestEnvelopeContractReady:
      requestEnvelopeContract.readiness?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      requestEnvelopeContract.readiness?.requestEnvelopeImplementationAllowed === false &&
      requestEnvelopeContract.readiness?.providerCallsAllowed === false &&
      requestEnvelopeContract.readiness?.orderSubmissionAllowed === false &&
      requestEnvelopeContract.readiness?.runtimeRouteAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false,
    redactedApprovalPacketValidatorFixturesReady:
      redactedApprovalPacketValidatorFixtures.readiness?.readyForValidatorFixtureRegression === true &&
      redactedApprovalPacketValidatorFixtures.readiness?.privateApprovalPacketCreated === false &&
      redactedApprovalPacketValidatorFixtures.readiness?.providerCallsAllowed === false &&
      redactedApprovalPacketValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillLocked:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.providerCallsAllowed === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    envelopeFieldsReady:
      requiredEnvelopeFields.includes("requestId") &&
      requiredEnvelopeFields.includes("approvalIdHash") &&
      requiredEnvelopeFields.includes("baseUrl") &&
      requiredEnvelopeFields.includes("method") &&
      requiredEnvelopeFields.includes("pathTemplate") &&
      requiredEnvelopeFields.includes("providerCallAllowed"),
    allowedReadEndpointCategoriesReady:
      allowedReadEndpointCategories.includes("account_cash_balance_read") &&
      allowedReadEndpointCategories.includes("account_positions_read") &&
      allowedReadEndpointCategories.includes("current_quotes_read"),
    forbiddenEndpointCategoriesReady:
      forbiddenEndpointCategories.includes("order_submission") &&
      forbiddenEndpointCategories.includes("order_cancellation") &&
      forbiddenEndpointCategories.includes("live_order_endpoint") &&
      forbiddenEndpointCategories.includes("scenario_monthly_cache_write"),
    validationRulesReady: missingValidationRules.length === 0,
    rejectionReasonsReady: missingRejectionReasons.length === 0,
    forbiddenEnvelopeContentReady: missingForbiddenEnvelopeContent.length === 0,
    architectureDocMentionsRequestEnvelopeValidation:
      architectureDoc.includes("Trading Read-Only Provider Request Envelope Validation Contract") &&
      architectureDoc.includes("read_only_provider_request_envelope_validation"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview =
    checks.requestEnvelopeContractReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.redactedApprovalPacketValidatorFixturesReady &&
    checks.progressSummaryStillLocked &&
    checks.envelopeFieldsReady &&
    checks.allowedReadEndpointCategoriesReady &&
    checks.forbiddenEndpointCategoriesReady &&
    checks.validationRulesReady &&
    checks.rejectionReasonsReady &&
    checks.forbiddenEnvelopeContentReady &&
    checks.architectureDocMentionsRequestEnvelopeValidation &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2M",
    scope: "trading_read_only_provider_request_envelope_validation_contract",
    sourceFiles: {
      requestEnvelopeContract: REQUEST_ENVELOPE_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      redactedApprovalPacketValidatorFixtures: REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      validationImplementationAllowed: false,
      requestEnvelopeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureReadOnlyProviderRequestEnvelopeValidationBoundary: {
      scope: "read_only_provider_request_envelope_validation",
      futureValidatorPath: FUTURE_VALIDATOR_PATH,
      currentStepImplementsValidator: false,
      currentStepCreatesProviderRequest: false,
      currentStepCallsProvider: false,
      requiredEnvelopeFields,
      allowedReadEndpointCategories,
      forbiddenEndpointCategories,
      requiredValidationRules: validationRules,
      requiredRejectionReasons: rejectionReasons,
      forbiddenEnvelopeContent,
      promotionRules: [
        "validation contract success permits only a future pure local envelope validator review",
        "validation contract success does not create provider requests",
        "validation contract success does not call KIS or any provider",
        "validation contract success does not create runtime routes, DB migrations, public UI, or orders",
      ],
    },
    checks,
    evidence: {
      missingValidationRules,
      missingRejectionReasons,
      missingForbiddenEnvelopeContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      requestEnvelopeContractStatus: requestEnvelopeContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      redactedApprovalPacketValidatorFixturesStatus: redactedApprovalPacketValidatorFixtures.readiness?.status,
      progressSummaryStatus: progressSummary.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview
        ? "contract_ready_pending_read_only_provider_request_envelope_validation_implementation_review"
        : "blocked_before_read_only_provider_request_envelope_validation_contract",
      readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview,
      validationImplementationAllowed: false,
      requestEnvelopeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.requestEnvelopeContractReady ? [] : ["read_only_provider_request_envelope_contract_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.redactedApprovalPacketValidatorFixturesReady
          ? []
          : ["redacted_approval_packet_validator_fixtures_not_ready"]),
        ...(checks.progressSummaryStillLocked ? [] : ["progress_summary_not_locked"]),
        ...(checks.envelopeFieldsReady ? [] : ["request_envelope_fields_not_ready"]),
        ...(checks.allowedReadEndpointCategoriesReady ? [] : ["allowed_read_endpoint_categories_not_ready"]),
        ...(checks.forbiddenEndpointCategoriesReady ? [] : ["forbidden_endpoint_categories_not_ready"]),
        ...missingValidationRules.map((rule) => `missing_validation_rule_${rule}`),
        ...missingRejectionReasons.map((reason) => `missing_rejection_reason_${reason}`),
        ...missingForbiddenEnvelopeContent.map((content) => `missing_forbidden_envelope_content_${content}`),
        ...(checks.architectureDocMentionsRequestEnvelopeValidation
          ? []
          : ["architecture_doc_missing_read_only_provider_request_envelope_validation"]),
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
      fail(
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-request-envelope-validation-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-request-envelope-validation-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-provider-request-envelope-validation-contract] ok");
    console.log(`[generate-trading-read-only-provider-request-envelope-validation-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-request-envelope-validation-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-request-envelope-validation-contract] readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview=${parsed.readiness.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview}`,
  );
}

main();

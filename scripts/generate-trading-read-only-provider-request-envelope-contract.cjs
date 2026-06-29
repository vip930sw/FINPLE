const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const SHADOW_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_mode_contract.json");
const ENV_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_readiness_contract.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const AUDIT_LOGGER_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-request-envelope-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_ENVELOPE_FIELDS = [
  "requestId",
  "mode",
  "approvalIdHash",
  "baseUrl",
  "method",
  "pathTemplate",
  "endpointCategory",
  "queryShape",
  "headerNames",
  "bodyShape",
  "timestamp",
  "idempotencyKey",
  "requestHash",
  "responseHash",
  "redactionVersion",
  "providerCallAllowed",
];
const ALLOWED_READ_ENDPOINT_CATEGORIES = [
  "account_cash_balance_read",
  "account_positions_read",
  "orderable_cash_read",
  "current_quotes_read",
  "fx_rate_read",
  "market_session_state_read",
  "provider_rate_limit_state_read",
];
const FORBIDDEN_ENDPOINT_CATEGORIES = [
  "order_submission",
  "order_cancellation",
  "position_mutation",
  "live_order_endpoint",
  "token_refresh_persistence",
  "raw_provider_payload_persistence",
  "scenario_monthly_cache_write",
];
const REQUIRED_ENVELOPE_ASSERTIONS = [
  "no_provider_call_in_current_step",
  "virtual_trading_base_url_only",
  "no_live_endpoint",
  "no_order_endpoint",
  "request_body_hash_only",
  "response_body_hash_only",
  "no_secret_values_in_envelope",
  "account_identifier_hash_only",
  "rate_limit_metadata_only",
  "approval_import_must_be_valid_before_future_call",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingReadOnlyProviderRequestEnvelope.js"),
  path.join("server", "src", "services", "trading", "readOnlyProviderRequestEnvelope.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyEnvelope.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const shadowContract = readJson(SHADOW_CONTRACT_PATH);
  const envReadinessContract = readJson(ENV_READINESS_CONTRACT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const envelopeFields = [...REQUIRED_ENVELOPE_FIELDS];
  const allowedReadEndpointCategories = [...ALLOWED_READ_ENDPOINT_CATEGORIES];
  const forbiddenEndpointCategories = [...FORBIDDEN_ENDPOINT_CATEGORIES];
  const envelopeAssertions = [...REQUIRED_ENVELOPE_ASSERTIONS];
  const missingEnvelopeFields = missingValues(envelopeFields, REQUIRED_ENVELOPE_FIELDS);
  const missingAllowedReadEndpointCategories = missingValues(
    allowedReadEndpointCategories,
    ALLOWED_READ_ENDPOINT_CATEGORIES,
  );
  const missingForbiddenEndpointCategories = missingValues(
    forbiddenEndpointCategories,
    FORBIDDEN_ENDPOINT_CATEGORIES,
  );
  const missingEnvelopeAssertions = missingValues(envelopeAssertions, REQUIRED_ENVELOPE_ASSERTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    shadowContractStillBlocksRuntime:
      shadowContract.readiness?.readyForFutureReadOnlyIntegrationReview === true &&
      shadowContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      shadowContract.readiness?.providerCallsAllowed === false &&
      shadowContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false,
    envReadinessContractStillBlocksRuntime:
      envReadinessContract.readiness?.readyForCurrentStep === true &&
      envReadinessContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      envReadinessContract.readiness?.providerCallsAllowed === false &&
      envReadinessContract.readiness?.orderSubmissionAllowed === false,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.readyForRuntimeRoute === false &&
      envRiskGateContract.readiness?.readyForProviderCalls === false &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    auditLoggerReadinessContractReady:
      auditLoggerReadinessContract.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadinessContract.readiness?.auditLoggerImplementationAllowed === false &&
      auditLoggerReadinessContract.readiness?.providerCallsAllowed === false &&
      auditLoggerReadinessContract.readiness?.orderSubmissionAllowed === false,
    envelopeFieldsReady: missingEnvelopeFields.length === 0,
    allowedReadEndpointCategoriesReady: missingAllowedReadEndpointCategories.length === 0,
    forbiddenEndpointCategoriesReady: missingForbiddenEndpointCategories.length === 0,
    envelopeAssertionsReady: missingEnvelopeAssertions.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsReadOnlyProviderRequestEnvelope:
      architectureDoc.includes("Trading Read-Only Provider Request Envelope Contract") &&
      architectureDoc.includes("read_only_provider_request_envelope"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    requestEnvelopeImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview =
    checks.shadowModePolicyReady &&
    checks.shadowContractStillBlocksRuntime &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.envReadinessContractStillBlocksRuntime &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.envelopeFieldsReady &&
    checks.allowedReadEndpointCategoriesReady &&
    checks.forbiddenEndpointCategoriesReady &&
    checks.envelopeAssertionsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsReadOnlyProviderRequestEnvelope &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1U",
    scope: "trading_read_only_provider_request_envelope_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      envReadinessContract: ENV_READINESS_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      requestEnvelopeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyProviderRequestEnvelopeBoundary: {
      scope: "read_only_provider_request_envelope",
      purpose:
        "define the future KIS read-only request envelope, hashing, endpoint category, and redaction boundary before any provider call implementation review",
      requiredEnvelopeFields: envelopeFields,
      allowedReadEndpointCategories,
      forbiddenEndpointCategories,
      requiredEnvelopeAssertions: envelopeAssertions,
      redactionRules: [
        "store request and response hashes only",
        "never store access tokens, app secrets, full account numbers, or raw provider payloads",
        "approval identifiers and account identifiers must be hashes",
        "endpoint path templates may be stored but resolved URLs with sensitive query values may not be persisted",
      ],
      promotionRules: [
        "request envelope review does not perform provider calls",
        "request envelope review does not enable read-only runtime by itself",
        "request envelope review cannot include order-capable endpoints",
        "future implementation must fail closed when endpoint category is unknown",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingEnvelopeFields,
      missingAllowedReadEndpointCategories,
      missingForbiddenEndpointCategories,
      missingEnvelopeAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      envReadinessContractStatus: envReadinessContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview
        ? "contract_ready_pending_read_only_provider_request_envelope_implementation_review"
        : "blocked_before_read_only_provider_request_envelope_contract",
      readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview,
      requestEnvelopeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.shadowContractStillBlocksRuntime ? [] : ["shadow_contract_allows_runtime_too_early"]),
        ...(checks.readOnlyApprovalImportPreflightReady
          ? []
          : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.envReadinessContractStillBlocksRuntime ? [] : ["env_readiness_contract_allows_runtime_too_early"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingEnvelopeFields.map((field) => `missing_envelope_field_${field}`),
        ...missingAllowedReadEndpointCategories.map((category) => `missing_allowed_read_endpoint_category_${category}`),
        ...missingForbiddenEndpointCategories.map((category) => `missing_forbidden_endpoint_category_${category}`),
        ...missingEnvelopeAssertions.map((assertion) => `missing_envelope_assertion_${assertion}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsReadOnlyProviderRequestEnvelope
          ? []
          : ["architecture_doc_missing_read_only_provider_request_envelope_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-request-envelope-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-request-envelope-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-provider-request-envelope-contract] ok");
    console.log(`[generate-trading-read-only-provider-request-envelope-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-request-envelope-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-request-envelope-contract] readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview=${parsed.readiness.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview}`,
  );
}

main();

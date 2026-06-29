const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const SHADOW_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_mode_contract.json");
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
const READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-response-envelope-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RESPONSE_FIELDS = [
  "requestId",
  "mode",
  "endpointCategory",
  "statusCodeClass",
  "providerStatus",
  "receivedAt",
  "latencyBucket",
  "rateLimitState",
  "normalizedSnapshotType",
  "normalizedSnapshotHash",
  "rawResponseHash",
  "redactionVersion",
  "providerCallAllowed",
  "orderSubmissionAllowed",
];
const ALLOWED_NORMALIZED_SNAPSHOT_TYPES = [
  "account_cash_balance_snapshot",
  "account_positions_snapshot",
  "orderable_cash_snapshot",
  "current_quotes_snapshot",
  "fx_rate_snapshot",
  "market_session_state_snapshot",
  "provider_rate_limit_state_snapshot",
];
const FORBIDDEN_RESPONSE_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "live_order_endpoint",
  "unhashed_account_identifier",
  "scenario_monthly_return_row",
];
const REQUIRED_RESPONSE_ASSERTIONS = [
  "no_provider_call_in_current_step",
  "raw_response_hash_only",
  "normalized_snapshot_hash_only",
  "account_identifier_hash_only",
  "no_order_response_category",
  "no_execution_or_fill_payload",
  "rate_limit_metadata_only",
  "response_success_does_not_enable_runtime",
  "response_success_does_not_approve_live_guarded",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingReadOnlyProviderResponseEnvelope.js"),
  path.join("server", "src", "services", "trading", "readOnlyProviderResponseEnvelope.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyResponseEnvelope.js"),
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
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const readOnlyProviderRequestEnvelopeContract = readJson(READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const responseFields = [...REQUIRED_RESPONSE_FIELDS];
  const normalizedSnapshotTypes = [...ALLOWED_NORMALIZED_SNAPSHOT_TYPES];
  const forbiddenResponseContent = [...FORBIDDEN_RESPONSE_CONTENT];
  const responseAssertions = [...REQUIRED_RESPONSE_ASSERTIONS];
  const missingResponseFields = missingValues(responseFields, REQUIRED_RESPONSE_FIELDS);
  const missingNormalizedSnapshotTypes = missingValues(normalizedSnapshotTypes, ALLOWED_NORMALIZED_SNAPSHOT_TYPES);
  const missingForbiddenResponseContent = missingValues(forbiddenResponseContent, FORBIDDEN_RESPONSE_CONTENT);
  const missingResponseAssertions = missingValues(responseAssertions, REQUIRED_RESPONSE_ASSERTIONS);
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
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false,
    readOnlyProviderRequestEnvelopeContractReady:
      readOnlyProviderRequestEnvelopeContract.readiness
        ?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      readOnlyProviderRequestEnvelopeContract.readiness?.providerCallsAllowed === false &&
      readOnlyProviderRequestEnvelopeContract.readiness?.orderSubmissionAllowed === false,
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
    responseFieldsReady: missingResponseFields.length === 0,
    normalizedSnapshotTypesReady: missingNormalizedSnapshotTypes.length === 0,
    forbiddenResponseContentReady: missingForbiddenResponseContent.length === 0,
    responseAssertionsReady: missingResponseAssertions.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsReadOnlyProviderResponseEnvelope:
      architectureDoc.includes("Trading Read-Only Provider Response Envelope Contract") &&
      architectureDoc.includes("read_only_provider_response_envelope"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    responseEnvelopeImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview =
    checks.shadowModePolicyReady &&
    checks.shadowContractStillBlocksRuntime &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.readOnlyProviderRequestEnvelopeContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.responseFieldsReady &&
    checks.normalizedSnapshotTypesReady &&
    checks.forbiddenResponseContentReady &&
    checks.responseAssertionsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsReadOnlyProviderResponseEnvelope &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1V",
    scope: "trading_read_only_provider_response_envelope_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      readOnlyProviderRequestEnvelopeContract: READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      responseEnvelopeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyProviderResponseEnvelopeBoundary: {
      scope: "read_only_provider_response_envelope",
      purpose:
        "define the future KIS read-only response envelope, normalized snapshot hash, raw response hash, and redaction boundary before any provider call implementation review",
      requiredResponseFields: responseFields,
      allowedNormalizedSnapshotTypes: normalizedSnapshotTypes,
      forbiddenResponseContent,
      requiredResponseAssertions: responseAssertions,
      redactionRules: [
        "store raw provider responses as hashes only",
        "store normalized snapshots as hashes unless a later storage contract approves exact fields",
        "never store access tokens, app secrets, full account numbers, or raw provider payloads",
        "response envelopes cannot contain execution, fill, or order-confirmation payloads",
      ],
      promotionRules: [
        "response envelope review does not perform provider calls",
        "response envelope review does not enable read-only runtime by itself",
        "response envelope review cannot include order-capable responses",
        "future implementation must fail closed when snapshot type is unknown",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingResponseFields,
      missingNormalizedSnapshotTypes,
      missingForbiddenResponseContent,
      missingResponseAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      readOnlyProviderRequestEnvelopeContractStatus: readOnlyProviderRequestEnvelopeContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview
        ? "contract_ready_pending_read_only_provider_response_envelope_implementation_review"
        : "blocked_before_read_only_provider_response_envelope_contract",
      readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview,
      responseEnvelopeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.shadowContractStillBlocksRuntime ? [] : ["shadow_contract_allows_runtime_too_early"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.readOnlyProviderRequestEnvelopeContractReady
          ? []
          : ["read_only_provider_request_envelope_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingResponseFields.map((field) => `missing_response_field_${field}`),
        ...missingNormalizedSnapshotTypes.map((type) => `missing_normalized_snapshot_type_${type}`),
        ...missingForbiddenResponseContent.map((content) => `missing_forbidden_response_content_${content}`),
        ...missingResponseAssertions.map((assertion) => `missing_response_assertion_${assertion}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsReadOnlyProviderResponseEnvelope
          ? []
          : ["architecture_doc_missing_read_only_provider_response_envelope_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-response-envelope-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-response-envelope-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-provider-response-envelope-contract] ok");
    console.log(`[generate-trading-read-only-provider-response-envelope-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-response-envelope-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-response-envelope-contract] readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview=${parsed.readiness.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview}`,
  );
}

main();

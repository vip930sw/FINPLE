const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
);
const REQUEST_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const RESPONSE_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const SNAPSHOT_NORMALIZATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const SNAPSHOT_RISK_INPUT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
);
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-call-authorization-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PROVIDER_CALL_SERVICE_PATH = path.join(
  "server",
  "src",
  "services",
  "trading",
  "kisReadOnlyProvider.js",
);
const REQUIRED_REVIEW_GATES = [
  "owner_read_only_approval_import_still_blocked",
  "private_read_only_provider_implementation_still_blocked",
  "request_envelope_validation_preflight_ready",
  "request_envelope_contract_ready",
  "response_envelope_contract_ready",
  "snapshot_normalization_contract_ready",
  "snapshot_risk_input_contract_ready",
  "private_shadow_runtime_review_still_blocked",
  "env_risk_gate_fail_closed",
];
const REQUIRED_AUTHORIZATION_RULES = [
  "private_worker_only",
  "read_only_endpoints_only",
  "explicit_validated_request_envelope_required_later",
  "explicit_imported_owner_packet_required_later",
  "no_provider_call_now",
  "no_token_refresh_now",
  "no_order_endpoint",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "redacted_error_messages_only",
  "fail_closed_without_owner_approval_import",
  "fail_closed_without_provider_implementation_review",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
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
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_PROVIDER_CALL_SERVICE_PATH,
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
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
  const approvalImportImplementationPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateReadOnlyProviderImplementationPreflight = readJson(PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH);
  const requestEnvelopeValidationPreflight = readJson(REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH);
  const requestEnvelopeContract = readJson(REQUEST_ENVELOPE_CONTRACT_PATH);
  const responseEnvelopeContract = readJson(RESPONSE_ENVELOPE_CONTRACT_PATH);
  const snapshotNormalizationContract = readJson(SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const snapshotRiskInputContract = readJson(SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const privateShadowRuntimeImplementationPreflight = readJson(PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewGates = [...REQUIRED_REVIEW_GATES];
  const authorizationRules = [...REQUIRED_AUTHORIZATION_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingReviewGates = missingValues(reviewGates, REQUIRED_REVIEW_GATES);
  const missingAuthorizationRules = missingValues(authorizationRules, REQUIRED_AUTHORIZATION_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    approvalImportImplementationStillBlocked:
      approvalImportImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview ===
        false &&
      approvalImportImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      approvalImportImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalImportImplementationPreflight.readiness?.providerCallsAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderImplementationPreflight.readiness?.ownerPacketGateStillClosed === true &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerCallsAllowed === false,
    requestEnvelopeValidationPreflightReady:
      requestEnvelopeValidationPreflight.readiness?.readyForPureLocalRequestEnvelopeValidatorImplementationReview ===
        true &&
      requestEnvelopeValidationPreflight.readiness?.providerRequestCreatedNow === false &&
      requestEnvelopeValidationPreflight.readiness?.providerCallsAllowed === false,
    requestEnvelopeContractReady:
      requestEnvelopeContract.readiness?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      requestEnvelopeContract.readiness?.providerCallsAllowed === false,
    responseEnvelopeContractReady:
      responseEnvelopeContract.readiness?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      responseEnvelopeContract.readiness?.providerCallsAllowed === false,
    snapshotNormalizationContractReady:
      snapshotNormalizationContract.readiness?.readyForFutureReadOnlySnapshotNormalizationImplementationReview === true &&
      snapshotNormalizationContract.readiness?.providerCallsAllowed === false,
    snapshotRiskInputContractReady:
      snapshotRiskInputContract.readiness?.readyForFutureReadOnlySnapshotRiskInputImplementationReview === true &&
      snapshotRiskInputContract.readiness?.providerCallsAllowed === false,
    privateShadowRuntimeImplementationStillBlocked:
      privateShadowRuntimeImplementationPreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview ===
        false &&
      privateShadowRuntimeImplementationPreflight.readiness?.privateShadowRuntimeImplementationAllowedNow === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.providerCallsAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    authorizationRulesReady: missingAuthorizationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsReadOnlyProviderCallAuthorizationPreflight:
      architectureDoc.includes("Trading Read-Only Provider Call Authorization Preflight") &&
      architectureDoc.includes("read_only_provider_call_authorization_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallAuthorizationAllowedNow: false,
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
    step: "Step 116-3F",
    scope: "read_only_provider_call_authorization_preflight",
    sourceFiles: {
      readOnlyApprovalImportImplementationPreflight: READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      requestEnvelopeValidationPreflight: REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH,
      requestEnvelopeContract: REQUEST_ENVELOPE_CONTRACT_PATH,
      responseEnvelopeContract: RESPONSE_ENVELOPE_CONTRACT_PATH,
      snapshotNormalizationContract: SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      snapshotRiskInputContract: SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      privateShadowRuntimeImplementationPreflight: PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      providerCallAuthorizationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyProviderCallAuthorizationBoundary: {
      scope: "read_only_provider_call_authorization_preflight",
      futureProviderCallServicePath: FUTURE_PROVIDER_CALL_SERVICE_PATH,
      currentStepAuthorizesProviderCalls: false,
      currentStepCreatesProviderRequest: false,
      currentStepCallsProvider: false,
      currentStepRefreshesToken: false,
      currentStepWritesDatabase: false,
      reviewGates,
      authorizationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not authorize read-only provider calls",
        "provider calls remain blocked until owner approval import and provider implementation reviews are recorded separately",
        "future provider call review must remain read-only, private-worker-only, and fail-closed on unknown endpoint categories",
        "read-only provider call success still does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingAuthorizationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      readOnlyApprovalImportImplementationPreflightStatus: approvalImportImplementationPreflight.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus:
        privateReadOnlyProviderImplementationPreflight.readiness?.status,
      requestEnvelopeValidationPreflightStatus: requestEnvelopeValidationPreflight.readiness?.status,
      requestEnvelopeContractStatus: requestEnvelopeContract.readiness?.status,
      responseEnvelopeContractStatus: responseEnvelopeContract.readiness?.status,
      snapshotNormalizationContractStatus: snapshotNormalizationContract.readiness?.status,
      snapshotRiskInputContractStatus: snapshotRiskInputContract.readiness?.status,
      privateShadowRuntimeImplementationPreflightStatus:
        privateShadowRuntimeImplementationPreflight.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_provider_call_authorization_blocked_pending_owner_packet_and_provider_review",
      readyForFutureReadOnlyProviderCallAuthorizationReview: false,
      providerCallAuthorizationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.approvalImportImplementationStillBlocked
          ? []
          : ["read_only_approval_import_implementation_not_blocked"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_not_blocked"]),
        ...(checks.requestEnvelopeValidationPreflightReady
          ? []
          : ["request_envelope_validation_preflight_not_ready"]),
        ...(checks.requestEnvelopeContractReady ? [] : ["request_envelope_contract_not_ready"]),
        ...(checks.responseEnvelopeContractReady ? [] : ["response_envelope_contract_not_ready"]),
        ...(checks.snapshotNormalizationContractReady ? [] : ["snapshot_normalization_contract_not_ready"]),
        ...(checks.snapshotRiskInputContractReady ? [] : ["snapshot_risk_input_contract_not_ready"]),
        ...(checks.privateShadowRuntimeImplementationStillBlocked
          ? []
          : ["private_shadow_runtime_implementation_not_blocked"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingAuthorizationRules.map((rule) => `missing_authorization_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsReadOnlyProviderCallAuthorizationPreflight
          ? []
          : ["architecture_doc_missing_read_only_provider_call_authorization_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
        "private_read_only_provider_implementation_review_blocked_pending_owner_packet_import",
        "read_only_provider_call_authorization_blocked_pending_owner_packet_and_provider_review",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-call-authorization-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-call-authorization-preflight.cjs`);
    }
    console.log("[generate-trading-read-only-provider-call-authorization-preflight] ok");
    console.log(`[generate-trading-read-only-provider-call-authorization-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-call-authorization-preflight] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-call-authorization-preflight] providerCallsAllowed=${parsed.readiness.providerCallsAllowed}`,
  );
}

main();

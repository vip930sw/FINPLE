const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
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
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-read-only-provider-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PROVIDER_IMPLEMENTATION_PATH = path.join(
  "server",
  "src",
  "services",
  "trading",
  "kisReadOnlyProvider.js",
);
const REQUIRED_REVIEW_GATES = [
  "owner_redacted_read_only_approval_packet_imported_later",
  "approval_packet_validation_preflight_ready",
  "request_envelope_validator_ready",
  "request_envelope_contract_ready",
  "response_envelope_contract_ready",
  "snapshot_normalization_contract_ready",
  "snapshot_risk_input_contract_ready",
  "env_risk_gate_fail_closed",
  "private_shadow_runtime_preflight_ready",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_worker_only",
  "read_only_endpoints_only",
  "explicit_provider_request_envelope_input",
  "explicit_redacted_approval_reference_hash",
  "no_default_private_packet_read",
  "no_order_endpoint",
  "no_order_submission",
  "no_order_cancellation",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write",
  "no_scenario_monthly_cache_write",
  "no_raw_provider_payload_persistence",
  "redacted_error_messages_only",
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
  path.join("server", "src", "services", "tradingReadOnlyProvider.js"),
  FUTURE_PROVIDER_IMPLEMENTATION_PATH,
  path.join("server", "src", "services", "trading", "readOnlyProvider.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const approvalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const approvalPacketValidationPreflight = readJson(REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH);
  const requestEnvelopeValidationPreflight = readJson(REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH);
  const requestEnvelopeContract = readJson(REQUEST_ENVELOPE_CONTRACT_PATH);
  const responseEnvelopeContract = readJson(RESPONSE_ENVELOPE_CONTRACT_PATH);
  const snapshotNormalizationContract = readJson(SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const snapshotRiskInputContract = readJson(SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const privateShadowRuntimePreflight = readJson(PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewGates = [...REQUIRED_REVIEW_GATES];
  const implementationRules = [...REQUIRED_IMPLEMENTATION_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingReviewGates = missingValues(reviewGates, REQUIRED_REVIEW_GATES);
  const missingImplementationRules = missingValues(implementationRules, REQUIRED_IMPLEMENTATION_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    readOnlyApprovalStillDeferred:
      approvalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      approvalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalImportPreflight.readiness?.providerCallsAllowed === false &&
      approvalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      approvalImportPreflight.readiness?.runtimeRouteAllowed === false,
    approvalPacketValidationPreflightReady:
      approvalPacketValidationPreflight.readiness?.readyForPureLocalValidatorImplementationReview === true &&
      approvalPacketValidationPreflight.readiness?.approvalPacketCreatedNow === false &&
      approvalPacketValidationPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalPacketValidationPreflight.readiness?.providerCallsAllowed === false &&
      approvalPacketValidationPreflight.readiness?.orderSubmissionAllowed === false &&
      approvalPacketValidationPreflight.readiness?.runtimeRouteAllowed === false,
    requestEnvelopeValidationPreflightReady:
      requestEnvelopeValidationPreflight.readiness
        ?.readyForPureLocalRequestEnvelopeValidatorImplementationReview === true &&
      requestEnvelopeValidationPreflight.readiness?.providerRequestCreatedNow === false &&
      requestEnvelopeValidationPreflight.readiness?.providerCallsAllowed === false &&
      requestEnvelopeValidationPreflight.readiness?.orderSubmissionAllowed === false &&
      requestEnvelopeValidationPreflight.readiness?.runtimeRouteAllowed === false,
    requestEnvelopeContractReady:
      requestEnvelopeContract.readiness?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      requestEnvelopeContract.readiness?.requestEnvelopeImplementationAllowed === false &&
      requestEnvelopeContract.readiness?.providerCallsAllowed === false &&
      requestEnvelopeContract.readiness?.orderSubmissionAllowed === false &&
      requestEnvelopeContract.readiness?.runtimeRouteAllowed === false,
    responseEnvelopeContractReady:
      responseEnvelopeContract.readiness?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      responseEnvelopeContract.readiness?.responseEnvelopeImplementationAllowed === false &&
      responseEnvelopeContract.readiness?.providerCallsAllowed === false &&
      responseEnvelopeContract.readiness?.orderSubmissionAllowed === false &&
      responseEnvelopeContract.readiness?.runtimeRouteAllowed === false,
    snapshotNormalizationContractReady:
      snapshotNormalizationContract.readiness?.readyForFutureReadOnlySnapshotNormalizationImplementationReview ===
        true &&
      snapshotNormalizationContract.readiness?.snapshotNormalizationImplementationAllowed === false &&
      snapshotNormalizationContract.readiness?.providerCallsAllowed === false &&
      snapshotNormalizationContract.readiness?.orderSubmissionAllowed === false &&
      snapshotNormalizationContract.readiness?.runtimeRouteAllowed === false,
    snapshotRiskInputContractReady:
      snapshotRiskInputContract.readiness?.readyForFutureReadOnlySnapshotRiskInputImplementationReview === true &&
      snapshotRiskInputContract.readiness?.snapshotRiskInputImplementationAllowed === false &&
      snapshotRiskInputContract.readiness?.providerCallsAllowed === false &&
      snapshotRiskInputContract.readiness?.orderSubmissionAllowed === false &&
      snapshotRiskInputContract.readiness?.runtimeRouteAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.readyForProviderCalls === false &&
      envRiskGateContract.readiness?.readyForRuntimeRoute === false &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimePreflightReady:
      privateShadowRuntimePreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview === true &&
      privateShadowRuntimePreflight.readiness?.privateShadowRuntimeImplementationAllowed === false &&
      privateShadowRuntimePreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimePreflight.readiness?.orderSubmissionAllowed === false &&
      privateShadowRuntimePreflight.readiness?.runtimeRouteAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsPrivateReadOnlyProviderPreflight:
      architectureDoc.includes("Trading Private Read-Only Provider Implementation Preflight") &&
      architectureDoc.includes("private_read_only_provider_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const ownerPacketGateStillClosed = checks.readOnlyApprovalStillDeferred;
  const readyForFuturePrivateReadOnlyProviderImplementationReview = false;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2Z",
    scope: "private_read_only_provider_implementation_preflight",
    sourceFiles: {
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      redactedApprovalPacketValidationPreflight: REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH,
      requestEnvelopeValidationPreflight: REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH,
      requestEnvelopeContract: REQUEST_ENVELOPE_CONTRACT_PATH,
      responseEnvelopeContract: RESPONSE_ENVELOPE_CONTRACT_PATH,
      snapshotNormalizationContract: SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      snapshotRiskInputContract: SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      privateShadowRuntimePreflight: PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      ownerPacketGateStillClosed,
      providerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateReadOnlyProviderImplementationBoundary: {
      mode: "shadow",
      scope: "private_read_only_provider_implementation_preflight",
      futureProviderImplementationPath: FUTURE_PROVIDER_IMPLEMENTATION_PATH,
      currentStepImplementsProvider: false,
      currentStepReadsPrivateApprovalPacket: false,
      currentStepCreatesProviderRequest: false,
      currentStepCallsProvider: false,
      reviewGates,
      implementationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start provider implementation review",
        "owner redacted read-only approval packet import must be recorded before implementation review",
        "provider implementation review must remain private-worker-only and read-only",
        "provider implementation review cannot create runtime routes, DB migrations, public UI, or order paths",
        "read-only provider success still does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      readOnlyApprovalImportPreflightStatus: approvalImportPreflight.readiness?.status,
      redactedApprovalPacketValidationPreflightStatus: approvalPacketValidationPreflight.readiness?.status,
      requestEnvelopeValidationPreflightStatus: requestEnvelopeValidationPreflight.readiness?.status,
      requestEnvelopeContractStatus: requestEnvelopeContract.readiness?.status,
      responseEnvelopeContractStatus: responseEnvelopeContract.readiness?.status,
      snapshotNormalizationContractStatus: snapshotNormalizationContract.readiness?.status,
      snapshotRiskInputContractStatus: snapshotRiskInputContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      privateShadowRuntimePreflightStatus: privateShadowRuntimePreflight.readiness?.status,
    },
    readiness: {
      status: ownerPacketGateStillClosed
        ? "preflight_recorded_provider_implementation_blocked_pending_owner_packet_import"
        : "blocked_before_private_read_only_provider_implementation_preflight",
      readyForFuturePrivateReadOnlyProviderImplementationReview,
      ownerPacketGateStillClosed,
      providerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.readOnlyApprovalStillDeferred ? [] : ["read_only_approval_import_gate_not_closed"]),
        ...(checks.approvalPacketValidationPreflightReady
          ? []
          : ["redacted_approval_packet_validation_preflight_not_ready"]),
        ...(checks.requestEnvelopeValidationPreflightReady
          ? []
          : ["request_envelope_validation_preflight_not_ready"]),
        ...(checks.requestEnvelopeContractReady ? [] : ["request_envelope_contract_not_ready"]),
        ...(checks.responseEnvelopeContractReady ? [] : ["response_envelope_contract_not_ready"]),
        ...(checks.snapshotNormalizationContractReady ? [] : ["snapshot_normalization_contract_not_ready"]),
        ...(checks.snapshotRiskInputContractReady ? [] : ["snapshot_risk_input_contract_not_ready"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_not_fail_closed"]),
        ...(checks.privateShadowRuntimePreflightReady ? [] : ["private_shadow_runtime_preflight_not_ready"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsPrivateReadOnlyProviderPreflight
          ? []
          : ["architecture_doc_missing_private_read_only_provider_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "owner_redacted_read_only_approval_packet_not_imported",
        "private_read_only_provider_implementation_review_not_started",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-read-only-provider-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-read-only-provider-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-private-read-only-provider-implementation-preflight] ok");
    console.log(`[generate-trading-private-read-only-provider-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-read-only-provider-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-private-read-only-provider-implementation-preflight] ownerPacketGateStillClosed=${parsed.readiness.ownerPacketGateStillClosed}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_private_shadow_runtime_preflight.json");
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
const DRY_RUN_REPLAY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_dry_run_replay_contract.json",
);
const SHADOW_HISTORY_REVIEW_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
);
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_order_credential_boundary_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_intake_contract.json",
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
const READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-runtime-preflight-v0.7";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RUNTIME_EVIDENCE = [
  "private_operator_only_access",
  "read_only_runtime_mode_shadow",
  "virtual_trading_base_url_only",
  "kill_switch_enabled_by_default",
  "risk_gate_evaluation_for_each_intent",
  "audit_logger_ready_before_intent_record",
  "dry_run_replay_fixture_reference",
  "shadow_history_review_reference",
  "quote_snapshot_hash",
  "account_state_snapshot_hash",
  "order_intent_hash",
  "raw_provider_payload_not_persisted",
];
const REQUIRED_RUNTIME_ASSERTIONS = [
  "no_order_submission",
  "no_order_cancellation",
  "no_runtime_route",
  "no_public_ui",
  "no_db_migration",
  "no_raw_provider_payload_persistence",
  "provider_calls_remain_blocked_until_separate_read_only_approval",
  "shadow_runtime_success_does_not_approve_live_guarded",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "runtime_provider_call",
  "order_submission",
  "order_cancellation",
  "production_secret_usage",
  "raw_provider_response_persistence",
  "db_migration",
  "public_ui",
  "scenario_monthly_cache_write",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "shadowRuntime.js"),
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
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReviewContract = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const orderCredentialBoundaryContract = readJson(ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const readOnlyApprovalIntakeContract = readJson(READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const readOnlyProviderRequestEnvelopeContract = readJson(READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT_PATH);
  const readOnlyProviderResponseEnvelopeContract = readJson(READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT_PATH);
  const readOnlySnapshotNormalizationContract = readJson(READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const readOnlySnapshotRiskInputContract = readJson(READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const runtimeEvidence = [...REQUIRED_RUNTIME_EVIDENCE];
  const runtimeAssertions = [...REQUIRED_RUNTIME_ASSERTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const missingRuntimeEvidence = missingValues(runtimeEvidence, REQUIRED_RUNTIME_EVIDENCE);
  const missingRuntimeAssertions = missingValues(runtimeAssertions, REQUIRED_RUNTIME_ASSERTIONS);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
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
    envReadinessContractReady:
      envReadinessContract.readiness?.readyForCurrentStep === true &&
      envReadinessContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      envReadinessContract.readiness?.providerCallsAllowed === false &&
      envReadinessContract.readiness?.orderSubmissionAllowed === false &&
      envReadinessContract.readiness?.dbMigrationAllowed === false &&
      envReadinessContract.readiness?.publicUiAllowed === false,
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
    dryRunReplayContractReady:
      dryRunReplayContract.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplayContract.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplayContract.readiness?.providerCallsAllowed === false &&
      dryRunReplayContract.readiness?.orderSubmissionAllowed === false,
    shadowHistoryReviewContractReady:
      shadowHistoryReviewContract.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReviewContract.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReviewContract.readiness?.providerCallsAllowed === false &&
      shadowHistoryReviewContract.readiness?.orderSubmissionAllowed === false,
    orderCredentialBoundaryContractReady:
      orderCredentialBoundaryContract.readiness?.readyForFutureOrderCredentialImplementationReview === true &&
      orderCredentialBoundaryContract.readiness?.credentialStoreImplementationAllowed === false &&
      orderCredentialBoundaryContract.readiness?.providerCallsAllowed === false &&
      orderCredentialBoundaryContract.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearanceContract.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearanceContract.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearanceContract.readiness?.providerCallsAllowed === false &&
      riskGateClearanceContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalIntakeContractReady:
      readOnlyApprovalIntakeContract.readiness?.readyForFutureReadOnlyApprovalIntakeValidation === true &&
      readOnlyApprovalIntakeContract.readiness?.readOnlyApprovalImportedNow === false &&
      readOnlyApprovalIntakeContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      readOnlyApprovalIntakeContract.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalIntakeContract.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalIntakeContract.readiness?.runtimeRouteAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.readOnlyApprovalImportImplementationAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    readOnlyProviderRequestEnvelopeContractReady:
      readOnlyProviderRequestEnvelopeContract.readiness
        ?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      readOnlyProviderRequestEnvelopeContract.readiness?.requestEnvelopeImplementationAllowed === false &&
      readOnlyProviderRequestEnvelopeContract.readiness?.providerCallsAllowed === false &&
      readOnlyProviderRequestEnvelopeContract.readiness?.orderSubmissionAllowed === false &&
      readOnlyProviderRequestEnvelopeContract.readiness?.runtimeRouteAllowed === false,
    readOnlyProviderResponseEnvelopeContractReady:
      readOnlyProviderResponseEnvelopeContract.readiness
        ?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      readOnlyProviderResponseEnvelopeContract.readiness?.responseEnvelopeImplementationAllowed === false &&
      readOnlyProviderResponseEnvelopeContract.readiness?.providerCallsAllowed === false &&
      readOnlyProviderResponseEnvelopeContract.readiness?.orderSubmissionAllowed === false &&
      readOnlyProviderResponseEnvelopeContract.readiness?.runtimeRouteAllowed === false,
    readOnlySnapshotNormalizationContractReady:
      readOnlySnapshotNormalizationContract.readiness
        ?.readyForFutureReadOnlySnapshotNormalizationImplementationReview === true &&
      readOnlySnapshotNormalizationContract.readiness?.snapshotNormalizationImplementationAllowed === false &&
      readOnlySnapshotNormalizationContract.readiness?.providerCallsAllowed === false &&
      readOnlySnapshotNormalizationContract.readiness?.orderSubmissionAllowed === false &&
      readOnlySnapshotNormalizationContract.readiness?.dbMigrationAllowed === false &&
      readOnlySnapshotNormalizationContract.readiness?.runtimeRouteAllowed === false,
    readOnlySnapshotRiskInputContractReady:
      readOnlySnapshotRiskInputContract.readiness
        ?.readyForFutureReadOnlySnapshotRiskInputImplementationReview === true &&
      readOnlySnapshotRiskInputContract.readiness?.snapshotRiskInputImplementationAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.providerCallsAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.orderSubmissionAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.dbMigrationAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.runtimeRouteAllowed === false,
    runtimeEvidenceReady: missingRuntimeEvidence.length === 0,
    runtimeAssertionsReady: missingRuntimeAssertions.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsPrivateShadowRuntime:
      architectureDoc.includes("Trading Private Shadow Runtime Preflight") &&
      architectureDoc.includes("private_shadow_runtime") &&
      architectureDoc.includes("Trading Read-Only Approval Intake Contract") &&
      architectureDoc.includes("Trading Read-Only Approval Import Preflight") &&
      architectureDoc.includes("Trading Read-Only Provider Request Envelope Contract") &&
      architectureDoc.includes("Trading Read-Only Provider Response Envelope Contract") &&
      architectureDoc.includes("Trading Read-Only Snapshot Normalization Contract") &&
      architectureDoc.includes("Trading Read-Only Snapshot Risk Input Contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    privateShadowRuntimeImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFuturePrivateShadowRuntimeImplementationReview =
    checks.shadowModePolicyReady &&
    checks.shadowContractStillBlocksRuntime &&
    checks.envReadinessContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.orderCredentialBoundaryContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.readOnlyApprovalIntakeContractReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.readOnlyProviderRequestEnvelopeContractReady &&
    checks.readOnlyProviderResponseEnvelopeContractReady &&
    checks.readOnlySnapshotNormalizationContractReady &&
    checks.readOnlySnapshotRiskInputContractReady &&
    checks.runtimeEvidenceReady &&
    checks.runtimeAssertionsReady &&
    checks.forbiddenActionsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsPrivateShadowRuntime &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1R",
    scope: "private_shadow_runtime_preflight_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      envReadinessContract: ENV_READINESS_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      orderCredentialBoundaryContract: ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      readOnlyApprovalIntakeContract: READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      readOnlyProviderRequestEnvelopeContract: READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT_PATH,
      readOnlyProviderResponseEnvelopeContract: READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT_PATH,
      readOnlySnapshotNormalizationContract: READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      readOnlySnapshotRiskInputContract: READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      privateShadowRuntimeExistsNow: false,
      privateShadowRuntimeImplementationAllowed: false,
      privateOperatorOnlySurfaceAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateShadowRuntimeBoundary: {
      mode: "shadow",
      scope: "private_shadow_runtime",
      purpose:
        "prepare a future private operator-only shadow runtime review that records intended orders without provider calls or order submission in this step",
      requiredRuntimeEvidence: runtimeEvidence,
      requiredAssertions: runtimeAssertions,
      forbiddenActions,
      storageBoundary: {
        currentStepWritesDatabase: false,
        futureRawProviderPayloadStorageAllowed: false,
        futureRecordsUseHashes: ["quote_snapshot_hash", "account_state_snapshot_hash", "order_intent_hash"],
      },
      promotionRules: [
        "private shadow runtime implementation needs a separate review after this preflight",
        "provider calls remain blocked until separate read-only approval is recorded",
        "private runtime review cannot create a public UI or runtime route in this step",
        "shadow runtime success does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingRuntimeEvidence,
      missingRuntimeAssertions,
      missingForbiddenActions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      envReadinessContractStatus: envReadinessContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      dryRunReplayContractStatus: dryRunReplayContract.readiness?.status,
      shadowHistoryReviewContractStatus: shadowHistoryReviewContract.readiness?.status,
      orderCredentialBoundaryContractStatus: orderCredentialBoundaryContract.readiness?.status,
      riskGateClearanceContractStatus: riskGateClearanceContract.readiness?.status,
      readOnlyApprovalIntakeContractStatus: readOnlyApprovalIntakeContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      readOnlyProviderRequestEnvelopeContractStatus: readOnlyProviderRequestEnvelopeContract.readiness?.status,
      readOnlyProviderResponseEnvelopeContractStatus: readOnlyProviderResponseEnvelopeContract.readiness?.status,
      readOnlySnapshotNormalizationContractStatus: readOnlySnapshotNormalizationContract.readiness?.status,
      readOnlySnapshotRiskInputContractStatus: readOnlySnapshotRiskInputContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFuturePrivateShadowRuntimeImplementationReview
        ? "contract_ready_pending_private_shadow_runtime_implementation_review"
        : "blocked_before_private_shadow_runtime_preflight",
      readyForFuturePrivateShadowRuntimeImplementationReview,
      privateShadowRuntimeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.shadowContractStillBlocksRuntime ? [] : ["shadow_contract_allows_runtime_too_early"]),
        ...(checks.envReadinessContractReady ? [] : ["env_readiness_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...(checks.orderCredentialBoundaryContractReady ? [] : ["order_credential_boundary_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.readOnlyApprovalIntakeContractReady ? [] : ["read_only_approval_intake_contract_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.readOnlyProviderRequestEnvelopeContractReady
          ? []
          : ["read_only_provider_request_envelope_contract_not_ready"]),
        ...(checks.readOnlyProviderResponseEnvelopeContractReady
          ? []
          : ["read_only_provider_response_envelope_contract_not_ready"]),
        ...(checks.readOnlySnapshotNormalizationContractReady
          ? []
          : ["read_only_snapshot_normalization_contract_not_ready"]),
        ...(checks.readOnlySnapshotRiskInputContractReady
          ? []
          : ["read_only_snapshot_risk_input_contract_not_ready"]),
        ...missingRuntimeEvidence.map((item) => `missing_runtime_evidence_${item}`),
        ...missingRuntimeAssertions.map((assertion) => `missing_runtime_assertion_${assertion}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsPrivateShadowRuntime
          ? []
          : ["architecture_doc_missing_private_shadow_runtime_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-runtime-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-runtime-preflight.cjs`);
    }
    console.log("[generate-trading-private-shadow-runtime-preflight] ok");
    console.log(`[generate-trading-private-shadow-runtime-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-runtime-preflight] wrote contract");
  console.log(
    `[generate-trading-private-shadow-runtime-preflight] readyForFuturePrivateShadowRuntimeImplementationReview=${parsed.readiness.readyForFuturePrivateShadowRuntimeImplementationReview}`,
  );
}

main();

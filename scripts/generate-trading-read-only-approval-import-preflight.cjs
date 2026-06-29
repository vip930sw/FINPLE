const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_read_only_approval_import_preflight.json");
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
const READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_intake_contract.json",
);
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_order_credential_boundary_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-approval-import-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const REQUIRED_IMPORT_VALIDATIONS = [
  "packet_matches_intake_required_fields",
  "approval_scope_is_read_only_shadow",
  "base_url_is_virtual_trading_only",
  "live_endpoint_is_forbidden",
  "approval_is_time_boxed",
  "approval_is_not_expired",
  "approval_is_revocable",
  "account_id_is_hash_only",
  "secret_values_absent",
  "allowed_read_scopes_are_subset_of_contract",
  "forbidden_actions_include_order_submission",
  "raw_provider_payload_persistence_forbidden",
  "provider_calls_remain_disabled_after_import_preflight",
];
const REQUIRED_PACKET_REJECTION_REASONS = [
  "missing_required_field",
  "expired_approval",
  "live_endpoint_requested",
  "order_action_requested",
  "raw_account_identifier_present",
  "secret_value_present",
  "unknown_read_scope",
  "revocation_plan_missing",
  "redaction_version_missing",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "runtime_provider_call",
  "order_submission",
  "order_cancellation",
  "approval_import_write",
  "production_secret_usage",
  "raw_provider_response_persistence",
  "db_migration",
  "public_ui",
  "runtime_route",
  "scenario_monthly_cache_write",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_APPROVAL_PACKET_PATH,
  path.join("server", "src", "services", "tradingReadOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
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
  const readOnlyApprovalIntakeContract = readJson(READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH);
  const orderCredentialBoundaryContract = readJson(ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const requiredImportValidations = [...REQUIRED_IMPORT_VALIDATIONS];
  const requiredPacketRejectionReasons = [...REQUIRED_PACKET_REJECTION_REASONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const missingImportValidations = missingValues(requiredImportValidations, REQUIRED_IMPORT_VALIDATIONS);
  const missingPacketRejectionReasons = missingValues(
    requiredPacketRejectionReasons,
    REQUIRED_PACKET_REJECTION_REASONS,
  );
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const intakeFields = readOnlyApprovalIntakeContract.futureReadOnlyApprovalIntakeBoundary?.requiredApprovalFields ?? [];
  const intakeReadScopes = readOnlyApprovalIntakeContract.futureReadOnlyApprovalIntakeBoundary?.allowedReadScopes ?? [];
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    shadowContractStillRequiresApproval:
      shadowContract.readiness?.readyForFutureReadOnlyIntegrationReview === true &&
      shadowContract.currentState?.manualReadOnlyApprovalRecorded === false &&
      shadowContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      shadowContract.readiness?.providerCallsAllowed === false &&
      shadowContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalIntakeContractReady:
      readOnlyApprovalIntakeContract.readiness?.readyForFutureReadOnlyApprovalIntakeValidation === true &&
      readOnlyApprovalIntakeContract.readiness?.readOnlyApprovalImportedNow === false &&
      readOnlyApprovalIntakeContract.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalIntakeContract.readiness?.orderSubmissionAllowed === false,
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
    orderCredentialBoundaryContractReady:
      orderCredentialBoundaryContract.readiness?.readyForFutureOrderCredentialImplementationReview === true &&
      orderCredentialBoundaryContract.readiness?.credentialStoreImplementationAllowed === false &&
      orderCredentialBoundaryContract.readiness?.providerCallsAllowed === false &&
      orderCredentialBoundaryContract.readiness?.orderSubmissionAllowed === false,
    intakeContractDefinesApprovalFields:
      intakeFields.includes("approvalId") &&
      intakeFields.includes("approvedBy") &&
      intakeFields.includes("accountIdHash") &&
      intakeFields.includes("redactionVersion"),
    intakeContractDefinesReadScopes:
      intakeReadScopes.includes("account_cash_balance") && intakeReadScopes.includes("current_quotes"),
    importValidationsReady: missingImportValidations.length === 0,
    packetRejectionReasonsReady: missingPacketRejectionReasons.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsReadOnlyApprovalImportPreflight:
      architectureDoc.includes("Trading Read-Only Approval Import Preflight") &&
      architectureDoc.includes("read_only_approval_import_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    approvalPacketImportedNow: false,
    readOnlyApprovalImportImplementationAllowed: false,
    readOnlyRuntimeIntegrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFutureReadOnlyApprovalImportImplementationReview =
    checks.shadowModePolicyReady &&
    checks.shadowContractStillRequiresApproval &&
    checks.readOnlyApprovalIntakeContractReady &&
    checks.envReadinessContractStillBlocksRuntime &&
    checks.envRiskGateContractStillFailClosed &&
    checks.orderCredentialBoundaryContractReady &&
    checks.intakeContractDefinesApprovalFields &&
    checks.intakeContractDefinesReadScopes &&
    checks.importValidationsReady &&
    checks.packetRejectionReasonsReady &&
    checks.forbiddenActionsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsReadOnlyApprovalImportPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1T",
    scope: "trading_read_only_approval_import_preflight",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      envReadinessContract: ENV_READINESS_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      readOnlyApprovalIntakeContract: READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH,
      orderCredentialBoundaryContract: ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      approvalPacketImportedNow: false,
      readOnlyApprovalImportImplementationAllowed: false,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyApprovalImportBoundary: {
      scope: "read_only_approval_import_preflight",
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      purpose:
        "preflight the future redacted approval evidence import before any KIS read-only provider call or private shadow runtime review",
      requiredImportValidations,
      requiredPacketRejectionReasons,
      forbiddenActions,
      packetRules: {
        currentStepCreatesPacket: false,
        packetMustBeRedacted: true,
        accountIdentifierMustBeHashOnly: true,
        secretValuesAllowed: false,
        rawProviderPayloadAllowed: false,
        liveEndpointAllowed: false,
      },
      promotionRules: [
        "import preflight success does not import approval evidence",
        "import preflight success does not enable provider calls",
        "import preflight success does not enable read-only runtime",
        "future import implementation must fail closed on any unknown field or unknown scope",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingImportValidations,
      missingPacketRejectionReasons,
      missingForbiddenActions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      readOnlyApprovalIntakeContractStatus: readOnlyApprovalIntakeContract.readiness?.status,
      envReadinessContractStatus: envReadinessContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      orderCredentialBoundaryContractStatus: orderCredentialBoundaryContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlyApprovalImportImplementationReview
        ? "preflight_ready_pending_read_only_approval_import_implementation_review"
        : "blocked_before_read_only_approval_import_preflight",
      readyForFutureReadOnlyApprovalImportImplementationReview,
      approvalPacketImportedNow: false,
      readOnlyApprovalImportImplementationAllowed: false,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.shadowContractStillRequiresApproval ? [] : ["shadow_contract_no_longer_requires_read_only_approval"]),
        ...(checks.readOnlyApprovalIntakeContractReady ? [] : ["read_only_approval_intake_contract_not_ready"]),
        ...(checks.envReadinessContractStillBlocksRuntime ? [] : ["env_readiness_contract_allows_runtime_too_early"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.orderCredentialBoundaryContractReady ? [] : ["order_credential_boundary_contract_not_ready"]),
        ...(checks.intakeContractDefinesApprovalFields ? [] : ["intake_contract_missing_approval_fields"]),
        ...(checks.intakeContractDefinesReadScopes ? [] : ["intake_contract_missing_read_scopes"]),
        ...missingImportValidations.map((validation) => `missing_import_validation_${validation}`),
        ...missingPacketRejectionReasons.map((reason) => `missing_packet_rejection_reason_${reason}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsReadOnlyApprovalImportPreflight
          ? []
          : ["architecture_doc_missing_read_only_approval_import_preflight_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-import-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-import-preflight.cjs`);
    }
    console.log("[generate-trading-read-only-approval-import-preflight] ok");
    console.log(`[generate-trading-read-only-approval-import-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-import-preflight] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-import-preflight] readyForFutureReadOnlyApprovalImportImplementationReview=${parsed.readiness.readyForFutureReadOnlyApprovalImportImplementationReview}`,
  );
}

main();

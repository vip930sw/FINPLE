const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_read_only_approval_intake_contract.json");
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

const CONTRACT_VERSION = "trading-lab-step116-read-only-approval-intake-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_APPROVAL_FIELDS = [
  "approvalId",
  "approvedBy",
  "approvedAt",
  "expiresAt",
  "scope",
  "environment",
  "baseUrl",
  "accountIdHash",
  "allowedReadScopes",
  "forbiddenActions",
  "evidenceTicket",
  "revocationPlan",
  "redactionVersion",
];
const REQUIRED_ALLOWED_READ_SCOPES = [
  "account_cash_balance",
  "account_positions",
  "orderable_cash",
  "current_quotes",
  "fx_rate",
  "market_session_state",
  "provider_rate_limit_state",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "order_submission",
  "order_cancellation",
  "position_mutation",
  "live_trading_endpoint",
  "raw_provider_response_persistence",
  "public_frontend_secret_access",
  "scenario_monthly_cache_write",
];
const REQUIRED_APPROVAL_ASSERTIONS = [
  "approval_scope_is_read_only",
  "virtual_trading_base_url_only",
  "no_live_endpoint",
  "account_identifier_is_hashed",
  "secrets_are_not_persisted",
  "raw_provider_payload_not_persisted",
  "approval_is_time_boxed",
  "approval_is_revocable",
  "provider_calls_remain_blocked_until_approval_is_imported",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingReadOnlyApprovalIntake.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalIntake.js"),
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
  const orderCredentialBoundaryContract = readJson(ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const approvalFields = [...REQUIRED_APPROVAL_FIELDS];
  const allowedReadScopes = [...REQUIRED_ALLOWED_READ_SCOPES];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const approvalAssertions = [...REQUIRED_APPROVAL_ASSERTIONS];
  const missingApprovalFields = missingValues(approvalFields, REQUIRED_APPROVAL_FIELDS);
  const missingAllowedReadScopes = missingValues(allowedReadScopes, REQUIRED_ALLOWED_READ_SCOPES);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const missingApprovalAssertions = missingValues(approvalAssertions, REQUIRED_APPROVAL_ASSERTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
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
    approvalFieldsReady: missingApprovalFields.length === 0,
    allowedReadScopesReady: missingAllowedReadScopes.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    approvalAssertionsReady: missingApprovalAssertions.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsReadOnlyApprovalIntake:
      architectureDoc.includes("Trading Read-Only Approval Intake Contract") &&
      architectureDoc.includes("read_only_approval_intake"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    readOnlyApprovalIntakeImplementationAllowed: false,
    readOnlyApprovalImportedNow: false,
    readOnlyRuntimeIntegrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFutureReadOnlyApprovalIntakeValidation =
    checks.shadowModePolicyReady &&
    checks.shadowContractStillRequiresApproval &&
    checks.envReadinessContractStillBlocksRuntime &&
    checks.envRiskGateContractStillFailClosed &&
    checks.orderCredentialBoundaryContractReady &&
    checks.approvalFieldsReady &&
    checks.allowedReadScopesReady &&
    checks.forbiddenActionsReady &&
    checks.approvalAssertionsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsReadOnlyApprovalIntake &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1S",
    scope: "trading_read_only_approval_intake_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      envReadinessContract: ENV_READINESS_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      orderCredentialBoundaryContract: ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      readOnlyApprovalImportedNow: false,
      readOnlyApprovalIntakeImplementationAllowed: false,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyApprovalIntakeBoundary: {
      scope: "read_only_approval_intake",
      purpose:
        "define the evidence packet required before any future KIS read-only provider call or private shadow runtime review",
      requiredApprovalFields: approvalFields,
      allowedReadScopes,
      forbiddenActions,
      requiredApprovalAssertions: approvalAssertions,
      secretAndDataRules: [
        "never store KIS app secret, access token, or full account number",
        "store account identifiers as hashes only",
        "store provider request and response hashes only",
        "approval evidence must be time-boxed and revocable",
      ],
      promotionRules: [
        "approval intake validation does not perform provider calls",
        "approval intake validation does not enable read-only runtime by itself",
        "approval intake validation does not approve order submission",
        "read-only approval cannot cover live order endpoints",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingApprovalFields,
      missingAllowedReadScopes,
      missingForbiddenActions,
      missingApprovalAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      envReadinessContractStatus: envReadinessContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      orderCredentialBoundaryContractStatus: orderCredentialBoundaryContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlyApprovalIntakeValidation
        ? "contract_ready_pending_read_only_approval_evidence_import"
        : "blocked_before_read_only_approval_intake_contract",
      readyForFutureReadOnlyApprovalIntakeValidation,
      readOnlyApprovalIntakeImplementationAllowed: false,
      readOnlyApprovalImportedNow: false,
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
        ...(checks.envReadinessContractStillBlocksRuntime ? [] : ["env_readiness_contract_allows_runtime_too_early"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.orderCredentialBoundaryContractReady ? [] : ["order_credential_boundary_contract_not_ready"]),
        ...missingApprovalFields.map((field) => `missing_approval_field_${field}`),
        ...missingAllowedReadScopes.map((scope) => `missing_allowed_read_scope_${scope}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...missingApprovalAssertions.map((assertion) => `missing_approval_assertion_${assertion}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsReadOnlyApprovalIntake
          ? []
          : ["architecture_doc_missing_read_only_approval_intake_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-intake-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-intake-contract.cjs`);
    }
    console.log("[generate-trading-read-only-approval-intake-contract] ok");
    console.log(`[generate-trading-read-only-approval-intake-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-intake-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-intake-contract] readyForFutureReadOnlyApprovalIntakeValidation=${parsed.readiness.readyForFutureReadOnlyApprovalIntakeValidation}`,
  );
}

main();

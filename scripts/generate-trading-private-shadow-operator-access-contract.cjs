const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
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
const MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_operator_approval_contract.json",
);
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
);
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-operator-access-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_ACCESS_FIELDS = [
  "operatorAccessScopeId",
  "mode",
  "operatorIdHash",
  "roleHash",
  "authContextHash",
  "sessionIdHash",
  "sessionIssuedAt",
  "sessionExpiresAt",
  "allowedActionHashes",
  "deniedActionHashes",
  "approvalPolicyHash",
  "runtimeReviewPacketHash",
  "intentAuditEventHash",
  "killSwitchStateHash",
  "privateNetworkBoundaryHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_ACCESS_ASSERTIONS = [
  "private_operator_only",
  "operator_identity_hash_only",
  "operator_session_timeboxed",
  "explicit_denied_actions_required",
  "audit_event_required_before_access_review",
  "manual_approval_not_created_by_access_review",
  "operator_access_cannot_override_kill_switch",
  "operator_access_cannot_override_risk_gate",
  "no_public_ui_in_current_step",
  "no_runtime_route_in_current_step",
  "operator_access_success_does_not_enable_runtime",
  "operator_access_success_does_not_approve_live_guarded",
];
const FORBIDDEN_ACCESS_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingPrivateShadowOperatorAccess.js"),
  path.join("server", "src", "services", "trading", "privateShadowOperatorAccess.js"),
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
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const manualOperatorApprovalContract = readJson(MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH);
  const privateShadowIntentAuditEventContract = readJson(PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH);
  const privateShadowRuntimeReviewPacketContract = readJson(PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const accessFields = [...REQUIRED_ACCESS_FIELDS];
  const accessAssertions = [...REQUIRED_ACCESS_ASSERTIONS];
  const forbiddenAccessContent = [...FORBIDDEN_ACCESS_CONTENT];
  const missingAccessFields = missingValues(accessFields, REQUIRED_ACCESS_FIELDS);
  const missingAccessAssertions = missingValues(accessAssertions, REQUIRED_ACCESS_ASSERTIONS);
  const missingForbiddenAccessContent = missingValues(forbiddenAccessContent, FORBIDDEN_ACCESS_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    manualOperatorApprovalContractReady:
      manualOperatorApprovalContract.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      manualOperatorApprovalContract.readiness?.manualApprovalImplementationAllowed === false &&
      manualOperatorApprovalContract.readiness?.providerCallsAllowed === false &&
      manualOperatorApprovalContract.readiness?.orderSubmissionAllowed === false,
    privateShadowIntentAuditEventContractReady:
      privateShadowIntentAuditEventContract.readiness
        ?.readyForFuturePrivateShadowIntentAuditEventImplementationReview === true &&
      privateShadowIntentAuditEventContract.readiness?.privateShadowIntentAuditEventImplementationAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.providerCallsAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimeReviewPacketContractReady:
      privateShadowRuntimeReviewPacketContract.readiness
        ?.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview === true &&
      privateShadowRuntimeReviewPacketContract.readiness?.privateShadowRuntimeReviewPacketImplementationAllowed ===
        false &&
      privateShadowRuntimeReviewPacketContract.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.orderSubmissionAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.runtimeRouteAllowed === false,
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
    accessFieldsReady: missingAccessFields.length === 0,
    accessAssertionsReady: missingAccessAssertions.length === 0,
    forbiddenAccessContentReady: missingForbiddenAccessContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsPrivateShadowOperatorAccess:
      architectureDoc.includes("Trading Private Shadow Operator Access Contract") &&
      architectureDoc.includes("private_shadow_operator_access"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    privateShadowOperatorAccessImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFuturePrivateShadowOperatorAccessImplementationReview =
    checks.shadowModePolicyReady &&
    checks.manualOperatorApprovalContractReady &&
    checks.privateShadowIntentAuditEventContractReady &&
    checks.privateShadowRuntimeReviewPacketContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.accessFieldsReady &&
    checks.accessAssertionsReady &&
    checks.forbiddenAccessContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsPrivateShadowOperatorAccess &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2B",
    scope: "trading_private_shadow_operator_access_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH,
      privateShadowIntentAuditEventContract: PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH,
      privateShadowRuntimeReviewPacketContract: PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      privateShadowOperatorAccessImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateShadowOperatorAccessBoundary: {
      scope: "private_shadow_operator_access",
      purpose:
        "define the future private operator-only access contract required before any private shadow runtime implementation review without creating auth services, public UI, runtime routes, provider calls, or order submission",
      requiredAccessFields: accessFields,
      requiredAccessAssertions: accessAssertions,
      forbiddenAccessContent,
      redactionRules: [
        "operator identity, role, session, auth context, access scope, approval policy, and audit evidence stay hash-only",
        "operator access review cannot include raw session tokens, account numbers, provider payloads, order payloads, executions, or fills",
        "operator access review cannot create manual approval, override kill switches, override risk gates, or open public UI",
      ],
      promotionRules: [
        "operator access review does not implement authentication or authorization",
        "operator access review does not create runtime routes or public UI",
        "operator access review does not perform provider calls",
        "operator access review does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingAccessFields,
      missingAccessAssertions,
      missingForbiddenAccessContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualOperatorApprovalContractStatus: manualOperatorApprovalContract.readiness?.status,
      privateShadowIntentAuditEventContractStatus: privateShadowIntentAuditEventContract.readiness?.status,
      privateShadowRuntimeReviewPacketContractStatus: privateShadowRuntimeReviewPacketContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFuturePrivateShadowOperatorAccessImplementationReview
        ? "contract_ready_pending_private_shadow_operator_access_implementation_review"
        : "blocked_before_private_shadow_operator_access_contract",
      readyForFuturePrivateShadowOperatorAccessImplementationReview,
      privateShadowOperatorAccessImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.manualOperatorApprovalContractReady ? [] : ["manual_operator_approval_contract_not_ready"]),
        ...(checks.privateShadowIntentAuditEventContractReady
          ? []
          : ["private_shadow_intent_audit_event_contract_not_ready"]),
        ...(checks.privateShadowRuntimeReviewPacketContractReady
          ? []
          : ["private_shadow_runtime_review_packet_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingAccessFields.map((field) => `missing_access_field_${field}`),
        ...missingAccessAssertions.map((assertion) => `missing_access_assertion_${assertion}`),
        ...missingForbiddenAccessContent.map((content) => `missing_forbidden_access_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsPrivateShadowOperatorAccess
          ? []
          : ["architecture_doc_missing_private_shadow_operator_access_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-operator-access-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-operator-access-contract.cjs`);
    }
    console.log("[generate-trading-private-shadow-operator-access-contract] ok");
    console.log(`[generate-trading-private-shadow-operator-access-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-operator-access-contract] wrote contract");
  console.log(
    `[generate-trading-private-shadow-operator-access-contract] readyForFuturePrivateShadowOperatorAccessImplementationReview=${parsed.readiness.readyForFuturePrivateShadowOperatorAccessImplementationReview}`,
  );
}

main();

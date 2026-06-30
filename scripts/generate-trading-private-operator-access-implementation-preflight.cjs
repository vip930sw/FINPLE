const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
);
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
);
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_preflight.json",
);
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json",
);
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
);
const MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_operator_approval_contract.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_runtime_route_implementation_preflight.json",
);
const PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_db_storage_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-operator-access-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_OPERATOR_ACCESS_SERVICE_PATH = path.join(
  "server",
  "src",
  "services",
  "trading",
  "privateOperatorAccess.js",
);
const REQUIRED_REVIEW_GATES = [
  "private_shadow_operator_access_contract_ready",
  "private_shadow_runtime_preflight_ready",
  "private_shadow_runtime_review_packet_contract_ready",
  "private_shadow_intent_audit_event_contract_ready",
  "manual_operator_approval_contract_ready",
  "env_risk_gate_contract_fail_closed",
  "private_runtime_route_review_still_blocked",
  "private_db_storage_review_still_blocked",
  "public_ui_not_allowed",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_operator_only",
  "hash_only_operator_identity",
  "no_auth_service_now",
  "no_session_token_read",
  "no_runtime_route",
  "no_public_ui",
  "no_provider_call",
  "no_order_submission",
  "no_database_write_now",
  "redacted_error_messages_only",
  "fail_closed_without_runtime_review_packet_hash",
  "fail_closed_without_intent_audit_event_hash",
  "operator_access_cannot_override_kill_switch",
  "operator_access_cannot_override_risk_gate",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_auth_context",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_OPERATOR_ACCESS_SERVICE_PATH,
  path.join("server", "src", "services", "tradingOperatorAccess.js"),
  path.join("server", "src", "services", "trading", "operatorAuth.js"),
  path.join("server", "src", "routes", "trading.js"),
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
  const privateShadowOperatorAccessContract = readJson(PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH);
  const privateShadowRuntimePreflight = readJson(PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH);
  const privateShadowRuntimeReviewPacketContract = readJson(PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH);
  const privateShadowIntentAuditEventContract = readJson(PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH);
  const manualOperatorApprovalContract = readJson(MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const privateRuntimeRouteImplementationPreflight = readJson(PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateDbStorageImplementationPreflight = readJson(PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH);
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
    privateShadowOperatorAccessContractReady:
      privateShadowOperatorAccessContract.readiness?.readyForFuturePrivateShadowOperatorAccessImplementationReview ===
        true &&
      privateShadowOperatorAccessContract.readiness?.privateShadowOperatorAccessImplementationAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.runtimeRouteAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.publicUiAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.providerCallsAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimePreflightReady:
      privateShadowRuntimePreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview === true &&
      privateShadowRuntimePreflight.readiness?.privateShadowRuntimeImplementationAllowed === false &&
      privateShadowRuntimePreflight.readiness?.runtimeRouteAllowed === false &&
      privateShadowRuntimePreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimePreflight.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimeReviewPacketContractReady:
      privateShadowRuntimeReviewPacketContract.readiness
        ?.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview === true &&
      privateShadowRuntimeReviewPacketContract.readiness?.runtimeRouteAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.orderSubmissionAllowed === false,
    privateShadowIntentAuditEventContractReady:
      privateShadowIntentAuditEventContract.readiness?.readyForFuturePrivateShadowIntentAuditEventImplementationReview ===
        true &&
      privateShadowIntentAuditEventContract.readiness?.runtimeRouteAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.providerCallsAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.orderSubmissionAllowed === false,
    manualOperatorApprovalContractReady:
      manualOperatorApprovalContract.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      (manualOperatorApprovalContract.readiness?.runtimeRouteAllowed ?? false) === false &&
      manualOperatorApprovalContract.readiness?.providerCallsAllowed === false &&
      manualOperatorApprovalContract.readiness?.orderSubmissionAllowed === false,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false &&
      (envRiskGateContract.readiness?.liveTradingAllowed ?? false) === false,
    privateRuntimeRouteImplementationStillBlocked:
      privateRuntimeRouteImplementationPreflight.readiness?.readyForFuturePrivateRuntimeRouteImplementationReview ===
        false &&
      privateRuntimeRouteImplementationPreflight.readiness?.runtimeRouteImplementationAllowedNow === false &&
      privateRuntimeRouteImplementationPreflight.readiness?.runtimeRouteAllowed === false &&
      privateRuntimeRouteImplementationPreflight.readiness?.publicUiAllowed === false,
    privateDbStorageImplementationStillBlocked:
      privateDbStorageImplementationPreflight.readiness?.readyForFuturePrivateDbStorageImplementationReview === false &&
      privateDbStorageImplementationPreflight.readiness?.dbStorageImplementationAllowedNow === false &&
      privateDbStorageImplementationPreflight.readiness?.dbMigrationAllowed === false &&
      privateDbStorageImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsPrivateOperatorAccessImplementationPreflight:
      architectureDoc.includes("Trading Private Operator Access Implementation Preflight") &&
      architectureDoc.includes("private_operator_access_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    operatorAccessImplementationAllowedNow: false,
    authServiceAllowedNow: false,
    sessionTokenReadAllowedNow: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  };

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3C",
    scope: "private_operator_access_implementation_preflight",
    sourceFiles: {
      privateShadowOperatorAccessContract: PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH,
      privateShadowRuntimePreflight: PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH,
      privateShadowRuntimeReviewPacketContract: PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH,
      privateShadowIntentAuditEventContract: PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      privateRuntimeRouteImplementationPreflight: PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT_PATH,
      privateDbStorageImplementationPreflight: PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      operatorAccessImplementationAllowedNow: false,
      authServiceAllowedNow: false,
      sessionTokenReadAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateOperatorAccessImplementationBoundary: {
      scope: "private_operator_access_implementation_preflight",
      futureServicePath: FUTURE_OPERATOR_ACCESS_SERVICE_PATH,
      currentStepImplementsOperatorAccess: false,
      currentStepImplementsAuthentication: false,
      currentStepReadsSessionTokens: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepExposesPublicUi: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      reviewGates,
      implementationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start private operator access implementation review",
        "operator access review remains private-worker only and hash-only",
        "operator access review cannot create auth services, runtime routes, public UI, DB writes, provider calls, or orders in this step",
        "operator access success still does not approve private shadow runtime or live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      privateShadowOperatorAccessContractStatus: privateShadowOperatorAccessContract.readiness?.status,
      privateShadowRuntimePreflightStatus: privateShadowRuntimePreflight.readiness?.status,
      privateShadowRuntimeReviewPacketContractStatus: privateShadowRuntimeReviewPacketContract.readiness?.status,
      privateShadowIntentAuditEventContractStatus: privateShadowIntentAuditEventContract.readiness?.status,
      manualOperatorApprovalContractStatus: manualOperatorApprovalContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      privateRuntimeRouteImplementationPreflightStatus: privateRuntimeRouteImplementationPreflight.readiness?.status,
      privateDbStorageImplementationPreflightStatus: privateDbStorageImplementationPreflight.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_operator_access_review_blocked_pending_private_runtime_review",
      readyForFuturePrivateOperatorAccessImplementationReview: false,
      operatorAccessImplementationAllowedNow: false,
      authServiceAllowedNow: false,
      sessionTokenReadAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.privateShadowOperatorAccessContractReady ? [] : ["private_shadow_operator_access_contract_not_ready"]),
        ...(checks.privateShadowRuntimePreflightReady ? [] : ["private_shadow_runtime_preflight_not_ready"]),
        ...(checks.privateShadowRuntimeReviewPacketContractReady
          ? []
          : ["private_shadow_runtime_review_packet_contract_not_ready"]),
        ...(checks.privateShadowIntentAuditEventContractReady
          ? []
          : ["private_shadow_intent_audit_event_contract_not_ready"]),
        ...(checks.manualOperatorApprovalContractReady ? [] : ["manual_operator_approval_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.privateRuntimeRouteImplementationStillBlocked
          ? []
          : ["private_runtime_route_implementation_not_blocked"]),
        ...(checks.privateDbStorageImplementationStillBlocked ? [] : ["private_db_storage_implementation_not_blocked"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsPrivateOperatorAccessImplementationPreflight
          ? []
          : ["architecture_doc_missing_private_operator_access_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "private_shadow_runtime_implementation_review_not_started",
        "private_operator_access_implementation_review_blocked_pending_private_runtime_review",
        "operator_auth_service_review_not_started",
        "public_ui_review_not_started",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-operator-access-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-operator-access-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-private-operator-access-implementation-preflight] ok");
    console.log(`[generate-trading-private-operator-access-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-operator-access-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-private-operator-access-implementation-preflight] operatorAccessImplementationAllowedNow=${parsed.readiness.operatorAccessImplementationAllowedNow}`,
  );
}

main();

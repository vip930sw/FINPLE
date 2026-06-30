const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
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
const PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
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
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
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

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-runtime-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_RUNTIME_SERVICE_PATH = path.join("server", "src", "services", "trading", "privateShadowRuntime.js");
const REQUIRED_REVIEW_GATES = [
  "private_shadow_runtime_preflight_ready",
  "private_shadow_runtime_review_packet_contract_ready",
  "owner_read_only_approval_import_still_deferred",
  "private_read_only_provider_review_still_blocked",
  "private_operator_access_review_still_blocked",
  "private_db_storage_review_still_blocked",
  "private_runtime_route_review_still_blocked",
  "manual_order_permission_still_not_imported",
  "env_risk_gate_fail_closed",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_worker_only",
  "shadow_mode_only",
  "no_provider_call",
  "no_order_submission",
  "no_order_cancellation",
  "no_database_write_now",
  "no_runtime_route",
  "no_public_ui",
  "no_default_private_packet_read",
  "hash_only_snapshot_and_intent_references",
  "redacted_error_messages_only",
  "fail_closed_without_owner_read_only_approval_import",
  "fail_closed_without_operator_access_hash",
  "fail_closed_without_runtime_review_packet_hash",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
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
  FUTURE_RUNTIME_SERVICE_PATH,
  path.join("server", "src", "services", "tradingShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "shadowRuntime.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateTradingStore.js"),
  path.join("server", "src", "services", "trading", "privateOperatorAccess.js"),
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
  const privateShadowRuntimePreflight = readJson(PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH);
  const privateShadowRuntimeReviewPacketContract = readJson(PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH);
  const privateOperatorAccessImplementationPreflight = readJson(PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateRuntimeRouteImplementationPreflight = readJson(PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateDbStorageImplementationPreflight = readJson(PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateReadOnlyProviderImplementationPreflight = readJson(
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
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
    readOnlyApprovalStillDeferred:
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.readOnlyApprovalImportImplementationAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderImplementationPreflight.readiness?.ownerPacketGateStillClosed === true &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    privateOperatorAccessImplementationStillBlocked:
      privateOperatorAccessImplementationPreflight.readiness?.readyForFuturePrivateOperatorAccessImplementationReview ===
        false &&
      privateOperatorAccessImplementationPreflight.readiness?.operatorAccessImplementationAllowedNow === false &&
      privateOperatorAccessImplementationPreflight.readiness?.authServiceAllowedNow === false &&
      privateOperatorAccessImplementationPreflight.readiness?.runtimeRouteAllowed === false &&
      privateOperatorAccessImplementationPreflight.readiness?.providerCallsAllowed === false,
    privateDbStorageImplementationStillBlocked:
      privateDbStorageImplementationPreflight.readiness?.readyForFuturePrivateDbStorageImplementationReview === false &&
      privateDbStorageImplementationPreflight.readiness?.dbStorageImplementationAllowedNow === false &&
      privateDbStorageImplementationPreflight.readiness?.databaseConnectionAllowedNow === false &&
      privateDbStorageImplementationPreflight.readiness?.dbMigrationAllowed === false,
    privateRuntimeRouteImplementationStillBlocked:
      privateRuntimeRouteImplementationPreflight.readiness?.readyForFuturePrivateRuntimeRouteImplementationReview ===
        false &&
      privateRuntimeRouteImplementationPreflight.readiness?.runtimeRouteImplementationAllowedNow === false &&
      privateRuntimeRouteImplementationPreflight.readiness?.runtimeRouteAllowed === false &&
      privateRuntimeRouteImplementationPreflight.readiness?.publicUiAllowed === false,
    manualOrderPermissionStillNotImported:
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportImplementationAllowed === false &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsPrivateShadowRuntimeImplementationPreflight:
      architectureDoc.includes("Trading Private Shadow Runtime Implementation Preflight") &&
      architectureDoc.includes("private_shadow_runtime_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    privateShadowRuntimeImplementationAllowedNow: false,
    privateShadowRuntimeServiceAllowedNow: false,
    readOnlyProviderCallsAllowedNow: false,
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
    step: "Step 116-3D",
    scope: "private_shadow_runtime_implementation_preflight",
    sourceFiles: {
      privateShadowRuntimePreflight: PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH,
      privateShadowRuntimeReviewPacketContract: PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH,
      privateOperatorAccessImplementationPreflight: PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH,
      privateRuntimeRouteImplementationPreflight: PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT_PATH,
      privateDbStorageImplementationPreflight: PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      privateShadowRuntimeImplementationAllowedNow: false,
      privateShadowRuntimeServiceAllowedNow: false,
      readOnlyProviderCallsAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateShadowRuntimeImplementationBoundary: {
      scope: "private_shadow_runtime_implementation_preflight",
      futureServicePath: FUTURE_RUNTIME_SERVICE_PATH,
      currentStepImplementsRuntime: false,
      currentStepCallsProvider: false,
      currentStepReadsPrivateApprovalPacket: false,
      currentStepWritesDatabase: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepExposesPublicUi: false,
      currentStepSubmitsOrders: false,
      reviewGates,
      implementationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start private shadow runtime implementation review",
        "runtime implementation review stays blocked until owner read-only approval import and operator access review are recorded separately",
        "private shadow runtime review cannot call providers, write DB rows, create routes, expose UI, or submit orders in this step",
        "shadow runtime success still does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      privateShadowRuntimePreflightStatus: privateShadowRuntimePreflight.readiness?.status,
      privateShadowRuntimeReviewPacketContractStatus: privateShadowRuntimeReviewPacketContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus:
        privateReadOnlyProviderImplementationPreflight.readiness?.status,
      privateOperatorAccessImplementationPreflightStatus:
        privateOperatorAccessImplementationPreflight.readiness?.status,
      privateDbStorageImplementationPreflightStatus: privateDbStorageImplementationPreflight.readiness?.status,
      privateRuntimeRouteImplementationPreflightStatus: privateRuntimeRouteImplementationPreflight.readiness?.status,
      manualOrderPermissionPreflightStatus: manualOrderPermissionPreflight.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_private_shadow_runtime_review_blocked_pending_owner_packet_and_operator_access",
      readyForFuturePrivateShadowRuntimeImplementationReview: false,
      privateShadowRuntimeImplementationAllowedNow: false,
      privateShadowRuntimeServiceAllowedNow: false,
      readOnlyProviderCallsAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.privateShadowRuntimePreflightReady ? [] : ["private_shadow_runtime_preflight_not_ready"]),
        ...(checks.privateShadowRuntimeReviewPacketContractReady
          ? []
          : ["private_shadow_runtime_review_packet_contract_not_ready"]),
        ...(checks.readOnlyApprovalStillDeferred ? [] : ["owner_read_only_approval_import_not_deferred"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_not_blocked"]),
        ...(checks.privateOperatorAccessImplementationStillBlocked
          ? []
          : ["private_operator_access_implementation_not_blocked"]),
        ...(checks.privateDbStorageImplementationStillBlocked ? [] : ["private_db_storage_implementation_not_blocked"]),
        ...(checks.privateRuntimeRouteImplementationStillBlocked
          ? []
          : ["private_runtime_route_implementation_not_blocked"]),
        ...(checks.manualOrderPermissionStillNotImported ? [] : ["manual_order_permission_not_closed"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsPrivateShadowRuntimeImplementationPreflight
          ? []
          : ["architecture_doc_missing_private_shadow_runtime_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "owner_redacted_read_only_approval_packet_not_imported",
        "private_operator_access_implementation_review_blocked_pending_private_runtime_review",
        "private_read_only_provider_implementation_review_blocked_pending_owner_packet_import",
        "db_storage_review_blocked_pending_private_runtime_review",
        "runtime_route_review_blocked_pending_private_runtime_review",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-runtime-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-runtime-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-private-shadow-runtime-implementation-preflight] ok");
    console.log(`[generate-trading-private-shadow-runtime-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-runtime-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-private-shadow-runtime-implementation-preflight] privateShadowRuntimeImplementationAllowedNow=${parsed.readiness.privateShadowRuntimeImplementationAllowedNow}`,
  );
}

main();

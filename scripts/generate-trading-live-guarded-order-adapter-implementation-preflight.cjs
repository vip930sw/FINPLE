const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const ORDER_ADAPTER_DESIGN_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_order_adapter_design_review.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
);
const KILL_SWITCH_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_order_credential_boundary_contract.json",
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
const AUDIT_LOGGER_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
);
const PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-live-guarded-order-adapter-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_ORDER_ADAPTER_PATH = path.join("server", "src", "services", "trading", "kisOrderAdapter.js");
const REQUIRED_REVIEW_GATES = [
  "manual_order_permission_packet_imported_later",
  "manual_order_permission_validator_fixture_regression_ready",
  "kill_switch_clearance_review_recorded_later",
  "risk_gate_clearance_review_recorded_later",
  "separate_order_capable_credential_review_recorded_later",
  "dry_run_replay_review_recorded_later",
  "shadow_history_review_recorded_later",
  "audit_logger_review_recorded_later",
  "private_shadow_runtime_review_recorded_later",
  "private_operator_access_review_recorded_later",
  "env_risk_gate_fail_closed",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_worker_only",
  "live_guarded_only_after_manual_permission",
  "explicit_order_intent_input",
  "explicit_manual_permission_reference_hash",
  "kill_switch_before_request_signing",
  "risk_gate_before_request_signing",
  "dry_run_replay_before_submission",
  "idempotency_key_required",
  "request_and_response_hashes_only",
  "no_default_private_packet_read",
  "no_runtime_route",
  "no_public_ui",
  "no_database_migration_now",
  "no_scenario_monthly_cache_write",
  "redacted_error_messages_only",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_ORDER_ADAPTER_PATH,
  path.join("server", "src", "services", "kisTradingService.js"),
  path.join("server", "src", "services", "kisOrderService.js"),
  path.join("server", "src", "services", "tradingOrderService.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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
  const orderAdapterDesignReview = readJson(ORDER_ADAPTER_DESIGN_REVIEW_PATH);
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const manualOrderPermissionValidatorFixtures = readJson(MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH);
  const killSwitchClearanceContract = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const orderCredentialBoundaryContract = readJson(ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH);
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReviewContract = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const privateShadowRuntimeImplementationPreflight = readJson(PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateOperatorAccessImplementationPreflight = readJson(PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH);
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
    orderAdapterDesignReviewReady:
      orderAdapterDesignReview.readiness?.readyForFutureOrderAdapterImplementationReview === true &&
      orderAdapterDesignReview.readiness?.adapterImplementationAllowed === false &&
      orderAdapterDesignReview.readiness?.providerCallsAllowed === false &&
      orderAdapterDesignReview.readiness?.orderSubmissionAllowed === false &&
      orderAdapterDesignReview.readiness?.dbMigrationAllowed === false &&
      orderAdapterDesignReview.readiness?.publicUiAllowed === false,
    manualOrderPermissionPreflightReady:
      manualOrderPermissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportImplementationAllowed === false &&
      manualOrderPermissionPreflight.readiness?.providerCallsAllowed === false &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false &&
      manualOrderPermissionPreflight.readiness?.runtimeRouteAllowed === false,
    manualOrderPermissionValidatorFixturesReady:
      manualOrderPermissionValidatorFixtures.readiness?.readyForManualOrderPermissionFixtureRegression === true &&
      manualOrderPermissionValidatorFixtures.readiness?.providerCallsAllowed === false &&
      manualOrderPermissionValidatorFixtures.readiness?.orderSubmissionAllowed === false &&
      manualOrderPermissionValidatorFixtures.readiness?.permissionImportAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearanceContract.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearanceContract.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearanceContract.readiness?.providerCallsAllowed === false &&
      killSwitchClearanceContract.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearanceContract.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearanceContract.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearanceContract.readiness?.providerCallsAllowed === false &&
      riskGateClearanceContract.readiness?.orderSubmissionAllowed === false,
    orderCredentialBoundaryContractReady:
      orderCredentialBoundaryContract.readiness?.readyForFutureOrderCredentialImplementationReview === true &&
      orderCredentialBoundaryContract.readiness?.credentialStoreImplementationAllowed === false &&
      orderCredentialBoundaryContract.readiness?.providerCallsAllowed === false &&
      orderCredentialBoundaryContract.readiness?.orderSubmissionAllowed === false,
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
    auditLoggerReadinessContractReady:
      auditLoggerReadinessContract.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadinessContract.readiness?.auditLoggerImplementationAllowed === false &&
      auditLoggerReadinessContract.readiness?.providerCallsAllowed === false &&
      auditLoggerReadinessContract.readiness?.orderSubmissionAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.readyForProviderCalls === false &&
      envRiskGateContract.readiness?.readyForRuntimeRoute === false &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimeReviewStillBlocked:
      privateShadowRuntimeImplementationPreflight.readiness
        ?.readyForFuturePrivateShadowRuntimeImplementationReview === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.privateShadowRuntimeImplementationAllowedNow === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.orderSubmissionAllowed === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    privateOperatorAccessReviewStillBlocked:
      privateOperatorAccessImplementationPreflight.readiness
        ?.readyForFuturePrivateOperatorAccessImplementationReview === false &&
      privateOperatorAccessImplementationPreflight.readiness?.operatorAccessImplementationAllowedNow === false &&
      privateOperatorAccessImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateOperatorAccessImplementationPreflight.readiness?.orderSubmissionAllowed === false &&
      privateOperatorAccessImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsLiveGuardedOrderAdapterPreflight:
      architectureDoc.includes("Trading Live-Guarded Order Adapter Implementation Preflight") &&
      architectureDoc.includes("live_guarded_order_adapter_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    orderAdapterImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3U",
    scope: "live_guarded_order_adapter_implementation_preflight",
    sourceFiles: {
      orderAdapterDesignReview: ORDER_ADAPTER_DESIGN_REVIEW_PATH,
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      manualOrderPermissionValidatorFixtures: MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      orderCredentialBoundaryContract: ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      privateShadowRuntimeImplementationPreflight: PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
      privateOperatorAccessImplementationPreflight: PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      preflightOnly: true,
      manualOrderPermissionImportedNow: false,
      privateShadowRuntimeImplementedNow: false,
      privateOperatorAccessImplementedNow: false,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureLiveGuardedOrderAdapterBoundary: {
      mode: "live_guarded",
      futureOrderAdapterPath: FUTURE_ORDER_ADAPTER_PATH,
      currentStepImplementsOrderAdapter: false,
      currentStepImportsManualPermission: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepCreatesPublicUi: false,
      reviewGates,
      implementationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start order adapter implementation review",
        "manual order permission import must be reviewed separately before implementation review",
        "private shadow runtime and operator access reviews must remain separate prerequisites",
        "kill-switch, risk-gate, credential, replay, history, and audit reviews must remain fail-closed",
        "adapter implementation review cannot create runtime routes, DB migrations, public UI, or scenario cache writes",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      orderAdapterDesignReviewStatus: orderAdapterDesignReview.readiness?.status,
      manualOrderPermissionPreflightStatus: manualOrderPermissionPreflight.readiness?.status,
      manualOrderPermissionValidatorFixturesStatus: manualOrderPermissionValidatorFixtures.readiness?.status,
      killSwitchClearanceContractStatus: killSwitchClearanceContract.readiness?.status,
      riskGateClearanceContractStatus: riskGateClearanceContract.readiness?.status,
      orderCredentialBoundaryContractStatus: orderCredentialBoundaryContract.readiness?.status,
      dryRunReplayContractStatus: dryRunReplayContract.readiness?.status,
      shadowHistoryReviewContractStatus: shadowHistoryReviewContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      privateShadowRuntimeImplementationPreflightStatus: privateShadowRuntimeImplementationPreflight.readiness?.status,
      privateOperatorAccessImplementationPreflightStatus: privateOperatorAccessImplementationPreflight.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_live_guarded_order_adapter_review_blocked_pending_manual_permission_and_runtime_clearance",
      readyForFutureLiveGuardedOrderAdapterImplementationReview: false,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.orderAdapterDesignReviewReady ? [] : ["order_adapter_design_review_not_ready"]),
        ...(checks.manualOrderPermissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.manualOrderPermissionValidatorFixturesReady
          ? []
          : ["manual_order_permission_validator_fixtures_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.orderCredentialBoundaryContractReady ? [] : ["order_credential_boundary_contract_not_ready"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_not_fail_closed"]),
        ...(checks.privateShadowRuntimeReviewStillBlocked ? [] : ["private_shadow_runtime_review_not_blocked"]),
        ...(checks.privateOperatorAccessReviewStillBlocked ? [] : ["private_operator_access_review_not_blocked"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsLiveGuardedOrderAdapterPreflight
          ? []
          : ["architecture_doc_missing_live_guarded_order_adapter_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "manual_order_permission_packet_not_imported",
        "private_shadow_runtime_review_blocked_pending_owner_packet_and_operator_access",
        "private_operator_access_review_blocked_pending_private_runtime_review",
        "kill_switch_clearance_not_recorded_for_order_submission",
        "risk_gate_clearance_not_recorded_for_order_submission",
        "live_guarded_order_adapter_implementation_review_not_started",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-live-guarded-order-adapter-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-live-guarded-order-adapter-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-live-guarded-order-adapter-implementation-preflight] ok");
    console.log(`[generate-trading-live-guarded-order-adapter-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-live-guarded-order-adapter-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-live-guarded-order-adapter-implementation-preflight] readyForFutureLiveGuardedOrderAdapterImplementationReview=${parsed.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview}`,
  );
}

main();

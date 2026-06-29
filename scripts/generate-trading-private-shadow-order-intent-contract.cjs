const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_order_intent_contract.json",
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
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-order-intent-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_ORDER_INTENT_FIELDS = [
  "intentId",
  "mode",
  "strategyIdHash",
  "operatorIdHash",
  "createdAt",
  "market",
  "symbol",
  "side",
  "orderType",
  "quantity",
  "limitPriceHash",
  "estimatedNotionalHash",
  "currency",
  "riskInputHash",
  "riskGateStatus",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "auditEventHash",
  "idempotencyKeyHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_ORDER_INTENT_ASSERTIONS = [
  "shadow_order_intent_hash_only",
  "order_intent_does_not_submit_orders",
  "risk_gate_live_review_required_only",
  "kill_switch_blocks_intent_promotion",
  "stale_snapshot_blocks_intent_promotion",
  "audit_event_required_before_intent_record",
  "manual_approval_not_created_by_shadow_intent",
  "raw_provider_payload_never_attached",
  "order_confirmation_rejected",
  "scenario_monthly_rows_rejected",
  "shadow_order_intent_success_does_not_enable_runtime",
  "shadow_order_intent_success_does_not_approve_live_guarded",
];
const FORBIDDEN_ORDER_INTENT_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
  "raw_provider_payload",
  "raw_quote_value",
  "raw_position_value",
  "raw_cash_value",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingPrivateShadowOrderIntent.js"),
  path.join("server", "src", "services", "trading", "privateShadowOrderIntent.js"),
  path.join("server", "src", "services", "trading", "shadowOrderIntentRecorder.js"),
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
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReviewContract = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const readOnlySnapshotRiskInputContract = readJson(READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const orderIntentFields = [...REQUIRED_ORDER_INTENT_FIELDS];
  const orderIntentAssertions = [...REQUIRED_ORDER_INTENT_ASSERTIONS];
  const forbiddenOrderIntentContent = [...FORBIDDEN_ORDER_INTENT_CONTENT];
  const missingOrderIntentFields = missingValues(orderIntentFields, REQUIRED_ORDER_INTENT_FIELDS);
  const missingOrderIntentAssertions = missingValues(orderIntentAssertions, REQUIRED_ORDER_INTENT_ASSERTIONS);
  const missingForbiddenOrderIntentContent = missingValues(
    forbiddenOrderIntentContent,
    FORBIDDEN_ORDER_INTENT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    readOnlySnapshotRiskInputContractReady:
      readOnlySnapshotRiskInputContract.readiness
        ?.readyForFutureReadOnlySnapshotRiskInputImplementationReview === true &&
      readOnlySnapshotRiskInputContract.readiness?.snapshotRiskInputImplementationAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.providerCallsAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.orderSubmissionAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.runtimeRouteAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearanceContract.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearanceContract.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearanceContract.readiness?.providerCallsAllowed === false &&
      riskGateClearanceContract.readiness?.orderSubmissionAllowed === false,
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
    orderIntentFieldsReady: missingOrderIntentFields.length === 0,
    orderIntentAssertionsReady: missingOrderIntentAssertions.length === 0,
    forbiddenOrderIntentContentReady: missingForbiddenOrderIntentContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsPrivateShadowOrderIntent:
      architectureDoc.includes("Trading Private Shadow Order Intent Contract") &&
      architectureDoc.includes("private_shadow_order_intent"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    privateShadowOrderIntentImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFuturePrivateShadowOrderIntentImplementationReview =
    checks.shadowModePolicyReady &&
    checks.readOnlySnapshotRiskInputContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.orderIntentFieldsReady &&
    checks.orderIntentAssertionsReady &&
    checks.forbiddenOrderIntentContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsPrivateShadowOrderIntent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1Y",
    scope: "trading_private_shadow_order_intent_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      readOnlySnapshotRiskInputContract: READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      privateShadowOrderIntentImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateShadowOrderIntentBoundary: {
      scope: "private_shadow_order_intent",
      purpose:
        "define future private shadow order-intent records as hash-only audited intents without provider calls, order submission, runtime routes, or DB storage in this step",
      requiredOrderIntentFields: orderIntentFields,
      requiredOrderIntentAssertions: orderIntentAssertions,
      forbiddenOrderIntentContent,
      redactionRules: [
        "order intent records use hashes for operator, strategy, risk input, notional, snapshot references, replay references, and audit events",
        "raw quote, position, cash, account, provider, order-confirmation, execution, and fill payloads never attach to the intent",
        "manual approval is referenced later by hash and is not created by the shadow order intent contract",
      ],
      promotionRules: [
        "shadow order intent review does not perform provider calls",
        "shadow order intent review does not submit or cancel orders",
        "shadow order intent review does not create runtime routes or DB migrations",
        "shadow order intent success does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingOrderIntentFields,
      missingOrderIntentAssertions,
      missingForbiddenOrderIntentContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      readOnlySnapshotRiskInputContractStatus: readOnlySnapshotRiskInputContract.readiness?.status,
      riskGateClearanceContractStatus: riskGateClearanceContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      dryRunReplayContractStatus: dryRunReplayContract.readiness?.status,
      shadowHistoryReviewContractStatus: shadowHistoryReviewContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFuturePrivateShadowOrderIntentImplementationReview
        ? "contract_ready_pending_private_shadow_order_intent_implementation_review"
        : "blocked_before_private_shadow_order_intent_contract",
      readyForFuturePrivateShadowOrderIntentImplementationReview,
      privateShadowOrderIntentImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.readOnlySnapshotRiskInputContractReady
          ? []
          : ["read_only_snapshot_risk_input_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...missingOrderIntentFields.map((field) => `missing_order_intent_field_${field}`),
        ...missingOrderIntentAssertions.map((assertion) => `missing_order_intent_assertion_${assertion}`),
        ...missingForbiddenOrderIntentContent.map((content) => `missing_forbidden_order_intent_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsPrivateShadowOrderIntent
          ? []
          : ["architecture_doc_missing_private_shadow_order_intent_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-order-intent-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-order-intent-contract.cjs`);
    }
    console.log("[generate-trading-private-shadow-order-intent-contract] ok");
    console.log(`[generate-trading-private-shadow-order-intent-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-order-intent-contract] wrote contract");
  console.log(
    `[generate-trading-private-shadow-order-intent-contract] readyForFuturePrivateShadowOrderIntentImplementationReview=${parsed.readiness.readyForFuturePrivateShadowOrderIntentImplementationReview}`,
  );
}

main();

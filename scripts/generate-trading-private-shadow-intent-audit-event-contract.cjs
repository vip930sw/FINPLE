const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
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
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_order_intent_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-intent-audit-event-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_AUDIT_EVENT_FIELDS = [
  "eventId",
  "eventType",
  "mode",
  "severity",
  "status",
  "createdAt",
  "operatorIdHash",
  "strategyIdHash",
  "intentIdHash",
  "orderIntentHash",
  "riskInputHash",
  "riskGateStatus",
  "riskEventHash",
  "market",
  "symbol",
  "side",
  "decisionStatus",
  "snapshotFreshnessStatus",
  "killSwitchStateHash",
  "manualApprovalStateHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "payloadHash",
  "previousEventHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_AUDIT_EVENT_ASSERTIONS = [
  "audit_event_hash_only",
  "audit_event_required_before_shadow_intent_record",
  "blocked_intent_records_risk_reason_hash",
  "stale_snapshot_records_blocked_status",
  "kill_switch_block_records_blocked_status",
  "manual_approval_not_created_by_audit_event",
  "raw_provider_payload_never_logged",
  "raw_order_payload_never_logged",
  "scenario_monthly_rows_rejected",
  "audit_event_success_does_not_enable_runtime",
  "audit_event_success_does_not_approve_live_guarded",
];
const FORBIDDEN_AUDIT_EVENT_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
  "raw_provider_payload",
  "raw_order_payload",
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
  path.join("server", "src", "services", "tradingPrivateShadowIntentAuditEvent.js"),
  path.join("server", "src", "services", "trading", "privateShadowIntentAuditEvent.js"),
  path.join("server", "src", "services", "trading", "shadowIntentAuditLogger.js"),
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
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const privateShadowOrderIntentContract = readJson(PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH);
  const readOnlySnapshotRiskInputContract = readJson(READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const auditEventFields = [...REQUIRED_AUDIT_EVENT_FIELDS];
  const auditEventAssertions = [...REQUIRED_AUDIT_EVENT_ASSERTIONS];
  const forbiddenAuditEventContent = [...FORBIDDEN_AUDIT_EVENT_CONTENT];
  const missingAuditEventFields = missingValues(auditEventFields, REQUIRED_AUDIT_EVENT_FIELDS);
  const missingAuditEventAssertions = missingValues(auditEventAssertions, REQUIRED_AUDIT_EVENT_ASSERTIONS);
  const missingForbiddenAuditEventContent = missingValues(forbiddenAuditEventContent, FORBIDDEN_AUDIT_EVENT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    privateShadowOrderIntentContractReady:
      privateShadowOrderIntentContract.readiness?.readyForFuturePrivateShadowOrderIntentImplementationReview === true &&
      privateShadowOrderIntentContract.readiness?.privateShadowOrderIntentImplementationAllowed === false &&
      privateShadowOrderIntentContract.readiness?.providerCallsAllowed === false &&
      privateShadowOrderIntentContract.readiness?.orderSubmissionAllowed === false &&
      privateShadowOrderIntentContract.readiness?.runtimeRouteAllowed === false,
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
    auditEventFieldsReady: missingAuditEventFields.length === 0,
    auditEventAssertionsReady: missingAuditEventAssertions.length === 0,
    forbiddenAuditEventContentReady: missingForbiddenAuditEventContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsPrivateShadowIntentAuditEvent:
      architectureDoc.includes("Trading Private Shadow Intent Audit Event Contract") &&
      architectureDoc.includes("private_shadow_intent_audit_event"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    privateShadowIntentAuditEventImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFuturePrivateShadowIntentAuditEventImplementationReview =
    checks.shadowModePolicyReady &&
    checks.privateShadowOrderIntentContractReady &&
    checks.readOnlySnapshotRiskInputContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.auditEventFieldsReady &&
    checks.auditEventAssertionsReady &&
    checks.forbiddenAuditEventContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsPrivateShadowIntentAuditEvent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1Z",
    scope: "trading_private_shadow_intent_audit_event_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      privateShadowOrderIntentContract: PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH,
      readOnlySnapshotRiskInputContract: READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      privateShadowIntentAuditEventImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateShadowIntentAuditEventBoundary: {
      scope: "private_shadow_intent_audit_event",
      purpose:
        "define future hash-only audit events for private shadow order intents before any audit logger, runtime route, provider call, order submission, or DB storage implementation review",
      requiredAuditEventFields: auditEventFields,
      requiredAuditEventAssertions: auditEventAssertions,
      forbiddenAuditEventContent,
      redactionRules: [
        "audit event payloads use hashes for operator, strategy, intent, risk input, risk event, snapshot state, replay, history, and previous-event linkage",
        "blocked intents must preserve risk reason hashes without raw provider, account, quote, order, execution, or fill payloads",
        "audit events cannot create manual approval, provider calls, order submission, runtime routes, or DB storage by themselves",
      ],
      promotionRules: [
        "intent audit event review does not perform provider calls",
        "intent audit event review does not submit or cancel orders",
        "intent audit event review does not create runtime routes or DB migrations",
        "intent audit event success does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingAuditEventFields,
      missingAuditEventAssertions,
      missingForbiddenAuditEventContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      privateShadowOrderIntentContractStatus: privateShadowOrderIntentContract.readiness?.status,
      readOnlySnapshotRiskInputContractStatus: readOnlySnapshotRiskInputContract.readiness?.status,
      riskGateClearanceContractStatus: riskGateClearanceContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFuturePrivateShadowIntentAuditEventImplementationReview
        ? "contract_ready_pending_private_shadow_intent_audit_event_implementation_review"
        : "blocked_before_private_shadow_intent_audit_event_contract",
      readyForFuturePrivateShadowIntentAuditEventImplementationReview,
      privateShadowIntentAuditEventImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.privateShadowOrderIntentContractReady
          ? []
          : ["private_shadow_order_intent_contract_not_ready"]),
        ...(checks.readOnlySnapshotRiskInputContractReady
          ? []
          : ["read_only_snapshot_risk_input_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingAuditEventFields.map((field) => `missing_audit_event_field_${field}`),
        ...missingAuditEventAssertions.map((assertion) => `missing_audit_event_assertion_${assertion}`),
        ...missingForbiddenAuditEventContent.map((content) => `missing_forbidden_audit_event_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsPrivateShadowIntentAuditEvent
          ? []
          : ["architecture_doc_missing_private_shadow_intent_audit_event_boundary"]),
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
      fail(
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-intent-audit-event-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-intent-audit-event-contract.cjs`,
      );
    }
    console.log("[generate-trading-private-shadow-intent-audit-event-contract] ok");
    console.log(`[generate-trading-private-shadow-intent-audit-event-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-intent-audit-event-contract] wrote contract");
  console.log(
    `[generate-trading-private-shadow-intent-audit-event-contract] readyForFuturePrivateShadowIntentAuditEventImplementationReview=${parsed.readiness.readyForFuturePrivateShadowIntentAuditEventImplementationReview}`,
  );
}

main();

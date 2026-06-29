const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_audit_logger_readiness_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const STORE_SCHEMA_PATH = path.join("data", "processed", "trading_lab_step116_store_schema_draft.json");
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
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-audit-logger-readiness-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_EVENT_TYPES = [
  "trading_risk_gate",
  "trading_order_intent",
  "trading_blocked_intent",
  "trading_dry_run_replay",
  "trading_shadow_history_review",
  "manual_operator_approval",
  "kill_switch_state_change",
];
const REQUIRED_EVENT_FIELDS = [
  "eventId",
  "eventType",
  "createdAt",
  "mode",
  "severity",
  "status",
  "symbol",
  "side",
  "reasons",
  "riskGateStatus",
  "orderSubmissionAllowed",
  "providerCallsAllowed",
  "redactionVersion",
  "payloadHash",
];
const REQUIRED_REDACTION_RULES = [
  "never_log_kis_trading_app_secret",
  "never_log_access_tokens",
  "never_log_full_account_numbers",
  "never_persist_raw_provider_payloads",
  "hash_request_and_response_bodies_before_persistence",
  "store_secret_presence_only",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "runtime_provider_call",
  "order_submission",
  "production_secret_usage",
  "raw_provider_response_persistence",
  "db_migration",
  "public_ui",
  "scenario_monthly_cache_write",
];
const REQUIRED_STORE_TABLES = ["trading_order_attempts", "trading_executions", "trading_risk_events"];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingAuditLogger.js"),
  path.join("server", "src", "services", "trading", "auditLogger.js"),
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
  const storeSchema = readJson(STORE_SCHEMA_PATH);
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReviewContract = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const requiredEventTypes = [...REQUIRED_EVENT_TYPES];
  const requiredEventFields = [...REQUIRED_EVENT_FIELDS];
  const redactionRules = [...REQUIRED_REDACTION_RULES];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const tableNames = (storeSchema.tables ?? []).map((table) => table.name);
  const missingEventTypes = missingValues(requiredEventTypes, REQUIRED_EVENT_TYPES);
  const missingEventFields = missingValues(requiredEventFields, REQUIRED_EVENT_FIELDS);
  const missingRedactionRules = missingValues(redactionRules, REQUIRED_REDACTION_RULES);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const missingStoreTables = missingValues(tableNames, REQUIRED_STORE_TABLES);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    policyStillBlocksRuntime:
      policy.defaults?.orderSubmissionAllowed === false &&
      policy.defaults?.providerCallsAllowed === false &&
      policy.defaults?.dbMigrationAllowed === false &&
      policy.defaults?.publicUiAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    dryRunReplayContractReady:
      dryRunReplayContract.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplayContract.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplayContract.readiness?.providerCallsAllowed === false &&
      dryRunReplayContract.readiness?.orderSubmissionAllowed === false &&
      dryRunReplayContract.readiness?.dbMigrationAllowed === false &&
      dryRunReplayContract.readiness?.publicUiAllowed === false,
    shadowHistoryReviewContractReady:
      shadowHistoryReviewContract.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReviewContract.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReviewContract.readiness?.providerCallsAllowed === false &&
      shadowHistoryReviewContract.readiness?.orderSubmissionAllowed === false &&
      shadowHistoryReviewContract.readiness?.dbMigrationAllowed === false &&
      shadowHistoryReviewContract.readiness?.publicUiAllowed === false,
    futureStoreTablesReady: missingStoreTables.length === 0,
    eventTypesReady: missingEventTypes.length === 0,
    eventFieldsReady: missingEventFields.length === 0,
    redactionRulesReady: missingRedactionRules.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    architectureDocMentionsAuditLogger:
      architectureDoc.includes("Trading Audit Logger Readiness Contract") &&
      architectureDoc.includes("audit_logger_ready"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    auditLoggerImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureAuditLoggerImplementationReview =
    checks.policyStillBlocksRuntime &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.futureStoreTablesReady &&
    checks.eventTypesReady &&
    checks.eventFieldsReady &&
    checks.redactionRulesReady &&
    checks.forbiddenActionsReady &&
    checks.architectureDocMentionsAuditLogger &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1M",
    scope: "trading_audit_logger_readiness_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      storeSchemaDraft: STORE_SCHEMA_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      auditLoggerExistsNow: false,
      auditLoggerImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureAuditLoggerBoundary: {
      purpose: "record future trading intent, risk, replay, shadow review, and operator approval evidence before live_guarded adapter implementation review",
      requiredEventTypes,
      requiredEventFields,
      redactionRules,
      forbiddenActions,
      storageBoundary: {
        currentStepWritesDatabase: false,
        futureTablesForManualReview: ["trading_risk_events"],
        rawProviderPayloadStorageAllowed: false,
      },
      promotionRules: [
        "risk events must be recorded before live_guarded adapter implementation review",
        "blocked order intents must be auditable before any future provider submission path",
        "audit logger readiness does not approve provider calls or order submission",
        "audit logger readiness does not approve database migration",
      ],
    },
    checks,
    evidence: {
      missingEventTypes,
      missingEventFields,
      missingRedactionRules,
      missingForbiddenActions,
      missingStoreTables,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      dryRunReplayContractStatus: dryRunReplayContract.readiness?.status,
      shadowHistoryReviewContractStatus: shadowHistoryReviewContract.readiness?.status,
      storeSchemaStatus: storeSchema.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureAuditLoggerImplementationReview
        ? "contract_ready_pending_audit_logger_implementation_review"
        : "blocked_before_audit_logger_readiness_contract",
      readyForFutureAuditLoggerImplementationReview,
      auditLoggerImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.policyStillBlocksRuntime ? [] : ["policy_defaults_allow_runtime_too_early"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...missingStoreTables.map((table) => `missing_future_table_${table}`),
        ...missingEventTypes.map((eventType) => `missing_event_type_${eventType}`),
        ...missingEventFields.map((field) => `missing_event_field_${field}`),
        ...missingRedactionRules.map((rule) => `missing_redaction_rule_${rule}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.architectureDocMentionsAuditLogger ? [] : ["architecture_doc_missing_audit_logger_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-audit-logger-readiness-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-audit-logger-readiness-contract.cjs`);
    }
    console.log("[generate-trading-audit-logger-readiness-contract] ok");
    console.log(`[generate-trading-audit-logger-readiness-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-audit-logger-readiness-contract] wrote contract");
  console.log(
    `[generate-trading-audit-logger-readiness-contract] readyForFutureAuditLoggerImplementationReview=${parsed.readiness.readyForFutureAuditLoggerImplementationReview}`,
  );
}

main();

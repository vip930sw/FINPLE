const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_db_storage_implementation_preflight.json",
);
const STORE_SCHEMA_DRAFT_PATH = path.join("data", "processed", "trading_lab_step116_store_schema_draft.json");
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
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
);
const PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_order_intent_contract.json",
);
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
);
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-db-storage-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_STORAGE_SERVICE_PATH = path.join("server", "src", "services", "trading", "privateTradingStore.js");
const REQUIRED_REVIEW_GATES = [
  "store_schema_draft_ready",
  "private_shadow_runtime_preflight_ready",
  "private_shadow_runtime_review_packet_contract_ready",
  "private_operator_access_contract_ready",
  "private_shadow_order_intent_contract_ready",
  "private_shadow_intent_audit_event_contract_ready",
  "private_read_only_provider_implementation_still_blocked",
  "manual_db_migration_review_later",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_worker_only",
  "migration_review_required_later",
  "no_ddl_generation_now",
  "no_database_connection_now",
  "no_runtime_route",
  "no_public_ui",
  "no_provider_call",
  "no_order_submission",
  "no_raw_provider_payload_storage",
  "hash_only_approval_and_snapshot_references",
  "redacted_error_messages_only",
];
const REQUIRED_STORAGE_BOUNDARIES = [
  "trading_modes",
  "trading_strategy_versions",
  "trading_decisions",
  "trading_order_intents",
  "trading_order_attempts",
  "trading_executions",
  "trading_positions",
  "trading_risk_events",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_STORAGE_SERVICE_PATH,
  path.join("server", "src", "services", "tradingPrivateStore.js"),
  path.join("server", "src", "repositories", "trading"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
  path.join("supabase", "migrations", "trading"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
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

function tableNames(schemaDraft) {
  return (schemaDraft.tables ?? []).map((table) => table.name);
}

function buildContract() {
  const storeSchemaDraft = readJson(STORE_SCHEMA_DRAFT_PATH);
  const privateShadowRuntimePreflight = readJson(PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH);
  const privateShadowRuntimeReviewPacketContract = readJson(PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH);
  const privateShadowOperatorAccessContract = readJson(PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH);
  const privateShadowOrderIntentContract = readJson(PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH);
  const privateShadowIntentAuditEventContract = readJson(PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH);
  const privateReadOnlyProviderImplementationPreflight = readJson(
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewGates = [...REQUIRED_REVIEW_GATES];
  const implementationRules = [...REQUIRED_IMPLEMENTATION_RULES];
  const storageBoundaries = [...REQUIRED_STORAGE_BOUNDARIES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingReviewGates = missingValues(reviewGates, REQUIRED_REVIEW_GATES);
  const missingImplementationRules = missingValues(implementationRules, REQUIRED_IMPLEMENTATION_RULES);
  const missingStorageBoundaries = missingValues(storageBoundaries, REQUIRED_STORAGE_BOUNDARIES);
  const missingSchemaTables = missingValues(tableNames(storeSchemaDraft), REQUIRED_STORAGE_BOUNDARIES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    storeSchemaDraftReady:
      storeSchemaDraft.readiness?.readyForFutureMigrationReview === true &&
      storeSchemaDraft.readiness?.dbMigrationAllowed === false &&
      storeSchemaDraft.migrationState?.draftOnly === true &&
      storeSchemaDraft.migrationState?.ddlGenerated === false &&
      storeSchemaDraft.migrationState?.productionDbTouched === false &&
      missingSchemaTables.length === 0,
    privateShadowRuntimePreflightReady:
      privateShadowRuntimePreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview === true &&
      privateShadowRuntimePreflight.readiness?.privateShadowRuntimeImplementationAllowed === false &&
      privateShadowRuntimePreflight.readiness?.dbMigrationAllowed === false &&
      privateShadowRuntimePreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimePreflight.readiness?.orderSubmissionAllowed === false &&
      privateShadowRuntimePreflight.readiness?.runtimeRouteAllowed === false,
    privateShadowRuntimeReviewPacketContractReady:
      privateShadowRuntimeReviewPacketContract.readiness
        ?.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview === true &&
      privateShadowRuntimeReviewPacketContract.readiness?.privateShadowRuntimeReviewPacketImplementationAllowed ===
        false &&
      privateShadowRuntimeReviewPacketContract.readiness?.dbMigrationAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.orderSubmissionAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.runtimeRouteAllowed === false,
    privateShadowOperatorAccessContractReady:
      privateShadowOperatorAccessContract.readiness
        ?.readyForFuturePrivateShadowOperatorAccessImplementationReview === true &&
      privateShadowOperatorAccessContract.readiness?.privateShadowOperatorAccessImplementationAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.dbMigrationAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.providerCallsAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.orderSubmissionAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.runtimeRouteAllowed === false,
    privateShadowOrderIntentContractReady:
      privateShadowOrderIntentContract.readiness?.readyForFuturePrivateShadowOrderIntentImplementationReview === true &&
      privateShadowOrderIntentContract.readiness?.privateShadowOrderIntentImplementationAllowed === false &&
      privateShadowOrderIntentContract.readiness?.dbMigrationAllowed === false &&
      privateShadowOrderIntentContract.readiness?.providerCallsAllowed === false &&
      privateShadowOrderIntentContract.readiness?.orderSubmissionAllowed === false &&
      privateShadowOrderIntentContract.readiness?.runtimeRouteAllowed === false,
    privateShadowIntentAuditEventContractReady:
      privateShadowIntentAuditEventContract.readiness
        ?.readyForFuturePrivateShadowIntentAuditEventImplementationReview === true &&
      privateShadowIntentAuditEventContract.readiness?.privateShadowIntentAuditEventImplementationAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.dbMigrationAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.providerCallsAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.orderSubmissionAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.runtimeRouteAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderImplementationPreflight.readiness?.ownerPacketGateStillClosed === true &&
      privateReadOnlyProviderImplementationPreflight.readiness?.readyForFuturePrivateReadOnlyProviderImplementationReview ===
        false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.orderSubmissionAllowed === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    storageBoundariesReady: missingStorageBoundaries.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsPrivateDbStoragePreflight:
      architectureDoc.includes("Trading Private DB Storage Implementation Preflight") &&
      architectureDoc.includes("private_db_storage_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    dbStorageImplementationAllowedNow: false,
    dbMigrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFuturePrivateDbStorageImplementationReview = false;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3A",
    scope: "private_db_storage_implementation_preflight",
    sourceFiles: {
      storeSchemaDraft: STORE_SCHEMA_DRAFT_PATH,
      privateShadowRuntimePreflight: PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH,
      privateShadowRuntimeReviewPacketContract: PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH,
      privateShadowOperatorAccessContract: PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH,
      privateShadowOrderIntentContract: PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH,
      privateShadowIntentAuditEventContract: PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      dbStorageImplementationAllowedNow: false,
      ddlGeneratedNow: false,
      databaseConnectionAllowedNow: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateDbStorageImplementationBoundary: {
      scope: "private_db_storage_implementation_preflight",
      futureStorageServicePath: FUTURE_STORAGE_SERVICE_PATH,
      currentStepImplementsStorage: false,
      currentStepGeneratesDdl: false,
      currentStepConnectsDatabase: false,
      currentStepWritesDatabase: false,
      reviewGates,
      implementationRules,
      storageBoundaries,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start DB storage implementation review",
        "manual migration review must happen separately before DDL or production DB access",
        "storage implementation review must remain private-worker-only",
        "storage implementation review cannot create runtime routes, public UI, provider calls, or order paths",
        "DB storage success still does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingStorageBoundaries,
      missingSchemaTables,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      storeSchemaDraftStatus: storeSchemaDraft.readiness?.status,
      privateShadowRuntimePreflightStatus: privateShadowRuntimePreflight.readiness?.status,
      privateShadowRuntimeReviewPacketContractStatus: privateShadowRuntimeReviewPacketContract.readiness?.status,
      privateShadowOperatorAccessContractStatus: privateShadowOperatorAccessContract.readiness?.status,
      privateShadowOrderIntentContractStatus: privateShadowOrderIntentContract.readiness?.status,
      privateShadowIntentAuditEventContractStatus: privateShadowIntentAuditEventContract.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus:
        privateReadOnlyProviderImplementationPreflight.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_db_storage_review_blocked_pending_private_runtime_review",
      readyForFuturePrivateDbStorageImplementationReview,
      dbStorageImplementationAllowedNow: false,
      ddlGeneratedNow: false,
      databaseConnectionAllowedNow: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.storeSchemaDraftReady ? [] : ["store_schema_draft_not_ready"]),
        ...(checks.privateShadowRuntimePreflightReady ? [] : ["private_shadow_runtime_preflight_not_ready"]),
        ...(checks.privateShadowRuntimeReviewPacketContractReady
          ? []
          : ["private_shadow_runtime_review_packet_contract_not_ready"]),
        ...(checks.privateShadowOperatorAccessContractReady ? [] : ["private_shadow_operator_access_contract_not_ready"]),
        ...(checks.privateShadowOrderIntentContractReady ? [] : ["private_shadow_order_intent_contract_not_ready"]),
        ...(checks.privateShadowIntentAuditEventContractReady
          ? []
          : ["private_shadow_intent_audit_event_contract_not_ready"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_not_blocked"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingStorageBoundaries.map((boundary) => `missing_storage_boundary_${boundary}`),
        ...missingSchemaTables.map((table) => `missing_schema_table_${table}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsPrivateDbStoragePreflight
          ? []
          : ["architecture_doc_missing_private_db_storage_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "private_shadow_runtime_implementation_review_not_started",
        "manual_db_migration_review_not_started",
        "private_db_storage_implementation_review_not_started",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-db-storage-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-db-storage-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-private-db-storage-implementation-preflight] ok");
    console.log(`[generate-trading-private-db-storage-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-db-storage-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-private-db-storage-implementation-preflight] dbStorageImplementationAllowedNow=${parsed.readiness.dbStorageImplementationAllowedNow}`,
  );
}

main();

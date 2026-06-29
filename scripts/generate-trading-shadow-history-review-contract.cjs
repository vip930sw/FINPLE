const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_history_review_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const SHADOW_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_mode_contract.json");
const STORE_SCHEMA_PATH = path.join("data", "processed", "trading_lab_step116_store_schema_draft.json");
const DRY_RUN_REPLAY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_dry_run_replay_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-shadow-history-review-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_HISTORY_EVIDENCE = [
  "shadow_order_intent_log",
  "shadow_risk_event_log",
  "shadow_quote_and_fx_snapshot_hashes",
  "shadow_account_state_snapshot_hashes",
  "shadow_fill_simulation_comparison",
  "operator_review_notes",
  "blocked_intent_review",
  "dry_run_replay_summary",
];
const REQUIRED_REVIEW_ASSERTIONS = [
  "no_order_submission_attempted",
  "no_order_cancellation_attempted",
  "no_raw_provider_payload_persisted",
  "risk_gate_recomputed_for_each_intent",
  "blocked_intents_have_risk_events",
  "shadow_history_matches_dry_run_replay_window",
  "manual_operator_review_recorded",
  "live_guarded_remains_blocked",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "runtime_provider_call",
  "order_submission",
  "order_cancellation",
  "production_secret_usage",
  "raw_provider_response_persistence",
  "db_migration",
  "public_ui",
  "scenario_monthly_cache_write",
];
const REQUIRED_STORE_TABLES = ["trading_order_attempts", "trading_executions", "trading_risk_events"];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingShadowHistoryReviewService.js"),
  path.join("server", "src", "services", "trading", "shadowHistoryReview.js"),
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
  const storeSchema = readJson(STORE_SCHEMA_PATH);
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const historyEvidence = [...REQUIRED_HISTORY_EVIDENCE];
  const reviewAssertions = [...REQUIRED_REVIEW_ASSERTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const storeTableNames = (storeSchema.tables ?? []).map((table) => table.name);
  const missingHistoryEvidence = missingValues(historyEvidence, REQUIRED_HISTORY_EVIDENCE);
  const missingReviewAssertions = missingValues(reviewAssertions, REQUIRED_REVIEW_ASSERTIONS);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const missingStoreTables = missingValues(storeTableNames, REQUIRED_STORE_TABLES);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    policyStillBlocksRuntime:
      policy.defaults?.orderSubmissionAllowed === false &&
      policy.defaults?.providerCallsAllowed === false &&
      policy.defaults?.dbMigrationAllowed === false &&
      policy.defaults?.publicUiAllowed === false,
    shadowContractStillBlocksRuntime:
      shadowContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      shadowContract.readiness?.providerCallsAllowed === false &&
      shadowContract.readiness?.orderSubmissionAllowed === false,
    dryRunReplayContractReady:
      dryRunReplayContract.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplayContract.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplayContract.readiness?.orderSubmissionAllowed === false,
    historyEvidenceReady: missingHistoryEvidence.length === 0,
    reviewAssertionsReady: missingReviewAssertions.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    futureStoreTablesReady: missingStoreTables.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsShadowHistory:
      architectureDoc.includes("shadow history") && architectureDoc.includes("Trading Dry-Run Replay Contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    shadowHistoryReviewImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureShadowHistoryReviewImplementation =
    checks.policyStillBlocksRuntime &&
    checks.shadowContractStillBlocksRuntime &&
    checks.dryRunReplayContractReady &&
    checks.historyEvidenceReady &&
    checks.reviewAssertionsReady &&
    checks.forbiddenActionsReady &&
    checks.futureStoreTablesReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsShadowHistory &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1L",
    scope: "trading_shadow_history_review_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      storeSchemaDraft: STORE_SCHEMA_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      historyExistsNow: false,
      shadowHistoryReviewImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureShadowHistoryBoundary: {
      purpose: "review shadow order-intent history before live_guarded adapter implementation review",
      requiredHistoryEvidence: historyEvidence,
      requiredReviewAssertions: reviewAssertions,
      forbiddenActions,
      storageBoundary: {
        currentStepWritesDatabase: false,
        futureTablesForManualReview: REQUIRED_STORE_TABLES,
        rawProviderPayloadStorageAllowed: false,
      },
      promotionRules: [
        "shadow history review cannot start until read-only shadow runtime has separate approval",
        "shadow history review must compare blocked intents against risk events",
        "dry-run replay evidence must cover the same review window",
        "shadow history review success does not approve live order submission",
      ],
    },
    checks,
    evidence: {
      missingHistoryEvidence,
      missingReviewAssertions,
      missingForbiddenActions,
      missingStoreTables,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      dryRunReplayContractStatus: dryRunReplayContract.readiness?.status,
      storeSchemaStatus: storeSchema.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureShadowHistoryReviewImplementation
        ? "contract_ready_pending_shadow_history_fixture_implementation_review"
        : "blocked_before_shadow_history_review_contract",
      readyForFutureShadowHistoryReviewImplementation,
      shadowHistoryReviewImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.policyStillBlocksRuntime ? [] : ["policy_defaults_allow_runtime_too_early"]),
        ...(checks.shadowContractStillBlocksRuntime ? [] : ["shadow_contract_allows_runtime_too_early"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...missingHistoryEvidence.map((item) => `missing_history_evidence_${item}`),
        ...missingReviewAssertions.map((assertion) => `missing_review_assertion_${assertion}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...missingStoreTables.map((table) => `missing_future_table_${table}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsShadowHistory ? [] : ["architecture_doc_missing_shadow_history_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-shadow-history-review-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-shadow-history-review-contract.cjs`);
    }
    console.log("[generate-trading-shadow-history-review-contract] ok");
    console.log(`[generate-trading-shadow-history-review-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-shadow-history-review-contract] wrote contract");
  console.log(
    `[generate-trading-shadow-history-review-contract] readyForFutureShadowHistoryReviewImplementation=${parsed.readiness.readyForFutureShadowHistoryReviewImplementation}`,
  );
}

main();

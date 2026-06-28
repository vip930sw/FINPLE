const fs = require("node:fs");
const path = require("node:path");

const REVIEW_PATH = path.join("data", "processed", "trading_lab_step116_kis_order_adapter_design_review.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const SHADOW_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_mode_contract.json");
const STORE_SCHEMA_PATH = path.join("data", "processed", "trading_lab_step116_store_schema_draft.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const REVIEW_VERSION = "trading-lab-step116-kis-order-adapter-design-review-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const REQUIRED_DESIGN_SECTIONS = [
  "credential_boundary",
  "request_signing_boundary",
  "idempotency_and_replay",
  "kill_switch_before_submission",
  "risk_gate_before_submission",
  "manual_approval_before_live_guarded",
  "dry_run_replay_before_live_guarded",
  "provider_response_hashing",
  "fill_reconciliation",
  "rate_limit_and_auth_failure_handling",
  "emergency_live_blocked_fallback",
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
const REQUIRED_FUTURE_TABLES = ["trading_order_attempts", "trading_executions", "trading_risk_events"];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "kisTradingService.js"),
  path.join("server", "src", "services", "kisOrderService.js"),
  path.join("server", "src", "services", "tradingOrderService.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
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

function buildReview() {
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const shadowContract = readJson(SHADOW_CONTRACT_PATH);
  const storeSchema = readJson(STORE_SCHEMA_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const liveGuardedMode = (policy.modes ?? []).find((mode) => mode.mode === "live_guarded") ?? {};
  const designSections = [...REQUIRED_DESIGN_SECTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const tableNames = (storeSchema.tables ?? []).map((table) => table.name);
  const missingDesignSections = missingValues(designSections, REQUIRED_DESIGN_SECTIONS);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const missingFutureTables = missingValues(tableNames, REQUIRED_FUTURE_TABLES);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    designReviewOnly: true,
    liveGuardedPolicyReady:
      liveGuardedMode.mode === "live_guarded" &&
      liveGuardedMode.externalOrderCall === true &&
      liveGuardedMode.requiresManualApproval === true &&
      liveGuardedMode.requiresKillSwitchClear === true &&
      liveGuardedMode.requiresDryRunReplay === true,
    designSectionsReady: missingDesignSections.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    futureStoreTablesReady: missingFutureTables.length === 0,
    shadowContractStillBlocksRuntime:
      shadowContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      shadowContract.readiness?.providerCallsAllowed === false &&
      shadowContract.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocStillForbidsImplementation:
      architectureDoc.includes("no KIS provider calls") &&
      architectureDoc.includes("no order submission") &&
      architectureDoc.includes("KIS order adapter design review"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    adapterImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureOrderAdapterImplementationReview =
    checks.liveGuardedPolicyReady &&
    checks.designSectionsReady &&
    checks.forbiddenActionsReady &&
    checks.futureStoreTablesReady &&
    checks.shadowContractStillBlocksRuntime &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocStillForbidsImplementation &&
    checks.noRuntimeArtifacts;

  return stableJson({
    reviewVersion: REVIEW_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1F",
    scope: "kis_order_adapter_design_review_only",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      storeSchemaDraft: STORE_SCHEMA_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      designReview: REVIEW_PATH,
    },
    currentState: {
      designReviewOnly: true,
      adapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
      endpointSelectionStatus: "not_selected_pending_manual_order_permission_review",
    },
    futureAdapterBoundary: {
      mode: "live_guarded",
      purpose: "submit real orders only after shadow stability, dry-run replay, and manual approval",
      designSections,
      forbiddenActions,
      minimumPreSubmissionGates: [
        "manual_operator_approval",
        "kill_switch_clear",
        "risk_gate_clear",
        "shadow_history_reviewed",
        "dry_run_replay_passed",
        "separate_order_capable_credentials_present",
        "audit_logger_ready",
      ],
      secretBoundary: [
        "KIS_TRADING_APP_KEY",
        "KIS_TRADING_APP_SECRET",
        "KIS_TRADING_ACCOUNT_ID",
        "KIS_TRADING_BASE_URL",
      ],
      loggingRules: [
        "persist request and response hashes only",
        "never persist app secret, access token, account number, or full raw provider payload",
        "record blocked risk events before any future order submission",
      ],
    },
    checks,
    evidence: {
      liveGuardedMode,
      missingDesignSections,
      missingForbiddenActions,
      missingFutureTables,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      storeSchemaStatus: storeSchema.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureOrderAdapterImplementationReview
        ? "design_review_ready_pending_manual_order_permission"
        : "blocked_before_order_adapter_design_review",
      readyForFutureOrderAdapterImplementationReview,
      adapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.liveGuardedPolicyReady ? [] : ["live_guarded_policy_not_ready"]),
        ...missingDesignSections.map((section) => `missing_design_section_${section}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...missingFutureTables.map((table) => `missing_future_table_${table}`),
        ...(checks.shadowContractStillBlocksRuntime ? [] : ["shadow_contract_allows_runtime_too_early"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocStillForbidsImplementation ? [] : ["architecture_doc_missing_order_adapter_boundary"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const review = buildReview();

  if (checkOnly) {
    if (!fs.existsSync(REVIEW_PATH)) {
      fail(`${REVIEW_PATH} not found; run node scripts/generate-trading-kis-order-adapter-design-review.cjs`);
    }
    const current = fs.readFileSync(REVIEW_PATH, "utf8");
    if (current !== review) {
      fail(`${REVIEW_PATH} is out of date; run node scripts/generate-trading-kis-order-adapter-design-review.cjs`);
    }
    console.log("[generate-trading-kis-order-adapter-design-review] ok");
    console.log(`[generate-trading-kis-order-adapter-design-review] designReview=${REVIEW_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(REVIEW_PATH), { recursive: true });
  fs.writeFileSync(REVIEW_PATH, review);
  const parsed = JSON.parse(review);
  console.log("[generate-trading-kis-order-adapter-design-review] wrote design review");
  console.log(
    `[generate-trading-kis-order-adapter-design-review] readyForFutureOrderAdapterImplementationReview=${parsed.readiness.readyForFutureOrderAdapterImplementationReview}`,
  );
}

main();

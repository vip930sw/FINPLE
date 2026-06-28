const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_mode_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const STORE_SCHEMA_PATH = path.join("data", "processed", "trading_lab_step116_store_schema_draft.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-shadow-mode-contract-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const REQUIRED_READ_SCOPES = [
  "account_cash_balance",
  "account_positions",
  "orderable_cash",
  "current_quotes",
  "fx_rate",
  "market_session_state",
  "provider_rate_limit_state",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "order_submission",
  "order_cancellation",
  "position_mutation",
  "provider_raw_response_persistence",
  "public_frontend_secret_access",
  "public_user_signal_delivery",
  "scenario_monthly_cache_write",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "routes", "trading"),
  path.join("server", "src", "services", "tradingShadowReadOnlyService.js"),
  path.join("server", "src", "services", "kisTradingService.js"),
  path.join("server", "src", "services", "kisAccountService.js"),
  path.join("server", "src", "services", "kisOrderService.js"),
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
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const readScopes = [...REQUIRED_READ_SCOPES];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const missingReadScopes = missingValues(readScopes, REQUIRED_READ_SCOPES);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    readScopesReady: missingReadScopes.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    storeSchemaDraftReady:
      storeSchema.migrationState?.draftOnly === true &&
      storeSchema.readiness?.dbMigrationAllowed === false &&
      storeSchema.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsShadowApproval:
      architectureDoc.includes("KIS read-only approval") &&
      architectureDoc.includes("No order submission"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    readOnlyRuntimeIntegrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureReadOnlyIntegrationReview =
    checks.shadowModePolicyReady &&
    checks.readScopesReady &&
    checks.forbiddenActionsReady &&
    checks.storeSchemaDraftReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsShadowApproval &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1E",
    scope: "shadow_mode_read_only_integration_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      storeSchemaDraft: STORE_SCHEMA_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      manualReadOnlyApprovalRecorded: false,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyBoundary: {
      mode: "shadow",
      purpose: "read real account or market state and record intended orders without submitting them",
      approvalRequiredBeforeRuntime: true,
      allowedReadScopes: readScopes,
      forbiddenActions,
      requiredSecretBoundary: [
        "KIS_TRADING_APP_KEY",
        "KIS_TRADING_APP_SECRET",
        "KIS_TRADING_ACCOUNT_ID",
        "KIS_TRADING_BASE_URL",
      ],
      loggingRules: [
        "hash provider request and response bodies before persistence",
        "never log access tokens, app secrets, full account numbers, or raw provider responses",
        "record read-only approval evidence before enabling runtime reads",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingReadScopes,
      missingForbiddenActions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      storeSchemaStatus: storeSchema.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlyIntegrationReview
        ? "contract_ready_pending_read_only_approval"
        : "blocked_before_shadow_contract_review",
      readyForFutureReadOnlyIntegrationReview,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...missingReadScopes.map((scope) => `missing_read_scope_${scope}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.storeSchemaDraftReady ? [] : ["store_schema_draft_not_ready"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsShadowApproval ? [] : ["architecture_doc_missing_shadow_approval_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-shadow-mode-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-shadow-mode-contract.cjs`);
    }
    console.log("[generate-trading-shadow-mode-contract] ok");
    console.log(`[generate-trading-shadow-mode-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-shadow-mode-contract] wrote contract");
  console.log(
    `[generate-trading-shadow-mode-contract] readyForFutureReadOnlyIntegrationReview=${parsed.readiness.readyForFutureReadOnlyIntegrationReview}`,
  );
}

main();

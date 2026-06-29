const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_dry_run_replay_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const STORE_SCHEMA_PATH = path.join("data", "processed", "trading_lab_step116_store_schema_draft.json");
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

const CONTRACT_VERSION = "trading-lab-step116-dry-run-replay-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_REPLAY_INPUTS = [
  "order_intent_fixture",
  "risk_gate_fixture",
  "paper_ledger_start_snapshot",
  "paper_ledger_expected_snapshot",
  "market_session_fixture",
  "quote_and_fx_fixture",
  "expected_risk_events",
  "expected_blocked_actions",
];
const REQUIRED_REPLAY_ASSERTIONS = [
  "deterministic_replay_id",
  "risk_gate_recomputed_before_fill",
  "paper_fill_matches_expected_snapshot",
  "blocked_intents_record_risk_event",
  "no_provider_call_attempted",
  "no_order_submission_attempted",
  "no_database_write_required",
  "no_public_ui_required",
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
  path.join("server", "src", "services", "tradingDryRunReplayService.js"),
  path.join("server", "src", "services", "trading", "dryRunReplay.js"),
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
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const replayInputs = [...REQUIRED_REPLAY_INPUTS];
  const replayAssertions = [...REQUIRED_REPLAY_ASSERTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const storeTableNames = (storeSchema.tables ?? []).map((table) => table.name);
  const missingReplayInputs = missingValues(replayInputs, REQUIRED_REPLAY_INPUTS);
  const missingReplayAssertions = missingValues(replayAssertions, REQUIRED_REPLAY_ASSERTIONS);
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
    replayInputsReady: missingReplayInputs.length === 0,
    replayAssertionsReady: missingReplayAssertions.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    futureStoreTablesReady: missingStoreTables.length === 0,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.readyForRuntimeRoute === false &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false &&
      envRiskGateContract.checks?.riskGateStillDisablesOrderSubmission === true,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsDryRunReplay:
      architectureDoc.includes("dry-run replay") && architectureDoc.includes("Trading Environment Risk Gate Input Contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    dryRunReplayImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureDryRunReplayImplementationReview =
    checks.policyStillBlocksRuntime &&
    checks.replayInputsReady &&
    checks.replayAssertionsReady &&
    checks.forbiddenActionsReady &&
    checks.futureStoreTablesReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsDryRunReplay &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1K",
    scope: "trading_dry_run_replay_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      storeSchemaDraft: STORE_SCHEMA_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      fixtureOnly: true,
      dryRunReplayImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReplayBoundary: {
      purpose: "replay deterministic order-intent fixtures through the risk gate and paper ledger before live_guarded review",
      requiredReplayInputs: replayInputs,
      requiredReplayAssertions: replayAssertions,
      forbiddenActions,
      storageBoundary: {
        currentStepWritesDatabase: false,
        futureTablesForManualReview: REQUIRED_STORE_TABLES,
        rawProviderPayloadStorageAllowed: false,
      },
      promotionRules: [
        "recompute risk gate from fixtures before every replayed fill",
        "record blocked risk events before any future live_guarded adapter review",
        "prove replay determinism before shadow history can be considered reviewed",
        "do not treat dry-run replay success as order-submission approval",
      ],
    },
    checks,
    evidence: {
      missingReplayInputs,
      missingReplayAssertions,
      missingForbiddenActions,
      missingStoreTables,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      envRiskGateContractRiskReasons: envRiskGateContract.riskGateEvaluation?.reasons ?? [],
      storeSchemaStatus: storeSchema.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureDryRunReplayImplementationReview
        ? "contract_ready_pending_dry_run_fixture_implementation_review"
        : "blocked_before_dry_run_replay_contract_review",
      readyForFutureDryRunReplayImplementationReview,
      dryRunReplayImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.policyStillBlocksRuntime ? [] : ["policy_defaults_allow_runtime_too_early"]),
        ...missingReplayInputs.map((input) => `missing_replay_input_${input}`),
        ...missingReplayAssertions.map((assertion) => `missing_replay_assertion_${assertion}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...missingStoreTables.map((table) => `missing_future_table_${table}`),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsDryRunReplay ? [] : ["architecture_doc_missing_dry_run_replay_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-dry-run-replay-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-dry-run-replay-contract.cjs`);
    }
    console.log("[generate-trading-dry-run-replay-contract] ok");
    console.log(`[generate-trading-dry-run-replay-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-dry-run-replay-contract] wrote contract");
  console.log(
    `[generate-trading-dry-run-replay-contract] readyForFutureDryRunReplayImplementationReview=${parsed.readiness.readyForFutureDryRunReplayImplementationReview}`,
  );
}

main();

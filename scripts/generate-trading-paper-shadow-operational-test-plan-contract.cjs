const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_paper_shadow_operational_test_plan_contract.json",
);
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const TRADING_RULES_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json",
);
const DRY_RUN_REPLAY_PATH = path.join("data", "processed", "trading_lab_step116_dry_run_replay_contract.json");
const SHADOW_HISTORY_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
);
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
);
const AUDIT_LOGGER_READINESS_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-paper-shadow-operational-test-plan-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_TEST_PLAN_ITEMS = [
  "paper_ledger_replay_window",
  "shadow_intent_replay_window",
  "risk_gate_recompute_for_each_intent",
  "rules_review_reference",
  "dry_run_replay_reference",
  "shadow_history_review_reference",
  "audit_event_review",
  "blocked_intent_review",
  "quote_fx_snapshot_hash_review",
  "account_state_snapshot_hash_review",
  "operator_review_notes",
  "rollback_and_kill_switch_drill",
];
const REQUIRED_ASSERTIONS = [
  "test_plan_does_not_execute_runtime",
  "test_plan_does_not_call_provider",
  "test_plan_does_not_submit_orders",
  "test_plan_does_not_create_routes",
  "test_plan_does_not_create_public_ui",
  "test_plan_does_not_write_database",
  "test_plan_requires_private_shadow_runtime_review_first",
  "test_plan_success_cannot_approve_live_guarded",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "paperShadowOperationalTest.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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

function buildOperationalTestPlan() {
  return {
    scope: "paper_shadow_operational_test_plan",
    mayPlanOperationalTestNow: true,
    mayExecuteOperationalTestNow: false,
    mayCallProviderNow: false,
    maySubmitOrdersNow: false,
    mayWriteDatabaseNow: false,
    mayExposeDashboardNow: false,
    requiredTestPlanItems: REQUIRED_TEST_PLAN_ITEMS,
    requiredAssertions: REQUIRED_ASSERTIONS,
    plannedTestWindows: {
      minimumPaperReplayIntents: 20,
      minimumShadowReplayIntents: 20,
      minimumBlockedIntentCases: 5,
      minimumDistinctSymbols: 3,
      requireKrAndUsSessionCoverage: true,
      requireKillSwitchDrill: true,
    },
    promotionRules: [
      "paper shadow operational test planning cannot execute runtime code",
      "paper shadow operational test execution stays blocked until private shadow runtime review is recorded",
      "successful paper shadow testing cannot approve live_guarded order submission",
      "public dashboard/router work remains blocked until live_guarded review is complete",
    ],
  };
}

function buildContract() {
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const tradingRulesReview = readJson(TRADING_RULES_REVIEW_PATH);
  const dryRunReplay = readJson(DRY_RUN_REPLAY_PATH);
  const shadowHistoryReview = readJson(SHADOW_HISTORY_REVIEW_PATH);
  const privateShadowRuntimeImplementationPreflight = readJson(PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH);
  const auditLoggerReadiness = readJson(AUDIT_LOGGER_READINESS_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const testPlan = buildOperationalTestPlan();
  const missingTestPlanItems = missingValues(testPlan.requiredTestPlanItems, REQUIRED_TEST_PLAN_ITEMS);
  const missingAssertions = missingValues(testPlan.requiredAssertions, REQUIRED_ASSERTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    planOnly: true,
    launchPlanIncludesPaperShadowOperationalTest:
      launchReadinessPlan.readiness?.planReady === true &&
      launchReadinessPlan.launchReadinessPlan?.phases?.some((phase) => phase.id === "paper_shadow_operational_test") ===
        true,
    tradingRulesReviewReady:
      tradingRulesReview.readiness?.readyForFutureTradingRulesReview === true &&
      tradingRulesReview.readiness?.rulesRuntimeImplementationAllowed === false &&
      tradingRulesReview.readiness?.orderSubmissionAllowed === false,
    dryRunReplayContractReady:
      dryRunReplay.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplay.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplay.readiness?.orderSubmissionAllowed === false,
    shadowHistoryReviewContractReady:
      shadowHistoryReview.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReview.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReview.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimeStillBlocked:
      privateShadowRuntimeImplementationPreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview ===
        false &&
      privateShadowRuntimeImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.orderSubmissionAllowed === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    auditLoggerReadinessReady:
      auditLoggerReadiness.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadiness.readiness?.orderSubmissionAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    testPlanItemsReady: missingTestPlanItems.length === 0,
    assertionsReady: missingAssertions.length === 0,
    architectureDocMentionsPaperShadowOperationalTest:
      architectureDoc.includes("Trading Paper Shadow Operational Test Plan") &&
      architectureDoc.includes("paper_shadow_operational_test_plan"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFuturePaperShadowOperationalTestPlan =
    checks.launchPlanIncludesPaperShadowOperationalTest &&
    checks.tradingRulesReviewReady &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.privateShadowRuntimeStillBlocked &&
    checks.auditLoggerReadinessReady &&
    checks.envRiskGateStillFailClosed &&
    checks.testPlanItemsReady &&
    checks.assertionsReady &&
    checks.architectureDocMentionsPaperShadowOperationalTest &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5C",
    scope: "paper_shadow_operational_test_plan",
    sourceFiles: {
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      tradingRulesAndRiskLimitsReview: TRADING_RULES_REVIEW_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_PATH,
      privateShadowRuntimeImplementationPreflight: PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
      auditLoggerReadiness: AUDIT_LOGGER_READINESS_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      planOnly: true,
      operationalTestExecutionAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    paperShadowOperationalTestPlan: testPlan,
    checks,
    evidence: {
      missingTestPlanItems,
      missingAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      launchPlanStatus: launchReadinessPlan.readiness?.status ?? null,
      tradingRulesReviewStatus: tradingRulesReview.readiness?.status ?? null,
      dryRunReplayStatus: dryRunReplay.readiness?.status ?? null,
      shadowHistoryReviewStatus: shadowHistoryReview.readiness?.status ?? null,
      privateShadowRuntimeImplementationStatus:
        privateShadowRuntimeImplementationPreflight.readiness?.status ?? null,
      auditLoggerReadinessStatus: auditLoggerReadiness.readiness?.status ?? null,
      envRiskGateStatus: envRiskGateContract.readiness?.status ?? null,
    },
    readiness: {
      status: readyForFuturePaperShadowOperationalTestPlan
        ? "paper_shadow_operational_test_plan_ready_execution_blocked"
        : "blocked_before_paper_shadow_operational_test_plan",
      readyForFuturePaperShadowOperationalTestPlan,
      operationalTestExecutionAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.launchPlanIncludesPaperShadowOperationalTest ? [] : ["launch_plan_missing_paper_shadow_test"]),
        ...(checks.tradingRulesReviewReady ? [] : ["trading_rules_review_not_ready"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...(checks.privateShadowRuntimeStillBlocked ? [] : ["private_shadow_runtime_not_blocked"]),
        ...(checks.auditLoggerReadinessReady ? [] : ["audit_logger_readiness_not_ready"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_not_fail_closed"]),
        ...(checks.testPlanItemsReady ? [] : ["test_plan_items_missing"]),
        ...(checks.assertionsReady ? [] : ["test_plan_assertions_missing"]),
        ...(checks.architectureDocMentionsPaperShadowOperationalTest
          ? []
          : ["architecture_doc_missing_paper_shadow_operational_test_plan"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
        "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
        "paper_shadow_operational_test_execution_blocked_pending_private_runtime_review",
        "live_guarded_manual_test_blocked_pending_manual_permission_and_risk_clearance",
        "public_homepage_router_blocked_until_live_guarded_review_complete",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-paper-shadow-operational-test-plan-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-paper-shadow-operational-test-plan-contract.cjs`);
    }
    console.log("[generate-trading-paper-shadow-operational-test-plan-contract] ok");
    console.log(`[generate-trading-paper-shadow-operational-test-plan-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-paper-shadow-operational-test-plan-contract] wrote contract");
  console.log(
    `[generate-trading-paper-shadow-operational-test-plan-contract] readyForFuturePaperShadowOperationalTestPlan=${parsed.readiness.readyForFuturePaperShadowOperationalTestPlan}`,
  );
}

main();

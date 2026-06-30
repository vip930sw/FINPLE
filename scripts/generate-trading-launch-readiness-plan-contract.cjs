const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const READ_ONLY_CALL_AUTHORIZATION_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
);
const PRIVATE_RUNTIME_ROUTE_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_runtime_route_implementation_preflight.json",
);
const PRIVATE_OPERATOR_ACCESS_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
);
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
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

const CONTRACT_VERSION = "trading-lab-step116-launch-readiness-plan-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_PHASE_IDS = [
  "contract_stack_ready",
  "owner_read_only_evidence_import",
  "read_only_provider_private_review",
  "private_shadow_runtime_review",
  "private_operator_dashboard_review",
  "trading_rules_and_risk_limits_review",
  "paper_shadow_operational_test",
  "live_guarded_manual_test",
  "public_dashboard_and_homepage_router_review",
];
const REQUIRED_PUBLIC_ROLLOUT_BLOCKERS = [
  "no_public_route_before_private_runtime_review",
  "no_public_dashboard_before_operator_auth_review",
  "no_homepage_router_before_live_guarded_review",
  "no_public_copy_implying_live_trading_before_order_adapter_review",
  "no_user_order_controls_before_manual_permission_review",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "read_only_provider_call_authorization_review_result.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "privateOperatorAccess.js"),
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

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildPhases() {
  return [
    {
      id: "contract_stack_ready",
      title: "Contract and validator stack ready",
      currentStatus: "complete",
      allowedWork: ["contract maintenance", "local validators", "redacted planning artifacts"],
      blockedWork: ["provider calls", "orders", "runtime routes", "public UI", "DB migrations"],
    },
    {
      id: "owner_read_only_evidence_import",
      title: "Owner read-only evidence import",
      currentStatus: "blocked_pending_owner_redacted_packet",
      allowedWork: ["owner-assisted redacted packet preparation", "hash-only evidence validation"],
      blockedWork: ["raw secrets", "private packet auto-creation", "provider calls", "public UI"],
    },
    {
      id: "read_only_provider_private_review",
      title: "Read-only provider private review",
      currentStatus: "blocked_pending_owner_evidence_and_provider_review",
      allowedWork: ["private review of read-only provider implementation boundary"],
      blockedWork: ["KIS calls", "token refresh", "request dispatch", "order submission"],
    },
    {
      id: "private_shadow_runtime_review",
      title: "Private shadow runtime review",
      currentStatus: "blocked_pending_owner_packet_and_operator_access",
      allowedWork: ["private runtime design review", "shadow intent and audit-event review"],
      blockedWork: ["runtime service", "runtime routes", "DB writes", "orders"],
    },
    {
      id: "private_operator_dashboard_review",
      title: "Private operator dashboard review",
      currentStatus: "blocked_pending_private_runtime_and_operator_auth_review",
      allowedWork: ["private dashboard requirements", "operator auth and audit policy review"],
      blockedWork: ["public dashboard", "homepage route", "user order controls"],
    },
    {
      id: "trading_rules_and_risk_limits_review",
      title: "Trading rules and risk limits review",
      currentStatus: "blocked_pending_private_shadow_runtime_review",
      allowedWork: ["symbol allowlist review", "cash cap review", "turnover cap review", "kill-switch policy review"],
      blockedWork: ["live order adapter", "order submission", "public trading controls"],
    },
    {
      id: "paper_shadow_operational_test",
      title: "Paper and shadow operational test",
      currentStatus: "blocked_pending_private_runtime_and_rules_review",
      allowedWork: ["paper ledger replay", "shadow intent replay", "audit-log review"],
      blockedWork: ["live order submission", "public UI rollout"],
    },
    {
      id: "live_guarded_manual_test",
      title: "Live-guarded manual test",
      currentStatus: "blocked_pending_manual_permission_kill_switch_and_risk_clearance",
      allowedWork: ["tiny manual test plan review after all permissions are imported"],
      blockedWork: ["automated live trading", "unbounded order sizing", "public trading controls"],
    },
    {
      id: "public_dashboard_and_homepage_router_review",
      title: "Public dashboard and homepage router review",
      currentStatus: "blocked_until_live_guarded_review_is_complete",
      allowedWork: ["future route plan", "future dashboard information architecture"],
      blockedWork: ["homepage router changes now", "public UI now", "in-app trading controls now"],
    },
  ];
}

function buildContract() {
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const callAuthorizationReviewResult = readJson(READ_ONLY_CALL_AUTHORIZATION_REVIEW_RESULT_PATH);
  const privateRuntimeRoutePreflight = readJson(PRIVATE_RUNTIME_ROUTE_PREFLIGHT_PATH);
  const privateOperatorAccessPreflight = readJson(PRIVATE_OPERATOR_ACCESS_PREFLIGHT_PATH);
  const privateShadowRuntimeImplementationPreflight = readJson(PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const phases = buildPhases();
  const missingPhaseIds = REQUIRED_PHASE_IDS.filter((phaseId) => !phases.some((phase) => phase.id === phaseId));
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    planOnly: true,
    progressSummaryFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.readyForPrivateShadowRuntime === false &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.runtimeRouteAllowed === false &&
      progressSummary.readiness?.publicUiAllowed === false,
    callAuthorizationReviewResultRecorded:
      callAuthorizationReviewResult.readiness?.readyForFutureReadOnlyProviderCallAuthorizationReviewResult === true &&
      callAuthorizationReviewResult.readiness?.providerCallsAllowed === false &&
      callAuthorizationReviewResult.readiness?.orderSubmissionAllowed === false,
    privateRuntimeRouteStillBlocked:
      privateRuntimeRoutePreflight.readiness?.readyForFuturePrivateRuntimeRouteImplementationReview === false &&
      privateRuntimeRoutePreflight.readiness?.runtimeRouteAllowed === false &&
      privateRuntimeRoutePreflight.readiness?.publicUiAllowed === false,
    privateOperatorAccessStillBlocked:
      privateOperatorAccessPreflight.readiness?.readyForFuturePrivateOperatorAccessImplementationReview === false &&
      privateOperatorAccessPreflight.readiness?.publicUiAllowed === false &&
      privateOperatorAccessPreflight.readiness?.runtimeRouteAllowed === false,
    privateShadowRuntimeStillBlocked:
      privateShadowRuntimeImplementationPreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.orderSubmissionAllowed === false,
    liveGuardedAdapterStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.liveTradingAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    phasesComplete: missingPhaseIds.length === 0,
    architectureDocMentionsLaunchReadiness:
      architectureDoc.includes("Trading Launch Readiness Plan") &&
      architectureDoc.includes("public_dashboard_and_homepage_router_review"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const planReady =
    checks.progressSummaryFailClosed &&
    checks.callAuthorizationReviewResultRecorded &&
    checks.privateRuntimeRouteStillBlocked &&
    checks.privateOperatorAccessStillBlocked &&
    checks.privateShadowRuntimeStillBlocked &&
    checks.liveGuardedAdapterStillBlocked &&
    checks.envRiskGateStillFailClosed &&
    checks.phasesComplete &&
    checks.architectureDocMentionsLaunchReadiness &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5A",
    scope: "trading_launch_readiness_plan",
    sourceFiles: {
      progressSummary: PROGRESS_SUMMARY_PATH,
      readOnlyProviderCallAuthorizationReviewResult: READ_ONLY_CALL_AUTHORIZATION_REVIEW_RESULT_PATH,
      privateRuntimeRouteImplementationPreflight: PRIVATE_RUNTIME_ROUTE_PREFLIGHT_PATH,
      privateOperatorAccessImplementationPreflight: PRIVATE_OPERATOR_ACCESS_PREFLIGHT_PATH,
      privateShadowRuntimeImplementationPreflight: PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      planOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    launchReadinessPlan: {
      currentPhase: "contract_stack_ready",
      nextOwnerFacingGate: "owner_read_only_evidence_import",
      phases,
      publicRolloutBlockers: REQUIRED_PUBLIC_ROLLOUT_BLOCKERS,
      homepageRouterPolicy: {
        mayPlanFutureHomepageRouter: true,
        mayChangeHomepageRouterNow: false,
        mayExposePublicTradingDashboardNow: false,
        mayExposePrivateOperatorDashboardNow: false,
        publicDashboardEarliestPhase: "public_dashboard_and_homepage_router_review",
      },
      tradingRulesPolicy: {
        mayPlanRulesNow: true,
        mayApplyRuntimeRulesNow: false,
        requiredRuleReviews: [
          "symbol_allowlist",
          "max_notional_per_order",
          "max_daily_turnover",
          "cash_reserve_floor",
          "kill_switch_clearance",
          "manual_operator_approval",
          "risk_gate_clearance",
        ],
      },
    },
    checks,
    evidence: {
      missingPhaseIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      progressSummaryStatus: progressSummary.readiness?.status ?? null,
      remainingTradingGates: progressSummary.readiness?.remainingTradingGates ?? [],
      callAuthorizationReviewStatus: callAuthorizationReviewResult.readiness?.status ?? null,
      privateRuntimeRouteStatus: privateRuntimeRoutePreflight.readiness?.status ?? null,
      privateOperatorAccessStatus: privateOperatorAccessPreflight.readiness?.status ?? null,
      privateShadowRuntimeImplementationStatus: privateShadowRuntimeImplementationPreflight.readiness?.status ?? null,
      liveGuardedOrderAdapterPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status ?? null,
    },
    readiness: {
      status: planReady
        ? "launch_readiness_plan_ready_trading_execution_still_blocked"
        : "launch_readiness_plan_blocked",
      planReady,
      estimatedExecutionProgressPercent: 12,
      contractPlanningProgressPercent: 100,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.progressSummaryFailClosed ? [] : ["progress_summary_not_fail_closed"]),
        ...(checks.callAuthorizationReviewResultRecorded ? [] : ["call_authorization_review_result_not_recorded"]),
        ...(checks.privateRuntimeRouteStillBlocked ? [] : ["private_runtime_route_not_blocked"]),
        ...(checks.privateOperatorAccessStillBlocked ? [] : ["private_operator_access_not_blocked"]),
        ...(checks.privateShadowRuntimeStillBlocked ? [] : ["private_shadow_runtime_not_blocked"]),
        ...(checks.liveGuardedAdapterStillBlocked ? [] : ["live_guarded_adapter_not_blocked"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_not_fail_closed"]),
        ...(checks.phasesComplete ? [] : ["launch_phases_missing"]),
        ...(checks.architectureDocMentionsLaunchReadiness ? [] : ["architecture_doc_missing_launch_readiness_plan"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
        "read_only_provider_call_authorization_review_result_not_owner_supplied",
        "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
        "private_operator_dashboard_review_blocked_pending_private_runtime_review",
        "trading_rules_review_blocked_pending_private_runtime_review",
        "paper_shadow_operational_test_blocked_pending_private_runtime_review",
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-launch-readiness-plan-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-launch-readiness-plan-contract.cjs`);
    }
    console.log("[generate-trading-launch-readiness-plan-contract] ok");
    console.log(`[generate-trading-launch-readiness-plan-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-launch-readiness-plan-contract] wrote contract");
  console.log(`[generate-trading-launch-readiness-plan-contract] planReady=${parsed.readiness.planReady}`);
}

main();

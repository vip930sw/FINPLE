const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_public_dashboard_router_review_plan_contract.json",
);
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const LIVE_GUARDED_MANUAL_TEST_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_manual_test_plan_contract.json",
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
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-public-dashboard-router-review-plan-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_REVIEW_PLAN_ITEMS = [
  "public_information_architecture_only",
  "private_operator_dashboard_boundary_reference",
  "homepage_router_change_review_reference",
  "no_public_order_controls",
  "no_live_trading_claims",
  "no_account_or_operator_identifiers",
  "risk_status_summary_copy_review",
  "paper_shadow_status_summary_copy_review",
  "live_guarded_manual_test_status_reference",
  "support_and_revocation_notice_copy_review",
  "post_live_guarded_review_dependency",
  "rollback_and_feature_flag_plan_reference",
];
const REQUIRED_ASSERTIONS = [
  "router_plan_does_not_change_homepage_route_now",
  "router_plan_does_not_create_public_dashboard_now",
  "router_plan_does_not_create_private_operator_dashboard_now",
  "router_plan_does_not_create_runtime_route_now",
  "router_plan_does_not_call_kis_now",
  "router_plan_does_not_submit_orders_now",
  "router_plan_does_not_write_database_now",
  "router_plan_does_not_expose_order_controls_now",
  "router_plan_success_cannot_approve_live_trading",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("src", "pages", "TradingDashboard.jsx"),
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

function buildReviewPlan() {
  return {
    scope: "public_dashboard_and_homepage_router_review_plan",
    mayPlanFuturePublicDashboardNow: true,
    mayChangeHomepageRouterNow: false,
    mayCreatePublicDashboardNow: false,
    mayCreatePrivateOperatorDashboardNow: false,
    mayCreateRuntimeRouteNow: false,
    mayExposeOrderControlsNow: false,
    requiredReviewPlanItems: REQUIRED_REVIEW_PLAN_ITEMS,
    requiredAssertions: REQUIRED_ASSERTIONS,
    futureInformationArchitectureBoundary: {
      audience: "public_finple_users_after_separate_live_guarded_review",
      publicDashboardEarliestPhase: "public_dashboard_and_homepage_router_review",
      allowedFutureContentKinds: [
        "mode_status_summary",
        "paper_shadow_status_summary",
        "risk_and_kill_switch_status_copy",
        "manual_test_review_status_copy",
        "support_and_revocation_notice",
      ],
      forbiddenFutureContentKinds: [
        "order_entry_controls",
        "raw_account_identifiers",
        "raw_operator_identifiers",
        "raw_provider_payloads",
        "execution_ids",
        "fill_payloads",
        "live_trading_profit_claims",
      ],
    },
    promotionRules: [
      "this review plan does not change homepage routing",
      "public dashboard work remains blocked until live-guarded review is separately complete",
      "private operator dashboard work remains blocked until private runtime and operator access reviews are complete",
      "public copy cannot imply live trading availability or order submission readiness",
    ],
  };
}

function buildContract() {
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const liveGuardedManualTestPlan = readJson(LIVE_GUARDED_MANUAL_TEST_PLAN_PATH);
  const privateRuntimeRoutePreflight = readJson(PRIVATE_RUNTIME_ROUTE_PREFLIGHT_PATH);
  const privateOperatorAccessPreflight = readJson(PRIVATE_OPERATOR_ACCESS_PREFLIGHT_PATH);
  const privateShadowRuntimePreflight = readJson(PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewPlan = buildReviewPlan();
  const missingReviewPlanItems = missingValues(reviewPlan.requiredReviewPlanItems, REQUIRED_REVIEW_PLAN_ITEMS);
  const missingAssertions = missingValues(reviewPlan.requiredAssertions, REQUIRED_ASSERTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    planOnly: true,
    launchPlanIncludesPublicDashboardRouterReview:
      launchReadinessPlan.readiness?.planReady === true &&
      launchReadinessPlan.launchReadinessPlan?.phases?.some(
        (phase) => phase.id === "public_dashboard_and_homepage_router_review",
      ) === true &&
      launchReadinessPlan.launchReadinessPlan?.homepageRouterPolicy?.mayChangeHomepageRouterNow === false,
    progressSummaryFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.runtimeRouteAllowed === false &&
      progressSummary.readiness?.publicUiAllowed === false,
    liveGuardedManualTestPlanStillBlocked:
      liveGuardedManualTestPlan.readiness?.readyForFutureLiveGuardedManualTestPlan === true &&
      liveGuardedManualTestPlan.readiness?.manualTestExecutionAllowedNow === false &&
      liveGuardedManualTestPlan.readiness?.orderSubmissionAllowed === false &&
      liveGuardedManualTestPlan.readiness?.publicUiAllowed === false,
    privateRuntimeRouteStillBlocked:
      privateRuntimeRoutePreflight.readiness?.readyForFuturePrivateRuntimeRouteImplementationReview === false &&
      privateRuntimeRoutePreflight.readiness?.runtimeRouteImplementationAllowedNow === false &&
      privateRuntimeRoutePreflight.readiness?.runtimeRouteAllowed === false &&
      privateRuntimeRoutePreflight.readiness?.publicUiAllowed === false,
    privateOperatorAccessStillBlocked:
      privateOperatorAccessPreflight.readiness?.readyForFuturePrivateOperatorAccessImplementationReview === false &&
      privateOperatorAccessPreflight.readiness?.operatorAccessImplementationAllowedNow === false &&
      privateOperatorAccessPreflight.readiness?.runtimeRouteAllowed === false &&
      privateOperatorAccessPreflight.readiness?.publicUiAllowed === false,
    privateShadowRuntimeStillBlocked:
      privateShadowRuntimePreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview === false &&
      privateShadowRuntimePreflight.readiness?.privateShadowRuntimeImplementationAllowedNow === false &&
      privateShadowRuntimePreflight.readiness?.runtimeRouteAllowed === false &&
      privateShadowRuntimePreflight.readiness?.publicUiAllowed === false,
    liveGuardedOrderAdapterStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.publicUiAllowed === false,
    reviewPlanItemsReady: missingReviewPlanItems.length === 0,
    assertionsReady: missingAssertions.length === 0,
    architectureDocMentionsPublicDashboardRouterReviewPlan:
      architectureDoc.includes("Trading Public Dashboard And Homepage Router Review Plan") &&
      architectureDoc.includes("public_dashboard_and_homepage_router_review_plan"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    homepageRouterChangeAllowedNow: false,
    publicDashboardAllowedNow: false,
    privateOperatorDashboardAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFuturePublicDashboardRouterReviewPlan =
    checks.launchPlanIncludesPublicDashboardRouterReview &&
    checks.progressSummaryFailClosed &&
    checks.liveGuardedManualTestPlanStillBlocked &&
    checks.privateRuntimeRouteStillBlocked &&
    checks.privateOperatorAccessStillBlocked &&
    checks.privateShadowRuntimeStillBlocked &&
    checks.liveGuardedOrderAdapterStillBlocked &&
    checks.reviewPlanItemsReady &&
    checks.assertionsReady &&
    checks.architectureDocMentionsPublicDashboardRouterReviewPlan &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5E",
    scope: "public_dashboard_and_homepage_router_review_plan",
    sourceFiles: {
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      liveGuardedManualTestPlan: LIVE_GUARDED_MANUAL_TEST_PLAN_PATH,
      privateRuntimeRouteImplementationPreflight: PRIVATE_RUNTIME_ROUTE_PREFLIGHT_PATH,
      privateOperatorAccessImplementationPreflight: PRIVATE_OPERATOR_ACCESS_PREFLIGHT_PATH,
      privateShadowRuntimeImplementationPreflight: PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      planOnly: true,
      homepageRouterChangeAllowedNow: false,
      publicDashboardAllowedNow: false,
      privateOperatorDashboardAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    publicDashboardAndHomepageRouterReviewPlan: reviewPlan,
    checks,
    evidence: {
      missingReviewPlanItems,
      missingAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      launchPlanStatus: launchReadinessPlan.readiness?.status ?? null,
      progressSummaryStatus: progressSummary.readiness?.status ?? null,
      liveGuardedManualTestPlanStatus: liveGuardedManualTestPlan.readiness?.status ?? null,
      privateRuntimeRouteStatus: privateRuntimeRoutePreflight.readiness?.status ?? null,
      privateOperatorAccessStatus: privateOperatorAccessPreflight.readiness?.status ?? null,
      privateShadowRuntimeStatus: privateShadowRuntimePreflight.readiness?.status ?? null,
      liveGuardedOrderAdapterPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status ?? null,
    },
    readiness: {
      status: readyForFuturePublicDashboardRouterReviewPlan
        ? "public_dashboard_router_review_plan_ready_public_runtime_blocked"
        : "blocked_before_public_dashboard_router_review_plan",
      readyForFuturePublicDashboardRouterReviewPlan,
      homepageRouterChangeAllowedNow: false,
      publicDashboardAllowedNow: false,
      privateOperatorDashboardAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.launchPlanIncludesPublicDashboardRouterReview
          ? []
          : ["launch_plan_missing_public_dashboard_router_review"]),
        ...(checks.progressSummaryFailClosed ? [] : ["progress_summary_not_fail_closed"]),
        ...(checks.liveGuardedManualTestPlanStillBlocked ? [] : ["live_guarded_manual_test_plan_not_blocked"]),
        ...(checks.privateRuntimeRouteStillBlocked ? [] : ["private_runtime_route_not_blocked"]),
        ...(checks.privateOperatorAccessStillBlocked ? [] : ["private_operator_access_not_blocked"]),
        ...(checks.privateShadowRuntimeStillBlocked ? [] : ["private_shadow_runtime_not_blocked"]),
        ...(checks.liveGuardedOrderAdapterStillBlocked ? [] : ["live_guarded_order_adapter_not_blocked"]),
        ...(checks.reviewPlanItemsReady ? [] : ["public_dashboard_router_review_plan_items_missing"]),
        ...(checks.assertionsReady ? [] : ["public_dashboard_router_review_assertions_missing"]),
        ...(checks.architectureDocMentionsPublicDashboardRouterReviewPlan
          ? []
          : ["architecture_doc_missing_public_dashboard_router_review_plan"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "live_guarded_manual_test_execution_blocked_pending_manual_permission_and_operator_clearance",
        "private_operator_dashboard_review_blocked_pending_private_runtime_review",
        "public_dashboard_router_review_blocked_until_live_guarded_review_complete",
        "homepage_router_change_blocked_until_public_dashboard_review",
        "public_order_controls_blocked_until_separate_live_trading_approval",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-public-dashboard-router-review-plan-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-public-dashboard-router-review-plan-contract.cjs`,
      );
    }
    console.log("[generate-trading-public-dashboard-router-review-plan-contract] ok");
    console.log(`[generate-trading-public-dashboard-router-review-plan-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-public-dashboard-router-review-plan-contract] wrote contract");
  console.log(
    `[generate-trading-public-dashboard-router-review-plan-contract] readyForFuturePublicDashboardRouterReviewPlan=${parsed.readiness.readyForFuturePublicDashboardRouterReviewPlan}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_manual_test_plan_contract.json",
);
const PAPER_SHADOW_OPERATIONAL_TEST_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_paper_shadow_operational_test_plan_contract.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const MANUAL_ORDER_PERMISSION_RECEIPT_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
);
const KILL_SWITCH_CLEARANCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
);
const RISK_GATE_CLEARANCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const ORDER_CREDENTIAL_BOUNDARY_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_order_credential_boundary_contract.json",
);
const MANUAL_OPERATOR_APPROVAL_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_operator_approval_contract.json",
);
const AUDIT_LOGGER_READINESS_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-live-guarded-manual-test-plan-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_TEST_PLAN_ITEMS = [
  "single_intent_test_plan",
  "tiny_notional_cap",
  "manual_operator_approval_reference",
  "manual_order_permission_receipt_review_reference",
  "kill_switch_clearance_reference",
  "risk_gate_clearance_reference",
  "paper_shadow_operational_test_reference",
  "order_adapter_preflight_reference",
  "separate_order_credential_boundary_reference",
  "audit_logger_reference",
  "rollback_cancel_not_allowed_in_current_step",
  "post_test_review_required",
];
const REQUIRED_ASSERTIONS = [
  "manual_test_plan_does_not_submit_live_order_now",
  "manual_test_plan_does_not_call_kis_now",
  "manual_test_plan_does_not_clear_kill_switch",
  "manual_test_plan_does_not_clear_risk_gate",
  "manual_test_plan_does_not_import_permission_packet",
  "manual_test_plan_does_not_implement_order_adapter",
  "manual_test_plan_does_not_create_runtime_route",
  "manual_test_plan_does_not_create_public_ui",
  "manual_test_success_cannot_enable_automated_trading",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "liveGuardedManualTest.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
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

function buildManualTestPlan() {
  return {
    scope: "live_guarded_manual_test_plan",
    mayPlanManualTestNow: true,
    mayExecuteManualTestNow: false,
    mayCallProviderNow: false,
    maySubmitOrdersNow: false,
    mayWriteDatabaseNow: false,
    mayExposeDashboardNow: false,
    requiredTestPlanItems: REQUIRED_TEST_PLAN_ITEMS,
    requiredAssertions: REQUIRED_ASSERTIONS,
    futureManualTestEnvelope: {
      mode: "live_guarded",
      maximumIntentCount: 1,
      notionalCapPolicy: "tiny_notional_cap_must_be_owner_approved_later",
      requiresExplicitPerOrderManualApproval: true,
      requiresPermissionReceiptReviewResult: true,
      requiresKillSwitchClearance: true,
      requiresRiskGateClearance: true,
      requiresPaperShadowOperationalReview: true,
      requiresOrderAdapterImplementationReview: true,
      requiresPostTestReview: true,
    },
    promotionRules: [
      "live-guarded manual test planning cannot execute runtime code",
      "future execution requires manual permission, kill-switch, risk-gate, order adapter, and private runtime reviews",
      "a successful single manual test cannot approve automated trading",
      "public dashboard/router work remains blocked until a separate live-guarded review is complete",
    ],
  };
}

function buildContract() {
  const paperShadowOperationalTestPlan = readJson(PAPER_SHADOW_OPERATIONAL_TEST_PLAN_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const manualOrderPermissionReceiptReviewResult = readJson(MANUAL_ORDER_PERMISSION_RECEIPT_REVIEW_RESULT_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_PATH);
  const orderCredentialBoundary = readJson(ORDER_CREDENTIAL_BOUNDARY_PATH);
  const manualOperatorApproval = readJson(MANUAL_OPERATOR_APPROVAL_PATH);
  const auditLoggerReadiness = readJson(AUDIT_LOGGER_READINESS_PATH);
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const testPlan = buildManualTestPlan();
  const missingTestPlanItems = missingValues(testPlan.requiredTestPlanItems, REQUIRED_TEST_PLAN_ITEMS);
  const missingAssertions = missingValues(testPlan.requiredAssertions, REQUIRED_ASSERTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    planOnly: true,
    paperShadowOperationalTestPlanReady:
      paperShadowOperationalTestPlan.readiness?.readyForFuturePaperShadowOperationalTestPlan === true &&
      paperShadowOperationalTestPlan.readiness?.operationalTestExecutionAllowedNow === false &&
      paperShadowOperationalTestPlan.readiness?.orderSubmissionAllowed === false,
    liveGuardedOrderAdapterPreflightStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    manualOrderPermissionPreflightReady:
      manualOrderPermissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false,
    manualOrderPermissionReceiptReviewReady:
      manualOrderPermissionReceiptReviewResult.readiness
        ?.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult === true &&
      manualOrderPermissionReceiptReviewResult.readiness?.permissionPacketImportedNow === false &&
      manualOrderPermissionReceiptReviewResult.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearance.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearance.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearance.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearance.readiness?.orderSubmissionAllowed === false,
    orderCredentialBoundaryReady:
      orderCredentialBoundary.readiness?.readyForFutureOrderCredentialImplementationReview === true &&
      orderCredentialBoundary.readiness?.orderSubmissionAllowed === false,
    manualOperatorApprovalReady:
      manualOperatorApproval.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      manualOperatorApproval.readiness?.orderSubmissionAllowed === false,
    auditLoggerReadinessReady:
      auditLoggerReadiness.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadiness.readiness?.orderSubmissionAllowed === false,
    launchPlanIncludesLiveGuardedManualTest:
      launchReadinessPlan.readiness?.planReady === true &&
      launchReadinessPlan.launchReadinessPlan?.phases?.some((phase) => phase.id === "live_guarded_manual_test") === true,
    testPlanItemsReady: missingTestPlanItems.length === 0,
    assertionsReady: missingAssertions.length === 0,
    architectureDocMentionsLiveGuardedManualTestPlan:
      architectureDoc.includes("Trading Live-Guarded Manual Test Plan") &&
      architectureDoc.includes("live_guarded_manual_test_plan"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    manualTestExecutionAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureLiveGuardedManualTestPlan =
    checks.paperShadowOperationalTestPlanReady &&
    checks.liveGuardedOrderAdapterPreflightStillBlocked &&
    checks.manualOrderPermissionPreflightReady &&
    checks.manualOrderPermissionReceiptReviewReady &&
    checks.killSwitchClearanceContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.orderCredentialBoundaryReady &&
    checks.manualOperatorApprovalReady &&
    checks.auditLoggerReadinessReady &&
    checks.launchPlanIncludesLiveGuardedManualTest &&
    checks.testPlanItemsReady &&
    checks.assertionsReady &&
    checks.architectureDocMentionsLiveGuardedManualTestPlan &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5D",
    scope: "live_guarded_manual_test_plan",
    sourceFiles: {
      paperShadowOperationalTestPlan: PAPER_SHADOW_OPERATIONAL_TEST_PLAN_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      manualOrderPermissionValidationResultReceiptReviewResult: MANUAL_ORDER_PERMISSION_RECEIPT_REVIEW_RESULT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_PATH,
      orderCredentialBoundaryContract: ORDER_CREDENTIAL_BOUNDARY_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_PATH,
      auditLoggerReadiness: AUDIT_LOGGER_READINESS_PATH,
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      planOnly: true,
      manualTestExecutionAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    liveGuardedManualTestPlan: testPlan,
    checks,
    evidence: {
      missingTestPlanItems,
      missingAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      paperShadowOperationalTestPlanStatus: paperShadowOperationalTestPlan.readiness?.status ?? null,
      liveGuardedOrderAdapterPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status ?? null,
      manualOrderPermissionPreflightStatus: manualOrderPermissionPreflight.readiness?.status ?? null,
      manualOrderPermissionReceiptReviewResultStatus:
        manualOrderPermissionReceiptReviewResult.readiness?.status ?? null,
      killSwitchClearanceStatus: killSwitchClearance.readiness?.status ?? null,
      riskGateClearanceStatus: riskGateClearance.readiness?.status ?? null,
      orderCredentialBoundaryStatus: orderCredentialBoundary.readiness?.status ?? null,
      manualOperatorApprovalStatus: manualOperatorApproval.readiness?.status ?? null,
      auditLoggerReadinessStatus: auditLoggerReadiness.readiness?.status ?? null,
      launchPlanStatus: launchReadinessPlan.readiness?.status ?? null,
    },
    readiness: {
      status: readyForFutureLiveGuardedManualTestPlan
        ? "live_guarded_manual_test_plan_ready_execution_blocked"
        : "blocked_before_live_guarded_manual_test_plan",
      readyForFutureLiveGuardedManualTestPlan,
      manualTestExecutionAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.paperShadowOperationalTestPlanReady ? [] : ["paper_shadow_operational_test_plan_not_ready"]),
        ...(checks.liveGuardedOrderAdapterPreflightStillBlocked
          ? []
          : ["live_guarded_order_adapter_preflight_not_blocked"]),
        ...(checks.manualOrderPermissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.manualOrderPermissionReceiptReviewReady
          ? []
          : ["manual_order_permission_receipt_review_result_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_not_ready"]),
        ...(checks.orderCredentialBoundaryReady ? [] : ["order_credential_boundary_not_ready"]),
        ...(checks.manualOperatorApprovalReady ? [] : ["manual_operator_approval_not_ready"]),
        ...(checks.auditLoggerReadinessReady ? [] : ["audit_logger_readiness_not_ready"]),
        ...(checks.launchPlanIncludesLiveGuardedManualTest ? [] : ["launch_plan_missing_live_guarded_manual_test"]),
        ...(checks.testPlanItemsReady ? [] : ["manual_test_plan_items_missing"]),
        ...(checks.assertionsReady ? [] : ["manual_test_plan_assertions_missing"]),
        ...(checks.architectureDocMentionsLiveGuardedManualTestPlan
          ? []
          : ["architecture_doc_missing_live_guarded_manual_test_plan"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "manual_order_permission_packet_not_imported",
        "manual_order_permission_validation_result_receipt_review_not_owner_supplied",
        "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
        "live_guarded_order_adapter_implementation_review_not_started",
        "kill_switch_clearance_not_recorded_for_order_submission",
        "risk_gate_clearance_not_recorded_for_order_submission",
        "live_guarded_manual_test_execution_blocked_pending_manual_permission_and_operator_clearance",
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-live-guarded-manual-test-plan-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-live-guarded-manual-test-plan-contract.cjs`,
      );
    }
    console.log("[generate-trading-live-guarded-manual-test-plan-contract] ok");
    console.log(`[generate-trading-live-guarded-manual-test-plan-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-live-guarded-manual-test-plan-contract] wrote contract");
  console.log(
    `[generate-trading-live-guarded-manual-test-plan-contract] readyForFutureLiveGuardedManualTestPlan=${parsed.readiness.readyForFutureLiveGuardedManualTestPlan}`,
  );
}

main();

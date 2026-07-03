const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_trading_public_dashboard_unblock_preflight_contract.json",
);
const RECEIPT_PLACEHOLDER_BUNDLE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
);
const REMAINING_GATE_INVENTORY_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_remaining_operational_gate_inventory_contract.json",
);
const REMAINING_GATE_BATCH_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_remaining_operational_gate_batch_plan_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");

const CONTRACT_VERSION = "trading-lab-step116-live-trading-public-dashboard-unblock-preflight-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

const REQUIRED_OWNER_RECEIPT_ITEMS = [
  "read_only_approval_packet_import_evidence",
  "read_only_provider_call_authorization_review_result",
  "manual_order_permission_packet_validation_import_evidence",
  "kill_switch_clearance_review_result",
  "risk_gate_clearance_review_result",
  "live_guarded_clearance_review_result_bundle",
];

const IMPLEMENTATION_BLOCKERS = [
  "owner_evidence_receipt_review_result_not_recorded",
  "read_only_provider_call_authorization_review_result_not_recorded",
  "manual_permission_packet_validation_receipt_not_recorded",
  "kill_switch_clearance_review_not_recorded",
  "risk_gate_clearance_review_not_recorded",
  "dry_run_replay_execution_result_not_recorded",
  "shadow_history_review_not_recorded",
  "live_guarded_adapter_review_not_recorded",
  "private_worker_implementation_review_not_recorded",
  "private_operator_dashboard_review_not_recorded",
  "public_dashboard_router_review_not_recorded",
  "homepage_router_review_not_recorded",
];

const FORBIDDEN_ARTIFACTS = [
  path.join("data", "processed", "scenario_monthly_returns.csv"),
  path.join("server", "src", "routes", "trading"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "tradingLiveGuardedWorker.js"),
  path.join("server", "src", "workers", "tradingLiveGuardedWorker.js"),
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function forbiddenArtifacts() {
  return FORBIDDEN_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function allFalse(object, fields) {
  return fields.every((field) => object?.[field] === false);
}

function buildContract() {
  const receiptBundle = readJson(RECEIPT_PLACEHOLDER_BUNDLE_PATH);
  const remainingGateInventory = readJson(REMAINING_GATE_INVENTORY_PATH);
  const remainingGateBatchPlan = readJson(REMAINING_GATE_BATCH_PLAN_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const forbidden = forbiddenArtifacts();
  const receiptItems = (receiptBundle.receipts ?? []).map((receipt) => receipt.itemLabel);
  const remainingGates = progressSummary.remainingTradingGates ?? [];
  const failClosedFields = [
    "readyForReadOnlyProviderCalls",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
    "providerCallsAllowed",
    "orderSubmissionAllowed",
    "runtimeRouteAllowed",
    "publicUiAllowed",
    "dbMigrationAllowed",
  ];

  const checks = {
    preflightOnly: true,
    ownerReceiptPlaceholdersReady: receiptBundle.readiness?.readyForOwnerEvidenceReceiptReview === true,
    ownerReceiptItemsComplete: REQUIRED_OWNER_RECEIPT_ITEMS.every((item) => receiptItems.includes(item)),
    progressSummaryReady: progressSummary.readiness?.contractStackReady === true,
    remainingGateInventoryReady: remainingGateInventory.readiness?.status === "remaining_operational_gate_inventory_ready_fail_closed",
    remainingGateBatchPlanReady: remainingGateBatchPlan.readiness?.status === "remaining_operational_gate_batch_plan_ready_fail_closed",
    remainingTradingGateCount: remainingGates.length,
    remainingTradingGateCountMatchesInventory: remainingGates.length === 20,
    implementationBlockersStillPresent: IMPLEMENTATION_BLOCKERS.length > 0,
    failClosedFlagsStayFalse: allFalse(progressSummary.readiness, failClosedFields) && allFalse(receiptBundle.readiness, failClosedFields),
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };

  const blockers = [
    ...(checks.ownerReceiptPlaceholdersReady ? [] : ["owner_evidence_receipt_placeholders_not_ready"]),
    ...(checks.ownerReceiptItemsComplete ? [] : ["owner_evidence_receipt_items_incomplete"]),
    ...(checks.progressSummaryReady ? [] : ["step116_progress_summary_not_ready"]),
    ...(checks.remainingGateInventoryReady ? [] : ["remaining_operational_gate_inventory_not_ready"]),
    ...(checks.remainingGateBatchPlanReady ? [] : ["remaining_operational_gate_batch_plan_not_ready"]),
    ...(checks.remainingTradingGateCountMatchesInventory ? [] : ["remaining_trading_gate_count_drift"]),
    ...(checks.failClosedFlagsStayFalse ? [] : ["fail_closed_flags_drifted_open"]),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 live trading and public dashboard unblock preflight",
    scope: "implementation_and_public_dashboard_preflight_only",
    sourceFiles: {
      ownerEvidenceReceiptPlaceholderBundle: RECEIPT_PLACEHOLDER_BUNDLE_PATH,
      remainingOperationalGateInventory: REMAINING_GATE_INVENTORY_PATH,
      remainingOperationalGateBatchPlan: REMAINING_GATE_BATCH_PLAN_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    requestedFutureWork: {
      actualLiveTradingImplementation: "blocked_until_internal_operational_gates_complete",
      homepagePublicDashboardRollout: "blocked_until_live_guarded_and_public_dashboard_reviews_complete",
    },
    currentState: {
      preflightOnly: true,
      ownerEvidenceReceiptPlaceholdersRecorded: checks.ownerReceiptPlaceholdersReady,
      remainingTradingGateCount: checks.remainingTradingGateCount,
      actualTradingImplementationAllowed: false,
      providerAdapterImplementationAllowed: false,
      privateWorkerImplementationAllowed: false,
      publicDashboardImplementationAllowed: false,
      homepageRouterChangeAllowed: false,
      actualLiveTradingReadiness: false,
      readyForReadOnlyProviderCalls: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
    },
    requiredBeforeImplementation: IMPLEMENTATION_BLOCKERS,
    checks,
    evidence: {
      forbiddenArtifacts: forbidden,
      remainingTradingGates: remainingGates,
    },
    readiness: {
      status:
        blockers.length === 0
          ? "live_trading_public_dashboard_unblock_preflight_ready_fail_closed"
          : "blocked_before_live_trading_public_dashboard_unblock_preflight",
      readyForActualTradingImplementation: false,
      readyForPublicDashboardImplementation: false,
      readyForHomepageRouterChange: false,
      readyForReadOnlyProviderCalls: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      blockers,
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-live-trading-public-dashboard-unblock-preflight-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-live-trading-public-dashboard-unblock-preflight-contract.cjs`);
    }
    console.log("[generate-trading-step116-live-trading-public-dashboard-unblock-preflight-contract] ok");
    console.log(`[generate-trading-step116-live-trading-public-dashboard-unblock-preflight-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-live-trading-public-dashboard-unblock-preflight-contract] wrote contract");
}

main();

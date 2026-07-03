const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_remaining_operational_gate_inventory_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");

const CONTRACT_VERSION = "trading-lab-step116-remaining-operational-gate-inventory-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

const OWNER_SUPPLIED_GATES = [
  "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
  "read_only_provider_call_authorization_review_result_not_owner_supplied",
  "manual_order_permission_packet_not_imported",
  "kill_switch_clearance_not_recorded_for_order_submission",
  "risk_gate_clearance_not_recorded_for_order_submission",
  "live_guarded_clearance_review_result_bundle_not_owner_supplied",
];

const INTERNAL_REVIEW_GATES = [
  "owner_read_only_evidence_action_queue_ready_import_still_blocked",
  "private_read_only_provider_implementation_review_blocked_pending_owner_packet_import",
  "read_only_provider_call_authorization_blocked_pending_owner_packet_and_provider_review",
  "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
  "private_operator_access_implementation_review_blocked_pending_private_runtime_review",
  "live_guarded_order_adapter_implementation_review_not_started",
  "trading_rules_runtime_application_blocked_pending_private_shadow_runtime_review",
  "paper_shadow_operational_test_execution_blocked_pending_private_runtime_review",
  "live_guarded_manual_test_execution_blocked_pending_manual_permission_and_operator_clearance",
];

const RUNTIME_UI_DB_GATES = [
  "db_storage_review_blocked_pending_private_runtime_review",
  "runtime_route_review_blocked_pending_private_runtime_review",
  "public_dashboard_router_review_blocked_until_live_guarded_review_complete",
  "homepage_router_change_blocked_until_public_dashboard_review",
  "public_homepage_router_blocked_until_live_guarded_review_complete",
];

const FORBIDDEN_ARTIFACTS = [
  path.join("data", "processed", "scenario_monthly_returns.csv"),
  path.join("server", "src", "routes", "trading"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenArtifacts() {
  return FORBIDDEN_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const remainingGates = progressSummary.remainingTradingGates ?? [];
  const expectedGateCount = 20;
  const missingOwnerSupplied = missingValues(remainingGates, OWNER_SUPPLIED_GATES);
  const missingInternalReview = missingValues(remainingGates, INTERNAL_REVIEW_GATES);
  const missingRuntimeUiDb = missingValues(remainingGates, RUNTIME_UI_DB_GATES);
  const forbidden = forbiddenArtifacts();
  const classifiedGateCount =
    OWNER_SUPPLIED_GATES.length + INTERNAL_REVIEW_GATES.length + RUNTIME_UI_DB_GATES.length;
  const checks = {
    contractOnly: true,
    progressSummaryContractStackReady: progressSummary.readiness?.contractStackReady === true,
    remainingGateCountStable: remainingGates.length === expectedGateCount,
    allRemainingGatesClassified: classifiedGateCount === expectedGateCount,
    ownerSuppliedGateCount: OWNER_SUPPLIED_GATES.length,
    internalReviewGateCount: INTERNAL_REVIEW_GATES.length,
    runtimeUiDbGateCount: RUNTIME_UI_DB_GATES.length,
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };
  const blockers = [
    ...(checks.progressSummaryContractStackReady ? [] : ["progress_summary_contract_stack_not_ready"]),
    ...(checks.remainingGateCountStable ? [] : ["remaining_gate_count_changed"]),
    ...(checks.allRemainingGatesClassified ? [] : ["remaining_gate_classification_count_mismatch"]),
    ...missingOwnerSupplied.map((gate) => `owner_supplied_gate_missing_${gate}`),
    ...missingInternalReview.map((gate) => `internal_review_gate_missing_${gate}`),
    ...missingRuntimeUiDb.map((gate) => `runtime_ui_db_gate_missing_${gate}`),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 remaining internal operational gate inventory",
    scope: "remaining_operational_gate_inventory",
    sourceFiles: {
      progressSummary: PROGRESS_SUMMARY_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      orderAuthorityExternalBlockerCleared: true,
      internalOperationalGatesRemaining: remainingGates.length,
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
    gateInventory: {
      totalRemaining: remainingGates.length,
      ownerSuppliedPrivateEvidenceOrResultRequired: OWNER_SUPPLIED_GATES,
      internalReviewOrOperatorGateRequired: INTERNAL_REVIEW_GATES,
      runtimeUiDbStillBlocked: RUNTIME_UI_DB_GATES,
    },
    checks,
    readiness: {
      status:
        blockers.length === 0
          ? "remaining_operational_gate_inventory_ready_fail_closed"
          : "blocked_before_remaining_operational_gate_inventory",
      readyForRemainingOperationalGateReporting: blockers.length === 0,
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-remaining-operational-gate-inventory-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-remaining-operational-gate-inventory-contract.cjs`);
    }
    console.log("[generate-trading-step116-remaining-operational-gate-inventory-contract] ok");
    console.log(`[generate-trading-step116-remaining-operational-gate-inventory-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-remaining-operational-gate-inventory-contract] wrote contract");
}

main();

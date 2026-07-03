const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_remaining_operational_gate_batch_plan_contract.json",
);
const INVENTORY_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_remaining_operational_gate_inventory_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");

const CONTRACT_VERSION = "trading-lab-step116-remaining-operational-gate-batch-plan-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

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

function buildContract() {
  const inventory = readJson(INVENTORY_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const inventoryReady = inventory.readiness?.readyForRemainingOperationalGateReporting === true;
  const remainingCount = inventory.gateInventory?.totalRemaining ?? progressSummary.remainingTradingGates?.length ?? null;
  const ownerRequired = inventory.gateInventory?.ownerSuppliedPrivateEvidenceOrResultRequired ?? [];
  const internalReview = inventory.gateInventory?.internalReviewOrOperatorGateRequired ?? [];
  const runtimeUiDb = inventory.gateInventory?.runtimeUiDbStillBlocked ?? [];

  const checks = {
    contractOnly: true,
    inventoryReady,
    remainingCountStable: remainingCount === 20,
    batchPlanDoesNotImportOwnerEvidence: true,
    batchPlanDoesNotImplementProviderAdapter: true,
    batchPlanDoesNotImplementWorker: true,
    batchPlanDoesNotCreateRuntimeRoute: true,
    batchPlanDoesNotCreatePublicUi: true,
    batchPlanDoesNotCreateDbMigration: true,
    batchPlanDoesNotCallProvider: true,
    batchPlanDoesNotSubmitOrders: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };
  const blockers = [
    ...(checks.inventoryReady ? [] : ["remaining_operational_gate_inventory_not_ready"]),
    ...(checks.remainingCountStable ? [] : ["remaining_operational_gate_count_not_20"]),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 remaining internal operational gate batch plan",
    scope: "remaining_operational_gate_batch_plan",
    sourceFiles: {
      remainingOperationalGateInventory: INVENTORY_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      orderAuthorityExternalBlockerCleared: true,
      internalOperationalGatesRemaining: remainingCount,
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
    batchPlan: {
      answerToHowManyRemain: {
        operationalGatesRemaining: remainingCount,
        ownerSuppliedPrivateEvidenceOrResultRequiredCount: ownerRequired.length,
        internalReviewOrOperatorGateRequiredCount: internalReview.length,
        runtimeUiDbStillBlockedCount: runtimeUiDb.length,
      },
      repoSafeBatchWork: [
        "keep_remaining_gate_inventory_and_progress_summary_current",
        "add_only_contract_or_preflight_boundaries_that_do_not_accept_private_evidence",
        "verify_no_provider_calls_orders_routes_ui_db_or_scenario_csv_after_each_batch",
      ],
      ownerRequiredBeforeRealUnlock: ownerRequired,
      stillBlockedImplementationBatches: {
        internalReviewOrOperatorGateRequired: internalReview,
        runtimeUiDbStillBlocked: runtimeUiDb,
      },
    },
    checks,
    readiness: {
      status:
        blockers.length === 0
          ? "remaining_operational_gate_batch_plan_ready_fail_closed"
          : "blocked_before_remaining_operational_gate_batch_plan",
      readyForBatchReporting: blockers.length === 0,
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-remaining-operational-gate-batch-plan-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-remaining-operational-gate-batch-plan-contract.cjs`);
    }
    console.log("[generate-trading-step116-remaining-operational-gate-batch-plan-contract] ok");
    console.log(`[generate-trading-step116-remaining-operational-gate-batch-plan-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-remaining-operational-gate-batch-plan-contract] wrote contract");
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_preflight_contract.json",
);
const LIVE_GUARDED_ADAPTER_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const CLEARANCE_SEQUENCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
);
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-live-guarded-private-worker-implementation-preflight-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_PRIVATE_WORKER_PREFLIGHT_GATES = [
  "live_guarded_adapter_review_result_contract_ready",
  "owner_adapter_review_result_required_later",
  "private_worker_review_required_later",
  "current_step_does_not_record_adapter_review_result",
  "current_step_does_not_open_worker_implementation",
  "current_step_does_not_implement_worker",
  "current_step_does_not_import_order_adapter",
  "current_step_does_not_sign_provider_requests",
  "current_step_does_not_call_provider",
  "current_step_does_not_submit_orders",
  "current_step_does_not_create_runtime_route",
  "current_step_does_not_create_public_ui",
  "current_step_does_not_create_db_migration",
  "hash_only_audit_logging_required",
  "kill_switch_before_worker_start",
  "risk_gate_before_request_signing",
  "idempotency_key_required",
  "manual_permission_reference_hash_required",
];
const FORBIDDEN_PRIVATE_WORKER_PREFLIGHT_CONTENT = [
  "actual_owner_local_packet_path",
  "actual_owner_local_validation_receipt_path",
  "private_packet_path",
  "private_receipt_path",
  "private_shadow_history_path",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "raw_risk_snapshot",
  "raw_shadow_order_intent",
  "raw_broker_position",
  "raw_account_balance",
  "raw_quote_payload",
  "raw_fx_payload",
  "request_signature_payload",
  "provider_request_body",
  "provider_response_body",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "worker_runtime_payload",
  "private_worker_hash_inputs",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "kisTradingService.js"),
  path.join("server", "src", "services", "kisOrderService.js"),
  path.join("server", "src", "services", "tradingOrderService.js"),
  path.join("server", "src", "services", "tradingLiveGuardedOrderAdapter.js"),
  path.join("server", "src", "workers", "tradingLiveGuardedWorker.js"),
  path.join("server", "src", "workers", "tradingPrivateWorker.js"),
  path.join("server", "src", "services", "trading", "privateWorker.js"),
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

function statusOf(report) {
  return report.readiness?.status ?? report.status ?? null;
}

function buildContract() {
  const liveGuardedAdapterReviewResult = readJson(LIVE_GUARDED_ADAPTER_REVIEW_RESULT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const preflightGates = [...REQUIRED_PRIVATE_WORKER_PREFLIGHT_GATES];
  const forbiddenPreflightContent = [...FORBIDDEN_PRIVATE_WORKER_PREFLIGHT_CONTENT];
  const missingPreflightGates = missingValues(preflightGates, REQUIRED_PRIVATE_WORKER_PREFLIGHT_GATES);
  const missingForbiddenPreflightContent = missingValues(
    forbiddenPreflightContent,
    FORBIDDEN_PRIVATE_WORKER_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    privateWorkerImplementationPreflightOnly: true,
    liveGuardedAdapterReviewResultBoundaryReady:
      liveGuardedAdapterReviewResult.readiness?.readyForLiveGuardedOrderAdapterReviewResultContract === true &&
      liveGuardedAdapterReviewResult.readiness?.readyForPrivateWorkerImplementationAfterAdapterReview === false &&
      liveGuardedAdapterReviewResult.readiness?.currentStepOpensAdapterImplementation === false &&
      liveGuardedAdapterReviewResult.readiness?.currentStepImplementsAdapter === false &&
      liveGuardedAdapterReviewResult.readiness?.providerCallsAllowed === false &&
      liveGuardedAdapterReviewResult.readiness?.orderSubmissionAllowed === false,
    liveGuardedAdapterPreflightStillClosed:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.runtimeRouteAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.publicUiAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.dbMigrationAllowed === false,
    clearanceSequenceStillOrdered:
      clearanceSequence.readiness?.readyForSequentialInternalGateReview === true &&
      clearanceSequence.readiness?.liveGuardedAdapterReviewStarted === false &&
      clearanceSequence.readiness?.orderSubmissionAllowed === false,
    launchReadinessPlanStillBlocked:
      launchReadinessPlan.readiness?.planReady === true &&
      launchReadinessPlan.readiness?.providerCallsAllowed === false &&
      launchReadinessPlan.readiness?.orderSubmissionAllowed === false &&
      launchReadinessPlan.readiness?.runtimeRouteAllowed === false &&
      launchReadinessPlan.readiness?.publicUiAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.providerCallsAllowed === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    preflightGatesReady: missingPreflightGates.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsPrivateWorkerPreflight:
      architectureDoc.includes("Trading Live-Guarded Private Worker Implementation Preflight") &&
      architectureDoc.includes("live_guarded_private_worker_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerAdapterReviewResultRecordedNow: false,
    currentStepOpensPrivateWorkerImplementation: false,
    currentStepImplementsPrivateWorker: false,
    currentStepImportsOrderAdapter: false,
    currentStepSignsProviderRequests: false,
    currentStepCallsProvider: false,
    currentStepSubmitsOrders: false,
    privateWorkerImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForLiveGuardedPrivateWorkerImplementationPreflightContract =
    checks.liveGuardedAdapterReviewResultBoundaryReady &&
    checks.liveGuardedAdapterPreflightStillClosed &&
    checks.clearanceSequenceStillOrdered &&
    checks.launchReadinessPlanStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.preflightGatesReady &&
    checks.forbiddenPreflightContentReady &&
    checks.architectureDocMentionsPrivateWorkerPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-7C",
    scope: "live_guarded_private_worker_implementation_preflight",
    sourceFiles: {
      liveGuardedOrderAdapterReviewResult: LIVE_GUARDED_ADAPTER_REVIEW_RESULT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      privateWorkerImplementationPreflightOnly: true,
      ownerAdapterReviewResultRecordedNow: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImportsOrderAdapter: false,
      currentStepSignsProviderRequests: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      privateWorkerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futurePrivateWorkerImplementationBoundary: {
      currentStepMayRecordAdapterReviewResult: false,
      currentStepMayOpenPrivateWorkerImplementation: false,
      currentStepMayImplementPrivateWorker: false,
      currentStepMayImportOrderAdapter: false,
      currentStepMaySignProviderRequests: false,
      currentStepMayCallProvider: false,
      currentStepMaySubmitOrder: false,
      preflightGates,
      forbiddenPreflightContent,
      futureImplementationReviewRules: [
        "private_worker_only",
        "no_default_private_packet_read",
        "no_public_route_or_ui",
        "manual_permission_reference_hash_required",
        "kill_switch_checked_before_worker_start",
        "risk_gate_checked_before_request_signing",
        "dry_run_replay_reference_required",
        "shadow_history_review_reference_required",
        "idempotency_key_required",
        "request_and_response_hashes_only",
      ],
    },
    checks,
    evidence: {
      missingPreflightGates,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      liveGuardedAdapterReviewResultStatus: statusOf(liveGuardedAdapterReviewResult),
      liveGuardedOrderAdapterPreflightStatus: statusOf(liveGuardedOrderAdapterPreflight),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      launchReadinessPlanStatus: statusOf(launchReadinessPlan),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForLiveGuardedPrivateWorkerImplementationPreflightContract
        ? "live_guarded_private_worker_implementation_preflight_contract_ready_pending_owner_adapter_review_result"
        : "blocked_before_live_guarded_private_worker_implementation_preflight_contract",
      readyForLiveGuardedPrivateWorkerImplementationPreflightContract,
      readyForPrivateWorkerImplementationAfterPreflight: false,
      ownerAdapterReviewResultRecordedNow: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImportsOrderAdapter: false,
      currentStepSignsProviderRequests: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      privateWorkerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_live_guarded_adapter_review_result",
        "owner_redacted_manual_order_permission_import_result",
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_risk_gate_clearance_review_result",
        "owner_redacted_dry_run_replay_execution_result",
        "owner_redacted_shadow_history_review_result",
      ],
      blockers: [
        ...(checks.liveGuardedAdapterReviewResultBoundaryReady
          ? []
          : ["live_guarded_order_adapter_review_result_contract_not_ready"]),
        ...(checks.liveGuardedAdapterPreflightStillClosed
          ? []
          : ["live_guarded_order_adapter_preflight_not_closed"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.launchReadinessPlanStillBlocked ? [] : ["launch_readiness_plan_not_fail_closed"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingPreflightGates.map((gate) => `missing_private_worker_preflight_gate_${gate}`),
        ...missingForbiddenPreflightContent.map(
          (content) => `missing_forbidden_private_worker_preflight_content_${content}`,
        ),
        ...(checks.architectureDocMentionsPrivateWorkerPreflight
          ? []
          : ["architecture_doc_missing_private_worker_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const expected = buildContract();
  if (process.argv.includes("--check")) {
    const actual = fs.existsSync(CONTRACT_PATH) ? fs.readFileSync(CONTRACT_PATH, "utf8") : "";
    if (actual !== expected) {
      fail(`${CONTRACT_PATH} is out of date`);
    }
    console.log("[generate-trading-live-guarded-private-worker-implementation-preflight-contract] ok");
    console.log(
      `[generate-trading-live-guarded-private-worker-implementation-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-live-guarded-private-worker-implementation-preflight-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

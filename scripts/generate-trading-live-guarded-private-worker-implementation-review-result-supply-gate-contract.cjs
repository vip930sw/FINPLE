const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_supply_gate_contract.json",
);
const PRIVATE_WORKER_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_contract.json",
);
const OWNER_ADAPTER_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_result_contract.json",
);
const LIVE_GUARDED_ADAPTER_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json",
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

const CONTRACT_VERSION =
  "trading-lab-step116-live-guarded-private-worker-implementation-review-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-02T00:00:00Z";
const REQUIRED_WORKER_REVIEW_RESULT_SUPPLY_GATES = [
  "private_worker_implementation_review_contract_ready",
  "owner_adapter_review_result_recording_result_review_result_contract_ready",
  "live_guarded_adapter_review_result_contract_ready",
  "private_worker_implementation_review_result_required_later",
  "current_step_does_not_accept_worker_review_result",
  "current_step_does_not_read_worker_review_result",
  "current_step_does_not_record_worker_review_result",
  "current_step_does_not_record_private_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_open_private_worker_implementation",
  "current_step_does_not_implement_private_worker",
  "current_step_does_not_implement_order_adapter",
  "current_step_does_not_import_order_adapter",
  "current_step_does_not_sign_provider_requests",
  "current_step_does_not_call_provider",
  "current_step_does_not_submit_orders",
  "current_step_does_not_create_runtime_route",
  "current_step_does_not_create_public_ui",
  "current_step_does_not_create_db_migration",
  "kis_personal_permission_not_external_blocker",
  "internal_operational_gates_still_required",
  "hash_only_worker_review_result_required",
];
const FORBIDDEN_WORKER_REVIEW_RESULT_SUPPLY_CONTENT = [
  "actual_owner_local_packet_path",
  "actual_owner_local_validation_receipt_path",
  "actual_owner_adapter_review_result_path",
  "actual_owner_adapter_review_result_recording_result_path",
  "actual_owner_adapter_review_result_recording_result_review_path",
  "actual_owner_private_worker_review_result_path",
  "private_packet_path",
  "private_receipt_path",
  "private_adapter_review_path",
  "private_worker_review_path",
  "private_worker_review_result_path",
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
  "worker_runtime_payload",
  "private_worker_hash_inputs",
  "adapter_review_result_payload",
  "worker_review_result_payload",
  "worker_review_result_hash_inputs",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_adapter_review_result.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_adapter_review_result_recording_result.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_adapter_review_result_recording_result_review.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_private_worker_review.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_private_worker_review_result.redacted.json"),
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
  const privateWorkerReview = readJson(PRIVATE_WORKER_REVIEW_PATH);
  const ownerAdapterReviewResult = readJson(OWNER_ADAPTER_REVIEW_RESULT_PATH);
  const liveGuardedAdapterReviewResult = readJson(LIVE_GUARDED_ADAPTER_REVIEW_RESULT_PATH);
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const workerReviewResultSupplyGates = [...REQUIRED_WORKER_REVIEW_RESULT_SUPPLY_GATES];
  const forbiddenWorkerReviewResultSupplyContent = [...FORBIDDEN_WORKER_REVIEW_RESULT_SUPPLY_CONTENT];
  const missingWorkerReviewResultSupplyGates = missingValues(
    workerReviewResultSupplyGates,
    REQUIRED_WORKER_REVIEW_RESULT_SUPPLY_GATES,
  );
  const missingForbiddenWorkerReviewResultSupplyContent = missingValues(
    forbiddenWorkerReviewResultSupplyContent,
    FORBIDDEN_WORKER_REVIEW_RESULT_SUPPLY_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    privateWorkerImplementationReviewResultSupplyGateOnly: true,
    privateWorkerImplementationReviewReady:
      privateWorkerReview.readiness?.readyForLiveGuardedPrivateWorkerImplementationReview === true &&
      privateWorkerReview.readiness?.readyForPrivateWorkerImplementationAfterReview === false &&
      privateWorkerReview.readiness?.ownerPrivateWorkerImplementationReviewSuppliedNow === false &&
      privateWorkerReview.readiness?.ownerPrivateWorkerImplementationReviewReadNow === false &&
      privateWorkerReview.readiness?.privateWorkerImplementationReviewRecordedNow === false &&
      privateWorkerReview.readiness?.currentStepOpensPrivateWorkerImplementation === false &&
      privateWorkerReview.readiness?.currentStepImplementsPrivateWorker === false &&
      privateWorkerReview.readiness?.providerCallsAllowed === false &&
      privateWorkerReview.readiness?.orderSubmissionAllowed === false,
    ownerAdapterReviewResultBoundaryReady:
      ownerAdapterReviewResult.readiness?.readyForLiveGuardedOwnerAdapterReviewResultRecordingResultReviewResultContract ===
        true &&
      ownerAdapterReviewResult.readiness?.readyForPrivateWorkerImplementationAfterOwnerAdapterReviewResult === false &&
      ownerAdapterReviewResult.readiness?.currentStepOpensPrivateWorkerImplementation === false &&
      ownerAdapterReviewResult.readiness?.providerCallsAllowed === false &&
      ownerAdapterReviewResult.readiness?.orderSubmissionAllowed === false,
    liveGuardedAdapterReviewResultBoundaryReady:
      liveGuardedAdapterReviewResult.readiness?.readyForLiveGuardedOrderAdapterReviewResultContract === true &&
      liveGuardedAdapterReviewResult.readiness?.readyForPrivateWorkerImplementationAfterAdapterReview === false &&
      liveGuardedAdapterReviewResult.readiness?.currentStepOpensAdapterImplementation === false &&
      liveGuardedAdapterReviewResult.readiness?.currentStepImplementsAdapter === false &&
      liveGuardedAdapterReviewResult.readiness?.providerCallsAllowed === false &&
      liveGuardedAdapterReviewResult.readiness?.orderSubmissionAllowed === false,
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
    workerReviewResultSupplyGatesReady: missingWorkerReviewResultSupplyGates.length === 0,
    forbiddenWorkerReviewResultSupplyContentReady: missingForbiddenWorkerReviewResultSupplyContent.length === 0,
    architectureDocMentionsPrivateWorkerImplementationReviewResultSupplyGate:
      architectureDoc.includes("Trading Live-Guarded Private Worker Implementation Review Result Supply Gate") &&
      architectureDoc.includes("live_guarded_private_worker_implementation_review_result_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    kisPersonalPermissionExternalBlocker: false,
    ownerPrivateWorkerImplementationReviewResultSuppliedNow: false,
    ownerPrivateWorkerImplementationReviewResultReadNow: false,
    privateWorkerImplementationReviewResultRecordedNow: false,
    currentStepRecordsPrivatePath: false,
    currentStepRecordsRawValues: false,
    currentStepOpensPrivateWorkerImplementation: false,
    currentStepImplementsPrivateWorker: false,
    currentStepImplementsOrderAdapter: false,
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

  const readyForLiveGuardedPrivateWorkerImplementationReviewResultSupplyGate =
    checks.privateWorkerImplementationReviewReady &&
    checks.ownerAdapterReviewResultBoundaryReady &&
    checks.liveGuardedAdapterReviewResultBoundaryReady &&
    checks.launchReadinessPlanStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.workerReviewResultSupplyGatesReady &&
    checks.forbiddenWorkerReviewResultSupplyContentReady &&
    checks.architectureDocMentionsPrivateWorkerImplementationReviewResultSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-7L",
    scope: "live_guarded_private_worker_implementation_review_result_supply_gate",
    sourceFiles: {
      liveGuardedPrivateWorkerImplementationReview: PRIVATE_WORKER_REVIEW_PATH,
      liveGuardedOwnerAdapterReviewResultRecordingResultReviewResult: OWNER_ADAPTER_REVIEW_RESULT_PATH,
      liveGuardedOrderAdapterReviewResult: LIVE_GUARDED_ADAPTER_REVIEW_RESULT_PATH,
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      privateWorkerImplementationReviewResultSupplyGateOnly: true,
      kisPersonalPermissionExternalBlocker: false,
      ownerPrivateWorkerImplementationReviewResultSuppliedNow: false,
      ownerPrivateWorkerImplementationReviewResultReadNow: false,
      privateWorkerImplementationReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImplementsOrderAdapter: false,
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
    privateWorkerImplementationReviewResultSupplyGateBoundary: {
      currentStepMayAcceptWorkerReviewResult: false,
      currentStepMayReadWorkerReviewResult: false,
      currentStepMayRecordWorkerReviewResult: false,
      currentStepMayRecordPrivatePath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayOpenPrivateWorkerImplementation: false,
      currentStepMayImplementPrivateWorker: false,
      currentStepMayImplementOrderAdapter: false,
      currentStepMayImportOrderAdapter: false,
      currentStepMaySignProviderRequests: false,
      currentStepMayCallProvider: false,
      currentStepMaySubmitOrder: false,
      kisPersonalPermissionExternalBlocker: false,
      internalOperationalGatesStillRequired: true,
      nextAllowedAction:
        "after the owner supplies a redacted private-worker implementation review result outside repo commits, add a separate hash-only review result recording preflight",
      workerReviewResultSupplyGates,
      forbiddenWorkerReviewResultSupplyContent,
      futureReviewResultRules: [
        "owner_supplied_redacted_worker_review_result_only",
        "no_private_path_or_raw_value_in_repo",
        "hash_only_evidence",
        "manual_permission_reference_hash_required",
        "owner_adapter_review_result_hash_required",
        "kill_switch_reference_required",
        "risk_gate_reference_required",
        "dry_run_replay_reference_required",
        "shadow_history_review_reference_required",
        "worker_review_result_must_not_open_provider_calls",
        "worker_review_result_must_not_open_order_submission",
      ],
    },
    checks,
    evidence: {
      missingWorkerReviewResultSupplyGates,
      missingForbiddenWorkerReviewResultSupplyContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      privateWorkerImplementationReviewStatus: statusOf(privateWorkerReview),
      ownerAdapterReviewResultStatus: statusOf(ownerAdapterReviewResult),
      liveGuardedAdapterReviewResultStatus: statusOf(liveGuardedAdapterReviewResult),
      launchReadinessPlanStatus: statusOf(launchReadinessPlan),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForLiveGuardedPrivateWorkerImplementationReviewResultSupplyGate
        ? "live_guarded_private_worker_implementation_review_result_supply_gate_ready_pending_owner_worker_review_result"
        : "blocked_before_live_guarded_private_worker_implementation_review_result_supply_gate",
      readyForLiveGuardedPrivateWorkerImplementationReviewResultSupplyGate,
      readyForPrivateWorkerImplementationAfterReviewResult: false,
      kisPersonalPermissionExternalBlocker: false,
      ownerPrivateWorkerImplementationReviewResultSuppliedNow: false,
      ownerPrivateWorkerImplementationReviewResultReadNow: false,
      privateWorkerImplementationReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImplementsOrderAdapter: false,
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
      pendingExternalInputs: ["owner_redacted_live_guarded_private_worker_implementation_review_result"],
      blockers: [
        ...(checks.privateWorkerImplementationReviewReady
          ? []
          : ["live_guarded_private_worker_implementation_review_not_ready"]),
        ...(checks.ownerAdapterReviewResultBoundaryReady
          ? []
          : ["live_guarded_owner_adapter_review_result_recording_result_review_result_not_ready"]),
        ...(checks.liveGuardedAdapterReviewResultBoundaryReady
          ? []
          : ["live_guarded_order_adapter_review_result_contract_not_ready"]),
        ...(checks.launchReadinessPlanStillBlocked ? [] : ["launch_readiness_plan_not_fail_closed"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingWorkerReviewResultSupplyGates.map(
          (gate) => `missing_private_worker_implementation_review_result_supply_gate_${gate}`,
        ),
        ...missingForbiddenWorkerReviewResultSupplyContent.map(
          (content) => `missing_forbidden_private_worker_implementation_review_result_supply_content_${content}`,
        ),
        ...(checks.architectureDocMentionsPrivateWorkerImplementationReviewResultSupplyGate
          ? []
          : ["architecture_doc_missing_private_worker_implementation_review_result_supply_gate"]),
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
    console.log("[generate-trading-live-guarded-private-worker-implementation-review-result-supply-gate-contract] ok");
    console.log(
      `[generate-trading-live-guarded-private-worker-implementation-review-result-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-live-guarded-private-worker-implementation-review-result-supply-gate-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

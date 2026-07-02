const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_contract.json",
);
const BOUNDARY_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_preflight_contract.json",
);
const PRIVATE_WORKER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_preflight_contract.json",
);
const PRIVATE_WORKER_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_contract.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_REVIEW_RESULT_PATH = path.join(
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
  "trading-lab-step116-live-guarded-private-worker-implementation-boundary-review-v0.1";
const AUDITED_AT = "2026-07-02T00:00:00Z";
const REQUIRED_WORKER_BOUNDARY_REVIEW_GATES = [
  "private_worker_implementation_boundary_preflight_ready",
  "private_worker_implementation_review_contract_required_before_code",
  "current_step_does_not_accept_review_result",
  "current_step_does_not_read_review_result",
  "current_step_does_not_record_review_result",
  "current_step_does_not_record_private_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_open_private_worker_implementation",
  "current_step_does_not_implement_private_worker",
  "current_step_does_not_import_order_adapter",
  "current_step_does_not_start_worker_runtime",
  "current_step_does_not_sign_provider_requests",
  "current_step_does_not_call_provider",
  "current_step_does_not_submit_orders",
  "current_step_does_not_create_runtime_route",
  "current_step_does_not_create_public_ui",
  "current_step_does_not_create_db_migration",
  "kis_personal_permission_not_external_blocker",
  "internal_operational_gates_still_required",
  "hash_only_audit_logging_required",
  "kill_switch_before_worker_start",
  "risk_gate_before_request_signing",
  "dry_run_replay_before_live_request_signing",
  "shadow_history_review_before_live_request_signing",
  "idempotency_key_required",
  "manual_permission_reference_hash_required",
];
const FORBIDDEN_WORKER_BOUNDARY_REVIEW_CONTENT = [
  "actual_owner_local_packet_path",
  "actual_owner_local_validation_receipt_path",
  "actual_owner_adapter_review_result_path",
  "actual_owner_private_worker_review_result_path",
  "private_packet_path",
  "private_receipt_path",
  "private_adapter_review_path",
  "private_worker_review_path",
  "private_worker_review_result_path",
  "private_worker_source_path",
  "private_worker_implementation_payload",
  "private_worker_runtime_config",
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

function failClosed(report) {
  const readiness = report.readiness ?? {};
  return (
    readiness.providerCallsAllowed === false &&
    readiness.orderSubmissionAllowed === false &&
    readiness.runtimeRouteAllowed === false &&
    readiness.publicUiAllowed === false &&
    readiness.dbMigrationAllowed === false
  );
}

function buildContract() {
  const boundaryPreflight = readJson(BOUNDARY_PREFLIGHT_PATH);
  const privateWorkerImplementationPreflight = readJson(PRIVATE_WORKER_PREFLIGHT_PATH);
  const privateWorkerReview = readJson(PRIVATE_WORKER_REVIEW_PATH);
  const liveGuardedOrderAdapterReviewResult = readJson(LIVE_GUARDED_ORDER_ADAPTER_REVIEW_RESULT_PATH);
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const workerBoundaryReviewGates = [...REQUIRED_WORKER_BOUNDARY_REVIEW_GATES];
  const forbiddenWorkerBoundaryReviewContent = [...FORBIDDEN_WORKER_BOUNDARY_REVIEW_CONTENT];
  const missingWorkerBoundaryReviewGates = missingValues(
    workerBoundaryReviewGates,
    REQUIRED_WORKER_BOUNDARY_REVIEW_GATES,
  );
  const missingForbiddenWorkerBoundaryReviewContent = missingValues(
    forbiddenWorkerBoundaryReviewContent,
    FORBIDDEN_WORKER_BOUNDARY_REVIEW_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    privateWorkerImplementationBoundaryReviewOnly: true,
    boundaryPreflightReady:
      boundaryPreflight.readiness?.readyForLiveGuardedPrivateWorkerImplementationBoundaryPreflight === true &&
      boundaryPreflight.readiness?.readyForPrivateWorkerImplementationAfterBoundaryPreflight === false &&
      boundaryPreflight.readiness?.currentStepOpensPrivateWorkerImplementation === false &&
      boundaryPreflight.readiness?.currentStepImplementsPrivateWorker === false &&
      boundaryPreflight.readiness?.currentStepImportsOrderAdapter === false &&
      boundaryPreflight.readiness?.currentStepStartsWorkerRuntime === false &&
      failClosed(boundaryPreflight),
    privateWorkerImplementationPreflightStillClosed:
      privateWorkerImplementationPreflight.readiness?.readyForLiveGuardedPrivateWorkerImplementationPreflightContract ===
        true &&
      privateWorkerImplementationPreflight.readiness?.readyForPrivateWorkerImplementationAfterPreflight === false &&
      privateWorkerImplementationPreflight.readiness?.currentStepOpensPrivateWorkerImplementation === false &&
      privateWorkerImplementationPreflight.readiness?.currentStepImplementsPrivateWorker === false &&
      failClosed(privateWorkerImplementationPreflight),
    privateWorkerImplementationReviewReady:
      privateWorkerReview.readiness?.readyForLiveGuardedPrivateWorkerImplementationReview === true &&
      privateWorkerReview.readiness?.readyForPrivateWorkerImplementationAfterReview === false &&
      privateWorkerReview.readiness?.currentStepOpensPrivateWorkerImplementation === false &&
      privateWorkerReview.readiness?.currentStepImplementsPrivateWorker === false &&
      failClosed(privateWorkerReview),
    liveGuardedOrderAdapterReviewResultBoundaryReady:
      liveGuardedOrderAdapterReviewResult.readiness?.readyForLiveGuardedOrderAdapterReviewResultContract === true &&
      liveGuardedOrderAdapterReviewResult.readiness?.readyForPrivateWorkerImplementationAfterAdapterReview === false &&
      liveGuardedOrderAdapterReviewResult.readiness?.currentStepOpensAdapterImplementation === false &&
      liveGuardedOrderAdapterReviewResult.readiness?.currentStepImplementsAdapter === false &&
      failClosed(liveGuardedOrderAdapterReviewResult),
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
    workerBoundaryReviewGatesReady: missingWorkerBoundaryReviewGates.length === 0,
    forbiddenWorkerBoundaryReviewContentReady: missingForbiddenWorkerBoundaryReviewContent.length === 0,
    architectureDocMentionsPrivateWorkerImplementationBoundaryReview:
      architectureDoc.includes("Trading Live-Guarded Private Worker Implementation Boundary Review") &&
      architectureDoc.includes("live_guarded_private_worker_implementation_boundary_review"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    kisPersonalPermissionExternalBlocker: false,
    ownerPrivateWorkerImplementationBoundaryReviewSuppliedNow: false,
    ownerPrivateWorkerImplementationBoundaryReviewReadNow: false,
    privateWorkerImplementationBoundaryReviewResultRecordedNow: false,
    currentStepRecordsPrivatePath: false,
    currentStepRecordsRawValues: false,
    currentStepOpensPrivateWorkerImplementation: false,
    currentStepImplementsPrivateWorker: false,
    currentStepImportsOrderAdapter: false,
    currentStepSignsProviderRequests: false,
    currentStepCallsProvider: false,
    currentStepSubmitsOrders: false,
    currentStepStartsWorkerRuntime: false,
    privateWorkerImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForLiveGuardedPrivateWorkerImplementationBoundaryReview =
    checks.boundaryPreflightReady &&
    checks.privateWorkerImplementationPreflightStillClosed &&
    checks.privateWorkerImplementationReviewReady &&
    checks.liveGuardedOrderAdapterReviewResultBoundaryReady &&
    checks.launchReadinessPlanStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.workerBoundaryReviewGatesReady &&
    checks.forbiddenWorkerBoundaryReviewContentReady &&
    checks.architectureDocMentionsPrivateWorkerImplementationBoundaryReview &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-7T",
    scope: "live_guarded_private_worker_implementation_boundary_review",
    sourceFiles: {
      liveGuardedPrivateWorkerImplementationBoundaryPreflight: BOUNDARY_PREFLIGHT_PATH,
      liveGuardedPrivateWorkerImplementationPreflight: PRIVATE_WORKER_PREFLIGHT_PATH,
      liveGuardedPrivateWorkerImplementationReview: PRIVATE_WORKER_REVIEW_PATH,
      liveGuardedOrderAdapterReviewResult: LIVE_GUARDED_ORDER_ADAPTER_REVIEW_RESULT_PATH,
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      privateWorkerImplementationBoundaryReviewOnly: true,
      kisPersonalPermissionExternalBlocker: false,
      ownerPrivateWorkerImplementationBoundaryReviewSuppliedNow: false,
      ownerPrivateWorkerImplementationBoundaryReviewReadNow: false,
      privateWorkerImplementationBoundaryReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImportsOrderAdapter: false,
      currentStepSignsProviderRequests: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      currentStepStartsWorkerRuntime: false,
      privateWorkerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    privateWorkerImplementationBoundaryReview: {
      currentStepMayAcceptReviewResult: false,
      currentStepMayReadReviewResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayRecordPrivatePath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayOpenPrivateWorkerImplementation: false,
      currentStepMayImplementPrivateWorker: false,
      currentStepMayImportOrderAdapter: false,
      currentStepMaySignProviderRequests: false,
      currentStepMayCallProvider: false,
      currentStepMaySubmitOrder: false,
      currentStepMayStartWorkerRuntime: false,
      kisPersonalPermissionExternalBlocker: false,
      internalOperationalGatesStillRequired: true,
      nextAllowedAction:
        "after this boundary review contract is reviewed, add a separate boundary review result supply gate without implementing worker code",
      workerBoundaryReviewGates,
      forbiddenWorkerBoundaryReviewContent,
      futureImplementationBoundaryRules: [
        "boundary_review_result_supply_gate_required_before_code",
        "no_private_path_or_raw_value_in_repo",
        "hash_only_evidence",
        "manual_permission_reference_hash_required",
        "owner_adapter_review_result_hash_required",
        "private_worker_review_result_hash_required",
        "kill_switch_reference_required",
        "risk_gate_reference_required",
        "dry_run_replay_reference_required",
        "shadow_history_review_reference_required",
        "worker_code_must_not_sign_provider_requests_without_review",
        "worker_code_must_not_open_provider_calls",
        "worker_code_must_not_open_order_submission",
      ],
    },
    checks,
    evidence: {
      missingWorkerBoundaryReviewGates,
      missingForbiddenWorkerBoundaryReviewContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      boundaryPreflightStatus: statusOf(boundaryPreflight),
      privateWorkerImplementationPreflightStatus: statusOf(privateWorkerImplementationPreflight),
      privateWorkerImplementationReviewStatus: statusOf(privateWorkerReview),
      liveGuardedOrderAdapterReviewResultStatus: statusOf(liveGuardedOrderAdapterReviewResult),
      launchReadinessPlanStatus: statusOf(launchReadinessPlan),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForLiveGuardedPrivateWorkerImplementationBoundaryReview
        ? "live_guarded_private_worker_implementation_boundary_review_ready_pending_review_result_supply_gate"
        : "blocked_before_live_guarded_private_worker_implementation_boundary_review",
      readyForLiveGuardedPrivateWorkerImplementationBoundaryReview,
      readyForPrivateWorkerImplementationAfterBoundaryReview: false,
      readyForPrivateWorkerImplementationAfterBoundaryPreflight: false,
      kisPersonalPermissionExternalBlocker: false,
      ownerPrivateWorkerImplementationBoundaryReviewSuppliedNow: false,
      ownerPrivateWorkerImplementationBoundaryReviewReadNow: false,
      privateWorkerImplementationBoundaryReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImportsOrderAdapter: false,
      currentStepSignsProviderRequests: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      currentStepStartsWorkerRuntime: false,
      privateWorkerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "separate_live_guarded_private_worker_implementation_boundary_review_result_supply_gate",
      ],
      blockers: [
        ...(checks.boundaryPreflightReady
          ? []
          : ["live_guarded_private_worker_implementation_boundary_preflight_not_ready"]),
        ...(checks.privateWorkerImplementationPreflightStillClosed
          ? []
          : ["live_guarded_private_worker_implementation_preflight_not_fail_closed"]),
        ...(checks.privateWorkerImplementationReviewReady
          ? []
          : ["live_guarded_private_worker_implementation_review_not_ready"]),
        ...(checks.liveGuardedOrderAdapterReviewResultBoundaryReady
          ? []
          : ["live_guarded_order_adapter_review_result_contract_not_ready"]),
        ...(checks.launchReadinessPlanStillBlocked ? [] : ["launch_readiness_plan_not_fail_closed"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingWorkerBoundaryReviewGates.map(
          (gate) => `missing_private_worker_implementation_boundary_review_${gate}`,
        ),
        ...missingForbiddenWorkerBoundaryReviewContent.map(
          (content) => `missing_forbidden_private_worker_implementation_boundary_review_content_${content}`,
        ),
        ...(checks.architectureDocMentionsPrivateWorkerImplementationBoundaryReview
          ? []
          : ["architecture_doc_missing_private_worker_implementation_boundary_review"]),
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
    console.log("[generate-trading-live-guarded-private-worker-implementation-boundary-review-contract] ok");
    console.log(
      `[generate-trading-live-guarded-private-worker-implementation-boundary-review-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-live-guarded-private-worker-implementation-boundary-review-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

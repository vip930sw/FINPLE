const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_preflight_contract.json",
);
const RECORDING_RESULT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_contract.json",
);
const RECORDING_RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_supply_gate_contract.json",
);
const RECORDING_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_preflight_contract.json",
);
const PRIVATE_WORKER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_private_worker_implementation_preflight_contract.json",
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
  "trading-lab-step116-live-guarded-owner-adapter-review-result-recording-result-review-preflight-v0.1";
const AUDITED_AT = "2026-07-02T00:00:00Z";
const REQUIRED_REVIEW_PREFLIGHT_GATES = [
  "owner_adapter_review_result_recording_result_contract_ready",
  "owner_adapter_review_result_recording_result_supply_gate_ready",
  "owner_adapter_review_result_recording_preflight_ready",
  "private_worker_implementation_preflight_contract_ready",
  "recording_result_review_preflight_required_later",
  "current_step_does_not_accept_review_result",
  "current_step_does_not_read_recording_result",
  "current_step_does_not_record_review_result",
  "current_step_does_not_record_private_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_open_private_worker_implementation",
  "current_step_does_not_implement_private_worker",
  "current_step_does_not_implement_order_adapter",
  "current_step_does_not_import_order_adapter",
  "current_step_does_not_call_provider",
  "current_step_does_not_submit_orders",
  "current_step_does_not_create_runtime_route",
  "current_step_does_not_create_public_ui",
  "current_step_does_not_create_db_migration",
  "kis_personal_permission_not_external_blocker",
  "internal_operational_gates_still_required",
  "hash_only_recording_result_review_required",
];
const FORBIDDEN_REVIEW_PREFLIGHT_CONTENT = [
  "actual_owner_local_packet_path",
  "actual_owner_local_validation_receipt_path",
  "actual_owner_adapter_review_result_path",
  "actual_owner_adapter_review_result_recording_result_path",
  "private_packet_path",
  "private_receipt_path",
  "private_adapter_review_path",
  "private_recording_result_path",
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
  "adapter_review_result_payload",
  "adapter_review_result_hash_inputs",
  "adapter_review_recording_result_payload",
  "adapter_review_recording_result_hash_inputs",
  "review_preflight_private_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "private_worker_runtime_payload",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_adapter_review_result.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_adapter_review_result_recording_result.redacted.json"),
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
  const recordingResultContract = readJson(RECORDING_RESULT_CONTRACT_PATH);
  const recordingResultSupplyGate = readJson(RECORDING_RESULT_SUPPLY_GATE_PATH);
  const recordingPreflight = readJson(RECORDING_PREFLIGHT_PATH);
  const privateWorkerPreflight = readJson(PRIVATE_WORKER_PREFLIGHT_PATH);
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewPreflightGates = [...REQUIRED_REVIEW_PREFLIGHT_GATES];
  const forbiddenReviewPreflightContent = [...FORBIDDEN_REVIEW_PREFLIGHT_CONTENT];
  const missingReviewPreflightGates = missingValues(reviewPreflightGates, REQUIRED_REVIEW_PREFLIGHT_GATES);
  const missingForbiddenReviewPreflightContent = missingValues(
    forbiddenReviewPreflightContent,
    FORBIDDEN_REVIEW_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    recordingResultReviewPreflightOnly: true,
    recordingResultContractReady:
      recordingResultContract.readiness?.readyForLiveGuardedOwnerAdapterReviewResultRecordingResultContract === true &&
      recordingResultContract.readiness?.readyForPrivateWorkerImplementationAfterOwnerAdapterReviewResult === false &&
      recordingResultContract.readiness?.kisPersonalPermissionExternalBlocker === false &&
      recordingResultContract.readiness?.ownerAdapterReviewResultRecordingResultSuppliedNow === false &&
      recordingResultContract.readiness?.ownerAdapterReviewResultRecordingResultReadNow === false &&
      recordingResultContract.readiness?.ownerAdapterReviewResultRecordedNow === false &&
      recordingResultContract.readiness?.currentStepOpensPrivateWorkerImplementation === false &&
      recordingResultContract.readiness?.currentStepCallsProvider === false &&
      recordingResultContract.readiness?.currentStepSubmitsOrders === false &&
      recordingResultContract.readiness?.providerCallsAllowed === false &&
      recordingResultContract.readiness?.orderSubmissionAllowed === false,
    recordingResultSupplyGateStillReady:
      recordingResultSupplyGate.readiness?.readyForLiveGuardedOwnerAdapterReviewResultRecordingResultSupplyGate === true &&
      recordingResultSupplyGate.readiness?.ownerAdapterReviewResultRecordingResultSuppliedNow === false &&
      recordingResultSupplyGate.readiness?.ownerAdapterReviewResultRecordingResultReadNow === false &&
      recordingResultSupplyGate.readiness?.ownerAdapterReviewResultRecordedNow === false &&
      recordingResultSupplyGate.readiness?.providerCallsAllowed === false &&
      recordingResultSupplyGate.readiness?.orderSubmissionAllowed === false,
    recordingPreflightStillReady:
      recordingPreflight.readiness?.readyForLiveGuardedOwnerAdapterReviewResultRecordingPreflight === true &&
      recordingPreflight.readiness?.ownerAdapterReviewResultAcceptedNow === false &&
      recordingPreflight.readiness?.ownerAdapterReviewResultReadNow === false &&
      recordingPreflight.readiness?.ownerAdapterReviewResultRecordedNow === false &&
      recordingPreflight.readiness?.providerCallsAllowed === false &&
      recordingPreflight.readiness?.orderSubmissionAllowed === false,
    privateWorkerPreflightStillClosed:
      privateWorkerPreflight.readiness?.readyForLiveGuardedPrivateWorkerImplementationPreflightContract === true &&
      privateWorkerPreflight.readiness?.readyForPrivateWorkerImplementationAfterPreflight === false &&
      privateWorkerPreflight.readiness?.currentStepOpensPrivateWorkerImplementation === false &&
      privateWorkerPreflight.readiness?.currentStepImplementsPrivateWorker === false &&
      privateWorkerPreflight.readiness?.providerCallsAllowed === false &&
      privateWorkerPreflight.readiness?.orderSubmissionAllowed === false,
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
    reviewPreflightGatesReady: missingReviewPreflightGates.length === 0,
    forbiddenReviewPreflightContentReady: missingForbiddenReviewPreflightContent.length === 0,
    architectureDocMentionsRecordingResultReviewPreflight:
      architectureDoc.includes("Trading Live-Guarded Owner Adapter Review Result Recording Result Review Preflight") &&
      architectureDoc.includes("live_guarded_owner_adapter_review_result_recording_result_review_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    kisPersonalPermissionExternalBlocker: false,
    ownerAdapterReviewResultRecordingResultReviewAcceptedNow: false,
    ownerAdapterReviewResultRecordingResultReadNow: false,
    ownerAdapterReviewResultReviewRecordedNow: false,
    currentStepRecordsPrivatePath: false,
    currentStepRecordsRawValues: false,
    currentStepOpensPrivateWorkerImplementation: false,
    currentStepImplementsPrivateWorker: false,
    currentStepImplementsOrderAdapter: false,
    currentStepImportsOrderAdapter: false,
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

  const readyForLiveGuardedOwnerAdapterReviewResultRecordingResultReviewPreflight =
    checks.recordingResultContractReady &&
    checks.recordingResultSupplyGateStillReady &&
    checks.recordingPreflightStillReady &&
    checks.privateWorkerPreflightStillClosed &&
    checks.launchReadinessPlanStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.reviewPreflightGatesReady &&
    checks.forbiddenReviewPreflightContentReady &&
    checks.architectureDocMentionsRecordingResultReviewPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-7H",
    scope: "live_guarded_owner_adapter_review_result_recording_result_review_preflight",
    sourceFiles: {
      liveGuardedOwnerAdapterReviewResultRecordingResult: RECORDING_RESULT_CONTRACT_PATH,
      liveGuardedOwnerAdapterReviewResultRecordingResultSupplyGate: RECORDING_RESULT_SUPPLY_GATE_PATH,
      liveGuardedOwnerAdapterReviewResultRecordingPreflight: RECORDING_PREFLIGHT_PATH,
      liveGuardedPrivateWorkerImplementationPreflight: PRIVATE_WORKER_PREFLIGHT_PATH,
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      recordingResultReviewPreflightOnly: true,
      kisPersonalPermissionExternalBlocker: false,
      ownerAdapterReviewResultRecordingResultReviewAcceptedNow: false,
      ownerAdapterReviewResultRecordingResultReadNow: false,
      ownerAdapterReviewResultReviewRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImplementsOrderAdapter: false,
      currentStepImportsOrderAdapter: false,
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
    recordingResultReviewPreflight: {
      ownerSuppliedRecordingResultReviewRequiredLater: true,
      currentStepMayAcceptRecordingResultReview: false,
      currentStepMayReadRecordingResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayRecordPrivatePath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayOpenPrivateWorkerImplementation: false,
      currentStepMayImplementPrivateWorker: false,
      currentStepMayImplementOrderAdapter: false,
      currentStepMayCallProvider: false,
      currentStepMaySubmitOrder: false,
      kisPersonalPermissionExternalBlocker: false,
      internalOperationalGatesStillRequired: true,
      nextAllowedAction:
        "after an owner-supplied redacted recording result review is prepared outside repo commits, add a separate hash-only review result supply gate",
      reviewPreflightGates,
      forbiddenReviewPreflightContent,
      futureReviewResultRules: [
        "owner_supplied_redacted_review_result_only",
        "no_private_path_or_raw_value_in_repo",
        "hash_only_evidence",
        "manual_permission_reference_hash_required",
        "kill_switch_reference_required",
        "risk_gate_reference_required",
        "dry_run_replay_reference_required",
        "shadow_history_review_reference_required",
        "recording_result_review_must_not_open_provider_calls",
        "recording_result_review_must_not_open_order_submission",
      ],
    },
    checks,
    evidence: {
      missingReviewPreflightGates,
      missingForbiddenReviewPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      recordingResultContractStatus: statusOf(recordingResultContract),
      recordingResultSupplyGateStatus: statusOf(recordingResultSupplyGate),
      recordingPreflightStatus: statusOf(recordingPreflight),
      privateWorkerPreflightStatus: statusOf(privateWorkerPreflight),
      launchReadinessPlanStatus: statusOf(launchReadinessPlan),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForLiveGuardedOwnerAdapterReviewResultRecordingResultReviewPreflight
        ? "live_guarded_owner_adapter_review_result_recording_result_review_preflight_ready_pending_owner_review_result"
        : "blocked_before_live_guarded_owner_adapter_review_result_recording_result_review_preflight",
      readyForLiveGuardedOwnerAdapterReviewResultRecordingResultReviewPreflight,
      readyForPrivateWorkerImplementationAfterOwnerAdapterReviewResult: false,
      kisPersonalPermissionExternalBlocker: false,
      ownerAdapterReviewResultRecordingResultReviewAcceptedNow: false,
      ownerAdapterReviewResultRecordingResultReadNow: false,
      ownerAdapterReviewResultReviewRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImplementsOrderAdapter: false,
      currentStepImportsOrderAdapter: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      privateWorkerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: ["owner_redacted_live_guarded_adapter_review_result_recording_result_review"],
      blockers: [
        ...(checks.recordingResultContractReady
          ? []
          : ["live_guarded_owner_adapter_review_result_recording_result_contract_not_ready"]),
        ...(checks.recordingResultSupplyGateStillReady
          ? []
          : ["live_guarded_owner_adapter_review_result_recording_result_supply_gate_not_ready"]),
        ...(checks.recordingPreflightStillReady
          ? []
          : ["live_guarded_owner_adapter_review_result_recording_preflight_not_ready"]),
        ...(checks.privateWorkerPreflightStillClosed ? [] : ["private_worker_implementation_preflight_not_closed"]),
        ...(checks.launchReadinessPlanStillBlocked ? [] : ["launch_readiness_plan_not_fail_closed"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReviewPreflightGates.map(
          (gate) => `missing_owner_adapter_review_result_recording_result_review_preflight_gate_${gate}`,
        ),
        ...missingForbiddenReviewPreflightContent.map(
          (content) => `missing_forbidden_owner_adapter_review_result_recording_result_review_preflight_content_${content}`,
        ),
        ...(checks.architectureDocMentionsRecordingResultReviewPreflight
          ? []
          : ["architecture_doc_missing_owner_adapter_review_result_recording_result_review_preflight"]),
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
    console.log(
      "[generate-trading-live-guarded-owner-adapter-review-result-recording-result-review-preflight-contract] ok",
    );
    console.log(
      `[generate-trading-live-guarded-owner-adapter-review-result-recording-result-review-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-live-guarded-owner-adapter-review-result-recording-result-review-preflight-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

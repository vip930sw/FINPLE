const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json",
);
const SHADOW_HISTORY_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_shadow_history_review_result_contract.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const LIVE_GUARDED_CLEARANCE_BUNDLE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
);
const CLEARANCE_SEQUENCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-live-guarded-order-adapter-review-result-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_REVIEW_RESULT_FIELDS = [
  "liveGuardedAdapterReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "manualOrderPermissionImportResultHash",
  "killSwitchClearanceReviewResultHash",
  "riskGateClearanceReviewResultHash",
  "dryRunReplayExecutionResultHash",
  "shadowHistoryReviewResultHash",
  "orderCredentialBoundaryHash",
  "adapterDesignReviewHash",
  "privateWorkerReviewHash",
  "auditLoggerReviewHash",
  "redactionVersion",
  "adapterReviewRecordedNow",
  "adapterImplementationOpenedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const REQUIRED_REVIEW_RESULT_ASSERTIONS = [
  "review_result_is_redacted_only",
  "review_status_must_be_passed_or_blocked",
  "review_result_records_hashes_not_paths",
  "adapter_review_recorded_now_must_remain_false_in_contract",
  "adapter_implementation_opened_now_must_remain_false_in_contract",
  "review_result_cannot_enable_provider_calls",
  "review_result_cannot_enable_order_submission",
  "review_result_cannot_open_runtime_route",
  "review_result_cannot_open_public_ui",
  "review_result_cannot_open_db_migration",
  "review_result_cannot_open_live_trading",
  "separate_private_worker_implementation_required",
];
const FORBIDDEN_REVIEW_RESULT_CONTENT = [
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
  "raw_shadow_history",
  "raw_shadow_audit_event",
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
  "adapter_review_hash_inputs",
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
  const shadowHistoryReviewResult = readJson(SHADOW_HISTORY_REVIEW_RESULT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const liveGuardedClearanceBundle = readJson(LIVE_GUARDED_CLEARANCE_BUNDLE_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultFields = [...REQUIRED_REVIEW_RESULT_FIELDS];
  const reviewResultAssertions = [...REQUIRED_REVIEW_RESULT_ASSERTIONS];
  const forbiddenReviewResultContent = [...FORBIDDEN_REVIEW_RESULT_CONTENT];
  const missingReviewResultFields = missingValues(reviewResultFields, REQUIRED_REVIEW_RESULT_FIELDS);
  const missingReviewResultAssertions = missingValues(reviewResultAssertions, REQUIRED_REVIEW_RESULT_ASSERTIONS);
  const missingForbiddenReviewResultContent = missingValues(
    forbiddenReviewResultContent,
    FORBIDDEN_REVIEW_RESULT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    liveGuardedAdapterReviewResultContractOnly: true,
    shadowHistoryReviewResultBoundaryReady:
      shadowHistoryReviewResult.readiness?.readyForManualOrderPermissionShadowHistoryReviewResultContract === true &&
      shadowHistoryReviewResult.readiness?.readyForLiveGuardedAdapterReviewAfterShadowHistory === false &&
      shadowHistoryReviewResult.readiness?.currentStepOpensLiveGuardedAdapterReview === false &&
      shadowHistoryReviewResult.readiness?.providerCallsAllowed === false &&
      shadowHistoryReviewResult.readiness?.orderSubmissionAllowed === false,
    liveGuardedAdapterPreflightStillClosed:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.runtimeRouteAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.publicUiAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.dbMigrationAllowed === false,
    liveGuardedClearanceBundleReady:
      liveGuardedClearanceBundle.readiness?.readyForFutureLiveGuardedClearanceReviewResultBundle === true &&
      liveGuardedClearanceBundle.readiness?.providerCallsAllowed === false &&
      liveGuardedClearanceBundle.readiness?.orderSubmissionAllowed === false &&
      liveGuardedClearanceBundle.readiness?.runtimeRouteAllowed === false,
    clearanceSequenceStillOrdered:
      clearanceSequence.readiness?.readyForSequentialInternalGateReview === true &&
      clearanceSequence.readiness?.liveGuardedAdapterReviewStarted === false &&
      clearanceSequence.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    reviewResultFieldsReady: missingReviewResultFields.length === 0,
    reviewResultAssertionsReady: missingReviewResultAssertions.length === 0,
    forbiddenReviewResultContentReady: missingForbiddenReviewResultContent.length === 0,
    architectureDocMentionsLiveGuardedAdapterReviewResult:
      architectureDoc.includes("Trading Live-Guarded Order Adapter Review Result Contract") &&
      architectureDoc.includes("live_guarded_order_adapter_review_result"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerLiveGuardedAdapterReviewResultRecordedNow: false,
    currentStepRecordsAdapterReviewResult: false,
    currentStepOpensAdapterImplementation: false,
    currentStepImplementsAdapter: false,
    currentStepSubmitsOrders: false,
    liveGuardedAdapterImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForLiveGuardedOrderAdapterReviewResultContract =
    checks.shadowHistoryReviewResultBoundaryReady &&
    checks.liveGuardedAdapterPreflightStillClosed &&
    checks.liveGuardedClearanceBundleReady &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.reviewResultFieldsReady &&
    checks.reviewResultAssertionsReady &&
    checks.forbiddenReviewResultContentReady &&
    checks.architectureDocMentionsLiveGuardedAdapterReviewResult &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-7B",
    scope: "live_guarded_order_adapter_review_result",
    sourceFiles: {
      manualOrderPermissionShadowHistoryReviewResult: SHADOW_HISTORY_REVIEW_RESULT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      liveGuardedClearanceReviewResultBundle: LIVE_GUARDED_CLEARANCE_BUNDLE_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      liveGuardedAdapterReviewResultContractOnly: true,
      ownerLiveGuardedAdapterReviewResultRecordedNow: false,
      currentStepRecordsAdapterReviewResult: false,
      currentStepOpensAdapterImplementation: false,
      currentStepImplementsAdapter: false,
      currentStepSubmitsOrders: false,
      liveGuardedAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureLiveGuardedAdapterReviewResultBoundary: {
      currentStepMayRecordAdapterReviewResult: false,
      currentStepMayOpenAdapterImplementation: false,
      currentStepMayImplementAdapter: false,
      currentStepMaySubmitOrder: false,
      requiredReviewResultFields: reviewResultFields,
      requiredReviewResultAssertions: reviewResultAssertions,
      forbiddenReviewResultContent,
      sampleRedactedShape: {
        liveGuardedAdapterReviewId: "live_guarded_adapter_review_<opaque_id>",
        reviewStatus: "passed_for_private_worker_implementation_or_blocked",
        reviewedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        reviewerHash: "hmac-sha256:<reviewer_hash>",
        manualOrderPermissionImportResultHash: "sha256:<permission_import_result_hash>",
        killSwitchClearanceReviewResultHash: "sha256:<kill_switch_clearance_review_result_hash>",
        riskGateClearanceReviewResultHash: "sha256:<risk_gate_clearance_review_result_hash>",
        dryRunReplayExecutionResultHash: "sha256:<dry_run_replay_execution_result_hash>",
        shadowHistoryReviewResultHash: "sha256:<shadow_history_review_result_hash>",
        orderCredentialBoundaryHash: "sha256:<order_credential_boundary_hash>",
        adapterDesignReviewHash: "sha256:<adapter_design_review_hash>",
        privateWorkerReviewHash: "sha256:<private_worker_review_hash>",
        auditLoggerReviewHash: "sha256:<audit_logger_review_hash>",
        redactionVersion: "v1",
        adapterReviewRecordedNow: false,
        adapterImplementationOpenedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
        dbMigrationAllowed: false,
        liveTradingAllowed: false,
      },
      promotionRules: [
        "future live-guarded adapter review result can be recorded only after a separate owner/local adapter review",
        "review result must not record private paths, raw orders, raw provider payloads, signatures, raw balances, raw positions, or hash inputs",
        "review result success still does not implement or execute a KIS order adapter in this contract",
        "review result success still does not open provider calls, runtime routes, public UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      missingReviewResultFields,
      missingReviewResultAssertions,
      missingForbiddenReviewResultContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowHistoryReviewResultStatus: statusOf(shadowHistoryReviewResult),
      liveGuardedOrderAdapterPreflightStatus: statusOf(liveGuardedOrderAdapterPreflight),
      liveGuardedClearanceBundleStatus: statusOf(liveGuardedClearanceBundle),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForLiveGuardedOrderAdapterReviewResultContract
        ? "live_guarded_order_adapter_review_result_contract_ready_pending_owner_result_record"
        : "blocked_before_live_guarded_order_adapter_review_result_contract",
      readyForLiveGuardedOrderAdapterReviewResultContract,
      readyForPrivateWorkerImplementationAfterAdapterReview: false,
      ownerLiveGuardedAdapterReviewResultRecordedNow: false,
      currentStepRecordsAdapterReviewResult: false,
      currentStepOpensAdapterImplementation: false,
      currentStepImplementsAdapter: false,
      currentStepSubmitsOrders: false,
      liveGuardedAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_live_guarded_adapter_review_result",
        "owner_redacted_shadow_history_review_result",
        "owner_redacted_dry_run_replay_execution_result",
        "owner_redacted_risk_gate_clearance_review_result",
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_manual_order_permission_import_result",
      ],
      blockers: [
        ...(checks.shadowHistoryReviewResultBoundaryReady
          ? []
          : ["manual_order_permission_shadow_history_review_result_contract_not_ready"]),
        ...(checks.liveGuardedAdapterPreflightStillClosed
          ? []
          : ["live_guarded_order_adapter_preflight_not_closed"]),
        ...(checks.liveGuardedClearanceBundleReady ? [] : ["live_guarded_clearance_bundle_not_ready"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReviewResultFields.map((field) => `missing_live_guarded_adapter_review_result_field_${field}`),
        ...missingReviewResultAssertions.map(
          (assertion) => `missing_live_guarded_adapter_review_result_assertion_${assertion}`,
        ),
        ...missingForbiddenReviewResultContent.map(
          (content) => `missing_forbidden_live_guarded_adapter_review_result_content_${content}`,
        ),
        ...(checks.architectureDocMentionsLiveGuardedAdapterReviewResult
          ? []
          : ["architecture_doc_missing_live_guarded_adapter_review_result_contract"]),
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
    console.log("[generate-trading-live-guarded-order-adapter-review-result-contract] ok");
    console.log(`[generate-trading-live-guarded-order-adapter-review-result-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(`[generate-trading-live-guarded-order-adapter-review-result-contract] wrote ${CONTRACT_PATH}`);
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_shadow_history_review_result_contract.json",
);
const DRY_RUN_REPLAY_EXECUTION_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_dry_run_replay_execution_result_contract.json",
);
const SHADOW_HISTORY_REVIEW_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
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
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-shadow-history-review-result-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_SHADOW_HISTORY_REVIEW_RESULT_FIELDS = [
  "shadowHistoryReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "dryRunReplayExecutionResultHash",
  "shadowIntentLogHash",
  "shadowRiskEventLogHash",
  "shadowAuditEventHash",
  "operatorReviewHash",
  "blockedIntentReviewHash",
  "redactionVersion",
  "shadowHistoryReviewedNow",
  "liveGuardedAdapterReviewOpenedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const REQUIRED_SHADOW_HISTORY_REVIEW_RESULT_ASSERTIONS = [
  "review_result_is_redacted_only",
  "review_status_must_be_passed_or_blocked",
  "review_result_records_hashes_not_paths",
  "shadow_history_reviewed_now_must_remain_false_in_contract",
  "live_guarded_adapter_review_opened_now_must_remain_false_in_contract",
  "review_result_cannot_enable_provider_calls",
  "review_result_cannot_enable_order_submission",
  "review_result_cannot_open_runtime_route",
  "review_result_cannot_open_public_ui",
  "review_result_cannot_open_db_migration",
  "review_result_cannot_open_live_trading",
  "separate_live_guarded_adapter_review_result_required",
];
const FORBIDDEN_SHADOW_HISTORY_REVIEW_RESULT_CONTENT = [
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
  "paper_ledger_payload",
  "dry_run_replay_payload",
  "shadow_history_review_payload",
  "shadow_history_hash_inputs",
  "validator_stdout_with_raw_values",
  "validator_stderr_with_raw_values",
  "packet_hash_inputs",
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
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "killSwitch.js"),
  path.join("server", "src", "services", "tradingRiskGateClearance.js"),
  path.join("server", "src", "services", "trading", "riskGateClearance.js"),
  path.join("server", "src", "services", "tradingDryRunReplayService.js"),
  path.join("server", "src", "services", "trading", "dryRunReplay.js"),
  path.join("server", "src", "services", "tradingShadowHistoryReviewService.js"),
  path.join("server", "src", "services", "tradingShadowHistoryReview.js"),
  path.join("server", "src", "services", "trading", "shadowHistoryReview.js"),
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
  const dryRunReplayExecutionResult = readJson(DRY_RUN_REPLAY_EXECUTION_RESULT_PATH);
  const shadowHistoryReview = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultFields = [...REQUIRED_SHADOW_HISTORY_REVIEW_RESULT_FIELDS];
  const reviewResultAssertions = [...REQUIRED_SHADOW_HISTORY_REVIEW_RESULT_ASSERTIONS];
  const forbiddenReviewResultContent = [...FORBIDDEN_SHADOW_HISTORY_REVIEW_RESULT_CONTENT];
  const missingReviewResultFields = missingValues(
    reviewResultFields,
    REQUIRED_SHADOW_HISTORY_REVIEW_RESULT_FIELDS,
  );
  const missingReviewResultAssertions = missingValues(
    reviewResultAssertions,
    REQUIRED_SHADOW_HISTORY_REVIEW_RESULT_ASSERTIONS,
  );
  const missingForbiddenReviewResultContent = missingValues(
    forbiddenReviewResultContent,
    FORBIDDEN_SHADOW_HISTORY_REVIEW_RESULT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    shadowHistoryReviewResultContractOnly: true,
    dryRunReplayExecutionResultBoundaryReady:
      dryRunReplayExecutionResult.readiness?.readyForManualOrderPermissionDryRunReplayExecutionResultContract === true &&
      dryRunReplayExecutionResult.readiness?.readyForShadowHistoryReviewAfterDryRun === false &&
      dryRunReplayExecutionResult.readiness?.currentStepOpensShadowHistoryReview === false &&
      dryRunReplayExecutionResult.readiness?.providerCallsAllowed === false &&
      dryRunReplayExecutionResult.readiness?.orderSubmissionAllowed === false,
    shadowHistoryReviewContractReady:
      shadowHistoryReview.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReview.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReview.readiness?.providerCallsAllowed === false &&
      shadowHistoryReview.readiness?.orderSubmissionAllowed === false &&
      shadowHistoryReview.readiness?.dbMigrationAllowed === false &&
      shadowHistoryReview.readiness?.publicUiAllowed === false,
    liveGuardedAdapterReviewStillClosed:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.runtimeRouteAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.publicUiAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.dbMigrationAllowed === false,
    clearanceSequenceStillOrdered:
      clearanceSequence.readiness?.readyForSequentialInternalGateReview === true &&
      clearanceSequence.readiness?.shadowHistoryReviewResultRecorded !== true &&
      clearanceSequence.readiness?.liveGuardedAdapterReviewStarted === false &&
      clearanceSequence.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    reviewResultFieldsReady: missingReviewResultFields.length === 0,
    reviewResultAssertionsReady: missingReviewResultAssertions.length === 0,
    forbiddenReviewResultContentReady: missingForbiddenReviewResultContent.length === 0,
    architectureDocMentionsShadowHistoryReviewResult:
      architectureDoc.includes("Trading Manual Order Permission Shadow-History Review Result Contract") &&
      architectureDoc.includes("manual_order_permission_shadow_history_review_result"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerShadowHistoryReviewResultRecordedNow: false,
    currentStepReviewsShadowHistory: false,
    currentStepRecordsShadowHistoryReviewResult: false,
    currentStepOpensLiveGuardedAdapterReview: false,
    currentStepSubmitsOrders: false,
    shadowHistoryReviewRuntimeImplementationAllowed: false,
    liveGuardedAdapterReviewAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionShadowHistoryReviewResultContract =
    checks.dryRunReplayExecutionResultBoundaryReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.liveGuardedAdapterReviewStillClosed &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.reviewResultFieldsReady &&
    checks.reviewResultAssertionsReady &&
    checks.forbiddenReviewResultContentReady &&
    checks.architectureDocMentionsShadowHistoryReviewResult &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-7A",
    scope: "manual_order_permission_shadow_history_review_result",
    sourceFiles: {
      manualOrderPermissionDryRunReplayExecutionResult: DRY_RUN_REPLAY_EXECUTION_RESULT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      shadowHistoryReviewResultContractOnly: true,
      ownerShadowHistoryReviewResultRecordedNow: false,
      currentStepReviewsShadowHistory: false,
      currentStepRecordsShadowHistoryReviewResult: false,
      currentStepOpensLiveGuardedAdapterReview: false,
      currentStepSubmitsOrders: false,
      shadowHistoryReviewRuntimeImplementationAllowed: false,
      liveGuardedAdapterReviewAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureShadowHistoryReviewResultBoundary: {
      currentStepMayReviewShadowHistory: false,
      currentStepMayRecordShadowHistoryReviewResult: false,
      currentStepMayOpenLiveGuardedAdapterReview: false,
      currentStepMaySubmitOrder: false,
      requiredReviewResultFields: reviewResultFields,
      requiredReviewResultAssertions: reviewResultAssertions,
      forbiddenReviewResultContent,
      sampleRedactedShape: {
        shadowHistoryReviewId: "shadow_history_review_<opaque_id>",
        reviewStatus: "passed_for_next_live_guarded_adapter_review_or_blocked",
        reviewedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        reviewerHash: "hmac-sha256:<reviewer_hash>",
        dryRunReplayExecutionResultHash: "sha256:<dry_run_replay_execution_result_hash>",
        shadowIntentLogHash: "sha256:<shadow_intent_log_hash>",
        shadowRiskEventLogHash: "sha256:<shadow_risk_event_log_hash>",
        shadowAuditEventHash: "hmac-sha256:<shadow_audit_event_hash>",
        operatorReviewHash: "hmac-sha256:<operator_review_hash>",
        blockedIntentReviewHash: "sha256:<blocked_intent_review_hash>",
        redactionVersion: "v1",
        shadowHistoryReviewedNow: false,
        liveGuardedAdapterReviewOpenedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
        dbMigrationAllowed: false,
        liveTradingAllowed: false,
      },
      promotionRules: [
        "future shadow-history review result can be recorded only after a separate owner/local shadow-history review",
        "review result must not record private paths, raw shadow history, raw orders, raw provider payloads, raw balances, raw positions, or hash inputs",
        "review result success still does not open live-guarded adapter review in this contract",
        "review result success still does not open provider calls, runtime routes, public UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      missingReviewResultFields,
      missingReviewResultAssertions,
      missingForbiddenReviewResultContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      dryRunReplayExecutionResultStatus: statusOf(dryRunReplayExecutionResult),
      shadowHistoryReviewContractStatus: statusOf(shadowHistoryReview),
      liveGuardedOrderAdapterPreflightStatus: statusOf(liveGuardedOrderAdapterPreflight),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionShadowHistoryReviewResultContract
        ? "manual_order_permission_shadow_history_review_result_contract_ready_pending_owner_result_record"
        : "blocked_before_manual_order_permission_shadow_history_review_result_contract",
      readyForManualOrderPermissionShadowHistoryReviewResultContract,
      readyForLiveGuardedAdapterReviewAfterShadowHistory: false,
      ownerShadowHistoryReviewResultRecordedNow: false,
      currentStepReviewsShadowHistory: false,
      currentStepRecordsShadowHistoryReviewResult: false,
      currentStepOpensLiveGuardedAdapterReview: false,
      currentStepSubmitsOrders: false,
      shadowHistoryReviewRuntimeImplementationAllowed: false,
      liveGuardedAdapterReviewAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_shadow_history_review_result",
        "owner_redacted_dry_run_replay_execution_result",
        "owner_redacted_risk_gate_clearance_review_result",
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_manual_order_permission_import_result",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.dryRunReplayExecutionResultBoundaryReady
          ? []
          : ["manual_order_permission_dry_run_replay_execution_result_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...(checks.liveGuardedAdapterReviewStillClosed ? [] : ["live_guarded_order_adapter_preflight_not_closed"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReviewResultFields.map((field) => `missing_shadow_history_review_result_field_${field}`),
        ...missingReviewResultAssertions.map(
          (assertion) => `missing_shadow_history_review_result_assertion_${assertion}`,
        ),
        ...missingForbiddenReviewResultContent.map(
          (content) => `missing_forbidden_shadow_history_review_result_content_${content}`,
        ),
        ...(checks.architectureDocMentionsShadowHistoryReviewResult
          ? []
          : ["architecture_doc_missing_shadow_history_review_result_contract"]),
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
    console.log("[generate-trading-manual-order-permission-shadow-history-review-result-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-shadow-history-review-result-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-manual-order-permission-shadow-history-review-result-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_dry_run_replay_execution_result_contract.json",
);
const RISK_GATE_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json",
);
const DRY_RUN_REPLAY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_dry_run_replay_contract.json",
);
const SHADOW_HISTORY_REVIEW_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-dry-run-replay-execution-result-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_DRY_RUN_REPLAY_EXECUTION_RESULT_FIELDS = [
  "dryRunReplayExecutionId",
  "executionStatus",
  "executedAt",
  "operatorHash",
  "riskGateClearanceReviewResultHash",
  "orderIntentFixtureHash",
  "riskGateFixtureHash",
  "paperLedgerStartSnapshotHash",
  "paperLedgerExpectedSnapshotHash",
  "riskEventSummaryHash",
  "blockedActionSummaryHash",
  "determinismProofHash",
  "auditEventHash",
  "redactionVersion",
  "dryRunReplayExecutedNow",
  "shadowHistoryReviewOpenedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const REQUIRED_DRY_RUN_REPLAY_EXECUTION_RESULT_ASSERTIONS = [
  "execution_result_is_redacted_only",
  "execution_status_must_be_passed_or_blocked",
  "execution_result_records_hashes_not_paths",
  "dry_run_replay_executed_now_must_remain_false_in_contract",
  "shadow_history_review_opened_now_must_remain_false_in_contract",
  "execution_result_cannot_enable_provider_calls",
  "execution_result_cannot_enable_order_submission",
  "execution_result_cannot_open_runtime_route",
  "execution_result_cannot_open_public_ui",
  "execution_result_cannot_open_db_migration",
  "execution_result_cannot_open_live_trading",
  "separate_shadow_history_review_result_required",
];
const FORBIDDEN_DRY_RUN_REPLAY_EXECUTION_RESULT_CONTENT = [
  "actual_owner_local_packet_path",
  "actual_owner_local_validation_receipt_path",
  "private_packet_path",
  "private_receipt_path",
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
  "raw_broker_position",
  "raw_account_balance",
  "raw_quote_payload",
  "raw_fx_payload",
  "paper_ledger_payload",
  "dry_run_replay_payload",
  "dry_run_replay_hash_inputs",
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
  const riskGateReviewResult = readJson(RISK_GATE_REVIEW_RESULT_PATH);
  const dryRunReplay = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReview = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const executionResultFields = [...REQUIRED_DRY_RUN_REPLAY_EXECUTION_RESULT_FIELDS];
  const executionResultAssertions = [...REQUIRED_DRY_RUN_REPLAY_EXECUTION_RESULT_ASSERTIONS];
  const forbiddenExecutionResultContent = [...FORBIDDEN_DRY_RUN_REPLAY_EXECUTION_RESULT_CONTENT];
  const missingExecutionResultFields = missingValues(
    executionResultFields,
    REQUIRED_DRY_RUN_REPLAY_EXECUTION_RESULT_FIELDS,
  );
  const missingExecutionResultAssertions = missingValues(
    executionResultAssertions,
    REQUIRED_DRY_RUN_REPLAY_EXECUTION_RESULT_ASSERTIONS,
  );
  const missingForbiddenExecutionResultContent = missingValues(
    forbiddenExecutionResultContent,
    FORBIDDEN_DRY_RUN_REPLAY_EXECUTION_RESULT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    dryRunReplayExecutionResultContractOnly: true,
    riskGateReviewResultBoundaryReady:
      riskGateReviewResult.readiness?.readyForManualOrderPermissionRiskGateClearanceReviewResultContract === true &&
      riskGateReviewResult.readiness?.readyForDryRunReplayAfterRiskGate === false &&
      riskGateReviewResult.readiness?.currentStepOpensDryRunReplay === false &&
      riskGateReviewResult.readiness?.providerCallsAllowed === false &&
      riskGateReviewResult.readiness?.orderSubmissionAllowed === false,
    dryRunReplayContractReady:
      dryRunReplay.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplay.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplay.readiness?.providerCallsAllowed === false &&
      dryRunReplay.readiness?.orderSubmissionAllowed === false &&
      dryRunReplay.readiness?.dbMigrationAllowed === false &&
      dryRunReplay.readiness?.publicUiAllowed === false,
    shadowHistoryReviewStillClosed:
      shadowHistoryReview.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReview.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReview.readiness?.providerCallsAllowed === false &&
      shadowHistoryReview.readiness?.orderSubmissionAllowed === false &&
      shadowHistoryReview.readiness?.dbMigrationAllowed === false &&
      shadowHistoryReview.readiness?.publicUiAllowed === false,
    clearanceSequenceStillOrdered:
      clearanceSequence.readiness?.readyForSequentialInternalGateReview === true &&
      clearanceSequence.readiness?.dryRunReplayExecutionResultRecorded !== true &&
      clearanceSequence.readiness?.shadowHistoryReviewResultRecorded !== true &&
      clearanceSequence.readiness?.liveGuardedAdapterReviewStarted === false &&
      clearanceSequence.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    executionResultFieldsReady: missingExecutionResultFields.length === 0,
    executionResultAssertionsReady: missingExecutionResultAssertions.length === 0,
    forbiddenExecutionResultContentReady: missingForbiddenExecutionResultContent.length === 0,
    architectureDocMentionsDryRunReplayExecutionResult:
      architectureDoc.includes("Trading Manual Order Permission Dry-Run Replay Execution Result Contract") &&
      architectureDoc.includes("manual_order_permission_dry_run_replay_execution_result"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerDryRunReplayExecutionResultRecordedNow: false,
    currentStepExecutesDryRunReplay: false,
    currentStepRecordsDryRunReplayExecutionResult: false,
    currentStepOpensShadowHistoryReview: false,
    currentStepSubmitsOrders: false,
    dryRunReplayRuntimeImplementationAllowed: false,
    shadowHistoryReviewAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionDryRunReplayExecutionResultContract =
    checks.riskGateReviewResultBoundaryReady &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewStillClosed &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.executionResultFieldsReady &&
    checks.executionResultAssertionsReady &&
    checks.forbiddenExecutionResultContentReady &&
    checks.architectureDocMentionsDryRunReplayExecutionResult &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6Z",
    scope: "manual_order_permission_dry_run_replay_execution_result",
    sourceFiles: {
      manualOrderPermissionRiskGateClearanceReviewResult: RISK_GATE_REVIEW_RESULT_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      dryRunReplayExecutionResultContractOnly: true,
      ownerDryRunReplayExecutionResultRecordedNow: false,
      currentStepExecutesDryRunReplay: false,
      currentStepRecordsDryRunReplayExecutionResult: false,
      currentStepOpensShadowHistoryReview: false,
      currentStepSubmitsOrders: false,
      dryRunReplayRuntimeImplementationAllowed: false,
      shadowHistoryReviewAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureDryRunReplayExecutionResultBoundary: {
      currentStepMayExecuteDryRunReplay: false,
      currentStepMayRecordDryRunReplayExecutionResult: false,
      currentStepMayOpenShadowHistoryReview: false,
      currentStepMaySubmitOrder: false,
      requiredExecutionResultFields: executionResultFields,
      requiredExecutionResultAssertions: executionResultAssertions,
      forbiddenExecutionResultContent,
      sampleRedactedShape: {
        dryRunReplayExecutionId: "dry_run_replay_execution_<opaque_id>",
        executionStatus: "passed_for_next_shadow_history_review_or_blocked",
        executedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        operatorHash: "hmac-sha256:<operator_hash>",
        riskGateClearanceReviewResultHash: "hmac-sha256:<risk_gate_review_result_hash>",
        orderIntentFixtureHash: "sha256:<order_intent_fixture_hash>",
        riskGateFixtureHash: "sha256:<risk_gate_fixture_hash>",
        paperLedgerStartSnapshotHash: "sha256:<paper_ledger_start_snapshot_hash>",
        paperLedgerExpectedSnapshotHash: "sha256:<paper_ledger_expected_snapshot_hash>",
        riskEventSummaryHash: "sha256:<risk_event_summary_hash>",
        blockedActionSummaryHash: "sha256:<blocked_action_summary_hash>",
        determinismProofHash: "sha256:<determinism_proof_hash>",
        auditEventHash: "hmac-sha256:<audit_event_hash>",
        redactionVersion: "v1",
        dryRunReplayExecutedNow: false,
        shadowHistoryReviewOpenedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
        dbMigrationAllowed: false,
        liveTradingAllowed: false,
      },
      promotionRules: [
        "future dry-run replay execution result can be recorded only after a separate owner/local dry-run replay review",
        "execution result must not record private packet paths, raw orders, raw provider payloads, raw balances, raw positions, or hash inputs",
        "execution result success still does not open shadow-history review in this contract",
        "execution result success still does not open provider calls, runtime routes, public UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      missingExecutionResultFields,
      missingExecutionResultAssertions,
      missingForbiddenExecutionResultContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      riskGateReviewResultStatus: statusOf(riskGateReviewResult),
      dryRunReplayContractStatus: statusOf(dryRunReplay),
      shadowHistoryReviewContractStatus: statusOf(shadowHistoryReview),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionDryRunReplayExecutionResultContract
        ? "manual_order_permission_dry_run_replay_execution_result_contract_ready_pending_owner_result_record"
        : "blocked_before_manual_order_permission_dry_run_replay_execution_result_contract",
      readyForManualOrderPermissionDryRunReplayExecutionResultContract,
      readyForShadowHistoryReviewAfterDryRun: false,
      ownerDryRunReplayExecutionResultRecordedNow: false,
      currentStepExecutesDryRunReplay: false,
      currentStepRecordsDryRunReplayExecutionResult: false,
      currentStepOpensShadowHistoryReview: false,
      currentStepSubmitsOrders: false,
      dryRunReplayRuntimeImplementationAllowed: false,
      shadowHistoryReviewAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_dry_run_replay_execution_result",
        "owner_redacted_risk_gate_clearance_review_result",
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_manual_order_permission_import_result",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.riskGateReviewResultBoundaryReady
          ? []
          : ["manual_order_permission_risk_gate_clearance_review_result_contract_not_ready"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewStillClosed ? [] : ["shadow_history_review_contract_not_closed"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingExecutionResultFields.map((field) => `missing_dry_run_replay_execution_result_field_${field}`),
        ...missingExecutionResultAssertions.map(
          (assertion) => `missing_dry_run_replay_execution_result_assertion_${assertion}`,
        ),
        ...missingForbiddenExecutionResultContent.map(
          (content) => `missing_forbidden_dry_run_replay_execution_result_content_${content}`,
        ),
        ...(checks.architectureDocMentionsDryRunReplayExecutionResult
          ? []
          : ["architecture_doc_missing_dry_run_replay_execution_result_contract"]),
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
    console.log("[generate-trading-manual-order-permission-dry-run-replay-execution-result-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-dry-run-replay-execution-result-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-manual-order-permission-dry-run-replay-execution-result-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

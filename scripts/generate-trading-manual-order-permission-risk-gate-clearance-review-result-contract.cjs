const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json",
);
const RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_supply_gate_contract.json",
);
const RISK_GATE_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_preflight_contract.json",
);
const KILL_SWITCH_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_receipt_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-risk-gate-clearance-review-result-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_RISK_GATE_REVIEW_RESULT_FIELDS = [
  "riskGateClearanceReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "killSwitchClearanceReviewReceiptHash",
  "manualOrderPermissionImportResultHash",
  "riskLimitsPolicyHash",
  "allowedSymbolsReviewHash",
  "blockedInstrumentsReviewHash",
  "auditEventHash",
  "redactionVersion",
  "riskGateClearedNow",
  "dryRunReplayOpenedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const REQUIRED_RISK_GATE_REVIEW_RESULT_ASSERTIONS = [
  "review_result_is_redacted_only",
  "review_status_must_be_approved_or_blocked",
  "review_result_records_hashes_not_paths",
  "risk_gate_cleared_now_must_remain_false_in_contract",
  "dry_run_replay_opened_now_must_remain_false_in_contract",
  "clearance_result_cannot_enable_provider_calls",
  "clearance_result_cannot_enable_order_submission",
  "clearance_result_cannot_open_runtime_route",
  "clearance_result_cannot_open_public_ui",
  "clearance_result_cannot_open_db_migration",
  "clearance_result_cannot_open_live_trading",
  "separate_dry_run_replay_execution_result_required",
];
const FORBIDDEN_RISK_GATE_REVIEW_RESULT_CONTENT = [
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
  "validator_stdout_with_raw_values",
  "validator_stderr_with_raw_values",
  "packet_hash_inputs",
  "risk_gate_clearance_payload",
  "risk_gate_clearance_hash_inputs",
  "dry_run_replay_payload",
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
  const resultSupplyGate = readJson(RESULT_SUPPLY_GATE_PATH);
  const reviewPreflight = readJson(RISK_GATE_REVIEW_PREFLIGHT_PATH);
  const killSwitchReceipt = readJson(KILL_SWITCH_RECEIPT_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultFields = [...REQUIRED_RISK_GATE_REVIEW_RESULT_FIELDS];
  const reviewResultAssertions = [...REQUIRED_RISK_GATE_REVIEW_RESULT_ASSERTIONS];
  const forbiddenReviewResultContent = [...FORBIDDEN_RISK_GATE_REVIEW_RESULT_CONTENT];
  const missingReviewResultFields = missingValues(reviewResultFields, REQUIRED_RISK_GATE_REVIEW_RESULT_FIELDS);
  const missingReviewResultAssertions = missingValues(
    reviewResultAssertions,
    REQUIRED_RISK_GATE_REVIEW_RESULT_ASSERTIONS,
  );
  const missingForbiddenReviewResultContent = missingValues(
    forbiddenReviewResultContent,
    FORBIDDEN_RISK_GATE_REVIEW_RESULT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    riskGateReviewResultContractOnly: true,
    resultSupplyGateReady:
      resultSupplyGate.readiness?.readyForManualOrderPermissionRiskGateClearanceReviewResultSupply === true &&
      resultSupplyGate.readiness?.readyForRiskGateClearanceReviewResultRecording === false &&
      resultSupplyGate.readiness?.ownerRiskGateClearanceReviewResultSuppliedNow === false &&
      resultSupplyGate.readiness?.currentStepReadsPrivateEvidence === false &&
      resultSupplyGate.readiness?.currentStepRecordsRiskSnapshot === false &&
      resultSupplyGate.readiness?.currentStepRecordsRiskGateClearanceResult === false &&
      resultSupplyGate.readiness?.currentStepOpensDryRunReplay === false &&
      resultSupplyGate.readiness?.orderSubmissionAllowed === false,
    reviewPreflightStillClosed:
      reviewPreflight.readiness?.readyForManualOrderPermissionRiskGateClearanceReviewPreflight === true &&
      reviewPreflight.readiness?.currentStepReadsPrivateEvidence === false &&
      reviewPreflight.readiness?.currentStepRecordsRiskSnapshot === false &&
      reviewPreflight.readiness?.currentStepRecordsRiskGateClearanceResult === false &&
      reviewPreflight.readiness?.currentStepOpensDryRunReplay === false &&
      reviewPreflight.readiness?.orderSubmissionAllowed === false,
    killSwitchReceiptBoundaryReady:
      killSwitchReceipt.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewResultReceipt === true &&
      killSwitchReceipt.readiness?.currentStepOpensRiskGateReview === false &&
      killSwitchReceipt.readiness?.providerCallsAllowed === false &&
      killSwitchReceipt.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractStillClosed:
      riskGateClearance.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearance.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearance.readiness?.providerCallsAllowed === false &&
      riskGateClearance.readiness?.orderSubmissionAllowed === false &&
      riskGateClearance.readiness?.dbMigrationAllowed === false &&
      riskGateClearance.readiness?.publicUiAllowed === false,
    clearanceSequenceStillOrdered:
      clearanceSequence.readiness?.readyForSequentialInternalGateReview === true &&
      clearanceSequence.readiness?.validationReceiptEvidenceRecorded === false &&
      clearanceSequence.readiness?.allClearanceResultsRecorded === false &&
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
    architectureDocMentionsRiskGateReviewResult:
      architectureDoc.includes("Trading Manual Order Permission Risk Gate Clearance Review Result Contract") &&
      architectureDoc.includes("manual_order_permission_risk_gate_clearance_review_result"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRiskGateClearanceReviewResultRecordedNow: false,
    currentStepReadsPrivateEvidence: false,
    currentStepRecordsRiskSnapshot: false,
    currentStepRecordsRiskGateClearanceResult: false,
    currentStepOpensDryRunReplay: false,
    currentStepSubmitsOrders: false,
    riskGateClearanceRuntimeImplementationAllowed: false,
    dryRunReplayAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionRiskGateClearanceReviewResultContract =
    checks.resultSupplyGateReady &&
    checks.reviewPreflightStillClosed &&
    checks.killSwitchReceiptBoundaryReady &&
    checks.riskGateClearanceContractStillClosed &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.reviewResultFieldsReady &&
    checks.reviewResultAssertionsReady &&
    checks.forbiddenReviewResultContentReady &&
    checks.architectureDocMentionsRiskGateReviewResult &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6Y",
    scope: "manual_order_permission_risk_gate_clearance_review_result",
    sourceFiles: {
      manualOrderPermissionRiskGateClearanceReviewResultSupplyGate: RESULT_SUPPLY_GATE_PATH,
      manualOrderPermissionRiskGateClearanceReviewPreflight: RISK_GATE_REVIEW_PREFLIGHT_PATH,
      manualOrderPermissionKillSwitchClearanceReviewResultReceipt: KILL_SWITCH_RECEIPT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      riskGateReviewResultContractOnly: true,
      ownerRiskGateClearanceReviewResultRecordedNow: false,
      currentStepReadsPrivateEvidence: false,
      currentStepRecordsRiskSnapshot: false,
      currentStepRecordsRiskGateClearanceResult: false,
      currentStepOpensDryRunReplay: false,
      currentStepSubmitsOrders: false,
      riskGateClearanceRuntimeImplementationAllowed: false,
      dryRunReplayAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureRiskGateClearanceReviewResultBoundary: {
      currentStepMayReadPrivateEvidence: false,
      currentStepMayRecordRiskSnapshot: false,
      currentStepMayRecordRiskGateClearanceResult: false,
      currentStepMayOpenDryRunReplay: false,
      currentStepMaySubmitOrder: false,
      requiredReviewResultFields: reviewResultFields,
      requiredReviewResultAssertions: reviewResultAssertions,
      forbiddenReviewResultContent,
      sampleRedactedShape: {
        riskGateClearanceReviewId: "risk_gate_clearance_review_<opaque_id>",
        reviewStatus: "approved_for_next_dry_run_replay_or_blocked",
        reviewedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        reviewerHash: "hmac-sha256:<reviewer_hash>",
        killSwitchClearanceReviewReceiptHash: "hmac-sha256:<kill_switch_receipt_hash>",
        manualOrderPermissionImportResultHash: "hmac-sha256:<permission_import_result_hash>",
        riskLimitsPolicyHash: "sha256:<risk_limits_policy_hash>",
        allowedSymbolsReviewHash: "hmac-sha256:<allowed_symbols_review_hash>",
        blockedInstrumentsReviewHash: "hmac-sha256:<blocked_instruments_review_hash>",
        auditEventHash: "hmac-sha256:<audit_event_hash>",
        redactionVersion: "v1",
        riskGateClearedNow: false,
        dryRunReplayOpenedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
        dbMigrationAllowed: false,
        liveTradingAllowed: false,
      },
      promotionRules: [
        "future risk-gate clearance review result can be recorded only after owner-supplied redacted result review",
        "review result must not record private packet paths, raw snapshots, raw balances, raw positions, hash inputs, credentials, or account identifiers",
        "review result success still does not open dry-run replay execution in this contract",
        "review result success still does not open provider calls, runtime routes, public UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      missingReviewResultFields,
      missingReviewResultAssertions,
      missingForbiddenReviewResultContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      resultSupplyGateStatus: statusOf(resultSupplyGate),
      riskGateReviewPreflightStatus: statusOf(reviewPreflight),
      killSwitchReceiptStatus: statusOf(killSwitchReceipt),
      riskGateClearanceContractStatus: statusOf(riskGateClearance),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionRiskGateClearanceReviewResultContract
        ? "manual_order_permission_risk_gate_clearance_review_result_contract_ready_pending_owner_result_record"
        : "blocked_before_manual_order_permission_risk_gate_clearance_review_result_contract",
      readyForManualOrderPermissionRiskGateClearanceReviewResultContract,
      readyForDryRunReplayAfterRiskGate: false,
      ownerRiskGateClearanceReviewResultRecordedNow: false,
      currentStepReadsPrivateEvidence: false,
      currentStepRecordsRiskSnapshot: false,
      currentStepRecordsRiskGateClearanceResult: false,
      currentStepOpensDryRunReplay: false,
      currentStepSubmitsOrders: false,
      riskGateClearanceRuntimeImplementationAllowed: false,
      dryRunReplayAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_risk_gate_clearance_review_result",
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_manual_order_permission_import_result",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.resultSupplyGateReady
          ? []
          : ["manual_order_permission_risk_gate_clearance_review_result_supply_gate_not_ready"]),
        ...(checks.reviewPreflightStillClosed
          ? []
          : ["manual_order_permission_risk_gate_clearance_review_preflight_not_closed"]),
        ...(checks.killSwitchReceiptBoundaryReady
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_result_receipt_boundary_not_ready"]),
        ...(checks.riskGateClearanceContractStillClosed ? [] : ["risk_gate_clearance_contract_not_closed"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReviewResultFields.map((field) => `missing_risk_gate_review_result_field_${field}`),
        ...missingReviewResultAssertions.map((assertion) => `missing_risk_gate_review_result_assertion_${assertion}`),
        ...missingForbiddenReviewResultContent.map(
          (content) => `missing_forbidden_risk_gate_review_result_content_${content}`,
        ),
        ...(checks.architectureDocMentionsRiskGateReviewResult
          ? []
          : ["architecture_doc_missing_risk_gate_clearance_review_result_contract"]),
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
    console.log("[generate-trading-manual-order-permission-risk-gate-clearance-review-result-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-risk-gate-clearance-review-result-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-manual-order-permission-risk-gate-clearance-review-result-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

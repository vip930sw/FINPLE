const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_receipt_contract.json",
);
const KILL_SWITCH_REVIEW_RESULT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_contract.json",
);
const RECORDING_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_recording_preflight_contract.json",
);
const KILL_SWITCH_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
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

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-kill-switch-clearance-review-result-receipt-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_RECEIPT_FIELDS = [
  "killSwitchClearanceReviewReceiptId",
  "receiptStatus",
  "recordedAt",
  "recorderHash",
  "clearanceReviewResultHash",
  "permissionImportResultHash",
  "killSwitchPolicyHash",
  "redactionVersion",
  "privatePathsRecorded",
  "rawValuesRecorded",
  "hashInputsRecorded",
  "killSwitchClearedNow",
  "riskGateReviewOpenedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const REQUIRED_RECEIPT_ASSERTIONS = [
  "receipt_is_redacted_only",
  "receipt_records_review_result_hash_not_path",
  "receipt_does_not_record_private_packet_path",
  "receipt_does_not_record_raw_values",
  "receipt_does_not_record_hash_inputs",
  "receipt_does_not_clear_kill_switch",
  "receipt_does_not_open_risk_gate_review",
  "receipt_does_not_enable_provider_calls",
  "receipt_does_not_enable_order_submission",
  "receipt_does_not_create_runtime_route",
  "receipt_does_not_create_public_ui",
  "receipt_does_not_write_database",
  "receipt_requires_separate_risk_gate_clearance_review",
];
const FORBIDDEN_RECEIPT_CONTENT = [
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
  "validator_stdout_with_raw_values",
  "validator_stderr_with_raw_values",
  "packet_hash_inputs",
  "raw_packet_hash_input",
  "validation_result_payload",
  "validation_receipt_payload",
  "review_result_payload",
  "permission_import_payload",
  "permission_import_result_payload",
  "kill_switch_clearance_payload",
  "kill_switch_clearance_hash_inputs",
  "kill_switch_override_payload",
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
  path.join("server", "src", "services", "tradingKillSwitch.js"),
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
  const reviewResultContract = readJson(KILL_SWITCH_REVIEW_RESULT_CONTRACT_PATH);
  const recordingPreflight = readJson(RECORDING_PREFLIGHT_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const receiptFields = [...REQUIRED_RECEIPT_FIELDS];
  const receiptAssertions = [...REQUIRED_RECEIPT_ASSERTIONS];
  const forbiddenReceiptContent = [...FORBIDDEN_RECEIPT_CONTENT];
  const missingReceiptFields = missingValues(receiptFields, REQUIRED_RECEIPT_FIELDS);
  const missingReceiptAssertions = missingValues(receiptAssertions, REQUIRED_RECEIPT_ASSERTIONS);
  const missingForbiddenReceiptContent = missingValues(forbiddenReceiptContent, FORBIDDEN_RECEIPT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    receiptBoundaryOnly: true,
    killSwitchReviewResultContractReady:
      reviewResultContract.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewResultContract === true &&
      reviewResultContract.readiness?.ownerKillSwitchClearanceReviewResultRecordedNow === false &&
      reviewResultContract.readiness?.currentStepReadsClearanceResult === false &&
      reviewResultContract.readiness?.currentStepRecordsClearanceResult === false &&
      reviewResultContract.readiness?.currentStepClearsKillSwitch === false &&
      reviewResultContract.readiness?.currentStepOpensRiskGateReview === false &&
      reviewResultContract.readiness?.orderSubmissionAllowed === false,
    recordingPreflightStillClosed:
      recordingPreflight.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight ===
        true &&
      recordingPreflight.readiness?.currentStepReadsClearanceResult === false &&
      recordingPreflight.readiness?.currentStepRecordsClearanceResult === false &&
      recordingPreflight.readiness?.currentStepClearsKillSwitch === false &&
      recordingPreflight.readiness?.currentStepOpensRiskGateReview === false &&
      recordingPreflight.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractStillClosed:
      killSwitchClearance.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearance.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearance.currentState?.killSwitchClearNow === false &&
      killSwitchClearance.readiness?.providerCallsAllowed === false &&
      killSwitchClearance.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractStillClosed:
      riskGateClearance.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearance.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearance.readiness?.providerCallsAllowed === false &&
      riskGateClearance.readiness?.orderSubmissionAllowed === false,
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
    receiptFieldsReady: missingReceiptFields.length === 0,
    receiptAssertionsReady: missingReceiptAssertions.length === 0,
    forbiddenReceiptContentReady: missingForbiddenReceiptContent.length === 0,
    architectureDocMentionsReceipt:
      architectureDoc.includes("Trading Manual Order Permission Kill Switch Clearance Review Result Receipt") &&
      architectureDoc.includes("manual_order_permission_kill_switch_clearance_review_result_receipt"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerKillSwitchClearanceReviewResultReceiptRecordedNow: false,
    currentStepReadsClearanceResult: false,
    currentStepRecordsClearanceResultReceipt: false,
    currentStepClearsKillSwitch: false,
    currentStepOpensRiskGateReview: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionKillSwitchClearanceReviewResultReceipt =
    checks.killSwitchReviewResultContractReady &&
    checks.recordingPreflightStillClosed &&
    checks.killSwitchClearanceContractStillClosed &&
    checks.riskGateClearanceContractStillClosed &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.receiptFieldsReady &&
    checks.receiptAssertionsReady &&
    checks.forbiddenReceiptContentReady &&
    checks.architectureDocMentionsReceipt &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6V",
    scope: "manual_order_permission_kill_switch_clearance_review_result_receipt",
    sourceFiles: {
      manualOrderPermissionKillSwitchClearanceReviewResultContract: KILL_SWITCH_REVIEW_RESULT_CONTRACT_PATH,
      manualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight: RECORDING_PREFLIGHT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      receiptBoundaryOnly: true,
      ownerKillSwitchClearanceReviewResultReceiptRecordedNow: false,
      currentStepReadsClearanceResult: false,
      currentStepRecordsClearanceResultReceipt: false,
      currentStepClearsKillSwitch: false,
      currentStepOpensRiskGateReview: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureKillSwitchClearanceReviewResultReceiptBoundary: {
      currentStepMayReadClearanceResult: false,
      currentStepMayRecordReceipt: false,
      currentStepMayClearKillSwitch: false,
      currentStepMayOpenRiskGateReview: false,
      currentStepMaySubmitOrder: false,
      requiredReceiptFields: receiptFields,
      requiredReceiptAssertions: receiptAssertions,
      forbiddenReceiptContent,
      sampleRedactedShape: {
        killSwitchClearanceReviewReceiptId: "kill_switch_clearance_review_receipt_<opaque_id>",
        receiptStatus: "accepted_for_risk_gate_review_or_blocked",
        recordedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        recorderHash: "hmac-sha256:<recorder_hash>",
        clearanceReviewResultHash: "hmac-sha256:<clearance_review_result_hash>",
        permissionImportResultHash: "hmac-sha256:<permission_import_result_hash>",
        killSwitchPolicyHash: "sha256:<kill_switch_policy_hash>",
        redactionVersion: "v1",
        privatePathsRecorded: false,
        rawValuesRecorded: false,
        hashInputsRecorded: false,
        killSwitchClearedNow: false,
        riskGateReviewOpenedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
        dbMigrationAllowed: false,
        liveTradingAllowed: false,
      },
      promotionRules: [
        "future receipt can be recorded only after owner-supplied redacted kill-switch clearance review result exists outside repo commits",
        "receipt records hash references, not private packet paths, raw values, hash inputs, credentials, or account identifiers",
        "receipt success still does not clear the kill switch in runtime",
        "receipt success still does not open risk-gate review, provider calls, runtime routes, public UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      missingReceiptFields,
      missingReceiptAssertions,
      missingForbiddenReceiptContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      killSwitchReviewResultContractStatus: statusOf(reviewResultContract),
      recordingPreflightStatus: statusOf(recordingPreflight),
      killSwitchClearanceContractStatus: statusOf(killSwitchClearance),
      riskGateClearanceContractStatus: statusOf(riskGateClearance),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionKillSwitchClearanceReviewResultReceipt
        ? "manual_order_permission_kill_switch_clearance_review_result_receipt_contract_ready_pending_owner_result"
        : "blocked_before_manual_order_permission_kill_switch_clearance_review_result_receipt",
      readyForManualOrderPermissionKillSwitchClearanceReviewResultReceipt,
      readyForRiskGateClearanceReviewAfterKillSwitch: false,
      ownerKillSwitchClearanceReviewResultReceiptRecordedNow: false,
      currentStepReadsClearanceResult: false,
      currentStepRecordsClearanceResultReceipt: false,
      currentStepClearsKillSwitch: false,
      currentStepOpensRiskGateReview: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_manual_order_permission_import_result",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.killSwitchReviewResultContractReady
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_result_contract_not_ready"]),
        ...(checks.recordingPreflightStillClosed
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_result_recording_preflight_not_closed"]),
        ...(checks.killSwitchClearanceContractStillClosed ? [] : ["kill_switch_clearance_contract_not_closed"]),
        ...(checks.riskGateClearanceContractStillClosed ? [] : ["risk_gate_clearance_contract_not_closed"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReceiptFields.map((field) => `missing_kill_switch_review_result_receipt_field_${field}`),
        ...missingReceiptAssertions.map(
          (assertion) => `missing_kill_switch_review_result_receipt_assertion_${assertion}`,
        ),
        ...missingForbiddenReceiptContent.map(
          (content) => `missing_forbidden_kill_switch_review_result_receipt_content_${content}`,
        ),
        ...(checks.architectureDocMentionsReceipt
          ? []
          : ["architecture_doc_missing_kill_switch_clearance_review_result_receipt"]),
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
    console.log("[generate-trading-manual-order-permission-kill-switch-clearance-review-result-receipt-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-kill-switch-clearance-review-result-receipt-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-manual-order-permission-kill-switch-clearance-review-result-receipt-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_contract.json",
);
const RECORDING_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_recording_preflight_contract.json",
);
const RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_supply_gate_contract.json",
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
  "trading-lab-step116-manual-order-permission-kill-switch-clearance-review-result-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_KILL_SWITCH_REVIEW_RESULT_FIELDS = [
  "killSwitchClearanceReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "permissionImportResultHash",
  "killSwitchPolicyHash",
  "manualOperatorHash",
  "riskGateStatusHash",
  "auditEventHash",
  "redactionVersion",
  "killSwitchClearedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const REQUIRED_KILL_SWITCH_REVIEW_RESULT_ASSERTIONS = [
  "review_result_is_redacted_only",
  "review_status_must_be_approved_or_blocked",
  "review_result_records_hashes_not_paths",
  "kill_switch_cleared_now_must_remain_false_in_contract",
  "clearance_result_cannot_enable_provider_calls",
  "clearance_result_cannot_enable_order_submission",
  "clearance_result_cannot_open_runtime_route",
  "clearance_result_cannot_open_public_ui",
  "clearance_result_cannot_open_db_migration",
  "clearance_result_cannot_open_live_trading",
  "risk_gate_review_still_closed",
  "separate_risk_gate_clearance_review_result_required",
];
const FORBIDDEN_KILL_SWITCH_REVIEW_RESULT_CONTENT = [
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
  const recordingPreflight = readJson(RECORDING_PREFLIGHT_PATH);
  const resultSupplyGate = readJson(RESULT_SUPPLY_GATE_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultFields = [...REQUIRED_KILL_SWITCH_REVIEW_RESULT_FIELDS];
  const reviewResultAssertions = [...REQUIRED_KILL_SWITCH_REVIEW_RESULT_ASSERTIONS];
  const forbiddenReviewResultContent = [...FORBIDDEN_KILL_SWITCH_REVIEW_RESULT_CONTENT];
  const missingReviewResultFields = missingValues(reviewResultFields, REQUIRED_KILL_SWITCH_REVIEW_RESULT_FIELDS);
  const missingReviewResultAssertions = missingValues(
    reviewResultAssertions,
    REQUIRED_KILL_SWITCH_REVIEW_RESULT_ASSERTIONS,
  );
  const missingForbiddenReviewResultContent = missingValues(
    forbiddenReviewResultContent,
    FORBIDDEN_KILL_SWITCH_REVIEW_RESULT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    killSwitchReviewResultContractOnly: true,
    recordingPreflightReady:
      recordingPreflight.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight ===
        true &&
      recordingPreflight.readiness?.readyForKillSwitchClearanceReviewResultContract === false &&
      recordingPreflight.readiness?.currentStepReadsClearanceResult === false &&
      recordingPreflight.readiness?.currentStepRecordsClearanceResult === false &&
      recordingPreflight.readiness?.currentStepClearsKillSwitch === false &&
      recordingPreflight.readiness?.currentStepOpensRiskGateReview === false &&
      recordingPreflight.readiness?.orderSubmissionAllowed === false,
    resultSupplyGateStillClosed:
      resultSupplyGate.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewResultSupply === true &&
      resultSupplyGate.readiness?.ownerKillSwitchClearanceReviewResultSuppliedNow === false &&
      resultSupplyGate.readiness?.currentStepReadsClearanceResult === false &&
      resultSupplyGate.readiness?.currentStepRecordsClearanceResult === false &&
      resultSupplyGate.readiness?.currentStepClearsKillSwitch === false &&
      resultSupplyGate.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractStillClosed:
      killSwitchClearance.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearance.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearance.currentState?.killSwitchClearNow === false &&
      killSwitchClearance.readiness?.providerCallsAllowed === false &&
      killSwitchClearance.readiness?.orderSubmissionAllowed === false &&
      killSwitchClearance.readiness?.dbMigrationAllowed === false &&
      killSwitchClearance.readiness?.publicUiAllowed === false,
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
    architectureDocMentionsKillSwitchReviewResult:
      architectureDoc.includes("Trading Manual Order Permission Kill Switch Clearance Review Result") &&
      architectureDoc.includes("manual_order_permission_kill_switch_clearance_review_result"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerKillSwitchClearanceReviewResultRecordedNow: false,
    currentStepReadsClearanceResult: false,
    currentStepRecordsClearanceResult: false,
    currentStepClearsKillSwitch: false,
    currentStepOpensRiskGateReview: false,
    killSwitchRuntimeImplementationAllowed: false,
    riskGateReviewAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionKillSwitchClearanceReviewResultContract =
    checks.recordingPreflightReady &&
    checks.resultSupplyGateStillClosed &&
    checks.killSwitchClearanceContractStillClosed &&
    checks.riskGateClearanceContractStillClosed &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.reviewResultFieldsReady &&
    checks.reviewResultAssertionsReady &&
    checks.forbiddenReviewResultContentReady &&
    checks.architectureDocMentionsKillSwitchReviewResult &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6U",
    scope: "manual_order_permission_kill_switch_clearance_review_result",
    sourceFiles: {
      manualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight: RECORDING_PREFLIGHT_PATH,
      manualOrderPermissionKillSwitchClearanceReviewResultSupplyGate: RESULT_SUPPLY_GATE_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      killSwitchReviewResultContractOnly: true,
      ownerKillSwitchClearanceReviewResultRecordedNow: false,
      currentStepReadsClearanceResult: false,
      currentStepRecordsClearanceResult: false,
      currentStepClearsKillSwitch: false,
      currentStepOpensRiskGateReview: false,
      killSwitchRuntimeImplementationAllowed: false,
      riskGateReviewAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureKillSwitchClearanceReviewResultBoundary: {
      currentStepMayReadClearanceResult: false,
      currentStepMayRecordClearanceResult: false,
      currentStepMayClearKillSwitch: false,
      currentStepMayOpenRiskGateReview: false,
      currentStepMaySubmitOrder: false,
      requiredReviewResultFields: reviewResultFields,
      requiredReviewResultAssertions: reviewResultAssertions,
      forbiddenReviewResultContent,
      sampleRedactedShape: {
        killSwitchClearanceReviewId: "kill_switch_clearance_review_<opaque_id>",
        reviewStatus: "approved_for_next_risk_gate_review_or_blocked",
        reviewedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        reviewerHash: "hmac-sha256:<reviewer_hash>",
        permissionImportResultHash: "hmac-sha256:<permission_import_result_hash>",
        killSwitchPolicyHash: "sha256:<kill_switch_policy_hash>",
        manualOperatorHash: "hmac-sha256:<manual_operator_hash>",
        riskGateStatusHash: "sha256:<risk_gate_status_hash>",
        auditEventHash: "hmac-sha256:<audit_event_hash>",
        redactionVersion: "v1",
        killSwitchClearedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
        dbMigrationAllowed: false,
        liveTradingAllowed: false,
      },
      promotionRules: [
        "future kill-switch clearance review result can be recorded only after owner-supplied redacted result review",
        "review result must not record private packet paths, raw values, hash inputs, credentials, or account identifiers",
        "review result success still does not clear the kill switch in runtime",
        "review result success still does not open risk-gate review, provider calls, runtime routes, public UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      missingReviewResultFields,
      missingReviewResultAssertions,
      missingForbiddenReviewResultContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      recordingPreflightStatus: statusOf(recordingPreflight),
      resultSupplyGateStatus: statusOf(resultSupplyGate),
      killSwitchClearanceContractStatus: statusOf(killSwitchClearance),
      riskGateClearanceContractStatus: statusOf(riskGateClearance),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionKillSwitchClearanceReviewResultContract
        ? "manual_order_permission_kill_switch_clearance_review_result_contract_ready_pending_owner_result_record"
        : "blocked_before_manual_order_permission_kill_switch_clearance_review_result_contract",
      readyForManualOrderPermissionKillSwitchClearanceReviewResultContract,
      readyForRiskGateClearanceReviewAfterKillSwitch: false,
      ownerKillSwitchClearanceReviewResultRecordedNow: false,
      currentStepReadsClearanceResult: false,
      currentStepRecordsClearanceResult: false,
      currentStepClearsKillSwitch: false,
      currentStepOpensRiskGateReview: false,
      killSwitchRuntimeImplementationAllowed: false,
      riskGateReviewAllowedNow: false,
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
        ...(checks.recordingPreflightReady
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_result_recording_preflight_not_ready"]),
        ...(checks.resultSupplyGateStillClosed
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_result_supply_gate_not_closed"]),
        ...(checks.killSwitchClearanceContractStillClosed ? [] : ["kill_switch_clearance_contract_not_closed"]),
        ...(checks.riskGateClearanceContractStillClosed ? [] : ["risk_gate_clearance_contract_not_closed"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReviewResultFields.map((field) => `missing_kill_switch_review_result_field_${field}`),
        ...missingReviewResultAssertions.map(
          (assertion) => `missing_kill_switch_review_result_assertion_${assertion}`,
        ),
        ...missingForbiddenReviewResultContent.map(
          (content) => `missing_forbidden_kill_switch_review_result_content_${content}`,
        ),
        ...(checks.architectureDocMentionsKillSwitchReviewResult
          ? []
          : ["architecture_doc_missing_kill_switch_clearance_review_result"]),
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
    console.log("[generate-trading-manual-order-permission-kill-switch-clearance-review-result-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-kill-switch-clearance-review-result-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-manual-order-permission-kill-switch-clearance-review-result-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();

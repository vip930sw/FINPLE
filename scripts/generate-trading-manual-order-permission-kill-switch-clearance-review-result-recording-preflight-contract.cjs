const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_recording_preflight_contract.json",
);
const RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_supply_gate_contract.json",
);
const KILL_SWITCH_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_preflight_contract.json",
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
  "trading-lab-step116-manual-order-permission-kill-switch-clearance-review-result-recording-preflight-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_KILL_SWITCH_REVIEW_RESULT_RECORDING_PREFLIGHT_GATES = [
  "kill_switch_clearance_review_result_supply_gate_ready",
  "kill_switch_clearance_review_preflight_ready",
  "kill_switch_clearance_contract_ready",
  "risk_gate_clearance_contract_ready",
  "owner_kill_switch_clearance_review_result_required_later",
  "current_step_does_not_accept_clearance_result",
  "current_step_does_not_read_clearance_result",
  "current_step_does_not_record_clearance_result",
  "current_step_does_not_clear_kill_switch",
  "current_step_does_not_open_risk_gate_review",
  "current_step_does_not_submit_orders",
  "clearance_sequence_still_requires_ordered_results",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
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
const FORBIDDEN_KILL_SWITCH_REVIEW_RESULT_RECORDING_PREFLIGHT_CONTENT = [
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
  const resultSupplyGate = readJson(RESULT_SUPPLY_GATE_PATH);
  const killSwitchReviewPreflight = readJson(KILL_SWITCH_REVIEW_PREFLIGHT_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const killSwitchReviewResultRecordingPreflightGates = [
    ...REQUIRED_KILL_SWITCH_REVIEW_RESULT_RECORDING_PREFLIGHT_GATES,
  ];
  const requiredKillSwitchReviewResultFields = [...REQUIRED_KILL_SWITCH_REVIEW_RESULT_FIELDS];
  const forbiddenKillSwitchReviewResultRecordingPreflightContent = [
    ...FORBIDDEN_KILL_SWITCH_REVIEW_RESULT_RECORDING_PREFLIGHT_CONTENT,
  ];
  const missingKillSwitchReviewResultRecordingPreflightGates = missingValues(
    killSwitchReviewResultRecordingPreflightGates,
    REQUIRED_KILL_SWITCH_REVIEW_RESULT_RECORDING_PREFLIGHT_GATES,
  );
  const missingKillSwitchReviewResultFields = missingValues(
    requiredKillSwitchReviewResultFields,
    REQUIRED_KILL_SWITCH_REVIEW_RESULT_FIELDS,
  );
  const missingForbiddenKillSwitchReviewResultRecordingPreflightContent = missingValues(
    forbiddenKillSwitchReviewResultRecordingPreflightContent,
    FORBIDDEN_KILL_SWITCH_REVIEW_RESULT_RECORDING_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    killSwitchReviewResultRecordingPreflightOnly: true,
    resultSupplyGateReady:
      resultSupplyGate.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewResultSupply === true &&
      resultSupplyGate.readiness?.readyForKillSwitchClearanceReviewResultRecording === false &&
      resultSupplyGate.readiness?.ownerKillSwitchClearanceReviewResultSuppliedNow === false &&
      resultSupplyGate.readiness?.currentStepAcceptsClearanceResult === false &&
      resultSupplyGate.readiness?.currentStepReadsClearanceResult === false &&
      resultSupplyGate.readiness?.currentStepRecordsClearanceResult === false &&
      resultSupplyGate.readiness?.currentStepClearsKillSwitch === false &&
      resultSupplyGate.readiness?.orderSubmissionAllowed === false,
    killSwitchReviewPreflightReady:
      killSwitchReviewPreflight.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewPreflight === true &&
      killSwitchReviewPreflight.readiness?.currentStepClearsKillSwitch === false &&
      killSwitchReviewPreflight.readiness?.currentStepRecordsClearanceResult === false &&
      killSwitchReviewPreflight.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearance.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearance.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearance.currentState?.killSwitchClearNow === false &&
      killSwitchClearance.readiness?.providerCallsAllowed === false &&
      killSwitchClearance.readiness?.orderSubmissionAllowed === false &&
      killSwitchClearance.readiness?.dbMigrationAllowed === false &&
      killSwitchClearance.readiness?.publicUiAllowed === false,
    riskGateClearanceContractReady:
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
    killSwitchReviewResultRecordingPreflightGatesReady:
      missingKillSwitchReviewResultRecordingPreflightGates.length === 0,
    killSwitchReviewResultFieldsReady: missingKillSwitchReviewResultFields.length === 0,
    forbiddenKillSwitchReviewResultRecordingPreflightContentReady:
      missingForbiddenKillSwitchReviewResultRecordingPreflightContent.length === 0,
    architectureDocMentionsKillSwitchReviewResultRecordingPreflight:
      architectureDoc.includes("Trading Manual Order Permission Kill Switch Clearance Review Result Recording Preflight") &&
      architectureDoc.includes("manual_order_permission_kill_switch_clearance_review_result_recording_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerKillSwitchClearanceReviewResultSuppliedNow: false,
    currentStepAcceptsClearanceResult: false,
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

  const readyForManualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight =
    checks.resultSupplyGateReady &&
    checks.killSwitchReviewPreflightReady &&
    checks.killSwitchClearanceContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.killSwitchReviewResultRecordingPreflightGatesReady &&
    checks.killSwitchReviewResultFieldsReady &&
    checks.forbiddenKillSwitchReviewResultRecordingPreflightContentReady &&
    checks.architectureDocMentionsKillSwitchReviewResultRecordingPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6T",
    scope: "manual_order_permission_kill_switch_clearance_review_result_recording_preflight",
    sourceFiles: {
      manualOrderPermissionKillSwitchClearanceReviewResultSupplyGate: RESULT_SUPPLY_GATE_PATH,
      manualOrderPermissionKillSwitchClearanceReviewPreflight: KILL_SWITCH_REVIEW_PREFLIGHT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      killSwitchReviewResultRecordingPreflightOnly: true,
      ownerKillSwitchClearanceReviewResultSuppliedNow: false,
      currentStepAcceptsClearanceResult: false,
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
    manualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight: {
      ownerKillSwitchClearanceReviewResultRequiredLater: true,
      currentStepMayAcceptClearanceResult: false,
      currentStepMayReadClearanceResult: false,
      currentStepMayRecordClearanceResult: false,
      currentStepMayClearKillSwitch: false,
      currentStepMayOpenRiskGateReview: false,
      currentStepMaySubmitOrder: false,
      nextAllowedAction:
        "after the owner supplies a redacted kill-switch clearance review result outside repo commits, record a separate kill-switch clearance review result contract without clearing the kill switch, opening risk-gate review, or opening order submission",
      killSwitchReviewResultRecordingPreflightGates,
      requiredKillSwitchReviewResultFields,
      forbiddenKillSwitchReviewResultRecordingPreflightContent,
    },
    checks,
    evidence: {
      missingKillSwitchReviewResultRecordingPreflightGates,
      missingKillSwitchReviewResultFields,
      missingForbiddenKillSwitchReviewResultRecordingPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      resultSupplyGateStatus: statusOf(resultSupplyGate),
      killSwitchReviewPreflightStatus: statusOf(killSwitchReviewPreflight),
      killSwitchClearanceContractStatus: statusOf(killSwitchClearance),
      riskGateClearanceContractStatus: statusOf(riskGateClearance),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight
        ? "manual_order_permission_kill_switch_clearance_review_result_recording_preflight_ready_pending_owner_result"
        : "blocked_before_manual_order_permission_kill_switch_clearance_review_result_recording_preflight",
      readyForManualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight,
      readyForKillSwitchClearanceReviewResultContract: false,
      readyForRiskGateClearanceReviewAfterKillSwitch: false,
      ownerKillSwitchClearanceReviewResultSuppliedNow: false,
      currentStepAcceptsClearanceResult: false,
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
        ...(checks.resultSupplyGateReady
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_result_supply_gate_not_ready"]),
        ...(checks.killSwitchReviewPreflightReady
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_preflight_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingKillSwitchReviewResultRecordingPreflightGates.map(
          (gate) => `missing_kill_switch_review_result_recording_preflight_gate_${gate}`,
        ),
        ...missingKillSwitchReviewResultFields.map((field) => `missing_kill_switch_review_result_field_${field}`),
        ...missingForbiddenKillSwitchReviewResultRecordingPreflightContent.map(
          (content) => `missing_forbidden_kill_switch_review_result_recording_preflight_content_${content}`,
        ),
        ...(checks.architectureDocMentionsKillSwitchReviewResultRecordingPreflight
          ? []
          : ["architecture_doc_missing_kill_switch_clearance_review_result_recording_preflight"]),
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
      "[generate-trading-manual-order-permission-kill-switch-clearance-review-result-recording-preflight-contract] ok",
    );
    console.log(
      `[generate-trading-manual-order-permission-kill-switch-clearance-review-result-recording-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log(
    "[generate-trading-manual-order-permission-kill-switch-clearance-review-result-recording-preflight-contract] wrote contract",
  );
  console.log(
    `[generate-trading-manual-order-permission-kill-switch-clearance-review-result-recording-preflight-contract] readyForManualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight=${parsed.readiness.readyForManualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight}`,
  );
}

main();

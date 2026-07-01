const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_preflight_contract.json",
);
const IMPORT_RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_result_supply_gate_contract.json",
);
const KILL_SWITCH_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
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
  "trading-lab-step116-manual-order-permission-kill-switch-clearance-review-preflight-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_KILL_SWITCH_REVIEW_PREFLIGHT_GATES = [
  "manual_order_permission_import_result_supply_gate_ready",
  "kill_switch_clearance_contract_ready",
  "owner_import_result_required_later",
  "owner_kill_switch_clearance_review_result_required_later",
  "current_step_does_not_read_import_result",
  "current_step_does_not_read_private_packet",
  "current_step_does_not_clear_kill_switch",
  "current_step_does_not_record_clearance_result",
  "current_step_does_not_implement_kill_switch_runtime",
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
const FORBIDDEN_KILL_SWITCH_REVIEW_PREFLIGHT_CONTENT = [
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
  const importResultSupplyGate = readJson(IMPORT_RESULT_SUPPLY_GATE_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const killSwitchReviewPreflightGates = [...REQUIRED_KILL_SWITCH_REVIEW_PREFLIGHT_GATES];
  const requiredKillSwitchReviewResultFields = [...REQUIRED_KILL_SWITCH_REVIEW_RESULT_FIELDS];
  const forbiddenKillSwitchReviewPreflightContent = [...FORBIDDEN_KILL_SWITCH_REVIEW_PREFLIGHT_CONTENT];
  const missingKillSwitchReviewPreflightGates = missingValues(
    killSwitchReviewPreflightGates,
    REQUIRED_KILL_SWITCH_REVIEW_PREFLIGHT_GATES,
  );
  const missingKillSwitchReviewResultFields = missingValues(
    requiredKillSwitchReviewResultFields,
    REQUIRED_KILL_SWITCH_REVIEW_RESULT_FIELDS,
  );
  const missingForbiddenKillSwitchReviewPreflightContent = missingValues(
    forbiddenKillSwitchReviewPreflightContent,
    FORBIDDEN_KILL_SWITCH_REVIEW_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    killSwitchReviewPreflightOnly: true,
    importResultSupplyGateReady:
      importResultSupplyGate.readiness?.readyForManualOrderPermissionImportResultSupply === true &&
      importResultSupplyGate.readiness?.readyForKillSwitchClearanceReviewAfterPermissionImport === false &&
      importResultSupplyGate.readiness?.ownerImportResultSuppliedNow === false &&
      importResultSupplyGate.readiness?.currentStepReadsImportResult === false &&
      importResultSupplyGate.readiness?.currentStepReadsPrivatePacket === false &&
      importResultSupplyGate.readiness?.permissionPacketImportedNow === false &&
      importResultSupplyGate.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearance.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearance.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearance.currentState?.killSwitchClearNow === false &&
      killSwitchClearance.readiness?.providerCallsAllowed === false &&
      killSwitchClearance.readiness?.orderSubmissionAllowed === false &&
      killSwitchClearance.readiness?.dbMigrationAllowed === false &&
      killSwitchClearance.readiness?.publicUiAllowed === false,
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
    killSwitchReviewPreflightGatesReady: missingKillSwitchReviewPreflightGates.length === 0,
    killSwitchReviewResultFieldsReady: missingKillSwitchReviewResultFields.length === 0,
    forbiddenKillSwitchReviewPreflightContentReady:
      missingForbiddenKillSwitchReviewPreflightContent.length === 0,
    architectureDocMentionsKillSwitchReviewPreflight:
      architectureDoc.includes("Trading Manual Order Permission Kill Switch Clearance Review Preflight") &&
      architectureDoc.includes("manual_order_permission_kill_switch_clearance_review_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerImportResultSuppliedNow: false,
    ownerKillSwitchClearanceReviewResultSuppliedNow: false,
    currentStepReadsImportResult: false,
    currentStepReadsPrivatePacket: false,
    currentStepClearsKillSwitch: false,
    currentStepRecordsClearanceResult: false,
    killSwitchRuntimeImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionKillSwitchClearanceReviewPreflight =
    checks.importResultSupplyGateReady &&
    checks.killSwitchClearanceContractReady &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.killSwitchReviewPreflightGatesReady &&
    checks.killSwitchReviewResultFieldsReady &&
    checks.forbiddenKillSwitchReviewPreflightContentReady &&
    checks.architectureDocMentionsKillSwitchReviewPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6R",
    scope: "manual_order_permission_kill_switch_clearance_review_preflight",
    sourceFiles: {
      manualOrderPermissionImportResultSupplyGate: IMPORT_RESULT_SUPPLY_GATE_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      killSwitchReviewPreflightOnly: true,
      ownerImportResultSuppliedNow: false,
      ownerKillSwitchClearanceReviewResultSuppliedNow: false,
      currentStepReadsImportResult: false,
      currentStepReadsPrivatePacket: false,
      currentStepClearsKillSwitch: false,
      currentStepRecordsClearanceResult: false,
      killSwitchRuntimeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    manualOrderPermissionKillSwitchClearanceReviewPreflight: {
      ownerImportResultRequiredLater: true,
      ownerKillSwitchClearanceReviewResultRequiredLater: true,
      currentStepMayReadImportResult: false,
      currentStepMayReadPrivatePacket: false,
      currentStepMayClearKillSwitch: false,
      currentStepMayRecordClearanceResult: false,
      currentStepMayImplementKillSwitchRuntime: false,
      currentStepMaySubmitOrder: false,
      nextAllowedAction:
        "after the owner supplies a redacted permission import result outside repo commits, record a separate kill-switch clearance review result supply gate without clearing the kill switch or opening order submission",
      killSwitchReviewPreflightGates,
      requiredKillSwitchReviewResultFields,
      forbiddenKillSwitchReviewPreflightContent,
    },
    checks,
    evidence: {
      missingKillSwitchReviewPreflightGates,
      missingKillSwitchReviewResultFields,
      missingForbiddenKillSwitchReviewPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      importResultSupplyGateStatus: statusOf(importResultSupplyGate),
      killSwitchClearanceContractStatus: statusOf(killSwitchClearance),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionKillSwitchClearanceReviewPreflight
        ? "manual_order_permission_kill_switch_clearance_review_preflight_ready_pending_import_result"
        : "blocked_before_manual_order_permission_kill_switch_clearance_review_preflight",
      readyForManualOrderPermissionKillSwitchClearanceReviewPreflight,
      readyForKillSwitchClearanceReviewResultSupply: false,
      readyForRiskGateClearanceReviewAfterKillSwitch: false,
      ownerImportResultSuppliedNow: false,
      ownerKillSwitchClearanceReviewResultSuppliedNow: false,
      currentStepReadsImportResult: false,
      currentStepReadsPrivatePacket: false,
      currentStepClearsKillSwitch: false,
      currentStepRecordsClearanceResult: false,
      killSwitchRuntimeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_manual_order_permission_import_result",
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.importResultSupplyGateReady ? [] : ["manual_order_permission_import_result_supply_gate_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingKillSwitchReviewPreflightGates.map(
          (gate) => `missing_kill_switch_review_preflight_gate_${gate}`,
        ),
        ...missingKillSwitchReviewResultFields.map((field) => `missing_kill_switch_review_result_field_${field}`),
        ...missingForbiddenKillSwitchReviewPreflightContent.map(
          (content) => `missing_forbidden_kill_switch_review_preflight_content_${content}`,
        ),
        ...(checks.architectureDocMentionsKillSwitchReviewPreflight
          ? []
          : ["architecture_doc_missing_kill_switch_clearance_review_preflight"]),
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
    console.log("[generate-trading-manual-order-permission-kill-switch-clearance-review-preflight-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-kill-switch-clearance-review-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-kill-switch-clearance-review-preflight-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-kill-switch-clearance-review-preflight-contract] readyForManualOrderPermissionKillSwitchClearanceReviewPreflight=${parsed.readiness.readyForManualOrderPermissionKillSwitchClearanceReviewPreflight}`,
  );
}

main();

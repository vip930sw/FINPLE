const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_result_recording_preflight_contract.json",
);
const RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_review_result_supply_gate_contract.json",
);
const RESULT_RECORDING_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_review_result_recording_preflight_contract.json",
);
const IMPORT_IMPLEMENTATION_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_review_contract.json",
);
const IMPORT_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-import-result-recording-preflight-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_IMPORT_RESULT_RECORDING_PREFLIGHT_GATES = [
  "import_implementation_review_result_supply_gate_ready",
  "import_implementation_review_result_recording_preflight_ready",
  "import_implementation_review_contract_ready",
  "import_review_preflight_ready",
  "owner_import_implementation_review_result_required_later",
  "owner_permission_packet_required_later",
  "current_step_does_not_read_review_result",
  "current_step_does_not_read_private_packet",
  "current_step_does_not_record_import_result",
  "current_step_does_not_import_permission_packet",
  "current_step_does_not_implement_import_service",
  "current_step_does_not_implement_order_adapter",
  "clearance_sequence_still_requires_ordered_results",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const REQUIRED_IMPORT_RESULT_FIELDS = [
  "permissionImportResultId",
  "reviewResultStatus",
  "recordedAt",
  "operatorHash",
  "importImplementationReviewResultHash",
  "permissionPacketShapeHash",
  "importPolicyHash",
  "redactionVersion",
  "permissionPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const FORBIDDEN_IMPORT_RESULT_RECORDING_PREFLIGHT_CONTENT = [
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
  "review_result_hash_inputs",
  "permission_import_payload",
  "permission_import_result_payload",
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
  const resultRecordingPreflight = readJson(RESULT_RECORDING_PREFLIGHT_PATH);
  const importImplementationReview = readJson(IMPORT_IMPLEMENTATION_REVIEW_PATH);
  const importReviewPreflight = readJson(IMPORT_REVIEW_PREFLIGHT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const importResultRecordingPreflightGates = [...REQUIRED_IMPORT_RESULT_RECORDING_PREFLIGHT_GATES];
  const requiredImportResultFields = [...REQUIRED_IMPORT_RESULT_FIELDS];
  const forbiddenImportResultRecordingPreflightContent = [...FORBIDDEN_IMPORT_RESULT_RECORDING_PREFLIGHT_CONTENT];
  const missingImportResultRecordingPreflightGates = missingValues(
    importResultRecordingPreflightGates,
    REQUIRED_IMPORT_RESULT_RECORDING_PREFLIGHT_GATES,
  );
  const missingImportResultFields = missingValues(requiredImportResultFields, REQUIRED_IMPORT_RESULT_FIELDS);
  const missingForbiddenImportResultRecordingPreflightContent = missingValues(
    forbiddenImportResultRecordingPreflightContent,
    FORBIDDEN_IMPORT_RESULT_RECORDING_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    importResultRecordingPreflightOnly: true,
    resultSupplyGateReady:
      resultSupplyGate.readiness?.readyForManualOrderPermissionImportImplementationReviewResultSupply === true &&
      resultSupplyGate.readiness?.readyForPermissionImportAfterReviewResult === false &&
      resultSupplyGate.readiness?.ownerReviewResultSuppliedNow === false &&
      resultSupplyGate.readiness?.currentStepReadsReviewResult === false &&
      resultSupplyGate.readiness?.currentStepReadsPrivatePacket === false &&
      resultSupplyGate.readiness?.currentStepRecordsReviewResult === false &&
      resultSupplyGate.readiness?.permissionPacketImportedNow === false &&
      resultSupplyGate.readiness?.orderSubmissionAllowed === false,
    resultRecordingPreflightStillReady:
      resultRecordingPreflight.readiness?.readyForManualOrderPermissionImportImplementationReviewResultRecordingPreflight ===
        true &&
      resultRecordingPreflight.readiness?.readyForPermissionImportAfterReviewResult === false &&
      resultRecordingPreflight.readiness?.currentStepReadsPrivatePacket === false &&
      resultRecordingPreflight.readiness?.permissionPacketImportedNow === false &&
      resultRecordingPreflight.readiness?.orderSubmissionAllowed === false,
    importImplementationReviewContractStillReady:
      importImplementationReview.readiness?.readyForManualOrderPermissionImportImplementationReviewContract === true &&
      importImplementationReview.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importImplementationReview.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationReview.readiness?.permissionPacketImportedNow === false &&
      importImplementationReview.readiness?.orderSubmissionAllowed === false,
    importReviewPreflightStillReady:
      importReviewPreflight.readiness?.readyForManualOrderPermissionImportReviewPreflight === true &&
      importReviewPreflight.readiness?.permissionPacketImportedNow === false &&
      importReviewPreflight.readiness?.orderSubmissionAllowed === false,
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
    importResultRecordingPreflightGatesReady: missingImportResultRecordingPreflightGates.length === 0,
    importResultFieldsReady: missingImportResultFields.length === 0,
    forbiddenImportResultRecordingPreflightContentReady:
      missingForbiddenImportResultRecordingPreflightContent.length === 0,
    architectureDocMentionsImportResultRecordingPreflight:
      architectureDoc.includes("Trading Manual Order Permission Import Result Recording Preflight") &&
      architectureDoc.includes("manual_order_permission_import_result_recording_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerReviewResultSuppliedNow: false,
    currentStepReadsReviewResult: false,
    currentStepReadsPrivatePacket: false,
    currentStepRecordsImportResult: false,
    permissionPacketImportedNow: false,
    importImplementationAllowedNow: false,
    orderAdapterImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionImportResultRecordingPreflight =
    checks.resultSupplyGateReady &&
    checks.resultRecordingPreflightStillReady &&
    checks.importImplementationReviewContractStillReady &&
    checks.importReviewPreflightStillReady &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.importResultRecordingPreflightGatesReady &&
    checks.importResultFieldsReady &&
    checks.forbiddenImportResultRecordingPreflightContentReady &&
    checks.architectureDocMentionsImportResultRecordingPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6P",
    scope: "manual_order_permission_import_result_recording_preflight",
    sourceFiles: {
      manualOrderPermissionImportImplementationReviewResultSupplyGate: RESULT_SUPPLY_GATE_PATH,
      manualOrderPermissionImportImplementationReviewResultRecordingPreflight: RESULT_RECORDING_PREFLIGHT_PATH,
      manualOrderPermissionImportImplementationReview: IMPORT_IMPLEMENTATION_REVIEW_PATH,
      manualOrderPermissionImportReviewPreflight: IMPORT_REVIEW_PREFLIGHT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      importResultRecordingPreflightOnly: true,
      ownerReviewResultSuppliedNow: false,
      currentStepReadsReviewResult: false,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsImportResult: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    manualOrderPermissionImportResultRecordingPreflight: {
      ownerReviewResultRequiredLater: true,
      ownerPermissionPacketRequiredLater: true,
      currentStepMayReadReviewResult: false,
      currentStepMayReadPrivatePacket: false,
      currentStepMayRecordImportResult: false,
      currentStepMayImportPermissionPacket: false,
      currentStepMayImplementImportService: false,
      currentStepMayImplementOrderAdapter: false,
      nextAllowedAction:
        "after the owner supplies the redacted import implementation review result outside repo commits, record a separate permission import result supply gate without reading private packet paths or importing permission evidence",
      importResultRecordingPreflightGates,
      requiredImportResultFields,
      forbiddenImportResultRecordingPreflightContent,
    },
    checks,
    evidence: {
      missingImportResultRecordingPreflightGates,
      missingImportResultFields,
      missingForbiddenImportResultRecordingPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      resultSupplyGateStatus: statusOf(resultSupplyGate),
      resultRecordingPreflightStatus: statusOf(resultRecordingPreflight),
      importImplementationReviewStatus: statusOf(importImplementationReview),
      importReviewPreflightStatus: statusOf(importReviewPreflight),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionImportResultRecordingPreflight
        ? "manual_order_permission_import_result_recording_preflight_ready_pending_owner_review_result"
        : "blocked_before_manual_order_permission_import_result_recording_preflight",
      readyForManualOrderPermissionImportResultRecordingPreflight,
      readyForPermissionImportAfterReviewResult: false,
      readyForKillSwitchClearanceReviewAfterPermissionImport: false,
      ownerReviewResultSuppliedNow: false,
      currentStepReadsReviewResult: false,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsImportResult: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_manual_order_permission_import_implementation_review_result",
        "owner_redacted_validation_receipt_review_result",
        "owner_explicit_local_redacted_packet_path",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.resultSupplyGateReady
          ? []
          : ["manual_order_permission_import_implementation_review_result_supply_gate_not_ready"]),
        ...(checks.resultRecordingPreflightStillReady
          ? []
          : ["manual_order_permission_import_implementation_review_result_recording_preflight_not_ready"]),
        ...(checks.importImplementationReviewContractStillReady
          ? []
          : ["manual_order_permission_import_implementation_review_contract_not_ready"]),
        ...(checks.importReviewPreflightStillReady ? [] : ["manual_order_permission_import_review_preflight_not_ready"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingImportResultRecordingPreflightGates.map(
          (gate) => `missing_import_result_recording_preflight_gate_${gate}`,
        ),
        ...missingImportResultFields.map((field) => `missing_import_result_field_${field}`),
        ...missingForbiddenImportResultRecordingPreflightContent.map(
          (content) => `missing_forbidden_import_result_recording_preflight_content_${content}`,
        ),
        ...(checks.architectureDocMentionsImportResultRecordingPreflight
          ? []
          : ["architecture_doc_missing_import_result_recording_preflight"]),
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
    console.log("[generate-trading-manual-order-permission-import-result-recording-preflight-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-import-result-recording-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-import-result-recording-preflight-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-import-result-recording-preflight-contract] readyForManualOrderPermissionImportResultRecordingPreflight=${parsed.readiness.readyForManualOrderPermissionImportResultRecordingPreflight}`,
  );
}

main();

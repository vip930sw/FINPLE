const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json",
);
const REVIEW_RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_receipt_review_result_supply_gate_contract.json",
);
const IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
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

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-import-review-preflight-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_IMPORT_REVIEW_PREFLIGHT_GATES = [
  "validation_receipt_review_result_supply_gate_ready",
  "owner_redacted_validation_receipt_review_result_required_later",
  "current_step_does_not_read_validation_receipt",
  "current_step_does_not_read_review_result",
  "current_step_does_not_record_review_result",
  "current_step_does_not_read_private_packet",
  "current_step_does_not_import_permission_packet",
  "import_implementation_preflight_still_blocked",
  "clearance_sequence_still_requires_ordered_results",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_IMPORT_REVIEW_PREFLIGHT_CONTENT = [
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
  const reviewResultSupplyGate = readJson(REVIEW_RESULT_SUPPLY_GATE_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const importReviewPreflightGates = [...REQUIRED_IMPORT_REVIEW_PREFLIGHT_GATES];
  const forbiddenImportReviewPreflightContent = [...FORBIDDEN_IMPORT_REVIEW_PREFLIGHT_CONTENT];
  const missingImportReviewPreflightGates = missingValues(
    importReviewPreflightGates,
    REQUIRED_IMPORT_REVIEW_PREFLIGHT_GATES,
  );
  const missingForbiddenImportReviewPreflightContent = missingValues(
    forbiddenImportReviewPreflightContent,
    FORBIDDEN_IMPORT_REVIEW_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    importReviewPreflightOnly: true,
    reviewResultSupplyGateReady:
      reviewResultSupplyGate.readiness?.readyForManualOrderPermissionValidationReceiptReviewResultSupply === true &&
      reviewResultSupplyGate.readiness?.ownerRedactedValidationReceiptReviewResultSuppliedNow === false &&
      reviewResultSupplyGate.readiness?.currentStepReadsValidationReceipt === false &&
      reviewResultSupplyGate.readiness?.currentStepRecordsReviewResult === false &&
      reviewResultSupplyGate.readiness?.permissionPacketImportedNow === false &&
      reviewResultSupplyGate.readiness?.orderSubmissionAllowed === false,
    importImplementationPreflightStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      importImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationPreflight.readiness?.permissionPacketImportedNow === false &&
      importImplementationPreflight.readiness?.providerCallsAllowed === false &&
      importImplementationPreflight.readiness?.orderSubmissionAllowed === false &&
      importImplementationPreflight.readiness?.runtimeRouteAllowed === false &&
      importImplementationPreflight.readiness?.publicUiAllowed === false &&
      importImplementationPreflight.readiness?.dbMigrationAllowed === false &&
      importImplementationPreflight.readiness?.liveTradingAllowed === false,
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
    importReviewPreflightGatesReady: missingImportReviewPreflightGates.length === 0,
    forbiddenImportReviewPreflightContentReady: missingForbiddenImportReviewPreflightContent.length === 0,
    architectureDocMentionsManualOrderPermissionImportReviewPreflight:
      architectureDoc.includes("Trading Manual Order Permission Import Review Preflight") &&
      architectureDoc.includes("manual_order_permission_import_review_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRedactedValidationReceiptReviewResultSuppliedNow: false,
    currentStepReadsValidationReceipt: false,
    currentStepReadsReviewResult: false,
    currentStepRecordsReviewResult: false,
    ownerPacketReadAllowedNow: false,
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

  const readyForManualOrderPermissionImportReviewPreflight =
    checks.reviewResultSupplyGateReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.importReviewPreflightGatesReady &&
    checks.forbiddenImportReviewPreflightContentReady &&
    checks.architectureDocMentionsManualOrderPermissionImportReviewPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6L",
    scope: "manual_order_permission_import_review_preflight",
    sourceFiles: {
      validationReceiptReviewResultSupplyGate: REVIEW_RESULT_SUPPLY_GATE_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      importReviewPreflightOnly: true,
      ownerRedactedValidationReceiptReviewResultSuppliedNow: false,
      currentStepReadsValidationReceipt: false,
      currentStepReadsReviewResult: false,
      currentStepRecordsReviewResult: false,
      ownerPacketReadAllowedNow: false,
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
    manualOrderPermissionImportReviewPreflight: {
      ownerRedactedValidationReceiptReviewResultRequiredLater: true,
      currentStepMayReadValidationReceipt: false,
      currentStepMayReadReviewResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayReadPrivatePacket: false,
      currentStepMayImportPermissionPacket: false,
      currentStepMayImplementImportService: false,
      currentStepMayImplementOrderAdapter: false,
      nextAllowedAction:
        "after the owner supplies a redacted validation receipt review result outside repo commits, run a separate permission import implementation review without reading default private paths",
      importReviewPreflightGates,
      forbiddenImportReviewPreflightContent,
    },
    checks,
    evidence: {
      missingImportReviewPreflightGates,
      missingForbiddenImportReviewPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      reviewResultSupplyGateStatus: statusOf(reviewResultSupplyGate),
      importImplementationPreflightStatus: statusOf(importImplementationPreflight),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionImportReviewPreflight
        ? "manual_order_permission_import_review_preflight_ready_import_still_blocked_pending_owner_review_result"
        : "blocked_before_manual_order_permission_import_review_preflight",
      readyForManualOrderPermissionImportReviewPreflight,
      readyForFutureManualOrderPermissionImportImplementationReview: false,
      readyForKillSwitchClearanceReviewAfterPermissionImport: false,
      ownerRedactedValidationReceiptReviewResultSuppliedNow: false,
      currentStepReadsValidationReceipt: false,
      currentStepReadsReviewResult: false,
      currentStepRecordsReviewResult: false,
      ownerPacketReadAllowedNow: false,
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
        "owner_explicit_local_redacted_packet_path",
        "owner_local_validation_execution_result",
        "owner_explicit_local_redacted_validation_receipt_path",
        "owner_local_validation_receipt_execution_result",
        "owner_redacted_validation_receipt_review_result",
      ],
      blockers: [
        ...(checks.reviewResultSupplyGateReady ? [] : ["validation_receipt_review_result_supply_gate_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_no_longer_blocked"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingImportReviewPreflightGates.map((gate) => `missing_import_review_preflight_gate_${gate}`),
        ...missingForbiddenImportReviewPreflightContent.map(
          (content) => `missing_forbidden_import_review_preflight_content_${content}`,
        ),
        ...(checks.architectureDocMentionsManualOrderPermissionImportReviewPreflight
          ? []
          : ["architecture_doc_missing_manual_order_permission_import_review_preflight"]),
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
    console.log("[generate-trading-manual-order-permission-import-review-preflight-contract] ok");
    console.log(`[generate-trading-manual-order-permission-import-review-preflight-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-import-review-preflight-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-import-review-preflight-contract] readyForManualOrderPermissionImportReviewPreflight=${parsed.readiness.readyForManualOrderPermissionImportReviewPreflight}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_review_contract.json",
);
const IMPORT_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json",
);
const VALIDATION_RECEIPT_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-import-implementation-review-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const FUTURE_IMPORT_SERVICE_PATH = path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js");
const FUTURE_PERMISSION_PACKET_PATH = path.join("data", "private", "trading", "manual_order_permission.redacted.json");
const REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA = [
  "private_worker_only",
  "explicit_owner_redacted_review_result_required_later",
  "explicit_owner_permission_packet_path_required_later",
  "no_default_private_packet_read",
  "validate_review_result_before_packet_read",
  "validate_packet_before_import",
  "redacted_error_messages_only",
  "hash_only_evidence_output",
  "no_hash_generation_now",
  "no_provider_call",
  "no_order_submission",
  "no_order_adapter_implementation",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "does_not_override_kill_switch_or_risk_gate",
  "permission_import_success_still_not_live_trading",
];
const REQUIRED_IMPORT_REVIEW_FIELDS = [
  "importReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "validationReceiptReviewResultHash",
  "permissionPacketShapeHash",
  "importerVersionHash",
  "reviewPolicyHash",
  "redactionVersion",
  "permissionPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const FORBIDDEN_REVIEW_CONTENT = [
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
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_IMPORT_SERVICE_PATH,
  FUTURE_PERMISSION_PACKET_PATH,
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
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
  const importReviewPreflight = readJson(IMPORT_REVIEW_PREFLIGHT_PATH);
  const validationReceiptReviewResult = readJson(VALIDATION_RECEIPT_REVIEW_RESULT_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const implementationReviewCriteria = [...REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA];
  const requiredImportReviewFields = [...REQUIRED_IMPORT_REVIEW_FIELDS];
  const forbiddenReviewContent = [...FORBIDDEN_REVIEW_CONTENT];
  const missingImplementationReviewCriteria = missingValues(
    implementationReviewCriteria,
    REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA,
  );
  const missingImportReviewFields = missingValues(requiredImportReviewFields, REQUIRED_IMPORT_REVIEW_FIELDS);
  const missingForbiddenReviewContent = missingValues(forbiddenReviewContent, FORBIDDEN_REVIEW_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    importImplementationReviewOnly: true,
    importReviewPreflightReady:
      importReviewPreflight.readiness?.readyForManualOrderPermissionImportReviewPreflight === true &&
      importReviewPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importReviewPreflight.readiness?.ownerRedactedValidationReceiptReviewResultSuppliedNow === false &&
      importReviewPreflight.readiness?.currentStepReadsValidationReceipt === false &&
      importReviewPreflight.readiness?.currentStepReadsReviewResult === false &&
      importReviewPreflight.readiness?.permissionPacketImportedNow === false &&
      importReviewPreflight.readiness?.orderSubmissionAllowed === false,
    validationReceiptReviewResultStillPending:
      validationReceiptReviewResult.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult ===
        true &&
      validationReceiptReviewResult.readiness?.validationReceiptReviewRecordedNow === false &&
      validationReceiptReviewResult.readiness?.validationReceiptReadAllowedNow === false &&
      validationReceiptReviewResult.readiness?.receiptPathRecorded === false &&
      validationReceiptReviewResult.readiness?.rawValuesRecorded === false &&
      validationReceiptReviewResult.readiness?.permissionPacketImportedNow === false &&
      validationReceiptReviewResult.readiness?.orderSubmissionAllowed === false,
    importImplementationPreflightStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      importImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationPreflight.readiness?.permissionPacketImportedNow === false &&
      importImplementationPreflight.readiness?.providerCallsAllowed === false &&
      importImplementationPreflight.readiness?.orderSubmissionAllowed === false,
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
    implementationReviewCriteriaReady: missingImplementationReviewCriteria.length === 0,
    importReviewFieldsReady: missingImportReviewFields.length === 0,
    forbiddenReviewContentReady: missingForbiddenReviewContent.length === 0,
    architectureDocMentionsManualOrderPermissionImportImplementationReview:
      architectureDoc.includes("Trading Manual Order Permission Import Implementation Review") &&
      architectureDoc.includes("manual_order_permission_import_implementation_review"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRedactedValidationReceiptReviewResultSuppliedNow: false,
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

  const readyForManualOrderPermissionImportImplementationReviewContract =
    checks.importReviewPreflightReady &&
    checks.validationReceiptReviewResultStillPending &&
    checks.importImplementationPreflightStillBlocked &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.implementationReviewCriteriaReady &&
    checks.importReviewFieldsReady &&
    checks.forbiddenReviewContentReady &&
    checks.architectureDocMentionsManualOrderPermissionImportImplementationReview &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6M",
    scope: "manual_order_permission_import_implementation_review",
    sourceFiles: {
      manualOrderPermissionImportReviewPreflight: IMPORT_REVIEW_PREFLIGHT_PATH,
      manualOrderPermissionValidationResultReceiptReviewResult: VALIDATION_RECEIPT_REVIEW_RESULT_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      importImplementationReviewOnly: true,
      ownerRedactedValidationReceiptReviewResultSuppliedNow: false,
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
    futureManualOrderPermissionImportImplementationReviewBoundary: {
      futureImportServicePath: FUTURE_IMPORT_SERVICE_PATH,
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      currentStepReadsReviewResult: false,
      currentStepReadsPrivatePacket: false,
      currentStepImplementsImportService: false,
      currentStepImportsPermissionPacket: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      implementationReviewCriteria,
      requiredImportReviewFields,
      forbiddenReviewContent,
      promotionRules: [
        "review result and owner packet must be supplied outside repo commits before implementation review can continue",
        "import implementation review cannot use default private packet paths",
        "permission import success still does not clear kill switch, risk gate, live adapter review, or live trading",
      ],
    },
    checks,
    evidence: {
      missingImplementationReviewCriteria,
      missingImportReviewFields,
      missingForbiddenReviewContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      importReviewPreflightStatus: statusOf(importReviewPreflight),
      validationReceiptReviewResultStatus: statusOf(validationReceiptReviewResult),
      importImplementationPreflightStatus: statusOf(importImplementationPreflight),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionImportImplementationReviewContract
        ? "contract_ready_pending_manual_order_permission_import_implementation_review_inputs"
        : "blocked_before_manual_order_permission_import_implementation_review_contract",
      readyForManualOrderPermissionImportImplementationReviewContract,
      readyForFutureManualOrderPermissionImportImplementationReview: false,
      readyForKillSwitchClearanceReviewAfterPermissionImport: false,
      ownerRedactedValidationReceiptReviewResultSuppliedNow: false,
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
        "owner_redacted_validation_receipt_review_result",
        "owner_explicit_local_redacted_packet_path",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.importReviewPreflightReady ? [] : ["manual_order_permission_import_review_preflight_not_ready"]),
        ...(checks.validationReceiptReviewResultStillPending
          ? []
          : ["validation_receipt_review_result_no_longer_pending"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_no_longer_blocked"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingImplementationReviewCriteria.map((criterion) => `missing_implementation_review_criterion_${criterion}`),
        ...missingImportReviewFields.map((field) => `missing_import_review_field_${field}`),
        ...missingForbiddenReviewContent.map((content) => `missing_forbidden_review_content_${content}`),
        ...(checks.architectureDocMentionsManualOrderPermissionImportImplementationReview
          ? []
          : ["architecture_doc_missing_manual_order_permission_import_implementation_review"]),
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
    console.log("[generate-trading-manual-order-permission-import-implementation-review-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-import-implementation-review-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-import-implementation-review-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-import-implementation-review-contract] readyForManualOrderPermissionImportImplementationReviewContract=${parsed.readiness.readyForManualOrderPermissionImportImplementationReviewContract}`,
  );
}

main();

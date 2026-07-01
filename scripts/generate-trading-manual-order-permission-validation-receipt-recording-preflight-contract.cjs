const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_receipt_recording_preflight_contract.json",
);
const LOCAL_VALIDATION_EXECUTION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_local_validation_execution_preflight_contract.json",
);
const VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
);
const VALIDATION_RESULT_RECEIPT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_validator_fixtures.json",
);
const RECEIPT_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
);
const RECEIPT_VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-validation-result-receipt.cjs");
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-validation-receipt-recording-preflight-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const RECEIPT_VALIDATION_COMMAND =
  "node scripts/validate-trading-manual-order-permission-validation-result-receipt.cjs --receipt <owner-local-redacted-receipt-path>";
const REQUIRED_RECORDING_PREFLIGHT_GATES = [
  "local_validation_execution_preflight_ready",
  "owner_validation_execution_result_required_later",
  "receipt_contract_future_only",
  "receipt_validator_present",
  "receipt_validator_fixtures_ready",
  "receipt_review_preflight_ready",
  "current_step_does_not_record_receipt",
  "current_step_does_not_record_packet_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_import_permission_packet",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const REQUIRED_REDACTED_RECEIPT_FIELDS = [
  "validationReceiptId",
  "validationStatus",
  "validatedAt",
  "validatorVersionHash",
  "packetShapeHash",
  "errorCodeHashes",
  "redactionVersion",
  "packetPathRecorded",
  "rawValuesRecorded",
  "permissionPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const FORBIDDEN_RECORDING_PREFLIGHT_CONTENT = [
  "actual_owner_local_packet_path",
  "private_packet_path",
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
  const localValidationExecutionPreflight = readJson(LOCAL_VALIDATION_EXECUTION_PREFLIGHT_PATH);
  const validationResultReceipt = readJson(VALIDATION_RESULT_RECEIPT_PATH);
  const receiptValidatorFixtures = readJson(VALIDATION_RESULT_RECEIPT_VALIDATOR_FIXTURES_PATH);
  const receiptReviewPreflight = readJson(RECEIPT_REVIEW_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const recordingPreflightGates = [...REQUIRED_RECORDING_PREFLIGHT_GATES];
  const redactedReceiptFields = [...REQUIRED_REDACTED_RECEIPT_FIELDS];
  const forbiddenRecordingPreflightContent = [...FORBIDDEN_RECORDING_PREFLIGHT_CONTENT];
  const missingRecordingPreflightGates = missingValues(recordingPreflightGates, REQUIRED_RECORDING_PREFLIGHT_GATES);
  const missingRedactedReceiptFields = missingValues(redactedReceiptFields, REQUIRED_REDACTED_RECEIPT_FIELDS);
  const missingForbiddenRecordingPreflightContent = missingValues(
    forbiddenRecordingPreflightContent,
    FORBIDDEN_RECORDING_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    localValidationExecutionPreflightReady:
      localValidationExecutionPreflight.readiness?.readyForOwnerLocalValidationExecutionAfterPath === true &&
      localValidationExecutionPreflight.readiness?.currentStepRunsValidator === false &&
      localValidationExecutionPreflight.readiness?.currentStepRecordsValidationReceipt === false,
    validationReceiptStillFutureOnly:
      validationResultReceipt.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      validationResultReceipt.readiness?.validationReceiptRecordedNow === false &&
      validationResultReceipt.readiness?.packetPathRecorded === false &&
      validationResultReceipt.readiness?.rawValuesRecorded === false &&
      validationResultReceipt.readiness?.permissionPacketImportedNow === false,
    receiptValidatorFixturesReady:
      receiptValidatorFixtures.readiness?.readyForManualOrderPermissionValidationResultReceiptValidatorRegression === true &&
      receiptValidatorFixtures.readiness?.providerCallsAllowed === false &&
      receiptValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    receiptReviewPreflightReady:
      receiptReviewPreflight.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      receiptReviewPreflight.readiness?.validationReceiptReadAllowedNow === false &&
      receiptReviewPreflight.readiness?.validationReceiptRecordedNow === false,
    receiptValidatorPresent: fs.existsSync(RECEIPT_VALIDATOR_PATH),
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    recordingPreflightGatesReady: missingRecordingPreflightGates.length === 0,
    redactedReceiptFieldsReady: missingRedactedReceiptFields.length === 0,
    forbiddenRecordingPreflightContentReady: missingForbiddenRecordingPreflightContent.length === 0,
    architectureDocMentionsValidationReceiptRecordingPreflight:
      architectureDoc.includes("Trading Manual Order Permission Validation Receipt Recording Preflight") &&
      architectureDoc.includes("manual_order_permission_validation_receipt_recording_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptRecordedNow: false,
    currentStepReadsPrivatePacket: false,
    currentStepReadsValidationResult: false,
    currentStepRecordsValidationReceipt: false,
    packetPathRecorded: false,
    rawValuesRecorded: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionValidationReceiptRecordingAfterExecution =
    checks.localValidationExecutionPreflightReady &&
    checks.validationReceiptStillFutureOnly &&
    checks.receiptValidatorFixturesReady &&
    checks.receiptReviewPreflightReady &&
    checks.receiptValidatorPresent &&
    checks.progressSummaryStillFailClosed &&
    checks.recordingPreflightGatesReady &&
    checks.redactedReceiptFieldsReady &&
    checks.forbiddenRecordingPreflightContentReady &&
    checks.architectureDocMentionsValidationReceiptRecordingPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6E",
    scope: "manual_order_permission_validation_receipt_recording_preflight",
    sourceFiles: {
      localValidationExecutionPreflight: LOCAL_VALIDATION_EXECUTION_PREFLIGHT_PATH,
      manualOrderPermissionValidationResultReceipt: VALIDATION_RESULT_RECEIPT_PATH,
      manualOrderPermissionValidationResultReceiptValidatorFixtures: VALIDATION_RESULT_RECEIPT_VALIDATOR_FIXTURES_PATH,
      manualOrderPermissionValidationResultReceiptReviewPreflight: RECEIPT_REVIEW_PREFLIGHT_PATH,
      manualOrderPermissionValidationResultReceiptValidator: RECEIPT_VALIDATOR_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      receiptRecordingPreflightOnly: true,
      validationReceiptRecordedNow: false,
      currentStepReadsPrivatePacket: false,
      currentStepReadsValidationResult: false,
      currentStepRecordsValidationReceipt: false,
      packetPathRecorded: false,
      rawValuesRecorded: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validationReceiptRecordingPreflight: {
      receiptValidationCommand: RECEIPT_VALIDATION_COMMAND,
      ownerValidationExecutionResultRequiredLater: true,
      currentStepMayReadValidationResult: false,
      currentStepMayRecordReceipt: false,
      currentStepMayRecordPacketPath: false,
      currentStepMayRecordRawValues: false,
      nextAllowedAction:
        "after owner-supplied local validation execution produces a redacted result, create a redacted validation receipt with hash-only fields and validate it through an explicit receipt path",
      recordingPreflightGates,
      redactedReceiptFields,
      forbiddenRecordingPreflightContent,
    },
    checks,
    evidence: {
      missingRecordingPreflightGates,
      missingRedactedReceiptFields,
      missingForbiddenRecordingPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      localValidationExecutionPreflightStatus: statusOf(localValidationExecutionPreflight),
      validationResultReceiptStatus: statusOf(validationResultReceipt),
      receiptValidatorFixturesStatus: statusOf(receiptValidatorFixtures),
      receiptReviewPreflightStatus: statusOf(receiptReviewPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionValidationReceiptRecordingAfterExecution
        ? "validation_receipt_recording_preflight_ready_pending_owner_validation_execution_result"
        : "blocked_before_validation_receipt_recording_preflight",
      readyForManualOrderPermissionValidationReceiptRecordingAfterExecution,
      readyForKillSwitchClearanceReviewAfterValidationReceipt:
        readyForManualOrderPermissionValidationReceiptRecordingAfterExecution,
      validationReceiptRecordedNow: false,
      currentStepReadsPrivatePacket: false,
      currentStepReadsValidationResult: false,
      currentStepRecordsValidationReceipt: false,
      packetPathRecorded: false,
      rawValuesRecorded: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_explicit_local_redacted_packet_path",
        "owner_local_validation_execution_result",
      ],
      blockers: [
        ...(checks.localValidationExecutionPreflightReady ? [] : ["local_validation_execution_preflight_not_ready"]),
        ...(checks.validationReceiptStillFutureOnly ? [] : ["validation_result_receipt_no_longer_future_only"]),
        ...(checks.receiptValidatorFixturesReady ? [] : ["validation_result_receipt_validator_fixtures_not_ready"]),
        ...(checks.receiptReviewPreflightReady ? [] : ["validation_result_receipt_review_preflight_not_ready"]),
        ...(checks.receiptValidatorPresent ? [] : ["validation_result_receipt_validator_missing"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingRecordingPreflightGates.map((gate) => `missing_recording_preflight_gate_${gate}`),
        ...missingRedactedReceiptFields.map((field) => `missing_redacted_receipt_field_${field}`),
        ...missingForbiddenRecordingPreflightContent.map((content) => `missing_forbidden_recording_preflight_content_${content}`),
        ...(checks.architectureDocMentionsValidationReceiptRecordingPreflight
          ? []
          : ["architecture_doc_missing_validation_receipt_recording_preflight"]),
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
    console.log("[generate-trading-manual-order-permission-validation-receipt-recording-preflight-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-validation-receipt-recording-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-validation-receipt-recording-preflight-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-validation-receipt-recording-preflight-contract] readyForManualOrderPermissionValidationReceiptRecordingAfterExecution=${parsed.readiness.readyForManualOrderPermissionValidationReceiptRecordingAfterExecution}`,
  );
}

main();

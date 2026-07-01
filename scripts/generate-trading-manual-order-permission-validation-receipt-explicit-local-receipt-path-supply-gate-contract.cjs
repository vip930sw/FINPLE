const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate_contract.json",
);
const VALIDATION_EXECUTION_RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_execution_result_supply_gate_contract.json",
);
const VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
);
const RECEIPT_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-validation-receipt-explicit-local-receipt-path-supply-gate-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_RECEIPT_PATH_SUPPLY_GATES = [
  "validation_execution_result_supply_gate_ready",
  "owner_explicit_local_validation_receipt_path_required_later",
  "current_step_does_not_read_validation_receipt",
  "current_step_does_not_record_validation_receipt",
  "current_step_does_not_record_receipt_path",
  "current_step_does_not_record_packet_path",
  "current_step_does_not_record_raw_values",
  "receipt_contract_still_future_only",
  "receipt_review_preflight_still_closed",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_RECEIPT_PATH_SUPPLY_CONTENT = [
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
  const validationExecutionResultSupplyGate = readJson(VALIDATION_EXECUTION_RESULT_SUPPLY_GATE_PATH);
  const validationResultReceipt = readJson(VALIDATION_RESULT_RECEIPT_PATH);
  const receiptReviewPreflight = readJson(RECEIPT_REVIEW_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const receiptPathSupplyGates = [...REQUIRED_RECEIPT_PATH_SUPPLY_GATES];
  const forbiddenReceiptPathSupplyContent = [...FORBIDDEN_RECEIPT_PATH_SUPPLY_CONTENT];
  const missingReceiptPathSupplyGates = missingValues(receiptPathSupplyGates, REQUIRED_RECEIPT_PATH_SUPPLY_GATES);
  const missingForbiddenReceiptPathSupplyContent = missingValues(
    forbiddenReceiptPathSupplyContent,
    FORBIDDEN_RECEIPT_PATH_SUPPLY_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    validationExecutionResultSupplyGateReady:
      validationExecutionResultSupplyGate.readiness?.readyForOwnerValidationExecutionResultSupply === true &&
      validationExecutionResultSupplyGate.readiness?.ownerValidationExecutionResultSuppliedNow === false &&
      validationExecutionResultSupplyGate.readiness?.currentStepReadsValidationResult === false &&
      validationExecutionResultSupplyGate.readiness?.currentStepRecordsValidationReceipt === false &&
      validationExecutionResultSupplyGate.readiness?.orderSubmissionAllowed === false,
    validationReceiptStillFutureOnly:
      validationResultReceipt.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      validationResultReceipt.readiness?.validationReceiptRecordedNow === false &&
      validationResultReceipt.readiness?.packetPathRecorded === false &&
      validationResultReceipt.readiness?.rawValuesRecorded === false &&
      validationResultReceipt.readiness?.permissionPacketImportedNow === false,
    receiptReviewPreflightStillClosed:
      receiptReviewPreflight.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      receiptReviewPreflight.readiness?.validationReceiptReadAllowedNow === false &&
      receiptReviewPreflight.readiness?.validationReceiptRecordedNow === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    receiptPathSupplyGatesReady: missingReceiptPathSupplyGates.length === 0,
    forbiddenReceiptPathSupplyContentReady: missingForbiddenReceiptPathSupplyContent.length === 0,
    architectureDocMentionsValidationReceiptExplicitLocalReceiptPathSupplyGate:
      architectureDoc.includes("Trading Manual Order Permission Validation Receipt Explicit Local Receipt Path Supply Gate") &&
      architectureDoc.includes("manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerLocalValidationReceiptPathSuppliedNow: false,
    ownerValidationReceiptSuppliedNow: false,
    validationReceiptReadAllowedNow: false,
    currentStepReadsValidationReceipt: false,
    currentStepRecordsValidationReceipt: false,
    validationReceiptRecordedNow: false,
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

  const readyForOwnerExplicitLocalValidationReceiptPathSupply =
    checks.validationExecutionResultSupplyGateReady &&
    checks.validationReceiptStillFutureOnly &&
    checks.receiptReviewPreflightStillClosed &&
    checks.progressSummaryStillFailClosed &&
    checks.receiptPathSupplyGatesReady &&
    checks.forbiddenReceiptPathSupplyContentReady &&
    checks.architectureDocMentionsValidationReceiptExplicitLocalReceiptPathSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6G",
    scope: "manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate",
    sourceFiles: {
      validationExecutionResultSupplyGate: VALIDATION_EXECUTION_RESULT_SUPPLY_GATE_PATH,
      manualOrderPermissionValidationResultReceipt: VALIDATION_RESULT_RECEIPT_PATH,
      manualOrderPermissionValidationResultReceiptReviewPreflight: RECEIPT_REVIEW_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      validationReceiptPathSupplyGateOnly: true,
      ownerLocalValidationReceiptPathSuppliedNow: false,
      ownerValidationReceiptSuppliedNow: false,
      validationReceiptReadAllowedNow: false,
      currentStepReadsValidationReceipt: false,
      currentStepRecordsValidationReceipt: false,
      validationReceiptRecordedNow: false,
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
    validationReceiptExplicitLocalReceiptPathSupplyGate: {
      ownerExplicitLocalValidationReceiptPathRequiredLater: true,
      currentStepMayReadValidationReceipt: false,
      currentStepMayRecordValidationReceipt: false,
      currentStepMayRecordReceiptPath: false,
      currentStepMayRecordPacketPath: false,
      currentStepMayRecordRawValues: false,
      nextAllowedAction:
        "after the owner supplies an explicit local redacted validation receipt path outside repo commits, validate only that receipt path through the existing local receipt validator",
      receiptPathSupplyGates,
      forbiddenReceiptPathSupplyContent,
    },
    checks,
    evidence: {
      missingReceiptPathSupplyGates,
      missingForbiddenReceiptPathSupplyContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      validationExecutionResultSupplyGateStatus: statusOf(validationExecutionResultSupplyGate),
      validationResultReceiptStatus: statusOf(validationResultReceipt),
      receiptReviewPreflightStatus: statusOf(receiptReviewPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForOwnerExplicitLocalValidationReceiptPathSupply
        ? "validation_receipt_explicit_local_receipt_path_supply_gate_ready_pending_owner_receipt_path"
        : "blocked_before_validation_receipt_explicit_local_receipt_path_supply_gate",
      readyForOwnerExplicitLocalValidationReceiptPathSupply,
      readyForFutureManualOrderPermissionValidationReceiptPathIntake:
        readyForOwnerExplicitLocalValidationReceiptPathSupply,
      ownerLocalValidationReceiptPathSuppliedNow: false,
      ownerValidationReceiptSuppliedNow: false,
      validationReceiptReadAllowedNow: false,
      currentStepReadsValidationReceipt: false,
      currentStepRecordsValidationReceipt: false,
      validationReceiptRecordedNow: false,
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
        "owner_explicit_local_redacted_validation_receipt_path",
      ],
      blockers: [
        ...(checks.validationExecutionResultSupplyGateReady
          ? []
          : ["validation_execution_result_supply_gate_not_ready"]),
        ...(checks.validationReceiptStillFutureOnly ? [] : ["validation_result_receipt_no_longer_future_only"]),
        ...(checks.receiptReviewPreflightStillClosed ? [] : ["validation_result_receipt_review_preflight_no_longer_closed"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReceiptPathSupplyGates.map((gate) => `missing_receipt_path_supply_gate_${gate}`),
        ...missingForbiddenReceiptPathSupplyContent.map(
          (content) => `missing_forbidden_receipt_path_supply_content_${content}`,
        ),
        ...(checks.architectureDocMentionsValidationReceiptExplicitLocalReceiptPathSupplyGate
          ? []
          : ["architecture_doc_missing_validation_receipt_explicit_local_receipt_path_supply_gate"]),
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
      "[generate-trading-manual-order-permission-validation-receipt-explicit-local-receipt-path-supply-gate-contract] ok",
    );
    console.log(
      `[generate-trading-manual-order-permission-validation-receipt-explicit-local-receipt-path-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log(
    "[generate-trading-manual-order-permission-validation-receipt-explicit-local-receipt-path-supply-gate-contract] wrote contract",
  );
  console.log(
    `[generate-trading-manual-order-permission-validation-receipt-explicit-local-receipt-path-supply-gate-contract] readyForOwnerExplicitLocalValidationReceiptPathSupply=${parsed.readiness.readyForOwnerExplicitLocalValidationReceiptPathSupply}`,
  );
}

main();

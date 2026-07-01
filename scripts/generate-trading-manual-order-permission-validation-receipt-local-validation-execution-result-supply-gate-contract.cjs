const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate_contract.json",
);
const LOCAL_VALIDATION_EXECUTION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json",
);
const REVIEW_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
);
const REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-validation-receipt-local-validation-execution-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_EXECUTION_RESULT_SUPPLY_GATES = [
  "validation_receipt_local_validation_execution_preflight_ready",
  "owner_local_validation_receipt_execution_result_required_later",
  "current_step_does_not_run_validator",
  "current_step_does_not_read_validation_receipt",
  "current_step_does_not_read_validation_result",
  "current_step_does_not_record_review_result",
  "current_step_does_not_record_receipt_path",
  "current_step_does_not_record_raw_values",
  "review_runbook_ready",
  "review_result_contract_still_future_only",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_EXECUTION_RESULT_SUPPLY_CONTENT = [
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
  const reviewRunbook = readJson(REVIEW_RUNBOOK_PATH);
  const reviewResult = readJson(REVIEW_RESULT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const executionResultSupplyGates = [...REQUIRED_EXECUTION_RESULT_SUPPLY_GATES];
  const forbiddenExecutionResultSupplyContent = [...FORBIDDEN_EXECUTION_RESULT_SUPPLY_CONTENT];
  const missingExecutionResultSupplyGates = missingValues(
    executionResultSupplyGates,
    REQUIRED_EXECUTION_RESULT_SUPPLY_GATES,
  );
  const missingForbiddenExecutionResultSupplyContent = missingValues(
    forbiddenExecutionResultSupplyContent,
    FORBIDDEN_EXECUTION_RESULT_SUPPLY_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    localValidationExecutionPreflightReady:
      localValidationExecutionPreflight.readiness?.readyForOwnerLocalValidationReceiptValidationExecution === true &&
      localValidationExecutionPreflight.readiness?.currentStepRunsValidator === false &&
      localValidationExecutionPreflight.readiness?.currentStepReadsValidationReceipt === false &&
      localValidationExecutionPreflight.readiness?.currentStepRecordsValidationReceipt === false &&
      localValidationExecutionPreflight.readiness?.orderSubmissionAllowed === false,
    reviewRunbookReady:
      reviewRunbook.readiness?.readyForOwnerAssistedValidationResultReceiptReviewRunbookReview === true &&
      reviewRunbook.readiness?.currentStepRunsValidator === false &&
      reviewRunbook.readiness?.currentStepReadsReceipt === false &&
      reviewRunbook.readiness?.orderSubmissionAllowed === false,
    reviewResultStillFutureOnly:
      reviewResult.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult === true &&
      reviewResult.readiness?.validationReceiptReviewRecordedNow === false &&
      reviewResult.readiness?.validationReceiptReadAllowedNow === false &&
      reviewResult.readiness?.receiptPathRecorded === false &&
      reviewResult.readiness?.rawValuesRecorded === false &&
      reviewResult.readiness?.permissionPacketImportedNow === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    executionResultSupplyGatesReady: missingExecutionResultSupplyGates.length === 0,
    forbiddenExecutionResultSupplyContentReady: missingForbiddenExecutionResultSupplyContent.length === 0,
    architectureDocMentionsValidationReceiptLocalValidationExecutionResultSupplyGate:
      architectureDoc.includes("Trading Manual Order Permission Validation Receipt Local Validation Execution Result Supply Gate") &&
      architectureDoc.includes("manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerLocalValidationReceiptExecutionResultSuppliedNow: false,
    currentStepRunsValidator: false,
    currentStepReadsValidationReceipt: false,
    currentStepReadsValidationResult: false,
    currentStepRecordsReviewResult: false,
    validationReceiptReviewRecordedNow: false,
    receiptPathRecorded: false,
    rawValuesRecorded: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForOwnerLocalValidationReceiptExecutionResultSupply =
    checks.localValidationExecutionPreflightReady &&
    checks.reviewRunbookReady &&
    checks.reviewResultStillFutureOnly &&
    checks.progressSummaryStillFailClosed &&
    checks.executionResultSupplyGatesReady &&
    checks.forbiddenExecutionResultSupplyContentReady &&
    checks.architectureDocMentionsValidationReceiptLocalValidationExecutionResultSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6I",
    scope: "manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate",
    sourceFiles: {
      validationReceiptLocalValidationExecutionPreflight: LOCAL_VALIDATION_EXECUTION_PREFLIGHT_PATH,
      validationResultReceiptReviewRunbook: REVIEW_RUNBOOK_PATH,
      validationResultReceiptReviewResult: REVIEW_RESULT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      localValidationExecutionResultSupplyGateOnly: true,
      ownerLocalValidationReceiptExecutionResultSuppliedNow: false,
      currentStepRunsValidator: false,
      currentStepReadsValidationReceipt: false,
      currentStepReadsValidationResult: false,
      currentStepRecordsReviewResult: false,
      validationReceiptReviewRecordedNow: false,
      receiptPathRecorded: false,
      rawValuesRecorded: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validationReceiptLocalValidationExecutionResultSupplyGate: {
      ownerLocalValidationReceiptExecutionResultRequiredLater: true,
      currentStepMayRunValidator: false,
      currentStepMayReadValidationReceipt: false,
      currentStepMayReadValidationResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayRecordReceiptPath: false,
      currentStepMayRecordRawValues: false,
      nextAllowedAction:
        "after the owner supplies a local receipt validation execution result outside repo commits, record a separate redacted validation receipt review result without receipt paths or raw values",
      executionResultSupplyGates,
      forbiddenExecutionResultSupplyContent,
    },
    checks,
    evidence: {
      missingExecutionResultSupplyGates,
      missingForbiddenExecutionResultSupplyContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      localValidationExecutionPreflightStatus: statusOf(localValidationExecutionPreflight),
      reviewRunbookStatus: statusOf(reviewRunbook),
      reviewResultStatus: statusOf(reviewResult),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForOwnerLocalValidationReceiptExecutionResultSupply
        ? "validation_receipt_local_validation_execution_result_supply_gate_ready_pending_owner_execution_result"
        : "blocked_before_validation_receipt_local_validation_execution_result_supply_gate",
      readyForOwnerLocalValidationReceiptExecutionResultSupply,
      readyForFutureManualOrderPermissionValidationReceiptReviewResultAfterExecution:
        readyForOwnerLocalValidationReceiptExecutionResultSupply,
      ownerLocalValidationReceiptExecutionResultSuppliedNow: false,
      currentStepRunsValidator: false,
      currentStepReadsValidationReceipt: false,
      currentStepReadsValidationResult: false,
      currentStepRecordsReviewResult: false,
      validationReceiptReviewRecordedNow: false,
      receiptPathRecorded: false,
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
        "owner_local_validation_receipt_execution_result",
      ],
      blockers: [
        ...(checks.localValidationExecutionPreflightReady
          ? []
          : ["validation_receipt_local_validation_execution_preflight_not_ready"]),
        ...(checks.reviewRunbookReady ? [] : ["validation_result_receipt_review_runbook_not_ready"]),
        ...(checks.reviewResultStillFutureOnly ? [] : ["validation_result_receipt_review_result_no_longer_future_only"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingExecutionResultSupplyGates.map((gate) => `missing_execution_result_supply_gate_${gate}`),
        ...missingForbiddenExecutionResultSupplyContent.map(
          (content) => `missing_forbidden_execution_result_supply_content_${content}`,
        ),
        ...(checks.architectureDocMentionsValidationReceiptLocalValidationExecutionResultSupplyGate
          ? []
          : ["architecture_doc_missing_validation_receipt_local_validation_execution_result_supply_gate"]),
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
    console.log("[generate-trading-manual-order-permission-validation-receipt-local-validation-execution-result-supply-gate-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-validation-receipt-local-validation-execution-result-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-validation-receipt-local-validation-execution-result-supply-gate-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-validation-receipt-local-validation-execution-result-supply-gate-contract] readyForOwnerLocalValidationReceiptExecutionResultSupply=${parsed.readiness.readyForOwnerLocalValidationReceiptExecutionResultSupply}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_local_validation_execution_preflight_contract.json",
);
const OWNER_PATH_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_owner_explicit_local_packet_path_supply_gate_contract.json",
);
const VALIDATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
);
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const RECEIPT_VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-validation-result-receipt.cjs");
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-local-validation-execution-preflight-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const VALIDATION_COMMAND_TEMPLATE =
  "node scripts/validate-trading-manual-order-permission-packet.cjs --packet <owner-local-redacted-packet-path> --now <ISO-timestamp>";
const RECEIPT_COMMAND_TEMPLATE =
  "node scripts/validate-trading-manual-order-permission-validation-result-receipt.cjs --receipt <owner-local-redacted-receipt-path>";
const REQUIRED_EXECUTION_PREFLIGHT_GATES = [
  "owner_explicit_local_packet_path_supply_gate_ready",
  "owner_path_must_be_supplied_at_execution_time",
  "local_packet_validator_present",
  "local_receipt_validator_present",
  "validation_runbook_ready",
  "validation_preflight_ready",
  "validation_receipt_contract_future_only",
  "current_step_does_not_read_packet",
  "current_step_does_not_run_validator",
  "current_step_does_not_create_receipt",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_EXECUTION_PREFLIGHT_CONTENT = [
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
  const ownerPathSupplyGate = readJson(OWNER_PATH_SUPPLY_GATE_PATH);
  const validationRunbook = readJson(VALIDATION_RUNBOOK_PATH);
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const validationResultReceipt = readJson(VALIDATION_RESULT_RECEIPT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const executionPreflightGates = [...REQUIRED_EXECUTION_PREFLIGHT_GATES];
  const forbiddenExecutionPreflightContent = [...FORBIDDEN_EXECUTION_PREFLIGHT_CONTENT];
  const missingExecutionPreflightGates = missingValues(executionPreflightGates, REQUIRED_EXECUTION_PREFLIGHT_GATES);
  const missingForbiddenExecutionPreflightContent = missingValues(
    forbiddenExecutionPreflightContent,
    FORBIDDEN_EXECUTION_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    ownerPathSupplyGateReady:
      ownerPathSupplyGate.readiness?.readyForOwnerExplicitLocalPacketPathSupply === true &&
      ownerPathSupplyGate.readiness?.readyForManualOrderPermissionValidationReceiptAfterOwnerPath === true &&
      ownerPathSupplyGate.readiness?.ownerLocalPacketPathRecordedInRepo === false &&
      ownerPathSupplyGate.readiness?.currentStepRunsValidator === false,
    validationRunbookReady:
      validationRunbook.readiness?.readyForOwnerAssistedValidationRunbookReview === true &&
      validationRunbook.readiness?.currentStepRunsValidator === false &&
      validationRunbook.readiness?.currentStepReadsPrivatePacket === false,
    validationPreflightReady:
      validationPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      validationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      validationPreflight.readiness?.currentStepRunsValidator === false,
    validationReceiptStillFutureOnly:
      validationResultReceipt.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      validationResultReceipt.readiness?.validationReceiptRecordedNow === false &&
      validationResultReceipt.readiness?.packetPathRecorded === false &&
      validationResultReceipt.readiness?.rawValuesRecorded === false,
    validatorsPresent: fs.existsSync(VALIDATOR_PATH) && fs.existsSync(RECEIPT_VALIDATOR_PATH),
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    executionPreflightGatesReady: missingExecutionPreflightGates.length === 0,
    forbiddenExecutionPreflightContentReady: missingForbiddenExecutionPreflightContent.length === 0,
    architectureDocMentionsLocalValidationExecutionPreflight:
      architectureDoc.includes("Trading Manual Order Permission Local Validation Execution Preflight") &&
      architectureDoc.includes("manual_order_permission_local_validation_execution_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerLocalPacketPathSuppliedNow: false,
    ownerLocalPacketPathRecordedInRepo: false,
    currentStepReadsPrivatePacket: false,
    currentStepRunsValidator: false,
    currentStepRecordsValidationReceipt: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForOwnerLocalValidationExecutionAfterPath =
    checks.ownerPathSupplyGateReady &&
    checks.validationRunbookReady &&
    checks.validationPreflightReady &&
    checks.validationReceiptStillFutureOnly &&
    checks.validatorsPresent &&
    checks.progressSummaryStillFailClosed &&
    checks.executionPreflightGatesReady &&
    checks.forbiddenExecutionPreflightContentReady &&
    checks.architectureDocMentionsLocalValidationExecutionPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6D",
    scope: "manual_order_permission_local_validation_execution_preflight",
    sourceFiles: {
      ownerExplicitLocalPacketPathSupplyGate: OWNER_PATH_SUPPLY_GATE_PATH,
      manualOrderPermissionPacketValidationRunbook: VALIDATION_RUNBOOK_PATH,
      manualOrderPermissionPacketValidationPreflight: VALIDATION_PREFLIGHT_PATH,
      manualOrderPermissionValidationResultReceipt: VALIDATION_RESULT_RECEIPT_PATH,
      manualOrderPermissionPacketValidator: VALIDATOR_PATH,
      manualOrderPermissionValidationResultReceiptValidator: RECEIPT_VALIDATOR_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      executionPreflightOnly: true,
      ownerLocalPacketPathSuppliedNow: false,
      ownerLocalPacketPathRecordedInRepo: false,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      currentStepRecordsValidationReceipt: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    localValidationExecutionPreflight: {
      validationCommandTemplate: VALIDATION_COMMAND_TEMPLATE,
      receiptCommandTemplate: RECEIPT_COMMAND_TEMPLATE,
      ownerPathRequiredAtExecutionTime: true,
      currentStepMayUseActualOwnerPath: false,
      currentStepMayPersistOwnerPath: false,
      currentStepMayRunValidation: false,
      currentStepMayCreateReceipt: false,
      nextAllowedAction:
        "after the owner supplies an explicit local redacted packet path, run the local packet validator with that explicit path and convert the redacted result into a receipt without storing packet paths or raw values",
      executionPreflightGates,
      forbiddenExecutionPreflightContent,
    },
    checks,
    evidence: {
      missingExecutionPreflightGates,
      missingForbiddenExecutionPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerPathSupplyGateStatus: statusOf(ownerPathSupplyGate),
      validationRunbookStatus: statusOf(validationRunbook),
      validationPreflightStatus: statusOf(validationPreflight),
      validationResultReceiptStatus: statusOf(validationResultReceipt),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForOwnerLocalValidationExecutionAfterPath
        ? "local_validation_execution_preflight_ready_pending_owner_path"
        : "blocked_before_local_validation_execution_preflight",
      readyForOwnerLocalValidationExecutionAfterPath,
      readyForManualOrderPermissionValidationReceiptAfterOwnerPath: readyForOwnerLocalValidationExecutionAfterPath,
      ownerLocalPacketPathSuppliedNow: false,
      ownerLocalPacketPathRecordedInRepo: false,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      currentStepRecordsValidationReceipt: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: ["owner_explicit_local_redacted_packet_path"],
      blockers: [
        ...(checks.ownerPathSupplyGateReady ? [] : ["owner_explicit_local_packet_path_supply_gate_not_ready"]),
        ...(checks.validationRunbookReady ? [] : ["manual_order_permission_validation_runbook_not_ready"]),
        ...(checks.validationPreflightReady ? [] : ["manual_order_permission_validation_preflight_not_ready"]),
        ...(checks.validationReceiptStillFutureOnly ? [] : ["validation_result_receipt_no_longer_future_only"]),
        ...(checks.validatorsPresent ? [] : ["manual_order_permission_validators_missing"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingExecutionPreflightGates.map((gate) => `missing_execution_preflight_gate_${gate}`),
        ...missingForbiddenExecutionPreflightContent.map((content) => `missing_forbidden_execution_preflight_content_${content}`),
        ...(checks.architectureDocMentionsLocalValidationExecutionPreflight
          ? []
          : ["architecture_doc_missing_local_validation_execution_preflight"]),
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
    console.log("[generate-trading-manual-order-permission-local-validation-execution-preflight-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-local-validation-execution-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-local-validation-execution-preflight-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-local-validation-execution-preflight-contract] readyForOwnerLocalValidationExecutionAfterPath=${parsed.readiness.readyForOwnerLocalValidationExecutionAfterPath}`,
  );
}

main();

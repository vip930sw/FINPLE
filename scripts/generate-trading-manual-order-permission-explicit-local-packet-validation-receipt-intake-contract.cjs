const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json",
);
const OWNER_LOCAL_PACKET_ASSERTION_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_assertion_contract.json",
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
const PACKET_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const RECEIPT_VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-validation-result-receipt.cjs");
const INTERNAL_GATE_SEQUENCE_PATH = path.join(
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
  "trading-lab-step116-manual-order-permission-explicit-local-packet-validation-receipt-intake-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const OWNER_LOCAL_PACKET_PATH_PLACEHOLDER = "<owner-local-redacted-packet-path>";
const FUTURE_VALIDATION_COMMAND =
  "node scripts/validate-trading-manual-order-permission-packet.cjs --packet <owner-local-redacted-packet-path> --now <ISO-timestamp>";
const FUTURE_RECEIPT_VALIDATION_COMMAND =
  "node scripts/validate-trading-manual-order-permission-validation-result-receipt.cjs --receipt <owner-local-redacted-receipt-path>";
const REQUIRED_INTAKE_RULES = [
  "explicit_owner_local_packet_path_required",
  "owner_local_packet_path_placeholder_only",
  "do_not_record_private_packet_path",
  "do_not_record_raw_values",
  "do_not_record_hash_values_in_this_step",
  "do_not_run_validator_in_this_step",
  "do_not_create_validation_receipt_in_this_step",
  "receipt_must_be_redacted_and_hash_only_later",
  "receipt_success_does_not_import_permission_packet",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_INTAKE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "private_packet_path",
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
  const ownerLocalPacketAssertion = readJson(OWNER_LOCAL_PACKET_ASSERTION_PATH);
  const validationResultReceipt = readJson(VALIDATION_RESULT_RECEIPT_PATH);
  const receiptValidatorFixtures = readJson(VALIDATION_RESULT_RECEIPT_VALIDATOR_FIXTURES_PATH);
  const validationRunbook = readJson(VALIDATION_RUNBOOK_PATH);
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const packetValidatorFixtures = readJson(PACKET_VALIDATOR_FIXTURES_PATH);
  const internalGateSequence = readJson(INTERNAL_GATE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const intakeRules = [...REQUIRED_INTAKE_RULES];
  const forbiddenIntakeContent = [...FORBIDDEN_INTAKE_CONTENT];
  const missingIntakeRules = missingValues(intakeRules, REQUIRED_INTAKE_RULES);
  const missingForbiddenIntakeContent = missingValues(forbiddenIntakeContent, FORBIDDEN_INTAKE_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    ownerLocalPacketAssertionReady:
      ownerLocalPacketAssertion.readiness?.readyForExplicitLocalPathValidationReceipt === true &&
      ownerLocalPacketAssertion.readiness?.currentStepRecordsPacketPath === false &&
      ownerLocalPacketAssertion.readiness?.currentStepRecordsValidationReceipt === false &&
      ownerLocalPacketAssertion.readiness?.orderSubmissionAllowed === false,
    validationReceiptReadyForFutureReview:
      validationResultReceipt.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      validationResultReceipt.readiness?.validationReceiptRecordedNow === false &&
      validationResultReceipt.readiness?.packetPathRecorded === false &&
      validationResultReceipt.readiness?.rawValuesRecorded === false &&
      validationResultReceipt.readiness?.permissionPacketImportedNow === false,
    receiptValidatorFixturesReady:
      receiptValidatorFixtures.readiness?.readyForManualOrderPermissionValidationResultReceiptValidatorRegression === true &&
      receiptValidatorFixtures.readiness?.providerCallsAllowed === false &&
      receiptValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validationRunbookReady:
      validationRunbook.readiness?.readyForOwnerAssistedValidationRunbookReview === true &&
      validationRunbook.readiness?.currentStepRunsValidator === false &&
      validationRunbook.readiness?.currentStepReadsPrivatePacket === false,
    validationPreflightReadyButDoesNotReadPacket:
      validationPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      validationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      validationPreflight.readiness?.permissionPacketImportedNow === false,
    packetValidatorFixturesReady:
      packetValidatorFixtures.readiness?.readyForManualOrderPermissionPacketValidatorRegression === true &&
      packetValidatorFixtures.readiness?.providerCallsAllowed === false &&
      packetValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    localValidatorsPresent: fs.existsSync(VALIDATOR_PATH) && fs.existsSync(RECEIPT_VALIDATOR_PATH),
    internalGateSequenceStillWaitingForReceipt:
      internalGateSequence.readiness?.ownerLocalManualPacketPreparationUnlocked === true &&
      internalGateSequence.readiness?.validationReceiptEvidenceRecorded === false &&
      internalGateSequence.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    intakeRulesReady: missingIntakeRules.length === 0,
    forbiddenIntakeContentReady: missingForbiddenIntakeContent.length === 0,
    architectureDocMentionsExplicitLocalPacketValidationReceiptIntake:
      architectureDoc.includes("Trading Manual Order Permission Explicit Local Packet Validation Receipt Intake") &&
      architectureDoc.includes("manual_order_permission_explicit_local_packet_validation_receipt_intake"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepReadsPrivatePacket: false,
    currentStepRecordsPacketPath: false,
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

  const readyForOwnerSuppliedExplicitLocalPacketValidation =
    checks.ownerLocalPacketAssertionReady &&
    checks.validationReceiptReadyForFutureReview &&
    checks.receiptValidatorFixturesReady &&
    checks.validationRunbookReady &&
    checks.validationPreflightReadyButDoesNotReadPacket &&
    checks.packetValidatorFixturesReady &&
    checks.localValidatorsPresent &&
    checks.internalGateSequenceStillWaitingForReceipt &&
    checks.progressSummaryStillFailClosed &&
    checks.intakeRulesReady &&
    checks.forbiddenIntakeContentReady &&
    checks.architectureDocMentionsExplicitLocalPacketValidationReceiptIntake &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6B",
    scope: "manual_order_permission_explicit_local_packet_validation_receipt_intake",
    sourceFiles: {
      ownerLocalPacketPreparationAssertion: OWNER_LOCAL_PACKET_ASSERTION_PATH,
      manualOrderPermissionValidationResultReceipt: VALIDATION_RESULT_RECEIPT_PATH,
      manualOrderPermissionValidationResultReceiptValidatorFixtures: VALIDATION_RESULT_RECEIPT_VALIDATOR_FIXTURES_PATH,
      manualOrderPermissionPacketValidationRunbook: VALIDATION_RUNBOOK_PATH,
      manualOrderPermissionPacketValidationPreflight: VALIDATION_PREFLIGHT_PATH,
      manualOrderPermissionPacketValidatorFixtures: PACKET_VALIDATOR_FIXTURES_PATH,
      manualOrderPermissionPacketValidator: VALIDATOR_PATH,
      manualOrderPermissionValidationResultReceiptValidator: RECEIPT_VALIDATOR_PATH,
      liveGuardedInternalGateClearanceSequence: INTERNAL_GATE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      intakeOnly: true,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsPacketPath: false,
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
    explicitLocalPacketValidationReceiptIntake: {
      ownerLocalPacketPathPlaceholder: OWNER_LOCAL_PACKET_PATH_PLACEHOLDER,
      futureValidationCommand: FUTURE_VALIDATION_COMMAND,
      futureReceiptValidationCommand: FUTURE_RECEIPT_VALIDATION_COMMAND,
      currentStepAcceptsActualPathValue: false,
      currentStepRecordsActualPathValue: false,
      currentStepRunsValidation: false,
      currentStepCreatesReceipt: false,
      nextAllowedAction:
        "owner may provide an explicit local redacted packet path in a later step; validation output may then be converted into a redacted receipt without path or raw-value storage",
      requiredIntakeRules: intakeRules,
      forbiddenIntakeContent,
    },
    checks,
    evidence: {
      missingIntakeRules,
      missingForbiddenIntakeContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerLocalPacketAssertionStatus: statusOf(ownerLocalPacketAssertion),
      validationResultReceiptStatus: statusOf(validationResultReceipt),
      validationResultReceiptValidatorFixturesStatus: statusOf(receiptValidatorFixtures),
      validationRunbookStatus: statusOf(validationRunbook),
      validationPreflightStatus: statusOf(validationPreflight),
      packetValidatorFixturesStatus: statusOf(packetValidatorFixtures),
      internalGateSequenceStatus: statusOf(internalGateSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForOwnerSuppliedExplicitLocalPacketValidation
        ? "explicit_local_packet_validation_receipt_intake_ready_pending_owner_local_path"
        : "blocked_before_explicit_local_packet_validation_receipt_intake",
      readyForOwnerSuppliedExplicitLocalPacketValidation,
      readyForManualOrderPermissionValidationReceiptWithExplicitLocalPath:
        readyForOwnerSuppliedExplicitLocalPacketValidation,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsPacketPath: false,
      currentStepRunsValidator: false,
      currentStepRecordsValidationReceipt: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.ownerLocalPacketAssertionReady ? [] : ["owner_local_packet_preparation_assertion_not_ready"]),
        ...(checks.validationReceiptReadyForFutureReview ? [] : ["validation_result_receipt_contract_not_ready"]),
        ...(checks.receiptValidatorFixturesReady ? [] : ["validation_result_receipt_validator_fixtures_not_ready"]),
        ...(checks.validationRunbookReady ? [] : ["manual_order_permission_validation_runbook_not_ready"]),
        ...(checks.validationPreflightReadyButDoesNotReadPacket
          ? []
          : ["manual_order_permission_validation_preflight_reads_packet_or_not_ready"]),
        ...(checks.packetValidatorFixturesReady ? [] : ["manual_order_permission_packet_validator_fixtures_not_ready"]),
        ...(checks.localValidatorsPresent ? [] : ["manual_order_permission_local_validators_missing"]),
        ...(checks.internalGateSequenceStillWaitingForReceipt ? [] : ["internal_gate_sequence_not_waiting_for_receipt"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingIntakeRules.map((rule) => `missing_intake_rule_${rule}`),
        ...missingForbiddenIntakeContent.map((content) => `missing_forbidden_intake_content_${content}`),
        ...(checks.architectureDocMentionsExplicitLocalPacketValidationReceiptIntake
          ? []
          : ["architecture_doc_missing_explicit_local_packet_validation_receipt_intake"]),
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
    console.log("[generate-trading-manual-order-permission-explicit-local-packet-validation-receipt-intake-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-explicit-local-packet-validation-receipt-intake-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log(
    "[generate-trading-manual-order-permission-explicit-local-packet-validation-receipt-intake-contract] wrote contract",
  );
  console.log(
    `[generate-trading-manual-order-permission-explicit-local-packet-validation-receipt-intake-contract] readyForManualOrderPermissionValidationReceiptWithExplicitLocalPath=${parsed.readiness.readyForManualOrderPermissionValidationReceiptWithExplicitLocalPath}`,
  );
}

main();

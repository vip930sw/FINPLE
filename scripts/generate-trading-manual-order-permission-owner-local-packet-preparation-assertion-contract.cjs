const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_assertion_contract.json",
);
const OWNER_LOCAL_HANDOFF_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_handoff_contract.json",
);
const HASH_INPUT_DECISION_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json",
);
const VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
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
  "trading-lab-step116-manual-order-permission-owner-local-packet-preparation-assertion-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const OWNER_ASSERTED_AT = "2026-07-01T18:15:00+09:00";
const OWNER_ASSERTION_SUMMARY =
  "owner directed the next step to prepare the owner-local redacted manual order permission packet outside repo commits before explicit local-path validation";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const FUTURE_VALIDATION_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission_validation_result_receipt.redacted.json",
);
const REQUIRED_NEXT_ACTIONS = [
  "owner_prepares_redacted_packet_outside_repo_commits",
  "owner_keeps_raw_values_and_hash_values_out_of_repo",
  "owner_supplies_explicit_local_packet_path_later",
  "validator_runs_only_with_explicit_owner_local_packet_path",
  "validation_receipt_records_hash_only_result_later",
  "receipt_must_not_record_private_packet_path",
  "receipt_must_not_record_raw_values",
  "receipt_must_not_import_permission_packet",
  "receipt_must_not_enable_provider_calls_or_orders",
];
const FORBIDDEN_ASSERTION_CONTENT = [
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
  FUTURE_PERMISSION_PACKET_PATH,
  FUTURE_VALIDATION_RECEIPT_PATH,
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
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
  const ownerLocalHandoff = readJson(OWNER_LOCAL_HANDOFF_PATH);
  const hashInputDecision = readJson(HASH_INPUT_DECISION_PATH);
  const validationResultReceipt = readJson(VALIDATION_RESULT_RECEIPT_PATH);
  const validationRunbook = readJson(VALIDATION_RUNBOOK_PATH);
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const internalGateSequence = readJson(INTERNAL_GATE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const nextActions = [...REQUIRED_NEXT_ACTIONS];
  const forbiddenAssertionContent = [...FORBIDDEN_ASSERTION_CONTENT];
  const missingNextActions = missingValues(nextActions, REQUIRED_NEXT_ACTIONS);
  const missingForbiddenAssertionContent = missingValues(forbiddenAssertionContent, FORBIDDEN_ASSERTION_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    ownerLocalHandoffReady:
      ownerLocalHandoff.readiness?.readyForOwnerLocalPacketPreparationHandoff === true &&
      ownerLocalHandoff.readiness?.currentStepCreatesPermissionPacket === false &&
      ownerLocalHandoff.readiness?.currentStepReadsPrivatePacket === false &&
      ownerLocalHandoff.readiness?.currentStepRecordsPacketPath === false &&
      ownerLocalHandoff.readiness?.orderSubmissionAllowed === false,
    hashInputDecisionReady:
      hashInputDecision.readiness?.ownerLocalHashInputPreparationUnlocked === true &&
      hashInputDecision.readiness?.hashValuesRecordedNow === false &&
      hashInputDecision.readiness?.permissionPacketCreatedNow === false,
    validationReceiptReadyForFutureReview:
      validationResultReceipt.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      validationResultReceipt.readiness?.validationReceiptRecordedNow === false &&
      validationResultReceipt.readiness?.packetPathRecorded === false &&
      validationResultReceipt.readiness?.rawValuesRecorded === false &&
      validationResultReceipt.readiness?.permissionPacketImportedNow === false,
    validationRunbookReady:
      validationRunbook.readiness?.readyForOwnerAssistedValidationRunbookReview === true &&
      validationRunbook.readiness?.currentStepRunsValidator === false &&
      validationRunbook.readiness?.currentStepReadsPrivatePacket === false,
    validationPreflightReadyButDoesNotReadPacket:
      validationPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      validationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      validationPreflight.readiness?.permissionPacketImportedNow === false,
    internalGateSequenceStillWaitingForReceipt:
      internalGateSequence.readiness?.ownerLocalManualPacketPreparationUnlocked === true &&
      internalGateSequence.readiness?.validationReceiptEvidenceRecorded === false &&
      internalGateSequence.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    nextActionsReady: missingNextActions.length === 0,
    forbiddenAssertionContentReady: missingForbiddenAssertionContent.length === 0,
    architectureDocMentionsOwnerLocalPacketPreparationAssertion:
      architectureDoc.includes("Trading Manual Order Permission Owner-Local Packet Preparation Assertion") &&
      architectureDoc.includes("manual_order_permission_owner_local_packet_preparation_assertion"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepCreatesPermissionPacket: false,
    currentStepReadsPrivatePacket: false,
    currentStepRecordsPacketPath: false,
    currentStepRunsValidator: false,
    currentStepRecordsValidationReceipt: false,
    hashValuesRecordedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const ownerLocalPacketPreparationAssertionReady =
    checks.ownerLocalHandoffReady &&
    checks.hashInputDecisionReady &&
    checks.validationReceiptReadyForFutureReview &&
    checks.validationRunbookReady &&
    checks.validationPreflightReadyButDoesNotReadPacket &&
    checks.internalGateSequenceStillWaitingForReceipt &&
    checks.progressSummaryStillFailClosed &&
    checks.nextActionsReady &&
    checks.forbiddenAssertionContentReady &&
    checks.architectureDocMentionsOwnerLocalPacketPreparationAssertion &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6A",
    scope: "manual_order_permission_owner_local_packet_preparation_assertion",
    sourceFiles: {
      ownerLocalPacketPreparationHandoff: OWNER_LOCAL_HANDOFF_PATH,
      manualOrderPermissionHashInputDecision: HASH_INPUT_DECISION_PATH,
      manualOrderPermissionValidationResultReceipt: VALIDATION_RESULT_RECEIPT_PATH,
      manualOrderPermissionPacketValidationRunbook: VALIDATION_RUNBOOK_PATH,
      manualOrderPermissionPacketValidationPreflight: VALIDATION_PREFLIGHT_PATH,
      liveGuardedInternalGateClearanceSequence: INTERNAL_GATE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      assertionOnly: true,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsPacketPath: false,
      currentStepRunsValidator: false,
      currentStepRecordsValidationReceipt: false,
      hashValuesRecordedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    ownerLocalPacketPreparationAssertion: {
      assertedAt: OWNER_ASSERTED_AT,
      assertionSummary: OWNER_ASSERTION_SUMMARY,
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      futureValidationReceiptPath: FUTURE_VALIDATION_RECEIPT_PATH,
      packetPreparedInRepoNow: false,
      packetPathRecordedNow: false,
      validationReceiptRecordedNow: false,
      nextAllowedAction:
        "owner may supply an explicit local redacted packet path later for local validation and hash-only receipt creation",
      requiredNextActions: nextActions,
      forbiddenAssertionContent,
    },
    checks,
    evidence: {
      missingNextActions,
      missingForbiddenAssertionContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerLocalPacketPreparationHandoffStatus: statusOf(ownerLocalHandoff),
      hashInputDecisionStatus: statusOf(hashInputDecision),
      validationResultReceiptStatus: statusOf(validationResultReceipt),
      validationRunbookStatus: statusOf(validationRunbook),
      validationPreflightStatus: statusOf(validationPreflight),
      internalGateSequenceStatus: statusOf(internalGateSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: ownerLocalPacketPreparationAssertionReady
        ? "owner_local_packet_preparation_assertion_ready_pending_explicit_local_path_validation"
        : "blocked_before_owner_local_packet_preparation_assertion",
      ownerLocalPacketPreparationAssertionReady,
      readyForExplicitLocalPathValidationReceipt: ownerLocalPacketPreparationAssertionReady,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsPacketPath: false,
      currentStepRunsValidator: false,
      currentStepRecordsValidationReceipt: false,
      hashValuesRecordedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.ownerLocalHandoffReady ? [] : ["owner_local_packet_preparation_handoff_not_ready"]),
        ...(checks.hashInputDecisionReady ? [] : ["manual_order_permission_hash_input_decision_not_ready"]),
        ...(checks.validationReceiptReadyForFutureReview
          ? []
          : ["manual_order_permission_validation_receipt_not_ready_for_future_review"]),
        ...(checks.validationRunbookReady ? [] : ["manual_order_permission_validation_runbook_not_ready"]),
        ...(checks.validationPreflightReadyButDoesNotReadPacket
          ? []
          : ["manual_order_permission_validation_preflight_reads_packet_or_not_ready"]),
        ...(checks.internalGateSequenceStillWaitingForReceipt ? [] : ["internal_gate_sequence_not_waiting_for_receipt"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingNextActions.map((action) => `missing_next_action_${action}`),
        ...missingForbiddenAssertionContent.map((content) => `missing_forbidden_assertion_content_${content}`),
        ...(checks.architectureDocMentionsOwnerLocalPacketPreparationAssertion
          ? []
          : ["architecture_doc_missing_owner_local_packet_preparation_assertion"]),
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
    console.log("[generate-trading-manual-order-permission-owner-local-packet-preparation-assertion-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-owner-local-packet-preparation-assertion-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-owner-local-packet-preparation-assertion-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-owner-local-packet-preparation-assertion-contract] readyForExplicitLocalPathValidationReceipt=${parsed.readiness.readyForExplicitLocalPathValidationReceipt}`,
  );
}

main();

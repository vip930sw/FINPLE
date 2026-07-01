const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_handoff_contract.json",
);
const HASH_INPUT_DECISION_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json",
);
const REDACTED_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const PACKET_PREPARATION_CHECKLIST_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
);
const PACKET_VALIDATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
);
const PACKET_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const KIS_TERMS_PERMISSION_ASSERTION_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json",
);
const INTERNAL_GATE_SEQUENCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-owner-local-packet-preparation-handoff-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const FUTURE_HASH_INPUT_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission_hash_inputs.redacted.json",
);
const FUTURE_VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const REQUIRED_PACKET_FIELDS = [
  "permissionId",
  "mode",
  "approvedByHash",
  "approvedAt",
  "expiresAt",
  "operatorAccessHash",
  "manualApprovalPolicyHash",
  "orderAdapterDesignReviewHash",
  "killSwitchClearanceHash",
  "riskGateClearanceHash",
  "orderCredentialBoundaryHash",
  "dryRunReplayHash",
  "shadowHistoryReviewHash",
  "auditLoggerReadinessHash",
  "allowedSymbolHashes",
  "maxOrderNotional",
  "dailyLossLimit",
  "orderAttemptLimit",
  "revocationPlanHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_HANDOFF_RULES = [
  "explicit_owner_request_required",
  "prepare_owner_local_redacted_packet_outside_repo_commits",
  "use_hash_input_decision_labels",
  "use_redacted_manual_order_permission_template",
  "use_packet_preparation_checklist",
  "run_validator_later_with_explicit_owner_local_packet_path",
  "do_not_record_private_packet_path",
  "do_not_record_raw_values",
  "do_not_record_hash_values_in_this_step",
  "do_not_import_permission_packet_in_this_step",
  "do_not_call_kis_or_any_provider",
  "do_not_submit_orders",
  "keep_provider_order_runtime_ui_db_flags_false",
  "record_redacted_validation_result_receipt_later",
];
const FORBIDDEN_HANDOFF_CONTENT = [
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
  "scenario_monthly_return_row",
  "private_packet_path",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_PERMISSION_PACKET_PATH,
  FUTURE_HASH_INPUT_PATH,
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
  const hashInputDecision = readJson(HASH_INPUT_DECISION_PATH);
  const redactedTemplate = readJson(REDACTED_TEMPLATE_PATH);
  const packetChecklist = readJson(PACKET_PREPARATION_CHECKLIST_PATH);
  const packetValidationRunbook = readJson(PACKET_VALIDATION_RUNBOOK_PATH);
  const packetValidationPreflight = readJson(PACKET_VALIDATION_PREFLIGHT_PATH);
  const kisTermsAssertion = readJson(KIS_TERMS_PERMISSION_ASSERTION_PATH);
  const internalGateSequence = readJson(INTERNAL_GATE_SEQUENCE_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const requiredPacketFields = [...REQUIRED_PACKET_FIELDS];
  const requiredHandoffRules = [...REQUIRED_HANDOFF_RULES];
  const forbiddenHandoffContent = [...FORBIDDEN_HANDOFF_CONTENT];
  const missingPacketFields = missingValues(requiredPacketFields, REQUIRED_PACKET_FIELDS);
  const missingHandoffRules = missingValues(requiredHandoffRules, REQUIRED_HANDOFF_RULES);
  const missingForbiddenHandoffContent = missingValues(forbiddenHandoffContent, FORBIDDEN_HANDOFF_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    handoffOnly: true,
    hashInputDecisionReady:
      hashInputDecision.readiness?.ownerLocalHashInputPreparationUnlocked === true &&
      hashInputDecision.readiness?.hashValuesRecordedNow === false &&
      hashInputDecision.readiness?.permissionPacketCreatedNow === false &&
      hashInputDecision.readiness?.validationRunNow === false,
    redactedTemplateReady:
      redactedTemplate.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      redactedTemplate.readiness?.permissionPacketCreatedNow === false &&
      redactedTemplate.readiness?.permissionPacketImportedNow === false,
    packetChecklistReady:
      packetChecklist.readiness?.readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist === true &&
      packetChecklist.readiness?.currentStepReadsPrivatePacket === false &&
      packetChecklist.readiness?.currentStepRunsValidator === false &&
      packetChecklist.readiness?.orderSubmissionAllowed === false,
    packetValidationRunbookReady:
      packetValidationRunbook.readiness?.readyForOwnerAssistedValidationRunbookReview === true &&
      packetValidationRunbook.readiness?.currentStepRunsValidator === false &&
      packetValidationRunbook.readiness?.currentStepReadsPrivatePacket === false &&
      packetValidationRunbook.readiness?.permissionPacketImportedNow === false,
    validationPreflightReadyButDoesNotReadPacket:
      packetValidationPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      packetValidationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      packetValidationPreflight.readiness?.permissionPacketImportedNow === false,
    kisTermsPermissionExternalBlockerCleared:
      kisTermsAssertion.readiness?.termsPermissionExternalBlockerCleared === true &&
      kisTermsAssertion.readiness?.orderSubmissionAllowed === false,
    internalGateSequenceStillOwnerLocalOnly:
      internalGateSequence.readiness?.ownerLocalManualPacketPreparationUnlocked === true &&
      internalGateSequence.readiness?.validationReceiptEvidenceRecorded === false &&
      internalGateSequence.readiness?.orderSubmissionAllowed === false,
    packetFieldsReady: missingPacketFields.length === 0,
    handoffRulesReady: missingHandoffRules.length === 0,
    forbiddenHandoffContentReady: missingForbiddenHandoffContent.length === 0,
    architectureDocMentionsOwnerLocalPacketPreparationHandoff:
      architectureDoc.includes("Trading Manual Order Permission Owner-Local Packet Preparation Handoff") &&
      architectureDoc.includes("manual_order_permission_owner_local_packet_preparation_handoff"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepCreatesPermissionPacket: false,
    currentStepReadsPrivatePacket: false,
    currentStepRecordsPacketPath: false,
    currentStepRunsValidator: false,
    hashValuesRecordedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForOwnerLocalPacketPreparationHandoff =
    checks.hashInputDecisionReady &&
    checks.redactedTemplateReady &&
    checks.packetChecklistReady &&
    checks.packetValidationRunbookReady &&
    checks.validationPreflightReadyButDoesNotReadPacket &&
    checks.kisTermsPermissionExternalBlockerCleared &&
    checks.internalGateSequenceStillOwnerLocalOnly &&
    checks.packetFieldsReady &&
    checks.handoffRulesReady &&
    checks.forbiddenHandoffContentReady &&
    checks.architectureDocMentionsOwnerLocalPacketPreparationHandoff &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5Z",
    scope: "manual_order_permission_owner_local_packet_preparation_handoff",
    sourceFiles: {
      manualOrderPermissionHashInputDecision: HASH_INPUT_DECISION_PATH,
      redactedManualOrderPermissionTemplate: REDACTED_TEMPLATE_PATH,
      manualOrderPermissionPacketPreparationChecklist: PACKET_PREPARATION_CHECKLIST_PATH,
      manualOrderPermissionPacketValidationRunbook: PACKET_VALIDATION_RUNBOOK_PATH,
      manualOrderPermissionPacketValidationPreflight: PACKET_VALIDATION_PREFLIGHT_PATH,
      kisPersonalTermsPermissionAssertion: KIS_TERMS_PERMISSION_ASSERTION_PATH,
      liveGuardedInternalGateClearanceSequence: INTERNAL_GATE_SEQUENCE_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      handoffOnly: true,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsPacketPath: false,
      currentStepRunsValidator: false,
      hashValuesRecordedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerLocalPacketPreparationHandoff: {
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      futureHashInputPath: FUTURE_HASH_INPUT_PATH,
      futureValidatorPath: FUTURE_VALIDATOR_PATH,
      futureExplicitValidationCommand:
        "node scripts/validate-trading-manual-order-permission-packet.cjs --packet <owner-local-redacted-packet-path> --now <ISO-timestamp>",
      requiredOwnerLocalPacketFields: requiredPacketFields,
      requiredHandoffRules,
      forbiddenHandoffContent,
      nextEligibleReceiptStep:
        "record a redacted validation-result receipt only after the owner supplies an explicit local packet path and the validator succeeds",
    },
    checks,
    evidence: {
      missingPacketFields,
      missingHandoffRules,
      missingForbiddenHandoffContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      hashInputDecisionStatus: statusOf(hashInputDecision),
      redactedTemplateStatus: statusOf(redactedTemplate),
      packetPreparationChecklistStatus: statusOf(packetChecklist),
      packetValidationRunbookStatus: statusOf(packetValidationRunbook),
      packetValidationPreflightStatus: statusOf(packetValidationPreflight),
      kisPersonalTermsPermissionAssertionStatus: statusOf(kisTermsAssertion),
      internalGateSequenceStatus: statusOf(internalGateSequence),
    },
    readiness: {
      status: readyForOwnerLocalPacketPreparationHandoff
        ? "owner_local_packet_preparation_handoff_ready_pending_owner_local_redacted_packet"
        : "blocked_before_owner_local_manual_order_permission_packet_preparation_handoff",
      readyForOwnerLocalPacketPreparationHandoff,
      ownerLocalPacketPreparationHandoffUnlocked: readyForOwnerLocalPacketPreparationHandoff,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsPacketPath: false,
      currentStepRunsValidator: false,
      hashValuesRecordedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.hashInputDecisionReady ? [] : ["manual_order_permission_hash_input_decision_not_ready"]),
        ...(checks.redactedTemplateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.packetChecklistReady ? [] : ["manual_order_permission_packet_preparation_checklist_not_ready"]),
        ...(checks.packetValidationRunbookReady ? [] : ["manual_order_permission_packet_validation_runbook_not_ready"]),
        ...(checks.validationPreflightReadyButDoesNotReadPacket
          ? []
          : ["manual_order_permission_packet_validation_preflight_reads_packet_or_not_ready"]),
        ...(checks.kisTermsPermissionExternalBlockerCleared ? [] : ["kis_terms_permission_external_blocker_not_cleared"]),
        ...(checks.internalGateSequenceStillOwnerLocalOnly ? [] : ["internal_gate_sequence_not_owner_local_only"]),
        ...missingPacketFields.map((field) => `missing_packet_field_${field}`),
        ...missingHandoffRules.map((rule) => `missing_handoff_rule_${rule}`),
        ...missingForbiddenHandoffContent.map((item) => `missing_forbidden_handoff_content_${item}`),
        ...(checks.architectureDocMentionsOwnerLocalPacketPreparationHandoff
          ? []
          : ["architecture_doc_missing_owner_local_packet_preparation_handoff"]),
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
    console.log("[generate-trading-manual-order-permission-owner-local-packet-preparation-handoff-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-owner-local-packet-preparation-handoff-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-manual-order-permission-owner-local-packet-preparation-handoff-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-owner-local-packet-preparation-handoff-contract] readyForOwnerLocalPacketPreparationHandoff=${parsed.readiness.readyForOwnerLocalPacketPreparationHandoff}`,
  );
}

main();

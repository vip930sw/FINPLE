const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json",
);
const HASH_PREPARATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
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
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-hash-input-decision-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_HASH_INPUT_DECISIONS = [
  "approvedByHash",
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
  "revocationPlanHash",
];
const REQUIRED_DECISION_RULES = [
  "owner_prepares_raw_inputs_outside_repo",
  "owner_uses_private_pepper_outside_repo",
  "repo_records_hash_labels_only",
  "no_hash_values_committed_by_this_step",
  "no_private_packet_created_by_this_step",
  "no_validation_run_by_this_step",
  "no_permission_import_by_this_step",
  "provider_order_runtime_ui_flags_remain_false",
];
const FORBIDDEN_INPUT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
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
  const hashRunbook = readJson(HASH_PREPARATION_RUNBOOK_PATH);
  const redactedTemplate = readJson(REDACTED_TEMPLATE_PATH);
  const packetChecklist = readJson(PACKET_PREPARATION_CHECKLIST_PATH);
  const kisTermsAssertion = readJson(KIS_TERMS_PERMISSION_ASSERTION_PATH);
  const internalGateSequence = readJson(INTERNAL_GATE_SEQUENCE_PATH);
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const hashInputDecisions = [...REQUIRED_HASH_INPUT_DECISIONS];
  const decisionRules = [...REQUIRED_DECISION_RULES];
  const forbiddenInputContent = [...FORBIDDEN_INPUT_CONTENT];
  const missingHashInputDecisions = missingValues(hashInputDecisions, REQUIRED_HASH_INPUT_DECISIONS);
  const missingDecisionRules = missingValues(decisionRules, REQUIRED_DECISION_RULES);
  const missingForbiddenInputContent = missingValues(forbiddenInputContent, FORBIDDEN_INPUT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    hashRunbookReady:
      hashRunbook.readiness?.readyForOwnerAssistedHashPreparationRunbookReview === true &&
      hashRunbook.readiness?.rawInputsRequestedNow === false &&
      hashRunbook.readiness?.hashGenerationAllowed === false &&
      hashRunbook.readiness?.permissionPacketCreatedNow === false,
    redactedTemplateReady:
      redactedTemplate.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      redactedTemplate.readiness?.permissionPacketCreatedNow === false &&
      redactedTemplate.readiness?.permissionPacketImportedNow === false,
    packetChecklistReady:
      packetChecklist.readiness?.readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist === true &&
      packetChecklist.readiness?.currentStepReadsPrivatePacket === false &&
      packetChecklist.readiness?.orderSubmissionAllowed === false,
    kisTermsPermissionExternalBlockerCleared:
      kisTermsAssertion.readiness?.termsPermissionExternalBlockerCleared === true &&
      kisTermsAssertion.readiness?.orderSubmissionAllowed === false,
    internalGateSequenceStillOwnerLocalOnly:
      internalGateSequence.readiness?.ownerLocalManualPacketPreparationUnlocked === true &&
      internalGateSequence.readiness?.validationReceiptEvidenceRecorded === false &&
      internalGateSequence.readiness?.orderSubmissionAllowed === false,
    validationPreflightReadyButDoesNotReadPacket:
      validationPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      validationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      validationPreflight.readiness?.permissionPacketImportedNow === false,
    hashInputDecisionsReady: missingHashInputDecisions.length === 0,
    decisionRulesReady: missingDecisionRules.length === 0,
    forbiddenInputContentReady: missingForbiddenInputContent.length === 0,
    architectureDocMentionsHashInputDecision:
      architectureDoc.includes("Trading Manual Order Permission Hash Input Decision") &&
      architectureDoc.includes("manual_order_permission_hash_input_decision"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    rawInputsRequestedNow: false,
    privatePepperRequestedNow: false,
    hashGenerationAllowed: false,
    hashValuesRecordedNow: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    validationRunNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForOwnerLocalHashInputPreparation =
    checks.hashRunbookReady &&
    checks.redactedTemplateReady &&
    checks.packetChecklistReady &&
    checks.kisTermsPermissionExternalBlockerCleared &&
    checks.internalGateSequenceStillOwnerLocalOnly &&
    checks.validationPreflightReadyButDoesNotReadPacket &&
    checks.hashInputDecisionsReady &&
    checks.decisionRulesReady &&
    checks.forbiddenInputContentReady &&
    checks.architectureDocMentionsHashInputDecision &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5Y",
    scope: "manual_order_permission_hash_input_decision",
    sourceFiles: {
      manualOrderPermissionHashPreparationRunbook: HASH_PREPARATION_RUNBOOK_PATH,
      redactedManualOrderPermissionTemplate: REDACTED_TEMPLATE_PATH,
      manualOrderPermissionPacketPreparationChecklist: PACKET_PREPARATION_CHECKLIST_PATH,
      kisPersonalTermsPermissionAssertion: KIS_TERMS_PERMISSION_ASSERTION_PATH,
      liveGuardedInternalGateClearanceSequence: INTERNAL_GATE_SEQUENCE_PATH,
      manualOrderPermissionPacketValidationPreflight: VALIDATION_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      hashInputDecisionOnly: true,
      rawInputsRequestedNow: false,
      privatePepperRequestedNow: false,
      hashGenerationAllowed: false,
      hashValuesRecordedNow: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      validationRunNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    ownerLocalHashInputDecision: {
      futurePrivateHashInputPath: path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
      currentStepCreatesPrivateHashInputFile: false,
      currentStepRecordsHashValues: false,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      approvedHashInputLabels: hashInputDecisions,
      decisionRules,
      forbiddenInputContent,
      nextOwnerLocalAction:
        "prepare raw values and a private pepper outside the repo, produce labelled hashes only, then use the private packet template outside commits",
    },
    checks,
    evidence: {
      missingHashInputDecisions,
      missingDecisionRules,
      missingForbiddenInputContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      hashPreparationRunbookStatus: statusOf(hashRunbook),
      redactedTemplateStatus: statusOf(redactedTemplate),
      packetPreparationChecklistStatus: statusOf(packetChecklist),
      kisPersonalTermsPermissionAssertionStatus: statusOf(kisTermsAssertion),
      internalGateSequenceStatus: statusOf(internalGateSequence),
      validationPreflightStatus: statusOf(validationPreflight),
    },
    readiness: {
      status: readyForOwnerLocalHashInputPreparation
        ? "hash_input_decision_ready_owner_local_hash_preparation_unlocked"
        : "blocked_before_manual_order_permission_hash_input_decision",
      readyForOwnerLocalHashInputPreparation,
      ownerLocalHashInputPreparationUnlocked: readyForOwnerLocalHashInputPreparation,
      rawInputsRequestedNow: false,
      privatePepperRequestedNow: false,
      hashGenerationAllowed: false,
      hashValuesRecordedNow: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      validationRunNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.hashRunbookReady ? [] : ["hash_preparation_runbook_not_ready"]),
        ...(checks.redactedTemplateReady ? [] : ["redacted_template_not_ready"]),
        ...(checks.packetChecklistReady ? [] : ["packet_preparation_checklist_not_ready"]),
        ...(checks.kisTermsPermissionExternalBlockerCleared ? [] : ["kis_terms_permission_external_blocker_not_cleared"]),
        ...(checks.internalGateSequenceStillOwnerLocalOnly ? [] : ["internal_gate_sequence_not_owner_local_only"]),
        ...(checks.validationPreflightReadyButDoesNotReadPacket ? [] : ["validation_preflight_not_ready_or_reads_packet"]),
        ...(checks.hashInputDecisionsReady ? [] : ["hash_input_decision_labels_missing"]),
        ...(checks.decisionRulesReady ? [] : ["hash_input_decision_rules_missing"]),
        ...(checks.forbiddenInputContentReady ? [] : ["forbidden_input_content_missing"]),
        ...(checks.architectureDocMentionsHashInputDecision ? [] : ["architecture_doc_missing_hash_input_decision"]),
        ...(checks.noRuntimeArtifacts ? [] : ["forbidden_runtime_artifact_present"]),
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
  } else {
    fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
    fs.writeFileSync(CONTRACT_PATH, expected);
  }
  console.log("[generate-trading-manual-order-permission-hash-input-decision-contract] ok");
  console.log(`[generate-trading-manual-order-permission-hash-input-decision-contract] contract=${CONTRACT_PATH}`);
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_preparation_runbook_contract.json",
);
const OWNER_ACTION_QUEUE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json",
);
const REDACTED_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_read_only_approval_template.json",
);
const HASH_HELPER_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_contract.json",
);
const HASH_HELPER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
);
const PACKET_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);
const APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-approval-packet-preparation-runbook-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-redacted-approval-hashes.cjs");
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const REQUIRED_RUNBOOK_STEPS = [
  "explicit_owner_request_required",
  "confirm_mock_trading_portal_status_snapshot",
  "confirm_render_env_is_mock_scope_without_copying_values",
  "confirm_repo_worktree_clean_before_private_inputs",
  "prepare_private_pepper_outside_repo",
  "prepare_raw_inputs_outside_repo",
  "generate_hashes_only_after_owner_request",
  "copy_hash_outputs_only_into_owner_local_packet",
  "use_redacted_template_fields_only",
  "keep_provider_order_runtime_ui_flags_false",
  "run_local_packet_validator_later_with_explicit_path",
  "do_not_commit_private_packet_or_hash_outputs",
  "do_not_import_packet_in_this_step",
  "do_not_call_kis_or_alpha_or_any_provider",
  "keep_scenario_monthly_returns_absent",
];
const REQUIRED_PACKET_FIELDS = [
  "approvalId",
  "approvedByHash",
  "approvedAt",
  "expiresAt",
  "scope",
  "environment",
  "baseUrlScope",
  "accountIdHash",
  "allowedReadScopes",
  "forbiddenActions",
  "evidenceTicketHash",
  "revocationPlanHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_HASH_LABELS = [
  "approvedByHash",
  "accountIdHash",
  "evidenceTicketHash",
  "revocationPlanHash",
];
const FORBIDDEN_RUNBOOK_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_name",
  "raw_evidence_text",
  "raw_revocation_plan",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_HASH_HELPER_PATH,
  FUTURE_APPROVAL_PACKET_PATH,
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
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

function buildRunbook() {
  return {
    scope: "read_only_approval_packet_preparation_runbook",
    futureHashHelperPath: FUTURE_HASH_HELPER_PATH,
    futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
    currentStepRequestsRawInputs: false,
    currentStepRequestsPrivatePepper: false,
    currentStepGeneratesHashes: false,
    currentStepCreatesApprovalPacket: false,
    currentStepValidatesApprovalPacket: false,
    currentStepImportsApprovalPacket: false,
    runbookSteps: REQUIRED_RUNBOOK_STEPS,
    requiredPacketFields: REQUIRED_PACKET_FIELDS,
    requiredHashLabels: REQUIRED_HASH_LABELS,
    forbiddenRunbookContent: FORBIDDEN_RUNBOOK_CONTENT,
    ownerSafetyNotes: [
      "use only redacted hashes and timestamps in the future private packet",
      "do not paste API keys, account numbers, app secrets, access tokens, or raw evidence into committed files",
      "validation success later is not provider-call authorization",
      "import success later is not order-submission authorization",
    ],
  };
}

function buildContract() {
  const ownerActionQueue = readJson(OWNER_ACTION_QUEUE_PATH);
  const template = readJson(REDACTED_TEMPLATE_PATH);
  const hashHelperContract = readJson(HASH_HELPER_CONTRACT_PATH);
  const hashHelperPreflight = readJson(HASH_HELPER_PREFLIGHT_PATH);
  const packetValidationPreflight = readJson(PACKET_VALIDATION_PREFLIGHT_PATH);
  const approvalImportPreflight = readJson(APPROVAL_IMPORT_PREFLIGHT_PATH);
  const approvalImportImplementationPreflight = readJson(APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const mockApprovalEvidenceReceipt = readJson(MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const runbook = buildRunbook();
  const templateFields = template.futureRedactedApprovalPacketTemplate?.requiredTemplateFields ?? [];
  const hashInputLabels = hashHelperContract.futureLocalHashHelperBoundary?.requiredHashInputLabels ?? [];
  const missingRunbookSteps = missingValues(runbook.runbookSteps, REQUIRED_RUNBOOK_STEPS);
  const missingPacketFields = missingValues(templateFields, REQUIRED_PACKET_FIELDS);
  const missingHashLabels = missingValues(hashInputLabels, REQUIRED_HASH_LABELS);
  const missingForbiddenRunbookContent = missingValues(runbook.forbiddenRunbookContent, FORBIDDEN_RUNBOOK_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    runbookOnly: true,
    ownerActionQueueReady:
      ownerActionQueue.readiness?.readyForOwnerReadOnlyEvidenceActionQueue === true &&
      ownerActionQueue.readiness?.ownerRawInputRequestedNow === false &&
      ownerActionQueue.readiness?.hashGenerationAllowedNow === false &&
      ownerActionQueue.readiness?.approvalPacketCreatedNow === false &&
      ownerActionQueue.readiness?.approvalPacketImportedNow === false,
    templateReady:
      template.readiness?.readyForOwnerRedactedApprovalPacketPreparation === true &&
      template.readiness?.approvalPacketCreatedNow === false &&
      template.readiness?.approvalPacketImportedNow === false,
    hashHelperContractReady:
      hashHelperContract.readiness?.readyForFutureLocalHashHelperImplementationReview === true &&
      hashHelperContract.readiness?.hashHelperImplementationAllowed === false &&
      hashHelperContract.readiness?.approvalPacketCreatedNow === false,
    hashHelperPreflightDeferred:
      hashHelperPreflight.readiness?.readyForOwnerAssistedHashPreparationLater === true &&
      hashHelperPreflight.readiness?.ownerHashPreparationDeferred === true &&
      hashHelperPreflight.readiness?.hashGenerationAllowed === false,
    packetValidationPreflightReady:
      packetValidationPreflight.readiness?.readyForPureLocalValidatorImplementationReview === true &&
      packetValidationPreflight.readiness?.approvalPacketCreatedNow === false &&
      packetValidationPreflight.readiness?.approvalPacketImportedNow === false &&
      packetValidationPreflight.readiness?.providerCallsAllowed === false,
    approvalImportPreflightReady:
      approvalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      approvalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalImportPreflight.readiness?.providerCallsAllowed === false,
    approvalImportImplementationStillBlocked:
      approvalImportImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview ===
        false &&
      approvalImportImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalImportImplementationPreflight.readiness?.providerCallsAllowed === false,
    mockApprovalEvidenceReceiptReady:
      mockApprovalEvidenceReceipt.readiness?.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview === true &&
      mockApprovalEvidenceReceipt.readiness?.approvalPacketImportedNow === false,
    runbookStepsReady: missingRunbookSteps.length === 0,
    packetFieldsReady: missingPacketFields.length === 0,
    hashLabelsReady: missingHashLabels.length === 0,
    forbiddenRunbookContentReady: missingForbiddenRunbookContent.length === 0,
    architectureDocMentionsPacketPreparationRunbook:
      architectureDoc.includes("Trading Read-Only Approval Packet Preparation Runbook") &&
      architectureDoc.includes("read_only_approval_packet_preparation_runbook"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    rawInputsRequestedNow: false,
    privatePepperRequestedNow: false,
    hashGenerationAllowed: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook =
    checks.ownerActionQueueReady &&
    checks.templateReady &&
    checks.hashHelperContractReady &&
    checks.hashHelperPreflightDeferred &&
    checks.packetValidationPreflightReady &&
    checks.approvalImportPreflightReady &&
    checks.approvalImportImplementationStillBlocked &&
    checks.mockApprovalEvidenceReceiptReady &&
    checks.runbookStepsReady &&
    checks.packetFieldsReady &&
    checks.hashLabelsReady &&
    checks.forbiddenRunbookContentReady &&
    checks.architectureDocMentionsPacketPreparationRunbook &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5H",
    scope: "read_only_approval_packet_preparation_runbook",
    sourceFiles: {
      ownerReadOnlyEvidenceActionQueue: OWNER_ACTION_QUEUE_PATH,
      redactedReadOnlyApprovalTemplate: REDACTED_TEMPLATE_PATH,
      redactedApprovalHashHelperContract: HASH_HELPER_CONTRACT_PATH,
      redactedApprovalHashHelperPreflight: HASH_HELPER_PREFLIGHT_PATH,
      redactedApprovalPacketValidationPreflight: PACKET_VALIDATION_PREFLIGHT_PATH,
      readOnlyApprovalImportPreflight: APPROVAL_IMPORT_PREFLIGHT_PATH,
      readOnlyApprovalImportImplementationPreflight: APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      runbookOnly: true,
      rawInputsRequestedNow: false,
      privatePepperRequestedNow: false,
      hashGenerationAllowed: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedReadOnlyApprovalPacketPreparationRunbook: runbook,
    checks,
    evidence: {
      missingRunbookSteps,
      missingPacketFields,
      missingHashLabels,
      missingForbiddenRunbookContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerActionQueueStatus: ownerActionQueue.readiness?.status ?? null,
      templateStatus: template.readiness?.status ?? null,
      hashHelperContractStatus: hashHelperContract.readiness?.status ?? null,
      hashHelperPreflightStatus: hashHelperPreflight.readiness?.status ?? null,
      packetValidationPreflightStatus: packetValidationPreflight.readiness?.status ?? null,
      approvalImportPreflightStatus: approvalImportPreflight.readiness?.status ?? null,
      approvalImportImplementationPreflightStatus: approvalImportImplementationPreflight.readiness?.status ?? null,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status ?? null,
    },
    readiness: {
      status: readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook
        ? "runbook_ready_for_owner_assisted_read_only_approval_packet_preparation_review"
        : "blocked_before_read_only_approval_packet_preparation_runbook",
      readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook,
      runbookOnly: true,
      rawInputsRequestedNow: false,
      privatePepperRequestedNow: false,
      hashGenerationAllowed: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.ownerActionQueueReady ? [] : ["owner_read_only_evidence_action_queue_not_ready"]),
        ...(checks.templateReady ? [] : ["redacted_read_only_approval_template_not_ready"]),
        ...(checks.hashHelperContractReady ? [] : ["redacted_approval_hash_helper_contract_not_ready"]),
        ...(checks.hashHelperPreflightDeferred ? [] : ["redacted_approval_hash_helper_preflight_not_deferred"]),
        ...(checks.packetValidationPreflightReady ? [] : ["redacted_approval_packet_validation_preflight_not_ready"]),
        ...(checks.approvalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.approvalImportImplementationStillBlocked
          ? []
          : ["read_only_approval_import_implementation_not_blocked"]),
        ...(checks.mockApprovalEvidenceReceiptReady ? [] : ["mock_approval_evidence_receipt_not_ready"]),
        ...missingRunbookSteps.map((step) => `missing_runbook_step_${step}`),
        ...missingPacketFields.map((field) => `missing_packet_field_${field}`),
        ...missingHashLabels.map((label) => `missing_hash_label_${label}`),
        ...missingForbiddenRunbookContent.map((content) => `missing_forbidden_runbook_content_${content}`),
        ...(checks.architectureDocMentionsPacketPreparationRunbook
          ? []
          : ["architecture_doc_missing_read_only_approval_packet_preparation_runbook"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_redacted_read_only_approval_packet_not_supplied",
        "owner_hash_preparation_deferred_until_explicit_request",
        "read_only_approval_import_review_blocked_pending_owner_packet",
        "read_only_provider_call_authorization_review_result_not_owner_supplied",
        "provider_calls_blocked_until_owner_packet_and_review",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-preparation-runbook-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-preparation-runbook-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-packet-preparation-runbook-contract] ok");
    console.log(
      `[generate-trading-read-only-approval-packet-preparation-runbook-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-packet-preparation-runbook-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-packet-preparation-runbook-contract] readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook=${parsed.readiness.readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook}`,
  );
}

main();

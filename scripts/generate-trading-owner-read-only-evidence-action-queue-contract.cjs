const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json",
);
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_read_only_approval_template.json",
);
const REDACTED_APPROVAL_HASH_HELPER_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_contract.json",
);
const REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
);
const REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_contract.json",
);
const REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
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

const CONTRACT_VERSION = "trading-lab-step116-owner-read-only-evidence-action-queue-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const REQUIRED_ACTION_ITEMS = [
  "confirm_mock_trading_portal_status_snapshot_hash",
  "prepare_approved_by_hash",
  "prepare_account_id_hash",
  "prepare_evidence_ticket_hash",
  "prepare_revocation_plan_hash",
  "record_approved_at_and_expires_at",
  "review_allowed_read_scopes",
  "review_forbidden_actions",
  "run_redacted_packet_local_validation_later",
  "request_owner_import_review_later",
  "request_provider_call_authorization_review_later",
];
const REQUIRED_ASSERTIONS = [
  "action_queue_does_not_request_raw_inputs_now",
  "action_queue_does_not_create_private_packet_now",
  "action_queue_does_not_import_private_packet_now",
  "action_queue_does_not_generate_hashes_now",
  "action_queue_does_not_call_kis_now",
  "action_queue_does_not_enable_provider_calls",
  "action_queue_does_not_submit_orders",
  "action_queue_does_not_create_runtime_route",
  "action_queue_does_not_create_public_ui",
];
const FORBIDDEN_QUEUE_CONTENT = [
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
  FUTURE_APPROVAL_PACKET_PATH,
  path.join("scripts", "create-trading-redacted-approval-hashes.cjs"),
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

function buildActionQueue() {
  return {
    scope: "owner_read_only_evidence_action_queue",
    ownerActionQueueReady: true,
    ownerRawInputRequestedNow: false,
    hashGenerationAllowedNow: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    requiredActionItems: REQUIRED_ACTION_ITEMS,
    requiredAssertions: REQUIRED_ASSERTIONS,
    forbiddenQueueContent: FORBIDDEN_QUEUE_CONTENT,
    futureOwnerOutputs: {
      approvedByHash: "hmac-sha256:<operator_hash>",
      accountIdHash: "hmac-sha256:<account_hash>",
      evidenceTicketHash: "hmac-sha256:<evidence_ticket_hash>",
      revocationPlanHash: "hmac-sha256:<revocation_plan_hash>",
      approvedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
      expiresAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
      redactionVersion: "v1",
    },
    promotionRules: [
      "this queue lets the owner know what evidence is needed without collecting it now",
      "hash preparation remains deferred until an explicit owner request",
      "private packet creation and import remain blocked until a separate local review",
      "provider calls, runtime routes, DB writes, public UI, orders, and live trading remain blocked",
    ],
  };
}

function buildContract() {
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const readOnlyApprovalImportImplementationPreflight = readJson(
    READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const redactedReadOnlyApprovalTemplate = readJson(REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH);
  const redactedApprovalHashHelperContract = readJson(REDACTED_APPROVAL_HASH_HELPER_CONTRACT_PATH);
  const redactedApprovalHashHelperPreflight = readJson(REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH);
  const redactedApprovalPacketValidationContract = readJson(REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT_PATH);
  const redactedApprovalPacketValidationPreflight = readJson(REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH);
  const mockApprovalEvidenceReceipt = readJson(MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const actionQueue = buildActionQueue();
  const missingActionItems = missingValues(actionQueue.requiredActionItems, REQUIRED_ACTION_ITEMS);
  const missingAssertions = missingValues(actionQueue.requiredAssertions, REQUIRED_ASSERTIONS);
  const missingForbiddenQueueContent = missingValues(actionQueue.forbiddenQueueContent, FORBIDDEN_QUEUE_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const requiredHashLabels =
    redactedApprovalHashHelperContract.futureLocalHashHelperBoundary?.requiredHashInputLabels ?? [];
  const templateFields =
    redactedReadOnlyApprovalTemplate.futureRedactedApprovalPacketTemplate?.requiredTemplateFields ?? [];
  const checks = {
    queueOnly: true,
    launchPlanKeepsOwnerReadOnlyGateFirst:
      launchReadinessPlan.launchReadinessPlan?.nextOwnerFacingGate === "owner_read_only_evidence_import" &&
      launchReadinessPlan.readiness?.providerCallsAllowed === false &&
      launchReadinessPlan.readiness?.orderSubmissionAllowed === false,
    progressSummaryFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.readyForOrderSubmission === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false,
    importImplementationStillBlocked:
      readOnlyApprovalImportImplementationPreflight.readiness
        ?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      readOnlyApprovalImportImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportImplementationPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportImplementationPreflight.readiness?.orderSubmissionAllowed === false,
    templateReady:
      redactedReadOnlyApprovalTemplate.readiness?.readyForOwnerRedactedApprovalPacketPreparation === true &&
      redactedReadOnlyApprovalTemplate.readiness?.approvalPacketCreatedNow === false &&
      redactedReadOnlyApprovalTemplate.readiness?.approvalPacketImportedNow === false,
    hashHelperContractReady:
      redactedApprovalHashHelperContract.readiness?.readyForFutureLocalHashHelperImplementationReview === true &&
      redactedApprovalHashHelperContract.readiness?.hashHelperImplementationAllowed === false &&
      redactedApprovalHashHelperContract.readiness?.providerCallsAllowed === false,
    hashHelperPreflightDeferred:
      redactedApprovalHashHelperPreflight.readiness?.readyForOwnerAssistedHashPreparationLater === true &&
      redactedApprovalHashHelperPreflight.readiness?.ownerHashPreparationDeferred === true &&
      redactedApprovalHashHelperPreflight.readiness?.hashGenerationAllowed === false,
    packetValidationContractReady:
      redactedApprovalPacketValidationContract.readiness
        ?.readyForFutureRedactedApprovalPacketValidationImplementationReview === true &&
      redactedApprovalPacketValidationContract.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalPacketValidationContract.readiness?.approvalPacketImportedNow === false,
    packetValidationPreflightReady:
      redactedApprovalPacketValidationPreflight.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalPacketValidationPreflight.readiness?.approvalPacketImportedNow === false &&
      redactedApprovalPacketValidationPreflight.readiness?.providerCallsAllowed === false &&
      redactedApprovalPacketValidationPreflight.readiness?.orderSubmissionAllowed === false,
    mockApprovalEvidenceReceiptReady:
      mockApprovalEvidenceReceipt.readiness?.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview === true &&
      mockApprovalEvidenceReceipt.readiness?.approvalPacketImportedNow === false,
    hashLabelsReady:
      requiredHashLabels.includes("approvedByHash") &&
      requiredHashLabels.includes("accountIdHash") &&
      requiredHashLabels.includes("evidenceTicketHash") &&
      requiredHashLabels.includes("revocationPlanHash"),
    templateFieldsReady:
      templateFields.includes("approvedByHash") &&
      templateFields.includes("accountIdHash") &&
      templateFields.includes("evidenceTicketHash") &&
      templateFields.includes("revocationPlanHash"),
    actionItemsReady: missingActionItems.length === 0,
    assertionsReady: missingAssertions.length === 0,
    forbiddenQueueContentReady: missingForbiddenQueueContent.length === 0,
    architectureDocMentionsOwnerActionQueue:
      architectureDoc.includes("Trading Owner Read-Only Evidence Action Queue") &&
      architectureDoc.includes("owner_read_only_evidence_action_queue"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRawInputRequestedNow: false,
    hashGenerationAllowedNow: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerReadOnlyEvidenceActionQueue =
    checks.launchPlanKeepsOwnerReadOnlyGateFirst &&
    checks.progressSummaryFailClosed &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.importImplementationStillBlocked &&
    checks.templateReady &&
    checks.hashHelperContractReady &&
    checks.hashHelperPreflightDeferred &&
    checks.packetValidationContractReady &&
    checks.packetValidationPreflightReady &&
    checks.mockApprovalEvidenceReceiptReady &&
    checks.hashLabelsReady &&
    checks.templateFieldsReady &&
    checks.actionItemsReady &&
    checks.assertionsReady &&
    checks.forbiddenQueueContentReady &&
    checks.architectureDocMentionsOwnerActionQueue &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5F",
    scope: "owner_read_only_evidence_action_queue",
    sourceFiles: {
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      readOnlyApprovalImportImplementationPreflight: READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      redactedReadOnlyApprovalTemplate: REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH,
      redactedApprovalHashHelperContract: REDACTED_APPROVAL_HASH_HELPER_CONTRACT_PATH,
      redactedApprovalHashHelperPreflight: REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH,
      redactedApprovalPacketValidationContract: REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT_PATH,
      redactedApprovalPacketValidationPreflight: REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      queueOnly: true,
      ownerRawInputRequestedNow: false,
      hashGenerationAllowedNow: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    ownerReadOnlyEvidenceActionQueue: actionQueue,
    checks,
    evidence: {
      missingActionItems,
      missingAssertions,
      missingForbiddenQueueContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      launchPlanStatus: launchReadinessPlan.readiness?.status ?? null,
      progressSummaryStatus: progressSummary.readiness?.status ?? null,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status ?? null,
      readOnlyApprovalImportImplementationPreflightStatus:
        readOnlyApprovalImportImplementationPreflight.readiness?.status ?? null,
      redactedReadOnlyApprovalTemplateStatus: redactedReadOnlyApprovalTemplate.readiness?.status ?? null,
      redactedApprovalHashHelperContractStatus: redactedApprovalHashHelperContract.readiness?.status ?? null,
      redactedApprovalHashHelperPreflightStatus: redactedApprovalHashHelperPreflight.readiness?.status ?? null,
      redactedApprovalPacketValidationContractStatus: redactedApprovalPacketValidationContract.readiness?.status ?? null,
      redactedApprovalPacketValidationPreflightStatus:
        redactedApprovalPacketValidationPreflight.readiness?.status ?? null,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status ?? null,
    },
    readiness: {
      status: readyForOwnerReadOnlyEvidenceActionQueue
        ? "owner_read_only_evidence_action_queue_ready_import_still_blocked"
        : "blocked_before_owner_read_only_evidence_action_queue",
      readyForOwnerReadOnlyEvidenceActionQueue,
      ownerRawInputRequestedNow: false,
      hashGenerationAllowedNow: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.launchPlanKeepsOwnerReadOnlyGateFirst ? [] : ["launch_plan_owner_read_only_gate_not_first"]),
        ...(checks.progressSummaryFailClosed ? [] : ["progress_summary_not_fail_closed"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.importImplementationStillBlocked ? [] : ["read_only_approval_import_implementation_not_blocked"]),
        ...(checks.templateReady ? [] : ["redacted_read_only_approval_template_not_ready"]),
        ...(checks.hashHelperContractReady ? [] : ["redacted_approval_hash_helper_contract_not_ready"]),
        ...(checks.hashHelperPreflightDeferred ? [] : ["redacted_approval_hash_helper_preflight_not_deferred"]),
        ...(checks.packetValidationContractReady ? [] : ["redacted_approval_packet_validation_contract_not_ready"]),
        ...(checks.packetValidationPreflightReady ? [] : ["redacted_approval_packet_validation_preflight_not_ready"]),
        ...(checks.mockApprovalEvidenceReceiptReady ? [] : ["mock_approval_evidence_receipt_not_ready"]),
        ...(checks.hashLabelsReady ? [] : ["hash_labels_not_ready"]),
        ...(checks.templateFieldsReady ? [] : ["template_fields_not_ready"]),
        ...(checks.actionItemsReady ? [] : ["owner_action_items_missing"]),
        ...(checks.assertionsReady ? [] : ["owner_action_assertions_missing"]),
        ...(checks.forbiddenQueueContentReady ? [] : ["forbidden_queue_content_missing"]),
        ...(checks.architectureDocMentionsOwnerActionQueue ? [] : ["architecture_doc_missing_owner_action_queue"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_redacted_read_only_approval_packet_not_supplied",
        "owner_hash_preparation_deferred_until_explicit_request",
        "read_only_approval_import_review_blocked_pending_owner_packet",
        "read_only_provider_call_authorization_review_result_not_owner_supplied",
        "provider_calls_blocked_until_owner_packet_and_review",
        "private_shadow_runtime_review_blocked_pending_owner_packet_and_operator_access",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-owner-read-only-evidence-action-queue-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-owner-read-only-evidence-action-queue-contract.cjs`,
      );
    }
    console.log("[generate-trading-owner-read-only-evidence-action-queue-contract] ok");
    console.log(`[generate-trading-owner-read-only-evidence-action-queue-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-owner-read-only-evidence-action-queue-contract] wrote contract");
  console.log(
    `[generate-trading-owner-read-only-evidence-action-queue-contract] readyForOwnerReadOnlyEvidenceActionQueue=${parsed.readiness.readyForOwnerReadOnlyEvidenceActionQueue}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
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
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-redacted-approval-hash-helper-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-redacted-approval-hashes.cjs");
const REQUIRED_PREFLIGHT_CHECKS = [
  "prior_hash_helper_contract_ready",
  "owner_hash_preparation_deferred",
  "helper_implementation_not_created_now",
  "hash_generation_not_run_now",
  "private_pepper_not_requested_now",
  "raw_inputs_not_requested_now",
  "approval_packet_not_created_now",
  "approval_packet_not_imported_now",
  "provider_calls_remain_disabled",
  "order_submission_remains_disabled",
];
const REQUIRED_FUTURE_REVIEW_INPUTS = [
  "explicit_owner_request_to_prepare_hashes",
  "local_only_execution_surface",
  "private_pepper_source_outside_repo",
  "stdin_or_interactive_raw_input_collection",
  "no_command_line_raw_secret_arguments",
  "no_raw_input_logs",
  "no_raw_input_file_persistence",
  "deterministic_labelled_hash_output",
  "manual_review_before_approval_packet_import",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
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
  FUTURE_HASH_HELPER_PATH,
  path.join("server", "src", "services", "tradingRedactedApprovalHashHelper.js"),
  path.join("server", "src", "services", "trading", "redactedApprovalHashHelper.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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

function buildContract() {
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const mockApprovalEvidenceReceipt = readJson(MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH);
  const redactedReadOnlyApprovalTemplate = readJson(REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH);
  const redactedApprovalHashHelperContract = readJson(REDACTED_APPROVAL_HASH_HELPER_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const preflightChecks = [...REQUIRED_PREFLIGHT_CHECKS];
  const futureReviewInputs = [...REQUIRED_FUTURE_REVIEW_INPUTS];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingPreflightChecks = missingValues(preflightChecks, REQUIRED_PREFLIGHT_CHECKS);
  const missingFutureReviewInputs = missingValues(futureReviewInputs, REQUIRED_FUTURE_REVIEW_INPUTS);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    ownerHashPreparationDeferred: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract",
    mockApprovalEvidenceReceiptReady:
      mockApprovalEvidenceReceipt.readiness?.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview === true &&
      mockApprovalEvidenceReceipt.readiness?.providerCallsAllowed === false &&
      mockApprovalEvidenceReceipt.readiness?.orderSubmissionAllowed === false,
    redactedReadOnlyApprovalTemplateReady:
      redactedReadOnlyApprovalTemplate.readiness?.readyForOwnerRedactedApprovalPacketPreparation === true &&
      redactedReadOnlyApprovalTemplate.readiness?.approvalPacketCreatedNow === false &&
      redactedReadOnlyApprovalTemplate.readiness?.approvalPacketImportedNow === false &&
      redactedReadOnlyApprovalTemplate.readiness?.providerCallsAllowed === false &&
      redactedReadOnlyApprovalTemplate.readiness?.orderSubmissionAllowed === false,
    redactedApprovalHashHelperContractReady:
      redactedApprovalHashHelperContract.readiness?.readyForFutureLocalHashHelperImplementationReview === true &&
      redactedApprovalHashHelperContract.readiness?.hashHelperImplementationAllowed === false &&
      redactedApprovalHashHelperContract.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalHashHelperContract.readiness?.approvalPacketImportedNow === false &&
      redactedApprovalHashHelperContract.readiness?.providerCallsAllowed === false &&
      redactedApprovalHashHelperContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    preflightChecksReady: missingPreflightChecks.length === 0,
    futureReviewInputsReady: missingFutureReviewInputs.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsHashHelperPreflight:
      architectureDoc.includes("Trading Redacted Approval Hash Helper Preflight") &&
      architectureDoc.includes("redacted_approval_hash_helper_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    hashHelperImplementationAllowed: false,
    hashGenerationAllowed: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
  const readyForOwnerAssistedHashPreparationLater =
    checks.shadowModePolicyReady &&
    checks.mockApprovalEvidenceReceiptReady &&
    checks.redactedReadOnlyApprovalTemplateReady &&
    checks.redactedApprovalHashHelperContractReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.preflightChecksReady &&
    checks.futureReviewInputsReady &&
    checks.forbiddenPreflightContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsHashHelperPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2G",
    scope: "trading_redacted_approval_hash_helper_preflight",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      redactedReadOnlyApprovalTemplate: REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH,
      redactedApprovalHashHelperContract: REDACTED_APPROVAL_HASH_HELPER_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      ownerHashPreparationDeferred: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedHashPreparationBoundary: {
      scope: "redacted_approval_hash_helper_preflight",
      futureHashHelperPath: FUTURE_HASH_HELPER_PATH,
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      currentStepImplementsHashHelper: false,
      currentStepGeneratesHashes: false,
      currentStepCreatesApprovalPacket: false,
      preflightChecks,
      futureReviewInputs,
      forbiddenPreflightContent,
      ownerGuidanceRule:
        "when hash preparation becomes necessary, guide the owner through a local-only helper without committing raw inputs or private pepper values",
      promotionRules: [
        "preflight success means the future owner-assisted hash preparation path is documented",
        "preflight success does not implement the helper",
        "preflight success does not generate hashes or request raw values now",
        "preflight success does not import approval evidence",
        "preflight success does not enable provider calls, runtime routes, DB migrations, public UI, or orders",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingPreflightChecks,
      missingFutureReviewInputs,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status,
      redactedReadOnlyApprovalTemplateStatus: redactedReadOnlyApprovalTemplate.readiness?.status,
      redactedApprovalHashHelperContractStatus: redactedApprovalHashHelperContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForOwnerAssistedHashPreparationLater
        ? "preflight_ready_hash_preparation_deferred_until_owner_request"
        : "blocked_before_redacted_approval_hash_helper_preflight",
      readyForOwnerAssistedHashPreparationLater,
      ownerHashPreparationDeferred: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.mockApprovalEvidenceReceiptReady ? [] : ["mock_approval_evidence_receipt_not_ready"]),
        ...(checks.redactedReadOnlyApprovalTemplateReady ? [] : ["redacted_read_only_approval_template_not_ready"]),
        ...(checks.redactedApprovalHashHelperContractReady ? [] : ["redacted_approval_hash_helper_contract_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...missingPreflightChecks.map((check) => `missing_preflight_check_${check}`),
        ...missingFutureReviewInputs.map((input) => `missing_future_review_input_${input}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsHashHelperPreflight
          ? []
          : ["architecture_doc_missing_redacted_approval_hash_helper_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-approval-hash-helper-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-approval-hash-helper-preflight.cjs`);
    }
    console.log("[generate-trading-redacted-approval-hash-helper-preflight] ok");
    console.log(`[generate-trading-redacted-approval-hash-helper-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-approval-hash-helper-preflight] wrote contract");
  console.log(
    `[generate-trading-redacted-approval-hash-helper-preflight] readyForOwnerAssistedHashPreparationLater=${parsed.readiness.readyForOwnerAssistedHashPreparationLater}`,
  );
}

main();

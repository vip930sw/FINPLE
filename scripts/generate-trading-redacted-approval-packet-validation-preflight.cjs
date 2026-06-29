const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
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

const CONTRACT_VERSION = "trading-lab-step116-redacted-approval-packet-validation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const FUTURE_VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
const REQUIRED_PREFLIGHT_GATES = [
  "validation_contract_ready",
  "hash_preparation_still_deferred",
  "validator_implementation_not_created_now",
  "private_packet_not_created_now",
  "private_packet_not_imported_now",
  "validator_has_no_provider_dependency",
  "validator_has_no_runtime_route_dependency",
  "validator_has_no_db_dependency",
  "validator_has_no_ui_dependency",
  "provider_calls_remain_disabled",
  "order_submission_remains_disabled",
];
const REQUIRED_IMPLEMENTATION_REVIEW_RULES = [
  "pure_node_script_only",
  "reads_candidate_packet_from_explicit_local_path_later",
  "no_default_private_packet_path_read",
  "no_network_access",
  "no_environment_secret_loading",
  "no_hash_generation",
  "no_packet_write",
  "no_packet_import",
  "no_runtime_route",
  "no_database_write",
  "no_public_ui",
  "deterministic_validation_result",
  "redacted_error_messages_only",
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
  path.join("server", "src", "services", "tradingRedactedApprovalPacketValidation.js"),
  path.join("server", "src", "services", "trading", "redactedApprovalPacketValidation.js"),
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
  const redactedApprovalHashHelperPreflight = readJson(REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH);
  const redactedApprovalPacketValidationContract = readJson(REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const preflightGates = [...REQUIRED_PREFLIGHT_GATES];
  const implementationReviewRules = [...REQUIRED_IMPLEMENTATION_REVIEW_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingPreflightGates = missingValues(preflightGates, REQUIRED_PREFLIGHT_GATES);
  const missingImplementationReviewRules = missingValues(implementationReviewRules, REQUIRED_IMPLEMENTATION_REVIEW_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract",
    mockApprovalEvidenceReceiptReady:
      mockApprovalEvidenceReceipt.readiness?.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview === true &&
      mockApprovalEvidenceReceipt.readiness?.providerCallsAllowed === false &&
      mockApprovalEvidenceReceipt.readiness?.orderSubmissionAllowed === false,
    redactedApprovalHashHelperPreflightReady:
      redactedApprovalHashHelperPreflight.readiness?.readyForOwnerAssistedHashPreparationLater === true &&
      redactedApprovalHashHelperPreflight.readiness?.ownerHashPreparationDeferred === true &&
      redactedApprovalHashHelperPreflight.readiness?.hashGenerationAllowed === false &&
      redactedApprovalHashHelperPreflight.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalHashHelperPreflight.readiness?.approvalPacketImportedNow === false &&
      redactedApprovalHashHelperPreflight.readiness?.providerCallsAllowed === false &&
      redactedApprovalHashHelperPreflight.readiness?.orderSubmissionAllowed === false,
    redactedApprovalPacketValidationContractReady:
      redactedApprovalPacketValidationContract.readiness
        ?.readyForFutureRedactedApprovalPacketValidationImplementationReview === true &&
      redactedApprovalPacketValidationContract.readiness?.validationImplementationAllowed === true &&
      redactedApprovalPacketValidationContract.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalPacketValidationContract.readiness?.approvalPacketImportedNow === false &&
      redactedApprovalPacketValidationContract.readiness?.providerCallsAllowed === false &&
      redactedApprovalPacketValidationContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    preflightGatesReady: missingPreflightGates.length === 0,
    implementationReviewRulesReady: missingImplementationReviewRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsPacketValidationPreflight:
      architectureDoc.includes("Trading Redacted Approval Packet Validation Preflight") &&
      architectureDoc.includes("redacted_approval_packet_validation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationImplementationAllowedNow: true,
    validationImplementationReviewAllowedLater: true,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
  const readyForPureLocalValidatorImplementationReview =
    checks.shadowModePolicyReady &&
    checks.mockApprovalEvidenceReceiptReady &&
    checks.redactedApprovalHashHelperPreflightReady &&
    checks.redactedApprovalPacketValidationContractReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.preflightGatesReady &&
    checks.implementationReviewRulesReady &&
    checks.forbiddenPreflightContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsPacketValidationPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2I",
    scope: "trading_redacted_approval_packet_validation_preflight",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      redactedApprovalHashHelperPreflight: REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH,
      redactedApprovalPacketValidationContract: REDACTED_APPROVAL_PACKET_VALIDATION_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      validationImplementationAllowedNow: true,
      validationImplementationReviewAllowedLater: true,
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
    futurePureLocalValidatorImplementationBoundary: {
      scope: "redacted_approval_packet_validation_preflight",
      futureValidatorPath: FUTURE_VALIDATOR_PATH,
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      currentStepImplementsValidator: true,
      currentStepReadsPrivatePacket: false,
      currentStepCreatesPacket: false,
      currentStepImportsPacket: false,
      preflightGates,
      implementationReviewRules,
      forbiddenPreflightContent,
      promotionRules: [
        "preflight success allows only the pure local validator implementation",
        "preflight success still does not create or read private approval evidence",
        "preflight success does not create or read the private approval packet",
        "preflight success does not import approval evidence",
        "preflight success does not enable provider calls, runtime routes, DB migrations, public UI, or orders",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingPreflightGates,
      missingImplementationReviewRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status,
      redactedApprovalHashHelperPreflightStatus: redactedApprovalHashHelperPreflight.readiness?.status,
      redactedApprovalPacketValidationContractStatus: redactedApprovalPacketValidationContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForPureLocalValidatorImplementationReview
        ? "preflight_ready_pending_pure_local_validator_implementation_review"
        : "blocked_before_redacted_approval_packet_validation_preflight",
      readyForPureLocalValidatorImplementationReview,
      validationImplementationAllowedNow: true,
      validationImplementationReviewAllowedLater: true,
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
        ...(checks.redactedApprovalHashHelperPreflightReady
          ? []
          : ["redacted_approval_hash_helper_preflight_not_ready"]),
        ...(checks.redactedApprovalPacketValidationContractReady
          ? []
          : ["redacted_approval_packet_validation_contract_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...missingPreflightGates.map((gate) => `missing_preflight_gate_${gate}`),
        ...missingImplementationReviewRules.map((rule) => `missing_implementation_review_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsPacketValidationPreflight
          ? []
          : ["architecture_doc_missing_redacted_approval_packet_validation_preflight"]),
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
      fail(
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-approval-packet-validation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-approval-packet-validation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-redacted-approval-packet-validation-preflight] ok");
    console.log(`[generate-trading-redacted-approval-packet-validation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-approval-packet-validation-preflight] wrote contract");
  console.log(
    `[generate-trading-redacted-approval-packet-validation-preflight] readyForPureLocalValidatorImplementationReview=${parsed.readiness.readyForPureLocalValidatorImplementationReview}`,
  );
}

main();

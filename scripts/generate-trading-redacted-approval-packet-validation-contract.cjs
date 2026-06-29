const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_contract.json",
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
const REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
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

const CONTRACT_VERSION = "trading-lab-step116-redacted-approval-packet-validation-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const FUTURE_VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
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
const REQUIRED_VALIDATION_RULES = [
  "packet_must_match_template_fields",
  "unknown_fields_rejected",
  "approval_id_must_be_opaque",
  "hash_fields_must_be_labelled_hashes",
  "approved_at_must_be_iso_timestamp",
  "expires_at_must_be_after_approved_at",
  "expired_packets_rejected_at_import_time",
  "scope_must_be_read_only_shadow",
  "environment_must_be_mock",
  "base_url_scope_must_be_virtual_trading_openapivts",
  "allowed_read_scopes_must_be_subset_of_template",
  "forbidden_actions_must_include_order_submission",
  "provider_order_runtime_ui_flags_must_be_false",
  "secret_values_absent",
  "raw_identifiers_absent",
  "provider_calls_remain_disabled_after_validation",
];
const REQUIRED_REJECTION_REASONS = [
  "missing_required_field",
  "unknown_field",
  "malformed_hash_field",
  "malformed_timestamp",
  "expired_approval",
  "invalid_scope",
  "invalid_environment",
  "live_endpoint_requested",
  "unknown_read_scope",
  "order_action_missing_from_forbidden_actions",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "public_ui_flag_enabled",
  "secret_value_present",
  "raw_identifier_present",
];
const FORBIDDEN_PACKET_CONTENT = [
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
  FUTURE_VALIDATOR_PATH,
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
  const redactedReadOnlyApprovalTemplate = readJson(REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH);
  const redactedApprovalHashHelperPreflight = readJson(REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const template = redactedReadOnlyApprovalTemplate.futureRedactedApprovalPacketTemplate ?? {};
  const templateFields = template.requiredTemplateFields ?? [];
  const allowedReadScopes = template.allowedReadScopes ?? [];
  const forbiddenActions = template.forbiddenActions ?? [];
  const packetFields = [...REQUIRED_PACKET_FIELDS];
  const validationRules = [...REQUIRED_VALIDATION_RULES];
  const rejectionReasons = [...REQUIRED_REJECTION_REASONS];
  const forbiddenPacketContent = [...FORBIDDEN_PACKET_CONTENT];
  const missingPacketFields = missingValues(packetFields, REQUIRED_PACKET_FIELDS);
  const missingValidationRules = missingValues(validationRules, REQUIRED_VALIDATION_RULES);
  const missingRejectionReasons = missingValues(rejectionReasons, REQUIRED_REJECTION_REASONS);
  const missingForbiddenPacketContent = missingValues(forbiddenPacketContent, FORBIDDEN_PACKET_CONTENT);
  const missingTemplateFields = missingValues(templateFields, REQUIRED_PACKET_FIELDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
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
    redactedApprovalHashHelperPreflightReady:
      redactedApprovalHashHelperPreflight.readiness?.readyForOwnerAssistedHashPreparationLater === true &&
      redactedApprovalHashHelperPreflight.readiness?.ownerHashPreparationDeferred === true &&
      redactedApprovalHashHelperPreflight.readiness?.hashHelperImplementationAllowed === false &&
      redactedApprovalHashHelperPreflight.readiness?.hashGenerationAllowed === false &&
      redactedApprovalHashHelperPreflight.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalHashHelperPreflight.readiness?.approvalPacketImportedNow === false &&
      redactedApprovalHashHelperPreflight.readiness?.providerCallsAllowed === false &&
      redactedApprovalHashHelperPreflight.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    packetFieldsReady: missingPacketFields.length === 0,
    templateFieldsReady: missingTemplateFields.length === 0,
    validationRulesReady: missingValidationRules.length === 0,
    rejectionReasonsReady: missingRejectionReasons.length === 0,
    forbiddenPacketContentReady: missingForbiddenPacketContent.length === 0,
    allowedReadScopesReady:
      allowedReadScopes.includes("account_cash_balance") &&
      allowedReadScopes.includes("account_positions") &&
      allowedReadScopes.includes("current_quotes"),
    forbiddenActionsReady:
      forbiddenActions.includes("order_submission") &&
      forbiddenActions.includes("order_cancellation") &&
      forbiddenActions.includes("scenario_monthly_cache_write"),
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsPacketValidation:
      architectureDoc.includes("Trading Redacted Approval Packet Validation Contract") &&
      architectureDoc.includes("redacted_approval_packet_validation"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationImplementationAllowed: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureRedactedApprovalPacketValidationImplementationReview =
    checks.shadowModePolicyReady &&
    checks.mockApprovalEvidenceReceiptReady &&
    checks.redactedReadOnlyApprovalTemplateReady &&
    checks.redactedApprovalHashHelperPreflightReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.packetFieldsReady &&
    checks.templateFieldsReady &&
    checks.validationRulesReady &&
    checks.rejectionReasonsReady &&
    checks.forbiddenPacketContentReady &&
    checks.allowedReadScopesReady &&
    checks.forbiddenActionsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsPacketValidation &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2H",
    scope: "trading_redacted_approval_packet_validation_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      redactedReadOnlyApprovalTemplate: REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH,
      redactedApprovalHashHelperPreflight: REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      validationImplementationAllowed: false,
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
    futureRedactedApprovalPacketValidationBoundary: {
      scope: "redacted_approval_packet_validation",
      futureValidatorPath: FUTURE_VALIDATOR_PATH,
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      currentStepImplementsValidator: false,
      currentStepCreatesPacket: false,
      currentStepImportsPacket: false,
      requiredPacketFields: packetFields,
      allowedReadScopes,
      forbiddenActions,
      requiredValidationRules: validationRules,
      requiredRejectionReasons: rejectionReasons,
      forbiddenPacketContent,
      promotionRules: [
        "validation contract success does not implement packet validation",
        "validation contract success does not create or import the private approval packet",
        "validation contract success does not ask the owner for raw hash inputs now",
        "validation contract success does not enable provider calls, runtime routes, DB migrations, public UI, or orders",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingPacketFields,
      missingTemplateFields,
      missingValidationRules,
      missingRejectionReasons,
      missingForbiddenPacketContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status,
      redactedReadOnlyApprovalTemplateStatus: redactedReadOnlyApprovalTemplate.readiness?.status,
      redactedApprovalHashHelperPreflightStatus: redactedApprovalHashHelperPreflight.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureRedactedApprovalPacketValidationImplementationReview
        ? "contract_ready_pending_redacted_approval_packet_validation_implementation_review"
        : "blocked_before_redacted_approval_packet_validation_contract",
      readyForFutureRedactedApprovalPacketValidationImplementationReview,
      validationImplementationAllowed: false,
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
        ...(checks.redactedApprovalHashHelperPreflightReady
          ? []
          : ["redacted_approval_hash_helper_preflight_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...missingPacketFields.map((field) => `missing_packet_field_${field}`),
        ...missingTemplateFields.map((field) => `missing_template_field_${field}`),
        ...missingValidationRules.map((rule) => `missing_validation_rule_${rule}`),
        ...missingRejectionReasons.map((reason) => `missing_rejection_reason_${reason}`),
        ...missingForbiddenPacketContent.map((content) => `missing_forbidden_packet_content_${content}`),
        ...(checks.allowedReadScopesReady ? [] : ["allowed_read_scopes_not_ready"]),
        ...(checks.forbiddenActionsReady ? [] : ["forbidden_actions_not_ready"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsPacketValidation
          ? []
          : ["architecture_doc_missing_redacted_approval_packet_validation"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-approval-packet-validation-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-approval-packet-validation-contract.cjs`,
      );
    }
    console.log("[generate-trading-redacted-approval-packet-validation-contract] ok");
    console.log(`[generate-trading-redacted-approval-packet-validation-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-approval-packet-validation-contract] wrote contract");
  console.log(
    `[generate-trading-redacted-approval-packet-validation-contract] readyForFutureRedactedApprovalPacketValidationImplementationReview=${parsed.readiness.readyForFutureRedactedApprovalPacketValidationImplementationReview}`,
  );
}

main();

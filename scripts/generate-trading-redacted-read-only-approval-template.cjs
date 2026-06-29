const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_read_only_approval_template.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
);
const READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_intake_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-redacted-read-only-approval-template-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const REQUIRED_TEMPLATE_FIELDS = [
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
const REQUIRED_ALLOWED_READ_SCOPES = [
  "account_cash_balance",
  "account_positions",
  "orderable_cash",
  "current_quotes",
  "fx_rate",
  "market_session_state",
  "provider_rate_limit_state",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "order_submission",
  "order_cancellation",
  "position_mutation",
  "live_trading_endpoint",
  "raw_provider_response_persistence",
  "public_frontend_secret_access",
  "scenario_monthly_cache_write",
];
const REQUIRED_TEMPLATE_ASSERTIONS = [
  "template_is_redacted_only",
  "template_does_not_create_private_packet",
  "template_requires_account_id_hash",
  "template_requires_approver_hash",
  "template_forbids_secret_values",
  "template_forbids_live_endpoint",
  "template_does_not_enable_provider_calls",
  "template_does_not_enable_order_submission",
  "template_does_not_create_runtime_route",
];
const FORBIDDEN_TEMPLATE_CONTENT = [
  "access_token",
  "app_secret",
  "app_key",
  "full_account_number",
  "raw_account_identifier",
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
  path.join("server", "src", "services", "tradingRedactedReadOnlyApprovalTemplate.js"),
  path.join("server", "src", "services", "trading", "redactedReadOnlyApprovalTemplate.js"),
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
  const readOnlyApprovalIntakeContract = readJson(READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const templateFields = [...REQUIRED_TEMPLATE_FIELDS];
  const allowedReadScopes = [...REQUIRED_ALLOWED_READ_SCOPES];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const templateAssertions = [...REQUIRED_TEMPLATE_ASSERTIONS];
  const forbiddenTemplateContent = [...FORBIDDEN_TEMPLATE_CONTENT];
  const missingTemplateFields = missingValues(templateFields, REQUIRED_TEMPLATE_FIELDS);
  const missingAllowedReadScopes = missingValues(allowedReadScopes, REQUIRED_ALLOWED_READ_SCOPES);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const missingTemplateAssertions = missingValues(templateAssertions, REQUIRED_TEMPLATE_ASSERTIONS);
  const missingForbiddenTemplateContent = missingValues(forbiddenTemplateContent, FORBIDDEN_TEMPLATE_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const intakeFields = readOnlyApprovalIntakeContract.futureReadOnlyApprovalIntakeBoundary?.requiredApprovalFields ?? [];
  const checks = {
    templateOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract",
    mockApprovalEvidenceReceiptReady:
      mockApprovalEvidenceReceipt.readiness?.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview === true &&
      mockApprovalEvidenceReceipt.readiness?.providerCallsAllowed === false &&
      mockApprovalEvidenceReceipt.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalIntakeContractReady:
      readOnlyApprovalIntakeContract.readiness?.readyForFutureReadOnlyApprovalIntakeValidation === true &&
      readOnlyApprovalIntakeContract.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalIntakeContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    intakeContractHasRequiredFields:
      intakeFields.includes("approvalId") &&
      intakeFields.includes("approvedBy") &&
      intakeFields.includes("accountIdHash") &&
      intakeFields.includes("redactionVersion"),
    templateFieldsReady: missingTemplateFields.length === 0,
    allowedReadScopesReady: missingAllowedReadScopes.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    templateAssertionsReady: missingTemplateAssertions.length === 0,
    forbiddenTemplateContentReady: missingForbiddenTemplateContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsTemplate:
      architectureDoc.includes("Trading Redacted Read-Only Approval Template") &&
      architectureDoc.includes("redacted_read_only_approval_template"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
  const readyForOwnerRedactedApprovalPacketPreparation =
    checks.shadowModePolicyReady &&
    checks.mockApprovalEvidenceReceiptReady &&
    checks.readOnlyApprovalIntakeContractReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.intakeContractHasRequiredFields &&
    checks.templateFieldsReady &&
    checks.allowedReadScopesReady &&
    checks.forbiddenActionsReady &&
    checks.templateAssertionsReady &&
    checks.forbiddenTemplateContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsTemplate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2E",
    scope: "trading_redacted_read_only_approval_template",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      readOnlyApprovalIntakeContract: READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      templateOnly: true,
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
    futureRedactedApprovalPacketTemplate: {
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      currentStepCreatesPacket: false,
      requiredTemplateFields: templateFields,
      allowedReadScopes,
      forbiddenActions,
      requiredTemplateAssertions: templateAssertions,
      forbiddenTemplateContent,
      placeholderRules: [
        "approvedByHash must be a hash or opaque operator id, not a real name unless separately approved",
        "accountIdHash must be a hash, never a full or partial account number",
        "evidenceTicketHash and revocationPlanHash must point to redacted operator evidence",
        "provider/order/runtime/UI allow flags must remain false until a later implementation review",
      ],
      sampleRedactedShape: {
        approvalId: "approval_<opaque_id>",
        approvedByHash: "sha256:<operator_hash>",
        approvedAt: "YYYY-MM-DDTHH:mm:ssZ",
        expiresAt: "YYYY-MM-DDTHH:mm:ssZ",
        scope: "read_only_shadow",
        environment: "mock",
        baseUrlScope: "virtual_trading_openapivts",
        accountIdHash: "sha256:<account_hash>",
        allowedReadScopes,
        forbiddenActions,
        evidenceTicketHash: "sha256:<evidence_ticket_hash>",
        revocationPlanHash: "sha256:<revocation_plan_hash>",
        redactionVersion: "v1",
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
      },
    },
    checks,
    evidence: {
      shadowMode,
      missingTemplateFields,
      missingAllowedReadScopes,
      missingForbiddenActions,
      missingTemplateAssertions,
      missingForbiddenTemplateContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status,
      readOnlyApprovalIntakeContractStatus: readOnlyApprovalIntakeContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForOwnerRedactedApprovalPacketPreparation
        ? "template_ready_for_owner_redacted_approval_packet_preparation"
        : "blocked_before_redacted_read_only_approval_template",
      readyForOwnerRedactedApprovalPacketPreparation,
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
        ...(checks.readOnlyApprovalIntakeContractReady ? [] : ["read_only_approval_intake_contract_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.intakeContractHasRequiredFields ? [] : ["intake_contract_missing_required_fields"]),
        ...missingTemplateFields.map((field) => `missing_template_field_${field}`),
        ...missingAllowedReadScopes.map((scope) => `missing_allowed_read_scope_${scope}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...missingTemplateAssertions.map((assertion) => `missing_template_assertion_${assertion}`),
        ...missingForbiddenTemplateContent.map((content) => `missing_forbidden_template_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsTemplate ? [] : ["architecture_doc_missing_redacted_approval_template"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-read-only-approval-template.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-read-only-approval-template.cjs`);
    }
    console.log("[generate-trading-redacted-read-only-approval-template] ok");
    console.log(`[generate-trading-redacted-read-only-approval-template] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-read-only-approval-template] wrote contract");
  console.log(
    `[generate-trading-redacted-read-only-approval-template] readyForOwnerRedactedApprovalPacketPreparation=${parsed.readiness.readyForOwnerRedactedApprovalPacketPreparation}`,
  );
}

main();

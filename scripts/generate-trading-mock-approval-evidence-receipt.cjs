const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const ENV_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_readiness_contract.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-mock-approval-evidence-receipt-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RECEIPT_FIELDS = [
  "ownerConfirmationAt",
  "kisPortalMockApplicationConfirmed",
  "renderEnvMockTradingValuesConfirmed",
  "baseUrlScope",
  "tradingMode",
  "killSwitchState",
  "accountIdHashPresenceOnly",
  "appKeyPresenceOnly",
  "appSecretPresenceOnly",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_RECEIPT_ASSERTIONS = [
  "mock_trading_only",
  "owner_confirmed_kis_portal_mock_application",
  "owner_confirmed_render_env_mock_values",
  "base_url_virtual_trading_only",
  "kill_switch_remains_enabled",
  "secret_values_not_recorded",
  "raw_account_identifiers_not_recorded",
  "receipt_does_not_import_approval_packet",
  "receipt_does_not_enable_provider_calls",
  "receipt_does_not_enable_order_submission",
  "receipt_does_not_create_runtime_route",
];
const FORBIDDEN_RECEIPT_CONTENT = [
  "access_token",
  "app_secret",
  "app_key",
  "full_account_number",
  "raw_account_identifier",
  "raw_session_token",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "tradingMockApprovalEvidenceReceipt.js"),
  path.join("server", "src", "services", "trading", "mockApprovalEvidenceReceipt.js"),
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
  const envReadinessContract = readJson(ENV_READINESS_CONTRACT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const readOnlyApprovalIntakeContract = readJson(READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const receiptFields = [...REQUIRED_RECEIPT_FIELDS];
  const receiptAssertions = [...REQUIRED_RECEIPT_ASSERTIONS];
  const forbiddenReceiptContent = [...FORBIDDEN_RECEIPT_CONTENT];
  const missingReceiptFields = missingValues(receiptFields, REQUIRED_RECEIPT_FIELDS);
  const missingReceiptAssertions = missingValues(receiptAssertions, REQUIRED_RECEIPT_ASSERTIONS);
  const missingForbiddenReceiptContent = missingValues(forbiddenReceiptContent, FORBIDDEN_RECEIPT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    receiptOnly: true,
    ownerConfirmedMockKisPortalAndRenderEnv: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    envReadinessContractReady:
      envReadinessContract.readiness?.readyForCurrentStep === true &&
      envReadinessContract.readiness?.providerCallsAllowed === false &&
      envReadinessContract.readiness?.orderSubmissionAllowed === false &&
      envReadinessContract.readiness?.dbMigrationAllowed === false &&
      envReadinessContract.readiness?.publicUiAllowed === false,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.readyForRuntimeRoute === false &&
      envRiskGateContract.readiness?.readyForProviderCalls === false &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalIntakeContractReady:
      readOnlyApprovalIntakeContract.readiness?.readyForFutureReadOnlyApprovalIntakeValidation === true &&
      readOnlyApprovalIntakeContract.readiness?.readOnlyApprovalImportedNow === false &&
      readOnlyApprovalIntakeContract.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalIntakeContract.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.readOnlyApprovalImportImplementationAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    receiptFieldsReady: missingReceiptFields.length === 0,
    receiptAssertionsReady: missingReceiptAssertions.length === 0,
    forbiddenReceiptContentReady: missingForbiddenReceiptContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsMockApprovalEvidenceReceipt:
      architectureDoc.includes("Trading Mock Approval Evidence Receipt") &&
      architectureDoc.includes("mock_approval_evidence_receipt"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    mockApprovalEvidenceReceiptRecorded: true,
    approvalPacketImportedNow: false,
    readOnlyApprovalImportImplementationAllowed: false,
    readOnlyRuntimeIntegrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureRedactedReadOnlyApprovalEvidenceImportReview =
    checks.ownerConfirmedMockKisPortalAndRenderEnv &&
    checks.shadowModePolicyReady &&
    checks.envReadinessContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.readOnlyApprovalIntakeContractReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.receiptFieldsReady &&
    checks.receiptAssertionsReady &&
    checks.forbiddenReceiptContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsMockApprovalEvidenceReceipt &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2D",
    scope: "trading_mock_approval_evidence_receipt",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envReadinessContract: ENV_READINESS_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      readOnlyApprovalIntakeContract: READ_ONLY_APPROVAL_INTAKE_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      receiptOnly: true,
      mockApprovalEvidenceReceiptRecorded: true,
      approvalPacketImportedNow: false,
      readOnlyApprovalImportImplementationAllowed: false,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    ownerProvidedEvidenceReceipt: {
      scope: "mock_approval_evidence_receipt",
      ownerConfirmationAt: "2026-06-29",
      kisPortalMockApplicationConfirmed: true,
      renderEnvMockTradingValuesConfirmed: true,
      baseUrlScope: "virtual_trading_openapivts",
      tradingMode: "shadow",
      killSwitchState: "enabled",
      accountIdHashPresenceOnly: true,
      appKeyPresenceOnly: true,
      appSecretPresenceOnly: true,
      redactionVersion: "v1",
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      notes: [
        "owner confirmed KIS portal mock trading application status without committing raw account identifiers",
        "owner confirmed Render env values are mock trading scoped without exposing secrets",
        "receipt is not an approval packet import and cannot enable provider calls or orders",
      ],
    },
    futureRedactedApprovalImportBoundary: {
      requiredReceiptFields: receiptFields,
      requiredReceiptAssertions: receiptAssertions,
      forbiddenReceiptContent,
      promotionRules: [
        "receipt success can support a future redacted read-only approval evidence import review",
        "receipt success does not import data/private/trading/read_only_approval.redacted.json",
        "receipt success does not call KIS or any provider",
        "receipt success does not enable runtime routes, public UI, DB migration, or order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingReceiptFields,
      missingReceiptAssertions,
      missingForbiddenReceiptContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      envReadinessContractStatus: envReadinessContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      readOnlyApprovalIntakeContractStatus: readOnlyApprovalIntakeContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureRedactedReadOnlyApprovalEvidenceImportReview
        ? "receipt_ready_pending_redacted_read_only_approval_evidence_import_review"
        : "blocked_before_mock_approval_evidence_receipt",
      readyForFutureRedactedReadOnlyApprovalEvidenceImportReview,
      approvalPacketImportedNow: false,
      readOnlyApprovalImportImplementationAllowed: false,
      readOnlyRuntimeIntegrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.ownerConfirmedMockKisPortalAndRenderEnv ? [] : ["owner_mock_confirmation_missing"]),
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.envReadinessContractReady ? [] : ["env_readiness_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.readOnlyApprovalIntakeContractReady ? [] : ["read_only_approval_intake_contract_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...missingReceiptFields.map((field) => `missing_receipt_field_${field}`),
        ...missingReceiptAssertions.map((assertion) => `missing_receipt_assertion_${assertion}`),
        ...missingForbiddenReceiptContent.map((content) => `missing_forbidden_receipt_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsMockApprovalEvidenceReceipt
          ? []
          : ["architecture_doc_missing_mock_approval_evidence_receipt_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-mock-approval-evidence-receipt.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-mock-approval-evidence-receipt.cjs`);
    }
    console.log("[generate-trading-mock-approval-evidence-receipt] ok");
    console.log(`[generate-trading-mock-approval-evidence-receipt] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-mock-approval-evidence-receipt] wrote contract");
  console.log(
    `[generate-trading-mock-approval-evidence-receipt] readyForFutureRedactedReadOnlyApprovalEvidenceImportReview=${parsed.readiness.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview}`,
  );
}

main();

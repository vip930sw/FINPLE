const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_read_only_approval_template.json",
);
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
const REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);
const REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json",
);
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-approval-import-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_IMPORT_SERVICE_PATH = path.join(
  "server",
  "src",
  "services",
  "trading",
  "readOnlyApprovalImport.js",
);
const PRIVATE_APPROVAL_PACKET_PATH = path.join("data", "private", "trading", "read_only_approval.redacted.json");
const REQUIRED_REVIEW_GATES = [
  "read_only_approval_import_preflight_ready",
  "redacted_template_ready",
  "mock_approval_evidence_receipt_ready",
  "hash_preparation_still_deferred",
  "redacted_packet_validation_preflight_ready",
  "validator_fixtures_ready",
  "owner_private_packet_absent_now",
  "private_read_only_provider_review_still_blocked",
  "private_shadow_runtime_review_still_blocked",
  "env_risk_gate_fail_closed",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_worker_only",
  "explicit_owner_packet_path_required_later",
  "no_default_private_packet_read",
  "no_packet_write_now",
  "no_packet_import_now",
  "no_hash_generation_now",
  "no_provider_call",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "redacted_error_messages_only",
  "fail_closed_without_owner_packet_file",
  "fail_closed_without_redacted_packet_validation",
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
  FUTURE_IMPORT_SERVICE_PATH,
  PRIVATE_APPROVAL_PACKET_PATH,
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "privateTradingStore.js"),
  path.join("server", "src", "routes", "trading.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
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

function buildContract() {
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const redactedReadOnlyApprovalTemplate = readJson(REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH);
  const mockApprovalEvidenceReceipt = readJson(MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH);
  const redactedApprovalHashHelperPreflight = readJson(REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH);
  const redactedApprovalPacketValidationPreflight = readJson(REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH);
  const redactedApprovalPacketValidatorFixtures = readJson(REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES_PATH);
  const privateReadOnlyProviderImplementationPreflight = readJson(
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const privateShadowRuntimeImplementationPreflight = readJson(
    PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewGates = [...REQUIRED_REVIEW_GATES];
  const implementationRules = [...REQUIRED_IMPLEMENTATION_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingReviewGates = missingValues(reviewGates, REQUIRED_REVIEW_GATES);
  const missingImplementationRules = missingValues(implementationRules, REQUIRED_IMPLEMENTATION_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    ownerPrivatePacketAbsentNow: !fs.existsSync(PRIVATE_APPROVAL_PACKET_PATH),
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.readOnlyApprovalImportImplementationAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    redactedTemplateReady:
      redactedReadOnlyApprovalTemplate.readiness?.readyForOwnerRedactedApprovalPacketPreparation === true &&
      redactedReadOnlyApprovalTemplate.readiness?.approvalPacketCreatedNow === false &&
      redactedReadOnlyApprovalTemplate.readiness?.approvalPacketImportedNow === false &&
      redactedReadOnlyApprovalTemplate.readiness?.providerCallsAllowed === false,
    mockApprovalEvidenceReceiptReady:
      mockApprovalEvidenceReceipt.readiness?.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview === true &&
      mockApprovalEvidenceReceipt.readiness?.approvalPacketImportedNow === false &&
      mockApprovalEvidenceReceipt.readiness?.providerCallsAllowed === false &&
      mockApprovalEvidenceReceipt.readiness?.orderSubmissionAllowed === false,
    hashPreparationStillDeferred:
      redactedApprovalHashHelperPreflight.readiness?.ownerHashPreparationDeferred === true &&
      redactedApprovalHashHelperPreflight.readiness?.hashHelperImplementationAllowed === false &&
      redactedApprovalHashHelperPreflight.readiness?.hashGenerationAllowed === false &&
      redactedApprovalHashHelperPreflight.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalHashHelperPreflight.readiness?.approvalPacketImportedNow === false,
    redactedPacketValidationPreflightReady:
      redactedApprovalPacketValidationPreflight.readiness?.readyForPureLocalValidatorImplementationReview === true &&
      redactedApprovalPacketValidationPreflight.readiness?.approvalPacketCreatedNow === false &&
      redactedApprovalPacketValidationPreflight.readiness?.approvalPacketImportedNow === false &&
      redactedApprovalPacketValidationPreflight.readiness?.providerCallsAllowed === false &&
      redactedApprovalPacketValidationPreflight.readiness?.runtimeRouteAllowed === false,
    validatorFixturesReady:
      redactedApprovalPacketValidatorFixtures.readiness?.readyForValidatorFixtureRegression === true &&
      redactedApprovalPacketValidatorFixtures.readiness?.privateApprovalPacketCreated === false &&
      redactedApprovalPacketValidatorFixtures.readiness?.approvalPacketImportedNow === false &&
      redactedApprovalPacketValidatorFixtures.readiness?.providerCallsAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderImplementationPreflight.readiness?.ownerPacketGateStillClosed === true &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    privateShadowRuntimeImplementationStillBlocked:
      privateShadowRuntimeImplementationPreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview ===
        false &&
      privateShadowRuntimeImplementationPreflight.readiness?.privateShadowRuntimeImplementationAllowedNow === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsReadOnlyApprovalImportImplementationPreflight:
      architectureDoc.includes("Trading Read-Only Approval Import Implementation Preflight") &&
      architectureDoc.includes("read_only_approval_import_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    importImplementationAllowedNow: false,
    ownerPacketReadAllowedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3E",
    scope: "read_only_approval_import_implementation_preflight",
    sourceFiles: {
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      redactedReadOnlyApprovalTemplate: REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      redactedApprovalHashHelperPreflight: REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT_PATH,
      redactedApprovalPacketValidationPreflight: REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT_PATH,
      redactedApprovalPacketValidatorFixtures: REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      privateShadowRuntimeImplementationPreflight: PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      ownerPrivatePacketAbsentNow: true,
      importImplementationAllowedNow: false,
      ownerPacketReadAllowedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyApprovalImportImplementationBoundary: {
      scope: "read_only_approval_import_implementation_preflight",
      futureImportServicePath: FUTURE_IMPORT_SERVICE_PATH,
      futureApprovalPacketPath: PRIVATE_APPROVAL_PACKET_PATH,
      currentStepReadsPrivatePacket: false,
      currentStepWritesPrivatePacket: false,
      currentStepImportsPacket: false,
      currentStepGeneratesHashes: false,
      currentStepCallsProvider: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepWritesDatabase: false,
      reviewGates,
      implementationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start read-only approval import implementation review",
        "owner packet import remains blocked until the owner supplies a redacted packet through a separate local review",
        "import review cannot generate hashes, read default private packet paths, call providers, write DB rows, create routes, expose UI, or submit orders in this step",
        "approval import success still does not approve provider calls or live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerPrivatePacketPath: PRIVATE_APPROVAL_PACKET_PATH,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      redactedReadOnlyApprovalTemplateStatus: redactedReadOnlyApprovalTemplate.readiness?.status,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status,
      redactedApprovalHashHelperPreflightStatus: redactedApprovalHashHelperPreflight.readiness?.status,
      redactedApprovalPacketValidationPreflightStatus: redactedApprovalPacketValidationPreflight.readiness?.status,
      redactedApprovalPacketValidatorFixturesStatus: redactedApprovalPacketValidatorFixtures.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus:
        privateReadOnlyProviderImplementationPreflight.readiness?.status,
      privateShadowRuntimeImplementationPreflightStatus:
        privateShadowRuntimeImplementationPreflight.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_read_only_approval_import_review_blocked_pending_owner_packet",
      readyForFutureReadOnlyApprovalImportImplementationReview: false,
      ownerPrivatePacketAbsentNow: true,
      importImplementationAllowedNow: false,
      ownerPacketReadAllowedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.ownerPrivatePacketAbsentNow ? [] : ["owner_private_packet_present_too_early"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.redactedTemplateReady ? [] : ["redacted_template_not_ready"]),
        ...(checks.mockApprovalEvidenceReceiptReady ? [] : ["mock_approval_evidence_receipt_not_ready"]),
        ...(checks.hashPreparationStillDeferred ? [] : ["hash_preparation_not_deferred"]),
        ...(checks.redactedPacketValidationPreflightReady
          ? []
          : ["redacted_packet_validation_preflight_not_ready"]),
        ...(checks.validatorFixturesReady ? [] : ["redacted_packet_validator_fixtures_not_ready"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_not_blocked"]),
        ...(checks.privateShadowRuntimeImplementationStillBlocked
          ? []
          : ["private_shadow_runtime_implementation_not_blocked"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsReadOnlyApprovalImportImplementationPreflight
          ? []
          : ["architecture_doc_missing_read_only_approval_import_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "owner_redacted_read_only_approval_packet_not_imported",
        "owner_hash_preparation_deferred_until_owner_request",
        "private_read_only_provider_implementation_review_blocked_pending_owner_packet_import",
        "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-import-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-import-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-import-implementation-preflight] ok");
    console.log(`[generate-trading-read-only-approval-import-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-import-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-import-implementation-preflight] importImplementationAllowedNow=${parsed.readiness.importImplementationAllowedNow}`,
  );
}

main();

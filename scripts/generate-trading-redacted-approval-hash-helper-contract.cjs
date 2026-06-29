const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-redacted-approval-hash-helper-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-redacted-approval-hashes.cjs");

const REQUIRED_HASH_INPUT_LABELS = [
  "approvedByHash",
  "accountIdHash",
  "evidenceTicketHash",
  "revocationPlanHash",
];
const REQUIRED_HASH_HELPER_RULES = [
  "hmac_sha256_required",
  "private_pepper_required",
  "pepper_must_not_be_committed",
  "raw_inputs_from_stdin_or_interactive_prompt_only",
  "raw_inputs_not_allowed_in_command_args",
  "raw_inputs_not_logged",
  "raw_inputs_not_persisted",
  "output_labels_are_deterministic",
  "helper_does_not_create_approval_packet",
  "helper_does_not_import_approval_packet",
  "helper_does_not_enable_provider_calls",
  "helper_does_not_enable_order_submission",
];
const FORBIDDEN_HASH_INPUTS = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number_output",
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
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const hashInputLabels = [...REQUIRED_HASH_INPUT_LABELS];
  const hashHelperRules = [...REQUIRED_HASH_HELPER_RULES];
  const forbiddenHashInputs = [...FORBIDDEN_HASH_INPUTS];
  const missingHashInputLabels = missingValues(hashInputLabels, REQUIRED_HASH_INPUT_LABELS);
  const missingHashHelperRules = missingValues(hashHelperRules, REQUIRED_HASH_HELPER_RULES);
  const missingForbiddenHashInputs = missingValues(forbiddenHashInputs, FORBIDDEN_HASH_INPUTS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const sampleShape = redactedReadOnlyApprovalTemplate.futureRedactedApprovalPacketTemplate?.sampleRedactedShape ?? {};
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
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.runtimeRouteAllowed === false,
    templateSampleHasRequiredHashLabels:
      hashInputLabels.every((label) => typeof sampleShape[label] === "string" && sampleShape[label].includes(":")),
    hashInputLabelsReady: missingHashInputLabels.length === 0,
    hashHelperRulesReady: missingHashHelperRules.length === 0,
    forbiddenHashInputsReady: missingForbiddenHashInputs.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsHashHelper:
      architectureDoc.includes("Trading Redacted Approval Hash Helper Contract") &&
      architectureDoc.includes("redacted_approval_hash_helper"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    hashHelperImplementationAllowed: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureLocalHashHelperImplementationReview =
    checks.shadowModePolicyReady &&
    checks.mockApprovalEvidenceReceiptReady &&
    checks.redactedReadOnlyApprovalTemplateReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.templateSampleHasRequiredHashLabels &&
    checks.hashInputLabelsReady &&
    checks.hashHelperRulesReady &&
    checks.forbiddenHashInputsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsHashHelper &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2F",
    scope: "trading_redacted_approval_hash_helper_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      mockApprovalEvidenceReceipt: MOCK_APPROVAL_EVIDENCE_RECEIPT_PATH,
      redactedReadOnlyApprovalTemplate: REDACTED_READ_ONLY_APPROVAL_TEMPLATE_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      hashHelperImplementationAllowed: false,
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
    futureLocalHashHelperBoundary: {
      futureHashHelperPath: FUTURE_HASH_HELPER_PATH,
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      currentStepImplementsHelper: false,
      currentStepCreatesHashes: false,
      currentStepCreatesApprovalPacket: false,
      requiredHashInputLabels: hashInputLabels,
      requiredHashHelperRules: hashHelperRules,
      forbiddenHashInputs,
      acceptedHashAlgorithm: "HMAC-SHA256",
      requiredSecretBoundary: {
        pepperRequired: true,
        pepperStorage: "outside_repo_operator_secret",
        rawInputTransport: "stdin_or_interactive_prompt_only",
        commandLineRawSecretsAllowed: false,
        rawInputLoggingAllowed: false,
        rawInputPersistenceAllowed: false,
      },
      outputRules: [
        "helper output must contain only deterministic labels and hash strings",
        "helper output must not include raw operator names, account identifiers, evidence text, or revocation plan text",
        "helper output must not create or mutate data/private/trading/read_only_approval.redacted.json",
        "helper output must not unlock read-only provider calls or order submission",
      ],
      sampleOutputShape: {
        approvedByHash: "hmac-sha256:<operator_hash>",
        accountIdHash: "hmac-sha256:<account_hash>",
        evidenceTicketHash: "hmac-sha256:<evidence_ticket_hash>",
        revocationPlanHash: "hmac-sha256:<revocation_plan_hash>",
      },
    },
    checks,
    evidence: {
      shadowMode,
      templateSampleShape: sampleShape,
      missingHashInputLabels,
      missingHashHelperRules,
      missingForbiddenHashInputs,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      mockApprovalEvidenceReceiptStatus: mockApprovalEvidenceReceipt.readiness?.status,
      redactedReadOnlyApprovalTemplateStatus: redactedReadOnlyApprovalTemplate.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureLocalHashHelperImplementationReview
        ? "contract_ready_pending_local_hash_helper_implementation_review"
        : "blocked_before_redacted_approval_hash_helper_contract",
      readyForFutureLocalHashHelperImplementationReview,
      hashHelperImplementationAllowed: false,
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
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.templateSampleHasRequiredHashLabels ? [] : ["template_sample_missing_required_hash_labels"]),
        ...missingHashInputLabels.map((label) => `missing_hash_input_label_${label}`),
        ...missingHashHelperRules.map((rule) => `missing_hash_helper_rule_${rule}`),
        ...missingForbiddenHashInputs.map((input) => `missing_forbidden_hash_input_${input}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsHashHelper ? [] : ["architecture_doc_missing_redacted_approval_hash_helper"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-approval-hash-helper-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-approval-hash-helper-contract.cjs`,
      );
    }
    console.log("[generate-trading-redacted-approval-hash-helper-contract] ok");
    console.log(`[generate-trading-redacted-approval-hash-helper-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-approval-hash-helper-contract] wrote contract");
  console.log(
    `[generate-trading-redacted-approval-hash-helper-contract] readyForFutureLocalHashHelperImplementationReview=${parsed.readiness.readyForFutureLocalHashHelperImplementationReview}`,
  );
}

main();

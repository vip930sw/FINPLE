const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json",
);
const VALIDATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_runbook_contract.json",
);
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);
const VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json",
);
const IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const PRIVATE_READ_ONLY_PROVIDER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-approval-packet-validation-result-receipt-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const REQUIRED_RECEIPT_FIELDS = [
  "validationReceiptId",
  "validationStatus",
  "validatedAt",
  "validatorVersionHash",
  "approvalPacketShapeHash",
  "errorCodeHashes",
  "redactionVersion",
  "packetPathRecorded",
  "rawValuesRecorded",
  "approvalPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_RECEIPT_ASSERTIONS = [
  "receipt_is_redacted_only",
  "receipt_does_not_record_packet_path",
  "receipt_does_not_record_raw_values",
  "receipt_does_not_import_approval_packet",
  "receipt_does_not_enable_provider_calls",
  "receipt_does_not_enable_order_submission",
  "receipt_does_not_create_runtime_route",
  "receipt_does_not_approve_live_trading",
  "receipt_requires_separate_import_review",
  "receipt_requires_separate_provider_call_authorization_review",
];
const FORBIDDEN_RECEIPT_CONTENT = [
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

function buildContract() {
  const validationRunbook = readJson(VALIDATION_RUNBOOK_PATH);
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const validatorFixtures = readJson(VALIDATOR_FIXTURES_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateReadOnlyProviderPreflight = readJson(PRIVATE_READ_ONLY_PROVIDER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const receiptFields = [...REQUIRED_RECEIPT_FIELDS];
  const receiptAssertions = [...REQUIRED_RECEIPT_ASSERTIONS];
  const forbiddenReceiptContent = [...FORBIDDEN_RECEIPT_CONTENT];
  const missingReceiptFields = missingValues(receiptFields, REQUIRED_RECEIPT_FIELDS);
  const missingReceiptAssertions = missingValues(receiptAssertions, REQUIRED_RECEIPT_ASSERTIONS);
  const missingForbiddenReceiptContent = missingValues(forbiddenReceiptContent, FORBIDDEN_RECEIPT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    receiptContractOnly: true,
    validationRunbookReady:
      validationRunbook.readiness?.readyForOwnerAssistedReadOnlyApprovalPacketValidationRunbook === true &&
      validationRunbook.readiness?.currentStepRunsValidator === false &&
      validationRunbook.readiness?.currentStepReadsPrivatePacket === false &&
      validationRunbook.readiness?.approvalPacketImportedNow === false &&
      validationRunbook.readiness?.providerCallsAllowed === false &&
      validationRunbook.readiness?.orderSubmissionAllowed === false,
    validationPreflightReady:
      validationPreflight.readiness?.readyForPureLocalValidatorImplementationReview === true &&
      validationPreflight.readiness?.approvalPacketCreatedNow === false &&
      validationPreflight.readiness?.approvalPacketImportedNow === false &&
      validationPreflight.readiness?.providerCallsAllowed === false &&
      validationPreflight.readiness?.orderSubmissionAllowed === false,
    validatorFixturesReady:
      validatorFixtures.readiness?.readyForValidatorFixtureRegression === true &&
      validatorFixtures.readiness?.privateApprovalPacketCreated === false &&
      validatorFixtures.readiness?.approvalPacketImportedNow === false &&
      validatorFixtures.readiness?.providerCallsAllowed === false &&
      validatorFixtures.readiness?.orderSubmissionAllowed === false,
    importImplementationPreflightStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      importImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      importImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      importImplementationPreflight.readiness?.providerCallsAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderPreflight.readiness?.readyForFuturePrivateReadOnlyProviderImplementationReview === false &&
      privateReadOnlyProviderPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateReadOnlyProviderPreflight.readiness?.providerCallsAllowed === false &&
      privateReadOnlyProviderPreflight.readiness?.orderSubmissionAllowed === false,
    receiptFieldsReady: missingReceiptFields.length === 0,
    receiptAssertionsReady: missingReceiptAssertions.length === 0,
    forbiddenReceiptContentReady: missingForbiddenReceiptContent.length === 0,
    architectureDocMentionsValidationResultReceipt:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptRecordedNow: false,
    packetPathRecorded: false,
    rawValuesRecorded: false,
    approvalPacketImportedNow: false,
    importImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureReadOnlyApprovalPacketValidationResultReceiptReview =
    checks.validationRunbookReady &&
    checks.validationPreflightReady &&
    checks.validatorFixturesReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.privateReadOnlyProviderImplementationStillBlocked &&
    checks.receiptFieldsReady &&
    checks.receiptAssertionsReady &&
    checks.forbiddenReceiptContentReady &&
    checks.architectureDocMentionsValidationResultReceipt &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5J",
    scope: "read_only_approval_packet_validation_result_receipt",
    sourceFiles: {
      validationRunbook: VALIDATION_RUNBOOK_PATH,
      validationPreflight: VALIDATION_PREFLIGHT_PATH,
      redactedApprovalPacketValidatorFixtures: VALIDATOR_FIXTURES_PATH,
      readOnlyApprovalImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      receiptContractOnly: true,
      validationReceiptRecordedNow: false,
      packetPathRecorded: false,
      rawValuesRecorded: false,
      approvalPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureValidationResultReceiptBoundary: {
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      currentStepRunsValidator: false,
      currentStepRecordsReceipt: false,
      currentStepReadsPrivatePacket: false,
      currentStepImportsPacket: false,
      requiredReceiptFields: receiptFields,
      requiredReceiptAssertions: receiptAssertions,
      forbiddenReceiptContent,
      sampleRedactedShape: {
        validationReceiptId: "validation_receipt_<opaque_id>",
        validationStatus: "valid_or_invalid",
        validatedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        validatorVersionHash: "sha256:<validator_version_hash>",
        approvalPacketShapeHash: "hmac-sha256:<approval_packet_shape_hash>",
        errorCodeHashes: ["hmac-sha256:<error_code_hash>"],
        redactionVersion: "v1",
        packetPathRecorded: false,
        rawValuesRecorded: false,
        approvalPacketImportedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
      },
      promotionRules: [
        "validation result receipt can be reviewed later only after owner-assisted local validation",
        "receipt review cannot record the private packet path or raw packet values",
        "receipt success still does not import the read-only approval packet",
        "receipt success still does not authorize provider calls",
        "receipt success still does not enable runtime routes, UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      validationRunbookStatus: validationRunbook.readiness?.status,
      validationPreflightStatus: validationPreflight.readiness?.status,
      validatorFixturesStatus: validatorFixtures.readiness?.status,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus: privateReadOnlyProviderPreflight.readiness?.status,
      missingReceiptFields,
      missingReceiptAssertions,
      missingForbiddenReceiptContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForFutureReadOnlyApprovalPacketValidationResultReceiptReview
        ? "receipt_contract_ready_pending_owner_read_only_approval_validation_result_review"
        : "blocked_before_read_only_approval_packet_validation_result_receipt_review",
      readyForFutureReadOnlyApprovalPacketValidationResultReceiptReview,
      validationReceiptRecordedNow: false,
      packetPathRecorded: false,
      rawValuesRecorded: false,
      approvalPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.validationRunbookReady ? [] : ["read_only_approval_packet_validation_runbook_not_ready"]),
        ...(checks.validationPreflightReady ? [] : ["redacted_approval_packet_validation_preflight_not_ready"]),
        ...(checks.validatorFixturesReady ? [] : ["redacted_approval_packet_validator_fixtures_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["read_only_approval_import_implementation_preflight_not_blocked"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_preflight_not_blocked"]),
        ...missingReceiptFields.map((field) => `missing_receipt_field_${field}`),
        ...missingReceiptAssertions.map((assertion) => `missing_receipt_assertion_${assertion}`),
        ...missingForbiddenReceiptContent.map((content) => `missing_forbidden_receipt_content_${content}`),
        ...(checks.architectureDocMentionsValidationResultReceipt
          ? []
          : ["architecture_doc_missing_read_only_approval_packet_validation_result_receipt"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_read_only_approval_validation_result_receipt_not_supplied",
        "read_only_approval_import_review_blocked_pending_owner_packet",
        "read_only_provider_call_authorization_review_result_not_owner_supplied",
        "provider_calls_blocked_until_owner_packet_import_and_review",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-packet-validation-result-receipt] ok");
    console.log(`[generate-trading-read-only-approval-packet-validation-result-receipt] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-packet-validation-result-receipt] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt] readyForFutureReadOnlyApprovalPacketValidationResultReceiptReview=${parsed.readiness.readyForFutureReadOnlyApprovalPacketValidationResultReceiptReview}`,
  );
}

main();

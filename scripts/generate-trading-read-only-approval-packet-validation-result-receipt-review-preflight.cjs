const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json",
);
const RECEIPT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json",
);
const RECEIPT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_validator_fixtures.json",
);
const RECEIPT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt.cjs",
);
const APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
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

const CONTRACT_VERSION =
  "trading-lab-step116-read-only-approval-packet-validation-result-receipt-review-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval_validation_result_receipt.redacted.json",
);
const FUTURE_APPROVAL_PACKET_PATH = path.join("data", "private", "trading", "read_only_approval.redacted.json");
const REQUIRED_REVIEW_GATES = [
  "validation_result_receipt_contract_ready",
  "validation_result_receipt_validator_ready",
  "validation_result_receipt_validator_fixtures_ready",
  "explicit_owner_validation_receipt_path_required_later",
  "no_default_receipt_read",
  "no_private_approval_packet_path",
  "no_raw_approval_values",
  "no_approval_packet_import",
  "no_provider_call",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "no_live_trading",
  "requires_separate_approval_import_review",
  "requires_separate_provider_call_authorization_review",
];
const FORBIDDEN_REVIEW_CONTENT = [
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
  FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
  FUTURE_APPROVAL_PACKET_PATH,
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
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
  const receiptContract = readJson(RECEIPT_CONTRACT_PATH);
  const receiptValidatorFixtures = readJson(RECEIPT_VALIDATOR_FIXTURES_PATH);
  const approvalImportPreflight = readJson(APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateReadOnlyProviderPreflight = readJson(PRIVATE_READ_ONLY_PROVIDER_PREFLIGHT_PATH);
  const receiptValidatorSource = readText(RECEIPT_VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewGates = [...REQUIRED_REVIEW_GATES];
  const forbiddenReviewContent = [...FORBIDDEN_REVIEW_CONTENT];
  const missingReviewGates = missingValues(reviewGates, REQUIRED_REVIEW_GATES);
  const missingForbiddenReviewContent = missingValues(forbiddenReviewContent, FORBIDDEN_REVIEW_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    receiptContractReady:
      receiptContract.readiness?.readyForFutureReadOnlyApprovalPacketValidationResultReceiptReview === true &&
      receiptContract.readiness?.validationReceiptRecordedNow === false &&
      receiptContract.readiness?.packetPathRecorded === false &&
      receiptContract.readiness?.rawValuesRecorded === false &&
      receiptContract.readiness?.approvalPacketImportedNow === false &&
      receiptContract.readiness?.providerCallsAllowed === false &&
      receiptContract.readiness?.orderSubmissionAllowed === false,
    receiptValidatorFixturesReady:
      receiptValidatorFixtures.readiness?.readyForReadOnlyApprovalPacketValidationResultReceiptValidatorRegression === true &&
      receiptValidatorFixtures.readiness?.validationReceiptRecordedNow === false &&
      receiptValidatorFixtures.readiness?.packetPathRecorded === false &&
      receiptValidatorFixtures.readiness?.rawValuesRecorded === false &&
      receiptValidatorFixtures.readiness?.approvalPacketImportedNow === false &&
      receiptValidatorFixtures.readiness?.providerCallsAllowed === false &&
      receiptValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    receiptValidatorReady:
      receiptValidatorSource.includes("validateTradingReadOnlyApprovalPacketValidationResultReceipt") &&
      receiptValidatorSource.includes("receipt_path_required") &&
      receiptValidatorSource.includes("--receipt"),
    approvalImportImplementationStillBlocked:
      approvalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      approvalImportPreflight.readiness?.importImplementationAllowedNow === false &&
      approvalImportPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      approvalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalImportPreflight.readiness?.providerCallsAllowed === false &&
      approvalImportPreflight.readiness?.orderSubmissionAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderPreflight.readiness?.readyForFuturePrivateReadOnlyProviderImplementationReview === false &&
      privateReadOnlyProviderPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateReadOnlyProviderPreflight.readiness?.providerCallsAllowed === false &&
      privateReadOnlyProviderPreflight.readiness?.orderSubmissionAllowed === false,
    reviewGateCatalogReady: missingReviewGates.length === 0,
    forbiddenReviewContentReady: missingForbiddenReviewContent.length === 0,
    architectureDocMentionsValidationResultReceiptReviewPreflight:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt Review Preflight") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt_review_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptRecordedNow: false,
    validationReceiptReadAllowedNow: false,
    packetPathRecorded: false,
    rawValuesRecorded: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight =
    checks.receiptContractReady &&
    checks.receiptValidatorFixturesReady &&
    checks.receiptValidatorReady &&
    checks.approvalImportImplementationStillBlocked &&
    checks.privateReadOnlyProviderImplementationStillBlocked &&
    checks.reviewGateCatalogReady &&
    checks.forbiddenReviewContentReady &&
    checks.architectureDocMentionsValidationResultReceiptReviewPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5M",
    scope: "read_only_approval_packet_validation_result_receipt_review_preflight",
    sourceFiles: {
      validationResultReceiptContract: RECEIPT_CONTRACT_PATH,
      validationResultReceiptValidatorFixtures: RECEIPT_VALIDATOR_FIXTURES_PATH,
      validationResultReceiptValidator: RECEIPT_VALIDATOR_PATH,
      readOnlyApprovalImportImplementationPreflight: APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      preflightOnly: true,
      validationReceiptRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      packetPathRecorded: false,
      rawValuesRecorded: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureValidationResultReceiptReviewBoundary: {
      futureValidationResultReceiptPath: FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
      futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
      currentStepReadsReceipt: false,
      currentStepRecordsReceipt: false,
      currentStepReadsApprovalPacket: false,
      currentStepImportsApprovalPacket: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      reviewGates,
      forbiddenReviewContent,
      promotionRules: [
        "future review requires an explicit owner-supplied read-only approval validation-result receipt path",
        "future review must validate the receipt with the local receipt validator before approval import review",
        "future review cannot record the private approval packet path, raw packet values, owner name, evidence, or revocation plan",
        "future review success still does not import approval evidence or authorize provider calls",
        "future review success still does not enable runtime routes, UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      receiptContractStatus: receiptContract.readiness?.status,
      receiptValidatorFixturesStatus: receiptValidatorFixtures.readiness?.status,
      approvalImportImplementationPreflightStatus: approvalImportPreflight.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus: privateReadOnlyProviderPreflight.readiness?.status,
      missingReviewGates,
      missingForbiddenReviewContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight
        ? "preflight_ready_for_future_owner_read_only_approval_validation_result_receipt_review"
        : "blocked_before_read_only_approval_validation_result_receipt_review_preflight",
      readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight,
      validationReceiptRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      packetPathRecorded: false,
      rawValuesRecorded: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.receiptContractReady ? [] : ["read_only_approval_validation_result_receipt_contract_not_ready"]),
        ...(checks.receiptValidatorFixturesReady
          ? []
          : ["read_only_approval_validation_result_receipt_validator_fixtures_not_ready"]),
        ...(checks.receiptValidatorReady ? [] : ["read_only_approval_validation_result_receipt_validator_not_ready"]),
        ...(checks.approvalImportImplementationStillBlocked
          ? []
          : ["read_only_approval_import_implementation_preflight_not_blocked"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_preflight_not_blocked"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingForbiddenReviewContent.map((content) => `missing_forbidden_review_content_${content}`),
        ...(checks.architectureDocMentionsValidationResultReceiptReviewPreflight
          ? []
          : ["architecture_doc_missing_read_only_approval_validation_result_receipt_review_preflight"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight] ok");
    console.log(
      `[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight] readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight=${parsed.readiness.readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_contract.json",
);
const REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json",
);
const REVIEW_PREFLIGHT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight_validator_fixtures.json",
);
const REVIEW_PREFLIGHT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs",
);
const RECEIPT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-read-only-approval-packet-validation-result-receipt-review-runbook-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval_validation_result_receipt.redacted.json",
);
const REQUIRED_REVIEW_ASSERTIONS = [
  "review_uses_explicit_owner_supplied_approval_validation_receipt_path_later",
  "review_runs_local_approval_validation_receipt_validator_later",
  "review_does_not_record_receipt_path",
  "review_does_not_record_raw_approval",
  "review_does_not_import_approval_packet",
  "review_does_not_enable_provider_calls",
  "review_does_not_enable_order_submission",
  "review_does_not_create_runtime_route",
  "review_does_not_create_public_ui",
  "review_does_not_write_database",
  "review_requires_separate_provider_call_authorization_review",
];
const REDACTED_REVIEW_OUTPUT_FIELDS = [
  "approvalValidationReceiptReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "receiptShapeHash",
  "validatorVersionHash",
  "reviewErrorCodeHashes",
  "reviewPolicyHash",
  "redactionVersion",
  "receiptPathRecorded",
  "rawValuesRecorded",
  "approvalPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const FORBIDDEN_REVIEW_OUTPUT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_name",
  "raw_evidence_text",
  "raw_revocation_plan",
  "raw_approval_packet",
  "raw_approval_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
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
  const reviewPreflight = readJson(REVIEW_PREFLIGHT_PATH);
  const reviewPreflightValidatorFixtures = readJson(REVIEW_PREFLIGHT_VALIDATOR_FIXTURES_PATH);
  const reviewPreflightValidatorSource = readText(REVIEW_PREFLIGHT_VALIDATOR_PATH);
  const receiptValidatorSource = readText(RECEIPT_VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const requiredReviewAssertions = [...REQUIRED_REVIEW_ASSERTIONS];
  const redactedReviewOutputFields = [...REDACTED_REVIEW_OUTPUT_FIELDS];
  const forbiddenReviewOutputContent = [...FORBIDDEN_REVIEW_OUTPUT_CONTENT];
  const missingReviewAssertions = missingValues(requiredReviewAssertions, REQUIRED_REVIEW_ASSERTIONS);
  const missingRedactedReviewOutputFields = missingValues(redactedReviewOutputFields, REDACTED_REVIEW_OUTPUT_FIELDS);
  const missingForbiddenReviewOutputContent = missingValues(
    forbiddenReviewOutputContent,
    FORBIDDEN_REVIEW_OUTPUT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    runbookOnly: true,
    reviewPreflightReady:
      reviewPreflight.readiness?.readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight === true &&
      reviewPreflight.readiness?.validationReceiptRecordedNow === false &&
      reviewPreflight.readiness?.validationReceiptReadAllowedNow === false &&
      reviewPreflight.readiness?.packetPathRecorded === false &&
      reviewPreflight.readiness?.rawValuesRecorded === false &&
      reviewPreflight.readiness?.approvalPacketImportedNow === false &&
      reviewPreflight.readiness?.providerCallsAllowed === false &&
      reviewPreflight.readiness?.orderSubmissionAllowed === false,
    reviewPreflightValidatorFixturesReady:
      reviewPreflightValidatorFixtures.readiness
        ?.readyForReadOnlyApprovalValidationResultReceiptReviewPreflightValidatorRegression === true &&
      reviewPreflightValidatorFixtures.readiness?.validationReceiptRecordedNow === false &&
      reviewPreflightValidatorFixtures.readiness?.validationReceiptReadAllowedNow === false &&
      reviewPreflightValidatorFixtures.readiness?.rawValuesRecorded === false &&
      reviewPreflightValidatorFixtures.readiness?.approvalPacketImportedNow === false &&
      reviewPreflightValidatorFixtures.readiness?.providerCallsAllowed === false &&
      reviewPreflightValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    reviewPreflightValidatorReady:
      reviewPreflightValidatorSource.includes(
        "validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight",
      ) &&
      reviewPreflightValidatorSource.includes("contract_path_required") &&
      reviewPreflightValidatorSource.includes("--contract"),
    receiptValidatorReady:
      receiptValidatorSource.includes("validateTradingReadOnlyApprovalPacketValidationResultReceipt") &&
      receiptValidatorSource.includes("receipt_path_required") &&
      receiptValidatorSource.includes("--receipt"),
    reviewAssertionCatalogReady: missingReviewAssertions.length === 0,
    redactedReviewOutputCatalogReady: missingRedactedReviewOutputFields.length === 0,
    forbiddenReviewOutputContentReady: missingForbiddenReviewOutputContent.length === 0,
    architectureDocMentionsReadOnlyApprovalValidationResultReceiptReviewRunbook:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt Review Runbook") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt_review_runbook"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepRunsValidator: false,
    currentStepReadsReceipt: false,
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
  const readyForOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbookReview =
    checks.reviewPreflightReady &&
    checks.reviewPreflightValidatorFixturesReady &&
    checks.reviewPreflightValidatorReady &&
    checks.receiptValidatorReady &&
    checks.reviewAssertionCatalogReady &&
    checks.redactedReviewOutputCatalogReady &&
    checks.forbiddenReviewOutputContentReady &&
    checks.architectureDocMentionsReadOnlyApprovalValidationResultReceiptReviewRunbook &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5P",
    scope: "read_only_approval_packet_validation_result_receipt_review_runbook",
    sourceFiles: {
      validationResultReceiptReviewPreflight: REVIEW_PREFLIGHT_PATH,
      validationResultReceiptReviewPreflightValidatorFixtures: REVIEW_PREFLIGHT_VALIDATOR_FIXTURES_PATH,
      validationResultReceiptReviewPreflightValidator: REVIEW_PREFLIGHT_VALIDATOR_PATH,
      validationResultReceiptValidator: RECEIPT_VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      runbookOnly: true,
      currentStepRunsValidator: false,
      currentStepReadsReceipt: false,
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
    futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook: {
      futureValidationResultReceiptPath: FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
      validatorCommandTemplate:
        "node scripts/validate-trading-read-only-approval-packet-validation-result-receipt.cjs --receipt <owner-supplied-redacted-approval-validation-result-receipt-path>",
      reviewPreflightValidatorCommandTemplate:
        "node scripts/validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs --contract data/processed/trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json",
      currentStepRunsValidator: false,
      currentStepReadsReceipt: false,
      currentStepRecordsReceipt: false,
      currentStepCallsProvider: false,
      requiredReviewAssertions,
      redactedReviewOutputFields,
      forbiddenReviewOutputContent,
      safetyNotes: [
        "the owner-supplied redacted read-only approval validation result receipt path is provided later and is not read by this contract",
        "review output may record hashes and redacted status later, but must not record receipt paths, raw approval values, or approval packets",
        "successful approval receipt review is not provider call authorization clearance",
        "successful approval receipt review is not runtime route, UI, DB, order, or live trading clearance",
      ],
    },
    checks,
    evidence: {
      reviewPreflightStatus: reviewPreflight.readiness?.status,
      reviewPreflightValidatorFixturesStatus: reviewPreflightValidatorFixtures.readiness?.status,
      missingReviewAssertions,
      missingRedactedReviewOutputFields,
      missingForbiddenReviewOutputContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbookReview
        ? "runbook_ready_for_owner_assisted_read_only_approval_validation_result_receipt_review"
        : "blocked_before_read_only_approval_validation_result_receipt_review_runbook",
      readyForOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbookReview,
      runbookOnly: true,
      currentStepRunsValidator: false,
      currentStepReadsReceipt: false,
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
        ...(checks.reviewPreflightReady
          ? []
          : ["read_only_approval_packet_validation_result_receipt_review_preflight_not_ready"]),
        ...(checks.reviewPreflightValidatorFixturesReady
          ? []
          : ["read_only_approval_packet_validation_result_receipt_review_preflight_validator_fixtures_not_ready"]),
        ...(checks.reviewPreflightValidatorReady
          ? []
          : ["read_only_approval_packet_validation_result_receipt_review_preflight_validator_not_ready"]),
        ...(checks.receiptValidatorReady
          ? []
          : ["read_only_approval_packet_validation_result_receipt_validator_not_ready"]),
        ...missingReviewAssertions.map((assertion) => `missing_review_assertion_${assertion}`),
        ...missingRedactedReviewOutputFields.map((field) => `missing_redacted_review_output_field_${field}`),
        ...missingForbiddenReviewOutputContent.map((content) => `missing_forbidden_review_output_content_${content}`),
        ...(checks.architectureDocMentionsReadOnlyApprovalValidationResultReceiptReviewRunbook
          ? []
          : ["architecture_doc_missing_read_only_approval_packet_validation_result_receipt_review_runbook"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract] ok");
    console.log(
      `[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract] readyForOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbookReview=${parsed.readiness.readyForOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbookReview}`,
  );
}

if (require.main === module) {
  main();
}

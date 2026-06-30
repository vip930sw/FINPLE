const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
);
const REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
);
const REVIEW_PREFLIGHT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight_validator_fixtures.json",
);
const REVIEW_PREFLIGHT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-validation-result-receipt-review-preflight.cjs",
);
const RECEIPT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-validation-result-receipt.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-validation-result-receipt-review-runbook-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission_validation_result_receipt.redacted.json",
);
const REQUIRED_REVIEW_ASSERTIONS = [
  "review_uses_explicit_owner_supplied_receipt_path_later",
  "review_runs_local_receipt_validator_later",
  "review_does_not_record_receipt_path",
  "review_does_not_record_raw_values",
  "review_does_not_import_permission_packet",
  "review_does_not_enable_provider_calls",
  "review_does_not_enable_order_submission",
  "review_does_not_create_runtime_route",
  "review_does_not_create_public_ui",
  "review_does_not_write_database",
  "review_requires_separate_permission_import_review",
];
const REDACTED_REVIEW_OUTPUT_FIELDS = [
  "validationReceiptReviewId",
  "reviewStatus",
  "reviewedAt",
  "receiptShapeHash",
  "validatorVersionHash",
  "reviewErrorCodeHashes",
  "redactionVersion",
  "receiptPathRecorded",
  "rawValuesRecorded",
  "permissionPacketImportedNow",
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
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
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
      reviewPreflight.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      reviewPreflight.readiness?.validationReceiptRecordedNow === false &&
      reviewPreflight.readiness?.validationReceiptReadAllowedNow === false &&
      reviewPreflight.readiness?.permissionPacketImportedNow === false &&
      reviewPreflight.readiness?.providerCallsAllowed === false &&
      reviewPreflight.readiness?.orderSubmissionAllowed === false,
    reviewPreflightValidatorFixturesReady:
      reviewPreflightValidatorFixtures.readiness
        ?.readyForManualOrderPermissionValidationResultReceiptReviewPreflightValidatorRegression === true &&
      reviewPreflightValidatorFixtures.readiness?.validationReceiptRecordedNow === false &&
      reviewPreflightValidatorFixtures.readiness?.validationReceiptReadAllowedNow === false &&
      reviewPreflightValidatorFixtures.readiness?.permissionPacketImportedNow === false &&
      reviewPreflightValidatorFixtures.readiness?.providerCallsAllowed === false &&
      reviewPreflightValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    reviewPreflightValidatorReady:
      reviewPreflightValidatorSource.includes(
        "validateManualOrderPermissionValidationResultReceiptReviewPreflight",
      ) &&
      reviewPreflightValidatorSource.includes("contract_path_required") &&
      reviewPreflightValidatorSource.includes("--contract"),
    receiptValidatorReady:
      receiptValidatorSource.includes("validateTradingManualOrderPermissionValidationResultReceipt") &&
      receiptValidatorSource.includes("receipt_path_required") &&
      receiptValidatorSource.includes("--receipt"),
    reviewAssertionCatalogReady: missingReviewAssertions.length === 0,
    redactedReviewOutputCatalogReady: missingRedactedReviewOutputFields.length === 0,
    forbiddenReviewOutputContentReady: missingForbiddenReviewOutputContent.length === 0,
    architectureDocMentionsValidationResultReceiptReviewRunbook:
      architectureDoc.includes("Trading Manual Order Permission Validation Result Receipt Review Runbook") &&
      architectureDoc.includes("manual_order_permission_validation_result_receipt_review_runbook"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepRunsValidator: false,
    currentStepReadsReceipt: false,
    validationReceiptRecordedNow: false,
    validationReceiptReadAllowedNow: false,
    packetPathRecorded: false,
    rawValuesRecorded: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerAssistedValidationResultReceiptReviewRunbookReview =
    checks.reviewPreflightReady &&
    checks.reviewPreflightValidatorFixturesReady &&
    checks.reviewPreflightValidatorReady &&
    checks.receiptValidatorReady &&
    checks.reviewAssertionCatalogReady &&
    checks.redactedReviewOutputCatalogReady &&
    checks.forbiddenReviewOutputContentReady &&
    checks.architectureDocMentionsValidationResultReceiptReviewRunbook &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4R",
    scope: "manual_order_permission_validation_result_receipt_review_runbook",
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
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedValidationResultReceiptReviewRunbook: {
      futureValidationResultReceiptPath: FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
      validatorCommandTemplate:
        "node scripts/validate-trading-manual-order-permission-validation-result-receipt.cjs --receipt <owner-supplied-redacted-validation-result-receipt-path>",
      reviewPreflightValidatorCommandTemplate:
        "node scripts/validate-trading-manual-order-permission-validation-result-receipt-review-preflight.cjs --contract data/processed/trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
      currentStepRunsValidator: false,
      currentStepReadsReceipt: false,
      currentStepRecordsReceipt: false,
      currentStepImportsPermissionPacket: false,
      requiredReviewAssertions,
      redactedReviewOutputFields,
      forbiddenReviewOutputContent,
      safetyNotes: [
        "the owner-supplied redacted validation result receipt path is provided later and is not read by this contract",
        "review output may record hashes and redacted status later, but must not record receipt paths or raw values",
        "successful receipt review is not permission packet import clearance",
        "successful receipt review is not provider call, order adapter, runtime route, UI, DB, order, or live trading clearance",
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
      status: readyForOwnerAssistedValidationResultReceiptReviewRunbookReview
        ? "runbook_ready_for_owner_assisted_validation_result_receipt_review"
        : "blocked_before_manual_order_permission_validation_result_receipt_review_runbook",
      readyForOwnerAssistedValidationResultReceiptReviewRunbookReview,
      runbookOnly: true,
      currentStepRunsValidator: false,
      currentStepReadsReceipt: false,
      validationReceiptRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      packetPathRecorded: false,
      rawValuesRecorded: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.reviewPreflightReady
          ? []
          : ["manual_order_permission_validation_result_receipt_review_preflight_not_ready"]),
        ...(checks.reviewPreflightValidatorFixturesReady
          ? []
          : ["manual_order_permission_validation_result_receipt_review_preflight_validator_fixtures_not_ready"]),
        ...(checks.reviewPreflightValidatorReady
          ? []
          : ["manual_order_permission_validation_result_receipt_review_preflight_validator_not_ready"]),
        ...(checks.receiptValidatorReady
          ? []
          : ["manual_order_permission_validation_result_receipt_validator_not_ready"]),
        ...missingReviewAssertions.map((assertion) => `missing_review_assertion_${assertion}`),
        ...missingRedactedReviewOutputFields.map((field) => `missing_redacted_review_output_field_${field}`),
        ...missingForbiddenReviewOutputContent.map((content) => `missing_forbidden_review_output_content_${content}`),
        ...(checks.architectureDocMentionsValidationResultReceiptReviewRunbook
          ? []
          : ["architecture_doc_missing_manual_order_permission_validation_result_receipt_review_runbook"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-validation-result-receipt-review-runbook-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-validation-result-receipt-review-runbook-contract.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-validation-result-receipt-review-runbook-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-validation-result-receipt-review-runbook-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-validation-result-receipt-review-runbook-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-validation-result-receipt-review-runbook-contract] readyForOwnerAssistedValidationResultReceiptReviewRunbookReview=${parsed.readiness.readyForOwnerAssistedValidationResultReceiptReviewRunbookReview}`,
  );
}

if (require.main === module) {
  main();
}

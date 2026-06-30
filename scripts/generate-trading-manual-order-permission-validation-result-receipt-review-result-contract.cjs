const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
);
const REVIEW_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
);
const REVIEW_RUNBOOK_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures.json",
);
const VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
);
const IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-validation-result-receipt-review-result-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission_validation_result_receipt.redacted.json",
);
const REQUIRED_REVIEW_RESULT_FIELDS = [
  "validationReceiptReviewId",
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
  "permissionPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_REVIEW_RESULT_ASSERTIONS = [
  "review_result_is_redacted_only",
  "review_result_does_not_record_receipt_path",
  "review_result_does_not_record_raw_values",
  "review_result_does_not_import_permission_packet",
  "review_result_does_not_enable_provider_calls",
  "review_result_does_not_enable_order_submission",
  "review_result_does_not_create_runtime_route",
  "review_result_does_not_create_public_ui",
  "review_result_requires_separate_permission_import_review",
];
const FORBIDDEN_REVIEW_RESULT_CONTENT = [
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
  const reviewRunbook = readJson(REVIEW_RUNBOOK_PATH);
  const reviewRunbookValidatorFixtures = readJson(REVIEW_RUNBOOK_VALIDATOR_FIXTURES_PATH);
  const validationResultReceipt = readJson(VALIDATION_RESULT_RECEIPT_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultFields = [...REQUIRED_REVIEW_RESULT_FIELDS];
  const reviewResultAssertions = [...REQUIRED_REVIEW_RESULT_ASSERTIONS];
  const forbiddenReviewResultContent = [...FORBIDDEN_REVIEW_RESULT_CONTENT];
  const missingReviewResultFields = missingValues(reviewResultFields, REQUIRED_REVIEW_RESULT_FIELDS);
  const missingReviewResultAssertions = missingValues(reviewResultAssertions, REQUIRED_REVIEW_RESULT_ASSERTIONS);
  const missingForbiddenReviewResultContent = missingValues(
    forbiddenReviewResultContent,
    FORBIDDEN_REVIEW_RESULT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    reviewResultContractOnly: true,
    reviewRunbookReady:
      reviewRunbook.readiness?.readyForOwnerAssistedValidationResultReceiptReviewRunbookReview === true &&
      reviewRunbook.readiness?.currentStepRunsValidator === false &&
      reviewRunbook.readiness?.currentStepReadsReceipt === false &&
      reviewRunbook.readiness?.permissionPacketImportedNow === false &&
      reviewRunbook.readiness?.providerCallsAllowed === false &&
      reviewRunbook.readiness?.orderSubmissionAllowed === false,
    reviewRunbookValidatorFixturesReady:
      reviewRunbookValidatorFixtures.readiness?.readyForReviewRunbookValidatorFixtureRegression === true &&
      reviewRunbookValidatorFixtures.readiness?.currentStepReadsReceipt === false &&
      reviewRunbookValidatorFixtures.readiness?.permissionPacketImportedNow === false &&
      reviewRunbookValidatorFixtures.readiness?.providerCallsAllowed === false &&
      reviewRunbookValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validationResultReceiptContractReady:
      validationResultReceipt.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      validationResultReceipt.readiness?.validationReceiptRecordedNow === false &&
      validationResultReceipt.readiness?.packetPathRecorded === false &&
      validationResultReceipt.readiness?.rawValuesRecorded === false &&
      validationResultReceipt.readiness?.permissionPacketImportedNow === false &&
      validationResultReceipt.readiness?.providerCallsAllowed === false &&
      validationResultReceipt.readiness?.orderSubmissionAllowed === false,
    importImplementationPreflightStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      importImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationPreflight.readiness?.permissionPacketImportedNow === false &&
      importImplementationPreflight.readiness?.providerCallsAllowed === false &&
      importImplementationPreflight.readiness?.orderSubmissionAllowed === false,
    liveGuardedOrderAdapterReviewStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    reviewResultFieldsReady: missingReviewResultFields.length === 0,
    reviewResultAssertionsReady: missingReviewResultAssertions.length === 0,
    forbiddenReviewResultContentReady: missingForbiddenReviewResultContent.length === 0,
    architectureDocMentionsValidationResultReceiptReviewResult:
      architectureDoc.includes("Trading Manual Order Permission Validation Result Receipt Review Result") &&
      architectureDoc.includes("manual_order_permission_validation_result_receipt_review_result"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptReviewRecordedNow: false,
    validationReceiptReadAllowedNow: false,
    receiptPathRecorded: false,
    rawValuesRecorded: false,
    permissionPacketImportedNow: false,
    importImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureManualOrderPermissionValidationResultReceiptReviewResult =
    checks.reviewRunbookReady &&
    checks.reviewRunbookValidatorFixturesReady &&
    checks.validationResultReceiptContractReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.liveGuardedOrderAdapterReviewStillBlocked &&
    checks.reviewResultFieldsReady &&
    checks.reviewResultAssertionsReady &&
    checks.forbiddenReviewResultContentReady &&
    checks.architectureDocMentionsValidationResultReceiptReviewResult &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4U",
    scope: "manual_order_permission_validation_result_receipt_review_result",
    sourceFiles: {
      validationResultReceiptReviewRunbook: REVIEW_RUNBOOK_PATH,
      validationResultReceiptReviewRunbookValidatorFixtures: REVIEW_RUNBOOK_VALIDATOR_FIXTURES_PATH,
      validationResultReceiptContract: VALIDATION_RESULT_RECEIPT_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      reviewResultContractOnly: true,
      validationReceiptReviewRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      receiptPathRecorded: false,
      rawValuesRecorded: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureValidationResultReceiptReviewResultBoundary: {
      futureValidationResultReceiptPath: FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
      currentStepReadsReceipt: false,
      currentStepRecordsReviewResult: false,
      currentStepImportsPermissionPacket: false,
      requiredReviewResultFields: reviewResultFields,
      requiredReviewResultAssertions: reviewResultAssertions,
      forbiddenReviewResultContent,
      sampleRedactedShape: {
        validationReceiptReviewId: "validation_receipt_review_<opaque_id>",
        reviewStatus: "accepted_for_import_review_or_rejected",
        reviewedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        reviewerHash: "hmac-sha256:<reviewer_hash>",
        receiptShapeHash: "hmac-sha256:<receipt_shape_hash>",
        validatorVersionHash: "sha256:<validator_version_hash>",
        reviewErrorCodeHashes: ["hmac-sha256:<review_error_code_hash>"],
        reviewPolicyHash: "sha256:<review_policy_hash>",
        redactionVersion: "v1",
        receiptPathRecorded: false,
        rawValuesRecorded: false,
        permissionPacketImportedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
      },
      promotionRules: [
        "future review result can be recorded only after owner-assisted receipt review",
        "review result cannot record the private receipt path or raw values",
        "review result success still does not import permission evidence",
        "review result success still does not enable provider calls, order adapter implementation, runtime routes, UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      reviewRunbookStatus: reviewRunbook.readiness?.status,
      reviewRunbookValidatorFixturesStatus: reviewRunbookValidatorFixtures.readiness?.status,
      validationResultReceiptStatus: validationResultReceipt.readiness?.status,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status,
      missingReviewResultFields,
      missingReviewResultAssertions,
      missingForbiddenReviewResultContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForFutureManualOrderPermissionValidationResultReceiptReviewResult
        ? "review_result_contract_ready_pending_owner_validation_result_receipt_review"
        : "blocked_before_manual_order_permission_validation_result_receipt_review_result",
      readyForFutureManualOrderPermissionValidationResultReceiptReviewResult,
      validationReceiptReviewRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      receiptPathRecorded: false,
      rawValuesRecorded: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.reviewRunbookReady
          ? []
          : ["manual_order_permission_validation_result_receipt_review_runbook_not_ready"]),
        ...(checks.reviewRunbookValidatorFixturesReady
          ? []
          : ["manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures_not_ready"]),
        ...(checks.validationResultReceiptContractReady
          ? []
          : ["manual_order_permission_validation_result_receipt_contract_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_not_blocked"]),
        ...(checks.liveGuardedOrderAdapterReviewStillBlocked
          ? []
          : ["live_guarded_order_adapter_review_not_blocked"]),
        ...missingReviewResultFields.map((field) => `missing_review_result_field_${field}`),
        ...missingReviewResultAssertions.map((assertion) => `missing_review_result_assertion_${assertion}`),
        ...missingForbiddenReviewResultContent.map((content) => `missing_forbidden_review_result_content_${content}`),
        ...(checks.architectureDocMentionsValidationResultReceiptReviewResult
          ? []
          : ["architecture_doc_missing_manual_order_permission_validation_result_receipt_review_result"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-validation-result-receipt-review-result-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-validation-result-receipt-review-result-contract.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-validation-result-receipt-review-result-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-validation-result-receipt-review-result-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-validation-result-receipt-review-result-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-validation-result-receipt-review-result-contract] readyForFutureManualOrderPermissionValidationResultReceiptReviewResult=${parsed.readiness.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult}`,
  );
}

if (require.main === module) {
  main();
}

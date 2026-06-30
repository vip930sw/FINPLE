const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
);
const RECEIPT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
);
const RECEIPT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_validator_fixtures.json",
);
const RECEIPT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-validation-result-receipt.cjs",
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
  "trading-lab-step116-manual-order-permission-validation-result-receipt-review-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission_validation_result_receipt.redacted.json",
);
const REQUIRED_REVIEW_GATES = [
  "validation_result_receipt_contract_ready",
  "validation_result_receipt_validator_ready",
  "validation_result_receipt_validator_fixtures_ready",
  "explicit_owner_validation_receipt_path_required_later",
  "no_default_receipt_read",
  "no_private_packet_path",
  "no_raw_values",
  "no_permission_import",
  "no_provider_call",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "no_live_trading",
  "requires_separate_permission_import_review",
];
const FORBIDDEN_REVIEW_CONTENT = [
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
  const receiptContract = readJson(RECEIPT_CONTRACT_PATH);
  const receiptValidatorFixtures = readJson(RECEIPT_VALIDATOR_FIXTURES_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
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
      receiptContract.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      receiptContract.readiness?.validationReceiptRecordedNow === false &&
      receiptContract.readiness?.packetPathRecorded === false &&
      receiptContract.readiness?.rawValuesRecorded === false &&
      receiptContract.readiness?.permissionPacketImportedNow === false &&
      receiptContract.readiness?.providerCallsAllowed === false &&
      receiptContract.readiness?.orderSubmissionAllowed === false,
    receiptValidatorFixturesReady:
      receiptValidatorFixtures.readiness?.readyForManualOrderPermissionValidationResultReceiptValidatorRegression === true &&
      receiptValidatorFixtures.readiness?.validationReceiptRecordedNow === false &&
      receiptValidatorFixtures.readiness?.packetPathRecorded === false &&
      receiptValidatorFixtures.readiness?.rawValuesRecorded === false &&
      receiptValidatorFixtures.readiness?.permissionPacketImportedNow === false &&
      receiptValidatorFixtures.readiness?.providerCallsAllowed === false &&
      receiptValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    receiptValidatorReady:
      receiptValidatorSource.includes("validateTradingManualOrderPermissionValidationResultReceipt") &&
      receiptValidatorSource.includes("receipt_path_required") &&
      receiptValidatorSource.includes("--receipt"),
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
    reviewGateCatalogReady: missingReviewGates.length === 0,
    forbiddenReviewContentReady: missingForbiddenReviewContent.length === 0,
    architectureDocMentionsValidationResultReceiptReviewPreflight:
      architectureDoc.includes("Trading Manual Order Permission Validation Result Receipt Review Preflight") &&
      architectureDoc.includes("manual_order_permission_validation_result_receipt_review_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptRecordedNow: false,
    validationReceiptReadAllowedNow: false,
    packetPathRecorded: false,
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
  const readyForFutureManualOrderPermissionValidationResultReceiptReview =
    checks.receiptContractReady &&
    checks.receiptValidatorFixturesReady &&
    checks.receiptValidatorReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.liveGuardedOrderAdapterReviewStillBlocked &&
    checks.reviewGateCatalogReady &&
    checks.forbiddenReviewContentReady &&
    checks.architectureDocMentionsValidationResultReceiptReviewPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4O",
    scope: "manual_order_permission_validation_result_receipt_review_preflight",
    sourceFiles: {
      validationResultReceiptContract: RECEIPT_CONTRACT_PATH,
      validationResultReceiptValidatorFixtures: RECEIPT_VALIDATOR_FIXTURES_PATH,
      validationResultReceiptValidator: RECEIPT_VALIDATOR_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      preflightOnly: true,
      validationReceiptRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      packetPathRecorded: false,
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
    futureValidationResultReceiptReviewBoundary: {
      futureValidationResultReceiptPath: FUTURE_VALIDATION_RESULT_RECEIPT_PATH,
      currentStepReadsReceipt: false,
      currentStepRecordsReceipt: false,
      currentStepImportsPermissionPacket: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      reviewGates,
      forbiddenReviewContent,
      promotionRules: [
        "future review requires an explicit owner-supplied validation result receipt path",
        "future review must validate the receipt with the local receipt validator before any import review",
        "future review cannot record the private packet path or raw packet values",
        "future review success still does not import permission evidence or enable provider calls, order adapter implementation, runtime routes, UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      receiptContractStatus: receiptContract.readiness?.status,
      receiptValidatorFixturesStatus: receiptValidatorFixtures.readiness?.status,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status,
      missingReviewGates,
      missingForbiddenReviewContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForFutureManualOrderPermissionValidationResultReceiptReview
        ? "preflight_ready_for_future_owner_validation_result_receipt_review"
        : "blocked_before_manual_order_permission_validation_result_receipt_review_preflight",
      readyForFutureManualOrderPermissionValidationResultReceiptReview,
      validationReceiptRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      packetPathRecorded: false,
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
        ...(checks.receiptContractReady ? [] : ["manual_order_permission_validation_result_receipt_contract_not_ready"]),
        ...(checks.receiptValidatorFixturesReady
          ? []
          : ["manual_order_permission_validation_result_receipt_validator_fixtures_not_ready"]),
        ...(checks.receiptValidatorReady ? [] : ["manual_order_permission_validation_result_receipt_validator_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_not_blocked"]),
        ...(checks.liveGuardedOrderAdapterReviewStillBlocked
          ? []
          : ["live_guarded_order_adapter_review_not_blocked"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingForbiddenReviewContent.map((content) => `missing_forbidden_review_content_${content}`),
        ...(checks.architectureDocMentionsValidationResultReceiptReviewPreflight
          ? []
          : ["architecture_doc_missing_manual_order_permission_validation_result_receipt_review_preflight"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-validation-result-receipt-review-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-validation-result-receipt-review-preflight.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-validation-result-receipt-review-preflight] ok");
    console.log(
      `[generate-trading-manual-order-permission-validation-result-receipt-review-preflight] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-validation-result-receipt-review-preflight] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-validation-result-receipt-review-preflight] readyForFutureManualOrderPermissionValidationResultReceiptReview=${parsed.readiness.readyForFutureManualOrderPermissionValidationResultReceiptReview}`,
  );
}

main();

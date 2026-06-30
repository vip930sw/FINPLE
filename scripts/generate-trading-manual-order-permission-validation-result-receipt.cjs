const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
);
const VALIDATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
);
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const PACKET_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
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

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-validation-result-receipt-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const REQUIRED_RECEIPT_FIELDS = [
  "validationReceiptId",
  "validationStatus",
  "validatedAt",
  "validatorVersionHash",
  "packetShapeHash",
  "errorCodeHashes",
  "redactionVersion",
  "packetPathRecorded",
  "rawValuesRecorded",
  "permissionPacketImportedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_RECEIPT_ASSERTIONS = [
  "receipt_is_redacted_only",
  "receipt_does_not_record_packet_path",
  "receipt_does_not_record_raw_values",
  "receipt_does_not_import_permission_packet",
  "receipt_does_not_enable_provider_calls",
  "receipt_does_not_enable_order_submission",
  "receipt_does_not_create_runtime_route",
  "receipt_does_not_approve_live_guarded_orders",
  "receipt_requires_separate_import_review",
];
const FORBIDDEN_RECEIPT_CONTENT = [
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
  FUTURE_PERMISSION_PACKET_PATH,
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
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
  const packetValidatorFixtures = readJson(PACKET_VALIDATOR_FIXTURES_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
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
      validationRunbook.readiness?.readyForOwnerAssistedValidationRunbookReview === true &&
      validationRunbook.readiness?.currentStepRunsValidator === false &&
      validationRunbook.readiness?.currentStepReadsPrivatePacket === false &&
      validationRunbook.readiness?.permissionPacketImportedNow === false &&
      validationRunbook.readiness?.providerCallsAllowed === false &&
      validationRunbook.readiness?.orderSubmissionAllowed === false,
    validationPreflightReady:
      validationPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      validationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      validationPreflight.readiness?.permissionPacketImportedNow === false &&
      validationPreflight.readiness?.providerCallsAllowed === false &&
      validationPreflight.readiness?.orderSubmissionAllowed === false,
    packetValidatorFixturesReady:
      packetValidatorFixtures.readiness?.readyForManualOrderPermissionPacketValidatorRegression === true &&
      packetValidatorFixtures.readiness?.permissionPacketImportedNow === false &&
      packetValidatorFixtures.readiness?.providerCallsAllowed === false &&
      packetValidatorFixtures.readiness?.orderSubmissionAllowed === false,
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
    receiptFieldsReady: missingReceiptFields.length === 0,
    receiptAssertionsReady: missingReceiptAssertions.length === 0,
    forbiddenReceiptContentReady: missingForbiddenReceiptContent.length === 0,
    architectureDocMentionsValidationResultReceipt:
      architectureDoc.includes("Trading Manual Order Permission Validation Result Receipt") &&
      architectureDoc.includes("manual_order_permission_validation_result_receipt"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptRecordedNow: false,
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
    checks.validationRunbookReady &&
    checks.validationPreflightReady &&
    checks.packetValidatorFixturesReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.liveGuardedOrderAdapterReviewStillBlocked &&
    checks.receiptFieldsReady &&
    checks.receiptAssertionsReady &&
    checks.forbiddenReceiptContentReady &&
    checks.architectureDocMentionsValidationResultReceipt &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4L",
    scope: "manual_order_permission_validation_result_receipt",
    sourceFiles: {
      validationRunbook: VALIDATION_RUNBOOK_PATH,
      validationPreflight: VALIDATION_PREFLIGHT_PATH,
      manualOrderPermissionPacketValidatorFixtures: PACKET_VALIDATOR_FIXTURES_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      receiptContractOnly: true,
      validationReceiptRecordedNow: false,
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
    futureValidationResultReceiptBoundary: {
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
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
        packetShapeHash: "hmac-sha256:<packet_shape_hash>",
        errorCodeHashes: ["hmac-sha256:<error_code_hash>"],
        redactionVersion: "v1",
        packetPathRecorded: false,
        rawValuesRecorded: false,
        permissionPacketImportedNow: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
      },
      promotionRules: [
        "validation result receipt can be reviewed later only after owner-assisted local validation",
        "receipt review cannot record the private packet path or raw packet values",
        "receipt success still does not import the permission packet",
        "receipt success still does not enable provider calls, order adapter implementation, runtime routes, UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      validationRunbookStatus: validationRunbook.readiness?.status,
      validationPreflightStatus: validationPreflight.readiness?.status,
      packetValidatorFixturesStatus: packetValidatorFixtures.readiness?.status,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status,
      missingReceiptFields,
      missingReceiptAssertions,
      missingForbiddenReceiptContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForFutureManualOrderPermissionValidationResultReceiptReview
        ? "receipt_contract_ready_pending_owner_validation_result_review"
        : "blocked_before_manual_order_permission_validation_result_receipt_review",
      readyForFutureManualOrderPermissionValidationResultReceiptReview,
      validationReceiptRecordedNow: false,
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
        ...(checks.validationRunbookReady ? [] : ["manual_order_permission_packet_validation_runbook_not_ready"]),
        ...(checks.validationPreflightReady ? [] : ["manual_order_permission_packet_validation_preflight_not_ready"]),
        ...(checks.packetValidatorFixturesReady ? [] : ["manual_order_permission_packet_validator_fixtures_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_not_blocked"]),
        ...(checks.liveGuardedOrderAdapterReviewStillBlocked
          ? []
          : ["live_guarded_order_adapter_review_not_blocked"]),
        ...missingReceiptFields.map((field) => `missing_receipt_field_${field}`),
        ...missingReceiptAssertions.map((assertion) => `missing_receipt_assertion_${assertion}`),
        ...missingForbiddenReceiptContent.map((content) => `missing_forbidden_receipt_content_${content}`),
        ...(checks.architectureDocMentionsValidationResultReceipt
          ? []
          : ["architecture_doc_missing_manual_order_permission_validation_result_receipt"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-validation-result-receipt.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-validation-result-receipt.cjs`);
    }
    console.log("[generate-trading-manual-order-permission-validation-result-receipt] ok");
    console.log(`[generate-trading-manual-order-permission-validation-result-receipt] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-validation-result-receipt] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-validation-result-receipt] readyForFutureManualOrderPermissionValidationResultReceiptReview=${parsed.readiness.readyForFutureManualOrderPermissionValidationResultReceiptReview}`,
  );
}

main();

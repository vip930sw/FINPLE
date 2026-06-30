const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt.json",
);
const RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json",
);
const RESPONSE_ENVELOPE_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json",
);
const RESPONSE_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const PRIVATE_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-response-envelope.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-response-envelope-validation-result-receipt-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_RESPONSE_ENVELOPE_RECEIPT_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_provider_response_envelope_validation_result_receipt.redacted.json",
);
const REQUIRED_RECEIPT_FIELDS = [
  "responseValidationReceiptId",
  "validationStatus",
  "validatedAt",
  "validatorVersionHash",
  "responseEnvelopeShapeHash",
  "errorCodeHashes",
  "redactionVersion",
  "envelopePathRecorded",
  "rawResponseRecorded",
  "providerPayloadRecorded",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_RECEIPT_ASSERTIONS = [
  "receipt_is_redacted_only",
  "receipt_does_not_record_response_envelope_path",
  "receipt_does_not_record_raw_response_payload",
  "receipt_does_not_record_provider_payload",
  "receipt_does_not_enable_provider_calls",
  "receipt_does_not_enable_order_submission",
  "receipt_does_not_create_runtime_route",
  "receipt_requires_separate_provider_authorization_review",
];
const FORBIDDEN_RECEIPT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_response_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_RESPONSE_ENVELOPE_RECEIPT_PATH,
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
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
  const validationPreflight = readJson(RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT_PATH);
  const validatorFixtures = readJson(RESPONSE_ENVELOPE_VALIDATOR_FIXTURES_PATH);
  const responseEnvelopeContract = readJson(RESPONSE_ENVELOPE_CONTRACT_PATH);
  const callAuthorizationPreflight = readJson(CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const privateProviderPreflight = readJson(PRIVATE_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
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
    validationPreflightReady:
      validationPreflight.readiness?.readyForPureLocalResponseEnvelopeValidatorImplementationReview === true &&
      validationPreflight.readiness?.responsePayloadReceivedNow === false &&
      validationPreflight.readiness?.providerCallsAllowed === false &&
      validationPreflight.readiness?.orderSubmissionAllowed === false,
    validatorFixturesReady:
      validatorFixtures.readiness?.readyForResponseEnvelopeFixtureRegression === true &&
      validatorFixtures.readiness?.responsePayloadReceivedNow === false &&
      validatorFixtures.readiness?.providerCallsAllowed === false &&
      validatorFixtures.readiness?.orderSubmissionAllowed === false,
    responseEnvelopeContractReady:
      responseEnvelopeContract.readiness?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      responseEnvelopeContract.readiness?.providerCallsAllowed === false &&
      responseEnvelopeContract.readiness?.orderSubmissionAllowed === false,
    callAuthorizationStillBlocked:
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false &&
      callAuthorizationPreflight.readiness?.orderSubmissionAllowed === false,
    privateProviderImplementationStillBlocked:
      privateProviderPreflight.readiness?.readyForFuturePrivateReadOnlyProviderImplementationReview === false &&
      privateProviderPreflight.readiness?.providerCallsAllowed === false &&
      privateProviderPreflight.readiness?.orderSubmissionAllowed === false,
    validatorIsExplicitLocalOnly:
      validatorSource.includes("validateReadOnlyProviderResponseEnvelope") &&
      validatorSource.includes("envelope_path_required") &&
      validatorSource.includes("--envelope"),
    receiptFieldsReady: missingReceiptFields.length === 0,
    receiptAssertionsReady: missingReceiptAssertions.length === 0,
    forbiddenReceiptContentReady: missingForbiddenReceiptContent.length === 0,
    architectureDocMentionsResponseValidationResultReceipt:
      architectureDoc.includes("Trading Read-Only Provider Response Envelope Validation Result Receipt") &&
      architectureDoc.includes("read_only_provider_response_envelope_validation_result_receipt"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptRecordedNow: false,
    responseEnvelopePathRecorded: false,
    rawResponseRecorded: false,
    providerPayloadRecorded: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureResponseEnvelopeValidationResultReceiptReview =
    checks.validationPreflightReady &&
    checks.validatorFixturesReady &&
    checks.responseEnvelopeContractReady &&
    checks.callAuthorizationStillBlocked &&
    checks.privateProviderImplementationStillBlocked &&
    checks.validatorIsExplicitLocalOnly &&
    checks.receiptFieldsReady &&
    checks.receiptAssertionsReady &&
    checks.forbiddenReceiptContentReady &&
    checks.architectureDocMentionsResponseValidationResultReceipt &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3L-A",
    scope: "read_only_provider_response_envelope_validation_result_receipt",
    sourceFiles: {
      responseEnvelopeValidationPreflight: RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT_PATH,
      responseEnvelopeValidatorFixtures: RESPONSE_ENVELOPE_VALIDATOR_FIXTURES_PATH,
      responseEnvelopeContract: RESPONSE_ENVELOPE_CONTRACT_PATH,
      callAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      receiptContractOnly: true,
      validationReceiptRecordedNow: false,
      responseEnvelopePathRecorded: false,
      rawResponseRecorded: false,
      providerPayloadRecorded: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureValidationResultReceiptBoundary: {
      futureReceiptPath: FUTURE_RESPONSE_ENVELOPE_RECEIPT_PATH,
      currentStepRecordsReceipt: false,
      currentStepReadsResponseEnvelope: false,
      currentStepCallsProvider: false,
      requiredReceiptFields: receiptFields,
      requiredReceiptAssertions: receiptAssertions,
      forbiddenReceiptContent,
      sampleRedactedShape: {
        responseValidationReceiptId: "response_validation_receipt_<opaque_id>",
        validationStatus: "valid_or_invalid",
        validatedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        validatorVersionHash: "sha256:<validator_version_hash>",
        responseEnvelopeShapeHash: "hmac-sha256:<response_envelope_shape_hash>",
        errorCodeHashes: ["hmac-sha256:<error_code_hash>"],
        redactionVersion: "v1",
        envelopePathRecorded: false,
        rawResponseRecorded: false,
        providerPayloadRecorded: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
      },
      promotionRules: [
        "response validation result receipt can be reviewed later only after explicit local response-envelope validation",
        "receipt review cannot record the local envelope path, raw response payload, or provider payload",
        "receipt success still does not authorize provider calls",
        "receipt success still does not enable runtime routes, public UI, DB writes, orders, or live trading",
      ],
    },
    checks,
    evidence: {
      validationPreflightStatus: validationPreflight.readiness?.status,
      validatorFixturesStatus: validatorFixtures.readiness?.status,
      responseEnvelopeContractStatus: responseEnvelopeContract.readiness?.status,
      callAuthorizationPreflightStatus: callAuthorizationPreflight.readiness?.status,
      privateProviderImplementationPreflightStatus: privateProviderPreflight.readiness?.status,
      missingReceiptFields,
      missingReceiptAssertions,
      missingForbiddenReceiptContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForFutureResponseEnvelopeValidationResultReceiptReview
        ? "receipt_contract_ready_pending_read_only_provider_response_validation_result_review"
        : "blocked_before_read_only_provider_response_validation_result_receipt_review",
      readyForFutureResponseEnvelopeValidationResultReceiptReview,
      validationReceiptRecordedNow: false,
      responseEnvelopePathRecorded: false,
      rawResponseRecorded: false,
      providerPayloadRecorded: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.validationPreflightReady ? [] : ["response_envelope_validation_preflight_not_ready"]),
        ...(checks.validatorFixturesReady ? [] : ["response_envelope_validator_fixtures_not_ready"]),
        ...(checks.responseEnvelopeContractReady ? [] : ["response_envelope_contract_not_ready"]),
        ...(checks.callAuthorizationStillBlocked ? [] : ["provider_call_authorization_not_blocked"]),
        ...(checks.privateProviderImplementationStillBlocked ? [] : ["private_provider_implementation_not_blocked"]),
        ...(checks.validatorIsExplicitLocalOnly ? [] : ["response_envelope_validator_not_explicit_local_only"]),
        ...missingReceiptFields.map((field) => `missing_receipt_field_${field}`),
        ...missingReceiptAssertions.map((assertion) => `missing_receipt_assertion_${assertion}`),
        ...missingForbiddenReceiptContent.map((content) => `missing_forbidden_receipt_content_${content}`),
        ...(checks.architectureDocMentionsResponseValidationResultReceipt
          ? []
          : ["architecture_doc_missing_response_envelope_validation_result_receipt"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-response-envelope-validation-result-receipt.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-response-envelope-validation-result-receipt.cjs`);
    }
    console.log("[generate-trading-read-only-provider-response-envelope-validation-result-receipt] ok");
    console.log(`[generate-trading-read-only-provider-response-envelope-validation-result-receipt] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-response-envelope-validation-result-receipt] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-response-envelope-validation-result-receipt] readyForFutureResponseEnvelopeValidationResultReceiptReview=${parsed.readiness.readyForFutureResponseEnvelopeValidationResultReceiptReview}`,
  );
}

main();

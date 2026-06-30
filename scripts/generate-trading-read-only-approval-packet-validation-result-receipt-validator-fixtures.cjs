const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingReadOnlyApprovalPacketValidationResultReceipt,
} = require("./validate-trading-read-only-approval-packet-validation-result-receipt.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_validator_fixtures.json",
);
const RECEIPT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-read-only-approval-packet-validation-result-receipt-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_required_field",
  "unknown_field",
  "invalid_validation_receipt_id",
  "invalid_validation_status",
  "malformed_timestamp",
  "malformed_hash_field",
  "malformed_error_code_hash",
  "invalid_redaction_version",
  "packet_path_recorded_flag_enabled",
  "raw_values_recorded_flag_enabled",
  "approval_packet_imported_flag_enabled",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "public_ui_flag_enabled",
  "forbidden_secret_value",
  "forbidden_private_path_marker",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval_validation_result_receipt.redacted.json"),
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function omitField(receipt, field) {
  const next = clone(receipt);
  delete next[field];
  return next;
}

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function validSyntheticReceipt() {
  return {
    validationReceiptId: "validation_receipt_fixture_001",
    validationStatus: "valid",
    validatedAt: "2026-06-29T00:00:00.000Z",
    validatorVersionHash: "sha256:fixture_validator_version_hash_123456",
    approvalPacketShapeHash: "hmac-sha256:fixture_approval_packet_shape_hash_123456",
    errorCodeHashes: [],
    redactionVersion: "v1",
    packetPathRecorded: false,
    rawValuesRecorded: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
}

function invalidSyntheticFixtures(baseReceipt) {
  return [
    {
      id: "missing_required_field",
      expectedErrorCodes: ["missing_required_field"],
      receipt: omitField(baseReceipt, "approvalPacketShapeHash"),
    },
    { id: "unknown_field", expectedErrorCodes: ["unknown_field"], receipt: { ...baseReceipt, unexpected: "redacted_fixture_value" } },
    {
      id: "invalid_validation_receipt_id",
      expectedErrorCodes: ["invalid_validation_receipt_id"],
      receipt: { ...baseReceipt, validationReceiptId: "receipt_fixture" },
    },
    { id: "invalid_validation_status", expectedErrorCodes: ["invalid_validation_status"], receipt: { ...baseReceipt, validationStatus: "approved" } },
    { id: "malformed_timestamp", expectedErrorCodes: ["malformed_timestamp"], receipt: { ...baseReceipt, validatedAt: "2026-06-29" } },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      receipt: { ...baseReceipt, approvalPacketShapeHash: "not-a-labelled-hash" },
    },
    {
      id: "malformed_error_code_hash",
      expectedErrorCodes: ["malformed_error_code_hash"],
      receipt: { ...baseReceipt, errorCodeHashes: ["not-a-labelled-hash"] },
    },
    { id: "invalid_redaction_version", expectedErrorCodes: ["invalid_redaction_version"], receipt: { ...baseReceipt, redactionVersion: "v2" } },
    { id: "packet_path_recorded_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], receipt: { ...baseReceipt, packetPathRecorded: true } },
    { id: "raw_values_recorded_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], receipt: { ...baseReceipt, rawValuesRecorded: true } },
    {
      id: "approval_packet_imported_flag_enabled",
      expectedErrorCodes: ["forbidden_flag_enabled"],
      receipt: { ...baseReceipt, approvalPacketImportedNow: true },
    },
    { id: "provider_call_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], receipt: { ...baseReceipt, providerCallsAllowed: true } },
    { id: "order_submission_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], receipt: { ...baseReceipt, orderSubmissionAllowed: true } },
    { id: "runtime_route_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], receipt: { ...baseReceipt, runtimeRouteAllowed: true } },
    { id: "public_ui_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], receipt: { ...baseReceipt, publicUiAllowed: true } },
    {
      id: "forbidden_secret_value",
      expectedErrorCodes: ["forbidden_string_value"],
      receipt: { ...baseReceipt, errorCodeHashes: ["hmac-sha256:app-secret-fixture-value"] },
    },
    {
      id: "forbidden_private_path_marker",
      expectedErrorCodes: ["forbidden_string_value"],
      receipt: { ...baseReceipt, validatorVersionHash: "sha256:read_only_approval.redacted.json_marker" },
    },
  ];
}

function fixtureValidationEvidence(validReceipt, invalidFixtures) {
  const validResult = validateTradingReadOnlyApprovalPacketValidationResultReceipt(validReceipt);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingReadOnlyApprovalPacketValidationResultReceipt(fixture.receipt);
    const actualErrorCodes = [...new Set(result.errors.map((error) => error.code))].sort();
    const missingExpectedErrorCodes = fixture.expectedErrorCodes.filter((code) => !actualErrorCodes.includes(code));
    return {
      id: fixture.id,
      valid: result.valid,
      expectedErrorCodes: fixture.expectedErrorCodes,
      actualErrorCodes,
      missingExpectedErrorCodes,
      passed: result.valid === false && missingExpectedErrorCodes.length === 0,
    };
  });
  return {
    validFixturePasses: validResult.valid === true,
    validFixtureErrorCodes: validResult.errors.map((error) => error.code),
    invalidFixturesFailWithExpectedCodes: invalidResults.every((result) => result.passed),
    invalidResults,
  };
}

function buildContract() {
  const receiptContract = readJson(RECEIPT_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidReceipt = validSyntheticReceipt();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidReceipt);
  const validationEvidence = fixtureValidationEvidence(syntheticValidReceipt, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    fixturesOnly: true,
    receiptContractReady:
      receiptContract.readiness?.readyForFutureReadOnlyApprovalPacketValidationResultReceiptReview === true &&
      receiptContract.readiness?.packetPathRecorded === false &&
      receiptContract.readiness?.rawValuesRecorded === false &&
      receiptContract.readiness?.approvalPacketImportedNow === false &&
      receiptContract.readiness?.providerCallsAllowed === false &&
      receiptContract.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingReadOnlyApprovalPacketValidationResultReceipt") &&
      validatorSource.includes("receipt_path_required") &&
      validatorSource.includes("--receipt"),
    architectureDocMentionsReceiptValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt Validator Fixtures") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationReceiptRecordedNow: false,
    packetPathRecorded: false,
    rawValuesRecorded: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForReadOnlyApprovalPacketValidationResultReceiptValidatorRegression =
    checks.receiptContractReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsReceiptValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.invalidFixtureCatalogReady &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5L",
    scope: "read_only_approval_packet_validation_result_receipt_validator_fixtures",
    sourceFiles: {
      validationResultReceiptContract: RECEIPT_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      validationReceiptRecordedNow: false,
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
    validation: {
      redactionBoundary:
        "synthetic read-only approval validation-result receipt fixtures only; no real receipt, private approval packet path, raw account, operator, evidence, revocation plan, credential, provider payload, order payload, token, app key, app secret, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticValidationResultReceipt: syntheticValidReceipt,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      receiptContractStatus: receiptContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForReadOnlyApprovalPacketValidationResultReceiptValidatorRegression
        ? "fixtures_ready_for_read_only_approval_packet_validation_result_receipt_validator_regression"
        : "blocked_before_read_only_approval_packet_validation_result_receipt_validator_fixture_regression",
      readyForReadOnlyApprovalPacketValidationResultReceiptValidatorRegression,
      fixturesOnly: true,
      validationReceiptRecordedNow: false,
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
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsReceiptValidatorFixtures
          ? []
          : ["architecture_doc_missing_read_only_approval_validation_result_receipt_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingInvalidFixtureIds.map((id) => `missing_invalid_fixture_${id}`),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-validator-fixtures] ok");
    console.log(
      `[generate-trading-read-only-approval-packet-validation-result-receipt-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt-validator-fixtures] readyForReadOnlyApprovalPacketValidationResultReceiptValidatorRegression=${parsed.readiness.readyForReadOnlyApprovalPacketValidationResultReceiptValidatorRegression}`,
  );
}

main();

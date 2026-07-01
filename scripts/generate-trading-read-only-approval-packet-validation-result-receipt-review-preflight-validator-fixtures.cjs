const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight,
} = require("./validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight_validator_fixtures.json",
);
const PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_required_field",
  "missing_review_gate",
  "boundary_action_enabled",
  "missing_forbidden_review_content",
  "invalid_future_validation_result_receipt_path",
  "invalid_future_approval_packet_path",
  "allow_flag_enabled",
  "forbidden_raw_value",
  "field_must_be_array",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval_validation_result_receipt.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function invalidSyntheticFixtures(basePreflight) {
  const missingRequired = clone(basePreflight);
  delete missingRequired.outputFiles;

  const missingReviewGate = clone(basePreflight);
  missingReviewGate.futureValidationResultReceiptReviewBoundary.reviewGates =
    missingReviewGate.futureValidationResultReceiptReviewBoundary.reviewGates.filter(
      (gate) => gate !== "requires_separate_provider_call_authorization_review",
    );

  const boundaryActionEnabled = clone(basePreflight);
  boundaryActionEnabled.futureValidationResultReceiptReviewBoundary.currentStepReadsReceipt = true;
  boundaryActionEnabled.futureValidationResultReceiptReviewBoundary.currentStepReadsApprovalPacket = true;
  boundaryActionEnabled.futureValidationResultReceiptReviewBoundary.currentStepImportsApprovalPacket = true;
  boundaryActionEnabled.futureValidationResultReceiptReviewBoundary.currentStepCallsProvider = true;
  boundaryActionEnabled.futureValidationResultReceiptReviewBoundary.currentStepSubmitsOrder = true;

  const missingForbiddenReviewContent = clone(basePreflight);
  missingForbiddenReviewContent.futureValidationResultReceiptReviewBoundary.forbiddenReviewContent =
    missingForbiddenReviewContent.futureValidationResultReceiptReviewBoundary.forbiddenReviewContent.filter(
      (content) => content !== "raw_revocation_plan",
    );

  const invalidFutureReceiptPath = clone(basePreflight);
  invalidFutureReceiptPath.futureValidationResultReceiptReviewBoundary.futureValidationResultReceiptPath =
    "data/private/trading/live_order_receipt.json";

  const invalidFutureApprovalPacketPath = clone(basePreflight);
  invalidFutureApprovalPacketPath.futureValidationResultReceiptReviewBoundary.futureApprovalPacketPath =
    "data/private/trading/live_order_permission.json";

  const allowFlagEnabled = clone(basePreflight);
  allowFlagEnabled.currentState.validationReceiptReadAllowedNow = true;
  allowFlagEnabled.currentState.rawValuesRecorded = true;
  allowFlagEnabled.readiness.approvalPacketImportedNow = true;
  allowFlagEnabled.readiness.orderSubmissionAllowed = true;
  allowFlagEnabled.checks.runtimeRouteAllowed = true;

  const forbiddenRawValue = clone(basePreflight);
  forbiddenRawValue.evidence.syntheticLeakMarker = "app-secret-fixture-value";

  const fieldMustBeArray = clone(basePreflight);
  fieldMustBeArray.futureValidationResultReceiptReviewBoundary.reviewGates = "not-an-array";

  return [
    { id: "missing_required_field", expectedErrorCodes: ["missing_required_field"], contract: missingRequired },
    { id: "missing_review_gate", expectedErrorCodes: ["missing_review_gate"], contract: missingReviewGate },
    { id: "boundary_action_enabled", expectedErrorCodes: ["boundary_action_enabled"], contract: boundaryActionEnabled },
    {
      id: "missing_forbidden_review_content",
      expectedErrorCodes: ["missing_forbidden_review_content"],
      contract: missingForbiddenReviewContent,
    },
    {
      id: "invalid_future_validation_result_receipt_path",
      expectedErrorCodes: ["invalid_future_validation_result_receipt_path"],
      contract: invalidFutureReceiptPath,
    },
    {
      id: "invalid_future_approval_packet_path",
      expectedErrorCodes: ["invalid_future_approval_packet_path"],
      contract: invalidFutureApprovalPacketPath,
    },
    { id: "allow_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], contract: allowFlagEnabled },
    { id: "forbidden_raw_value", expectedErrorCodes: ["forbidden_raw_value"], contract: forbiddenRawValue },
    { id: "field_must_be_array", expectedErrorCodes: ["field_must_be_array"], contract: fieldMustBeArray },
  ];
}

function fixtureValidationEvidence(validPreflight, invalidFixtures) {
  const validResult = validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight(validPreflight);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight(fixture.contract);
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
  const preflight = readJson(PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidPreflight = clone(preflight);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidPreflight);
  const validationEvidence = fixtureValidationEvidence(syntheticValidPreflight, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    fixturesOnly: true,
    reviewPreflightReady:
      preflight.readiness?.readyForFutureOwnerReadOnlyApprovalValidationResultReceiptReviewPreflight === true &&
      preflight.readiness?.validationReceiptRecordedNow === false &&
      preflight.readiness?.validationReceiptReadAllowedNow === false &&
      preflight.readiness?.packetPathRecorded === false &&
      preflight.readiness?.rawValuesRecorded === false &&
      preflight.readiness?.approvalPacketImportedNow === false &&
      preflight.readiness?.providerCallsAllowed === false &&
      preflight.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewPreflight") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsReviewPreflightValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt Review Preflight Validator Fixtures") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt_review_preflight_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
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
    liveTradingAllowed: false,
  };
  const readyForReadOnlyApprovalValidationResultReceiptReviewPreflightValidatorRegression =
    checks.reviewPreflightReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsReviewPreflightValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.invalidFixtureCatalogReady &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5O",
    scope: "read_only_approval_packet_validation_result_receipt_review_preflight_validator_fixtures",
    sourceFiles: {
      validationResultReceiptReviewPreflight: PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
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
    validation: {
      redactionBoundary:
        "synthetic read-only approval review-preflight validator fixtures only; no real validation receipt, private approval packet path, raw account, operator, evidence, revocation plan, credential, provider payload, order payload, token, app key, app secret, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticValidationResultReceiptReviewPreflight: syntheticValidPreflight,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      reviewPreflightStatus: preflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForReadOnlyApprovalValidationResultReceiptReviewPreflightValidatorRegression
        ? "fixtures_ready_for_read_only_approval_validation_result_receipt_review_preflight_validator_regression"
        : "blocked_before_read_only_approval_validation_result_receipt_review_preflight_validator_fixture_regression",
      readyForReadOnlyApprovalValidationResultReceiptReviewPreflightValidatorRegression,
      fixturesOnly: true,
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
        ...(checks.reviewPreflightReady ? [] : ["read_only_approval_validation_result_receipt_review_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsReviewPreflightValidatorFixtures
          ? []
          : ["architecture_doc_missing_read_only_approval_validation_result_receipt_review_preflight_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures] ok");
    console.log(
      `[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures] readyForReadOnlyApprovalValidationResultReceiptReviewPreflightValidatorRegression=${parsed.readiness.readyForReadOnlyApprovalValidationResultReceiptReviewPreflightValidatorRegression}`,
  );
}

main();

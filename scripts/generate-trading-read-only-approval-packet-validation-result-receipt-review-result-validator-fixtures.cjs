const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewResultContract,
} = require("./validate-trading-read-only-approval-packet-validation-result-receipt-review-result-contract.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures.json",
);
const REVIEW_RESULT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_contract.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-result-contract.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "receipt_read_enabled",
  "review_result_record_enabled",
  "provider_call_action_enabled",
  "missing_review_result_field",
  "missing_review_result_assertion",
  "missing_forbidden_review_result_content",
  "changed_future_receipt_path",
  "approval_payload_flag_enabled",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "numeric_raw_value_shape_injected",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  ["5019", "5326"].join(""),
  ["6440", "8140"].join(""),
  ["KIS", "TRADING", "APP", "KEY"].join("_"),
  ["KIS", "TRADING", "APP", "SECRET"].join("_"),
  ["APP", "Secret"].join(" "),
  ["APP", "Key"].join(" "),
  "access_token_value",
  "raw_account_identifier_value",
  "raw_operator_name_value",
  "raw_evidence_text_value",
  "raw_revocation_plan_value",
  "raw_approval_payload_value",
  "raw_order_payload_value",
  "order_confirmation_value",
  "execution_id_value",
  "fill_payload_value",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval_validation_result_receipt.redacted.json"),
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function omitField(value, field) {
  const next = clone(value);
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

function fixtureContainsForbiddenContent(fixture) {
  const serialized = JSON.stringify(fixture);
  return FORBIDDEN_FIXTURE_CONTENT.filter((token) => serialized.includes(token));
}

function invalidSyntheticFixtures(baseContract) {
  return [
    {
      id: "missing_output_files",
      expectedErrorCodes: ["missing_required_field"],
      contract: omitField(baseContract, "outputFiles"),
    },
    {
      id: "receipt_read_enabled",
      expectedErrorCodes: ["review_result_action_enabled"],
      contract: {
        ...baseContract,
        futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary: {
          ...baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary,
          currentStepReadsReceipt: true,
        },
      },
    },
    {
      id: "review_result_record_enabled",
      expectedErrorCodes: ["review_result_action_enabled"],
      contract: {
        ...baseContract,
        futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary: {
          ...baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary,
          currentStepRecordsReviewResult: true,
        },
      },
    },
    {
      id: "provider_call_action_enabled",
      expectedErrorCodes: ["review_result_action_enabled"],
      contract: {
        ...baseContract,
        futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary: {
          ...baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary,
          currentStepCallsProvider: true,
        },
      },
    },
    {
      id: "missing_review_result_field",
      expectedErrorCodes: ["missing_review_result_field"],
      contract: {
        ...baseContract,
        futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary: {
          ...baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary,
          requiredReviewResultFields:
            baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary.requiredReviewResultFields.filter(
              (field) => field !== "receiptShapeHash",
            ),
        },
      },
    },
    {
      id: "missing_review_result_assertion",
      expectedErrorCodes: ["missing_review_result_assertion"],
      contract: {
        ...baseContract,
        futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary: {
          ...baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary,
          requiredReviewResultAssertions:
            baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary.requiredReviewResultAssertions.filter(
              (assertion) => assertion !== "review_result_requires_separate_provider_call_authorization_review",
            ),
        },
      },
    },
    {
      id: "missing_forbidden_review_result_content",
      expectedErrorCodes: ["missing_forbidden_review_result_content"],
      contract: {
        ...baseContract,
        futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary: {
          ...baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary,
          forbiddenReviewResultContent:
            baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary.forbiddenReviewResultContent.filter(
              (content) => content !== "live_order_endpoint",
            ),
        },
      },
    },
    {
      id: "changed_future_receipt_path",
      expectedErrorCodes: ["invalid_future_validation_result_receipt_path"],
      contract: {
        ...baseContract,
        futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary: {
          ...baseContract.futureReadOnlyApprovalValidationResultReceiptReviewResultBoundary,
          futureValidationResultReceiptPath: "data/private/trading/live_order_receipt.json",
        },
      },
    },
    {
      id: "approval_payload_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, approvalPayloadRecorded: true },
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, providerCallsAllowed: true },
      },
    },
    {
      id: "order_submission_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        readiness: { ...baseContract.readiness, orderSubmissionAllowed: true },
      },
    },
    {
      id: "runtime_route_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        checks: { ...baseContract.checks, runtimeRouteAllowed: true },
      },
    },
    {
      id: "numeric_raw_value_shape_injected",
      expectedErrorCodes: ["forbidden_raw_value"],
      contract: {
        ...baseContract,
        evidence: {
          ...baseContract.evidence,
          syntheticNumericRawValueShape: "12345678",
        },
      },
    },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewResultContract(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewResultContract(fixture.contract);
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
  const reviewResultContract = readJson(REVIEW_RESULT_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidReviewResultContract = clone(reviewResultContract);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidReviewResultContract);
  const validationEvidence = fixtureValidationEvidence(syntheticValidReviewResultContract, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidReviewResultContract),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    reviewResultContractReady:
      reviewResultContract.readiness?.readyForFutureReadOnlyApprovalValidationResultReceiptReviewResult === true &&
      reviewResultContract.readiness?.validationReceiptReviewRecordedNow === false &&
      reviewResultContract.readiness?.validationReceiptReadAllowedNow === false &&
      reviewResultContract.readiness?.approvalPayloadRecorded === false &&
      reviewResultContract.readiness?.providerCallsAllowed === false &&
      reviewResultContract.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewResultContract") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt Review Result Validator Fixtures") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepReadsReceipt: false,
    currentStepRecordsReviewResult: false,
    currentStepCallsProvider: false,
    validationReceiptReviewRecordedNow: false,
    validationReceiptReadAllowedNow: false,
    receiptPathRecorded: false,
    rawValuesRecorded: false,
    approvalPayloadRecorded: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForReadOnlyApprovalReviewResultValidatorFixtureRegression =
    checks.reviewResultContractReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3L-L",
    scope: "read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures",
    sourceFiles: {
      validationResultReceiptReviewResultContract: REVIEW_RESULT_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      currentStepReadsReceipt: false,
      currentStepRecordsReviewResult: false,
      currentStepCallsProvider: false,
      validationReceiptReviewRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      receiptPathRecorded: false,
      rawValuesRecorded: false,
      approvalPayloadRecorded: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic approval validation receipt review-result validator fixtures only; no real validation receipt, private approval packet path, account, operator, credential, approval payload, order payload, token, app key, app secret, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticReviewResultContract: syntheticValidReviewResultContract,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      reviewResultContractStatus: reviewResultContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenFixtureContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForReadOnlyApprovalReviewResultValidatorFixtureRegression
        ? "fixtures_ready_for_read_only_approval_validation_result_receipt_review_result_validator_regression"
        : "blocked_before_read_only_approval_validation_result_receipt_review_result_validator_fixture_regression",
      readyForReadOnlyApprovalReviewResultValidatorFixtureRegression,
      fixturesOnly: true,
      currentStepReadsReceipt: false,
      currentStepRecordsReviewResult: false,
      currentStepCallsProvider: false,
      validationReceiptReviewRecordedNow: false,
      validationReceiptReadAllowedNow: false,
      receiptPathRecorded: false,
      rawValuesRecorded: false,
      approvalPayloadRecorded: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.reviewResultContractReady
          ? []
          : ["read_only_approval_validation_result_receipt_review_result_contract_not_ready"]),
        ...(checks.validatorExportsLocalValidation
          ? []
          : ["read_only_approval_validation_result_receipt_review_result_validator_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_fixtures_do_not_fail_with_expected_codes"]),
        ...missingInvalidFixtureIds.map((id) => `missing_invalid_fixture_${id}`),
        ...forbiddenFixtureContent.map((content) => `forbidden_fixture_content_${content}`),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures.cjs`,
      );
    }
    console.log(
      "[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures] ok",
    );
    console.log(
      `[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log(
    "[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures] wrote contract",
  );
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures] readyForReadOnlyApprovalReviewResultValidatorFixtureRegression=${parsed.readiness.readyForReadOnlyApprovalReviewResultValidatorFixtureRegression}`,
  );
}

if (require.main === module) {
  main();
}

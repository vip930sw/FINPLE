const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewRunbookContract,
} = require("./validate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures.json",
);
const RUNBOOK_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_contract.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures-v0.1";
const AUDITED_AT = "2026-07-02T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "validator_run_enabled",
  "receipt_read_enabled",
  "receipt_record_enabled",
  "approval_import_enabled",
  "missing_review_assertion",
  "missing_redacted_review_output_field",
  "missing_forbidden_review_output_content",
  "changed_future_receipt_path",
  "changed_validator_command",
  "changed_review_preflight_command",
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
  "raw_approval_payload_value",
  "raw_order_payload_value",
  "order_confirmation_value",
  "execution_id_value",
  "fill_payload_value",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval_validation_result_receipt.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
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

function withRunbook(baseContract, patch) {
  return {
    ...baseContract,
    futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook: {
      ...baseContract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook,
      ...patch,
    },
  };
}

function invalidSyntheticFixtures(baseContract) {
  const runbook = baseContract.futureOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbook;
  return [
    { id: "missing_output_files", expectedErrorCodes: ["missing_required_field"], contract: omitField(baseContract, "outputFiles") },
    { id: "validator_run_enabled", expectedErrorCodes: ["runbook_action_enabled"], contract: withRunbook(baseContract, { currentStepRunsValidator: true }) },
    { id: "receipt_read_enabled", expectedErrorCodes: ["runbook_action_enabled"], contract: withRunbook(baseContract, { currentStepReadsReceipt: true }) },
    { id: "receipt_record_enabled", expectedErrorCodes: ["runbook_action_enabled"], contract: withRunbook(baseContract, { currentStepRecordsReceipt: true }) },
    { id: "approval_import_enabled", expectedErrorCodes: ["allow_flag_enabled"], contract: { ...baseContract, currentState: { ...baseContract.currentState, approvalPacketImportedNow: true } } },
    {
      id: "missing_review_assertion",
      expectedErrorCodes: ["missing_review_assertion"],
      contract: withRunbook(baseContract, {
        requiredReviewAssertions: runbook.requiredReviewAssertions.filter(
          (assertion) => assertion !== "review_requires_separate_provider_call_authorization_review",
        ),
      }),
    },
    {
      id: "missing_redacted_review_output_field",
      expectedErrorCodes: ["missing_redacted_review_output_field"],
      contract: withRunbook(baseContract, {
        redactedReviewOutputFields: runbook.redactedReviewOutputFields.filter((field) => field !== "receiptShapeHash"),
      }),
    },
    {
      id: "missing_forbidden_review_output_content",
      expectedErrorCodes: ["missing_forbidden_review_output_content"],
      contract: withRunbook(baseContract, {
        forbiddenReviewOutputContent: runbook.forbiddenReviewOutputContent.filter(
          (content) => content !== "live_order_endpoint",
        ),
      }),
    },
    {
      id: "changed_future_receipt_path",
      expectedErrorCodes: ["invalid_future_validation_result_receipt_path"],
      contract: withRunbook(baseContract, { futureValidationResultReceiptPath: "data/private/trading/live_order_receipt.json" }),
    },
    {
      id: "changed_validator_command",
      expectedErrorCodes: ["invalid_validator_command_template"],
      contract: withRunbook(baseContract, {
        validatorCommandTemplate:
          "node scripts/validate-trading-read-only-approval-packet-validation-result-receipt.cjs",
      }),
    },
    {
      id: "changed_review_preflight_command",
      expectedErrorCodes: ["invalid_review_preflight_validator_command_template"],
      contract: withRunbook(baseContract, {
        reviewPreflightValidatorCommandTemplate:
          "node scripts/validate-trading-read-only-approval-packet-validation-result-receipt-review-preflight.cjs",
      }),
    },
    { id: "provider_call_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], contract: { ...baseContract, currentState: { ...baseContract.currentState, providerCallsAllowed: true } } },
    { id: "order_submission_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], contract: { ...baseContract, readiness: { ...baseContract.readiness, orderSubmissionAllowed: true } } },
    { id: "runtime_route_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], contract: { ...baseContract, checks: { ...baseContract.checks, runtimeRouteAllowed: true } } },
    { id: "numeric_raw_value_shape_injected", expectedErrorCodes: ["forbidden_raw_value"], contract: { ...baseContract, evidence: { ...baseContract.evidence, syntheticNumericRawValueShape: "12345678" } } },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewRunbookContract(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewRunbookContract(fixture.contract);
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
  const runbookContract = readJson(RUNBOOK_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidRunbookContract = clone(runbookContract);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidRunbookContract);
  const validationEvidence = fixtureValidationEvidence(syntheticValidRunbookContract, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidRunbookContract),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    runbookContractReady:
      runbookContract.readiness?.readyForOwnerAssistedReadOnlyApprovalValidationResultReceiptReviewRunbookReview === true &&
      runbookContract.readiness?.currentStepRunsValidator === false &&
      runbookContract.readiness?.currentStepReadsReceipt === false &&
      runbookContract.readiness?.approvalPacketImportedNow === false &&
      runbookContract.readiness?.providerCallsAllowed === false &&
      runbookContract.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingReadOnlyApprovalPacketValidationResultReceiptReviewRunbookContract") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt Review Runbook Validator Fixtures") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
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
    liveTradingAllowed: false,
  };
  const readyForReadOnlyApprovalReviewRunbookValidatorFixtureRegression =
    checks.runbookContractReady &&
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
    step: "Step 116-5Q-F",
    scope: "read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures",
    sourceFiles: {
      validationResultReceiptReviewRunbookContract: RUNBOOK_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
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
    validation: {
      redactionBoundary:
        "synthetic read-only approval validation receipt review-runbook validator fixtures only; no real receipt, private packet, account, operator, credential, provider payload, order payload, token, app key, app secret, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticReviewRunbookContract: syntheticValidRunbookContract,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      runbookContractStatus: runbookContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenFixtureContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForReadOnlyApprovalReviewRunbookValidatorFixtureRegression
        ? "fixtures_ready_for_read_only_approval_validation_result_receipt_review_runbook_validator_regression"
        : "blocked_before_read_only_approval_validation_result_receipt_review_runbook_validator_fixture_regression",
      readyForReadOnlyApprovalReviewRunbookValidatorFixtureRegression,
      fixturesOnly: true,
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
        ...(checks.runbookContractReady
          ? []
          : ["read_only_approval_packet_validation_result_receipt_review_runbook_contract_not_ready"]),
        ...(checks.validatorExportsLocalValidation
          ? []
          : ["read_only_approval_packet_validation_result_receipt_review_runbook_validator_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures.cjs`,
      );
    }
    console.log(
      "[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures] ok",
    );
    console.log(
      `[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log(
    "[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures] wrote contract",
  );
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures] readyForReadOnlyApprovalReviewRunbookValidatorFixtureRegression=${parsed.readiness.readyForReadOnlyApprovalReviewRunbookValidatorFixtureRegression}`,
  );
}

if (require.main === module) {
  main();
}

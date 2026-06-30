const fs = require("node:fs");
const path = require("node:path");
const {
  validateMockApprovalEvidenceReceipt,
} = require("./validate-trading-mock-approval-evidence-receipt.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_mock_approval_evidence_receipt_validator_fixtures.json",
);
const RECEIPT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-mock-approval-evidence-receipt.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-mock-approval-evidence-receipt-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RECEIPT_FIELDS = [
  "ownerConfirmationAt",
  "kisPortalMockApplicationConfirmed",
  "renderEnvMockTradingValuesConfirmed",
  "baseUrlScope",
  "tradingMode",
  "killSwitchState",
  "accountIdHashPresenceOnly",
  "appKeyPresenceOnly",
  "appSecretPresenceOnly",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_required_field",
  "unknown_field",
  "mock_application_not_confirmed",
  "render_env_not_confirmed",
  "invalid_base_url_scope",
  "invalid_trading_mode",
  "kill_switch_not_enabled",
  "presence_only_not_confirmed",
  "allow_flag_enabled",
  "invalid_confirmation_date",
  "secret_value_present",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  ["KIS", "TRADING", "APP", "KEY"].join("_"),
  ["KIS", "TRADING", "APP", "SECRET"].join("_"),
  `APP ${"Secret"}`,
  `APP ${"Key"}`,
  "access_token_value",
  "raw_account_identifier_value",
  "raw_session_token_value",
  "raw_order_payload_value",
  "raw_provider_payload_value",
  "order_confirmation_value",
  "execution_id_value",
  "fill_payload_value",
  ["data", "private", "trading"].join("/"),
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "tradingMockApprovalEvidenceReceipt.js"),
  path.join("server", "src", "services", "trading", "mockApprovalEvidenceReceipt.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
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

function pickReceiptFields(receipt) {
  return Object.fromEntries(REQUIRED_RECEIPT_FIELDS.map((field) => [field, receipt[field]]));
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

function invalidSyntheticFixtures(baseReceipt) {
  const missingRequiredField = clone(baseReceipt);
  delete missingRequiredField.publicUiAllowed;

  return [
    {
      id: "missing_required_field",
      expectedErrorCodes: ["missing_required_field"],
      receipt: missingRequiredField,
    },
    {
      id: "unknown_field",
      expectedErrorCodes: ["unknown_field"],
      receipt: { ...baseReceipt, unexpected: "redacted_value" },
    },
    {
      id: "mock_application_not_confirmed",
      expectedErrorCodes: ["mock_application_not_confirmed"],
      receipt: { ...baseReceipt, kisPortalMockApplicationConfirmed: false },
    },
    {
      id: "render_env_not_confirmed",
      expectedErrorCodes: ["render_env_not_confirmed"],
      receipt: { ...baseReceipt, renderEnvMockTradingValuesConfirmed: false },
    },
    {
      id: "invalid_base_url_scope",
      expectedErrorCodes: ["invalid_base_url_scope"],
      receipt: { ...baseReceipt, baseUrlScope: "production_trading" },
    },
    {
      id: "invalid_trading_mode",
      expectedErrorCodes: ["invalid_trading_mode"],
      receipt: { ...baseReceipt, tradingMode: "live_guarded" },
    },
    {
      id: "kill_switch_not_enabled",
      expectedErrorCodes: ["kill_switch_not_enabled"],
      receipt: { ...baseReceipt, killSwitchState: "disabled" },
    },
    {
      id: "presence_only_not_confirmed",
      expectedErrorCodes: ["presence_only_not_confirmed"],
      receipt: {
        ...baseReceipt,
        accountIdHashPresenceOnly: false,
        appKeyPresenceOnly: false,
        appSecretPresenceOnly: false,
      },
    },
    {
      id: "allow_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      receipt: {
        ...baseReceipt,
        providerCallsAllowed: true,
        orderSubmissionAllowed: true,
        runtimeRouteAllowed: true,
        publicUiAllowed: true,
      },
    },
    {
      id: "invalid_confirmation_date",
      expectedErrorCodes: ["invalid_confirmation_date"],
      receipt: { ...baseReceipt, ownerConfirmationAt: "2026-06-29T00:00:00.000Z" },
    },
    {
      id: "secret_value_present",
      expectedErrorCodes: ["secret_value_present"],
      receipt: {
        ...baseReceipt,
        redactionVersion: ["raw", "session", "token"].join("_"),
      },
    },
  ];
}

function fixtureValidationEvidence(validReceipt, invalidFixtures) {
  const validResult = validateMockApprovalEvidenceReceipt(validReceipt);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateMockApprovalEvidenceReceipt(fixture.receipt);
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
  const syntheticValidReceipt = pickReceiptFields(receiptContract.ownerProvidedEvidenceReceipt);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidReceipt);
  const validationEvidence = fixtureValidationEvidence(syntheticValidReceipt, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidReceipt),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.receipt)),
  ];
  const checks = {
    fixturesOnly: true,
    mockApprovalEvidenceReceiptReady:
      receiptContract.readiness?.readyForFutureRedactedReadOnlyApprovalEvidenceImportReview === true &&
      receiptContract.readiness?.approvalPacketImportedNow === false &&
      receiptContract.readiness?.providerCallsAllowed === false &&
      receiptContract.readiness?.orderSubmissionAllowed === false &&
      receiptContract.readiness?.runtimeRouteAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateMockApprovalEvidenceReceipt") &&
      validatorSource.includes("receipt_path_required") &&
      validatorSource.includes("--receipt"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Mock Approval Evidence Receipt Validator Fixtures") &&
      architectureDoc.includes("mock_approval_evidence_receipt_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    approvalPacketImportedNow: false,
    readOnlyApprovalImportImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForMockApprovalEvidenceReceiptValidatorRegression =
    checks.mockApprovalEvidenceReceiptReady &&
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
    step: "Step 116-2E",
    scope: "mock_approval_evidence_receipt_validator_fixtures",
    sourceFiles: {
      mockApprovalEvidenceReceipt: RECEIPT_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      approvalPacketImportedNow: false,
      readOnlyApprovalImportImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic mock-approval evidence receipt validator fixtures only; no real account, credential, token, provider payload, order payload, private approval packet, private path, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticMockApprovalEvidenceReceipt: syntheticValidReceipt,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      mockApprovalEvidenceReceiptStatus: receiptContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForMockApprovalEvidenceReceiptValidatorRegression
        ? "fixtures_ready_for_mock_approval_evidence_receipt_validator_regression"
        : "blocked_before_mock_approval_evidence_receipt_validator_fixture_regression",
      readyForMockApprovalEvidenceReceiptValidatorRegression,
      fixturesOnly: true,
      approvalPacketImportedNow: false,
      readOnlyApprovalImportImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.mockApprovalEvidenceReceiptReady ? [] : ["mock_approval_evidence_receipt_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_mock_approval_evidence_receipt_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingInvalidFixtureIds.map((id) => `missing_invalid_fixture_${id}`),
        ...(checks.noForbiddenFixtureContent ? [] : ["synthetic_fixture_contains_forbidden_content"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-mock-approval-evidence-receipt-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-mock-approval-evidence-receipt-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-mock-approval-evidence-receipt-validator-fixtures] ok");
    console.log(`[generate-trading-mock-approval-evidence-receipt-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-mock-approval-evidence-receipt-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-mock-approval-evidence-receipt-validator-fixtures] readyForMockApprovalEvidenceReceiptValidatorRegression=${parsed.readiness.readyForMockApprovalEvidenceReceiptValidatorRegression}`,
  );
}

main();

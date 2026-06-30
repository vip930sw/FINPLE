const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json",
);
const RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json",
);
const RESPONSE_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const REQUEST_ENVELOPE_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json",
);
const ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
);
const SNAPSHOT_NORMALIZATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-response-envelope.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-response-envelope-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RESPONSE_FIELDS = [
  "requestId",
  "mode",
  "endpointCategory",
  "statusCodeClass",
  "providerStatus",
  "receivedAt",
  "latencyBucket",
  "rateLimitState",
  "normalizedSnapshotType",
  "normalizedSnapshotHash",
  "rawResponseHash",
  "redactionVersion",
  "providerCallAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_raw_response_hash",
  "unknown_normalized_snapshot_type",
  "provider_call_flag_enabled",
  "order_endpoint_category",
  "raw_provider_payload_shape_present",
  "malformed_hash_field",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "50195326",
  "64408140",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function omitField(envelope, field) {
  const next = clone(envelope);
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

function loadValidator() {
  if (!fs.existsSync(VALIDATOR_PATH)) {
    return null;
  }
  return require(path.resolve(VALIDATOR_PATH));
}

function validSyntheticEnvelope() {
  return {
    requestId: "req_fixture_valid_001",
    mode: "shadow",
    endpointCategory: "account_cash_balance_read",
    statusCodeClass: "2xx",
    providerStatus: "success",
    receivedAt: "2026-06-29T00:00:00.000Z",
    latencyBucket: "lt_500ms",
    rateLimitState: "not_limited",
    normalizedSnapshotType: "account_cash_balance_snapshot",
    normalizedSnapshotHash: "hmac-sha256:fixture_snapshot_hash_123456",
    rawResponseHash: "hmac-sha256:fixture_response_hash_123456",
    redactionVersion: "v1",
    providerCallAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function invalidSyntheticFixtures(baseEnvelope) {
  return [
    {
      id: "missing_raw_response_hash",
      expectedErrorCodes: ["missing_required_field"],
      envelope: omitField(baseEnvelope, "rawResponseHash"),
    },
    {
      id: "unknown_normalized_snapshot_type",
      expectedErrorCodes: ["unknown_normalized_snapshot_type"],
      envelope: {
        ...baseEnvelope,
        normalizedSnapshotType: "unknown_snapshot",
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["provider_call_flag_enabled"],
      envelope: {
        ...baseEnvelope,
        providerCallAllowed: true,
      },
    },
    {
      id: "order_endpoint_category",
      expectedErrorCodes: ["order_endpoint_category"],
      envelope: {
        ...baseEnvelope,
        endpointCategory: "order_submission",
      },
    },
    {
      id: "raw_provider_payload_shape_present",
      expectedErrorCodes: ["raw_provider_payload_shape_present"],
      envelope: {
        ...baseEnvelope,
        rawProviderPayloadShape: "forbidden_shape_marker",
      },
    },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      envelope: {
        ...baseEnvelope,
        normalizedSnapshotHash: "not-a-labelled-hash",
      },
    },
  ];
}

function buildContract() {
  const responseEnvelopeValidationPreflight = readJson(RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT_PATH);
  const responseEnvelopeContract = readJson(RESPONSE_ENVELOPE_CONTRACT_PATH);
  const requestEnvelopeValidatorFixtures = readJson(REQUEST_ENVELOPE_VALIDATOR_FIXTURES_PATH);
  const endpointCategoryValidationPreflight = readJson(ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH);
  const snapshotNormalizationContract = readJson(SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const callAuthorizationPreflight = readJson(CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const validator = loadValidator();
  const syntheticValidEnvelope = validSyntheticEnvelope();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidEnvelope);
  const validResult = validator?.validateReadOnlyProviderResponseEnvelope?.(syntheticValidEnvelope) ?? null;
  const invalidResults = syntheticInvalidFixtures.map((fixture) => {
    const result = validator?.validateReadOnlyProviderResponseEnvelope?.(fixture.envelope) ?? null;
    const actualErrorCodes = [...new Set((result?.errors ?? []).map((error) => error.code))].sort();
    const missingExpectedErrorCodes = fixture.expectedErrorCodes.filter((code) => !actualErrorCodes.includes(code));
    return {
      id: fixture.id,
      valid: result?.valid ?? null,
      expectedErrorCodes: fixture.expectedErrorCodes,
      actualErrorCodes,
      missingExpectedErrorCodes,
      passed: result?.valid === false && missingExpectedErrorCodes.length === 0,
    };
  });
  const validFixtureFields = Object.keys(syntheticValidEnvelope);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredResponseFields = missingValues(validFixtureFields, REQUIRED_RESPONSE_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidEnvelope),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.envelope)),
  ];
  const checks = {
    fixturesOnly: true,
    responseEnvelopeValidationPreflightReady:
      responseEnvelopeValidationPreflight.readiness?.readyForPureLocalResponseEnvelopeValidatorImplementationReview ===
        true &&
      responseEnvelopeValidationPreflight.readiness?.responsePayloadReceivedNow === false &&
      responseEnvelopeValidationPreflight.readiness?.providerCallsAllowed === false,
    responseEnvelopeContractReady:
      responseEnvelopeContract.readiness?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      responseEnvelopeContract.readiness?.providerCallsAllowed === false &&
      responseEnvelopeContract.readiness?.orderSubmissionAllowed === false,
    requestEnvelopeValidatorFixturesReady:
      requestEnvelopeValidatorFixtures.readiness?.readyForRequestEnvelopeFixtureRegression === true &&
      requestEnvelopeValidatorFixtures.readiness?.providerCallsAllowed === false,
    endpointCategoryValidationPreflightReady:
      endpointCategoryValidationPreflight.readiness?.readyForFutureReadOnlyProviderEndpointCategoryValidationReview ===
        true &&
      endpointCategoryValidationPreflight.readiness?.providerCallsAllowed === false,
    snapshotNormalizationContractReady:
      snapshotNormalizationContract.readiness?.readyForFutureReadOnlySnapshotNormalizationImplementationReview === true &&
      snapshotNormalizationContract.readiness?.providerCallsAllowed === false &&
      snapshotNormalizationContract.readiness?.orderSubmissionAllowed === false,
    callAuthorizationStillBlocked:
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false,
    validatorExportsLocalValidation:
      typeof validator?.validateReadOnlyProviderResponseEnvelope === "function" &&
      readText(VALIDATOR_PATH).includes("envelope_path_required") &&
      readText(VALIDATOR_PATH).includes("--envelope"),
    validFixturePasses: validResult?.valid === true,
    invalidFixturesFailWithExpectedCodes: invalidResults.every((result) => result.passed),
    validFixtureFieldsReady: missingRequiredResponseFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    architectureDocMentionsResponseEnvelopeValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Provider Response Envelope Validator Fixtures") &&
      architectureDoc.includes("read_only_provider_response_envelope_validator_fixtures"),
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    responsePayloadReceivedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForResponseEnvelopeFixtureRegression =
    checks.responseEnvelopeValidationPreflightReady &&
    checks.responseEnvelopeContractReady &&
    checks.requestEnvelopeValidatorFixturesReady &&
    checks.endpointCategoryValidationPreflightReady &&
    checks.snapshotNormalizationContractReady &&
    checks.callAuthorizationStillBlocked &&
    checks.validatorExportsLocalValidation &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.validFixtureFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.architectureDocMentionsResponseEnvelopeValidatorFixtures &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3K",
    scope: "read_only_provider_response_envelope_validator_fixtures",
    sourceFiles: {
      responseEnvelopeValidationPreflight: RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT_PATH,
      responseEnvelopeContract: RESPONSE_ENVELOPE_CONTRACT_PATH,
      requestEnvelopeValidatorFixtures: REQUEST_ENVELOPE_VALIDATOR_FIXTURES_PATH,
      endpointCategoryValidationPreflight: ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH,
      snapshotNormalizationContract: SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      callAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      fixturesOnly: true,
      responsePayloadReceivedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic response-envelope fixtures only; no real account number, app key, app secret, token, raw provider payload, raw order payload, execution content, or private approval packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepImplementsValidator: Boolean(validator),
      currentStepReceivesProviderResponse: false,
      currentStepCallsProvider: false,
      validSyntheticEnvelope: syntheticValidEnvelope,
      invalidSyntheticFixtures: syntheticInvalidFixtures,
      fixtureRules: [
        "fixture_success_does_not_receive_provider_response",
        "fixture_success_does_not_call_provider",
        "fixture_success_does_not_persist_raw_provider_payload",
        "fixture_success_does_not_enable_runtime_route",
        "fixture_success_does_not_enable_order_submission",
      ],
      evidence: {
        validFixturePasses: validResult?.valid ?? null,
        validFixtureErrorCodes: validResult?.errors?.map((error) => error.code) ?? [],
        invalidFixturesFailWithExpectedCodes: invalidResults.every((result) => result.passed),
        invalidResults,
      },
    },
    checks,
    evidence: {
      responseEnvelopeValidationPreflightStatus: responseEnvelopeValidationPreflight.readiness?.status,
      responseEnvelopeContractStatus: responseEnvelopeContract.readiness?.status,
      requestEnvelopeValidatorFixturesStatus: requestEnvelopeValidatorFixtures.readiness?.status,
      endpointCategoryValidationPreflightStatus: endpointCategoryValidationPreflight.readiness?.status,
      snapshotNormalizationContractStatus: snapshotNormalizationContract.readiness?.status,
      callAuthorizationPreflightStatus: callAuthorizationPreflight.readiness?.status,
      validatorPath: VALIDATOR_PATH,
      validFixtureFields,
      missingRequiredResponseFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForResponseEnvelopeFixtureRegression
        ? "fixtures_ready_for_read_only_provider_response_envelope_validator_regression"
        : "blocked_before_read_only_provider_response_envelope_validator_fixture_regression",
      readyForResponseEnvelopeFixtureRegression,
      fixturesOnly: true,
      responsePayloadReceivedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.responseEnvelopeValidationPreflightReady
          ? []
          : ["response_envelope_validation_preflight_not_ready"]),
        ...(checks.responseEnvelopeContractReady ? [] : ["response_envelope_contract_not_ready"]),
        ...(checks.requestEnvelopeValidatorFixturesReady ? [] : ["request_envelope_validator_fixtures_not_ready"]),
        ...(checks.endpointCategoryValidationPreflightReady
          ? []
          : ["endpoint_category_validation_preflight_not_ready"]),
        ...(checks.snapshotNormalizationContractReady ? [] : ["snapshot_normalization_contract_not_ready"]),
        ...(checks.callAuthorizationStillBlocked ? [] : ["provider_call_authorization_not_blocked"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_response_envelope_validator_export_not_ready"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingRequiredResponseFields.map((field) => `missing_required_response_field_${field}`),
        ...missingInvalidFixtureIds.map((id) => `missing_invalid_fixture_${id}`),
        ...(checks.architectureDocMentionsResponseEnvelopeValidatorFixtures
          ? []
          : ["architecture_doc_missing_response_envelope_validator_fixtures"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-response-envelope-validator-fixtures.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-response-envelope-validator-fixtures.cjs`);
    }
    console.log("[generate-trading-read-only-provider-response-envelope-validator-fixtures] ok");
    console.log(`[generate-trading-read-only-provider-response-envelope-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-response-envelope-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-response-envelope-validator-fixtures] readyForResponseEnvelopeFixtureRegression=${parsed.readiness.readyForResponseEnvelopeFixtureRegression}`,
  );
}

main();

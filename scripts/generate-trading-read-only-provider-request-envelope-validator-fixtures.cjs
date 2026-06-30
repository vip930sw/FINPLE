const fs = require("node:fs");
const path = require("node:path");
const {
  validateReadOnlyProviderRequestEnvelope,
} = require("./validate-trading-read-only-provider-request-envelope.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json",
);
const REQUEST_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
);
const ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-request-envelope.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-request-envelope-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
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

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function fixtureContainsForbiddenContent(fixture) {
  const serialized = JSON.stringify(fixture);
  return FORBIDDEN_FIXTURE_CONTENT.filter((token) => serialized.includes(token));
}

function validSyntheticEnvelope() {
  return {
    requestId: "req_fixture_valid_001",
    mode: "shadow",
    approvalIdHash: "hmac-sha256:fixture_approval_hash_123456",
    baseUrl: "https://openapivts.koreainvestment.com:29443",
    method: "GET",
    pathTemplate: "/fixture/read-only/account-cash-balance",
    endpointCategory: "account_cash_balance_read",
    queryShape: {
      accountIdHash: "redacted_hash_shape",
      market: "string_shape",
      symbol: "optional_string_shape",
    },
    headerNames: ["x-redacted-request-hash"],
    bodyShape: {
      payload: "empty",
    },
    timestamp: "2026-06-29T00:00:00.000Z",
    idempotencyKey: "idem_fixture_valid_001",
    requestHash: "hmac-sha256:fixture_request_hash_123456",
    responseHash: "pending_hash",
    redactionVersion: "v1",
    providerCallAllowed: false,
  };
}

function invalidSyntheticFixtures(baseEnvelope) {
  return [
    {
      id: "missing_required_field",
      expectedErrorCodes: ["missing_required_field"],
      envelope: omitField(baseEnvelope, "requestHash"),
    },
    {
      id: "unknown_endpoint_category",
      expectedErrorCodes: ["unknown_endpoint_category"],
      envelope: {
        ...baseEnvelope,
        endpointCategory: "order_submission",
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
      id: "unsafe_path_template",
      expectedErrorCodes: ["unsafe_path_template"],
      envelope: {
        ...baseEnvelope,
        pathTemplate: "/order-submit/live",
      },
    },
    {
      id: "invalid_base_url",
      expectedErrorCodes: ["invalid_base_url"],
      envelope: {
        ...baseEnvelope,
        baseUrl: "https://openapi.koreainvestment.com:9443",
      },
    },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      envelope: {
        ...baseEnvelope,
        approvalIdHash: "not-a-labelled-hash",
      },
    },
    {
      id: "secret_value_present",
      expectedErrorCodes: ["secret_value_present"],
      envelope: {
        ...baseEnvelope,
        queryShape: {
          appSecret: "string_shape",
        },
      },
    },
  ];
}

function fixtureValidationEvidence(validEnvelope, invalidFixtures) {
  const validResult = validateReadOnlyProviderRequestEnvelope(validEnvelope);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateReadOnlyProviderRequestEnvelope(fixture.envelope);
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
  const requestEnvelopeContract = readJson(REQUEST_ENVELOPE_CONTRACT_PATH);
  const requestEnvelopeValidationPreflight = readJson(REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH);
  const endpointCategoryValidationPreflight = readJson(ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH);
  const callAuthorizationPreflight = readJson(CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const validatorText = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidEnvelope = validSyntheticEnvelope();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidEnvelope);
  const validationEvidence = fixtureValidationEvidence(syntheticValidEnvelope, syntheticInvalidFixtures);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidEnvelope),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.envelope)),
  ];
  const checks = {
    fixturesOnly: true,
    requestEnvelopeContractReady:
      requestEnvelopeContract.readiness?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      requestEnvelopeContract.readiness?.providerCallsAllowed === false,
    requestEnvelopeValidationPreflightReady:
      requestEnvelopeValidationPreflight.readiness?.readyForPureLocalRequestEnvelopeValidatorImplementationReview ===
        true &&
      requestEnvelopeValidationPreflight.readiness?.providerRequestCreatedNow === false &&
      requestEnvelopeValidationPreflight.readiness?.providerCallsAllowed === false,
    endpointCategoryValidationPreflightReady:
      endpointCategoryValidationPreflight.readiness?.readyForFutureReadOnlyProviderEndpointCategoryValidationReview ===
        true &&
      endpointCategoryValidationPreflight.readiness?.providerCallsAllowed === false,
    callAuthorizationStillBlocked:
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false,
    validatorExportsLocalValidation:
      validatorText.includes("validateReadOnlyProviderRequestEnvelope") &&
      validatorText.includes("envelope_path_required") &&
      validatorText.includes("--envelope"),
    architectureDocMentionsRequestEnvelopeValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Provider Request Envelope Validator Fixtures") &&
      architectureDoc.includes("read_only_provider_request_envelope_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerRequestCreatedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForRequestEnvelopeFixtureRegression =
    checks.requestEnvelopeContractReady &&
    checks.requestEnvelopeValidationPreflightReady &&
    checks.endpointCategoryValidationPreflightReady &&
    checks.callAuthorizationStillBlocked &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsRequestEnvelopeValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3I",
    scope: "read_only_provider_request_envelope_validator_fixtures",
    sourceFiles: {
      requestEnvelopeContract: REQUEST_ENVELOPE_CONTRACT_PATH,
      requestEnvelopeValidationPreflight: REQUEST_ENVELOPE_VALIDATION_PREFLIGHT_PATH,
      endpointCategoryValidationPreflight: ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH,
      callAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      fixturesOnly: true,
      providerRequestCreatedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic request-envelope fixtures only; no real account number, app key, app secret, token, raw provider payload, raw order payload, or private approval packet content",
      validSyntheticEnvelope: syntheticValidEnvelope,
      invalidSyntheticFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      requestEnvelopeContractStatus: requestEnvelopeContract.readiness?.status,
      requestEnvelopeValidationPreflightStatus: requestEnvelopeValidationPreflight.readiness?.status,
      endpointCategoryValidationPreflightStatus: endpointCategoryValidationPreflight.readiness?.status,
      callAuthorizationPreflightStatus: callAuthorizationPreflight.readiness?.status,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForRequestEnvelopeFixtureRegression
        ? "fixtures_ready_for_read_only_provider_request_envelope_validator_regression"
        : "blocked_before_read_only_provider_request_envelope_validator_fixture_regression",
      readyForRequestEnvelopeFixtureRegression,
      fixturesOnly: true,
      providerRequestCreatedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.requestEnvelopeContractReady ? [] : ["request_envelope_contract_not_ready"]),
        ...(checks.requestEnvelopeValidationPreflightReady ? [] : ["request_envelope_validation_preflight_not_ready"]),
        ...(checks.endpointCategoryValidationPreflightReady
          ? []
          : ["endpoint_category_validation_preflight_not_ready"]),
        ...(checks.callAuthorizationStillBlocked ? [] : ["provider_call_authorization_not_blocked"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_request_envelope_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsRequestEnvelopeValidatorFixtures
          ? []
          : ["architecture_doc_missing_request_envelope_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-request-envelope-validator-fixtures.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-request-envelope-validator-fixtures.cjs`);
    }
    console.log("[generate-trading-read-only-provider-request-envelope-validator-fixtures] ok");
    console.log(`[generate-trading-read-only-provider-request-envelope-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-request-envelope-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-request-envelope-validator-fixtures] readyForRequestEnvelopeFixtureRegression=${parsed.readiness.readyForRequestEnvelopeFixtureRegression}`,
  );
}

main();

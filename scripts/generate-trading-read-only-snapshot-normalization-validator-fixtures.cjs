const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingReadOnlySnapshotNormalization,
} = require("./validate-trading-read-only-snapshot-normalization.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_validator_fixtures.json",
);
const SNAPSHOT_NORMALIZATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const RESPONSE_ENVELOPE_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-snapshot-normalization.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-snapshot-normalization-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_SNAPSHOT_FIELDS = [
  "snapshotId",
  "snapshotType",
  "sourceEnvelopeHash",
  "createdAt",
  "market",
  "symbol",
  "currency",
  "accountIdHash",
  "valueHash",
  "freshnessStatus",
  "providerStatus",
  "redactionVersion",
  "rawPayloadStored",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_value_hash",
  "unknown_snapshot_type",
  "raw_payload_stored",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "raw_payload_shape_present",
  "malformed_hash_field",
  "stale_marker_allowed_but_recorded",
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
  path.join("server", "src", "services", "tradingReadOnlySnapshotNormalizer.js"),
  path.join("server", "src", "services", "trading", "readOnlySnapshotNormalizer.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
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

function omitField(snapshot, field) {
  const next = clone(snapshot);
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

function validSyntheticSnapshot() {
  return {
    snapshotId: "snap_fixture_valid_001",
    snapshotType: "account_cash_balance_snapshot",
    sourceEnvelopeHash: "hmac-sha256:fixture_envelope_hash_123456",
    createdAt: "2026-06-29T00:00:00.000Z",
    market: "KR",
    symbol: null,
    currency: "KRW",
    accountIdHash: "hmac-sha256:fixture_account_hash_123456",
    valueHash: "hmac-sha256:fixture_value_hash_123456",
    freshnessStatus: "fresh",
    providerStatus: "success",
    redactionVersion: "v1",
    rawPayloadStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function invalidSyntheticFixtures(baseSnapshot) {
  return [
    {
      id: "missing_value_hash",
      expectedErrorCodes: ["missing_required_field"],
      snapshot: omitField(baseSnapshot, "valueHash"),
    },
    {
      id: "unknown_snapshot_type",
      expectedErrorCodes: ["unknown_snapshot_type"],
      snapshot: {
        ...baseSnapshot,
        snapshotType: "execution_snapshot",
      },
    },
    {
      id: "raw_payload_stored",
      expectedErrorCodes: ["raw_payload_stored"],
      snapshot: {
        ...baseSnapshot,
        rawPayloadStored: true,
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["provider_call_flag_enabled"],
      snapshot: {
        ...baseSnapshot,
        providerCallsAllowed: true,
      },
    },
    {
      id: "order_submission_flag_enabled",
      expectedErrorCodes: ["order_submission_flag_enabled"],
      snapshot: {
        ...baseSnapshot,
        orderSubmissionAllowed: true,
      },
    },
    {
      id: "raw_payload_shape_present",
      expectedErrorCodes: ["unknown_field"],
      snapshot: {
        ...baseSnapshot,
        rawProviderPayloadShape: "forbidden_shape_marker",
      },
    },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      snapshot: {
        ...baseSnapshot,
        valueHash: "not-a-labelled-hash",
      },
    },
    {
      id: "stale_marker_allowed_but_recorded",
      expectedErrorCodes: [],
      snapshot: {
        ...baseSnapshot,
        freshnessStatus: "stale",
      },
      expectedValid: true,
    },
  ];
}

function fixtureValidationEvidence(validSnapshot, invalidFixtures) {
  const validResult = validateTradingReadOnlySnapshotNormalization(validSnapshot);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingReadOnlySnapshotNormalization(fixture.snapshot);
    const actualErrorCodes = [...new Set(result.errors.map((error) => error.code))].sort();
    const expectedValid = fixture.expectedValid === true;
    const missingExpectedErrorCodes = fixture.expectedErrorCodes.filter((code) => !actualErrorCodes.includes(code));
    return {
      id: fixture.id,
      valid: result.valid,
      expectedValid,
      expectedErrorCodes: fixture.expectedErrorCodes,
      actualErrorCodes,
      missingExpectedErrorCodes,
      passed: expectedValid ? result.valid === true : result.valid === false && missingExpectedErrorCodes.length === 0,
    };
  });

  return {
    validFixturePasses: validResult.valid === true,
    validFixtureErrorCodes: validResult.errors.map((error) => error.code),
    invalidFixturesMatchExpectedResults: invalidResults.every((result) => result.passed),
    invalidResults,
  };
}

function buildContract() {
  const snapshotNormalizationContract = readJson(SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const responseEnvelopeValidatorFixtures = readJson(RESPONSE_ENVELOPE_VALIDATOR_FIXTURES_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidSnapshot = validSyntheticSnapshot();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidSnapshot);
  const validationEvidence = fixtureValidationEvidence(syntheticValidSnapshot, syntheticInvalidFixtures);
  const validFixtureFields = Object.keys(syntheticValidSnapshot);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredSnapshotFields = missingValues(validFixtureFields, REQUIRED_SNAPSHOT_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidSnapshot),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.snapshot)),
  ];
  const checks = {
    fixturesOnly: true,
    snapshotNormalizationContractReady:
      snapshotNormalizationContract.readiness?.readyForFutureReadOnlySnapshotNormalizationImplementationReview === true &&
      snapshotNormalizationContract.readiness?.snapshotNormalizationImplementationAllowed === false &&
      snapshotNormalizationContract.readiness?.providerCallsAllowed === false &&
      snapshotNormalizationContract.readiness?.orderSubmissionAllowed === false,
    responseEnvelopeValidatorFixturesReady:
      responseEnvelopeValidatorFixtures.readiness?.readyForResponseEnvelopeFixtureRegression === true &&
      responseEnvelopeValidatorFixtures.readiness?.providerCallsAllowed === false &&
      responseEnvelopeValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingReadOnlySnapshotNormalization") &&
      validatorSource.includes("snapshot_path_required") &&
      validatorSource.includes("--snapshot"),
    architectureDocMentionsSnapshotNormalizationValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Snapshot Normalization Validator Fixtures") &&
      architectureDoc.includes("read_only_snapshot_normalization_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesMatchExpectedResults: validationEvidence.invalidFixturesMatchExpectedResults,
    validFixtureFieldsReady: missingRequiredSnapshotFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    rawPayloadStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForSnapshotNormalizationFixtureRegression =
    checks.snapshotNormalizationContractReady &&
    checks.responseEnvelopeValidatorFixturesReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsSnapshotNormalizationValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesMatchExpectedResults &&
    checks.validFixtureFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3N",
    scope: "read_only_snapshot_normalization_validator_fixtures",
    sourceFiles: {
      snapshotNormalizationContract: SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      responseEnvelopeValidatorFixtures: RESPONSE_ENVELOPE_VALIDATOR_FIXTURES_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      fixturesOnly: true,
      rawPayloadStored: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic normalized snapshot fixtures only; no real account number, app key, app secret, token, raw provider payload, raw order payload, execution content, or private approval packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCallsProvider: false,
      currentStepParsesProviderPayload: false,
      validSyntheticSnapshot: syntheticValidSnapshot,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      snapshotNormalizationContractStatus: snapshotNormalizationContract.readiness?.status,
      responseEnvelopeValidatorFixturesStatus: responseEnvelopeValidatorFixtures.readiness?.status,
      validFixtureFields,
      missingRequiredSnapshotFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForSnapshotNormalizationFixtureRegression
        ? "fixtures_ready_for_read_only_snapshot_normalization_validator_regression"
        : "blocked_before_read_only_snapshot_normalization_validator_fixture_regression",
      readyForSnapshotNormalizationFixtureRegression,
      fixturesOnly: true,
      rawPayloadStored: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.snapshotNormalizationContractReady ? [] : ["snapshot_normalization_contract_not_ready"]),
        ...(checks.responseEnvelopeValidatorFixturesReady
          ? []
          : ["response_envelope_validator_fixtures_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_snapshot_normalization_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsSnapshotNormalizationValidatorFixtures
          ? []
          : ["architecture_doc_missing_snapshot_normalization_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesMatchExpectedResults ? [] : ["synthetic_fixtures_do_not_match_expected_results"]),
        ...missingRequiredSnapshotFields.map((field) => `missing_required_snapshot_field_${field}`),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-snapshot-normalization-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-snapshot-normalization-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-read-only-snapshot-normalization-validator-fixtures] ok");
    console.log(`[generate-trading-read-only-snapshot-normalization-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-snapshot-normalization-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-read-only-snapshot-normalization-validator-fixtures] readyForSnapshotNormalizationFixtureRegression=${parsed.readiness.readyForSnapshotNormalizationFixtureRegression}`,
  );
}

main();

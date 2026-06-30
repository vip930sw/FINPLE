const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingReadOnlySnapshotRiskInput,
} = require("./validate-trading-read-only-snapshot-risk-input.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_validator_fixtures.json",
);
const SNAPSHOT_RISK_INPUT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
);
const SNAPSHOT_NORMALIZATION_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-snapshot-risk-input.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-snapshot-risk-input-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RISK_INPUT_FIELDS = [
  "evaluationId",
  "orderIntentHash",
  "mode",
  "generatedAt",
  "market",
  "symbol",
  "side",
  "quantity",
  "estimatedNotionalHash",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "positionsSnapshotHash",
  "fxRateSnapshotHash",
  "marketSessionSnapshotHash",
  "providerRateLimitSnapshotHash",
  "snapshotFreshnessStatus",
  "accountMatchStatus",
  "providerRateLimitStatus",
  "killSwitchStateHash",
  "manualApprovalStateHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_quote_snapshot_hash",
  "live_guarded_mode",
  "stale_snapshot",
  "account_mismatch",
  "provider_rate_limit_blocked",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "malformed_hash_field",
  "unsafe_symbol",
  "raw_snapshot_shape_present",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_snapshot_value",
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
  path.join("server", "src", "services", "tradingReadOnlySnapshotRiskInput.js"),
  path.join("server", "src", "services", "trading", "readOnlySnapshotRiskInput.js"),
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

function omitField(input, field) {
  const next = clone(input);
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

function validSyntheticRiskInput() {
  return {
    evaluationId: "eval_fixture_valid_001",
    orderIntentHash: "hmac-sha256:fixture_order_intent_hash_123456",
    mode: "shadow",
    generatedAt: "2026-06-29T00:00:00.000Z",
    market: "KR",
    symbol: "005930",
    side: "BUY",
    quantity: 1,
    estimatedNotionalHash: "hmac-sha256:fixture_notional_hash_123456",
    quoteSnapshotHash: "hmac-sha256:fixture_quote_snapshot_hash_123456",
    accountStateSnapshotHash: "hmac-sha256:fixture_account_state_hash_123456",
    orderableCashSnapshotHash: "hmac-sha256:fixture_cash_snapshot_hash_123456",
    positionsSnapshotHash: "hmac-sha256:fixture_positions_snapshot_hash_123456",
    fxRateSnapshotHash: "hmac-sha256:fixture_fx_snapshot_hash_123456",
    marketSessionSnapshotHash: "hmac-sha256:fixture_market_session_hash_123456",
    providerRateLimitSnapshotHash: "hmac-sha256:fixture_rate_limit_hash_123456",
    snapshotFreshnessStatus: "fresh",
    accountMatchStatus: "account_hash_matched",
    providerRateLimitStatus: "within_limit",
    killSwitchStateHash: "hmac-sha256:fixture_kill_switch_hash_123456",
    manualApprovalStateHash: "hmac-sha256:fixture_manual_approval_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function invalidSyntheticFixtures(baseInput) {
  return [
    {
      id: "missing_quote_snapshot_hash",
      expectedErrorCodes: ["missing_required_field"],
      input: omitField(baseInput, "quoteSnapshotHash"),
    },
    {
      id: "live_guarded_mode",
      expectedErrorCodes: ["invalid_mode"],
      input: {
        ...baseInput,
        mode: "live_guarded",
      },
    },
    {
      id: "stale_snapshot",
      expectedErrorCodes: ["snapshot_not_fresh"],
      input: {
        ...baseInput,
        snapshotFreshnessStatus: "stale",
      },
    },
    {
      id: "account_mismatch",
      expectedErrorCodes: ["account_mismatch"],
      input: {
        ...baseInput,
        accountMatchStatus: "account_hash_mismatch",
      },
    },
    {
      id: "provider_rate_limit_blocked",
      expectedErrorCodes: ["provider_rate_limit_blocked"],
      input: {
        ...baseInput,
        providerRateLimitStatus: "blocked",
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["provider_call_flag_enabled"],
      input: {
        ...baseInput,
        providerCallsAllowed: true,
      },
    },
    {
      id: "order_submission_flag_enabled",
      expectedErrorCodes: ["order_submission_flag_enabled"],
      input: {
        ...baseInput,
        orderSubmissionAllowed: true,
      },
    },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      input: {
        ...baseInput,
        quoteSnapshotHash: "not-a-labelled-hash",
      },
    },
    {
      id: "unsafe_symbol",
      expectedErrorCodes: ["invalid_symbol"],
      input: {
        ...baseInput,
        symbol: "005930;DROP",
      },
    },
    {
      id: "raw_snapshot_shape_present",
      expectedErrorCodes: ["unknown_field"],
      input: {
        ...baseInput,
        rawSnapshotShape: "forbidden_shape_marker",
      },
    },
  ];
}

function fixtureValidationEvidence(validInput, invalidFixtures) {
  const validResult = validateTradingReadOnlySnapshotRiskInput(validInput);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingReadOnlySnapshotRiskInput(fixture.input);
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
  const snapshotRiskInputContract = readJson(SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const snapshotNormalizationValidatorFixtures = readJson(SNAPSHOT_NORMALIZATION_VALIDATOR_FIXTURES_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidRiskInput = validSyntheticRiskInput();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidRiskInput);
  const validationEvidence = fixtureValidationEvidence(syntheticValidRiskInput, syntheticInvalidFixtures);
  const validFixtureFields = Object.keys(syntheticValidRiskInput);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredRiskInputFields = missingValues(validFixtureFields, REQUIRED_RISK_INPUT_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidRiskInput),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.input)),
  ];
  const checks = {
    fixturesOnly: true,
    snapshotRiskInputContractReady:
      snapshotRiskInputContract.readiness?.readyForFutureReadOnlySnapshotRiskInputImplementationReview === true &&
      snapshotRiskInputContract.readiness?.snapshotRiskInputImplementationAllowed === false &&
      snapshotRiskInputContract.readiness?.providerCallsAllowed === false &&
      snapshotRiskInputContract.readiness?.orderSubmissionAllowed === false,
    snapshotNormalizationValidatorFixturesReady:
      snapshotNormalizationValidatorFixtures.readiness?.readyForSnapshotNormalizationFixtureRegression === true &&
      snapshotNormalizationValidatorFixtures.readiness?.providerCallsAllowed === false &&
      snapshotNormalizationValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingReadOnlySnapshotRiskInput") &&
      validatorSource.includes("input_path_required") &&
      validatorSource.includes("--input"),
    architectureDocMentionsSnapshotRiskInputValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Snapshot Risk Input Validator Fixtures") &&
      architectureDoc.includes("read_only_snapshot_risk_input_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    validFixtureFieldsReady: missingRequiredRiskInputFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForSnapshotRiskInputFixtureRegression =
    checks.snapshotRiskInputContractReady &&
    checks.snapshotNormalizationValidatorFixturesReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsSnapshotRiskInputValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.validFixtureFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3O",
    scope: "read_only_snapshot_risk_input_validator_fixtures",
    sourceFiles: {
      snapshotRiskInputContract: SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      snapshotNormalizationValidatorFixtures: SNAPSHOT_NORMALIZATION_VALIDATOR_FIXTURES_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic snapshot risk-input fixtures only; no real account number, app key, app secret, token, raw provider payload, raw order payload, execution content, or private approval packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      validSyntheticRiskInput: syntheticValidRiskInput,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      snapshotRiskInputContractStatus: snapshotRiskInputContract.readiness?.status,
      snapshotNormalizationValidatorFixturesStatus: snapshotNormalizationValidatorFixtures.readiness?.status,
      validFixtureFields,
      missingRequiredRiskInputFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForSnapshotRiskInputFixtureRegression
        ? "fixtures_ready_for_read_only_snapshot_risk_input_validator_regression"
        : "blocked_before_read_only_snapshot_risk_input_validator_fixture_regression",
      readyForSnapshotRiskInputFixtureRegression,
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.snapshotRiskInputContractReady ? [] : ["snapshot_risk_input_contract_not_ready"]),
        ...(checks.snapshotNormalizationValidatorFixturesReady
          ? []
          : ["snapshot_normalization_validator_fixtures_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_snapshot_risk_input_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsSnapshotRiskInputValidatorFixtures
          ? []
          : ["architecture_doc_missing_snapshot_risk_input_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingRequiredRiskInputFields.map((field) => `missing_required_risk_input_field_${field}`),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-snapshot-risk-input-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-snapshot-risk-input-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-read-only-snapshot-risk-input-validator-fixtures] ok");
    console.log(`[generate-trading-read-only-snapshot-risk-input-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-snapshot-risk-input-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-read-only-snapshot-risk-input-validator-fixtures] readyForSnapshotRiskInputFixtureRegression=${parsed.readiness.readyForSnapshotRiskInputFixtureRegression}`,
  );
}

main();

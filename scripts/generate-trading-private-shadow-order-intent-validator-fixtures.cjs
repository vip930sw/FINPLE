const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingPrivateShadowOrderIntent,
} = require("./validate-trading-private-shadow-order-intent.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_order_intent_validator_fixtures.json",
);
const ORDER_INTENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_order_intent_contract.json",
);
const SNAPSHOT_RISK_INPUT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-private-shadow-order-intent.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-order-intent-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INTENT_FIELDS = [
  "intentId",
  "mode",
  "strategyIdHash",
  "operatorIdHash",
  "createdAt",
  "market",
  "symbol",
  "side",
  "orderType",
  "quantity",
  "limitPriceHash",
  "estimatedNotionalHash",
  "currency",
  "riskInputHash",
  "riskGateStatus",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "auditEventHash",
  "idempotencyKeyHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_risk_input_hash",
  "live_guarded_mode",
  "clear_risk_gate_status",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "malformed_hash_field",
  "unsafe_symbol",
  "unsafe_order_type",
  "raw_order_shape_present",
  "order_confirmation_present",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_quote_value",
  "raw_position_value",
  "raw_cash_value",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "50195326",
  "64408140",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "trading", "privateShadowOrderIntent.js"),
  path.join("server", "src", "services", "trading", "orderIntentRecorder.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
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

function validSyntheticOrderIntent() {
  return {
    intentId: "intent_fixture_shadow_001",
    mode: "shadow",
    strategyIdHash: "hmac-sha256:fixture_strategy_hash_123456",
    operatorIdHash: "hmac-sha256:fixture_operator_hash_123456",
    createdAt: "2026-06-29T00:00:00.000Z",
    market: "KR",
    symbol: "005930",
    side: "BUY",
    orderType: "MARKET",
    quantity: 1,
    limitPriceHash: "not_applicable",
    estimatedNotionalHash: "hmac-sha256:fixture_notional_hash_123456",
    currency: "KRW",
    riskInputHash: "hmac-sha256:fixture_risk_input_hash_123456",
    riskGateStatus: "live_review_required",
    quoteSnapshotHash: "hmac-sha256:fixture_quote_snapshot_hash_123456",
    accountStateSnapshotHash: "hmac-sha256:fixture_account_state_hash_123456",
    orderableCashSnapshotHash: "hmac-sha256:fixture_cash_snapshot_hash_123456",
    dryRunReplayIdHash: "hmac-sha256:fixture_dry_run_hash_123456",
    shadowHistoryReferenceHash: "hmac-sha256:fixture_shadow_history_hash_123456",
    auditEventHash: "hmac-sha256:fixture_audit_event_hash_123456",
    idempotencyKeyHash: "hmac-sha256:fixture_idempotency_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function invalidSyntheticFixtures(baseIntent) {
  return [
    {
      id: "missing_risk_input_hash",
      expectedErrorCodes: ["missing_required_field"],
      intent: omitField(baseIntent, "riskInputHash"),
    },
    {
      id: "live_guarded_mode",
      expectedErrorCodes: ["invalid_mode"],
      intent: {
        ...baseIntent,
        mode: "live_guarded",
      },
    },
    {
      id: "clear_risk_gate_status",
      expectedErrorCodes: ["invalid_risk_gate_status"],
      intent: {
        ...baseIntent,
        riskGateStatus: "clear",
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["provider_call_flag_enabled"],
      intent: {
        ...baseIntent,
        providerCallsAllowed: true,
      },
    },
    {
      id: "order_submission_flag_enabled",
      expectedErrorCodes: ["order_submission_flag_enabled"],
      intent: {
        ...baseIntent,
        orderSubmissionAllowed: true,
      },
    },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      intent: {
        ...baseIntent,
        riskInputHash: "not-a-labelled-hash",
      },
    },
    {
      id: "unsafe_symbol",
      expectedErrorCodes: ["invalid_symbol"],
      intent: {
        ...baseIntent,
        symbol: "005930;DROP",
      },
    },
    {
      id: "unsafe_order_type",
      expectedErrorCodes: ["invalid_order_type"],
      intent: {
        ...baseIntent,
        orderType: "ORDER_CASH",
      },
    },
    {
      id: "raw_order_shape_present",
      expectedErrorCodes: ["unknown_field"],
      intent: {
        ...baseIntent,
        rawOrderShape: "redacted_marker",
      },
    },
    {
      id: "order_confirmation_present",
      expectedErrorCodes: ["unknown_field"],
      intent: {
        ...baseIntent,
        orderConfirmationHash: "sha256:fixture_confirm_hash_123456",
      },
    },
  ];
}

function fixtureValidationEvidence(validIntent, invalidFixtures) {
  const validResult = validateTradingPrivateShadowOrderIntent(validIntent);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingPrivateShadowOrderIntent(fixture.intent);
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
  const orderIntentContract = readJson(ORDER_INTENT_CONTRACT_PATH);
  const snapshotRiskInputValidatorFixtures = readJson(SNAPSHOT_RISK_INPUT_VALIDATOR_FIXTURES_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidOrderIntent = validSyntheticOrderIntent();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidOrderIntent);
  const validationEvidence = fixtureValidationEvidence(syntheticValidOrderIntent, syntheticInvalidFixtures);
  const validIntentFields = Object.keys(syntheticValidOrderIntent);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredIntentFields = missingValues(validIntentFields, REQUIRED_INTENT_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidOrderIntent),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.intent)),
  ];
  const checks = {
    fixturesOnly: true,
    orderIntentContractReady:
      orderIntentContract.readiness?.readyForFuturePrivateShadowOrderIntentImplementationReview === true &&
      orderIntentContract.readiness?.privateShadowOrderIntentImplementationAllowed === false &&
      orderIntentContract.readiness?.providerCallsAllowed === false &&
      orderIntentContract.readiness?.orderSubmissionAllowed === false,
    snapshotRiskInputValidatorFixturesReady:
      snapshotRiskInputValidatorFixtures.readiness?.readyForSnapshotRiskInputFixtureRegression === true &&
      snapshotRiskInputValidatorFixtures.readiness?.providerCallsAllowed === false &&
      snapshotRiskInputValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingPrivateShadowOrderIntent") &&
      validatorSource.includes("intent_path_required") &&
      validatorSource.includes("--intent"),
    architectureDocMentionsOrderIntentValidatorFixtures:
      architectureDoc.includes("Trading Private Shadow Order Intent Validator Fixtures") &&
      architectureDoc.includes("private_shadow_order_intent_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    validIntentFieldsReady: missingRequiredIntentFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    orderCancellationAllowed: false,
    orderIntentRecordingAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForPrivateShadowOrderIntentFixtureRegression =
    checks.orderIntentContractReady &&
    checks.snapshotRiskInputValidatorFixturesReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsOrderIntentValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.validIntentFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3P",
    scope: "private_shadow_order_intent_validator_fixtures",
    sourceFiles: {
      orderIntentContract: ORDER_INTENT_CONTRACT_PATH,
      snapshotRiskInputValidatorFixtures: SNAPSHOT_RISK_INPUT_VALIDATOR_FIXTURES_PATH,
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
      orderCancellationAllowed: false,
      orderIntentRecordingAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic private shadow order-intent fixtures only; no real account number, app key, app secret, token, raw provider payload, raw order payload, execution content, fill payload, or private approval packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepCancelsOrder: false,
      currentStepRecordsIntent: false,
      validSyntheticOrderIntent: syntheticValidOrderIntent,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      orderIntentContractStatus: orderIntentContract.readiness?.status,
      snapshotRiskInputValidatorFixturesStatus: snapshotRiskInputValidatorFixtures.readiness?.status,
      validIntentFields,
      missingRequiredIntentFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForPrivateShadowOrderIntentFixtureRegression
        ? "fixtures_ready_for_private_shadow_order_intent_validator_regression"
        : "blocked_before_private_shadow_order_intent_validator_fixture_regression",
      readyForPrivateShadowOrderIntentFixtureRegression,
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      orderCancellationAllowed: false,
      orderIntentRecordingAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.orderIntentContractReady ? [] : ["private_shadow_order_intent_contract_not_ready"]),
        ...(checks.snapshotRiskInputValidatorFixturesReady
          ? []
          : ["snapshot_risk_input_validator_fixtures_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_private_shadow_order_intent_validator_not_ready"]),
        ...(checks.architectureDocMentionsOrderIntentValidatorFixtures
          ? []
          : ["architecture_doc_missing_private_shadow_order_intent_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingRequiredIntentFields.map((field) => `missing_required_order_intent_field_${field}`),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-order-intent-validator-fixtures.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-order-intent-validator-fixtures.cjs`);
    }
    console.log("[generate-trading-private-shadow-order-intent-validator-fixtures] ok");
    console.log(`[generate-trading-private-shadow-order-intent-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-order-intent-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-private-shadow-order-intent-validator-fixtures] readyForPrivateShadowOrderIntentFixtureRegression=${parsed.readiness.readyForPrivateShadowOrderIntentFixtureRegression}`,
  );
}

main();

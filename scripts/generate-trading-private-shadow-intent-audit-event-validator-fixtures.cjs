const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingPrivateShadowIntentAuditEvent,
} = require("./validate-trading-private-shadow-intent-audit-event.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures.json",
);
const AUDIT_EVENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
);
const ORDER_INTENT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_order_intent_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-private-shadow-intent-audit-event.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-intent-audit-event-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_AUDIT_EVENT_FIELDS = [
  "eventId",
  "eventType",
  "mode",
  "severity",
  "status",
  "createdAt",
  "operatorIdHash",
  "strategyIdHash",
  "intentIdHash",
  "orderIntentHash",
  "riskInputHash",
  "riskGateStatus",
  "riskEventHash",
  "market",
  "symbol",
  "side",
  "decisionStatus",
  "snapshotFreshnessStatus",
  "killSwitchStateHash",
  "manualApprovalStateHash",
  "dryRunReplayIdHash",
  "shadowHistoryReferenceHash",
  "payloadHash",
  "previousEventHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_order_intent_hash",
  "live_guarded_mode",
  "unsupported_event_type",
  "clear_risk_gate_status",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "malformed_hash_field",
  "unsafe_symbol",
  "raw_payload_shape_present",
  "order_confirmation_reference_present",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "raw_payload",
  "raw_quote_value",
  "raw_position_value",
  "raw_cash_value",
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
  path.join("server", "src", "services", "trading", "privateShadowIntentAuditEvent.js"),
  path.join("server", "src", "services", "trading", "auditEventRecorder.js"),
  path.join("server", "src", "services", "trading", "privateShadowOrderIntent.js"),
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

function validSyntheticAuditEvent() {
  return {
    eventId: "audit_fixture_shadow_001",
    eventType: "private_shadow_order_intent_recorded",
    mode: "shadow",
    severity: "info",
    status: "recorded",
    createdAt: "2026-06-29T00:00:00.000Z",
    operatorIdHash: "hmac-sha256:fixture_operator_hash_123456",
    strategyIdHash: "hmac-sha256:fixture_strategy_hash_123456",
    intentIdHash: "hmac-sha256:fixture_intent_id_hash_123456",
    orderIntentHash: "hmac-sha256:fixture_order_intent_hash_123456",
    riskInputHash: "hmac-sha256:fixture_risk_input_hash_123456",
    riskGateStatus: "live_review_required",
    riskEventHash: "hmac-sha256:fixture_risk_event_hash_123456",
    market: "KR",
    symbol: "005930",
    side: "BUY",
    decisionStatus: "shadow_recorded",
    snapshotFreshnessStatus: "fresh",
    killSwitchStateHash: "hmac-sha256:fixture_kill_switch_hash_123456",
    manualApprovalStateHash: "hmac-sha256:fixture_manual_approval_hash_123456",
    dryRunReplayIdHash: "hmac-sha256:fixture_dry_run_hash_123456",
    shadowHistoryReferenceHash: "hmac-sha256:fixture_shadow_history_hash_123456",
    payloadHash: "hmac-sha256:fixture_payload_hash_123456",
    previousEventHash: "genesis_event",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function invalidSyntheticFixtures(baseEvent) {
  return [
    {
      id: "missing_order_intent_hash",
      expectedErrorCodes: ["missing_required_field"],
      event: omitField(baseEvent, "orderIntentHash"),
    },
    {
      id: "live_guarded_mode",
      expectedErrorCodes: ["invalid_mode"],
      event: {
        ...baseEvent,
        mode: "live_guarded",
      },
    },
    {
      id: "unsupported_event_type",
      expectedErrorCodes: ["invalid_event_type", "invalid_severity", "invalid_status"],
      event: {
        ...baseEvent,
        eventType: "order_submitted",
        severity: "critical",
        status: "submitted",
      },
    },
    {
      id: "clear_risk_gate_status",
      expectedErrorCodes: ["invalid_risk_gate_status", "invalid_decision_status"],
      event: {
        ...baseEvent,
        riskGateStatus: "clear",
        decisionStatus: "approved",
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["provider_call_flag_enabled"],
      event: {
        ...baseEvent,
        providerCallsAllowed: true,
      },
    },
    {
      id: "order_submission_flag_enabled",
      expectedErrorCodes: ["order_submission_flag_enabled"],
      event: {
        ...baseEvent,
        orderSubmissionAllowed: true,
      },
    },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      event: {
        ...baseEvent,
        payloadHash: "not-a-labelled-hash",
      },
    },
    {
      id: "unsafe_symbol",
      expectedErrorCodes: ["invalid_symbol"],
      event: {
        ...baseEvent,
        symbol: "005930;DROP",
      },
    },
    {
      id: "raw_payload_shape_present",
      expectedErrorCodes: ["unknown_field"],
      event: {
        ...baseEvent,
        rawPayloadShape: "redacted_marker",
      },
    },
    {
      id: "order_confirmation_reference_present",
      expectedErrorCodes: ["unknown_field"],
      event: {
        ...baseEvent,
        orderConfirmationHash: "sha256:fixture_confirm_hash_123456",
      },
    },
  ];
}

function fixtureValidationEvidence(validEvent, invalidFixtures) {
  const validResult = validateTradingPrivateShadowIntentAuditEvent(validEvent);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingPrivateShadowIntentAuditEvent(fixture.event);
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
  const auditEventContract = readJson(AUDIT_EVENT_CONTRACT_PATH);
  const orderIntentValidatorFixtures = readJson(ORDER_INTENT_VALIDATOR_FIXTURES_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidAuditEvent = validSyntheticAuditEvent();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidAuditEvent);
  const validationEvidence = fixtureValidationEvidence(syntheticValidAuditEvent, syntheticInvalidFixtures);
  const validAuditEventFields = Object.keys(syntheticValidAuditEvent);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredAuditEventFields = missingValues(validAuditEventFields, REQUIRED_AUDIT_EVENT_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidAuditEvent),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.event)),
  ];
  const checks = {
    fixturesOnly: true,
    auditEventContractReady:
      auditEventContract.readiness?.readyForFuturePrivateShadowIntentAuditEventImplementationReview === true &&
      auditEventContract.readiness?.privateShadowIntentAuditEventImplementationAllowed === false &&
      auditEventContract.readiness?.providerCallsAllowed === false &&
      auditEventContract.readiness?.orderSubmissionAllowed === false,
    orderIntentValidatorFixturesReady:
      orderIntentValidatorFixtures.readiness?.readyForPrivateShadowOrderIntentFixtureRegression === true &&
      orderIntentValidatorFixtures.readiness?.providerCallsAllowed === false &&
      orderIntentValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingPrivateShadowIntentAuditEvent") &&
      validatorSource.includes("event_path_required") &&
      validatorSource.includes("--event"),
    architectureDocMentionsAuditEventValidatorFixtures:
      architectureDoc.includes("Trading Private Shadow Intent Audit Event Validator Fixtures") &&
      architectureDoc.includes("private_shadow_intent_audit_event_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    validAuditEventFieldsReady: missingRequiredAuditEventFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    orderCancellationAllowed: false,
    auditLogWritingAllowed: false,
    orderIntentRecordingAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForPrivateShadowIntentAuditEventFixtureRegression =
    checks.auditEventContractReady &&
    checks.orderIntentValidatorFixturesReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsAuditEventValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.validAuditEventFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3Q",
    scope: "private_shadow_intent_audit_event_validator_fixtures",
    sourceFiles: {
      auditEventContract: AUDIT_EVENT_CONTRACT_PATH,
      orderIntentValidatorFixtures: ORDER_INTENT_VALIDATOR_FIXTURES_PATH,
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
      auditLogWritingAllowed: false,
      orderIntentRecordingAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic private shadow intent audit-event fixtures only; no real account number, app key, app secret, token, raw provider payload, raw order payload, execution content, fill payload, or private approval packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepCancelsOrder: false,
      currentStepWritesAuditLog: false,
      currentStepRecordsIntent: false,
      validSyntheticAuditEvent: syntheticValidAuditEvent,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      auditEventContractStatus: auditEventContract.readiness?.status,
      orderIntentValidatorFixturesStatus: orderIntentValidatorFixtures.readiness?.status,
      validAuditEventFields,
      missingRequiredAuditEventFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForPrivateShadowIntentAuditEventFixtureRegression
        ? "fixtures_ready_for_private_shadow_intent_audit_event_validator_regression"
        : "blocked_before_private_shadow_intent_audit_event_validator_fixture_regression",
      readyForPrivateShadowIntentAuditEventFixtureRegression,
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      orderCancellationAllowed: false,
      auditLogWritingAllowed: false,
      orderIntentRecordingAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.auditEventContractReady ? [] : ["private_shadow_intent_audit_event_contract_not_ready"]),
        ...(checks.orderIntentValidatorFixturesReady ? [] : ["private_shadow_order_intent_validator_fixtures_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_private_shadow_intent_audit_event_validator_not_ready"]),
        ...(checks.architectureDocMentionsAuditEventValidatorFixtures
          ? []
          : ["architecture_doc_missing_private_shadow_intent_audit_event_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingRequiredAuditEventFields.map((field) => `missing_required_audit_event_field_${field}`),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-intent-audit-event-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-intent-audit-event-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-private-shadow-intent-audit-event-validator-fixtures] ok");
    console.log(`[generate-trading-private-shadow-intent-audit-event-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-intent-audit-event-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-private-shadow-intent-audit-event-validator-fixtures] readyForPrivateShadowIntentAuditEventFixtureRegression=${parsed.readiness.readyForPrivateShadowIntentAuditEventFixtureRegression}`,
  );
}

main();

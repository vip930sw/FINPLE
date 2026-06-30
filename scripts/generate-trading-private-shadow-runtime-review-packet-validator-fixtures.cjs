const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingPrivateShadowRuntimeReviewPacket,
} = require("./validate-trading-private-shadow-runtime-review-packet.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_review_packet_validator_fixtures.json",
);
const REVIEW_PACKET_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json",
);
const INTENT_AUDIT_EVENT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-private-shadow-runtime-review-packet.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-runtime-review-packet-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_REVIEW_PACKET_FIELDS = [
  "reviewPacketId",
  "mode",
  "operatorScopeHash",
  "approvalImportPreflightHash",
  "envRiskGateHash",
  "snapshotRiskInputHash",
  "orderIntentContractHash",
  "intentAuditEventContractHash",
  "riskGateClearanceHash",
  "dryRunReplayReferenceHash",
  "shadowHistoryReviewReferenceHash",
  "auditLoggerReadinessHash",
  "killSwitchStateHash",
  "manualApprovalPolicyHash",
  "createdAt",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "dbMigrationAllowed",
  "publicUiAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_operator_scope_hash",
  "live_guarded_mode",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "db_migration_flag_enabled",
  "public_ui_flag_enabled",
  "malformed_hash_field",
  "malformed_timestamp",
  "private_path_reference_present",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "raw_snapshot_value",
  "raw_payload_value",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
  "data/private",
  "data\\private",
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "50195326",
  "64408140",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "trading", "privateShadowRuntimeReviewPacket.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "runtimeReviewPacketImporter.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
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

function validSyntheticReviewPacket() {
  return {
    reviewPacketId: "review_fixture_shadow_001",
    mode: "shadow",
    operatorScopeHash: "hmac-sha256:fixture_operator_scope_hash_123456",
    approvalImportPreflightHash: "hmac-sha256:fixture_approval_preflight_hash_123456",
    envRiskGateHash: "hmac-sha256:fixture_env_risk_gate_hash_123456",
    snapshotRiskInputHash: "hmac-sha256:fixture_snapshot_risk_input_hash_123456",
    orderIntentContractHash: "hmac-sha256:fixture_order_intent_contract_hash_123456",
    intentAuditEventContractHash: "hmac-sha256:fixture_intent_audit_event_contract_hash_123456",
    riskGateClearanceHash: "hmac-sha256:fixture_risk_gate_clearance_hash_123456",
    dryRunReplayReferenceHash: "hmac-sha256:fixture_dry_run_replay_hash_123456",
    shadowHistoryReviewReferenceHash: "hmac-sha256:fixture_shadow_history_hash_123456",
    auditLoggerReadinessHash: "hmac-sha256:fixture_audit_logger_hash_123456",
    killSwitchStateHash: "hmac-sha256:fixture_kill_switch_hash_123456",
    manualApprovalPolicyHash: "hmac-sha256:fixture_manual_approval_policy_hash_123456",
    createdAt: "2026-06-29T00:00:00.000Z",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
}

function invalidSyntheticFixtures(basePacket) {
  return [
    { id: "missing_operator_scope_hash", expectedErrorCodes: ["missing_required_field"], packet: omitField(basePacket, "operatorScopeHash") },
    { id: "live_guarded_mode", expectedErrorCodes: ["invalid_mode"], packet: { ...basePacket, mode: "live_guarded" } },
    { id: "provider_call_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], packet: { ...basePacket, providerCallsAllowed: true } },
    { id: "order_submission_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], packet: { ...basePacket, orderSubmissionAllowed: true } },
    { id: "runtime_route_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], packet: { ...basePacket, runtimeRouteAllowed: true } },
    { id: "db_migration_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], packet: { ...basePacket, dbMigrationAllowed: true } },
    { id: "public_ui_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], packet: { ...basePacket, publicUiAllowed: true } },
    { id: "malformed_hash_field", expectedErrorCodes: ["malformed_hash_field"], packet: { ...basePacket, approvalImportPreflightHash: "not-a-labelled-hash" } },
    { id: "malformed_timestamp", expectedErrorCodes: ["malformed_timestamp"], packet: { ...basePacket, createdAt: "2026-06-29" } },
    {
      id: "private_path_reference_present",
      expectedErrorCodes: ["unknown_field"],
      packet: { ...basePacket, privatePathReferenceHash: "sha256:fixture_private_reference_hash_123456" },
    },
  ];
}

function fixtureValidationEvidence(validPacket, invalidFixtures) {
  const validResult = validateTradingPrivateShadowRuntimeReviewPacket(validPacket);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingPrivateShadowRuntimeReviewPacket(fixture.packet);
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
  const reviewPacketContract = readJson(REVIEW_PACKET_CONTRACT_PATH);
  const intentAuditEventValidatorFixtures = readJson(INTENT_AUDIT_EVENT_VALIDATOR_FIXTURES_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidReviewPacket = validSyntheticReviewPacket();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidReviewPacket);
  const validationEvidence = fixtureValidationEvidence(syntheticValidReviewPacket, syntheticInvalidFixtures);
  const validReviewPacketFields = Object.keys(syntheticValidReviewPacket);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredReviewPacketFields = missingValues(validReviewPacketFields, REQUIRED_REVIEW_PACKET_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidReviewPacket),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.packet)),
  ];
  const checks = {
    fixturesOnly: true,
    reviewPacketContractReady:
      reviewPacketContract.readiness?.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview === true &&
      reviewPacketContract.readiness?.privateShadowRuntimeReviewPacketImplementationAllowed === false &&
      reviewPacketContract.readiness?.providerCallsAllowed === false &&
      reviewPacketContract.readiness?.orderSubmissionAllowed === false &&
      reviewPacketContract.readiness?.runtimeRouteAllowed === false,
    intentAuditEventValidatorFixturesReady:
      intentAuditEventValidatorFixtures.readiness?.readyForPrivateShadowIntentAuditEventFixtureRegression === true &&
      intentAuditEventValidatorFixtures.readiness?.providerCallsAllowed === false &&
      intentAuditEventValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingPrivateShadowRuntimeReviewPacket") &&
      validatorSource.includes("packet_path_required") &&
      validatorSource.includes("--packet"),
    architectureDocMentionsRuntimeReviewPacketValidatorFixtures:
      architectureDoc.includes("Trading Private Shadow Runtime Review Packet Validator Fixtures") &&
      architectureDoc.includes("private_shadow_runtime_review_packet_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    validReviewPacketFieldsReady: missingRequiredReviewPacketFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeImplementationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForPrivateShadowRuntimeReviewPacketFixtureRegression =
    checks.reviewPacketContractReady &&
    checks.intentAuditEventValidatorFixturesReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsRuntimeReviewPacketValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.validReviewPacketFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3R",
    scope: "private_shadow_runtime_review_packet_validator_fixtures",
    sourceFiles: {
      reviewPacketContract: REVIEW_PACKET_CONTRACT_PATH,
      intentAuditEventValidatorFixtures: INTENT_AUDIT_EVENT_VALIDATOR_FIXTURES_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeImplementationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic private shadow runtime review-packet fixtures only; no real account number, app key, app secret, token, raw provider payload, raw order payload, private paths, runtime routes, DB migrations, or private approval packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepCreatesDbMigration: false,
      currentStepCreatesPublicUi: false,
      currentStepImplementsRuntime: false,
      validSyntheticReviewPacket: syntheticValidReviewPacket,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      reviewPacketContractStatus: reviewPacketContract.readiness?.status,
      intentAuditEventValidatorFixturesStatus: intentAuditEventValidatorFixtures.readiness?.status,
      validReviewPacketFields,
      missingRequiredReviewPacketFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForPrivateShadowRuntimeReviewPacketFixtureRegression
        ? "fixtures_ready_for_private_shadow_runtime_review_packet_validator_regression"
        : "blocked_before_private_shadow_runtime_review_packet_validator_fixture_regression",
      readyForPrivateShadowRuntimeReviewPacketFixtureRegression,
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeImplementationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.reviewPacketContractReady ? [] : ["private_shadow_runtime_review_packet_contract_not_ready"]),
        ...(checks.intentAuditEventValidatorFixturesReady
          ? []
          : ["private_shadow_intent_audit_event_validator_fixtures_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_private_shadow_runtime_review_packet_validator_not_ready"]),
        ...(checks.architectureDocMentionsRuntimeReviewPacketValidatorFixtures
          ? []
          : ["architecture_doc_missing_private_shadow_runtime_review_packet_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingRequiredReviewPacketFields.map((field) => `missing_required_review_packet_field_${field}`),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-runtime-review-packet-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-runtime-review-packet-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-private-shadow-runtime-review-packet-validator-fixtures] ok");
    console.log(`[generate-trading-private-shadow-runtime-review-packet-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-runtime-review-packet-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-private-shadow-runtime-review-packet-validator-fixtures] readyForPrivateShadowRuntimeReviewPacketFixtureRegression=${parsed.readiness.readyForPrivateShadowRuntimeReviewPacketFixtureRegression}`,
  );
}

main();

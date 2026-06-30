const fs = require("node:fs");
const path = require("node:path");
const {
  validateTradingPrivateShadowOperatorAccess,
} = require("./validate-trading-private-shadow-operator-access.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_validator_fixtures.json",
);
const OPERATOR_ACCESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
);
const RUNTIME_REVIEW_PACKET_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_review_packet_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-private-shadow-operator-access.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-operator-access-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_ACCESS_FIELDS = [
  "operatorAccessScopeId",
  "mode",
  "operatorIdHash",
  "roleHash",
  "authContextHash",
  "sessionIdHash",
  "sessionIssuedAt",
  "sessionExpiresAt",
  "allowedActionHashes",
  "deniedActionHashes",
  "approvalPolicyHash",
  "runtimeReviewPacketHash",
  "intentAuditEventHash",
  "killSwitchStateHash",
  "privateNetworkBoundaryHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_operator_id_hash",
  "live_guarded_mode",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "public_ui_flag_enabled",
  "empty_allowed_actions",
  "session_too_long",
  "malformed_hash_field",
  "private_path_reference_present",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_provider_payload",
  "raw_order_payload",
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
  path.join("server", "src", "services", "trading", "privateShadowOperatorAccess.js"),
  path.join("server", "src", "services", "trading", "operatorAccessAuthorizer.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
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

function validSyntheticAccess() {
  return {
    operatorAccessScopeId: "access_fixture_shadow_001",
    mode: "shadow",
    operatorIdHash: "hmac-sha256:fixture_operator_hash_123456",
    roleHash: "hmac-sha256:fixture_role_hash_123456",
    authContextHash: "hmac-sha256:fixture_auth_context_hash_123456",
    sessionIdHash: "hmac-sha256:fixture_session_hash_123456",
    sessionIssuedAt: "2026-06-29T00:00:00.000Z",
    sessionExpiresAt: "2026-06-29T00:30:00.000Z",
    allowedActionHashes: ["hmac-sha256:fixture_allowed_action_hash_123456"],
    deniedActionHashes: ["hmac-sha256:fixture_denied_order_submit_hash_123456"],
    approvalPolicyHash: "hmac-sha256:fixture_approval_policy_hash_123456",
    runtimeReviewPacketHash: "hmac-sha256:fixture_runtime_review_packet_hash_123456",
    intentAuditEventHash: "hmac-sha256:fixture_intent_audit_hash_123456",
    killSwitchStateHash: "hmac-sha256:fixture_kill_switch_hash_123456",
    privateNetworkBoundaryHash: "hmac-sha256:fixture_private_network_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
}

function invalidSyntheticFixtures(baseAccess) {
  return [
    { id: "missing_operator_id_hash", expectedErrorCodes: ["missing_required_field"], access: omitField(baseAccess, "operatorIdHash") },
    { id: "live_guarded_mode", expectedErrorCodes: ["invalid_mode"], access: { ...baseAccess, mode: "live_guarded" } },
    { id: "provider_call_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], access: { ...baseAccess, providerCallsAllowed: true } },
    { id: "order_submission_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], access: { ...baseAccess, orderSubmissionAllowed: true } },
    { id: "runtime_route_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], access: { ...baseAccess, runtimeRouteAllowed: true } },
    { id: "public_ui_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], access: { ...baseAccess, publicUiAllowed: true } },
    { id: "empty_allowed_actions", expectedErrorCodes: ["hash_array_empty"], access: { ...baseAccess, allowedActionHashes: [] } },
    {
      id: "session_too_long",
      expectedErrorCodes: ["session_too_long"],
      access: { ...baseAccess, sessionExpiresAt: "2026-06-29T02:00:00.000Z" },
    },
    { id: "malformed_hash_field", expectedErrorCodes: ["malformed_hash_field"], access: { ...baseAccess, authContextHash: "not-a-labelled-hash" } },
    {
      id: "private_path_reference_present",
      expectedErrorCodes: ["unknown_field"],
      access: { ...baseAccess, privatePathReferenceHash: "sha256:fixture_private_reference_hash_123456" },
    },
  ];
}

function fixtureValidationEvidence(validAccess, invalidFixtures) {
  const validResult = validateTradingPrivateShadowOperatorAccess(validAccess);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateTradingPrivateShadowOperatorAccess(fixture.access);
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
  const operatorAccessContract = readJson(OPERATOR_ACCESS_CONTRACT_PATH);
  const runtimeReviewPacketValidatorFixtures = readJson(RUNTIME_REVIEW_PACKET_VALIDATOR_FIXTURES_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidAccess = validSyntheticAccess();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidAccess);
  const validationEvidence = fixtureValidationEvidence(syntheticValidAccess, syntheticInvalidFixtures);
  const validAccessFields = Object.keys(syntheticValidAccess);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredAccessFields = missingValues(validAccessFields, REQUIRED_ACCESS_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidAccess),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.access)),
  ];
  const checks = {
    fixturesOnly: true,
    operatorAccessContractReady:
      operatorAccessContract.readiness?.readyForFuturePrivateShadowOperatorAccessImplementationReview === true &&
      operatorAccessContract.readiness?.privateShadowOperatorAccessImplementationAllowed === false &&
      operatorAccessContract.readiness?.providerCallsAllowed === false &&
      operatorAccessContract.readiness?.orderSubmissionAllowed === false &&
      operatorAccessContract.readiness?.runtimeRouteAllowed === false,
    runtimeReviewPacketValidatorFixturesReady:
      runtimeReviewPacketValidatorFixtures.readiness?.readyForPrivateShadowRuntimeReviewPacketFixtureRegression === true &&
      runtimeReviewPacketValidatorFixtures.readiness?.providerCallsAllowed === false &&
      runtimeReviewPacketValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateTradingPrivateShadowOperatorAccess") &&
      validatorSource.includes("access_path_required") &&
      validatorSource.includes("--access"),
    architectureDocMentionsOperatorAccessValidatorFixtures:
      architectureDoc.includes("Trading Private Shadow Operator Access Validator Fixtures") &&
      architectureDoc.includes("private_shadow_operator_access_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    validAccessFieldsReady: missingRequiredAccessFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    authImplementationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForPrivateShadowOperatorAccessFixtureRegression =
    checks.operatorAccessContractReady &&
    checks.runtimeReviewPacketValidatorFixturesReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsOperatorAccessValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.validAccessFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3S",
    scope: "private_shadow_operator_access_validator_fixtures",
    sourceFiles: {
      operatorAccessContract: OPERATOR_ACCESS_CONTRACT_PATH,
      runtimeReviewPacketValidatorFixtures: RUNTIME_REVIEW_PACKET_VALIDATOR_FIXTURES_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      authImplementationAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic private shadow operator-access fixtures only; no real operator identifier, account number, app key, app secret, token, raw session token, private path, provider payload, order payload, or approval packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepCreatesPublicUi: false,
      currentStepImplementsAuth: false,
      validSyntheticAccess: syntheticValidAccess,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      operatorAccessContractStatus: operatorAccessContract.readiness?.status,
      runtimeReviewPacketValidatorFixturesStatus: runtimeReviewPacketValidatorFixtures.readiness?.status,
      validAccessFields,
      missingRequiredAccessFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForPrivateShadowOperatorAccessFixtureRegression
        ? "fixtures_ready_for_private_shadow_operator_access_validator_regression"
        : "blocked_before_private_shadow_operator_access_validator_fixture_regression",
      readyForPrivateShadowOperatorAccessFixtureRegression,
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      authImplementationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.operatorAccessContractReady ? [] : ["private_shadow_operator_access_contract_not_ready"]),
        ...(checks.runtimeReviewPacketValidatorFixturesReady
          ? []
          : ["private_shadow_runtime_review_packet_validator_fixtures_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_private_shadow_operator_access_validator_not_ready"]),
        ...(checks.architectureDocMentionsOperatorAccessValidatorFixtures
          ? []
          : ["architecture_doc_missing_private_shadow_operator_access_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingRequiredAccessFields.map((field) => `missing_required_access_field_${field}`),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-operator-access-validator-fixtures.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-operator-access-validator-fixtures.cjs`);
    }
    console.log("[generate-trading-private-shadow-operator-access-validator-fixtures] ok");
    console.log(`[generate-trading-private-shadow-operator-access-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-operator-access-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-private-shadow-operator-access-validator-fixtures] readyForPrivateShadowOperatorAccessFixtureRegression=${parsed.readiness.readyForPrivateShadowOperatorAccessFixtureRegression}`,
  );
}

main();

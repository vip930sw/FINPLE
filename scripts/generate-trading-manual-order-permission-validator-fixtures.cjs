const fs = require("node:fs");
const path = require("node:path");
const { validateManualOrderPermission } = require("./validate-trading-manual-order-permission.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
);
const PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const OPERATOR_ACCESS_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_validator_fixtures.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const NOW = "2026-06-29T00:00:00.000Z";
const REQUIRED_PERMISSION_FIELDS = [
  "permissionId",
  "mode",
  "approvedByHash",
  "approvedAt",
  "expiresAt",
  "operatorAccessHash",
  "manualApprovalPolicyHash",
  "orderAdapterDesignReviewHash",
  "killSwitchClearanceHash",
  "riskGateClearanceHash",
  "orderCredentialBoundaryHash",
  "dryRunReplayHash",
  "shadowHistoryReviewHash",
  "auditLoggerReadinessHash",
  "allowedSymbolHashes",
  "maxOrderNotional",
  "dailyLossLimit",
  "orderAttemptLimit",
  "revocationPlanHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_approved_by_hash",
  "shadow_mode",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "empty_symbol_hashes",
  "expired_permission",
  "permission_window_too_long",
  "numeric_limit_too_high",
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
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
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

function validSyntheticPermission() {
  return {
    permissionId: "permission_fixture_live_001",
    mode: "live_guarded",
    approvedByHash: "hmac-sha256:fixture_approved_by_hash_123456",
    approvedAt: "2026-06-29T00:00:00.000Z",
    expiresAt: "2026-06-29T01:00:00.000Z",
    operatorAccessHash: "hmac-sha256:fixture_operator_access_hash_123456",
    manualApprovalPolicyHash: "hmac-sha256:fixture_manual_policy_hash_123456",
    orderAdapterDesignReviewHash: "hmac-sha256:fixture_adapter_review_hash_123456",
    killSwitchClearanceHash: "hmac-sha256:fixture_kill_switch_clear_hash_123456",
    riskGateClearanceHash: "hmac-sha256:fixture_risk_gate_clear_hash_123456",
    orderCredentialBoundaryHash: "hmac-sha256:fixture_credential_boundary_hash_123456",
    dryRunReplayHash: "hmac-sha256:fixture_dry_run_replay_hash_123456",
    shadowHistoryReviewHash: "hmac-sha256:fixture_shadow_history_hash_123456",
    auditLoggerReadinessHash: "hmac-sha256:fixture_audit_logger_hash_123456",
    allowedSymbolHashes: ["hmac-sha256:fixture_allowed_symbol_hash_123456"],
    maxOrderNotional: 100000,
    dailyLossLimit: 10000,
    orderAttemptLimit: 3,
    revocationPlanHash: "hmac-sha256:fixture_revocation_plan_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
}

function invalidSyntheticFixtures(basePermission) {
  return [
    { id: "missing_approved_by_hash", expectedErrorCodes: ["missing_required_field"], permission: omitField(basePermission, "approvedByHash") },
    { id: "shadow_mode", expectedErrorCodes: ["invalid_mode"], permission: { ...basePermission, mode: "shadow" } },
    { id: "provider_call_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], permission: { ...basePermission, providerCallsAllowed: true } },
    { id: "order_submission_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], permission: { ...basePermission, orderSubmissionAllowed: true } },
    { id: "runtime_route_flag_enabled", expectedErrorCodes: ["allow_flag_enabled"], permission: { ...basePermission, runtimeRouteAllowed: true } },
    { id: "empty_symbol_hashes", expectedErrorCodes: ["hash_array_empty"], permission: { ...basePermission, allowedSymbolHashes: [] } },
    {
      id: "expired_permission",
      expectedErrorCodes: ["expired_permission"],
      permission: { ...basePermission, approvedAt: "2026-06-28T00:00:00.000Z", expiresAt: "2026-06-28T01:00:00.000Z" },
    },
    {
      id: "permission_window_too_long",
      expectedErrorCodes: ["permission_window_too_long"],
      permission: { ...basePermission, expiresAt: "2026-06-30T01:00:00.000Z" },
    },
    { id: "numeric_limit_too_high", expectedErrorCodes: ["numeric_limit_too_high"], permission: { ...basePermission, maxOrderNotional: 100000001 } },
    {
      id: "private_path_reference_present",
      expectedErrorCodes: ["unknown_field"],
      permission: { ...basePermission, privatePathReferenceHash: "sha256:fixture_private_reference_hash_123456" },
    },
  ];
}

function fixtureValidationEvidence(validPermission, invalidFixtures) {
  const validResult = validateManualOrderPermission(validPermission, { now: NOW });
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermission(fixture.permission, { now: NOW });
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
  const permissionPreflight = readJson(PERMISSION_PREFLIGHT_PATH);
  const operatorAccessValidatorFixtures = readJson(OPERATOR_ACCESS_VALIDATOR_FIXTURES_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidPermission = validSyntheticPermission();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidPermission);
  const validationEvidence = fixtureValidationEvidence(syntheticValidPermission, syntheticInvalidFixtures);
  const validPermissionFields = Object.keys(syntheticValidPermission);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingRequiredPermissionFields = missingValues(validPermissionFields, REQUIRED_PERMISSION_FIELDS);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidPermission),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.permission)),
  ];
  const checks = {
    fixturesOnly: true,
    permissionPreflightReady:
      permissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      permissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      permissionPreflight.readiness?.manualOrderPermissionImportImplementationAllowed === false &&
      permissionPreflight.readiness?.providerCallsAllowed === false &&
      permissionPreflight.readiness?.orderSubmissionAllowed === false &&
      permissionPreflight.readiness?.runtimeRouteAllowed === false,
    operatorAccessValidatorFixturesReady:
      operatorAccessValidatorFixtures.readiness?.readyForPrivateShadowOperatorAccessFixtureRegression === true &&
      operatorAccessValidatorFixtures.readiness?.providerCallsAllowed === false &&
      operatorAccessValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermission") &&
      validatorSource.includes("permission_path_required") &&
      validatorSource.includes("--permission"),
    architectureDocMentionsManualOrderPermissionValidatorFixtures:
      architectureDoc.includes("Trading Manual Order Permission Validator Fixtures") &&
      architectureDoc.includes("manual_order_permission_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    validPermissionFieldsReady: missingRequiredPermissionFields.length === 0,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    permissionImportAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForManualOrderPermissionFixtureRegression =
    checks.permissionPreflightReady &&
    checks.operatorAccessValidatorFixturesReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsManualOrderPermissionValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.validPermissionFieldsReady &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3T",
    scope: "manual_order_permission_validator_fixtures",
    sourceFiles: {
      permissionPreflight: PERMISSION_PREFLIGHT_PATH,
      operatorAccessValidatorFixtures: OPERATOR_ACCESS_VALIDATOR_FIXTURES_PATH,
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
      permissionImportAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic manual order permission fixtures only; no raw operator identifier, account number, app key, app secret, token, private path, provider payload, order payload, execution content, or approval packet content",
      validatorPath: VALIDATOR_PATH,
      validatorNow: NOW,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepImportsPermission: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepCreatesPublicUi: false,
      validSyntheticPermission: syntheticValidPermission,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      permissionPreflightStatus: permissionPreflight.readiness?.status,
      operatorAccessValidatorFixturesStatus: operatorAccessValidatorFixtures.readiness?.status,
      validPermissionFields,
      missingRequiredPermissionFields,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForManualOrderPermissionFixtureRegression
        ? "fixtures_ready_for_manual_order_permission_validator_regression"
        : "blocked_before_manual_order_permission_validator_fixture_regression",
      readyForManualOrderPermissionFixtureRegression,
      fixturesOnly: true,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      permissionImportAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.permissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.operatorAccessValidatorFixturesReady
          ? []
          : ["private_shadow_operator_access_validator_fixtures_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_manual_order_permission_validator_not_ready"]),
        ...(checks.architectureDocMentionsManualOrderPermissionValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingRequiredPermissionFields.map((field) => `missing_required_permission_field_${field}`),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-validator-fixtures.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-validator-fixtures.cjs`);
    }
    console.log("[generate-trading-manual-order-permission-validator-fixtures] ok");
    console.log(`[generate-trading-manual-order-permission-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-validator-fixtures] readyForManualOrderPermissionFixtureRegression=${parsed.readiness.readyForManualOrderPermissionFixtureRegression}`,
  );
}

main();

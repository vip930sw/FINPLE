const fs = require("node:fs");
const path = require("node:path");
const {
  validateManualOrderPermissionPacket,
} = require("./validate-trading-manual-order-permission-packet.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
);
const TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-packet-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const VALIDATION_NOW = "2026-06-29T00:00:00.000Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_required_field",
  "unknown_field",
  "malformed_hash_field",
  "empty_allowed_symbol_hashes",
  "malformed_symbol_hash",
  "expired_permission",
  "invalid_mode",
  "invalid_time_window",
  "invalid_numeric_limit",
  "invalid_order_attempt_limit",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "public_ui_flag_enabled",
  "forbidden_secret_value",
];
const FORBIDDEN_SYNTHETIC_PACKET_CONTENT = [
  "full_account_number",
  "raw_account_identifier",
  "app_secret",
  "app_key",
  "access_token",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
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

function omitField(packet, field) {
  const next = clone(packet);
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

function packetContainsForbiddenContent(packet) {
  const serialized = JSON.stringify(packet);
  return FORBIDDEN_SYNTHETIC_PACKET_CONTENT.filter((token) => serialized.includes(token));
}

function validSyntheticManualOrderPermissionPacket() {
  return {
    permissionId: "permission_fixture_valid_001",
    mode: "live_guarded",
    approvedByHash: "hmac-sha256:fixture_operator_hash_123456",
    approvedAt: "2026-06-29T00:00:00.000Z",
    expiresAt: "2026-07-29T00:00:00.000Z",
    operatorAccessHash: "hmac-sha256:fixture_operator_access_hash_123456",
    manualApprovalPolicyHash: "hmac-sha256:fixture_manual_policy_hash_123456",
    orderAdapterDesignReviewHash: "hmac-sha256:fixture_order_adapter_review_hash_123456",
    killSwitchClearanceHash: "hmac-sha256:fixture_kill_switch_hash_123456",
    riskGateClearanceHash: "hmac-sha256:fixture_risk_gate_hash_123456",
    orderCredentialBoundaryHash: "hmac-sha256:fixture_order_credential_hash_123456",
    dryRunReplayHash: "hmac-sha256:fixture_dry_run_hash_123456",
    shadowHistoryReviewHash: "hmac-sha256:fixture_shadow_history_hash_123456",
    auditLoggerReadinessHash: "hmac-sha256:fixture_audit_logger_hash_123456",
    allowedSymbolHashes: ["hmac-sha256:fixture_symbol_hash_123456"],
    maxOrderNotional: 100000,
    dailyLossLimit: 10000,
    orderAttemptLimit: 3,
    revocationPlanHash: "hmac-sha256:fixture_revocation_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
}

function invalidSyntheticFixtures(basePacket) {
  return [
    { id: "missing_required_field", expectedErrorCodes: ["missing_required_field"], packet: omitField(basePacket, "revocationPlanHash") },
    { id: "unknown_field", expectedErrorCodes: ["unknown_field"], packet: { ...basePacket, unexpected: "redacted_fixture_value" } },
    { id: "malformed_hash_field", expectedErrorCodes: ["malformed_hash_field"], packet: { ...basePacket, operatorAccessHash: "not-a-labelled-hash" } },
    { id: "empty_allowed_symbol_hashes", expectedErrorCodes: ["allowed_symbol_hashes_required"], packet: { ...basePacket, allowedSymbolHashes: [] } },
    { id: "malformed_symbol_hash", expectedErrorCodes: ["malformed_symbol_hash"], packet: { ...basePacket, allowedSymbolHashes: ["not-a-labelled-hash"] } },
    { id: "expired_permission", expectedErrorCodes: ["expired_permission"], packet: { ...basePacket, expiresAt: "2026-06-28T00:00:00.000Z" } },
    { id: "invalid_mode", expectedErrorCodes: ["invalid_mode"], packet: { ...basePacket, mode: "paper" } },
    {
      id: "invalid_time_window",
      expectedErrorCodes: ["invalid_time_window"],
      packet: { ...basePacket, approvedAt: "2026-07-29T00:00:00.000Z", expiresAt: "2026-07-01T00:00:00.000Z" },
    },
    {
      id: "invalid_numeric_limit",
      expectedErrorCodes: ["invalid_numeric_limit"],
      packet: { ...basePacket, maxOrderNotional: 0, dailyLossLimit: -1 },
    },
    {
      id: "invalid_order_attempt_limit",
      expectedErrorCodes: ["invalid_order_attempt_limit"],
      packet: { ...basePacket, orderAttemptLimit: 1.5 },
    },
    { id: "provider_call_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], packet: { ...basePacket, providerCallsAllowed: true } },
    { id: "order_submission_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], packet: { ...basePacket, orderSubmissionAllowed: true } },
    { id: "runtime_route_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], packet: { ...basePacket, runtimeRouteAllowed: true } },
    { id: "public_ui_flag_enabled", expectedErrorCodes: ["forbidden_flag_enabled"], packet: { ...basePacket, publicUiAllowed: true } },
    {
      id: "forbidden_secret_value",
      expectedErrorCodes: ["forbidden_string_value"],
      packet: { ...basePacket, revocationPlanHash: "hmac-sha256:APP_SECRET_VALUE" },
    },
  ];
}

function fixtureValidationEvidence(validPacket, invalidFixtures) {
  const validResult = validateManualOrderPermissionPacket(validPacket, { now: VALIDATION_NOW });
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermissionPacket(fixture.packet, { now: VALIDATION_NOW });
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
  const template = readJson(TEMPLATE_PATH);
  const importPreflight = readJson(IMPORT_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidPacket = validSyntheticManualOrderPermissionPacket();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidPacket);
  const validationEvidence = fixtureValidationEvidence(syntheticValidPacket, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenSyntheticPacketContent = [
    ...packetContainsForbiddenContent(syntheticValidPacket),
    ...syntheticInvalidFixtures.flatMap((fixture) => packetContainsForbiddenContent(fixture.packet)),
  ];
  const checks = {
    fixturesOnly: true,
    templateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.providerCallsAllowed === false &&
      template.readiness?.orderSubmissionAllowed === false,
    importImplementationPreflightStillBlocked:
      importPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importPreflight.readiness?.importImplementationAllowedNow === false &&
      importPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importPreflight.readiness?.permissionPacketImportedNow === false &&
      importPreflight.readiness?.providerCallsAllowed === false &&
      importPreflight.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermissionPacket") &&
      validatorSource.includes("packet_path_required") &&
      validatorSource.includes("--packet"),
    architectureDocMentionsPacketValidatorFixtures:
      architectureDoc.includes("Trading Manual Order Permission Packet Validator Fixtures") &&
      architectureDoc.includes("manual_order_permission_packet_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenSyntheticPacketContent: forbiddenSyntheticPacketContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForManualOrderPermissionPacketValidatorRegression =
    checks.templateReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsPacketValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenSyntheticPacketContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4I",
    scope: "manual_order_permission_packet_validator_fixtures",
    sourceFiles: {
      redactedManualOrderPermissionTemplate: TEMPLATE_PATH,
      importImplementationPreflight: IMPORT_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic manual-order-permission packet fixtures only; no real operator, account, credential, order, provider payload, token, app key, app secret, private packet, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validationNow: VALIDATION_NOW,
      validSyntheticManualOrderPermissionPacket: syntheticValidPacket,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      templateStatus: template.readiness?.status,
      importImplementationPreflightStatus: importPreflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenSyntheticPacketContent: [...new Set(forbiddenSyntheticPacketContent)],
    },
    readiness: {
      status: readyForManualOrderPermissionPacketValidatorRegression
        ? "fixtures_ready_for_manual_order_permission_packet_validator_regression"
        : "blocked_before_manual_order_permission_packet_validator_fixture_regression",
      readyForManualOrderPermissionPacketValidatorRegression,
      fixturesOnly: true,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.templateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_not_blocked"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsPacketValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_packet_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...missingInvalidFixtureIds.map((id) => `missing_invalid_fixture_${id}`),
        ...(checks.noForbiddenSyntheticPacketContent ? [] : ["synthetic_packet_contains_forbidden_content"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-packet-validator-fixtures.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-packet-validator-fixtures.cjs`);
    }
    console.log("[generate-trading-manual-order-permission-packet-validator-fixtures] ok");
    console.log(`[generate-trading-manual-order-permission-packet-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-packet-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-packet-validator-fixtures] readyForManualOrderPermissionPacketValidatorRegression=${parsed.readiness.readyForManualOrderPermissionPacketValidatorRegression}`,
  );
}

main();

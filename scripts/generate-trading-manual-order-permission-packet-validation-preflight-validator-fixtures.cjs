const fs = require("node:fs");
const path = require("node:path");
const {
  validateManualOrderPermissionPacketValidationPreflight,
} = require("./validate-trading-manual-order-permission-packet-validation-preflight.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight_validator_fixtures.json",
);
const PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-packet-validation-preflight.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-packet-validation-preflight-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "private_packet_read_enabled",
  "validator_run_enabled",
  "permission_packet_import_enabled",
  "missing_preflight_gate",
  "missing_validation_rule",
  "missing_forbidden_preflight_content",
  "changed_future_paths",
  "owner_packet_read_flag_enabled",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "numeric_raw_value_shape_injected",
  "field_must_be_array",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  ["KIS", "TRADING", "APP", "KEY"].join("_"),
  ["KIS", "TRADING", "APP", "SECRET"].join("_"),
  `APP ${"Secret"}`,
  `APP ${"Key"}`,
  "access_token_value",
  "raw_account_identifier_value",
  "raw_operator_identifier_value",
  "raw_order_payload_value",
  "raw_provider_payload_value",
  "order_confirmation_value",
  "execution_id_value",
  "fill_payload_value",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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

function omitField(value, field) {
  const next = clone(value);
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

function withBoundary(baseContract, patch) {
  return {
    ...baseContract,
    futureOwnerAssistedValidationBoundary: {
      ...baseContract.futureOwnerAssistedValidationBoundary,
      ...patch,
    },
  };
}

function invalidSyntheticFixtures(baseContract) {
  return [
    {
      id: "missing_output_files",
      expectedErrorCodes: ["missing_required_field"],
      contract: omitField(baseContract, "outputFiles"),
    },
    {
      id: "private_packet_read_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepReadsPrivatePacket: true }),
    },
    {
      id: "validator_run_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepRunsValidator: true }),
    },
    {
      id: "permission_packet_import_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepImportsPacket: true }),
    },
    {
      id: "missing_preflight_gate",
      expectedErrorCodes: ["missing_preflight_gate"],
      contract: withBoundary(baseContract, {
        preflightGates: baseContract.futureOwnerAssistedValidationBoundary.preflightGates.filter(
          (gate) => gate !== "env_risk_gate_fail_closed",
        ),
      }),
    },
    {
      id: "missing_validation_rule",
      expectedErrorCodes: ["missing_validation_rule"],
      contract: withBoundary(baseContract, {
        validationRules: baseContract.futureOwnerAssistedValidationBoundary.validationRules.filter(
          (rule) => rule !== "validation_success_does_not_import_packet",
        ),
      }),
    },
    {
      id: "missing_forbidden_preflight_content",
      expectedErrorCodes: ["missing_forbidden_preflight_content"],
      contract: withBoundary(baseContract, {
        forbiddenPreflightContent:
          baseContract.futureOwnerAssistedValidationBoundary.forbiddenPreflightContent.filter(
            (item) => item !== "live_order_endpoint",
          ),
      }),
    },
    {
      id: "changed_future_paths",
      expectedErrorCodes: ["invalid_future_permission_packet_path", "invalid_future_validator_path"],
      contract: withBoundary(baseContract, {
        futurePermissionPacketPath: "data/private/trading/live_order_permission.json",
        futureValidatorPath: "scripts/validate-live-order-permission-packet.cjs",
      }),
    },
    {
      id: "owner_packet_read_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, ownerPacketReadAllowedNow: true },
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, providerCallsAllowed: true },
      },
    },
    {
      id: "order_submission_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        readiness: { ...baseContract.readiness, orderSubmissionAllowed: true },
      },
    },
    {
      id: "runtime_route_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        checks: { ...baseContract.checks, runtimeRouteAllowed: true },
      },
    },
    {
      id: "numeric_raw_value_shape_injected",
      expectedErrorCodes: ["forbidden_raw_value"],
      contract: {
        ...baseContract,
        evidence: {
          ...baseContract.evidence,
          syntheticNumericValueShape: "1234567890",
        },
      },
    },
    {
      id: "field_must_be_array",
      expectedErrorCodes: ["field_must_be_array"],
      contract: withBoundary(baseContract, { preflightGates: "not-an-array" }),
    },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateManualOrderPermissionPacketValidationPreflight(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermissionPacketValidationPreflight(fixture.contract);
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
  const preflight = readJson(PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidPreflight = clone(preflight);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidPreflight);
  const validationEvidence = fixtureValidationEvidence(syntheticValidPreflight, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidPreflight),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    packetValidationPreflightReady:
      preflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      preflight.readiness?.currentStepRunsValidator === false &&
      preflight.readiness?.ownerPacketReadAllowedNow === false &&
      preflight.readiness?.permissionPacketImportedNow === false &&
      preflight.readiness?.providerCallsAllowed === false &&
      preflight.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermissionPacketValidationPreflight") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Manual Order Permission Packet Validation Preflight Validator Fixtures") &&
      architectureDoc.includes("manual_order_permission_packet_validation_preflight_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepRunsValidator: false,
    ownerPacketReadAllowedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForManualOrderPermissionPacketValidationPreflightValidatorRegression =
    checks.packetValidationPreflightReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsValidatorFixtures &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.invalidFixtureCatalogReady &&
    checks.noForbiddenFixtureContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4AG",
    scope: "manual_order_permission_packet_validation_preflight_validator_fixtures",
    sourceFiles: {
      manualOrderPermissionPacketValidationPreflight: PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      currentStepRunsValidator: false,
      ownerPacketReadAllowedNow: false,
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
        "synthetic manual-order-permission packet validation preflight fixtures only; no real private packet, account, operator, credential, provider payload, order payload, token, app key, app secret, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      currentStepImportsPacket: false,
      validSyntheticPacketValidationPreflight: syntheticValidPreflight,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      packetValidationPreflightStatus: preflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForManualOrderPermissionPacketValidationPreflightValidatorRegression
        ? "fixtures_ready_for_manual_order_permission_packet_validation_preflight_validator_regression"
        : "blocked_before_manual_order_permission_packet_validation_preflight_validator_fixture_regression",
      readyForManualOrderPermissionPacketValidationPreflightValidatorRegression,
      fixturesOnly: true,
      currentStepRunsValidator: false,
      ownerPacketReadAllowedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.packetValidationPreflightReady
          ? []
          : ["manual_order_permission_packet_validation_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_packet_validation_preflight_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-packet-validation-preflight-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-packet-validation-preflight-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-packet-validation-preflight-validator-fixtures] ok");
    console.log(
      `[generate-trading-manual-order-permission-packet-validation-preflight-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-packet-validation-preflight-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-packet-validation-preflight-validator-fixtures] readyForManualOrderPermissionPacketValidationPreflightValidatorRegression=${parsed.readiness.readyForManualOrderPermissionPacketValidationPreflightValidatorRegression}`,
  );
}

main();

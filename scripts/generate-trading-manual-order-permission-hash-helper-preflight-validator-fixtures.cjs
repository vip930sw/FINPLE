const fs = require("node:fs");
const path = require("node:path");
const {
  validateManualOrderPermissionHashHelperPreflight,
} = require("./validate-trading-manual-order-permission-hash-helper-preflight.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight_validator_fixtures.json",
);
const HASH_HELPER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-hash-helper-preflight.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-hash-helper-preflight-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "raw_input_request_enabled",
  "private_pepper_request_enabled",
  "hash_helper_implementation_enabled",
  "hash_generation_enabled",
  "permission_packet_creation_enabled",
  "missing_preflight_check",
  "missing_future_review_input",
  "missing_forbidden_preflight_content",
  "changed_future_paths",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "numeric_raw_value_shape_injected",
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
  path.join("scripts", "create-trading-manual-order-permission-hashes.cjs"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
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
    futureOwnerAssistedManualOrderHashPreparationBoundary: {
      ...baseContract.futureOwnerAssistedManualOrderHashPreparationBoundary,
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
      id: "raw_input_request_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepRequestsRawInputs: true }),
    },
    {
      id: "private_pepper_request_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepRequestsPrivatePepper: true }),
    },
    {
      id: "hash_helper_implementation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepImplementsHashHelper: true }),
    },
    {
      id: "hash_generation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepGeneratesHashes: true }),
    },
    {
      id: "permission_packet_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepCreatesPermissionPacket: true }),
    },
    {
      id: "missing_preflight_check",
      expectedErrorCodes: ["missing_preflight_check"],
      contract: withBoundary(baseContract, {
        preflightChecks:
          baseContract.futureOwnerAssistedManualOrderHashPreparationBoundary.preflightChecks.filter(
            (check) => check !== "runtime_routes_remain_disabled",
          ),
      }),
    },
    {
      id: "missing_future_review_input",
      expectedErrorCodes: ["missing_future_review_input"],
      contract: withBoundary(baseContract, {
        futureReviewInputs:
          baseContract.futureOwnerAssistedManualOrderHashPreparationBoundary.futureReviewInputs.filter(
            (input) => input !== "manual_review_before_permission_packet_import",
          ),
      }),
    },
    {
      id: "missing_forbidden_preflight_content",
      expectedErrorCodes: ["missing_forbidden_preflight_content"],
      contract: withBoundary(baseContract, {
        forbiddenPreflightContent:
          baseContract.futureOwnerAssistedManualOrderHashPreparationBoundary.forbiddenPreflightContent.filter(
            (item) => item !== "live_order_endpoint",
          ),
      }),
    },
    {
      id: "changed_future_paths",
      expectedErrorCodes: ["invalid_future_hash_helper_path", "invalid_future_permission_packet_path"],
      contract: withBoundary(baseContract, {
        futureHashHelperPath: "scripts/create-live-order-hashes.cjs",
        futurePermissionPacketPath: "data/private/trading/live_order_permission.json",
      }),
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
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateManualOrderPermissionHashHelperPreflight(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermissionHashHelperPreflight(fixture.contract);
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
  const hashHelperPreflight = readJson(HASH_HELPER_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidHashHelperPreflight = clone(hashHelperPreflight);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidHashHelperPreflight);
  const validationEvidence = fixtureValidationEvidence(syntheticValidHashHelperPreflight, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidHashHelperPreflight),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    hashHelperPreflightReady:
      hashHelperPreflight.readiness?.readyForOwnerAssistedManualOrderHashPreparationLater === true &&
      hashHelperPreflight.readiness?.hashHelperImplementationAllowed === false &&
      hashHelperPreflight.readiness?.hashGenerationAllowed === false &&
      hashHelperPreflight.readiness?.permissionPacketCreatedNow === false &&
      hashHelperPreflight.readiness?.permissionPacketImportedNow === false &&
      hashHelperPreflight.readiness?.providerCallsAllowed === false &&
      hashHelperPreflight.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermissionHashHelperPreflight") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Manual Order Permission Hash Helper Preflight Validator Fixtures") &&
      architectureDoc.includes("manual_order_permission_hash_helper_preflight_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    hashHelperImplementationAllowed: false,
    hashGenerationAllowed: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForManualOrderPermissionHashHelperPreflightValidatorRegression =
    checks.hashHelperPreflightReady &&
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
    step: "Step 116-4AE",
    scope: "manual_order_permission_hash_helper_preflight_validator_fixtures",
    sourceFiles: {
      manualOrderPermissionHashHelperPreflight: HASH_HELPER_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
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
        "synthetic manual-order-permission hash-helper preflight fixtures only; no real account, operator, session, provider, order, app key, app secret, token, private packet, hash output, pepper, or provider payload content",
      validatorPath: VALIDATOR_PATH,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      currentStepImplementsHashHelper: false,
      currentStepGeneratesHashes: false,
      currentStepCreatesPermissionPacket: false,
      validSyntheticHashHelperPreflight: syntheticValidHashHelperPreflight,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      hashHelperPreflightStatus: hashHelperPreflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForManualOrderPermissionHashHelperPreflightValidatorRegression
        ? "fixtures_ready_for_manual_order_permission_hash_helper_preflight_validator_regression"
        : "blocked_before_manual_order_permission_hash_helper_preflight_validator_fixture_regression",
      readyForManualOrderPermissionHashHelperPreflightValidatorRegression,
      fixturesOnly: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.hashHelperPreflightReady ? [] : ["manual_order_permission_hash_helper_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_helper_preflight_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-helper-preflight-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-helper-preflight-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-helper-preflight-validator-fixtures] ok");
    console.log(
      `[generate-trading-manual-order-permission-hash-helper-preflight-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-helper-preflight-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-helper-preflight-validator-fixtures] readyForManualOrderPermissionHashHelperPreflightValidatorRegression=${parsed.readiness.readyForManualOrderPermissionHashHelperPreflightValidatorRegression}`,
  );
}

main();

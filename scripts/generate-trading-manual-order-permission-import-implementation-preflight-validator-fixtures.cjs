const fs = require("node:fs");
const path = require("node:path");
const {
  validateManualOrderPermissionImportImplementationPreflight,
} = require("./validate-trading-manual-order-permission-import-implementation-preflight.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight_validator_fixtures.json",
);
const IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-import-implementation-preflight.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-import-implementation-preflight-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "private_packet_read_enabled",
  "private_packet_write_enabled",
  "permission_packet_import_enabled",
  "hash_generation_enabled",
  "provider_call_enabled",
  "order_submission_enabled",
  "order_adapter_implementation_enabled",
  "runtime_route_creation_enabled",
  "database_write_enabled",
  "missing_review_gate",
  "missing_implementation_rule",
  "missing_forbidden_preflight_content",
  "changed_future_paths",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "numeric_raw_value_shape_injected",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "APP Secret",
  "APP Key",
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
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
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
    futureManualOrderPermissionImportImplementationBoundary: {
      ...baseContract.futureManualOrderPermissionImportImplementationBoundary,
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
      id: "private_packet_write_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepWritesPrivatePacket: true }),
    },
    {
      id: "permission_packet_import_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepImportsPacket: true }),
    },
    {
      id: "hash_generation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepGeneratesHashes: true }),
    },
    {
      id: "provider_call_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepCallsProvider: true }),
    },
    {
      id: "order_submission_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepSubmitsOrder: true }),
    },
    {
      id: "order_adapter_implementation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepImplementsOrderAdapter: true }),
    },
    {
      id: "runtime_route_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepCreatesRuntimeRoute: true }),
    },
    {
      id: "database_write_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepWritesDatabase: true }),
    },
    {
      id: "missing_review_gate",
      expectedErrorCodes: ["missing_review_gate"],
      contract: withBoundary(baseContract, {
        reviewGates: baseContract.futureManualOrderPermissionImportImplementationBoundary.reviewGates.filter(
          (gate) => gate !== "env_risk_gate_fail_closed",
        ),
      }),
    },
    {
      id: "missing_implementation_rule",
      expectedErrorCodes: ["missing_implementation_rule"],
      contract: withBoundary(baseContract, {
        implementationRules:
          baseContract.futureManualOrderPermissionImportImplementationBoundary.implementationRules.filter(
            (rule) => rule !== "no_order_submission",
          ),
      }),
    },
    {
      id: "missing_forbidden_preflight_content",
      expectedErrorCodes: ["missing_forbidden_preflight_content"],
      contract: withBoundary(baseContract, {
        forbiddenPreflightContent:
          baseContract.futureManualOrderPermissionImportImplementationBoundary.forbiddenPreflightContent.filter(
            (item) => item !== "live_order_endpoint",
          ),
      }),
    },
    {
      id: "changed_future_paths",
      expectedErrorCodes: ["invalid_future_import_service_path", "invalid_future_permission_packet_path"],
      contract: withBoundary(baseContract, {
        futureImportServicePath: "server/src/services/trading/liveOrderImporter.js",
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
          syntheticNumericRawValueShape: "1234567890",
        },
      },
    },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateManualOrderPermissionImportImplementationPreflight(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermissionImportImplementationPreflight(fixture.contract);
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
  const importPreflight = readJson(IMPORT_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidImportPreflight = clone(importPreflight);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidImportPreflight);
  const validationEvidence = fixtureValidationEvidence(syntheticValidImportPreflight, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidImportPreflight),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    importImplementationPreflightReady:
      importPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importPreflight.readiness?.importImplementationAllowedNow === false &&
      importPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importPreflight.readiness?.permissionPacketImportedNow === false &&
      importPreflight.readiness?.providerCallsAllowed === false &&
      importPreflight.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermissionImportImplementationPreflight") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes(
        "Trading Manual Order Permission Import Implementation Preflight Validator Fixtures",
      ) &&
      architectureDoc.includes("manual_order_permission_import_implementation_preflight_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    importImplementationAllowedNow: false,
    ownerPacketReadAllowedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    orderAdapterImplementationAllowedNow: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForImportImplementationPreflightValidatorRegression =
    checks.importImplementationPreflightReady &&
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
    step: "Step 116-4G",
    scope: "manual_order_permission_import_implementation_preflight_validator_fixtures",
    sourceFiles: {
      importImplementationPreflight: IMPORT_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      importImplementationAllowedNow: false,
      ownerPacketReadAllowedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      orderAdapterImplementationAllowedNow: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic manual-order-permission import implementation preflight fixtures only; no real account, operator, session, provider, order, app key, app secret, token, private packet, hash output, or provider payload content",
      validatorPath: VALIDATOR_PATH,
      currentStepReadsPrivatePacket: false,
      currentStepWritesPrivatePacket: false,
      currentStepImportsPacket: false,
      currentStepGeneratesHashes: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepImplementsOrderAdapter: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepWritesDatabase: false,
      validSyntheticImportImplementationPreflight: syntheticValidImportPreflight,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      importImplementationPreflightStatus: importPreflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForImportImplementationPreflightValidatorRegression
        ? "fixtures_ready_for_manual_order_permission_import_implementation_preflight_validator_regression"
        : "blocked_before_manual_order_permission_import_implementation_preflight_validator_fixture_regression",
      readyForImportImplementationPreflightValidatorRegression,
      fixturesOnly: true,
      importImplementationAllowedNow: false,
      ownerPacketReadAllowedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      orderAdapterImplementationAllowedNow: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.importImplementationPreflightReady
          ? []
          : ["manual_order_permission_import_implementation_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_import_implementation_preflight_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-import-implementation-preflight-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-import-implementation-preflight-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-import-implementation-preflight-validator-fixtures] ok");
    console.log(
      `[generate-trading-manual-order-permission-import-implementation-preflight-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-import-implementation-preflight-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-import-implementation-preflight-validator-fixtures] readyForImportImplementationPreflightValidatorRegression=${parsed.readiness.readyForImportImplementationPreflightValidatorRegression}`,
  );
}

main();

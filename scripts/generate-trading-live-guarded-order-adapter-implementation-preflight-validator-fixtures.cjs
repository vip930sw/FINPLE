const fs = require("node:fs");
const path = require("node:path");
const {
  validateLiveGuardedOrderAdapterImplementationPreflight,
} = require("./validate-trading-live-guarded-order-adapter-implementation-preflight.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight_validator_fixtures.json",
);
const LIVE_GUARDED_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-live-guarded-order-adapter-implementation-preflight.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-live-guarded-order-adapter-implementation-preflight-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "order_adapter_implementation_enabled",
  "manual_permission_import_enabled",
  "provider_call_enabled",
  "order_submission_enabled",
  "runtime_route_creation_enabled",
  "public_ui_creation_enabled",
  "missing_review_gate",
  "missing_implementation_rule",
  "missing_forbidden_preflight_content",
  "changed_future_order_adapter_path",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "db_migration_flag_enabled",
  "numeric_raw_value_shape_injected",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  ["5019", "5326"].join(""),
  ["6440", "8140"].join(""),
  ["KIS", "TRADING", "APP", "KEY"].join("_"),
  ["KIS", "TRADING", "APP", "SECRET"].join("_"),
  ["APP", "Secret"].join(" "),
  ["APP", "Key"].join(" "),
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
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "kisTradingService.js"),
  path.join("server", "src", "services", "kisOrderService.js"),
  path.join("server", "src", "services", "tradingOrderService.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
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
    futureLiveGuardedOrderAdapterBoundary: {
      ...baseContract.futureLiveGuardedOrderAdapterBoundary,
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
      id: "order_adapter_implementation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepImplementsOrderAdapter: true }),
    },
    {
      id: "manual_permission_import_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepImportsManualPermission: true }),
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
      id: "runtime_route_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepCreatesRuntimeRoute: true }),
    },
    {
      id: "public_ui_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepCreatesPublicUi: true }),
    },
    {
      id: "missing_review_gate",
      expectedErrorCodes: ["missing_review_gate"],
      contract: withBoundary(baseContract, {
        reviewGates: baseContract.futureLiveGuardedOrderAdapterBoundary.reviewGates.filter(
          (gate) => gate !== "env_risk_gate_fail_closed",
        ),
      }),
    },
    {
      id: "missing_implementation_rule",
      expectedErrorCodes: ["missing_implementation_rule"],
      contract: withBoundary(baseContract, {
        implementationRules: baseContract.futureLiveGuardedOrderAdapterBoundary.implementationRules.filter(
          (rule) => rule !== "kill_switch_before_request_signing",
        ),
      }),
    },
    {
      id: "missing_forbidden_preflight_content",
      expectedErrorCodes: ["missing_forbidden_preflight_content"],
      contract: withBoundary(baseContract, {
        forbiddenPreflightContent: baseContract.futureLiveGuardedOrderAdapterBoundary.forbiddenPreflightContent.filter(
          (item) => item !== "live_order_endpoint",
        ),
      }),
    },
    {
      id: "changed_future_order_adapter_path",
      expectedErrorCodes: ["invalid_future_order_adapter_path"],
      contract: withBoundary(baseContract, {
        futureOrderAdapterPath: "server/src/services/trading/liveOrderAdapter.js",
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
      id: "db_migration_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, dbMigrationAllowed: true },
      },
    },
    {
      id: "numeric_raw_value_shape_injected",
      expectedErrorCodes: ["forbidden_raw_value"],
      contract: {
        ...baseContract,
        evidence: {
          ...baseContract.evidence,
          syntheticNumericRawValueShape: "12345678",
        },
      },
    },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateLiveGuardedOrderAdapterImplementationPreflight(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateLiveGuardedOrderAdapterImplementationPreflight(fixture.contract);
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
  const liveGuardedPreflight = readJson(LIVE_GUARDED_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidLiveGuardedPreflight = clone(liveGuardedPreflight);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidLiveGuardedPreflight);
  const validationEvidence = fixtureValidationEvidence(syntheticValidLiveGuardedPreflight, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidLiveGuardedPreflight),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    liveGuardedPreflightReady:
      liveGuardedPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedPreflight.readiness?.orderSubmissionAllowed === false &&
      liveGuardedPreflight.readiness?.runtimeRouteAllowed === false &&
      liveGuardedPreflight.readiness?.liveTradingAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateLiveGuardedOrderAdapterImplementationPreflight") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Live-Guarded Order Adapter Implementation Preflight Validator Fixtures") &&
      architectureDoc.includes("live_guarded_order_adapter_implementation_preflight_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    orderAdapterImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForLiveGuardedPreflightValidatorRegression =
    checks.liveGuardedPreflightReady &&
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
    step: "Step 116-4Y",
    scope: "live_guarded_order_adapter_implementation_preflight_validator_fixtures",
    sourceFiles: {
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic live-guarded order adapter implementation preflight fixtures only; no real permission packet, account, operator, credential, provider payload, order payload, token, app key, app secret, execution, fill, confirmation, route, UI, DB migration, provider call, or order submission",
      validatorPath: VALIDATOR_PATH,
      currentStepImplementsOrderAdapter: false,
      currentStepImportsManualPermission: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepCreatesPublicUi: false,
      validSyntheticLiveGuardedPreflight: syntheticValidLiveGuardedPreflight,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      liveGuardedPreflightStatus: liveGuardedPreflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForLiveGuardedPreflightValidatorRegression
        ? "fixtures_ready_for_live_guarded_order_adapter_implementation_preflight_validator_regression"
        : "blocked_before_live_guarded_order_adapter_implementation_preflight_validator_fixture_regression",
      readyForLiveGuardedPreflightValidatorRegression,
      fixturesOnly: true,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.liveGuardedPreflightReady
          ? []
          : ["live_guarded_order_adapter_implementation_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_live_guarded_order_adapter_implementation_preflight_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-live-guarded-order-adapter-implementation-preflight-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-live-guarded-order-adapter-implementation-preflight-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-live-guarded-order-adapter-implementation-preflight-validator-fixtures] ok");
    console.log(
      `[generate-trading-live-guarded-order-adapter-implementation-preflight-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-live-guarded-order-adapter-implementation-preflight-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-live-guarded-order-adapter-implementation-preflight-validator-fixtures] readyForLiveGuardedPreflightValidatorRegression=${parsed.readiness.readyForLiveGuardedPreflightValidatorRegression}`,
  );
}

main();

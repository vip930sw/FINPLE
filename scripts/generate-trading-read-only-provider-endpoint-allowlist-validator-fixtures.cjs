const fs = require("node:fs");
const path = require("node:path");
const {
  validateReadOnlyProviderEndpointAllowlistContract,
} = require("./validate-trading-read-only-provider-endpoint-allowlist-contract.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_validator_fixtures.json",
);
const ENDPOINT_ALLOWLIST_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-endpoint-allowlist-contract.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-endpoint-allowlist-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "missing_allowed_endpoint_category",
  "missing_forbidden_endpoint_category",
  "unknown_allowed_endpoint_category",
  "allowed_forbidden_endpoint_overlap",
  "missing_endpoint_rule",
  "missing_forbidden_preflight_content",
  "provider_specific_path_recorded",
  "provider_specific_transaction_id_recorded",
  "endpoint_allowlist_implementation_enabled",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "provider_url_path_injected",
  "provider_tr_id_injected",
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
  "raw_provider_payload_value",
  "raw_order_payload_value",
  "order_confirmation_value",
  "execution_id_value",
  "fill_payload_value",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
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
    futureReadOnlyProviderEndpointAllowlistBoundary: {
      ...baseContract.futureReadOnlyProviderEndpointAllowlistBoundary,
      ...patch,
    },
  };
}

function invalidSyntheticFixtures(baseContract) {
  const boundary = baseContract.futureReadOnlyProviderEndpointAllowlistBoundary;
  return [
    {
      id: "missing_output_files",
      expectedErrorCodes: ["missing_required_field"],
      contract: omitField(baseContract, "outputFiles"),
    },
    {
      id: "missing_allowed_endpoint_category",
      expectedErrorCodes: ["missing_allowed_endpoint_category"],
      contract: withBoundary(baseContract, {
        allowedEndpointCategories: boundary.allowedEndpointCategories.filter(
          (category) => category !== "current_quotes_read",
        ),
      }),
    },
    {
      id: "missing_forbidden_endpoint_category",
      expectedErrorCodes: ["missing_forbidden_endpoint_category"],
      contract: withBoundary(baseContract, {
        forbiddenEndpointCategories: boundary.forbiddenEndpointCategories.filter((category) => category !== "order_submit"),
      }),
    },
    {
      id: "unknown_allowed_endpoint_category",
      expectedErrorCodes: ["unknown_allowed_endpoint_category"],
      contract: withBoundary(baseContract, {
        allowedEndpointCategories: [...boundary.allowedEndpointCategories, "portfolio_report_download"],
      }),
    },
    {
      id: "allowed_forbidden_endpoint_overlap",
      expectedErrorCodes: ["unknown_allowed_endpoint_category", "allowed_endpoint_category_overlaps_forbidden"],
      contract: withBoundary(baseContract, {
        allowedEndpointCategories: [...boundary.allowedEndpointCategories, "order_submit"],
      }),
    },
    {
      id: "missing_endpoint_rule",
      expectedErrorCodes: ["missing_endpoint_rule"],
      contract: withBoundary(baseContract, {
        endpointRules: boundary.endpointRules.filter((rule) => rule !== "unknown_endpoint_category_fails_closed"),
      }),
    },
    {
      id: "missing_forbidden_preflight_content",
      expectedErrorCodes: ["missing_forbidden_preflight_content"],
      contract: withBoundary(baseContract, {
        forbiddenPreflightContent: boundary.forbiddenPreflightContent.filter((content) => content !== "provider_url_path"),
      }),
    },
    {
      id: "provider_specific_path_recorded",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, providerSpecificEndpointPathsRecordedNow: true },
      },
    },
    {
      id: "provider_specific_transaction_id_recorded",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, providerSpecificTransactionIdsRecordedNow: true },
      },
    },
    {
      id: "endpoint_allowlist_implementation_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, endpointAllowlistImplementationAllowed: true },
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        checks: { ...baseContract.checks, providerCallsAllowed: true },
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
        readiness: { ...baseContract.readiness, runtimeRouteAllowed: true },
      },
    },
    {
      id: "provider_url_path_injected",
      expectedErrorCodes: ["forbidden_raw_value"],
      contract: {
        ...baseContract,
        evidence: { ...baseContract.evidence, syntheticProviderPath: "/uapi/domestic-stock/v1/trading/inquire-balance" },
      },
    },
    {
      id: "provider_tr_id_injected",
      expectedErrorCodes: ["forbidden_raw_value"],
      contract: {
        ...baseContract,
        evidence: { ...baseContract.evidence, syntheticProviderTransactionId: "VTTC8434R" },
      },
    },
    {
      id: "numeric_raw_value_shape_injected",
      expectedErrorCodes: ["forbidden_raw_value"],
      contract: {
        ...baseContract,
        evidence: { ...baseContract.evidence, syntheticNumericRawValueShape: "12345678" },
      },
    },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateReadOnlyProviderEndpointAllowlistContract(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateReadOnlyProviderEndpointAllowlistContract(fixture.contract);
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
  const endpointAllowlistContract = readJson(ENDPOINT_ALLOWLIST_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidEndpointAllowlistContract = clone(endpointAllowlistContract);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidEndpointAllowlistContract);
  const validationEvidence = fixtureValidationEvidence(syntheticValidEndpointAllowlistContract, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidEndpointAllowlistContract),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    endpointAllowlistContractReady:
      endpointAllowlistContract.readiness?.readyForFutureReadOnlyProviderEndpointAllowlistReview === true &&
      endpointAllowlistContract.readiness?.endpointAllowlistImplementationAllowed === false &&
      endpointAllowlistContract.readiness?.providerCallsAllowed === false &&
      endpointAllowlistContract.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateReadOnlyProviderEndpointAllowlistContract") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Read-Only Provider Endpoint Allowlist Validator Fixtures") &&
      architectureDoc.includes("read_only_provider_endpoint_allowlist_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerSpecificEndpointPathsRecordedNow: false,
    providerSpecificTransactionIdsRecordedNow: false,
    endpointAllowlistImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression =
    checks.endpointAllowlistContractReady &&
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
    step: "Step 116-3G-B",
    scope: "read_only_provider_endpoint_allowlist_validator_fixtures",
    sourceFiles: {
      endpointAllowlistContract: ENDPOINT_ALLOWLIST_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      providerSpecificEndpointPathsRecordedNow: false,
      providerSpecificTransactionIdsRecordedNow: false,
      endpointAllowlistImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic endpoint allowlist validator fixtures only; no provider URL path, transaction id, account, credential, token, provider request, provider payload, order payload, order confirmation, execution, fill, runtime route, public UI, DB write, or provider call content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticEndpointAllowlistContract: syntheticValidEndpointAllowlistContract,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      endpointAllowlistContractStatus: endpointAllowlistContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenFixtureContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression
        ? "fixtures_ready_for_read_only_provider_endpoint_allowlist_validator_regression"
        : "blocked_before_read_only_provider_endpoint_allowlist_validator_fixture_regression",
      readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression,
      fixturesOnly: true,
      providerSpecificEndpointPathsRecordedNow: false,
      providerSpecificTransactionIdsRecordedNow: false,
      endpointAllowlistImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.endpointAllowlistContractReady ? [] : ["read_only_provider_endpoint_allowlist_contract_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["read_only_provider_endpoint_allowlist_validator_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_read_only_provider_endpoint_allowlist_validator_fixtures"]),
        ...(checks.validFixturePasses ? [] : ["valid_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_fixtures_do_not_fail_with_expected_codes"]),
        ...missingInvalidFixtureIds.map((id) => `missing_invalid_fixture_${id}`),
        ...forbiddenFixtureContent.map((content) => `forbidden_fixture_content_${content}`),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures] ok");
    console.log(`[generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures] readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression=${parsed.readiness.readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression}`,
  );
}

if (require.main === module) {
  main();
}

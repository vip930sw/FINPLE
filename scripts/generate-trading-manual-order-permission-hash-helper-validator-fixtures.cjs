const fs = require("node:fs");
const path = require("node:path");
const {
  validateManualOrderPermissionHashHelperContract,
} = require("./validate-trading-manual-order-permission-hash-helper-contract.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_validator_fixtures.json",
);
const HASH_HELPER_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-hash-helper-contract.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-hash-helper-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "helper_implementation_enabled",
  "hash_creation_enabled",
  "permission_packet_creation_enabled",
  "missing_hash_input_label",
  "missing_hash_helper_rule",
  "missing_forbidden_hash_input",
  "changed_future_paths",
  "unsafe_secret_boundary",
  "unsafe_sample_output",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
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
  path.join("scripts", "create-trading-manual-order-permission-hashes.cjs"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
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
    futureLocalHashHelperBoundary: {
      ...baseContract.futureLocalHashHelperBoundary,
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
      id: "helper_implementation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepImplementsHelper: true }),
    },
    {
      id: "hash_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepCreatesHashes: true }),
    },
    {
      id: "permission_packet_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: withBoundary(baseContract, { currentStepCreatesPermissionPacket: true }),
    },
    {
      id: "missing_hash_input_label",
      expectedErrorCodes: ["missing_hash_input_label"],
      contract: withBoundary(baseContract, {
        requiredHashInputLabels: baseContract.futureLocalHashHelperBoundary.requiredHashInputLabels.filter(
          (label) => label !== "operatorAccessHash",
        ),
      }),
    },
    {
      id: "missing_hash_helper_rule",
      expectedErrorCodes: ["missing_hash_helper_rule"],
      contract: withBoundary(baseContract, {
        requiredHashHelperRules: baseContract.futureLocalHashHelperBoundary.requiredHashHelperRules.filter(
          (rule) => rule !== "raw_inputs_not_logged",
        ),
      }),
    },
    {
      id: "missing_forbidden_hash_input",
      expectedErrorCodes: ["missing_forbidden_hash_input"],
      contract: withBoundary(baseContract, {
        forbiddenHashInputs: baseContract.futureLocalHashHelperBoundary.forbiddenHashInputs.filter(
          (input) => input !== "live_order_endpoint",
        ),
      }),
    },
    {
      id: "changed_future_paths",
      expectedErrorCodes: ["invalid_future_hash_helper_path", "invalid_future_permission_packet_path"],
      contract: withBoundary(baseContract, {
        futureHashHelperPath: "scripts/hash-live-order-secret.cjs",
        futurePermissionPacketPath: "data/private/trading/live_order_permission.json",
      }),
    },
    {
      id: "unsafe_secret_boundary",
      expectedErrorCodes: [
        "invalid_hash_algorithm",
        "pepper_not_required",
        "invalid_pepper_storage",
        "invalid_raw_input_transport",
        "secret_boundary_flag_enabled",
      ],
      contract: withBoundary(baseContract, {
        acceptedHashAlgorithm: "SHA-256",
        requiredSecretBoundary: {
          ...baseContract.futureLocalHashHelperBoundary.requiredSecretBoundary,
          pepperRequired: false,
          pepperStorage: "repo_env",
          rawInputTransport: "argv",
          commandLineRawSecretsAllowed: true,
          rawInputLoggingAllowed: true,
          rawInputPersistenceAllowed: true,
        },
      }),
    },
    {
      id: "unsafe_sample_output",
      expectedErrorCodes: ["invalid_sample_hash_placeholder", "sample_forbidden_value"],
      contract: withBoundary(baseContract, {
        sampleOutputShape: {
          ...baseContract.futureLocalHashHelperBoundary.sampleOutputShape,
          approvedByHash: "sha256:<operator_hash>",
          operatorAccessHash: "raw_operator_value",
          allowedSymbolHashes: ["QQQ"],
        },
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
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateManualOrderPermissionHashHelperContract(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermissionHashHelperContract(fixture.contract);
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
  const hashHelperContract = readJson(HASH_HELPER_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidHashHelperContract = clone(hashHelperContract);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidHashHelperContract);
  const validationEvidence = fixtureValidationEvidence(syntheticValidHashHelperContract, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidHashHelperContract),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    hashHelperContractReady:
      hashHelperContract.readiness?.readyForFutureManualOrderPermissionHashHelperImplementationReview === true &&
      hashHelperContract.readiness?.hashHelperImplementationAllowed === false &&
      hashHelperContract.readiness?.permissionPacketCreatedNow === false &&
      hashHelperContract.readiness?.permissionPacketImportedNow === false &&
      hashHelperContract.readiness?.providerCallsAllowed === false &&
      hashHelperContract.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermissionHashHelperContract") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Manual Order Permission Hash Helper Validator Fixtures") &&
      architectureDoc.includes("manual_order_permission_hash_helper_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    hashHelperImplementationAllowed: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForManualOrderPermissionHashHelperValidatorRegression =
    checks.hashHelperContractReady &&
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
    step: "Step 116-4AC",
    scope: "manual_order_permission_hash_helper_validator_fixtures",
    sourceFiles: {
      manualOrderPermissionHashHelperContract: HASH_HELPER_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      hashHelperImplementationAllowed: false,
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
        "synthetic manual order permission hash helper validator fixtures only; no real hash helper implementation, private packet, raw account, raw operator, credential, provider payload, order payload, token, app key, app secret, execution, fill, confirmation, route, UI, DB migration, provider call, or order submission",
      validatorPath: VALIDATOR_PATH,
      validSyntheticHashHelperContract: syntheticValidHashHelperContract,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      hashHelperContractStatus: hashHelperContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForManualOrderPermissionHashHelperValidatorRegression
        ? "fixtures_ready_for_manual_order_permission_hash_helper_validator_regression"
        : "blocked_before_manual_order_permission_hash_helper_validator_fixture_regression",
      readyForManualOrderPermissionHashHelperValidatorRegression,
      fixturesOnly: true,
      hashHelperImplementationAllowed: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.hashHelperContractReady ? [] : ["manual_order_permission_hash_helper_contract_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_helper_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-helper-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-helper-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-helper-validator-fixtures] ok");
    console.log(`[generate-trading-manual-order-permission-hash-helper-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-helper-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-helper-validator-fixtures] readyForManualOrderPermissionHashHelperValidatorRegression=${parsed.readiness.readyForManualOrderPermissionHashHelperValidatorRegression}`,
  );
}

main();

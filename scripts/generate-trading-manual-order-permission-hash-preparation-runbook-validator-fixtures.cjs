const fs = require("node:fs");
const path = require("node:path");
const {
  validateManualOrderPermissionHashPreparationRunbookContract,
} = require("./validate-trading-manual-order-permission-hash-preparation-runbook-contract.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_validator_fixtures.json",
);
const RUNBOOK_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-hash-preparation-runbook-contract.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-hash-preparation-runbook-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "helper_creation_enabled",
  "helper_run_enabled",
  "raw_input_request_enabled",
  "private_pepper_request_enabled",
  "hash_output_capture_enabled",
  "permission_packet_creation_enabled",
  "missing_required_runbook_step",
  "missing_output_label",
  "missing_forbidden_runbook_content",
  "changed_future_paths",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "numeric_raw_value_shape_injected",
];
const FORBIDDEN_FIXTURE_CONTENT = [
  "50195326",
  "64408140",
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
  path.join("scripts", "create-trading-manual-order-permission-hashes.cjs"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
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

function invalidSyntheticFixtures(baseContract) {
  return [
    {
      id: "missing_output_files",
      expectedErrorCodes: ["missing_required_field"],
      contract: omitField(baseContract, "outputFiles"),
    },
    {
      id: "helper_creation_enabled",
      expectedErrorCodes: ["runbook_action_enabled"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          currentStepCreatesHelper: true,
        },
      },
    },
    {
      id: "helper_run_enabled",
      expectedErrorCodes: ["runbook_action_enabled"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          currentStepRunsHelper: true,
        },
      },
    },
    {
      id: "raw_input_request_enabled",
      expectedErrorCodes: ["runbook_action_enabled"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          currentStepRequestsRawInputs: true,
        },
      },
    },
    {
      id: "private_pepper_request_enabled",
      expectedErrorCodes: ["runbook_action_enabled"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          currentStepRequestsPrivatePepper: true,
        },
      },
    },
    {
      id: "hash_output_capture_enabled",
      expectedErrorCodes: ["runbook_action_enabled"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          currentStepCapturesHashOutput: true,
        },
      },
    },
    {
      id: "permission_packet_creation_enabled",
      expectedErrorCodes: ["runbook_action_enabled"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          currentStepCreatesPermissionPacket: true,
        },
      },
    },
    {
      id: "missing_required_runbook_step",
      expectedErrorCodes: ["missing_runbook_step"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          runbookSteps: baseContract.futureOwnerAssistedHashPreparationRunbook.runbookSteps.filter(
            (step) => step !== "reject_command_line_raw_secret_arguments",
          ),
        },
      },
    },
    {
      id: "missing_output_label",
      expectedErrorCodes: ["missing_output_label"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          requiredOutputLabels: baseContract.futureOwnerAssistedHashPreparationRunbook.requiredOutputLabels.filter(
            (label) => label !== "revocationPlanHash",
          ),
        },
      },
    },
    {
      id: "missing_forbidden_runbook_content",
      expectedErrorCodes: ["missing_forbidden_runbook_content"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          forbiddenRunbookContent:
            baseContract.futureOwnerAssistedHashPreparationRunbook.forbiddenRunbookContent.filter(
              (item) => item !== "live_order_endpoint",
            ),
        },
      },
    },
    {
      id: "changed_future_paths",
      expectedErrorCodes: ["invalid_future_hash_helper_path", "invalid_future_permission_packet_path"],
      contract: {
        ...baseContract,
        futureOwnerAssistedHashPreparationRunbook: {
          ...baseContract.futureOwnerAssistedHashPreparationRunbook,
          futureHashHelperPath: "scripts/hash-live-order-secret.cjs",
          futurePermissionPacketPath: "data/private/trading/live_order_permission.json",
        },
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
          syntheticNumericRawValueShape: "1234567890",
        },
      },
    },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateManualOrderPermissionHashPreparationRunbookContract(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermissionHashPreparationRunbookContract(fixture.contract);
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
  const runbookContract = readJson(RUNBOOK_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidRunbookContract = clone(runbookContract);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidRunbookContract);
  const validationEvidence = fixtureValidationEvidence(syntheticValidRunbookContract, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidRunbookContract),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    runbookContractReady:
      runbookContract.readiness?.readyForOwnerAssistedHashPreparationRunbookReview === true &&
      runbookContract.readiness?.helperExecutionAllowedNow === false &&
      runbookContract.readiness?.hashGenerationAllowed === false &&
      runbookContract.readiness?.permissionPacketCreatedNow === false &&
      runbookContract.readiness?.providerCallsAllowed === false &&
      runbookContract.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermissionHashPreparationRunbookContract") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Manual Order Permission Hash Preparation Runbook Validator Fixtures") &&
      architectureDoc.includes("manual_order_permission_hash_preparation_runbook_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    helperImplementationCreatedNow: false,
    helperExecutionAllowedNow: false,
    rawInputsRequestedNow: false,
    privatePepperRequestedNow: false,
    hashGenerationAllowed: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForRunbookValidatorFixtureRegression =
    checks.runbookContractReady &&
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
    step: "Step 116-4D",
    scope: "manual_order_permission_hash_preparation_runbook_validator_fixtures",
    sourceFiles: {
      runbookContract: RUNBOOK_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      helperImplementationCreatedNow: false,
      helperExecutionAllowedNow: false,
      rawInputsRequestedNow: false,
      privatePepperRequestedNow: false,
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
        "synthetic hash-preparation runbook contract fixtures only; no real account, operator, session, provider, order, app key, app secret, token, private pepper, hash output, or permission packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCreatesHelper: false,
      currentStepRunsHelper: false,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      currentStepCapturesHashOutput: false,
      currentStepCreatesPermissionPacket: false,
      validSyntheticRunbookContract: syntheticValidRunbookContract,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      runbookContractStatus: runbookContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForRunbookValidatorFixtureRegression
        ? "fixtures_ready_for_manual_order_permission_hash_preparation_runbook_validator_regression"
        : "blocked_before_manual_order_permission_hash_preparation_runbook_validator_fixture_regression",
      readyForRunbookValidatorFixtureRegression,
      fixturesOnly: true,
      helperImplementationCreatedNow: false,
      helperExecutionAllowedNow: false,
      rawInputsRequestedNow: false,
      privatePepperRequestedNow: false,
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
        ...(checks.runbookContractReady ? [] : ["manual_order_permission_hash_preparation_runbook_contract_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_preparation_runbook_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-preparation-runbook-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-preparation-runbook-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-preparation-runbook-validator-fixtures] ok");
    console.log(
      `[generate-trading-manual-order-permission-hash-preparation-runbook-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-preparation-runbook-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-preparation-runbook-validator-fixtures] readyForRunbookValidatorFixtureRegression=${parsed.readiness.readyForRunbookValidatorFixtureRegression}`,
  );
}

main();

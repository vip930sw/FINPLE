const fs = require("node:fs");
const path = require("node:path");
const {
  validateManualOrderPermissionHashHelperImplementationReviewContract,
} = require("./validate-trading-manual-order-permission-hash-helper-implementation-review-contract.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
);
const REVIEW_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
);
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-hash-helper-implementation-review-contract.cjs",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-hash-helper-implementation-review-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "helper_creation_enabled",
  "helper_run_enabled",
  "raw_input_request_enabled",
  "private_pepper_request_enabled",
  "missing_synthetic_test_vectors_rule",
  "missing_revocation_plan_output_label",
  "changed_future_paths",
  "real_credential_fixture_boundary_opened",
  "network_boundary_opened",
  "permission_packet_write_opened",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
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
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          currentStepCreatesHelper: true,
        },
      },
    },
    {
      id: "helper_run_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          currentStepRunsHelper: true,
        },
      },
    },
    {
      id: "raw_input_request_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          currentStepRequestsRawInputs: true,
        },
      },
    },
    {
      id: "private_pepper_request_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          currentStepRequestsPrivatePepper: true,
        },
      },
    },
    {
      id: "missing_synthetic_test_vectors_rule",
      expectedErrorCodes: ["missing_implementation_review_criterion"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          implementationReviewCriteria:
            baseContract.futureLocalOnlyImplementationReviewBoundary.implementationReviewCriteria.filter(
              (criterion) => criterion !== "synthetic_test_vectors_only",
            ),
        },
      },
    },
    {
      id: "missing_revocation_plan_output_label",
      expectedErrorCodes: ["missing_helper_output_label"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          helperOutputLabels: baseContract.futureLocalOnlyImplementationReviewBoundary.helperOutputLabels.filter(
            (label) => label !== "revocationPlanHash",
          ),
        },
      },
    },
    {
      id: "changed_future_paths",
      expectedErrorCodes: ["invalid_future_hash_helper_path", "invalid_future_permission_packet_path"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          futureHashHelperPath: "scripts/hash-live-order-secret.cjs",
          futurePermissionPacketPath: "data/private/trading/live_order_permission.json",
        },
      },
    },
    {
      id: "real_credential_fixture_boundary_opened",
      expectedErrorCodes: ["test_boundary_flag_enabled"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          requiredTestBoundary: {
            ...baseContract.futureLocalOnlyImplementationReviewBoundary.requiredTestBoundary,
            realKisCredentialFixturesAllowed: true,
          },
        },
      },
    },
    {
      id: "network_boundary_opened",
      expectedErrorCodes: ["execution_boundary_flag_enabled"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          requiredExecutionBoundary: {
            ...baseContract.futureLocalOnlyImplementationReviewBoundary.requiredExecutionBoundary,
            networkAccessAllowed: true,
          },
        },
      },
    },
    {
      id: "permission_packet_write_opened",
      expectedErrorCodes: ["execution_boundary_flag_enabled"],
      contract: {
        ...baseContract,
        futureLocalOnlyImplementationReviewBoundary: {
          ...baseContract.futureLocalOnlyImplementationReviewBoundary,
          requiredExecutionBoundary: {
            ...baseContract.futureLocalOnlyImplementationReviewBoundary.requiredExecutionBoundary,
            writesPermissionPacketByDefault: true,
          },
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
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateManualOrderPermissionHashHelperImplementationReviewContract(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateManualOrderPermissionHashHelperImplementationReviewContract(fixture.contract);
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
  const reviewContract = readJson(REVIEW_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidReviewContract = clone(reviewContract);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidReviewContract);
  const validationEvidence = fixtureValidationEvidence(syntheticValidReviewContract, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidReviewContract),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    implementationReviewContractReady:
      reviewContract.readiness?.readyForFutureLocalHashHelperImplementationReview === true &&
      reviewContract.readiness?.helperImplementationCreatedNow === false &&
      reviewContract.readiness?.hashGenerationAllowed === false &&
      reviewContract.readiness?.permissionPacketCreatedNow === false &&
      reviewContract.readiness?.providerCallsAllowed === false &&
      reviewContract.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateManualOrderPermissionHashHelperImplementationReviewContract") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Manual Order Permission Hash Helper Implementation Review Validator Fixtures") &&
      architectureDoc.includes("manual_order_permission_hash_helper_implementation_review_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    helperImplementationCreatedNow: false,
    hashGenerationAllowed: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForImplementationReviewValidatorFixtureRegression =
    checks.implementationReviewContractReady &&
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
    step: "Step 116-4A",
    scope: "manual_order_permission_hash_helper_implementation_review_validator_fixtures",
    sourceFiles: {
      implementationReviewContract: REVIEW_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      helperImplementationCreatedNow: false,
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
        "synthetic implementation-review contract fixtures only; no real account, operator, session, provider, order, app key, app secret, token, private pepper, or permission packet content",
      validatorPath: VALIDATOR_PATH,
      currentStepCreatesHelper: false,
      currentStepRunsHelper: false,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      validSyntheticReviewContract: syntheticValidReviewContract,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      implementationReviewContractStatus: reviewContract.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForImplementationReviewValidatorFixtureRegression
        ? "fixtures_ready_for_manual_order_permission_hash_helper_implementation_review_validator_regression"
        : "blocked_before_manual_order_permission_hash_helper_implementation_review_validator_fixture_regression",
      readyForImplementationReviewValidatorFixtureRegression,
      fixturesOnly: true,
      helperImplementationCreatedNow: false,
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
        ...(checks.implementationReviewContractReady
          ? []
          : ["manual_order_permission_hash_helper_implementation_review_contract_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_helper_implementation_review_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-helper-implementation-review-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-helper-implementation-review-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-helper-implementation-review-validator-fixtures] ok");
    console.log(
      `[generate-trading-manual-order-permission-hash-helper-implementation-review-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-helper-implementation-review-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-helper-implementation-review-validator-fixtures] readyForImplementationReviewValidatorFixtureRegression=${parsed.readiness.readyForImplementationReviewValidatorFixtureRegression}`,
  );
}

main();

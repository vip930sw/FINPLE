const fs = require("node:fs");
const path = require("node:path");
const {
  validateRedactedApprovalHashHelperPreflight,
} = require("./validate-trading-redacted-approval-hash-helper-preflight.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_preflight_validator_fixtures.json",
);
const HASH_HELPER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-approval-hash-helper-preflight.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-redacted-approval-hash-helper-preflight-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "raw_input_request_enabled",
  "private_pepper_request_enabled",
  "hash_helper_implementation_enabled",
  "hash_generation_enabled",
  "approval_packet_creation_enabled",
  "missing_preflight_check",
  "missing_future_review_input",
  "missing_forbidden_preflight_content",
  "changed_future_paths",
  "owner_hash_preparation_not_deferred",
  "hash_generation_flag_enabled",
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
  "raw_evidence_text_value",
  "raw_revocation_plan_value",
  "raw_order_payload_value",
  "raw_provider_payload_value",
  "order_confirmation_value",
  "execution_id_value",
  "fill_payload_value",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("scripts", "create-trading-redacted-approval-hashes.cjs"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
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

function withBoundary(basePreflight, patch) {
  return {
    ...basePreflight,
    futureOwnerAssistedHashPreparationBoundary: {
      ...basePreflight.futureOwnerAssistedHashPreparationBoundary,
      ...patch,
    },
  };
}

function invalidSyntheticFixtures(basePreflight) {
  return [
    {
      id: "missing_output_files",
      expectedErrorCodes: ["missing_required_field"],
      preflight: omitField(basePreflight, "outputFiles"),
    },
    {
      id: "raw_input_request_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepRequestsRawInputs: true }),
    },
    {
      id: "private_pepper_request_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepRequestsPrivatePepper: true }),
    },
    {
      id: "hash_helper_implementation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepImplementsHashHelper: true }),
    },
    {
      id: "hash_generation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepGeneratesHashes: true }),
    },
    {
      id: "approval_packet_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepCreatesApprovalPacket: true }),
    },
    {
      id: "missing_preflight_check",
      expectedErrorCodes: ["missing_preflight_check"],
      preflight: withBoundary(basePreflight, {
        preflightChecks: basePreflight.futureOwnerAssistedHashPreparationBoundary.preflightChecks.filter(
          (check) => check !== "raw_inputs_not_requested_now",
        ),
      }),
    },
    {
      id: "missing_future_review_input",
      expectedErrorCodes: ["missing_future_review_input"],
      preflight: withBoundary(basePreflight, {
        futureReviewInputs: basePreflight.futureOwnerAssistedHashPreparationBoundary.futureReviewInputs.filter(
          (input) => input !== "manual_review_before_approval_packet_import",
        ),
      }),
    },
    {
      id: "missing_forbidden_preflight_content",
      expectedErrorCodes: ["missing_forbidden_preflight_content"],
      preflight: withBoundary(basePreflight, {
        forbiddenPreflightContent:
          basePreflight.futureOwnerAssistedHashPreparationBoundary.forbiddenPreflightContent.filter(
            (item) => item !== "live_order_endpoint",
          ),
      }),
    },
    {
      id: "changed_future_paths",
      expectedErrorCodes: ["invalid_future_hash_helper_path", "invalid_future_approval_packet_path"],
      preflight: withBoundary(basePreflight, {
        futureHashHelperPath: path.join("scripts", "hash-live-order-secret.cjs"),
        futureApprovalPacketPath: path.join("data", "private", "trading", "live_order_permission.json"),
      }),
    },
    {
      id: "owner_hash_preparation_not_deferred",
      expectedErrorCodes: ["owner_hash_preparation_not_deferred"],
      preflight: {
        ...basePreflight,
        currentState: { ...basePreflight.currentState, ownerHashPreparationDeferred: false },
      },
    },
    {
      id: "hash_generation_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      preflight: {
        ...basePreflight,
        currentState: { ...basePreflight.currentState, hashGenerationAllowed: true },
      },
    },
    {
      id: "provider_call_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      preflight: {
        ...basePreflight,
        currentState: { ...basePreflight.currentState, providerCallsAllowed: true },
      },
    },
    {
      id: "order_submission_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      preflight: {
        ...basePreflight,
        readiness: { ...basePreflight.readiness, orderSubmissionAllowed: true },
      },
    },
    {
      id: "runtime_route_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      preflight: {
        ...basePreflight,
        checks: { ...basePreflight.checks, runtimeRouteAllowed: true },
      },
    },
  ];
}

function fixtureValidationEvidence(validPreflight, invalidFixtures) {
  const validResult = validateRedactedApprovalHashHelperPreflight(validPreflight);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateRedactedApprovalHashHelperPreflight(fixture.preflight);
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
  const preflight = readJson(HASH_HELPER_PREFLIGHT_PATH);
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
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.preflight)),
  ];
  const checks = {
    fixturesOnly: true,
    hashHelperPreflightReady:
      preflight.readiness?.readyForOwnerAssistedHashPreparationLater === true &&
      preflight.readiness?.ownerHashPreparationDeferred === true &&
      preflight.readiness?.hashHelperImplementationAllowed === false &&
      preflight.readiness?.hashGenerationAllowed === false &&
      preflight.readiness?.approvalPacketCreatedNow === false &&
      preflight.readiness?.approvalPacketImportedNow === false &&
      preflight.readiness?.providerCallsAllowed === false &&
      preflight.readiness?.orderSubmissionAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateRedactedApprovalHashHelperPreflight") &&
      validatorSource.includes("preflight_path_required") &&
      validatorSource.includes("--preflight"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Redacted Approval Hash Helper Preflight Validator Fixtures") &&
      architectureDoc.includes("redacted_approval_hash_helper_preflight_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerHashPreparationDeferred: true,
    hashHelperImplementationAllowed: false,
    hashGenerationAllowed: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForRedactedApprovalHashHelperPreflightValidatorRegression =
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
    step: "Step 116-2Y-A",
    scope: "redacted_approval_hash_helper_preflight_validator_fixtures",
    sourceFiles: {
      redactedApprovalHashHelperPreflight: HASH_HELPER_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      ownerHashPreparationDeferred: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      redactionBoundary:
        "synthetic redacted approval hash helper preflight validator fixtures only; no raw operator, account, evidence, revocation, pepper, credential, provider payload, order payload, private packet, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticRedactedApprovalHashHelperPreflight: syntheticValidPreflight,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      redactedApprovalHashHelperPreflightStatus: preflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForRedactedApprovalHashHelperPreflightValidatorRegression
        ? "fixtures_ready_for_redacted_approval_hash_helper_preflight_validator_regression"
        : "blocked_before_redacted_approval_hash_helper_preflight_validator_fixture_regression",
      readyForRedactedApprovalHashHelperPreflightValidatorRegression,
      fixturesOnly: true,
      ownerHashPreparationDeferred: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.hashHelperPreflightReady ? [] : ["redacted_approval_hash_helper_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_redacted_approval_hash_helper_preflight_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-approval-hash-helper-preflight-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-approval-hash-helper-preflight-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-redacted-approval-hash-helper-preflight-validator-fixtures] ok");
    console.log(`[generate-trading-redacted-approval-hash-helper-preflight-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-approval-hash-helper-preflight-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-redacted-approval-hash-helper-preflight-validator-fixtures] readyForRedactedApprovalHashHelperPreflightValidatorRegression=${parsed.readiness.readyForRedactedApprovalHashHelperPreflightValidatorRegression}`,
  );
}

main();

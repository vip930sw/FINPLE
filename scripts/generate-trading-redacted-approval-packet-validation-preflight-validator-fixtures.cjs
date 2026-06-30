const fs = require("node:fs");
const path = require("node:path");
const {
  validateRedactedApprovalPacketValidationPreflight,
} = require("./validate-trading-redacted-approval-packet-validation-preflight.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight_validator_fixtures.json",
);
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-approval-packet-validation-preflight.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-redacted-approval-packet-validation-preflight-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "validator_implementation_disallowed",
  "private_packet_read_enabled",
  "private_packet_creation_enabled",
  "private_packet_import_enabled",
  "missing_preflight_gate",
  "missing_implementation_review_rule",
  "missing_forbidden_preflight_content",
  "changed_future_validator_path",
  "changed_future_approval_packet_path",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "public_ui_flag_enabled",
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
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "tradingRedactedApprovalPacketValidation.js"),
  path.join("server", "src", "services", "trading", "redactedApprovalPacketValidation.js"),
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
    futurePureLocalValidatorImplementationBoundary: {
      ...basePreflight.futurePureLocalValidatorImplementationBoundary,
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
      id: "validator_implementation_disallowed",
      expectedErrorCodes: ["validator_implementation_not_allowed", "validation_allow_flag_disabled"],
      preflight: {
        ...withBoundary(basePreflight, { currentStepImplementsValidator: false }),
        currentState: { ...basePreflight.currentState, validationImplementationAllowedNow: false },
      },
    },
    {
      id: "private_packet_read_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepReadsPrivatePacket: true }),
    },
    {
      id: "private_packet_creation_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepCreatesPacket: true }),
    },
    {
      id: "private_packet_import_enabled",
      expectedErrorCodes: ["boundary_action_enabled"],
      preflight: withBoundary(basePreflight, { currentStepImportsPacket: true }),
    },
    {
      id: "missing_preflight_gate",
      expectedErrorCodes: ["missing_preflight_gate"],
      preflight: withBoundary(basePreflight, {
        preflightGates: basePreflight.futurePureLocalValidatorImplementationBoundary.preflightGates.filter(
          (gate) => gate !== "validator_has_no_provider_dependency",
        ),
      }),
    },
    {
      id: "missing_implementation_review_rule",
      expectedErrorCodes: ["missing_implementation_review_rule"],
      preflight: withBoundary(basePreflight, {
        implementationReviewRules:
          basePreflight.futurePureLocalValidatorImplementationBoundary.implementationReviewRules.filter(
            (rule) => rule !== "no_environment_secret_loading",
          ),
      }),
    },
    {
      id: "missing_forbidden_preflight_content",
      expectedErrorCodes: ["missing_forbidden_preflight_content"],
      preflight: withBoundary(basePreflight, {
        forbiddenPreflightContent:
          basePreflight.futurePureLocalValidatorImplementationBoundary.forbiddenPreflightContent.filter(
            (item) => item !== "live_order_endpoint",
          ),
      }),
    },
    {
      id: "changed_future_validator_path",
      expectedErrorCodes: ["invalid_future_validator_path"],
      preflight: withBoundary(basePreflight, {
        futureValidatorPath: path.join("scripts", "validate-live-order-packet.cjs"),
      }),
    },
    {
      id: "changed_future_approval_packet_path",
      expectedErrorCodes: ["invalid_future_approval_packet_path"],
      preflight: withBoundary(basePreflight, {
        futureApprovalPacketPath: path.join("data", "private", "trading", "live_order_permission.json"),
      }),
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
        currentState: { ...basePreflight.currentState, orderSubmissionAllowed: true },
      },
    },
    {
      id: "runtime_route_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      preflight: {
        ...basePreflight,
        readiness: { ...basePreflight.readiness, runtimeRouteAllowed: true },
      },
    },
    {
      id: "public_ui_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      preflight: {
        ...basePreflight,
        readiness: { ...basePreflight.readiness, publicUiAllowed: true },
      },
    },
  ];
}

function fixtureValidationEvidence(validPreflight, invalidFixtures) {
  const validResult = validateRedactedApprovalPacketValidationPreflight(validPreflight);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateRedactedApprovalPacketValidationPreflight(fixture.preflight);
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
  const preflight = readJson(VALIDATION_PREFLIGHT_PATH);
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
    validationPreflightReady:
      preflight.readiness?.readyForPureLocalValidatorImplementationReview === true &&
      preflight.readiness?.validationImplementationAllowedNow === true &&
      preflight.readiness?.validationImplementationReviewAllowedLater === true &&
      preflight.readiness?.approvalPacketCreatedNow === false &&
      preflight.readiness?.approvalPacketImportedNow === false &&
      preflight.readiness?.providerCallsAllowed === false &&
      preflight.readiness?.orderSubmissionAllowed === false &&
      preflight.readiness?.runtimeRouteAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateRedactedApprovalPacketValidationPreflight") &&
      validatorSource.includes("preflight_path_required") &&
      validatorSource.includes("--preflight"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Redacted Approval Packet Validation Preflight Validator Fixtures") &&
      architectureDoc.includes("redacted_approval_packet_validation_preflight_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationImplementationAllowedNow: true,
    validationImplementationReviewAllowedLater: true,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForRedactedApprovalPacketValidationPreflightValidatorRegression =
    checks.validationPreflightReady &&
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
    step: "Step 116-2I-B",
    scope: "redacted_approval_packet_validation_preflight_validator_fixtures",
    sourceFiles: {
      redactedApprovalPacketValidationPreflight: VALIDATION_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
      validationImplementationAllowedNow: true,
      validationImplementationReviewAllowedLater: true,
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
        "synthetic redacted approval packet validation preflight validator fixtures only; no private packet, raw account, credential, provider payload, order payload, execution, fill, or order confirmation content",
      validatorPath: VALIDATOR_PATH,
      validSyntheticRedactedApprovalPacketValidationPreflight: syntheticValidPreflight,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      redactedApprovalPacketValidationPreflightStatus: preflight.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForRedactedApprovalPacketValidationPreflightValidatorRegression
        ? "fixtures_ready_for_redacted_approval_packet_validation_preflight_validator_regression"
        : "blocked_before_redacted_approval_packet_validation_preflight_validator_fixture_regression",
      readyForRedactedApprovalPacketValidationPreflightValidatorRegression,
      fixturesOnly: true,
      validationImplementationAllowedNow: true,
      validationImplementationReviewAllowedLater: true,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.validationPreflightReady ? [] : ["redacted_approval_packet_validation_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_redacted_approval_packet_validation_preflight_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-approval-packet-validation-preflight-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-approval-packet-validation-preflight-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-redacted-approval-packet-validation-preflight-validator-fixtures] ok");
    console.log(
      `[generate-trading-redacted-approval-packet-validation-preflight-validator-fixtures] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-approval-packet-validation-preflight-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-redacted-approval-packet-validation-preflight-validator-fixtures] readyForRedactedApprovalPacketValidationPreflightValidatorRegression=${parsed.readiness.readyForRedactedApprovalPacketValidationPreflightValidatorRegression}`,
  );
}

main();

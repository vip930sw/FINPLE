const fs = require("node:fs");
const path = require("node:path");
const {
  validateRedactedManualOrderPermissionTemplate,
} = require("./validate-trading-redacted-manual-order-permission-template.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template_validator_fixtures.json",
);
const TEMPLATE_PATH = path.join("data", "processed", "trading_lab_step116_redacted_manual_order_permission_template.json");
const VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-manual-order-permission-template.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-redacted-manual-order-permission-template-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "packet_creation_enabled",
  "packet_import_enabled",
  "missing_template_field",
  "missing_template_assertion",
  "missing_forbidden_template_content",
  "changed_future_permission_packet_path",
  "permission_packet_created_flag_enabled",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
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

function withTemplate(baseContract, patch) {
  return {
    ...baseContract,
    futureRedactedManualOrderPermissionTemplate: {
      ...baseContract.futureRedactedManualOrderPermissionTemplate,
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
      id: "packet_creation_enabled",
      expectedErrorCodes: ["template_action_enabled"],
      contract: withTemplate(baseContract, { currentStepCreatesPacket: true }),
    },
    {
      id: "packet_import_enabled",
      expectedErrorCodes: ["template_action_enabled"],
      contract: withTemplate(baseContract, { currentStepImportsPacket: true }),
    },
    {
      id: "missing_template_field",
      expectedErrorCodes: ["missing_template_field"],
      contract: withTemplate(baseContract, {
        requiredTemplateFields: baseContract.futureRedactedManualOrderPermissionTemplate.requiredTemplateFields.filter(
          (field) => field !== "approvedByHash",
        ),
      }),
    },
    {
      id: "missing_template_assertion",
      expectedErrorCodes: ["missing_template_assertion"],
      contract: withTemplate(baseContract, {
        requiredTemplateAssertions:
          baseContract.futureRedactedManualOrderPermissionTemplate.requiredTemplateAssertions.filter(
            (assertion) => assertion !== "template_forbids_raw_order_payloads",
          ),
      }),
    },
    {
      id: "missing_forbidden_template_content",
      expectedErrorCodes: ["missing_forbidden_template_content"],
      contract: withTemplate(baseContract, {
        forbiddenTemplateContent: baseContract.futureRedactedManualOrderPermissionTemplate.forbiddenTemplateContent.filter(
          (item) => item !== "live_order_endpoint",
        ),
      }),
    },
    {
      id: "changed_future_permission_packet_path",
      expectedErrorCodes: ["invalid_future_permission_packet_path"],
      contract: withTemplate(baseContract, {
        futurePermissionPacketPath: "data/private/trading/live_order_permission.json",
      }),
    },
    {
      id: "permission_packet_created_flag_enabled",
      expectedErrorCodes: ["allow_flag_enabled"],
      contract: {
        ...baseContract,
        currentState: { ...baseContract.currentState, permissionPacketCreatedNow: true },
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
          syntheticNumericRawValueShape: "12345678",
        },
      },
    },
  ];
}

function fixtureValidationEvidence(validContract, invalidFixtures) {
  const validResult = validateRedactedManualOrderPermissionTemplate(validContract);
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateRedactedManualOrderPermissionTemplate(fixture.contract);
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
  const template = readJson(TEMPLATE_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidTemplate = clone(template);
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidTemplate);
  const validationEvidence = fixtureValidationEvidence(syntheticValidTemplate, syntheticInvalidFixtures);
  const invalidFixtureIds = syntheticInvalidFixtures.map((fixture) => fixture.id);
  const missingInvalidFixtureIds = missingValues(invalidFixtureIds, REQUIRED_INVALID_FIXTURE_IDS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenFixtureContent = [
    ...fixtureContainsForbiddenContent(syntheticValidTemplate),
    ...syntheticInvalidFixtures.flatMap((fixture) => fixtureContainsForbiddenContent(fixture.contract)),
  ];
  const checks = {
    fixturesOnly: true,
    templateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.providerCallsAllowed === false &&
      template.readiness?.orderSubmissionAllowed === false &&
      template.readiness?.runtimeRouteAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateRedactedManualOrderPermissionTemplate") &&
      validatorSource.includes("contract_path_required") &&
      validatorSource.includes("--contract"),
    architectureDocMentionsValidatorFixtures:
      architectureDoc.includes("Trading Redacted Manual Order Permission Template Validator Fixtures") &&
      architectureDoc.includes("redacted_manual_order_permission_template_validator_fixtures"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    invalidFixtureCatalogReady: missingInvalidFixtureIds.length === 0,
    noForbiddenFixtureContent: forbiddenFixtureContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForRedactedManualOrderPermissionTemplateValidatorRegression =
    checks.templateReady &&
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
    step: "Step 116-4AA",
    scope: "redacted_manual_order_permission_template_validator_fixtures",
    sourceFiles: {
      redactedManualOrderPermissionTemplate: TEMPLATE_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      fixturesOnly: true,
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
        "synthetic redacted manual order permission template validator fixtures only; no real permission packet, account, operator, credential, provider payload, order payload, token, app key, app secret, execution, fill, confirmation, route, UI, DB migration, provider call, or order submission",
      validatorPath: VALIDATOR_PATH,
      currentStepCreatesPacket: false,
      currentStepImportsPacket: false,
      validSyntheticTemplate: syntheticValidTemplate,
      syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      templateStatus: template.readiness?.status,
      invalidFixtureIds,
      missingInvalidFixtureIds,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenFixtureContent: [...new Set(forbiddenFixtureContent)],
    },
    readiness: {
      status: readyForRedactedManualOrderPermissionTemplateValidatorRegression
        ? "fixtures_ready_for_redacted_manual_order_permission_template_validator_regression"
        : "blocked_before_redacted_manual_order_permission_template_validator_fixture_regression",
      readyForRedactedManualOrderPermissionTemplateValidatorRegression,
      fixturesOnly: true,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.templateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsValidatorFixtures
          ? []
          : ["architecture_doc_missing_redacted_manual_order_permission_template_validator_fixtures"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-manual-order-permission-template-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-manual-order-permission-template-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-redacted-manual-order-permission-template-validator-fixtures] ok");
    console.log(`[generate-trading-redacted-manual-order-permission-template-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-manual-order-permission-template-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-redacted-manual-order-permission-template-validator-fixtures] readyForRedactedManualOrderPermissionTemplateValidatorRegression=${parsed.readiness.readyForRedactedManualOrderPermissionTemplateValidatorRegression}`,
  );
}

main();

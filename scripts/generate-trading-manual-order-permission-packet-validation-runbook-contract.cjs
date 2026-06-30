const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
);
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const PACKET_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
);
const TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-packet-validation-runbook-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const REQUIRED_RUNBOOK_STEPS = [
  "explicit_owner_request_required",
  "confirm_no_default_private_packet_path_read",
  "confirm_packet_created_from_redacted_template_outside_current_step",
  "confirm_packet_path_is_owner_supplied_local_path",
  "run_local_validator_with_explicit_packet_argument_only",
  "pass_validation_now_timestamp_explicitly",
  "review_validator_result_without_raw_value_echo",
  "do_not_commit_private_packet",
  "do_not_import_permission_packet_in_this_step",
  "do_not_enable_provider_calls_or_orders",
  "keep_kill_switch_enabled_until_separate_clearance",
  "record_only_redacted_validation_status_later",
];
const REQUIRED_VALIDATION_OUTPUTS = [
  "valid",
  "errors",
  "error.code",
  "error.path",
  "redacted_validation_status",
  "validation_timestamp",
  "packet_path_not_recorded",
];
const REQUIRED_FORBIDDEN_RUNBOOK_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_PERMISSION_PACKET_PATH,
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const packetValidatorFixtures = readJson(PACKET_VALIDATOR_FIXTURES_PATH);
  const template = readJson(TEMPLATE_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const runbookSteps = [...REQUIRED_RUNBOOK_STEPS];
  const validationOutputs = [...REQUIRED_VALIDATION_OUTPUTS];
  const forbiddenRunbookContent = [...REQUIRED_FORBIDDEN_RUNBOOK_CONTENT];
  const missingRunbookSteps = missingValues(runbookSteps, REQUIRED_RUNBOOK_STEPS);
  const missingValidationOutputs = missingValues(validationOutputs, REQUIRED_VALIDATION_OUTPUTS);
  const missingForbiddenRunbookContent = missingValues(forbiddenRunbookContent, REQUIRED_FORBIDDEN_RUNBOOK_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    runbookOnly: true,
    validationPreflightReady:
      validationPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation === true &&
      validationPreflight.readiness?.currentStepRunsValidator === false &&
      validationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      validationPreflight.readiness?.permissionPacketImportedNow === false &&
      validationPreflight.readiness?.providerCallsAllowed === false &&
      validationPreflight.readiness?.orderSubmissionAllowed === false,
    packetValidatorFixturesReady:
      packetValidatorFixtures.readiness?.readyForManualOrderPermissionPacketValidatorRegression === true &&
      packetValidatorFixtures.readiness?.permissionPacketCreatedNow === false &&
      packetValidatorFixtures.readiness?.permissionPacketImportedNow === false &&
      packetValidatorFixtures.readiness?.providerCallsAllowed === false &&
      packetValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    templateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.providerCallsAllowed === false &&
      template.readiness?.orderSubmissionAllowed === false,
    importImplementationPreflightStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      importImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationPreflight.readiness?.permissionPacketImportedNow === false &&
      importImplementationPreflight.readiness?.providerCallsAllowed === false &&
      importImplementationPreflight.readiness?.orderSubmissionAllowed === false,
    validatorExportsExplicitPacketCli:
      validatorSource.includes("validateManualOrderPermissionPacket") &&
      validatorSource.includes("packet_path_required") &&
      validatorSource.includes("--packet"),
    runbookStepsReady: missingRunbookSteps.length === 0,
    validationOutputsReady: missingValidationOutputs.length === 0,
    forbiddenRunbookContentReady: missingForbiddenRunbookContent.length === 0,
    architectureDocMentionsValidationRunbook:
      architectureDoc.includes("Trading Manual Order Permission Packet Validation Runbook") &&
      architectureDoc.includes("manual_order_permission_packet_validation_runbook"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepRunsValidator: false,
    currentStepReadsPrivatePacket: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    importImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerAssistedValidationRunbookReview =
    checks.validationPreflightReady &&
    checks.packetValidatorFixturesReady &&
    checks.templateReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.validatorExportsExplicitPacketCli &&
    checks.runbookStepsReady &&
    checks.validationOutputsReady &&
    checks.forbiddenRunbookContentReady &&
    checks.architectureDocMentionsValidationRunbook &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4K",
    scope: "manual_order_permission_packet_validation_runbook",
    sourceFiles: {
      validationPreflight: VALIDATION_PREFLIGHT_PATH,
      manualOrderPermissionPacketValidatorFixtures: PACKET_VALIDATOR_FIXTURES_PATH,
      redactedManualOrderPermissionTemplate: TEMPLATE_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      runbookOnly: true,
      currentStepRunsValidator: false,
      currentStepReadsPrivatePacket: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedValidationRunbook: {
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      futureValidatorPath: VALIDATOR_PATH,
      currentStepRunsValidator: false,
      currentStepReadsPrivatePacket: false,
      currentStepImportsPacket: false,
      runbookSteps,
      validationOutputs,
      forbiddenRunbookContent,
      commandShape:
        "node scripts/validate-trading-manual-order-permission-packet.cjs --packet <owner-local-redacted-packet-path> --now <ISO-timestamp>",
      safetyNotes: [
        "owner-local-redacted-packet-path must be supplied later by the owner and is not read by this runbook contract",
        "validation output may record redacted status later, but must not record the private packet path or raw values",
        "validation success is not permission import success",
        "validation success is not live_guarded order submission clearance",
      ],
    },
    checks,
    evidence: {
      validationPreflightStatus: validationPreflight.readiness?.status,
      packetValidatorFixturesStatus: packetValidatorFixtures.readiness?.status,
      templateStatus: template.readiness?.status,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status,
      missingRunbookSteps,
      missingValidationOutputs,
      missingForbiddenRunbookContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForOwnerAssistedValidationRunbookReview
        ? "runbook_ready_for_owner_assisted_manual_order_permission_packet_validation_review"
        : "blocked_before_manual_order_permission_packet_validation_runbook_review",
      readyForOwnerAssistedValidationRunbookReview,
      runbookOnly: true,
      currentStepRunsValidator: false,
      currentStepReadsPrivatePacket: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.validationPreflightReady ? [] : ["manual_order_permission_packet_validation_preflight_not_ready"]),
        ...(checks.packetValidatorFixturesReady ? [] : ["manual_order_permission_packet_validator_fixtures_not_ready"]),
        ...(checks.templateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_not_blocked"]),
        ...(checks.validatorExportsExplicitPacketCli ? [] : ["manual_order_permission_packet_validator_cli_not_ready"]),
        ...missingRunbookSteps.map((step) => `missing_runbook_step_${step}`),
        ...missingValidationOutputs.map((output) => `missing_validation_output_${output}`),
        ...missingForbiddenRunbookContent.map((content) => `missing_forbidden_runbook_content_${content}`),
        ...(checks.architectureDocMentionsValidationRunbook
          ? []
          : ["architecture_doc_missing_manual_order_permission_packet_validation_runbook"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-packet-validation-runbook-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-packet-validation-runbook-contract.cjs`);
    }
    console.log("[generate-trading-manual-order-permission-packet-validation-runbook-contract] ok");
    console.log(`[generate-trading-manual-order-permission-packet-validation-runbook-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-packet-validation-runbook-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-packet-validation-runbook-contract] readyForOwnerAssistedValidationRunbookReview=${parsed.readiness.readyForOwnerAssistedValidationRunbookReview}`,
  );
}

main();

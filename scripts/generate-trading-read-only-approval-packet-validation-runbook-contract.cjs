const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_runbook_contract.json",
);
const PREPARATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_preparation_runbook_contract.json",
);
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);
const VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json",
);
const TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_read_only_approval_template.json",
);
const IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-approval-packet-validation-runbook-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const REQUIRED_RUNBOOK_STEPS = [
  "explicit_owner_request_required",
  "confirm_packet_prepared_from_redacted_template_outside_repo",
  "confirm_no_default_private_packet_path_read",
  "confirm_packet_path_is_owner_supplied_local_path",
  "run_local_validator_with_explicit_packet_argument_only",
  "pass_validation_now_timestamp_explicitly",
  "review_validator_result_without_raw_value_echo",
  "record_only_redacted_validation_status_later",
  "do_not_commit_private_packet",
  "do_not_import_approval_packet_in_this_step",
  "do_not_call_kis_or_alpha_or_any_provider",
  "do_not_enable_provider_calls_or_orders",
  "keep_scenario_monthly_returns_absent",
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
  "raw_operator_name",
  "raw_evidence_text",
  "raw_revocation_plan",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_APPROVAL_PACKET_PATH,
  path.join("scripts", "create-trading-redacted-approval-hashes.cjs"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildRunbook() {
  return {
    scope: "read_only_approval_packet_validation_runbook",
    futureApprovalPacketPath: FUTURE_APPROVAL_PACKET_PATH,
    futureValidatorPath: VALIDATOR_PATH,
    currentStepRunsValidator: false,
    currentStepReadsPrivatePacket: false,
    currentStepCreatesApprovalPacket: false,
    currentStepImportsApprovalPacket: false,
    runbookSteps: REQUIRED_RUNBOOK_STEPS,
    validationOutputs: REQUIRED_VALIDATION_OUTPUTS,
    forbiddenRunbookContent: REQUIRED_FORBIDDEN_RUNBOOK_CONTENT,
    commandShape:
      "node scripts/validate-trading-redacted-read-only-approval-packet.cjs --packet <owner-local-redacted-packet-path> --now <ISO-timestamp>",
    ownerSafetyNotes: [
      "owner-local-redacted-packet-path must be supplied later and is not read by this runbook contract",
      "validation output may record redacted status later, but must not record the packet path or raw values",
      "validation success is not approval import success",
      "validation success is not read-only provider-call authorization",
      "validation success is not live trading clearance",
    ],
  };
}

function buildContract() {
  const preparationRunbook = readJson(PREPARATION_RUNBOOK_PATH);
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const validatorFixtures = readJson(VALIDATOR_FIXTURES_PATH);
  const template = readJson(TEMPLATE_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const runbook = buildRunbook();
  const missingRunbookSteps = missingValues(runbook.runbookSteps, REQUIRED_RUNBOOK_STEPS);
  const missingValidationOutputs = missingValues(runbook.validationOutputs, REQUIRED_VALIDATION_OUTPUTS);
  const missingForbiddenRunbookContent = missingValues(
    runbook.forbiddenRunbookContent,
    REQUIRED_FORBIDDEN_RUNBOOK_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    runbookOnly: true,
    preparationRunbookReady:
      preparationRunbook.readiness?.readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook === true &&
      preparationRunbook.readiness?.approvalPacketCreatedNow === false &&
      preparationRunbook.readiness?.approvalPacketImportedNow === false &&
      preparationRunbook.readiness?.providerCallsAllowed === false,
    validationPreflightReady:
      validationPreflight.readiness?.readyForPureLocalValidatorImplementationReview === true &&
      validationPreflight.readiness?.approvalPacketCreatedNow === false &&
      validationPreflight.readiness?.approvalPacketImportedNow === false &&
      validationPreflight.readiness?.providerCallsAllowed === false &&
      validationPreflight.readiness?.orderSubmissionAllowed === false,
    validatorFixturesReady:
      validatorFixtures.readiness?.readyForValidatorFixtureRegression === true &&
      validatorFixtures.readiness?.privateApprovalPacketCreated === false &&
      validatorFixtures.readiness?.approvalPacketImportedNow === false &&
      validatorFixtures.readiness?.providerCallsAllowed === false &&
      validatorFixtures.readiness?.orderSubmissionAllowed === false,
    templateReady:
      template.readiness?.readyForOwnerRedactedApprovalPacketPreparation === true &&
      template.readiness?.approvalPacketCreatedNow === false &&
      template.readiness?.approvalPacketImportedNow === false,
    importImplementationStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      importImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      importImplementationPreflight.readiness?.providerCallsAllowed === false,
    validatorExportsExplicitPacketCli:
      validatorSource.includes("validateRedactedApprovalPacket") &&
      validatorSource.includes("packet_path_required") &&
      validatorSource.includes("--packet"),
    runbookStepsReady: missingRunbookSteps.length === 0,
    validationOutputsReady: missingValidationOutputs.length === 0,
    forbiddenRunbookContentReady: missingForbiddenRunbookContent.length === 0,
    architectureDocMentionsValidationRunbook:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Runbook") &&
      architectureDoc.includes("read_only_approval_packet_validation_runbook"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepRunsValidator: false,
    currentStepReadsPrivatePacket: false,
    approvalPacketCreatedNow: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerAssistedReadOnlyApprovalPacketValidationRunbook =
    checks.preparationRunbookReady &&
    checks.validationPreflightReady &&
    checks.validatorFixturesReady &&
    checks.templateReady &&
    checks.importImplementationStillBlocked &&
    checks.validatorExportsExplicitPacketCli &&
    checks.runbookStepsReady &&
    checks.validationOutputsReady &&
    checks.forbiddenRunbookContentReady &&
    checks.architectureDocMentionsValidationRunbook &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5I",
    scope: "read_only_approval_packet_validation_runbook",
    sourceFiles: {
      readOnlyApprovalPacketPreparationRunbook: PREPARATION_RUNBOOK_PATH,
      redactedApprovalPacketValidationPreflight: VALIDATION_PREFLIGHT_PATH,
      redactedApprovalPacketValidatorFixtures: VALIDATOR_FIXTURES_PATH,
      redactedReadOnlyApprovalTemplate: TEMPLATE_PATH,
      readOnlyApprovalImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      runbookOnly: true,
      currentStepRunsValidator: false,
      currentStepReadsPrivatePacket: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedReadOnlyApprovalPacketValidationRunbook: runbook,
    checks,
    evidence: {
      missingRunbookSteps,
      missingValidationOutputs,
      missingForbiddenRunbookContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      preparationRunbookStatus: preparationRunbook.readiness?.status ?? null,
      validationPreflightStatus: validationPreflight.readiness?.status ?? null,
      validatorFixturesStatus: validatorFixtures.readiness?.status ?? null,
      templateStatus: template.readiness?.status ?? null,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status ?? null,
    },
    readiness: {
      status: readyForOwnerAssistedReadOnlyApprovalPacketValidationRunbook
        ? "runbook_ready_for_owner_assisted_read_only_approval_packet_validation_review"
        : "blocked_before_read_only_approval_packet_validation_runbook",
      readyForOwnerAssistedReadOnlyApprovalPacketValidationRunbook,
      runbookOnly: true,
      currentStepRunsValidator: false,
      currentStepReadsPrivatePacket: false,
      approvalPacketCreatedNow: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.preparationRunbookReady ? [] : ["read_only_approval_packet_preparation_runbook_not_ready"]),
        ...(checks.validationPreflightReady ? [] : ["redacted_approval_packet_validation_preflight_not_ready"]),
        ...(checks.validatorFixturesReady ? [] : ["redacted_approval_packet_validator_fixtures_not_ready"]),
        ...(checks.templateReady ? [] : ["redacted_read_only_approval_template_not_ready"]),
        ...(checks.importImplementationStillBlocked ? [] : ["read_only_approval_import_implementation_not_blocked"]),
        ...(checks.validatorExportsExplicitPacketCli ? [] : ["redacted_approval_packet_validator_cli_not_ready"]),
        ...missingRunbookSteps.map((step) => `missing_runbook_step_${step}`),
        ...missingValidationOutputs.map((output) => `missing_validation_output_${output}`),
        ...missingForbiddenRunbookContent.map((content) => `missing_forbidden_runbook_content_${content}`),
        ...(checks.architectureDocMentionsValidationRunbook
          ? []
          : ["architecture_doc_missing_read_only_approval_packet_validation_runbook"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_redacted_read_only_approval_packet_not_supplied",
        "read_only_approval_packet_validation_not_executed",
        "read_only_approval_import_review_blocked_pending_owner_packet",
        "read_only_provider_call_authorization_review_result_not_owner_supplied",
        "provider_calls_blocked_until_owner_packet_import_and_review",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-approval-packet-validation-runbook-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-approval-packet-validation-runbook-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-approval-packet-validation-runbook-contract] ok");
    console.log(
      `[generate-trading-read-only-approval-packet-validation-runbook-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-approval-packet-validation-runbook-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-packet-validation-runbook-contract] readyForOwnerAssistedReadOnlyApprovalPacketValidationRunbook=${parsed.readiness.readyForOwnerAssistedReadOnlyApprovalPacketValidationRunbook}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
);
const HASH_HELPER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
);
const IMPLEMENTATION_REVIEW_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
);
const IMPLEMENTATION_REVIEW_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
);
const MANUAL_ORDER_PERMISSION_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-hash-preparation-runbook-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-manual-order-permission-hashes.cjs");
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const REQUIRED_RUNBOOK_STEPS = [
  "explicit_owner_request_required",
  "confirm_offline_local_shell",
  "confirm_repo_worktree_clean_before_private_inputs",
  "prepare_private_pepper_outside_repo",
  "prepare_raw_inputs_outside_repo",
  "use_stdin_or_interactive_prompts_only",
  "reject_command_line_raw_secret_arguments",
  "generate_labelled_hashes_only",
  "verify_required_output_labels",
  "copy_hashes_only_to_private_permission_packet_outside_repo",
  "manually_review_no_raw_values_in_outputs",
  "delete_private_scratchpad_after_review",
  "keep_kill_switch_enabled_until_separate_clearance",
  "do_not_import_permission_packet_in_this_step",
];
const REQUIRED_OUTPUT_LABELS = [
  "approvedByHash",
  "operatorAccessHash",
  "manualApprovalPolicyHash",
  "orderAdapterDesignReviewHash",
  "killSwitchClearanceHash",
  "riskGateClearanceHash",
  "orderCredentialBoundaryHash",
  "dryRunReplayHash",
  "shadowHistoryReviewHash",
  "auditLoggerReadinessHash",
  "allowedSymbolHashes",
  "revocationPlanHash",
];
const FORBIDDEN_RUNBOOK_CONTENT = [
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
  FUTURE_HASH_HELPER_PATH,
  FUTURE_PERMISSION_PACKET_PATH,
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const preflight = readJson(HASH_HELPER_PREFLIGHT_PATH);
  const implementationReview = readJson(IMPLEMENTATION_REVIEW_CONTRACT_PATH);
  const implementationReviewFixtures = readJson(IMPLEMENTATION_REVIEW_FIXTURES_PATH);
  const template = readJson(MANUAL_ORDER_PERMISSION_TEMPLATE_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const runbookSteps = [...REQUIRED_RUNBOOK_STEPS];
  const outputLabels = [...REQUIRED_OUTPUT_LABELS];
  const forbiddenRunbookContent = [...FORBIDDEN_RUNBOOK_CONTENT];
  const missingRunbookSteps = missingValues(runbookSteps, REQUIRED_RUNBOOK_STEPS);
  const missingOutputLabels = missingValues(outputLabels, REQUIRED_OUTPUT_LABELS);
  const missingForbiddenRunbookContent = missingValues(forbiddenRunbookContent, FORBIDDEN_RUNBOOK_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    hashHelperPreflightDeferred:
      preflight.readiness?.readyForOwnerAssistedManualOrderHashPreparationLater === true &&
      preflight.readiness?.ownerHashPreparationDeferred === true &&
      preflight.readiness?.hashGenerationAllowed === false &&
      preflight.readiness?.providerCallsAllowed === false &&
      preflight.readiness?.orderSubmissionAllowed === false,
    implementationReviewReady:
      implementationReview.readiness?.readyForFutureLocalHashHelperImplementationReview === true &&
      implementationReview.readiness?.helperImplementationCreatedNow === false &&
      implementationReview.readiness?.hashGenerationAllowed === false &&
      implementationReview.readiness?.permissionPacketCreatedNow === false &&
      implementationReview.readiness?.providerCallsAllowed === false &&
      implementationReview.readiness?.orderSubmissionAllowed === false,
    implementationReviewFixturesReady:
      implementationReviewFixtures.readiness?.readyForImplementationReviewValidatorFixtureRegression === true &&
      implementationReviewFixtures.readiness?.helperImplementationCreatedNow === false &&
      implementationReviewFixtures.readiness?.hashGenerationAllowed === false &&
      implementationReviewFixtures.readiness?.permissionPacketCreatedNow === false &&
      implementationReviewFixtures.readiness?.providerCallsAllowed === false &&
      implementationReviewFixtures.readiness?.orderSubmissionAllowed === false,
    manualOrderPermissionTemplateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.providerCallsAllowed === false &&
      template.readiness?.orderSubmissionAllowed === false,
    runbookStepsReady: missingRunbookSteps.length === 0,
    outputLabelsReady: missingOutputLabels.length === 0,
    forbiddenRunbookContentReady: missingForbiddenRunbookContent.length === 0,
    architectureDocMentionsHashPreparationRunbook:
      architectureDoc.includes("Trading Manual Order Permission Hash Preparation Runbook Contract") &&
      architectureDoc.includes("manual_order_permission_hash_preparation_runbook_contract"),
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
  const readyForOwnerAssistedHashPreparationRunbookReview =
    checks.hashHelperPreflightDeferred &&
    checks.implementationReviewReady &&
    checks.implementationReviewFixturesReady &&
    checks.manualOrderPermissionTemplateReady &&
    checks.runbookStepsReady &&
    checks.outputLabelsReady &&
    checks.forbiddenRunbookContentReady &&
    checks.architectureDocMentionsHashPreparationRunbook &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4B",
    scope: "manual_order_permission_hash_preparation_runbook_contract",
    sourceFiles: {
      manualOrderPermissionHashHelperPreflight: HASH_HELPER_PREFLIGHT_PATH,
      implementationReviewContract: IMPLEMENTATION_REVIEW_CONTRACT_PATH,
      implementationReviewValidatorFixtures: IMPLEMENTATION_REVIEW_FIXTURES_PATH,
      redactedManualOrderPermissionTemplate: MANUAL_ORDER_PERMISSION_TEMPLATE_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      runbookOnly: true,
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
    futureOwnerAssistedHashPreparationRunbook: {
      futureHashHelperPath: FUTURE_HASH_HELPER_PATH,
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      currentStepCreatesHelper: false,
      currentStepRunsHelper: false,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      currentStepCapturesHashOutput: false,
      currentStepCreatesPermissionPacket: false,
      runbookSteps,
      requiredOutputLabels: outputLabels,
      forbiddenRunbookContent,
      ownerAssistanceBoundary:
        "prepare hashes only after an explicit owner request, in a local offline shell, without committing raw inputs, peppers, hash outputs, or private permission packets",
    },
    checks,
    evidence: {
      missingRunbookSteps,
      missingOutputLabels,
      missingForbiddenRunbookContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualOrderPermissionHashHelperPreflightStatus: preflight.readiness?.status,
      implementationReviewContractStatus: implementationReview.readiness?.status,
      implementationReviewValidatorFixturesStatus: implementationReviewFixtures.readiness?.status,
      redactedManualOrderPermissionTemplateStatus: template.readiness?.status,
    },
    readiness: {
      status: readyForOwnerAssistedHashPreparationRunbookReview
        ? "contract_ready_pending_owner_assisted_manual_order_hash_preparation_runbook_review"
        : "blocked_before_manual_order_permission_hash_preparation_runbook_contract",
      readyForOwnerAssistedHashPreparationRunbookReview,
      runbookOnly: true,
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
        ...(checks.hashHelperPreflightDeferred ? [] : ["manual_order_permission_hash_helper_preflight_not_deferred"]),
        ...(checks.implementationReviewReady
          ? []
          : ["manual_order_permission_hash_helper_implementation_review_not_ready"]),
        ...(checks.implementationReviewFixturesReady
          ? []
          : ["manual_order_permission_hash_helper_implementation_review_fixtures_not_ready"]),
        ...(checks.manualOrderPermissionTemplateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...missingRunbookSteps.map((step) => `missing_runbook_step_${step}`),
        ...missingOutputLabels.map((label) => `missing_output_label_${label}`),
        ...missingForbiddenRunbookContent.map((content) => `missing_forbidden_runbook_content_${content}`),
        ...(checks.architectureDocMentionsHashPreparationRunbook
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_preparation_runbook"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-preparation-runbook-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-preparation-runbook-contract.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-preparation-runbook-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-hash-preparation-runbook-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-preparation-runbook-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-preparation-runbook-contract] readyForOwnerAssistedHashPreparationRunbookReview=${parsed.readiness.readyForOwnerAssistedHashPreparationRunbookReview}`,
  );
}

main();

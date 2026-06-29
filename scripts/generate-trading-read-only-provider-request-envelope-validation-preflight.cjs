const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
);
const REQUEST_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const REQUEST_ENVELOPE_VALIDATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json",
);
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-request-envelope-validation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-provider-request-envelope.cjs",
);
const REQUIRED_PREFLIGHT_GATES = [
  "request_envelope_contract_ready",
  "request_envelope_validation_contract_ready",
  "approval_import_still_deferred",
  "progress_summary_still_fail_closed",
  "validator_implementation_not_created_now",
  "provider_request_not_created_now",
  "provider_call_not_allowed_now",
  "runtime_route_not_allowed_now",
  "db_migration_not_allowed_now",
  "public_ui_not_allowed_now",
  "order_submission_not_allowed_now",
];
const REQUIRED_IMPLEMENTATION_REVIEW_RULES = [
  "pure_node_script_only",
  "reads_candidate_envelope_from_explicit_local_path_later",
  "no_default_private_approval_packet_read",
  "no_network_access",
  "no_environment_secret_loading",
  "no_token_refresh",
  "no_provider_request_creation",
  "no_provider_call",
  "no_order_endpoint",
  "no_runtime_route",
  "no_database_write",
  "no_public_ui",
  "deterministic_validation_result",
  "redacted_error_messages_only",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingReadOnlyProviderRequestEnvelopeValidation.js"),
  path.join("server", "src", "services", "trading", "readOnlyProviderRequestEnvelopeValidation.js"),
  path.join("server", "src", "services", "tradingReadOnlyProvider.js"),
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

function buildContract() {
  const requestEnvelopeContract = readJson(REQUEST_ENVELOPE_CONTRACT_PATH);
  const requestEnvelopeValidationContract = readJson(REQUEST_ENVELOPE_VALIDATION_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const preflightGates = [...REQUIRED_PREFLIGHT_GATES];
  const implementationReviewRules = [...REQUIRED_IMPLEMENTATION_REVIEW_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingPreflightGates = missingValues(preflightGates, REQUIRED_PREFLIGHT_GATES);
  const missingImplementationReviewRules = missingValues(implementationReviewRules, REQUIRED_IMPLEMENTATION_REVIEW_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    requestEnvelopeContractReady:
      requestEnvelopeContract.readiness?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      requestEnvelopeContract.readiness?.requestEnvelopeImplementationAllowed === false &&
      requestEnvelopeContract.readiness?.providerCallsAllowed === false &&
      requestEnvelopeContract.readiness?.orderSubmissionAllowed === false &&
      requestEnvelopeContract.readiness?.runtimeRouteAllowed === false,
    requestEnvelopeValidationContractReady:
      requestEnvelopeValidationContract.readiness
        ?.readyForFutureReadOnlyProviderRequestEnvelopeValidationImplementationReview === true &&
      requestEnvelopeValidationContract.readiness?.validationImplementationAllowed === false &&
      requestEnvelopeValidationContract.readiness?.requestEnvelopeImplementationAllowed === false &&
      requestEnvelopeValidationContract.readiness?.providerCallsAllowed === false &&
      requestEnvelopeValidationContract.readiness?.orderSubmissionAllowed === false &&
      requestEnvelopeValidationContract.readiness?.runtimeRouteAllowed === false,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillLocked:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.providerCallsAllowed === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false &&
      progressSummary.readiness?.runtimeRouteAllowed === false,
    preflightGatesReady: missingPreflightGates.length === 0,
    implementationReviewRulesReady: missingImplementationReviewRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsRequestEnvelopeValidationPreflight:
      architectureDoc.includes("Trading Read-Only Provider Request Envelope Validation Preflight") &&
      architectureDoc.includes("read_only_provider_request_envelope_validation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    validationImplementationAllowedNow: true,
    providerRequestCreatedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForPureLocalRequestEnvelopeValidatorImplementationReview =
    checks.requestEnvelopeContractReady &&
    checks.requestEnvelopeValidationContractReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.progressSummaryStillLocked &&
    checks.preflightGatesReady &&
    checks.implementationReviewRulesReady &&
    checks.forbiddenPreflightContentReady &&
    checks.architectureDocMentionsRequestEnvelopeValidationPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2N",
    scope: "trading_read_only_provider_request_envelope_validation_preflight",
    sourceFiles: {
      requestEnvelopeContract: REQUEST_ENVELOPE_CONTRACT_PATH,
      requestEnvelopeValidationContract: REQUEST_ENVELOPE_VALIDATION_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      validationImplementationAllowedNow: true,
      providerRequestCreatedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futurePureLocalRequestEnvelopeValidatorBoundary: {
      scope: "read_only_provider_request_envelope_validation_preflight",
      futureValidatorPath: FUTURE_VALIDATOR_PATH,
      currentStepImplementsValidator: true,
      currentStepCreatesProviderRequest: false,
      currentStepCallsProvider: false,
      preflightGates,
      implementationReviewRules,
      forbiddenPreflightContent,
      promotionRules: [
        "preflight success allows only a future pure local request-envelope validator implementation review",
        "preflight success does not create provider requests",
        "preflight success does not call KIS or any provider",
        "preflight success does not create runtime routes, DB migrations, public UI, or orders",
      ],
    },
    checks,
    evidence: {
      missingPreflightGates,
      missingImplementationReviewRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      requestEnvelopeContractStatus: requestEnvelopeContract.readiness?.status,
      requestEnvelopeValidationContractStatus: requestEnvelopeValidationContract.readiness?.status,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      progressSummaryStatus: progressSummary.readiness?.status,
    },
    readiness: {
      status: readyForPureLocalRequestEnvelopeValidatorImplementationReview
        ? "preflight_ready_pending_pure_local_request_envelope_validator_implementation_review"
        : "blocked_before_read_only_provider_request_envelope_validation_preflight",
      readyForPureLocalRequestEnvelopeValidatorImplementationReview,
      validationImplementationAllowedNow: true,
      providerRequestCreatedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.requestEnvelopeContractReady ? [] : ["read_only_provider_request_envelope_contract_not_ready"]),
        ...(checks.requestEnvelopeValidationContractReady
          ? []
          : ["read_only_provider_request_envelope_validation_contract_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.progressSummaryStillLocked ? [] : ["progress_summary_not_locked"]),
        ...missingPreflightGates.map((gate) => `missing_preflight_gate_${gate}`),
        ...missingImplementationReviewRules.map((rule) => `missing_implementation_review_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsRequestEnvelopeValidationPreflight
          ? []
          : ["architecture_doc_missing_read_only_provider_request_envelope_validation_preflight"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-request-envelope-validation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-request-envelope-validation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-read-only-provider-request-envelope-validation-preflight] ok");
    console.log(`[generate-trading-read-only-provider-request-envelope-validation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-request-envelope-validation-preflight] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-request-envelope-validation-preflight] readyForPureLocalRequestEnvelopeValidatorImplementationReview=${parsed.readiness.readyForPureLocalRequestEnvelopeValidatorImplementationReview}`,
  );
}

main();

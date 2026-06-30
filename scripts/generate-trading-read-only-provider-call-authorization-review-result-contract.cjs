const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight_validator_fixtures.json",
);
const RESPONSE_VALIDATION_RESULT_RECEIPT_REVIEW_RESULT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_result_contract.json",
);
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-call-authorization-review-result-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_REVIEW_RESULT_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_provider_call_authorization_review_result.redacted.json",
);
const REQUIRED_REVIEW_RESULT_FIELDS = [
  "providerCallAuthorizationReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "approvalImportReviewHash",
  "providerImplementationReviewHash",
  "responseValidationReviewResultHash",
  "requestEnvelopePolicyHash",
  "endpointAllowlistHash",
  "riskGatePolicyHash",
  "redactionVersion",
  "providerCallAuthorizationAllowedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_REVIEW_ASSERTIONS = [
  "review_result_is_redacted_only",
  "review_result_does_not_include_raw_kis_credentials",
  "review_result_does_not_include_access_tokens",
  "review_result_does_not_include_account_ids",
  "review_result_does_not_create_provider_requests",
  "review_result_does_not_call_provider",
  "review_result_does_not_submit_orders",
  "review_result_does_not_create_runtime_route",
  "review_result_does_not_create_public_ui",
  "review_result_requires_separate_private_provider_implementation",
  "review_result_requires_separate_owner_approval_import",
];
const FORBIDDEN_REVIEW_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_response_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_REVIEW_RESULT_PATH,
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
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
  const callAuthorizationPreflight = readJson(CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const callAuthorizationPreflightValidatorFixtures = readJson(CALL_AUTHORIZATION_PREFLIGHT_VALIDATOR_FIXTURES_PATH);
  const responseValidationReviewResult = readJson(RESPONSE_VALIDATION_RESULT_RECEIPT_REVIEW_RESULT_CONTRACT_PATH);
  const privateReadOnlyProviderImplementationPreflight = readJson(PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH);
  const readOnlyApprovalImportImplementationPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultFields = [...REQUIRED_REVIEW_RESULT_FIELDS];
  const reviewAssertions = [...REQUIRED_REVIEW_ASSERTIONS];
  const forbiddenReviewContent = [...FORBIDDEN_REVIEW_CONTENT];
  const missingReviewResultFields = missingValues(reviewResultFields, REQUIRED_REVIEW_RESULT_FIELDS);
  const missingReviewAssertions = missingValues(reviewAssertions, REQUIRED_REVIEW_ASSERTIONS);
  const missingForbiddenReviewContent = missingValues(forbiddenReviewContent, FORBIDDEN_REVIEW_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    reviewResultContractOnly: true,
    callAuthorizationPreflightRecorded:
      callAuthorizationPreflight.readiness?.status ===
        "preflight_recorded_provider_call_authorization_blocked_pending_owner_packet_and_provider_review" &&
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false &&
      callAuthorizationPreflight.readiness?.orderSubmissionAllowed === false,
    callAuthorizationPreflightValidatorFixturesReady:
      callAuthorizationPreflightValidatorFixtures.readiness
        ?.readyForReadOnlyProviderCallAuthorizationPreflightValidatorFixtureRegression === true &&
      callAuthorizationPreflightValidatorFixtures.readiness?.providerCallsAllowed === false &&
      callAuthorizationPreflightValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    responseValidationReviewResultReady:
      responseValidationReviewResult.readiness?.readyForFutureResponseValidationResultReceiptReviewResult === true &&
      responseValidationReviewResult.readiness?.providerCallsAllowed === false &&
      responseValidationReviewResult.readiness?.orderSubmissionAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderImplementationPreflight.readiness?.readyForFuturePrivateReadOnlyProviderImplementationReview ===
        false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.orderSubmissionAllowed === false,
    readOnlyApprovalImportStillBlocked:
      readOnlyApprovalImportImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview ===
        false &&
      readOnlyApprovalImportImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportImplementationPreflight.readiness?.providerCallsAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    reviewResultFieldsReady: missingReviewResultFields.length === 0,
    reviewAssertionsReady: missingReviewAssertions.length === 0,
    forbiddenReviewContentReady: missingForbiddenReviewContent.length === 0,
    architectureDocMentionsCallAuthorizationReviewResult:
      architectureDoc.includes("Trading Read-Only Provider Call Authorization Review Result") &&
      architectureDoc.includes("read_only_provider_call_authorization_review_result"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallAuthorizationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureReadOnlyProviderCallAuthorizationReviewResult =
    checks.callAuthorizationPreflightRecorded &&
    checks.callAuthorizationPreflightValidatorFixturesReady &&
    checks.responseValidationReviewResultReady &&
    checks.privateReadOnlyProviderImplementationStillBlocked &&
    checks.readOnlyApprovalImportStillBlocked &&
    checks.envRiskGateStillFailClosed &&
    checks.reviewResultFieldsReady &&
    checks.reviewAssertionsReady &&
    checks.forbiddenReviewContentReady &&
    checks.architectureDocMentionsCallAuthorizationReviewResult &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3M",
    scope: "read_only_provider_call_authorization_review_result",
    sourceFiles: {
      readOnlyProviderCallAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      readOnlyProviderCallAuthorizationPreflightValidatorFixtures: CALL_AUTHORIZATION_PREFLIGHT_VALIDATOR_FIXTURES_PATH,
      responseValidationResultReceiptReviewResult: RESPONSE_VALIDATION_RESULT_RECEIPT_REVIEW_RESULT_CONTRACT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      readOnlyApprovalImportImplementationPreflight: READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      reviewResultContractOnly: true,
      providerCallAuthorizationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureReadOnlyProviderCallAuthorizationReviewResultBoundary: {
      scope: "read_only_provider_call_authorization_review_result",
      futureReviewResultPath: FUTURE_REVIEW_RESULT_PATH,
      currentStepReadsPrivateReviewResult: false,
      currentStepWritesPrivateReviewResult: false,
      currentStepAuthorizesProviderCalls: false,
      currentStepCreatesProviderRequest: false,
      currentStepCallsProvider: false,
      currentStepRefreshesToken: false,
      currentStepWritesDatabase: false,
      reviewResultFields,
      reviewAssertions,
      forbiddenReviewContent,
      promotionRules: [
        "this contract does not authorize read-only provider calls",
        "call authorization review result readiness is only a future owner-assisted review shape",
        "provider calls remain blocked until owner approval import and provider implementation reviews are recorded separately",
        "read-only provider calls remain separate from any order submission or live_guarded trading clearance",
      ],
    },
    checks,
    evidence: {
      missingReviewResultFields,
      missingReviewAssertions,
      missingForbiddenReviewContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      callAuthorizationPreflightStatus: callAuthorizationPreflight.readiness?.status ?? null,
      responseValidationReviewResultStatus: responseValidationReviewResult.readiness?.status ?? null,
      privateReadOnlyProviderImplementationPreflightStatus:
        privateReadOnlyProviderImplementationPreflight.readiness?.status ?? null,
      readOnlyApprovalImportImplementationPreflightStatus:
        readOnlyApprovalImportImplementationPreflight.readiness?.status ?? null,
      envRiskGateStatus: envRiskGateContract.readiness?.status ?? null,
    },
    readiness: {
      status: readyForFutureReadOnlyProviderCallAuthorizationReviewResult
        ? "review_result_contract_ready_pending_owner_provider_call_authorization_review"
        : "blocked_before_read_only_provider_call_authorization_review_result",
      readyForFutureReadOnlyProviderCallAuthorizationReviewResult,
      providerCallAuthorizationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.callAuthorizationPreflightRecorded ? [] : ["call_authorization_preflight_not_recorded"]),
        ...(checks.callAuthorizationPreflightValidatorFixturesReady
          ? []
          : ["call_authorization_preflight_validator_fixtures_not_ready"]),
        ...(checks.responseValidationReviewResultReady ? [] : ["response_validation_review_result_not_ready"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_not_blocked"]),
        ...(checks.readOnlyApprovalImportStillBlocked ? [] : ["read_only_approval_import_not_blocked"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_not_fail_closed"]),
        ...(checks.reviewResultFieldsReady ? [] : ["review_result_fields_missing"]),
        ...(checks.reviewAssertionsReady ? [] : ["review_assertions_missing"]),
        ...(checks.forbiddenReviewContentReady ? [] : ["forbidden_review_content_missing"]),
        ...(checks.architectureDocMentionsCallAuthorizationReviewResult
          ? []
          : ["architecture_doc_missing_call_authorization_review_result"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
        "private_read_only_provider_implementation_review_blocked_pending_owner_packet_import",
        "read_only_provider_call_authorization_review_result_not_owner_supplied",
        "provider_calls_still_blocked_until_private_review_chain_complete",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-call-authorization-review-result-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-call-authorization-review-result-contract.cjs`);
    }
    console.log("[generate-trading-read-only-provider-call-authorization-review-result-contract] ok");
    console.log(`[generate-trading-read-only-provider-call-authorization-review-result-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-call-authorization-review-result-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-call-authorization-review-result-contract] readyForFutureReadOnlyProviderCallAuthorizationReviewResult=${parsed.readiness.readyForFutureReadOnlyProviderCallAuthorizationReviewResult}`,
  );
}

main();

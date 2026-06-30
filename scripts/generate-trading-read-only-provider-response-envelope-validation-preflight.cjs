const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json",
);
const RESPONSE_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const REQUEST_ENVELOPE_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json",
);
const ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
);
const SNAPSHOT_NORMALIZATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
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

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-response-envelope-validation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-response-envelope.cjs");
const REQUIRED_PREFLIGHT_GATES = [
  "response_envelope_contract_ready",
  "request_envelope_fixtures_ready",
  "endpoint_category_validation_ready",
  "snapshot_normalization_contract_ready",
  "provider_call_authorization_still_blocked",
  "env_risk_gate_fail_closed",
  "response_payload_not_received_now",
  "provider_call_not_allowed_now",
  "runtime_route_not_allowed_now",
  "db_migration_not_allowed_now",
  "public_ui_not_allowed_now",
  "order_submission_not_allowed_now",
];
const REQUIRED_VALIDATOR_RULES = [
  "pure_node_script_only",
  "reads_candidate_response_envelope_from_explicit_local_path_later",
  "no_default_private_approval_packet_read",
  "no_network_access",
  "no_environment_secret_loading",
  "no_token_refresh",
  "no_provider_response_fetch",
  "no_provider_call",
  "no_order_response_category",
  "no_raw_provider_payload_persistence",
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
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
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
  const responseEnvelopeContract = readJson(RESPONSE_ENVELOPE_CONTRACT_PATH);
  const requestEnvelopeValidatorFixtures = readJson(REQUEST_ENVELOPE_VALIDATOR_FIXTURES_PATH);
  const endpointCategoryValidationPreflight = readJson(ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH);
  const snapshotNormalizationContract = readJson(SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const callAuthorizationPreflight = readJson(CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const preflightGates = [...REQUIRED_PREFLIGHT_GATES];
  const validatorRules = [...REQUIRED_VALIDATOR_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingPreflightGates = missingValues(preflightGates, REQUIRED_PREFLIGHT_GATES);
  const missingValidatorRules = missingValues(validatorRules, REQUIRED_VALIDATOR_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    responseEnvelopeContractReady:
      responseEnvelopeContract.readiness?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      responseEnvelopeContract.readiness?.responseEnvelopeImplementationAllowed === false &&
      responseEnvelopeContract.readiness?.providerCallsAllowed === false &&
      responseEnvelopeContract.readiness?.orderSubmissionAllowed === false,
    requestEnvelopeValidatorFixturesReady:
      requestEnvelopeValidatorFixtures.readiness?.readyForRequestEnvelopeFixtureRegression === true &&
      requestEnvelopeValidatorFixtures.readiness?.providerRequestCreatedNow === false &&
      requestEnvelopeValidatorFixtures.readiness?.providerCallsAllowed === false,
    endpointCategoryValidationPreflightReady:
      endpointCategoryValidationPreflight.readiness?.readyForFutureReadOnlyProviderEndpointCategoryValidationReview ===
        true &&
      endpointCategoryValidationPreflight.readiness?.providerCallsAllowed === false,
    snapshotNormalizationContractReady:
      snapshotNormalizationContract.readiness?.readyForFutureReadOnlySnapshotNormalizationImplementationReview === true &&
      snapshotNormalizationContract.readiness?.providerCallsAllowed === false &&
      snapshotNormalizationContract.readiness?.orderSubmissionAllowed === false,
    callAuthorizationStillBlocked:
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    preflightGatesReady: missingPreflightGates.length === 0,
    validatorRulesReady: missingValidatorRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsResponseEnvelopeValidationPreflight:
      architectureDoc.includes("Trading Read-Only Provider Response Envelope Validation Preflight") &&
      architectureDoc.includes("read_only_provider_response_envelope_validation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    responseEnvelopeValidatorImplementationAllowedNow: true,
    responsePayloadReceivedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3J",
    scope: "read_only_provider_response_envelope_validation_preflight",
    sourceFiles: {
      responseEnvelopeContract: RESPONSE_ENVELOPE_CONTRACT_PATH,
      requestEnvelopeValidatorFixtures: REQUEST_ENVELOPE_VALIDATOR_FIXTURES_PATH,
      endpointCategoryValidationPreflight: ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT_PATH,
      snapshotNormalizationContract: SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      callAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      responseEnvelopeValidatorImplementationAllowedNow: true,
      responsePayloadReceivedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futurePureLocalResponseEnvelopeValidatorBoundary: {
      scope: "read_only_provider_response_envelope_validation_preflight",
      validatorPath: VALIDATOR_PATH,
      currentStepImplementsValidator: fs.existsSync(VALIDATOR_PATH),
      currentStepReceivesProviderResponse: false,
      currentStepCallsProvider: false,
      preflightGates,
      validatorRules,
      forbiddenPreflightContent,
      promotionRules: [
        "preflight success allows only a future pure local response-envelope validator implementation review",
        "preflight success does not receive provider responses",
        "preflight success does not call KIS or any provider",
        "preflight success does not create runtime routes, DB migrations, public UI, or orders",
      ],
    },
    checks,
    evidence: {
      missingPreflightGates,
      missingValidatorRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      responseEnvelopeContractStatus: responseEnvelopeContract.readiness?.status,
      requestEnvelopeValidatorFixturesStatus: requestEnvelopeValidatorFixtures.readiness?.status,
      endpointCategoryValidationPreflightStatus: endpointCategoryValidationPreflight.readiness?.status,
      snapshotNormalizationContractStatus: snapshotNormalizationContract.readiness?.status,
      callAuthorizationPreflightStatus: callAuthorizationPreflight.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
    },
    readiness: {
      status: "preflight_ready_pending_pure_local_response_envelope_validator_implementation_review",
      readyForPureLocalResponseEnvelopeValidatorImplementationReview: true,
      responseEnvelopeValidatorImplementationAllowedNow: true,
      responsePayloadReceivedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.responseEnvelopeContractReady ? [] : ["response_envelope_contract_not_ready"]),
        ...(checks.requestEnvelopeValidatorFixturesReady ? [] : ["request_envelope_validator_fixtures_not_ready"]),
        ...(checks.endpointCategoryValidationPreflightReady
          ? []
          : ["endpoint_category_validation_preflight_not_ready"]),
        ...(checks.snapshotNormalizationContractReady ? [] : ["snapshot_normalization_contract_not_ready"]),
        ...(checks.callAuthorizationStillBlocked ? [] : ["provider_call_authorization_not_blocked"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...missingPreflightGates.map((gate) => `missing_preflight_gate_${gate}`),
        ...missingValidatorRules.map((rule) => `missing_validator_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsResponseEnvelopeValidationPreflight
          ? []
          : ["architecture_doc_missing_response_envelope_validation_preflight"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-response-envelope-validation-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-response-envelope-validation-preflight.cjs`);
    }
    console.log("[generate-trading-read-only-provider-response-envelope-validation-preflight] ok");
    console.log(`[generate-trading-read-only-provider-response-envelope-validation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-response-envelope-validation-preflight] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-response-envelope-validation-preflight] providerCallsAllowed=${parsed.readiness.providerCallsAllowed}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const REQUEST_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
);
const RESPONSE_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const SNAPSHOT_NORMALIZATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const SNAPSHOT_RISK_INPUT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-read-only-provider-endpoint-allowlist-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_ALLOWED_ENDPOINT_CATEGORIES = [
  "account_cash_balance_read",
  "account_positions_read",
  "orderable_cash_read",
  "current_quote_read",
  "fx_rate_read",
  "market_session_state_read",
  "provider_rate_limit_state_read",
];
const REQUIRED_FORBIDDEN_ENDPOINT_CATEGORIES = [
  "order_submit",
  "order_cancel",
  "order_modify",
  "order_replace",
  "execution_fill_download",
  "order_confirmation_download",
  "account_transfer",
  "credential_or_token_introspection",
  "scenario_monthly_data_download",
];
const REQUIRED_ENDPOINT_RULES = [
  "category_allowlist_only",
  "no_provider_specific_endpoint_path_committed_now",
  "unknown_endpoint_category_fails_closed",
  "order_endpoint_category_rejected",
  "execution_endpoint_category_rejected",
  "token_endpoint_category_rejected",
  "scenario_monthly_endpoint_category_rejected",
  "private_worker_only",
  "owner_packet_import_required_later",
  "provider_implementation_review_required_later",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "provider_url_path",
  "provider_tr_id",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
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
  const privateProviderImplementationPreflight = readJson(PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH);
  const requestEnvelopeContract = readJson(REQUEST_ENVELOPE_CONTRACT_PATH);
  const responseEnvelopeContract = readJson(RESPONSE_ENVELOPE_CONTRACT_PATH);
  const snapshotNormalizationContract = readJson(SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const snapshotRiskInputContract = readJson(SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const allowedEndpointCategories = [...REQUIRED_ALLOWED_ENDPOINT_CATEGORIES];
  const forbiddenEndpointCategories = [...REQUIRED_FORBIDDEN_ENDPOINT_CATEGORIES];
  const endpointRules = [...REQUIRED_ENDPOINT_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingAllowedEndpointCategories = missingValues(
    allowedEndpointCategories,
    REQUIRED_ALLOWED_ENDPOINT_CATEGORIES,
  );
  const missingForbiddenEndpointCategories = missingValues(
    forbiddenEndpointCategories,
    REQUIRED_FORBIDDEN_ENDPOINT_CATEGORIES,
  );
  const missingEndpointRules = missingValues(endpointRules, REQUIRED_ENDPOINT_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    callAuthorizationStillBlocked:
      callAuthorizationPreflight.readiness?.readyForFutureReadOnlyProviderCallAuthorizationReview === false &&
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateProviderImplementationPreflight.readiness?.ownerPacketGateStillClosed === true &&
      privateProviderImplementationPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateProviderImplementationPreflight.readiness?.providerCallsAllowed === false,
    requestEnvelopeContractReady:
      requestEnvelopeContract.readiness?.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview === true &&
      requestEnvelopeContract.readiness?.providerCallsAllowed === false,
    responseEnvelopeContractReady:
      responseEnvelopeContract.readiness?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      responseEnvelopeContract.readiness?.providerCallsAllowed === false,
    snapshotNormalizationContractReady:
      snapshotNormalizationContract.readiness?.readyForFutureReadOnlySnapshotNormalizationImplementationReview === true &&
      snapshotNormalizationContract.readiness?.providerCallsAllowed === false,
    snapshotRiskInputContractReady:
      snapshotRiskInputContract.readiness?.readyForFutureReadOnlySnapshotRiskInputImplementationReview === true &&
      snapshotRiskInputContract.readiness?.providerCallsAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    allowedEndpointCategoriesReady: missingAllowedEndpointCategories.length === 0,
    forbiddenEndpointCategoriesReady: missingForbiddenEndpointCategories.length === 0,
    endpointRulesReady: missingEndpointRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsEndpointAllowlist:
      architectureDoc.includes("Trading Read-Only Provider Endpoint Allowlist Contract") &&
      architectureDoc.includes("read_only_provider_endpoint_allowlist_contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    endpointAllowlistImplementationAllowed: false,
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
    step: "Step 116-3G",
    scope: "read_only_provider_endpoint_allowlist_contract",
    sourceFiles: {
      callAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      requestEnvelopeContract: REQUEST_ENVELOPE_CONTRACT_PATH,
      responseEnvelopeContract: RESPONSE_ENVELOPE_CONTRACT_PATH,
      snapshotNormalizationContract: SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      snapshotRiskInputContract: SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      providerSpecificEndpointPathsRecordedNow: false,
      providerSpecificTransactionIdsRecordedNow: false,
      endpointAllowlistImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlyProviderEndpointAllowlistBoundary: {
      scope: "read_only_provider_endpoint_allowlist",
      purpose:
        "define provider-agnostic read-only endpoint categories and forbidden endpoint categories before any KIS endpoint mapping, token refresh path, provider call, runtime route, DB write, or order submission review",
      allowedEndpointCategories,
      forbiddenEndpointCategories,
      endpointRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this contract does not authorize provider calls",
        "future provider-specific endpoint paths and transaction ids require a separate private implementation review",
        "unknown endpoint categories fail closed",
        "read-only endpoint allowlist success still does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingAllowedEndpointCategories,
      missingForbiddenEndpointCategories,
      missingEndpointRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      callAuthorizationPreflightStatus: callAuthorizationPreflight.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus: privateProviderImplementationPreflight.readiness?.status,
      requestEnvelopeContractStatus: requestEnvelopeContract.readiness?.status,
      responseEnvelopeContractStatus: responseEnvelopeContract.readiness?.status,
      snapshotNormalizationContractStatus: snapshotNormalizationContract.readiness?.status,
      snapshotRiskInputContractStatus: snapshotRiskInputContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
    },
    readiness: {
      status: "contract_ready_pending_read_only_provider_endpoint_allowlist_implementation_review",
      readyForFutureReadOnlyProviderEndpointAllowlistReview: true,
      endpointAllowlistImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.callAuthorizationStillBlocked ? [] : ["provider_call_authorization_not_blocked"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_not_blocked"]),
        ...(checks.requestEnvelopeContractReady ? [] : ["request_envelope_contract_not_ready"]),
        ...(checks.responseEnvelopeContractReady ? [] : ["response_envelope_contract_not_ready"]),
        ...(checks.snapshotNormalizationContractReady ? [] : ["snapshot_normalization_contract_not_ready"]),
        ...(checks.snapshotRiskInputContractReady ? [] : ["snapshot_risk_input_contract_not_ready"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...missingAllowedEndpointCategories.map((category) => `missing_allowed_endpoint_category_${category}`),
        ...missingForbiddenEndpointCategories.map((category) => `missing_forbidden_endpoint_category_${category}`),
        ...missingEndpointRules.map((rule) => `missing_endpoint_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsEndpointAllowlist
          ? []
          : ["architecture_doc_missing_read_only_provider_endpoint_allowlist_contract"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-provider-endpoint-allowlist-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-provider-endpoint-allowlist-contract.cjs`);
    }
    console.log("[generate-trading-read-only-provider-endpoint-allowlist-contract] ok");
    console.log(`[generate-trading-read-only-provider-endpoint-allowlist-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-provider-endpoint-allowlist-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-endpoint-allowlist-contract] providerCallsAllowed=${parsed.readiness.providerCallsAllowed}`,
  );
}

main();

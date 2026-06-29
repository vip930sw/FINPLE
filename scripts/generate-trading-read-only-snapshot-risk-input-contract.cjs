const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const AUDIT_LOGGER_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-snapshot-risk-input-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RISK_INPUT_FIELDS = [
  "evaluationId",
  "orderIntentHash",
  "mode",
  "generatedAt",
  "market",
  "symbol",
  "side",
  "quantity",
  "estimatedNotionalHash",
  "quoteSnapshotHash",
  "accountStateSnapshotHash",
  "orderableCashSnapshotHash",
  "positionsSnapshotHash",
  "fxRateSnapshotHash",
  "marketSessionSnapshotHash",
  "providerRateLimitSnapshotHash",
  "snapshotFreshnessStatus",
  "accountMatchStatus",
  "providerRateLimitStatus",
  "killSwitchStateHash",
  "manualApprovalStateHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_RISK_INPUT_ASSERTIONS = [
  "quote_snapshot_fresh_required",
  "fx_snapshot_fresh_required",
  "account_state_snapshot_required",
  "market_session_allows_orders_required",
  "rate_limit_snapshot_not_blocked",
  "stale_snapshot_blocks_live_review",
  "missing_snapshot_blocks_live_review",
  "snapshot_hash_only_risk_input",
  "raw_payload_never_passed_to_risk_gate",
  "scenario_monthly_rows_rejected",
  "risk_input_success_does_not_enable_runtime",
  "risk_input_success_does_not_approve_live_guarded",
];
const FORBIDDEN_RISK_INPUT_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
  "raw_provider_payload",
  "raw_snapshot_value",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingReadOnlySnapshotRiskInput.js"),
  path.join("server", "src", "services", "trading", "readOnlySnapshotRiskInput.js"),
  path.join("server", "src", "services", "trading", "kisSnapshotRiskInput.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const readOnlySnapshotNormalizationContract = readJson(READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const liveGuardedMode = (policy.modes ?? []).find((mode) => mode.mode === "live_guarded") ?? {};
  const riskInputFields = [...REQUIRED_RISK_INPUT_FIELDS];
  const riskInputAssertions = [...REQUIRED_RISK_INPUT_ASSERTIONS];
  const forbiddenRiskInputContent = [...FORBIDDEN_RISK_INPUT_CONTENT];
  const missingRiskInputFields = missingValues(riskInputFields, REQUIRED_RISK_INPUT_FIELDS);
  const missingRiskInputAssertions = missingValues(riskInputAssertions, REQUIRED_RISK_INPUT_ASSERTIONS);
  const missingForbiddenRiskInputContent = missingValues(forbiddenRiskInputContent, FORBIDDEN_RISK_INPUT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    tradingModesStillReviewGated:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      liveGuardedMode.mode === "live_guarded" &&
      liveGuardedMode.requiresKillSwitchClear === true &&
      liveGuardedMode.requiresManualApproval === true,
    readOnlySnapshotNormalizationContractReady:
      readOnlySnapshotNormalizationContract.readiness
        ?.readyForFutureReadOnlySnapshotNormalizationImplementationReview === true &&
      readOnlySnapshotNormalizationContract.readiness?.snapshotNormalizationImplementationAllowed === false &&
      readOnlySnapshotNormalizationContract.readiness?.providerCallsAllowed === false &&
      readOnlySnapshotNormalizationContract.readiness?.orderSubmissionAllowed === false &&
      readOnlySnapshotNormalizationContract.readiness?.runtimeRouteAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearanceContract.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearanceContract.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearanceContract.readiness?.providerCallsAllowed === false &&
      riskGateClearanceContract.readiness?.orderSubmissionAllowed === false,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.readyForRuntimeRoute === false &&
      envRiskGateContract.readiness?.readyForProviderCalls === false &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    auditLoggerReadinessContractReady:
      auditLoggerReadinessContract.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadinessContract.readiness?.auditLoggerImplementationAllowed === false &&
      auditLoggerReadinessContract.readiness?.providerCallsAllowed === false &&
      auditLoggerReadinessContract.readiness?.orderSubmissionAllowed === false,
    riskInputFieldsReady: missingRiskInputFields.length === 0,
    riskInputAssertionsReady: missingRiskInputAssertions.length === 0,
    forbiddenRiskInputContentReady: missingForbiddenRiskInputContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsReadOnlySnapshotRiskInput:
      architectureDoc.includes("Trading Read-Only Snapshot Risk Input Contract") &&
      architectureDoc.includes("read_only_snapshot_risk_input"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    snapshotRiskInputImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFutureReadOnlySnapshotRiskInputImplementationReview =
    checks.tradingModesStillReviewGated &&
    checks.readOnlySnapshotNormalizationContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.riskInputFieldsReady &&
    checks.riskInputAssertionsReady &&
    checks.forbiddenRiskInputContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsReadOnlySnapshotRiskInput &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1X",
    scope: "trading_read_only_snapshot_risk_input_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      readOnlySnapshotNormalizationContract: READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      snapshotRiskInputImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlySnapshotRiskInputBoundary: {
      scope: "read_only_snapshot_risk_input",
      purpose:
        "define future hash-only normalized snapshot inputs required by the risk gate before private shadow runtime or live_guarded review can consider order intent promotion",
      requiredRiskInputFields: riskInputFields,
      requiredRiskInputAssertions: riskInputAssertions,
      forbiddenRiskInputContent,
      freshnessRules: [
        "quote, FX, account-state, market-session, and provider-rate-limit snapshots must be present and fresh",
        "stale or missing snapshots block live_review_required promotion",
        "account identifiers, cash values, positions, quote values, and notional estimates remain hash-only in this contract",
        "raw provider payloads and raw normalized snapshot values never enter the risk gate input contract",
      ],
      promotionRules: [
        "snapshot risk input review does not perform provider calls",
        "snapshot risk input review does not create a runtime route",
        "snapshot risk input review does not create DB storage",
        "snapshot risk input success does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      liveGuardedMode,
      missingRiskInputFields,
      missingRiskInputAssertions,
      missingForbiddenRiskInputContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      readOnlySnapshotNormalizationContractStatus: readOnlySnapshotNormalizationContract.readiness?.status,
      riskGateClearanceContractStatus: riskGateClearanceContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlySnapshotRiskInputImplementationReview
        ? "contract_ready_pending_read_only_snapshot_risk_input_implementation_review"
        : "blocked_before_read_only_snapshot_risk_input_contract",
      readyForFutureReadOnlySnapshotRiskInputImplementationReview,
      snapshotRiskInputImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.tradingModesStillReviewGated ? [] : ["trading_modes_not_review_gated"]),
        ...(checks.readOnlySnapshotNormalizationContractReady
          ? []
          : ["read_only_snapshot_normalization_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingRiskInputFields.map((field) => `missing_risk_input_field_${field}`),
        ...missingRiskInputAssertions.map((assertion) => `missing_risk_input_assertion_${assertion}`),
        ...missingForbiddenRiskInputContent.map((content) => `missing_forbidden_risk_input_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsReadOnlySnapshotRiskInput
          ? []
          : ["architecture_doc_missing_read_only_snapshot_risk_input_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-snapshot-risk-input-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-snapshot-risk-input-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-snapshot-risk-input-contract] ok");
    console.log(`[generate-trading-read-only-snapshot-risk-input-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-snapshot-risk-input-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-snapshot-risk-input-contract] readyForFutureReadOnlySnapshotRiskInputImplementationReview=${parsed.readiness.readyForFutureReadOnlySnapshotRiskInputImplementationReview}`,
  );
}

main();

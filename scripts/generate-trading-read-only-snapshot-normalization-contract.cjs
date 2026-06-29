const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const SHADOW_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_mode_contract.json");
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
const READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-read-only-snapshot-normalization-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_NORMALIZED_SNAPSHOT_TYPES = [
  "account_cash_balance_snapshot",
  "account_positions_snapshot",
  "orderable_cash_snapshot",
  "current_quotes_snapshot",
  "fx_rate_snapshot",
  "market_session_state_snapshot",
  "provider_rate_limit_state_snapshot",
];
const REQUIRED_NORMALIZED_FIELDS = [
  "snapshotId",
  "snapshotType",
  "sourceEnvelopeHash",
  "createdAt",
  "market",
  "symbol",
  "currency",
  "accountIdHash",
  "valueHash",
  "freshnessStatus",
  "providerStatus",
  "redactionVersion",
  "rawPayloadStored",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
];
const REQUIRED_NORMALIZATION_ASSERTIONS = [
  "raw_payload_never_persisted",
  "account_identifier_hash_only",
  "snapshot_value_hashes_only_before_storage_contract",
  "unknown_snapshot_type_fails_closed",
  "stale_snapshot_marked_not_fresh",
  "order_or_execution_payload_rejected",
  "scenario_monthly_rows_rejected",
  "normalization_success_does_not_enable_runtime",
  "normalization_success_does_not_approve_live_guarded",
];
const FORBIDDEN_NORMALIZED_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingReadOnlySnapshotNormalizer.js"),
  path.join("server", "src", "services", "trading", "readOnlySnapshotNormalizer.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlySnapshotNormalizer.js"),
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
  const shadowContract = readJson(SHADOW_CONTRACT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const readOnlyProviderResponseEnvelopeContract = readJson(READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const normalizedSnapshotTypes = [...REQUIRED_NORMALIZED_SNAPSHOT_TYPES];
  const normalizedFields = [...REQUIRED_NORMALIZED_FIELDS];
  const forbiddenNormalizedContent = [...FORBIDDEN_NORMALIZED_CONTENT];
  const normalizationAssertions = [...REQUIRED_NORMALIZATION_ASSERTIONS];
  const missingNormalizedSnapshotTypes = missingValues(
    normalizedSnapshotTypes,
    REQUIRED_NORMALIZED_SNAPSHOT_TYPES,
  );
  const missingNormalizedFields = missingValues(normalizedFields, REQUIRED_NORMALIZED_FIELDS);
  const missingForbiddenNormalizedContent = missingValues(
    forbiddenNormalizedContent,
    FORBIDDEN_NORMALIZED_CONTENT,
  );
  const missingNormalizationAssertions = missingValues(normalizationAssertions, REQUIRED_NORMALIZATION_ASSERTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    shadowContractStillBlocksRuntime:
      shadowContract.readiness?.readyForFutureReadOnlyIntegrationReview === true &&
      shadowContract.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      shadowContract.readiness?.providerCallsAllowed === false &&
      shadowContract.readiness?.orderSubmissionAllowed === false,
    readOnlyProviderResponseEnvelopeContractReady:
      readOnlyProviderResponseEnvelopeContract.readiness
        ?.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview === true &&
      readOnlyProviderResponseEnvelopeContract.readiness?.responseEnvelopeImplementationAllowed === false &&
      readOnlyProviderResponseEnvelopeContract.readiness?.providerCallsAllowed === false &&
      readOnlyProviderResponseEnvelopeContract.readiness?.orderSubmissionAllowed === false &&
      readOnlyProviderResponseEnvelopeContract.readiness?.runtimeRouteAllowed === false,
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
    normalizedSnapshotTypesReady: missingNormalizedSnapshotTypes.length === 0,
    normalizedFieldsReady: missingNormalizedFields.length === 0,
    forbiddenNormalizedContentReady: missingForbiddenNormalizedContent.length === 0,
    normalizationAssertionsReady: missingNormalizationAssertions.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsReadOnlySnapshotNormalization:
      architectureDoc.includes("Trading Read-Only Snapshot Normalization Contract") &&
      architectureDoc.includes("read_only_snapshot_normalization"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    snapshotNormalizationImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFutureReadOnlySnapshotNormalizationImplementationReview =
    checks.shadowModePolicyReady &&
    checks.shadowContractStillBlocksRuntime &&
    checks.readOnlyProviderResponseEnvelopeContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.normalizedSnapshotTypesReady &&
    checks.normalizedFieldsReady &&
    checks.forbiddenNormalizedContentReady &&
    checks.normalizationAssertionsReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsReadOnlySnapshotNormalization &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1W",
    scope: "trading_read_only_snapshot_normalization_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      readOnlyProviderResponseEnvelopeContract: READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      snapshotNormalizationImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureReadOnlySnapshotNormalizationBoundary: {
      scope: "read_only_snapshot_normalization",
      purpose:
        "define future normalized read-only snapshot types, required fields, hash-only value boundaries, and rejection rules before parser, storage, or runtime implementation review",
      requiredNormalizedSnapshotTypes: normalizedSnapshotTypes,
      requiredNormalizedFields: normalizedFields,
      forbiddenNormalizedContent,
      requiredNormalizationAssertions: normalizationAssertions,
      redactionRules: [
        "never persist raw provider payloads",
        "persist account identifiers as hashes only",
        "persist snapshot values as hashes only until a later storage contract approves exact fields",
        "reject order, execution, fill, live order endpoint, and scenario monthly return row content",
      ],
      promotionRules: [
        "snapshot normalization review does not perform provider calls",
        "snapshot normalization review does not create a runtime route",
        "snapshot normalization review does not create a database migration",
        "normalization success does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingNormalizedSnapshotTypes,
      missingNormalizedFields,
      missingForbiddenNormalizedContent,
      missingNormalizationAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      shadowContractStatus: shadowContract.readiness?.status,
      readOnlyProviderResponseEnvelopeContractStatus: readOnlyProviderResponseEnvelopeContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureReadOnlySnapshotNormalizationImplementationReview
        ? "contract_ready_pending_read_only_snapshot_normalization_implementation_review"
        : "blocked_before_read_only_snapshot_normalization_contract",
      readyForFutureReadOnlySnapshotNormalizationImplementationReview,
      snapshotNormalizationImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.shadowContractStillBlocksRuntime ? [] : ["shadow_contract_allows_runtime_too_early"]),
        ...(checks.readOnlyProviderResponseEnvelopeContractReady
          ? []
          : ["read_only_provider_response_envelope_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingNormalizedSnapshotTypes.map((type) => `missing_normalized_snapshot_type_${type}`),
        ...missingNormalizedFields.map((field) => `missing_normalized_field_${field}`),
        ...missingForbiddenNormalizedContent.map((content) => `missing_forbidden_normalized_content_${content}`),
        ...missingNormalizationAssertions.map((assertion) => `missing_normalization_assertion_${assertion}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsReadOnlySnapshotNormalization
          ? []
          : ["architecture_doc_missing_read_only_snapshot_normalization_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-read-only-snapshot-normalization-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-read-only-snapshot-normalization-contract.cjs`,
      );
    }
    console.log("[generate-trading-read-only-snapshot-normalization-contract] ok");
    console.log(`[generate-trading-read-only-snapshot-normalization-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-read-only-snapshot-normalization-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-snapshot-normalization-contract] readyForFutureReadOnlySnapshotNormalizationImplementationReview=${parsed.readiness.readyForFutureReadOnlySnapshotNormalizationImplementationReview}`,
  );
}

main();

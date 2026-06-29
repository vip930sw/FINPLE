const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json",
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
const DRY_RUN_REPLAY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_dry_run_replay_contract.json",
);
const SHADOW_HISTORY_REVIEW_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_preflight.json",
);
const READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
);
const PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_order_intent_contract.json",
);
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-shadow-runtime-review-packet-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_REVIEW_PACKET_FIELDS = [
  "reviewPacketId",
  "mode",
  "operatorScopeHash",
  "approvalImportPreflightHash",
  "envRiskGateHash",
  "snapshotRiskInputHash",
  "orderIntentContractHash",
  "intentAuditEventContractHash",
  "riskGateClearanceHash",
  "dryRunReplayReferenceHash",
  "shadowHistoryReviewReferenceHash",
  "auditLoggerReadinessHash",
  "killSwitchStateHash",
  "manualApprovalPolicyHash",
  "createdAt",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "dbMigrationAllowed",
  "publicUiAllowed",
];
const REQUIRED_REVIEW_PACKET_ASSERTIONS = [
  "private_operator_only_review_scope",
  "virtual_trading_base_url_only",
  "read_only_approval_import_required_later",
  "snapshot_risk_input_required",
  "shadow_order_intent_required",
  "intent_audit_event_required",
  "dry_run_replay_reference_required",
  "shadow_history_review_reference_required",
  "risk_gate_clearance_review_only",
  "hash_only_review_packet",
  "review_packet_success_does_not_enable_runtime",
  "review_packet_success_does_not_approve_live_guarded",
];
const FORBIDDEN_REVIEW_PACKET_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
  "raw_provider_payload",
  "raw_order_payload",
  "raw_snapshot_value",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingPrivateShadowRuntimeReviewPacket.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntimeReviewPacket.js"),
  path.join("server", "src", "services", "trading", "shadowRuntimeReviewPacket.js"),
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
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReviewContract = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const readOnlyApprovalImportPreflight = readJson(READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const readOnlySnapshotRiskInputContract = readJson(READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH);
  const privateShadowOrderIntentContract = readJson(PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH);
  const privateShadowIntentAuditEventContract = readJson(PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const shadowMode = (policy.modes ?? []).find((mode) => mode.mode === "shadow") ?? {};
  const reviewPacketFields = [...REQUIRED_REVIEW_PACKET_FIELDS];
  const reviewPacketAssertions = [...REQUIRED_REVIEW_PACKET_ASSERTIONS];
  const forbiddenReviewPacketContent = [...FORBIDDEN_REVIEW_PACKET_CONTENT];
  const missingReviewPacketFields = missingValues(reviewPacketFields, REQUIRED_REVIEW_PACKET_FIELDS);
  const missingReviewPacketAssertions = missingValues(reviewPacketAssertions, REQUIRED_REVIEW_PACKET_ASSERTIONS);
  const missingForbiddenReviewPacketContent = missingValues(
    forbiddenReviewPacketContent,
    FORBIDDEN_REVIEW_PACKET_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    shadowModePolicyReady:
      shadowMode.mode === "shadow" &&
      shadowMode.externalOrderCall === false &&
      shadowMode.providerDataCall === "read_only_future_contract" &&
      shadowMode.requiresManualApproval === true,
    readOnlyApprovalImportPreflightReady:
      readOnlyApprovalImportPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === true &&
      readOnlyApprovalImportPreflight.readiness?.approvalPacketImportedNow === false &&
      readOnlyApprovalImportPreflight.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.providerCallsAllowed === false &&
      readOnlyApprovalImportPreflight.readiness?.orderSubmissionAllowed === false,
    readOnlySnapshotRiskInputContractReady:
      readOnlySnapshotRiskInputContract.readiness
        ?.readyForFutureReadOnlySnapshotRiskInputImplementationReview === true &&
      readOnlySnapshotRiskInputContract.readiness?.snapshotRiskInputImplementationAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.providerCallsAllowed === false &&
      readOnlySnapshotRiskInputContract.readiness?.orderSubmissionAllowed === false,
    privateShadowOrderIntentContractReady:
      privateShadowOrderIntentContract.readiness?.readyForFuturePrivateShadowOrderIntentImplementationReview === true &&
      privateShadowOrderIntentContract.readiness?.privateShadowOrderIntentImplementationAllowed === false &&
      privateShadowOrderIntentContract.readiness?.providerCallsAllowed === false &&
      privateShadowOrderIntentContract.readiness?.orderSubmissionAllowed === false,
    privateShadowIntentAuditEventContractReady:
      privateShadowIntentAuditEventContract.readiness
        ?.readyForFuturePrivateShadowIntentAuditEventImplementationReview === true &&
      privateShadowIntentAuditEventContract.readiness?.privateShadowIntentAuditEventImplementationAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.providerCallsAllowed === false &&
      privateShadowIntentAuditEventContract.readiness?.orderSubmissionAllowed === false,
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
    dryRunReplayContractReady:
      dryRunReplayContract.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplayContract.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplayContract.readiness?.providerCallsAllowed === false &&
      dryRunReplayContract.readiness?.orderSubmissionAllowed === false,
    shadowHistoryReviewContractReady:
      shadowHistoryReviewContract.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReviewContract.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReviewContract.readiness?.providerCallsAllowed === false &&
      shadowHistoryReviewContract.readiness?.orderSubmissionAllowed === false,
    reviewPacketFieldsReady: missingReviewPacketFields.length === 0,
    reviewPacketAssertionsReady: missingReviewPacketAssertions.length === 0,
    forbiddenReviewPacketContentReady: missingForbiddenReviewPacketContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsPrivateShadowRuntimeReviewPacket:
      architectureDoc.includes("Trading Private Shadow Runtime Review Packet Contract") &&
      architectureDoc.includes("private_shadow_runtime_review_packet"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    privateShadowRuntimeReviewPacketImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview =
    checks.shadowModePolicyReady &&
    checks.readOnlyApprovalImportPreflightReady &&
    checks.readOnlySnapshotRiskInputContractReady &&
    checks.privateShadowOrderIntentContractReady &&
    checks.privateShadowIntentAuditEventContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.envRiskGateContractStillFailClosed &&
    checks.auditLoggerReadinessContractReady &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.reviewPacketFieldsReady &&
    checks.reviewPacketAssertionsReady &&
    checks.forbiddenReviewPacketContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsPrivateShadowRuntimeReviewPacket &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2A",
    scope: "trading_private_shadow_runtime_review_packet_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      readOnlyApprovalImportPreflight: READ_ONLY_APPROVAL_IMPORT_PREFLIGHT_PATH,
      readOnlySnapshotRiskInputContract: READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT_PATH,
      privateShadowOrderIntentContract: PRIVATE_SHADOW_ORDER_INTENT_CONTRACT_PATH,
      privateShadowIntentAuditEventContract: PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      privateShadowRuntimeReviewPacketImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateShadowRuntimeReviewPacketBoundary: {
      scope: "private_shadow_runtime_review_packet",
      purpose:
        "define the hash-only review packet required before any future private shadow runtime implementation review, without creating runtime routes, DB storage, provider calls, or order submission",
      requiredReviewPacketFields: reviewPacketFields,
      requiredReviewPacketAssertions: reviewPacketAssertions,
      forbiddenReviewPacketContent,
      redactionRules: [
        "review packets reference approval, env, risk, snapshot, order-intent, audit, replay, and shadow-history evidence by hash only",
        "review packets cannot include raw credentials, raw provider responses, raw order payloads, account numbers, or fills",
        "review packets cannot import approval evidence or create runtime storage by themselves",
      ],
      promotionRules: [
        "runtime review packet success does not implement the private shadow runtime",
        "runtime review packet success does not enable provider calls",
        "runtime review packet success does not create runtime routes or DB migrations",
        "runtime review packet success does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      shadowMode,
      missingReviewPacketFields,
      missingReviewPacketAssertions,
      missingForbiddenReviewPacketContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      readOnlyApprovalImportPreflightStatus: readOnlyApprovalImportPreflight.readiness?.status,
      readOnlySnapshotRiskInputContractStatus: readOnlySnapshotRiskInputContract.readiness?.status,
      privateShadowOrderIntentContractStatus: privateShadowOrderIntentContract.readiness?.status,
      privateShadowIntentAuditEventContractStatus: privateShadowIntentAuditEventContract.readiness?.status,
      riskGateClearanceContractStatus: riskGateClearanceContract.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      dryRunReplayContractStatus: dryRunReplayContract.readiness?.status,
      shadowHistoryReviewContractStatus: shadowHistoryReviewContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview
        ? "contract_ready_pending_private_shadow_runtime_review_packet_implementation_review"
        : "blocked_before_private_shadow_runtime_review_packet_contract",
      readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview,
      privateShadowRuntimeReviewPacketImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.shadowModePolicyReady ? [] : ["shadow_mode_policy_not_ready"]),
        ...(checks.readOnlyApprovalImportPreflightReady ? [] : ["read_only_approval_import_preflight_not_ready"]),
        ...(checks.readOnlySnapshotRiskInputContractReady
          ? []
          : ["read_only_snapshot_risk_input_contract_not_ready"]),
        ...(checks.privateShadowOrderIntentContractReady
          ? []
          : ["private_shadow_order_intent_contract_not_ready"]),
        ...(checks.privateShadowIntentAuditEventContractReady
          ? []
          : ["private_shadow_intent_audit_event_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...missingReviewPacketFields.map((field) => `missing_review_packet_field_${field}`),
        ...missingReviewPacketAssertions.map((assertion) => `missing_review_packet_assertion_${assertion}`),
        ...missingForbiddenReviewPacketContent.map((content) => `missing_forbidden_review_packet_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsPrivateShadowRuntimeReviewPacket
          ? []
          : ["architecture_doc_missing_private_shadow_runtime_review_packet_boundary"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-shadow-runtime-review-packet-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-shadow-runtime-review-packet-contract.cjs`,
      );
    }
    console.log("[generate-trading-private-shadow-runtime-review-packet-contract] ok");
    console.log(`[generate-trading-private-shadow-runtime-review-packet-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-shadow-runtime-review-packet-contract] wrote contract");
  console.log(
    `[generate-trading-private-shadow-runtime-review-packet-contract] readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview=${parsed.readiness.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview}`,
  );
}

main();

const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_manual_operator_approval_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
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
const AUDIT_LOGGER_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-operator-approval-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_APPROVAL_FIELDS = [
  "approvalId",
  "approverId",
  "approvedAt",
  "expiresAt",
  "mode",
  "intentId",
  "symbol",
  "side",
  "quantity",
  "maxNotional",
  "riskGateStatus",
  "killSwitchStatus",
  "dryRunReplayId",
  "shadowHistoryReviewId",
  "auditEventId",
  "decision",
  "reasons",
  "payloadHash",
];
const REQUIRED_DECISIONS = ["approve", "reject", "expire", "revoke"];
const REQUIRED_APPROVAL_ASSERTIONS = [
  "single_order_intent_only",
  "time_boxed_approval",
  "cannot_override_kill_switch",
  "cannot_override_risk_gate",
  "requires_dry_run_replay_passed",
  "requires_shadow_history_reviewed",
  "requires_audit_logger_record",
  "requires_separate_order_capable_credentials",
  "rejects_modified_payload_hash",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "runtime_provider_call",
  "order_submission",
  "order_cancellation",
  "production_secret_usage",
  "raw_provider_response_persistence",
  "db_migration",
  "public_ui",
  "scenario_monthly_cache_write",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingManualApproval.js"),
  path.join("server", "src", "services", "trading", "manualApproval.js"),
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
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReviewContract = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const liveGuardedMode = (policy.modes ?? []).find((mode) => mode.mode === "live_guarded") ?? {};
  const approvalFields = [...REQUIRED_APPROVAL_FIELDS];
  const approvalDecisions = [...REQUIRED_DECISIONS];
  const approvalAssertions = [...REQUIRED_APPROVAL_ASSERTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const missingApprovalFields = missingValues(approvalFields, REQUIRED_APPROVAL_FIELDS);
  const missingApprovalDecisions = missingValues(approvalDecisions, REQUIRED_DECISIONS);
  const missingApprovalAssertions = missingValues(approvalAssertions, REQUIRED_APPROVAL_ASSERTIONS);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    liveGuardedPolicyRequiresManualApproval:
      liveGuardedMode.mode === "live_guarded" &&
      liveGuardedMode.requiresManualApproval === true &&
      liveGuardedMode.requiresKillSwitchClear === true &&
      liveGuardedMode.requiresDryRunReplay === true,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.readyForProviderCalls === false &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
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
    auditLoggerReadinessContractReady:
      auditLoggerReadinessContract.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadinessContract.readiness?.auditLoggerImplementationAllowed === false &&
      auditLoggerReadinessContract.readiness?.providerCallsAllowed === false &&
      auditLoggerReadinessContract.readiness?.orderSubmissionAllowed === false,
    approvalFieldsReady: missingApprovalFields.length === 0,
    approvalDecisionsReady: missingApprovalDecisions.length === 0,
    approvalAssertionsReady: missingApprovalAssertions.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    architectureDocMentionsManualApproval:
      architectureDoc.includes("Trading Manual Operator Approval Contract") &&
      architectureDoc.includes("manual_operator_approval"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    manualApprovalImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureManualApprovalImplementationReview =
    checks.liveGuardedPolicyRequiresManualApproval &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.envRiskGateContractStillFailClosed &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.auditLoggerReadinessContractReady &&
    checks.approvalFieldsReady &&
    checks.approvalDecisionsReady &&
    checks.approvalAssertionsReady &&
    checks.forbiddenActionsReady &&
    checks.architectureDocMentionsManualApproval &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1N",
    scope: "trading_manual_operator_approval_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      manualApprovalExistsNow: false,
      manualApprovalImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureManualApprovalBoundary: {
      purpose: "require explicit, auditable operator approval for one future live_guarded order intent without overriding risk, kill switch, replay, shadow, or audit gates",
      requiredApprovalFields: approvalFields,
      requiredDecisions: approvalDecisions,
      requiredAssertions: approvalAssertions,
      forbiddenActions,
      approvalWindow: {
        currentStepIssuesApprovals: false,
        singleIntentOnly: true,
        reusableApprovalAllowed: false,
        modifiedPayloadRequiresNewApproval: true,
      },
      promotionRules: [
        "manual approval cannot override kill switch or risk gate failure",
        "manual approval requires dry-run replay and shadow history evidence",
        "manual approval requires audit logger evidence before live_guarded adapter implementation review",
        "manual approval readiness does not approve provider calls or order submission",
      ],
    },
    checks,
    evidence: {
      liveGuardedMode,
      missingApprovalFields,
      missingApprovalDecisions,
      missingApprovalAssertions,
      missingForbiddenActions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      dryRunReplayContractStatus: dryRunReplayContract.readiness?.status,
      shadowHistoryReviewContractStatus: shadowHistoryReviewContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureManualApprovalImplementationReview
        ? "contract_ready_pending_manual_approval_implementation_review"
        : "blocked_before_manual_operator_approval_contract",
      readyForFutureManualApprovalImplementationReview,
      manualApprovalImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.liveGuardedPolicyRequiresManualApproval ? [] : ["live_guarded_policy_not_ready"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingApprovalFields.map((field) => `missing_approval_field_${field}`),
        ...missingApprovalDecisions.map((decision) => `missing_approval_decision_${decision}`),
        ...missingApprovalAssertions.map((assertion) => `missing_approval_assertion_${assertion}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.architectureDocMentionsManualApproval ? [] : ["architecture_doc_missing_manual_approval_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-operator-approval-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-operator-approval-contract.cjs`);
    }
    console.log("[generate-trading-manual-operator-approval-contract] ok");
    console.log(`[generate-trading-manual-operator-approval-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-operator-approval-contract] wrote contract");
  console.log(
    `[generate-trading-manual-operator-approval-contract] readyForFutureManualApprovalImplementationReview=${parsed.readiness.readyForFutureManualApprovalImplementationReview}`,
  );
}

main();

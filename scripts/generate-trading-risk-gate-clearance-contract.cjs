const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_risk_gate_clearance_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_operator_approval_contract.json",
);
const KILL_SWITCH_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
);
const AUDIT_LOGGER_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const RISK_ENGINE_SOURCE_PATH = path.join("server", "src", "services", "tradingRiskEngine.js");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-risk-gate-clearance-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const SAMPLE_INTENT = Object.freeze({
  symbol: "SPY",
  side: "buy",
  quantity: 1,
  estimatedPrice: 400,
  estimatedFxRate: 1,
});
const SAFE_LIMITS = Object.freeze({
  maxAccountCapitalAllocated: 10000,
  maxCashDepletionPerDay: 1000,
  maxSingleSymbolExposure: 3000,
  maxSingleOrderNotional: 1000,
  maxDailyTurnover: 2000,
  maxOrderAttemptsPerDay: 5,
  maxConsecutiveFailedOrderAttempts: 2,
  maxSlippageTolerance: 0.01,
  allowedMarketSessions: ["US_REGULAR"],
  allowedSymbols: ["SPY"],
  blockedInstruments: ["UVXY"],
});
const SAFE_RUNTIME = Object.freeze({
  mode: "live_guarded",
  currentSession: "US_REGULAR",
  dailyLossAmount: 0,
  dailyCashDepletion: 0,
  dailyTurnover: 0,
  dailyOrderAttempts: 0,
  consecutiveFailedOrderAttempts: 0,
  allocatedCapital: 1000,
  currentSymbolExposure: 500,
  estimatedSlippage: 0,
  globalTradingDisabled: false,
  dailyLossLimitBreached: false,
  dailyOrderCountLimitBreached: false,
  symbolAllowlisted: true,
  quoteFresh: true,
  fxFresh: true,
  accountStateMatched: true,
  kisAuthOk: true,
  kisRateLimited: false,
  strategyReviewed: true,
  auditLoggerReady: true,
  manualOperatorStop: false,
});
const BLOCKED_RUNTIME = Object.freeze({
  ...SAFE_RUNTIME,
  globalTradingDisabled: true,
});
const REQUIRED_CLEARANCE_INPUTS = [
  "orderIntent",
  "riskLimits",
  "runtimeMode",
  "marketSession",
  "dailyLossAmount",
  "dailyCashDepletion",
  "dailyTurnover",
  "dailyOrderAttempts",
  "consecutiveFailedOrderAttempts",
  "allocatedCapital",
  "currentSymbolExposure",
  "estimatedSlippage",
  "killSwitchState",
  "quoteFreshness",
  "fxFreshness",
  "accountStateMatch",
  "strategyReviewStatus",
  "auditLoggerReady",
];
const REQUIRED_CLEARANCE_ASSERTIONS = [
  "all_risk_reasons_empty_before_live_review",
  "live_guarded_returns_live_review_required_not_order_submission",
  "blocked_risk_gate_records_risk_event",
  "risk_gate_clear_cannot_override_kill_switch",
  "risk_gate_clear_cannot_override_manual_operator_stop",
  "risk_gate_clear_cannot_enable_provider_calls_by_itself",
  "risk_gate_clear_cannot_enable_order_submission_by_itself",
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
  path.join("server", "src", "services", "tradingRiskGateClearance.js"),
  path.join("server", "src", "services", "trading", "riskGateClearance.js"),
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

async function importService(filePath) {
  return import(pathToFileURL(path.resolve(filePath)).href);
}

function compactEvaluation(evaluation) {
  return {
    valid: evaluation.valid,
    status: evaluation.status,
    mode: evaluation.mode,
    reasons: evaluation.reasons,
    intentPromotionAllowed: evaluation.intentPromotionAllowed,
    liveOrderIntentEligible: evaluation.liveOrderIntentEligible,
    orderSubmissionAllowed: evaluation.orderSubmissionAllowed,
    providerCallsAllowed: evaluation.providerCallsAllowed,
    riskEvent: {
      eventType: evaluation.riskEvent?.eventType,
      severity: evaluation.riskEvent?.severity,
      status: evaluation.riskEvent?.status,
      reasons: evaluation.riskEvent?.reasons ?? [],
      orderSubmissionAllowed: evaluation.riskEvent?.orderSubmissionAllowed,
      providerCallsAllowed: evaluation.riskEvent?.providerCallsAllowed,
    },
  };
}

async function buildContract() {
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const manualOperatorApprovalContract = readJson(MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH);
  const killSwitchClearanceContract = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const { evaluateTradingRiskGate, RISK_GATE_STATUSES } = await importService(RISK_ENGINE_SOURCE_PATH);
  const liveGuardedMode = (policy.modes ?? []).find((mode) => mode.mode === "live_guarded") ?? {};
  const clearEvaluation = compactEvaluation(evaluateTradingRiskGate(SAMPLE_INTENT, SAFE_LIMITS, SAFE_RUNTIME));
  const blockedEvaluation = compactEvaluation(evaluateTradingRiskGate(SAMPLE_INTENT, SAFE_LIMITS, BLOCKED_RUNTIME));
  const clearanceInputs = [...REQUIRED_CLEARANCE_INPUTS];
  const clearanceAssertions = [...REQUIRED_CLEARANCE_ASSERTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const missingClearanceInputs = missingValues(clearanceInputs, REQUIRED_CLEARANCE_INPUTS);
  const missingClearanceAssertions = missingValues(clearanceAssertions, REQUIRED_CLEARANCE_ASSERTIONS);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    liveGuardedPolicyRequiresRiskReview:
      liveGuardedMode.mode === "live_guarded" &&
      liveGuardedMode.requiresKillSwitchClear === true &&
      liveGuardedMode.requiresManualApproval === true,
    clearFixtureRequiresLiveReviewOnly:
      clearEvaluation.valid === true &&
      clearEvaluation.status === RISK_GATE_STATUSES.liveReviewRequired &&
      clearEvaluation.liveOrderIntentEligible === true &&
      clearEvaluation.orderSubmissionAllowed === false &&
      clearEvaluation.providerCallsAllowed === false,
    blockedFixtureFailsClosed:
      blockedEvaluation.valid === false &&
      blockedEvaluation.status === RISK_GATE_STATUSES.blocked &&
      blockedEvaluation.reasons.includes("kill_switch_global_trading_disabled") &&
      blockedEvaluation.orderSubmissionAllowed === false &&
      blockedEvaluation.providerCallsAllowed === false,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    manualOperatorApprovalContractReady:
      manualOperatorApprovalContract.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      manualOperatorApprovalContract.readiness?.manualApprovalImplementationAllowed === false &&
      manualOperatorApprovalContract.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearanceContract.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearanceContract.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearanceContract.readiness?.orderSubmissionAllowed === false,
    auditLoggerReadinessContractReady:
      auditLoggerReadinessContract.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadinessContract.readiness?.auditLoggerImplementationAllowed === false &&
      auditLoggerReadinessContract.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    clearanceInputsReady: missingClearanceInputs.length === 0,
    clearanceAssertionsReady: missingClearanceAssertions.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    architectureDocMentionsRiskGateClearance:
      architectureDoc.includes("Trading Risk Gate Clearance Contract") &&
      architectureDoc.includes("risk_gate_clear"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    riskGateClearanceImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureRiskGateClearanceImplementationReview =
    checks.liveGuardedPolicyRequiresRiskReview &&
    checks.clearFixtureRequiresLiveReviewOnly &&
    checks.blockedFixtureFailsClosed &&
    checks.envRiskGateContractStillFailClosed &&
    checks.manualOperatorApprovalContractReady &&
    checks.killSwitchClearanceContractReady &&
    checks.auditLoggerReadinessContractReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.clearanceInputsReady &&
    checks.clearanceAssertionsReady &&
    checks.forbiddenActionsReady &&
    checks.architectureDocMentionsRiskGateClearance &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1Q",
    scope: "trading_risk_gate_clearance_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      riskEngine: RISK_ENGINE_SOURCE_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      riskGateClearanceImplementationAllowed: false,
      riskGateClearNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureRiskGateClearanceBoundary: {
      purpose: "require deterministic risk gate clearance evidence before future live_guarded order-intent review while keeping order submission disabled",
      requiredClearanceInputs: clearanceInputs,
      requiredAssertions: clearanceAssertions,
      forbiddenActions,
      promotionRules: [
        "risk gate clear may only produce live_review_required for live_guarded",
        "risk gate clear cannot override kill switch, manual stop, missing audit log, stale quote, stale fx, or exposure limits",
        "risk gate clear does not approve provider calls or order submission",
        "blocked risk gates must emit auditable risk-event reasons",
      ],
    },
    fixtureEvidence: {
      clearLiveGuardedReviewOnly: clearEvaluation,
      blockedByKillSwitch: blockedEvaluation,
    },
    checks,
    evidence: {
      liveGuardedMode,
      missingClearanceInputs,
      missingClearanceAssertions,
      missingForbiddenActions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      manualOperatorApprovalContractStatus: manualOperatorApprovalContract.readiness?.status,
      killSwitchClearanceContractStatus: killSwitchClearanceContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureRiskGateClearanceImplementationReview
        ? "contract_ready_pending_risk_gate_clearance_implementation_review"
        : "blocked_before_risk_gate_clearance_contract",
      readyForFutureRiskGateClearanceImplementationReview,
      riskGateClearanceImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.liveGuardedPolicyRequiresRiskReview ? [] : ["live_guarded_policy_not_ready"]),
        ...(checks.clearFixtureRequiresLiveReviewOnly ? [] : ["clear_fixture_does_not_require_live_review_only"]),
        ...(checks.blockedFixtureFailsClosed ? [] : ["blocked_fixture_not_fail_closed"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.manualOperatorApprovalContractReady ? [] : ["manual_operator_approval_contract_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...missingClearanceInputs.map((input) => `missing_clearance_input_${input}`),
        ...missingClearanceAssertions.map((assertion) => `missing_clearance_assertion_${assertion}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.architectureDocMentionsRiskGateClearance
          ? []
          : ["architecture_doc_missing_risk_gate_clearance_boundary"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = await buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-risk-gate-clearance-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-risk-gate-clearance-contract.cjs`);
    }
    console.log("[generate-trading-risk-gate-clearance-contract] ok");
    console.log(`[generate-trading-risk-gate-clearance-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-risk-gate-clearance-contract] wrote contract");
  console.log(
    `[generate-trading-risk-gate-clearance-contract] readyForFutureRiskGateClearanceImplementationReview=${parsed.readiness.readyForFutureRiskGateClearanceImplementationReview}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

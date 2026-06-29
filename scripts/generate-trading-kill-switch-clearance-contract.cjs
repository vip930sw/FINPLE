const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_kill_switch_clearance_contract.json");
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
const AUDIT_LOGGER_READINESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const ENV_CONFIG_SOURCE_PATH = path.join("server", "src", "services", "tradingEnvConfig.js");
const RISK_ENGINE_SOURCE_PATH = path.join("server", "src", "services", "tradingRiskEngine.js");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-kill-switch-clearance-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const SAMPLE_SYMBOL = "SPY";
const SAMPLE_SESSION = "US_REGULAR";
const KILL_SWITCH_ON_ENV = Object.freeze({
  FINPLE_TRADING_MODE: "shadow",
  FINPLE_TRADING_KILL_SWITCH: "true",
  FINPLE_TRADING_ALLOWED_MARKETS: "US",
  FINPLE_TRADING_ALLOWED_ASSET_TYPES_BY_MARKET: "US:ETF",
  FINPLE_TRADING_ALLOWED_SYMBOLS: SAMPLE_SYMBOL,
  FINPLE_TRADING_ORDER_PERMISSION_APPROVED_AT: "2026-06-29T00:00:00+09:00",
  FINPLE_TRADING_ORDER_PERMISSION_APPROVED_BY: "SANG_WON",
  KIS_TRADING_APP_KEY: "present-placeholder",
  KIS_TRADING_APP_SECRET: "present-placeholder",
  KIS_TRADING_ACCOUNT_ID: "50195326-01",
  KIS_TRADING_BASE_URL: "https://openapivts.koreainvestment.com:29443",
});
const KILL_SWITCH_CLEAR_ENV = Object.freeze({
  ...KILL_SWITCH_ON_ENV,
  FINPLE_TRADING_KILL_SWITCH: "false",
});
const REQUIRED_CLEARANCE_FIELDS = [
  "clearanceId",
  "clearedBy",
  "clearedAt",
  "expiresAt",
  "mode",
  "reason",
  "riskGateStatus",
  "manualApprovalId",
  "auditEventId",
  "previousKillSwitchState",
  "newKillSwitchState",
  "payloadHash",
];
const REQUIRED_CLEARANCE_ASSERTIONS = [
  "clearance_is_time_boxed",
  "clearance_is_operator_attributed",
  "clearance_is_audited_before_order_intent",
  "clearance_requires_manual_approval_contract",
  "clearance_requires_risk_gate_clear",
  "clearance_cannot_enable_provider_calls_by_itself",
  "clearance_cannot_enable_order_submission_by_itself",
  "kill_switch_on_overrides_all_other_gates",
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
  path.join("server", "src", "services", "tradingKillSwitch.js"),
  path.join("server", "src", "services", "trading", "killSwitch.js"),
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

function riskInputs(envReport) {
  return {
    intent: {
      symbol: SAMPLE_SYMBOL,
      side: "buy",
      quantity: 1,
      estimatedPrice: 400,
      estimatedFxRate: 1,
    },
    limits: {
      maxAccountCapitalAllocated: 10000,
      maxCashDepletionPerDay: 1000,
      maxSingleSymbolExposure: 3000,
      maxSingleOrderNotional: 1000,
      maxDailyTurnover: 2000,
      maxOrderAttemptsPerDay: 5,
      maxConsecutiveFailedOrderAttempts: 2,
      maxSlippageTolerance: 0.01,
      allowedMarketSessions: [SAMPLE_SESSION],
      allowedSymbols: envReport.normalized?.allowedSymbols ?? [],
      blockedInstruments: [],
    },
    runtime: {
      mode: envReport.mode,
      currentSession: SAMPLE_SESSION,
      dailyLossAmount: 0,
      dailyCashDepletion: 0,
      dailyTurnover: 0,
      dailyOrderAttempts: 0,
      consecutiveFailedOrderAttempts: 0,
      allocatedCapital: 1000,
      currentSymbolExposure: 500,
      estimatedSlippage: 0,
      globalTradingDisabled: envReport.normalized?.killSwitchEnabled !== false,
      dailyLossLimitBreached: false,
      dailyOrderCountLimitBreached: false,
      symbolAllowlisted: (envReport.normalized?.allowedSymbols ?? []).includes(SAMPLE_SYMBOL),
      quoteFresh: true,
      fxFresh: true,
      accountStateMatched: true,
      kisAuthOk: false,
      kisRateLimited: false,
      strategyReviewed: true,
      auditLoggerReady: true,
      manualOperatorStop: false,
    },
  };
}

function compactRiskGate(evaluation) {
  return {
    status: evaluation.status,
    mode: evaluation.mode,
    reasons: evaluation.reasons,
    liveOrderIntentEligible: evaluation.liveOrderIntentEligible,
    orderSubmissionAllowed: evaluation.orderSubmissionAllowed,
    providerCallsAllowed: evaluation.providerCallsAllowed,
  };
}

async function buildContract() {
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const manualOperatorApprovalContract = readJson(MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH);
  const auditLoggerReadinessContract = readJson(AUDIT_LOGGER_READINESS_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const { validateTradingEnvConfig } = await importService(ENV_CONFIG_SOURCE_PATH);
  const { evaluateTradingRiskGate } = await importService(RISK_ENGINE_SOURCE_PATH);
  const killSwitchOnReport = validateTradingEnvConfig(KILL_SWITCH_ON_ENV);
  const killSwitchClearReport = validateTradingEnvConfig(KILL_SWITCH_CLEAR_ENV);
  const killSwitchOnRisk = compactRiskGate(
    evaluateTradingRiskGate(...Object.values(riskInputs(killSwitchOnReport))),
  );
  const killSwitchClearRisk = compactRiskGate(
    evaluateTradingRiskGate(...Object.values(riskInputs(killSwitchClearReport))),
  );
  const liveGuardedMode = (policy.modes ?? []).find((mode) => mode.mode === "live_guarded") ?? {};
  const clearanceFields = [...REQUIRED_CLEARANCE_FIELDS];
  const clearanceAssertions = [...REQUIRED_CLEARANCE_ASSERTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const missingClearanceFields = missingValues(clearanceFields, REQUIRED_CLEARANCE_FIELDS);
  const missingClearanceAssertions = missingValues(clearanceAssertions, REQUIRED_CLEARANCE_ASSERTIONS);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    liveGuardedPolicyRequiresKillSwitchClear:
      liveGuardedMode.mode === "live_guarded" &&
      liveGuardedMode.requiresKillSwitchClear === true &&
      liveGuardedMode.requiresManualApproval === true,
    killSwitchDefaultFailsClosed:
      killSwitchOnReport.normalized?.killSwitchEnabled === true &&
      killSwitchOnRisk.status === "blocked" &&
      killSwitchOnRisk.reasons.includes("kill_switch_global_trading_disabled") &&
      killSwitchOnRisk.orderSubmissionAllowed === false &&
      killSwitchOnRisk.providerCallsAllowed === false,
    killSwitchClearAloneDoesNotSubmit:
      killSwitchClearReport.normalized?.killSwitchEnabled === false &&
      killSwitchClearRisk.orderSubmissionAllowed === false &&
      killSwitchClearRisk.providerCallsAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    envRiskGateContractStillFailClosed:
      envRiskGateContract.readiness?.readyForCurrentStep === true &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    manualOperatorApprovalContractReady:
      manualOperatorApprovalContract.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      manualOperatorApprovalContract.readiness?.manualApprovalImplementationAllowed === false &&
      manualOperatorApprovalContract.readiness?.providerCallsAllowed === false &&
      manualOperatorApprovalContract.readiness?.orderSubmissionAllowed === false,
    auditLoggerReadinessContractReady:
      auditLoggerReadinessContract.readiness?.readyForFutureAuditLoggerImplementationReview === true &&
      auditLoggerReadinessContract.readiness?.auditLoggerImplementationAllowed === false &&
      auditLoggerReadinessContract.readiness?.providerCallsAllowed === false &&
      auditLoggerReadinessContract.readiness?.orderSubmissionAllowed === false,
    clearanceFieldsReady: missingClearanceFields.length === 0,
    clearanceAssertionsReady: missingClearanceAssertions.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    architectureDocMentionsKillSwitchClearance:
      architectureDoc.includes("Trading Kill Switch Clearance Contract") &&
      architectureDoc.includes("kill_switch_clear"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    killSwitchRuntimeImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureKillSwitchClearanceImplementationReview =
    checks.liveGuardedPolicyRequiresKillSwitchClear &&
    checks.killSwitchDefaultFailsClosed &&
    checks.killSwitchClearAloneDoesNotSubmit &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.envRiskGateContractStillFailClosed &&
    checks.manualOperatorApprovalContractReady &&
    checks.auditLoggerReadinessContractReady &&
    checks.clearanceFieldsReady &&
    checks.clearanceAssertionsReady &&
    checks.forbiddenActionsReady &&
    checks.architectureDocMentionsKillSwitchClearance &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1O",
    scope: "trading_kill_switch_clearance_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_CONTRACT_PATH,
      envParser: ENV_CONFIG_SOURCE_PATH,
      riskEngine: RISK_ENGINE_SOURCE_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      killSwitchRuntimeImplementationAllowed: false,
      killSwitchClearNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureKillSwitchClearanceBoundary: {
      purpose: "require explicit auditable kill-switch clearance before future live_guarded order-intent promotion while keeping kill-switch-on as an unconditional stop",
      requiredClearanceFields: clearanceFields,
      requiredAssertions: clearanceAssertions,
      forbiddenActions,
      clearanceWindow: {
        currentStepClearsKillSwitch: false,
        timeBoxedClearanceRequired: true,
        operatorAttributionRequired: true,
        auditEventRequired: true,
        clearanceByFrontendInputAllowed: false,
      },
      promotionRules: [
        "kill switch on blocks every future order-intent promotion",
        "kill switch clearance must be audited before any future live_guarded review",
        "kill switch clearance cannot override risk gate or manual approval failure",
        "kill switch clearance readiness does not approve provider calls or order submission",
      ],
    },
    fixtureEvidence: {
      killSwitchOn: {
        envMode: killSwitchOnReport.mode,
        killSwitchEnabled: killSwitchOnReport.normalized?.killSwitchEnabled,
        riskGate: killSwitchOnRisk,
      },
      killSwitchClear: {
        envMode: killSwitchClearReport.mode,
        killSwitchEnabled: killSwitchClearReport.normalized?.killSwitchEnabled,
        riskGate: killSwitchClearRisk,
      },
    },
    checks,
    evidence: {
      liveGuardedMode,
      missingClearanceFields,
      missingClearanceAssertions,
      missingForbiddenActions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      manualOperatorApprovalContractStatus: manualOperatorApprovalContract.readiness?.status,
      auditLoggerReadinessContractStatus: auditLoggerReadinessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureKillSwitchClearanceImplementationReview
        ? "contract_ready_pending_kill_switch_clearance_implementation_review"
        : "blocked_before_kill_switch_clearance_contract",
      readyForFutureKillSwitchClearanceImplementationReview,
      killSwitchRuntimeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.liveGuardedPolicyRequiresKillSwitchClear ? [] : ["live_guarded_policy_not_ready"]),
        ...(checks.killSwitchDefaultFailsClosed ? [] : ["kill_switch_default_not_fail_closed"]),
        ...(checks.killSwitchClearAloneDoesNotSubmit ? [] : ["kill_switch_clear_alone_allows_submission"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.envRiskGateContractStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...(checks.manualOperatorApprovalContractReady ? [] : ["manual_operator_approval_contract_not_ready"]),
        ...(checks.auditLoggerReadinessContractReady ? [] : ["audit_logger_readiness_contract_not_ready"]),
        ...missingClearanceFields.map((field) => `missing_clearance_field_${field}`),
        ...missingClearanceAssertions.map((assertion) => `missing_clearance_assertion_${assertion}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.architectureDocMentionsKillSwitchClearance
          ? []
          : ["architecture_doc_missing_kill_switch_clearance_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-kill-switch-clearance-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-kill-switch-clearance-contract.cjs`);
    }
    console.log("[generate-trading-kill-switch-clearance-contract] ok");
    console.log(`[generate-trading-kill-switch-clearance-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-kill-switch-clearance-contract] wrote contract");
  console.log(
    `[generate-trading-kill-switch-clearance-contract] readyForFutureKillSwitchClearanceImplementationReview=${parsed.readiness.readyForFutureKillSwitchClearanceImplementationReview}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

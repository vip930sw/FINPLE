const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json",
);
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const KILL_SWITCH_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
);
const MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_operator_approval_contract.json",
);
const RISK_ENGINE_PATH = path.join("server", "src", "services", "tradingRiskEngine.js");
const TRADING_POLICY_PATH = path.join("server", "src", "services", "tradingLabPolicy.js");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-trading-rules-and-risk-limits-review-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_RULE_REVIEW_ITEMS = [
  "symbol_allowlist",
  "blocked_instruments",
  "max_single_order_notional",
  "max_daily_turnover",
  "max_cash_depletion_per_day",
  "max_single_symbol_exposure",
  "max_account_capital_allocated",
  "max_order_attempts_per_day",
  "max_consecutive_failed_order_attempts",
  "max_slippage_tolerance",
  "allowed_market_sessions",
  "quote_and_fx_freshness",
  "kill_switch_clearance",
  "manual_operator_approval",
  "risk_gate_clearance",
  "audit_logger_readiness",
];
const REQUIRED_RULE_ASSERTIONS = [
  "wildcard_symbols_cannot_promote_to_live_guarded",
  "rules_review_does_not_change_runtime_limits",
  "rules_review_does_not_clear_kill_switch",
  "rules_review_does_not_clear_risk_gate",
  "rules_review_does_not_create_manual_approval",
  "rules_review_does_not_authorize_provider_calls",
  "rules_review_does_not_authorize_order_submission",
  "rules_review_does_not_create_public_ui",
  "rules_review_requires_private_shadow_runtime_review_first",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "tradingRulesRuntime.js"),
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

function buildReviewPlan() {
  return {
    scope: "trading_rules_and_risk_limits_review",
    mayPlanRulesNow: true,
    mayApplyRuntimeRulesNow: false,
    mayChangeEnvNow: false,
    mayClearKillSwitchNow: false,
    mayClearRiskGateNow: false,
    maySubmitOrdersNow: false,
    requiredRuleReviewItems: REQUIRED_RULE_REVIEW_ITEMS,
    requiredAssertions: REQUIRED_RULE_ASSERTIONS,
    conservativeDefaultsForFutureReview: {
      allowedSymbols: [],
      blockedInstruments: ["UVXY", "TQQQ", "SQQQ"],
      maxSingleOrderNotional: 1000,
      maxDailyTurnover: 2000,
      maxCashDepletionPerDay: 1000,
      maxSingleSymbolExposure: 3000,
      maxAccountCapitalAllocated: 10000,
      maxOrderAttemptsPerDay: 5,
      maxConsecutiveFailedOrderAttempts: 2,
      maxSlippageTolerance: 0.01,
      allowedMarketSessions: ["KR_REGULAR", "US_REGULAR"],
    },
    promotionRules: [
      "symbol allowlists must be explicit before live_guarded review",
      "wildcard env symbols remain planning evidence only and cannot become runtime allowlists",
      "risk limits must be reviewed after private shadow runtime review and before paper shadow operational tests",
      "rules review cannot override kill switch, manual approval, risk gate, audit logger, or manual permission gates",
    ],
  };
}

function buildContract() {
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const killSwitchClearanceContract = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const manualOperatorApprovalContract = readJson(MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH);
  const riskEngineSource = readText(RISK_ENGINE_PATH);
  const tradingPolicySource = readText(TRADING_POLICY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewPlan = buildReviewPlan();
  const missingRuleReviewItems = missingValues(reviewPlan.requiredRuleReviewItems, REQUIRED_RULE_REVIEW_ITEMS);
  const missingRuleAssertions = missingValues(reviewPlan.requiredAssertions, REQUIRED_RULE_ASSERTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    reviewContractOnly: true,
    launchPlanIncludesRulesReview:
      launchReadinessPlan.readiness?.planReady === true &&
      launchReadinessPlan.launchReadinessPlan?.tradingRulesPolicy?.mayPlanRulesNow === true &&
      launchReadinessPlan.launchReadinessPlan?.tradingRulesPolicy?.mayApplyRuntimeRulesNow === false &&
      launchReadinessPlan.launchReadinessPlan?.phases?.some(
        (phase) => phase.id === "trading_rules_and_risk_limits_review",
      ) === true,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.parserResult?.normalized?.wildcardAllowedSymbols === true &&
      envRiskGateContract.parserResult?.warnings?.includes("wildcard_allowed_symbols_must_be_narrowed_before_live_guarded") ===
        true &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearanceContract.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearanceContract.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearanceContract.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearanceContract.readiness?.orderSubmissionAllowed === false,
    manualOperatorApprovalContractReady:
      manualOperatorApprovalContract.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      manualOperatorApprovalContract.readiness?.orderSubmissionAllowed === false,
    riskEngineExposesRequiredLimitChecks:
      riskEngineSource.includes("evaluateTradingRiskGate") &&
      riskEngineSource.includes("maxSingleOrderNotional") &&
      riskEngineSource.includes("maxDailyTurnover") &&
      riskEngineSource.includes("maxCashDepletionPerDay") &&
      riskEngineSource.includes("allowedSymbols"),
    policyExposesRiskLimitValidator:
      tradingPolicySource.includes("validateRiskLimits") &&
      tradingPolicySource.includes("maxSlippageTolerance") &&
      tradingPolicySource.includes("allowedMarketSessions"),
    ruleReviewItemsReady: missingRuleReviewItems.length === 0,
    ruleAssertionsReady: missingRuleAssertions.length === 0,
    architectureDocMentionsTradingRulesReview:
      architectureDoc.includes("Trading Rules And Risk Limits Review") &&
      architectureDoc.includes("trading_rules_and_risk_limits_review"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureTradingRulesReview =
    checks.launchPlanIncludesRulesReview &&
    checks.envRiskGateStillFailClosed &&
    checks.riskGateClearanceContractReady &&
    checks.killSwitchClearanceContractReady &&
    checks.manualOperatorApprovalContractReady &&
    checks.riskEngineExposesRequiredLimitChecks &&
    checks.policyExposesRiskLimitValidator &&
    checks.ruleReviewItemsReady &&
    checks.ruleAssertionsReady &&
    checks.architectureDocMentionsTradingRulesReview &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5B",
    scope: "trading_rules_and_risk_limits_review",
    sourceFiles: {
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH,
      riskEngine: RISK_ENGINE_PATH,
      tradingPolicy: TRADING_POLICY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      reviewContractOnly: true,
      rulesRuntimeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    tradingRulesAndRiskLimitsReview: reviewPlan,
    checks,
    evidence: {
      missingRuleReviewItems,
      missingRuleAssertions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      launchPlanStatus: launchReadinessPlan.readiness?.status ?? null,
      envRiskGateStatus: envRiskGateContract.readiness?.status ?? null,
      envRiskGateWarnings: envRiskGateContract.parserResult?.warnings ?? [],
      riskGateClearanceStatus: riskGateClearanceContract.readiness?.status ?? null,
      killSwitchClearanceStatus: killSwitchClearanceContract.readiness?.status ?? null,
      manualOperatorApprovalStatus: manualOperatorApprovalContract.readiness?.status ?? null,
    },
    readiness: {
      status: readyForFutureTradingRulesReview
        ? "trading_rules_review_contract_ready_runtime_application_blocked"
        : "blocked_before_trading_rules_review_contract",
      readyForFutureTradingRulesReview,
      rulesRuntimeImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.launchPlanIncludesRulesReview ? [] : ["launch_plan_missing_rules_review"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_not_fail_closed"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.manualOperatorApprovalContractReady ? [] : ["manual_operator_approval_contract_not_ready"]),
        ...(checks.riskEngineExposesRequiredLimitChecks ? [] : ["risk_engine_missing_required_limit_checks"]),
        ...(checks.policyExposesRiskLimitValidator ? [] : ["policy_missing_risk_limit_validator"]),
        ...(checks.ruleReviewItemsReady ? [] : ["rule_review_items_missing"]),
        ...(checks.ruleAssertionsReady ? [] : ["rule_assertions_missing"]),
        ...(checks.architectureDocMentionsTradingRulesReview ? [] : ["architecture_doc_missing_trading_rules_review"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
        "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
        "trading_rules_runtime_application_blocked_pending_private_shadow_runtime_review",
        "paper_shadow_operational_test_blocked_pending_rules_review",
        "live_guarded_manual_test_blocked_pending_manual_permission_and_risk_clearance",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-rules-and-risk-limits-review-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-rules-and-risk-limits-review-contract.cjs`);
    }
    console.log("[generate-trading-rules-and-risk-limits-review-contract] ok");
    console.log(`[generate-trading-rules-and-risk-limits-review-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-rules-and-risk-limits-review-contract] wrote contract");
  console.log(
    `[generate-trading-rules-and-risk-limits-review-contract] readyForFutureTradingRulesReview=${parsed.readiness.readyForFutureTradingRulesReview}`,
  );
}

main();

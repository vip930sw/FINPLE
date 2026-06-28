const fs = require("node:fs");
const path = require("node:path");

const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);
const KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_kis_written_response_preflight.json");
const SCENARIO_RUNTIME_PREFLIGHT_PATH = path.join("data", "processed", "scenario_runtime_implementation_preflight.json");
const SCENARIO_MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");

const PREFLIGHT_VERSION = "trading-lab-step1160-preflight-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const REQUIRED_MODES = ["paper", "shadow", "live_guarded", "live_blocked"];
const REQUIRED_KILL_SWITCH_CONDITIONS = [
  "global_trading_disabled",
  "mode_not_live_guarded",
  "daily_loss_limit_breached",
  "daily_order_count_limit_breached",
  "symbol_not_allowlisted",
  "stale_quote_or_fx_input",
  "account_balance_or_position_mismatch",
  "kis_auth_failure_or_rate_limit",
  "unreviewed_strategy_version",
  "missing_audit_logger",
  "manual_operator_stop",
];
const REQUIRED_RISK_LIMITS = [
  "max_account_capital_allocated",
  "max_cash_depletion_per_day",
  "max_single_symbol_exposure",
  "max_single_order_notional",
  "max_daily_turnover",
  "max_order_attempts_per_day",
  "max_consecutive_failed_order_attempts",
  "max_slippage_tolerance",
  "allowed_market_sessions",
  "allowed_symbols_and_exchanges",
  "blocked_instruments",
];
const REQUIRED_DATA_CLASSES = [
  "analytics_data",
  "trading_market_data",
  "execution_data",
  "user_product_data",
  "signal_data",
];
const FORBIDDEN_RUNTIME_PATHS = [
  path.join("server", "src", "routes", "trading"),
  path.join("server", "src", "services", "trading"),
  path.join("server", "src", "services", "tradingOrderService.js"),
  path.join("server", "src", "services", "kisTradingService.js"),
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

function unique(values) {
  return [...new Set(values)];
}

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function buildPreflight() {
  const policy = readJson(POLICY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const kisWrittenResponsePreflight = readJson(KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH);
  const scenarioRuntimePreflight = readJson(SCENARIO_RUNTIME_PREFLIGHT_PATH);
  const monthlyDataFileExists = fs.existsSync(SCENARIO_MONTHLY_DATA_PATH);

  const modes = policy.modes ?? [];
  const modeNames = modes.map((mode) => mode.mode);
  const missingModes = missingValues(modeNames, REQUIRED_MODES);
  const liveGuarded = modes.find((mode) => mode.mode === "live_guarded") ?? {};
  const paper = modes.find((mode) => mode.mode === "paper") ?? {};
  const shadow = modes.find((mode) => mode.mode === "shadow") ?? {};
  const liveBlocked = modes.find((mode) => mode.mode === "live_blocked") ?? {};

  const defaultSafe =
    ["live_blocked", "paper"].includes(policy.defaults?.mode) &&
    policy.defaults?.orderSubmissionAllowed === false &&
    policy.defaults?.providerCallsAllowed === false &&
    policy.defaults?.dbMigrationAllowed === false &&
    policy.defaults?.publicUiAllowed === false &&
    policy.defaults?.signalProductAllowed === false;
  const modesReady =
    missingModes.length === 0 &&
    paper.externalOrderCall === false &&
    shadow.externalOrderCall === false &&
    liveBlocked.externalOrderCall === false &&
    liveGuarded.externalOrderCall === true &&
    liveGuarded.requiresManualApproval === true &&
    liveGuarded.requiresKillSwitchClear === true &&
    liveGuarded.requiresDryRunReplay === true;
  const missingKillSwitchConditions = missingValues(policy.killSwitch?.conditions ?? [], REQUIRED_KILL_SWITCH_CONDITIONS);
  const killSwitchReady =
    policy.killSwitch?.required === true &&
    policy.killSwitch?.defaultState === "blocked" &&
    missingKillSwitchConditions.length === 0;
  const missingRiskLimits = missingValues(policy.riskLimitCategories ?? [], REQUIRED_RISK_LIMITS);
  const riskLimitsReady = missingRiskLimits.length === 0;
  const missingDataClasses = missingValues(policy.dataClasses ?? [], REQUIRED_DATA_CLASSES);
  const dataClassesReady = missingDataClasses.length === 0;
  const secretBoundaryReady =
    policy.secretBoundary?.separateOrderCapableCredentialsRequired === true &&
    policy.secretBoundary?.frontendMayReadTradingSecrets === false &&
    (policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_TRADING_APP_KEY") &&
    (policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_TRADING_APP_SECRET") &&
    !(policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_APP_KEY") &&
    !(policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_APP_SECRET");
  const forbiddenRuntimeArtifacts = FORBIDDEN_RUNTIME_PATHS.filter((filePath) => fs.existsSync(filePath));
  const runtimeArtifactsAbsent = forbiddenRuntimeArtifacts.length === 0;
  const architectureDocReady =
    architectureDoc.includes("no KIS provider calls") &&
    architectureDoc.includes("no order submission") &&
    architectureDoc.includes("no database migration") &&
    architectureDoc.includes("Default mode must be `live_blocked` or `paper`");
  const scenarioGatesStillBlocked =
    kisWrittenResponsePreflight.checks?.responseReady === false &&
    scenarioRuntimePreflight.checks?.runtimeScenarioImplementationAllowed === false &&
    monthlyDataFileExists === false;

  const checks = {
    defaultSafe,
    modesReady,
    killSwitchReady,
    riskLimitsReady,
    dataClassesReady,
    secretBoundaryReady,
    runtimeArtifactsAbsent,
    architectureDocReady,
    scenarioGatesStillBlocked,
    orderSubmissionAllowed: false,
    providerCallsAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForPureValidatorImplementation = Object.values(checks).every((value) => value === true || value === false)
    ? defaultSafe &&
      modesReady &&
      killSwitchReady &&
      riskLimitsReady &&
      dataClassesReady &&
      secretBoundaryReady &&
      runtimeArtifactsAbsent &&
      architectureDocReady &&
      scenarioGatesStillBlocked
    : false;
  const blockers = unique([
    ...(defaultSafe ? [] : ["trading_policy_default_not_safe"]),
    ...(missingModes.length === 0 ? [] : missingModes.map((mode) => `missing_mode_${mode}`)),
    ...(modesReady ? [] : ["trading_modes_not_ready"]),
    ...missingKillSwitchConditions.map((condition) => `missing_kill_switch_condition_${condition}`),
    ...(killSwitchReady ? [] : ["kill_switch_not_fail_closed"]),
    ...missingRiskLimits.map((limit) => `missing_risk_limit_${limit}`),
    ...missingDataClasses.map((dataClass) => `missing_data_class_${dataClass}`),
    ...(secretBoundaryReady ? [] : ["trading_secret_boundary_not_separate"]),
    ...forbiddenRuntimeArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
    ...(architectureDocReady ? [] : ["architecture_doc_missing_required_non_goals"]),
    ...(scenarioGatesStillBlocked ? [] : ["scenario_gates_not_blocked_or_monthly_data_exists"]),
  ]);

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      policy: POLICY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
      kisWrittenResponsePreflight: KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH,
      scenarioRuntimePreflight: SCENARIO_RUNTIME_PREFLIGHT_PATH,
      scenarioMonthlyDataTarget: SCENARIO_MONTHLY_DATA_PATH,
    },
    outputFiles: {
      preflight: PREFLIGHT_PATH,
    },
    checks,
    evidence: {
      modes: modeNames,
      missingModes,
      missingKillSwitchConditions,
      missingRiskLimits,
      missingDataClasses,
      forbiddenRuntimeArtifacts,
      scenarioKisResponseReady: kisWrittenResponsePreflight.checks?.responseReady,
      scenarioRuntimeAllowed: scenarioRuntimePreflight.checks?.runtimeScenarioImplementationAllowed,
      monthlyDataFileExists,
    },
    readiness: {
      status: readyForPureValidatorImplementation
        ? "ready_for_step116_pure_validator_implementation"
        : "blocked_before_step116_pure_validator_implementation",
      readyForPureValidatorImplementation,
      orderSubmissionAllowed: false,
      providerCallsAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      nextAllowedStep: readyForPureValidatorImplementation
        ? "implement_trading_domain_types_and_pure_validators_without_provider_calls"
        : "fix_step1160_policy_before_any_trading_code",
      blockers,
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-trading-lab-step1160-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-trading-lab-step1160-preflight.cjs`);
    }
    console.log("[generate-trading-lab-step1160-preflight] ok");
    console.log(`[generate-trading-lab-step1160-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-trading-lab-step1160-preflight] wrote preflight");
  console.log(
    `[generate-trading-lab-step1160-preflight] readyForPureValidatorImplementation=${parsed.readiness.readyForPureValidatorImplementation}`,
  );
}

main();

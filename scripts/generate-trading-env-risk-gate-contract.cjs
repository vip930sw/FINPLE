const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_env_risk_gate_contract.json");
const ENV_READINESS_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_env_readiness_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const ENV_CONFIG_SOURCE_PATH = path.join("server", "src", "services", "tradingEnvConfig.js");
const RISK_ENGINE_SOURCE_PATH = path.join("server", "src", "services", "tradingRiskEngine.js");

const CONTRACT_VERSION = "trading-lab-step116-env-risk-gate-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const SAMPLE_SYMBOL = "SPY";
const SAMPLE_SESSION = "US_REGULAR";

const SHADOW_ENV_FIXTURE = Object.freeze({
  FINPLE_TRADING_MODE: "shadow",
  FINPLE_TRADING_KILL_SWITCH: "true",
  FINPLE_TRADING_ALLOWED_MARKETS: "KR,US",
  FINPLE_TRADING_ALLOWED_ASSET_TYPES_BY_MARKET: "KR:STOCK;US:STOCK,ETF",
  FINPLE_TRADING_ALLOWED_SYMBOLS: "*",
  FINPLE_TRADING_ORDER_PERMISSION_APPROVED_AT: "2026-06-29T00:00:00+09:00",
  FINPLE_TRADING_ORDER_PERMISSION_APPROVED_BY: "SANG_WON",
  KIS_TRADING_APP_KEY: "present-placeholder",
  KIS_TRADING_APP_SECRET: "present-placeholder",
  KIS_TRADING_ACCOUNT_ID: "50195326-01",
  KIS_TRADING_BASE_URL: "https://openapivts.koreainvestment.com:29443",
});

const RISK_LIMIT_FIXTURE = Object.freeze({
  maxAccountCapitalAllocated: 10000,
  maxCashDepletionPerDay: 1000,
  maxSingleSymbolExposure: 3000,
  maxSingleOrderNotional: 1000,
  maxDailyTurnover: 2000,
  maxOrderAttemptsPerDay: 5,
  maxConsecutiveFailedOrderAttempts: 2,
  maxSlippageTolerance: 0.01,
  allowedMarketSessions: [SAMPLE_SESSION],
  allowedSymbols: [],
  blockedInstruments: ["UVXY"],
});

const INTENT_FIXTURE = Object.freeze({
  symbol: SAMPLE_SYMBOL,
  side: "buy",
  quantity: 1,
  estimatedPrice: 400,
  estimatedFxRate: 1,
});

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function redactedEnvPresence(env) {
  return Object.fromEntries(
    Object.entries(env).map(([name, value]) => [
      name,
      {
        present: String(value ?? "").trim().length > 0,
        valueStored: false,
        secret: name.includes("SECRET") || name.includes("APP_KEY") || name.includes("ACCOUNT_ID"),
      },
    ]),
  );
}

function allowedSymbolsForRiskGate(envReport) {
  if (envReport.normalized?.wildcardAllowedSymbols === true) return [];
  return envReport.normalized?.allowedSymbols ?? [];
}

function buildRiskGateInputs(envReport) {
  const allowedSymbols = allowedSymbolsForRiskGate(envReport);
  const symbolAllowlisted = allowedSymbols.includes(SAMPLE_SYMBOL);
  return {
    intent: { ...INTENT_FIXTURE },
    limits: {
      ...RISK_LIMIT_FIXTURE,
      allowedSymbols,
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
      symbolAllowlisted,
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

function compactRiskGateEvaluation(evaluation) {
  return {
    valid: evaluation.valid,
    status: evaluation.status,
    mode: evaluation.mode,
    reasons: evaluation.reasons,
    intentPromotionAllowed: evaluation.intentPromotionAllowed,
    paperFillAllowed: evaluation.paperFillAllowed,
    shadowRecordAllowed: evaluation.shadowRecordAllowed,
    liveOrderIntentEligible: evaluation.liveOrderIntentEligible,
    orderSubmissionAllowed: evaluation.orderSubmissionAllowed,
    providerCallsAllowed: evaluation.providerCallsAllowed,
    riskEvent: {
      eventType: evaluation.riskEvent?.eventType,
      severity: evaluation.riskEvent?.severity,
      status: evaluation.riskEvent?.status,
      mode: evaluation.riskEvent?.mode,
      symbol: evaluation.riskEvent?.symbol,
      side: evaluation.riskEvent?.side,
      reasons: evaluation.riskEvent?.reasons ?? [],
      orderSubmissionAllowed: evaluation.riskEvent?.orderSubmissionAllowed,
      providerCallsAllowed: evaluation.riskEvent?.providerCallsAllowed,
    },
  };
}

async function importService(filePath) {
  return import(pathToFileURL(path.resolve(filePath)).href);
}

async function buildContract() {
  const envReadiness = readJson(ENV_READINESS_CONTRACT_PATH);
  const policy = readJson(POLICY_PATH);
  const { validateTradingEnvConfig } = await importService(ENV_CONFIG_SOURCE_PATH);
  const { evaluateTradingRiskGate } = await importService(RISK_ENGINE_SOURCE_PATH);
  const envReport = validateTradingEnvConfig(SHADOW_ENV_FIXTURE);
  const riskGateInputs = buildRiskGateInputs(envReport);
  const riskGateEvaluation = compactRiskGateEvaluation(
    evaluateTradingRiskGate(riskGateInputs.intent, riskGateInputs.limits, riskGateInputs.runtime),
  );
  const checks = {
    contractOnly: true,
    envParserShapeValid: envReport.validShape === true,
    envModeFeedsRiskRuntime: riskGateInputs.runtime.mode === envReport.mode,
    killSwitchFeedsGlobalTradingDisabled:
      envReport.normalized?.killSwitchEnabled === true && riskGateInputs.runtime.globalTradingDisabled === true,
    wildcardSymbolsFailClosed:
      envReport.normalized?.wildcardAllowedSymbols === true &&
      riskGateInputs.limits.allowedSymbols.length === 0 &&
      riskGateInputs.runtime.symbolAllowlisted === false,
    virtualTradingBaseUrlDoesNotEnableProviderCalls:
      envReport.normalized?.kisTradingBaseUrlMode === "virtual_trading" &&
      riskGateEvaluation.providerCallsAllowed === false,
    riskGateBlocksCurrentShadowFixture:
      riskGateEvaluation.status === "blocked" &&
      riskGateEvaluation.reasons.includes("kill_switch_global_trading_disabled") &&
      riskGateEvaluation.reasons.includes("kill_switch_symbol_not_allowlisted"),
    riskGateStillDisablesOrderSubmission: riskGateEvaluation.orderSubmissionAllowed === false,
    envReadinessStillBlocksRuntime:
      envReadiness.readiness?.readOnlyRuntimeIntegrationAllowed === false &&
      envReadiness.readiness?.adapterImplementationAllowed === false,
    policyStillBlocksRuntime:
      policy.defaults?.orderSubmissionAllowed === false &&
      policy.defaults?.providerCallsAllowed === false &&
      policy.defaults?.dbMigrationAllowed === false &&
      policy.defaults?.publicUiAllowed === false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const blockers = [
    ...(checks.envParserShapeValid ? [] : ["env_parser_shape_invalid"]),
    ...(checks.envModeFeedsRiskRuntime ? [] : ["env_mode_not_mapped_to_risk_runtime_mode"]),
    ...(checks.killSwitchFeedsGlobalTradingDisabled ? [] : ["kill_switch_not_mapped_to_global_trading_disabled"]),
    ...(checks.wildcardSymbolsFailClosed ? [] : ["wildcard_symbols_not_fail_closed"]),
    ...(checks.virtualTradingBaseUrlDoesNotEnableProviderCalls ? [] : ["virtual_base_url_enabled_provider_calls"]),
    ...(checks.riskGateBlocksCurrentShadowFixture ? [] : ["risk_gate_did_not_block_current_shadow_fixture"]),
    ...(checks.riskGateStillDisablesOrderSubmission ? [] : ["risk_gate_allows_order_submission"]),
    ...(checks.envReadinessStillBlocksRuntime ? [] : ["env_readiness_unblocked_runtime_too_early"]),
    ...(checks.policyStillBlocksRuntime ? [] : ["policy_defaults_unblocked_runtime_too_early"]),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1I",
    scope: "trading_env_parser_to_risk_gate_input_contract",
    sourceFiles: {
      envReadinessContract: ENV_READINESS_CONTRACT_PATH,
      policy: POLICY_PATH,
      envParser: ENV_CONFIG_SOURCE_PATH,
      riskEngine: RISK_ENGINE_SOURCE_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      envValuesStored: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
    },
    parserFixturePresence: redactedEnvPresence(SHADOW_ENV_FIXTURE),
    parserResult: {
      validShape: envReport.validShape,
      mode: envReport.mode,
      normalized: envReport.normalized,
      shapeReasons: envReport.shapeReasons,
      runtimeBlockers: envReport.runtimeBlockers,
      warnings: envReport.warnings,
    },
    riskGateInputContract: {
      mappingRules: [
        {
          from: "validateTradingEnvConfig().mode",
          to: "evaluateTradingRiskGate(runtime.mode)",
          rule: "normalized mode is passed through; unknown modes remain live_blocked",
        },
        {
          from: "normalized.killSwitchEnabled",
          to: "runtime.globalTradingDisabled",
          rule: "true keeps the risk gate blocked",
        },
        {
          from: "normalized.allowedSymbols",
          to: "limits.allowedSymbols and runtime.symbolAllowlisted",
          rule: "wildcard is not promoted to risk allowlist; symbols must be narrowed before runtime",
        },
        {
          from: "normalized.kisTradingBaseUrlMode",
          to: "contract evidence only",
          rule: "virtual_trading URL does not permit provider calls or order submission",
        },
      ],
      fixtureInputs: riskGateInputs,
      requiredNonEnvInputs: [
        "risk limits",
        "market session",
        "loss and turnover counters",
        "position and exposure counters",
        "quote and fx freshness",
        "strategy review status",
        "audit logger readiness",
      ],
    },
    riskGateEvaluation,
    checks,
    readiness: {
      status:
        blockers.length === 0
          ? "contract_ready_risk_gate_env_input_mapping_fail_closed"
          : "blocked_before_risk_gate_env_input_contract",
      readyForCurrentStep: blockers.length === 0,
      readyForRuntimeRoute: false,
      readyForProviderCalls: false,
      readOnlyRuntimeIntegrationAllowed: false,
      adapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      blockers,
    },
  });
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = await buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-env-risk-gate-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-env-risk-gate-contract.cjs`);
    }
    console.log("[generate-trading-env-risk-gate-contract] ok");
    console.log(`[generate-trading-env-risk-gate-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-env-risk-gate-contract] wrote contract");
  console.log(`[generate-trading-env-risk-gate-contract] status=${parsed.readiness.status}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

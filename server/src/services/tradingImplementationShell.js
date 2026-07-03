import { evaluateKillSwitch } from "./tradingLabPolicy.js";
import { TRADING_ENV_NAMES, validateTradingEnvConfig } from "./tradingEnvConfig.js";

export const STEP117_TRADING_MODES = Object.freeze(["mock", "dry_run", "shadow"]);

export const STEP117_FAIL_CLOSED_FLAGS = Object.freeze({
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeShellMode(mode) {
  const normalized = clean(mode).toLowerCase().replace(/-/g, "_");
  return STEP117_TRADING_MODES.includes(normalized) ? normalized : "mock";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getAllowedSymbolsStatus(envReport) {
  const symbols = envReport.normalized?.allowedSymbols ?? [];
  if (symbols.length === 0) {
    return {
      status: "blocked_missing_allowed_symbols",
      count: 0,
      wildcard: false,
      symbols: [],
    };
  }

  return {
    status: envReport.normalized?.wildcardAllowedSymbols
      ? "blocked_wildcard_allowed_symbols"
      : "configured_read_only",
    count: symbols.length,
    wildcard: Boolean(envReport.normalized?.wildcardAllowedSymbols),
    symbols: symbols.slice(0, 20),
  };
}

export function createTradingAuditPlaceholder(overrides = {}) {
  return {
    eventType: "trading_step117_readiness_placeholder",
    status: "placeholder_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    containsCredential: false,
    containsAccountIdentifier: false,
    containsProviderPayload: false,
    containsOrderPayload: false,
    message: "No live trading audit event has been emitted.",
    ...overrides,
  };
}

export function createBlockedProviderAdapter(options = {}) {
  const mode = normalizeShellMode(options.mode);
  return Object.freeze({
    name: "finple_step117_blocked_provider_adapter",
    mode,
    mockOnly: true,
    dryRunOnly: mode === "dry_run",
    shadowOnly: mode === "shadow",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    async requestReadOnlySnapshot() {
      return {
        ok: false,
        status: "blocked_provider_calls_disabled",
        mode,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        networkCallAttempted: false,
        reason: "step117_shell_does_not_call_provider",
      };
    },
    async submitOrder() {
      return {
        ok: false,
        status: "blocked_order_submission_disabled",
        mode,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        networkCallAttempted: false,
        reason: "step117_shell_does_not_submit_orders",
      };
    },
  });
}

export function createPrivateWorkerShell(options = {}) {
  const mode = normalizeShellMode(options.mode);
  return Object.freeze({
    name: "finple_step117_private_worker_shell",
    mode,
    mockDryRunShadowOnly: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    runReadinessCheck(input = {}) {
      const blockedReasons = unique([
        "provider_calls_blocked_by_default",
        "order_submission_blocked_by_default",
        input.allowNetwork === true ? "network_request_not_allowed" : null,
        input.allowOrderSubmission === true ? "order_submission_not_allowed" : null,
      ]);
      return {
        ok: true,
        status: "readiness_check_only",
        mode,
        blockedReasons,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        networkCallAttempted: false,
      };
    },
  });
}

export function buildTradingReadinessSnapshot(options = {}) {
  const env = options.env ?? process.env;
  const mode = normalizeShellMode(env.FINPLE_TRADING_STEP117_MODE || env[TRADING_ENV_NAMES.mode]);
  const envReport = validateTradingEnvConfig(env);
  const killSwitch = evaluateKillSwitch({
    mode: envReport.mode,
    globalTradingDisabled: true,
    dailyLossLimitBreached: false,
    dailyOrderCountLimitBreached: false,
    symbolAllowlisted: false,
    quoteFresh: false,
    fxFresh: false,
    accountStateMatched: false,
    kisAuthOk: false,
    kisRateLimited: false,
    strategyReviewed: false,
    auditLoggerReady: false,
    manualOperatorStop: true,
  });
  const providerAdapter = createBlockedProviderAdapter({ mode });
  const privateWorker = createPrivateWorkerShell({ mode });
  const checkedAt = options.checkedAt || new Date().toISOString();

  return {
    ok: true,
    step: "Step 117: Trading implementation shell and read-only dashboard",
    status: "fail_closed_mock_dry_run_shadow_shell",
    checkedAt,
    tradingMode: mode,
    supportedModes: [...STEP117_TRADING_MODES],
    flags: { ...STEP117_FAIL_CLOSED_FLAGS },
    killSwitch: {
      status: "blocked",
      enabled: true,
      orderSubmissionAllowed: false,
      reasons: unique(["step117_forced_fail_closed", ...killSwitch.reasons]),
    },
    allowedSymbols: getAllowedSymbolsStatus(envReport),
    providerAdapter: {
      name: providerAdapter.name,
      mode: providerAdapter.mode,
      status: "blocked_not_implemented_mock_only",
      providerCallsAllowed: false,
      networkCallAttempted: false,
    },
    privateWorker: {
      name: privateWorker.name,
      mode: privateWorker.mode,
      status: "shell_only_no_execution",
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      networkCallAttempted: false,
    },
    riskGate: {
      status: "blocked_skeleton",
      readyForLiveGuardedTrading: false,
      reasons: unique(["missing_live_guarded_clearance", ...envReport.runtimeBlockers]),
    },
    environment: {
      validShape: envReport.validShape,
      mode: envReport.mode,
      blockers: unique([...envReport.shapeReasons, ...envReport.runtimeBlockers]),
      presence: envReport.presence,
      valuesStored: false,
    },
    lastAuditEvent: createTradingAuditPlaceholder({ checkedAt }),
    boundaries: {
      actualKisProviderCalls: false,
      actualOrderSubmission: false,
      providerOrderPayloadStored: false,
      credentialStored: false,
      accountIdentifierStored: false,
      dbMigrationRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

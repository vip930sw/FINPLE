import {
  createScalpingModelSignalAdapter,
  SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
} from "./tradingScalpingModelSignalAdapter.js";

export const SCALPING_MODEL_SIGNAL_RUNTIME_VERSION = "scalping-model-signal-runtime-v1";

let registeredProvider = null;
let registeredProviderMetadata = null;
let activeRuntime = null;

function clean(value) {
  return String(value ?? "").trim();
}

function bool(value) {
  return ["1", "true", "yes", "on"].includes(clean(value).toLowerCase());
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function timestampMs(value) {
  const parsed = Date.parse(clean(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function uniqueSymbols(value) {
  const rows = Array.isArray(value) ? value : clean(value).split(",");
  return [...new Set(rows.map((item) => clean(item).toUpperCase()).filter(Boolean))].sort();
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function resolveNowMs(options = {}, dependencies = {}) {
  if (finite(options.nowMs) !== null) return finite(options.nowMs);
  if (typeof dependencies.now === "function") return Number(dependencies.now());
  return Date.now();
}

function resolveProvider(dependencies = {}) {
  return dependencies.rawModelSignalProvider
    ?? dependencies.modelSignalProvider
    ?? registeredProvider;
}

function approvalFromEnvironment(env = {}, input = {}, nowMs = Date.now()) {
  const selectedSymbols = uniqueSymbols(input.selectedSymbols);
  const allowedSymbols = uniqueSymbols(
    input.allowedSymbols
      ?? env.FINPLE_TRADING_SCALPING_MODEL_ALLOWED_SYMBOLS,
  );
  const featureEnabled = input.featureEnabled === true
    || bool(env.FINPLE_TRADING_SCALPING_MODEL_SIGNAL_ENABLED);
  const modelId = clean(input.modelId ?? env.FINPLE_TRADING_SCALPING_MODEL_ID);
  const modelVersion = clean(input.modelVersion ?? env.FINPLE_TRADING_SCALPING_MODEL_VERSION);
  const modelChecksum = clean(input.modelChecksum ?? env.FINPLE_TRADING_SCALPING_MODEL_CHECKSUM);
  const signalSchemaVersion = clean(
    input.signalSchemaVersion
      ?? env.FINPLE_TRADING_SCALPING_MODEL_SIGNAL_SCHEMA_VERSION
      ?? SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
  );
  const approvalId = clean(input.approvalId ?? env.FINPLE_TRADING_SCALPING_MODEL_APPROVAL_ID);
  const approvedBy = clean(input.approvedBy ?? env.FINPLE_TRADING_SCALPING_MODEL_APPROVED_BY);
  const approvedAt = clean(input.approvedAt ?? env.FINPLE_TRADING_SCALPING_MODEL_APPROVED_AT);
  const expiresAt = clean(input.expiresAt ?? env.FINPLE_TRADING_SCALPING_MODEL_EXPIRES_AT);
  const approvedAtMs = timestampMs(approvedAt);
  const expiresAtMs = timestampMs(expiresAt);
  const provider = input.provider;
  const providerConfigured = typeof provider === "function";
  const unapprovedSymbols = selectedSymbols.filter((symbol) => !allowedSymbols.includes(symbol));

  const reasons = [
    featureEnabled ? null : "model_signal_feature_disabled",
    providerConfigured ? null : "model_signal_provider_unavailable",
    approvalId ? null : "model_signal_approval_id_missing",
    approvedBy ? null : "model_signal_approved_by_missing",
    approvedAtMs === null ? "model_signal_approved_at_invalid" : null,
    approvedAtMs !== null && approvedAtMs > nowMs ? "model_signal_approval_from_future" : null,
    expiresAtMs === null ? "model_signal_expiry_invalid" : null,
    expiresAtMs !== null && expiresAtMs <= nowMs ? "model_signal_approval_expired" : null,
    modelId ? null : "model_id_missing",
    modelVersion ? null : "model_version_missing",
    modelChecksum ? null : "model_checksum_missing",
    signalSchemaVersion === SCALPING_MODEL_SIGNAL_SCHEMA_VERSION ? null : "model_signal_schema_mismatch",
    allowedSymbols.length > 0 ? null : "model_allowed_symbols_missing",
    unapprovedSymbols.length > 0 ? "model_symbol_scope_mismatch" : null,
  ].filter(Boolean);

  return {
    ready: reasons.length === 0,
    reasons,
    featureEnabled,
    providerConfigured,
    approval: {
      approvalId: approvalId || null,
      approvedBy: approvedBy || null,
      approvedAt: approvedAtMs === null ? null : new Date(approvedAtMs).toISOString(),
      expiresAt: expiresAtMs === null ? null : new Date(expiresAtMs).toISOString(),
      expiresInMs: expiresAtMs === null ? null : expiresAtMs - nowMs,
    },
    expectedModel: {
      modelId: modelId || null,
      modelVersion: modelVersion || null,
      modelChecksum: modelChecksum || null,
      signalSchemaVersion,
    },
    selectedSymbols,
    allowedSymbols,
    unapprovedSymbols,
    policy: {
      maximumSignalLatencyMs:
        Math.max(0, finite(input.maximumSignalLatencyMs ?? env.FINPLE_TRADING_SCALPING_MODEL_MAX_LATENCY_MS) ?? 5_000),
      maximumSignalAgeMs:
        Math.max(0, finite(input.maximumSignalAgeMs ?? env.FINPLE_TRADING_SCALPING_MODEL_MAX_AGE_MS) ?? 20_000),
      maximumConsecutiveFailures:
        Math.max(1, Math.floor(finite(input.maximumConsecutiveFailures ?? env.FINPLE_TRADING_SCALPING_MODEL_MAX_FAILURES) ?? 5)),
    },
  };
}

function inactiveAdapterStatus(approval) {
  return {
    state: approval.providerConfigured ? "standby" : "unavailable",
    providerConfigured: approval.providerConfigured,
    expectedModel: approval.expectedModel,
    policy: approval.policy,
    counters: {
      requests: 0,
      accepted: 0,
      missing: 0,
      providerErrors: 0,
      invalidSignals: 0,
      staleOrLatency: 0,
      causalViolations: 0,
      symbolMismatches: 0,
      timestampMismatches: 0,
      modelIdentityMismatches: 0,
      duplicateOrOutOfOrder: 0,
      blockedByCircuitBreaker: 0,
    },
    consecutiveFailures: 0,
    lastRequestAt: null,
    lastAcceptedAt: null,
    lastSignalLatencyMs: null,
    lastFailure: null,
    trip: null,
  };
}

function publicStatus(runtime, approval) {
  const adapter = runtime?.adapter?.status?.() ?? inactiveAdapterStatus(approval);
  const providerState = adapter.state || "unavailable";
  const circuitBreakerTripped = providerState === "tripped";
  const entrySignalAvailable = Boolean(runtime?.active)
    && approval.ready
    && !circuitBreakerTripped
    && adapter.providerConfigured === true;
  const blockingReasons = [
    ...approval.reasons,
    runtime?.active ? null : "model_signal_runtime_inactive",
    circuitBreakerTripped ? "model_signal_circuit_breaker_tripped" : null,
  ].filter(Boolean);

  return {
    ok: true,
    version: SCALPING_MODEL_SIGNAL_RUNTIME_VERSION,
    active: runtime?.active === true,
    state: providerState,
    ready: approval.ready,
    entrySignalAvailable,
    acknowledgementRequired: circuitBreakerTripped,
    blockingReasons: [...new Set(blockingReasons)],
    approval: clone(approval.approval),
    expectedModel: clone(approval.expectedModel),
    selectedSymbols: [...approval.selectedSymbols],
    allowedSymbols: [...approval.allowedSymbols],
    adapter,
    perSymbol: clone(runtime?.perSymbol || {}),
    recentAlerts: clone(runtime?.recentAlerts || []),
    registration: {
      registered: typeof registeredProvider === "function",
      source: clean(registeredProviderMetadata?.source) || null,
      registeredAt: clean(registeredProviderMetadata?.registeredAt) || null,
    },
    safety: {
      adminOnly: true,
      entrySignalFailClosed: true,
      missingSignalSubstitutionAllowed: false,
      heuristicFallbackAllowed: false,
      futureLeakageAllowed: false,
      rawProviderPayloadStored: false,
      credentialsPersisted: false,
      accountCallsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      automaticLiveActivationAllowed: false,
    },
  };
}

function pushAlert(runtime, alert) {
  runtime.recentAlerts.unshift({
    code: clean(alert.code) || "model_signal_runtime_event",
    severity: clean(alert.severity) || "warning",
    symbol: clean(alert.symbol).toUpperCase() || null,
    message: clean(alert.message) || clean(alert.code) || "model signal runtime event",
    at: clean(alert.at) || new Date().toISOString(),
  });
  runtime.recentAlerts = runtime.recentAlerts.slice(0, 20);
}

export function registerScalpingModelSignalProvider(provider, metadata = {}) {
  if (typeof provider !== "function") {
    throw new TypeError("model signal provider must be a function");
  }
  registeredProvider = provider;
  registeredProviderMetadata = {
    source: clean(metadata.source) || "private_process_registration",
    registeredAt: clean(metadata.registeredAt) || new Date().toISOString(),
  };
  return {
    registered: true,
    source: registeredProviderMetadata.source,
    registeredAt: registeredProviderMetadata.registeredAt,
  };
}

export function clearScalpingModelSignalProviderRegistration() {
  registeredProvider = null;
  registeredProviderMetadata = null;
  return { registered: false };
}

export function resetScalpingModelSignalRuntimeForTest() {
  activeRuntime = null;
  clearScalpingModelSignalProviderRegistration();
}

export async function readScalpingModelSignalRuntimeStatus(options = {}, dependencies = {}) {
  if (activeRuntime) return publicStatus(activeRuntime, activeRuntime.approval);
  const env = options.env ?? dependencies.env ?? process.env;
  const nowMs = resolveNowMs(options, dependencies);
  const provider = resolveProvider(dependencies);
  const approval = approvalFromEnvironment(
    env,
    {
      ...(options.approval || {}),
      selectedSymbols: options.selectedSymbols || [],
      provider,
    },
    nowMs,
  );
  return publicStatus(null, approval);
}

export async function startScalpingModelSignalRuntime(input = {}, options = {}, dependencies = {}) {
  if (activeRuntime) {
    const error = new Error("기존 모델 신호 runtime을 먼저 정지해야 합니다.");
    error.code = "MODEL_SIGNAL_RUNTIME_ALREADY_ACTIVE";
    error.statusCode = 409;
    throw error;
  }

  const env = options.env ?? dependencies.env ?? process.env;
  const now = dependencies.now ?? Date.now;
  const nowMs = resolveNowMs(options, dependencies);
  const provider = resolveProvider(dependencies);
  const approval = approvalFromEnvironment(
    env,
    {
      ...(input.approval || {}),
      selectedSymbols: input.selectedSymbols || [],
      provider,
    },
    nowMs,
  );

  if (!approval.ready) {
    return {
      provider: null,
      status: publicStatus(null, approval),
    };
  }

  const adapter = createScalpingModelSignalAdapter(
    {
      expectedModelId: approval.expectedModel.modelId,
      expectedModelVersion: approval.expectedModel.modelVersion,
      expectedModelChecksum: approval.expectedModel.modelChecksum,
      policy: approval.policy,
    },
    { provider, now },
  );
  const runtime = {
    active: true,
    adapter,
    approval,
    perSymbol: Object.fromEntries(approval.selectedSymbols.map((symbol) => [symbol, {
      requests: 0,
      accepted: 0,
      rejected: 0,
      lastRequestAt: null,
      lastAcceptedAt: null,
      lastFailure: null,
    }])),
    recentAlerts: [],
  };

  const safeProvider = async (request = {}) => {
    const symbol = clean(request.symbol).toUpperCase();
    const row = runtime.perSymbol[symbol] || {
      requests: 0,
      accepted: 0,
      rejected: 0,
      lastRequestAt: null,
      lastAcceptedAt: null,
      lastFailure: null,
    };
    runtime.perSymbol[symbol] = row;
    row.requests += 1;
    row.lastRequestAt = new Date(now()).toISOString();
    const signal = await adapter.getSignal(request);
    const adapterStatus = adapter.status();
    if (signal) {
      row.accepted += 1;
      row.lastAcceptedAt = signal.generatedAt;
      row.lastFailure = null;
      return signal;
    }
    row.rejected += 1;
    row.lastFailure = clone(adapterStatus.lastFailure) || {
      code: adapterStatus.trip?.code || "model_signal_unavailable",
      at: row.lastRequestAt,
    };
    pushAlert(runtime, {
      code: row.lastFailure.code,
      severity: adapterStatus.state === "tripped" ? "critical" : "warning",
      symbol,
      message: (row.lastFailure.reasons || []).join(", ") || row.lastFailure.code,
      at: row.lastFailure.at,
    });
    return null;
  };

  activeRuntime = runtime;
  return {
    provider: safeProvider,
    status: publicStatus(runtime, approval),
  };
}

export async function acknowledgeScalpingModelSignalCircuitBreaker(options = {}, dependencies = {}) {
  if (!activeRuntime) {
    return readScalpingModelSignalRuntimeStatus(options, dependencies);
  }
  activeRuntime.adapter.acknowledgeAndReset();
  pushAlert(activeRuntime, {
    code: "model_signal_circuit_breaker_acknowledged",
    severity: "info",
    message: "관리자가 모델 신호 circuit breaker를 확인하고 상태를 해제했습니다.",
    at: new Date(resolveNowMs(options, dependencies)).toISOString(),
  });
  return publicStatus(activeRuntime, activeRuntime.approval);
}

export async function stopScalpingModelSignalRuntime(options = {}, dependencies = {}) {
  const previous = activeRuntime;
  activeRuntime = null;
  if (!previous) return readScalpingModelSignalRuntimeStatus(options, dependencies);
  return {
    ...publicStatus(null, previous.approval),
    stoppedAt: new Date(resolveNowMs(options, dependencies)).toISOString(),
  };
}

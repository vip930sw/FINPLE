import process from "node:process";

import {
  KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL,
  createKisOverseasRealtimeFeed,
} from "./tradingKisOverseasRealtimeAdapter.js";
import {
  assessKisShadowFeedApproval,
  createKisProviderSmokeAccessDecision,
  readKisProviderAccessDecision,
} from "./tradingKisReadOnlyApproval.js";

export const KIS_PROVIDER_SMOKE_RUNTIME_VERSION = "kis-provider-smoke-v1";
export const KIS_PROVIDER_SMOKE_MAX_RUNTIME_MS = 60_000;

let currentRun = null;

function clean(value) {
  return String(value ?? "").trim();
}

function enabled(env) {
  return ["1", "true", "yes", "on"].includes(clean(env.FINPLE_TRADING_KIS_PROVIDER_SMOKE_ENABLED).toLowerCase());
}

function safeReason(value, fallback = "provider_smoke_stopped") {
  return clean(value).replace(/[^A-Za-z0-9_:-]/g, "_").slice(0, 80) || fallback;
}

function runtimeError(code, details = [], statusCode = 409) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  error.statusCode = statusCode;
  return error;
}

function selectedSymbol(env) {
  const allowed = new Set(
    clean(env.FINPLE_TRADING_ALLOWED_SYMBOLS)
      .split(",")
      .map((symbol) => clean(symbol).toUpperCase())
      .filter(Boolean),
  );
  return Object.keys(KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL).sort().find((symbol) => allowed.has(symbol)) || null;
}

function status(run = currentRun, env = process.env) {
  return {
    ok: true,
    version: KIS_PROVIDER_SMOKE_RUNTIME_VERSION,
    state: run?.state || "IDLE",
    lifecycle: run ? [...run.lifecycle] : ["IDLE"],
    active: Boolean(run && !run.finished),
    featureEnabled: enabled(env),
    selectedSymbolCount: run ? 1 : 0,
    approvalKeyRequestCount: run?.approvalKeyRequestCount || 0,
    approvalKeyRequestSucceeded: run?.approvalKeyRequestSucceeded === true,
    websocketConnectionCount: run?.websocketConnectionCount || 0,
    websocketConnected: run?.websocketConnected === true,
    subscriptionAccepted: run?.subscriptionAccepted === true,
    messageReceived: run?.messageReceived === true,
    messageCount: run?.messageCount || 0,
    schemaAccepted: run?.schemaAccepted === true,
    validationDurationMs: run ? Math.max(0, Math.round((run.endedAtMs ?? run.now()) - run.startedAtMs)) : 0,
    cleanShutdown: run?.cleanShutdown === true,
    reason: run?.reason || null,
    safety: {
      adminOnly: true,
      marketDataOnly: true,
      processLocalStateOnly: true,
      automaticRestartAllowed: false,
      accountCallsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      liveActivationAllowed: false,
      shadowRuntimeStarted: false,
      captureRuntimeStarted: false,
      modelRuntimeStarted: false,
      connectionLeaseAcquired: false,
      credentialsExposed: false,
      credentialsPersisted: false,
      approvalKeyPersisted: false,
      rawProviderPayloadStored: false,
      databaseWritesAllowed: false,
    },
  };
}

function transition(run, state) {
  if (run.finished && state !== "STOPPED") return;
  run.state = state;
  if (run.lifecycle.at(-1) !== state) run.lifecycle.push(state);
}

function finish(run, reason) {
  if (!run || run.finished) return;
  run.finished = true;
  run.endedAtMs = run.now();
  run.reason = safeReason(reason);
  run.abortController.abort();
  run.abortController = null;
  if (run.timeout) run.clearTimeout(run.timeout);
  run.timeout = null;
  const connection = run.connection;
  run.connection = null;
  try {
    connection?.close?.();
    run.cleanShutdown = true;
  } catch {
    run.cleanShutdown = false;
    run.reason = "provider_smoke_close_failed";
  }
  transition(run, "STOPPED");
}

export function readKisProviderSmokeRuntimeStatus(options = {}) {
  return status(currentRun, options.env ?? process.env);
}

export async function startKisProviderSmokeRuntime(options = {}, dependencies = {}) {
  if (currentRun && !currentRun.finished) {
    throw runtimeError("KIS_PROVIDER_SMOKE_ALREADY_ACTIVE", ["provider_smoke_single_flight_required"]);
  }

  const env = options.env ?? dependencies.env ?? process.env;
  const now = dependencies.now ?? Date.now;
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : now();
  const appKey = dependencies.appKey ?? env.KIS_TRADING_APP_KEY;
  const appSecret = dependencies.appSecret ?? env.KIS_TRADING_APP_SECRET;
  const approval = assessKisShadowFeedApproval(
    {},
    { env, nowMs, appKey, appSecret },
  );
  const providerAccessDecision = createKisProviderSmokeAccessDecision(
    approval,
    options.adminStartAuthorization,
  );
  const access = readKisProviderAccessDecision(providerAccessDecision);
  if (!access) {
    throw runtimeError(
      "KIS_ADMIN_START_AUTHORIZATION_REQUIRED",
      ["authenticated_admin_start_required"],
      403,
    );
  }
  if (!enabled(env)) {
    throw runtimeError("KIS_PROVIDER_SMOKE_FEATURE_DISABLED", ["kis_provider_smoke_feature_flag_disabled"]);
  }
  if (!access.authorized) {
    throw runtimeError("KIS_PROVIDER_SMOKE_APPROVAL_BLOCKED", access.reasons);
  }

  const symbol = selectedSymbol(env);
  if (!symbol) {
    throw runtimeError("KIS_PROVIDER_SMOKE_SYMBOL_BLOCKED", ["allowlisted_provider_smoke_symbol_required"]);
  }

  const nativeFetch = dependencies.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  const nativeWebSocketFactory = dependencies.webSocketFactory
    ?? (typeof globalThis.WebSocket === "function" ? (url) => new globalThis.WebSocket(url) : null);
  if (typeof nativeFetch !== "function" || typeof nativeWebSocketFactory !== "function") {
    throw runtimeError("KIS_PROVIDER_SMOKE_NETWORK_CLIENT_UNAVAILABLE", ["provider_smoke_network_client_unavailable"]);
  }

  const setTimeoutImpl = dependencies.setTimeoutImpl ?? setTimeout;
  const clearTimeoutImpl = dependencies.clearTimeoutImpl ?? clearTimeout;
  const run = {
    state: "AUTHORIZED",
    lifecycle: ["AUTHORIZED"],
    finished: false,
    startedAtMs: now(),
    endedAtMs: null,
    now,
    clearTimeout: clearTimeoutImpl,
    abortController: new AbortController(),
    timeout: null,
    connection: null,
    reason: null,
    approvalKeyRequestCount: 0,
    approvalKeyRequestSucceeded: false,
    websocketConnectionCount: 0,
    websocketConnected: false,
    subscriptionAccepted: false,
    messageReceived: false,
    messageCount: 0,
    schemaAccepted: false,
    cleanShutdown: false,
  };
  currentRun = run;
  const requestedTimeoutMs = Number(dependencies.timeoutMs);
  const timeoutMs = Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0
    ? Math.min(KIS_PROVIDER_SMOKE_MAX_RUNTIME_MS, requestedTimeoutMs)
    : KIS_PROVIDER_SMOKE_MAX_RUNTIME_MS;
  run.timeout = setTimeoutImpl(
    () => finish(run, "provider_smoke_timeout"),
    timeoutMs,
  );

  const fetchOnce = async (input, init = {}) => {
    if (run.finished) throw Object.assign(new Error("provider_smoke_stopped"), { name: "AbortError" });
    if (run.approvalKeyRequestCount >= 1) throw runtimeError("KIS_PROVIDER_SMOKE_APPROVAL_KEY_LIMIT");
    run.approvalKeyRequestCount += 1;
    const response = await nativeFetch(input, { ...init, signal: run.abortController.signal });
    if (!run.finished) run.approvalKeyRequestSucceeded = response?.ok === true;
    return response;
  };
  const websocketOnce = (url) => {
    if (run.finished) throw runtimeError("KIS_PROVIDER_SMOKE_STOPPED");
    if (run.websocketConnectionCount >= 1) throw runtimeError("KIS_PROVIDER_SMOKE_WEBSOCKET_LIMIT");
    run.websocketConnectionCount += 1;
    return nativeWebSocketFactory(url);
  };

  try {
    transition(run, "CONNECTING");
    const feed = (dependencies.feedFactory ?? createKisOverseasRealtimeFeed)({
      fetchImpl: fetchOnce,
      webSocketFactory: websocketOnce,
      setTimeoutImpl,
      clearTimeoutImpl,
      now,
    });
    const connection = await feed.connect(
      {
        providerAccessDecision,
        appKey,
        appSecret,
        symbols: [symbol],
        marketBySymbol: KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL,
        maxReconnectAttempts: 0,
      },
      {
        onStatus(next) {
          if (run.finished) return;
          if (next?.state === "subscribing") run.websocketConnected = true;
          if (next?.state === "connected") transition(run, "SUBSCRIBED");
          if (next?.state === "closed") finish(run, next.reason || "provider_socket_closed");
        },
        onControl(control) {
          if (run.finished) return;
          if (clean(control?.controlStatus) === "0") run.subscriptionAccepted = true;
        },
        onEvent(event) {
          if (run.finished) return;
          run.messageReceived = true;
          run.messageCount += 1;
          run.schemaAccepted = ["trade", "quote"].includes(event?.type)
            && event?.symbol === symbol
            && event?.rawStored === false;
          if (run.schemaAccepted) {
            run.subscriptionAccepted = true;
            transition(run, "MESSAGE_VALIDATED");
            finish(run, "provider_smoke_message_validated");
          }
        },
        onProtocolIssue(issue) {
          if (run.finished) return;
          finish(run, issue?.reasons?.[0] || issue?.kind || "provider_smoke_protocol_issue");
        },
      },
    );
    run.connection = connection;
    if (run.finished) {
      run.connection = null;
      connection?.close?.();
    }
    else if (!connection?.connected) finish(run, connection?.reasons?.[0] || "provider_smoke_connection_blocked");
  } catch (error) {
    finish(run, error?.code || error?.name || "provider_smoke_failed");
  }
  return status(run, env);
}

export function stopKisProviderSmokeRuntime(reason = "admin_operator_stop") {
  if (currentRun && !currentRun.finished) finish(currentRun, reason);
  return status(currentRun);
}

export function resetKisProviderSmokeRuntimeForTest() {
  if (currentRun && !currentRun.finished) finish(currentRun, "test_reset");
  currentRun = null;
}

import {
  createKisOverseasRealtimeFeed,
  KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL,
} from "./tradingKisOverseasRealtimeAdapter.js";
import { createOneMinuteMarketAggregator } from "./tradingMinuteBarAggregator.js";
import { getUsEquityMarketSession } from "./tradingUsEquityMarketCalendar.js";

export const KIS_COMPLETED_BAR_FEED_RUNNER_VERSION = "kis-completed-bar-shadow-feed-v2";

const DEFAULT_CYCLE_LAG_MS = 15_000;
const DEFAULT_QUOTE_AGE_MS = 20_000;
const DEFAULT_FLUSH_INTERVAL_MS = 1_000;

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function uniqueSymbols(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => clean(item).toUpperCase()).filter(Boolean))].sort();
}

function runnerError(code, message, details = []) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 409;
  error.details = details;
  return error;
}

export function buildUsRegularSessionForMinute(timestampMs, options = {}) {
  const session = getUsEquityMarketSession(timestampMs, options);
  return {
    name: session.state === "REGULAR" ? "REGULAR" : "CLOSED",
    state: session.state,
    reason: session.reason,
    calendarSupported: session.calendarSupported,
    calendarVersion: session.calendarVersion,
    earlyClose: session.earlyClose === true,
    earlyCloseName: session.earlyCloseName || null,
    minutesSinceOpen: session.minutesSinceOpen,
    minutesToClose: session.minutesToClose,
    sessionDate: session.sessionDate,
  };
}

function quoteFreshForBar(bar, maximumQuoteAgeMs) {
  const quoteTime = finite(bar?.quote?.eventTimeMs);
  if (quoteTime === null) return { fresh: false, reason: "completed_bar_quote_missing" };
  const ageMs = Math.max(0, Number(bar.minuteEndMs) - quoteTime);
  return {
    fresh: ageMs <= maximumQuoteAgeMs,
    ageMs,
    reason: ageMs <= maximumQuoteAgeMs ? null : "completed_bar_quote_stale",
  };
}

async function toShadowBar(bar, modelSignalProvider, sessionResolver, calendarOverrides) {
  const session = sessionResolver(bar.minuteStartMs, { overrideByDate: calendarOverrides });
  const timestamp = new Date(bar.minuteStartMs).toISOString();
  const modelSignal = typeof modelSignalProvider === "function"
    ? await modelSignalProvider({
        symbol: bar.symbol,
        timestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        quote: bar.quote ? { ...bar.quote } : null,
        session,
      })
    : null;
  return {
    symbol: bar.symbol,
    timestamp,
    sessionDate: session.sessionDate,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
    quote: bar.quote ? {
      bid: bar.quote.bid,
      ask: bar.quote.ask,
      bidSize: bar.quote.bidSize,
      askSize: bar.quote.askSize,
    } : {},
    session: {
      name: session.name,
      state: session.state,
      minutesSinceOpen: session.minutesSinceOpen,
      minutesToClose: session.minutesToClose,
      earlyClose: session.earlyClose,
      calendarVersion: session.calendarVersion,
    },
    modelSignal: modelSignal || {},
    regime: clean(modelSignal?.regime) || "unclassified",
    source: "kis_realtime_completed_1m",
  };
}

export function createKisCompletedBarFeedRunner(options = {}, dependencies = {}) {
  const selectedSymbols = uniqueSymbols(options.selectedSymbols);
  const approval = options.approval;
  const activeShadowRun = options.activeShadowRun === true;
  const now = dependencies.now ?? Date.now;
  const setIntervalImpl = dependencies.setIntervalImpl ?? setInterval;
  const clearIntervalImpl = dependencies.clearIntervalImpl ?? clearInterval;
  const feedFactory = dependencies.feedFactory ?? createKisOverseasRealtimeFeed;
  const aggregatorFactory = dependencies.aggregatorFactory ?? createOneMinuteMarketAggregator;
  const sessionResolver = dependencies.marketSessionResolver ?? buildUsRegularSessionForMinute;
  const calendarOverrides = options.calendarOverrides || {};
  const ingestShadowCycle = dependencies.ingestShadowCycle;
  const modelSignalProvider = dependencies.modelSignalProvider;
  const maximumCycleLagMs = finite(options.maximumCycleLagMs) ?? DEFAULT_CYCLE_LAG_MS;
  const maximumQuoteAgeMs = finite(options.maximumQuoteAgeMs) ?? DEFAULT_QUOTE_AGE_MS;
  const flushIntervalMs = finite(options.flushIntervalMs) ?? DEFAULT_FLUSH_INTERVAL_MS;

  const configurationReasons = [
    approval?.ready === true ? null : "read_only_approval_not_ready",
    activeShadowRun ? null : "active_shadow_run_required",
    selectedSymbols.length > 0 ? null : "selected_symbols_required",
    selectedSymbols.length <= 8 ? null : "selected_symbol_limit_exceeded",
    typeof ingestShadowCycle === "function" ? null : "shadow_cycle_ingestor_required",
  ].filter(Boolean);
  if (configurationReasons.length > 0) {
    throw runnerError("INVALID_KIS_SHADOW_FEED_CONFIGURATION", "KIS Shadow feed 설정이 유효하지 않습니다.", configurationReasons);
  }

  const aggregator = aggregatorFactory({ allowedSymbols: selectedSymbols });
  const cycleBuffer = new Map();
  let connection = null;
  let flushTimer = null;
  let active = false;
  let processing = Promise.resolve();
  let state = "created";
  let lastError = null;
  let lastCompletedMinute = null;
  let lastProviderEventAt = null;
  let providerEventCount = 0;
  let completedBarCount = 0;
  let completedCycleCount = 0;
  let incompleteCycleCount = 0;
  let staleQuoteBarCount = 0;
  let outsideSessionBarCount = 0;
  let unsupportedCalendarBarCount = 0;
  let protocolIssueCount = 0;
  let lastIncompleteCycle = null;

  const status = () => ({
    version: KIS_COMPLETED_BAR_FEED_RUNNER_VERSION,
    active,
    state,
    selectedSymbols: [...selectedSymbols],
    providerEventCount,
    completedBarCount,
    completedCycleCount,
    incompleteCycleCount,
    staleQuoteBarCount,
    outsideSessionBarCount,
    unsupportedCalendarBarCount,
    protocolIssueCount,
    lastProviderEventAt,
    lastCompletedMinute,
    lastIncompleteCycle,
    bufferedMinuteCount: cycleBuffer.size,
    lastError,
    marketSession: sessionResolver(now(), { overrideByDate: calendarOverrides }),
    approval: {
      ready: approval.ready,
      approvalId: approval.receipt?.approvalId || null,
      expiresAt: approval.receipt?.expiresAt || null,
      providerCallsAllowed: approval.providerCallsAllowed === true,
    },
    safety: {
      providerConnectionStarted: active,
      marketDataOnly: true,
      accountCallsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      liveActivationAllowed: false,
      credentialsExposed: false,
      credentialsPersisted: false,
      rawProviderPayloadStored: false,
      forwardFillUsed: false,
    },
  });

  const addCompletedBars = (bars = []) => {
    for (const bar of bars) {
      completedBarCount += 1;
      const session = sessionResolver(bar.minuteStartMs, { overrideByDate: calendarOverrides });
      if (!session.calendarSupported) {
        unsupportedCalendarBarCount += 1;
        lastError = {
          code: "calendar_unsupported",
          at: new Date(now()).toISOString(),
        };
        continue;
      }
      if (session.name !== "REGULAR") {
        outsideSessionBarCount += 1;
        continue;
      }
      const quoteFreshness = quoteFreshForBar(bar, maximumQuoteAgeMs);
      if (!quoteFreshness.fresh) {
        staleQuoteBarCount += 1;
        continue;
      }
      const key = Number(bar.minuteStartMs);
      if (!cycleBuffer.has(key)) cycleBuffer.set(key, new Map());
      cycleBuffer.get(key).set(bar.symbol, bar);
    }
  };

  const processCompleteCycle = async (minuteStartMs, rows) => {
    const bars = [];
    for (const symbol of selectedSymbols) {
      bars.push(await toShadowBar(rows.get(symbol), modelSignalProvider, sessionResolver, calendarOverrides));
    }
    await ingestShadowCycle({ bars });
    completedCycleCount += 1;
    lastCompletedMinute = new Date(minuteStartMs).toISOString();
  };

  const drain = (nowMs = now()) => {
    const keys = [...cycleBuffer.keys()].sort((left, right) => left - right);
    for (const minuteStartMs of keys) {
      const rows = cycleBuffer.get(minuteStartMs);
      const missingSymbols = selectedSymbols.filter((symbol) => !rows.has(symbol));
      if (missingSymbols.length === 0) {
        cycleBuffer.delete(minuteStartMs);
        processing = processing
          .then(() => processCompleteCycle(minuteStartMs, rows))
          .catch((error) => {
            lastError = {
              code: clean(error?.code || error?.name) || "shadow_cycle_ingestion_failed",
              at: new Date(now()).toISOString(),
            };
          });
        continue;
      }
      const minuteEndMs = minuteStartMs + 60_000;
      if (nowMs > minuteEndMs + maximumCycleLagMs) {
        cycleBuffer.delete(minuteStartMs);
        incompleteCycleCount += 1;
        lastIncompleteCycle = {
          minute: new Date(minuteStartMs).toISOString(),
          missingSymbols,
          forwardFilled: false,
        };
      }
    }
  };

  const onProviderEvent = (event) => {
    providerEventCount += 1;
    lastProviderEventAt = new Date(now()).toISOString();
    const result = aggregator.ingest(event);
    if (!result.accepted) {
      lastError = { code: result.reasons?.[0] || "aggregator_rejected_event", at: lastProviderEventAt };
      return;
    }
    addCompletedBars(result.completedBars);
    drain(now());
  };

  return {
    async start(input = {}) {
      if (active) return status();
      state = "connecting";
      const feed = feedFactory({
        fetchImpl: dependencies.fetchImpl,
        webSocketFactory: dependencies.webSocketFactory,
        setTimeoutImpl: dependencies.setTimeoutImpl,
        clearTimeoutImpl: dependencies.clearTimeoutImpl,
        now,
      });
      connection = await feed.connect(
        {
          allowProviderCalls: true,
          appKey: input.appKey,
          appSecret: input.appSecret,
          baseUrlEnvironment: approval.baseUrlEnvironment,
          symbols: selectedSymbols,
          marketBySymbol: KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL,
          maxReconnectAttempts: input.maxReconnectAttempts,
          reconnectPolicy: input.reconnectPolicy,
        },
        {
          onEvent: onProviderEvent,
          onStatus: (next) => {
            state = clean(next?.state) || state;
          },
          onProtocolIssue: (issue) => {
            protocolIssueCount += 1;
            lastError = {
              code: issue?.reasons?.[0] || issue?.kind || "kis_protocol_issue",
              at: new Date(now()).toISOString(),
            };
          },
        },
      );
      if (!connection.connected) {
        state = "blocked";
        lastError = { code: connection.reasons?.[0] || "kis_feed_connection_blocked", at: new Date(now()).toISOString() };
        return status();
      }
      active = true;
      flushTimer = setIntervalImpl(() => {
        addCompletedBars(aggregator.flush(now()));
        drain(now());
      }, Math.max(250, flushIntervalMs));
      return status();
    },

    async stop(reason = "operator_stop") {
      active = false;
      if (flushTimer) clearIntervalImpl(flushTimer);
      flushTimer = null;
      connection?.close?.();
      connection = null;
      addCompletedBars(aggregator.flush(now()));
      drain(now() + maximumCycleLagMs + 60_000);
      await processing;
      state = "closed";
      if (reason && !lastError) {
        lastError = { code: clean(reason), at: new Date(now()).toISOString() };
      }
      return status();
    },

    async flush() {
      addCompletedBars(aggregator.flush(now()));
      drain(now());
      await processing;
      return status();
    },

    status,
  };
}

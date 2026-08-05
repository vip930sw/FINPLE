import {
  createKisOverseasRealtimeFeed,
  KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL,
} from "./tradingKisOverseasRealtimeAdapter.js";
import { createOneMinuteMarketAggregator } from "./tradingMinuteBarAggregator.js";
import { getUsEquityMarketSession } from "./tradingUsEquityMarketCalendar.js";

export const KIS_HISTORICAL_CAPTURE_RUNNER_VERSION = "kis-historical-capture-runner-v1";

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

function quoteFresh(bar, maximumQuoteAgeMs) {
  const quoteTime = finite(bar?.quote?.eventTimeMs);
  if (quoteTime === null) return false;
  return Math.max(0, Number(bar.minuteEndMs) - quoteTime) <= maximumQuoteAgeMs;
}

export function createKisHistoricalCaptureRunner(options = {}, dependencies = {}) {
  const selectedSymbols = uniqueSymbols(options.selectedSymbols);
  const approval = options.approval;
  const now = dependencies.now ?? Date.now;
  const setIntervalImpl = dependencies.setIntervalImpl ?? setInterval;
  const clearIntervalImpl = dependencies.clearIntervalImpl ?? clearInterval;
  const feedFactory = dependencies.feedFactory ?? createKisOverseasRealtimeFeed;
  const aggregatorFactory = dependencies.aggregatorFactory ?? createOneMinuteMarketAggregator;
  const sessionResolver = dependencies.marketSessionResolver ?? getUsEquityMarketSession;
  const accumulator = dependencies.accumulator;
  const maximumCycleLagMs = finite(options.maximumCycleLagMs) ?? DEFAULT_CYCLE_LAG_MS;
  const maximumQuoteAgeMs = finite(options.maximumQuoteAgeMs) ?? DEFAULT_QUOTE_AGE_MS;
  const flushIntervalMs = finite(options.flushIntervalMs) ?? DEFAULT_FLUSH_INTERVAL_MS;
  const calendarOverrides = options.calendarOverrides || {};

  const reasons = [
    approval?.ready === true ? null : "read_only_approval_not_ready",
    selectedSymbols.length > 0 ? null : "selected_symbols_required",
    selectedSymbols.length <= 8 ? null : "selected_symbol_limit_exceeded",
    typeof accumulator?.ingestCycle === "function" ? null : "capture_accumulator_required",
  ].filter(Boolean);
  if (reasons.length > 0) {
    const error = new Error("KIS historical capture runner configuration is invalid.");
    error.code = "INVALID_KIS_HISTORICAL_CAPTURE_CONFIGURATION";
    error.statusCode = 409;
    error.details = reasons;
    throw error;
  }

  const aggregator = aggregatorFactory({ allowedSymbols: selectedSymbols });
  const cycleBuffer = new Map();
  let connection = null;
  let timer = null;
  let processing = Promise.resolve();
  let active = false;
  let state = "created";
  let providerEventCount = 0;
  let completedBarCount = 0;
  let capturedCycleCount = 0;
  let incompleteCycleCount = 0;
  let staleQuoteCount = 0;
  let outsideSessionCount = 0;
  let lastProviderEventAt = null;
  let lastCapturedMinute = null;
  let lastError = null;

  const addBars = (bars = []) => {
    for (const bar of bars) {
      completedBarCount += 1;
      const session = sessionResolver(bar.minuteStartMs, { overrideByDate: calendarOverrides });
      if (!session.calendarSupported || session.state !== "REGULAR") {
        outsideSessionCount += 1;
        continue;
      }
      if (!quoteFresh(bar, maximumQuoteAgeMs)) {
        staleQuoteCount += 1;
        continue;
      }
      const key = Number(bar.minuteStartMs);
      if (!cycleBuffer.has(key)) cycleBuffer.set(key, new Map());
      cycleBuffer.get(key).set(bar.symbol, {
        ...bar,
        sessionDate: session.sessionDate,
        session: {
          name: "REGULAR",
          sessionDate: session.sessionDate,
          calendarVersion: session.calendarVersion,
          earlyClose: session.earlyClose === true,
        },
        calendarVersion: session.calendarVersion,
        source: "kis_realtime_completed_1m",
      });
    }
  };

  const processCycle = async (minuteStartMs, rows) => {
    const result = await accumulator.ingestCycle({
      bars: selectedSymbols.map((symbol) => rows.get(symbol)),
    });
    if (!result.accepted) {
      lastError = { code: result.reasons?.[0] || "capture_cycle_rejected", at: new Date(now()).toISOString() };
      return;
    }
    capturedCycleCount += 1;
    lastCapturedMinute = new Date(minuteStartMs).toISOString();
  };

  const drain = (nowMs = now()) => {
    const minutes = [...cycleBuffer.keys()].sort((a, b) => a - b);
    for (const minuteStartMs of minutes) {
      const rows = cycleBuffer.get(minuteStartMs);
      const missing = selectedSymbols.filter((symbol) => !rows.has(symbol));
      if (missing.length === 0) {
        cycleBuffer.delete(minuteStartMs);
        processing = processing.then(() => processCycle(minuteStartMs, rows)).catch((error) => {
          lastError = {
            code: clean(error?.code || error?.name) || "capture_persistence_failed",
            at: new Date(now()).toISOString(),
          };
        });
        continue;
      }
      if (nowMs > minuteStartMs + 60_000 + maximumCycleLagMs) {
        cycleBuffer.delete(minuteStartMs);
        incompleteCycleCount += 1;
        lastError = {
          code: "capture_incomplete_cycle",
          at: new Date(now()).toISOString(),
          missingSymbols: missing,
        };
      }
    }
  };

  const status = () => ({
    version: KIS_HISTORICAL_CAPTURE_RUNNER_VERSION,
    active,
    state,
    selectedSymbols: [...selectedSymbols],
    providerEventCount,
    completedBarCount,
    capturedCycleCount,
    incompleteCycleCount,
    staleQuoteCount,
    outsideSessionCount,
    bufferedMinuteCount: cycleBuffer.size,
    lastProviderEventAt,
    lastCapturedMinute,
    lastError,
    accumulator: accumulator.status(),
    marketSession: sessionResolver(now(), { overrideByDate: calendarOverrides }),
    safety: {
      captureOnly: true,
      marketDataOnly: true,
      accountCallsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      credentialsPersisted: false,
      rawProviderPayloadStored: false,
      forwardFillUsed: false,
    },
  });

  const onProviderEvent = (event) => {
    providerEventCount += 1;
    lastProviderEventAt = new Date(now()).toISOString();
    const result = aggregator.ingest(event);
    if (!result.accepted) {
      lastError = { code: result.reasons?.[0] || "capture_aggregator_rejected_event", at: lastProviderEventAt };
      return;
    }
    addBars(result.completedBars);
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
          symbols: selectedSymbols,
          marketBySymbol: KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL,
          maxReconnectAttempts: input.maxReconnectAttempts,
          reconnectPolicy: input.reconnectPolicy,
        },
        {
          onEvent: onProviderEvent,
          onStatus: (next) => { state = clean(next?.state) || state; },
          onProtocolIssue: (issue) => {
            lastError = {
              code: issue?.reasons?.[0] || issue?.kind || "kis_capture_protocol_issue",
              at: new Date(now()).toISOString(),
            };
          },
        },
      );
      if (!connection.connected) {
        state = "blocked";
        lastError = { code: connection.reasons?.[0] || "kis_capture_connection_blocked", at: new Date(now()).toISOString() };
        return status();
      }
      active = true;
      timer = setIntervalImpl(() => {
        addBars(aggregator.flush(now()));
        drain(now());
      }, Math.max(250, flushIntervalMs));
      return status();
    },

    async stop(reason = "operator_stop") {
      active = false;
      if (timer) clearIntervalImpl(timer);
      timer = null;
      connection?.close?.();
      connection = null;
      addBars(aggregator.flush(now()));
      drain(now() + maximumCycleLagMs + 60_000);
      await processing;
      state = "closed";
      if (reason && !lastError) lastError = { code: clean(reason), at: new Date(now()).toISOString() };
      return status();
    },

    async flush() {
      addBars(aggregator.flush(now()));
      drain(now());
      await processing;
      return status();
    },

    status,
  };
}

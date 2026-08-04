function clean(value) {
  return String(value ?? "").trim();
}

function toFinite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function minuteStart(timestampMs) {
  return Math.floor(timestampMs / 60_000) * 60_000;
}

function copyBar(bar) {
  return bar ? { ...bar, quote: bar.quote ? { ...bar.quote } : null } : null;
}

export function createOneMinuteMarketAggregator(options = {}) {
  const allowedSymbols = new Set((options.allowedSymbols ?? []).map((symbol) => clean(symbol).toUpperCase()).filter(Boolean));
  const state = new Map();

  const getState = (symbol) => {
    if (!state.has(symbol)) {
      state.set(symbol, {
        current: null,
        latestQuote: null,
        lastTotalVolume: null,
        lastEventTimeMs: null,
      });
    }
    return state.get(symbol);
  };

  const validateSymbol = (symbol) => allowedSymbols.size === 0 || allowedSymbols.has(symbol);

  return {
    ingest(event = {}) {
      const symbol = clean(event.symbol).toUpperCase();
      const eventTimeMs = toFinite(event.eventTimeMs ?? event.receivedAtMs);
      if (!symbol) return { accepted: false, reasons: ["missing_symbol"], completedBars: [] };
      if (!validateSymbol(symbol)) return { accepted: false, reasons: ["symbol_not_allowed"], completedBars: [] };
      if (eventTimeMs === null) return { accepted: false, reasons: ["missing_event_time"], completedBars: [] };
      const symbolState = getState(symbol);
      if (symbolState.lastEventTimeMs !== null && eventTimeMs < symbolState.lastEventTimeMs) {
        return { accepted: false, reasons: ["out_of_order_event"], completedBars: [] };
      }
      symbolState.lastEventTimeMs = eventTimeMs;

      if (event.type === "quote") {
        const bid = toFinite(event.bid);
        const ask = toFinite(event.ask);
        if (bid === null || ask === null || bid <= 0 || ask < bid) {
          return { accepted: false, reasons: ["invalid_quote"], completedBars: [] };
        }
        symbolState.latestQuote = {
          bid,
          ask,
          bidSize: toFinite(event.bidSize),
          askSize: toFinite(event.askSize),
          spreadBps: toFinite(event.spreadBps),
          eventTimeMs,
        };
        if (symbolState.current && minuteStart(eventTimeMs) === symbolState.current.minuteStartMs) {
          symbolState.current.quote = { ...symbolState.latestQuote };
        }
        return { accepted: true, reasons: [], completedBars: [], currentBar: copyBar(symbolState.current) };
      }

      if (event.type !== "trade") return { accepted: false, reasons: ["unsupported_event_type"], completedBars: [] };
      const price = toFinite(event.last);
      if (price === null || price <= 0) return { accepted: false, reasons: ["invalid_trade_price"], completedBars: [] };
      const bucket = minuteStart(eventTimeMs);
      const completedBars = [];
      if (symbolState.current && bucket > symbolState.current.minuteStartMs) {
        symbolState.current.complete = true;
        completedBars.push(copyBar(symbolState.current));
        symbolState.current = null;
      }
      if (symbolState.current && bucket < symbolState.current.minuteStartMs) {
        return { accepted: false, reasons: ["trade_bucket_regression"], completedBars: [] };
      }

      let eventVolume = toFinite(event.eventVolume);
      const totalVolume = toFinite(event.totalVolume);
      if ((eventVolume === null || eventVolume < 0) && totalVolume !== null && symbolState.lastTotalVolume !== null) {
        eventVolume = Math.max(0, totalVolume - symbolState.lastTotalVolume);
      }
      if (eventVolume === null || eventVolume < 0) eventVolume = 0;
      if (totalVolume !== null) symbolState.lastTotalVolume = totalVolume;

      if (!symbolState.current) {
        symbolState.current = {
          symbol,
          interval: "1m",
          minuteStartMs: bucket,
          minuteEndMs: bucket + 60_000,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: eventVolume,
          tradeCount: 1,
          firstEventTimeMs: eventTimeMs,
          lastEventTimeMs: eventTimeMs,
          quote: symbolState.latestQuote ? { ...symbolState.latestQuote } : null,
          complete: false,
          source: "kis_realtime_received_time",
        };
      } else {
        symbolState.current.high = Math.max(symbolState.current.high, price);
        symbolState.current.low = Math.min(symbolState.current.low, price);
        symbolState.current.close = price;
        symbolState.current.volume += eventVolume;
        symbolState.current.tradeCount += 1;
        symbolState.current.lastEventTimeMs = eventTimeMs;
        if (symbolState.latestQuote) symbolState.current.quote = { ...symbolState.latestQuote };
      }

      return {
        accepted: true,
        reasons: [],
        completedBars,
        currentBar: copyBar(symbolState.current),
      };
    },

    flush(nowMs = Date.now()) {
      const cutoff = minuteStart(nowMs);
      const completedBars = [];
      for (const symbolState of state.values()) {
        if (symbolState.current && symbolState.current.minuteStartMs < cutoff) {
          symbolState.current.complete = true;
          completedBars.push(copyBar(symbolState.current));
          symbolState.current = null;
        }
      }
      return completedBars.sort((left, right) => left.minuteStartMs - right.minuteStartMs || left.symbol.localeCompare(right.symbol));
    },

    snapshot(symbolInput) {
      const symbol = clean(symbolInput).toUpperCase();
      const symbolState = state.get(symbol);
      return symbolState ? {
        currentBar: copyBar(symbolState.current),
        latestQuote: symbolState.latestQuote ? { ...symbolState.latestQuote } : null,
        lastTotalVolume: symbolState.lastTotalVolume,
        lastEventTimeMs: symbolState.lastEventTimeMs,
      } : null;
    },
  };
}

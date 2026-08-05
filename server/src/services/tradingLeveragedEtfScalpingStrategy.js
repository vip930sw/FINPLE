export const LEVERAGED_ETF_SCALPING_STRATEGY_VERSION = "leveraged-etf-scalping-v1";

export const DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE = Object.freeze([
  "TQQQ",
  "SQQQ",
  "SOXL",
  "SOXS",
  "UPRO",
  "SPXU",
  "TNA",
  "TZA",
]);

export const DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG = Object.freeze({
  barIntervalMinutes: 1,
  minimumBars: 30,
  fastEmaPeriod: 5,
  slowEmaPeriod: 20,
  atrPeriod: 14,
  momentumLookbackBars: 5,
  volumeLookbackBars: 20,
  vwapLookbackBars: 20,
  marketOpenBufferMinutes: 5,
  marketCloseBufferMinutes: 15,
  maxSpreadBps: 8,
  minMomentumBps: 8,
  minVolumeZScore: -0.5,
  minEntryProbability: 0.6,
  maxExitProbability: 0.48,
  minExpectedNetEdgeBps: 8,
  costSafetyMultiple: 2,
  commissionRoundTripBps: 2,
  slippageRoundTripBps: 6,
  fallbackSpreadBps: 4,
  minStopBps: 25,
  stopAtrMultiple: 1.2,
  trailingAtrMultiple: 1,
  takeProfitRiskMultiple: 1.4,
  maximumHoldBars: 12,
  riskPerTradeFraction: 0.01,
  maximumPositionFraction: 0.35,
  maximumOrderNotional: null,
  requireModelSignal: true,
  allowedSymbols: DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE,
});

function clean(value) {
  return String(value ?? "").trim();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveNumber(value) {
  const number = finiteNumber(value);
  return number !== null && number > 0 ? number : null;
}

function nonNegativeNumber(value) {
  const number = finiteNumber(value);
  return number !== null && number >= 0 ? number : null;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeConfig(config = {}) {
  const merged = { ...DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG, ...config };
  const allowedSymbols = Array.isArray(merged.allowedSymbols)
    ? [...new Set(merged.allowedSymbols.map((symbol) => clean(symbol).toUpperCase()).filter(Boolean))]
    : [...DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE];

  return {
    ...merged,
    allowedSymbols,
    maximumOrderNotional:
      merged.maximumOrderNotional === null || merged.maximumOrderNotional === undefined
        ? null
        : positiveNumber(merged.maximumOrderNotional),
  };
}

function normalizeBars(bars = []) {
  if (!Array.isArray(bars)) return { valid: false, reasons: ["bars_must_be_array"], bars: [] };

  const reasons = [];
  const normalized = bars.map((bar, index) => {
    const timestamp = clean(bar?.timestamp);
    const epoch = Date.parse(timestamp);
    const open = positiveNumber(bar?.open);
    const high = positiveNumber(bar?.high);
    const low = positiveNumber(bar?.low);
    const close = positiveNumber(bar?.close);
    const volume = nonNegativeNumber(bar?.volume);

    if (!timestamp || Number.isNaN(epoch)) reasons.push(`invalid_timestamp_${index}`);
    if (open === null) reasons.push(`invalid_open_${index}`);
    if (high === null) reasons.push(`invalid_high_${index}`);
    if (low === null) reasons.push(`invalid_low_${index}`);
    if (close === null) reasons.push(`invalid_close_${index}`);
    if (volume === null) reasons.push(`invalid_volume_${index}`);
    if (high !== null && low !== null && high < low) reasons.push(`high_below_low_${index}`);
    if (high !== null && open !== null && high < open) reasons.push(`high_below_open_${index}`);
    if (high !== null && close !== null && high < close) reasons.push(`high_below_close_${index}`);
    if (low !== null && open !== null && low > open) reasons.push(`low_above_open_${index}`);
    if (low !== null && close !== null && low > close) reasons.push(`low_above_close_${index}`);

    return { timestamp, epoch, open, high, low, close, volume };
  });

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].epoch <= normalized[index - 1].epoch) {
      reasons.push(`bars_not_strictly_increasing_${index}`);
    }
  }

  return { valid: reasons.length === 0, reasons: unique(reasons), bars: normalized };
}

function ema(values, period) {
  if (values.length < period || period <= 0) return null;
  const multiplier = 2 / (period + 1);
  let value = values.slice(0, period).reduce((sum, item) => sum + item, 0) / period;
  for (const item of values.slice(period)) {
    value = item * multiplier + value * (1 - multiplier);
  }
  return value;
}

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateAtr(bars, period) {
  if (bars.length < period + 1) return null;
  const trueRanges = [];
  for (let index = 1; index < bars.length; index += 1) {
    const current = bars[index];
    const previousClose = bars[index - 1].close;
    trueRanges.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previousClose),
        Math.abs(current.low - previousClose),
      ),
    );
  }
  return average(trueRanges.slice(-period));
}

function calculateVwap(bars, lookback) {
  const selected = bars.slice(-lookback);
  let notional = 0;
  let volume = 0;
  for (const bar of selected) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    notional += typicalPrice * bar.volume;
    volume += bar.volume;
  }
  if (volume <= 0) return selected.at(-1)?.close ?? null;
  return notional / volume;
}

function calculateVolumeZScore(bars, lookback) {
  const selected = bars.slice(-(lookback + 1));
  if (selected.length < 3) return 0;
  const current = selected.at(-1).volume;
  const history = selected.slice(0, -1).map((bar) => bar.volume);
  const mean = average(history);
  const deviation = standardDeviation(history);
  if (deviation === 0) return current > mean ? 1 : 0;
  return (current - mean) / deviation;
}

function calculateRealizedVolatilityBps(bars, lookback) {
  const selected = bars.slice(-(lookback + 1));
  if (selected.length < 3) return 0;
  const returns = [];
  for (let index = 1; index < selected.length; index += 1) {
    returns.push(selected[index].close / selected[index - 1].close - 1);
  }
  return standardDeviation(returns) * 10_000;
}

function normalizeQuote(quote = {}, lastClose, fallbackSpreadBps) {
  const bid = positiveNumber(quote.bid);
  const ask = positiveNumber(quote.ask);
  if (bid !== null && ask !== null && ask >= bid) {
    const midpoint = (bid + ask) / 2;
    return {
      valid: true,
      source: "bid_ask",
      bid,
      ask,
      midpoint,
      spreadBps: ((ask - bid) / midpoint) * 10_000,
      timestamp: clean(quote.timestamp),
    };
  }

  const halfSpread = (lastClose * fallbackSpreadBps) / 20_000;
  return {
    valid: false,
    source: "fallback_close_spread",
    bid: lastClose - halfSpread,
    ask: lastClose + halfSpread,
    midpoint: lastClose,
    spreadBps: fallbackSpreadBps,
    timestamp: clean(quote.timestamp),
  };
}

function normalizeModelSignal(modelSignal = {}, indicators = {}) {
  const probabilityUp = finiteNumber(modelSignal.probabilityUp);
  const expectedReturnBps = finiteNumber(modelSignal.expectedReturnBps);
  const confidence = finiteNumber(modelSignal.confidence ?? probabilityUp);
  if (
    probabilityUp !== null &&
    probabilityUp >= 0 &&
    probabilityUp <= 1 &&
    expectedReturnBps !== null &&
    confidence !== null &&
    confidence >= 0 &&
    confidence <= 1
  ) {
    return {
      valid: true,
      source: "external_model",
      probabilityUp,
      expectedReturnBps,
      confidence,
      regime: clean(modelSignal.regime) || "unclassified",
      modelVersion: clean(modelSignal.modelVersion) || "unversioned",
    };
  }

  const rawScore =
    (indicators.emaSpreadBps ?? 0) / 10 +
    (indicators.momentumBps ?? 0) / 15 +
    (indicators.vwapDeviationBps ?? 0) / 12 +
    clamp(indicators.volumeZScore ?? 0, -2, 3) * 0.25;
  const probability = 1 / (1 + Math.exp(-rawScore / 2));
  const fallbackExpectedReturn =
    (indicators.momentumBps ?? 0) * 0.4 +
    (indicators.emaSpreadBps ?? 0) * 0.3 +
    (indicators.vwapDeviationBps ?? 0) * 0.2;

  return {
    valid: false,
    source: "deterministic_baseline",
    probabilityUp: clamp(probability, 0.01, 0.99),
    expectedReturnBps: fallbackExpectedReturn,
    confidence: Math.abs(probability - 0.5) * 2,
    regime: rawScore > 1 ? "intraday_bull" : rawScore < -1 ? "intraday_bear" : "intraday_neutral",
    modelVersion: "deterministic-baseline-v1",
  };
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildOrderIntent({ symbol, side, quantity, price, timestamp, reasons, indicators, model, config }) {
  const actionKey = `${LEVERAGED_ETF_SCALPING_STRATEGY_VERSION}|${symbol}|${timestamp}|${side}`;
  return {
    intentVersion: "trading-order-intent-v1",
    strategyVersion: LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
    symbol,
    market: "US",
    assetType: "LEVERAGED_ETF",
    side,
    quantity,
    estimatedPrice: round(price, 4),
    estimatedFxRate: 1,
    orderType: "limit",
    limitPrice: round(price, 2),
    timeInForce: "DAY",
    idempotencyKey: `les-${stableHash(actionKey)}`,
    signalTimestamp: timestamp,
    reasonCodes: reasons,
    signalSnapshot: {
      fastEma: round(indicators.fastEma, 6),
      slowEma: round(indicators.slowEma, 6),
      atr: round(indicators.atr, 6),
      vwap: round(indicators.vwap, 6),
      momentumBps: round(indicators.momentumBps, 3),
      spreadBps: round(indicators.spreadBps, 3),
      expectedNetEdgeBps: round(indicators.expectedNetEdgeBps, 3),
      probabilityUp: round(model.probabilityUp, 6),
      modelVersion: model.modelVersion,
    },
    executionPolicy: {
      maximumAttempts: 1,
      cancelIfQuoteStale: true,
      cancelIfRiskGateChanges: true,
      cancelIfLimitPriceMovesBps: config.maxSpreadBps,
      marketOrderFallbackAllowed: false,
    },
  };
}

function buildBlockedResult(symbol, reasons, overrides = {}) {
  return {
    ok: false,
    strategyVersion: LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
    symbol,
    action: "blocked",
    reasonCodes: unique(reasons),
    orderIntent: null,
    ...overrides,
  };
}

function normalizeSession(session = {}) {
  return {
    name: clean(session.name || session.currentSession).toUpperCase(),
    minutesSinceOpen: nonNegativeNumber(session.minutesSinceOpen),
    minutesToClose: nonNegativeNumber(session.minutesToClose),
  };
}

function normalizePosition(position = {}) {
  return {
    quantity: nonNegativeNumber(position.quantity) ?? 0,
    averagePrice: positiveNumber(position.averagePrice),
    highestPriceSinceEntry: positiveNumber(position.highestPriceSinceEntry),
    barsHeld: nonNegativeNumber(position.barsHeld) ?? 0,
    stopPrice: positiveNumber(position.stopPrice),
    takeProfitPrice: positiveNumber(position.takeProfitPrice),
  };
}

function calculateIndicators(bars, config, quote) {
  const closes = bars.map((bar) => bar.close);
  const last = bars.at(-1);
  const fastEma = ema(closes, config.fastEmaPeriod);
  const slowEma = ema(closes, config.slowEmaPeriod);
  const atr = calculateAtr(bars, config.atrPeriod);
  const vwap = calculateVwap(bars, config.vwapLookbackBars);
  const momentumReference = bars.at(-(config.momentumLookbackBars + 1));
  const momentumBps = momentumReference ? (last.close / momentumReference.close - 1) * 10_000 : null;
  const emaSpreadBps = fastEma !== null && slowEma !== null ? (fastEma / slowEma - 1) * 10_000 : null;
  const vwapDeviationBps = vwap !== null ? (last.close / vwap - 1) * 10_000 : null;
  const volumeZScore = calculateVolumeZScore(bars, config.volumeLookbackBars);
  const realizedVolatilityBps = calculateRealizedVolatilityBps(bars, config.slowEmaPeriod);

  return {
    lastClose: last.close,
    fastEma,
    slowEma,
    atr,
    vwap,
    momentumBps,
    emaSpreadBps,
    vwapDeviationBps,
    volumeZScore,
    realizedVolatilityBps,
    spreadBps: quote.spreadBps,
  };
}

function calculateEntryQuantity(account, price, atr, config) {
  const equity = positiveNumber(account?.equity);
  if (equity === null) return { quantity: 0, reason: "missing_account_equity" };

  const stopDistance = Math.max(price * (config.minStopBps / 10_000), atr * config.stopAtrMultiple);
  const riskBudget = equity * config.riskPerTradeFraction;
  const maxPositionNotional = equity * config.maximumPositionFraction;
  const maxOrderNotional = config.maximumOrderNotional ?? maxPositionNotional;
  const byRisk = Math.floor(riskBudget / stopDistance);
  const byPosition = Math.floor(maxPositionNotional / price);
  const byOrder = Math.floor(maxOrderNotional / price);
  const quantity = Math.max(0, Math.min(byRisk, byPosition, byOrder));

  return {
    quantity,
    reason: quantity > 0 ? null : "calculated_quantity_is_zero",
    stopDistance,
    riskBudget,
    maximumPositionNotional: maxPositionNotional,
    maximumOrderNotional: maxOrderNotional,
  };
}

export function buildLeveragedEtfScalpingDecision(input = {}) {
  const config = normalizeConfig(input.config);
  const symbol = clean(input.symbol).toUpperCase();
  const barsResult = normalizeBars(input.bars);
  const session = normalizeSession(input.session);
  const position = normalizePosition(input.position);
  const initialReasons = unique([
    symbol ? null : "missing_symbol",
    symbol && !config.allowedSymbols.includes(symbol) ? "symbol_not_in_scalping_universe" : null,
    barsResult.valid ? null : barsResult.reasons,
    barsResult.bars.length < config.minimumBars ? "insufficient_intraday_bars" : null,
    session.name === "REGULAR" ? null : "regular_session_required",
    session.minutesSinceOpen === null ? "missing_minutes_since_open" : null,
    session.minutesToClose === null ? "missing_minutes_to_close" : null,
  ].flat());

  if (initialReasons.length > 0) {
    return buildBlockedResult(symbol, initialReasons);
  }

  const lastBar = barsResult.bars.at(-1);
  const quote = normalizeQuote(input.quote, lastBar.close, config.fallbackSpreadBps);
  const indicators = calculateIndicators(barsResult.bars, config, quote);
  const indicatorReasons = unique([
    indicators.fastEma === null ? "fast_ema_unavailable" : null,
    indicators.slowEma === null ? "slow_ema_unavailable" : null,
    indicators.atr === null ? "atr_unavailable" : null,
    indicators.vwap === null ? "vwap_unavailable" : null,
    indicators.momentumBps === null ? "momentum_unavailable" : null,
  ]);
  if (indicatorReasons.length > 0) {
    return buildBlockedResult(symbol, indicatorReasons, { indicators });
  }

  const model = normalizeModelSignal(input.modelSignal, indicators);
  const roundTripCostBps =
    config.commissionRoundTripBps + config.slippageRoundTripBps + indicators.spreadBps;
  const expectedNetEdgeBps = model.expectedReturnBps - roundTripCostBps;
  const requiredGrossEdgeBps = Math.max(
    config.minExpectedNetEdgeBps + roundTripCostBps,
    roundTripCostBps * config.costSafetyMultiple,
  );
  indicators.expectedNetEdgeBps = expectedNetEdgeBps;
  indicators.roundTripCostBps = roundTripCostBps;
  indicators.requiredGrossEdgeBps = requiredGrossEdgeBps;

  const commonBlockers = unique([
    config.requireModelSignal && !model.valid ? "external_model_signal_required" : null,
    quote.spreadBps > config.maxSpreadBps ? "spread_exceeds_limit" : null,
    session.minutesSinceOpen < config.marketOpenBufferMinutes ? "market_open_buffer_active" : null,
  ]);

  if (position.quantity > 0) {
    if (position.averagePrice === null) {
      return buildBlockedResult(symbol, ["position_average_price_required"], { indicators, model });
    }

    const highestPrice = Math.max(position.highestPriceSinceEntry ?? position.averagePrice, lastBar.high);
    const baseStop = position.stopPrice ?? position.averagePrice - Math.max(
      position.averagePrice * (config.minStopBps / 10_000),
      indicators.atr * config.stopAtrMultiple,
    );
    const trailingStop = highestPrice - indicators.atr * config.trailingAtrMultiple;
    const effectiveStop = Math.max(baseStop, trailingStop);
    const takeProfit = position.takeProfitPrice ?? position.averagePrice +
      (position.averagePrice - baseStop) * config.takeProfitRiskMultiple;
    const exitReasons = unique([
      quote.bid <= effectiveStop ? "stop_or_trailing_stop_triggered" : null,
      quote.bid >= takeProfit ? "take_profit_triggered" : null,
      position.barsHeld >= config.maximumHoldBars ? "maximum_hold_bars_reached" : null,
      session.minutesToClose <= config.marketCloseBufferMinutes ? "market_close_exit_window" : null,
      indicators.fastEma <= indicators.slowEma && model.probabilityUp <= config.maxExitProbability
        ? "trend_and_model_reversal"
        : null,
    ]);

    if (exitReasons.length > 0) {
      return {
        ok: true,
        strategyVersion: LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
        symbol,
        action: "sell",
        reasonCodes: exitReasons,
        indicators,
        model,
        quote,
        positionPlan: {
          effectiveStop: round(effectiveStop, 4),
          takeProfit: round(takeProfit, 4),
          highestPriceSinceEntry: round(highestPrice, 4),
          barsHeld: position.barsHeld,
        },
        orderIntent: buildOrderIntent({
          symbol,
          side: "sell",
          quantity: position.quantity,
          price: quote.bid,
          timestamp: lastBar.timestamp,
          reasons: exitReasons,
          indicators,
          model,
          config,
        }),
      };
    }

    return {
      ok: true,
      strategyVersion: LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
      symbol,
      action: "hold",
      reasonCodes: commonBlockers,
      indicators,
      model,
      quote,
      positionPlan: {
        effectiveStop: round(effectiveStop, 4),
        takeProfit: round(takeProfit, 4),
        highestPriceSinceEntry: round(highestPrice, 4),
        barsHeld: position.barsHeld,
      },
      orderIntent: null,
    };
  }

  const entryReasons = unique([
    ...commonBlockers,
    session.minutesToClose <= config.marketCloseBufferMinutes ? "market_close_entry_block" : null,
    indicators.fastEma <= indicators.slowEma ? "fast_ema_not_above_slow_ema" : null,
    lastBar.close <= indicators.vwap ? "price_not_above_vwap" : null,
    indicators.momentumBps < config.minMomentumBps ? "momentum_below_threshold" : null,
    indicators.volumeZScore < config.minVolumeZScore ? "volume_below_threshold" : null,
    model.probabilityUp < config.minEntryProbability ? "model_probability_below_threshold" : null,
    model.expectedReturnBps < requiredGrossEdgeBps ? "gross_edge_does_not_cover_cost_buffer" : null,
  ]);

  if (entryReasons.length > 0) {
    return {
      ok: true,
      strategyVersion: LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
      symbol,
      action: "flat",
      reasonCodes: entryReasons,
      indicators,
      model,
      quote,
      positionPlan: null,
      orderIntent: null,
    };
  }

  const size = calculateEntryQuantity(input.account, quote.ask, indicators.atr, config);
  if (size.quantity <= 0) {
    return buildBlockedResult(symbol, [size.reason], { indicators, model, quote, sizing: size });
  }

  const stopPrice = quote.ask - size.stopDistance;
  const takeProfitPrice = quote.ask + size.stopDistance * config.takeProfitRiskMultiple;
  const reasons = ["trend_vwap_model_cost_gate_passed"];

  return {
    ok: true,
    strategyVersion: LEVERAGED_ETF_SCALPING_STRATEGY_VERSION,
    symbol,
    action: "buy",
    reasonCodes: reasons,
    indicators,
    model,
    quote,
    sizing: {
      quantity: size.quantity,
      riskBudget: round(size.riskBudget, 2),
      stopDistance: round(size.stopDistance, 4),
      maximumPositionNotional: round(size.maximumPositionNotional, 2),
      maximumOrderNotional: round(size.maximumOrderNotional, 2),
    },
    positionPlan: {
      entryPrice: round(quote.ask, 4),
      stopPrice: round(stopPrice, 4),
      takeProfitPrice: round(takeProfitPrice, 4),
      maximumHoldBars: config.maximumHoldBars,
    },
    orderIntent: buildOrderIntent({
      symbol,
      side: "buy",
      quantity: size.quantity,
      price: quote.ask,
      timestamp: lastBar.timestamp,
      reasons,
      indicators,
      model,
      config,
    }),
  };
}

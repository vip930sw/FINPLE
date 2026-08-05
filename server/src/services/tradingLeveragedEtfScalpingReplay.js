import { buildLeveragedEtfScalpingDecision } from "./tradingLeveragedEtfScalpingStrategy.js";

export const LEVERAGED_ETF_REPLAY_VERSION = "leveraged-etf-replay-v1";

export const DEFAULT_REPLAY_EXECUTION_CONFIG = Object.freeze({
  commissionBpsPerSide: 1,
  sellRegulatoryFeeBps: 0.03,
  baseSlippageBps: 1,
  impactBpsPerParticipation: 8,
  maximumParticipationRate: 0.05,
  fallbackSpreadBps: 4,
  minimumFillQuantity: 1,
  forceLiquidateAtEnd: true,
});

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positive(value) {
  const number = finite(value);
  return number !== null && number > 0 ? number : null;
}

function nonNegative(value) {
  const number = finite(value);
  return number !== null && number >= 0 ? number : null;
}

function round(value, digits = 8) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeExecutionConfig(config = {}) {
  const merged = { ...DEFAULT_REPLAY_EXECUTION_CONFIG, ...config };
  return {
    commissionBpsPerSide: nonNegative(merged.commissionBpsPerSide),
    sellRegulatoryFeeBps: nonNegative(merged.sellRegulatoryFeeBps),
    baseSlippageBps: nonNegative(merged.baseSlippageBps),
    impactBpsPerParticipation: nonNegative(merged.impactBpsPerParticipation),
    maximumParticipationRate: positive(merged.maximumParticipationRate),
    fallbackSpreadBps: nonNegative(merged.fallbackSpreadBps),
    minimumFillQuantity: positive(merged.minimumFillQuantity),
    forceLiquidateAtEnd: merged.forceLiquidateAtEnd !== false,
  };
}

function normalizeQuote(quote = {}, referencePrice, fallbackSpreadBps) {
  const bid = positive(quote.bid);
  const ask = positive(quote.ask);
  if (bid !== null && ask !== null && ask >= bid) {
    return { bid, ask, source: "bar_quote" };
  }
  const halfSpread = referencePrice * fallbackSpreadBps / 20_000;
  return {
    bid: referencePrice - halfSpread,
    ask: referencePrice + halfSpread,
    source: "fallback_spread",
  };
}

function normalizeBar(bar = {}, index = 0) {
  const symbol = clean(bar.symbol).toUpperCase();
  const timestamp = clean(bar.timestamp);
  const epoch = Date.parse(timestamp);
  const open = positive(bar.open);
  const high = positive(bar.high);
  const low = positive(bar.low);
  const close = positive(bar.close);
  const volume = nonNegative(bar.volume);
  const session = {
    name: clean(bar.session?.name ?? bar.sessionName ?? "REGULAR").toUpperCase(),
    minutesSinceOpen: nonNegative(bar.session?.minutesSinceOpen ?? bar.minutesSinceOpen),
    minutesToClose: nonNegative(bar.session?.minutesToClose ?? bar.minutesToClose),
  };
  const reasons = unique([
    symbol ? null : `missing_symbol_${index}`,
    timestamp && !Number.isNaN(epoch) ? null : `invalid_timestamp_${index}`,
    open === null ? `invalid_open_${index}` : null,
    high === null ? `invalid_high_${index}` : null,
    low === null ? `invalid_low_${index}` : null,
    close === null ? `invalid_close_${index}` : null,
    volume === null ? `invalid_volume_${index}` : null,
    high !== null && low !== null && high < low ? `high_below_low_${index}` : null,
    high !== null && open !== null && high < open ? `high_below_open_${index}` : null,
    high !== null && close !== null && high < close ? `high_below_close_${index}` : null,
    low !== null && open !== null && low > open ? `low_above_open_${index}` : null,
    low !== null && close !== null && low > close ? `low_above_close_${index}` : null,
    session.minutesSinceOpen === null ? `missing_minutes_since_open_${index}` : null,
    session.minutesToClose === null ? `missing_minutes_to_close_${index}` : null,
  ]);
  return {
    valid: reasons.length === 0,
    reasons,
    bar: {
      ...bar,
      symbol,
      timestamp,
      epoch,
      open,
      high,
      low,
      close,
      volume,
      session,
      sessionDate: clean(bar.sessionDate) || timestamp.slice(0, 10),
      regime: clean(bar.regime || bar.modelSignal?.regime) || "unclassified",
      quote: bar.quote ?? {},
      modelSignal: bar.modelSignal ?? {},
    },
  };
}

export function normalizeReplayBars(bars = []) {
  if (!Array.isArray(bars)) return { valid: false, reasons: ["bars_must_be_array"], bars: [] };
  const normalized = bars.map(normalizeBar);
  const reasons = normalized.flatMap((item) => item.reasons);
  const sorted = normalized.map((item) => item.bar).sort((left, right) => left.epoch - right.epoch || left.symbol.localeCompare(right.symbol));
  const identities = new Set();
  for (const bar of sorted) {
    const identity = `${bar.symbol}|${bar.timestamp}`;
    if (identities.has(identity)) reasons.push(`duplicate_symbol_timestamp_${identity}`);
    identities.add(identity);
  }
  return { valid: reasons.length === 0, reasons: unique(reasons), bars: sorted };
}

function sideReferencePrice(side, bar, config) {
  const quote = normalizeQuote(bar.quote, bar.open, config.fallbackSpreadBps);
  return side === "buy" ? quote.ask : quote.bid;
}

export function simulateMarketableLimitFill(order = {}, barInput = {}, configInput = {}) {
  const config = normalizeExecutionConfig(configInput);
  const normalized = normalizeBar(barInput);
  if (!normalized.valid) return { status: "rejected", reasons: normalized.reasons, fill: null };
  const bar = normalized.bar;
  const side = clean(order.side).toLowerCase();
  const requestedQuantity = positive(order.quantity);
  const limitPrice = positive(order.limitPrice ?? order.estimatedPrice);
  const reasons = unique([
    ["buy", "sell"].includes(side) ? null : "invalid_side",
    requestedQuantity === null ? "invalid_quantity" : null,
    limitPrice === null ? "invalid_limit_price" : null,
    config.maximumParticipationRate === null || config.maximumParticipationRate > 1 ? "invalid_maximum_participation_rate" : null,
    config.minimumFillQuantity === null ? "invalid_minimum_fill_quantity" : null,
    config.commissionBpsPerSide === null ? "invalid_commission_bps" : null,
    config.sellRegulatoryFeeBps === null ? "invalid_sell_regulatory_fee_bps" : null,
  ]);
  if (reasons.length > 0) return { status: "rejected", reasons, fill: null };

  const quote = normalizeQuote(bar.quote, bar.open, config.fallbackSpreadBps);
  const quoteCrossed = side === "buy" ? quote.ask <= limitPrice : quote.bid >= limitPrice;
  const rangeTouched = side === "buy" ? bar.low <= limitPrice : bar.high >= limitPrice;
  if (!quoteCrossed && !rangeTouched) {
    return {
      status: "missed",
      reasons: ["limit_not_reached"],
      fill: null,
      requestedQuantity,
      unfilledQuantity: requestedQuantity,
    };
  }

  const volumeCapacity = Math.floor(bar.volume * config.maximumParticipationRate);
  const fillQuantity = Math.min(requestedQuantity, volumeCapacity);
  if (fillQuantity < config.minimumFillQuantity) {
    return {
      status: "missed",
      reasons: ["insufficient_bar_liquidity"],
      fill: null,
      requestedQuantity,
      unfilledQuantity: requestedQuantity,
    };
  }

  const participation = bar.volume > 0 ? fillQuantity / bar.volume : 0;
  const slippageBps = config.baseSlippageBps + config.impactBpsPerParticipation * participation;
  const referencePrice = sideReferencePrice(side, bar, config);
  const rawFillPrice = side === "buy"
    ? referencePrice * (1 + slippageBps / 10_000)
    : referencePrice * (1 - slippageBps / 10_000);
  const fillPrice = side === "buy" ? Math.min(limitPrice, rawFillPrice) : Math.max(limitPrice, rawFillPrice);
  const notional = fillQuantity * fillPrice;
  const commission = notional * config.commissionBpsPerSide / 10_000;
  const regulatoryFee = side === "sell" ? notional * config.sellRegulatoryFeeBps / 10_000 : 0;
  const totalFees = commission + regulatoryFee;
  const unfilledQuantity = requestedQuantity - fillQuantity;

  return {
    status: unfilledQuantity > 0 ? "partial" : "filled",
    reasons: unfilledQuantity > 0 ? ["participation_capacity_partial_fill"] : [],
    requestedQuantity,
    unfilledQuantity,
    fill: {
      symbol: bar.symbol,
      side,
      quantity: fillQuantity,
      price: round(fillPrice, 6),
      notional: round(notional, 6),
      commission: round(commission, 6),
      regulatoryFee: round(regulatoryFee, 6),
      totalFees: round(totalFees, 6),
      slippageBps: round(slippageBps, 6),
      participationRate: round(participation, 8),
      timestamp: bar.timestamp,
      source: quote.source,
    },
  };
}

function emptyPosition(symbol) {
  return {
    symbol,
    quantity: 0,
    averagePrice: null,
    averageCostWithFees: null,
    highestPriceSinceEntry: null,
    barsHeld: 0,
    stopPrice: null,
    takeProfitPrice: null,
    entryTimestamp: "",
    entryRegime: "unclassified",
    entryHour: "unknown",
    entryFees: 0,
  };
}

function entryHour(timestamp) {
  const match = clean(timestamp).match(/T(\d{2}):/);
  return match ? `${match[1]}:00` : "unknown";
}

function createLedger(initialCash) {
  return {
    initialCash,
    cash: initialCash,
    positions: {},
    pendingOrders: {},
    latestPrices: {},
    orders: [],
    fills: [],
    trades: [],
    equityCurve: [],
    decisions: [],
    totalFees: 0,
    turnover: 0,
  };
}

function calculateEquity(ledger) {
  let positionsValue = 0;
  for (const [symbol, position] of Object.entries(ledger.positions)) {
    const price = ledger.latestPrices[symbol];
    if (position.quantity > 0 && positive(price) !== null) positionsValue += position.quantity * price;
  }
  return ledger.cash + positionsValue;
}

function applyFill(ledger, pending, fill, bar) {
  const symbol = fill.symbol;
  const position = ledger.positions[symbol] ?? emptyPosition(symbol);
  ledger.totalFees += fill.totalFees;
  ledger.turnover += fill.notional;
  ledger.fills.push({ ...fill, orderId: pending.orderId, signalTimestamp: pending.signalTimestamp });

  if (fill.side === "buy") {
    const totalDebit = fill.notional + fill.totalFees;
    if (ledger.cash + 1e-9 < totalDebit) return { applied: false, reason: "insufficient_cash_at_fill" };
    const previousCost = position.quantity * (position.averageCostWithFees ?? position.averagePrice ?? 0);
    const nextQuantity = position.quantity + fill.quantity;
    const nextCost = previousCost + totalDebit;
    ledger.cash -= totalDebit;
    ledger.positions[symbol] = {
      ...position,
      quantity: nextQuantity,
      averagePrice: round((position.quantity * (position.averagePrice ?? 0) + fill.notional) / nextQuantity, 6),
      averageCostWithFees: round(nextCost / nextQuantity, 6),
      highestPriceSinceEntry: Math.max(position.highestPriceSinceEntry ?? fill.price, bar.high),
      barsHeld: position.quantity > 0 ? position.barsHeld : 0,
      stopPrice: pending.positionPlan?.stopPrice ?? position.stopPrice,
      takeProfitPrice: pending.positionPlan?.takeProfitPrice ?? position.takeProfitPrice,
      entryTimestamp: position.entryTimestamp || fill.timestamp,
      entryRegime: position.entryTimestamp ? position.entryRegime : pending.regime,
      entryHour: position.entryTimestamp ? position.entryHour : entryHour(fill.timestamp),
      entryFees: position.entryFees + fill.totalFees,
    };
    return { applied: true };
  }

  if (position.quantity + 1e-9 < fill.quantity) return { applied: false, reason: "insufficient_position_at_fill" };
  const netProceeds = fill.notional - fill.totalFees;
  const quantityBefore = position.quantity;
  const costPerShare = position.averageCostWithFees ?? position.averagePrice ?? 0;
  const allocatedEntryFees = quantityBefore > 0 ? position.entryFees * (fill.quantity / quantityBefore) : 0;
  const grossPnl = (fill.price - (position.averagePrice ?? fill.price)) * fill.quantity;
  const netPnl = netProceeds - costPerShare * fill.quantity;
  ledger.cash += netProceeds;
  const remaining = quantityBefore - fill.quantity;
  if (remaining <= 1e-9) {
    delete ledger.positions[symbol];
  } else {
    ledger.positions[symbol] = {
      ...position,
      quantity: remaining,
      entryFees: Math.max(0, position.entryFees - allocatedEntryFees),
    };
  }
  ledger.trades.push({
    symbol,
    quantity: fill.quantity,
    entryTimestamp: position.entryTimestamp,
    exitTimestamp: fill.timestamp,
    entryPrice: position.averagePrice,
    exitPrice: fill.price,
    grossPnl: round(grossPnl, 6),
    netPnl: round(netPnl, 6),
    entryFees: round(allocatedEntryFees, 6),
    exitFees: fill.totalFees,
    totalFees: round(allocatedEntryFees + fill.totalFees, 6),
    barsHeld: position.barsHeld,
    regime: position.entryRegime,
    entryHour: position.entryHour,
    exitReasonCodes: pending.reasonCodes ?? [],
    forced: pending.forced === true,
  });
  return { applied: true };
}

function processPendingOrder(ledger, symbol, bar, executionConfig) {
  const pending = ledger.pendingOrders[symbol];
  if (!pending) return null;
  delete ledger.pendingOrders[symbol];
  const outcome = simulateMarketableLimitFill(pending.intent, bar, executionConfig);
  const orderRecord = ledger.orders.find((order) => order.orderId === pending.orderId);
  if (orderRecord) {
    orderRecord.status = outcome.status;
    orderRecord.fillTimestamp = outcome.fill?.timestamp ?? "";
    orderRecord.filledQuantity = outcome.fill?.quantity ?? 0;
    orderRecord.unfilledQuantity = outcome.unfilledQuantity ?? pending.intent.quantity;
    orderRecord.reasonCodes = outcome.reasons;
  }
  if (!outcome.fill) return outcome;
  const application = applyFill(ledger, pending, outcome.fill, bar);
  if (!application.applied && orderRecord) {
    orderRecord.status = "rejected_at_application";
    orderRecord.reasonCodes = [application.reason];
  }
  return { ...outcome, application };
}

function queueOrder(ledger, decision, bar) {
  const intent = decision.orderIntent;
  if (!intent) return null;
  const symbol = intent.symbol;
  const orderId = `${intent.idempotencyKey}|${ledger.orders.length + 1}`;
  const pending = {
    orderId,
    intent,
    signalTimestamp: bar.timestamp,
    positionPlan: decision.positionPlan ?? null,
    reasonCodes: decision.reasonCodes ?? [],
    regime: bar.regime,
    forced: false,
  };
  ledger.pendingOrders[symbol] = pending;
  ledger.orders.push({
    orderId,
    symbol,
    side: intent.side,
    requestedQuantity: intent.quantity,
    limitPrice: intent.limitPrice,
    signalTimestamp: bar.timestamp,
    status: "pending_next_bar",
    filledQuantity: 0,
    unfilledQuantity: intent.quantity,
    reasonCodes: [],
  });
  return pending;
}

function strategyBar(bar) {
  return {
    timestamp: bar.timestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  };
}

function positionForStrategy(position) {
  if (!position) return {};
  return {
    quantity: position.quantity,
    averagePrice: position.averagePrice,
    highestPriceSinceEntry: position.highestPriceSinceEntry,
    barsHeld: position.barsHeld,
    stopPrice: position.stopPrice,
    takeProfitPrice: position.takeProfitPrice,
  };
}

function summarizeGroup(trades) {
  const netPnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0);
  const wins = trades.filter((trade) => trade.netPnl > 0);
  const losses = trades.filter((trade) => trade.netPnl < 0);
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length > 0 ? round(wins.length / trades.length, 6) : null,
    netPnl: round(netPnl, 6),
    averageTradePnl: trades.length > 0 ? round(netPnl / trades.length, 6) : null,
  };
}

function groupTradeBreakdown(trades, key) {
  const groups = new Map();
  for (const trade of trades) {
    const value = clean(trade[key]) || "unknown";
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(trade);
  }
  return Object.fromEntries([...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([name, items]) => [name, summarizeGroup(items)]));
}

function maxDrawdown(equityCurve) {
  let peak = null;
  let worst = 0;
  for (const point of equityCurve) {
    const equity = positive(point.equity);
    if (equity === null) continue;
    peak = peak === null ? equity : Math.max(peak, equity);
    worst = Math.min(worst, equity / peak - 1);
  }
  return round(worst, 8);
}

function maxConsecutiveLosses(trades) {
  let current = 0;
  let maximum = 0;
  for (const trade of trades) {
    if (trade.netPnl < 0) {
      current += 1;
      maximum = Math.max(maximum, current);
    } else {
      current = 0;
    }
  }
  return maximum;
}

function buildMetrics(ledger, endingEquity) {
  const trades = ledger.trades;
  const positivePnl = trades.filter((trade) => trade.netPnl > 0).reduce((sum, trade) => sum + trade.netPnl, 0);
  const negativePnl = trades.filter((trade) => trade.netPnl < 0).reduce((sum, trade) => sum + trade.netPnl, 0);
  const filledOrders = ledger.orders.filter((order) => order.status === "filled" || order.status === "partial").length;
  const partialOrders = ledger.orders.filter((order) => order.status === "partial").length;
  const missedOrders = ledger.orders.filter((order) => order.status === "missed").length;
  const averageSlippage = ledger.fills.length > 0 ? ledger.fills.reduce((sum, fill) => sum + fill.slippageBps, 0) / ledger.fills.length : null;
  return {
    initialEquity: round(ledger.initialCash, 6),
    endingEquity: round(endingEquity, 6),
    netPnl: round(endingEquity - ledger.initialCash, 6),
    totalReturn: round(endingEquity / ledger.initialCash - 1, 8),
    realizedTradePnl: round(trades.reduce((sum, trade) => sum + trade.netPnl, 0), 6),
    totalFees: round(ledger.totalFees, 6),
    turnover: round(ledger.turnover, 6),
    ordersSubmitted: ledger.orders.length,
    filledOrders,
    partialOrders,
    missedOrders,
    fillRate: ledger.orders.length > 0 ? round(filledOrders / ledger.orders.length, 6) : null,
    partialFillRate: ledger.orders.length > 0 ? round(partialOrders / ledger.orders.length, 6) : null,
    averageSlippageBps: averageSlippage === null ? null : round(averageSlippage, 6),
    trades: trades.length,
    wins: trades.filter((trade) => trade.netPnl > 0).length,
    losses: trades.filter((trade) => trade.netPnl < 0).length,
    winRate: trades.length > 0 ? round(trades.filter((trade) => trade.netPnl > 0).length / trades.length, 6) : null,
    averageTradePnl: trades.length > 0 ? round(trades.reduce((sum, trade) => sum + trade.netPnl, 0) / trades.length, 6) : null,
    profitFactor: negativePnl < 0 ? round(positivePnl / Math.abs(negativePnl), 6) : positivePnl > 0 ? null : 0,
    maxDrawdown: maxDrawdown(ledger.equityCurve),
    maxConsecutiveLosses: maxConsecutiveLosses(trades),
    breakdown: {
      bySymbol: groupTradeBreakdown(trades, "symbol"),
      byRegime: groupTradeBreakdown(trades, "regime"),
      byEntryHour: groupTradeBreakdown(trades, "entryHour"),
    },
  };
}

function forceLiquidate(ledger, finalBarBySymbol, executionConfig) {
  for (const [symbol, position] of Object.entries({ ...ledger.positions })) {
    if (position.quantity <= 0) continue;
    const bar = finalBarBySymbol[symbol];
    if (!bar) continue;
    const quote = normalizeQuote(bar.quote, bar.close, executionConfig.fallbackSpreadBps);
    const intent = {
      symbol,
      side: "sell",
      quantity: position.quantity,
      estimatedPrice: quote.bid,
      limitPrice: quote.bid,
    };
    const pending = {
      orderId: `forced-${symbol}-${bar.timestamp}`,
      intent,
      signalTimestamp: bar.timestamp,
      positionPlan: null,
      reasonCodes: ["end_of_replay_forced_liquidation"],
      regime: bar.regime,
      forced: true,
    };
    ledger.orders.push({
      orderId: pending.orderId,
      symbol,
      side: "sell",
      requestedQuantity: position.quantity,
      limitPrice: quote.bid,
      signalTimestamp: bar.timestamp,
      status: "forced_pending",
      filledQuantity: 0,
      unfilledQuantity: position.quantity,
      reasonCodes: [],
    });
    const syntheticBar = {
      ...bar,
      high: Math.max(bar.high, quote.bid),
      low: Math.min(bar.low, quote.bid),
      volume: Math.max(bar.volume, Math.ceil(position.quantity / executionConfig.maximumParticipationRate)),
      quote,
    };
    const outcome = simulateMarketableLimitFill(intent, syntheticBar, executionConfig);
    const orderRecord = ledger.orders.at(-1);
    if (outcome.fill) {
      const application = applyFill(ledger, pending, outcome.fill, syntheticBar);
      orderRecord.status = application.applied ? "filled" : "rejected_at_application";
      orderRecord.filledQuantity = outcome.fill.quantity;
      orderRecord.unfilledQuantity = outcome.unfilledQuantity;
      orderRecord.reasonCodes = application.applied ? [] : [application.reason];
    } else {
      orderRecord.status = "missed";
      orderRecord.reasonCodes = outcome.reasons;
    }
  }
}

export function runLeveragedEtfScalpingReplay(input = {}, dependencies = {}) {
  const strategyEvaluator = dependencies.strategyEvaluator ?? buildLeveragedEtfScalpingDecision;
  const initialCash = positive(input.initialCash);
  const executionConfig = normalizeExecutionConfig(input.executionConfig);
  const warmup = normalizeReplayBars(input.warmupBars ?? []);
  const replay = normalizeReplayBars(input.bars ?? []);
  const configReasons = unique([
    initialCash === null ? "invalid_initial_cash" : null,
    warmup.valid ? null : warmup.reasons,
    replay.valid ? null : replay.reasons,
    replay.bars.length > 0 ? null : "empty_replay_bars",
    executionConfig.maximumParticipationRate === null || executionConfig.maximumParticipationRate > 1 ? "invalid_maximum_participation_rate" : null,
  ].flat());
  if (configReasons.length > 0) {
    return { ok: false, version: LEVERAGED_ETF_REPLAY_VERSION, reasons: configReasons, metrics: null };
  }

  const ledger = createLedger(initialCash);
  const historyBySymbol = new Map();
  const finalBarBySymbol = {};
  for (const bar of warmup.bars) {
    if (!historyBySymbol.has(bar.symbol)) historyBySymbol.set(bar.symbol, []);
    historyBySymbol.get(bar.symbol).push(strategyBar(bar));
    ledger.latestPrices[bar.symbol] = bar.close;
  }

  for (const bar of replay.bars) {
    finalBarBySymbol[bar.symbol] = bar;
    ledger.latestPrices[bar.symbol] = bar.close;
    processPendingOrder(ledger, bar.symbol, bar, executionConfig);
    if (!historyBySymbol.has(bar.symbol)) historyBySymbol.set(bar.symbol, []);
    const history = historyBySymbol.get(bar.symbol);
    history.push(strategyBar(bar));

    const position = ledger.positions[bar.symbol];
    if (position) {
      position.highestPriceSinceEntry = Math.max(position.highestPriceSinceEntry ?? bar.high, bar.high);
      position.barsHeld += 1;
    }
    const equityBeforeDecision = calculateEquity(ledger);
    const decision = strategyEvaluator({
      symbol: bar.symbol,
      bars: history,
      quote: { ...bar.quote, timestamp: bar.timestamp },
      modelSignal: bar.modelSignal,
      session: bar.session,
      position: positionForStrategy(ledger.positions[bar.symbol]),
      account: { equity: equityBeforeDecision, cash: ledger.cash },
      config: input.strategyConfig,
    });
    ledger.decisions.push({
      timestamp: bar.timestamp,
      symbol: bar.symbol,
      action: decision?.action ?? "invalid",
      reasonCodes: decision?.reasonCodes ?? [],
      orderIntentCreated: Boolean(decision?.orderIntent),
    });
    if (decision?.orderIntent) queueOrder(ledger, decision, bar);

    const equity = calculateEquity(ledger);
    ledger.equityCurve.push({ timestamp: bar.timestamp, symbol: bar.symbol, equity: round(equity, 6), cash: round(ledger.cash, 6) });
  }

  for (const pending of Object.values(ledger.pendingOrders)) {
    const orderRecord = ledger.orders.find((order) => order.orderId === pending.orderId);
    if (orderRecord) {
      orderRecord.status = "expired_end_of_replay";
      orderRecord.reasonCodes = ["no_next_bar_for_execution"];
    }
  }
  ledger.pendingOrders = {};

  if (executionConfig.forceLiquidateAtEnd) forceLiquidate(ledger, finalBarBySymbol, executionConfig);
  const endingEquity = calculateEquity(ledger);
  ledger.equityCurve.push({
    timestamp: replay.bars.at(-1).timestamp,
    symbol: "PORTFOLIO",
    equity: round(endingEquity, 6),
    cash: round(ledger.cash, 6),
    final: true,
  });

  return {
    ok: true,
    version: LEVERAGED_ETF_REPLAY_VERSION,
    reasons: [],
    config: { execution: executionConfig, strategy: input.strategyConfig ?? {} },
    metrics: buildMetrics(ledger, endingEquity),
    ledger: {
      cash: round(ledger.cash, 6),
      positions: ledger.positions,
      orders: ledger.orders,
      fills: ledger.fills,
      trades: ledger.trades,
      equityCurve: ledger.equityCurve,
      decisions: ledger.decisions,
    },
  };
}

export function runLeveragedEtfWalkForward(input = {}, dependencies = {}) {
  const normalized = normalizeReplayBars(input.bars ?? []);
  const trainSessions = Math.floor(positive(input.trainSessions) ?? 0);
  const testSessions = Math.floor(positive(input.testSessions) ?? 0);
  const stepSessions = Math.floor(positive(input.stepSessions) ?? testSessions);
  const initialCash = positive(input.initialCash);
  const reasons = unique([
    normalized.valid ? null : normalized.reasons,
    trainSessions > 0 ? null : "invalid_train_sessions",
    testSessions > 0 ? null : "invalid_test_sessions",
    stepSessions > 0 ? null : "invalid_step_sessions",
    initialCash === null ? "invalid_initial_cash" : null,
  ].flat());
  if (reasons.length > 0) return { ok: false, version: LEVERAGED_ETF_REPLAY_VERSION, reasons, windows: [] };

  const sessions = [...new Set(normalized.bars.map((bar) => bar.sessionDate))].sort();
  const windows = [];
  for (let start = 0; start + trainSessions + testSessions <= sessions.length; start += stepSessions) {
    const trainDates = sessions.slice(start, start + trainSessions);
    const testDates = sessions.slice(start + trainSessions, start + trainSessions + testSessions);
    const trainSet = new Set(trainDates);
    const testSet = new Set(testDates);
    const warmupBars = normalized.bars.filter((bar) => trainSet.has(bar.sessionDate));
    const testBars = normalized.bars.filter((bar) => testSet.has(bar.sessionDate));
    const result = runLeveragedEtfScalpingReplay({
      initialCash,
      warmupBars,
      bars: testBars,
      strategyConfig: input.strategyConfig,
      executionConfig: input.executionConfig,
    }, dependencies);
    windows.push({
      index: windows.length,
      trainStart: trainDates[0],
      trainEnd: trainDates.at(-1),
      testStart: testDates[0],
      testEnd: testDates.at(-1),
      result,
    });
  }
  if (windows.length === 0) {
    return { ok: false, version: LEVERAGED_ETF_REPLAY_VERSION, reasons: ["insufficient_sessions_for_walk_forward"], windows: [] };
  }
  const successful = windows.filter((window) => window.result.ok);
  const totalNetPnl = successful.reduce((sum, window) => sum + window.result.metrics.netPnl, 0);
  return {
    ok: successful.length === windows.length,
    version: LEVERAGED_ETF_REPLAY_VERSION,
    reasons: successful.length === windows.length ? [] : ["one_or_more_windows_failed"],
    windows,
    aggregate: {
      windows: windows.length,
      successfulWindows: successful.length,
      profitableWindows: successful.filter((window) => window.result.metrics.netPnl > 0).length,
      totalNetPnl: round(totalNetPnl, 6),
      averageWindowReturn: successful.length > 0
        ? round(successful.reduce((sum, window) => sum + window.result.metrics.totalReturn, 0) / successful.length, 8)
        : null,
      worstWindowDrawdown: successful.length > 0
        ? Math.min(...successful.map((window) => window.result.metrics.maxDrawdown))
        : null,
      totalTrades: successful.reduce((sum, window) => sum + window.result.metrics.trades, 0),
    },
  };
}

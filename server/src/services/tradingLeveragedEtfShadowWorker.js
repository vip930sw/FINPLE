import { randomUUID } from "node:crypto";

import {
  normalizeReplayBars,
  simulateMarketableLimitFill,
} from "./tradingLeveragedEtfScalpingReplay.js";
import { buildLeveragedEtfScalpingDecision } from "./tradingLeveragedEtfScalpingStrategy.js";
import { coordinateLeveragedEtfScalpingDecisions } from "./tradingLeveragedEtfPortfolioCoordinator.js";
import { assessScalpingShadowPromotion } from "./tradingScalpingPromotionPolicy.js";

export const LEVERAGED_ETF_SHADOW_WORKER_VERSION = "leveraged-etf-shadow-worker-v1";

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

function round(value, digits = 6) {
  const number = finite(value);
  if (number === null) return null;
  const factor = 10 ** digits;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function workerError(code, message, details = []) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function emptyPosition(symbol) {
  return {
    symbol,
    quantity: 0,
    averagePrice: null,
    averageCostWithFees: null,
    entryFees: 0,
    entryTimestamp: null,
    entryRegime: "unclassified",
    highestPriceSinceEntry: null,
    barsHeld: 0,
    stopPrice: null,
    takeProfitPrice: null,
  };
}

function calculateEquity(state) {
  const positionValue = Object.values(state.positions).reduce((sum, position) => {
    const price = positive(state.latestPrices[position.symbol]);
    return sum + (price === null ? 0 : position.quantity * price);
  }, 0);
  return state.cash + positionValue;
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
  return round(Math.abs(worst * 100), 4);
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

function summarizeTrades(trades) {
  const wins = trades.filter((trade) => trade.netPnl > 0);
  const losses = trades.filter((trade) => trade.netPnl < 0);
  const grossWins = wins.reduce((sum, trade) => sum + trade.netPnl, 0);
  const grossLosses = losses.reduce((sum, trade) => sum + trade.netPnl, 0);
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length > 0 ? round(wins.length / trades.length, 6) : null,
    netPnl: round(trades.reduce((sum, trade) => sum + trade.netPnl, 0), 6),
    profitFactor: grossLosses < 0 ? round(grossWins / Math.abs(grossLosses), 6) : grossWins > 0 ? null : 0,
  };
}

function breakdownBySymbol(trades) {
  const groups = {};
  for (const trade of trades) {
    if (!groups[trade.symbol]) groups[trade.symbol] = [];
    groups[trade.symbol].push(trade);
  }
  return Object.fromEntries(Object.entries(groups).map(([symbol, rows]) => [symbol, summarizeTrades(rows)]));
}

function dailyPnl(equityCurve) {
  const rows = new Map();
  for (const point of equityCurve) {
    const date = clean(point.timestamp).slice(0, 10);
    const equity = positive(point.equity);
    if (!date || equity === null) continue;
    if (!rows.has(date)) rows.set(date, { date, first: equity, last: equity });
    else rows.get(date).last = equity;
  }
  return [...rows.values()].map((row) => ({
    date: row.date,
    pnl: round(row.last - row.first, 6),
    returnPct: row.first > 0 ? round((row.last / row.first - 1) * 100, 6) : null,
  }));
}

function rollingWindows(dailyRows, windowSessions = 20, count = 3) {
  const windows = [];
  for (let end = dailyRows.length; end >= windowSessions && windows.length < count; end -= windowSessions) {
    const rows = dailyRows.slice(end - windowSessions, end);
    const first = rows[0];
    const last = rows.at(-1);
    const starting = positive(first?.pnl === undefined ? null : 1);
    void starting;
    const compounded = rows.reduce((value, row) => value * (1 + (finite(row.returnPct) ?? 0) / 100), 1);
    windows.unshift({
      startDate: first.date,
      endDate: last.date,
      sessions: rows.length,
      netReturnPct: round((compounded - 1) * 100, 6),
    });
  }
  return windows;
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

function applyVirtualFill(state, pending, fill, bar) {
  const symbol = pending.orderIntent.symbol;
  const position = state.positions[symbol] || emptyPosition(symbol);
  if (fill.side === "buy") {
    const cashRequired = fill.notional + fill.totalFees;
    if (cashRequired > state.cash + 1e-8) return { applied: false, reason: "insufficient_virtual_cash" };
    const existingCost = position.quantity * (position.averageCostWithFees ?? position.averagePrice ?? 0);
    const nextQuantity = position.quantity + fill.quantity;
    const nextCost = existingCost + cashRequired;
    state.cash -= cashRequired;
    state.positions[symbol] = {
      ...position,
      quantity: nextQuantity,
      averagePrice: round((position.quantity * (position.averagePrice ?? 0) + fill.quantity * fill.price) / nextQuantity, 6),
      averageCostWithFees: round(nextCost / nextQuantity, 6),
      entryFees: round(position.entryFees + fill.totalFees, 6),
      entryTimestamp: position.entryTimestamp || fill.timestamp,
      entryRegime: position.entryTimestamp ? position.entryRegime : clean(bar.regime) || "unclassified",
      highestPriceSinceEntry: Math.max(position.highestPriceSinceEntry ?? fill.price, fill.price),
      barsHeld: position.barsHeld,
      stopPrice: pending.decision?.positionPlan?.stopPrice ?? position.stopPrice,
      takeProfitPrice: pending.decision?.positionPlan?.takeProfitPrice ?? position.takeProfitPrice,
    };
    return { applied: true };
  }

  if (position.quantity <= 0) return { applied: false, reason: "virtual_position_missing" };
  const sellQuantity = Math.min(position.quantity, fill.quantity);
  const allocatedCost = sellQuantity * (position.averageCostWithFees ?? position.averagePrice ?? 0);
  const netProceeds = sellQuantity * fill.price - fill.totalFees;
  const netPnl = netProceeds - allocatedCost;
  state.cash += netProceeds;
  state.trades.push({
    symbol,
    entryTimestamp: position.entryTimestamp,
    exitTimestamp: fill.timestamp,
    quantity: sellQuantity,
    entryPrice: position.averagePrice,
    exitPrice: fill.price,
    netPnl: round(netPnl, 6),
    regime: position.entryRegime,
  });
  const remaining = position.quantity - sellQuantity;
  if (remaining <= 0) delete state.positions[symbol];
  else {
    state.positions[symbol] = {
      ...position,
      quantity: remaining,
      entryFees: round(position.entryFees * remaining / position.quantity, 6),
    };
  }
  return { applied: true };
}

function processPendingOrder(state, bar, executionConfig, fillSimulator) {
  const pending = state.pendingOrders[bar.symbol];
  if (!pending) return;
  const outcome = fillSimulator(pending.orderIntent, bar, executionConfig);
  const order = state.orders.find((row) => row.orderId === pending.orderId);
  if (!outcome.fill) {
    if (order) {
      order.status = outcome.status;
      order.reasonCodes = outcome.reasons || [];
    }
    delete state.pendingOrders[bar.symbol];
    return;
  }
  const applied = applyVirtualFill(state, pending, outcome.fill, bar);
  if (order) {
    order.status = applied.applied ? outcome.status : "rejected_at_application";
    order.reasonCodes = applied.applied ? outcome.reasons || [] : [applied.reason];
    order.filledQuantity = applied.applied ? outcome.fill.quantity : 0;
    order.unfilledQuantity = applied.applied ? outcome.unfilledQuantity : order.requestedQuantity;
  }
  if (applied.applied) {
    state.fills.push({ ...outcome.fill, orderId: pending.orderId, virtual: true });
    state.totalFees += outcome.fill.totalFees;
  }
  delete state.pendingOrders[bar.symbol];
}

function queueVirtualOrder(state, item, timestamp) {
  const decision = item.decision || item;
  const orderIntent = item.orderIntent || decision.orderIntent;
  if (!orderIntent?.symbol || state.pendingOrders[orderIntent.symbol]) return false;
  const orderId = `shadow-${state.runId}-${state.orders.length + 1}`;
  const pending = {
    orderId,
    decision,
    orderIntent: clone(orderIntent),
    queuedAt: timestamp,
  };
  state.pendingOrders[orderIntent.symbol] = pending;
  state.orders.push({
    orderId,
    symbol: orderIntent.symbol,
    side: orderIntent.side,
    requestedQuantity: orderIntent.quantity,
    limitPrice: orderIntent.limitPrice,
    signalTimestamp: orderIntent.signalTimestamp,
    queuedAt: timestamp,
    status: "virtual_pending_next_cycle",
    filledQuantity: 0,
    unfilledQuantity: orderIntent.quantity,
    reasonCodes: item.reasonCodes || decision.reasonCodes || [],
    virtual: true,
  });
  return true;
}

function buildMetrics(state) {
  const equity = calculateEquity(state);
  const tradeSummary = summarizeTrades(state.trades);
  const filledOrders = state.orders.filter((order) => ["filled", "partial"].includes(order.status));
  const fillRows = state.fills;
  return {
    initialEquity: round(state.initialCash, 6),
    endingEquity: round(equity, 6),
    netPnl: round(equity - state.initialCash, 6),
    totalReturnPct: round((equity / state.initialCash - 1) * 100, 6),
    maxDrawdownPct: maxDrawdown(state.equityCurve),
    profitFactor: tradeSummary.profitFactor,
    fillRatePct: state.orders.length > 0 ? round(filledOrders.length / state.orders.length * 100, 6) : null,
    averageSlippageBps: fillRows.length > 0 ? round(fillRows.reduce((sum, fill) => sum + fill.slippageBps, 0) / fillRows.length, 6) : null,
    trades: tradeSummary.trades,
    wins: tradeSummary.wins,
    losses: tradeSummary.losses,
    winRate: tradeSummary.winRate,
    maxConsecutiveLosses: maxConsecutiveLosses(state.trades),
    totalFees: round(state.totalFees, 6),
    ordersSubmitted: state.orders.length,
    pendingOrders: Object.keys(state.pendingOrders).length,
  };
}

function buildSnapshot(state, approvedVersion, promotionPolicy) {
  const metrics = buildMetrics(state);
  const dailyRows = dailyPnl(state.equityCurve);
  const windows = rollingWindows(dailyRows, promotionPolicy?.rollingWindowSessions ?? 20, promotionPolicy?.rollingWindowCount ?? 3);
  const breakdown = { bySymbol: breakdownBySymbol(state.trades) };
  const promotion = assessScalpingShadowPromotion({
    metrics,
    observationSessions: state.sessionDates.size,
    dailyPnl: dailyRows,
    rollingWindows: windows,
    breakdown,
    policy: promotionPolicy,
  });
  return {
    ok: true,
    mode: "shadow",
    version: LEVERAGED_ETF_SHADOW_WORKER_VERSION,
    runId: state.runId,
    status: state.running ? "running" : state.stopReason ? "stopped" : "created",
    strategyVersionId: approvedVersion.id,
    strategyVersionNumber: approvedVersion.versionNumber,
    strategyChecksum: approvedVersion.checksum,
    startedAt: state.startedAt,
    stoppedAt: state.stoppedAt,
    asOf: state.lastCycleTimestamp,
    observationSessions: state.sessionDates.size,
    cycleCount: state.cycleCount,
    metrics,
    promotion,
    ledger: {
      cash: round(state.cash, 6),
      positions: clone(state.positions),
      orders: clone(state.orders.slice(-200)),
      fills: clone(state.fills.slice(-200)),
      trades: clone(state.trades.slice(-200)),
      equityCurve: clone(state.equityCurve.slice(-2000)),
      dailyPnl: dailyRows,
      rollingWindows: windows,
      breakdown,
    },
    safety: {
      virtualOnly: true,
      providerCallsOwnedByWorker: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      liveActivationAllowed: false,
      rawProviderPayloadStored: false,
      accountIdentifierStored: false,
    },
  };
}

export function createLeveragedEtfShadowWorker(options = {}, dependencies = {}) {
  const approvedVersion = options.approvedVersion;
  const initialCash = positive(options.initialCash);
  const strategyEvaluator = dependencies.strategyEvaluator ?? buildLeveragedEtfScalpingDecision;
  const coordinator = dependencies.coordinator ?? coordinateLeveragedEtfScalpingDecisions;
  const fillSimulator = dependencies.fillSimulator ?? simulateMarketableLimitFill;
  const now = dependencies.now ?? (() => new Date().toISOString());
  const idFactory = dependencies.idFactory ?? randomUUID;
  const snapshotSink = dependencies.snapshotSink ?? (async () => {});
  const reasons = [
    approvedVersion?.status === "approved" ? null : "approved_strategy_version_required",
    approvedVersion?.strategy ? null : "approved_strategy_config_required",
    approvedVersion?.portfolioConstraints ? null : "approved_portfolio_constraints_required",
    approvedVersion?.id ? null : "approved_strategy_version_id_required",
    initialCash === null ? "positive_initial_cash_required" : null,
  ].filter(Boolean);
  if (reasons.length > 0) throw workerError("INVALID_SHADOW_WORKER_CONFIGURATION", "Shadow Worker 설정이 유효하지 않습니다.", reasons);

  const selectedSymbols = new Set((approvedVersion.strategy.allowedSymbols || []).map((symbol) => clean(symbol).toUpperCase()));
  const state = {
    runId: idFactory(),
    running: false,
    startedAt: null,
    stoppedAt: null,
    stopReason: null,
    lastCycleTimestamp: null,
    cycleCount: 0,
    initialCash,
    cash: initialCash,
    histories: {},
    positions: {},
    pendingOrders: {},
    latestPrices: {},
    orders: [],
    fills: [],
    trades: [],
    decisions: [],
    equityCurve: [],
    totalFees: 0,
    sessionDates: new Set(),
  };

  const snapshot = () => buildSnapshot(state, approvedVersion, options.promotionPolicy);

  return {
    start() {
      if (state.running) return snapshot();
      state.running = true;
      state.startedAt = now();
      return snapshot();
    },

    async ingestCycle(input = {}) {
      if (!state.running) throw workerError("SHADOW_WORKER_NOT_RUNNING", "Shadow Worker가 실행 중이 아닙니다.");
      const normalized = normalizeReplayBars(input.bars || []);
      if (!normalized.valid || normalized.bars.length === 0) {
        throw workerError("INVALID_SHADOW_CYCLE", "Shadow cycle 분봉이 유효하지 않습니다.", normalized.reasons);
      }
      const timestamps = [...new Set(normalized.bars.map((bar) => bar.timestamp))];
      if (timestamps.length !== 1) throw workerError("SHADOW_CYCLE_TIMESTAMP_MISMATCH", "한 cycle의 분봉 시각이 서로 다릅니다.");
      const duplicateSymbols = normalized.bars.length !== new Set(normalized.bars.map((bar) => bar.symbol)).size;
      if (duplicateSymbols) throw workerError("SHADOW_CYCLE_DUPLICATE_SYMBOL", "한 cycle에 동일 종목 분봉이 중복되었습니다.");
      const unapproved = normalized.bars.filter((bar) => !selectedSymbols.has(bar.symbol)).map((bar) => bar.symbol);
      if (unapproved.length > 0) throw workerError("SHADOW_SYMBOL_NOT_APPROVED", "승인 전략에 없는 종목입니다.", unapproved);

      const timestamp = timestamps[0];
      for (const bar of normalized.bars) processPendingOrder(state, bar, options.executionConfig || {}, fillSimulator);

      const decisions = [];
      for (const bar of normalized.bars) {
        state.latestPrices[bar.symbol] = bar.close;
        state.sessionDates.add(bar.sessionDate);
        if (!state.histories[bar.symbol]) state.histories[bar.symbol] = [];
        state.histories[bar.symbol].push({
          timestamp: bar.timestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        });
        if (state.histories[bar.symbol].length > 500) state.histories[bar.symbol].shift();
        const position = state.positions[bar.symbol];
        if (position) {
          position.highestPriceSinceEntry = Math.max(position.highestPriceSinceEntry ?? bar.high, bar.high);
          position.barsHeld += 1;
        }
        const decision = strategyEvaluator({
          symbol: bar.symbol,
          bars: state.histories[bar.symbol],
          quote: { ...bar.quote, timestamp: bar.timestamp },
          modelSignal: bar.modelSignal,
          session: bar.session,
          position: positionForStrategy(state.positions[bar.symbol]),
          account: { equity: calculateEquity(state), cash: state.cash },
          config: approvedVersion.strategy,
        });
        decisions.push(decision);
        state.decisions.push({
          timestamp,
          symbol: bar.symbol,
          action: decision.action,
          reasonCodes: decision.reasonCodes || [],
        });
      }

      const openPositions = Object.values(state.positions).map((position) => {
        const price = positive(state.latestPrices[position.symbol]) ?? position.averagePrice;
        return {
          symbol: position.symbol,
          notional: position.quantity * price,
          riskAmount: Math.abs((position.averagePrice ?? price) - (position.stopPrice ?? position.averagePrice ?? price)) * position.quantity,
        };
      });
      const coordinated = coordinator({
        decisions,
        constraints: approvedVersion.portfolioConstraints,
        account: {
          equity: calculateEquity(state),
          openPositions,
          pendingSymbols: Object.keys(state.pendingOrders),
        },
      });
      if (!coordinated.ok) throw workerError("SHADOW_COORDINATION_BLOCKED", "계좌 단위 조정기가 cycle을 차단했습니다.", coordinated.reasons);

      for (const exit of coordinated.passthroughExits) queueVirtualOrder(state, exit, timestamp);
      for (const entry of coordinated.accepted) queueVirtualOrder(state, entry, timestamp);
      state.cycleCount += 1;
      state.lastCycleTimestamp = timestamp;
      state.equityCurve.push({
        timestamp,
        equity: round(calculateEquity(state), 6),
        cash: round(state.cash, 6),
      });
      const nextSnapshot = snapshot();
      await snapshotSink(nextSnapshot);
      return nextSnapshot;
    },

    async stop(reason = "operator_stop") {
      state.running = false;
      state.stoppedAt = now();
      state.stopReason = clean(reason) || "operator_stop";
      const nextSnapshot = snapshot();
      await snapshotSink(nextSnapshot);
      return nextSnapshot;
    },

    getSnapshot() {
      return snapshot();
    },
  };
}

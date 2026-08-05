import test from "node:test";
import assert from "node:assert/strict";

import {
  buildScalpingPerformanceView,
  buildTradingScalpingAdminDashboard,
  DEFAULT_SCALPING_RESEARCH_OBJECTIVES,
  readScalpingAdminDraft,
  resetScalpingAdminDraftForTest,
  updateScalpingAdminDraft,
  validateScalpingAdminDraft,
} from "./tradingScalpingAdminDashboard.js";

function sampleReplaySnapshot() {
  return {
    mode: "replay",
    asOf: "2026-08-04T20:00:00.000Z",
    result: {
      ok: true,
      version: "leveraged-etf-scalping-replay-v1",
      metrics: {
        initialEquity: 100000,
        endingEquity: 103500,
        netPnl: 3500,
        totalReturn: 0.035,
        maxDrawdown: -0.04,
        profitFactor: 1.5,
        fillRate: 0.8,
        averageSlippageBps: 3.2,
        trades: 42,
        wins: 24,
        losses: 18,
        totalFees: 120,
        turnover: 480000,
        breakdown: {
          bySymbol: { TQQQ: { trades: 20, netPnl: 2200 } },
          byRegime: { intraday_bull: { trades: 30, netPnl: 2800 } },
          byEntryHour: { "10": { trades: 12, netPnl: 900 } },
        },
      },
      ledger: {
        equityCurve: [
          { timestamp: "2026-08-01T14:30:00.000Z", equity: 100000, cash: 100000 },
          { timestamp: "2026-08-01T20:00:00.000Z", equity: 101000, cash: 101000 },
          { timestamp: "2026-08-04T14:30:00.000Z", equity: 100500, cash: 100500 },
          { timestamp: "2026-08-04T20:00:00.000Z", equity: 103500, cash: 103500 },
        ],
        trades: [
          { symbol: "TQQQ", entryTimestamp: "2026-08-04T15:00:00.000Z", exitTimestamp: "2026-08-04T15:08:00.000Z", netPnl: 250 },
        ],
      },
    },
  };
}

test.beforeEach(() => {
  resetScalpingAdminDraftForTest();
});

test("default admin draft uses the real TSC-1 universe and research objectives", () => {
  const draft = readScalpingAdminDraft();
  assert.deepEqual(draft.strategy.allowedSymbols, ["TQQQ", "SQQQ", "SOXL", "SOXS", "UPRO", "SPXU", "TNA", "TZA"]);
  assert.equal(draft.strategy.fastEmaPeriod, 5);
  assert.equal(draft.strategy.slowEmaPeriod, 20);
  assert.deepEqual(draft.objectives, DEFAULT_SCALPING_RESEARCH_OBJECTIVES);
  assert.equal(draft.revision, 1);
});

test("rejects invalid EMA order, unsupported symbols, and excessive risk fraction", () => {
  const result = validateScalpingAdminDraft({
    strategy: {
      ...readScalpingAdminDraft().strategy,
      allowedSymbols: ["TQQQ", "AAPL"],
      fastEmaPeriod: 30,
      slowEmaPeriod: 20,
      riskPerTradeFraction: 0.25,
    },
    objectives: DEFAULT_SCALPING_RESEARCH_OBJECTIVES,
  });
  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("unsupported_symbol_AAPL"));
  assert.ok(result.reasons.includes("fast_ema_must_be_below_slow_ema"));
  assert.ok(result.reasons.includes("risk_per_trade_fraction_out_of_range"));
});

test("updates only an admin draft with revision control and no runtime activation", () => {
  const current = readScalpingAdminDraft();
  const result = updateScalpingAdminDraft({
    expectedRevision: current.revision,
    strategy: {
      ...current.strategy,
      allowedSymbols: ["TQQQ", "SOXL"],
      minEntryProbability: 0.67,
      riskPerTradeFraction: 0.008,
    },
    objectives: {
      ...current.objectives,
      targetNetReturnPct: 4,
    },
  }, { updatedAt: "2026-08-05T00:00:00.000Z", updatedBy: "test_admin" });
  assert.equal(result.ok, true);
  assert.equal(result.draft.revision, 2);
  assert.equal(result.draft.updatedBy, "test_admin");
  assert.deepEqual(result.draft.strategy.allowedSymbols, ["TQQQ", "SOXL"]);
  const dashboard = buildTradingScalpingAdminDashboard({ draft: result.draft, performanceSnapshot: null, checkedAt: "2026-08-05T00:00:00.000Z" });
  assert.equal(dashboard.controls.appliesToTradingRuntime, false);
  assert.equal(dashboard.safety.orderSubmissionAllowed, false);
  assert.equal(dashboard.controls.survivesProcessRestart, false);
});

test("rejects a stale revision without overwriting the current draft", () => {
  const current = readScalpingAdminDraft();
  const first = updateScalpingAdminDraft({
    expectedRevision: current.revision,
    strategy: current.strategy,
    objectives: current.objectives,
  });
  assert.equal(first.ok, true);
  const stale = updateScalpingAdminDraft({
    expectedRevision: current.revision,
    strategy: current.strategy,
    objectives: current.objectives,
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.statusCode, 409);
  assert.equal(stale.code, "SCALPING_DRAFT_REVISION_CONFLICT");
});

test("missing performance remains explicitly unavailable and never becomes zero", () => {
  const dashboard = buildTradingScalpingAdminDashboard({ performanceSnapshot: null, checkedAt: "2026-08-05T00:00:00.000Z" });
  assert.equal(dashboard.performance.status, "unavailable_no_persisted_replay_or_shadow_snapshot");
  assert.equal(dashboard.performance.metrics.netPnl, null);
  assert.equal(dashboard.performance.metrics.totalReturnPct, null);
  assert.deepEqual(dashboard.performance.charts.equityCurve, []);
  assert.ok(dashboard.performance.objectiveComparisons.every((item) => item.status === "unavailable"));
});

test("maps a replay snapshot into KPI, objective, chart, breakdown, and trade views", () => {
  const view = buildScalpingPerformanceView(sampleReplaySnapshot(), DEFAULT_SCALPING_RESEARCH_OBJECTIVES);
  assert.equal(view.status, "ready_replay_snapshot");
  assert.equal(view.metrics.totalReturnPct, 3.5);
  assert.equal(view.metrics.maxDrawdownPct, 4);
  assert.equal(view.metrics.fillRatePct, 80);
  assert.equal(view.objectiveComparisons.find((item) => item.label === "순수익률").status, "met");
  assert.equal(view.objectiveComparisons.find((item) => item.label === "최대 낙폭").status, "met");
  assert.equal(view.charts.equityCurve.length, 4);
  assert.equal(view.charts.drawdownCurve.length, 4);
  assert.equal(view.charts.dailyPnl.length, 2);
  assert.equal(view.latestTrades.length, 1);
  assert.equal(view.breakdown.bySymbol.TQQQ.trades, 20);
});

test("labels target return as a research acceptance threshold rather than a guarantee", () => {
  const dashboard = buildTradingScalpingAdminDashboard({ performanceSnapshot: null });
  assert.equal(dashboard.controls.objectiveMeaning, "research_acceptance_threshold_not_return_guarantee");
  assert.equal(dashboard.safety.liveActivationAllowed, false);
  assert.equal(dashboard.safety.providerCallsAllowed, false);
});

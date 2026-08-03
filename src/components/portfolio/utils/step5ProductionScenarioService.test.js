import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { createManualCashAsset } from "../../../data/tickers/manualCashAsset.js";
import {
  buildStep5ProductionScenarioState,
  getStep5MonthlyArtifactIdentities,
  getStep5MonthlyArtifactIdentityFingerprint,
} from "./step5ProductionScenarioService.js";

function month(index) {
  const date = new Date(Date.UTC(2024, index, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function rows(market, ticker, count = 60) {
  return Array.from({ length: count }, (_, index) => ({
    month: month(index),
    market,
    ticker,
    priceReturn: index === count - 1 ? -0.08 : index % 2 ? -0.01 : 0.02,
    currency: market === "KR" ? "KRW" : "USD",
    dataStatus: "ready",
    isProxy: false,
    proxyTicker: "",
    proxyLineageStatus: "verified_non_proxy",
  }));
}

function proxyAwareRows(market, ticker, count) {
  return rows(market, ticker, count).map((row) => ({
    ...row,
    dataStatus: "ready",
    isProxy: false,
    proxyTicker: "",
    proxyLineageStatus: "verified_non_proxy",
  }));
}

function blockedLegacyMonthlyReturns(identity, count) {
  const [market, ticker] = identity.split(":");
  return {
    release: { releaseId: "pinned-production" },
    monthlyRowContract: "legacy_v1",
    legacyProductionBindingVerified: true,
    catalogPolicyByIdentity: Object.freeze({
      [identity]: Object.freeze({
        identity,
        policyEvidenceValid: true,
        ordinaryDistribution: true,
        ordinaryLegacyEligible: true,
        dataStatus: "review_required",
        metricsStatus: "ready",
        reviewFlag: "review_required",
        reviewApprovalStatus: "none",
      }),
    }),
    rowsByIdentity: {
      [identity]: rows(market, ticker, count).map((row) => ({
        ...row,
        dataStatus: "ready",
        isProxy: null,
        proxyTicker: null,
        proxyLineageStatus: "legacy_unproven",
      })),
    },
  };
}

function assets() {
  return [
    { market: "KR", ticker: "005930", targetWeight: 60, beta: 1.1 },
    { market: "KR", ticker: "069500", targetWeight: 40, beta: 0.8 },
  ];
}

function state(overrides = {}) {
  const currentAssets = overrides.assets || assets();
  return buildStep5ProductionScenarioState({
    activePortfolio: { id: "step5a-production", name: "Step 5A" },
    assets: currentAssets,
    settings: {
      startValue: 10_000_000,
      monthlyCashFlow: 500_000,
      years: 1,
      inflationRate: 2.5,
      ...overrides.settings,
    },
    monthlyReturns: overrides.monthlyReturns || {
      rowsByIdentity: {
        "KR:005930": rows("KR", "005930"),
        "KR:069500": rows("KR", "069500"),
      },
    },
    monthlyArtifactIdentityFingerprint:
      overrides.monthlyArtifactIdentityFingerprint ??
      getStep5MonthlyArtifactIdentityFingerprint(currentAssets),
  });
}

test("moderate and severe Production presets are deterministic market-beta scenarios", () => {
  const first = state();
  const second = state();
  assert.equal(first.status, "ready");
  assert.deepEqual(first, second);
  assert.deepEqual(first.results.map((result) => result.scenarioId), [
    "market_drawdown_moderate",
    "market_drawdown_severe",
  ]);
  for (const [result, factor] of first.results.map((result, index) => [result, [-0.2, -0.35][index]])) {
    assert.equal(result.status, "ready");
    assert.equal(result.probabilityApplied, false);
    assert.equal(result.shockEvents[0].monthIndex, 12);
    assert.equal(result.shockEvents[0].marketFactorShock, factor);
    assert.equal(
      result.shockEvents[0].assetShockReturns["KR:005930"],
      Number((1.1 * factor).toFixed(10)),
    );
    const shocked = result.trace.find((point) => point.monthIndex === 12);
    assert.equal(
      shocked.stressedReturns["KR:005930"],
      Number(((1 - 0.08) * (1 + 1.1 * factor) - 1).toFixed(10)),
    );
  }
  assert.deepEqual(first.result.assets.map((asset) => asset.ticker), ["005930", "069500"]);
  assert.deepEqual(first.result.sourceHashes, []);
  assert.equal(first.result.pipelineVersion, null);
});

test("a computed return at or below -100% blocks only the affected preset without clamping", () => {
  const result = state({
    assets: [
      { market: "KR", ticker: "005930", targetWeight: 60, beta: 4 },
      { market: "KR", ticker: "069500", targetWeight: 40, beta: 0.8 },
    ],
  });
  assert.equal(result.status, "ready");
  assert.equal(result.results[0].status, "ready");
  assert.equal(result.results[0].shockEvents[0].assetShockReturns["KR:005930"], -0.8);
  assert.equal(result.results[1].status, "blocked");
  assert.match(result.results[1].dataQuality.blockReasons.join("|"), /less_than_or_equal_minus_100/);
});

test("missing or non-finite Beta blocks the numeric contract", () => {
  for (const beta of [null, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = state({
      assets: [
        { market: "KR", ticker: "005930", targetWeight: 60, beta },
        { market: "KR", ticker: "069500", targetWeight: 40, beta: 0.8 },
      ],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.error, /market_beta_coverage_invalid|must_be_finite_number/);
  }
});

test("missing or malformed required monthly numbers never become zero", () => {
  const missing = state({
    monthlyReturns: {
      rowsByIdentity: {
        "KR:005930": rows("KR", "005930"),
        "KR:069500": rows("KR", "069500", 11),
      },
    },
  });
  assert.equal(missing.status, "insufficient_data");
  assert.ok(missing.results.every((result) => result.baselinePath.length === 0));

  const malformedRows = rows("KR", "005930");
  malformedRows.at(-1).priceReturn = Number.NaN;
  const malformed = state({
    monthlyReturns: {
      rowsByIdentity: {
        "KR:005930": malformedRows,
        "KR:069500": rows("KR", "069500"),
      },
    },
  });
  assert.equal(malformed.status, "blocked");
  assert.match(malformed.error, /must_be_finite_number/);
});

test("identity, duplicate, weight, and required setting gates fail closed", () => {
  assert.equal(state({ monthlyArtifactIdentityFingerprint: "[]" }).status, "stale");

  const duplicate = state({
    assets: [
      { market: "KR", ticker: "005930", targetWeight: 60, beta: 1 },
      { market: "KR", ticker: "005930", targetWeight: 40, beta: 1 },
    ],
    monthlyReturns: { rowsByIdentity: { "KR:005930": rows("KR", "005930") } },
  });
  assert.equal(duplicate.status, "blocked");
  assert.match(duplicate.error, /duplicate_asset/);

  const badWeight = state({
    assets: [
      { market: "KR", ticker: "005930", targetWeight: 50, beta: 1 },
      { market: "KR", ticker: "069500", targetWeight: 40, beta: 1 },
    ],
  });
  assert.equal(badWeight.status, "blocked");
  assert.match(badWeight.error, /asset_weight_sum_invalid/);

  for (const settings of [
    { startValue: "" },
    { monthlyCashFlow: "" },
    { years: "" },
    { inflationRate: "" },
  ]) {
    assert.equal(state({ settings }).status, "blocked");
  }
});

test("manual CASH needs no monthly identity and contributions do not enter MDD", () => {
  const mixedAssets = [
    { market: "KR", ticker: "005930", targetWeight: 90, beta: 1.1 },
    createManualCashAsset({ targetWeight: 10 }),
  ];
  assert.deepEqual(getStep5MonthlyArtifactIdentities(mixedAssets), ["KR:005930"]);
  const common = {
    assets: mixedAssets,
    monthlyReturns: { rowsByIdentity: { "KR:005930": rows("KR", "005930") } },
  };
  const withContribution = state(common);
  const withoutContribution = state({ ...common, settings: { monthlyCashFlow: 0 } });
  assert.equal(withContribution.status, "ready");
  assert.deepEqual(withContribution.result.assets.map((asset) => asset.ticker), ["CASH", "005930"]);
  assert.equal(withContribution.result.stressedMdd, withoutContribution.result.stressedMdd);
  assert.notEqual(withContribution.result.stressedTerminalValue, withoutContribution.result.stressedTerminalValue);
});

test("the hook owns one shared probability/shock loader and exposes separate Step 5 state", () => {
  const source = fs.readFileSync("src/components/portfolio/hooks/usePortfolioSimulator.js", "utf8");
  assert.match(source, /activeSimulatorTab === "probability"[\s\S]*activeSimulatorTab === "shock"/);
  assert.match(source, /buildScenario: \(monthlyReturns\) => monthlyReturns/);
  assert.match(source, /buildAppExportScenarioResult/);
  assert.match(source, /buildStep5ProductionScenarioState/);
  for (const field of [
    "step5ScenarioResult",
    "step5ScenarioResults",
    "step5ScenarioStatus",
    "step5ScenarioError",
  ]) assert.match(source, new RegExp(field));
});

test("Step 5 characterization: policy-allowed history at the horizon is ready without replay", () => {
  const result = state({
    assets: [{ market: "US", ticker: "QQQ", targetWeight: 100, beta: 1 }],
    settings: { years: 10 },
    monthlyReturns: {
      rowsByIdentity: { "US:QQQ": proxyAwareRows("US", "QQQ", 120) },
    },
  });
  assert.equal(result.status, "ready");
  assert.equal(result.result.sourceHistoryMonths, 120);
  assert.equal(result.result.pathMonths, 120);
  assert.equal(result.result.pathReplayApplied, false);
});

test("Step 5 characterization: policy-allowed history from 60 months replays deterministically to the horizon", () => {
  const input = {
    assets: [{ market: "US", ticker: "QQQ", targetWeight: 100, beta: 1 }],
    settings: { years: 10 },
    monthlyReturns: {
      rowsByIdentity: { "US:QQQ": proxyAwareRows("US", "QQQ", 84) },
    },
  };
  const first = state(input);
  const second = state(input);
  assert.equal(first.status, "ready");
  assert.deepEqual(first, second);
  assert.equal(first.result.sourceHistoryMonths, 84);
  assert.equal(first.result.pathMonths, 120);
  assert.equal(first.result.pathReplayApplied, true);
  assert.equal(first.result.rowSourceLineage[0].sourceMonth, month(0));
  assert.equal(first.result.rowSourceLineage[84].sourceMonth, month(0));
  assert.equal(new Set(first.result.rowSourceLineage.map((row) => row.month)).size, 120);
});

test("Step 5 characterization: pinned lineage policy blocks VNQ, BLOK, and KR:069500 before history adaptation", () => {
  for (const [identity, count] of [["US:VNQ", 120], ["US:BLOK", 84], ["KR:069500", 59]]) {
    const [market, ticker] = identity.split(":");
    const result = state({
      assets: [{ market, ticker, targetWeight: 100, beta: 1 }],
      settings: { years: 10 },
      monthlyReturns: blockedLegacyMonthlyReturns(identity, count),
    });
    assert.equal(result.status, "blocked");
    assert.match(result.error, new RegExp(`missing_metric_lineage:monthly_return_proxy_status:${identity}`));
    assert.doesNotMatch(result.error, /insufficient_data/);
    assert.deepEqual(result.results, []);
  }
});

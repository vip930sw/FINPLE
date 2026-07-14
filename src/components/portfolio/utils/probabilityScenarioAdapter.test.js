import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  STEP114_2G_PROBABILITY_FIXTURE_RESULT,
  STEP114_2G_FIXTURE_REVIEW_ASSETS,
} from "../fixtures/probabilityScenarioResultFixture.js";
import {
  PROBABILITY_UI_VERSION,
  buildProbabilityScenarioViewModel,
  isProbabilityViewModelReady,
} from "./probabilityScenarioAdapter.js";

function readyView(overrides = {}) {
  return buildProbabilityScenarioViewModel({
    result: {
      ...STEP114_2G_PROBABILITY_FIXTURE_RESULT,
      ...overrides.result,
    },
    activePortfolio: { id: "fixture-portfolio", name: "Fixture Portfolio" },
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: {
      startValue: 12000000,
      monthlyCashFlow: 500000,
      years: 5,
      dividendReinvest: false,
    },
    baselineResult: {
      monthlyBaselinePoints: [
        { monthIndex: 0, portfolioValueNominal: 12000000, periodLabel: "0개월" },
        { monthIndex: 60, portfolioValueNominal: 25000000, periodLabel: "5년" },
      ],
    },
    expectedInputHash: Object.prototype.hasOwnProperty.call(overrides, "expectedInputHash")
      ? overrides.expectedInputHash
      : STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  });
}

test("ready result exposes P10 P25 P50 P75 P90 semantics for one portfolio", () => {
  const viewModel = readyView();
  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.uiVersion, PROBABILITY_UI_VERSION);
  assert.equal(viewModel.chart.portfolioCount, 1);
  assert.equal(viewModel.chart.semantics.outerBand, "P10-P90");
  assert.equal(viewModel.chart.semantics.innerBand, "P25-P75");
  assert.equal(viewModel.chart.semantics.medianLine, "P50");
  assert.ok(isProbabilityViewModelReady(viewModel));
  for (const band of viewModel.chart.bands) {
    assert.ok(band.p10Nominal <= band.p25Nominal);
    assert.ok(band.p25Nominal <= band.p50Nominal);
    assert.ok(band.p50Nominal <= band.p75Nominal);
    assert.ok(band.p75Nominal <= band.p90Nominal);
  }
});

test("percentile ordering errors fail closed before chart rendering", () => {
  const malformedBands = STEP114_2G_PROBABILITY_FIXTURE_RESULT.monthlyBands.map((band, index) => (
    index === 1 ? { ...band, p25Nominal: band.p90Nominal + 1 } : band
  ));
  const viewModel = readyView({ result: { monthlyBands: malformedBands } });
  assert.equal(viewModel.status, "blocked");
  assert.equal(isProbabilityViewModelReady(viewModel), false);
  assert.match(viewModel.auditReasons.join("|"), /percentile_order_invalid/);
});

test("deterministic baseline and contribution series remain separate", () => {
  const viewModel = readyView();
  assert.ok(viewModel.chart.baselineReference.length > 0);
  assert.ok(viewModel.chart.contributionSeries.length > 0);
  assert.notDeepEqual(viewModel.chart.baselineReference, viewModel.chart.contributionSeries);
  assert.equal(viewModel.chart.semantics.contributionLine, "cumulativeContributions");
});

test("null probability metrics render as unavailable text, not zero", () => {
  const viewModel = readyView({
    result: {
      principalShortfallProbability: {
        month12: null,
        month36: null,
        month60: null,
      },
    },
  });
  const shortfallCards = viewModel.summaryCards.filter((card) => card.key.startsWith("shortfall"));
  assert.deepEqual(shortfallCards.map((card) => card.value), ["미확인", "미확인", "미확인"]);
  assert.ok(shortfallCards.every((card) => card.value !== "0.0%"));
});

test("blocked and insufficient states do not fabricate probability values", () => {
  const blocked = buildProbabilityScenarioViewModel({
    result: {
      ...STEP114_2G_PROBABILITY_FIXTURE_RESULT,
      status: "blocked",
      monthlyBands: [],
      terminalValue: null,
      principalShortfallProbability: { month12: null, month36: null, month60: null },
      dataQuality: { status: "blocked", blockReasons: ["fixture_gate_blocked"] },
    },
    expectedInputHash: STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  });
  const insufficient = buildProbabilityScenarioViewModel({
    result: {
      ...STEP114_2G_PROBABILITY_FIXTURE_RESULT,
      status: "insufficient_data",
      monthlyBands: [],
      terminalValue: null,
      principalShortfallProbability: { month12: null, month36: null, month60: null },
      dataQuality: { status: "insufficient_data", blockReasons: ["insufficient_common_history"] },
    },
    expectedInputHash: STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(insufficient.status, "insufficient_data");
  assert.equal(blocked.summaryCards, undefined);
  assert.equal(insufficient.summaryCards, undefined);
});

test("portfolio or settings fingerprint mismatch marks stale by input hash", () => {
  const stale = readyView({ expectedInputHash: "3333333333333333333333333333333333333333333333333333333333333333" });
  assert.equal(stale.status, "stale");
  assert.match(stale.auditReasons.join("|"), /inputHash_mismatch/);
  assert.equal(stale.resultInputHash, STEP114_2G_PROBABILITY_FIXTURE_RESULT.inputHash);
});

test("malformed hash, unsupported version, or applied calibration flags are blocked", () => {
  for (const result of [
    { inputHash: "not-a-hash" },
    { outputHash: "not-a-hash" },
    { scenarioVersion: "probabilistic-scenario-v0" },
    { betaApplied: true },
    { cagrCalibrationApplied: true },
    { historicalMddApplied: true },
  ]) {
    const viewModel = readyView({ result, expectedInputHash: null });
    assert.equal(viewModel.status, "blocked");
  }
});

test("historical MDD and scenario MDD labels are distinct and disclaimer is present", () => {
  const panelSource = fs.readFileSync("src/components/portfolio/components/ProbabilityAnalysisPanel.jsx", "utf8");
  assert.match(panelSource, /시나리오 MDD와 기존 historical MDD는 다른 지표/);
  assert.match(panelSource, /미래 수익을 예측하거나 보장하지 않으며, 투자 권유가 아닙니다/);
});

test("accessibility labels and mobile fallback are present", () => {
  const chartSource = fs.readFileSync("src/components/portfolio/components/ProbabilityBandChart.jsx", "utf8");
  assert.match(chartSource, /aria-label/);
  assert.match(chartSource, /tabIndex=\{0\}/);
  assert.match(chartSource, /probabilityMobileSummary/);
});

test("KR leading-zero tickers are preserved in display assets", () => {
  const viewModel = readyView();
  assert.deepEqual(viewModel.displayAssets, ["KR:005930", "KR:069500"]);
});

test("Step 1 through Step 3 navigation remains and Step 4 probability does not remove AI", () => {
  const navSource = fs.readFileSync("src/components/portfolio/components/SimulatorTabNav.jsx", "utf8");
  assert.match(navSource, /key: "settings", step: "STEP 1"/);
  assert.match(navSource, /key: "compare", step: "STEP 2"/);
  assert.match(navSource, /key: "detail", step: "STEP 3"/);
  assert.match(navSource, /key: "probability", step: "STEP 4"/);
  assert.match(navSource, /key: "ai"/);
});

test("browser UI does not import Node engine, crypto, scenario API, provider, or loader input", () => {
  const simulatorSource = fs.readFileSync("src/components/PortfolioSimulator.jsx", "utf8");
  const panelSource = fs.readFileSync("src/components/portfolio/components/ProbabilityAnalysisPanel.jsx", "utf8");
  const fixtureSource = fs.readFileSync("src/components/portfolio/fixtures/probabilityScenarioResultFixture.js", "utf8");
  const adapterSource = fs.readFileSync("src/components/portfolio/utils/probabilityScenarioAdapter.js", "utf8");
  const combined = `${simulatorSource}\n${panelSource}\n${fixtureSource}\n${adapterSource}`;
  assert.doesNotMatch(combined, /node:crypto|probabilisticBootstrapEngine|\/api\/scenario|KIS|data\.go\.kr|KRX/);
  assert.doesNotMatch(combined, /screenerCandidateOverlay|scenario_monthly_returns/);

  const loaderSource = fs.readFileSync("src/data/tickers/screenerCandidateOverlay.js", "utf8");
  assert.match(loaderSource, /us_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.match(loaderSource, /kr_price_metrics_overlay_20260528_app_ready\.csv/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  STEP114_2G_FIXTURE_EXPECTED_OUTPUT_HASH,
  STEP114_2G_FIXTURE_REVIEW_ASSETS,
  STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2G_FIXTURE_REVIEW_SETTINGS,
  STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
  STEP114_2G_PROBABILITY_FIXTURE_RESULT,
} from "../fixtures/probabilityScenarioResultFixture.js";
import {
  PROBABILITY_UI_VERSION,
  buildProbabilityScenarioViewModel,
  getProbabilityPortfolioFingerprint,
  isProbabilityViewModelReady,
} from "./probabilityScenarioAdapter.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readyView(overrides = {}) {
  return buildProbabilityScenarioViewModel({
    result: {
      ...clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT),
      ...overrides.result,
    },
    activePortfolio: overrides.activePortfolio || STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
    assets: overrides.assets || STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: overrides.settings || STEP114_2G_FIXTURE_REVIEW_SETTINGS,
    baselineResult: Object.prototype.hasOwnProperty.call(overrides, "baselineResult")
      ? overrides.baselineResult
      : STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
    expectedInputHash: Object.prototype.hasOwnProperty.call(overrides, "expectedInputHash")
      ? overrides.expectedInputHash
      : STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
    expectedOutputHash: Object.prototype.hasOwnProperty.call(overrides, "expectedOutputHash")
      ? overrides.expectedOutputHash
      : STEP114_2G_FIXTURE_EXPECTED_OUTPUT_HASH,
    enableFixtureReview: Object.prototype.hasOwnProperty.call(overrides, "enableFixtureReview")
      ? overrides.enableFixtureReview
      : true,
  });
}

test("public default state does not expose synthetic probability numbers", () => {
  const viewModel = buildProbabilityScenarioViewModel({
    activePortfolio: { id: "public", name: "Public Portfolio" },
    assets: [{ market: "KR", ticker: "005930", targetWeight: 100 }],
    settings: { startValue: 1_000_000, monthlyCashFlow: 100_000, years: 5 },
  });
  assert.equal(viewModel.status, "idle");
  assert.equal(isProbabilityViewModelReady(viewModel), false);
  assert.equal(viewModel.summaryCards, undefined);

  const panelSource = fs.readFileSync("src/components/portfolio/components/ProbabilityAnalysisPanel.jsx", "utf8");
  assert.doesNotMatch(panelSource, /STEP114_2G_PROBABILITY_FIXTURE_RESULT/);
});

test("ready fixture exposes P10 P25 P50 P75 P90 semantics for one review identity", () => {
  const viewModel = readyView();
  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.uiVersion, PROBABILITY_UI_VERSION);
  assert.equal(viewModel.chart.portfolioCount, 1);
  assert.equal(viewModel.chart.semantics.outerBand, "P10-P90");
  assert.equal(viewModel.chart.semantics.innerBand, "P25-P75");
  assert.equal(viewModel.chart.semantics.medianLine, "P50");
  assert.equal(viewModel.resultInputHash, STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH);
  assert.equal(viewModel.resultOutputHash, STEP114_2G_FIXTURE_EXPECTED_OUTPUT_HASH);
  assert.ok(isProbabilityViewModelReady(viewModel));
  assert.deepEqual(viewModel.displayAssets, ["KR:005930", "KR:069500"]);
});

test("actual portfolio settings or assets change marks the result stale", () => {
  const changedSettings = readyView({
    settings: { ...STEP114_2G_FIXTURE_REVIEW_SETTINGS, monthlyCashFlow: 600000 },
  });
  const changedAsset = readyView({
    assets: [{ market: "KR", ticker: "005930", targetWeight: 60 }, { market: "KR", ticker: "069500", targetWeight: 40 }],
  });
  assert.equal(changedSettings.status, "stale");
  assert.equal(changedAsset.status, "stale");
  assert.match(changedSettings.auditReasons.join("|"), /portfolioFingerprint_mismatch/);
  assert.equal(isProbabilityViewModelReady(changedSettings), false);
});

test("baseline is displayed only for the same analysis identity", () => {
  const matched = readyView();
  const mismatched = readyView({
    baselineResult: {
      analysisIdentity: {
        portfolioFingerprint: "different",
        inputHash: STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
      },
      monthlyBaselinePoints: [{ monthIndex: 0, portfolioValueNominal: 999 }],
    },
  });
  assert.ok(matched.chart.baselineReference.length > 0);
  assert.deepEqual(mismatched.chart.baselineReference, []);
});

test("null contribution or real percentile fails closed instead of drawing a zero", () => {
  const missingContribution = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  missingContribution.contributionSeries[1].cumulativeContributions = null;
  const missingReal = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  missingReal.monthlyBands[1].p50Real = null;

  for (const result of [missingContribution, missingReal]) {
    const viewModel = readyView({ result });
    assert.equal(viewModel.status, "blocked");
    assert.equal(isProbabilityViewModelReady(viewModel), false);
  }

  const chartSource = fs.readFileSync("src/components/portfolio/components/ProbabilityBandChart.jsx", "utf8");
  assert.match(chartSource, /function strictNumber/);
  assert.doesNotMatch(chartSource, /\bNumber\((value|point\.value|band\.)/);
});

test("contribution series must align exactly with monthly bands", () => {
  const result = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  result.contributionSeries = result.contributionSeries.slice(0, -1);
  const viewModel = readyView({ result });
  assert.equal(viewModel.status, "blocked");
  assert.match(viewModel.auditReasons.join("|"), /contributionSeries_alignment_invalid/);
});

test("malformed month ordering terminal probability MDD and recovery inputs are blocked", () => {
  const cases = [
    (result) => { result.monthlyBands[1].monthIndex = 0; },
    (result) => { result.terminalValue.p25 = result.terminalValue.p10 - 1; },
    (result) => { result.principalShortfallProbability.month12 = 1.2; },
    (result) => { result.scenarioMdd.p50 = 0.01; },
    (result) => { result.recovery.longestRecoveryMonths = -1; },
    (result) => { result.recovery.unrecoveredScenarioRatio = 2; },
    (result) => { result.simulationCount = 0; },
    (result) => { result.blockMonths = 9; },
    (result) => { result.randomSeed = 1.5; },
    (result) => { result.returnBasis = "mixed"; },
    (result) => { result.currencyMode = ""; },
    (result) => { result.dataQuality.status = "blocked"; },
  ];
  for (const mutate of cases) {
    const result = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
    mutate(result);
    const viewModel = readyView({ result });
    assert.equal(viewModel.status, "blocked");
    assert.equal(isProbabilityViewModelReady(viewModel), false);
  }
});

test("fixture payload tampering with the previous outputHash is blocked", () => {
  const result = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  result.monthlyBands[10].p50Nominal += 1;
  const viewModel = readyView({ result });
  assert.equal(viewModel.status, "blocked");
  assert.match(viewModel.auditReasons.join("|"), /fixture_payload_signature_mismatch/);
});

test("expected input and output hashes are both enforced", () => {
  const wrongInput = readyView({ expectedInputHash: "3333333333333333333333333333333333333333333333333333333333333333" });
  const wrongOutput = readyView({ expectedOutputHash: "4444444444444444444444444444444444444444444444444444444444444444" });
  assert.equal(wrongInput.status, "stale");
  assert.equal(wrongOutput.status, "stale");
});

test("blocked and insufficient states do not fabricate probability values", () => {
  const blocked = buildProbabilityScenarioViewModel({
    result: {
      ...clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT),
      status: "blocked",
      monthlyBands: [],
      terminalValue: null,
      principalShortfallProbability: { month12: null, month36: null, month60: null },
      dataQuality: { status: "blocked", blockReasons: ["fixture_gate_blocked"] },
    },
    enableFixtureReview: true,
  });
  const insufficient = buildProbabilityScenarioViewModel({
    result: {
      ...clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT),
      status: "insufficient_data",
      monthlyBands: [],
      terminalValue: null,
      principalShortfallProbability: { month12: null, month36: null, month60: null },
      dataQuality: { status: "insufficient_data", blockReasons: ["insufficient_common_history"] },
    },
    enableFixtureReview: true,
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(insufficient.status, "insufficient_data");
  assert.equal(blocked.summaryCards, undefined);
  assert.equal(insufficient.summaryCards, undefined);
});

test("null probability metrics render as unavailable text, not zero", () => {
  const result = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  result.principalShortfallProbability.month12 = null;
  result.principalShortfallProbability.month36 = null;
  result.principalShortfallProbability.month60 = null;
  result.fixtureContext.payloadSignature = STEP114_2G_PROBABILITY_FIXTURE_RESULT.fixtureContext.payloadSignature;
  const viewModel = readyView({ result });
  assert.equal(viewModel.status, "blocked");
  assert.equal(isProbabilityViewModelReady(viewModel), false);
});

test("historical MDD and scenario MDD labels are distinct and disclaimer is present", () => {
  const panelSource = fs.readFileSync("src/components/portfolio/components/ProbabilityAnalysisPanel.jsx", "utf8");
  assert.match(panelSource, /시나리오 MDD는 기존 historical MDD와 다른 지표/);
  assert.match(panelSource, /미래 수익을 예측하거나 보장하지 않으며 투자 권유가 아닙니다/);
});

test("accessibility labels and mobile fallback are present", () => {
  const chartSource = fs.readFileSync("src/components/portfolio/components/ProbabilityBandChart.jsx", "utf8");
  assert.match(chartSource, /aria-label/);
  assert.match(chartSource, /tabIndex=\{0\}/);
  assert.match(chartSource, /probabilityMobileSummary/);
});

test("fingerprint preserves KR leading-zero tickers", () => {
  const fingerprint = getProbabilityPortfolioFingerprint({
    portfolioId: STEP114_2G_FIXTURE_REVIEW_PORTFOLIO.id,
    settings: STEP114_2G_FIXTURE_REVIEW_SETTINGS,
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
  });
  assert.match(fingerprint, /005930/);
  assert.match(fingerprint, /069500/);
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
  assert.doesNotMatch(combined, /node:crypto|from ["'].*probabilisticBootstrapEngine|\/api\/scenario|KIS|data\.go\.kr|KRX/);
  assert.doesNotMatch(combined, /screenerCandidateOverlay|scenario_monthly_returns/);

  const loaderSource = fs.readFileSync("src/data/tickers/screenerCandidateOverlay.js", "utf8");
  assert.match(loaderSource, /us_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.match(loaderSource, /kr_price_metrics_overlay_20260528_app_ready\.csv/);
});

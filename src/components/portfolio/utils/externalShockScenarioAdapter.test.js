import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT,
  STEP114_2H_FIXTURE_EXPECTED_BETA_INPUT_HASH,
  STEP114_2H_FIXTURE_EXPECTED_BETA_OUTPUT_HASH,
  STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH,
  STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH,
  STEP114_2H_FIXTURE_REVIEW_ASSETS,
  STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2H_FIXTURE_REVIEW_SETTINGS,
  STEP114_2H_MARKET_BETA_FIXTURE_RESULT,
  STEP114_2H_PRECOMPUTED_BASELINE_FIXTURE,
} from "../fixtures/externalShockScenarioResultFixture.js";
import {
  EXTERNAL_SHOCK_UI_VERSION,
  buildExternalShockScenarioViewModel,
  getExternalShockPortfolioFingerprint,
  isExternalShockViewModelReady,
} from "./externalShockScenarioAdapter.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readyView(overrides = {}) {
  return buildExternalShockScenarioViewModel({
    result: Object.prototype.hasOwnProperty.call(overrides, "result")
      ? overrides.result
      : clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT),
    activePortfolio: overrides.activePortfolio || STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
    assets: overrides.assets || STEP114_2H_FIXTURE_REVIEW_ASSETS,
    settings: overrides.settings || STEP114_2H_FIXTURE_REVIEW_SETTINGS,
    baselineResult: Object.prototype.hasOwnProperty.call(overrides, "baselineResult")
      ? overrides.baselineResult
      : STEP114_2H_PRECOMPUTED_BASELINE_FIXTURE,
    expectedInputHash: Object.prototype.hasOwnProperty.call(overrides, "expectedInputHash")
      ? overrides.expectedInputHash
      : STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH,
    expectedOutputHash: Object.prototype.hasOwnProperty.call(overrides, "expectedOutputHash")
      ? overrides.expectedOutputHash
      : STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH,
    enableFixtureReview: Object.prototype.hasOwnProperty.call(overrides, "enableFixtureReview")
      ? overrides.enableFixtureReview
      : true,
  });
}

test("public default state does not expose synthetic external shock numbers", () => {
  const viewModel = buildExternalShockScenarioViewModel({
    activePortfolio: { id: "public", name: "Public Portfolio" },
    assets: [{ market: "KR", ticker: "005930", targetWeight: 100 }],
    settings: { startValue: 1_000_000, monthlyCashFlow: 100_000, years: 5 },
  });
  assert.equal(viewModel.status, "idle");
  assert.equal(isExternalShockViewModelReady(viewModel), false);
  assert.equal(viewModel.summaryCards, undefined);

  const panelSource = fs.readFileSync("src/components/portfolio/components/ExternalShockAnalysisPanel.jsx", "utf8");
  assert.doesNotMatch(panelSource, /STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT/);
});

test("ready direct shock fixture exposes deterministic comparison without probability labels", () => {
  const viewModel = readyView();
  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.uiVersion, EXTERNAL_SHOCK_UI_VERSION);
  assert.equal(viewModel.shockMode, "direct_asset");
  assert.equal(viewModel.resultInputHash, STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH);
  assert.equal(viewModel.resultOutputHash, STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH);
  assert.deepEqual(viewModel.displayAssets, ["KR:005930", "KR:069500"]);
  assert.ok(viewModel.chart.baselinePath.length > 0);
  assert.ok(viewModel.chart.stressedPath.length > 0);
  assert.ok(isExternalShockViewModelReady(viewModel));

  const combinedSource = [
    "src/components/portfolio/components/ExternalShockAnalysisPanel.jsx",
    "src/components/portfolio/components/ExternalShockPathChart.jsx",
  ].map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(combinedSource, /P10|P25|P50|P75|P90|percentile/i);
});

test("ready market beta fixture is accepted with betaApplied true", () => {
  const viewModel = readyView({
    result: clone(STEP114_2H_MARKET_BETA_FIXTURE_RESULT),
    expectedInputHash: STEP114_2H_FIXTURE_EXPECTED_BETA_INPUT_HASH,
    expectedOutputHash: STEP114_2H_FIXTURE_EXPECTED_BETA_OUTPUT_HASH,
    baselineResult: null,
  });
  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.shockMode, "market_beta");
  assert.equal(viewModel.audit.betaApplied, true);
});

test("actual portfolio settings or assets change marks the result stale", () => {
  const changedSettings = readyView({
    settings: { ...STEP114_2H_FIXTURE_REVIEW_SETTINGS, monthlyCashFlow: 600000 },
  });
  const changedAsset = readyView({
    assets: [{ market: "KR", ticker: "005930", targetWeight: 60 }, { market: "KR", ticker: "069500", targetWeight: 40 }],
  });
  assert.equal(changedSettings.status, "stale");
  assert.equal(changedAsset.status, "stale");
  assert.match(changedSettings.auditReasons.join("|"), /portfolioFingerprint_mismatch/);
  assert.equal(isExternalShockViewModelReady(changedSettings), false);
});

test("baseline reference appears only for the same analysis identity", () => {
  const matched = readyView();
  const mismatched = readyView({
    baselineResult: {
      analysisIdentity: {
        portfolioFingerprint: "different",
        inputHash: STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH,
        outputHash: STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH,
      },
      monthlyBaselinePoints: [{ monthIndex: 0, portfolioValueNominal: 999 }],
    },
  });
  assert.ok(matched.chart.baselineReference.length > 0);
  assert.deepEqual(mismatched.chart.baselineReference, []);
});

test("null contribution or path value fails closed instead of drawing zero", () => {
  const missingContribution = clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT);
  missingContribution.contributionSeries[1].cumulativeContributions = null;
  const missingPathValue = clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT);
  missingPathValue.stressedPath[1].portfolioValue = null;

  for (const result of [missingContribution, missingPathValue]) {
    const viewModel = readyView({ result });
    assert.equal(viewModel.status, "blocked");
    assert.equal(isExternalShockViewModelReady(viewModel), false);
  }

  const chartSource = fs.readFileSync("src/components/portfolio/components/ExternalShockPathChart.jsx", "utf8");
  assert.match(chartSource, /function strictNumber/);
  assert.doesNotMatch(chartSource, /\bNumber\((value|point\.value|point\.)/);
});

test("malformed path summary MDD recovery and impact payloads are blocked", () => {
  const cases = [
    (result) => { result.baselinePath[1].monthIndex = 0; },
    (result) => { result.stressedPath[1].riskNav = null; },
    (result) => { result.contributionSeries = result.contributionSeries.slice(0, -1); },
    (result) => { result.shockEvents[0].monthIndex = 0; },
    (result) => { result.summary.stressedMdd = 0.1; },
    (result) => { result.summary.longestRecoveryMonths = -1; },
    (result) => { result.summary.unrecovered = "false"; },
    (result) => { result.assetImpactSummary[0].deltaValue += 10; },
    (result) => { result.returnBasis = "mixed"; },
    (result) => { result.currencyMode = ""; },
    (result) => { result.dataQuality.status = "blocked"; },
  ];
  for (const mutate of cases) {
    const result = clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT);
    mutate(result);
    const viewModel = readyView({ result });
    assert.equal(viewModel.status, "blocked");
    assert.equal(isExternalShockViewModelReady(viewModel), false);
  }
});

test("fixture payload tampering with the previous outputHash is blocked", () => {
  const result = clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT);
  result.stressedPath[4].portfolioValue += 1;
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

test("blocked and insufficient states do not fabricate shock comparison values", () => {
  const blocked = buildExternalShockScenarioViewModel({
    result: {
      ...clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT),
      status: "blocked",
      baselinePath: [],
      stressedPath: [],
      contributionSeries: [],
      summary: null,
      dataQuality: { status: "blocked", blockReasons: ["fixture_gate_blocked"] },
    },
    enableFixtureReview: true,
  });
  const insufficient = buildExternalShockScenarioViewModel({
    result: {
      ...clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT),
      status: "insufficient_data",
      baselinePath: [],
      stressedPath: [],
      contributionSeries: [],
      summary: null,
      dataQuality: { status: "insufficient_data", blockReasons: ["insufficient_monthly_returns"] },
    },
    enableFixtureReview: true,
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(insufficient.status, "insufficient_data");
  assert.equal(blocked.summaryCards, undefined);
  assert.equal(insufficient.summaryCards, undefined);
});

test("fingerprint preserves KR leading-zero tickers and stable asset order", () => {
  const fingerprintA = getExternalShockPortfolioFingerprint({
    portfolioId: STEP114_2H_FIXTURE_REVIEW_PORTFOLIO.id,
    settings: STEP114_2H_FIXTURE_REVIEW_SETTINGS,
    assets: STEP114_2H_FIXTURE_REVIEW_ASSETS,
  });
  const fingerprintB = getExternalShockPortfolioFingerprint({
    portfolioId: STEP114_2H_FIXTURE_REVIEW_PORTFOLIO.id,
    settings: STEP114_2H_FIXTURE_REVIEW_SETTINGS,
    assets: [...STEP114_2H_FIXTURE_REVIEW_ASSETS].reverse(),
  });
  assert.equal(fingerprintA, fingerprintB);
  assert.match(fingerprintA, /005930/);
  assert.match(fingerprintA, /069500/);
});

test("navigation includes Step 5 between Step 4 and AI without removing existing steps", () => {
  const navSource = fs.readFileSync("src/components/portfolio/components/SimulatorTabNav.jsx", "utf8");
  assert.match(navSource, /key: "settings", step: "STEP 1"/);
  assert.match(navSource, /key: "compare", step: "STEP 2"/);
  assert.match(navSource, /key: "detail", step: "STEP 3"/);
  assert.match(navSource, /key: "probability", step: "STEP 4"/);
  assert.match(navSource, /key: "shock", step: "STEP 5"/);
  assert.match(navSource, /key: "ai"/);
});

test("browser UI does not import Node engine, scenario API, provider, loader, or Step 4 probability fixture", () => {
  const combined = [
    "src/components/PortfolioSimulator.jsx",
    "src/components/portfolio/components/ExternalShockAnalysisPanel.jsx",
    "src/components/portfolio/components/ExternalShockPathChart.jsx",
    "src/components/portfolio/fixtures/externalShockScenarioResultFixture.js",
    "src/components/portfolio/utils/externalShockScenarioAdapter.js",
  ].map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(combined, /node:crypto|from ["'].*externalShockEngine|\/api\/scenario|KIS|data\.go\.kr|KRX/);
  assert.doesNotMatch(combined, /screenerCandidateOverlay|scenario_monthly_returns|STEP114_2G_PROBABILITY_FIXTURE_RESULT/);
});

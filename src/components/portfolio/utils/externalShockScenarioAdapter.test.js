import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT,
  STEP114_2H_FIXTURE_EXPECTED_BETA_INPUT_HASH,
  STEP114_2H_FIXTURE_EXPECTED_BETA_OUTPUT_HASH,
  STEP114_2H_FIXTURE_EXPECTED_BASELINE_IDENTITY_HASH,
  STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH,
  STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH,
  STEP114_2H_FIXTURE_EXPECTED_INPUT_HASHES,
  STEP114_2H_FIXTURE_EXPECTED_OUTPUT_HASHES,
  STEP114_2H_FIXTURE_REVIEW_ASSETS,
  STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2H_FIXTURE_REVIEW_SETTINGS,
  STEP114_2H_MARKET_BETA_FIXTURE_RESULT,
  STEP114_2H_PRECOMPUTED_BASELINE_FIXTURE,
  STEP114_2H_SCENARIO_FIXTURE_RESULTS,
} from "../fixtures/externalShockScenarioResultFixture.js";
import {
  EXTERNAL_SHOCK_UI_VERSION,
  buildExternalShockScenarioViewModel,
  checksumExternalShockFixturePayload,
  createExternalShockFixturePayloadForIntegrity,
  getExternalShockPortfolioFingerprint,
  isExternalShockViewModelReady,
} from "./externalShockScenarioAdapter.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function refreshFixtureSignature(result) {
  result.fixtureContext.payloadSignature = checksumExternalShockFixturePayload(
    createExternalShockFixturePayloadForIntegrity(result),
  );
  return result;
}

function readyView(overrides = {}) {
  return buildExternalShockScenarioViewModel({
    result: Object.prototype.hasOwnProperty.call(overrides, "result")
      ? overrides.result
      : clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT),
    scenarioResults: overrides.scenarioResults,
    selectedScenarioId: overrides.selectedScenarioId,
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
  assert.equal(viewModel.scenarioId, "step114-2h-direct-asset-fixture");
  assert.equal(viewModel.shockMode, "direct_asset");
  assert.equal(viewModel.resultInputHash, STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH);
  assert.equal(viewModel.resultOutputHash, STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH);
  assert.equal(viewModel.baselineIdentityHash, STEP114_2H_FIXTURE_EXPECTED_BASELINE_IDENTITY_HASH);
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

test("review model accepts direct and market-beta scenarios with selector and comparison rows", () => {
  const viewModel = readyView({
    result: null,
    scenarioResults: STEP114_2H_SCENARIO_FIXTURE_RESULTS.map(clone),
    selectedScenarioId: "step114-2h-market-beta-fixture",
    expectedInputHash: STEP114_2H_FIXTURE_EXPECTED_INPUT_HASHES,
    expectedOutputHash: STEP114_2H_FIXTURE_EXPECTED_OUTPUT_HASHES,
    baselineResult: null,
  });
  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.scenarioId, "step114-2h-market-beta-fixture");
  assert.equal(viewModel.shockMode, "market_beta");
  assert.equal(viewModel.scenarioOptions.length, 2);
  assert.equal(viewModel.scenarioComparisonRows.length, 2);
  assert.deepEqual(viewModel.scenarioComparisonRows.map((row) => row.mode), ["direct_asset", "market_beta"]);
  assert.equal(
    STEP114_2H_SCENARIO_FIXTURE_RESULTS[0].baselineIdentityHash,
    STEP114_2H_SCENARIO_FIXTURE_RESULTS[1].baselineIdentityHash,
  );
  for (const row of viewModel.scenarioComparisonRows) {
    assert.ok(Object.hasOwn(row, "terminalDeltaRate"));
    assert.ok(Object.hasOwn(row, "stressedMdd"));
    assert.ok(Object.hasOwn(row, "incrementalMdd"));
    assert.ok(Object.hasOwn(row, "recoveryMonths"));
    assert.ok(Object.hasOwn(row, "unrecovered"));
  }
});

test("multi-scenario comparison blocks mismatched baseline identity and hides comparison values", () => {
  const changed = clone(STEP114_2H_MARKET_BETA_FIXTURE_RESULT);
  changed.baselineIdentityHash = "3333333333333333333333333333333333333333333333333333333333333333";
  changed.fixtureContext.baselineIdentityHash = changed.baselineIdentityHash;
  refreshFixtureSignature(changed);
  const viewModel = readyView({
    result: null,
    scenarioResults: [clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT), changed],
    expectedInputHash: null,
    expectedOutputHash: null,
    baselineResult: null,
  });
  assert.equal(viewModel.status, "blocked");
  assert.match(viewModel.auditReasons.join("|"), /scenario_baseline_identity_mismatch/);
  assert.equal(viewModel.scenarioComparisonRows, undefined);
  assert.equal(viewModel.shockAssumptionRows, undefined);
});

test("multi-scenario comparison blocks tampered common baseline path and baseline MDD", () => {
  for (const mutate of [
    (result) => { result.baselinePath[1].portfolioValue += 1; },
    (result) => {
      result.summary.baselineMdd = -0.02;
      result.baselineMdd = -0.02;
    },
  ]) {
    const changed = clone(STEP114_2H_MARKET_BETA_FIXTURE_RESULT);
    mutate(changed);
    refreshFixtureSignature(changed);
    const viewModel = readyView({
      result: null,
      scenarioResults: [clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT), changed],
      expectedInputHash: null,
      expectedOutputHash: null,
      baselineResult: null,
    });
    assert.equal(viewModel.status, "blocked");
    assert.match(viewModel.auditReasons.join("|"), /scenario_baseline_identity_mismatch/);
  }
});

test("single malformed baseline identity hash is blocked", () => {
  const malformed = clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT);
  malformed.baselineIdentityHash = "not-a-hash";
  malformed.fixtureContext.baselineIdentityHash = "not-a-hash";
  const viewModel = readyView({ result: malformed, expectedInputHash: null, expectedOutputHash: null });
  assert.equal(viewModel.status, "blocked");
  assert.match(viewModel.auditReasons.join("|"), /baselineIdentityHash_malformed/);
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
  assert.equal(viewModel.audit.baselineIdentityHash, STEP114_2H_FIXTURE_EXPECTED_BASELINE_IDENTITY_HASH);
  assert.equal(viewModel.methodology.find((item) => item.label === "betaProvenanceCount").value, "2");
  assert.equal(viewModel.methodology.find((item) => item.label === "baselineIdentityHash").value, "available");
  assert.equal(viewModel.shockAssumptionRows.length, 2);
  assert.equal(viewModel.shockAssumptionRows[0].mode, "market_beta");
  assert.equal(viewModel.shockAssumptionRows[0].sourceName, "synthetic_beta_fixture");
  assert.equal(viewModel.shockAssumptionRows[0].asOfDate, "2024-12-31");
  assert.equal(viewModel.shockAssumptionRows[0].betaWindow, "36m-monthly");
  assert.equal(viewModel.shockAssumptionRows[0].methodVersion, "beta-fixture-v1");
  assert.equal(viewModel.chart.shockMarkers[0].betaProvenance["KR:005930"].sourceHash, "fixture-beta-source-005930");
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
    (result) => { result.bootstrapApplied = true; },
    (result) => { result.probabilityApplied = true; },
    (result) => { result.baselineTerminalValue = result.summary.baselineTerminalValue + 1; },
  ];
  for (const mutate of cases) {
    const result = clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT);
    mutate(result);
    const viewModel = readyView({ result });
    assert.equal(viewModel.status, "blocked");
    assert.equal(isExternalShockViewModelReady(viewModel), false);
  }

  const betaWithoutProvenance = clone(STEP114_2H_MARKET_BETA_FIXTURE_RESULT);
  delete betaWithoutProvenance.shockEvents[0].betaProvenance["KR:005930"].sourceHash;
  const betaViewModel = readyView({
    result: betaWithoutProvenance,
    expectedInputHash: STEP114_2H_FIXTURE_EXPECTED_BETA_INPUT_HASH,
    expectedOutputHash: STEP114_2H_FIXTURE_EXPECTED_BETA_OUTPUT_HASH,
  });
  assert.equal(betaViewModel.status, "blocked");
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

test("panel source includes review-only scenario selector, comparison table, and stress disclaimer", () => {
  const panelSource = fs.readFileSync("src/components/portfolio/components/ExternalShockAnalysisPanel.jsx", "utf8");
  const chartSource = fs.readFileSync("src/components/portfolio/components/ExternalShockPathChart.jsx", "utf8");
  assert.match(panelSource, /ScenarioSelector/);
  assert.match(panelSource, /ScenarioComparisonTable/);
  assert.match(panelSource, /ShockAssumptionsTable/);
  assert.match(panelSource, /externalShockTableScroll/);
  assert.match(panelSource, /sourceName/);
  assert.match(panelSource, /betaWindow/);
  assert.match(panelSource, /deterministic/);
  assert.match(panelSource, /예측|보장|투자 권유|investment advice/i);
  assert.match(chartSource, /formatShockAssumptions/);
  assert.match(chartSource, /marketFactorShock/);
  assert.match(chartSource, /betaProvenance/);

  const styleSource = fs.readFileSync("src/App.css", "utf8");
  assert.match(styleSource, /externalShockTableScroll/);
  assert.match(styleSource, /externalShockAssumptionPanel/);
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

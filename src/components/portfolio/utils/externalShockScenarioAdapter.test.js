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
  SUPPORTED_PRODUCTION_EXTERNAL_SHOCK_SCENARIO_VERSION,
  buildExternalShockScenarioViewModel,
  checksumExternalShockFixturePayload,
  createExternalShockFixturePayloadForIntegrity,
  getExternalShockPortfolioFingerprint,
  getExternalShockStatusCopy,
  formatExternalShockBlockReason,
  isExternalShockViewModelReady,
} from "./externalShockScenarioAdapter.js";
import { SIMULATOR_TAB_ITEMS } from "./simulatorNavigation.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function refreshFixtureSignature(result) {
  result.fixtureContext.payloadSignature = checksumExternalShockFixturePayload(
    createExternalShockFixturePayloadForIntegrity(result),
  );
  return result;
}

function productionResult(scenarioId = "market_drawdown_moderate") {
  const result = clone(STEP114_2H_MARKET_BETA_FIXTURE_RESULT);
  const factor = scenarioId === "market_drawdown_severe" ? -0.35 : -0.2;
  result.scenarioVersion = SUPPORTED_PRODUCTION_EXTERNAL_SHOCK_SCENARIO_VERSION;
  result.scenarioId = scenarioId;
  result.scenarioLabel = scenarioId;
  result.sourceHashes = [];
  result.normalizationVersion = null;
  result.calculationPolicyVersion = null;
  result.pipelineVersion = null;
  delete result.fixtureContext;
  result.shockEvents[0].monthIndex = Math.min(12, result.baselinePath.at(-1).monthIndex);
  result.shockEvents[0].marketFactorShock = factor;
  result.shockEvents[0].assetShockReturns = Object.fromEntries(
    Object.entries(result.shockEvents[0].assetBetas).map(([key, beta]) => [key, beta * factor]),
  );
  result.shockEvents[0].betaProvenance = Object.fromEntries(
    Object.keys(result.shockEvents[0].assetBetas).map((key) => [key, null]),
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

test("Production v2 accepts optional audit metadata and exposes Korean preset copy", () => {
  const moderate = productionResult();
  const severe = productionResult("market_drawdown_severe");
  const viewModel = buildExternalShockScenarioViewModel({
    scenarioResults: [moderate, severe],
    selectedScenarioId: severe.scenarioId,
    scenarioLoadStatus: "ready",
    activePortfolio: { id: "production", name: "현재 포트폴리오" },
    assets: STEP114_2H_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2H_FIXTURE_REVIEW_SETTINGS,
  });
  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.scenarioId, "market_drawdown_severe");
  assert.equal(viewModel.fixtureOnly, false);
  assert.equal(viewModel.productionPublishReady, true);
  assert.deepEqual(viewModel.scenarioOptions.map(({ label, assumptionLabel, enabled }) => ({ label, assumptionLabel, enabled })), [
    { label: "주식시장 급락 · 중간", assumptionLabel: "시장 충격 -20%", enabled: true },
    { label: "주식시장 급락 · 강함", assumptionLabel: "시장 충격 -35%", enabled: true },
  ]);
  assert.equal(viewModel.methodology.find((item) => item.label === "기준 경로").value, "과거 월간수익률 기반");
  assert.equal(viewModel.methodology.find((item) => item.label === "발생확률").value, "미적용");
});

test("load states use public copy and never surface raw errors", () => {
  const expected = {
    idle: "외부충격분석을 준비합니다.",
    loading: "포트폴리오의 월간 데이터를 불러오고 있습니다.",
    insufficient_data: "선택 자산의 공통 월간 이력이 투자기간보다 짧아 분석할 수 없습니다.",
    blocked: "필수 분석값을 확인할 수 없어 결과를 계산하지 못했습니다.",
    stale: "포트폴리오가 변경되어 결과를 다시 계산하고 있습니다.",
    error: "외부충격분석을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  };
  for (const [status, message] of Object.entries(expected)) {
    const viewModel = buildExternalShockScenarioViewModel({
      scenarioLoadStatus: status,
      scenarioLoadError: "sourceHash:raw_internal_error",
    });
    assert.equal(viewModel.status, status);
    assert.equal(viewModel.userGuidance, message);
    assert.doesNotMatch(viewModel.userGuidance, /sourceHash|raw_internal_error/);
    assert.equal(getExternalShockStatusCopy(status).message, message);
  }
});

test("partial Production results keep ready scenarios and disable blocked options without numbers", () => {
  const moderate = productionResult();
  const severe = productionResult("market_drawdown_severe");
  severe.status = "blocked";
  severe.dataQuality = {
    status: "blocked",
    blockReasons: ["market_beta_shock_less_than_or_equal_minus_100:KR:005930:12"],
  };
  const viewModel = buildExternalShockScenarioViewModel({
    scenarioResults: [moderate, severe],
    selectedScenarioId: severe.scenarioId,
    scenarioLoadStatus: "ready",
  });
  assert.equal(viewModel.status, "ready");
  assert.equal(viewModel.scenarioId, moderate.scenarioId);
  assert.equal(viewModel.scenarioComparisonRows.length, 1);
  assert.equal(viewModel.scenarioComparisonRows[0].scenarioId, moderate.scenarioId);
  assert.deepEqual(viewModel.scenarioOptions.map((option) => option.enabled), [true, false]);
  assert.match(viewModel.scenarioOptions[1].disabledReason, /-100% 이하/);
  assert.equal(Object.hasOwn(viewModel.scenarioOptions[1], "terminalDeltaRate"), false);
});

test("all blocked Production results stay non-numeric and map coverage shortage", () => {
  const results = [productionResult(), productionResult("market_drawdown_severe")].map((result) => ({
    ...result,
    status: "blocked",
    dataQuality: { status: "blocked", blockReasons: ["baselineReturnMatrix:must_be_non_empty_array"] },
  }));
  const viewModel = buildExternalShockScenarioViewModel({
    scenarioResults: results,
    scenarioLoadStatus: "blocked",
  });
  assert.equal(viewModel.status, "insufficient_data");
  assert.equal(viewModel.summaryCards, undefined);
  assert.equal(viewModel.scenarioComparisonRows, undefined);
  assert.equal(formatExternalShockBlockReason("missing_monthly_identity:KR:005930"), "선택 자산의 공통 월간 이력이 부족합니다.");
});

test("Production v2 malformed hashes, paths, and shock assumptions fail closed", () => {
  const cases = [
    (result) => { result.outputHash = "bad"; },
    (result) => { result.stressedPath[1].portfolioValue = null; },
    (result) => { result.shockEvents[0].assetShockReturns["KR:005930"] += 0.01; },
    (result) => { result.shockEvents[0].monthIndex = 1; },
  ];
  for (const mutate of cases) {
    const result = productionResult();
    mutate(result);
    const viewModel = buildExternalShockScenarioViewModel({
      result,
      scenarioLoadStatus: "ready",
    });
    assert.equal(viewModel.status, "blocked");
    assert.equal(isExternalShockViewModelReady(viewModel), false);
  }
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
  assert.deepEqual(viewModel.scenarioComparisonRows.map((row) => row.mode), ["자산별 충격", "시장 민감도"]);
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
  assert.equal(viewModel.methodology.find((item) => item.label === "충격 방식").value, "시장 민감도");
  assert.equal(viewModel.methodology.some((item) => /Hash|Version|Provenance/.test(item.label)), false);
  assert.equal(viewModel.shockAssumptionRows.length, 2);
  assert.equal(viewModel.shockAssumptionRows[0].mode, "시장 민감도");
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
  assert.deepEqual(
    SIMULATOR_TAB_ITEMS.map((item) => [item.key, item.step]),
    [
      ["settings", "STEP 1"],
      ["compare", "STEP 2"],
      ["detail", "STEP 3"],
      ["probability", "STEP 4"],
      ["shock", "STEP 5"],
      ["ai", "STEP 6"],
      ["saved", "STEP 7"],
    ]
  );
});

test("panel source includes user-facing scenario selector, comparison table, and stress disclaimer", () => {
  const panelSource = fs.readFileSync("src/components/portfolio/components/ExternalShockAnalysisPanel.jsx", "utf8");
  const chartSource = fs.readFileSync("src/components/portfolio/components/ExternalShockPathChart.jsx", "utf8");
  assert.match(panelSource, /ScenarioSelector/);
  assert.match(panelSource, /ScenarioComparisonTable/);
  assert.match(panelSource, /ShockAssumptionsTable/);
  assert.match(panelSource, /externalShockTableScroll/);
  assert.doesNotMatch(panelSource, /sourceName|betaWindow|sourceHash|fixture-safe|deterministic/);
  assert.match(panelSource, /예측|보장|투자 권유|investment advice/i);
  assert.match(panelSource, /현재 포트폴리오에 사전에 정의된 시장 급락 충격/);
  assert.match(panelSource, /과거 월간수익률 기반 경로/);
  assert.match(panelSource, /실시간 시세 조회, 외부 공급자 호출, 주문 또는 AI 해석/);
  assert.doesNotMatch(panelSource, /검증 데이터 연결|분석 대기|데이터 연결 필요|review-only|internal preview|app-export approval|source hash|pipeline version/i);
  assert.match(panelSource, /aria-busy=\{viewModel\.status === "loading"\}/);
  assert.match(panelSource, /aria-pressed=/);
  assert.match(panelSource, /disabled=\{!option\.enabled\}/);
  assert.match(chartSource, /formatShockAssumptions/);
  assert.match(chartSource, /marketFactorShock/);
  assert.doesNotMatch(chartSource, /sourceName|sourceHash/);

  const styleSource = fs.readFileSync("src/App.css", "utf8");
  assert.match(styleSource, /externalShockTableScroll/);
  assert.match(styleSource, /externalShockAssumptionPanel/);
  assert.match(styleSource, /\.externalShockAnalysisPanel > \* \{\s*min-width: 0;/);
  assert.match(styleSource, /\.externalShockScenarioSelector button:disabled/);
  assert.match(styleSource, /@media \(max-width: 640px\)[\s\S]*\.externalShockScenarioSelector/);
});

test("PortfolioSimulator wires all four Step 5 fields while the Free entitlement branch stays locked", () => {
  const source = fs.readFileSync("src/components/PortfolioSimulator.jsx", "utf8");
  for (const field of [
    "step5ScenarioResult",
    "step5ScenarioResults",
    "step5ScenarioStatus",
    "step5ScenarioError",
  ]) assert.match(source, new RegExp(field));
  assert.match(source, /scenarioResult=\{step5ScenarioResult\}/);
  assert.match(source, /scenarioResults=\{step5ScenarioResults\}/);
  assert.match(source, /scenarioLoadStatus=\{step5ScenarioStatus\}/);
  assert.match(source, /scenarioLoadError=\{step5ScenarioError\}/);
  assert.match(source, /planFeatures\.externalShockAnalysis \? <ExternalShockAnalysisPanel/);
  assert.match(source, /<AdvancedAnalysisLockedPanel capability="externalShockAnalysis"/);

  const hookSource = fs.readFileSync("src/components/portfolio/hooks/usePortfolioSimulator.js", "utf8");
  assert.match(hookSource, /\["unavailable", "unconfigured"\][\s\S]*\? "error"/);
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

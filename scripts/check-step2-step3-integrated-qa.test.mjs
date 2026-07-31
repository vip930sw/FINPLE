import assert from "node:assert/strict";
import fs from "node:fs";
import process from "node:process";
import test, { after, before } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import {
  getOfficialPortfolioFixtures,
  OFFICIAL_BASELINE_SETTINGS,
} from "./check-official-portfolio-baseline.test.mjs";
import {
  buildStep3MonthlyBaselineDetail,
} from "../src/components/portfolio/utils/monthlyBaselineEngine.js";
import {
  createComparisonPortfolios,
  createInsightComparisonPortfolios,
  createRankedComparisonPortfolios,
  getChartComparisonPortfolios,
  getPortfolioDetailReport,
} from "../src/components/portfolio/utils/portfolioCalculations.js";
import {
  createPortfolioReportText,
  createReportSummaryText,
} from "../src/components/portfolio/utils/portfolioReports.js";
import {
  formatDecimal,
  formatNumber,
  formatPercent,
  getAssetEvaluationValue,
  getAssetEvaluationWeight,
} from "../src/components/portfolio/utils/portfolioFormatters.js";

const RESULT_FIELDS = [
  "status",
  "ready",
  "simulationStartValue",
  "yearlyContribution",
  "expectedCagr",
  "expectedBeta",
  "simpleMdd",
  "expectedSimulationCashYield",
  "expectedDividendYield",
  "expectedAnnualCashDistribution",
  "expectedAnnualDividend",
  "futureValue",
  "inflationAdjustedFutureValue",
  "performanceRows",
  "blockReasons",
  "portfolioEligibilityBlocks",
];
const INTERNAL_RESULT_TEXT =
  /missing_metric_lineage|invalid_production_metric_approval|metric_source_not_publish_approved|unsupported_calculation_policy_version|unsupported_pipeline_version/;
const INVALID_USER_VALUE = /NaN|Infinity|undefined|review-only/;
const MISLEADING_BLOCKED_COPY =
  /지표 출처 확인|승인된 계산 계약|차단 사유와 자산별 분배 정책/;

let vite;
let ComparePanel;
let DetailPanel;
let loader;
let createManualCashAsset;
let matrix;
let step2Portfolios;
let rankedPortfolios;
let insightPortfolios;
let chartPortfolios;
let step3Results;

function createCatalogAsset(ticker, market, targetWeight, overrides = {}) {
  const candidate = loader.findScreenerCandidateByTicker(ticker, market);
  assert.ok(candidate, `${market}:${ticker}`);
  return loader.hydrateAssetFromScreenerCandidate({
    id: `fixture-${market}-${ticker}-${targetWeight}`,
    ticker,
    market,
    name: candidate.name,
    quantity: targetWeight,
    price: 10_000,
    targetWeight,
    targetEvaluationAmount: targetWeight * 10_000,
    ...overrides,
  });
}

function emptyAssetRow() {
  return {
    id: "empty-row",
    ticker: "",
    name: "",
    quantity: 0,
    price: 0,
    targetWeight: "",
    targetEvaluationAmount: 0,
    cagr: "",
    beta: "",
    mdd: "",
    dividendYield: "",
  };
}

function createSpecialFixtures() {
  const ordinary = createCatalogAsset("SCHD", "US", 100);
  const qqq = createCatalogAsset("QQQ", "US", 100);
  const option = createCatalogAsset("QYLG", "US", 40);
  const leverage = createCatalogAsset("TQQQ", "US", 100);
  const denied = createCatalogAsset("0000D0", "KR", 100);
  const cash = createManualCashAsset({
    id: "fixture-cash",
    quantity: 100,
    price: 10_000,
    targetWeight: 100,
    targetEvaluationAmount: 1_000_000,
  });
  const empty = emptyAssetRow();

  return [
    {
      id: "special-ordinary-dividend",
      name: "일반 배당",
      path: "special",
      expectedStatus: "ready",
      assets: [ordinary],
    },
    {
      id: "special-cash-only",
      name: "CASH 100%",
      path: "special",
      expectedStatus: "ready",
      assets: [cash],
    },
    {
      id: "special-mixed-distribution",
      name: "일반 배당 + 옵션 분배",
      path: "special",
      expectedStatus: "ready",
      assets: [
        createCatalogAsset("SCHD", "US", 60),
        option,
      ],
    },
    {
      id: "special-leverage-confirm",
      name: "레버리지 confirm",
      path: "special",
      expectedStatus: "ready",
      assets: [leverage],
    },
    {
      id: "special-denied",
      name: "실제 deny",
      path: "special",
      expectedStatus: "blocked",
      assets: [denied],
    },
    {
      id: "special-zero-weight",
      name: "정상 100% + 정상 0%",
      path: "special",
      expectedStatus: "ready",
      assets: [
        qqq,
        createCatalogAsset("SCHD", "US", 0),
      ],
    },
    {
      id: "special-target-value-only",
      name: "현재가 없는 목표 평가금액 전용",
      path: "special",
      expectedStatus: "ready",
      assets: [
        createCatalogAsset("QQQ", "US", 60, {
          quantity: 0,
          price: 0,
          targetEvaluationAmount: 30_000_000,
        }),
        createCatalogAsset("SCHD", "US", 40, {
          quantity: 0,
          price: 0,
          targetEvaluationAmount: 20_000_000,
        }),
      ],
    },
    {
      id: "special-empty-row",
      name: "정상 + 완전 빈 행",
      path: "special",
      expectedStatus: "ready",
      assets: [qqq, empty],
    },
    {
      id: "special-partial-row",
      name: "부분 입력 행",
      path: "special",
      expectedStatus: "blocked",
      assets: [{
        id: "partial-row",
        market: "US",
        ticker: "PARTIAL",
        quantity: 100,
        price: 10_000,
        targetWeight: 100,
      }],
    },
    {
      id: "special-duplicate",
      name: "동일 자산 중복",
      path: "special",
      expectedStatus: "blocked",
      assets: [
        qqq,
        createCatalogAsset("QQQ", "US", 0),
      ],
    },
  ];
}

function getPortfolio(id) {
  const portfolio = insightPortfolios.find((item) => item.id === id);
  assert.ok(portfolio, id);
  return portfolio;
}

function getStep3(id) {
  const result = step3Results.get(id);
  assert.ok(result, id);
  return result;
}

function assertResultFieldEqual(label, field, step2, step3) {
  const left = step2[field];
  const right = step3[field];
  if (
    typeof left === "number" &&
    typeof right === "number" &&
    Number.isFinite(left) &&
    Number.isFinite(right)
  ) {
    assert.ok(Math.abs(left - right) <= 1e-8, `${label}:${field}:${left}:${right}`);
    return;
  }
  assert.deepEqual(left, right, `${label}:${field}`);
}

function renderCompare(portfolios, chart = []) {
  return renderToStaticMarkup(React.createElement(ComparePanel, {
    insightComparisonPortfolios: portfolios,
    chartComparisonPortfolios: chart,
  }));
}

function detailProps(fixture, portfolio, result) {
  const detailReport = getPortfolioDetailReport(portfolio);
  return {
    activePortfolio: fixture,
    detailReport,
    settings: OFFICIAL_BASELINE_SETTINGS,
    result,
    yearlyContribution: result.yearlyContribution,
    totalAssetValue: result.totalAssetValue,
    simulationStartValue: result.simulationStartValue,
    expectedCagr: result.expectedCagr,
    expectedDividendYield: result.expectedDividendYield,
    expectedBeta: result.expectedBeta,
    simpleMdd: result.simpleMdd,
    expectedCalmar: result.expectedCalmar,
    expectedAnnualDividend: result.expectedAnnualDividend,
    performanceRows: result.performanceRows,
    futureValue: result.futureValue,
    inflationAdjustedFutureValue: result.inflationAdjustedFutureValue,
    assets: fixture.assets,
    formatNumber,
    formatPercent,
    formatDecimal,
    downloadReportText() {},
    saveReportPdf() {},
    printReport() {},
    reportPdfFileName: `${fixture.name}.pdf`,
    copyReportSummary() {},
  };
}

function reportInput(fixture, portfolio, result) {
  return {
    activePortfolio: fixture,
    detailReport: getPortfolioDetailReport(portfolio),
    result,
    assets: fixture.assets,
    detailPortfolio: portfolio,
  };
}

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  const [compareModule, detailModule, loaderModule, cashModule] = await Promise.all([
    vite.ssrLoadModule("/src/components/portfolio/components/ComparePanel.jsx"),
    vite.ssrLoadModule("/src/components/portfolio/components/DetailPanel.jsx"),
    vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
    vite.ssrLoadModule("/src/data/tickers/manualCashAsset.js"),
  ]);
  ComparePanel = compareModule.default;
  DetailPanel = detailModule.default;
  loader = loaderModule;
  createManualCashAsset = cashModule.createManualCashAsset;

  const official = (await getOfficialPortfolioFixtures()).map((fixture) => ({
    ...fixture,
    expectedStatus: "ready",
  }));
  matrix = [...official, ...createSpecialFixtures()];
  step2Portfolios = createComparisonPortfolios(
    matrix,
    "",
    [],
    OFFICIAL_BASELINE_SETTINGS,
  );
  rankedPortfolios = createRankedComparisonPortfolios(step2Portfolios);
  insightPortfolios = createInsightComparisonPortfolios(rankedPortfolios);
  chartPortfolios = getChartComparisonPortfolios(insightPortfolios);
  step3Results = new Map(matrix.map((fixture) => [
    fixture.id,
    buildStep3MonthlyBaselineDetail({
      portfolio: fixture,
      settings: OFFICIAL_BASELINE_SETTINGS,
    }),
  ]));
});

after(async () => {
  await vite?.close();
});

test("41 portfolio paths keep Step 2 and Step 3 results aligned", () => {
  assert.equal(matrix.filter((item) => item.path === "official_preset").length, 10);
  assert.equal(matrix.filter((item) => item.path === "investment_mbti").length, 16);
  assert.equal(matrix.filter((item) => item.path === "persistence").length, 5);
  assert.equal(matrix.filter((item) => item.path === "special").length, 10);
  assert.equal(matrix.length, 41);

  for (const fixture of matrix) {
    const step2 = getPortfolio(fixture.id).result;
    const step3 = getStep3(fixture.id);
    assert.equal(step2.status, fixture.expectedStatus, `${fixture.id}:Step2`);
    assert.equal(step3.status, fixture.expectedStatus, `${fixture.id}:Step3`);
    for (const field of RESULT_FIELDS) {
      assertResultFieldEqual(fixture.id, field, step2, step3);
    }
  }

  const step2Ready = insightPortfolios.filter((item) => item.result.ready).length;
  const step3Ready = [...step3Results.values()].filter((result) => result.ready).length;
  assert.equal(step2Ready, 38);
  assert.equal(step3Ready, 38);
  console.log("[P2 QA] paths=41 Step2=38 ready/3 blocked Step3=38 ready/3 blocked fields=16");
});

test("Step 2 ranks, cards, chart eligibility, ties, and legends stay deterministic", () => {
  for (const portfolio of insightPortfolios) {
    const ready = portfolio.result.status === "ready";
    for (const rank of [
      portfolio.realValueRank,
      portfolio.growthRank,
      portfolio.stabilityRank,
      portfolio.cashFlowRank,
    ]) {
      assert.equal(ready ? Number.isFinite(rank) : rank === "-", true, portfolio.id);
    }
  }

  const readyIds = new Set(
    insightPortfolios
      .filter((item) => item.result.ready && item.realValueRank <= 3)
      .map((item) => item.id),
  );
  assert.deepEqual(new Set(chartPortfolios.map((item) => item.id)), readyIds);

  const html = renderCompare(insightPortfolios, chartPortfolios);
  assert.doesNotMatch(html, INVALID_USER_VALUE);
  assert.doesNotMatch(html, INTERNAL_RESULT_TEXT);
  assert.doesNotMatch(html, /points=""/);
  assert.doesNotMatch(html, /points="[^"]*NaN/);

  const readySample = insightPortfolios.find((item) => item.result.ready);
  assert.ok(readySample);
  assert.match(
    html,
    new RegExp(`${Number(readySample.result.expectedCagr).toFixed(2)}%`),
  );

  const tieSeed = readySample.result;
  const tieRanked = createRankedComparisonPortfolios(
    ["A", "B", "C", "D"].map((id) => ({
      id,
      name: `동률 ${id}`,
      assets: readySample.assets,
      settings: readySample.settings,
      result: structuredClone(tieSeed),
    })),
  );
  const tieChart = getChartComparisonPortfolios(
    createInsightComparisonPortfolios(tieRanked),
  );
  assert.equal(tieChart.length, 4);
  assert.ok(tieChart.every((item) => item.realValueRank === 1));
  const tieHtml = renderCompare(tieChart, tieChart);
  assert.match(tieHtml, /공동 1위/);
  for (const [index, id] of ["A", "B", "C", "D"].entries()) {
    assert.match(tieHtml, new RegExp(`동률 ${id}`));
    assert.match(
      tieHtml,
      new RegExp(["#2563eb", "#0f4c5c", "#f59e0b", "#7c3aed"][index]),
    );
  }

  const stabilityRanked = createRankedComparisonPortfolios([
    {
      id: "stable",
      name: "stable",
      assets: readySample.assets,
      result: { ...structuredClone(tieSeed), simpleMdd: -10 },
    },
    {
      id: "volatile",
      name: "volatile",
      assets: readySample.assets,
      result: { ...structuredClone(tieSeed), simpleMdd: -40 },
    },
  ]);
  assert.equal(stabilityRanked.find((item) => item.id === "stable").stabilityRank, 1);
  assert.equal(stabilityRanked.find((item) => item.id === "volatile").stabilityRank, 2);

  for (const id of ["special-denied", "special-partial-row", "special-duplicate"]) {
    const blockedHtml = renderCompare([getPortfolio(id)]);
    assert.match(blockedHtml, /<strong>-<\/strong>/);
    assert.doesNotMatch(blockedHtml, /<polyline/);
    assert.doesNotMatch(blockedHtml, MISLEADING_BLOCKED_COPY);
  }
  assert.match(renderCompare([getPortfolio("special-denied")]), /제거하거나 이용 가능한 자산으로 교체/);
  assert.match(renderCompare([getPortfolio("special-partial-row")]), /PARTIAL.*완성되지 않았/);
  assert.match(renderCompare([getPortfolio("special-duplicate")]), /US:QQQ.*중복/);
});

test("Step 2 overrides only the active portfolio with current edited assets", () => {
  const storedActive = {
    id: "active",
    name: "active",
    assets: [createCatalogAsset("SCHD", "US", 100)],
  };
  const storedOther = {
    id: "other",
    name: "other",
    assets: [createCatalogAsset("QQQ", "US", 100)],
  };
  const currentAssets = [createManualCashAsset({
    quantity: 100,
    price: 10_000,
    targetWeight: 100,
    targetEvaluationAmount: 1_000_000,
  })];
  const comparison = createComparisonPortfolios(
    [storedActive, storedOther],
    "active",
    currentAssets,
    OFFICIAL_BASELINE_SETTINGS,
  );
  const active = comparison.find((item) => item.id === "active");
  const other = comparison.find((item) => item.id === "other");
  const detail = buildStep3MonthlyBaselineDetail({
    portfolio: storedActive,
    settings: OFFICIAL_BASELINE_SETTINGS,
    assets: currentAssets,
  });

  assert.deepEqual(active.assets.map((asset) => asset.ticker), ["CASH"]);
  assert.deepEqual(other.assets.map((asset) => asset.ticker), ["QQQ"]);
  assert.equal(active.result.expectedCagr, 2);
  assert.equal(other.result.expectedCagr, storedOther.assets[0].cagr);
  for (const field of RESULT_FIELDS) {
    assertResultFieldEqual("active override", field, active.result, detail);
  }
});

test("Step 3 detail, reports, and print-PDF input share user-facing values", () => {
  for (const fixture of matrix) {
    const portfolio = getPortfolio(fixture.id);
    const result = getStep3(fixture.id);
    const html = renderToStaticMarkup(
      React.createElement(DetailPanel, detailProps(fixture, portfolio, result)),
    );
    assert.doesNotMatch(html, INVALID_USER_VALUE, fixture.id);
    assert.doesNotMatch(html, INTERNAL_RESULT_TEXT, fixture.id);
    if (result.ready) {
      assert.match(html, /선택 포트폴리오 상세 분석/, fixture.id);
      assert.ok(html.includes(fixture.name), fixture.id);
      assert.ok(html.includes(`${Number(result.expectedCagr).toFixed(2)}%`), fixture.id);
      assert.ok(html.includes(Number(result.expectedBeta).toFixed(2)), fixture.id);
      assert.ok(html.includes(`${Number(result.simpleMdd).toFixed(2)}%`), fixture.id);
      assert.match(html, /연차별 예상 성과/, fixture.id);
    } else {
      assert.match(html, /기준 계산 보류/, fixture.id);
      assert.doesNotMatch(html, /연차별 예상 성과|포트폴리오 종합 진단/, fixture.id);
    }
  }

  const cashFixture = matrix.find((item) => item.id === "special-cash-only");
  const cashHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(cashFixture, getPortfolio(cashFixture.id), getStep3(cashFixture.id)),
  ));
  assert.match(
    cashHtml,
    /<tr><td>CASH<\/td>[\s\S]*?<td>2\.00<\/td>[\s\S]*?<td title="일반 배당">0\.00<\/td><\/tr>/,
  );

  const ordinaryFixture = matrix.find((item) => item.id === "special-ordinary-dividend");
  const ordinaryHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(ordinaryFixture, getPortfolio(ordinaryFixture.id), getStep3(ordinaryFixture.id)),
  ));
  assert.match(ordinaryHtml, /배당률/);

  const mixedFixture = matrix.find((item) => item.id === "special-mixed-distribution");
  const mixedHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(mixedFixture, getPortfolio(mixedFixture.id), getStep3(mixedFixture.id)),
  ));
  assert.match(mixedHtml, /현금흐름|현금수익률/);

  const leverageFixture = matrix.find((item) => item.id === "special-leverage-confirm");
  const leverageHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(leverageFixture, getPortfolio(leverageFixture.id), getStep3(leverageFixture.id)),
  ));
  assert.match(leverageHtml, /레버리지·인버스 위험 확인/);

  const emptyFixture = matrix.find((item) => item.id === "special-empty-row");
  const emptyHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(emptyFixture, getPortfolio(emptyFixture.id), getStep3(emptyFixture.id)),
  ));
  assert.doesNotMatch(emptyHtml, /<td>-<\/td><td>-<\/td><td>-<\/td>/);

  const zeroFixture = matrix.find((item) => item.id === "special-zero-weight");
  const zeroHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(zeroFixture, getPortfolio(zeroFixture.id), getStep3(zeroFixture.id)),
  ));
  assert.match(zeroHtml, /SCHD/);

  const targetValueFixture = matrix.find((item) => item.id === "special-target-value-only");
  const targetValueResult = getStep3(targetValueFixture.id);
  const targetValueHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(targetValueFixture, getPortfolio(targetValueFixture.id), targetValueResult),
  ));
  assert.match(targetValueHtml, /<tr><td>QQQ<\/td>[\s\S]*?<td>30,000,000<\/td><td>60\.00%<\/td>/);
  assert.match(targetValueHtml, /<tr><td>SCHD<\/td>[\s\S]*?<td>20,000,000<\/td><td>40\.00%<\/td>/);
  const targetWeights = targetValueFixture.assets.map((asset) =>
    getAssetEvaluationWeight(asset, targetValueResult.totalAssetValue)
  );
  assert.equal(targetWeights.reduce((sum, weight) => sum + weight, 0), 100);
  assert.equal(getAssetEvaluationValue({ quantity: 2, price: 100, targetEvaluationAmount: 999 }), 200);
  assert.equal(getAssetEvaluationValue({ quantity: 0, price: 0, targetEvaluationAmount: 999 }), 999);
  assert.equal(getAssetEvaluationValue({ quantity: 0, price: 0, targetEvaluationAmount: Infinity }), 0);
  const targetValueReport = createPortfolioReportText(
    reportInput(targetValueFixture, getPortfolio(targetValueFixture.id), targetValueResult),
  );
  assert.match(targetValueReport, /QQQ \/ [^\n]+ \/ 평가금액 30,000,000원 \/ 비중 60\.00%/);
  assert.match(targetValueReport, /SCHD \/ [^\n]+ \/ 평가금액 20,000,000원 \/ 비중 40\.00%/);
  for (const text of [targetValueHtml, targetValueReport]) {
    assert.doesNotMatch(text, /30,000,000원?[^\n<]*(?:NaN|undefined)/);
    assert.doesNotMatch(text, /20,000,000원?[^\n<]*(?:NaN|undefined)/);
  }

  for (const fixture of [
    ordinaryFixture,
    mixedFixture,
    leverageFixture,
    emptyFixture,
    matrix.find((item) => item.id === "special-denied"),
  ]) {
    const portfolio = getPortfolio(fixture.id);
    const result = getStep3(fixture.id);
    const input = reportInput(fixture, portfolio, result);
    const report = createPortfolioReportText(input);
    const summary = createReportSummaryText(input);
    for (const text of [report, summary]) {
      assert.ok(
        text.includes(`포트폴리오명: ${fixture.name}`) ||
        text.includes(`포트폴리오: ${fixture.name}`),
      );
      assert.match(text, new RegExp(`계산 상태: ${result.ready ? "계산 완료" : "기준 계산 보류"}`));
      assert.doesNotMatch(text, INVALID_USER_VALUE);
      assert.doesNotMatch(text, INTERNAL_RESULT_TEXT);
      if (result.ready) {
        assert.ok(text.includes(`${Number(result.expectedCagr).toFixed(2)}%`));
        assert.ok(text.includes(`${Number(result.simpleMdd).toFixed(2)}%`));
        assert.ok(text.includes(`${formatNumber(result.futureValue)}원`));
        assert.ok(text.includes(`${formatNumber(result.inflationAdjustedFutureValue)}원`));
      }
    }
    if (fixture.id === "special-leverage-confirm") {
      assert.match(report, /위험 확인: TQQQ/);
    }
    if (fixture.id === "special-mixed-distribution") {
      assert.match(report, /현금분배율/);
    }
    if (fixture.id === "special-empty-row") {
      assert.doesNotMatch(report, /^- \/ - \/ 평가금액/m);
    }
  }

  const hookSource = fs.readFileSync(
    new URL("../src/components/portfolio/hooks/usePortfolioSimulator.js", import.meta.url),
    "utf8",
  );
  assert.match(hookSource, /function saveReportPdf\(\)\s*\{\s*window\.print\(\);\s*\}/);

  const optionWithEmpty = {
    id: "option-with-empty",
    name: "옵션 분배 + 빈 행",
    assets: [createCatalogAsset("QYLG", "US", 100), emptyAssetRow()],
  };
  const [optionComparison] = createInsightComparisonPortfolios(
    createRankedComparisonPortfolios(
      createComparisonPortfolios(
        [optionWithEmpty],
        "",
        [],
        OFFICIAL_BASELINE_SETTINGS,
      ),
    ),
  );
  const optionResult = buildStep3MonthlyBaselineDetail({
    portfolio: optionWithEmpty,
    settings: OFFICIAL_BASELINE_SETTINGS,
  });
  const optionHtml = renderToStaticMarkup(React.createElement(
    DetailPanel,
    detailProps(optionWithEmpty, optionComparison, optionResult),
  ));
  const optionReport = createPortfolioReportText(
    reportInput(optionWithEmpty, optionComparison, optionResult),
  );
  const optionCompareHtml = renderCompare([optionComparison]);
  for (const text of [optionHtml, optionReport, optionCompareHtml]) {
    assert.match(text, /현금분배율/);
    assert.doesNotMatch(text, /예상 현금수익률/);
  }
  assert.doesNotMatch(optionHtml, /<td>-<\/td><td>-<\/td><td>-<\/td>/);
  assert.doesNotMatch(optionReport, /^- \/ - \/ 평가금액/m);
});

test("all-empty, partial, duplicate, and deny states stay distinct and fail closed", () => {
  const allEmpty = buildStep3MonthlyBaselineDetail({
    portfolio: { id: "all-empty", assets: [emptyAssetRow(), emptyAssetRow()] },
    settings: OFFICIAL_BASELINE_SETTINGS,
  });
  assert.equal(allEmpty.status, "blocked");
  assert.match(allEmpty.blockReasons.join("|"), /missing_assets/);

  const blockedExpectations = {
    "special-denied": /제거하거나 이용 가능한 자산으로 교체/,
    "special-partial-row": /PARTIAL.*완성되지 않았/,
    "special-duplicate": /US:QQQ.*중복/,
  };
  const blockedTickers = {
    "special-denied": /0000D0/,
    "special-partial-row": /PARTIAL/,
    "special-duplicate": /US:QQQ/,
  };
  for (const [id, expected] of Object.entries(blockedExpectations)) {
    const fixture = matrix.find((item) => item.id === id);
    const result = getStep3(id);
    const html = renderToStaticMarkup(
      React.createElement(DetailPanel, detailProps(fixture, getPortfolio(id), result)),
    );
    assert.match(html, expected, id);
    assert.doesNotMatch(html, MISLEADING_BLOCKED_COPY, id);
    const report = createPortfolioReportText(
      reportInput(fixture, getPortfolio(id), result),
    );
    assert.doesNotMatch(report, MISLEADING_BLOCKED_COPY, id);
    assert.match(report, blockedTickers[id], id);
  }
});

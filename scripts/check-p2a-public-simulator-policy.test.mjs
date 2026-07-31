import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import test, { after, before } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hookSource = read("../src/components/portfolio/hooks/usePortfolioSimulator.js");
const tableSource = read("../src/components/portfolio/components/AssetInputTable.jsx");
const detailSource = read("../src/components/portfolio/components/DetailPanel.jsx");
const compareSource = read("../src/components/portfolio/components/ComparePanel.jsx");
const reportSource = read("../src/components/portfolio/utils/portfolioReports.js");
const presetSource = read("../src/components/portfolio/constants.js");
const mbtiSource = read("../src/components/InvestmentMbtiPage.jsx");
const policySource = read("../docs/portfolio-ml/FINPLE_SIMULATOR_VALUATION_AND_DISPLAY_POLICY.md");
const legacyFixture = JSON.parse(read("../src/components/portfolio/fixtures/legacyQuantityPricePortfolioFixture.json"));

let vite;
let AssetInputTable;
let DetailAssetTable;
let loader;
let factory;
let formatters;
let baseline;
let reports;
let createManualCashAsset;

function rowCells(html, ticker) {
  const row = html.split("</tr>").find((item) =>
    item.includes(`>${ticker}<`) || item.includes(`value="${ticker}"`)
  );
  assert.ok(row, `${ticker} row`);
  return [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) =>
    match[1].replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ").trim()
  );
}

function createCatalogAsset(ticker, targetWeight, overrides = {}) {
  const candidate = loader.findScreenerCandidateByTicker(ticker, "US");
  assert.ok(candidate, ticker);
  return loader.hydrateAssetFromScreenerCandidate({
    ...candidate,
    id: `p2a-${ticker}`,
    quantity: 0,
    price: 0,
    targetWeight,
    targetEvaluationAmount: 50_000_000 * targetWeight / 100,
    ...overrides,
  });
}

function renderStep1(assets) {
  return renderToStaticMarkup(React.createElement(AssetInputTable, {
    assets,
    targetWeightDrafts: {},
    simulationStartValue: 50_000_000,
    isEmptyAssetRow: formatters.isEmptyAssetRow,
    isAutoAsset: () => true,
    formatDecimal: formatters.formatDecimal,
    updateAsset: () => true,
    updateTargetWeightDraft() {},
    resolveTickerCandidate() {},
    moveAsset() {},
    removeAsset() {},
  }));
}

function renderStep3(assets) {
  return renderToStaticMarkup(React.createElement(DetailAssetTable, {
    assets,
    totalAssetValue: 50_000_000,
    simulationStartValue: 50_000_000,
    formatPercent: formatters.formatPercent,
    formatDecimal: formatters.formatDecimal,
    formatWholeNumber: formatters.formatNumber,
  }));
}

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  const [tableModule, detailModule, loaderModule, factoryModule, formatterModule, baselineModule, reportModule, cashModule] = await Promise.all([
    vite.ssrLoadModule("/src/components/portfolio/components/AssetInputTable.jsx"),
    vite.ssrLoadModule("/src/components/portfolio/components/DetailAssetTable.jsx"),
    vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioFactory.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioFormatters.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/monthlyBaselineEngine.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioReports.js"),
    vite.ssrLoadModule("/src/data/tickers/manualCashAsset.js"),
  ]);
  AssetInputTable = tableModule.default;
  DetailAssetTable = detailModule.default;
  loader = loaderModule;
  factory = factoryModule;
  formatters = formatterModule;
  baseline = baselineModule;
  reports = reportModule;
  createManualCashAsset = cashModule.createManualCashAsset;
  await loader.loadScreenerCandidateRuntime();
});

after(async () => {
  await vite?.close();
});

test("public simulator policy surface stays quote-free and documented", () => {
  assert.doesNotMatch(hookSource, /fetchAssetDataByTicker|fetchAssetDataBatch|pendingTemplateAutoLookupRef/);
  assert.doesNotMatch(tableSource, />수량<|>현재가 \(원, KRW\)<|>조회</);
  assert.doesNotMatch(read("../src/components/portfolio/components/SettingsPanel.jsx"), />전체 조회</);
  assert.match(presetSource, /hydrateAssetFromScreenerCandidate/);
  assert.match(mbtiSource, /hydrateAssetFromScreenerCandidate/);
  assert.doesNotMatch(mbtiSource, /scheduleSimulatorAutoLookup|전체 조회/);
  assert.match(hookSource, /startValue \* targetWeight \/ 100/);
  for (const contract of [
    "목표비중 기반 포트폴리오 분석 도구",
    "외부 현재가 API",
    "시작 평가금액 × 목표비중 ÷ 100",
    "quantity",
    "price",
    "개인계좌 KIS",
    "확인 필요",
    "Step 1, Step 2, Step 3",
    "canonical CSV 갱신으로 변경되지 않는다",
  ]) assert.match(policySource, new RegExp(contract));

  const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { encoding: "utf8" }).trim();
  const changedFiles = execFileSync("git", ["diff", "--name-only", base], { encoding: "utf8" });
  assert.doesNotMatch(changedFiles, /(^|\/)(?:server\/.*(?:kis|order|quote)|[^\n]*trading[^\n]*)(?:$|\n)/i);
});

test("legacy quantity-price snapshots migrate once at portfolio load", () => {
  const state = factory.loadPortfolioState(legacyFixture);
  const [qqq, schd] = state.activePortfolio.assets;
  assert.deepEqual([qqq.targetWeight, schd.targetWeight], [40, 60]);
  assert.deepEqual([qqq.targetEvaluationAmount, schd.targetEvaluationAmount], [20_000_000, 30_000_000]);
  assert.deepEqual([qqq.quantity, qqq.price, schd.quantity, schd.price], [10, 2_000_000, 20, 1_500_000]);
  assert.equal(qqq.id, "legacy-qqq");
  assert.equal(qqq.name, "User QQQ name");
  assert.equal(qqq.sortOrder, 3);
  assert.equal(qqq.updatedAt, "2026-06-07T08:09:10.000Z");
  assert.equal(qqq.customAssetField, "keep-qqq-field");
  assert.equal(state.activePortfolio.customPortfolioField, "keep-portfolio-field");

  const hydrated = loader.hydratePortfolioFromActiveCatalog(state.activePortfolio);
  const result = baseline.buildMonthlyBaselineProjection({
    portfolioId: hydrated.id,
    settings: state.globalSettings,
    assets: hydrated.assets,
  });
  assert.equal(result.status, "ready");

  const invalidFixture = structuredClone(legacyFixture);
  invalidFixture.portfolioList[0].assets[1].price = 0;
  const invalidState = factory.loadPortfolioState(invalidFixture);
  const invalidHydrated = loader.hydratePortfolioFromActiveCatalog(invalidState.activePortfolio);
  const invalidResult = baseline.buildMonthlyBaselineProjection({
    settings: invalidState.globalSettings,
    assets: invalidHydrated.assets,
  });
  assert.equal(invalidState.activePortfolio.assets[0].targetWeight, null);
  assert.equal(invalidResult.status, "blocked");
});

test("shared read-only formatter keeps zero, missing, provider error, and input zero distinct", () => {
  assert.equal(formatters.formatReadOnlyMetric(0), "-");
  assert.equal(formatters.formatReadOnlyMetric(null, { missingText: "확인 중" }), "확인 중");
  assert.equal(formatters.formatReadOnlyMetric(null, { status: "provider_error" }), "확인 필요");
  assert.equal(formatters.formatReadOnlyMetric(2), "2.00");
  assert.match(tableSource, /return "0\.00"/);
  for (const source of [tableSource, detailSource, compareSource, reportSource]) {
    assert.match(source, /formatReadOnlyMetric/);
  }
});

test("BITO, QYLD, zero metrics, and provider errors match between Step 1 and Step 3", () => {
  const bito = createCatalogAsset("BITO", 50);
  const qyld = createCatalogAsset("QYLD", 50);
  const step1 = renderStep1([bito, qyld]);
  const step3 = renderStep3([bito, qyld]);
  for (const asset of [bito, qyld]) {
    const expected = Number(asset.cashDistributionYieldTtm ?? asset.trailingDistributionYield).toFixed(2);
    assert.equal(rowCells(step1, asset.ticker).at(-1), `${expected}%`);
    assert.equal(rowCells(step3, asset.ticker).at(-1), expected);
  }
  assert.doesNotMatch(`${step1}${step3}`, /분배 별도/);

  const providerError = {
    ...bito,
    id: "p2a-provider-error",
    distributionDataQualityStatus: "provider_event_error",
  };
  assert.equal(rowCells(renderStep1([providerError]), "BITO").at(-1), "확인 필요");
  assert.equal(rowCells(renderStep3([providerError]), "BITO").at(-1), "확인 필요");
  assert.match(reports.describeAssetDistribution(providerError), /현금분배율 확인 필요/);

  const cash = createManualCashAsset({
    id: "p2a-cash",
    targetWeight: 50,
    targetEvaluationAmount: 25_000_000,
  });
  const gld = createCatalogAsset("GLD", 50);
  assert.deepEqual(rowCells(renderStep1([cash, gld]), "CASH").slice(-4), ["2.00", "-", "-", "-"]);
  assert.equal(rowCells(renderStep1([cash, gld]), "GLD").at(-1), "-");
  assert.match(reports.describeAssetDistribution(cash), /일반 배당률 -/);
});

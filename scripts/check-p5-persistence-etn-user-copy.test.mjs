import assert from "node:assert/strict";
import fs from "node:fs";
import test, { after, before } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { createPortfolioApiSnapshot } from "../server/src/services/portfolioPersistenceModel.js";

import {
  formatUserFacingBaselineBlockReasons,
} from "../src/components/portfolio/utils/baselineBlockReasonLabels.js";
import {
  createPortfolioReportText,
} from "../src/components/portfolio/utils/portfolioReports.js";
import {
  STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  STEP114_2G_FIXTURE_EXPECTED_OUTPUT_HASH,
  STEP114_2G_FIXTURE_REVIEW_ASSETS,
  STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2G_FIXTURE_REVIEW_SETTINGS,
  STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
  STEP114_2G_PROBABILITY_FIXTURE_RESULT,
} from "../src/components/portfolio/fixtures/probabilityScenarioResultFixture.js";
import {
  STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT,
  STEP114_2H_FIXTURE_EXPECTED_INPUT_HASHES,
  STEP114_2H_FIXTURE_EXPECTED_OUTPUT_HASHES,
  STEP114_2H_FIXTURE_REVIEW_ASSETS,
  STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2H_FIXTURE_REVIEW_SETTINGS,
  STEP114_2H_PRECOMPUTED_BASELINE_FIXTURE,
  STEP114_2H_SCENARIO_FIXTURE_RESULTS,
} from "../src/components/portfolio/fixtures/externalShockScenarioResultFixture.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const canonicalCsv = read("../src/data/tickers/finple_app_candidates_v2.csv");
const screenerSource = read("../src/components/ScreenerPage.jsx");
const aiPanelSource = read("../src/components/portfolio/components/AiAnalysisPanel.jsx");
const forbiddenUserToken = /canonical(?:_v2|_catalog)?|app-export|production_app_export|overlay|fixture|review-only|internal_preview|provider_event_error|missing_metric_lineage|pipeline_version|policy_version|approval|source sha|sha-256|\bhash\b|reasoncode|blockreasons|sourceid|runtimemode|rowencoding|manifest|shard|proxy_aware_v2/i;

let vite;
let factory;
let persistence;
let screener;
let ProbabilityAnalysisPanel;
let ExternalShockAnalysisPanel;

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  [factory, persistence, screener] = await Promise.all([
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioFactory.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioPersistenceContract.js"),
    vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
  ]);
  ProbabilityAnalysisPanel = (await vite.ssrLoadModule(
    "/src/components/portfolio/components/ProbabilityAnalysisPanel.jsx",
  )).default;
  ExternalShockAnalysisPanel = (await vite.ssrLoadModule(
    "/src/components/portfolio/components/ExternalShockAnalysisPanel.jsx",
  )).default;
});

after(async () => {
  await vite?.close();
});

function publicText(html) {
  const attributes = [...html.matchAll(/\b(?:aria-label|title)="([^"]*)"/g)]
    .map((match) => match[1]);
  const text = html.replace(/<[^>]+>/g, " ");
  return `${text} ${attributes.join(" ")}`
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ");
}

function legacySnapshot(overrides = {}) {
  return {
    activePortfolioId: "p5-legacy",
    globalSettings: { startValue: 40_000_000, monthlyCashFlow: 0, years: 10 },
    portfolios: [{
      id: "p5-legacy",
      name: "P5 QA",
      userNote: "사용자 메모",
      mbtiType: "INTJ",
      customPortfolioField: "keep-portfolio",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-02T00:00:00.000Z",
      sortOrder: 3,
      assets: [
        {
          id: "p5-qqq",
          market: "US",
          ticker: "QQQ",
          name: "사용자 QQQ 이름",
          quantity: 100,
          price: 240_000,
          userNote: "QQQ 메모",
          customAssetField: "keep-asset",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-02T00:00:00.000Z",
          sortOrder: 0,
        },
        {
          id: "p5-schd",
          market: "US",
          ticker: "SCHD",
          name: "사용자 SCHD 이름",
          quantity: 200,
          price: 80_000,
          sortOrder: 1,
        },
      ],
    }],
    ...overrides,
  };
}

test("canonical asset types remain lossless and unsupported types fail closed", () => {
  const rawCounts = new Map();
  for (const line of canonicalCsv.trim().split(/\r?\n/).slice(1)) {
    const match = line.match(/^(KR|US),[^,]*,[^,]*,(?:"(?:[^"]|"")*"|[^,]*),(ETF|stock),/);
    assert.ok(match, `unparsed canonical row: ${line.slice(0, 40)}`);
    const key = `${match[1]}:${match[2]}`;
    rawCounts.set(key, (rawCounts.get(key) || 0) + 1);
  }
  const runtime = screener.loadScreenerCandidatesFromCsv(canonicalCsv);
  const runtimeCounts = new Map();
  for (const item of runtime) {
    const key = `${item.market}:${item.assetType}`;
    runtimeCounts.set(key, (runtimeCounts.get(key) || 0) + 1);
  }

  assert.equal(runtime.length, 6029);
  assert.deepEqual(Object.fromEntries(runtimeCounts), Object.fromEntries(rawCounts));
  assert.deepEqual(Object.fromEntries(rawCounts), {
    "KR:stock": 2143,
    "KR:ETF": 857,
    "US:stock": 1407,
    "US:ETF": 1622,
  });
  assert.equal(runtime.some((item) => item.assetType === "ETN"), false);
  const unknown = screener.normalizeScreenerCandidate({ market: "KR", ticker: "000001", assetType: "future" });
  assert.equal(unknown.assetType, "unknown");
  assert.equal(unknown.type, "unknown");
  assert.equal(unknown.portfolioEligible, false);
  assert.equal(unknown.portfolioAddPolicy, "deny");
});

test("persistence migration matrix is idempotent and preserves user fields", () => {
  const migrated = persistence.normalizePortfolioPersistenceSnapshot(legacySnapshot());
  const [qqq, schd] = migrated.portfolios[0].assets;
  assert.deepEqual([qqq.targetWeight, schd.targetWeight], [60, 40]);
  assert.deepEqual([qqq.targetEvaluationAmount, schd.targetEvaluationAmount], [24_000_000, 16_000_000]);
  assert.deepEqual([qqq.quantity, qqq.price], [100, 240_000]);
  assert.equal(qqq.name, "사용자 QQQ 이름");
  assert.equal(qqq.userNote, "QQQ 메모");
  assert.equal(qqq.customAssetField, "keep-asset");
  assert.equal(migrated.portfolios[0].userNote, "사용자 메모");
  assert.equal(migrated.portfolios[0].mbtiType, "INTJ");
  assert.equal(migrated.portfolios[0].customPortfolioField, "keep-portfolio");
  assert.equal(migrated.portfolios[0].sortOrder, 3);
  assert.equal(migrated.activePortfolioId, "p5-legacy");
  assert.deepEqual(persistence.normalizePortfolioPersistenceSnapshot(migrated), migrated);

  const current = legacySnapshot();
  current.portfolios[0].assets[0].targetWeight = 55;
  const currentNormalized = persistence.normalizePortfolioPersistenceSnapshot(current);
  assert.equal(currentNormalized.portfolios[0].assets[0].targetWeight, 55);
  assert.equal(currentNormalized.portfolios[0].assets[1].targetWeight, null);

  for (const field of ["quantity", "price"]) {
    const invalid = legacySnapshot();
    invalid.portfolios[0].assets[0][field] = "not-a-number";
    const normalized = persistence.normalizePortfolioPersistenceSnapshot(invalid);
    assert.equal(normalized.portfolios[0].assets[0][field], 0);
    assert.equal(normalized.portfolios[0].assets[0].targetWeight, null);
    assert.equal(JSON.stringify(normalized).includes("NaN"), false);
  }

  const zero = legacySnapshot();
  zero.portfolios[0].assets.forEach((asset) => { asset.quantity = 0; });
  assert.equal(
    persistence.normalizePortfolioPersistenceSnapshot(zero).portfolios[0].assets[0].targetWeight,
    null,
  );
});

test("server, backup, reload, stale CASH, KR ticker, and duplicate paths share the contract", () => {
  const canonical = persistence.normalizePortfolioPersistenceSnapshot(legacySnapshot());
  const serverSnapshot = createPortfolioApiSnapshot(
    legacySnapshot().portfolios,
    {
      activePortfolioId: "p5-legacy",
      globalSettings: legacySnapshot().globalSettings,
    },
  );
  assert.deepEqual(serverSnapshot.portfolios[0].assets.map((asset) => asset.targetWeight), [60, 40]);
  const backupRestore = factory.loadPortfolioState({
    portfolioList: canonical.portfolios,
    activePortfolioId: canonical.activePortfolioId,
    globalSettings: canonical.globalSettings,
  });
  const reload = factory.loadPortfolioState({
    portfolioList: backupRestore.portfolioList,
    activePortfolioId: backupRestore.activePortfolioId,
    globalSettings: backupRestore.globalSettings,
  });
  assert.deepEqual(
    reload.activePortfolio.assets.map(({ ticker, targetWeight, targetEvaluationAmount }) => ({ ticker, targetWeight, targetEvaluationAmount })),
    backupRestore.activePortfolio.assets.map(({ ticker, targetWeight, targetEvaluationAmount }) => ({ ticker, targetWeight, targetEvaluationAmount })),
  );

  const cashState = factory.loadPortfolioState({
    portfolioList: [{
      id: "cash",
      name: "P5 QA CASH",
      assets: [{
        id: "cash-asset",
        market: "CASH",
        ticker: "CASH",
        assetType: "CASH",
        dataSource: "manual-cash",
        expectedCagr: 2.5,
        cagr: 2.5,
        targetWeight: 100,
        targetEvaluationAmount: 40_000_000,
        quantity: 7,
        price: 10_000,
        userNote: "현금 메모",
      }],
    }],
    activePortfolioId: "cash",
    globalSettings: { startValue: 40_000_000 },
  });
  const cash = cashState.activePortfolio.assets[0];
  assert.equal(cash.expectedCagr, 2);
  assert.equal(cash.cagr, 2);
  assert.equal(cash.dataSource, "finple_manual_cash_reference");
  assert.equal(cash.userNote, "현금 메모");
  assert.deepEqual([cash.quantity, cash.price], [7, 10_000]);

  const kr = factory.normalizeAsset({ market: "KR", ticker: "000250", assetType: "stock" });
  assert.equal(kr.ticker, "000250");

  const original = structuredClone(canonical.portfolios[0]);
  const duplicate = factory.duplicatePortfolio(original);
  assert.notEqual(duplicate.id, original.id);
  assert.equal(duplicate.userNote, original.userNote);
  assert.equal(duplicate.mbtiType, original.mbtiType);
  assert.equal(duplicate.customPortfolioField, original.customPortfolioField);
  assert.equal(duplicate.assets[0].id, original.assets[0].id);
  assert.equal(duplicate.assets[0].name, original.assets[0].name);
  assert.equal(duplicate.assets[0].targetWeight, original.assets[0].targetWeight);
  assert.deepEqual(canonical.portfolios[0], original);
});

test("unknown and denied identities keep actionable user-facing block reasons", () => {
  const labels = formatUserFacingBaselineBlockReasons([
    "missing_metric_lineage:US:UNKNOWN",
    "portfolio_add_denied:KR:000250",
    "provider_event_error:US:QYLD",
    "unsupported_pipeline_version:US:OLD",
  ]);
  const text = labels.join(" ");
  assert.match(text, /분석에 필요한 자산 데이터가 충분하지 않습니다/);
  assert.match(text, /포트폴리오에 사용할 수 없는 자산/);
  assert.match(text, /현금분배 정보를 확인할 수 없습니다/);
  assert.match(text, /현재 분석 기준에서 지원되지 않는 자산/);
  assert.doesNotMatch(text, forbiddenUserToken);

  const report = createPortfolioReportText({
    activePortfolio: { name: "P5 QA" },
    detailReport: {},
    result: {
      status: "blocked",
      ready: false,
      blockReasons: ["missing_metric_lineage:US:UNKNOWN", "portfolio_add_denied:KR:000250"],
    },
    assets: [{ market: "US", ticker: "UNKNOWN", name: "알 수 없는 자산", targetWeight: 100 }],
  });
  assert.match(report, /US:UNKNOWN|UNKNOWN/);
  assert.doesNotMatch(report, forbiddenUserToken);
});

test("general-user SSR surfaces and AI request context hide implementation terminology", () => {
  const probabilityHtml = renderToStaticMarkup(React.createElement(ProbabilityAnalysisPanel, {
    activePortfolio: { ...STEP114_2G_FIXTURE_REVIEW_PORTFOLIO, name: "P5 QA" },
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2G_FIXTURE_REVIEW_SETTINGS,
    result: STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
    fixtureBaselineResult: STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
    scenarioResult: STEP114_2G_PROBABILITY_FIXTURE_RESULT,
    scenarioLoadStatus: "ready",
    expectedInputHash: STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
    expectedOutputHash: STEP114_2G_FIXTURE_EXPECTED_OUTPUT_HASH,
    enableFixtureReview: true,
  }));
  const externalHtml = renderToStaticMarkup(React.createElement(ExternalShockAnalysisPanel, {
    activePortfolio: { ...STEP114_2H_FIXTURE_REVIEW_PORTFOLIO, name: "P5 QA" },
    assets: STEP114_2H_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2H_FIXTURE_REVIEW_SETTINGS,
    result: STEP114_2H_PRECOMPUTED_BASELINE_FIXTURE,
    fixtureBaselineResult: STEP114_2H_PRECOMPUTED_BASELINE_FIXTURE,
    scenarioResult: STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT,
    scenarioResults: STEP114_2H_SCENARIO_FIXTURE_RESULTS,
    expectedInputHash: STEP114_2H_FIXTURE_EXPECTED_INPUT_HASHES,
    expectedOutputHash: STEP114_2H_FIXTURE_EXPECTED_OUTPUT_HASHES,
    enableFixtureReview: true,
    isEmptyAssetRow: () => false,
  }));
  for (const html of [probabilityHtml, externalHtml]) {
    assert.doesNotMatch(publicText(html), forbiddenUserToken);
  }
  assert.doesNotMatch(screenerSource, /Canonical 국내|Internal Preview|review-only 지표/);
  assert.doesNotMatch(aiPanelSource, /stale identity context|blocked context|review-only, fixture|reasonCategory\}\./);
});

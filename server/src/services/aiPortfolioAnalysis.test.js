import assert from "node:assert/strict";
import test from "node:test";

import { normalizePortfolioAnalysisRequest } from "../schemas/aiPortfolioAnalysisSchema.js";
import { runPortfolioAnalysis } from "./aiPortfolioAnalysisService.js";
import { validateAiPortfolioAnalysisOutput } from "./aiOutputValidator.js";

function validRequest() {
  return {
    portfolioId: "portfolio-test",
    metrics: {
      cagr: 8.7,
      beta: 0.83,
      mdd: -27.1,
      calmar: 0.32,
      dividendYield: 2.1,
      futureValue: 854000000,
      inflationAdjustedFutureValue: 574000000,
    },
    assets: [
      {
        ticker: "QQQ",
        market: "US",
        weight: 40,
        cagr: 12,
        beta: 1.1,
        mdd: -35,
        dividendYield: 0.6,
        dataYears: 10,
        dataStatus: "ready_with_metrics",
      },
      {
        ticker: "BND",
        market: "US",
        weight: 60,
        cagr: 3,
        beta: 0.2,
        mdd: -12,
        dividendYield: 3.2,
        dataYears: 10,
        dataStatus: "ready_with_metrics",
      },
    ],
  };
}

test("runPortfolioAnalysis returns deterministic mock output", async () => {
  process.env.FINPLE_AI_ANALYSIS_MODE = "mock";
  process.env.FINPLE_AI_ANALYSIS_PROVIDER = "none";
  const payload = normalizePortfolioAnalysisRequest(validRequest());

  const first = await runPortfolioAnalysis(payload);
  const second = await runPortfolioAnalysis(payload);

  assert.equal(first.analysisVersion, "ai-analysis-mock-v1");
  assert.equal(first.generatedAt, "2026-06-25T00:00:00.000Z");
  assert.equal(first.provider, "none");
  assert.equal(first.diversification.nominalAssetCount, 2);
  assert.deepEqual(first, second);
});

test("normalizePortfolioAnalysisRequest rejects invalid numeric input", () => {
  assert.throws(
    () => normalizePortfolioAnalysisRequest({
      portfolioId: "bad",
      assets: [
        { ticker: "QQQ", market: "US", weight: 130, beta: 1.1, mdd: -30 },
      ],
    }),
    /AI 분석 요청값/
  );
});

test("validateAiPortfolioAnalysisOutput rejects forbidden language", () => {
  const payload = normalizePortfolioAnalysisRequest(validRequest());
  const output = {
    analysisVersion: "ai-analysis-mock-v1",
    portfolioId: payload.portfolioId,
    generatedAt: "2026-06-25T00:00:00.000Z",
    mode: "mock",
    provider: "none",
    dataQuality: { level: "good", summary: "ok", warnings: [] },
    portfolioProfile: { title: "bad", summary: "매수 추천 표현" },
    diversification: { nominalAssetCount: 2, effectiveDiversificationLevel: "medium", summary: "ok" },
    riskFactors: [],
    assetRoles: [],
    limitations: [],
    disclaimer: "본 분석은 투자 권유가 아닌 참고자료입니다.",
  };

  assert.throws(
    () => validateAiPortfolioAnalysisOutput(output, payload),
    /출력 검증/
  );
});

test("validateAiPortfolioAnalysisOutput rejects generated numbers", () => {
  const payload = normalizePortfolioAnalysisRequest(validRequest());
  const output = {
    analysisVersion: "ai-analysis-mock-v1",
    portfolioId: payload.portfolioId,
    generatedAt: "2026-06-25T00:00:00.000Z",
    mode: "mock",
    provider: "none",
    dataQuality: { level: "good", score: 88, summary: "ok", warnings: [] },
    portfolioProfile: { title: "ok", summary: "ok" },
    diversification: { nominalAssetCount: 2, effectiveDiversificationLevel: "medium", summary: "ok" },
    riskFactors: [],
    assetRoles: [],
    limitations: [],
    disclaimer: "본 분석은 투자 권유가 아닌 참고자료입니다.",
  };

  assert.throws(
    () => validateAiPortfolioAnalysisOutput(output, payload),
    (error) => error.details?.some((detail) => detail.includes("numeric value"))
  );
});

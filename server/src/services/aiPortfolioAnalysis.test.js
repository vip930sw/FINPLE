import assert from "node:assert/strict";
import test from "node:test";

import { normalizePortfolioAnalysisRequest } from "../schemas/aiPortfolioAnalysisSchema.js";
import { runPortfolioAnalysis } from "./aiPortfolioAnalysisService.js";
import {
  getAiPortfolioAnalysisOutputContract,
  validateAiPortfolioAnalysisOutput,
} from "./aiOutputValidator.js";

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

test("runPortfolioAnalysis rejects live OpenAI mode without a server API key", async () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_MODE;
  const previousProvider = process.env.FINPLE_AI_ANALYSIS_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;

  process.env.FINPLE_AI_ANALYSIS_MODE = "live";
  process.env.FINPLE_AI_ANALYSIS_PROVIDER = "openai";
  delete process.env.OPENAI_API_KEY;

  try {
    const payload = normalizePortfolioAnalysisRequest(validRequest());
    await assert.rejects(
      () => runPortfolioAnalysis(payload),
      /OpenAI API key/
    );
  } finally {
    process.env.FINPLE_AI_ANALYSIS_MODE = previousMode;
    process.env.FINPLE_AI_ANALYSIS_PROVIDER = previousProvider;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
  }
});

test("runPortfolioAnalysis validates a live OpenAI provider response", async () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_MODE;
  const previousProvider = process.env.FINPLE_AI_ANALYSIS_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;

  process.env.FINPLE_AI_ANALYSIS_MODE = "live";
  process.env.FINPLE_AI_ANALYSIS_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "test-key";

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-key");

    const requestBody = JSON.parse(options.body);
    assert.equal(requestBody.text.format.type, "json_schema");
    assert.equal(requestBody.text.format.strict, true);
    assert.match(requestBody.instructions, /polite formal Korean honorific style/);
    assert.match(requestBody.instructions, /입니다/);
    assert.match(requestBody.instructions, /plain report-style endings/);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          dataQuality: {
            level: "good",
            summary: "입력된 계산값과 자산 정보가 분석에 필요한 최소 조건을 충족합니다.",
            warnings: [],
          },
          portfolioProfile: {
            title: "성장 자산과 현금흐름 자산이 함께 있는 포트폴리오",
            summary: "입력된 자산 구성은 성장 성격과 현금흐름 성격을 함께 설명할 수 있는 구조입니다.",
          },
          diversification: {
            nominalAssetCount: 2,
            effectiveDiversificationLevel: "medium",
            summary: "자산 수는 2개이며 QQQ와 BND로 역할이 나뉘어 있습니다.",
          },
          diagnosticSections: [
            {
              key: "structure",
              title: "구조 진단",
              summary: "성장 자산과 현금흐름 자산이 함께 배치된 구조입니다.",
              observations: [
                "QQQ는 성장 성격을 설명하는 축으로 해석됩니다.",
                "BND는 현금흐름 성격을 보완하는 축으로 해석됩니다.",
              ],
            },
            {
              key: "risk_balance",
              title: "위험 균형",
              summary: "성장 자산과 방어 성격 자산의 조합을 함께 점검합니다.",
              observations: [
                "성장 자산은 시장 국면에 따라 체감 변동성을 키울 수 있습니다.",
                "방어 성격 자산도 특정 구간에서는 완충 효과가 제한될 수 있습니다.",
              ],
            },
          ],
          riskFactors: [
            {
              code: "concentration",
              label: "핵심 자산 비중 점검",
              severity: "medium",
              evidence: ["BND 입력 비중 60%"],
            },
          ],
          assetRoles: [
            {
              ticker: "QQQ",
              market: "US",
              weight: 40,
              role: "growth",
              rationale: "QQQ는 입력된 성장 지표와 변동성 정보를 기준으로 성장 역할로 해석됩니다.",
            },
            {
              ticker: "BND",
              market: "US",
              weight: 60,
              role: "income",
              rationale: "BND는 입력된 배당률과 낮은 변동성 정보를 기준으로 현금흐름 역할로 해석됩니다.",
            },
          ],
          limitations: [
            "본 응답은 입력된 계산값과 자산 상태를 설명하는 용도입니다.",
            "미래 성과를 보장하지 않습니다.",
          ],
          disclaimer: "본 분석은 투자 권유가 아닌 참고자료입니다. 최종 판단은 사용자가 확인해야 합니다.",
        }),
      }),
    };
  };

  try {
    const payload = normalizePortfolioAnalysisRequest(validRequest());
    const output = await runPortfolioAnalysis(payload);

    assert.equal(output.analysisVersion, "ai-analysis-openai-v1");
    assert.equal(output.mode, "live");
    assert.equal(output.provider, "openai");
    assert.equal(output.assetRoles.length, 2);
  } finally {
    process.env.FINPLE_AI_ANALYSIS_MODE = previousMode;
    process.env.FINPLE_AI_ANALYSIS_PROVIDER = previousProvider;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
    globalThis.fetch = previousFetch;
  }
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
    diagnosticSections: [],
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
    diagnosticSections: [],
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

test("output contract snapshot keeps Step 4 response shape stable", () => {
  const contract = getAiPortfolioAnalysisOutputContract();

  assert.equal(contract.version, "ai-analysis-output-contract-v2");
  assert.deepEqual(contract.topLevelFields, [
    "analysisVersion",
    "portfolioId",
    "generatedAt",
    "mode",
    "provider",
    "inputHash",
    "dataQuality",
    "portfolioProfile",
    "diversification",
    "diagnosticSections",
    "riskFactors",
    "assetRoles",
    "limitations",
    "disclaimer",
  ]);
  assert.deepEqual(contract.enums.severity, ["low", "medium", "high"]);
  assert.equal(contract.maxTotalTextLength, 8500);
});

test("validateAiPortfolioAnalysisOutput rejects unexpected top-level fields", async () => {
  const payload = normalizePortfolioAnalysisRequest(validRequest());
  const output = await runPortfolioAnalysis(payload);

  assert.throws(
    () => validateAiPortfolioAnalysisOutput({ ...output, recommendation: "extra" }, payload),
    (error) => error.details?.some((detail) => detail.includes("recommendation"))
  );
});

test("validateAiPortfolioAnalysisOutput rejects ticker mentions outside input", async () => {
  const payload = normalizePortfolioAnalysisRequest(validRequest());
  const output = await runPortfolioAnalysis(payload);
  output.portfolioProfile.summary = "SPY와 함께 비교했다는 표현은 입력 밖 티커를 언급합니다.";

  assert.throws(
    () => validateAiPortfolioAnalysisOutput(output, payload),
    (error) => error.details?.some((detail) => detail.includes("SPY"))
  );
});

test("validateAiPortfolioAnalysisOutput rejects long generated text", async () => {
  const payload = normalizePortfolioAnalysisRequest(validRequest());
  const output = await runPortfolioAnalysis(payload);
  output.portfolioProfile.summary = "x".repeat(701);

  assert.throws(
    () => validateAiPortfolioAnalysisOutput(output, payload),
    (error) => error.details?.some((detail) => detail.includes("characters"))
  );
});

test("validateAiPortfolioAnalysisOutput rejects numeric hallucination in text", async () => {
  const payload = normalizePortfolioAnalysisRequest(validRequest());
  const output = await runPortfolioAnalysis(payload);
  output.portfolioProfile.summary = "향후 15% 상승 여력이 있다는 문장은 입력에 없는 숫자를 생성합니다.";

  assert.throws(
    () => validateAiPortfolioAnalysisOutput(output, payload),
    (error) => error.details?.some((detail) => detail.includes("output text contains numeric value"))
  );
});

test("validateAiPortfolioAnalysisOutput rejects incomplete asset role coverage", async () => {
  const payload = normalizePortfolioAnalysisRequest(validRequest());
  const output = await runPortfolioAnalysis(payload);
  output.assetRoles = output.assetRoles.slice(0, 1);

  assert.throws(
    () => validateAiPortfolioAnalysisOutput(output, payload),
    (error) => error.details?.some((detail) => detail.includes("must include input asset"))
  );
});

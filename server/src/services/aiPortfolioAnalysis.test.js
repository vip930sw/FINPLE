import assert from "node:assert/strict";
import test from "node:test";

import { normalizePortfolioAnalysisRequest } from "../schemas/aiPortfolioAnalysisSchema.js";
import { runPortfolioAnalysis } from "./aiPortfolioAnalysisService.js";
import {
  getAiPortfolioAnalysisOutputContract,
  validateAiPortfolioAnalysisOutput,
} from "./aiOutputValidator.js";
import {
  AI_ANALYSIS_EVALUATION_CRITERIA,
  AI_ANALYSIS_REGRESSION_FIXTURE_VERSION,
  AI_ANALYSIS_REGRESSION_FIXTURES,
} from "./aiAnalysisRegressionFixtures.js";

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

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function deterministicSignature(value) {
  const text = JSON.stringify(stableValue(value));
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function validScenarioContext(overrides = {}) {
  return {
    contextVersion: "ai-scenario-context-v1-step114-2j",
    target: "simulator-step6",
    interpretationOnly: true,
    calculationsImmutable: true,
    portfolioFingerprint: "portfolio-fingerprint-test",
    includedSections: ["probability", "externalShock"],
    sections: {
      probability: {
        sectionVersion: "probability-ai-context-v1-step114-2j",
        scenarioVersion: "probabilistic-bootstrap-v1-step114-2f",
        method: "joint_monthly_block_bootstrap",
        prngAlgorithm: "mulberry32-v1",
        randomSeed: 1142,
        simulationCount: 1200,
        blockMonths: 6,
        returnBasis: "total_return",
        currencyMode: "KRW",
        dataStartDate: "2020-01",
        dataEndDate: "2025-12",
        inputHash: "1111111111111111111111111111111111111111111111111111111111111111",
        outputHash: "2222222222222222222222222222222222222222222222222222222222222222",
        sourceHashes: ["fixture-source-hash-v1"],
        normalizationVersion: "normalization-v1-step114-2b",
        calculationPolicyVersion: "metrics-policy-v3-step114",
        pipelineVersion: "scenario-probabilistic-fixture-v1",
        terminalValue: { p10: 100, p50: 150, p90: 220 },
        principalShortfallProbability: { month12: null, month36: 0.2, month60: 0.1 },
        scenarioMdd: { p10: -0.4, p50: -0.25, p90: -0.1 },
        recovery: {
          medianRecoveryMonths: 12,
          longestRecoveryMonths: 36,
          unrecoveredScenarioRatio: 0.1,
        },
      },
      externalShock: {
        sectionVersion: "external-shock-ai-context-v1-step114-2j",
        scenarioVersion: "external-shock-scenario-v1-step114-2h",
        scenarioId: "direct-asset-test",
        scenarioLabel: "Direct asset test",
        mode: "direct_asset",
        method: "deterministic_external_shock",
        occurrenceProbabilityEstimated: false,
        returnBasis: "price_return",
        currencyMode: "KRW",
        dataStartDate: "2024-01",
        dataEndDate: "2024-12",
        inputHash: "3333333333333333333333333333333333333333333333333333333333333333",
        outputHash: "4444444444444444444444444444444444444444444444444444444444444444",
        baselineIdentityHash: "5555555555555555555555555555555555555555555555555555555555555555",
        sourceHashes: ["fixture-row-source-a", "fixture-row-source-b"],
        normalizationVersion: "normalization-v1-step114-2b",
        calculationPolicyVersion: "metrics-policy-v3-step114",
        pipelineVersion: "scenario-external-shock-fixture-v1",
        shockAssumptions: [
          {
            monthIndex: 4,
            label: "Synthetic shock",
            shockMode: "direct_asset",
            marketFactorShock: null,
            assetShockReturns: { "KR:005930": -0.2, "KR:069500": -0.1 },
            assetBetas: null,
          },
        ],
        terminalValue: {
          baseline: 200,
          stressed: 180,
          deltaValue: -20,
          deltaRate: -0.1,
        },
        mdd: { baseline: -0.05, stressed: -0.2, incremental: -0.15 },
        recovery: { recoveryMonths: null, longestRecoveryMonths: 2, unrecovered: true },
        assetImpact: [
          { market: "KR", ticker: "005930", baselineTerminalValue: 100, stressedTerminalValue: 88, deltaValue: -12, deltaRate: -0.12 },
          { market: "KR", ticker: "069500", baselineTerminalValue: 100, stressedTerminalValue: 92, deltaValue: -8, deltaRate: -0.08 },
        ],
        betaProvenanceSummary: [],
      },
    },
    disclaimers: [
      "AI는 STEP 4·5에서 계산된 검증 결과를 해석하며 직접 확률·MDD·충격 결과를 계산하지 않습니다.",
      "외부충격분석은 충격의 발생 확률을 의미하지 않습니다.",
      "투자 권유가 아닙니다.",
    ],
    ...overrides,
  };
}

function approvalEvidenceFor(section, portfolioFingerprint = "portfolio-fingerprint-test") {
  return {
    evidenceVersion: "scenario-provider-approval-evidence-v1-step114-2j",
    fixtureOnly: false,
    productionPublishReady: true,
    appExportApproved: true,
    portfolioFingerprint,
    inputHash: section.inputHash,
    outputHash: section.outputHash,
    sourceHashes: section.sourceHashes,
    normalizationVersion: section.normalizationVersion,
    calculationPolicyVersion: section.calculationPolicyVersion,
    pipelineVersion: section.pipelineVersion,
    approvalSource: "server-unit-test-explicit-approval",
  };
}

function validScenarioContextWrapper(overrides = {}) {
  const providerContext = validScenarioContext(overrides.providerContext || {});
  const portfolioFingerprint = providerContext.portfolioFingerprint;
  providerContext.sections.probability.approvalEvidence = approvalEvidenceFor(
    providerContext.sections.probability,
    portfolioFingerprint
  );
  providerContext.sections.externalShock.approvalEvidence = approvalEvidenceFor(
    providerContext.sections.externalShock,
    portfolioFingerprint
  );
  return {
    contextVersion: "ai-scenario-context-v1-step114-2j",
    status: overrides.status || "ready",
    providerEligible: overrides.providerEligible ?? true,
    providerContext,
    integrity: {
      builderId: "finple-ai-scenario-context-builder-v1-step114-2j",
      contextVersion: "ai-scenario-context-v1-step114-2j",
      providerContextSignature: overrides.providerContextSignature || deterministicSignature(providerContext),
      includedSectionCount: providerContext.includedSections.length,
      excludedSectionCount: 0,
      serializedBytes: Buffer.byteLength(JSON.stringify(providerContext), "utf8"),
      ...(overrides.integrity || {}),
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => ![
        "providerContext",
        "status",
        "providerEligible",
        "providerContextSignature",
        "integrity",
      ].includes(key))
    ),
  };
}

async function withScenarioContextGateEnabled(callback) {
  const previous = process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED;
  process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED = "true";
  try {
    return await callback();
  } finally {
    if (previous === undefined) delete process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED;
    else process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED = previous;
  }
}

function validProviderAnalysis() {
  return {
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
      summary: "QQQ와 BND로 역할이 나뉘어 있는 구성입니다.",
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
      {
        key: "data_context",
        title: "입력 데이터 맥락",
        summary: "입력된 자산 지표와 계산값 범위 안에서 구조를 해석합니다.",
        observations: [
          "제공된 지표가 있는 항목만 근거로 사용합니다.",
          "미래 시장 변화는 별도 가정으로 추가하지 않습니다.",
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
  };
}

function validKoreanAssetRequest() {
  return {
    portfolioId: "portfolio-kr-test",
    metrics: {
      cagr: 16.76,
      beta: 0.89,
      mdd: -36.26,
      futureValue: 585906171,
    },
    assets: [
      {
        ticker: "QQQ",
        market: "US",
        weight: 65,
        cagr: 20.82,
        beta: 1.16,
        mdd: -35.62,
        dividendYield: 0.39,
      },
      {
        ticker: "069500",
        market: "KR",
        weight: 10,
        cagr: 18.43,
        beta: 1.03,
        mdd: -40.65,
        dividendYield: 0.67,
      },
      {
        ticker: "TLT",
        market: "US",
        weight: 25,
        cagr: -4.14,
        beta: -0.12,
        mdd: -51.76,
        dividendYield: 4.56,
      },
    ],
  };
}

function validKoreanProviderAnalysis() {
  return {
    dataQuality: {
      level: "good",
      summary: "미국 자산과 한국 자산의 핵심 지표가 함께 제공되어 구조 해석이 가능합니다.",
      warnings: [],
    },
    portfolioProfile: {
      title: "미국 성장 자산과 한국 대표지수 자산을 함께 둔 포트폴리오",
      summary: "입력된 구성은 미국 성장 자산과 한국 대표지수 자산, 장기채 성격 자산이 함께 있는 구조입니다.",
    },
    diversification: {
      nominalAssetCount: 3,
      effectiveDiversificationLevel: "medium",
      summary: "QQQ, 069500, TLT가 서로 다른 시장과 역할을 일부 나누고 있습니다.",
    },
    diagnosticSections: [
      {
        key: "structure",
        title: "구조 진단",
        summary: "미국 성장 자산과 한국 대표지수 자산이 함께 배치된 구조입니다.",
        observations: [
          "QQQ는 성장 성격의 핵심 축으로 해석됩니다.",
          "069500은 한국 대표지수 성격을 더하는 자산으로 해석됩니다.",
        ],
      },
      {
        key: "risk_balance",
        title: "위험 균형",
        summary: "시장별 자산과 장기채 성격 자산의 조합을 함께 점검합니다.",
        observations: [
          "성장 자산 비중이 높아 변동성 체감이 커질 수 있습니다.",
          "TLT는 금리 변화에 따른 가격 변동을 함께 고려해야 합니다.",
        ],
      },
      {
        key: "data_context",
        title: "데이터 맥락",
        summary: "한국 자산이 포함되어 시장 구분을 함께 확인하는 구조입니다.",
        observations: [
          "미국과 한국 시장이 함께 포함되어 환율과 시장 국면 차이를 참고해야 합니다.",
          "입력된 지표 범위 안에서만 구조를 해석합니다.",
        ],
      },
    ],
    riskFactors: [
      {
        code: "growth_concentration",
        label: "성장 자산 비중 점검",
        severity: "medium",
        evidence: ["QQQ 중심의 성장 성격이 크게 반영됩니다."],
      },
    ],
    assetRoles: [
      {
        ticker: "QQQ",
        market: "US",
        weight: 65,
        role: "growth",
        rationale: "QQQ는 입력된 성장 지표를 기준으로 성장 역할로 해석됩니다.",
      },
      {
        ticker: "069500",
        market: "KR",
        weight: 10,
        role: "core",
        rationale: "069500은 한국 대표지수 성격을 더하는 핵심 보조 역할로 해석됩니다.",
      },
      {
        ticker: "TLT",
        market: "US",
        weight: 25,
        role: "stability",
        rationale: "TLT는 장기채 성격을 통해 안정 역할로 해석됩니다.",
      },
    ],
    limitations: [
      "본 응답은 입력된 계산값과 자산 상태를 설명하는 용도입니다.",
      "환율과 세금, 거래비용은 별도로 반영되지 않았습니다.",
    ],
    disclaimer: "본 분석은 투자 권유가 아닌 참고자료입니다. 최종 판단은 사용자가 확인해야 합니다.",
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

test("scenario context is optional and simulator-step4 remains legacy compatible", async () => {
  const legacy = normalizePortfolioAnalysisRequest({
    ...validRequest(),
    analysisContext: "simulator-step4",
  });
  assert.equal(legacy.analysisContext, "simulator-step4");
  assert.equal(legacy.scenarioInterpretationContext, undefined);

  const step6 = normalizePortfolioAnalysisRequest({
    ...validRequest(),
    analysisContext: "simulator-step6",
  });
  assert.equal(step6.analysisContext, "simulator-step6");
  assert.equal(step6.scenarioInterpretationContext, undefined);
});

test("server validates compact probability and external shock scenario context", async () => {
  await withScenarioContextGateEnabled(async () => {
    const payload = normalizePortfolioAnalysisRequest({
      ...validRequest(),
      analysisContext: "simulator-step6",
      scenarioInterpretationContext: validScenarioContextWrapper(),
    });

    assert.equal(payload.scenarioInterpretationContext.contextVersion, "ai-scenario-context-v1-step114-2j");
    assert.equal(payload.scenarioInterpretationContext.sections.probability.principalShortfallProbability.month12, null);
    assert.equal(payload.scenarioInterpretationContext.sections.externalShock.occurrenceProbabilityEstimated, false);
    assert.equal(payload.scenarioInterpretationContext.sections.externalShock.assetImpact[1].ticker, "069500");

    process.env.FINPLE_AI_ANALYSIS_MODE = "mock";
    process.env.FINPLE_AI_ANALYSIS_PROVIDER = "none";
    const output = await runPortfolioAnalysis(payload);
    assert.equal(output.provider, "none");
    assert.equal(output.scenarioInterpretation.contextUsed, true);
  });
});

test("server scenario-context live provider gate is disabled by default", () => {
  assert.throws(
    () => normalizePortfolioAnalysisRequest({
      ...validRequest(),
      analysisContext: "simulator-step6",
      scenarioInterpretationContext: validScenarioContextWrapper(),
    }),
    /provider gate is disabled/
  );
});

test("server rejects malformed scenario context fail-closed", async () => {
  const cases = [
    { contextVersion: "old-version" },
    { providerContext: { sections: { probability: { ...validScenarioContext().sections.probability, terminalValue: { p10: 100, p50: 90, p90: 120 } } } } },
    { providerContext: { sections: { probability: { ...validScenarioContext().sections.probability, principalShortfallProbability: { month12: 2, month36: 0.1, month60: 0.1 } } } } },
    { providerContext: { sections: { probability: { ...validScenarioContext().sections.probability, scenarioMdd: { p10: -0.2, p50: 0.1, p90: -0.05 } } } } },
    { providerContext: { sections: { externalShock: { ...validScenarioContext().sections.externalShock, occurrenceProbabilityEstimated: true } } } },
    { monthlyBands: [{ monthIndex: 1 }] },
  ];

  await withScenarioContextGateEnabled(async () => {
    for (const patch of cases) {
      const providerPatch = patch.providerContext || {};
      const baseProvider = validScenarioContext();
      const providerContext = {
        ...baseProvider,
        ...providerPatch,
        sections: providerPatch.sections
          ? { ...baseProvider.sections, ...providerPatch.sections }
          : baseProvider.sections,
      };
      if (providerContext.sections.probability && !providerContext.sections.probability.approvalEvidence) {
        providerContext.sections.probability.approvalEvidence = approvalEvidenceFor(providerContext.sections.probability);
      }
      if (providerContext.sections.externalShock && !providerContext.sections.externalShock.approvalEvidence) {
        providerContext.sections.externalShock.approvalEvidence = approvalEvidenceFor(providerContext.sections.externalShock);
      }
      const context = patch.providerContext
        ? validScenarioContextWrapper({ providerContext })
        : { ...validScenarioContextWrapper(), ...patch };
      assert.throws(
        () => normalizePortfolioAnalysisRequest({
          ...validRequest(),
          analysisContext: "simulator-step6",
          scenarioInterpretationContext: context,
        }),
        /AI/
      );
    }
  });
});

test("server rejects raw provider object and strict context limit violations", async () => {
  await withScenarioContextGateEnabled(async () => {
    assert.throws(
      () => normalizePortfolioAnalysisRequest({
        ...validRequest(),
        analysisContext: "simulator-step6",
        scenarioInterpretationContext: validScenarioContext(),
      }),
      /AI/
    );

    for (const context of [
      { ...validScenarioContextWrapper(), unknownTopLevel: true },
      validScenarioContextWrapper({
        providerContext: {
          disclaimers: ["x".repeat(13000)],
        },
      }),
      (() => {
        const providerContext = validScenarioContext();
        providerContext.sections.probability = {
          ...providerContext.sections.probability,
          sourceHashes: Array.from({ length: 21 }, (_, index) => `source-hash-${index}`),
        };
        return validScenarioContextWrapper({ providerContext });
      })(),
      (() => {
        const providerContext = validScenarioContext();
        providerContext.sections.externalShock = {
          ...providerContext.sections.externalShock,
          assetImpact: [
            {
              ...providerContext.sections.externalShock.assetImpact[0],
              unexpectedNestedKey: true,
            },
          ],
        };
        return validScenarioContextWrapper({ providerContext });
      })(),
    ]) {
      assert.throws(
        () => normalizePortfolioAnalysisRequest({
          ...validRequest(),
          analysisContext: "simulator-step6",
          scenarioInterpretationContext: context,
        }),
        /AI/
      );
    }
  });
});

test("AI analysis regression fixtures pass request and mock output validation", async () => {
  assert.equal(AI_ANALYSIS_REGRESSION_FIXTURE_VERSION, "ai-analysis-regression-fixtures-v3");

  for (const fixture of AI_ANALYSIS_REGRESSION_FIXTURES) {
    const normalizedRequest = normalizePortfolioAnalysisRequest(fixture.request);
    const analysis = await runPortfolioAnalysis(normalizedRequest);
    const validated = validateAiPortfolioAnalysisOutput(analysis, normalizedRequest);

    assert.equal(validated.portfolioId, fixture.request.portfolioId);
    assert.equal(validated.diagnosticSections.length, 3, `${fixture.id}: diagnostic section count`);
  }
});

test("AI analysis regression fixtures cover required evaluation scenarios", () => {
  assert.ok(
    AI_ANALYSIS_REGRESSION_FIXTURES.length >= AI_ANALYSIS_EVALUATION_CRITERIA.minimumFixtureCount
  );

  const fixtureIds = new Set();
  const coveredMarkets = new Set();
  const coveredDataStatuses = new Set();
  const coveredRiskFocus = new Set();

  for (const fixture of AI_ANALYSIS_REGRESSION_FIXTURES) {
    assert.ok(fixture.id, "fixture id is required");
    assert.equal(fixtureIds.has(fixture.id), false, `${fixture.id}: duplicate fixture id`);
    fixtureIds.add(fixture.id);

    assert.ok(fixture.evaluationFocus?.scenario, `${fixture.id}: evaluation scenario is required`);
    assert.ok(
      Array.isArray(fixture.evaluationFocus?.mustCheck) && fixture.evaluationFocus.mustCheck.length >= 2,
      `${fixture.id}: at least two evaluation checks are required`
    );

    for (const asset of fixture.request.assets || []) {
      if (asset.market) coveredMarkets.add(asset.market);
      if (asset.dataStatus) coveredDataStatuses.add(asset.dataStatus);
    }

    for (const focus of fixture.riskFocus || []) {
      coveredRiskFocus.add(focus);
    }
  }

  for (const market of AI_ANALYSIS_EVALUATION_CRITERIA.requiredMarkets) {
    assert.ok(coveredMarkets.has(market), `missing market coverage: ${market}`);
  }

  for (const status of AI_ANALYSIS_EVALUATION_CRITERIA.requiredDataStatuses) {
    assert.ok(coveredDataStatuses.has(status), `missing data status coverage: ${status}`);
  }

  for (const focus of AI_ANALYSIS_EVALUATION_CRITERIA.requiredRiskFocus) {
    assert.ok(coveredRiskFocus.has(focus), `missing risk focus coverage: ${focus}`);
  }

  assert.ok(
    AI_ANALYSIS_EVALUATION_CRITERIA.requiredOutputChecks.includes("numeric hallucination guard")
  );
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
    assert.match(requestBody.instructions, /exactly three diagnosticSections/);
    assert.match(requestBody.instructions, /derivedFacts/);
    assert.equal(requestBody.max_output_tokens, 4200);

    const requestInput = JSON.parse(requestBody.input);
    assert.deepEqual(requestInput.derivedFacts.marketWeights, { US: 100, KR: 0 });
    assert.equal(requestInput.derivedFacts.concentration.largestAsset.ticker, "BND");
    assert.equal(requestInput.derivedFacts.dataCoverage.assetsWithMdd, 2);
    assert.equal(requestInput.derivedFacts.cashflow.incomeCandidateWeight, 60);
    assert.equal(requestInput.derivedFacts.assetRoleHints[0].suggestedRole, "growth");
    assert.equal(requestInput.derivedFacts.assetRoleHints[1].suggestedRole, "income");

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
            {
              key: "data_context",
              title: "입력 데이터 맥락",
              summary: "입력된 자산 지표와 계산값 범위 안에서 구조를 해석합니다.",
              observations: [
                "제공된 지표가 있는 항목만 근거로 사용합니다.",
                "미래 시장 변화는 별도 가정으로 추가하지 않습니다.",
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

test("live OpenAI prompt receives validated scenario context as immutable interpretation input", async () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_MODE;
  const previousProvider = process.env.FINPLE_AI_ANALYSIS_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousScenarioContextGate = process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED;
  const previousFetch = globalThis.fetch;

  process.env.FINPLE_AI_ANALYSIS_MODE = "live";
  process.env.FINPLE_AI_ANALYSIS_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED = "true";

  globalThis.fetch = async (url, options) => {
    const requestBody = JSON.parse(options.body);
    assert.match(requestBody.instructions, /immutable facts/);
    assert.match(requestBody.instructions, /Do not recompute probability, MDD, recovery, stress, or shock results/);
    assert.match(requestBody.instructions, /External shock analysis does not estimate the probability/);

    const requestInput = JSON.parse(requestBody.input);
    assert.equal(requestInput.analysisContext, "simulator-step6");
    assert.equal(requestInput.scenarioInterpretationContext.contextVersion, "ai-scenario-context-v1-step114-2j");
    assert.equal(requestInput.scenarioInterpretationContext.sections.probability.principalShortfallProbability.month12, null);
    assert.equal(requestInput.scenarioInterpretationContext.sections.externalShock.occurrenceProbabilityEstimated, false);
    assert.equal(JSON.stringify(requestInput).includes("monthlyBands"), false);
    assert.equal(JSON.stringify(requestInput).includes("rawReturnMatrix"), false);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          ...validProviderAnalysis(),
          scenarioInterpretation: {
            contextUsed: true,
            probabilityNarrative: "Scenario context is interpreted without recalculation.",
            externalShockNarrative: "External shock context is deterministic and not an occurrence probability.",
            combinedLimitations: ["Scenario context is interpretation-only."],
          },
        }),
      }),
    };
  };

  try {
    const payload = normalizePortfolioAnalysisRequest({
      ...validRequest(),
      analysisContext: "simulator-step6",
      scenarioInterpretationContext: validScenarioContextWrapper(),
    });
    const output = await runPortfolioAnalysis(payload);
    assert.equal(output.analysisVersion, "ai-analysis-openai-v1");
    assert.equal(output.provider, "openai");
    assert.equal(output.scenarioInterpretation.contextUsed, true);
  } finally {
    process.env.FINPLE_AI_ANALYSIS_MODE = previousMode;
    process.env.FINPLE_AI_ANALYSIS_PROVIDER = previousProvider;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
    if (previousScenarioContextGate === undefined) delete process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED;
    else process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED = previousScenarioContextGate;
    globalThis.fetch = previousFetch;
  }
});

test("runPortfolioAnalysis sends Korean numeric tickers in live OpenAI input", async () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_MODE;
  const previousProvider = process.env.FINPLE_AI_ANALYSIS_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;

  process.env.FINPLE_AI_ANALYSIS_MODE = "live";
  process.env.FINPLE_AI_ANALYSIS_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "test-key";

  globalThis.fetch = async (url, options) => {
    const requestBody = JSON.parse(options.body);
    const requestInput = JSON.parse(requestBody.input);

    assert.match(requestBody.instructions, /Numeric ticker strings/);
    assert.match(requestBody.instructions, /069500/);
    assert.deepEqual(requestInput.derivedFacts.marketWeights, { US: 90, KR: 10 });
    assert.equal(requestInput.assets[1].ticker, "069500");
    assert.equal(requestInput.assets[1].market, "KR");
    assert.equal(requestInput.derivedFacts.assetRoleHints[1].ticker, "069500");
    assert.equal(requestInput.derivedFacts.assetRoleHints[1].suggestedRole, "growth");

    return {
      ok: true,
      status: 200,
      json: async () => ({ output_text: JSON.stringify(validKoreanProviderAnalysis()) }),
    };
  };

  try {
    const payload = normalizePortfolioAnalysisRequest(validKoreanAssetRequest());
    const output = await runPortfolioAnalysis(payload);

    assert.equal(output.assetRoles.length, 3);
    assert.equal(output.assetRoles[1].ticker, "069500");
    assert.equal(output.assetRoles[1].market, "KR");
  } finally {
    process.env.FINPLE_AI_ANALYSIS_MODE = previousMode;
    process.env.FINPLE_AI_ANALYSIS_PROVIDER = previousProvider;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
    globalThis.fetch = previousFetch;
  }
});

test("runPortfolioAnalysis retries live OpenAI output when local validation fails", async () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_MODE;
  const previousProvider = process.env.FINPLE_AI_ANALYSIS_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousValidationRetry = process.env.FINPLE_AI_ANALYSIS_VALIDATION_RETRY_COUNT;
  const previousFetch = globalThis.fetch;

  process.env.FINPLE_AI_ANALYSIS_MODE = "live";
  process.env.FINPLE_AI_ANALYSIS_PROVIDER = "openai";
  process.env.FINPLE_AI_ANALYSIS_VALIDATION_RETRY_COUNT = "1";
  process.env.OPENAI_API_KEY = "test-key";

  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    const analysis = validProviderAnalysis();
    if (fetchCount === 1) {
      analysis.portfolioProfile.summary = "매수 추천 표현이 포함된 응답입니다.";
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ output_text: JSON.stringify(analysis) }),
    };
  };

  try {
    const payload = normalizePortfolioAnalysisRequest(validRequest());
    const output = await runPortfolioAnalysis(payload);

    assert.equal(fetchCount, 2);
    assert.equal(output.analysisVersion, "ai-analysis-openai-v1");
    assert.equal(output.portfolioProfile.summary, validProviderAnalysis().portfolioProfile.summary);
  } finally {
    if (previousMode === undefined) delete process.env.FINPLE_AI_ANALYSIS_MODE;
    else process.env.FINPLE_AI_ANALYSIS_MODE = previousMode;
    if (previousProvider === undefined) delete process.env.FINPLE_AI_ANALYSIS_PROVIDER;
    else process.env.FINPLE_AI_ANALYSIS_PROVIDER = previousProvider;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
    if (previousValidationRetry === undefined) delete process.env.FINPLE_AI_ANALYSIS_VALIDATION_RETRY_COUNT;
    else process.env.FINPLE_AI_ANALYSIS_VALIDATION_RETRY_COUNT = previousValidationRetry;
    globalThis.fetch = previousFetch;
  }
});

test("runPortfolioAnalysis raises too-small OpenAI max output token config to schema minimum", async () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_MODE;
  const previousProvider = process.env.FINPLE_AI_ANALYSIS_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousMaxOutputTokens = process.env.FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS;
  const previousFetch = globalThis.fetch;

  process.env.FINPLE_AI_ANALYSIS_MODE = "live";
  process.env.FINPLE_AI_ANALYSIS_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS = "1200";

  globalThis.fetch = async (url, options) => {
    const requestBody = JSON.parse(options.body);
    assert.equal(requestBody.max_output_tokens, 4200);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output_text: "{\"dataQuality\":",
      }),
    };
  };

  try {
    const payload = normalizePortfolioAnalysisRequest(validRequest());
    await assert.rejects(
      () => runPortfolioAnalysis(payload),
      /길이 제한/
    );
  } finally {
    process.env.FINPLE_AI_ANALYSIS_MODE = previousMode;
    process.env.FINPLE_AI_ANALYSIS_PROVIDER = previousProvider;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
    if (previousMaxOutputTokens === undefined) delete process.env.FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS;
    else process.env.FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS = previousMaxOutputTokens;
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
  assert.equal(contract.diagnosticSectionCount, 3);
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

test("validateAiPortfolioAnalysisOutput allows numeric Korean tickers from input", () => {
  const payload = normalizePortfolioAnalysisRequest(validKoreanAssetRequest());
  const output = {
    analysisVersion: "ai-analysis-openai-v1",
    portfolioId: payload.portfolioId,
    generatedAt: "2026-06-25T00:00:00.000Z",
    mode: "live",
    provider: "openai",
    inputHash: "test-hash",
    ...validKoreanProviderAnalysis(),
  };

  assert.equal(validateAiPortfolioAnalysisOutput(output, payload).assetRoles[1].ticker, "069500");
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

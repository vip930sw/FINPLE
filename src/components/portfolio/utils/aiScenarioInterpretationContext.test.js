import assert from "node:assert/strict";
import test from "node:test";

import {
  STEP114_2G_FIXTURE_REVIEW_ASSETS,
  STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2G_FIXTURE_REVIEW_SETTINGS,
  STEP114_2G_PROBABILITY_FIXTURE_RESULT,
} from "../fixtures/probabilityScenarioResultFixture.js";
import {
  STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT,
  STEP114_2H_FIXTURE_REVIEW_ASSETS,
  STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2H_FIXTURE_REVIEW_SETTINGS,
} from "../fixtures/externalShockScenarioResultFixture.js";
import {
  buildExternalShockScenarioViewModel,
  getExternalShockPortfolioFingerprint,
} from "./externalShockScenarioAdapter.js";
import {
  buildProbabilityScenarioViewModel,
  getProbabilityPortfolioFingerprint,
} from "./probabilityScenarioAdapter.js";
import {
  AI_SCENARIO_APPROVAL_EVIDENCE_VERSION,
  AI_SCENARIO_CONTEXT_LIMITS,
  AI_SCENARIO_CONTEXT_VERSION,
  buildAiScenarioInterpretationContext,
  buildSimulatorAiScenarioContext,
  formatScenarioRatio,
  getProviderScenarioContext,
  getProviderScenarioContextWrapper,
  summarizeScenarioContextState,
} from "./aiScenarioInterpretationContext.js";
import {
  buildAiAnalysisPayload,
  createAiAnalysisInputSignature,
} from "./buildAiAnalysisPayload.js";
import { normalizePortfolioAnalysisRequest } from "../../../../server/src/schemas/aiPortfolioAnalysisSchema.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeApprovalEvidence(result, portfolioFingerprint) {
  return {
    evidenceVersion: AI_SCENARIO_APPROVAL_EVIDENCE_VERSION,
    fixtureOnly: false,
    productionPublishReady: true,
    appExportApproved: true,
    sourceKind: "synthetic_non_fixture_contract",
    portfolioFingerprint,
    inputHash: result.inputHash,
    outputHash: result.outputHash,
    sourceHashes: result.sourceHashes,
    normalizationVersion: result.normalizationVersion,
    calculationPolicyVersion: result.calculationPolicyVersion,
    pipelineVersion: result.pipelineVersion,
    approvalSource: "step114-2j-unit-test-approval",
  };
}

const SYNTHETIC_PROBABILITY_PORTFOLIO = { id: "synthetic-provider-probability", name: "Synthetic probability" };
const SYNTHETIC_PROBABILITY_SETTINGS = {
  startValue: 1000000,
  monthlyCashFlow: 100000,
  years: 1,
  investmentMonths: 12,
  inflationRate: 0.02,
  dividendReinvest: true,
};
const SYNTHETIC_PROBABILITY_ASSETS = [
  { market: "KR", ticker: "005930", targetWeight: 0.5, targetEvaluationAmount: 500000 },
  { market: "KR", ticker: "069500", targetWeight: 0.5, targetEvaluationAmount: 500000 },
];

const SYNTHETIC_SHOCK_PORTFOLIO = { id: "synthetic-provider-shock", name: "Synthetic shock" };
const SYNTHETIC_SHOCK_SETTINGS = {
  startValue: 1000000,
  initialInvestment: 1000000,
  monthlyCashFlow: 100000,
  monthlyContribution: 100000,
  years: 1,
  investmentMonths: 12,
  inflationRate: 0.02,
  dividendReinvest: true,
};
const SYNTHETIC_SHOCK_ASSETS = [
  { market: "KR", ticker: "005930", targetWeight: 0.5, weight: 0.5, targetEvaluationAmount: 500000 },
  { market: "KR", ticker: "069500", targetWeight: 0.5, weight: 0.5, targetEvaluationAmount: 500000 },
];

function probabilityReadyPair(resultPatch = {}, evidencePatch = {}) {
  const portfolioFingerprint = getProbabilityPortfolioFingerprint({
    portfolioId: SYNTHETIC_PROBABILITY_PORTFOLIO.id,
    settings: SYNTHETIC_PROBABILITY_SETTINGS,
    assets: SYNTHETIC_PROBABILITY_ASSETS,
  });
  const result = {
    status: "ready",
    scenarioVersion: "probabilistic-scenario-v1-step114-2f",
    method: "joint_block_bootstrap",
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
    sourceHashes: ["synthetic-source-a", "synthetic-source-b"],
    normalizationVersion: "normalization-v1-step114-2b",
    calculationPolicyVersion: "metrics-policy-v3-step114",
    pipelineVersion: "scenario-probabilistic-synthetic-contract-v1",
    betaApplied: false,
    cagrCalibrationApplied: false,
    historicalMddApplied: false,
    percentiles: [0.1, 0.25, 0.5, 0.75, 0.9],
    monthlyBands: [
      {
        monthIndex: 0,
        p10Nominal: 100,
        p25Nominal: 100,
        p50Nominal: 100,
        p75Nominal: 100,
        p90Nominal: 100,
        p10Real: 100,
        p25Real: 100,
        p50Real: 100,
        p75Real: 100,
        p90Real: 100,
      },
      {
        monthIndex: 1,
        p10Nominal: 101,
        p25Nominal: 103,
        p50Nominal: 105,
        p75Nominal: 107,
        p90Nominal: 109,
        p10Real: 100,
        p25Real: 102,
        p50Real: 104,
        p75Real: 106,
        p90Real: 108,
      },
    ],
    contributionSeries: [
      { monthIndex: 0, cumulativeContributions: 1000000 },
      { monthIndex: 1, cumulativeContributions: 1100000 },
    ],
    terminalValue: { p10: 100, p25: 125, p50: 150, p75: 185, p90: 220 },
    principalShortfallProbability: { month12: null, month36: 0.2, month60: 0.1 },
    scenarioMdd: { p10: -0.4, p25: -0.32, p50: -0.25, p75: -0.17, p90: -0.1 },
    recovery: {
      medianRecoveryMonths: 12,
      longestRecoveryMonths: 36,
      unrecoveredScenarioRatio: 0.1,
    },
    dataQuality: { status: "ready", blockReasons: [] },
    assets: SYNTHETIC_PROBABILITY_ASSETS,
    ...resultPatch,
  };
  const approvalEvidence = evidencePatch === null ? null : { ...makeApprovalEvidence(result, portfolioFingerprint), ...evidencePatch };
  const viewModel = buildProbabilityScenarioViewModel({
    result,
    activePortfolio: SYNTHETIC_PROBABILITY_PORTFOLIO,
    assets: SYNTHETIC_PROBABILITY_ASSETS,
    settings: SYNTHETIC_PROBABILITY_SETTINGS,
    providerApprovalEvidence: approvalEvidence,
  });
  return { result, viewModel };
}

function shockReadyPair(resultPatch = {}, evidencePatch = {}) {
  const portfolioFingerprint = getExternalShockPortfolioFingerprint({
    portfolioId: SYNTHETIC_SHOCK_PORTFOLIO.id,
    settings: SYNTHETIC_SHOCK_SETTINGS,
    assets: SYNTHETIC_SHOCK_ASSETS,
  });
  const result = {
    status: "ready",
    scenarioVersion: "external-shock-scenario-v1-step114-2h",
    scenarioId: "synthetic-direct-asset",
    scenarioLabel: "Synthetic direct asset",
    shockMode: "direct_asset",
    method: "deterministic_external_shock",
    occurrenceProbabilityEstimated: false,
    returnBasis: "price_return",
    currencyMode: "KRW",
    dataStartDate: "2024-01",
    dataEndDate: "2024-12",
    inputHash: "3333333333333333333333333333333333333333333333333333333333333333",
    outputHash: "4444444444444444444444444444444444444444444444444444444444444444",
    baselineIdentityHash: "5555555555555555555555555555555555555555555555555555555555555555",
    sourceHashes: ["synthetic-shock-source-a", "synthetic-shock-source-b"],
    normalizationVersion: "normalization-v1-step114-2b",
    calculationPolicyVersion: "metrics-policy-v3-step114",
    pipelineVersion: "scenario-external-shock-synthetic-contract-v1",
    baselineTerminalValue: 200,
    stressedTerminalValue: 180,
    terminalDeltaValue: -20,
    terminalDeltaRate: -0.1,
    baselineMdd: -0.05,
    stressedMdd: -0.2,
    incrementalMdd: -0.15,
    recoveryMonths: null,
    longestRecoveryMonths: 2,
    unrecovered: true,
    rebalanceFrequency: "none",
    inflationRate: 0.02,
    betaApplied: false,
    bootstrapApplied: false,
    probabilityApplied: false,
    cagrCalibrationApplied: false,
    historicalMddApplied: false,
    baselinePath: [
      { monthIndex: 0, portfolioValue: 100, riskNav: 100, cumulativeContributions: 100 },
      { monthIndex: 1, portfolioValue: 150, riskNav: 110, cumulativeContributions: 140 },
      { monthIndex: 2, portfolioValue: 200, riskNav: 120, cumulativeContributions: 180 },
    ],
    stressedPath: [
      { monthIndex: 0, portfolioValue: 100, riskNav: 100, cumulativeContributions: 100 },
      { monthIndex: 1, portfolioValue: 135, riskNav: 95, cumulativeContributions: 140 },
      { monthIndex: 2, portfolioValue: 180, riskNav: 96, cumulativeContributions: 180 },
    ],
    contributionSeries: [
      { monthIndex: 0, cumulativeContributions: 100 },
      { monthIndex: 1, cumulativeContributions: 140 },
      { monthIndex: 2, cumulativeContributions: 180 },
    ],
    shockEvents: [
      {
        monthIndex: 4,
        label: "Synthetic shock",
        shockMode: "direct_asset",
        marketFactorShock: null,
        assetShockReturns: { "KR:005930": -0.2, "KR:069500": -0.1 },
        assetBetas: null,
      },
    ],
    assetImpactSummary: [
      { market: "KR", ticker: "005930", key: "KR:005930", baselineTerminalValue: 100, stressedTerminalValue: 88, deltaValue: -12, deltaRate: -0.12 },
      { market: "KR", ticker: "069500", key: "KR:069500", baselineTerminalValue: 100, stressedTerminalValue: 92, deltaValue: -8, deltaRate: -0.08 },
    ],
    rowSourceLineage: [
      { monthIndex: 1, sourceHash: "synthetic-shock-source-a" },
      { monthIndex: 2, sourceHash: "synthetic-shock-source-b" },
    ],
    summary: {
      baselineTerminalValue: 200,
      stressedTerminalValue: 180,
      terminalDeltaValue: -20,
      terminalDeltaRate: -0.1,
      baselineMdd: -0.05,
      stressedMdd: -0.2,
      incrementalMdd: -0.15,
      recoveryMonths: null,
      longestRecoveryMonths: 2,
      unrecovered: true,
    },
    dataQuality: { status: "ready", blockReasons: [] },
    assets: SYNTHETIC_SHOCK_ASSETS,
    ...resultPatch,
  };
  const approvalEvidence = evidencePatch === null ? null : { ...makeApprovalEvidence(result, portfolioFingerprint), ...evidencePatch };
  const viewModel = buildExternalShockScenarioViewModel({
    result,
    activePortfolio: SYNTHETIC_SHOCK_PORTFOLIO,
    assets: SYNTHETIC_SHOCK_ASSETS,
    settings: SYNTHETIC_SHOCK_SETTINGS,
    providerApprovalEvidence: approvalEvidence,
  });
  return { result, viewModel };
}

function baselineAiInput(context = null) {
  return {
    activePortfolio: { id: "step114-2j-ai-context-test" },
    activeAssets: [
      {
        ticker: "005930",
        market: "KR",
        name: "Samsung Electronics",
        quantity: 1,
        price: 100,
        cagr: 8,
        beta: 1,
        mdd: -35,
        dividendYield: 2,
      },
    ],
    result: {
      expectedCagr: 8,
      expectedBeta: 1,
      simpleMdd: -35,
      expectedDividendYield: 2,
      futureValue: 120,
      inflationAdjustedFutureValue: 110,
    },
    settings: { years: 10, inflationRate: 2, dividendReinvest: true },
    scenarioInterpretationContext: context,
  };
}

test("omitted scenario context preserves default AI payload isolation", () => {
  const payload = buildAiAnalysisPayload(baselineAiInput());
  assert.equal(payload.analysisContext, "simulator-step6");
  assert.equal(payload.scenarioInterpretationContext, undefined);
  assert.doesNotMatch(JSON.stringify(payload), /monthlyBands|simulationTrace|rawReturnMatrix|baselinePath|stressedPath/);

  const withoutContext = createAiAnalysisInputSignature(baselineAiInput());
  const explicitNull = createAiAnalysisInputSignature(baselineAiInput(null));
  assert.equal(withoutContext, explicitNull);
});

test("approved probability-only context is compact and provider eligible", () => {
  const { result, viewModel } = probabilityReadyPair();
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: viewModel.portfolioFingerprint,
    probabilityResult: result,
    probabilityViewModel: viewModel,
  });
  const providerContext = getProviderScenarioContext(context);
  assert.equal(providerContext.contextVersion, AI_SCENARIO_CONTEXT_VERSION);
  assert.equal(context.status, "partial");
  assert.deepEqual(providerContext.includedSections, ["probability"]);
  assert.equal(providerContext.sections.probability.terminalValue.p50, result.terminalValue.p50);
  assert.equal(providerContext.sections.probability.principalShortfallProbability.month12, result.principalShortfallProbability.month12);
  assert.equal(providerContext.sections.probability.scenarioMdd.p50, result.scenarioMdd.p50);
});

test("approved shock-only context preserves KR leading zero and occurrence probability false", () => {
  const { result, viewModel } = shockReadyPair();
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: viewModel.portfolioFingerprint,
    externalShockResult: result,
    externalShockViewModel: viewModel,
  });
  const shock = getProviderScenarioContext(context).sections.externalShock;
  assert.equal(context.status, "partial");
  assert.equal(shock.occurrenceProbabilityEstimated, false);
  assert.equal(shock.assetImpact[0].ticker, "005930");
  assert.equal(shock.assetImpact[1].ticker, "069500");
  assert.equal(shock.terminalValue.deltaValue, result.terminalDeltaValue);
});

test("actual adapters produce approved non-fixture provider-eligible view models", () => {
  const probability = probabilityReadyPair();
  assert.equal(probability.viewModel.status, "ready");
  assert.equal(probability.viewModel.fixtureOnly, false);
  assert.equal(probability.viewModel.productionPublishReady, true);
  assert.equal(probability.viewModel.appExportApproved, true);
  assert.ok(probability.viewModel.providerApprovalEvidence);

  const shock = shockReadyPair();
  assert.equal(shock.viewModel.status, "ready");
  assert.equal(shock.viewModel.fixtureOnly, false);
  assert.equal(shock.viewModel.productionPublishReady, true);
  assert.equal(shock.viewModel.appExportApproved, true);
  assert.ok(shock.viewModel.providerApprovalEvidence);
});

test("actual adapters block non-fixture results with missing or invalid evidence and keep absent result idle", () => {
  const missingProbability = probabilityReadyPair({}, null);
  assert.equal(missingProbability.viewModel.status, "blocked");
  assert.ok(missingProbability.viewModel.auditReasons.includes("providerApprovalEvidence_invalid"));

  const invalidProbability = probabilityReadyPair({}, { sourceHashes: ["synthetic-source-a"] });
  assert.equal(invalidProbability.viewModel.status, "blocked");
  assert.ok(invalidProbability.viewModel.auditReasons.includes("providerApprovalEvidence_invalid"));

  const missingShock = shockReadyPair({}, null);
  assert.equal(missingShock.viewModel.status, "blocked");
  assert.ok(missingShock.viewModel.auditReasons.includes("providerApprovalEvidence_invalid"));

  const invalidShock = shockReadyPair({}, { evidenceVersion: "wrong" });
  assert.equal(invalidShock.viewModel.status, "blocked");
  assert.ok(invalidShock.viewModel.auditReasons.includes("providerApprovalEvidence_invalid"));

  const idleProbability = buildProbabilityScenarioViewModel({
    activePortfolio: SYNTHETIC_PROBABILITY_PORTFOLIO,
    assets: SYNTHETIC_PROBABILITY_ASSETS,
    settings: SYNTHETIC_PROBABILITY_SETTINGS,
  });
  assert.equal(idleProbability.status, "idle");

  const idleShock = buildExternalShockScenarioViewModel({
    activePortfolio: SYNTHETIC_SHOCK_PORTFOLIO,
    assets: SYNTHETIC_SHOCK_ASSETS,
    settings: SYNTHETIC_SHOCK_SETTINGS,
  });
  assert.equal(idleShock.status, "idle");
});

test("eligible adapter context enters payload and cache signature without full paths", () => {
  const probability = probabilityReadyPair();
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  });
  const payload = buildAiAnalysisPayload(baselineAiInput(context));
  const serialized = JSON.stringify(payload);
  assert.equal(payload.scenarioInterpretationContext.status, "partial");
  assert.equal(payload.scenarioInterpretationContext.providerContext.includedSections.length, 1);
  assert.doesNotMatch(serialized, /monthlyBands|simulationTrace|rawReturnMatrix|baselinePath|stressedPath|rowSourceLineage|contributionSeries/);

  const signature = createAiAnalysisInputSignature(baselineAiInput(context));
  assert.match(signature, /scenarioInterpretationContext/);
  assert.match(signature, new RegExp(probability.result.inputHash));
});

test("provider-bound partial wrapper recomputes integrity for server normalization", () => {
  const probability = probabilityReadyPair();
  const blockedShock = shockReadyPair({}, { sourceHashes: ["synthetic-shock-source-a"] });
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
    externalShockResult: blockedShock.result,
    externalShockViewModel: {
      ...blockedShock.viewModel,
      portfolioFingerprint: probability.viewModel.portfolioFingerprint,
    },
  });
  assert.equal(context.status, "partial");
  assert.equal(context.integrity.excludedSectionCount, 1);
  const providerWrapper = getProviderScenarioContextWrapper(context);
  assert.equal(providerWrapper.status, "partial");
  assert.equal(providerWrapper.integrity.includedSectionCount, 1);
  assert.equal(providerWrapper.integrity.excludedSectionCount, 0);
  assert.deepEqual(providerWrapper.providerContext.includedSections, ["probability"]);

  const previousGate = process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED;
  process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED = "true";
  try {
    const payload = buildAiAnalysisPayload(baselineAiInput(context));
    const normalized = normalizePortfolioAnalysisRequest(payload);
    assert.equal(normalized.scenarioInterpretationContext.status, "partial");
    assert.deepEqual(normalized.scenarioInterpretationContext.includedSections, ["probability"]);
    assert.equal(normalized.scenarioInterpretationContext.integrity.excludedSectionCount, 0);
  } finally {
    if (previousGate === undefined) delete process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED;
    else process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED = previousGate;
  }
});

test("fixture and review-only scenario results are excluded from provider payload", () => {
  const result = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  const draftViewModel = buildProbabilityScenarioViewModel({
    result,
    activePortfolio: STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2G_FIXTURE_REVIEW_SETTINGS,
    enableFixtureReview: true,
  });
  const viewModel = buildProbabilityScenarioViewModel({
    result,
    activePortfolio: STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2G_FIXTURE_REVIEW_SETTINGS,
    enableFixtureReview: true,
    providerApprovalEvidence: makeApprovalEvidence(result, draftViewModel.portfolioFingerprint),
  });
  assert.equal(viewModel.fixtureOnly, true);
  assert.equal(viewModel.providerApprovalEvidence, null);
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: viewModel.portfolioFingerprint,
    probabilityResult: result,
    probabilityViewModel: viewModel,
  });
  assert.equal(context.providerEligible, false);
  assert.equal(getProviderScenarioContext(context), null);
  assert.equal(buildAiAnalysisPayload(baselineAiInput(context)).scenarioInterpretationContext, undefined);
});

test("publish and app export gates fail closed independently", () => {
  const { result, viewModel } = probabilityReadyPair({}, { productionPublishReady: false });
  let context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: viewModel.portfolioFingerprint,
    probabilityResult: result,
    probabilityViewModel: viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);

  const second = probabilityReadyPair({}, { appExportApproved: false });
  context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: second.viewModel.portfolioFingerprint,
    probabilityResult: second.result,
    probabilityViewModel: second.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);

  const subsetEvidence = probabilityReadyPair({}, { sourceHashes: ["synthetic-source-a"] });
  context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: subsetEvidence.viewModel.portfolioFingerprint,
    probabilityResult: subsetEvidence.result,
    probabilityViewModel: subsetEvidence.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);
});

test("stale blocked malformed and out-of-range context inputs are blocked", () => {
  const probability = probabilityReadyPair();
  const stale = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: "different-fingerprint",
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  });
  assert.equal(getProviderScenarioContext(stale), null);

  for (const patch of [
    { terminalValue: { ...probability.result.terminalValue, p50: probability.result.terminalValue.p10 - 1 } },
    { principalShortfallProbability: { ...probability.result.principalShortfallProbability, month12: 2 } },
    { scenarioMdd: { ...probability.result.scenarioMdd, p50: 0.1 } },
    { recovery: { ...probability.result.recovery, unrecoveredScenarioRatio: 2 } },
  ]) {
    const candidate = probabilityReadyPair(patch);
    const context = buildAiScenarioInterpretationContext({
      currentPortfolioFingerprint: candidate.viewModel.portfolioFingerprint,
      probabilityResult: candidate.result,
      probabilityViewModel: candidate.viewModel,
    });
    assert.equal(getProviderScenarioContext(context), null);
  }

  const shock = shockReadyPair({ occurrenceProbabilityEstimated: true });
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: shock.viewModel.portfolioFingerprint,
    externalShockResult: shock.result,
    externalShockViewModel: shock.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);
});

test("null scenario values stay null instead of becoming zero", () => {
  const { result, viewModel } = shockReadyPair({
    recoveryMonths: null,
  });
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: viewModel.portfolioFingerprint,
    externalShockResult: result,
    externalShockViewModel: viewModel,
  });
  assert.equal(getProviderScenarioContext(context).sections.externalShock.recovery.recoveryMonths, null);
});

test("scenario context changes AI cache signature", () => {
  const first = probabilityReadyPair();
  const firstContext = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: first.viewModel.portfolioFingerprint,
    probabilityResult: first.result,
    probabilityViewModel: first.viewModel,
  });
  const second = probabilityReadyPair({
    outputHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  const secondContext = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: second.viewModel.portfolioFingerprint,
    probabilityResult: second.result,
    probabilityViewModel: second.viewModel,
  });

  assert.notEqual(
    createAiAnalysisInputSignature(baselineAiInput(firstContext)),
    createAiAnalysisInputSignature(baselineAiInput(secondContext))
  );
});

test("PortfolioSimulator runtime helper owns exactly one provider-eligible context path", () => {
  const probability = probabilityReadyPair();
  const runtimeContext = buildSimulatorAiScenarioContext({
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  });
  assert.equal(runtimeContext.status, "partial");
  assert.deepEqual(runtimeContext.includedSections, ["probability"]);
  assert.equal(getProviderScenarioContext(runtimeContext).sections.probability.inputHash, probability.result.inputHash);
});

test("raw provider object bypass is rejected by provider context getter", () => {
  const probability = probabilityReadyPair();
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  });
  const providerContext = getProviderScenarioContext(context);
  assert.ok(providerContext);
  assert.equal(getProviderScenarioContext(providerContext), null);
});

test("context status contract distinguishes partial stale blocked and mixed-fingerprint exclusion", () => {
  const probability = probabilityReadyPair();
  const shock = shockReadyPair();
  const mixedFingerprints = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
    externalShockResult: shock.result,
    externalShockViewModel: shock.viewModel,
  });
  assert.equal(mixedFingerprints.status, "stale");
  assert.deepEqual(mixedFingerprints.includedSections, ["probability"]);
  assert.equal(mixedFingerprints.excludedSections[0].section, "externalShock");
  assert.equal(getProviderScenarioContext(mixedFingerprints), null);

  const partial = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  });
  assert.equal(partial.status, "partial");

  const stale = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: "different-fingerprint",
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  });
  assert.equal(stale.status, "stale");

  const blockedPair = probabilityReadyPair({}, { evidenceVersion: "wrong" });
  const blocked = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: blockedPair.viewModel.portfolioFingerprint,
    probabilityResult: blockedPair.result,
    probabilityViewModel: blockedPair.viewModel,
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(getProviderScenarioContext(blocked), null);
});

test("scenario context display state covers omitted ready partial blocked and stale", () => {
  assert.equal(summarizeScenarioContextState(null).status, "omitted");

  const probability = probabilityReadyPair();
  const shock = shockReadyPair();
  const ready = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
    externalShockResult: shock.result,
    externalShockViewModel: {
      ...shock.viewModel,
      portfolioFingerprint: probability.viewModel.portfolioFingerprint,
      providerApprovalEvidence: {
        ...shock.viewModel.providerApprovalEvidence,
        portfolioFingerprint: probability.viewModel.portfolioFingerprint,
      },
    },
  });
  const readyState = summarizeScenarioContextState(ready);
  assert.equal(readyState.status, "ready");
  assert.deepEqual(readyState.includedSections.sort(), ["externalShock", "probability"]);

  const partial = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  });
  const partialState = summarizeScenarioContextState(partial);
  assert.equal(partialState.status, "partial");
  assert.deepEqual(partialState.includedSections, ["probability"]);

  const blockedPair = probabilityReadyPair({}, { evidenceVersion: "wrong" });
  const blockedState = summarizeScenarioContextState(buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: blockedPair.viewModel.portfolioFingerprint,
    probabilityResult: blockedPair.result,
    probabilityViewModel: blockedPair.viewModel,
  }));
  assert.equal(blockedState.status, "blocked");
  assert.equal(blockedState.excludedSections[0].reasonCategory, "approval_not_ready");

  const staleState = summarizeScenarioContextState(buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: "different-fingerprint",
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
  }));
  assert.equal(staleState.status, "stale");
  assert.equal(staleState.excludedSections[0].reasonCategory, "stale_identity");
});

test("strict client limits and nested validation block provider context without truncation", () => {
  const tooManyHashes = probabilityReadyPair({
    sourceHashes: Array.from(
      { length: AI_SCENARIO_CONTEXT_LIMITS.maxSourceHashes + 1 },
      (_, index) => `fixture-source-${index}`
    ),
  });
  let context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: tooManyHashes.viewModel.portfolioFingerprint,
    probabilityResult: tooManyHashes.result,
    probabilityViewModel: tooManyHashes.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);

  const firstEvent = clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT.shockEvents[0]);
  const duplicateMonth = shockReadyPair({ shockEvents: [firstEvent, { ...firstEvent }] });
  context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: duplicateMonth.viewModel.portfolioFingerprint,
    externalShockResult: duplicateMonth.result,
    externalShockViewModel: duplicateMonth.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);

  const malformedReturnEvent = clone(firstEvent);
  malformedReturnEvent.assetShockReturns = { ...malformedReturnEvent.assetShockReturns, "KR:005930": -1 };
  const malformedReturn = shockReadyPair({ shockEvents: [malformedReturnEvent] });
  context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: malformedReturn.viewModel.portfolioFingerprint,
    externalShockResult: malformedReturn.result,
    externalShockViewModel: malformedReturn.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);

  const malformedImpact = shockReadyPair({
    assetImpactSummary: [
      { ...STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT.assetImpactSummary[0], unexpectedNestedKey: true },
    ],
  });
  context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: malformedImpact.viewModel.portfolioFingerprint,
    externalShockResult: malformedImpact.result,
    externalShockViewModel: malformedImpact.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);
});

test("market beta shock identity and beta provenance are fail-closed", () => {
  const event = {
    monthIndex: 4,
    label: "Market beta malformed",
    shockMode: "market_beta",
    marketFactorShock: -0.2,
    assetShockReturns: null,
    assetBetas: { "KR:005930": 1.1, "KR:069500": 0.8 },
    betaProvenance: {
      "KR:005930": {
        sourceName: "Synthetic beta",
        asOfDate: "2026-07",
        betaWindow: "36m",
        methodVersion: "fixture-beta-v1",
        sourceHash: "fixture-beta-source-1",
      },
    },
  };
  const malformed = shockReadyPair({
    shockMode: "market_beta",
    scenarioId: "market-beta-malformed",
    shockEvents: [event],
  });
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: malformed.viewModel.portfolioFingerprint,
    externalShockResult: malformed.result,
    externalShockViewModel: malformed.viewModel,
  });
  assert.equal(getProviderScenarioContext(context), null);
});

test("scenario ratio formatter keeps ratio and money units separate", () => {
  assert.equal(formatScenarioRatio(-0.10), "-10.0%");
  assert.equal(formatScenarioRatio(0), "0.0%");
  assert.notEqual(formatScenarioRatio(-0.10), "-0.1%");
});

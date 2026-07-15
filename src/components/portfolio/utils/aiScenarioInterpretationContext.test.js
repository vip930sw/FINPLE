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
} from "./externalShockScenarioAdapter.js";
import {
  buildProbabilityScenarioViewModel,
} from "./probabilityScenarioAdapter.js";
import {
  AI_SCENARIO_CONTEXT_VERSION,
  buildAiScenarioInterpretationContext,
  getProviderScenarioContext,
} from "./aiScenarioInterpretationContext.js";
import {
  buildAiAnalysisPayload,
  createAiAnalysisInputSignature,
} from "./buildAiAnalysisPayload.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function markProviderApproved(result) {
  return {
    ...clone(result),
    fixtureOnly: false,
    productionPublishReady: true,
    appExportApproved: true,
    occurrenceProbabilityEstimated: result.occurrenceProbabilityEstimated ?? false,
  };
}

function approveViewModel(viewModel) {
  return {
    ...viewModel,
    fixtureOnly: false,
    productionPublishReady: true,
    appExportApproved: true,
  };
}

function probabilityReadyPair(resultPatch = {}) {
  const result = markProviderApproved({
    ...clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT),
    ...resultPatch,
  });
  const viewModel = approveViewModel(buildProbabilityScenarioViewModel({
    result,
    activePortfolio: STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2G_FIXTURE_REVIEW_SETTINGS,
    enableFixtureReview: true,
  }));
  return { result, viewModel };
}

function shockReadyPair(resultPatch = {}) {
  const result = markProviderApproved({
    ...clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT),
    ...resultPatch,
  });
  const viewModel = approveViewModel(buildExternalShockScenarioViewModel({
    result,
    activePortfolio: STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2H_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2H_FIXTURE_REVIEW_SETTINGS,
    enableFixtureReview: true,
  }));
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
  assert.equal(shock.occurrenceProbabilityEstimated, false);
  assert.equal(shock.assetImpact[0].ticker, "005930");
  assert.equal(shock.assetImpact[1].ticker, "069500");
  assert.equal(shock.terminalValue.deltaValue, result.terminalDeltaValue);
});

test("combined context enters payload and cache signature without full paths", () => {
  const probability = probabilityReadyPair();
  const shock = shockReadyPair();
  const context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: probability.viewModel.portfolioFingerprint,
    probabilityResult: probability.result,
    probabilityViewModel: probability.viewModel,
    externalShockResult: {
      ...shock.result,
      fixtureContext: {
        ...shock.result.fixtureContext,
        portfolioFingerprint: probability.viewModel.portfolioFingerprint,
      },
    },
    externalShockViewModel: {
      ...shock.viewModel,
      portfolioFingerprint: probability.viewModel.portfolioFingerprint,
    },
  });
  const payload = buildAiAnalysisPayload(baselineAiInput(context));
  const serialized = JSON.stringify(payload);
  assert.equal(payload.scenarioInterpretationContext.includedSections.length, 2);
  assert.doesNotMatch(serialized, /monthlyBands|simulationTrace|rawReturnMatrix|baselinePath|stressedPath|rowSourceLineage|contributionSeries/);

  const signature = createAiAnalysisInputSignature(baselineAiInput(context));
  assert.match(signature, /scenarioInterpretationContext/);
  assert.match(signature, new RegExp(probability.result.inputHash));
  assert.match(signature, new RegExp(shock.result.outputHash));
});

test("fixture and review-only scenario results are excluded from provider payload", () => {
  const result = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  const viewModel = buildProbabilityScenarioViewModel({
    result,
    activePortfolio: STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2G_FIXTURE_REVIEW_SETTINGS,
    enableFixtureReview: true,
  });
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
  const { result, viewModel } = probabilityReadyPair({ productionPublishReady: false });
  let context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: viewModel.portfolioFingerprint,
    probabilityResult: result,
    probabilityViewModel: { ...viewModel, productionPublishReady: false },
  });
  assert.equal(getProviderScenarioContext(context), null);

  const second = probabilityReadyPair({ appExportApproved: false });
  context = buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint: second.viewModel.portfolioFingerprint,
    probabilityResult: second.result,
    probabilityViewModel: { ...second.viewModel, appExportApproved: false },
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

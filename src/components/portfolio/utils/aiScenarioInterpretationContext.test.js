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
  AI_SCENARIO_APPROVAL_EVIDENCE_VERSION,
  AI_SCENARIO_CONTEXT_LIMITS,
  AI_SCENARIO_CONTEXT_VERSION,
  buildAiScenarioInterpretationContext,
  buildSimulatorAiScenarioContext,
  formatScenarioRatio,
  getProviderScenarioContext,
} from "./aiScenarioInterpretationContext.js";
import {
  buildAiAnalysisPayload,
  createAiAnalysisInputSignature,
} from "./buildAiAnalysisPayload.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeApprovalEvidence(result, portfolioFingerprint) {
  return {
    evidenceVersion: AI_SCENARIO_APPROVAL_EVIDENCE_VERSION,
    fixtureOnly: false,
    productionPublishReady: true,
    appExportApproved: true,
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

function probabilityReadyPair(resultPatch = {}, evidencePatch = {}) {
  const result = {
    ...clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT),
    ...resultPatch,
  };
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
    providerApprovalEvidence: {
      ...makeApprovalEvidence(result, draftViewModel.portfolioFingerprint),
      ...evidencePatch,
    },
  });
  return { result, viewModel };
}

function shockReadyPair(resultPatch = {}, evidencePatch = {}) {
  const result = {
    ...clone(STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT),
    ...resultPatch,
  };
  const draftViewModel = buildExternalShockScenarioViewModel({
    result,
    activePortfolio: STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2H_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2H_FIXTURE_REVIEW_SETTINGS,
    enableFixtureReview: true,
  });
  const viewModel = buildExternalShockScenarioViewModel({
    result,
    activePortfolio: STEP114_2H_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2H_FIXTURE_REVIEW_ASSETS,
    settings: STEP114_2H_FIXTURE_REVIEW_SETTINGS,
    enableFixtureReview: true,
    providerApprovalEvidence: {
      ...makeApprovalEvidence(result, draftViewModel.portfolioFingerprint),
      ...evidencePatch,
    },
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

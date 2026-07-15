export const AI_SCENARIO_CONTEXT_VERSION = "ai-scenario-context-v1-step114-2j";
export const AI_SCENARIO_CONTEXT_TARGET = "simulator-step6";

const HASH_PATTERN = /^[a-f0-9]{64}$/i;
const OPTIONAL_HASH_PATTERN = /^[A-Za-z0-9._:-]{3,160}$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function finiteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasHash(value) {
  const text = cleanString(value);
  return HASH_PATTERN.test(text) || OPTIONAL_HASH_PATTERN.test(text);
}

function addIssue(issues, issue) {
  if (!issues.includes(issue)) issues.push(issue);
}

function validateHash(value, path, issues, { strict = false } = {}) {
  const text = cleanString(value);
  if (!text) {
    addIssue(issues, `${path}_missing`);
    return null;
  }
  if (strict ? !HASH_PATTERN.test(text) : !hasHash(text)) {
    addIssue(issues, `${path}_invalid`);
    return null;
  }
  return text;
}

function validateFinite(value, path, issues, { min = -Infinity, max = Infinity, nullable = false } = {}) {
  const number = finiteNumberOrNull(value);
  if (number === null) {
    if (!nullable) addIssue(issues, `${path}_missing`);
    return null;
  }
  if (number < min || number > max) {
    addIssue(issues, `${path}_out_of_range`);
    return null;
  }
  return number;
}

function validateInteger(value, path, issues, options = {}) {
  const number = validateFinite(value, path, issues, options);
  if (number === null) return null;
  if (!Number.isInteger(number)) {
    addIssue(issues, `${path}_not_integer`);
    return null;
  }
  return number;
}

function validateOrdering(values, path, issues) {
  const numbers = values.map((value) => finiteNumberOrNull(value));
  if (numbers.some((number) => number === null)) {
    addIssue(issues, `${path}_missing`);
    return;
  }
  for (let index = 1; index < numbers.length; index += 1) {
    if (numbers[index - 1] > numbers[index]) {
      addIssue(issues, `${path}_ordering_invalid`);
      return;
    }
  }
}

function normalizeSourceHashes(sourceHashes = []) {
  return Array.from(new Set(
    (Array.isArray(sourceHashes) ? sourceHashes : [])
      .map(cleanString)
      .filter(hasHash)
  )).sort();
}

function hasRequiredLineage(result, issues, section) {
  const required = [
    "normalizationVersion",
    "calculationPolicyVersion",
    "pipelineVersion",
    "inputHash",
    "outputHash",
  ];
  for (const field of required) {
    if (!cleanString(result?.[field])) addIssue(issues, `${section}_${field}_missing`);
  }
  validateHash(result?.inputHash, `${section}_inputHash`, issues, { strict: true });
  validateHash(result?.outputHash, `${section}_outputHash`, issues, { strict: true });
  if (normalizeSourceHashes(result?.sourceHashes).length === 0) {
    addIssue(issues, `${section}_sourceHashes_missing`);
  }
}

function isProviderApproved(result, viewModel, currentPortfolioFingerprint, issues, section) {
  if (viewModel?.status !== "ready") addIssue(issues, `${section}_adapter_not_ready`);
  if (cleanString(viewModel?.portfolioFingerprint) !== cleanString(currentPortfolioFingerprint)) {
    addIssue(issues, `${section}_portfolioFingerprint_mismatch`);
  }
  if (result?.fixtureOnly !== false || viewModel?.fixtureOnly !== false) {
    addIssue(issues, `${section}_fixtureOnly_not_provider_eligible`);
  }
  if (result?.productionPublishReady !== true || viewModel?.productionPublishReady !== true) {
    addIssue(issues, `${section}_productionPublishReady_not_true`);
  }
  if (result?.appExportApproved !== true || viewModel?.appExportApproved !== true) {
    addIssue(issues, `${section}_appExportApproved_not_true`);
  }
  hasRequiredLineage(result, issues, section);
}

function validateProbabilityResult(result, issues) {
  validateOrdering([result?.terminalValue?.p10, result?.terminalValue?.p50, result?.terminalValue?.p90], "probability_terminalValue", issues);
  for (const month of ["month12", "month36", "month60"]) {
    validateFinite(result?.principalShortfallProbability?.[month], `probability_shortfall_${month}`, issues, {
      min: 0,
      max: 1,
      nullable: true,
    });
  }
  validateOrdering([result?.scenarioMdd?.p10, result?.scenarioMdd?.p50, result?.scenarioMdd?.p90], "probability_scenarioMdd", issues);
  for (const key of ["p10", "p50", "p90"]) {
    validateFinite(result?.scenarioMdd?.[key], `probability_scenarioMdd_${key}`, issues, { min: -1, max: 0 });
  }
  validateFinite(result?.recovery?.medianRecoveryMonths, "probability_recovery_medianRecoveryMonths", issues, { min: 0, nullable: true });
  validateFinite(result?.recovery?.longestRecoveryMonths, "probability_recovery_longestRecoveryMonths", issues, { min: 0, nullable: true });
  validateFinite(result?.recovery?.unrecoveredScenarioRatio, "probability_recovery_unrecoveredScenarioRatio", issues, { min: 0, max: 1 });
  validateInteger(result?.simulationCount, "probability_simulationCount", issues, { min: 1 });
  const blockMonths = validateInteger(result?.blockMonths, "probability_blockMonths", issues, { min: 1 });
  if (blockMonths !== null && ![6, 12].includes(blockMonths)) addIssue(issues, "probability_blockMonths_invalid");
  validateInteger(result?.randomSeed, "probability_randomSeed", issues);
}

function compactProbabilityResult(result) {
  return {
    sectionVersion: "probability-ai-context-v1-step114-2j",
    scenarioVersion: cleanString(result.scenarioVersion),
    method: cleanString(result.method),
    prngAlgorithm: cleanString(result.prngAlgorithm),
    randomSeed: result.randomSeed,
    simulationCount: result.simulationCount,
    blockMonths: result.blockMonths,
    returnBasis: cleanString(result.returnBasis),
    currencyMode: cleanString(result.currencyMode),
    dataStartDate: cleanString(result.dataStartDate),
    dataEndDate: cleanString(result.dataEndDate),
    inputHash: cleanString(result.inputHash),
    outputHash: cleanString(result.outputHash),
    sourceHashes: normalizeSourceHashes(result.sourceHashes),
    normalizationVersion: cleanString(result.normalizationVersion),
    calculationPolicyVersion: cleanString(result.calculationPolicyVersion),
    pipelineVersion: cleanString(result.pipelineVersion),
    terminalValue: {
      p10: result.terminalValue.p10,
      p50: result.terminalValue.p50,
      p90: result.terminalValue.p90,
    },
    principalShortfallProbability: {
      month12: result.principalShortfallProbability?.month12 ?? null,
      month36: result.principalShortfallProbability?.month36 ?? null,
      month60: result.principalShortfallProbability?.month60 ?? null,
    },
    scenarioMdd: {
      p10: result.scenarioMdd.p10,
      p50: result.scenarioMdd.p50,
      p90: result.scenarioMdd.p90,
    },
    recovery: {
      medianRecoveryMonths: result.recovery?.medianRecoveryMonths ?? null,
      longestRecoveryMonths: result.recovery?.longestRecoveryMonths ?? null,
      unrecoveredScenarioRatio: result.recovery?.unrecoveredScenarioRatio ?? null,
    },
  };
}

function compactBetaProvenance(events = []) {
  const entries = [];
  for (const event of Array.isArray(events) ? events : []) {
    for (const [assetKey, provenance] of Object.entries(event?.betaProvenance || {})) {
      if (!isPlainObject(provenance)) continue;
      entries.push({
        assetKey,
        sourceName: cleanString(provenance.sourceName),
        asOfDate: cleanString(provenance.asOfDate),
        betaWindow: cleanString(provenance.betaWindow),
        methodVersion: cleanString(provenance.methodVersion),
        sourceHashAvailable: Boolean(cleanString(provenance.sourceHash)),
      });
    }
  }
  return entries.sort((left, right) => left.assetKey.localeCompare(right.assetKey));
}

function compactShockAssumptions(result) {
  return (Array.isArray(result.shockEvents) ? result.shockEvents : []).map((event) => ({
    monthIndex: event.monthIndex,
    label: cleanString(event.label || result.scenarioLabel || result.scenarioId),
    shockMode: cleanString(event.shockMode || result.shockMode),
    marketFactorShock: event.marketFactorShock ?? null,
    assetShockReturns: isPlainObject(event.assetShockReturns) ? event.assetShockReturns : null,
    assetBetas: isPlainObject(event.assetBetas) ? event.assetBetas : null,
  }));
}

function validateExternalShockResult(result, issues) {
  if (result?.occurrenceProbabilityEstimated !== false) {
    addIssue(issues, "externalShock_occurrenceProbabilityEstimated_not_false");
  }
  validateHash(result?.baselineIdentityHash, "externalShock_baselineIdentityHash", issues, { strict: true });
  validateFinite(result?.baselineTerminalValue, "externalShock_baselineTerminalValue", issues, { min: 0 });
  validateFinite(result?.stressedTerminalValue, "externalShock_stressedTerminalValue", issues, { min: 0 });
  validateFinite(result?.terminalDeltaValue, "externalShock_terminalDeltaValue", issues);
  validateFinite(result?.terminalDeltaRate, "externalShock_terminalDeltaRate", issues, { min: -1, max: 10 });
  validateFinite(result?.baselineMdd, "externalShock_baselineMdd", issues, { min: -1, max: 0 });
  validateFinite(result?.stressedMdd, "externalShock_stressedMdd", issues, { min: -1, max: 0 });
  validateFinite(result?.incrementalMdd, "externalShock_incrementalMdd", issues, { min: -1, max: 1 });
  validateFinite(result?.recoveryMonths, "externalShock_recoveryMonths", issues, { min: 0, nullable: true });
  validateFinite(result?.longestRecoveryMonths, "externalShock_longestRecoveryMonths", issues, { min: 0, nullable: true });
  if (typeof result?.unrecovered !== "boolean") addIssue(issues, "externalShock_unrecovered_invalid");
  if (!Array.isArray(result?.shockEvents) || result.shockEvents.length === 0) {
    addIssue(issues, "externalShock_shockEvents_missing");
  }
  for (const [index, event] of (Array.isArray(result?.shockEvents) ? result.shockEvents : []).entries()) {
    validateInteger(event?.monthIndex, `externalShock_shockEvents_${index}_monthIndex`, issues, { min: 0 });
    const mode = cleanString(event?.shockMode || result?.shockMode);
    if (!["direct_asset", "market_beta"].includes(mode)) addIssue(issues, `externalShock_shockEvents_${index}_mode_invalid`);
  }
  if (!Array.isArray(result?.assetImpactSummary)) addIssue(issues, "externalShock_assetImpactSummary_missing");
}

function compactExternalShockResult(result) {
  return {
    sectionVersion: "external-shock-ai-context-v1-step114-2j",
    scenarioVersion: cleanString(result.scenarioVersion),
    scenarioId: cleanString(result.scenarioId),
    scenarioLabel: cleanString(result.scenarioLabel),
    mode: cleanString(result.shockMode),
    method: cleanString(result.method),
    occurrenceProbabilityEstimated: false,
    returnBasis: cleanString(result.returnBasis),
    currencyMode: cleanString(result.currencyMode),
    dataStartDate: cleanString(result.dataStartDate),
    dataEndDate: cleanString(result.dataEndDate),
    inputHash: cleanString(result.inputHash),
    outputHash: cleanString(result.outputHash),
    baselineIdentityHash: cleanString(result.baselineIdentityHash),
    sourceHashes: normalizeSourceHashes(result.sourceHashes),
    normalizationVersion: cleanString(result.normalizationVersion),
    calculationPolicyVersion: cleanString(result.calculationPolicyVersion),
    pipelineVersion: cleanString(result.pipelineVersion),
    shockAssumptions: compactShockAssumptions(result),
    terminalValue: {
      baseline: result.baselineTerminalValue,
      stressed: result.stressedTerminalValue,
      deltaValue: result.terminalDeltaValue,
      deltaRate: result.terminalDeltaRate,
    },
    mdd: {
      baseline: result.baselineMdd,
      stressed: result.stressedMdd,
      incremental: result.incrementalMdd,
    },
    recovery: {
      recoveryMonths: result.recoveryMonths ?? null,
      longestRecoveryMonths: result.longestRecoveryMonths ?? null,
      unrecovered: result.unrecovered,
    },
    assetImpact: (Array.isArray(result.assetImpactSummary) ? result.assetImpactSummary : []).map((asset) => ({
      market: cleanString(asset.market),
      ticker: cleanString(asset.ticker),
      baselineTerminalValue: asset.baselineTerminalValue,
      stressedTerminalValue: asset.stressedTerminalValue,
      deltaValue: asset.deltaValue,
      deltaRate: asset.deltaRate,
    })),
    betaProvenanceSummary: compactBetaProvenance(result.shockEvents),
  };
}

function createProviderContext({ currentPortfolioFingerprint, probability, externalShock }) {
  const sections = {};
  if (probability) sections.probability = probability;
  if (externalShock) sections.externalShock = externalShock;
  return {
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    target: AI_SCENARIO_CONTEXT_TARGET,
    interpretationOnly: true,
    calculationsImmutable: true,
    portfolioFingerprint: cleanString(currentPortfolioFingerprint),
    includedSections: Object.keys(sections),
    sections,
    disclaimers: [
      "AI는 STEP 4·5에서 계산된 검증 결과를 해석하며 직접 확률·MDD·충격 결과를 계산하지 않습니다.",
      "외부충격분석은 충격의 발생 확률을 의미하지 않습니다.",
      "투자 권유가 아닙니다.",
    ],
  };
}

export function buildAiScenarioInterpretationContext({
  currentPortfolioFingerprint = "",
  probabilityResult = null,
  probabilityViewModel = null,
  externalShockResult = null,
  externalShockViewModel = null,
} = {}) {
  const excludedSections = [];
  let probability = null;
  let externalShock = null;

  if (probabilityResult || probabilityViewModel) {
    const issues = [];
    if (!isPlainObject(probabilityResult)) addIssue(issues, "probability_result_missing");
    else {
      isProviderApproved(probabilityResult, probabilityViewModel, currentPortfolioFingerprint, issues, "probability");
      validateProbabilityResult(probabilityResult, issues);
    }
    if (issues.length === 0) probability = compactProbabilityResult(probabilityResult);
    else excludedSections.push({ section: "probability", reasons: issues });
  }

  if (externalShockResult || externalShockViewModel) {
    const issues = [];
    if (!isPlainObject(externalShockResult)) addIssue(issues, "externalShock_result_missing");
    else {
      isProviderApproved(externalShockResult, externalShockViewModel, currentPortfolioFingerprint, issues, "externalShock");
      validateExternalShockResult(externalShockResult, issues);
    }
    if (issues.length === 0) externalShock = compactExternalShockResult(externalShockResult);
    else excludedSections.push({ section: "externalShock", reasons: issues });
  }

  const providerContext = (probability || externalShock)
    ? createProviderContext({ currentPortfolioFingerprint, probability, externalShock })
    : null;

  return {
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    status: providerContext ? "ready" : (excludedSections.length > 0 ? "review_only_or_blocked" : "omitted"),
    providerEligible: Boolean(providerContext),
    providerContext,
    includedSections: providerContext?.includedSections || [],
    excludedSections,
  };
}

export function getProviderScenarioContext(scenarioInterpretationContext) {
  if (!isPlainObject(scenarioInterpretationContext)) return null;
  const providerContext = scenarioInterpretationContext.providerContext || scenarioInterpretationContext;
  if (!isPlainObject(providerContext)) return null;
  if (providerContext.contextVersion !== AI_SCENARIO_CONTEXT_VERSION) return null;
  if (providerContext.target !== AI_SCENARIO_CONTEXT_TARGET) return null;
  if (providerContext.interpretationOnly !== true || providerContext.calculationsImmutable !== true) return null;
  if (!Array.isArray(providerContext.includedSections) || providerContext.includedSections.length === 0) return null;
  return providerContext;
}

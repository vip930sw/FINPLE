export const AI_SCENARIO_CONTEXT_VERSION = "ai-scenario-context-v1-step114-2j";
export const AI_SCENARIO_CONTEXT_TARGET = "simulator-step6";
export const AI_SCENARIO_CONTEXT_BUILDER_ID = "finple-ai-scenario-context-builder-v1-step114-2j";
export const AI_SCENARIO_APPROVAL_EVIDENCE_VERSION = "scenario-provider-approval-evidence-v1-step114-2j";

export const AI_SCENARIO_CONTEXT_LIMITS = Object.freeze({
  maxSerializedBytes: 12000,
  maxSourceHashes: 20,
  maxShockEvents: 6,
  maxAssetImpact: 20,
  maxBetaProvenance: 20,
  maxStringLength: 180,
});

const HASH_PATTERN = /^[a-f0-9]{64}$/i;
const SOURCE_HASH_PATTERN = /^[A-Za-z0-9._:-]{3,160}$/;
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,15}$/;

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

function addIssue(issues, issue) {
  if (!issues.includes(issue)) issues.push(issue);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function stableSerialize(value) {
  return JSON.stringify(stableValue(value));
}

function deterministicSignature(value) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function serializedByteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function hasOnlyKeys(value, allowedKeys, path, issues) {
  if (!isPlainObject(value)) {
    addIssue(issues, `${path}_not_object`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) addIssue(issues, `${path}_unknown_key:${key}`);
  }
  return true;
}

function validateShortString(value, path, issues, { required = true, pattern = null } = {}) {
  const text = cleanString(value);
  if (!text) {
    if (required) addIssue(issues, `${path}_missing`);
    return "";
  }
  if (text.length > AI_SCENARIO_CONTEXT_LIMITS.maxStringLength) addIssue(issues, `${path}_too_long`);
  if (pattern && !pattern.test(text)) addIssue(issues, `${path}_invalid`);
  return text;
}

function validateSha256(value, path, issues) {
  return validateShortString(value, path, issues, { pattern: HASH_PATTERN });
}

function validateSourceHashes(value, path, issues) {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, `${path}_missing`);
    return [];
  }
  if (value.length > AI_SCENARIO_CONTEXT_LIMITS.maxSourceHashes) addIssue(issues, `${path}_too_many`);
  const hashes = value.map((item, index) => validateShortString(item, `${path}_${index}`, issues, { pattern: SOURCE_HASH_PATTERN }));
  return Array.from(new Set(hashes.filter(Boolean))).sort();
}

function validateFinite(value, path, issues, { min = -Infinity, max = Infinity, nullable = false } = {}) {
  const number = finiteNumberOrNull(value);
  if (number === null) {
    if (!nullable) addIssue(issues, `${path}_missing`);
    return null;
  }
  if (number < min || number > max) addIssue(issues, `${path}_out_of_range`);
  return number;
}

function validateInteger(value, path, issues, options = {}) {
  const number = validateFinite(value, path, issues, options);
  if (number !== null && !Number.isInteger(number)) addIssue(issues, `${path}_not_integer`);
  return number;
}

function validateAscending(values, path, issues) {
  const numbers = values.map((value) => finiteNumberOrNull(value));
  if (numbers.some((number) => number === null)) {
    addIssue(issues, `${path}_missing`);
    return;
  }
  for (let index = 1; index < numbers.length; index += 1) {
    if (numbers[index - 1] > numbers[index]) addIssue(issues, `${path}_ordering_invalid`);
  }
}

function normalizeSourceHashes(sourceHashes = []) {
  return Array.from(new Set(
    (Array.isArray(sourceHashes) ? sourceHashes : [])
      .map(cleanString)
      .filter((hash) => SOURCE_HASH_PATTERN.test(hash))
  )).sort();
}

function validateLineage(result, issues, section) {
  validateSha256(result?.inputHash, `${section}_inputHash`, issues);
  validateSha256(result?.outputHash, `${section}_outputHash`, issues);
  const sourceHashes = validateSourceHashes(result?.sourceHashes, `${section}_sourceHashes`, issues);
  validateShortString(result?.normalizationVersion, `${section}_normalizationVersion`, issues);
  validateShortString(result?.calculationPolicyVersion, `${section}_calculationPolicyVersion`, issues);
  validateShortString(result?.pipelineVersion, `${section}_pipelineVersion`, issues);
  return sourceHashes;
}

function validateApprovalEvidence(viewModel, result, currentPortfolioFingerprint, issues, section) {
  const evidence = viewModel?.providerApprovalEvidence;
  hasOnlyKeys(evidence, [
    "evidenceVersion",
    "fixtureOnly",
    "productionPublishReady",
    "appExportApproved",
    "sourceKind",
    "portfolioFingerprint",
    "inputHash",
    "outputHash",
    "sourceHashes",
    "normalizationVersion",
    "calculationPolicyVersion",
    "pipelineVersion",
    "approvalSource",
  ], `${section}_approvalEvidence`, issues);
  if (!isPlainObject(evidence)) return null;
  if (evidence.evidenceVersion !== AI_SCENARIO_APPROVAL_EVIDENCE_VERSION) addIssue(issues, `${section}_approvalEvidence_version_invalid`);
  if (evidence.fixtureOnly !== false || viewModel?.fixtureOnly !== false) addIssue(issues, `${section}_fixtureOnly_not_provider_eligible`);
  if (evidence.productionPublishReady !== true || viewModel?.productionPublishReady !== true) addIssue(issues, `${section}_productionPublishReady_not_true`);
  if (evidence.appExportApproved !== true || viewModel?.appExportApproved !== true) addIssue(issues, `${section}_appExportApproved_not_true`);
  if (cleanString(evidence.sourceKind) !== "synthetic_non_fixture_contract") addIssue(issues, `${section}_sourceKind_not_provider_contract`);
  if (cleanString(evidence.portfolioFingerprint) !== cleanString(currentPortfolioFingerprint)) addIssue(issues, `${section}_portfolioFingerprint_mismatch`);
  if (cleanString(evidence.portfolioFingerprint) !== cleanString(viewModel?.portfolioFingerprint)) addIssue(issues, `${section}_viewModelFingerprint_mismatch`);
  if (cleanString(evidence.inputHash) !== cleanString(result?.inputHash)) addIssue(issues, `${section}_approvalInputHash_mismatch`);
  if (cleanString(evidence.outputHash) !== cleanString(result?.outputHash)) addIssue(issues, `${section}_approvalOutputHash_mismatch`);
  if (cleanString(evidence.normalizationVersion) !== cleanString(result?.normalizationVersion)) addIssue(issues, `${section}_approvalNormalizationVersion_mismatch`);
  if (cleanString(evidence.calculationPolicyVersion) !== cleanString(result?.calculationPolicyVersion)) addIssue(issues, `${section}_approvalCalculationPolicyVersion_mismatch`);
  if (cleanString(evidence.pipelineVersion) !== cleanString(result?.pipelineVersion)) addIssue(issues, `${section}_approvalPipelineVersion_mismatch`);
  const evidenceHashes = validateSourceHashes(evidence.sourceHashes, `${section}_approvalSourceHashes`, issues);
  const resultHashes = new Set(normalizeSourceHashes(result?.sourceHashes));
  const sortedResultHashes = Array.from(resultHashes).sort();
  if (evidenceHashes.join("|") !== sortedResultHashes.join("|")) addIssue(issues, `${section}_approvalSourceHashes_mismatch`);
  validateShortString(evidence.approvalSource, `${section}_approvalSource`, issues);
  return {
    evidenceVersion: AI_SCENARIO_APPROVAL_EVIDENCE_VERSION,
    fixtureOnly: false,
    productionPublishReady: true,
    appExportApproved: true,
    sourceKind: "synthetic_non_fixture_contract",
    portfolioFingerprint: cleanString(evidence.portfolioFingerprint),
    inputHash: cleanString(evidence.inputHash),
    outputHash: cleanString(evidence.outputHash),
    sourceHashes: evidenceHashes,
    normalizationVersion: cleanString(evidence.normalizationVersion),
    calculationPolicyVersion: cleanString(evidence.calculationPolicyVersion),
    pipelineVersion: cleanString(evidence.pipelineVersion),
    approvalSource: cleanString(evidence.approvalSource),
  };
}

function validateProviderPrerequisites(result, viewModel, currentPortfolioFingerprint, issues, section) {
  if (viewModel?.status !== "ready") addIssue(issues, `${section}_adapter_not_ready`);
  if (cleanString(viewModel?.portfolioFingerprint) !== cleanString(currentPortfolioFingerprint)) {
    addIssue(issues, `${section}_portfolioFingerprint_mismatch`);
  }
  const sourceHashes = validateLineage(result, issues, section);
  const approvalEvidence = validateApprovalEvidence(viewModel, result, currentPortfolioFingerprint, issues, section);
  return { sourceHashes, approvalEvidence };
}

function validateProbabilityResult(result, issues) {
  hasOnlyKeys(result?.terminalValue, ["p10", "p25", "p50", "p75", "p90"], "probability_terminalValue", issues);
  hasOnlyKeys(result?.principalShortfallProbability, ["month12", "month36", "month60"], "probability_shortfall", issues);
  hasOnlyKeys(result?.scenarioMdd, ["p10", "p25", "p50", "p75", "p90"], "probability_scenarioMdd", issues);
  hasOnlyKeys(result?.recovery, ["medianRecoveryMonths", "longestRecoveryMonths", "unrecoveredScenarioRatio"], "probability_recovery", issues);
  validateAscending([result?.terminalValue?.p10, result?.terminalValue?.p50, result?.terminalValue?.p90], "probability_terminalValue", issues);
  for (const month of ["month12", "month36", "month60"]) {
    validateFinite(result?.principalShortfallProbability?.[month], `probability_shortfall_${month}`, issues, { min: 0, max: 1, nullable: true });
  }
  validateAscending([result?.scenarioMdd?.p10, result?.scenarioMdd?.p50, result?.scenarioMdd?.p90], "probability_scenarioMdd", issues);
  for (const key of ["p10", "p50", "p90"]) validateFinite(result?.scenarioMdd?.[key], `probability_scenarioMdd_${key}`, issues, { min: -1, max: 0 });
  validateFinite(result?.recovery?.medianRecoveryMonths, "probability_recovery_medianRecoveryMonths", issues, { min: 0, nullable: true });
  validateFinite(result?.recovery?.longestRecoveryMonths, "probability_recovery_longestRecoveryMonths", issues, { min: 0, nullable: true });
  validateFinite(result?.recovery?.unrecoveredScenarioRatio, "probability_recovery_unrecoveredScenarioRatio", issues, { min: 0, max: 1 });
  validateInteger(result?.simulationCount, "probability_simulationCount", issues, { min: 1 });
  const blockMonths = validateInteger(result?.blockMonths, "probability_blockMonths", issues, { min: 1 });
  if (blockMonths !== null && ![6, 12].includes(blockMonths)) addIssue(issues, "probability_blockMonths_invalid");
  validateInteger(result?.randomSeed, "probability_randomSeed", issues);
}

function compactProbabilityResult(result, sourceHashes, approvalEvidence) {
  return {
    sectionVersion: "probability-ai-context-v1-step114-2j",
    approvalEvidence,
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
    sourceHashes,
    normalizationVersion: cleanString(result.normalizationVersion),
    calculationPolicyVersion: cleanString(result.calculationPolicyVersion),
    pipelineVersion: cleanString(result.pipelineVersion),
    terminalValue: { p10: result.terminalValue.p10, p50: result.terminalValue.p50, p90: result.terminalValue.p90 },
    principalShortfallProbability: {
      month12: result.principalShortfallProbability?.month12 ?? null,
      month36: result.principalShortfallProbability?.month36 ?? null,
      month60: result.principalShortfallProbability?.month60 ?? null,
    },
    scenarioMdd: { p10: result.scenarioMdd.p10, p50: result.scenarioMdd.p50, p90: result.scenarioMdd.p90 },
    recovery: {
      medianRecoveryMonths: result.recovery?.medianRecoveryMonths ?? null,
      longestRecoveryMonths: result.recovery?.longestRecoveryMonths ?? null,
      unrecoveredScenarioRatio: result.recovery?.unrecoveredScenarioRatio ?? null,
    },
  };
}

function validateAssetKey(key, path, issues) {
  const text = validateShortString(key, path, issues);
  const [market, ticker] = text.split(":");
  if (!["US", "KR"].includes(market) || !TICKER_PATTERN.test(ticker || "")) addIssue(issues, `${path}_assetKey_invalid`);
  return text;
}

function validateShockAssumptions(result, issues) {
  const events = Array.isArray(result?.shockEvents) ? result.shockEvents : [];
  if (events.length === 0) addIssue(issues, "externalShock_shockEvents_missing");
  if (events.length > AI_SCENARIO_CONTEXT_LIMITS.maxShockEvents) addIssue(issues, "externalShock_shockEvents_too_many");
  let previousMonth = -1;
  const seenMonths = new Set();
  return events.map((event, index) => {
    hasOnlyKeys(event, ["monthIndex", "label", "shockMode", "assetShockReturns", "marketFactorShock", "assetBetas", "betaProvenance"], `externalShock_event_${index}`, issues);
    const monthIndex = validateInteger(event?.monthIndex, `externalShock_event_${index}_monthIndex`, issues, { min: 0 });
    if (monthIndex !== null) {
      if (seenMonths.has(monthIndex)) addIssue(issues, "externalShock_event_duplicate_month");
      if (monthIndex <= previousMonth) addIssue(issues, "externalShock_event_month_not_strict_ascending");
      seenMonths.add(monthIndex);
      previousMonth = monthIndex;
    }
    const shockMode = cleanString(event?.shockMode || result?.shockMode);
    if (!["direct_asset", "market_beta"].includes(shockMode)) addIssue(issues, `externalShock_event_${index}_mode_invalid`);
    const assetShockReturns = isPlainObject(event?.assetShockReturns) ? event.assetShockReturns : null;
    const assetBetas = isPlainObject(event?.assetBetas) ? event.assetBetas : null;
    const shockKeys = Object.keys(assetShockReturns || {}).sort();
    const betaKeys = Object.keys(assetBetas || {}).sort();
    if (shockKeys.length > AI_SCENARIO_CONTEXT_LIMITS.maxAssetImpact) addIssue(issues, `externalShock_event_${index}_assetShockReturns_too_many`);
    if (betaKeys.length > AI_SCENARIO_CONTEXT_LIMITS.maxAssetImpact) addIssue(issues, `externalShock_event_${index}_assetBetas_too_many`);
    if (shockMode === "direct_asset" && shockKeys.length === 0) addIssue(issues, `externalShock_event_${index}_assetShockReturns_missing`);
    if (shockMode === "market_beta") {
      validateFinite(event?.marketFactorShock, `externalShock_event_${index}_marketFactorShock`, issues, { min: -0.999999 });
      if (betaKeys.length === 0) addIssue(issues, `externalShock_event_${index}_assetBetas_missing`);
      const provenanceKeys = Object.keys(event?.betaProvenance || {}).sort();
      if (provenanceKeys.join("|") !== betaKeys.join("|")) addIssue(issues, `externalShock_event_${index}_betaProvenance_identity_mismatch`);
    }
    for (const key of shockKeys) {
      validateAssetKey(key, `externalShock_event_${index}_assetShockKey`, issues);
      validateFinite(assetShockReturns[key], `externalShock_event_${index}_assetShockReturn`, issues, { min: -0.999999 });
    }
    for (const key of betaKeys) {
      validateAssetKey(key, `externalShock_event_${index}_assetBetaKey`, issues);
      validateFinite(assetBetas[key], `externalShock_event_${index}_assetBeta`, issues, { min: -10, max: 10 });
    }
    if (shockKeys.length > 0 && betaKeys.length > 0 && shockKeys.join("|") !== betaKeys.join("|")) {
      addIssue(issues, `externalShock_event_${index}_shock_beta_identity_mismatch`);
    }
    return {
      monthIndex,
      label: validateShortString(event?.label || result?.scenarioLabel || result?.scenarioId, `externalShock_event_${index}_label`, issues),
      shockMode,
      marketFactorShock: event?.marketFactorShock ?? null,
      assetShockReturns,
      assetBetas,
    };
  });
}

function compactBetaProvenance(events = [], issues = []) {
  const entries = [];
  for (const [eventIndex, event] of (Array.isArray(events) ? events : []).entries()) {
    if (!isPlainObject(event?.betaProvenance)) continue;
    for (const [assetKey, provenance] of Object.entries(event.betaProvenance)) {
      hasOnlyKeys(provenance, ["sourceName", "asOfDate", "betaWindow", "methodVersion", "sourceHash"], `externalShock_betaProvenance_${eventIndex}`, issues);
      entries.push({
        assetKey: validateAssetKey(assetKey, `externalShock_betaProvenance_${eventIndex}_assetKey`, issues),
        sourceName: validateShortString(provenance?.sourceName, `externalShock_betaProvenance_${eventIndex}_sourceName`, issues),
        asOfDate: validateShortString(provenance?.asOfDate, `externalShock_betaProvenance_${eventIndex}_asOfDate`, issues),
        betaWindow: validateShortString(provenance?.betaWindow, `externalShock_betaProvenance_${eventIndex}_betaWindow`, issues),
        methodVersion: validateShortString(provenance?.methodVersion, `externalShock_betaProvenance_${eventIndex}_methodVersion`, issues),
        sourceHashAvailable: Boolean(validateShortString(provenance?.sourceHash, `externalShock_betaProvenance_${eventIndex}_sourceHash`, issues, { pattern: SOURCE_HASH_PATTERN })),
      });
    }
  }
  if (entries.length > AI_SCENARIO_CONTEXT_LIMITS.maxBetaProvenance) addIssue(issues, "externalShock_betaProvenance_too_many");
  return entries.sort((left, right) => left.assetKey.localeCompare(right.assetKey));
}

function compactAssetImpact(result, issues) {
  const impact = Array.isArray(result?.assetImpactSummary) ? result.assetImpactSummary : [];
  if (impact.length > AI_SCENARIO_CONTEXT_LIMITS.maxAssetImpact) addIssue(issues, "externalShock_assetImpact_too_many");
  const seenAssetKeys = new Set();
  let deltaSum = 0;
  return impact.map((asset, index) => {
    hasOnlyKeys(asset, ["market", "ticker", "key", "baselineTerminalValue", "stressedTerminalValue", "deltaValue", "deltaRate"], `externalShock_assetImpact_${index}`, issues);
    const market = validateShortString(asset?.market, `externalShock_assetImpact_${index}_market`, issues);
    const ticker = validateShortString(asset?.ticker, `externalShock_assetImpact_${index}_ticker`, issues, { pattern: TICKER_PATTERN });
    const assetKey = `${market}:${ticker}`;
    if (asset?.key && cleanString(asset.key) !== assetKey) addIssue(issues, `externalShock_assetImpact_${index}_identity_mismatch`);
    if (seenAssetKeys.has(assetKey)) addIssue(issues, `externalShock_assetImpact_${index}_duplicate_identity`);
    seenAssetKeys.add(assetKey);
    const baselineTerminalValue = validateFinite(asset?.baselineTerminalValue, `externalShock_assetImpact_${index}_baselineTerminalValue`, issues, { min: 0 });
    const stressedTerminalValue = validateFinite(asset?.stressedTerminalValue, `externalShock_assetImpact_${index}_stressedTerminalValue`, issues, { min: 0 });
    const deltaValue = validateFinite(asset?.deltaValue, `externalShock_assetImpact_${index}_deltaValue`, issues);
    if (baselineTerminalValue !== null && stressedTerminalValue !== null && deltaValue !== null &&
      Math.abs((stressedTerminalValue - baselineTerminalValue) - deltaValue) > 1e-5) {
      addIssue(issues, `externalShock_assetImpact_${index}_delta_reconciliation_invalid`);
    }
    deltaSum += deltaValue || 0;
    if (index === impact.length - 1 && Number.isFinite(result?.terminalDeltaValue) &&
      Math.abs(deltaSum - result.terminalDeltaValue) > 1e-5) {
      addIssue(issues, "externalShock_assetImpact_total_delta_reconciliation_invalid");
    }
    return {
      market,
      ticker,
      baselineTerminalValue,
      stressedTerminalValue,
      deltaValue,
      deltaRate: validateFinite(asset?.deltaRate, `externalShock_assetImpact_${index}_deltaRate`, issues, { min: -1, max: 10 }),
    };
  });
}

function validateExternalShockResult(result, issues) {
  if ((result?.occurrenceProbabilityEstimated ?? false) !== false) addIssue(issues, "externalShock_occurrenceProbabilityEstimated_not_false");
  validateSha256(result?.baselineIdentityHash, "externalShock_baselineIdentityHash", issues);
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
}

function compactExternalShockResult(result, sourceHashes, approvalEvidence, issues) {
  return {
    sectionVersion: "external-shock-ai-context-v1-step114-2j",
    approvalEvidence,
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
    sourceHashes,
    normalizationVersion: cleanString(result.normalizationVersion),
    calculationPolicyVersion: cleanString(result.calculationPolicyVersion),
    pipelineVersion: cleanString(result.pipelineVersion),
    shockAssumptions: validateShockAssumptions(result, issues),
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
    assetImpact: compactAssetImpact(result, issues),
    betaProvenanceSummary: compactBetaProvenance(result.shockEvents, issues),
  };
}

function createProviderContext({ currentPortfolioFingerprint, probability, externalShock }) {
  const sections = {};
  if (probability) sections.probability = probability;
  if (externalShock) sections.externalShock = externalShock;
  const includedSections = Object.keys(sections);
  return {
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    target: AI_SCENARIO_CONTEXT_TARGET,
    interpretationOnly: true,
    calculationsImmutable: true,
    portfolioFingerprint: cleanString(currentPortfolioFingerprint),
    includedSections,
    sections,
    disclaimers: [
      "AI는 STEP 4·5에서 계산된 검증 결과를 해석하며 직접 확률·MDD·충격 결과를 계산하지 않습니다.",
      "외부충격분석은 충격의 발생 확률을 의미하지 않습니다.",
      "투자 권유가 아닙니다.",
    ],
  };
}

function createIntegrity(providerContext, excludedSections) {
  return {
    builderId: AI_SCENARIO_CONTEXT_BUILDER_ID,
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    providerContextSignature: providerContext ? deterministicSignature(providerContext) : null,
    includedSectionCount: providerContext?.includedSections?.length || 0,
    excludedSectionCount: excludedSections.length,
    serializedBytes: providerContext ? serializedByteLength(providerContext) : 0,
  };
}

function getStatus({ providerContext, excludedSections }) {
  if (!providerContext && excludedSections.length === 0) return "omitted";
  if (excludedSections.some((entry) => entry.reasons.some((reason) =>
    reason.includes("portfolioFingerprint_mismatch") ||
    reason.includes("viewModelFingerprint_mismatch")
  ))) return "stale";
  if (!providerContext) return "blocked";
  if (providerContext.includedSections.length === 1 || excludedSections.length > 0) return "partial";
  return "ready";
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
      const { sourceHashes, approvalEvidence } = validateProviderPrerequisites(probabilityResult, probabilityViewModel, currentPortfolioFingerprint, issues, "probability");
      validateProbabilityResult(probabilityResult, issues);
      if (issues.length === 0) probability = compactProbabilityResult(probabilityResult, sourceHashes, approvalEvidence);
    }
    if (issues.length > 0) excludedSections.push({ section: "probability", reasons: issues });
  }

  if (externalShockResult || externalShockViewModel) {
    const issues = [];
    if (!isPlainObject(externalShockResult)) addIssue(issues, "externalShock_result_missing");
    else {
      const { sourceHashes, approvalEvidence } = validateProviderPrerequisites(externalShockResult, externalShockViewModel, currentPortfolioFingerprint, issues, "externalShock");
      validateExternalShockResult(externalShockResult, issues);
      const candidate = compactExternalShockResult(externalShockResult, sourceHashes, approvalEvidence, issues);
      if (issues.length === 0) externalShock = candidate;
    }
    if (issues.length > 0) excludedSections.push({ section: "externalShock", reasons: issues });
  }

  const providerContext = (probability || externalShock)
    ? createProviderContext({ currentPortfolioFingerprint, probability, externalShock })
    : null;
  const integrity = createIntegrity(providerContext, excludedSections);
  if (providerContext && integrity.serializedBytes > AI_SCENARIO_CONTEXT_LIMITS.maxSerializedBytes) {
    excludedSections.push({ section: "all", reasons: ["scenarioContext_serialized_size_exceeded"] });
  }
  const finalProviderContext = excludedSections.some((entry) => entry.reasons.includes("scenarioContext_serialized_size_exceeded"))
    ? null
    : providerContext;
  const finalIntegrity = createIntegrity(finalProviderContext, excludedSections);
  const status = getStatus({ providerContext: finalProviderContext, excludedSections });

  return {
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    status,
    providerEligible: Boolean(finalProviderContext),
    providerContext: finalProviderContext,
    integrity: finalIntegrity,
    includedSections: finalProviderContext?.includedSections || [],
    excludedSections,
  };
}

export function getProviderScenarioContext(scenarioInterpretationContext) {
  if (!isPlainObject(scenarioInterpretationContext)) return null;
  if (scenarioInterpretationContext.contextVersion !== AI_SCENARIO_CONTEXT_VERSION) return null;
  if (!["ready", "partial"].includes(scenarioInterpretationContext.status)) return null;
  if (scenarioInterpretationContext.providerEligible !== true) return null;
  if (!isPlainObject(scenarioInterpretationContext.integrity)) return null;
  if (scenarioInterpretationContext.integrity.builderId !== AI_SCENARIO_CONTEXT_BUILDER_ID) return null;
  const providerContext = scenarioInterpretationContext.providerContext;
  if (!isPlainObject(providerContext)) return null;
  if (providerContext.contextVersion !== AI_SCENARIO_CONTEXT_VERSION) return null;
  if (providerContext.target !== AI_SCENARIO_CONTEXT_TARGET) return null;
  if (providerContext.interpretationOnly !== true || providerContext.calculationsImmutable !== true) return null;
  if (!Array.isArray(providerContext.includedSections) || providerContext.includedSections.length === 0) return null;
  const expectedSignature = deterministicSignature(providerContext);
  if (scenarioInterpretationContext.integrity.providerContextSignature !== expectedSignature) return null;
  if (serializedByteLength(providerContext) > AI_SCENARIO_CONTEXT_LIMITS.maxSerializedBytes) return null;
  return providerContext;
}

export function getProviderScenarioContextWrapper(scenarioInterpretationContext) {
  const providerContext = getProviderScenarioContext(scenarioInterpretationContext);
  if (!providerContext) return null;
  return {
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    status: providerContext.includedSections.length >= 2 ? "ready" : "partial",
    providerEligible: true,
    providerContext,
    integrity: {
      builderId: AI_SCENARIO_CONTEXT_BUILDER_ID,
      contextVersion: AI_SCENARIO_CONTEXT_VERSION,
      providerContextSignature: deterministicSignature(providerContext),
      includedSectionCount: providerContext.includedSections.length,
      excludedSectionCount: 0,
      serializedBytes: serializedByteLength(providerContext),
    },
  };
}

function categorizeExclusionReasons(reasons = []) {
  const text = (Array.isArray(reasons) ? reasons : []).join("|");
  if (/portfolioFingerprint_mismatch|viewModelFingerprint_mismatch/.test(text)) return "stale_identity";
  if (/fixtureOnly|fixture|review|sourceKind/.test(text)) return "review_only_or_fixture";
  if (/productionPublishReady|appExportApproved|approval/.test(text)) return "approval_not_ready";
  if (/hash|lineage|version|source/.test(text)) return "lineage_invalid";
  if (/range|ordering|missing|invalid|mismatch/.test(text)) return "validation_failed";
  return "excluded";
}

export function summarizeScenarioContextState(scenarioInterpretationContext) {
  if (!isPlainObject(scenarioInterpretationContext)) {
    return {
      status: "omitted",
      includedSections: [],
      excludedSections: [],
      reasonCategory: "not_supplied",
      providerContext: null,
    };
  }
  const status = ["omitted", "ready", "partial", "blocked", "stale"].includes(scenarioInterpretationContext.status)
    ? scenarioInterpretationContext.status
    : "blocked";
  const providerContext = getProviderScenarioContext(scenarioInterpretationContext);
  const excludedSections = Array.isArray(scenarioInterpretationContext.excludedSections)
    ? scenarioInterpretationContext.excludedSections.map((entry) => ({
      section: cleanString(entry?.section || "unknown"),
      reasonCategory: categorizeExclusionReasons(entry?.reasons),
    }))
    : [];
  return {
    status,
    includedSections: providerContext?.includedSections || [],
    excludedSections,
    reasonCategory: excludedSections[0]?.reasonCategory || (status === "omitted" ? "not_supplied" : "none"),
    providerContext,
  };
}

export function buildSimulatorAiScenarioContext(scenarioContextInputs = null) {
  if (!isPlainObject(scenarioContextInputs)) return null;
  const currentPortfolioFingerprint = cleanString(
    scenarioContextInputs.currentPortfolioFingerprint ||
    scenarioContextInputs.probabilityViewModel?.portfolioFingerprint ||
    scenarioContextInputs.externalShockViewModel?.portfolioFingerprint
  );
  if (!currentPortfolioFingerprint) return null;
  return buildAiScenarioInterpretationContext({
    currentPortfolioFingerprint,
    probabilityResult: scenarioContextInputs.probabilityResult || null,
    probabilityViewModel: scenarioContextInputs.probabilityViewModel || null,
    externalShockResult: scenarioContextInputs.externalShockResult || null,
    externalShockViewModel: scenarioContextInputs.externalShockViewModel || null,
  });
}

export function formatScenarioMoney(value) {
  if (value === null || value === undefined || value === "") return "미확인";
  const number = Number(value);
  if (!Number.isFinite(number)) return "미확인";
  return number.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

export function formatScenarioRatio(value) {
  if (value === null || value === undefined || value === "") return "미확인";
  const number = Number(value);
  if (!Number.isFinite(number)) return "미확인";
  return `${(number * 100).toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

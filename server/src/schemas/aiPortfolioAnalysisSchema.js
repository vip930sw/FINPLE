const MAX_ASSET_COUNT = 20;
const WEIGHT_TOLERANCE = 0.5;
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,15}$/;
export const AI_SCENARIO_CONTEXT_VERSION = "ai-scenario-context-v1-step114-2j";
const AI_SCENARIO_CONTEXT_TARGETS = new Set(["simulator-step6"]);
const AI_ANALYSIS_CONTEXTS = new Set(["simulator-step4", "simulator-step6"]);
const AI_SCENARIO_APPROVAL_EVIDENCE_VERSION = "scenario-provider-approval-evidence-v1-step114-2j";
const AI_SCENARIO_CONTEXT_BUILDER_ID = "finple-ai-scenario-context-builder-v1-step114-2j";
const HASH_PATTERN = /^[a-f0-9]{64}$/i;
const SOURCE_HASH_PATTERN = /^[A-Za-z0-9._:-]{3,160}$/;
const ASSET_KEY_PATTERN = /^(US|KR):[A-Z0-9][A-Z0-9.-]{0,15}$/;
const AI_SCENARIO_CONTEXT_LIMITS = {
  maxSerializedBytes: 12000,
  maxSourceHashes: 20,
  maxShockEvents: 6,
  maxAssetImpact: 20,
  maxBetaProvenance: 20,
  maxStringLength: 180,
};

const NUMERIC_LIMITS = {
  weight: { min: 0, max: 100 },
  cagr: { min: -100, max: 300 },
  expectedCagr: { min: -100, max: 300 },
  beta: { min: -5, max: 15 },
  mdd: { min: -100, max: 0 },
  dividendYield: { min: 0, max: 300 },
  dataYears: { min: 0, max: 150 },
  calmar: { min: -50, max: 50 },
  futureValue: { min: 0, max: Number.MAX_SAFE_INTEGER },
  inflationAdjustedFutureValue: { min: 0, max: Number.MAX_SAFE_INTEGER },
};

const PORTFOLIO_METRIC_FIELDS = [
  "cagr",
  "expectedCagr",
  "beta",
  "mdd",
  "calmar",
  "dividendYield",
  "futureValue",
  "inflationAdjustedFutureValue",
];

const ASSET_NUMERIC_FIELDS = [
  "weight",
  "cagr",
  "expectedCagr",
  "beta",
  "mdd",
  "dividendYield",
  "dataYears",
];

export function createHttpError(statusCode, message, details = []) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeTicker(value) {
  return clean(value).toUpperCase();
}

function normalizeMarket(value) {
  const market = clean(value).toUpperCase();
  return market || "US";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toFiniteNumber(value, path, errors) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(clean(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) {
    errors.push(`${path} must be a finite number.`);
    return null;
  }
  return number;
}

function validateNumberRange(value, field, path, errors) {
  if (value === null) return null;
  const limits = NUMERIC_LIMITS[field];
  if (!limits) return value;
  if (value < limits.min || value > limits.max) {
    errors.push(`${path} must be between ${limits.min} and ${limits.max}.`);
  }
  return value;
}

function normalizeNumericField(source, field, path, errors) {
  const value = toFiniteNumber(source?.[field], `${path}.${field}`, errors);
  return validateNumberRange(value, field, `${path}.${field}`, errors);
}

function validateRequiredString(value, path, errors, { hash = false, sourceHash = false } = {}) {
  const text = clean(value);
  if (!text) {
    errors.push(`${path} is required.`);
    return "";
  }
  if (hash && !HASH_PATTERN.test(text)) errors.push(`${path} must be a sha256 hash.`);
  if (sourceHash && !SOURCE_HASH_PATTERN.test(text)) errors.push(`${path} is invalid.`);
  if (text.length > AI_SCENARIO_CONTEXT_LIMITS.maxStringLength) errors.push(`${path} exceeds ${AI_SCENARIO_CONTEXT_LIMITS.maxStringLength} characters.`);
  return text;
}

function validateAllowedKeys(value, allowedKeys, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be an object.`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) errors.push(`${path}.${key} is not allowed.`);
  }
  return true;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isPlainObject(value)) return value;
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

function validateContextNumber(value, path, errors, { min = -Infinity, max = Infinity, nullable = false, integer = false } = {}) {
  if (value === null || value === undefined || value === "") {
    if (!nullable) errors.push(`${path} is required.`);
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path} must be a finite number.`);
    return null;
  }
  if (integer && !Number.isInteger(value)) errors.push(`${path} must be an integer.`);
  if (value < min || value > max) errors.push(`${path} must be between ${min} and ${max}.`);
  return value;
}

function validateContextOrdering(values, path, errors) {
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    errors.push(`${path} must contain finite numbers.`);
    return;
  }
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1] > values[index]) errors.push(`${path} must be ascending.`);
  }
}

function normalizeSourceHashes(value, path, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must contain at least one source hash.`);
    return [];
  }
  if (value.length > AI_SCENARIO_CONTEXT_LIMITS.maxSourceHashes) {
    errors.push(`${path} cannot contain more than ${AI_SCENARIO_CONTEXT_LIMITS.maxSourceHashes} items.`);
  }
  const hashes = value.map((item, index) => validateRequiredString(item, `${path}[${index}]`, errors, { sourceHash: true }));
  return Array.from(new Set(hashes.filter(Boolean))).sort();
}

function normalizeApprovalEvidence(evidence, path, section, errors) {
  validateAllowedKeys(evidence, [
    "evidenceVersion",
    "fixtureOnly",
    "productionPublishReady",
    "appExportApproved",
    "portfolioFingerprint",
    "inputHash",
    "outputHash",
    "sourceHashes",
    "normalizationVersion",
    "calculationPolicyVersion",
    "pipelineVersion",
    "approvalSource",
  ], path, errors);
  if (!isPlainObject(evidence)) return null;
  if (evidence.evidenceVersion !== AI_SCENARIO_APPROVAL_EVIDENCE_VERSION) {
    errors.push(`${path}.evidenceVersion is unsupported.`);
  }
  if (evidence.fixtureOnly !== false) errors.push(`${path}.fixtureOnly must be false.`);
  if (evidence.productionPublishReady !== true) errors.push(`${path}.productionPublishReady must be true.`);
  if (evidence.appExportApproved !== true) errors.push(`${path}.appExportApproved must be true.`);
  const normalized = {
    evidenceVersion: AI_SCENARIO_APPROVAL_EVIDENCE_VERSION,
    fixtureOnly: false,
    productionPublishReady: true,
    appExportApproved: true,
    portfolioFingerprint: validateRequiredString(evidence.portfolioFingerprint, `${path}.portfolioFingerprint`, errors),
    inputHash: validateRequiredString(evidence.inputHash, `${path}.inputHash`, errors, { hash: true }),
    outputHash: validateRequiredString(evidence.outputHash, `${path}.outputHash`, errors, { hash: true }),
    sourceHashes: normalizeSourceHashes(evidence.sourceHashes, `${path}.sourceHashes`, errors),
    normalizationVersion: validateRequiredString(evidence.normalizationVersion, `${path}.normalizationVersion`, errors),
    calculationPolicyVersion: validateRequiredString(evidence.calculationPolicyVersion, `${path}.calculationPolicyVersion`, errors),
    pipelineVersion: validateRequiredString(evidence.pipelineVersion, `${path}.pipelineVersion`, errors),
    approvalSource: validateRequiredString(evidence.approvalSource, `${path}.approvalSource`, errors),
  };
  if (normalized.inputHash !== section.inputHash) errors.push(`${path}.inputHash must match section inputHash.`);
  if (normalized.outputHash !== section.outputHash) errors.push(`${path}.outputHash must match section outputHash.`);
  if (normalized.normalizationVersion !== section.normalizationVersion) errors.push(`${path}.normalizationVersion must match section normalizationVersion.`);
  if (normalized.calculationPolicyVersion !== section.calculationPolicyVersion) errors.push(`${path}.calculationPolicyVersion must match section calculationPolicyVersion.`);
  if (normalized.pipelineVersion !== section.pipelineVersion) errors.push(`${path}.pipelineVersion must match section pipelineVersion.`);
  const sectionHashes = new Set(section.sourceHashes || []);
  if (!normalized.sourceHashes.every((hash) => sectionHashes.has(hash))) {
    errors.push(`${path}.sourceHashes must be contained in section sourceHashes.`);
  }
  return normalized;
}

function normalizeScenarioLineage(section, path, errors) {
  return {
    inputHash: validateRequiredString(section.inputHash, `${path}.inputHash`, errors, { hash: true }),
    outputHash: validateRequiredString(section.outputHash, `${path}.outputHash`, errors, { hash: true }),
    sourceHashes: normalizeSourceHashes(section.sourceHashes, `${path}.sourceHashes`, errors),
    normalizationVersion: validateRequiredString(section.normalizationVersion, `${path}.normalizationVersion`, errors),
    calculationPolicyVersion: validateRequiredString(section.calculationPolicyVersion, `${path}.calculationPolicyVersion`, errors),
    pipelineVersion: validateRequiredString(section.pipelineVersion, `${path}.pipelineVersion`, errors),
  };
}

function normalizeProbabilityScenarioContext(section, errors) {
  const path = "scenarioInterpretationContext.sections.probability";
  validateAllowedKeys(section, [
    "sectionVersion",
    "approvalEvidence",
    "scenarioVersion",
    "method",
    "prngAlgorithm",
    "randomSeed",
    "simulationCount",
    "blockMonths",
    "returnBasis",
    "currencyMode",
    "dataStartDate",
    "dataEndDate",
    "inputHash",
    "outputHash",
    "sourceHashes",
    "normalizationVersion",
    "calculationPolicyVersion",
    "pipelineVersion",
    "terminalValue",
    "principalShortfallProbability",
    "scenarioMdd",
    "recovery",
  ], path, errors);
  if (!isPlainObject(section)) return null;
  const lineage = normalizeScenarioLineage(section, path, errors);
  validateAllowedKeys(section.terminalValue, ["p10", "p50", "p90"], `${path}.terminalValue`, errors);
  validateAllowedKeys(section.principalShortfallProbability, ["month12", "month36", "month60"], `${path}.principalShortfallProbability`, errors);
  validateAllowedKeys(section.scenarioMdd, ["p10", "p50", "p90"], `${path}.scenarioMdd`, errors);
  validateAllowedKeys(section.recovery, ["medianRecoveryMonths", "longestRecoveryMonths", "unrecoveredScenarioRatio"], `${path}.recovery`, errors);
  const terminalValue = {
    p10: validateContextNumber(section.terminalValue?.p10, `${path}.terminalValue.p10`, errors),
    p50: validateContextNumber(section.terminalValue?.p50, `${path}.terminalValue.p50`, errors),
    p90: validateContextNumber(section.terminalValue?.p90, `${path}.terminalValue.p90`, errors),
  };
  validateContextOrdering([terminalValue.p10, terminalValue.p50, terminalValue.p90], `${path}.terminalValue`, errors);
  const shortfall = {};
  for (const month of ["month12", "month36", "month60"]) {
    shortfall[month] = validateContextNumber(section.principalShortfallProbability?.[month], `${path}.principalShortfallProbability.${month}`, errors, {
      min: 0,
      max: 1,
      nullable: true,
    });
  }
  const scenarioMdd = {
    p10: validateContextNumber(section.scenarioMdd?.p10, `${path}.scenarioMdd.p10`, errors, { min: -1, max: 0 }),
    p50: validateContextNumber(section.scenarioMdd?.p50, `${path}.scenarioMdd.p50`, errors, { min: -1, max: 0 }),
    p90: validateContextNumber(section.scenarioMdd?.p90, `${path}.scenarioMdd.p90`, errors, { min: -1, max: 0 }),
  };
  validateContextOrdering([scenarioMdd.p10, scenarioMdd.p50, scenarioMdd.p90], `${path}.scenarioMdd`, errors);
  const blockMonths = validateContextNumber(section.blockMonths, `${path}.blockMonths`, errors, { integer: true });
  if (blockMonths !== null && ![6, 12].includes(blockMonths)) errors.push(`${path}.blockMonths must be 6 or 12.`);
  const normalized = {
    sectionVersion: validateRequiredString(section.sectionVersion, `${path}.sectionVersion`, errors),
    scenarioVersion: validateRequiredString(section.scenarioVersion, `${path}.scenarioVersion`, errors),
    method: validateRequiredString(section.method, `${path}.method`, errors),
    prngAlgorithm: validateRequiredString(section.prngAlgorithm, `${path}.prngAlgorithm`, errors),
    randomSeed: validateContextNumber(section.randomSeed, `${path}.randomSeed`, errors, { integer: true }),
    simulationCount: validateContextNumber(section.simulationCount, `${path}.simulationCount`, errors, { min: 1, integer: true }),
    blockMonths,
    returnBasis: validateRequiredString(section.returnBasis, `${path}.returnBasis`, errors),
    currencyMode: validateRequiredString(section.currencyMode, `${path}.currencyMode`, errors),
    dataStartDate: validateRequiredString(section.dataStartDate, `${path}.dataStartDate`, errors),
    dataEndDate: validateRequiredString(section.dataEndDate, `${path}.dataEndDate`, errors),
    ...lineage,
    terminalValue,
    principalShortfallProbability: shortfall,
    scenarioMdd,
    recovery: {
      medianRecoveryMonths: validateContextNumber(section.recovery?.medianRecoveryMonths, `${path}.recovery.medianRecoveryMonths`, errors, { min: 0, nullable: true }),
      longestRecoveryMonths: validateContextNumber(section.recovery?.longestRecoveryMonths, `${path}.recovery.longestRecoveryMonths`, errors, { min: 0, nullable: true }),
      unrecoveredScenarioRatio: validateContextNumber(section.recovery?.unrecoveredScenarioRatio, `${path}.recovery.unrecoveredScenarioRatio`, errors, { min: 0, max: 1 }),
    },
  };
  normalized.approvalEvidence = normalizeApprovalEvidence(section.approvalEvidence, `${path}.approvalEvidence`, normalized, errors);
  return normalized;
}

function normalizeShockAssumptions(value, path, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must contain at least one item.`);
    return [];
  }
  if (value.length > AI_SCENARIO_CONTEXT_LIMITS.maxShockEvents) {
    errors.push(`${path} cannot contain more than ${AI_SCENARIO_CONTEXT_LIMITS.maxShockEvents} items.`);
  }
  let previousMonth = -1;
  const seenMonths = new Set();
  return value.map((event, index) => {
    const eventPath = `${path}[${index}]`;
    validateAllowedKeys(event, ["monthIndex", "label", "shockMode", "marketFactorShock", "assetShockReturns", "assetBetas"], eventPath, errors);
    const monthIndex = validateContextNumber(event?.monthIndex, `${eventPath}.monthIndex`, errors, { min: 0, integer: true });
    if (monthIndex !== null) {
      if (seenMonths.has(monthIndex)) errors.push(`${eventPath}.monthIndex must be unique.`);
      if (monthIndex <= previousMonth) errors.push(`${eventPath}.monthIndex must be strictly ascending.`);
      seenMonths.add(monthIndex);
      previousMonth = monthIndex;
    }
    const shockMode = validateRequiredString(event?.shockMode, `${eventPath}.shockMode`, errors);
    if (!["direct_asset", "market_beta"].includes(shockMode)) errors.push(`${eventPath}.shockMode is unsupported.`);
    const assetShockReturns = event?.assetShockReturns === null ? null : event?.assetShockReturns;
    const assetBetas = event?.assetBetas === null ? null : event?.assetBetas;
    if (assetShockReturns !== null && assetShockReturns !== undefined) validateAllowedKeys(assetShockReturns, Object.keys(assetShockReturns), `${eventPath}.assetShockReturns`, errors);
    if (assetBetas !== null && assetBetas !== undefined) validateAllowedKeys(assetBetas, Object.keys(assetBetas), `${eventPath}.assetBetas`, errors);
    const shockKeys = isPlainObject(assetShockReturns) ? Object.keys(assetShockReturns).sort() : [];
    const betaKeys = isPlainObject(assetBetas) ? Object.keys(assetBetas).sort() : [];
    if (shockMode === "direct_asset" && shockKeys.length === 0) errors.push(`${eventPath}.assetShockReturns is required for direct_asset.`);
    if (shockMode === "market_beta") {
      validateContextNumber(event?.marketFactorShock, `${eventPath}.marketFactorShock`, errors, { min: -0.999999 });
      if (betaKeys.length === 0) errors.push(`${eventPath}.assetBetas is required for market_beta.`);
    }
    for (const key of shockKeys) {
      if (!ASSET_KEY_PATTERN.test(key)) errors.push(`${eventPath}.assetShockReturns key is invalid.`);
      validateContextNumber(assetShockReturns[key], `${eventPath}.assetShockReturns.${key}`, errors, { min: -0.999999 });
    }
    for (const key of betaKeys) {
      if (!ASSET_KEY_PATTERN.test(key)) errors.push(`${eventPath}.assetBetas key is invalid.`);
      validateContextNumber(assetBetas[key], `${eventPath}.assetBetas.${key}`, errors, { min: -10, max: 10 });
    }
    if (shockKeys.length > 0 && betaKeys.length > 0 && shockKeys.join("|") !== betaKeys.join("|")) {
      errors.push(`${eventPath}.assetShockReturns and assetBetas identities must match when both are present.`);
    }
    return {
      monthIndex,
      label: validateRequiredString(event?.label, `${eventPath}.label`, errors),
      shockMode,
      marketFactorShock: event?.marketFactorShock ?? null,
      assetShockReturns: isPlainObject(assetShockReturns) ? assetShockReturns : null,
      assetBetas: isPlainObject(assetBetas) ? assetBetas : null,
    };
  });
}

function normalizeAssetImpact(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return [];
  }
  if (value.length > AI_SCENARIO_CONTEXT_LIMITS.maxAssetImpact) {
    errors.push(`${path} cannot contain more than ${AI_SCENARIO_CONTEXT_LIMITS.maxAssetImpact} items.`);
  }
  return value.map((asset, index) => {
    const assetPath = `${path}[${index}]`;
    validateAllowedKeys(asset, ["market", "ticker", "baselineTerminalValue", "stressedTerminalValue", "deltaValue", "deltaRate"], assetPath, errors);
    const market = validateRequiredString(asset?.market, `${assetPath}.market`, errors);
    if (!["US", "KR"].includes(market)) errors.push(`${assetPath}.market must be US or KR.`);
    const ticker = validateRequiredString(asset?.ticker, `${assetPath}.ticker`, errors);
    if (!TICKER_PATTERN.test(ticker)) errors.push(`${assetPath}.ticker is invalid.`);
    return {
      market,
      ticker,
      baselineTerminalValue: validateContextNumber(asset?.baselineTerminalValue, `${assetPath}.baselineTerminalValue`, errors, { min: 0 }),
      stressedTerminalValue: validateContextNumber(asset?.stressedTerminalValue, `${assetPath}.stressedTerminalValue`, errors, { min: 0 }),
      deltaValue: validateContextNumber(asset?.deltaValue, `${assetPath}.deltaValue`, errors),
      deltaRate: validateContextNumber(asset?.deltaRate, `${assetPath}.deltaRate`, errors, { min: -1, max: 10 }),
    };
  });
}

function normalizeBetaProvenanceSummary(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return [];
  }
  if (value.length > AI_SCENARIO_CONTEXT_LIMITS.maxBetaProvenance) {
    errors.push(`${path} cannot contain more than ${AI_SCENARIO_CONTEXT_LIMITS.maxBetaProvenance} items.`);
  }
  return value.map((item, index) => {
    const itemPath = `${path}[${index}]`;
    validateAllowedKeys(item, ["assetKey", "sourceName", "asOfDate", "betaWindow", "methodVersion", "sourceHashAvailable"], itemPath, errors);
    const assetKey = validateRequiredString(item?.assetKey, `${itemPath}.assetKey`, errors);
    if (!ASSET_KEY_PATTERN.test(assetKey)) errors.push(`${itemPath}.assetKey is invalid.`);
    if (item?.sourceHashAvailable !== true) errors.push(`${itemPath}.sourceHashAvailable must be true.`);
    return {
      assetKey,
      sourceName: validateRequiredString(item?.sourceName, `${itemPath}.sourceName`, errors),
      asOfDate: validateRequiredString(item?.asOfDate, `${itemPath}.asOfDate`, errors),
      betaWindow: validateRequiredString(item?.betaWindow, `${itemPath}.betaWindow`, errors),
      methodVersion: validateRequiredString(item?.methodVersion, `${itemPath}.methodVersion`, errors),
      sourceHashAvailable: true,
    };
  });
}

function normalizeExternalShockScenarioContext(section, errors) {
  const path = "scenarioInterpretationContext.sections.externalShock";
  validateAllowedKeys(section, [
    "sectionVersion",
    "approvalEvidence",
    "scenarioVersion",
    "scenarioId",
    "scenarioLabel",
    "mode",
    "method",
    "occurrenceProbabilityEstimated",
    "returnBasis",
    "currencyMode",
    "dataStartDate",
    "dataEndDate",
    "inputHash",
    "outputHash",
    "baselineIdentityHash",
    "sourceHashes",
    "normalizationVersion",
    "calculationPolicyVersion",
    "pipelineVersion",
    "shockAssumptions",
    "terminalValue",
    "mdd",
    "recovery",
    "assetImpact",
    "betaProvenanceSummary",
  ], path, errors);
  if (!isPlainObject(section)) return null;
  const lineage = normalizeScenarioLineage(section, path, errors);
  if (section.occurrenceProbabilityEstimated !== false) {
    errors.push(`${path}.occurrenceProbabilityEstimated must be false.`);
  }
  if (!["direct_asset", "market_beta"].includes(section.mode)) {
    errors.push(`${path}.mode must be direct_asset or market_beta.`);
  }
  validateAllowedKeys(section.terminalValue, ["baseline", "stressed", "deltaValue", "deltaRate"], `${path}.terminalValue`, errors);
  validateAllowedKeys(section.mdd, ["baseline", "stressed", "incremental"], `${path}.mdd`, errors);
  validateAllowedKeys(section.recovery, ["recoveryMonths", "longestRecoveryMonths", "unrecovered"], `${path}.recovery`, errors);
  if (typeof section.recovery?.unrecovered !== "boolean") {
    errors.push(`${path}.recovery.unrecovered must be a boolean.`);
  }
  const normalized = {
    sectionVersion: validateRequiredString(section.sectionVersion, `${path}.sectionVersion`, errors),
    scenarioVersion: validateRequiredString(section.scenarioVersion, `${path}.scenarioVersion`, errors),
    scenarioId: validateRequiredString(section.scenarioId, `${path}.scenarioId`, errors),
    scenarioLabel: validateRequiredString(section.scenarioLabel, `${path}.scenarioLabel`, errors),
    mode: clean(section.mode),
    method: validateRequiredString(section.method, `${path}.method`, errors),
    occurrenceProbabilityEstimated: false,
    returnBasis: validateRequiredString(section.returnBasis, `${path}.returnBasis`, errors),
    currencyMode: validateRequiredString(section.currencyMode, `${path}.currencyMode`, errors),
    dataStartDate: validateRequiredString(section.dataStartDate, `${path}.dataStartDate`, errors),
    dataEndDate: validateRequiredString(section.dataEndDate, `${path}.dataEndDate`, errors),
    baselineIdentityHash: validateRequiredString(section.baselineIdentityHash, `${path}.baselineIdentityHash`, errors, { hash: true }),
    ...lineage,
    shockAssumptions: normalizeShockAssumptions(section.shockAssumptions, `${path}.shockAssumptions`, errors),
    terminalValue: {
      baseline: validateContextNumber(section.terminalValue?.baseline, `${path}.terminalValue.baseline`, errors, { min: 0 }),
      stressed: validateContextNumber(section.terminalValue?.stressed, `${path}.terminalValue.stressed`, errors, { min: 0 }),
      deltaValue: validateContextNumber(section.terminalValue?.deltaValue, `${path}.terminalValue.deltaValue`, errors),
      deltaRate: validateContextNumber(section.terminalValue?.deltaRate, `${path}.terminalValue.deltaRate`, errors, { min: -1, max: 10 }),
    },
    mdd: {
      baseline: validateContextNumber(section.mdd?.baseline, `${path}.mdd.baseline`, errors, { min: -1, max: 0 }),
      stressed: validateContextNumber(section.mdd?.stressed, `${path}.mdd.stressed`, errors, { min: -1, max: 0 }),
      incremental: validateContextNumber(section.mdd?.incremental, `${path}.mdd.incremental`, errors, { min: -1, max: 1 }),
    },
    recovery: {
      recoveryMonths: validateContextNumber(section.recovery?.recoveryMonths, `${path}.recovery.recoveryMonths`, errors, { min: 0, nullable: true }),
      longestRecoveryMonths: validateContextNumber(section.recovery?.longestRecoveryMonths, `${path}.recovery.longestRecoveryMonths`, errors, { min: 0, nullable: true }),
      unrecovered: typeof section.recovery?.unrecovered === "boolean" ? section.recovery.unrecovered : null,
    },
    assetImpact: normalizeAssetImpact(section.assetImpact, `${path}.assetImpact`, errors),
    betaProvenanceSummary: normalizeBetaProvenanceSummary(section.betaProvenanceSummary, `${path}.betaProvenanceSummary`, errors),
  };
  normalized.approvalEvidence = normalizeApprovalEvidence(section.approvalEvidence, `${path}.approvalEvidence`, normalized, errors);
  return normalized;
}

function normalizeScenarioInterpretationContext(context, errors) {
  if (context === undefined || context === null) return null;
  if (process.env.FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED !== "true") {
    throw createHttpError(
      403,
      "AI scenario context provider gate is disabled.",
      ["FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED must be true to send scenario context."]
    );
  }
  const path = "scenarioInterpretationContext";
  validateAllowedKeys(context, ["contextVersion", "status", "providerEligible", "providerContext", "integrity"], path, errors);
  if (!isPlainObject(context)) return null;
  if (context.contextVersion !== AI_SCENARIO_CONTEXT_VERSION) {
    errors.push(`${path}.contextVersion is unsupported.`);
  }
  if (!["ready", "partial"].includes(context.status)) errors.push(`${path}.status must be ready or partial.`);
  if (context.providerEligible !== true) errors.push(`${path}.providerEligible must be true.`);
  validateAllowedKeys(context.integrity, ["builderId", "contextVersion", "providerContextSignature", "includedSectionCount", "excludedSectionCount", "serializedBytes"], `${path}.integrity`, errors);
  if (context.integrity?.builderId !== AI_SCENARIO_CONTEXT_BUILDER_ID) errors.push(`${path}.integrity.builderId is unsupported.`);
  if (context.integrity?.contextVersion !== AI_SCENARIO_CONTEXT_VERSION) errors.push(`${path}.integrity.contextVersion is unsupported.`);
  validateRequiredString(context.integrity?.providerContextSignature, `${path}.integrity.providerContextSignature`, errors);
  const integrityIncludedSectionCount = validateContextNumber(context.integrity?.includedSectionCount, `${path}.integrity.includedSectionCount`, errors, { min: 1, integer: true });
  const integrityExcludedSectionCount = validateContextNumber(context.integrity?.excludedSectionCount, `${path}.integrity.excludedSectionCount`, errors, { min: 0, integer: true });
  const integritySerializedBytes = validateContextNumber(context.integrity?.serializedBytes, `${path}.integrity.serializedBytes`, errors, { min: 1, integer: true });
  validateAllowedKeys(context.providerContext, ["contextVersion", "target", "interpretationOnly", "calculationsImmutable", "portfolioFingerprint", "includedSections", "sections", "disclaimers"], `${path}.providerContext`, errors);
  const providerContext = isPlainObject(context.providerContext) ? context.providerContext : {};
  const serializedBytes = Buffer.byteLength(JSON.stringify(context), "utf8");
  const providerContextSerializedBytes = Buffer.byteLength(JSON.stringify(providerContext), "utf8");
  const expectedSignature = deterministicSignature(providerContext);
  if (serializedBytes > AI_SCENARIO_CONTEXT_LIMITS.maxSerializedBytes) {
    errors.push(`${path} exceeds ${AI_SCENARIO_CONTEXT_LIMITS.maxSerializedBytes} bytes.`);
  }
  if (context.integrity?.providerContextSignature !== expectedSignature) {
    errors.push(`${path}.integrity.providerContextSignature must match providerContext.`);
  }
  if (integritySerializedBytes !== null && integritySerializedBytes !== providerContextSerializedBytes) {
    errors.push(`${path}.integrity.serializedBytes must match providerContext byte size.`);
  }
  if (providerContext.contextVersion !== AI_SCENARIO_CONTEXT_VERSION) {
    errors.push(`${path}.providerContext.contextVersion is unsupported.`);
  }
  if (!AI_SCENARIO_CONTEXT_TARGETS.has(providerContext.target)) {
    errors.push(`${path}.target is unsupported.`);
  }
  if (providerContext.interpretationOnly !== true || providerContext.calculationsImmutable !== true) {
    errors.push(`${path} must be interpretation-only with immutable calculations.`);
  }
  if (!Array.isArray(providerContext.includedSections) || providerContext.includedSections.length === 0) {
    errors.push(`${path}.includedSections must contain at least one section.`);
  }
  if (integrityIncludedSectionCount !== null && Array.isArray(providerContext.includedSections) && integrityIncludedSectionCount !== providerContext.includedSections.length) {
    errors.push(`${path}.integrity.includedSectionCount must match includedSections length.`);
  }
  if (integrityExcludedSectionCount !== null && integrityExcludedSectionCount !== 0) {
    errors.push(`${path}.integrity.excludedSectionCount must be 0 for provider context.`);
  }
  validateAllowedKeys(providerContext.sections, ["probability", "externalShock"], `${path}.providerContext.sections`, errors);

  const normalized = {
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    status: context.status,
    providerEligible: true,
    target: providerContext.target,
    interpretationOnly: true,
    calculationsImmutable: true,
    portfolioFingerprint: validateRequiredString(providerContext.portfolioFingerprint, `${path}.portfolioFingerprint`, errors),
    includedSections: Array.isArray(providerContext.includedSections) ? [...new Set(providerContext.includedSections)].sort() : [],
    sections: {},
    disclaimers: Array.isArray(providerContext.disclaimers) ? providerContext.disclaimers.map(clean).filter(Boolean) : [],
    integrity: context.integrity || {},
  };

  for (const sectionName of normalized.includedSections) {
    if (!["probability", "externalShock"].includes(sectionName)) {
      errors.push(`${path}.includedSections contains unsupported section ${sectionName}.`);
    }
  }
  if (providerContext.sections?.probability) {
    normalized.sections.probability = normalizeProbabilityScenarioContext(providerContext.sections.probability, errors);
  }
  if (providerContext.sections?.externalShock) {
    normalized.sections.externalShock = normalizeExternalShockScenarioContext(providerContext.sections.externalShock, errors);
  }
  for (const sectionName of normalized.includedSections) {
    if (!normalized.sections[sectionName]) errors.push(`${path}.sections.${sectionName} is required.`);
  }
  for (const forbiddenKey of ["monthlyBands", "simulationTrace", "rawReturnMatrix", "baselinePath", "stressedPath", "rowSourceLineage", "contributionSeries"]) {
    if (JSON.stringify(context).includes(`"${forbiddenKey}"`)) {
      errors.push(`${path} must not include ${forbiddenKey}.`);
    }
  }

  return normalized;
}

function normalizeMetrics(metrics, errors) {
  if (metrics === undefined || metrics === null) return {};
  if (!isPlainObject(metrics)) {
    errors.push("metrics must be an object when provided.");
    return {};
  }

  const normalized = {};
  for (const field of PORTFOLIO_METRIC_FIELDS) {
    const value = normalizeNumericField(metrics, field, "metrics", errors);
    if (value !== null) normalized[field] = value;
  }
  return normalized;
}

function normalizeAsset(asset, index, errors) {
  if (!isPlainObject(asset)) {
    errors.push(`assets[${index}] must be an object.`);
    return null;
  }

  const ticker = normalizeTicker(asset.ticker);
  if (!ticker || !TICKER_PATTERN.test(ticker)) {
    errors.push(`assets[${index}].ticker is invalid.`);
  }

  const market = normalizeMarket(asset.market);
  if (!["US", "KR"].includes(market)) {
    errors.push(`assets[${index}].market must be US or KR.`);
  }

  const normalized = {
    ticker,
    market,
    name: clean(asset.name || asset.nameKr || asset.koreanName || ticker),
    dataStatus: clean(asset.dataStatus || asset.metricsStatus || "unknown"),
  };

  for (const field of ASSET_NUMERIC_FIELDS) {
    const value = normalizeNumericField(asset, field, `assets[${index}]`, errors);
    if (value !== null) normalized[field] = value;
  }

  if (typeof normalized.weight !== "number") {
    errors.push(`assets[${index}].weight is required.`);
  }

  return normalized;
}

function validateWeightTotal(assets, errors) {
  const totalWeight = assets.reduce((sum, asset) => sum + Number(asset?.weight || 0), 0);
  if (Math.abs(totalWeight - 100) > WEIGHT_TOLERANCE) {
    errors.push(`assets weight total must be within ${WEIGHT_TOLERANCE}% of 100. Current total: ${totalWeight.toFixed(2)}.`);
  }
}

export function normalizePortfolioAnalysisRequest(body = {}) {
  const errors = [];

  if (!isPlainObject(body)) {
    throw createHttpError(400, "요청 본문은 JSON 객체여야 합니다.", ["body must be an object."]);
  }

  const assetsInput = Array.isArray(body.assets) ? body.assets : [];
  if (assetsInput.length === 0) {
    errors.push("assets must contain at least one asset.");
  }
  if (assetsInput.length > MAX_ASSET_COUNT) {
    errors.push(`assets cannot contain more than ${MAX_ASSET_COUNT} assets.`);
  }

  const assets = assetsInput
    .map((asset, index) => normalizeAsset(asset, index, errors))
    .filter(Boolean);

  if (assets.length > 0) validateWeightTotal(assets, errors);
  const analysisContext = clean(body.analysisContext || "simulator-step4");
  if (!AI_ANALYSIS_CONTEXTS.has(analysisContext)) {
    errors.push("analysisContext must be simulator-step4 or simulator-step6.");
  }
  const scenarioInterpretationContext = normalizeScenarioInterpretationContext(
    body.scenarioInterpretationContext,
    errors
  );

  const normalized = {
    portfolioId: clean(body.portfolioId || "mock-portfolio"),
    analysisContext,
    settings: isPlainObject(body.settings) ? body.settings : {},
    metrics: normalizeMetrics(body.metrics, errors),
    assets,
  };
  if (scenarioInterpretationContext) {
    normalized.scenarioInterpretationContext = scenarioInterpretationContext;
  }

  if (errors.length > 0) {
    throw createHttpError(400, "AI 분석 요청값을 확인해주세요.", errors);
  }

  return normalized;
}

export function collectInputNumbers(payload) {
  const numbers = new Set([payload.assets.length]);
  for (const value of Object.values(payload.metrics || {})) {
    if (Number.isFinite(value)) numbers.add(value);
  }
  for (const asset of payload.assets) {
    for (const field of ASSET_NUMERIC_FIELDS) {
      if (Number.isFinite(asset[field])) numbers.add(asset[field]);
    }
  }
  return numbers;
}

export function collectAllowedTickers(payload) {
  return new Set(payload.assets.map((asset) => asset.ticker).filter(Boolean));
}

const MAX_ASSET_COUNT = 20;
const WEIGHT_TOLERANCE = 0.5;
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,15}$/;
export const AI_SCENARIO_CONTEXT_VERSION = "ai-scenario-context-v1-step114-2j";
const AI_SCENARIO_CONTEXT_TARGETS = new Set(["simulator-step6"]);
const AI_ANALYSIS_CONTEXTS = new Set(["simulator-step4", "simulator-step6"]);
const HASH_PATTERN = /^[a-f0-9]{64}$/i;
const SOURCE_HASH_PATTERN = /^[A-Za-z0-9._:-]{3,160}$/;

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
  return text;
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
  const hashes = value.map((item, index) => validateRequiredString(item, `${path}[${index}]`, errors, { sourceHash: true }));
  return Array.from(new Set(hashes.filter(Boolean))).sort();
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
  if (!isPlainObject(section)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const lineage = normalizeScenarioLineage(section, path, errors);
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
  return {
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
}

function normalizeExternalShockScenarioContext(section, errors) {
  const path = "scenarioInterpretationContext.sections.externalShock";
  if (!isPlainObject(section)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const lineage = normalizeScenarioLineage(section, path, errors);
  if (section.occurrenceProbabilityEstimated !== false) {
    errors.push(`${path}.occurrenceProbabilityEstimated must be false.`);
  }
  if (!["direct_asset", "market_beta"].includes(section.mode)) {
    errors.push(`${path}.mode must be direct_asset or market_beta.`);
  }
  if (!Array.isArray(section.shockAssumptions) || section.shockAssumptions.length === 0) {
    errors.push(`${path}.shockAssumptions must contain at least one item.`);
  }
  if (!Array.isArray(section.assetImpact)) errors.push(`${path}.assetImpact must be an array.`);
  if (typeof section.recovery?.unrecovered !== "boolean") {
    errors.push(`${path}.recovery.unrecovered must be a boolean.`);
  }
  return {
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
    shockAssumptions: (Array.isArray(section.shockAssumptions) ? section.shockAssumptions : []).slice(0, 6),
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
    assetImpact: (Array.isArray(section.assetImpact) ? section.assetImpact : []).slice(0, 20),
    betaProvenanceSummary: (Array.isArray(section.betaProvenanceSummary) ? section.betaProvenanceSummary : []).slice(0, 20),
  };
}

function normalizeScenarioInterpretationContext(context, errors) {
  if (context === undefined || context === null) return null;
  const path = "scenarioInterpretationContext";
  if (!isPlainObject(context)) {
    errors.push(`${path} must be an object when provided.`);
    return null;
  }
  if (context.contextVersion !== AI_SCENARIO_CONTEXT_VERSION) {
    errors.push(`${path}.contextVersion is unsupported.`);
  }
  if (!AI_SCENARIO_CONTEXT_TARGETS.has(context.target)) {
    errors.push(`${path}.target is unsupported.`);
  }
  if (context.interpretationOnly !== true || context.calculationsImmutable !== true) {
    errors.push(`${path} must be interpretation-only with immutable calculations.`);
  }
  if (!Array.isArray(context.includedSections) || context.includedSections.length === 0) {
    errors.push(`${path}.includedSections must contain at least one section.`);
  }
  if (!isPlainObject(context.sections)) errors.push(`${path}.sections must be an object.`);

  const normalized = {
    contextVersion: AI_SCENARIO_CONTEXT_VERSION,
    target: context.target,
    interpretationOnly: true,
    calculationsImmutable: true,
    portfolioFingerprint: validateRequiredString(context.portfolioFingerprint, `${path}.portfolioFingerprint`, errors),
    includedSections: Array.isArray(context.includedSections) ? [...new Set(context.includedSections)].sort() : [],
    sections: {},
    disclaimers: Array.isArray(context.disclaimers) ? context.disclaimers.slice(0, 5).map(clean).filter(Boolean) : [],
  };

  for (const sectionName of normalized.includedSections) {
    if (!["probability", "externalShock"].includes(sectionName)) {
      errors.push(`${path}.includedSections contains unsupported section ${sectionName}.`);
    }
  }
  if (context.sections?.probability) {
    normalized.sections.probability = normalizeProbabilityScenarioContext(context.sections.probability, errors);
  }
  if (context.sections?.externalShock) {
    normalized.sections.externalShock = normalizeExternalShockScenarioContext(context.sections.externalShock, errors);
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

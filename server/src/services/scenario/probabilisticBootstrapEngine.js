import crypto from "node:crypto";

export const PROBABILISTIC_SCENARIO_VERSION = "probabilistic-scenario-v1-step114-2f";
export const PROBABILISTIC_PRNG_ALGORITHM = "xorshift32-v1";

const DEFAULT_PERCENTILES = [0.1, 0.25, 0.5, 0.75, 0.9];
const DEFAULT_MINIMUM_COMMON_HISTORY_MONTHS = 60;
const EPSILON = 1e-9;
const MONTH_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/;

function roundNumber(value, digits = 10) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(digits));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalMonth(value, label = "month") {
  const rawMonth = String(value || "").trim();
  if (!MONTH_PATTERN.test(rawMonth)) {
    throw new TypeError(`invalid_calendar_month:${label}:must_be_YYYY-MM_or_YYYY-MM-DD`);
  }
  const [yearText, monthText, dayText] = rawMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new TypeError(`invalid_calendar_month:${label}:invalid_year_or_month`);
  }
  if (dayText !== undefined) {
    const day = Number(dayText);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (!Number.isInteger(day) || day < 1 || day > lastDay) {
      throw new TypeError(`invalid_calendar_month:${label}:invalid_day`);
    }
  }
  return `${yearText}-${monthText}`;
}

function monthOrdinal(month) {
  const [yearText, monthText] = month.split("-");
  return Number(yearText) * 12 + Number(monthText) - 1;
}

function normalizeMarket(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
}

function assetKey(asset) {
  return `${normalizeMarket(asset.market)}:${normalizeTicker(asset.ticker)}`;
}

function toFiniteNumber(value, label) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new TypeError(`${label} must be a finite number`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return number;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])]),
  );
}

export function stableSerialize(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256Stable(value) {
  return crypto.createHash("sha256").update(stableSerialize(value)).digest("hex");
}

export function createXorShift32(seed) {
  let state = Number(seed) >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return function nextRandom() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function percentile(values, probability) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const p = toFiniteNumber(probability, "percentile");
  if (p < 0 || p > 1) throw new RangeError("percentile must be between 0 and 1");
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function percentileObject(values) {
  return {
    p10: roundNumber(percentile(values, 0.1)),
    p25: roundNumber(percentile(values, 0.25)),
    p50: roundNumber(percentile(values, 0.5)),
    p75: roundNumber(percentile(values, 0.75)),
    p90: roundNumber(percentile(values, 0.9)),
  };
}

function normalizePercentiles(percentiles) {
  const rawPercentiles = percentiles === undefined || percentiles === null
    ? DEFAULT_PERCENTILES
    : percentiles;
  if (!Array.isArray(rawPercentiles)) {
    throw new TypeError("unsupported_percentile_contract:not_array");
  }
  if (rawPercentiles.length !== DEFAULT_PERCENTILES.length) {
    throw new RangeError("unsupported_percentile_contract:missing_or_extra_values");
  }
  const values = rawPercentiles.map((value, index) => {
    if (typeof value !== "number") {
      throw new TypeError(`unsupported_percentile_contract:non_number:${index}`);
    }
    const number = toFiniteNumber(value, `scenario.percentiles[${index}]`);
    if (number < 0 || number > 1) {
      throw new RangeError(`unsupported_percentile_contract:out_of_range:${index}`);
    }
    return number;
  });
  const sorted = [...values].sort((a, b) => a - b);
  const unique = new Set(sorted.map((value) => value.toFixed(12)));
  if (unique.size !== sorted.length) {
    throw new RangeError("unsupported_percentile_contract:duplicate_values");
  }
  for (const [index, value] of sorted.entries()) {
    if (Math.abs(value - DEFAULT_PERCENTILES[index]) > EPSILON) {
      throw new RangeError("unsupported_percentile_contract:fixed_set_required");
    }
  }
  return [...DEFAULT_PERCENTILES];
}

function buildHistoryPolicy(metadata = {}, blockMonths = null) {
  const requestedRaw = metadata.minimumCommonHistoryMonths;
  let requestedMinimumCommonHistoryMonths = null;
  if (requestedRaw !== undefined && requestedRaw !== null) {
    if (typeof requestedRaw !== "number") {
      throw new TypeError("invalid_minimum_common_history_months:must_be_number");
    }
    if (!Number.isFinite(requestedRaw) || !Number.isInteger(requestedRaw) || requestedRaw <= 0) {
      throw new RangeError("invalid_minimum_common_history_months:must_be_positive_integer");
    }
    requestedMinimumCommonHistoryMonths = requestedRaw;
  }
  const blockMultiplierMinimumCommonHistoryMonths = Number.isFinite(blockMonths) ? blockMonths * 3 : null;
  const effectiveMinimumCommonHistoryMonths = Math.max(
    DEFAULT_MINIMUM_COMMON_HISTORY_MONTHS,
    requestedMinimumCommonHistoryMonths ?? DEFAULT_MINIMUM_COMMON_HISTORY_MONTHS,
    36,
    blockMultiplierMinimumCommonHistoryMonths ?? 0,
  );
  return {
    defaultMinimumCommonHistoryMonths: DEFAULT_MINIMUM_COMMON_HISTORY_MONTHS,
    requestedMinimumCommonHistoryMonths,
    floorMinimumCommonHistoryMonths: 36,
    blockMultiplierMinimumCommonHistoryMonths,
    effectiveMinimumCommonHistoryMonths,
  };
}

function safeBuildHistoryPolicy(metadata = {}, blockMonths = null) {
  try {
    return Number.isFinite(blockMonths) ? buildHistoryPolicy(metadata, blockMonths) : null;
  } catch {
    return null;
  }
}

function collectSourceHashesFromRows(rows = []) {
  const sourceHashes = new Set();
  if (!Array.isArray(rows)) return [];
  for (const row of rows) {
    if (isPlainObject(row) && String(row.sourceHash || "").trim()) {
      sourceHashes.add(String(row.sourceHash).trim());
    }
  }
  return Array.from(sourceHashes).sort();
}

function collectEffectiveSourceHashes(metadataSourceHashes = [], rowSourceHashes = []) {
  return Array.from(new Set([
    ...(Array.isArray(metadataSourceHashes) ? metadataSourceHashes : []),
    ...(Array.isArray(rowSourceHashes) ? rowSourceHashes : []),
  ].map((value) => String(value || "").trim()).filter(Boolean))).sort();
}

function buildBlockedResult({
  status = "blocked",
  reasons = [],
  input = {},
  metadata = {},
  normalizedInputForHash = null,
  sourceHashes = null,
  historyPolicy = null,
  percentiles = null,
}) {
  const effectiveSourceHashes = sourceHashes ?? collectEffectiveSourceHashes(
    Array.isArray(input?.metadata?.sourceHashes) ? input.metadata.sourceHashes : [],
    collectSourceHashesFromRows(input?.monthlyReturnMatrix),
  );
  const effectiveHistoryPolicy = historyPolicy ?? (
    safeBuildHistoryPolicy(input?.metadata, input?.scenario?.blockMonths)
  );
  const blockedInputHash = sha256Stable(normalizedInputForHash ?? {
    status,
    reasons,
    portfolioId: input?.portfolioId || "",
    sourceHashes: effectiveSourceHashes,
    historyPolicy: effectiveHistoryPolicy,
    percentiles: percentiles ?? null,
    inputSnapshot: input,
  });
  const resultWithoutHash = {
    status,
    scenarioVersion: PROBABILISTIC_SCENARIO_VERSION,
    method: input?.scenario?.method || "joint_block_bootstrap",
    prngAlgorithm: PROBABILISTIC_PRNG_ALGORITHM,
    randomSeed: input?.scenario?.randomSeed ?? null,
    simulationCount: input?.scenario?.simulationCount ?? null,
    blockMonths: input?.scenario?.blockMonths ?? null,
    rebalanceFrequency: input?.settings?.rebalanceFrequency ?? null,
    returnBasis: metadata?.returnBasis ?? input?.metadata?.returnBasis ?? null,
    currencyMode: metadata?.currencyMode ?? input?.metadata?.currencyMode ?? null,
    dataStartDate: metadata?.dataStartDate ?? null,
    dataEndDate: metadata?.dataEndDate ?? null,
    sourceHashes: effectiveSourceHashes,
    normalizationVersion: metadata?.normalizationVersion ?? input?.metadata?.normalizationVersion ?? null,
    calculationPolicyVersion: metadata?.calculationPolicyVersion ?? input?.metadata?.calculationPolicyVersion ?? null,
    pipelineVersion: metadata?.pipelineVersion ?? input?.metadata?.pipelineVersion ?? null,
    percentiles: percentiles ?? DEFAULT_PERCENTILES,
    inputHash: blockedInputHash,
    dataQuality: {
      status,
      blockReasons: reasons,
      historyPolicy: effectiveHistoryPolicy,
    },
    betaApplied: false,
    cagrCalibrationApplied: false,
    historicalMddApplied: false,
    monthlyBands: [],
    terminalValue: null,
    principalShortfallProbability: {
      month12: null,
      month36: null,
      month60: null,
    },
    scenarioMdd: null,
    recovery: {
      medianRecoveryMonths: null,
      longestRecoveryMonths: null,
      unrecoveredScenarioRatio: null,
    },
    contributionSeries: [],
    trace: {
      sampledBlockStarts: [],
    },
  };
  return {
    ...resultWithoutHash,
    outputHash: sha256Stable(resultWithoutHash),
  };
}

function normalizeAssets(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new TypeError("assets must be a non-empty array");
  }

  const seen = new Set();
  const normalized = assets.map((asset, index) => {
    if (!isPlainObject(asset)) throw new TypeError(`assets[${index}] must be an object`);
    const market = normalizeMarket(asset.market);
    const ticker = normalizeTicker(asset.ticker);
    if (!market || !ticker) throw new TypeError(`assets[${index}] must include market and ticker`);
    const key = `${market}:${ticker}`;
    if (seen.has(key)) throw new TypeError(`duplicate asset identity: ${key}`);
    seen.add(key);
    const targetWeight = toFiniteNumber(asset.targetWeight ?? asset.weight, `assets[${index}].targetWeight`);
    if (targetWeight < 0) throw new RangeError(`assets[${index}].targetWeight must be non-negative`);
    return {
      id: String(asset.id || ""),
      market,
      ticker,
      key,
      targetWeight,
    };
  });

  const rawWeightSum = normalized.reduce((sum, asset) => sum + asset.targetWeight, 0);
  const divisor = rawWeightSum > 1.5 && rawWeightSum <= 100 + EPSILON ? 100 : 1;
  const weightSum = rawWeightSum / divisor;
  if (Math.abs(weightSum - 1) > 0.000001) {
    throw new RangeError(`target weights must sum to 1 or 100, got ${rawWeightSum}`);
  }

  return normalized
    .map((asset) => ({ ...asset, targetWeight: asset.targetWeight / divisor }))
    .sort((a, b) => a.key.localeCompare(b.key) || a.id.localeCompare(b.id));
}

function normalizeSettings(settings = {}) {
  if (!isPlainObject(settings)) throw new TypeError("settings must be an object");
  const initialInvestment = toFiniteNumber(settings.initialInvestment ?? settings.startValue, "settings.initialInvestment");
  const monthlyContribution = toFiniteNumber(settings.monthlyContribution ?? settings.monthlyCashFlow ?? 0, "settings.monthlyContribution");
  const investmentMonths = toFiniteNumber(settings.investmentMonths, "settings.investmentMonths");
  const inflationRateAnnual = toFiniteNumber(settings.inflationRateAnnual ?? settings.inflationRate ?? 0, "settings.inflationRateAnnual");
  const rebalanceFrequency = String(settings.rebalanceFrequency || "none").trim().toLowerCase();
  if (initialInvestment <= 0) throw new RangeError("settings.initialInvestment must be greater than 0");
  if (monthlyContribution < 0) throw new RangeError("settings.monthlyContribution must be non-negative");
  if (!Number.isInteger(investmentMonths) || investmentMonths <= 0) {
    throw new RangeError("settings.investmentMonths must be a positive integer");
  }
  if (inflationRateAnnual <= -100) throw new RangeError("settings.inflationRateAnnual must be greater than -100");
  if (!["none", "annual"].includes(rebalanceFrequency)) {
    throw new TypeError("settings.rebalanceFrequency must be none or annual");
  }
  return {
    initialInvestment,
    monthlyContribution,
    investmentMonths,
    inflationRateAnnual,
    rebalanceFrequency,
  };
}

function normalizeScenario(scenario = {}) {
  if (!isPlainObject(scenario)) throw new TypeError("scenario must be an object");
  const method = String(scenario.method || "joint_block_bootstrap").trim();
  const simulationCount = toFiniteNumber(scenario.simulationCount, "scenario.simulationCount");
  const blockMonths = toFiniteNumber(scenario.blockMonths, "scenario.blockMonths");
  const randomSeed = toFiniteNumber(scenario.randomSeed, "scenario.randomSeed");
  const percentiles = normalizePercentiles(scenario.percentiles);
  if (method !== "joint_block_bootstrap") throw new TypeError("scenario.method must be joint_block_bootstrap");
  if (!Number.isInteger(simulationCount) || simulationCount <= 0) {
    throw new RangeError("scenario.simulationCount must be a positive integer");
  }
  if (![6, 12].includes(blockMonths)) throw new RangeError("scenario.blockMonths must be 6 or 12");
  if (!Number.isInteger(randomSeed)) throw new RangeError("scenario.randomSeed must be an integer");
  return { method, simulationCount, blockMonths, randomSeed, percentiles };
}

function normalizeMetadata(metadata = {}) {
  if (!isPlainObject(metadata)) throw new TypeError("metadata must be an object");
  const returnBasis = String(metadata.returnBasis || "").trim();
  const currencyMode = String(metadata.currencyMode || "").trim();
  if (!["price_return", "total_return"].includes(returnBasis)) {
    throw new TypeError("metadata.returnBasis must be price_return or total_return");
  }
  if (!currencyMode) throw new TypeError("metadata.currencyMode is required");
  for (const field of ["normalizationVersion", "calculationPolicyVersion", "pipelineVersion"]) {
    if (!String(metadata[field] || "").trim()) throw new TypeError(`metadata.${field} is required`);
  }
  return {
    returnBasis,
    currencyMode,
    sourceHashes: Array.isArray(metadata.sourceHashes)
      ? [...new Set(metadata.sourceHashes.map((value) => String(value).trim()).filter(Boolean))].sort()
      : [],
    normalizationVersion: String(metadata.normalizationVersion).trim(),
    calculationPolicyVersion: String(metadata.calculationPolicyVersion).trim(),
    pipelineVersion: String(metadata.pipelineVersion).trim(),
  };
}

function getRowReturn(row, returnBasis) {
  if (returnBasis === "price_return") return row.priceReturn ?? row.return ?? row.monthlyReturn;
  return row.totalReturn ?? row.return ?? row.monthlyReturn;
}

function normalizeMonthlyReturnMatrix({ monthlyReturnMatrix, assets, metadata }) {
  if (!Array.isArray(monthlyReturnMatrix) || monthlyReturnMatrix.length === 0) {
    throw new TypeError("monthlyReturnMatrix must be a non-empty array");
  }

  const requiredAssetKeys = new Set(assets.map((asset) => asset.key));
  const rowsByMonth = new Map();
  const sourceHashes = new Set(metadata.sourceHashes);
  let currencyMode = metadata.currencyMode;

  for (const [index, rawRow] of monthlyReturnMatrix.entries()) {
    if (!isPlainObject(rawRow)) throw new TypeError(`monthlyReturnMatrix[${index}] must be an object`);
    const month = canonicalMonth(rawRow.month, `monthlyReturnMatrix[${index}].month`);
    const market = normalizeMarket(rawRow.market);
    const ticker = normalizeTicker(rawRow.ticker);
    const key = `${market}:${ticker}`;
    if (!requiredAssetKeys.has(key)) continue;
    const rowReturnBasis = String(rawRow.returnBasis || metadata.returnBasis || "").trim();
    if (rowReturnBasis !== metadata.returnBasis) {
      throw new TypeError(`mixed return basis for ${key} ${month}`);
    }
    const rowCurrencyMode = String(rawRow.currencyMode || rawRow.currency || metadata.currencyMode || "").trim();
    if (rowCurrencyMode && rowCurrencyMode !== currencyMode) {
      throw new TypeError(`mixed currency mode for ${key} ${month}`);
    }
    const monthlyReturn = toFiniteNumber(getRowReturn(rawRow, metadata.returnBasis), `monthlyReturnMatrix[${index}].return`);
    if (monthlyReturn < -1) throw new RangeError(`monthlyReturnMatrix[${index}].return must be >= -1`);
    if (String(rawRow.sourceHash || "").trim()) sourceHashes.add(String(rawRow.sourceHash).trim());

    if (!rowsByMonth.has(month)) rowsByMonth.set(month, new Map());
    const monthMap = rowsByMonth.get(month);
    if (monthMap.has(key)) throw new TypeError(`same_calendar_month_duplicate:${key}:${month}`);
    monthMap.set(key, monthlyReturn);
  }

  const months = Array.from(rowsByMonth.keys()).sort();
  if (months.length === 0) throw new RangeError("monthlyReturnMatrix has no rows for requested assets");
  for (let index = 1; index < months.length; index += 1) {
    if (monthOrdinal(months[index]) - monthOrdinal(months[index - 1]) !== 1) {
      throw new TypeError(`missing_calendar_month:${months[index - 1]}:${months[index]}`);
    }
  }

  const effectiveSourceHashes = Array.from(sourceHashes).sort();
  if (effectiveSourceHashes.length === 0) {
    throw new TypeError("missing_source_hash:effective_source_hashes_empty");
  }

  const matrix = months.map((month) => {
    const monthMap = rowsByMonth.get(month);
    const assetReturns = {};
    for (const asset of assets) {
      if (!monthMap.has(asset.key)) {
        throw new TypeError(`missing_asset_month:${asset.key}:${month}`);
      }
      assetReturns[asset.key] = monthMap.get(asset.key);
    }
    return { month, assetReturns };
  });

  return {
    matrix,
    dataStartDate: matrix[0].month,
    dataEndDate: matrix[matrix.length - 1].month,
    sourceHashes: effectiveSourceHashes,
  };
}

function shouldRebalance(rebalanceFrequency, monthIndex) {
  return rebalanceFrequency === "annual" && monthIndex > 1 && (monthIndex - 1) % 12 === 0;
}

function applyAssetReturns(sleeves, assets, sampledRow) {
  let total = 0;
  const nextSleeves = assets.map((asset, index) => {
    const nextValue = sleeves[index] * (1 + sampledRow.assetReturns[asset.key]);
    total += nextValue;
    return nextValue;
  });
  return { sleeves: nextSleeves, total };
}

function rebalanceSleeves(totalValue, assets) {
  return assets.map((asset) => totalValue * asset.targetWeight);
}

function computeMddAndRecovery(navPath) {
  let peak = -Infinity;
  let peakIndex = 0;
  let mdd = 0;
  let mddPeak = 0;
  let troughIndex = -1;
  let peakForMdd = 0;

  for (const [index, nav] of navPath.entries()) {
    if (nav > peak) {
      peak = nav;
      peakIndex = index;
    }
    const drawdown = peak === 0 ? 0 : nav / peak - 1;
    if (drawdown < mdd) {
      mdd = drawdown;
      mddPeak = peakIndex;
      peakForMdd = peak;
      troughIndex = index;
    }
  }

  let recoveryMonths = null;
  let recovered = mdd === 0;
  if (mdd === 0) recoveryMonths = 0;
  if (troughIndex >= 0) {
    for (let index = troughIndex + 1; index < navPath.length; index += 1) {
      if (navPath[index] >= peakForMdd) {
        recoveryMonths = index - mddPeak;
        recovered = true;
        break;
      }
    }
  }

  return { mdd, recoveryMonths, recovered };
}

export function sampleJointBlockPath({ matrix, blockMonths, investmentMonths, nextRandom }) {
  const validStartCount = matrix.length - blockMonths + 1;
  if (validStartCount <= 0) throw new RangeError("not enough history for block sampling");
  const sampledRows = [];
  const sampledBlockStarts = [];
  while (sampledRows.length < investmentMonths) {
    const startIndex = Math.floor(nextRandom() * validStartCount);
    const remaining = investmentMonths - sampledRows.length;
    const blockLength = Math.min(blockMonths, remaining);
    sampledBlockStarts.push({
      startIndex,
      startMonth: matrix[startIndex].month,
      blockLength,
    });
    sampledRows.push(...matrix.slice(startIndex, startIndex + blockLength));
  }
  return { sampledRows, sampledBlockStarts };
}

function simulatePath({ assets, settings, sampledRows }) {
  const monthlyInflationRate = (1 + settings.inflationRateAnnual / 100) ** (1 / 12) - 1;
  let valuationSleeves = rebalanceSleeves(settings.initialInvestment, assets);
  let riskSleeves = rebalanceSleeves(100, assets);
  let cumulativeContributions = settings.initialInvestment;
  const nominalPath = [settings.initialInvestment];
  const realPath = [settings.initialInvestment];
  const riskNavPath = [100];
  const contributionSeries = [{
    monthIndex: 0,
    cumulativeContributions: roundNumber(cumulativeContributions),
  }];

  for (const [rowIndex, sampledRow] of sampledRows.entries()) {
    const monthIndex = rowIndex + 1;
    for (const [index, asset] of assets.entries()) {
      valuationSleeves[index] += settings.monthlyContribution * asset.targetWeight;
    }
    cumulativeContributions += settings.monthlyContribution;

    if (shouldRebalance(settings.rebalanceFrequency, monthIndex)) {
      valuationSleeves = rebalanceSleeves(valuationSleeves.reduce((sum, value) => sum + value, 0), assets);
      riskSleeves = rebalanceSleeves(riskSleeves.reduce((sum, value) => sum + value, 0), assets);
    }

    const valuationResult = applyAssetReturns(valuationSleeves, assets, sampledRow);
    valuationSleeves = valuationResult.sleeves;
    const riskResult = applyAssetReturns(riskSleeves, assets, sampledRow);
    riskSleeves = riskResult.sleeves;

    nominalPath.push(valuationResult.total);
    realPath.push(valuationResult.total / ((1 + monthlyInflationRate) ** monthIndex));
    riskNavPath.push(riskResult.total);
    contributionSeries.push({
      monthIndex,
      cumulativeContributions: roundNumber(cumulativeContributions),
    });
  }

  return {
    nominalPath,
    realPath,
    riskNavPath,
    contributionSeries,
    terminalValue: nominalPath[nominalPath.length - 1],
    mddAndRecovery: computeMddAndRecovery(riskNavPath),
  };
}

function horizonShortfallProbability(paths, monthIndex) {
  if (paths[0].nominalPath.length - 1 < monthIndex) return null;
  const shortfallCount = paths.filter((path) => (
    path.nominalPath[monthIndex] < path.contributionSeries[monthIndex].cumulativeContributions
  )).length;
  return shortfallCount / paths.length;
}

function buildMonthlyBands(paths, investmentMonths) {
  const bands = [];
  for (let monthIndex = 0; monthIndex <= investmentMonths; monthIndex += 1) {
    const nominalValues = paths.map((path) => path.nominalPath[monthIndex]);
    const realValues = paths.map((path) => path.realPath[monthIndex]);
    bands.push({
      monthIndex,
      p10Nominal: roundNumber(percentile(nominalValues, 0.1)),
      p25Nominal: roundNumber(percentile(nominalValues, 0.25)),
      p50Nominal: roundNumber(percentile(nominalValues, 0.5)),
      p75Nominal: roundNumber(percentile(nominalValues, 0.75)),
      p90Nominal: roundNumber(percentile(nominalValues, 0.9)),
      p10Real: roundNumber(percentile(realValues, 0.1)),
      p25Real: roundNumber(percentile(realValues, 0.25)),
      p50Real: roundNumber(percentile(realValues, 0.5)),
      p75Real: roundNumber(percentile(realValues, 0.75)),
      p90Real: roundNumber(percentile(realValues, 0.9)),
    });
  }
  return bands;
}

export function buildProbabilisticBootstrapScenario(input = {}) {
  try {
    const assets = normalizeAssets(input.assets);
    const settings = normalizeSettings(input.settings);
    const scenario = normalizeScenario(input.scenario);
    const metadata = normalizeMetadata(input.metadata);
    const historyPolicy = buildHistoryPolicy(input.metadata, scenario.blockMonths);
    const matrixResult = normalizeMonthlyReturnMatrix({
      monthlyReturnMatrix: input.monthlyReturnMatrix,
      assets,
      metadata,
    });

    const minimumCommonHistoryMonths = historyPolicy.effectiveMinimumCommonHistoryMonths;
    const normalizedInputForHash = {
      portfolioId: input.portfolioId || "",
      assets,
      settings,
      scenario,
      metadata: {
        ...metadata,
        effectiveSourceHashes: matrixResult.sourceHashes,
      },
      historyPolicy,
      matrix: matrixResult.matrix,
    };
    const inputHash = sha256Stable(normalizedInputForHash);
    if (matrixResult.matrix.length < minimumCommonHistoryMonths) {
      return buildBlockedResult({
        status: "insufficient_data",
        reasons: [`insufficient_common_history:${matrixResult.matrix.length}<${minimumCommonHistoryMonths}`],
        input,
        metadata: {
          ...metadata,
          dataStartDate: matrixResult.dataStartDate,
          dataEndDate: matrixResult.dataEndDate,
        },
        normalizedInputForHash,
        sourceHashes: matrixResult.sourceHashes,
        historyPolicy,
        percentiles: scenario.percentiles,
      });
    }

    const validBlockStartCount = matrixResult.matrix.length - scenario.blockMonths + 1;
    if (validBlockStartCount <= 0) {
      return buildBlockedResult({
        status: "insufficient_data",
        reasons: ["insufficient_history_for_block_sampling"],
        input,
        metadata: {
          ...metadata,
          dataStartDate: matrixResult.dataStartDate,
          dataEndDate: matrixResult.dataEndDate,
        },
        normalizedInputForHash,
        sourceHashes: matrixResult.sourceHashes,
        historyPolicy,
        percentiles: scenario.percentiles,
      });
    }

    const nextRandom = createXorShift32(scenario.randomSeed);
    const paths = [];
    const sampledTrace = [];

    for (let simulationIndex = 0; simulationIndex < scenario.simulationCount; simulationIndex += 1) {
      const sample = sampleJointBlockPath({
        matrix: matrixResult.matrix,
        blockMonths: scenario.blockMonths,
        investmentMonths: settings.investmentMonths,
        nextRandom,
      });
      const simulated = simulatePath({
        assets,
        settings,
        sampledRows: sample.sampledRows,
      });
      paths.push(simulated);
      if (simulationIndex < Math.min(5, scenario.simulationCount)) {
        sampledTrace.push({
          simulationIndex,
          sampledBlockStarts: sample.sampledBlockStarts,
          sampledRows: sample.sampledRows.map((row, rowIndex) => ({
            monthIndex: rowIndex + 1,
            sourceMonth: row.month,
            assetReturns: Object.fromEntries(
              Object.entries(row.assetReturns).sort(([a], [b]) => a.localeCompare(b)),
            ),
          })),
        });
      }
    }

    const mdds = paths.map((path) => path.mddAndRecovery.mdd);
    const recoveredDurations = paths
      .map((path) => path.mddAndRecovery.recoveryMonths)
      .filter((value) => value !== null);
    const unrecoveredCount = paths.filter((path) => !path.mddAndRecovery.recovered).length;
    const terminalValue = percentileObject(paths.map((path) => path.terminalValue));
    const scenarioMdd = percentileObject(mdds);
    const monthlyBands = buildMonthlyBands(paths, settings.investmentMonths);
    const resultWithoutHash = {
      status: "ready",
      scenarioVersion: PROBABILISTIC_SCENARIO_VERSION,
      method: scenario.method,
      prngAlgorithm: PROBABILISTIC_PRNG_ALGORITHM,
      randomSeed: scenario.randomSeed,
      simulationCount: scenario.simulationCount,
      blockMonths: scenario.blockMonths,
      percentiles: scenario.percentiles,
      rebalanceFrequency: settings.rebalanceFrequency,
      returnBasis: metadata.returnBasis,
      currencyMode: metadata.currencyMode,
      dataStartDate: matrixResult.dataStartDate,
      dataEndDate: matrixResult.dataEndDate,
      sourceHashes: matrixResult.sourceHashes,
      normalizationVersion: metadata.normalizationVersion,
      calculationPolicyVersion: metadata.calculationPolicyVersion,
      pipelineVersion: metadata.pipelineVersion,
      betaApplied: false,
      cagrCalibrationApplied: false,
      historicalMddApplied: false,
      inputHash,
      dataQuality: {
        status: "ready",
        commonHistoryMonths: matrixResult.matrix.length,
        minimumCommonHistoryMonths,
        historyPolicy,
        validBlockStartCount,
      },
      assets: assets.map((asset) => ({
        market: asset.market,
        ticker: asset.ticker,
        targetWeight: roundNumber(asset.targetWeight),
      })),
      monthlyBands,
      terminalValue,
      principalShortfallProbability: {
        month12: roundNumber(horizonShortfallProbability(paths, 12)),
        month36: roundNumber(horizonShortfallProbability(paths, 36)),
        month60: roundNumber(horizonShortfallProbability(paths, 60)),
      },
      scenarioMdd,
      recovery: {
        medianRecoveryMonths: roundNumber(percentile(recoveredDurations, 0.5)),
        longestRecoveryMonths: recoveredDurations.length === 0 ? null : Math.max(...recoveredDurations),
        unrecoveredScenarioRatio: roundNumber(unrecoveredCount / paths.length),
      },
      contributionSeries: paths[0].contributionSeries,
      trace: {
        sampledBlockStarts: sampledTrace,
      },
    };

    return {
      ...resultWithoutHash,
      outputHash: sha256Stable(resultWithoutHash),
    };
  } catch (error) {
    return buildBlockedResult({
      status: "blocked",
      reasons: [error.message],
      input,
      metadata: input.metadata,
    });
  }
}

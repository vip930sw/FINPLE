import crypto from "node:crypto";

export const EXTERNAL_SHOCK_SCENARIO_VERSION = "external-shock-scenario-v1-step114-2h";
export const EXTERNAL_SHOCK_METHOD = "deterministic_external_shock";
export const EXTERNAL_SHOCK_ENGINE_VERSION = "external-shock-engine-v1-step114-2h";

const EPSILON = 1e-9;
const MONTH_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/;
const SUPPORTED_SHOCK_MODES = new Set(["direct_asset", "market_beta"]);
const SUPPORTED_REBALANCE_FREQUENCIES = new Set(["none", "annual"]);
const SUPPORTED_RETURN_BASIS = new Set(["price_return", "total_return"]);
const REQUIRED_BETA_PROVENANCE_FIELDS = ["sourceHash", "sourceName", "asOfDate", "betaWindow", "methodVersion"];

function roundNumber(value, digits = 10) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(digits));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

export function stableSerializeExternalShockValue(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256ExternalShockValue(value) {
  return crypto.createHash("sha256").update(stableSerializeExternalShockValue(value)).digest("hex");
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
    throw new TypeError(`${label}:must_be_finite_number`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${label}:must_be_finite_number`);
  }
  return number;
}

function toPositiveInteger(value, label) {
  const number = toFiniteNumber(value, label);
  if (!Number.isInteger(number) || number <= 0) {
    throw new RangeError(`${label}:must_be_positive_integer`);
  }
  return number;
}

function normalizeWeight(value, label) {
  const number = toFiniteNumber(value, label);
  if (number < 0) throw new RangeError(`${label}:must_be_nonnegative`);
  return number > 1 ? number / 100 : number;
}

function normalizeInflationRate(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = toFiniteNumber(value, "settings.inflationRate");
  if (number <= -1) throw new RangeError("settings.inflationRate:must_be_greater_than_minus_100_percent");
  return roundNumber(number);
}

function normalizeBetaProvenance(value, label) {
  if (!isPlainObject(value)) throw new TypeError(`${label}:provenance_required`);
  return Object.fromEntries(REQUIRED_BETA_PROVENANCE_FIELDS.map((field) => {
    const normalized = String(value[field] || "").trim();
    if (!normalized) throw new TypeError(`${label}.${field}:required`);
    return [field, normalized];
  }));
}

function collectEffectiveSourceHashes(metadataSourceHashes = [], rows = []) {
  const rowSourceHashes = Array.isArray(rows)
    ? rows.map((row) => String(row?.sourceHash || "").trim()).filter(Boolean)
    : [];
  return Array.from(new Set([
    ...(Array.isArray(metadataSourceHashes) ? metadataSourceHashes : []),
    ...rowSourceHashes,
  ].map((value) => String(value || "").trim()).filter(Boolean))).sort();
}

function normalizeAssets(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new TypeError("assets:must_be_non_empty_array");
  }
  const normalized = assets.map((asset, index) => {
    if (!isPlainObject(asset)) throw new TypeError(`assets[${index}]:must_be_object`);
    const market = normalizeMarket(asset.market);
    const ticker = normalizeTicker(asset.ticker);
    if (!market || !ticker) throw new TypeError(`assets[${index}]:market_ticker_required`);
    return {
      id: asset.id ? String(asset.id) : `${market}:${ticker}`,
      market,
      ticker,
      key: `${market}:${ticker}`,
      targetWeight: normalizeWeight(asset.targetWeight ?? asset.weight, `assets[${index}].targetWeight`),
      beta: asset.beta === null || asset.beta === undefined || String(asset.beta).trim() === ""
        ? null
        : roundNumber(toFiniteNumber(asset.beta, `assets[${index}].beta`)),
    };
  }).sort((left, right) => left.key.localeCompare(right.key));

  const seen = new Set();
  for (const asset of normalized) {
    if (seen.has(asset.key)) throw new RangeError(`duplicate_asset:${asset.key}`);
    seen.add(asset.key);
  }
  const weightSum = normalized.reduce((sum, asset) => sum + asset.targetWeight, 0);
  if (Math.abs(weightSum - 1) > EPSILON) {
    throw new RangeError(`asset_weight_sum_invalid:${roundNumber(weightSum)}`);
  }
  return normalized;
}

function normalizeSettings(settings = {}) {
  if (!isPlainObject(settings)) throw new TypeError("settings:must_be_object");
  const initialInvestment = toFiniteNumber(
    settings.initialInvestment ?? settings.startValue,
    "settings.initialInvestment",
  );
  const monthlyContribution = toFiniteNumber(
    settings.monthlyContribution ?? settings.monthlyCashFlow ?? 0,
    "settings.monthlyContribution",
  );
  if (initialInvestment < 0) throw new RangeError("settings.initialInvestment:must_be_nonnegative");
  if (monthlyContribution < 0) throw new RangeError("settings.monthlyContribution:must_be_nonnegative");
  const investmentMonths = toPositiveInteger(
    settings.investmentMonths ?? (settings.years ? Number(settings.years) * 12 : null),
    "settings.investmentMonths",
  );
  const rebalanceFrequency = String(settings.rebalanceFrequency || "none").trim();
  if (!SUPPORTED_REBALANCE_FREQUENCIES.has(rebalanceFrequency)) {
    throw new TypeError("settings.rebalanceFrequency:unsupported");
  }
  const inflationRate = normalizeInflationRate(settings.inflationRateAnnual ?? settings.inflationRate);
  return {
    initialInvestment: roundNumber(initialInvestment),
    monthlyContribution: roundNumber(monthlyContribution),
    investmentMonths,
    rebalanceFrequency,
    inflationRate,
  };
}

function normalizeMetadata(metadata = {}, rows = []) {
  if (!isPlainObject(metadata)) throw new TypeError("metadata:must_be_object");
  const returnBasis = String(metadata.returnBasis || "").trim();
  const currencyMode = String(metadata.currencyMode || "").trim().toUpperCase();
  if (!SUPPORTED_RETURN_BASIS.has(returnBasis)) throw new TypeError("metadata.returnBasis:unsupported");
  if (!currencyMode) throw new TypeError("metadata.currencyMode:required");
  const sourceHashes = collectEffectiveSourceHashes(metadata.sourceHashes, rows);
  if (sourceHashes.length === 0) throw new TypeError("sourceHashes:required");
  for (const field of ["normalizationVersion", "calculationPolicyVersion", "pipelineVersion"]) {
    if (!String(metadata[field] || "").trim()) throw new TypeError(`metadata.${field}:required`);
  }
  return {
    returnBasis,
    currencyMode,
    sourceHashes,
    normalizationVersion: String(metadata.normalizationVersion).trim(),
    calculationPolicyVersion: String(metadata.calculationPolicyVersion).trim(),
    pipelineVersion: String(metadata.pipelineVersion).trim(),
  };
}

function readBaselineReturn(row, label) {
  const value = row.baselineReturn ?? row.return ?? row.priceReturn ?? row.totalReturn;
  const number = toFiniteNumber(value, label);
  if (number <= -1) throw new RangeError(`${label}:must_be_greater_than_minus_100_percent`);
  return number;
}

function normalizeBaselineRows(rows, assets, settings, metadata) {
  if (!Array.isArray(rows) || rows.length === 0) throw new TypeError("baselineReturnMatrix:must_be_non_empty_array");
  const assetKeys = new Set(assets.map((asset) => asset.key));
  const expectedMonthCount = settings.investmentMonths;
  const byMonth = new Map();
  const seenAssetMonths = new Set();

  for (const [index, row] of rows.entries()) {
    if (!isPlainObject(row)) throw new TypeError(`baselineReturnMatrix[${index}]:must_be_object`);
    const market = normalizeMarket(row.market);
    const ticker = normalizeTicker(row.ticker);
    const key = `${market}:${ticker}`;
    if (!assetKeys.has(key)) continue;
    const month = canonicalMonth(row.month, `baselineReturnMatrix[${index}].month`);
    const duplicateKey = `${key}:${month}`;
    if (seenAssetMonths.has(duplicateKey)) {
      throw new RangeError(`same_calendar_month_duplicate:${duplicateKey}`);
    }
    seenAssetMonths.add(duplicateKey);
    const returnBasis = String(row.returnBasis || metadata.returnBasis).trim();
    const currencyMode = String(row.currencyMode || metadata.currencyMode).trim().toUpperCase();
    if (returnBasis !== metadata.returnBasis) throw new TypeError(`mixed_return_basis:${key}:${month}`);
    if (currencyMode !== metadata.currencyMode) throw new TypeError(`mixed_currency_mode:${key}:${month}`);
    const sourceHash = String(row.sourceHash || "").trim();
    if (!sourceHash) throw new TypeError(`row_sourceHash_required:${key}:${month}`);
    if (!byMonth.has(month)) byMonth.set(month, {});
    byMonth.get(month)[key] = {
      baselineReturn: roundNumber(readBaselineReturn(row, `baselineReturnMatrix[${index}].baselineReturn`)),
      sourceHash,
    };
  }

  const months = Array.from(byMonth.keys()).sort((left, right) => monthOrdinal(left) - monthOrdinal(right));
  if (months.length < expectedMonthCount) {
    const error = new RangeError(`insufficient_data:expected_${expectedMonthCount}_months_got_${months.length}`);
    error.status = "insufficient_data";
    throw error;
  }

  const selectedMonths = months.slice(0, expectedMonthCount);
  for (const [index, month] of selectedMonths.entries()) {
    if (index > 0 && monthOrdinal(month) - monthOrdinal(selectedMonths[index - 1]) !== 1) {
      throw new RangeError(`missing_calendar_month:${selectedMonths[index - 1]}:${month}`);
    }
    const assetReturns = byMonth.get(month) || {};
    for (const asset of assets) {
      if (!Object.prototype.hasOwnProperty.call(assetReturns, asset.key)) {
        throw new RangeError(`missing_asset_month:${asset.key}:${month}`);
      }
    }
  }

  return selectedMonths.map((month, index) => ({
    month,
    monthIndex: index + 1,
    assetReturns: Object.fromEntries(
      assets.map((asset) => [asset.key, byMonth.get(month)[asset.key].baselineReturn]),
    ),
    rowSourceHashes: Object.fromEntries(
      assets.map((asset) => [asset.key, byMonth.get(month)[asset.key].sourceHash]),
    ),
  }));
}

function normalizeShockEvents({ scenario, assets, settings }) {
  if (!isPlainObject(scenario)) throw new TypeError("scenario:must_be_object");
  const method = String(scenario.method || EXTERNAL_SHOCK_METHOD).trim();
  if (method !== EXTERNAL_SHOCK_METHOD) throw new TypeError("scenario.method:unsupported");
  const shockMode = String(scenario.shockMode || "").trim();
  if (!SUPPORTED_SHOCK_MODES.has(shockMode)) throw new TypeError("scenario.shockMode:unsupported");
  const scenarioId = String(scenario.scenarioId || `${shockMode}-scenario`).trim();
  const scenarioLabel = String(scenario.scenarioLabel || scenario.label || scenarioId).trim();
  if (!scenarioId) throw new TypeError("scenario.scenarioId:required");
  if (!scenarioLabel) throw new TypeError("scenario.scenarioLabel:required");
  if (!Array.isArray(scenario.shockEvents) || scenario.shockEvents.length === 0) {
    throw new TypeError("scenario.shockEvents:must_be_non_empty_array");
  }

  const events = scenario.shockEvents.map((event, index) => {
    if (!isPlainObject(event)) throw new TypeError(`scenario.shockEvents[${index}]:must_be_object`);
    const monthIndex = toPositiveInteger(event.monthIndex, `scenario.shockEvents[${index}].monthIndex`);
    if (monthIndex > settings.investmentMonths) throw new RangeError(`shock_month_out_of_range:${monthIndex}`);
    const label = String(event.label || `Shock ${monthIndex}`).trim();
    if (shockMode === "direct_asset") {
      const rawShocks = Array.isArray(event.assetShocks)
        ? event.assetShocks
        : Object.entries(isPlainObject(event.assetShocks) ? event.assetShocks : {}).map(([key, shockReturn]) => {
          const [market, ticker] = key.split(":");
          return { market, ticker, shockReturn };
        });
      if (!Array.isArray(rawShocks) || rawShocks.length === 0) {
        throw new TypeError(`scenario.shockEvents[${index}].assetShocks:required`);
      }
      const shocksByKey = new Map();
      for (const [shockIndex, shock] of rawShocks.entries()) {
        const key = assetKey(shock);
        if (shocksByKey.has(key)) {
          throw new RangeError(`duplicate_asset_shock_identity:${key}:${monthIndex}`);
        }
        const shockReturn = toFiniteNumber(shock.shockReturn, `scenario.shockEvents[${index}].assetShocks[${shockIndex}].shockReturn`);
        if (shockReturn <= -1) throw new RangeError(`direct_asset_shock_less_than_or_equal_minus_100:${key}:${monthIndex}`);
        shocksByKey.set(key, roundNumber(shockReturn));
      }
      const missing = assets.filter((asset) => !shocksByKey.has(asset.key));
      if (missing.length > 0 || shocksByKey.size !== assets.length) {
        throw new RangeError(`direct_asset_shock_coverage_invalid:${monthIndex}`);
      }
      return {
        monthIndex,
        label,
        shockMode,
        assetShockReturns: Object.fromEntries(assets.map((asset) => [asset.key, shocksByKey.get(asset.key)])),
      };
    }

    if (event.assetShocks !== undefined) throw new TypeError(`mixed_shock_payload:${monthIndex}`);
    const marketFactorShock = toFiniteNumber(event.marketFactorShock, `scenario.shockEvents[${index}].marketFactorShock`);
    if (marketFactorShock <= -1) throw new RangeError(`market_factor_shock_less_than_or_equal_minus_100:${monthIndex}`);
    const betaRows = Array.isArray(event.assetBetas) ? event.assetBetas : scenario.assetBetas;
    const betasByKey = new Map();
    const betaProvenanceByKey = new Map();
    if (Array.isArray(betaRows)) {
      for (const [betaIndex, betaRow] of betaRows.entries()) {
        const key = assetKey(betaRow);
        if (betasByKey.has(key)) {
          throw new RangeError(`duplicate_beta_identity:${key}:${monthIndex}`);
        }
        betasByKey.set(key, roundNumber(toFiniteNumber(betaRow.beta, `assetBetas[${betaIndex}].beta`)));
        betaProvenanceByKey.set(
          key,
          normalizeBetaProvenance(betaRow.provenance, `assetBetas[${betaIndex}].provenance`),
        );
      }
    }
    for (const asset of assets) {
      if (betasByKey.has(asset.key) && asset.beta !== null) {
        throw new RangeError(`market_beta_conflicting_asset_fallback:${asset.key}:${monthIndex}`);
      }
      if (!betasByKey.has(asset.key) && asset.beta !== null) {
        throw new RangeError(`market_beta_asset_fallback_missing_provenance:${asset.key}:${monthIndex}`);
      }
    }
    const missing = assets.filter((asset) => !betasByKey.has(asset.key));
    if (missing.length > 0 || betasByKey.size !== assets.length) {
      throw new RangeError(`market_beta_coverage_invalid:${monthIndex}`);
    }
    const shockReturns = Object.fromEntries(assets.map((asset) => {
      const beta = betasByKey.get(asset.key);
      const shockReturn = beta * marketFactorShock;
      if (shockReturn <= -1) throw new RangeError(`market_beta_shock_less_than_or_equal_minus_100:${asset.key}:${monthIndex}`);
      return [asset.key, roundNumber(shockReturn)];
    }));
    return {
      monthIndex,
      label,
      shockMode,
      marketFactorShock: roundNumber(marketFactorShock),
      assetBetas: Object.fromEntries(assets.map((asset) => [asset.key, betasByKey.get(asset.key)])),
      betaProvenance: Object.fromEntries(assets.map((asset) => [asset.key, betaProvenanceByKey.get(asset.key)])),
      assetShockReturns: shockReturns,
    };
  }).sort((left, right) => left.monthIndex - right.monthIndex);

  for (let index = 1; index < events.length; index += 1) {
    if (events[index].monthIndex === events[index - 1].monthIndex) {
      throw new RangeError(`duplicate_shock_month:${events[index].monthIndex}`);
    }
  }
  return { method, shockMode, scenarioId, scenarioLabel, events };
}

function shouldRebalance(monthIndex, rebalanceFrequency) {
  if (rebalanceFrequency !== "annual") return false;
  return monthIndex > 1 && (monthIndex - 1) % 12 === 0;
}

function rebalanceSleeves(totalValue, assets) {
  return Object.fromEntries(assets.map((asset) => [asset.key, totalValue * asset.targetWeight]));
}

function sleeveTotal(sleeves) {
  return Object.values(sleeves).reduce((sum, value) => sum + value, 0);
}

function applyMonthReturn(sleeves, returns) {
  return Object.fromEntries(
    Object.entries(sleeves).map(([key, value]) => [key, value * (1 + returns[key])]),
  );
}

function buildStressedReturns(baselineReturns, event) {
  if (!event) return { ...baselineReturns };
  return Object.fromEntries(
    Object.entries(baselineReturns).map(([key, baselineReturn]) => {
      const directShockReturn = event.assetShockReturns[key];
      return [key, roundNumber((1 + baselineReturn) * (1 + directShockReturn) - 1)];
    }),
  );
}

function computeMddAndRecovery(path) {
  let peak = path[0]?.riskNav ?? 0;
  let troughMdd = 0;
  let drawdownStart = null;
  let longestRecoveryMonths = 0;
  let activeDrawdownStart = null;

  for (const point of path) {
    const value = point.riskNav;
    if (value >= peak - EPSILON) {
      if (activeDrawdownStart !== null) {
        longestRecoveryMonths = Math.max(longestRecoveryMonths, point.monthIndex - activeDrawdownStart);
        activeDrawdownStart = null;
      }
      peak = value;
      drawdownStart = null;
    } else {
      if (drawdownStart === null) drawdownStart = point.monthIndex;
      if (activeDrawdownStart === null) activeDrawdownStart = point.monthIndex;
      const mdd = peak > 0 ? value / peak - 1 : 0;
      if (mdd < troughMdd) troughMdd = mdd;
    }
  }

  return {
    mdd: roundNumber(troughMdd),
    longestRecoveryMonths,
    unrecovered: activeDrawdownStart !== null,
    recoveryMonths: activeDrawdownStart === null ? longestRecoveryMonths : null,
  };
}

function simulatePaths({ assets, settings, baselineRows, events }) {
  const eventsByMonth = new Map(events.map((event) => [event.monthIndex, event]));
  let baselineValuationSleeves = rebalanceSleeves(settings.initialInvestment, assets);
  let stressedValuationSleeves = rebalanceSleeves(settings.initialInvestment, assets);
  let baselineRiskSleeves = rebalanceSleeves(100, assets);
  let stressedRiskSleeves = rebalanceSleeves(100, assets);

  const baselinePath = [{
    monthIndex: 0,
    periodLabel: "0 months",
    portfolioValue: roundNumber(settings.initialInvestment),
    riskNav: 100,
    cumulativeContributions: roundNumber(settings.initialInvestment),
  }];
  const stressedPath = [{
    monthIndex: 0,
    periodLabel: "0 months",
    portfolioValue: roundNumber(settings.initialInvestment),
    riskNav: 100,
    cumulativeContributions: roundNumber(settings.initialInvestment),
  }];
  const contributionSeries = [{
    monthIndex: 0,
    cumulativeContributions: roundNumber(settings.initialInvestment),
  }];
  const trace = [];
  let cumulativeContributions = settings.initialInvestment;

  for (const row of baselineRows) {
    if (shouldRebalance(row.monthIndex, settings.rebalanceFrequency)) {
      baselineValuationSleeves = rebalanceSleeves(sleeveTotal(baselineValuationSleeves), assets);
      stressedValuationSleeves = rebalanceSleeves(sleeveTotal(stressedValuationSleeves), assets);
      baselineRiskSleeves = rebalanceSleeves(sleeveTotal(baselineRiskSleeves), assets);
      stressedRiskSleeves = rebalanceSleeves(sleeveTotal(stressedRiskSleeves), assets);
    }

    if (settings.monthlyContribution > 0) {
      for (const asset of assets) {
        const contribution = settings.monthlyContribution * asset.targetWeight;
        baselineValuationSleeves[asset.key] += contribution;
        stressedValuationSleeves[asset.key] += contribution;
      }
      cumulativeContributions += settings.monthlyContribution;
    }

    const event = eventsByMonth.get(row.monthIndex);
    const stressedReturns = buildStressedReturns(row.assetReturns, event);
    baselineValuationSleeves = applyMonthReturn(baselineValuationSleeves, row.assetReturns);
    baselineRiskSleeves = applyMonthReturn(baselineRiskSleeves, row.assetReturns);
    stressedValuationSleeves = applyMonthReturn(stressedValuationSleeves, stressedReturns);
    stressedRiskSleeves = applyMonthReturn(stressedRiskSleeves, stressedReturns);

    const baselineRiskNav = sleeveTotal(baselineRiskSleeves);
    const stressedRiskNav = sleeveTotal(stressedRiskSleeves);
    baselinePath.push({
      monthIndex: row.monthIndex,
      periodLabel: `${row.monthIndex} months`,
      portfolioValue: roundNumber(sleeveTotal(baselineValuationSleeves)),
      riskNav: roundNumber(baselineRiskNav),
      cumulativeContributions: roundNumber(cumulativeContributions),
    });
    stressedPath.push({
      monthIndex: row.monthIndex,
      periodLabel: `${row.monthIndex} months`,
      portfolioValue: roundNumber(sleeveTotal(stressedValuationSleeves)),
      riskNav: roundNumber(stressedRiskNav),
      cumulativeContributions: roundNumber(cumulativeContributions),
    });
    contributionSeries.push({
      monthIndex: row.monthIndex,
      cumulativeContributions: roundNumber(cumulativeContributions),
    });
    trace.push({
      monthIndex: row.monthIndex,
      month: row.month,
      shockApplied: Boolean(event),
      rowSourceHashes: row.rowSourceHashes,
      baselineReturns: row.assetReturns,
      stressedReturns,
      assetShockReturns: event?.assetShockReturns || null,
      betaProvenance: event?.betaProvenance || null,
      shockAssumptions: event ? {
        shockMode: event.shockMode,
        marketFactorShock: event.marketFactorShock ?? null,
        assetShockReturns: event.assetShockReturns,
        assetBetas: event.assetBetas ?? null,
        betaProvenance: event.betaProvenance ?? null,
      } : null,
    });
  }

  const baselineMdd = computeMddAndRecovery(baselinePath);
  const stressedMdd = computeMddAndRecovery(stressedPath);
  const baselineTerminalValue = baselinePath.at(-1).portfolioValue;
  const stressedTerminalValue = stressedPath.at(-1).portfolioValue;
  const terminalDeltaValue = stressedTerminalValue - baselineTerminalValue;

  return {
    baselinePath,
    stressedPath,
    contributionSeries,
    baselineTerminalSleeves: Object.fromEntries(
      Object.entries(baselineValuationSleeves).map(([key, value]) => [key, roundNumber(value)]),
    ),
    stressedTerminalSleeves: Object.fromEntries(
      Object.entries(stressedValuationSleeves).map(([key, value]) => [key, roundNumber(value)]),
    ),
    summary: {
      baselineTerminalValue: roundNumber(baselineTerminalValue),
      stressedTerminalValue: roundNumber(stressedTerminalValue),
      terminalDeltaValue: roundNumber(terminalDeltaValue),
      terminalDeltaRate: baselineTerminalValue > 0 ? roundNumber(terminalDeltaValue / baselineTerminalValue) : null,
      baselineMdd: baselineMdd.mdd,
      stressedMdd: stressedMdd.mdd,
      incrementalMdd: roundNumber(stressedMdd.mdd - baselineMdd.mdd),
      recoveryMonths: stressedMdd.recoveryMonths,
      longestRecoveryMonths: stressedMdd.longestRecoveryMonths,
      unrecovered: stressedMdd.unrecovered,
    },
    trace,
  };
}

function buildAssetImpactSummary({ assets, baselineTerminalSleeves, stressedTerminalSleeves }) {
  return assets.map((asset) => {
    const baselineTerminalValue = baselineTerminalSleeves[asset.key];
    const stressedTerminalValue = stressedTerminalSleeves[asset.key];
    const deltaValue = stressedTerminalValue - baselineTerminalValue;
    return {
      market: asset.market,
      ticker: asset.ticker,
      key: asset.key,
      baselineTerminalValue,
      stressedTerminalValue,
      deltaValue: roundNumber(deltaValue),
      deltaRate: baselineTerminalValue > 0 ? roundNumber(deltaValue / baselineTerminalValue) : null,
    };
  });
}

function buildRowSourceLineage(baselineRows) {
  return baselineRows.map((row) => ({
    month: row.month,
    monthIndex: row.monthIndex,
    rowSourceHashes: row.rowSourceHashes,
  }));
}

function buildBlockedResult({ input = {}, status = "blocked", reasons = [], normalizedInput = null }) {
  const rows = input?.baselineReturnMatrix || input?.monthlyReturnMatrix || [];
  const sourceHashes = collectEffectiveSourceHashes(input?.metadata?.sourceHashes, rows);
  const inputHash = sha256ExternalShockValue(normalizedInput || {
    status,
    reasons,
    portfolioId: input?.portfolioId || "",
    scenario: input?.scenario || null,
    settings: input?.settings || null,
    assets: input?.assets || null,
    sourceHashes,
  });
  const resultWithoutHash = {
    status,
    scenarioVersion: EXTERNAL_SHOCK_SCENARIO_VERSION,
    engineVersion: EXTERNAL_SHOCK_ENGINE_VERSION,
    scenarioId: input?.scenario?.scenarioId || null,
    scenarioLabel: input?.scenario?.scenarioLabel || input?.scenario?.label || null,
    method: input?.scenario?.method || EXTERNAL_SHOCK_METHOD,
    shockMode: input?.scenario?.shockMode || null,
    rebalanceFrequency: input?.settings?.rebalanceFrequency || null,
    returnBasis: input?.metadata?.returnBasis || null,
    currencyMode: input?.metadata?.currencyMode || null,
    dataStartDate: null,
    dataEndDate: null,
    sourceHashes,
    normalizationVersion: input?.metadata?.normalizationVersion || null,
    calculationPolicyVersion: input?.metadata?.calculationPolicyVersion || null,
    pipelineVersion: input?.metadata?.pipelineVersion || null,
    inputHash,
    dataQuality: {
      status,
      blockReasons: reasons,
    },
    betaApplied: false,
    bootstrapApplied: false,
    probabilityApplied: false,
    cagrCalibrationApplied: false,
    historicalMddApplied: false,
    inflationRate: input?.settings?.inflationRateAnnual ?? input?.settings?.inflationRate ?? null,
    baselineTerminalValue: null,
    stressedTerminalValue: null,
    terminalDeltaValue: null,
    terminalDeltaRate: null,
    baselineMdd: null,
    stressedMdd: null,
    incrementalMdd: null,
    recoveryMonths: null,
    longestRecoveryMonths: null,
    unrecovered: null,
    baselinePath: [],
    stressedPath: [],
    contributionSeries: [],
    shockEvents: [],
    summary: null,
    assetImpactSummary: [],
    rowSourceLineage: [],
  };
  return {
    ...resultWithoutHash,
    outputHash: sha256ExternalShockValue(resultWithoutHash),
  };
}

export function buildExternalShockScenario(input = {}) {
  try {
    const rawRows = input.baselineReturnMatrix || input.monthlyReturnMatrix;
    const assets = normalizeAssets(input.assets);
    const settings = normalizeSettings(input.settings);
    const metadata = normalizeMetadata(input.metadata, rawRows);
    const baselineRows = normalizeBaselineRows(rawRows, assets, settings, metadata);
    const shock = normalizeShockEvents({ scenario: input.scenario, assets, settings });
    const rowSourceLineage = buildRowSourceLineage(baselineRows);
    const normalizedInput = {
      portfolioId: String(input.portfolioId || ""),
      assets,
      settings,
      scenario: {
        scenarioId: shock.scenarioId,
        scenarioLabel: shock.scenarioLabel,
        method: shock.method,
        shockMode: shock.shockMode,
        shockEvents: shock.events,
      },
      baselineRows,
      rowSourceLineage,
      metadata,
    };
    const inputHash = sha256ExternalShockValue(normalizedInput);
    const simulation = simulatePaths({
      assets,
      settings,
      baselineRows,
      events: shock.events,
    });
    const assetImpactSummary = buildAssetImpactSummary({
      assets,
      baselineTerminalSleeves: simulation.baselineTerminalSleeves,
      stressedTerminalSleeves: simulation.stressedTerminalSleeves,
    });
    const resultWithoutHash = {
      status: "ready",
      scenarioVersion: EXTERNAL_SHOCK_SCENARIO_VERSION,
      engineVersion: EXTERNAL_SHOCK_ENGINE_VERSION,
      scenarioId: shock.scenarioId,
      scenarioLabel: shock.scenarioLabel,
      method: shock.method,
      shockMode: shock.shockMode,
      rebalanceFrequency: settings.rebalanceFrequency,
      inflationRate: settings.inflationRate,
      returnBasis: metadata.returnBasis,
      currencyMode: metadata.currencyMode,
      dataStartDate: baselineRows[0].month,
      dataEndDate: baselineRows.at(-1).month,
      sourceHashes: metadata.sourceHashes,
      normalizationVersion: metadata.normalizationVersion,
      calculationPolicyVersion: metadata.calculationPolicyVersion,
      pipelineVersion: metadata.pipelineVersion,
      inputHash,
      dataQuality: {
        status: "ready",
        blockReasons: [],
      },
      betaApplied: shock.shockMode === "market_beta",
      bootstrapApplied: false,
      probabilityApplied: false,
      cagrCalibrationApplied: false,
      historicalMddApplied: false,
      assets: assets.map((asset) => ({
        market: asset.market,
        ticker: asset.ticker,
        key: asset.key,
        targetWeight: asset.targetWeight,
        beta: asset.beta,
      })),
      shockEvents: shock.events,
      baselinePath: simulation.baselinePath,
      stressedPath: simulation.stressedPath,
      contributionSeries: simulation.contributionSeries,
      summary: simulation.summary,
      baselineTerminalValue: simulation.summary.baselineTerminalValue,
      stressedTerminalValue: simulation.summary.stressedTerminalValue,
      terminalDeltaValue: simulation.summary.terminalDeltaValue,
      terminalDeltaRate: simulation.summary.terminalDeltaRate,
      baselineMdd: simulation.summary.baselineMdd,
      stressedMdd: simulation.summary.stressedMdd,
      incrementalMdd: simulation.summary.incrementalMdd,
      recoveryMonths: simulation.summary.recoveryMonths,
      longestRecoveryMonths: simulation.summary.longestRecoveryMonths,
      unrecovered: simulation.summary.unrecovered,
      assetImpactSummary,
      rowSourceLineage,
      trace: simulation.trace,
    };
    return {
      ...resultWithoutHash,
      outputHash: sha256ExternalShockValue(resultWithoutHash),
    };
  } catch (error) {
    return buildBlockedResult({
      input,
      status: error?.status || "blocked",
      reasons: [error?.message || "external_shock_pipeline_error"],
    });
  }
}

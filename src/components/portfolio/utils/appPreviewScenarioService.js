import { buildProbabilisticBootstrapScenario } from "../../../../server/src/services/scenario/probabilisticBootstrapEngine.js";

function normalizeMarket(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
}

function identityForAsset(asset = {}) {
  const market = normalizeMarket(asset.market);
  const ticker = normalizeTicker(asset.ticker);
  return market && ticker ? `${market}:${ticker}` : "";
}

function monthOrdinal(value) {
  const [year, month] = String(value || "").slice(0, 7).split("-").map(Number);
  return year * 12 + month;
}

export function longestContiguousMonthSegment(months = []) {
  const sorted = [...new Set(months.map((value) => String(value || "").slice(0, 7)).filter(Boolean))].sort();
  if (sorted.length === 0) return [];
  let best = [sorted[0]];
  let current = [sorted[0]];
  for (let index = 1; index < sorted.length; index += 1) {
    if (monthOrdinal(sorted[index]) - monthOrdinal(sorted[index - 1]) === 1) {
      current.push(sorted[index]);
    } else {
      if (current.length > best.length) best = current;
      current = [sorted[index]];
    }
  }
  if (current.length > best.length) best = current;
  return best;
}

function getAssetValue(asset = {}) {
  const planned = Number(asset.targetEvaluationAmount);
  if (Number.isFinite(planned) && planned > 0) return planned;
  const actual = Number(asset.quantity) * Number(asset.price);
  return Number.isFinite(actual) && actual > 0 ? actual : 0;
}

function normalizeWeights(assets) {
  const values = assets.map(getAssetValue);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total > 0) return values.map((value) => value / total);
  const explicit = assets.map((asset) => Number(asset.targetWeight));
  const explicitTotal = explicit.reduce(
    (sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0),
    0,
  );
  if (explicitTotal > 0) {
    return explicit.map((value) => (Number.isFinite(value) && value > 0 ? value / explicitTotal : 0));
  }
  return assets.map(() => 1 / assets.length);
}

function rowsByMonthForIdentity(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const month = String(row?.month || "").slice(0, 7);
    if (!month || map.has(month)) continue;
    map.set(month, row);
  }
  return map;
}

function intersectMonths(seriesMaps) {
  if (seriesMaps.length === 0) return [];
  return [...seriesMaps[0].keys()].filter((month) =>
    seriesMaps.every((map) => map.has(month))
  );
}

export function buildAppPreviewScenarioResult({
  activePortfolio = {},
  assets = [],
  settings = {},
  rowsByIdentity = {},
  manifest = {},
  simulationCount = 500,
  randomSeed = 1142,
} = {}) {
  const activeAssets = (Array.isArray(assets) ? assets : [])
    .filter((asset) => identityForAsset(asset))
    .filter((asset) => normalizeTicker(asset.ticker) !== "CASH");
  const identities = activeAssets.map(identityForAsset);
  const weights = normalizeWeights(activeAssets);
  const configuredStartValue = Number(settings.startValue);
  const assetStartValue = activeAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0);
  const initialInvestment =
    Number.isFinite(configuredStartValue) && configuredStartValue > 0
      ? configuredStartValue
      : assetStartValue;
  const seriesMaps = identities.map((identity) => rowsByMonthForIdentity(rowsByIdentity[identity]));
  const commonMonths = intersectMonths(seriesMaps);
  const contiguousMonths = longestContiguousMonthSegment(commonMonths);
  const monthlyReturnMatrix = [];
  for (const month of contiguousMonths) {
    activeAssets.forEach((asset, index) => {
      const identity = identities[index];
      const row = seriesMaps[index].get(month);
      monthlyReturnMatrix.push({
        month: row.month,
        market: normalizeMarket(asset.market),
        ticker: normalizeTicker(asset.ticker),
        returnBasis: "price_return",
        currencyMode: row.currency,
        priceReturn: row.priceReturn,
        sourceHash: manifest.sourceCandidatePackageHash,
      });
    });
  }
  const currencyModes = [...new Set(
    monthlyReturnMatrix.map((row) => String(row.currencyMode || "").trim()).filter(Boolean),
  )];
  const sourceHashes = [manifest.sourceCandidatePackageHash].filter(Boolean);
  const result = buildProbabilisticBootstrapScenario({
    portfolioId: activePortfolio.id || "",
    assets: activeAssets.map((asset, index) => ({
      market: normalizeMarket(asset.market),
      ticker: normalizeTicker(asset.ticker),
      targetWeight: weights[index],
    })),
    settings: {
      initialInvestment,
      monthlyContribution: Number(settings.monthlyCashFlow || 0),
      investmentMonths: Math.max(1, Math.round(Number(settings.years || 0) * 12)),
      inflationRateAnnual: Number(settings.inflationRate || 0),
      rebalanceFrequency: "none",
    },
    scenario: {
      method: "joint_block_bootstrap",
      simulationCount,
      blockMonths: 6,
      randomSeed,
      percentiles: [0.1, 0.25, 0.5, 0.75, 0.9],
    },
    monthlyReturnMatrix,
    metadata: {
      returnBasis: "price_return",
      currencyMode: currencyModes.length === 1 ? currencyModes[0] : "mixed",
      sourceHashes,
      normalizationVersion: manifest.normalizationVersion || "candidate-month-end-normalization-v1",
      calculationPolicyVersion:
        manifest.calculationPolicyVersion || "metrics-calculation-policy-2026-06-26",
      pipelineVersion: manifest.pipelineVersion || "metrics-v3.0-step114-2d",
      minimumCommonHistoryMonths: 60,
    },
  });
  return {
    ...result,
    internalPreviewContext: {
      reviewOnly: true,
      portfolioId: activePortfolio.id || "",
      portfolioName: activePortfolio.name || "",
      identities,
      sourceCandidatePackageId: manifest.sourceCandidatePackageId || "",
      metricDataThroughMonth: manifest.metricDataThroughMonth || "",
      commonObservedMonthCount: commonMonths.length,
      contiguousObservedMonthCount: contiguousMonths.length,
      commonDataStartMonth: contiguousMonths[0] || null,
      commonDataEndMonth: contiguousMonths.at(-1) || null,
      gapsForwardFilled: false,
      productionPublishReady: false,
      appExportApproved: false,
    },
    productionPublishReady: false,
    appExportApproved: false,
  };
}

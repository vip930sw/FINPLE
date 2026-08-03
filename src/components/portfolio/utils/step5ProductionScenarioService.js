import { buildExternalShockScenario } from "../../../../server/src/services/scenario/externalShockEngine.js";
import {
  isManualCashAsset,
  MANUAL_CASH_TOTAL_RETURN_PERCENT,
} from "../../../data/tickers/manualCashAsset.js";
import { longestContiguousMonthSegment } from "./appPreviewScenarioService.js";
import { assertMonthlyScenarioLineage } from "./monthlyScenarioLineagePolicy.js";
import { getStep4ScenarioAssets } from "./portfolioFormatters.js";

const CASH_MONTHLY_RETURN = (1 + MANUAL_CASH_TOTAL_RETURN_PERCENT / 100) ** (1 / 12) - 1;
const MINIMUM_SOURCE_HISTORY_MONTHS = 60;

export const STEP5_PRODUCTION_SHOCK_PRESETS = Object.freeze([
  Object.freeze({
    id: "market_drawdown_moderate",
    label: "Market drawdown - moderate",
    marketFactorShock: -0.2,
  }),
  Object.freeze({
    id: "market_drawdown_severe",
    label: "Market drawdown - severe",
    marketFactorShock: -0.35,
  }),
]);

function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function identityForAsset(asset = {}) {
  const market = normalize(asset.market);
  const ticker = normalize(asset.ticker);
  return market && ticker ? `${market}:${ticker}` : "";
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function percentToDecimal(value) {
  return isBlank(value) ? value : Number(value) / 100;
}

function investmentMonthsForSettings(settings = {}) {
  if (!isBlank(settings.investmentMonths)) return Number(settings.investmentMonths);
  return isBlank(settings.years) ? settings.years : Number(settings.years) * 12;
}

export function getStep5MonthlyArtifactIdentities(assets = []) {
  return [...new Set(getStep4ScenarioAssets(assets)
    .filter((asset) => !isManualCashAsset(asset))
    .map(identityForAsset)
    .filter(Boolean))].sort();
}

export function getStep5MonthlyArtifactIdentityFingerprint(assets = []) {
  return JSON.stringify(getStep5MonthlyArtifactIdentities(assets));
}

function rowMapForIdentity(identity, rows) {
  if (!Array.isArray(rows)) {
    const error = new TypeError(`missing_monthly_identity:${identity}`);
    error.status = "insufficient_data";
    throw error;
  }
  const map = new Map();
  for (const row of rows) {
    const rowIdentity = identityForAsset(row);
    if (rowIdentity !== identity) throw new RangeError(`portfolio_identity_mismatch:${identity}:${rowIdentity || "blank"}`);
    const month = String(row?.month || "").slice(0, 7);
    if (map.has(month)) throw new RangeError(`same_calendar_month_duplicate:${identity}:${month}`);
    map.set(month, row);
  }
  return map;
}

function commonContiguousMonths(seriesMaps) {
  if (seriesMaps.length === 0) return [];
  const common = [...seriesMaps[0].keys()].filter((month) =>
    seriesMaps.every((map) => map.has(month))
  );
  return longestContiguousMonthSegment(common);
}

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildHistoryPath(availableMonths, investmentMonths) {
  if (!Number.isInteger(investmentMonths) || investmentMonths <= 0) return [];
  if (availableMonths.length < MINIMUM_SOURCE_HISTORY_MONTHS) {
    const error = new RangeError(
      `insufficient_data:minimum_${MINIMUM_SOURCE_HISTORY_MONTHS}_months_got_${availableMonths.length}`,
    );
    error.status = "insufficient_data";
    throw error;
  }
  const sourceMonths = availableMonths.length >= investmentMonths
    ? availableMonths.slice(-investmentMonths)
    : availableMonths;
  const pathMonths = Array.from(
    { length: investmentMonths },
    (_, index) => shiftMonth(availableMonths.at(-1), index - investmentMonths + 1),
  );
  return pathMonths.map((pathMonth, index) => ({
    pathMonth,
    sourceMonth: sourceMonths[index % sourceMonths.length],
  }));
}

function buildInputBase({ activePortfolio, assets, settings, monthlyReturns }) {
  const scenarioAssets = getStep4ScenarioAssets(assets);
  const artifactAssets = scenarioAssets.filter((asset) => !isManualCashAsset(asset));
  const identities = artifactAssets.map(identityForAsset);
  const lineagePolicy = {
    runtimeMode: monthlyReturns?.release
      ? "production_app_export_ready"
      : "internal_preview_review_only",
    monthlyRowContract: monthlyReturns?.monthlyRowContract || "proxy_aware_v2",
    legacyProductionBindingVerified: monthlyReturns?.legacyProductionBindingVerified === true,
    catalogPolicyByIdentity: monthlyReturns?.catalogPolicyByIdentity || null,
  };
  identities.forEach((identity) => {
    assertMonthlyScenarioLineage(
      identity,
      monthlyReturns?.rowsByIdentity?.[identity],
      lineagePolicy,
    );
  });
  const seriesMaps = identities.map((identity) =>
    rowMapForIdentity(identity, monthlyReturns?.rowsByIdentity?.[identity])
  );
  const investmentMonths = investmentMonthsForSettings(settings);
  const availableMonths = commonContiguousMonths(seriesMaps);
  const historyPath = buildHistoryPath(availableMonths, investmentMonths);
  const monthlyReturnMatrix = historyPath.flatMap(({ pathMonth, sourceMonth }) =>
    scenarioAssets.map((asset) => {
      const manualCash = isManualCashAsset(asset);
      const row = manualCash
        ? null
        : seriesMaps[identities.indexOf(identityForAsset(asset))]?.get(sourceMonth);
      return {
        month: pathMonth,
        sourceMonth,
        market: normalize(asset.market),
        ticker: normalize(asset.ticker),
        returnBasis: "price_return",
        currencyMode: "MIXED",
        baselineReturn: manualCash ? CASH_MONTHLY_RETURN : row?.priceReturn,
        sourceHash: row?.sourceHash || null,
      };
    })
  );

  return {
    portfolioId: activePortfolio?.id || "",
    assets: scenarioAssets.map((asset) => ({
      market: normalize(asset.market),
      ticker: normalize(asset.ticker),
      targetWeight: asset.targetWeight,
    })),
    settings: {
      initialInvestment: settings?.startValue,
      monthlyContribution: settings?.monthlyCashFlow,
      investmentMonths,
      inflationRateAnnual: percentToDecimal(settings?.inflationRate),
      rebalanceFrequency: settings?.rebalanceFrequency || "none",
    },
    baselineReturnMatrix: monthlyReturnMatrix,
    metadata: {
      returnBasis: "price_return",
      currencyMode: "MIXED",
      sourceHistoryMonths: availableMonths.length,
      pathMonths: historyPath.length,
      pathReplayApplied: availableMonths.length < investmentMonths,
      sourceDataStartMonth: availableMonths[0] || null,
      sourceDataEndMonth: availableMonths.at(-1) || null,
    },
    scenarioAssets,
  };
}

function inputForPreset(base, preset) {
  const shockMonth = Math.min(12, base.settings.investmentMonths);
  return {
    ...base,
    scenarioAssets: undefined,
    scenario: {
      scenarioId: preset.id,
      scenarioLabel: preset.label,
      shockMode: "market_beta",
      shockEvents: [{
        monthIndex: shockMonth,
        label: preset.label,
        marketFactorShock: preset.marketFactorShock,
      }],
      assetBetas: base.scenarioAssets.map((asset) => ({
        market: normalize(asset.market),
        ticker: normalize(asset.ticker),
        beta: asset.beta ?? asset.selectedBeta,
        ...(asset.betaProvenance ? { provenance: asset.betaProvenance } : {}),
      })),
    },
  };
}

function resultError(results) {
  return [...new Set(results.flatMap((result) => result?.dataQuality?.blockReasons || []))].join(" | ") || null;
}

export function buildStep5ProductionScenarioState({
  activePortfolio,
  assets = [],
  settings = {},
  monthlyReturns = null,
  monthlyArtifactIdentityFingerprint = "",
} = {}) {
  const currentFingerprint = getStep5MonthlyArtifactIdentityFingerprint(assets);
  if (monthlyArtifactIdentityFingerprint && monthlyArtifactIdentityFingerprint !== currentFingerprint) {
    return { result: null, results: [], status: "stale", error: "portfolio_identity_mismatch" };
  }

  let base;
  try {
    base = buildInputBase({ activePortfolio, assets, settings, monthlyReturns });
  } catch (error) {
    const reason = error?.code
      ? [error.code, error.identity, error.message].filter(Boolean).join(":")
      : error?.message;
    return {
      result: null,
      results: [],
      status: error?.status || "blocked",
      error: reason || "step5_input_adapter_error",
    };
  }

  const results = STEP5_PRODUCTION_SHOCK_PRESETS.map((preset) =>
    buildExternalShockScenario(inputForPreset(base, preset))
  );
  const ready = results.some((result) => result.status === "ready");
  const insufficient = results.every((result) => result.status === "insufficient_data");
  return {
    result: results[0] || null,
    results,
    status: ready ? "ready" : insufficient ? "insufficient_data" : "blocked",
    error: ready ? null : resultError(results),
  };
}

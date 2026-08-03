import { buildProbabilisticBootstrapScenario } from "../../../../server/src/services/scenario/probabilisticBootstrapEngine.js";
import {
  isManualCashAsset,
  MANUAL_CASH_TOTAL_RETURN_PERCENT,
} from "../../../data/tickers/manualCashAsset.js";
import { getStep4ScenarioAssets } from "./portfolioFormatters.js";
import {
  APP_EXPORT_SCENARIO_ERROR_CODES,
  AppExportScenarioPolicyError,
  assertMonthlyScenarioLineage,
} from "./monthlyScenarioLineagePolicy.js";

export {
  APP_EXPORT_SCENARIO_ERROR_CODES,
  AppExportScenarioPolicyError,
} from "./monthlyScenarioLineagePolicy.js";

const MANUAL_CASH_MONTHLY_RETURN =
  (1 + MANUAL_CASH_TOTAL_RETURN_PERCENT / 100) ** (1 / 12) - 1;

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
  return 0;
}

function normalizeWeights(assets) {
  const explicit = assets.map((asset) => Number(asset.targetWeight));
  const explicitTotal = explicit.reduce(
    (sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0),
    0,
  );
  if (explicitTotal > 0) {
    return explicit.map((value) => (Number.isFinite(value) && value > 0 ? value / explicitTotal : 0));
  }
  const values = assets.map(getAssetValue);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total > 0) return values.map((value) => value / total);
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

export function getAppExportScenarioErrorMessage(error) {
  switch (error?.code) {
    case APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN:
      return "프록시 월수익률이 포함된 자산은 확률분석을 제공할 수 없습니다.";
    case APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE:
      return "월수익률 출처 정보를 확인할 수 없어 확률분석을 제공할 수 없습니다.";
    case APP_EXPORT_SCENARIO_ERROR_CODES.IDENTITY_UNAVAILABLE:
      return "확률분석에 사용할 수 있는 월수익률이 없는 자산이 포함되어 있습니다.";
    default:
      return "확률분석 시나리오를 계산하지 못했습니다.";
  }
}

export async function resolveAppExportScenarioState({
  identities = [],
  loadMonthlyReturns,
  buildScenario,
  isCancelled = () => false,
} = {}) {
  let monthlyReturns;
  try {
    monthlyReturns = await loadMonthlyReturns(identities);
  } catch (error) {
    if (isCancelled()) return { status: "cancelled", result: null, error: null };
    const identityUnavailable =
      error?.code === APP_EXPORT_SCENARIO_ERROR_CODES.IDENTITY_UNAVAILABLE;
    return {
      status: "unavailable",
      result: null,
      error: getAppExportScenarioErrorMessage(error),
      errorCode: error?.code || null,
      failureDomain: identityUnavailable ? "identity_unavailable" : "scenario_loader",
      catalogFallbackEligible: false,
    };
  }

  if (isCancelled()) return { status: "cancelled", result: null, error: null };
  const missingIdentities = Array.isArray(monthlyReturns?.missingIdentities)
    ? monthlyReturns.missingIdentities
    : [];
  if (missingIdentities.length > 0) {
    return {
      status: "unavailable",
      result: null,
      error: getAppExportScenarioErrorMessage({
        code: APP_EXPORT_SCENARIO_ERROR_CODES.IDENTITY_UNAVAILABLE,
      }),
      errorCode: APP_EXPORT_SCENARIO_ERROR_CODES.IDENTITY_UNAVAILABLE,
      identity: missingIdentities.join(","),
      failureDomain: "identity_unavailable",
      catalogFallbackEligible: false,
    };
  }

  try {
    return {
      status: "ready",
      result: buildScenario(monthlyReturns),
      error: null,
      errorCode: null,
      failureDomain: null,
      catalogFallbackEligible: false,
    };
  } catch (error) {
    return {
      status: "unavailable",
      result: null,
      error: getAppExportScenarioErrorMessage(error),
      errorCode: error?.code || null,
      identity: error?.identity || null,
      failureDomain:
        error?.domain === "scenario_policy" ? "scenario_policy" : "scenario_execution",
      catalogFallbackEligible: false,
    };
  }
}

export function buildAppExportScenarioResult({
  activePortfolio = {},
  assets = [],
  settings = {},
  rowsByIdentity = {},
  manifest = {},
  release = null,
  runtimeMode = "internal_preview_review_only",
  monthlyRowContract = "proxy_aware_v2",
  legacyProductionBindingVerified = false,
  catalogPolicyByIdentity = null,
  simulationCount = 500,
  randomSeed = 1142,
} = {}) {
  const isProduction = runtimeMode === "production_app_export_ready" && Boolean(release);
  const activeAssets = getStep4ScenarioAssets(assets).filter((asset) => identityForAsset(asset));
  const unknownCash = activeAssets.find(
    (asset) => normalizeTicker(asset.ticker) === "CASH" && !isManualCashAsset(asset),
  );
  if (unknownCash) {
    throw new AppExportScenarioPolicyError({
      code: APP_EXPORT_SCENARIO_ERROR_CODES.IDENTITY_UNAVAILABLE,
      identity: identityForAsset(unknownCash),
    });
  }
  const artifactAssets = activeAssets.filter(
    (asset) => normalizeTicker(asset.ticker) !== "CASH",
  );
  const identities = artifactAssets.map(identityForAsset);
  identities.forEach((identity) => {
    assertMonthlyScenarioLineage(identity, rowsByIdentity[identity], {
      runtimeMode,
      monthlyRowContract,
      legacyProductionBindingVerified,
      catalogPolicyByIdentity,
    });
  });
  const weights = normalizeWeights(activeAssets);
  const configuredStartValue = Number(settings.startValue);
  const assetStartValue = activeAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0);
  const initialInvestment =
    Number.isFinite(configuredStartValue) && configuredStartValue > 0
      ? configuredStartValue
      : assetStartValue;
  const seriesByIdentity = new Map(identities.map((identity) => [
    identity,
    rowsByMonthForIdentity(rowsByIdentity[identity]),
  ]));
  const seriesMaps = [...seriesByIdentity.values()];
  const commonMonths = intersectMonths(seriesMaps);
  const contiguousMonths = longestContiguousMonthSegment(commonMonths);
  const manualCashCurrency =
    seriesMaps[0]?.get(contiguousMonths[0])?.currency || "KRW";
  const monthlyReturnMatrix = [];
  for (const month of contiguousMonths) {
    activeAssets.forEach((asset) => {
      const manualCash = normalizeTicker(asset.ticker) === "CASH";
      const row = manualCash ? null : seriesByIdentity.get(identityForAsset(asset)).get(month);
      monthlyReturnMatrix.push({
        month: row?.month || month,
        market: normalizeMarket(asset.market),
        ticker: normalizeTicker(asset.ticker),
        returnBasis: "price_return",
        currencyMode: row?.currency || manualCashCurrency,
        priceReturn: manualCash
          ? MANUAL_CASH_MONTHLY_RETURN
          : row.priceReturn,
        isProxy: manualCash ? false : row.isProxy,
        proxyTicker: manualCash ? "" : row.proxyTicker,
        sourceHash: manualCash ? null : manifest.sourceCandidatePackageHash,
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
    scenarioAssetWeights: activeAssets.map((asset, index) => ({
      identity: identityForAsset(asset),
      targetWeight: weights[index],
    })),
    ...(isProduction ? {} : { internalPreviewContext: {
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
    } }),
    ...(isProduction ? { productionAppExportContext: {
      reviewOnly: false,
      portfolioId: activePortfolio.id || "",
      portfolioName: activePortfolio.name || "",
      identities,
      universeVersion: release.universeVersion,
      releaseContractVersion: release.contractVersion,
      monthlyRowContract,
      legacyProductionBindingVerified,
      sourceAppExportSha256: release.sourceAppExportSha256,
      metricDataThroughMonth: release.metricDataThroughMonth,
      commonObservedMonthCount: commonMonths.length,
      contiguousObservedMonthCount: contiguousMonths.length,
      commonDataStartMonth: contiguousMonths[0] || null,
      commonDataEndMonth: contiguousMonths.at(-1) || null,
      gapsForwardFilled: false,
      productionPublishReady: true,
      appExportApproved: true,
      scenarioContextProviderEligible: false,
      providerPayloadExcluded: true,
    } } : {}),
    productionPublishReady: isProduction,
    appExportApproved: isProduction,
    scenarioContextProviderEligible: false,
  };
}

export function buildAppPreviewScenarioResult(options = {}) {
  return buildAppExportScenarioResult({
    ...options,
    runtimeMode: "internal_preview_review_only",
    release: null,
  });
}

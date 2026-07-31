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

const PROXY_STATUS_MARKER_PATTERN = /(?:^|[*:_\-\s])proxy(?:$|[*:_\-\s])/i;

export const APP_EXPORT_SCENARIO_ERROR_CODES = Object.freeze({
  PROXY_MONTHLY_RETURN: "unsupported_product_policy:proxy_monthly_return",
  MISSING_PROXY_LINEAGE: "missing_metric_lineage:monthly_return_proxy_status",
  IDENTITY_UNAVAILABLE: "production_monthly_identity_unavailable",
});

const APP_EXPORT_SCENARIO_POLICY_MESSAGES = Object.freeze({
  [APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN]:
    "Proxy-marked monthly-return rows are unavailable for scenario generation.",
  [APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE]:
    "Monthly-return proxy lineage is unavailable for scenario generation.",
});

export class AppExportScenarioPolicyError extends TypeError {
  constructor({ code, identity }) {
    super(APP_EXPORT_SCENARIO_POLICY_MESSAGES[code] || "Scenario policy rejected the input.");
    this.name = "AppExportScenarioPolicyError";
    this.code = code;
    this.identity = identity;
    this.domain = "scenario_policy";
    this.catalogFallbackEligible = false;
  }
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

function statusMarksProxy(value) {
  return typeof value === "string" && PROXY_STATUS_MARKER_PATTERN.test(value.trim());
}

function catalogAllowsLegacyIdentity(identity, catalogPolicyByIdentity) {
  if (
    !catalogPolicyByIdentity ||
    typeof catalogPolicyByIdentity !== "object" ||
    Array.isArray(catalogPolicyByIdentity) ||
    !Object.isFrozen(catalogPolicyByIdentity) ||
    !Object.prototype.hasOwnProperty.call(catalogPolicyByIdentity, identity)
  ) {
    return false;
  }
  const record = catalogPolicyByIdentity[identity];
  if (
    !record ||
    typeof record !== "object" ||
    !Object.isFrozen(record)
  ) {
    return false;
  }
  return (
    normalizeMarket(record.identity?.split(":", 1)[0]) ===
      normalizeMarket(identity.split(":", 1)[0]) &&
    normalizeTicker(record.identity?.split(":").slice(1).join(":")) ===
      normalizeTicker(identity.split(":").slice(1).join(":")) &&
    record.policyEvidenceValid === true &&
    record.ordinaryDistribution === true &&
    record.ordinaryLegacyEligible === true &&
    String(record.dataStatus || "").trim().toLowerCase() === "ready" &&
    String(record.metricsStatus || "").trim().toLowerCase() === "ready" &&
    String(record.reviewFlag || "").trim().toLowerCase() === "none" &&
    ["", "none"].includes(
      String(record.reviewApprovalStatus || "").trim().toLowerCase(),
    ) &&
    !String(record.reviewApprovalPolicyVersion || "").trim() &&
    !String(record.reviewPolicy || "").trim()
  );
}

function assertNonProxyMonthlyLineage(
  identity,
  rows = [],
  {
    runtimeMode = "internal_preview_review_only",
    monthlyRowContract = "proxy_aware_v2",
    legacyProductionBindingVerified = false,
    catalogPolicyByIdentity = null,
  } = {},
) {
  const lineageStates = new Set();
  for (const row of rows) {
    if (typeof row?.dataStatus !== "string") {
      throw new AppExportScenarioPolicyError({
        code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
        identity,
      });
    }
    const statusMarksMonthlyProxy = statusMarksProxy(row?.dataStatus);
    const legacyUnproven =
      row?.isProxy === null &&
      row?.proxyTicker === null &&
      row?.proxyLineageStatus === "legacy_unproven";
    lineageStates.add(legacyUnproven ? "legacy_unproven" : "proxy_aware");
    if (statusMarksMonthlyProxy ||
        row?.isProxy === true ||
        (typeof row?.proxyTicker === "string" && row.proxyTicker.trim())) {
      throw new AppExportScenarioPolicyError({
        code: APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN,
        identity,
      });
    }
    if (legacyUnproven) {
      const legacyAllowed =
        runtimeMode === "production_app_export_ready" &&
        monthlyRowContract === "legacy_v1" &&
        legacyProductionBindingVerified === true &&
        catalogAllowsLegacyIdentity(identity, catalogPolicyByIdentity);
      if (!legacyAllowed) {
        throw new AppExportScenarioPolicyError({
          code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
          identity,
        });
      }
      continue;
    }
    if (row?.isProxy !== false ||
        typeof row?.proxyTicker !== "string" ||
        row.proxyTicker.trim() ||
        row?.proxyLineageStatus === "legacy_unproven") {
      throw new AppExportScenarioPolicyError({
        code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
        identity,
      });
    }
  }
  if (lineageStates.size > 1) {
    throw new AppExportScenarioPolicyError({
      code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
      identity,
    });
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
  const activeAssets = (Array.isArray(assets) ? assets : [])
    .filter((asset) => identityForAsset(asset))
    .filter((asset) => normalizeTicker(asset.ticker) !== "CASH");
  const identities = activeAssets.map(identityForAsset);
  identities.forEach((identity) => {
    assertNonProxyMonthlyLineage(identity, rowsByIdentity[identity], {
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
  const seriesMaps = identities.map((identity) => rowsByMonthForIdentity(rowsByIdentity[identity]));
  const commonMonths = intersectMonths(seriesMaps);
  const contiguousMonths = longestContiguousMonthSegment(commonMonths);
  const monthlyReturnMatrix = [];
  for (const month of contiguousMonths) {
    activeAssets.forEach((asset, index) => {
      const row = seriesMaps[index].get(month);
      monthlyReturnMatrix.push({
        month: row.month,
        market: normalizeMarket(asset.market),
        ticker: normalizeTicker(asset.ticker),
        returnBasis: "price_return",
        currencyMode: row.currency,
        priceReturn: row.priceReturn,
        isProxy: row.isProxy,
        proxyTicker: row.proxyTicker,
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

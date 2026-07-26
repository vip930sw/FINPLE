import {
  isNonOrdinaryDistribution,
  resolveDistributionYieldFields,
} from "../../../data/tickers/distributionPolicy.js";

function normalizeNullableNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeMetricNumber(asset, field) {
  const fallback =
    asset?.internalPreviewReviewOnly === true ||
    asset?.productionAppExportEnabled === true
      ? null
      : 0;
  return normalizeNullableNumber(asset?.[field], fallback);
}

export function normalizePersistedMetricFields(asset = {}) {
  const sourceYield = isNonOrdinaryDistribution(asset)
    ? asset.trailingDistributionYield ?? asset.cashDistributionYieldTtm ?? asset.dividendYield
    : asset.dividendYield;
  const distributionFields = resolveDistributionYieldFields(
    asset,
    sourceYield,
    asset.displayDividendYield,
  );
  return {
    targetEvaluationAmount: normalizeNullableNumber(asset.targetEvaluationAmount, null),
    cagr: normalizeMetricNumber(asset, "cagr"),
    beta: normalizeMetricNumber(asset, "beta"),
    mdd: normalizeMetricNumber(asset, "mdd"),
    dividendYield: distributionFields.dividendYield,
    displayDividendYield: distributionFields.displayDividendYield,
    dividendPolicy: asset.dividendPolicy || "",
    dividendSource: asset.dividendSource || "",
    exposureType: asset.exposureType || "",
    distributionType: asset.distributionType || "unknown",
    distributionFrequency: asset.distributionFrequency || "unknown",
    trailingDistributionYield: distributionFields.trailingDistributionYield,
    cashDistributionYieldTtm: distributionFields.cashDistributionYieldTtm,
    distributionYieldPolicy: distributionFields.distributionYieldPolicy,
    distributionCalculationStatus: distributionFields.distributionCalculationStatus,
    reviewTag: asset.reviewTag || "",
    reviewReason: asset.reviewReason || "",
    priceCagr10y: normalizeNullableNumber(asset.priceCagr10y, null),
    rawPriceCagr10y: normalizeNullableNumber(asset.rawPriceCagr10y, null),
    rollingCagr10yMedian: normalizeNullableNumber(asset.rollingCagr10yMedian, null),
    rollingCagr10yP25: normalizeNullableNumber(asset.rollingCagr10yP25, null),
    rollingCagr10yP75: normalizeNullableNumber(asset.rollingCagr10yP75, null),
    validRollingWindowCount10y: normalizeNullableNumber(asset.validRollingWindowCount10y, null),
    selectedCagr: normalizeNullableNumber(asset.selectedCagr, null),
    cagrPolicy: asset.cagrPolicy || "",
    selectedBeta: normalizeNullableNumber(asset.selectedBeta, null),
    betaPolicy: asset.betaPolicy || "",
    selectedMdd: normalizeNullableNumber(asset.selectedMdd, null),
    mddPolicy: asset.mddPolicy || "",
    dividendStatus: asset.dividendStatus || "",
    dataStatus: asset.dataStatus || "",
    metricsStatus: asset.metricsStatus || "",
    reviewFlag: asset.reviewFlag || "",
    rawPriceCoverageStatus: asset.rawPriceCoverageStatus || "",
    priceUnavailable: asset.priceUnavailable === true,
    metricBaseDate: asset.metricBaseDate || "",
    metricDataThroughMonth: asset.metricDataThroughMonth || "",
    metricsSource: asset.metricsSource || "",
    sourceHash: asset.sourceHash || "",
    rawSourceSha256: asset.rawSourceSha256 || "",
    normalizationVersion: asset.normalizationVersion || "",
    normalizedSeriesHash: asset.normalizedSeriesHash || "",
    rollingMetricVersion: asset.rollingMetricVersion || "",
    pipelineVersion: asset.pipelineVersion || "",
    calculationPolicyVersion: asset.calculationPolicyVersion || "",
    overlayStatus: asset.overlayStatus || "",
    internalPreviewReviewOnly: asset.internalPreviewReviewOnly === true,
    previewLoaderEnabled: asset.previewLoaderEnabled === true,
    productionAppExportEnabled: asset.productionAppExportEnabled === true,
    productionReleaseContractVersion: asset.productionReleaseContractVersion || "",
    productionReleaseApprovedAt: asset.productionReleaseApprovedAt || "",
    productionReleaseApprovedBy: asset.productionReleaseApprovedBy || "",
    productionPublishReady:
      asset.productionPublishReady === undefined ? undefined : asset.productionPublishReady === true,
    appExportApproved:
      asset.appExportApproved === undefined ? undefined : asset.appExportApproved === true,
  };
}

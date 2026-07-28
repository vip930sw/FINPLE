const normalizeTicker = (ticker = "") =>
  String(ticker || "").trim().toUpperCase();
const normalizeMarket = (market = "") =>
  String(market || "US").trim().toUpperCase();

const IDENTITY_SCOPED_ASSET_METADATA_DEFAULTS = Object.freeze({
  displayTicker: "",
  providerSymbol: "",
  cagr: null,
  beta: null,
  mdd: null,
  dividendYield: null,
  displayDividendYield: "",
  dividendPolicy: "",
  dividendSource: "",
  exposureType: "",
  distributionType: "unknown",
  distributionFrequency: "unknown",
  trailingDistributionYield: null,
  cashDistributionYieldTtm: null,
  distributionYieldPolicy: "",
  distributionCalculationStatus: "",
  reviewTag: "",
  reviewReason: "",
  reviewApprovalPolicyVersion: "",
  reviewApprovalStatus: "",
  reviewApprovalReason: "",
  reviewApprovalAudit: null,
  underlyingTicker: "",
  leverageMultiple: null,
  direction: "",
  resetFrequency: "",
  inceptionDate: "",
  officialSourceUrl: "",
  sourceCheckedAt: "",
  sourceId: "",
  priceCagr10y: null,
  rawPriceCagr10y: null,
  rollingCagr10yMedian: null,
  rollingCagr10yP25: null,
  rollingCagr10yP75: null,
  validRollingWindowCount10y: null,
  selectedCagr: null,
  cagrPolicy: "",
  selectedBeta: null,
  betaPolicy: "",
  selectedMdd: null,
  mddPolicy: "",
  dividendStatus: "",
  dataStatus: "",
  metricsStatus: "",
  reviewFlag: "",
  rawPriceCoverageStatus: "",
  priceUnavailable: false,
  metricBaseDate: "",
  metricDataThroughMonth: "",
  metricsSource: "",
  sourceHash: "",
  rawSourceSha256: "",
  normalizationVersion: "",
  normalizedSeriesHash: "",
  rollingMetricVersion: "",
  pipelineVersion: "",
  calculationPolicyVersion: "",
  overlayStatus: "",
  internalPreviewReviewOnly: false,
  previewLoaderEnabled: false,
  productionAppExportEnabled: false,
  productionReleaseContractVersion: "",
  productionReleaseApprovedAt: "",
  productionReleaseApprovedBy: "",
  productionPublishReady: false,
  appExportApproved: false,
  proxyLineageStatus: "",
  isProxy: undefined,
  proxyTicker: undefined,
  metricMode: "manual",
  dataSource: "manual",
});

export const IDENTITY_SCOPED_ASSET_METADATA_FIELDS = Object.freeze([
  ...Object.keys(IDENTITY_SCOPED_ASSET_METADATA_DEFAULTS),
  "reviewApprovalReasonCodes",
]);

export function createPortfolioAssetIdentity(asset = {}) {
  return {
    market: normalizeMarket(asset?.market),
    ticker: normalizeTicker(asset?.ticker),
  };
}

export function hasPortfolioAssetIdentityChanged(
  previousAsset = {},
  nextAsset = {},
) {
  const previousIdentity = createPortfolioAssetIdentity(previousAsset);
  const nextIdentity = createPortfolioAssetIdentity(nextAsset);
  return (
    previousIdentity.market !== nextIdentity.market ||
    previousIdentity.ticker !== nextIdentity.ticker
  );
}

export function resetIdentityScopedAssetMetadata(asset = {}) {
  return {
    ...asset,
    ...IDENTITY_SCOPED_ASSET_METADATA_DEFAULTS,
    reviewApprovalReasonCodes: [],
  };
}

export function reconcileIdentityScopedAssetMetadata(
  asset = {},
  nextIdentity = {},
  metadataPatch = {},
) {
  const identityChanged = hasPortfolioAssetIdentityChanged(asset, nextIdentity);
  const baseAsset = identityChanged
    ? resetIdentityScopedAssetMetadata(asset)
    : asset;
  const definedMetadata = Object.fromEntries(
    Object.entries(metadataPatch).filter(([, value]) => value !== undefined),
  );
  return {
    ...baseAsset,
    ...definedMetadata,
  };
}

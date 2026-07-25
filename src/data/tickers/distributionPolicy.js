export const TRAILING_DISTRIBUTION_YIELD_POLICY =
  "trailing_12m_cash_distribution_not_ordinary_dividend";

const ORDINARY_DISTRIBUTION_TYPES = new Set([
  "ordinary_cash_dividend",
  "none",
  "unknown",
  "",
]);

const OPTION_DISTRIBUTION_EXPOSURE_TYPES = new Set([
  "single_stock_option_income",
  "single_stock_weekly_income",
  "index_covered_call",
  "index_covered_call_growth",
  "thematic_equity_premium_income",
  "broad_equity_premium_income",
]);

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function isNonOrdinaryDistribution(asset = {}) {
  const distributionType = String(asset.distributionType || "").trim().toLowerCase();
  const exposureType = String(asset.exposureType || "").trim().toLowerCase();
  return (
    !ORDINARY_DISTRIBUTION_TYPES.has(distributionType) ||
    OPTION_DISTRIBUTION_EXPOSURE_TYPES.has(exposureType)
  );
}

export function resolveDistributionYieldFields(
  asset = {},
  sourceYield = asset.dividendYield,
  sourceDisplayYield = asset.displayDividendYield,
) {
  const numericYield = toNullableNumber(sourceYield);
  if (!isNonOrdinaryDistribution(asset)) {
    return {
      dividendYield: numericYield,
      displayDividendYield:
        sourceDisplayYield ||
        (numericYield === null ? "" : `${numericYield.toFixed(2)}%`),
      trailingDistributionYield: toNullableNumber(asset.trailingDistributionYield),
      cashDistributionYieldTtm: toNullableNumber(asset.cashDistributionYieldTtm),
      distributionYieldPolicy: asset.distributionYieldPolicy || "",
      distributionCalculationStatus: asset.distributionCalculationStatus || "",
    };
  }

  return {
    dividendYield: null,
    displayDividendYield: "",
    trailingDistributionYield:
      toNullableNumber(asset.trailingDistributionYield) ?? numericYield,
    cashDistributionYieldTtm:
      toNullableNumber(asset.cashDistributionYieldTtm) ?? numericYield,
    distributionYieldPolicy:
      asset.distributionYieldPolicy || TRAILING_DISTRIBUTION_YIELD_POLICY,
    distributionCalculationStatus: "review_only_no_approved_reinvestment_model",
  };
}

export function getDistributionFrequencyLabel(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return {
    weekly: "주간",
    monthly: "월간",
    quarterly: "분기",
    annual: "연간",
    variable: "변동",
    unknown: "주기 확인 필요",
  }[normalized] || "주기 확인 필요";
}

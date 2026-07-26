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

function normalizeDividendState(value) {
  return String(value || "").trim().toLowerCase();
}

function isCashDisplayAsset(asset = {}) {
  return (
    normalizeDividendState(asset.ticker) === "cash" ||
    normalizeDividendState(asset.market) === "cash"
  );
}

export function isNonOrdinaryDistribution(asset = {}) {
  const distributionType = String(asset.distributionType || "").trim().toLowerCase();
  const exposureType = String(asset.exposureType || "").trim().toLowerCase();
  return (
    !ORDINARY_DISTRIBUTION_TYPES.has(distributionType) ||
    OPTION_DISTRIBUTION_EXPOSURE_TYPES.has(exposureType)
  );
}

export function resolveDividendYieldDisplay(asset = {}) {
  if (isNonOrdinaryDistribution(asset)) {
    return { kind: "non_ordinary", text: null };
  }

  const dividendStatus = normalizeDividendState(asset.dividendStatus);
  const dividendPolicy = normalizeDividendState(asset.dividendPolicy);
  const reviewTag = normalizeDividendState(asset.reviewTag);
  const reviewFlag = normalizeDividendState(asset.reviewFlag);
  const displayValue = String(asset.displayDividendYield || "").trim();
  const numericYield = toNullableNumber(asset.dividendYield);

  if (dividendStatus === "confirmed_zero") {
    return { kind: "confirmed_zero", text: "0.00%" };
  }

  if (
    dividendStatus === "review_required" ||
    dividendPolicy === "review_required" ||
    reviewTag === "review_required" ||
    reviewFlag === "review_required"
  ) {
    return { kind: "review_required", text: "확인 필요" };
  }

  if (isCashDisplayAsset(asset)) {
    if (displayValue && displayValue !== "0.00%") {
      return { kind: "cash", text: displayValue };
    }
    if (dividendPolicy === "no_dividend" || numericYield === 0) {
      return { kind: "cash", text: "-" };
    }
    if (numericYield !== null && numericYield > 0) {
      return { kind: "cash", text: `${numericYield.toFixed(2)}%` };
    }
    return { kind: "cash", text: "확인 중" };
  }

  if (["missing", "unconfirmed", "pending", "unknown"].includes(dividendStatus)) {
    return { kind: "missing", text: "확인 중" };
  }

  if (dividendPolicy === "no_dividend") {
    return { kind: "no_dividend", text: "-" };
  }

  if (numericYield !== null && numericYield > 0) {
    return {
      kind: dividendStatus === "confirmed_value" ? "confirmed_value" : "legacy_value",
      text: `${numericYield.toFixed(2)}%`,
    };
  }

  return { kind: "missing", text: "확인 중" };
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

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
    normalizeDividendState(asset.distributionDataQualityStatus) ===
      "provider_event_error" ||
    !ORDINARY_DISTRIBUTION_TYPES.has(distributionType) ||
    OPTION_DISTRIBUTION_EXPOSURE_TYPES.has(exposureType)
  );
}

export function resolveDistributionDisplayPolicy(asset = {}) {
  asset = asset || {};
  const status = normalizeDividendState(asset.distributionDataQualityStatus);
  const type = normalizeDividendState(asset.distributionType);
  if (status === "provider_event_error") {
    return {
      kind: "provider_error",
      title: "분배 데이터 확인 필요",
      notices: ["공급자 현금 이벤트 기준 불일치", "시뮬레이션 재투자 제외"],
    };
  }
  if (type === "special_or_liquidating_distribution") {
    return {
      kind: "special",
      title: "특별·청산 분배",
      notices: ["자산매각·청산 관련 지급", "반복 지급 아님", "시뮬레이션 재투자 제외"],
    };
  }
  if (type === "futures_mixed_distribution") {
    return {
      kind: "futures",
      title: "선물·파생 분배",
      notices: ["자본이득 포함 가능", "롤오버 영향", "분배율 변동 가능"],
    };
  }
  if (isNonOrdinaryDistribution(asset)) {
    return {
      kind: "mixed",
      title: "옵션분배",
      notices: ["ROC(원금환급) 포함 가능", "분배율 변동 가능"],
    };
  }
  return { kind: "ordinary", title: "일반 배당", notices: [] };
}

export function resolvePortfolioCashFlowDisplayPolicy(assets = []) {
  const kinds = (assets || []).map((asset) => resolveDistributionDisplayPolicy(asset).kind);
  const hasOrdinary = kinds.includes("ordinary");
  const hasNonOrdinary = kinds.some((kind) => kind !== "ordinary");
  if (hasOrdinary && !hasNonOrdinary) {
    return {
      kind: "dividend",
      yieldLabel: "예상 배당률",
      annualLabel: "예상 연배당금",
      rankLabel: "배당 순위",
      focusLabel: "배당",
    };
  }
  if (!hasOrdinary && hasNonOrdinary) {
    return {
      kind: "cash_distribution",
      yieldLabel: "시뮬레이션 적용 현금분배율",
      annualLabel: "예상 연간 현금분배금",
      rankLabel: "현금흐름 순위",
      focusLabel: "현금흐름",
    };
  }
  return {
    kind: "cash_flow",
    yieldLabel: "예상 현금수익률",
    annualLabel: "예상 연간 현금지급액",
    rankLabel: "현금흐름 순위",
    focusLabel: "현금흐름",
  };
}

export function resolveDividendYieldDisplay(asset = {}) {
  if (isNonOrdinaryDistribution(asset)) {
    return { kind: "non_ordinary", text: null };
  }

  const dividendStatus = normalizeDividendState(asset.dividendStatus);
  const dividendPolicy = normalizeDividendState(asset.dividendPolicy);
  const displayValue = String(asset.displayDividendYield || "").trim();
  const numericYield = toNullableNumber(asset.dividendYield);

  if (dividendStatus === "confirmed_zero") {
    return { kind: "confirmed_zero", text: "0.00%" };
  }

  if (
    dividendStatus === "review_required" ||
    dividendPolicy === "review_required"
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

  if (dividendStatus === "confirmed_value" && numericYield !== null && numericYield > 0) {
    return {
      kind: "confirmed_value",
      text: `${numericYield.toFixed(2)}%`,
    };
  }

  if (dividendStatus === "confirmed_value") {
    return { kind: "missing", text: "확인 중" };
  }

  if (dividendPolicy === "no_dividend") {
    return { kind: "no_dividend", text: "-" };
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
      reinvestmentCashYield: toNullableNumber(asset.reinvestmentCashYield),
      simulationCashYield:
        toNullableNumber(asset.simulationCashYield) ?? numericYield,
      distributionSimulationPolicy:
        asset.distributionSimulationPolicy || "ordinary_cash_dividend",
    };
  }

  const cashYield =
    toNullableNumber(asset.cashDistributionYieldTtm) ??
    toNullableNumber(asset.trailingDistributionYield) ??
    numericYield;
  const simulationExcluded =
    normalizeDividendState(asset.distributionDataQualityStatus) === "provider_event_error" ||
    normalizeDividendState(asset.distributionType) === "special_or_liquidating_distribution";
  return {
    dividendYield: null,
    displayDividendYield: "",
    trailingDistributionYield:
      toNullableNumber(asset.trailingDistributionYield) ?? cashYield,
    cashDistributionYieldTtm: cashYield,
    distributionYieldPolicy:
      asset.distributionYieldPolicy || TRAILING_DISTRIBUTION_YIELD_POLICY,
    distributionCalculationStatus:
      asset.distributionCalculationStatus ||
      "review_only_no_approved_reinvestment_model",
    reinvestmentCashYield:
      simulationExcluded
        ? 0
        : toNullableNumber(asset.reinvestmentCashYield) ?? cashYield,
    simulationCashYield:
      simulationExcluded
        ? 0
        : toNullableNumber(asset.simulationCashYield) ??
          toNullableNumber(asset.reinvestmentCashYield) ??
          cashYield,
    distributionSimulationPolicy:
      asset.distributionSimulationPolicy || "repeat_ttm_distribution",
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

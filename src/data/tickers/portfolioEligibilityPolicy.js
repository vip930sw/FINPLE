const LEVERAGED_EXPOSURE_MARKERS = ["leveraged", "inverse"];

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isLeveragedOrInverse(asset = {}) {
  const exposure = String(asset.exposureType || "").toLowerCase();
  const direction = String(asset.direction || "").toLowerCase();
  const leverage = Math.abs(finiteNumber(asset.leverageMultiple) || 0);
  return (
    LEVERAGED_EXPOSURE_MARKERS.some((marker) => exposure.includes(marker)) ||
    direction === "inverse" ||
    leverage >= 2
  );
}

function warningCodes(asset = {}) {
  const explicit = Array.isArray(asset.portfolioWarningCodes)
    ? asset.portfolioWarningCodes
    : String(asset.portfolioWarningCodes || "").split("|");
  const codes = explicit.map((code) => code.trim()).filter(Boolean);
  if (codes.length || !isLeveragedOrInverse(asset)) return codes;
  return ["leveraged_or_inverse_exposure"];
}

export function getPortfolioAddDecision(asset = {}) {
  const explicitPolicy = String(asset.portfolioAddPolicy || "").toLowerCase();
  const usableYears = finiteNumber(asset.usablePriceHistoryYears);
  const rollingYears = finiteNumber(asset.rollingCagrWindowYears);
  const minimumYears = finiteNumber(asset.minimumPortfolioHistoryYears) ?? 3;
  const insufficientPriceHistory = usableYears !== null && usableYears < minimumYears;
  const insufficientRollingHistory = rollingYears !== null && rollingYears < minimumYears;
  const shortHistory = insufficientPriceHistory || insufficientRollingHistory;
  const status = String(asset.portfolioEligibilityStatus || "").toLowerCase();
  const afterDate = String(asset.portfolioEligibleAfterDate || "");
  const ticker = String(asset.ticker || "이 자산").toUpperCase();
  const warnings = warningCodes(asset);
  const denyReason =
    (asset.active === false || String(asset.listingStatus || "").toLowerCase() === "inactive"
      ? "inactive"
      : asset.includeInSimulator === false
        ? "excluded_by_operator"
        : asset.priceUnavailable === true
          ? "provider_data_unavailable"
          : ["inactive", "excluded_by_operator", "provider_data_unavailable"].includes(status)
            ? status
            : shortHistory || status === "insufficient_long_horizon_history"
              ? insufficientPriceHistory && insufficientRollingHistory
                ? "insufficient_price_and_rolling_history"
                : insufficientRollingHistory
                  ? "insufficient_rolling_window_history"
                  : insufficientPriceHistory
                    ? "insufficient_usable_price_history"
                    : "insufficient_long_horizon_history"
              : "");

  if (
    explicitPolicy === "deny" ||
    asset.portfolioEligible === false ||
    Boolean(denyReason)
  ) {
    const reasonCode = denyReason || "portfolio_add_denied";
    const historyMessage = reasonCode === "insufficient_usable_price_history"
      ? `가격 이력 ${usableYears.toFixed(1)}년, 최소 ${minimumYears}년 필요`
      : reasonCode === "insufficient_rolling_window_history"
        ? `장기 RM 표본 부족, 적용 RM ${rollingYears.toFixed(0)}년, 최소 ${minimumYears}년 필요`
        : reasonCode === "insufficient_price_and_rolling_history"
          ? `가격 이력 ${usableYears.toFixed(1)}년 및 적용 RM ${rollingYears.toFixed(0)}년, 최소 ${minimumYears}년 필요`
          : "장기 이력 확인 필요";
    const availabilityText = afterDate
      ? `${afterDate} 이후 다시 확인해 주세요.`
      : "충분한 가격 이력이 확보된 이후 사용할 수 있습니다.";
    return {
      policy: "deny",
      reasonCode,
      title: "포트폴리오에 추가할 수 없습니다",
      message: reasonCode.startsWith("insufficient_") && reasonCode.endsWith("_history")
        ? `${ticker}: ${historyMessage}. 신뢰도 낮음, 포트폴리오 이용 불가. ${availabilityText}`
        : `${ticker}는 현재 포트폴리오에 추가할 수 없습니다.`,
      eligibleAfterDate: afterDate,
      usablePriceHistoryYears: usableYears,
      rollingCagrWindowYears: rollingYears,
      minimumPortfolioHistoryYears: minimumYears,
      warningCodes: warnings,
    };
  }

  if (
    asset.portfolioRiskConfirmed !== true &&
    (explicitPolicy === "confirm" || isLeveragedOrInverse(asset))
  ) {
    return {
      policy: "confirm",
      reasonCode: "leveraged_or_inverse_risk",
      title: "레버리지·인버스 상품 위험 확인",
      message: `${ticker}는 일일 수익률을 배수 또는 역방향으로 추종하므로 장기 성과가 단순 배수와 다를 수 있습니다. 위험을 확인한 뒤 추가하세요.`,
      eligibleAfterDate: "",
      usablePriceHistoryYears: usableYears,
      rollingCagrWindowYears: rollingYears,
      minimumPortfolioHistoryYears: minimumYears,
      warningCodes: warnings,
    };
  }

  return {
    policy: "allow",
    reasonCode: "",
    title: "",
    message: "",
    eligibleAfterDate: "",
    usablePriceHistoryYears: usableYears,
    rollingCagrWindowYears: rollingYears,
    minimumPortfolioHistoryYears: minimumYears,
    warningCodes: warnings,
  };
}

export { isLeveragedOrInverse };

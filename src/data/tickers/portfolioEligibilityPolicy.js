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
  const shortHistory =
    (usableYears !== null && usableYears < 3) ||
    (rollingYears !== null && rollingYears < 3);
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
              ? "insufficient_long_horizon_history"
              : "");

  if (
    explicitPolicy === "deny" ||
    asset.portfolioEligible === false ||
    Boolean(denyReason)
  ) {
    const reasonCode = denyReason || "portfolio_add_denied";
    const historyText = usableYears === null ? "" : `${usableYears.toFixed(1)}년`;
    const availabilityText = afterDate
      ? `${afterDate} 이후 다시 확인해 주세요.`
      : "충분한 가격 이력이 확보된 이후 사용할 수 있습니다.";
    return {
      policy: "deny",
      reasonCode,
      title: "포트폴리오에 추가할 수 없습니다",
      message: reasonCode === "insufficient_long_horizon_history"
        ? `${ticker}는 유효한 가격 이력이 ${historyText || "3년 미만"}으로 장기 기대수익을 추정하는 데 필요한 최소 3년을 충족하지 못했습니다. 지표 조회와 스크리너 비교는 가능하지만 현재 포트폴리오 계산에는 사용할 수 없습니다. ${availabilityText}`
        : `${ticker}는 현재 포트폴리오에 추가할 수 없습니다.`,
      eligibleAfterDate: afterDate,
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
      warningCodes: warnings,
    };
  }

  return {
    policy: "allow",
    reasonCode: "",
    title: "",
    message: "",
    eligibleAfterDate: "",
    warningCodes: warnings,
  };
}

export { isLeveragedOrInverse };

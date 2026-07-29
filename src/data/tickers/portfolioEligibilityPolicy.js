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

const TIER_COPY = Object.freeze({
  1: {
    label: "주의 요함",
    scope: "광범위 지수",
    message:
      "광범위한 시장지수의 일일 수익률을 배수로 추종합니다. 분산효과는 있지만 일일 재설정과 변동성 누적으로 장기 성과가 지수 누적수익률의 단순 배수와 달라질 수 있습니다.",
  },
  2: {
    label: "주의 필요",
    scope: "집중 지수",
    message:
      "특정 섹터·테마 또는 소수 대형종목 비중이 높은 지수의 일일 수익률을 배수로 추종합니다. 특정 산업과 종목에 대한 집중위험을 확인하세요.",
  },
  3: {
    label: "장기보유를 권장하지 않음",
    scope: "단일종목 집중",
    message:
      "단일 기업의 일일 가격변동을 확대하며 지수형 ETF의 분산효과가 없습니다. 기초종목의 급락 때 짧은 기간에도 매우 큰 원금 손실이 발생할 수 있습니다.",
  },
  4: {
    label: "장기투자에 적절하지 않음",
    scope: "인버스",
    message:
      "기초자산의 일일 하락 방향 수익을 목표로 하는 인버스 상품입니다. FINPLE의 장기 포트폴리오 목적에는 적합하지 않으며 장기보유를 권장하지 않습니다.",
  },
});

function dailyMultipleLabel(asset = {}) {
  const leverage = finiteNumber(asset.leverageMultiple);
  if (String(asset.resetFrequency || "").toLowerCase() !== "daily" || leverage === null) {
    return "";
  }
  return `일일 ${leverage > 0 ? "+" : ""}${leverage}X`;
}

export function resolveLeverageRiskProfile(asset = {}) {
  const status = String(asset.metadataVerificationStatus || "").toLowerCase();
  if (status === "pending_official_source") {
    return {
      kind: "pending",
      tier: "pending",
      label: asset.leverageWarningLabelKo || "상품 구조 확인 필요",
      confirmationMode: "strong",
      badges: ["공식 메타데이터 검증 중", "확인 후 추가"],
      message:
        "상품명과 공개 정보상 레버리지·인버스 구조일 가능성이 있으나 공식 메타데이터 검증이 완료되지 않았습니다. 상품 구조와 장기보유 위험을 확인한 후 추가하세요.",
    };
  }
  const tier = Number(asset.leverageRiskTier);
  if (status === "verified" && TIER_COPY[tier]) {
    const base = TIER_COPY[tier];
    const scope = tier === 2 && ["sector_index", "thematic_index"].includes(asset.exposureScope)
      ? "섹터 집중"
      : base.scope;
    const multiple = dailyMultipleLabel(asset);
    const stronger = Math.abs(finiteNumber(asset.leverageMultiple) || 0) >= 3
      ? " 3배 일일 목표로 높은 변동성과 대규모 손실 가능성이 더 큽니다."
      : "";
    return {
      kind: "verified",
      tier: String(tier),
      label: asset.leverageWarningLabelKo || base.label,
      confirmationMode: asset.confirmationMode || (tier >= 3 ? "strong" : "standard"),
      badges: [scope, multiple, tier === 4 ? "장기보유 부적합" : ""].filter(Boolean),
      message: `${base.message}${stronger}`,
    };
  }
  if (!isLeveragedOrInverse(asset)) return null;
  return {
    kind: "legacy",
    tier: "",
    label: "레버리지·인버스 위험 확인",
    confirmationMode: "standard",
    badges: [
      dailyMultipleLabel(asset),
      String(asset.direction || "").toLowerCase() === "inverse" ? "인버스" : "",
      "장기보유 주의",
      "극단 변동성",
    ].filter(Boolean),
    message:
      "일일 수익률을 배수 또는 역방향으로 추종하므로 장기 성과가 단순 배수와 달라질 수 있습니다.",
  };
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
  const riskProfile = resolveLeverageRiskProfile(asset);
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
      : reasonCode === "insufficient_rolling_window_history"
        ? "충분한 장기 RM 표본이 확보된 이후 사용할 수 있습니다."
        : reasonCode === "insufficient_price_and_rolling_history"
          ? "가격 이력과 장기 RM 표본이 모두 확보된 이후 사용할 수 있습니다."
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
      riskProfile,
    };
  }

  if (
    asset.portfolioRiskConfirmed !== true &&
    (explicitPolicy === "confirm" || riskProfile)
  ) {
    return {
      policy: "confirm",
      reasonCode: riskProfile?.kind === "pending"
        ? "leverage_metadata_verification_pending"
        : riskProfile?.tier
          ? `leverage_risk_tier_${riskProfile.tier}`
          : "leveraged_or_inverse_risk",
      title: riskProfile?.label || "레버리지·인버스 상품 위험 확인",
      message: `${ticker}: ${riskProfile?.message || "상품 구조와 장기보유 위험을 확인한 후 추가하세요."}`,
      eligibleAfterDate: "",
      usablePriceHistoryYears: usableYears,
      rollingCagrWindowYears: rollingYears,
      minimumPortfolioHistoryYears: minimumYears,
      warningCodes: warnings,
      riskProfile,
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
    riskProfile,
  };
}

export { isLeveragedOrInverse };

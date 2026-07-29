const LEVERAGED_EXPOSURE_MARKERS = ["leveraged", "inverse"];

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function resetFrequencyLabel(value) {
  const frequency = String(value || "").trim();
  return {
    daily: "일일",
    weekly: "주간",
    monthly: "월간",
    quarterly: "분기",
    annual: "연간",
  }[frequency.toLowerCase()] || frequency;
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
      "단일종목보다 분산되어 있지만 특정 산업·대형종목에 집중된 지수의 일일 수익률을 배수로 추종합니다. 집중위험을 확인하세요.",
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

const SEVERITY_LABELS = Object.freeze({
  caution: "위험강도 주의",
  high: "위험강도 높음",
  critical: "위험강도 매우 높음",
});

const NON_EQUITY_COPY = Object.freeze({
  currency_futures: {
    scope: "통화선물",
    message:
      "통화선물의 일일 수익률을 배수로 추종합니다. 일일 재설정, 선물 롤오버와 경로의존성 때문에 장기 성과가 단순 배수와 달라질 수 있습니다.",
  },
  sovereign_bond_futures: {
    scope: "국채선물",
    message:
      "국채선물의 일일 금리·듀레이션 움직임을 배수로 추종합니다. 일일 재설정, 장기채 금리민감도, 선물 롤오버와 경로의존성을 확인하세요.",
  },
  commodity_futures: {
    scope: "원자재선물",
    message:
      "단일 원자재선물의 일일 수익률을 배수로 추종합니다. 높은 변동성, 만기교체·롤오버, 경로의존성과 현물가격 대비 장기 성과 차이를 확인하세요.",
  },
  commodity_asset: {
    scope: "단일 원자재",
    message:
      "단일 원자재 노출의 일일 수익률을 배수로 추종합니다. 높은 변동성, 일일 재설정과 경로의존성으로 장기 성과가 단순 배수와 달라질 수 있습니다.",
  },
  crypto_asset: {
    scope: "단일 암호자산",
    message:
      "단일 암호자산의 일일 수익률을 배수로 추종합니다. 24시간 시장의 높은 변동성, 일일 재설정과 경로의존성으로 큰 손실이 발생할 수 있습니다.",
  },
  corporate_bond_index: {
    scope: "회사채 지수",
    message:
      "회사채 지수의 일일 수익률을 배수로 추종합니다. 신용스프레드·부도·유동성 위험, 일일 재설정과 경로의존성을 확인하세요.",
  },
});

function resetMultipleLabel(asset = {}) {
  const reset = resetFrequencyLabel(asset.resetFrequency);
  const leverage = finiteNumber(asset.leverageMultiple);
  if (!reset || leverage === null) {
    return "";
  }
  return `${reset} ${leverage > 0 ? "+" : ""}${leverage}X`;
}

export function resolveLeverageRiskProfile(asset = {}) {
  const status = String(asset.metadataVerificationStatus || "").toLowerCase();
  if (status === "rejected") return null;
  if (status === "pending_official_source") {
    const severity = asset.portfolioWarningSeverity || "high";
    return {
      kind: "pending",
      tier: "pending",
      label: asset.leverageWarningLabelKo || "상품 구조 확인 필요",
      confirmationMode: "strong",
      severity,
      longTermSuitability: asset.longTermSuitability || "pending",
      exposureScope: asset.exposureScope || "unresolved_scope",
      badges: [
        "공식 메타데이터 검증 중",
        SEVERITY_LABELS[severity],
        "확인 후 추가",
      ].filter(Boolean),
      message:
        "상품명과 공개 정보상 레버리지·인버스 구조일 가능성이 있으나 공식 메타데이터 검증이 완료되지 않았습니다. 상품 구조와 장기보유 위험을 확인한 후 추가하세요.",
    };
  }
  const tier = Number(asset.leverageRiskTier);
  if (status === "verified" && TIER_COPY[tier]) {
    const sectorOrTheme = tier === 2
      && ["sector_index", "thematic_index"].includes(asset.exposureScope);
    const nonEquityCopy = tier === 2
      ? NON_EQUITY_COPY[asset.exposureScope]
      : "";
    const base = nonEquityCopy
      ? {
          label: "높은 주의 필요",
          ...nonEquityCopy,
        }
      : sectorOrTheme
      ? {
          label: "높은 주의 필요",
          scope: "섹터·테마 집중",
          message:
            "동일 산업·테마 위험요인에 집중된 지수의 일일 수익률을 배수로 추종합니다. 실질 분산효과가 제한될 수 있으므로 높은 주의가 필요합니다.",
        }
      : TIER_COPY[tier];
    const severity = asset.portfolioWarningSeverity
      || (tier === 1 ? "caution" : tier === 4 ? "critical" : "high");
    const reset = resetFrequencyLabel(asset.resetFrequency) || "설정 주기";
    const multiple = resetMultipleLabel(asset);
    const stronger = Math.abs(finiteNumber(asset.leverageMultiple) || 0) >= 3
      ? " 높은 배수로 변동성과 대규모 손실 가능성이 더 큽니다."
      : "";
    const isEtn = String(asset.exposureType || "").toLowerCase().includes("_etn");
    const etnCreditRisk = isEtn
      ? " ETN은 발행사 신용위험이 있으며 발행사의 상환능력에 따라 손실이 발생할 수 있습니다."
      : "";
    return {
      kind: "verified",
      tier: String(tier),
      label: tier === 2 ? base.label : asset.leverageWarningLabelKo || base.label,
      confirmationMode: asset.confirmationMode || (tier >= 3 ? "strong" : "standard"),
      severity,
      longTermSuitability: asset.longTermSuitability || "",
      exposureScope: asset.exposureScope || "",
      badges: [
        base.scope,
        multiple,
        isEtn ? "ETN 발행사 신용위험" : "",
        SEVERITY_LABELS[severity],
        tier === 4 ? "장기보유 부적합" : "",
      ].filter(Boolean),
      message: `${base.message.replaceAll("일일", reset)}${stronger}${etnCreditRisk}`,
    };
  }
  if (!isLeveragedOrInverse(asset)) return null;
  const severity = asset.portfolioWarningSeverity || "high";
  return {
    kind: "legacy",
    tier: "",
    label: "레버리지·인버스 위험 확인",
    confirmationMode: "standard",
    severity,
    longTermSuitability: asset.longTermSuitability || "caution",
    exposureScope: asset.exposureScope || "",
    badges: [
      resetMultipleLabel(asset),
      String(asset.direction || "").toLowerCase() === "inverse" ? "인버스" : "",
      SEVERITY_LABELS[severity],
      "장기보유 주의",
      "극단 변동성",
    ].filter(Boolean),
    message:
      `${resetFrequencyLabel(asset.resetFrequency) || "설정 주기"} 수익률을 배수 또는 역방향으로 추종하므로 장기 성과가 단순 배수와 달라질 수 있습니다.`,
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

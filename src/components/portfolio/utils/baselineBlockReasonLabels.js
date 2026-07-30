const USER_FACING_BLOCK_REASON_LABELS = Object.freeze({
  canonical_catalog_load_error:
    "최신 자산 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  unsupported_metric_status: "승인된 지표 상태를 확인할 수 없습니다.",
  invalid_production_metric_approval: "승인된 지표 상태를 확인할 수 없습니다.",
  unsupported_distribution_calculation_policy:
    "이 상품의 분배금은 일반 배당 재투자 방식으로 계산할 수 없습니다.",
  missing_metric_lineage: "지표 출처 정보가 부족합니다.",
  portfolio_add_denied: "포트폴리오에 사용할 수 없는 자산이 포함되어 있습니다.",
  missing_cash_yield_for_reinvestment:
    "분배금 재투자에 필요한 현금수익률 데이터가 없습니다.",
});

function getReasonDetail(reason = "") {
  const separator = String(reason || "").indexOf(":");
  return separator < 0 ? "" : String(reason).slice(separator + 1).trim();
}

function getReasonTicker(reason = "") {
  return getReasonDetail(reason).split(".", 1)[0].trim() || "자산";
}

export function getBaselineBlockReasonCode(reason = "") {
  return String(reason || "").split(":", 1)[0].trim();
}

export function formatUserFacingBaselineBlockReason(reason = "") {
  const code = getBaselineBlockReasonCode(reason);
  const ticker = getReasonTicker(reason);
  if (code === "asset_review_policy_pending") {
    const detail = getReasonDetail(reason);
    if (detail.includes("leveraged-inverse-review-policy")) {
      return `${ticker}: 레버리지·인버스 ETF 지표 검토가 완료되지 않았습니다.`;
    }
    if (detail.includes("initial-history-gap-review-policy")) {
      return `${ticker}: 초기 월수익률 결측 구간 검토가 필요합니다.`;
    }
    return `${ticker}: 자산 지표 검토가 완료되지 않았습니다.`;
  }
  if (code === "asset_baseline_contract_missing") {
    return `${ticker}: 승인된 baseline 계산 정책이 없습니다.`;
  }
  if (code === "portfolio_add_denied") {
    return `${ticker}: 포트폴리오에 사용할 수 없는 자산입니다.`;
  }
  return USER_FACING_BLOCK_REASON_LABELS[code] || "지표 계산 계약을 확인할 수 없습니다.";
}

export function formatUserFacingBaselineBlockReasons(reasons = []) {
  const rawReasons = Array.isArray(reasons) ? reasons : [];
  const specificTickers = new Set(
    rawReasons
      .filter((reason) => ["asset_review_policy_pending", "asset_baseline_contract_missing"]
        .includes(getBaselineBlockReasonCode(reason)))
      .map(getReasonTicker),
  );
  const labels = rawReasons
    .filter((reason) => {
      if (getBaselineBlockReasonCode(reason) !== "unsupported_metric_status") return true;
      return !specificTickers.has(getReasonTicker(reason));
    })
    .map(formatUserFacingBaselineBlockReason);
  return [...new Set(labels)];
}

function formatYears(value, digits = 1) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(digits) : "-";
}

export function formatPortfolioEligibilityBlock(block = {}) {
  const identity = [block.market, block.ticker].filter(Boolean).join(":") || "자산";
  const minimum = formatYears(block.minimumPortfolioHistoryYears, 0);
  const after = block.portfolioEligibleAfterDate
    ? ` ${block.portfolioEligibleAfterDate} 이후 다시 확인할 수 있습니다.`
    : "";
  const detail = block.reasonCode === "insufficient_usable_price_history"
    ? `가격 이력 ${formatYears(block.usablePriceHistoryYears)}년, 최소 ${minimum}년 필요`
    : block.reasonCode === "insufficient_rolling_window_history"
      ? `장기 RM 표본 부족, 적용 RM ${formatYears(block.rollingCagrWindowYears, 0)}년, 최소 ${minimum}년 필요`
      : block.reasonCode === "insufficient_price_and_rolling_history"
        ? `가격 이력 ${formatYears(block.usablePriceHistoryYears)}년 및 적용 RM ${formatYears(block.rollingCagrWindowYears, 0)}년, 최소 ${minimum}년 필요`
        : "포트폴리오 이용 조건을 충족하지 않습니다";
  return `${identity}: ${detail}. 신뢰도 낮음, 포트폴리오 이용 불가.${after}`;
}

export function formatPortfolioEligibilityBlocks(blocks = []) {
  return [...new Set((Array.isArray(blocks) ? blocks : []).map(formatPortfolioEligibilityBlock))];
}

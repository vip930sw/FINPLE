const USER_FACING_BLOCK_REASON_LABELS = Object.freeze({
  canonical_catalog_load_error:
    "최신 자산 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  unsupported_metric_status: "현재 분석 기준에서 지원되지 않는 자산입니다.",
  invalid_production_metric_approval: "현재 분석 기준에서 지원되지 않는 자산입니다.",
  metric_source_not_publish_approved: "현재 분석 기준에서 지원되지 않는 자산입니다.",
  unsupported_calculation_policy_version: "현재 분석 기준에서 지원되지 않는 자산입니다.",
  unsupported_pipeline_version: "현재 분석 기준에서 지원되지 않는 자산입니다.",
  unsupported_distribution_calculation_policy:
    "이 상품의 분배금은 일반 배당 재투자 방식으로 계산할 수 없습니다.",
  missing_metric_lineage: "분석에 필요한 자산 데이터가 충분하지 않습니다.",
  provider_event_error: "현금분배 정보를 확인할 수 없습니다.",
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
  if (code === "missing_assets") {
    return "계산할 자산을 추가해 주세요.";
  }
  if (code === "missing_ticker") {
    return "티커가 없는 미완성 자산 행이 있습니다. 행을 완성하거나 정리해 주세요.";
  }
  if (["missing_initial_investment", "invalid_start_value"].includes(code)) {
    return "시작 평가금액을 0원보다 크게 입력해 주세요.";
  }
  if (code === "invalid_target_weights") {
    return "목표비중 합계를 100%로 맞춰 주세요.";
  }
  if (["missing_metric_status", "missing_selected_cagr"].includes(code)) {
    return `${ticker}: 계산에 필요한 자산 정보가 완성되지 않았습니다. 다시 조회하거나 행을 정리해 주세요.`;
  }
  if (code === "duplicate_asset_identity") {
    return `${ticker}: 같은 자산이 중복되어 있습니다. 중복 행을 제거해 주세요.`;
  }
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
  return USER_FACING_BLOCK_REASON_LABELS[code] || "현재 분석 기준에서 지원되지 않는 자산입니다.";
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

const USER_FACING_BLOCK_REASON_LABELS = Object.freeze({
  unsupported_metric_status: "승인된 지표 상태를 확인할 수 없습니다.",
  invalid_production_metric_approval: "승인된 지표 상태를 확인할 수 없습니다.",
  unsupported_distribution_calculation_policy:
    "이 상품의 분배금은 일반 배당 재투자 방식으로 계산할 수 없습니다.",
  missing_metric_lineage: "지표 출처 정보가 부족합니다.",
  portfolio_add_denied: "장기 포트폴리오에 사용할 수 없는 자산이 포함되어 있습니다.",
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

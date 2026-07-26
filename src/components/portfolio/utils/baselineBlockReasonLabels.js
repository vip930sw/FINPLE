const USER_FACING_BLOCK_REASON_LABELS = Object.freeze({
  unsupported_metric_status: "승인된 지표 상태를 확인할 수 없습니다.",
  invalid_production_metric_approval: "승인된 지표 상태를 확인할 수 없습니다.",
  unsupported_distribution_calculation_policy:
    "이 상품의 분배금은 일반 배당 재투자 방식으로 계산할 수 없습니다.",
  missing_metric_lineage: "지표 출처 정보가 부족합니다.",
});

export function getBaselineBlockReasonCode(reason = "") {
  return String(reason || "").split(":", 1)[0].trim();
}

export function formatUserFacingBaselineBlockReason(reason = "") {
  const code = getBaselineBlockReasonCode(reason);
  return USER_FACING_BLOCK_REASON_LABELS[code] || "지표 계산 계약을 확인할 수 없습니다.";
}

export function formatUserFacingBaselineBlockReasons(reasons = []) {
  const labels = Array.isArray(reasons)
    ? reasons.map(formatUserFacingBaselineBlockReason)
    : [];
  return [...new Set(labels)];
}

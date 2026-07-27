function normalizeMetricReviewState(value) {
  return String(value || "").trim().toLowerCase();
}

export function resolveMetricReviewDisplay(asset = {}) {
  const dataStatus = normalizeMetricReviewState(asset.dataStatus);
  const metricsStatus = normalizeMetricReviewState(asset.metricsStatus);
  const reviewFlag = normalizeMetricReviewState(asset.reviewFlag);

  if (
    dataStatus === "ready" &&
    metricsStatus === "ready" &&
    reviewFlag === "none"
  ) {
    return { kind: "ready", text: "지표 검토 완료" };
  }

  if (
    dataStatus === "review_required" ||
    metricsStatus === "review_required" ||
    reviewFlag === "review_required"
  ) {
    return { kind: "review_required", text: "분석 지표 검토 필요" };
  }

  return { kind: "pending", text: "지표 상태 확인 중" };
}

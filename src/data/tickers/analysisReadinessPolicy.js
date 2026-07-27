function normalizeAnalysisState(value) {
  return String(value || "").trim().toLowerCase();
}

export function resolveAnalysisReadinessDisplay(asset = {}) {
  const dataStatus = normalizeAnalysisState(asset.dataStatus);
  const metricsStatus = normalizeAnalysisState(asset.metricsStatus);
  const reviewFlag = normalizeAnalysisState(asset.reviewFlag);

  if (
    dataStatus === "ready" &&
    metricsStatus === "ready" &&
    reviewFlag === "none"
  ) {
    return { kind: "ready", text: "분석 가능" };
  }

  if (
    dataStatus === "review_required" ||
    metricsStatus === "review_required" ||
    reviewFlag === "review_required"
  ) {
    return { kind: "review_required", text: "분석 지표 검토 필요" };
  }

  return { kind: "pending", text: "분석 준비 확인 중" };
}

import assert from "node:assert/strict";
import test from "node:test";

import { resolveMetricReviewDisplay } from "./metricReviewPolicy.js";

test("metric review status is independent from confirmed ordinary dividend state", () => {
  for (const fixture of [
    {
      ticker: "TQQQ",
      dividendYield: 0.47,
      dividendStatus: "confirmed_value",
      dataStatus: "ready",
      metricsStatus: "ready",
      reviewFlag: "review_required",
    },
    {
      ticker: "SOXL",
      dividendYield: 0,
      dividendStatus: "confirmed_value",
      dataStatus: "ready",
      metricsStatus: "ready",
      reviewFlag: "review_required",
    },
    {
      ticker: "069500",
      dividendYield: 0.46,
      dividendStatus: "confirmed_value",
      dataStatus: "review_required",
      metricsStatus: "review_required",
      reviewFlag: "review_required",
    },
  ]) {
    assert.deepEqual(
      resolveMetricReviewDisplay(fixture),
      { kind: "review_required", text: "분석 지표 검토 필요" },
      fixture.ticker,
    );
  }
});

test("metric review reports completion only when all three metric states are approved", () => {
  assert.deepEqual(
    resolveMetricReviewDisplay({
      dataStatus: "ready",
      metricsStatus: "ready",
      reviewFlag: "none",
    }),
    { kind: "ready", text: "지표 검토 완료" },
  );

  for (const fixture of [
    { dataStatus: "", metricsStatus: "ready", reviewFlag: "none" },
    { dataStatus: "ready", metricsStatus: "", reviewFlag: "none" },
    { dataStatus: "ready", metricsStatus: "ready", reviewFlag: "" },
    { dataStatus: "ready", metricsStatus: "review_only", reviewFlag: "none" },
  ]) {
    assert.deepEqual(
      resolveMetricReviewDisplay(fixture),
      { kind: "pending", text: "지표 상태 확인 중" },
    );
  }
});

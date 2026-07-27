import assert from "node:assert/strict";
import test from "node:test";

import { resolveAnalysisReadinessDisplay } from "./analysisReadinessPolicy.js";

test("analysis readiness is independent from confirmed ordinary dividend state", () => {
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
      resolveAnalysisReadinessDisplay(fixture),
      { kind: "review_required", text: "분석 지표 검토 필요" },
      fixture.ticker,
    );
  }
});

test("analysis readiness reports ready only when all three metric states are approved", () => {
  assert.deepEqual(
    resolveAnalysisReadinessDisplay({
      dataStatus: "ready",
      metricsStatus: "ready",
      reviewFlag: "none",
    }),
    { kind: "ready", text: "분석 가능" },
  );

  for (const fixture of [
    { dataStatus: "", metricsStatus: "ready", reviewFlag: "none" },
    { dataStatus: "ready", metricsStatus: "", reviewFlag: "none" },
    { dataStatus: "ready", metricsStatus: "ready", reviewFlag: "" },
    { dataStatus: "ready", metricsStatus: "review_only", reviewFlag: "none" },
  ]) {
    assert.deepEqual(
      resolveAnalysisReadinessDisplay(fixture),
      { kind: "pending", text: "분석 준비 확인 중" },
    );
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAppExportScenarioResult,
  buildAppPreviewScenarioResult,
  longestContiguousMonthSegment,
} from "./appPreviewScenarioService.js";
import {
  buildProbabilityScenarioViewModel,
  isProbabilityViewModelReady,
} from "./probabilityScenarioAdapter.js";
import {
  buildSimulatorAiScenarioContext,
  getProviderScenarioContext,
} from "./aiScenarioInterpretationContext.js";

function monthEnd(index) {
  const date = new Date(Date.UTC(2018, index + 1, 0));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function rows(market, ticker, count = 80, omitted = new Set()) {
  return Array.from({ length: count }, (_, index) => ({
    market,
    ticker,
    month: monthEnd(index),
    priceReturn: index % 2 === 0 ? 0.02 : -0.01,
    totalReturn: index % 2 === 0 ? 0.03 : 0,
    currency: "USD",
  })).filter((_, index) => !omitted.has(index));
}

const manifest = {
  sourceCandidatePackageId: "finple-candidate-test",
  sourceCandidatePackageHash: "a".repeat(64),
  sourceCandidatePackageVersion: "candidate-v1",
  normalizationVersion: "normalization-v1",
  calculationPolicyVersion: "metrics-calculation-policy-2026-06-26",
  metricDataThroughMonth: "2024-08",
};

test("longestContiguousMonthSegment never fills missing months", () => {
  assert.deepEqual(
    longestContiguousMonthSegment(["2024-01", "2024-02", "2024-04", "2024-05", "2024-06"]),
    ["2024-04", "2024-05", "2024-06"],
  );
});

test("preview scenario consumes aligned price-return rows from the longest observed segment", () => {
  const assets = [
    { market: "US", ticker: "QQQ", targetEvaluationAmount: 6000 },
    { market: "US", ticker: "SPY", targetEvaluationAmount: 4000 },
  ];
  const result = buildAppPreviewScenarioResult({
    activePortfolio: { id: "portfolio-preview", name: "Preview" },
    assets,
    settings: {
      startValue: 0,
      monthlyCashFlow: 100,
      years: 5,
      inflationRate: 2,
    },
    rowsByIdentity: {
      "US:QQQ": rows("US", "QQQ", 80, new Set([5])),
      "US:SPY": rows("US", "SPY", 80),
    },
    manifest,
    simulationCount: 24,
  });
  assert.equal(result.status, "ready", JSON.stringify(result.dataQuality));
  assert.equal(result.contributionSeries[0].cumulativeContributions, 10000);
  assert.equal(result.returnBasis, "price_return");
  assert.equal(result.internalPreviewContext.gapsForwardFilled, false);
  assert.equal(result.internalPreviewContext.commonObservedMonthCount, 79);
  assert.equal(result.internalPreviewContext.contiguousObservedMonthCount, 74);
  assert.deepEqual(result.internalPreviewContext.identities, ["US:QQQ", "US:SPY"]);
  assert.equal(result.productionPublishReady, false);
  assert.equal(result.appExportApproved, false);
});

test("missing asset series stays blocked instead of receiving zero rows", () => {
  const result = buildAppPreviewScenarioResult({
    activePortfolio: { id: "portfolio-preview", name: "Preview" },
    assets: [{ market: "US", ticker: "QQQ", targetEvaluationAmount: 10000 }],
    settings: {
      startValue: 10000,
      monthlyCashFlow: 0,
      years: 5,
      inflationRate: 0,
    },
    rowsByIdentity: {},
    manifest,
    simulationCount: 24,
  });
  assert.notEqual(result.status, "ready");
  assert.equal(result.internalPreviewContext.contiguousObservedMonthCount, 0);
});

test("production app export enables Step 4 only while AI scenario context stays excluded", () => {
  const activePortfolio = { id: "portfolio-production", name: "Production" };
  const assets = [
    { market: "US", ticker: "QQQ", targetEvaluationAmount: 6000 },
    { market: "US", ticker: "SPY", targetEvaluationAmount: 4000 },
  ];
  const settings = {
    startValue: 10000,
    monthlyCashFlow: 100,
    years: 5,
    inflationRate: 2,
  };
  const release = {
    contractVersion: "finple-production-app-export-release-v1-step114-2zc",
    universeVersion: "finple-universe-v2-2026-07-24",
    sourceAppExportSha256: "e".repeat(64),
    metricDataThroughMonth: "2026-06",
  };
  const result = buildAppExportScenarioResult({
    activePortfolio,
    assets,
    settings,
    rowsByIdentity: {
      "US:QQQ": rows("US", "QQQ"),
      "US:SPY": rows("US", "SPY"),
    },
    manifest,
    release,
    runtimeMode: "production_app_export_ready",
    simulationCount: 24,
  });
  assert.equal(result.status, "ready", JSON.stringify(result.dataQuality));
  assert.equal(result.productionPublishReady, true);
  assert.equal(result.appExportApproved, true);
  assert.equal(result.scenarioContextProviderEligible, false);
  assert.equal(result.productionAppExportContext.providerPayloadExcluded, true);
  assert.equal(result.productionAppExportContext.gapsForwardFilled, false);
  assert.deepEqual(result.percentiles, [0.1, 0.25, 0.5, 0.75, 0.9]);
  for (const band of result.monthlyBands) {
    assert.ok(band.p10Nominal <= band.p25Nominal);
    assert.ok(band.p25Nominal <= band.p50Nominal);
    assert.ok(band.p50Nominal <= band.p75Nominal);
    assert.ok(band.p75Nominal <= band.p90Nominal);
  }
  assert.notDeepEqual(
    result.contributionSeries.map((row) => row.cumulativeContributions),
    result.monthlyBands.map((row) => row.p50Nominal),
  );
  const viewModel = buildProbabilityScenarioViewModel({
    result,
    activePortfolio,
    assets,
    settings,
    enableProductionAppExport: true,
  });
  assert.equal(viewModel.status, "ready", JSON.stringify(viewModel.auditReasons));
  assert.equal(viewModel.productionAppExportEnabled, true);
  assert.equal(viewModel.scenarioContextProviderEligible, false);
  assert.equal(viewModel.providerApprovalEvidence, null);
  assert.equal(isProbabilityViewModelReady(viewModel), true);
  const aiContext = buildSimulatorAiScenarioContext({
    currentPortfolioFingerprint: viewModel.portfolioFingerprint,
    probabilityResult: result,
    probabilityViewModel: viewModel,
  });
  assert.equal(getProviderScenarioContext(aiContext), null);
});

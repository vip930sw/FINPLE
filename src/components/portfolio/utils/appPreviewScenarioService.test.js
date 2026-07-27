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
    dataStatus: "candidate",
    isProxy: false,
    proxyTicker: "",
  })).filter((_, index) => !omitted.has(index));
}

function legacyRows(market, ticker, count = 80) {
  return rows(market, ticker, count).map((row) => ({
    ...row,
    isProxy: null,
    proxyTicker: null,
    proxyLineageStatus: "legacy_unproven",
  }));
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

test("proxy or missing monthly lineage is rejected before scenario calculation", () => {
  const options = {
    activePortfolio: { id: "portfolio-preview", name: "Preview" },
    assets: [{ market: "US", ticker: "TQQQ", targetEvaluationAmount: 10000 }],
    settings: {
      startValue: 10000,
      monthlyCashFlow: 0,
      years: 5,
      inflationRate: 0,
    },
    manifest,
    simulationCount: 24,
  };
  const proxyRows = rows("US", "TQQQ");
  proxyRows[0] = { ...proxyRows[0], isProxy: true, proxyTicker: "QQQ" };
  assert.throws(
    () => buildAppPreviewScenarioResult({
      ...options,
      rowsByIdentity: { "US:TQQQ": proxyRows },
    }),
    /unsupported_product_policy:proxy_monthly_return/,
  );
  const legacyRows = rows("US", "TQQQ").map((row) => {
    const legacyRow = { ...row };
    delete legacyRow.isProxy;
    delete legacyRow.proxyTicker;
    return legacyRow;
  });
  assert.throws(
    () => buildAppPreviewScenarioResult({
      ...options,
      rowsByIdentity: { "US:TQQQ": legacyRows },
    }),
    /missing_metric_lineage:monthly_return_proxy_status/,
  );
});

test("bounded proxy status markers reject scenario rows without inferring lineage", () => {
  const base = {
    activePortfolio: { id: "portfolio-proxy-status", name: "Proxy status" },
    assets: [{ market: "US", ticker: "QQQ", targetEvaluationAmount: 10000 }],
    settings: {
      startValue: 10000,
      monthlyCashFlow: 0,
      years: 5,
      inflationRate: 0,
    },
    manifest,
    simulationCount: 24,
  };
  for (const dataStatus of ["proxy", "candidate_proxy", "proxy_source"]) {
    assert.throws(
      () => buildAppPreviewScenarioResult({
        ...base,
        rowsByIdentity: {
          "US:QQQ": rows("US", "QQQ").map((row) => ({ ...row, dataStatus })),
        },
      }),
      /unsupported_product_policy:proxy_monthly_return/,
      dataStatus,
    );
  }
  const result = buildAppPreviewScenarioResult({
    ...base,
    rowsByIdentity: {
      "US:QQQ": rows("US", "QQQ").map((row) => ({
        ...row,
        dataStatus: "aproxyvalue",
      })),
    },
  });
  assert.equal(result.status, "ready", JSON.stringify(result.dataQuality));
});

test("explicit monthly lineage keeps proxy and type contradictions fail-closed", () => {
  const base = {
    activePortfolio: { id: "portfolio-lineage-types", name: "Lineage types" },
    assets: [{ market: "US", ticker: "TQQQ", targetEvaluationAmount: 10000 }],
    settings: {
      startValue: 10000,
      monthlyCashFlow: 0,
      years: 5,
      inflationRate: 0,
    },
    manifest,
    simulationCount: 24,
  };
  const cases = [
    {
      name: "candidate true SPY",
      patch: { dataStatus: "candidate", isProxy: true, proxyTicker: "SPY" },
      reason: /unsupported_product_policy:proxy_monthly_return/,
    },
    {
      name: "candidate false SPY",
      patch: { dataStatus: "candidate", isProxy: false, proxyTicker: "SPY" },
      reason: /unsupported_product_policy:proxy_monthly_return/,
    },
    {
      name: "string false",
      patch: { dataStatus: "candidate", isProxy: "false", proxyTicker: "" },
      reason: /missing_metric_lineage:monthly_return_proxy_status/,
    },
    {
      name: "null ticker",
      patch: { dataStatus: "candidate", isProxy: false, proxyTicker: null },
      reason: /missing_metric_lineage:monthly_return_proxy_status/,
    },
  ];
  for (const fixture of cases) {
    assert.throws(
      () => buildAppPreviewScenarioResult({
        ...base,
        rowsByIdentity: {
          "US:TQQQ": rows("US", "TQQQ").map((row) => ({
            ...row,
            ...fixture.patch,
          })),
        },
      }),
      fixture.reason,
      fixture.name,
    );
  }
});

test("only the pinned legacy Production bridge preserves Step 4 for existing assets", () => {
  const release = {
    contractVersion: "finple-production-app-export-release-v1-step114-2zc",
    universeVersion: "finple-universe-v2-2026-07-24",
    sourceAppExportSha256: "e".repeat(64),
    metricDataThroughMonth: "2026-06",
  };
  const base = {
    activePortfolio: { id: "portfolio-production", name: "Production legacy" },
    assets: [{ market: "US", ticker: "QQQ", targetEvaluationAmount: 10000 }],
    settings: {
      startValue: 10000,
      monthlyCashFlow: 0,
      years: 5,
      inflationRate: 0,
    },
    rowsByIdentity: { "US:QQQ": legacyRows("US", "QQQ") },
    manifest,
    release,
    runtimeMode: "production_app_export_ready",
    monthlyRowContract: "legacy_v1",
    legacyProductionBindingVerified: true,
    simulationCount: 24,
  };
  const result = buildAppExportScenarioResult(base);
  assert.equal(result.status, "ready", JSON.stringify(result.dataQuality));
  assert.equal(result.productionAppExportContext.monthlyRowContract, "legacy_v1");
  assert.equal(result.productionAppExportContext.legacyProductionBindingVerified, true);

  assert.throws(
    () => buildAppExportScenarioResult({
      ...base,
      rowsByIdentity: {
        "US:QQQ": legacyRows("US", "QQQ").map((row) => ({
          ...row,
          dataStatus: "legacy_proxy",
        })),
      },
    }),
    /unsupported_product_policy:proxy_monthly_return/,
  );
  assert.throws(
    () => buildAppExportScenarioResult({
      ...base,
      legacyProductionBindingVerified: false,
    }),
    /missing_metric_lineage:monthly_return_proxy_status/,
  );
  assert.throws(
    () => buildAppExportScenarioResult({
      ...base,
      assets: [{
        market: "US",
        ticker: "QQQ",
        targetEvaluationAmount: 10000,
        reviewApprovalPolicyVersion: "leveraged-inverse-review-policy-v1-step114",
      }],
    }),
    /missing_metric_lineage:monthly_return_proxy_status/,
  );
});

test("review-approved non-proxy TQQQ SOXL and KODEX 200 remain scenario-ready", () => {
  for (const fixture of [
    { market: "US", ticker: "TQQQ", policy: "leveraged-inverse-review-policy-v1-step114" },
    { market: "US", ticker: "SOXL", policy: "leveraged-inverse-review-policy-v1-step114" },
    { market: "KR", ticker: "069500", policy: "initial-gap-review-policy-v1-step114" },
  ]) {
    const identity = `${fixture.market}:${fixture.ticker}`;
    const result = buildAppPreviewScenarioResult({
      activePortfolio: { id: `portfolio-${fixture.ticker}`, name: fixture.ticker },
      assets: [{
        market: fixture.market,
        ticker: fixture.ticker,
        targetEvaluationAmount: 10000,
        reviewApprovalPolicyVersion: fixture.policy,
      }],
      settings: {
        startValue: 10000,
        monthlyCashFlow: 0,
        years: 5,
        inflationRate: 0,
      },
      rowsByIdentity: {
        [identity]: rows(fixture.market, fixture.ticker),
      },
      manifest,
      simulationCount: 24,
    });
    assert.equal(result.status, "ready", `${identity}: ${JSON.stringify(result.dataQuality)}`);
  }
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

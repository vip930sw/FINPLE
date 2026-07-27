import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_EXPORT_SCENARIO_ERROR_CODES,
  AppExportScenarioPolicyError,
  buildAppExportScenarioResult,
  buildAppPreviewScenarioResult,
  longestContiguousMonthSegment,
  resolveAppExportScenarioState,
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

function assertScenarioPolicyError(action, { code, identity }) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof AppExportScenarioPolicyError);
    assert.equal(error.name, "AppExportScenarioPolicyError");
    assert.equal(error.code, code);
    assert.equal(error.identity, identity);
    assert.equal(error.domain, "scenario_policy");
    assert.equal(error.catalogFallbackEligible, false);
    assert.doesNotMatch(error.message, new RegExp(code.replaceAll(":", "\\:")));
    return true;
  });
}

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
  assertScenarioPolicyError(
    () => buildAppPreviewScenarioResult({
      ...options,
      rowsByIdentity: { "US:TQQQ": proxyRows },
    }),
    {
      code: APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN,
      identity: "US:TQQQ",
    },
  );
  const legacyRows = rows("US", "TQQQ").map((row) => {
    const legacyRow = { ...row };
    delete legacyRow.isProxy;
    delete legacyRow.proxyTicker;
    return legacyRow;
  });
  assertScenarioPolicyError(
    () => buildAppPreviewScenarioResult({
      ...options,
      rowsByIdentity: { "US:TQQQ": legacyRows },
    }),
    {
      code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
      identity: "US:TQQQ",
    },
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
    assertScenarioPolicyError(
      () => buildAppPreviewScenarioResult({
        ...base,
        rowsByIdentity: {
          "US:QQQ": rows("US", "QQQ").map((row) => ({ ...row, dataStatus })),
        },
      }),
      {
        code: APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN,
        identity: "US:QQQ",
      },
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
      code: APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN,
    },
    {
      name: "candidate false SPY",
      patch: { dataStatus: "candidate", isProxy: false, proxyTicker: "SPY" },
      code: APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN,
    },
    {
      name: "string false",
      patch: { dataStatus: "candidate", isProxy: "false", proxyTicker: "" },
      code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
    },
    {
      name: "null ticker",
      patch: { dataStatus: "candidate", isProxy: false, proxyTicker: null },
      code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
    },
  ];
  for (const fixture of cases) {
    assertScenarioPolicyError(
      () => buildAppPreviewScenarioResult({
        ...base,
        rowsByIdentity: {
          "US:TQQQ": rows("US", "TQQQ").map((row) => ({
            ...row,
            ...fixture.patch,
          })),
        },
      }),
      {
        code: fixture.code,
        identity: "US:TQQQ",
      },
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

  assertScenarioPolicyError(
    () => buildAppExportScenarioResult({
      ...base,
      rowsByIdentity: {
        "US:QQQ": legacyRows("US", "QQQ").map((row) => ({
          ...row,
          dataStatus: "legacy_proxy",
        })),
      },
    }),
    {
      code: APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN,
      identity: "US:QQQ",
    },
  );
  assertScenarioPolicyError(
    () => buildAppExportScenarioResult({
      ...base,
      legacyProductionBindingVerified: false,
    }),
    {
      code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
      identity: "US:QQQ",
    },
  );
  assertScenarioPolicyError(
    () => buildAppExportScenarioResult({
      ...base,
      assets: [{
        market: "US",
        ticker: "QQQ",
        targetEvaluationAmount: 10000,
        reviewApprovalPolicyVersion: "leveraged-inverse-review-policy-v1-step114",
      }],
    }),
    {
      code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
      identity: "US:QQQ",
    },
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

test("Production scenario policy rejection preserves the validated catalog and recovers after asset removal", async () => {
  const catalogSnapshot = {
    preview: { status: "production_app_export_ready" },
    candidates: Array.from({ length: 6029 }, (_, index) => ({ ticker: String(index) })),
  };
  const release = {
    contractVersion: "finple-production-app-export-release-v1-step114-2zc",
    universeVersion: "finple-universe-v2-2026-07-24",
    sourceAppExportSha256: "e".repeat(64),
    metricDataThroughMonth: "2026-06",
  };
  const settings = {
    startValue: 10000,
    monthlyCashFlow: 0,
    years: 5,
    inflationRate: 0,
  };
  const loadMonthlyReturns = async () => ({
    rowsByIdentity: {
      "US:QQQ": rows("US", "QQQ").map((row) => ({
        ...row,
        dataStatus: "proxy",
      })),
      "US:SPY": rows("US", "SPY"),
    },
    missingIdentities: [],
    sourceManifest: manifest,
    release,
    monthlyRowContract: "proxy_aware_v2",
    legacyProductionBindingVerified: false,
  });
  const buildScenario = (assets) => (monthlyReturns) => buildAppExportScenarioResult({
    activePortfolio: { id: "portfolio-production-policy", name: "Production policy" },
    assets,
    settings,
    rowsByIdentity: monthlyReturns.rowsByIdentity,
    manifest: monthlyReturns.sourceManifest,
    release: monthlyReturns.release,
    runtimeMode: "production_app_export_ready",
    monthlyRowContract: monthlyReturns.monthlyRowContract,
    legacyProductionBindingVerified: monthlyReturns.legacyProductionBindingVerified,
    simulationCount: 24,
  });

  const rejected = await resolveAppExportScenarioState({
    identities: ["US:QQQ", "US:SPY"],
    loadMonthlyReturns,
    buildScenario: buildScenario([
      { market: "US", ticker: "QQQ", targetEvaluationAmount: 5000 },
      { market: "US", ticker: "SPY", targetEvaluationAmount: 5000 },
    ]),
  });
  assert.equal(rejected.status, "unavailable");
  assert.equal(rejected.errorCode, APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN);
  assert.equal(rejected.failureDomain, "scenario_policy");
  assert.equal(rejected.catalogFallbackEligible, false);
  assert.equal(catalogSnapshot.preview.status, "production_app_export_ready");
  assert.equal(catalogSnapshot.candidates.length, 6029);

  const recovered = await resolveAppExportScenarioState({
    identities: ["US:SPY"],
    loadMonthlyReturns,
    buildScenario: buildScenario([
      { market: "US", ticker: "SPY", targetEvaluationAmount: 10000 },
    ]),
  });
  assert.equal(recovered.status, "ready", JSON.stringify(recovered.result?.dataQuality));
  assert.equal(catalogSnapshot.preview.status, "production_app_export_ready");
  assert.equal(catalogSnapshot.candidates.length, 6029);
});

test("scenario lineage, execution, and Preview policy failures stay scenario-local", async () => {
  const lineageRows = rows("US", "QQQ").map((row) => ({
    ...row,
    isProxy: "false",
  }));
  const productionLineage = await resolveAppExportScenarioState({
    identities: ["US:QQQ"],
    loadMonthlyReturns: async () => ({
      rowsByIdentity: { "US:QQQ": lineageRows },
      missingIdentities: [],
    }),
    buildScenario: (monthlyReturns) => buildAppPreviewScenarioResult({
      activePortfolio: { id: "lineage", name: "Lineage" },
      assets: [{ market: "US", ticker: "QQQ", targetEvaluationAmount: 10000 }],
      settings: { startValue: 10000, monthlyCashFlow: 0, years: 5, inflationRate: 0 },
      rowsByIdentity: monthlyReturns.rowsByIdentity,
      manifest,
      simulationCount: 24,
    }),
  });
  assert.equal(productionLineage.status, "unavailable");
  assert.equal(
    productionLineage.errorCode,
    APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
  );
  assert.equal(productionLineage.failureDomain, "scenario_policy");

  const executionFailure = await resolveAppExportScenarioState({
    identities: ["US:QQQ"],
    loadMonthlyReturns: async () => ({
      rowsByIdentity: { "US:QQQ": rows("US", "QQQ") },
      missingIdentities: [],
    }),
    buildScenario: () => {
      throw new RangeError("scenario calculation failed");
    },
  });
  assert.equal(executionFailure.status, "unavailable");
  assert.equal(executionFailure.failureDomain, "scenario_execution");

  const previewPolicy = await resolveAppExportScenarioState({
    identities: ["US:QQQ"],
    loadMonthlyReturns: async () => ({
      rowsByIdentity: {
        "US:QQQ": rows("US", "QQQ").map((row) => ({ ...row, dataStatus: "proxy" })),
      },
      missingIdentities: [],
    }),
    buildScenario: (monthlyReturns) => buildAppPreviewScenarioResult({
      activePortfolio: { id: "preview-policy", name: "Preview policy" },
      assets: [{ market: "US", ticker: "QQQ", targetEvaluationAmount: 10000 }],
      settings: { startValue: 10000, monthlyCashFlow: 0, years: 5, inflationRate: 0 },
      rowsByIdentity: monthlyReturns.rowsByIdentity,
      manifest,
      simulationCount: 24,
    }),
  });
  assert.equal(previewPolicy.status, "unavailable");
  assert.equal(previewPolicy.failureDomain, "scenario_policy");
});

test("Production monthly loader failures stay scenario-local and preserve the catalog", async () => {
  const catalogSnapshot = {
    preview: { status: "production_app_export_ready" },
    candidates: Array.from({ length: 6029 }, (_, index) => ({ ticker: String(index) })),
  };
  const loaderFailures = [
    { code: null, message: "transient fetch failure" },
    { code: "production_monthly_shard_fetch_failed", message: "shard fetch failure" },
    "production_release_manifest_unavailable",
    "production_monthly_index_mismatch",
    "production_monthly_shard_mismatch",
    "production_source_manifest_mismatch",
  ].map((value) => (
    typeof value === "string"
      ? { code: value, message: "monthly loader validation failure" }
      : value
  ));
  for (const { code, message } of loaderFailures) {
    const loaderError = Object.assign(new TypeError(message), code ? { code } : {});
    const outcome = await resolveAppExportScenarioState({
      identities: ["US:QQQ"],
      loadMonthlyReturns: async () => {
        throw loaderError;
      },
      buildScenario: () => assert.fail("scenario must not run after loader failure"),
    });
    assert.equal(outcome.status, "unavailable", code || message);
    assert.equal(outcome.failureDomain, "scenario_loader", code || message);
    assert.equal(outcome.catalogFallbackEligible, false, code || message);
    assert.equal(catalogSnapshot.preview.status, "production_app_export_ready");
    assert.equal(catalogSnapshot.candidates.length, 6029);
  }

  const identityError = Object.assign(new Error("identity unavailable"), {
    code: APP_EXPORT_SCENARIO_ERROR_CODES.IDENTITY_UNAVAILABLE,
  });
  const thrownIdentity = await resolveAppExportScenarioState({
    identities: ["US:MISSING"],
    loadMonthlyReturns: async () => {
      throw identityError;
    },
    buildScenario: () => assert.fail("scenario must not run for missing identity"),
  });
  assert.equal(thrownIdentity.failureDomain, "identity_unavailable");
  assert.equal(thrownIdentity.catalogFallbackEligible, false);

  const returnedIdentity = await resolveAppExportScenarioState({
    identities: ["US:MISSING"],
    loadMonthlyReturns: async () => ({
      rowsByIdentity: {},
      missingIdentities: ["US:MISSING"],
    }),
    buildScenario: () => assert.fail("scenario must not run for missing identity"),
  });
  assert.equal(returnedIdentity.failureDomain, "identity_unavailable");
  assert.equal(returnedIdentity.catalogFallbackEligible, false);

  const previewLoaderFailure = await resolveAppExportScenarioState({
    identities: ["US:QQQ"],
    loadMonthlyReturns: async () => {
      throw Object.assign(new TypeError("preview shard failure"), {
        code: "preview_monthly_shard_mismatch",
      });
    },
    buildScenario: () => assert.fail("scenario must not run after loader failure"),
  });
  assert.equal(previewLoaderFailure.failureDomain, "scenario_loader");
  assert.equal(previewLoaderFailure.catalogFallbackEligible, false);
  assert.equal(catalogSnapshot.preview.status, "production_app_export_ready");
  assert.equal(catalogSnapshot.candidates.length, 6029);
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

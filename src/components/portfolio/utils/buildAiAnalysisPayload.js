import { getProviderScenarioContext } from "./aiScenarioInterpretationContext.js";

const MAX_AI_ANALYSIS_ASSET_COUNT = 20;

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function toNumberInRange(value, min, max) {
  const number = toFiniteNumber(value);
  if (number === null || number < min || number > max) return null;
  return number;
}

function roundToTwo(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeTicker(ticker) {
  return String(ticker || "").trim().toUpperCase();
}

function normalizeMarket(market) {
  return String(market || "").trim().toUpperCase() === "KR" ? "KR" : "US";
}

function getAssetValue(asset) {
  const plannedValue = toFiniteNumber(asset?.targetEvaluationAmount);
  if (plannedValue && plannedValue > 0) return plannedValue;

  const quantity = toFiniteNumber(asset?.quantity) || 0;
  const price = toFiniteNumber(asset?.price) || 0;
  return quantity * price;
}

function getWeightedAssets(activeAssets) {
  const assetsWithValue = activeAssets.map((asset) => ({
    asset,
    value: getAssetValue(asset),
  }));
  const totalValue = assetsWithValue.reduce((sum, item) => sum + Math.max(0, item.value || 0), 0);

  if (totalValue <= 0) {
    const equalWeight = roundToTwo(100 / activeAssets.length);
    return activeAssets.map((asset, index) => ({
      asset,
      weight: index === activeAssets.length - 1
        ? roundToTwo(100 - equalWeight * (activeAssets.length - 1))
        : equalWeight,
    }));
  }

  let accumulatedWeight = 0;
  return assetsWithValue.map(({ asset, value }, index) => {
    const isLast = index === assetsWithValue.length - 1;
    const weight = isLast
      ? roundToTwo(100 - accumulatedWeight)
      : roundToTwo((Math.max(0, value || 0) / totalValue) * 100);
    accumulatedWeight += weight;
    return { asset, weight };
  });
}

function createAssetDataStatus(asset) {
  const hasCoreMetrics = ["cagr", "beta", "mdd"].every((field) => (
    toFiniteNumber(asset?.[field]) !== null
  ));

  if (hasCoreMetrics) return "ready_with_metrics";
  if (asset?.metricMode === "csv" || asset?.dataSource === "csv") return "review";
  return String(asset?.metricMode || asset?.dataSource || "review");
}

function addNumber(target, key, value, min, max) {
  const number = toNumberInRange(value, min, max);
  if (number !== null) target[key] = number;
}

function buildAssetPayload(asset, weight) {
  const payload = {
    ticker: normalizeTicker(asset?.ticker),
    market: normalizeMarket(asset?.market),
    name: String(asset?.name || asset?.ticker || "").trim(),
    weight,
    dataStatus: createAssetDataStatus(asset),
  };

  addNumber(payload, "cagr", asset?.cagr, -100, 300);
  addNumber(payload, "expectedCagr", asset?.expectedCagr ?? asset?.cagr, -100, 300);
  addNumber(payload, "beta", asset?.beta, -5, 15);
  addNumber(payload, "mdd", asset?.mdd, -100, 0);
  addNumber(payload, "dividendYield", asset?.dividendYield, 0, 300);
  addNumber(payload, "dataYears", asset?.dataYears, 0, 150);

  return payload;
}

function buildMetricsPayload(result = {}) {
  const metrics = {};

  addNumber(metrics, "cagr", result?.expectedCagr, -100, 300);
  addNumber(metrics, "expectedCagr", result?.expectedCagr, -100, 300);
  addNumber(metrics, "beta", result?.expectedBeta, -5, 15);
  addNumber(metrics, "mdd", result?.simpleMdd, -100, 0);
  addNumber(metrics, "calmar", result?.expectedCalmar, -50, 50);
  addNumber(metrics, "dividendYield", result?.expectedDividendYield, 0, 300);
  addNumber(metrics, "futureValue", result?.futureValue, 0, Number.MAX_SAFE_INTEGER);
  addNumber(
    metrics,
    "inflationAdjustedFutureValue",
    result?.inflationAdjustedFutureValue,
    0,
    Number.MAX_SAFE_INTEGER
  );

  return metrics;
}

export function buildAiAnalysisPayload({
  activePortfolio,
  activeAssets = [],
  result = {},
  settings = {},
  scenarioInterpretationContext = null,
} = {}) {
  if (!Array.isArray(activeAssets) || activeAssets.length === 0) {
    throw new Error("포트폴리오 AI 분석을 생성하려면 STEP 1에서 자산을 1개 이상 입력해주세요.");
  }

  if (activeAssets.length > MAX_AI_ANALYSIS_ASSET_COUNT) {
    throw new Error(`포트폴리오 AI 분석은 최대 ${MAX_AI_ANALYSIS_ASSET_COUNT}개 자산까지 요청할 수 있습니다.`);
  }

  const assets = getWeightedAssets(activeAssets).map(({ asset, weight }) => buildAssetPayload(asset, weight));

  const providerScenarioContext = getProviderScenarioContext(scenarioInterpretationContext);
  const payload = {
    portfolioId: String(activePortfolio?.id || "local-portfolio"),
    analysisContext: "simulator-step6",
    settings: {
      years: toFiniteNumber(settings?.years),
      inflationRate: toFiniteNumber(settings?.inflationRate),
      dividendReinvest: settings?.dividendReinvest,
    },
    metrics: buildMetricsPayload(result),
    assets,
  };

  if (providerScenarioContext) {
    payload.scenarioInterpretationContext = {
      contextVersion: scenarioInterpretationContext.contextVersion,
      status: scenarioInterpretationContext.status,
      providerEligible: true,
      providerContext: providerScenarioContext,
      integrity: scenarioInterpretationContext.integrity,
    };
  }

  return payload;
}

function buildScenarioSignatureContext(scenarioInterpretationContext) {
  const providerScenarioContext = getProviderScenarioContext(scenarioInterpretationContext);
  if (!providerScenarioContext) return null;
  const sections = providerScenarioContext.sections || {};
  const signature = {
    contextVersion: providerScenarioContext.contextVersion,
    target: providerScenarioContext.target,
    includedSections: providerScenarioContext.includedSections,
  };
  if (sections.probability) {
    signature.probability = {
      method: sections.probability.method,
      inputHash: sections.probability.inputHash,
      outputHash: sections.probability.outputHash,
      scenarioVersion: sections.probability.scenarioVersion,
    };
  }
  if (sections.externalShock) {
    signature.externalShock = {
      scenarioId: sections.externalShock.scenarioId,
      mode: sections.externalShock.mode,
      inputHash: sections.externalShock.inputHash,
      outputHash: sections.externalShock.outputHash,
      baselineIdentityHash: sections.externalShock.baselineIdentityHash,
      scenarioVersion: sections.externalShock.scenarioVersion,
    };
  }
  return signature;
}

export function createAiAnalysisInputSignature({
  activePortfolio,
  activeAssets = [],
  result = {},
  scenarioInterpretationContext = null,
} = {}) {
  const signatureAssets = activeAssets.map((asset) => ({
    ticker: normalizeTicker(asset?.ticker),
    market: normalizeMarket(asset?.market),
    quantity: toFiniteNumber(asset?.quantity),
    price: toFiniteNumber(asset?.price),
    targetEvaluationAmount: toFiniteNumber(asset?.targetEvaluationAmount),
    cagr: toFiniteNumber(asset?.cagr),
    beta: toFiniteNumber(asset?.beta),
    mdd: toFiniteNumber(asset?.mdd),
    dividendYield: toFiniteNumber(asset?.dividendYield),
  }));

  const signature = {
    portfolioId: activePortfolio?.id || "local-portfolio",
    assets: signatureAssets,
    metrics: {
      expectedCagr: toFiniteNumber(result?.expectedCagr),
      expectedBeta: toFiniteNumber(result?.expectedBeta),
      simpleMdd: toFiniteNumber(result?.simpleMdd),
      expectedDividendYield: toFiniteNumber(result?.expectedDividendYield),
      futureValue: toFiniteNumber(result?.futureValue),
      inflationAdjustedFutureValue: toFiniteNumber(result?.inflationAdjustedFutureValue),
    },
  };

  const scenarioSignatureContext = buildScenarioSignatureContext(scenarioInterpretationContext);
  if (scenarioSignatureContext) signature.scenarioInterpretationContext = scenarioSignatureContext;

  return JSON.stringify(signature);
}

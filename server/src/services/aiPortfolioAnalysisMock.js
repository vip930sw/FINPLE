const ANALYSIS_VERSION = "ai-analysis-mock-v1";
const MOCK_GENERATED_AT = "2026-06-25T00:00:00.000Z";

function sortByWeightDesc(assets) {
  return [...assets].sort((left, right) => Number(right.weight || 0) - Number(left.weight || 0));
}

function getTopAsset(assets) {
  return sortByWeightDesc(assets)[0] || null;
}

function getWeightBand(weight) {
  if (weight >= 50) return "very_high";
  if (weight >= 35) return "high";
  if (weight >= 20) return "medium";
  return "low";
}

function getDataQuality(payload) {
  const warnings = [];
  const incompleteAssets = payload.assets.filter((asset) => {
    const status = String(asset.dataStatus || "").toLowerCase();
    return status && !["ready", "ready_with_metrics", "auto"].includes(status);
  });
  const missingMetricAssets = payload.assets.filter((asset) => (
    asset.cagr === undefined &&
    asset.expectedCagr === undefined &&
    asset.beta === undefined &&
    asset.mdd === undefined
  ));

  if (incompleteAssets.length > 0) {
    warnings.push("일부 자산은 데이터 상태가 제한적입니다.");
  }
  if (missingMetricAssets.length > 0) {
    warnings.push("일부 자산은 주요 지표가 비어 있어 해석 범위가 제한됩니다.");
  }

  return {
    level: warnings.length > 0 ? "review" : "good",
    summary: warnings.length > 0
      ? "입력된 계산값을 기준으로 해석하되 데이터 한계를 함께 표시합니다."
      : "입력된 계산값과 자산 정보가 mock 분석에 필요한 최소 조건을 충족합니다.",
    warnings,
  };
}

function getPortfolioProfile(payload) {
  const metrics = payload.metrics || {};
  const topAsset = getTopAsset(payload.assets);
  const hasHighBeta = payload.assets.some((asset) => Number(asset.beta || metrics.beta || 0) >= 1.3);
  const hasLargeDrawdown = payload.assets.some((asset) => Number(asset.mdd || metrics.mdd || 0) <= -35);
  const hasIncomeAsset = payload.assets.some((asset) => Number(asset.dividendYield || 0) >= 3);

  let title = "균형 점검이 필요한 포트폴리오";
  if (hasHighBeta || hasLargeDrawdown) title = "시장 변동성에 민감한 포트폴리오";
  if (hasIncomeAsset && !hasHighBeta) title = "현금흐름 성격이 포함된 포트폴리오";
  if (topAsset && topAsset.weight >= 50) title = "핵심 자산 집중도가 높은 포트폴리오";

  return {
    title,
    summary: "FINPLE 계산 엔진이 제공한 입력값을 바탕으로 포트폴리오 구조와 위험요인을 설명합니다.",
  };
}

function getDiversification(payload) {
  const topAsset = getTopAsset(payload.assets);
  const topWeightBand = getWeightBand(Number(topAsset?.weight || 0));
  let effectiveDiversificationLevel = "medium";

  if (payload.assets.length <= 2 || topWeightBand === "very_high") {
    effectiveDiversificationLevel = "low";
  } else if (payload.assets.length >= 6 && topWeightBand === "low") {
    effectiveDiversificationLevel = "high";
  }

  return {
    nominalAssetCount: payload.assets.length,
    effectiveDiversificationLevel,
    summary: topAsset
      ? `${topAsset.ticker} 비중 입력값이 가장 커서 명목 자산 수와 실제 분산도가 다를 수 있습니다.`
      : "자산 구성이 비어 있어 분산도를 설명할 수 없습니다.",
  };
}

function buildRiskFactors(payload) {
  const risks = [];
  const topAsset = getTopAsset(payload.assets);
  const highBetaAssets = payload.assets.filter((asset) => Number(asset.beta || 0) >= 1.3);
  const largeMddAssets = payload.assets.filter((asset) => Number(asset.mdd || 0) <= -35);
  const shortDataAssets = payload.assets.filter((asset) => Number(asset.dataYears || 999) < 5);

  if (topAsset && topAsset.weight >= 35) {
    risks.push({
      code: "concentration",
      label: "핵심 자산 집중",
      severity: topAsset.weight >= 50 ? "high" : "medium",
      evidence: [`${topAsset.ticker} 입력 비중 ${topAsset.weight}%`],
    });
  }

  if (highBetaAssets.length > 0) {
    risks.push({
      code: "market_sensitivity",
      label: "시장 민감도",
      severity: "medium",
      evidence: highBetaAssets.slice(0, 3).map((asset) => `${asset.ticker} beta ${asset.beta}`),
    });
  }

  if (largeMddAssets.length > 0) {
    risks.push({
      code: "drawdown",
      label: "낙폭 경험",
      severity: "medium",
      evidence: largeMddAssets.slice(0, 3).map((asset) => `${asset.ticker} MDD ${asset.mdd}`),
    });
  }

  if (shortDataAssets.length > 0) {
    risks.push({
      code: "short_history",
      label: "짧은 데이터 기간",
      severity: "medium",
      evidence: shortDataAssets.slice(0, 3).map((asset) => `${asset.ticker} dataYears ${asset.dataYears}`),
    });
  }

  if (risks.length === 0) {
    risks.push({
      code: "baseline_review",
      label: "기본 구조 점검",
      severity: "low",
      evidence: ["입력값 기준으로 즉시 강조할 단일 위험요인은 제한적입니다."],
    });
  }

  return risks;
}

function inferAssetRole(asset) {
  const cagr = Number(asset.cagr ?? asset.expectedCagr ?? 0);
  const beta = Number(asset.beta ?? 0);
  const dividendYield = Number(asset.dividendYield ?? 0);
  const mdd = Number(asset.mdd ?? 0);

  if (dividendYield >= 3) return "income";
  if (cagr >= 10 || beta >= 1.2) return "growth";
  if (mdd > -20 && beta > 0 && beta < 0.8) return "stability";
  return "core";
}

function buildAssetRoles(payload) {
  return sortByWeightDesc(payload.assets).map((asset) => ({
    ticker: asset.ticker,
    market: asset.market,
    weight: asset.weight,
    role: inferAssetRole(asset),
    rationale: `${asset.ticker} 입력 지표를 기준으로 포트폴리오 내 역할을 분류했습니다.`,
  }));
}

function getLimitations(payload) {
  const limitations = [
    "mock 분석은 외부 AI API를 호출하지 않습니다.",
    "CAGR, beta, MDD, 배당률, 미래가치는 서버에서 다시 계산하지 않습니다.",
    "본 응답은 입력값의 구조와 데이터 상태를 설명하는 용도입니다.",
  ];

  if (!payload.metrics || Object.keys(payload.metrics).length === 0) {
    limitations.push("포트폴리오 단위 계산 지표가 없으면 해석은 자산별 입력값 중심으로 제한됩니다.");
  }

  return limitations;
}

export function buildMockPortfolioAnalysis(payload) {
  return {
    analysisVersion: ANALYSIS_VERSION,
    portfolioId: payload.portfolioId,
    generatedAt: MOCK_GENERATED_AT,
    mode: "mock",
    provider: "none",
    dataQuality: getDataQuality(payload),
    portfolioProfile: getPortfolioProfile(payload),
    diversification: getDiversification(payload),
    riskFactors: buildRiskFactors(payload),
    assetRoles: buildAssetRoles(payload),
    limitations: getLimitations(payload),
    disclaimer: "본 분석은 투자 권유가 아닌 참고자료입니다. 최종 판단은 사용자가 확인해야 합니다.",
  };
}

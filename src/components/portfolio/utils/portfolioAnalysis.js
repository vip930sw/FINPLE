function getAssetValue(asset) {
  return Number(asset?.quantity || 0) * Number(asset?.price || 0);
}

function getAssetWeight(asset, totalAssetValue) {
  const value = getAssetValue(asset);
  return totalAssetValue > 0 ? (value / totalAssetValue) * 100 : 0;
}

function classifyAssetRole(asset = {}) {
  const ticker = String(asset.ticker || "").toUpperCase();
  const name = String(asset.name || "");
  const beta = Number(asset.beta || 0);
  const dividendYield = Number(asset.dividendYield || 0);
  const mdd = Number(asset.mdd || 0);

  if (ticker === "CASH" || name.includes("현금") || beta === 0) return { key: "cash", label: "현금/대기자금" };
  if (ticker === "BTC" || beta >= 1.8 || mdd <= -55) return { key: "aggressive", label: "공격형" };
  if (ticker === "TLT" || name.includes("채권") || beta <= 0.35) return { key: "defensive", label: "방어형" };
  if (ticker === "SCHD" || dividendYield >= 3) return { key: "dividend", label: "배당형" };
  if (ticker === "GLD" || name.includes("금")) return { key: "alternative", label: "대체자산" };
  return { key: "growth", label: "성장형" };
}

export function analyzePortfolioProfile({ assets = [], result = {} }) {
  const totalAssetValue = Number(result.totalAssetValue || 0);
  const activeAssets = assets.filter((asset) => String(asset?.ticker || "").trim() && getAssetValue(asset) > 0);
  const roleMap = new Map();

  activeAssets.forEach((asset) => {
    const role = classifyAssetRole(asset);
    const weight = getAssetWeight(asset, totalAssetValue);
    const previous = roleMap.get(role.key) || { ...role, weight: 0 };
    roleMap.set(role.key, { ...previous, weight: previous.weight + weight });
  });

  const roleBreakdown = Array.from(roleMap.values()).sort((a, b) => b.weight - a.weight);
  const topAssets = [...activeAssets]
    .map((asset) => ({ ticker: asset.ticker || "-", weight: getAssetWeight(asset, totalAssetValue) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const allocationSummary = topAssets.map((asset) => `${asset.ticker} ${asset.weight.toFixed(1)}%`).join(" · ");
  const expectedCagr = Number(result.expectedCagr || 0);
  const expectedBeta = Number(result.expectedBeta || 0);
  const simpleMdd = Number(result.simpleMdd || 0);
  const dividendYield = Number(result.expectedDividendYield || 0);
  const riskLevel = simpleMdd <= -40 || expectedBeta >= 1.4 ? "높음" : simpleMdd <= -25 || expectedBeta >= 0.9 ? "중간" : "낮음";
  const profileType = expectedCagr >= 9 ? "성장 지향" : dividendYield >= 3 ? "배당 지향" : riskLevel === "낮음" ? "안정 지향" : "균형 지향";

  const riskPoints = [];
  if (topAssets[0]?.weight >= 50) riskPoints.push(`${topAssets[0].ticker} 비중이 ${topAssets[0].weight.toFixed(1)}%로 높아 특정 자산 집중도가 큽니다.`);
  if (simpleMdd <= -35) riskPoints.push("예상 MDD가 큰 편이므로 하락장 손실폭을 감내할 수 있는지 확인이 필요합니다.");
  if (expectedBeta >= 1.2) riskPoints.push("예상 BETA가 높아 시장 변동보다 더 크게 움직일 수 있습니다.");
  if (dividendYield < 1) riskPoints.push("배당률이 낮아 현금흐름보다 자본차익 중심의 구조입니다.");
  if (riskPoints.length === 0) riskPoints.push("현재 입력 기준에서 특정 리스크가 과도하게 두드러지지는 않습니다.");

  const suggestions = [];
  if (topAssets[0]?.weight >= 50) suggestions.push("상위 자산 비중을 낮추고 방어형 자산을 보완하면 집중도를 낮출 수 있습니다.");
  if (simpleMdd <= -35) suggestions.push("방어형 자산 또는 현금성 자산 비중을 일부 확대해 하락 위험을 완화할 수 있습니다.");
  if (dividendYield < 1.5) suggestions.push("배당형 ETF를 일부 편입하면 장기 보유 중 현금흐름을 보완할 수 있습니다.");
  if (suggestions.length === 0) suggestions.push("현재 조합을 기준으로 투자기간, 월 투자금, 물가상승률을 바꿔 민감도를 비교해보세요.");

  return {
    riskLevel,
    profileSummary: `${profileType} 포트폴리오입니다. 예상 CAGR은 ${expectedCagr.toFixed(2)}%, 예상 MDD는 ${simpleMdd.toFixed(2)}%, 예상 배당률은 ${dividendYield.toFixed(2)}%입니다.`,
    allocationSummary,
    roleBreakdown: roleBreakdown.length > 0 ? roleBreakdown : [{ key: "none", label: "자산 없음", weight: 0 }],
    riskPoints,
    suggestions,
  };
}

export function getPortfolioDetailReport(portfolio) {
  if (!portfolio) return null;

  const result = portfolio.result || {};
  const analysis = analyzePortfolioProfile({ assets: portfolio.assets || [], result });
  const cagr = Number(result.expectedCagr || 0);
  const mdd = Number(result.simpleMdd || 0);
  const dividendYield = Number(result.expectedDividendYield || 0);
  const beta = Number(result.expectedBeta || 0);

  const tags = [];
  if (cagr >= 9) tags.push("성장성");
  if (Math.abs(mdd) <= 25) tags.push("방어력");
  if (dividendYield >= 3) tags.push("배당");
  if (beta >= 1.2) tags.push("변동성");
  if (tags.length === 0) tags.push("균형");

  return {
    type: portfolio.insight?.type || "포트폴리오 분석",
    tags,
    summary: `${portfolio.name || "선택 포트폴리오"}는 ${analysis.profileSummary}`,
    growthText: cagr >= 9 ? "성장 기대치가 높은 편입니다." : "성장 기대치는 중간 수준입니다.",
    riskText: Math.abs(mdd) >= 35 ? "하락장에서 손실폭이 커질 수 있는 구조입니다." : "입력값 기준 하락 위험은 과도하게 높지 않습니다.",
    dividendText: dividendYield >= 3 ? "배당률이 비교적 높아 현금흐름 측면의 매력이 있습니다." : "배당보다 가격 상승에 더 의존하는 구조입니다.",
    directionText: "목표비중을 조정한 뒤 적용 버튼으로 수량을 재계산하고, 상세분석에서 장기 성과와 리스크 변화를 함께 확인해보세요.",
  };
}

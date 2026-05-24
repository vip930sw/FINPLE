import { useMemo, useState } from "react";
import FloatingPortfolioDropdown from "./portfolio/components/FloatingPortfolioDropdown";
import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";
import { normalizeTicker } from "./portfolio/services/assetDataService";
import {
  KR_SCREENER_CANDIDATES,
  US_SCREENER_CANDIDATES,
} from "../data/tickers/screenerCandidateLoader";
import "./ScreenerPage.css";

const MARKET_TABS = [
  { key: "US", label: "미국", status: "운영 중", description: "미국주식·미국 ETF 후보" },
  { key: "KR", label: "한국 Beta", status: "후보 표시", description: "한국주식·국내 ETF 후보" },
];

const GOAL_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "core", label: "초보자/핵심" },
  { value: "growth", label: "성장" },
  { value: "dividend", label: "배당" },
  { value: "defensive", label: "방어/헤지" },
  { value: "aggressive", label: "공격형" },
  { value: "cyclical", label: "경기민감" },
];
const RISK_OPTIONS = [
  { value: "all", label: "전체 위험" },
  { value: "low-medium", label: "낮음~중간" },
  { value: "medium", label: "중간" },
  { value: "medium-high", label: "중간~높음" },
  { value: "high", label: "높음" },
  { value: "very-high", label: "매우 높음" },
];
const TAG_LABEL_MAP = {
  core: "핵심",
  growth: "성장",
  dividend: "배당",
  defensive: "방어",
  aggressive: "공격형",
  cyclical: "경기민감",
  stock: "개별주",
  ETF: "ETF",
  분산: "핵심",
};
const TYPE_OPTIONS = [
  { value: "all", label: "전체", description: "ETF와 개별주를 함께 봅니다." },
  { value: "ETF", label: "ETF", description: "지수·섹터·채권 등 분산형 자산 위주입니다." },
  { value: "stock", label: "개별주", description: "NVDA, AAPL처럼 특정 기업 비중을 직접 확대합니다." },
];
const STYLE_OPTIONS = [
  { key: "all", label: "전체", description: "모든 스타일" },
  { key: "beginner", label: "초보자", description: "초보자 적합 후보" },
  { key: "core-etf", label: "대표 ETF", description: "핵심 지수형 ETF" },
  { key: "dividend", label: "배당", description: "현금흐름형 후보" },
  { key: "growth", label: "성장", description: "성장·기술주 후보" },
  { key: "defensive", label: "방어", description: "채권·금리·헤지 후보" },
  { key: "aggressive", label: "공격형", description: "레버리지·고위험 후보" },
];

function formatPercentValue(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `${numberValue.toFixed(2)}%`;
}
function getGoalLabel(value) { return GOAL_OPTIONS.find((item) => item.value === value)?.label || TAG_LABEL_MAP[value] || value || "-"; }
function getTagLabel(value) { return TAG_LABEL_MAP[value] || value; }
function getRiskLabel(value) { return RISK_OPTIONS.find((item) => item.value === value)?.label || value || "-"; }
function getTypeLabel(type) { return type === "stock" ? "개별주" : type === "ETF" ? "ETF" : "전체"; }
function getStyleLabel(style) { return STYLE_OPTIONS.find((item) => item.key === style)?.label || "전체"; }
function inferExposureType(item = {}) {
  const tags = (item.tags || []).join(" ");
  const name = item.koreanName || "";
  if (item.type === "stock") return "single_stock";
  if (/레버리지|인버스|3배|2배/.test(tags + name)) return "leveraged_inverse";
  if (/채권|장기채|금리/.test(tags + name)) return "bond";
  if (/배당|현금흐름|인컴/.test(tags + name)) return "dividend";
  if (/금|원자재|헤지/.test(tags + name)) return "commodity";
  if (/리츠|부동산/.test(tags + name)) return "reit";
  if (/섹터|헬스케어|반도체|테크/.test(tags + name)) return "sector";
  return "broad_index";
}
function getExposureLabel(item) {
  const exposureType = inferExposureType(item);
  return {
    broad_index: "대표지수/분산",
    sector: "섹터 ETF",
    single_stock: "개별 기업",
    dividend: "배당/인컴",
    bond: "채권형",
    commodity: "원자재/헤지",
    reit: "리츠",
    leveraged_inverse: "레버리지/인버스",
  }[exposureType] || "기타";
}
function getCandidateDescription(item) {
  if (item.type === "stock") return `${item.koreanName} 개별주 후보입니다. 특정 기업 비중이 직접 커질 수 있으므로 집중도를 함께 확인하세요.`;
  return `${item.koreanName} ETF 후보입니다. 여러 종목·섹터를 묶어 노출하는 자산으로, 기초 노출과 중복 비중을 함께 확인하세요.`;
}
function matchesStyleFilter(item, styleFilter) {
  if (styleFilter === "all") return true;
  if (styleFilter === "beginner") return item.beginnerFit;
  if (styleFilter === "core-etf") return item.type === "ETF" && (item.goals?.includes("core") || item.strategy === "core");
  return item.goals?.includes(styleFilter) || item.strategy === styleFilter;
}

function filterCandidates({ candidates, query, styleFilter, riskLevel, type }) {
  const normalizedQuery = normalizeTicker(query).toLowerCase();
  return candidates.filter((item) => {
    const searchable = [item.ticker, item.koreanName, item.type, getTypeLabel(item.type), item.strategy, getGoalLabel(item.strategy), getExposureLabel(item), ...(item.tags || []), ...(item.tags || []).map(getTagLabel)].join(" ").toLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStyle = matchesStyleFilter(item, styleFilter);
    const matchesRisk = riskLevel === "all" || item.riskLevel === riskLevel;
    const matchesType = type === "all" || item.type === type;
    return matchesQuery && matchesStyle && matchesRisk && matchesType;
  });
}

function ScreenerCandidateCard({ item, isAdded, onAdd, canAdd = true }) {
  const isKrCandidate = item.market === "KR";
  const cardClassName = ["tickerResultCard", isAdded ? "added" : "", isKrCandidate ? "krTickerResultCard" : ""].filter(Boolean).join(" ");

  return (
    <article className={cardClassName}>
      <div className="tickerResultMain">
        <div className="tickerResultTitleBlock">
          <strong className="tickerResultTicker">{item.ticker}</strong>
          <span className="tickerResultName" title={item.koreanName}>{item.koreanName}</span>
        </div>
        <button type="button" className={isAdded ? "tickerResultAction added" : "tickerResultAction"} onClick={() => onAdd(item)} disabled={isAdded || !canAdd}>{isAdded ? "추가됨" : canAdd ? "추가" : "준비 중"}</button>
      </div>
      <div className="tickerResultTypeBadge"><span>{getTypeLabel(item.type)}</span><span>{getExposureLabel(item)}</span></div>
      <p className="tickerResultDescription">{getCandidateDescription(item)}</p>
      <div className="tickerResultMetaGrid compact">
        <span>전략 {getGoalLabel(item.strategy)}</span><span>위험 {getRiskLabel(item.riskLevel)}</span><span>CAGR {formatPercentValue(item.expectedCagr)}</span><span>배당 {formatPercentValue(item.dividendYield)}</span><span>MDD {formatPercentValue(item.mdd)}</span><span>초보자 {item.beginnerFit ? "적합" : "주의"}</span>
      </div>
      <div className="tickerTagList compact">{(item.tags || []).slice(0, 4).map((tag) => <span key={`${item.ticker}-${tag}`}>{getTagLabel(tag)}</span>)}</div>
    </article>
  );
}

function MarketTabs({ activeMarket, onChange }) {
  return <div className="screenerMarketTabs" role="tablist" aria-label="자산 스크리너 시장 선택">{MARKET_TABS.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={activeMarket === tab.key} className={activeMarket === tab.key ? "active" : ""} onClick={() => onChange(tab.key)}><strong>{tab.label}</strong><span>{tab.status}</span><small>{tab.description}</small></button>)}</div>;
}

function CandidateScreenerPanel({ market, candidates, assets, addAssetFromTickerCandidate }) {
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("all");
  const [riskLevel, setRiskLevel] = useState("all");
  const [type, setType] = useState("all");
  const [statusText, setStatusText] = useState(`${market === "KR" ? "한국" : "미국"} CSV 후보 ${candidates.length}개를 불러왔습니다.`);
  const addedTickerSet = useMemo(() => new Set((assets || []).map((asset) => normalizeTicker(asset?.ticker)).filter(Boolean)), [assets]);
  const results = useMemo(() => filterCandidates({ candidates, query, styleFilter, riskLevel, type }), [candidates, query, styleFilter, riskLevel, type]);
  const canAdd = market === "US";

  function applyStyle(option) { setStyleFilter(option.key); setStatusText(`${option.label} 스타일 후보를 표시합니다.`); }
  function applyTypeFilter(option) { setType(option.value); setStatusText(`${option.label} 자산군 기준으로 후보를 표시합니다.`); }
  function handleAdd(item) {
    if (!canAdd) { setStatusText("한국 후보의 포트폴리오 추가 기능은 다음 단계에서 연결할 예정입니다."); return; }
    const ticker = normalizeTicker(item?.ticker); if (addedTickerSet.has(ticker)) { setStatusText(`${ticker}는 이미 현재 포트폴리오에 추가되어 있습니다.`); return; } const result = addAssetFromTickerCandidate(item); if (result?.status === "duplicate") { setStatusText(`${ticker}는 이미 현재 포트폴리오에 추가되어 있습니다.`); return; } setStatusText(`${ticker} 후보 자산을 포트폴리오에 추가했습니다. 시뮬레이터에서 비중을 조정하세요.`);
  }

  return (
    <section className="assetFinderPanel">
      <div className="assetFinderHeader"><div><p className="sectionLabel">{market === "KR" ? "KR Asset Finder Beta" : "US Asset Finder"}</p><h4>{market === "KR" ? "한국 ETF / 개별주 후보 탐색" : "미국 ETF / 개별주 후보 탐색"}</h4><p>ETF는 지수·섹터를 묶어 노출하고, 개별주는 특정 기업 비중을 직접 확대합니다. 포트폴리오 방향이 달라지므로 먼저 구분해서 선택하세요.</p></div><div className="assetFinderStatusGroup"><span className="tickerMasterCount">{market === "KR" ? "한국" : "미국"} CSV 후보 {candidates.length}개</span><span className="assetFinderStatus">{statusText}</span></div></div>
      <div className="screenerFilterBlock"><div className="screenerFilterTitle"><span>1차 자산군</span><strong>{getTypeLabel(type)}</strong></div><select className="assetTypeMobileSelect" value={type} onChange={(event) => applyTypeFilter(TYPE_OPTIONS.find((option) => option.value === event.target.value) || TYPE_OPTIONS[0])}>{TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><div className="assetTypeFilterBar" aria-label="ETF와 개별주 구분 필터">{TYPE_OPTIONS.map((option) => <button key={option.value} type="button" className={type === option.value ? "assetTypeFilterButton active" : "assetTypeFilterButton"} onClick={() => applyTypeFilter(option)}><strong>{option.label}</strong><span>{option.description}</span></button>)}</div></div>
      <div className="screenerFilterBlock"><div className="screenerFilterTitle"><span>2차 스타일</span><strong>{getStyleLabel(styleFilter)}</strong></div><div className="assetFinderPresetBar" aria-label="스타일 필터">{STYLE_OPTIONS.map((option) => <button key={option.key} type="button" className={styleFilter === option.key ? "assetFinderPresetButton active" : "assetFinderPresetButton"} onClick={() => applyStyle(option)}><strong>{option.label}</strong><span>{option.description}</span></button>)}</div></div>
      <form className="tickerSearchForm" onSubmit={(event) => event.preventDefault()}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: QQQ, ETF, 개별주, 배당, 나스닥, 삼성전자" /><button type="submit" className="primaryFinderButton">검색</button></form>
      <div className="screenerControls"><label><span>3차 위험도</span><select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>{RISK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>
      {market === "KR" ? <div className="screenerStatusBox"><strong>한국 Beta 안내</strong><p>현재는 CSV 후보 표시 단계입니다. 포트폴리오 추가와 한국 시뮬레이터 계산 로직은 다음 단계에서 연결합니다.</p></div> : null}
      <div className="assetFinderResultToolbar"><span>{results.length > 0 ? `${results.length}개 후보 표시` : "후보 자산 없음"}</span><small>현재 조합: {getTypeLabel(type)} · {getStyleLabel(styleFilter)} · {getRiskLabel(riskLevel)}</small></div>
      <div className="tickerResultGrid compact">{results.length > 0 ? results.map((item) => <ScreenerCandidateCard key={`${market}-${item.ticker}`} item={item} isAdded={addedTickerSet.has(normalizeTicker(item.ticker))} onAdd={handleAdd} canAdd={canAdd} />) : <div className="tickerResultEmpty">조건에 맞는 후보가 없습니다.</div>}</div>
    </section>
  );
}

function ScreenerPage({ onBack, onOpenSimulator }) {
  const { portfolioList, activePortfolioId, activePortfolio, assets, isPortfolioDropdownOpen, setIsPortfolioDropdownOpen, selectPortfolioFromFloating, addAssetFromTickerCandidate, formatNumber, isEmptyAssetRow } = usePortfolioSimulator();
  const [activeMarket, setActiveMarket] = useState("US");
  const activeAssetCount = assets.filter((asset) => !isEmptyAssetRow(asset)).length;
  const activeCandidates = activeMarket === "KR" ? KR_SCREENER_CANDIDATES : US_SCREENER_CANDIDATES;
  return (
    <main className="page screenerPage">
      <header className="header"><button type="button" className="brandLogo resetButton" onClick={onBack}><div className="brandIcon"><span>F</span><i /></div><div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div></button></header>
      <section className="screenerHero"><p className="badge">Asset Screener</p><h1>자산 후보를 먼저 탐색하세요.</h1><p>ETF와 개별주를 구분해 후보를 살펴보고, 필요한 항목만 현재 포트폴리오에 담은 뒤 시뮬레이터에서 비중을 정리할 수 있습니다.</p><div className="screenerSummaryGrid"><article><span>현재 추가 대상</span><strong>{activePortfolio?.name || "포트폴리오"}</strong></article><article><span>현재 자산</span><strong>{activeAssetCount}개</strong></article></div></section>
      <section className="section calculatorSection screenerStandaloneSection"><div className="tabSectionHeader"><p className="sectionLabel">Asset Screener</p><h2>후보 자산을 탐색하고 포트폴리오에 담습니다.</h2><p>QQQ 같은 ETF와 NVDA 같은 개별주는 같은 기술주 노출이라도 분산도와 집중도가 다릅니다. 먼저 자산 유형을 구분해 확인하세요.</p></div><MarketTabs activeMarket={activeMarket} onChange={setActiveMarket} /><CandidateScreenerPanel market={activeMarket} candidates={activeCandidates} assets={assets} addAssetFromTickerCandidate={addAssetFromTickerCandidate} /></section>
      <section className="screenerNextStep" role="note"><div><strong>다음 단계</strong><p>{activeMarket === "US" ? "후보 자산을 담았다면 시뮬레이터에서 ETF 비중, 개별주 비중, 집중도를 함께 점검하세요." : "한국 Beta 후보군은 표시 단계입니다. 포트폴리오 추가와 계산 로직은 다음 단계에서 연결합니다."}</p></div><button type="button" onClick={onOpenSimulator}>{activeMarket === "US" ? "시뮬레이터에서 비중 정리" : "미국 시뮬레이터 열기"}</button></section>
      <FloatingPortfolioDropdown activePortfolio={activePortfolio} portfolioList={portfolioList} activePortfolioId={activePortfolioId} isPortfolioDropdownOpen={isPortfolioDropdownOpen} setIsPortfolioDropdownOpen={setIsPortfolioDropdownOpen} selectPortfolioFromFloating={selectPortfolioFromFloating} contextLabel="현재 추가 대상" />
      <button className="floatingTopButton" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="스크리너 상단으로 이동">↑ TOP</button>
    </main>
  );
}

export default ScreenerPage;
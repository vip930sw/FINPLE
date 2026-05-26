import { useEffect, useMemo, useState } from "react";
import FloatingPortfolioDropdown from "./portfolio/components/FloatingPortfolioDropdown";
import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";
import { normalizeTicker } from "./portfolio/services/assetDataService";
import {
  KR_SCREENER_CANDIDATES,
  US_SCREENER_CANDIDATES,
} from "../data/tickers/screenerCandidateLoader";
import "./ScreenerPage.css";

const MARKET_OPTIONS = [
  { key: "ALL", label: "전체 시장" },
  { key: "US", label: "미국 시장" },
  { key: "KR", label: "한국 시장" },
];
const TYPE_OPTIONS = [
  { value: "all", label: "전체 자산군" },
  { value: "ETF", label: "ETF" },
  { value: "stock", label: "개별주" },
];
const STYLE_OPTIONS = [
  { key: "all", label: "전체 투자 스타일" },
  { key: "beginner", label: "초보자" },
  { key: "dividend", label: "배당형" },
  { key: "growth", label: "성장형" },
  { key: "defensive", label: "방어형" },
  { key: "aggressive", label: "공격형" },
  { key: "leveraged_inverse", label: "레버리지/인버스" },
  { key: "bond", label: "채권" },
  { key: "commodity", label: "원자재" },
  { key: "reit", label: "부동산/리츠" },
  { key: "crypto", label: "가상화폐" },
];
const RISK_OPTIONS = [
  { value: "all", label: "전체 위험" },
  { value: "low-medium", label: "낮음~중간" },
  { value: "medium", label: "중간" },
  { value: "medium-high", label: "중간~높음" },
  { value: "high", label: "높음" },
  { value: "very-high", label: "매우 높음" },
];
const PAGE_SIZE_OPTIONS = [20, 50, 100];
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

const REPRESENTATIVE_TICKERS = {
  US: [
    "SPY", "VOO", "IVV", "VTI", "QQQ", "QQQM", "SCHD", "DIA", "IWM", "TLT", "IEF", "BND", "GLD", "VNQ",
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "BRK.B", "JPM", "UNH", "V", "MA", "XOM", "LLY", "AVGO", "COST", "WMT", "PG", "JNJ", "HD", "KO", "PEP", "O", "T",
  ],
  KR: ["069500", "102110", "148020", "105190", "152100", "278530", "005930", "000660", "373220", "207940", "005380", "035420", "035720", "051910", "006400", "005490", "068270", "055550"],
};
const REPRESENTATIVE_RANK = Object.entries(REPRESENTATIVE_TICKERS).reduce((map, [market, tickers]) => {
  tickers.forEach((ticker, index) => {
    map[`${market}:${ticker}`] = index + 1;
  });
  return map;
}, {});

function getMarketLabel(market) {
  return MARKET_OPTIONS.find((item) => item.key === market)?.label || "전체 시장";
}
function getTypeLabel(type) {
  return TYPE_OPTIONS.find((item) => item.value === type)?.label || "전체 자산군";
}
function getStyleLabel(style) {
  return STYLE_OPTIONS.find((item) => item.key === style)?.label || "전체 투자 스타일";
}
function getRiskLabel(value) {
  return RISK_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}
function getTagLabel(value) {
  return TAG_LABEL_MAP[value] || value;
}
function getGoalLabel(value) {
  return TAG_LABEL_MAP[value] || value || "-";
}
function formatPercentValue(value, pendingText = "확인 중") {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue === 0) return pendingText;
  return `${numberValue.toFixed(2)}%`;
}
function formatMetricNumber(value, pendingText = "-") {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue === 0) return pendingText;
  return numberValue.toFixed(2);
}
function formatDividendYieldValue(value, item = {}) {
  if (item.displayDividendYield) return item.displayDividendYield === "0.00%" ? "-" : item.displayDividendYield;
  if (item.dividendPolicy === "no_dividend") return "-";
  if (item.dividendPolicy === "review_required" || item.reviewTag === "review_required") return "확인 필요";
  return formatPercentValue(value, "확인 중");
}
function formatCompactCurrency(value, market = "US") {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "확인 중";

  if (market === "KR") {
    if (numberValue >= 1_0000_0000_0000) return `${(numberValue / 1_0000_0000_0000).toFixed(1)}조`;
    if (numberValue >= 1_0000_0000) return `${Math.round(numberValue / 1_0000_0000).toLocaleString()}억`;
    return `${Math.round(numberValue).toLocaleString()}원`;
  }

  if (numberValue >= 1_000_000_000_000) return `$${(numberValue / 1_000_000_000_000).toFixed(1)}T`;
  if (numberValue >= 1_000_000_000) return `$${(numberValue / 1_000_000_000).toFixed(1)}B`;
  if (numberValue >= 1_000_000) return `$${(numberValue / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(numberValue).toLocaleString()}`;
}
function formatSizeMetricValue(item = {}) {
  const label = item.type === "ETF" ? "규모" : "시총";
  return `${label} ${formatCompactCurrency(item.sizeMetric, item.market)}`;
}
function getSearchQuery(query = "") {
  return normalizeTicker(query).toLowerCase();
}
function getCandidateTicker(item = {}) {
  return normalizeTicker(item.ticker || "").toLowerCase();
}
function getRepresentativeRank(item = {}) {
  return REPRESENTATIVE_RANK[`${item.market}:${normalizeTicker(item.ticker)}`] || 9999;
}
function getTierRank(item = {}) {
  if (item.tier === "core") return 0;
  if (item.tier === "standard") return 1;
  return 2;
}
function getAssetTypeRank(item = {}) {
  return item.type === "ETF" ? 0 : 1;
}
function getStatusRank(item = {}) {
  if (item.reviewTag === "ready_with_metrics" || item.dataStatus === "ready_with_metrics") return 0;
  if (item.reviewTag === "review_required" || item.dataStatus === "review_required") return 2;
  return 1;
}
function getSizeRank(item = {}) {
  const value = Number(item.sizeMetric || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}
function compareText(a = "", b = "") {
  return String(a || "").localeCompare(String(b || ""), "ko-KR", { numeric: true, sensitivity: "base" });
}
function hasAnyTag(item = {}, tags = []) {
  return tags.some((tag) => (item.tags || []).includes(tag));
}
function getTagText(item = {}) {
  return [item.koreanName, item.strategy, ...(item.tags || [])].join(" ");
}
function inferExposureType(item = {}) {
  const tagText = getTagText(item);
  const name = item.koreanName || "";
  if (item.type === "stock") return "single_stock";
  if (/레버리지|인버스|3배|2배/.test(tagText)) return "leveraged_inverse";
  if (hasAnyTag(item, ["채권", "국고채", "미국채", "회사채", "통안채", "초단기채", "종합채권", "하이일드"]) || /채권|국고채|미국채|회사채|통안채|하이일드/.test(name)) return "bond";
  if (hasAnyTag(item, ["원자재", "금", "원유", "구리", "은", "종합원자재"]) || /금현물|골드|원유|구리|은선물|종합원자재/.test(name)) return "commodity";
  if (/리츠|부동산/.test(tagText + name)) return "reit";
  if (/배당|현금흐름|인컴/.test(tagText)) return "dividend";
  if (/섹터|헬스케어|반도체|테크/.test(tagText + name)) return "sector";
  return "broad_index";
}
function getExposureLabel(item = {}) {
  return {
    broad_index: "대표지수/분산",
    sector: "섹터 ETF",
    single_stock: "개별 기업",
    dividend: "배당/인컴",
    bond: "채권형",
    commodity: "원자재/헤지",
    reit: "리츠",
    leveraged_inverse: "레버리지/인버스",
  }[inferExposureType(item)] || "기타";
}
function getCandidateDescription(item = {}) {
  if (item.type === "stock") return `${item.koreanName} 개별주 후보입니다. 특정 기업 비중이 직접 커질 수 있으므로 집중도를 함께 확인하세요.`;
  return `${item.koreanName} ETF 후보입니다. 여러 종목·섹터를 묶어 노출하는 자산으로, 기초 노출과 중복 비중을 함께 확인하세요.`;
}
function matchesStyleFilter(item, styleFilter) {
  if (styleFilter === "all") return true;
  if (styleFilter === "beginner") return item.beginnerFit;
  const exposureType = inferExposureType(item);
  if (["leveraged_inverse", "bond", "commodity", "reit"].includes(styleFilter)) return exposureType === styleFilter;
  return item.goals?.includes(styleFilter) || item.strategy === styleFilter;
}
function sortCandidates(candidates = [], normalizedQuery = "") {
  return [...candidates].sort((a, b) => {
    const exactDiff = Number(getCandidateTicker(b) === normalizedQuery) - Number(getCandidateTicker(a) === normalizedQuery);
    if (exactDiff) return exactDiff;
    const representativeDiff = getRepresentativeRank(a) - getRepresentativeRank(b);
    if (representativeDiff) return representativeDiff;
    const sizeDiff = getSizeRank(b) - getSizeRank(a);
    if (sizeDiff) return sizeDiff;
    const tierDiff = getTierRank(a) - getTierRank(b);
    if (tierDiff) return tierDiff;
    const typeDiff = getAssetTypeRank(a) - getAssetTypeRank(b);
    if (typeDiff) return typeDiff;
    const statusDiff = getStatusRank(a) - getStatusRank(b);
    if (statusDiff) return statusDiff;
    return compareText(a.ticker, b.ticker);
  });
}
function filterCandidates({ candidates, query, styleFilter, riskLevel, type }) {
  const normalizedQuery = getSearchQuery(query);
  const filtered = candidates.filter((item) => {
    const searchable = [
      item.ticker,
      item.koreanName,
      item.market,
      getMarketLabel(item.market),
      item.type,
      getTypeLabel(item.type),
      item.strategy,
      getGoalLabel(item.strategy),
      getExposureLabel(item),
      ...(item.tags || []),
      ...(item.tags || []).map(getTagLabel),
    ].join(" ").toLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStyle = matchesStyleFilter(item, styleFilter);
    const matchesRisk = riskLevel === "all" || item.riskLevel === riskLevel;
    const matchesType = type === "all" || item.type === type;
    return matchesQuery && matchesStyle && matchesRisk && matchesType;
  });
  return sortCandidates(filtered, normalizedQuery);
}
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  return Array.from(new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]))
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

function ScreenerCandidateCard({ item, isAdded, onAdd, canAdd = true }) {
  const cardClassName = ["tickerResultCard", isAdded ? "added" : "", item.market === "KR" ? "krTickerResultCard" : ""].filter(Boolean).join(" ");
  return (
    <article className={cardClassName}>
      <div className="tickerResultMain">
        <div className="tickerResultTitleBlock"><strong className="tickerResultTicker">{item.ticker}</strong><span className="tickerResultName" title={item.koreanName}>{item.koreanName}</span></div>
        <button type="button" className={isAdded ? "tickerResultAction added" : "tickerResultAction"} onClick={() => onAdd(item)} disabled={isAdded || !canAdd}>{isAdded ? "추가됨" : canAdd ? "추가" : "준비 중"}</button>
      </div>
      <div className="tickerResultTypeBadge"><span>{getMarketLabel(item.market)}</span><span>{getTypeLabel(item.type)}</span><span>{getExposureLabel(item)}</span></div>
      <p className="tickerResultDescription">{getCandidateDescription(item)}</p>
      <div className="tickerResultMetaGrid compact"><span>CAGR {formatPercentValue(item.expectedCagr, "-")}</span><span>BETA {formatMetricNumber(item.beta)}</span><span>MDD {formatPercentValue(item.mdd, "-")}</span><span>배당 {formatDividendYieldValue(item.dividendYield, item)}</span><span>{formatSizeMetricValue(item)}</span><span>위험 {getRiskLabel(item.riskLevel)}</span></div>
      <div className="tickerTagList compact">{(item.tags || []).slice(0, 4).map((tag) => <span key={`${item.ticker}-${tag}`}>{getTagLabel(tag)}</span>)}</div>
    </article>
  );
}

function CandidateScreenerPanel({ market, onMarketChange, candidates, assets, addAssetFromTickerCandidate }) {
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("all");
  const [riskLevel, setRiskLevel] = useState("all");
  const [type, setType] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusText, setStatusText] = useState(`${getMarketLabel(market)} CSV 후보 ${candidates.length}개를 불러왔습니다.`);
  const addedTickerSet = useMemo(() => new Set((assets || []).map((asset) => normalizeTicker(asset?.ticker)).filter(Boolean)), [assets]);
  const results = useMemo(() => filterCandidates({ candidates, query, styleFilter, riskLevel, type }), [candidates, query, styleFilter, riskLevel, type]);
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = results.length > 0 ? (safeCurrentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, results.length);
  const pagedResults = useMemo(() => results.slice(startIndex, endIndex), [results, startIndex, endIndex]);
  const pageNumbers = useMemo(() => getPageNumbers(safeCurrentPage, totalPages), [safeCurrentPage, totalPages]);
  useEffect(() => { setCurrentPage(1); }, [market, query, styleFilter, riskLevel, type, pageSize]);

  function handleAdd(item) {
    const ticker = normalizeTicker(item?.ticker);
    if (addedTickerSet.has(ticker)) { setStatusText(`${ticker}는 이미 현재 포트폴리오에 추가되어 있습니다.`); return; }
    const result = addAssetFromTickerCandidate(item);
    if (result?.status !== "success") { setStatusText(result?.message || `${ticker} 후보 자산을 추가하지 못했습니다.`); return; }
    setStatusText(`${ticker} 후보 자산을 포트폴리오에 추가했습니다.${item.market === "KR" ? " 한국 후보는 현재가와 지표를 수동값으로 먼저 점검해 주세요." : " 시뮬레이터에서 비중을 조정하세요."}`);
  }

  return (
    <section className="assetFinderPanel">
      <div className="assetFinderHeader"><div><p className="sectionLabel">Asset Finder</p><h4>{getMarketLabel(market)} ETF / 개별주 후보 탐색</h4><p>ETF는 지수·섹터를 묶어 노출하고, 개별주는 특정 기업 비중을 직접 확대합니다. 포트폴리오 방향이 달라지므로 시장과 자산군을 먼저 구분해서 선택하세요.</p></div><div className="assetFinderStatusGroup"><span className="tickerMasterCount">{getMarketLabel(market)} CSV 후보 {candidates.length}개</span><span className="assetFinderStatus">{statusText}</span></div></div>
      <div className="screenerFilterGrid" aria-label="스크리너 필터">
        <label className="screenerFilterSelectLabel"><span>1차 시장</span><select value={market} onChange={(event) => onMarketChange(event.target.value)}>{MARKET_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
        <label className="screenerFilterSelectLabel"><span>2차 자산군</span><select value={type} onChange={(event) => { setType(event.target.value); setStatusText(`${getTypeLabel(event.target.value)} 기준으로 후보를 표시합니다.`); }}>{TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="screenerFilterSelectLabel"><span>3차 투자 스타일</span><select value={styleFilter} onChange={(event) => { setStyleFilter(event.target.value); setStatusText(`${getStyleLabel(event.target.value)} 후보를 표시합니다.`); }}>{STYLE_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
        <label className="screenerFilterSelectLabel"><span>4차 위험도</span><select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>{RISK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </div>
      <form className="tickerSearchForm" onSubmit={(event) => event.preventDefault()}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: QQQ, O, T, ETF, 배당, 삼성전자" /><button type="submit" className="primaryFinderButton">검색</button></form>
      <div className="assetFinderResultToolbar paged"><div><span>{results.length > 0 ? `${results.length}개 후보 중 ${startIndex + 1}-${endIndex} 표시` : "후보 자산 없음"}</span><small>현재 조합: {getMarketLabel(market)} · {getTypeLabel(type)} · {getStyleLabel(styleFilter)} · {getRiskLabel(riskLevel)}</small></div><label className="pageSizeSelector"><span>표시 개수</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setStatusText(`${event.target.value}개씩 후보를 표시합니다.`); }}>{PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}개</option>)}</select></label></div>
      <div className="tickerResultGrid compact">{pagedResults.length > 0 ? pagedResults.map((item) => <ScreenerCandidateCard key={`${item.market}-${item.ticker}`} item={item} isAdded={addedTickerSet.has(normalizeTicker(item.ticker))} onAdd={handleAdd} canAdd />) : <div className="tickerResultEmpty">조건에 맞는 후보가 없습니다.</div>}</div>
      {results.length > pageSize ? <nav className="screenerPagination" aria-label="스크리너 페이지 이동"><button type="button" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage <= 1}>처음</button><button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>이전</button><div className="screenerPageNumbers">{pageNumbers.map((page, index) => { const previousPage = pageNumbers[index - 1]; const showEllipsis = previousPage && page - previousPage > 1; return <span key={page} className="pageNumberWrap">{showEllipsis ? <i>...</i> : null}<button type="button" className={page === safeCurrentPage ? "active" : ""} onClick={() => setCurrentPage(page)} aria-current={page === safeCurrentPage ? "page" : undefined}>{page}</button></span>; })}</div><button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage >= totalPages}>다음</button><button type="button" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage >= totalPages}>끝</button></nav> : null}
    </section>
  );
}

function ScreenerPage({ onBack, onOpenSimulator }) {
  const { portfolioList, activePortfolioId, activePortfolio, assets, isPortfolioDropdownOpen, setIsPortfolioDropdownOpen, selectPortfolioFromFloating, addAssetFromTickerCandidate, isEmptyAssetRow } = usePortfolioSimulator();
  const [activeMarket, setActiveMarket] = useState("ALL");
  const activeAssetCount = assets.filter((asset) => !isEmptyAssetRow(asset)).length;
  const activeCandidates = activeMarket === "KR" ? KR_SCREENER_CANDIDATES : activeMarket === "US" ? US_SCREENER_CANDIDATES : [...US_SCREENER_CANDIDATES, ...KR_SCREENER_CANDIDATES];
  const hasMixedMarketAssets = assets.some((asset) => asset?.market === "US" && !isEmptyAssetRow(asset)) && assets.some((asset) => asset?.market === "KR" && !isEmptyAssetRow(asset));
  return (
    <main className="page screenerPage">
      <header className="header"><button type="button" className="brandLogo resetButton" onClick={onBack}><div className="brandIcon"><span>F</span><i /></div><div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div></button></header>
      <section className="screenerHero"><p className="badge">Asset Screener</p><h1>자산 후보를 먼저 탐색하세요.</h1><p>ETF와 개별주를 구분해 후보를 살펴보고, 필요한 항목만 현재 포트폴리오에 담은 뒤 시뮬레이터에서 비중을 정리할 수 있습니다.</p><div className="screenerSummaryGrid"><article><span>현재 추가 대상</span><strong>{activePortfolio?.name || "포트폴리오"}</strong></article><article><span>현재 자산</span><strong>{activeAssetCount}개</strong></article><button type="button" className="screenerSummaryActionCard" onClick={onOpenSimulator}><span>포트폴리오로 이동</span><strong>비중 정리</strong><i aria-hidden="true">▶</i></button></div>{hasMixedMarketAssets ? <p className="screenerMetricNotice">미국 자산은 달러 기준, 한국 자산은 원화 기준 지표일 수 있습니다. 혼합 포트폴리오의 BETA는 시장별 기준 차이를 감안해 해석해 주세요.</p> : null}</section>
      <section className="section calculatorSection screenerStandaloneSection"><div className="tabSectionHeader"><p className="sectionLabel">Asset Screener</p><h2>후보 자산을 탐색하고 포트폴리오에 담습니다.</h2><p>QQQ 같은 ETF와 NVDA 같은 개별주는 같은 기술주 노출이라도 분산도와 집중도가 다릅니다. 먼저 시장과 자산 유형을 구분해 확인하세요.</p></div><CandidateScreenerPanel key={activeMarket} market={activeMarket} onMarketChange={setActiveMarket} candidates={activeCandidates} assets={assets} addAssetFromTickerCandidate={addAssetFromTickerCandidate} /></section>
      <FloatingPortfolioDropdown activePortfolio={activePortfolio} portfolioList={portfolioList} activePortfolioId={activePortfolioId} isPortfolioDropdownOpen={isPortfolioDropdownOpen} setIsPortfolioDropdownOpen={setIsPortfolioDropdownOpen} selectPortfolioFromFloating={selectPortfolioFromFloating} contextLabel="현재 추가 대상" />
      <button className="floatingTopButton" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="스크리너 상단으로 이동">↑ TOP</button>
    </main>
  );
}

export default ScreenerPage;

import { useMemo, useState } from "react";
import FloatingPortfolioDropdown from "./portfolio/components/FloatingPortfolioDropdown";
import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";
import { normalizeTicker } from "./portfolio/services/assetDataService";
import "./ScreenerPage.css";

const SCREENER_CANDIDATES = [
  { ticker: "VOO", koreanName: "미국 S&P500 대표 ETF", type: "ETF", strategy: "core", riskLevel: "medium", expectedCagr: 7.5, beta: 1.0, mdd: -34, dividendYield: 1.4, goals: ["core", "growth"], beginnerFit: true, tags: ["미국", "대표지수", "분산"] },
  { ticker: "QQQ", koreanName: "나스닥100 성장 ETF", type: "ETF", strategy: "growth", riskLevel: "medium-high", expectedCagr: 9.5, beta: 1.18, mdd: -35, dividendYield: 0.7, goals: ["core", "growth"], beginnerFit: true, tags: ["성장", "테크", "나스닥"] },
  { ticker: "SCHD", koreanName: "배당성장 대표 ETF", type: "ETF", strategy: "dividend", riskLevel: "medium", expectedCagr: 7.0, beta: 0.85, mdd: -25, dividendYield: 3.5, goals: ["core", "dividend"], beginnerFit: true, tags: ["배당", "가치", "현금흐름"] },
  { ticker: "VT", koreanName: "전세계 주식 ETF", type: "ETF", strategy: "core", riskLevel: "medium", expectedCagr: 6.5, beta: 0.95, mdd: -32, dividendYield: 2.0, goals: ["core"], beginnerFit: true, tags: ["전세계", "분산", "장기"] },
  { ticker: "BND", koreanName: "미국 종합채권 ETF", type: "ETF", strategy: "defensive", riskLevel: "low-medium", expectedCagr: 3.5, beta: 0.15, mdd: -13, dividendYield: 3.2, goals: ["defensive", "core"], beginnerFit: true, tags: ["채권", "방어", "분산"] },
  { ticker: "TLT", koreanName: "미국 장기채 ETF", type: "ETF", strategy: "defensive", riskLevel: "medium", expectedCagr: 4.0, beta: 0.25, mdd: -20, dividendYield: 3.8, goals: ["defensive"], beginnerFit: false, tags: ["장기채", "금리", "헤지"] },
  { ticker: "GLD", koreanName: "금 ETF", type: "ETF", strategy: "defensive", riskLevel: "low-medium", expectedCagr: 5.0, beta: 0.15, mdd: -18, dividendYield: 0, goals: ["defensive"], beginnerFit: true, tags: ["금", "헤지", "대체자산"] },
  { ticker: "VNQ", koreanName: "미국 리츠 ETF", type: "ETF", strategy: "dividend", riskLevel: "medium-high", expectedCagr: 5.5, beta: 0.75, mdd: -30, dividendYield: 4.0, goals: ["dividend", "defensive"], beginnerFit: false, tags: ["리츠", "부동산", "인컴"] },
  { ticker: "VIG", koreanName: "배당성장 ETF", type: "ETF", strategy: "dividend", riskLevel: "medium", expectedCagr: 7.0, beta: 0.85, mdd: -25, dividendYield: 1.8, goals: ["dividend", "core"], beginnerFit: true, tags: ["배당성장", "퀄리티"] },
  { ticker: "XLV", koreanName: "미국 헬스케어 ETF", type: "ETF", strategy: "defensive", riskLevel: "medium", expectedCagr: 6.5, beta: 0.75, mdd: -24, dividendYield: 1.5, goals: ["defensive", "growth"], beginnerFit: false, tags: ["헬스케어", "방어", "섹터"] },
  { ticker: "NVDA", koreanName: "엔비디아", type: "stock", strategy: "growth", riskLevel: "very-high", expectedCagr: 12.0, beta: 1.8, mdd: -65, dividendYield: 0.1, goals: ["growth", "aggressive"], beginnerFit: false, tags: ["AI", "반도체", "고성장"] },
  { ticker: "MSFT", koreanName: "마이크로소프트", type: "stock", strategy: "growth", riskLevel: "medium-high", expectedCagr: 9.0, beta: 1.05, mdd: -37, dividendYield: 0.8, goals: ["growth", "core"], beginnerFit: false, tags: ["AI", "클라우드", "우량주"] },
  { ticker: "AAPL", koreanName: "애플", type: "stock", strategy: "core", riskLevel: "medium-high", expectedCagr: 8.0, beta: 1.1, mdd: -39, dividendYield: 0.5, goals: ["core", "growth"], beginnerFit: false, tags: ["대형주", "브랜드", "테크"] },
  { ticker: "BRK.B", koreanName: "버크셔 해서웨이 B", type: "stock", strategy: "core", riskLevel: "medium", expectedCagr: 7.0, beta: 0.85, mdd: -30, dividendYield: 0, goals: ["core", "defensive"], beginnerFit: false, tags: ["가치", "복합기업", "방어"] },
  { ticker: "TQQQ", koreanName: "나스닥100 3배 레버리지 ETF", type: "ETF", strategy: "aggressive", riskLevel: "very-high", expectedCagr: 14.0, beta: 3.2, mdd: -85, dividendYield: 0, goals: ["aggressive"], beginnerFit: false, tags: ["레버리지", "고위험", "단기"] },
];

const GOAL_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "core", label: "초보자/핵심" },
  { value: "growth", label: "성장" },
  { value: "dividend", label: "배당" },
  { value: "defensive", label: "방어/헤지" },
  { value: "aggressive", label: "공격형" },
];

const RISK_OPTIONS = [
  { value: "all", label: "전체 위험" },
  { value: "low-medium", label: "낮음~중간" },
  { value: "medium", label: "중간" },
  { value: "medium-high", label: "중간~높음" },
  { value: "high", label: "높음" },
  { value: "very-high", label: "매우 높음" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "전체 유형" },
  { value: "ETF", label: "ETF" },
  { value: "stock", label: "주식" },
];

const PRESET_OPTIONS = [
  { key: "beginner", label: "초보자 추천", description: "핵심·대표 자산 우선", goal: "core", riskLevel: "all", type: "all", beginnerOnly: true },
  { key: "core-etf", label: "미국 대표 ETF", description: "분산형 ETF 중심", goal: "core", riskLevel: "all", type: "ETF", beginnerOnly: true },
  { key: "dividend", label: "배당 ETF", description: "현금흐름형 후보", goal: "dividend", riskLevel: "all", type: "ETF", beginnerOnly: false },
  { key: "growth", label: "성장형", description: "성장·기술주 후보", goal: "growth", riskLevel: "all", type: "all", beginnerOnly: false },
  { key: "defensive", label: "방어형", description: "채권·금·헤지 후보", goal: "defensive", riskLevel: "all", type: "all", beginnerOnly: false },
  { key: "aggressive", label: "공격형", description: "레버리지·고위험 후보", goal: "aggressive", riskLevel: "all", type: "all", beginnerOnly: false },
];

function formatPercentValue(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `${numberValue.toFixed(2)}%`;
}

function getRiskLabel(value) {
  const option = RISK_OPTIONS.find((item) => item.value === value);
  return option?.label || value || "-";
}

function filterCandidates({ query, goal, riskLevel, type, beginnerOnly }) {
  const normalizedQuery = normalizeTicker(query).toLowerCase();

  return SCREENER_CANDIDATES.filter((item) => {
    const matchesQuery = !normalizedQuery || [
      item.ticker,
      item.koreanName,
      item.type,
      item.strategy,
      ...(item.tags || []),
    ].join(" ").toLowerCase().includes(normalizedQuery);
    const matchesGoal = goal === "all" || item.goals?.includes(goal);
    const matchesRisk = riskLevel === "all" || item.riskLevel === riskLevel;
    const matchesType = type === "all" || item.type === type;
    const matchesBeginner = !beginnerOnly || item.beginnerFit;
    return matchesQuery && matchesGoal && matchesRisk && matchesType && matchesBeginner;
  });
}

function ScreenerCandidateCard({ item, isAdded, onAdd }) {
  return (
    <article className={isAdded ? "tickerResultCard added" : "tickerResultCard"}>
      <div className="tickerResultMain">
        <div>
          <strong>{item.ticker}</strong>
          <span title={item.koreanName}>{item.koreanName}</span>
        </div>
        <button
          type="button"
          className={isAdded ? "tickerResultAction added" : "tickerResultAction"}
          onClick={() => onAdd(item)}
          disabled={isAdded}
        >
          {isAdded ? "추가됨" : "추가"}
        </button>
      </div>
      <p className="tickerResultDescription">
        {item.koreanName} 후보 자산입니다. 시뮬레이터에서 수량과 현재가를 확인하세요.
      </p>
      <div className="tickerResultMetaGrid compact">
        <span>유형 {item.type}</span>
        <span>전략 {item.strategy}</span>
        <span>위험 {getRiskLabel(item.riskLevel)}</span>
        <span>CAGR {formatPercentValue(item.expectedCagr)}</span>
        <span>배당 {formatPercentValue(item.dividendYield)}</span>
        <span>MDD {formatPercentValue(item.mdd)}</span>
      </div>
      <div className="tickerTagList compact">
        {(item.tags || []).slice(0, 4).map((tag) => <span key={`${item.ticker}-${tag}`}>{tag}</span>)}
      </div>
    </article>
  );
}

function LocalScreenerPanel({ assets, addAssetFromTickerCandidate }) {
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("core");
  const [riskLevel, setRiskLevel] = useState("all");
  const [type, setType] = useState("all");
  const [beginnerOnly, setBeginnerOnly] = useState(true);
  const [activePresetKey, setActivePresetKey] = useState("beginner");
  const [statusText, setStatusText] = useState("기본 후보 데이터로 초보자용 핵심 자산을 먼저 보여드립니다.");

  const addedTickerSet = useMemo(() => new Set((assets || []).map((asset) => normalizeTicker(asset?.ticker)).filter(Boolean)), [assets]);
  const results = useMemo(() => filterCandidates({ query, goal, riskLevel, type, beginnerOnly }), [query, goal, riskLevel, type, beginnerOnly]);

  function applyPreset(preset) {
    setActivePresetKey(preset.key);
    setQuery("");
    setGoal(preset.goal);
    setRiskLevel(preset.riskLevel);
    setType(preset.type);
    setBeginnerOnly(preset.beginnerOnly);
    setStatusText(`${preset.label} 조건을 적용했습니다.`);
  }

  function handleAdd(item) {
    const ticker = normalizeTicker(item?.ticker);
    if (addedTickerSet.has(ticker)) {
      setStatusText(`${ticker}는 이미 현재 포트폴리오에 추가되어 있습니다.`);
      return;
    }
    const result = addAssetFromTickerCandidate(item);
    if (result?.status === "duplicate") {
      setStatusText(`${ticker}는 이미 현재 포트폴리오에 추가되어 있습니다.`);
      return;
    }
    setStatusText(`${ticker} 후보 자산을 포트폴리오에 추가했습니다. 시뮬레이터에서 수량을 입력하세요.`);
  }

  return (
    <section className="assetFinderPanel">
      <div className="assetFinderHeader">
        <div>
          <p className="sectionLabel">Asset Finder</p>
          <h4>티커 검색 / 초보자용 스크리닝</h4>
          <p>현재는 베타 안정성을 위해 기본 후보 데이터로 먼저 표시합니다.</p>
        </div>
        <div className="assetFinderStatusGroup">
          <span className="tickerMasterCount">기본 후보 {SCREENER_CANDIDATES.length}개</span>
          <span className="assetFinderStatus">{statusText}</span>
        </div>
      </div>

      <div className="assetFinderPresetBar" aria-label="추천 프리셋">
        {PRESET_OPTIONS.map((preset) => (
          <button key={preset.key} type="button" className={activePresetKey === preset.key ? "assetFinderPresetButton active" : "assetFinderPresetButton"} onClick={() => applyPreset(preset)}>
            <strong>{preset.label}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>

      <form className="tickerSearchForm" onSubmit={(event) => event.preventDefault()}>
        <input value={query} onChange={(event) => { setQuery(event.target.value); setActivePresetKey(null); }} placeholder="예: QQQ, 배당, 나스닥, 장기채, 엔비디아" />
        <select value={type} onChange={(event) => { setType(event.target.value); setActivePresetKey(null); }}>
          {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button type="button" onClick={() => setStatusText(`조건에 맞는 후보 ${results.length}개를 표시합니다.`)}>검색</button>
      </form>

      <div className="screenerControls">
        <select value={goal} onChange={(event) => { setGoal(event.target.value); setActivePresetKey(null); }}>
          {GOAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select value={riskLevel} onChange={(event) => { setRiskLevel(event.target.value); setActivePresetKey(null); }}>
          {RISK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label className="beginnerOnlyToggle">
          <input type="checkbox" checked={beginnerOnly} onChange={(event) => { setBeginnerOnly(event.target.checked); setActivePresetKey(null); }} />
          초보자 적합 우선
        </label>
        <button type="button" className="secondaryFinderButton" onClick={() => setStatusText(`조건에 맞는 후보 ${results.length}개를 표시합니다.`)}>조건 적용</button>
      </div>

      <div className="assetFinderResultToolbar">
        <span>{results.length > 0 ? `${results.length}개 후보 표시` : "후보 자산 없음"}</span>
        <small>이미 담긴 티커는 <b>추가됨</b>으로 표시되어 중복 추가되지 않습니다.</small>
      </div>

      <div className="tickerResultGrid compact">
        {results.length > 0 ? (
          results.map((item) => <ScreenerCandidateCard key={item.ticker} item={item} isAdded={addedTickerSet.has(normalizeTicker(item.ticker))} onAdd={handleAdd} />)
        ) : (
          <div className="tickerResultEmpty">조건에 맞는 후보가 없습니다.</div>
        )}
      </div>
    </section>
  );
}

function ScreenerPage({ onBack, onHome, onOpenSimulator }) {
  const {
    portfolioList,
    activePortfolioId,
    activePortfolio,
    assets,
    assetLookupSummary,
    recentlyAddedAssetId,
    isPortfolioDropdownOpen,
    setIsPortfolioDropdownOpen,
    selectPortfolioFromFloating,
    addAssetFromTickerCandidate,
    formatNumber,
    isEmptyAssetRow,
  } = usePortfolioSimulator();

  const activeAssetCount = assets.filter((asset) => !isEmptyAssetRow(asset)).length;
  const activePortfolioValue = assets.reduce((sum, asset) => sum + Number(asset.price || 0) * Number(asset.quantity || 0), 0);

  return (
    <main className="page screenerPage">
      <header className="header">
        <button type="button" className="brandLogo resetButton" onClick={onBack}>
          <div className="brandIcon"><span>F</span><i /></div>
          <div className="brandText"><strong>FINPLE</strong><span>Asset Screener</span></div>
        </button>
        <div className="headerActions">
          <button type="button" className="secondaryHeaderButton" onClick={onBack}>시작 메뉴</button>
          <button type="button" className="secondaryHeaderButton" onClick={onOpenSimulator}>시뮬레이터</button>
          <button type="button" className="headerButton" onClick={onHome}>홈으로</button>
        </div>
      </header>

      <section className="screenerHero">
        <p className="badge">Separate Asset Screener</p>
        <h1>자산 후보를 먼저 탐색하세요.</h1>
        <p>스크리너는 시뮬레이터 입력 화면과 분리된 탐색 공간입니다. ETF와 자산 후보를 먼저 찾아보고, 필요한 항목만 현재 포트폴리오에 담은 뒤 시뮬레이터에서 수량과 비중을 정리할 수 있습니다.</p>
        <div className="screenerSummaryGrid">
          <article><span>현재 추가 대상</span><strong>{activePortfolio?.name || "포트폴리오"}</strong></article>
          <article><span>현재 자산</span><strong>{activeAssetCount}개</strong></article>
          <article><span>평가금액</span><strong>{formatNumber(activePortfolioValue)}원</strong></article>
        </div>
      </section>

      <section className="section calculatorSection screenerStandaloneSection">
        <div className="tabSectionHeader">
          <p className="sectionLabel">Asset Screener</p>
          <h2>후보 자산을 탐색하고 포트폴리오에 담습니다.</h2>
          <p>추가한 자산은 현재 선택된 포트폴리오에 저장됩니다. 수량, 현재가, CAGR, BETA, MDD 등은 시뮬레이터 화면에서 이어서 정리하면 됩니다.</p>
        </div>
        <div className="screenerStatusBox">
          <strong>최근 상태</strong>
          <p>{assetLookupSummary}</p>
          {recentlyAddedAssetId ? <span>방금 추가한 후보 자산이 있습니다.</span> : null}
        </div>
        <LocalScreenerPanel assets={assets} addAssetFromTickerCandidate={addAssetFromTickerCandidate} />
      </section>

      <section className="screenerNextStep" role="note">
        <div><strong>다음 단계</strong><p>후보 자산을 담았다면 시뮬레이터에서 수량과 투자 조건을 입력하고 장기 성과를 확인하세요.</p></div>
        <button type="button" onClick={onOpenSimulator}>시뮬레이터에서 비중 정리</button>
      </section>

      <FloatingPortfolioDropdown activePortfolio={activePortfolio} portfolioList={portfolioList} activePortfolioId={activePortfolioId} isPortfolioDropdownOpen={isPortfolioDropdownOpen} setIsPortfolioDropdownOpen={setIsPortfolioDropdownOpen} selectPortfolioFromFloating={selectPortfolioFromFloating} contextLabel="현재 추가 대상" />
      <button className="floatingTopButton" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="스크리너 상단으로 이동">↑ TOP</button>
    </main>
  );
}

export default ScreenerPage;

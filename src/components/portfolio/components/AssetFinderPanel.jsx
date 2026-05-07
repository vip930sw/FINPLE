import { useEffect, useMemo, useState } from "react";

import {
  normalizeTicker,
  screenTickerCandidates,
  searchTickerCandidates,
} from "../services/assetDataService";

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
  {
    key: "beginner",
    label: "초보자 추천",
    description: "핵심·대표 자산 우선",
    goal: "core",
    riskLevel: "all",
    type: "all",
    beginnerOnly: true,
  },
  {
    key: "core-etf",
    label: "미국 대표 ETF",
    description: "분산형 ETF 중심",
    goal: "core",
    riskLevel: "all",
    type: "ETF",
    beginnerOnly: true,
  },
  {
    key: "dividend",
    label: "배당 ETF",
    description: "현금흐름형 후보",
    goal: "dividend",
    riskLevel: "all",
    type: "ETF",
    beginnerOnly: false,
  },
  {
    key: "growth",
    label: "성장형",
    description: "성장·기술주 후보",
    goal: "growth",
    riskLevel: "all",
    type: "all",
    beginnerOnly: false,
  },
  {
    key: "defensive",
    label: "방어형",
    description: "채권·금·헤지 후보",
    goal: "defensive",
    riskLevel: "all",
    type: "all",
    beginnerOnly: false,
  },
  {
    key: "aggressive",
    label: "공격형",
    description: "레버리지·고위험 후보",
    goal: "aggressive",
    riskLevel: "all",
    type: "all",
    beginnerOnly: false,
  },
];

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_COUNT = 12;
const REQUEST_LIMIT = 72;

function formatPercentValue(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `${numberValue.toFixed(2)}%`;
}

function getRiskLabel(value) {
  const option = RISK_OPTIONS.find((item) => item.value === value);
  return option?.label || value || "-";
}

function TickerResultCard({ item, isAdded, onAdd }) {
  const displayName = item.koreanName || item.name || item.ticker;

  return (
    <article className={isAdded ? "tickerResultCard added" : "tickerResultCard"}>
      <div className="tickerResultMain">
        <div>
          <strong>{item.ticker}</strong>
          <span title={displayName}>{displayName}</span>
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
        {item.description || item.name || "티커 마스터에 등록된 후보 자산입니다."}
      </p>

      <div className="tickerResultMetaGrid compact">
        <span>유형 {item.type || "-"}</span>
        <span>전략 {item.strategy || "-"}</span>
        <span>위험 {getRiskLabel(item.riskLevel)}</span>
        <span>CAGR {formatPercentValue(item.expectedCagr)}</span>
        <span>배당 {formatPercentValue(item.dividendYield)}</span>
        <span>MDD {formatPercentValue(item.mdd)}</span>
      </div>

      <div className="tickerTagList compact">
        {(item.tags || []).slice(0, 4).map((tag) => (
          <span key={`${item.ticker}-${tag}`}>{tag}</span>
        ))}
      </div>
    </article>
  );
}

export default function AssetFinderPanel({
  assets = [],
  addAssetFromTickerCandidate,
  isBulkAssetLookupLoading,
}) {
  const [activeMode, setActiveMode] = useState("screener");
  const [activePresetKey, setActivePresetKey] = useState("beginner");
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("core");
  const [riskLevel, setRiskLevel] = useState("all");
  const [type, setType] = useState("all");
  const [beginnerOnly, setBeginnerOnly] = useState(true);
  const [results, setResults] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [masterCounts, setMasterCounts] = useState(null);
  const [statusText, setStatusText] = useState("초보자용 핵심 후보를 먼저 보여드립니다.");
  const [isLoading, setIsLoading] = useState(false);

  const hasQuery = query.trim().length > 0;

  const addedTickerSet = useMemo(() => {
    return new Set(
      (assets || [])
        .map((asset) => normalizeTicker(asset?.ticker))
        .filter(Boolean)
    );
  }, [assets]);

  const visibleResults = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount]
  );

  const hiddenResultCount = Math.max(results.length - visibleResults.length, 0);

  const emptyText = useMemo(() => {
    if (isLoading) return "검색 중입니다.";
    if (activeMode === "search" && !hasQuery) {
      return "티커, 자산명, 키워드를 입력하거나 추천 프리셋을 선택하세요.";
    }
    return "조건에 맞는 후보가 없습니다.";
  }, [activeMode, hasQuery, isLoading]);

  useEffect(() => {
    applyPreset(PRESET_OPTIONS[0]);
    // 최초 1회만 추천 후보를 보여줍니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetVisibleResults() {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  async function runSearch(event) {
    event?.preventDefault();

    if (!hasQuery) {
      setResults([]);
      resetVisibleResults();
      setStatusText("티커, 자산명, 키워드를 입력해주세요.");
      return;
    }

    setActiveMode("search");
    setActivePresetKey(null);
    setIsLoading(true);
    setStatusText("티커 검색 중...");

    try {
      const payload = await searchTickerCandidates({
        query,
        type,
        limit: REQUEST_LIMIT,
      });
      const nextResults = payload.results || [];

      setMasterCounts(payload.filters?.counts || null);
      setResults(nextResults);
      resetVisibleResults();
      setStatusText(`검색 결과 ${nextResults.length}개 중 ${Math.min(INITIAL_VISIBLE_COUNT, nextResults.length)}개 표시`);
    } catch (error) {
      setResults([]);
      resetVisibleResults();
      setStatusText(error?.message || "티커 검색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function runScreener(nextOverrides = {}) {
    const nextGoal = nextOverrides.goal ?? goal;
    const nextRiskLevel = nextOverrides.riskLevel ?? riskLevel;
    const nextType = nextOverrides.type ?? type;
    const nextBeginnerOnly = nextOverrides.beginnerOnly ?? beginnerOnly;

    setActiveMode("screener");
    setIsLoading(true);
    setStatusText("스크리닝 중...");

    try {
      const payload = await screenTickerCandidates({
        goal: nextGoal,
        riskLevel: nextRiskLevel,
        type: nextType,
        beginnerOnly: nextBeginnerOnly,
        limit: REQUEST_LIMIT,
      });
      const nextResults = payload.results || [];

      setMasterCounts(payload.filters?.counts || null);
      setResults(nextResults);
      resetVisibleResults();
      setStatusText(`스크리닝 결과 ${nextResults.length}개 중 ${Math.min(INITIAL_VISIBLE_COUNT, nextResults.length)}개 표시`);
    } catch (error) {
      setResults([]);
      resetVisibleResults();
      setStatusText(error?.message || "스크리닝에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyPreset(preset) {
    if (!preset) return;

    setActivePresetKey(preset.key);
    setQuery("");
    setGoal(preset.goal);
    setRiskLevel(preset.riskLevel);
    setType(preset.type);
    setBeginnerOnly(preset.beginnerOnly);

    runScreener({
      goal: preset.goal,
      riskLevel: preset.riskLevel,
      type: preset.type,
      beginnerOnly: preset.beginnerOnly,
    });
  }

  function handleGoalChange(event) {
    const nextGoal = event.target.value;
    setGoal(nextGoal);
    setActivePresetKey(null);
    runScreener({ goal: nextGoal });
  }

  function handleRiskChange(event) {
    const nextRiskLevel = event.target.value;
    setRiskLevel(nextRiskLevel);
    setActivePresetKey(null);
    runScreener({ riskLevel: nextRiskLevel });
  }

  function handleTypeChange(event) {
    const nextType = event.target.value;
    setType(nextType);
    setActivePresetKey(null);
    if (activeMode === "screener") runScreener({ type: nextType });
  }

  function handleBeginnerToggle(event) {
    const nextValue = event.target.checked;
    setBeginnerOnly(nextValue);
    setActivePresetKey(null);
    runScreener({ beginnerOnly: nextValue });
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

    setStatusText(`${ticker} 후보 자산을 포트폴리오에 추가했습니다. STEP 2에서 수량을 입력한 뒤 조회하세요.`);
  }

  function showMoreResults() {
    const nextVisibleCount = Math.min(visibleCount + LOAD_MORE_COUNT, results.length);
    setVisibleCount(nextVisibleCount);
    setStatusText(`${results.length}개 중 ${nextVisibleCount}개 표시`);
  }

  return (
    <section className="assetFinderPanel">
      <div className="assetFinderHeader">
        <div>
          <p className="sectionLabel">Asset Finder</p>
          <h4>티커 검색 / 초보자용 스크리닝</h4>
          <p>
            공유한 종목 리스트를 기반으로 주식·ETF 후보를 검색하고 필터링합니다.
          </p>
        </div>
        <div className="assetFinderStatusGroup">
          {masterCounts && (
            <span className="tickerMasterCount">
              마스터 {masterCounts.total.toLocaleString()}개 · ETF {masterCounts.etfs.toLocaleString()}개 · 주식 {masterCounts.stocks.toLocaleString()}개
            </span>
          )}
          <span className="assetFinderStatus">{statusText}</span>
        </div>
      </div>

      <div className="assetFinderPresetBar" aria-label="추천 프리셋">
        {PRESET_OPTIONS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={activePresetKey === preset.key ? "assetFinderPresetButton active" : "assetFinderPresetButton"}
            onClick={() => applyPreset(preset)}
            disabled={isBulkAssetLookupLoading || isLoading}
          >
            <strong>{preset.label}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>

      <form className="tickerSearchForm" onSubmit={runSearch}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: QQQ, TQQQ, 배당, 나스닥, 장기채, 엔비디아"
          disabled={isBulkAssetLookupLoading}
        />
        <select value={type} onChange={handleTypeChange} disabled={isBulkAssetLookupLoading}>
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button type="submit" disabled={isBulkAssetLookupLoading || isLoading}>
          검색
        </button>
      </form>

      <div className="screenerControls">
        <select value={goal} onChange={handleGoalChange} disabled={isBulkAssetLookupLoading || isLoading}>
          {GOAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select value={riskLevel} onChange={handleRiskChange} disabled={isBulkAssetLookupLoading || isLoading}>
          {RISK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <label className="beginnerOnlyToggle">
          <input
            type="checkbox"
            checked={beginnerOnly}
            onChange={handleBeginnerToggle}
            disabled={isBulkAssetLookupLoading || isLoading}
          />
          초보자 적합 우선
        </label>

        <button
          type="button"
          className="secondaryFinderButton"
          onClick={() => {
            setActivePresetKey(null);
            runScreener();
          }}
          disabled={isBulkAssetLookupLoading || isLoading}
        >
          조건 적용
        </button>
      </div>

      <div className="assetFinderResultToolbar">
        <span>
          {results.length > 0
            ? `${results.length}개 후보 중 ${visibleResults.length}개 표시`
            : "후보 자산 없음"}
        </span>
        <small>
          이미 담긴 티커는 <b>추가됨</b>으로 표시되어 중복 추가되지 않습니다.
        </small>
      </div>

      <div className="tickerResultGrid compact">
        {visibleResults.length > 0 ? (
          visibleResults.map((item) => {
            const ticker = normalizeTicker(item.ticker);
            return (
              <TickerResultCard
                key={item.ticker}
                item={item}
                isAdded={addedTickerSet.has(ticker)}
                onAdd={handleAdd}
              />
            );
          })
        ) : (
          <div className="tickerResultEmpty">{emptyText}</div>
        )}
      </div>

      {hiddenResultCount > 0 && (
        <div className="assetFinderLoadMoreRow">
          <button
            type="button"
            className="loadMoreTickerButton"
            onClick={showMoreResults}
            disabled={isLoading || isBulkAssetLookupLoading}
          >
            더 보기 {Math.min(LOAD_MORE_COUNT, hiddenResultCount)}개
          </button>
          <span>남은 후보 {hiddenResultCount}개</span>
        </div>
      )}
    </section>
  );
}

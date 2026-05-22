import { useEffect, useRef, useState } from "react";

import {
  ACTIVE_PORTFOLIO_STORAGE_KEY,
  DEFAULT_ASSETS,
  DEFAULT_SETTINGS,
  DIVIDEND_ASSETS,
  EMPTY_ASSETS,
  GLOBAL_SETTINGS_STORAGE_KEY,
  GROWTH_ASSETS,
  PORTFOLIO_LIST_STORAGE_KEY,
  STABLE_ASSETS,
} from "../constants";

import {
  cloneAssets,
  createPortfolio,
  ensureMinimumPortfolios,
  loadPortfolioState,
  normalizeAsset,
  normalizeGlobalSettings,
} from "../utils/portfolioFactory";

import {
  calculatePortfolioResult,
  createComparisonPortfolios,
  createInsightComparisonPortfolios,
  createRankedComparisonPortfolios,
  getActivePortfolioById,
  getChartComparisonPortfolios,
  getDetailPortfolioById,
  getPortfolioDetailReport,
} from "../utils/portfolioCalculations";

import {
  createSafeFileName,
  formatDecimal,
  formatNumber,
  formatPercent,
  isAutoAsset,
  isAutoPriceAsset,
  isAutoMetricAsset,
  isEmptyAssetRow,
  toNumber,
} from "../utils/portfolioFormatters";

import { downloadJsonFile, downloadTextFile } from "../utils/portfolioDownloads";
import { createPortfolioReportText, createReportSummaryText } from "../utils/portfolioReports";
import {
  fetchAssetDataBatch,
  fetchAssetDataByTicker,
  fetchTickerCandidateByTicker,
  getAssetDataProviderLabel,
  normalizeTicker,
} from "../services/assetDataService";

import {
  consumeFreeApiLookup,
  getPlanLimitMessage,
  getStoredFinplePlan,
  getUpgradePromptText,
  FINPLE_PLAN_CONFIGS,
} from "../config/planConfig";

const FINPLE_APP_VERSION = "1.0.0";
const FINPLE_BACKUP_VERSION = "1.0.0";
const FINPLE_BACKUP_SCHEMA_VERSION = 2;

function formatStorageDate(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  } catch (error) {
    return "-";
  }
}

function createBackupFileName(portfolioName = "portfolio") {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  const safeName = createSafeFileName(portfolioName, "portfolio");
  return `FINPLE-backup-${safeName}-${date}-${time}.json`;
}

function isValidBackupData(parsedData) {
  return parsedData && typeof parsedData === "object" && Array.isArray(parsedData.portfolioList) && parsedData.portfolioList.length > 0;
}

function getCurrentPlanConfig() {
  const planKey = getStoredFinplePlan();
  return FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free;
}

function applyPortfolioPlanLimitToState(portfolioState) {
  const currentPlan = getCurrentPlanConfig();
  const portfolioLimit = currentPlan?.limits?.portfolios;
  if (!portfolioState || !Array.isArray(portfolioState.portfolioList)) return portfolioState;
  if (!Number.isFinite(portfolioLimit)) return portfolioState;

  const limit = Math.max(1, Number(portfolioLimit));
  if (portfolioState.portfolioList.length <= limit) return portfolioState;

  const activePortfolio = portfolioState.portfolioList.find((portfolio) => portfolio.id === portfolioState.activePortfolioId) || portfolioState.portfolioList[0];
  let nextPortfolioList = portfolioState.portfolioList.slice(0, limit);

  if (activePortfolio && !nextPortfolioList.some((portfolio) => portfolio.id === activePortfolio.id)) {
    nextPortfolioList = [...nextPortfolioList.slice(0, Math.max(0, limit - 1)), activePortfolio];
  }

  const nextActivePortfolio = nextPortfolioList.find((portfolio) => portfolio.id === activePortfolio?.id) || nextPortfolioList[0];
  return { ...portfolioState, portfolioList: nextPortfolioList, activePortfolioId: nextActivePortfolio.id, activePortfolio: nextActivePortfolio };
}

function openPricingSection() {
  if (typeof window === "undefined") return;
  try { window.dispatchEvent(new CustomEvent("finple-open-pricing")); } catch (error) {}
  window.setTimeout(() => {
    const pricingTarget = document.querySelector("#pricing, .accountPlanGrid, .pricingStatusPanel");
    if (pricingTarget) { pricingTarget.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    try { window.localStorage.setItem("finple-current-page", "home"); window.location.hash = "pricing"; window.location.reload(); } catch (error) { window.location.hash = "pricing"; }
  }, 80);
}

function countRealAssets(assetList = []) {
  return assetList.filter((asset) => {
    const ticker = normalizeTicker(asset?.ticker);
    return ticker && ticker !== "XXX";
  }).length;
}

function isActivatingEmptyAsset(currentAsset, field, value) {
  if (field !== "ticker") return false;
  const currentTicker = normalizeTicker(currentAsset?.ticker);
  const nextTicker = normalizeTicker(value);
  return !currentTicker && Boolean(nextTicker);
}

export default function usePortfolioSimulator() {
  const [initialPortfolioState] = useState(() => applyPortfolioPlanLimitToState(loadPortfolioState()));
  const [portfolioList, setPortfolioList] = useState(initialPortfolioState.portfolioList);
  const [activePortfolioId, setActivePortfolioId] = useState(initialPortfolioState.activePortfolioId);
  const [settings, setSettings] = useState(initialPortfolioState.globalSettings || DEFAULT_SETTINGS);
  const [assets, setAssets] = useState(() => cloneAssets(initialPortfolioState.activePortfolio.assets));
  const [activeSimulatorTab, setActiveSimulatorTab] = useState("screener");
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [isNewPortfolioMenuOpen, setIsNewPortfolioMenuOpen] = useState(false);
  const [assetLookupStatus, setAssetLookupStatus] = useState({});
  const [isBulkAssetLookupLoading, setIsBulkAssetLookupLoading] = useState(false);
  const [assetLookupSummary, setAssetLookupSummary] = useState(`조회 모드: ${getAssetDataProviderLabel()}`);
  const [recentlyAddedAssetId, setRecentlyAddedAssetId] = useState(null);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState(() => new Date().toISOString());
  const backupFileInputRef = useRef(null);

  useEffect(() => { localStorage.setItem(PORTFOLIO_LIST_STORAGE_KEY, JSON.stringify(portfolioList)); setLastLocalSaveAt(new Date().toISOString()); }, [portfolioList]);
  useEffect(() => { localStorage.setItem(ACTIVE_PORTFOLIO_STORAGE_KEY, activePortfolioId); setLastLocalSaveAt(new Date().toISOString()); }, [activePortfolioId]);
  useEffect(() => { setPortfolioList((previousList) => previousList.map((portfolio) => portfolio.id === activePortfolioId ? { ...portfolio, assets, updatedAt: new Date().toISOString() } : portfolio)); }, [assets, activePortfolioId]);
  useEffect(() => { localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings)); setLastLocalSaveAt(new Date().toISOString()); }, [settings]);

  const result = calculatePortfolioResult(settings, assets);
  const { yearlyContribution, totalAssetValue, simulationStartValue, expectedCagr, expectedDividendYield, expectedBeta, simpleMdd, expectedCalmar, expectedAnnualDividend, performanceRows, futureValue, inflationAdjustedFutureValue } = result;
  const comparisonPortfolios = createComparisonPortfolios(portfolioList, activePortfolioId, assets, settings);
  const rankedComparisonPortfolios = createRankedComparisonPortfolios(comparisonPortfolios);
  const insightComparisonPortfolios = createInsightComparisonPortfolios(rankedComparisonPortfolios);
  const chartComparisonPortfolios = getChartComparisonPortfolios(insightComparisonPortfolios);
  const activePortfolio = getActivePortfolioById(portfolioList, activePortfolioId);
  const detailPortfolio = getDetailPortfolioById(rankedComparisonPortfolios, activePortfolioId);
  const detailReport = detailPortfolio ? getPortfolioDetailReport(detailPortfolio, rankedComparisonPortfolios) : null;

  const activeAssetCount = assets.filter((asset) => !isEmptyAssetRow(asset)).length;
  const emptyAssetCount = assets.length - activeAssetCount;
  const dataManagementSummary = { appVersion: FINPLE_APP_VERSION, backupVersion: FINPLE_BACKUP_VERSION, portfolioCount: portfolioList.length, activeAssetCount, emptyAssetCount, lastLocalSaveAt, lastLocalSaveText: formatStorageDate(lastLocalSaveAt), activePortfolioUpdatedAt: activePortfolio?.updatedAt || null, activePortfolioUpdatedText: formatStorageDate(activePortfolio?.updatedAt) };

  function showPlanLimitNotice(type) {
    const currentPlan = getCurrentPlanConfig();
    const message = getPlanLimitMessage(currentPlan.key, type);
    setAssetLookupSummary(`${message} 요금제 화면에서 Personal/Pro 기능을 확인할 수 있습니다.`);
    if (typeof window !== "undefined") {
      const shouldMove = window.confirm(getUpgradePromptText(currentPlan.key, type));
      if (shouldMove) openPricingSection();
    }
    return message;
  }

  function updateSetting(field, value) { setSettings({ ...settings, [field]: value }); }

  function getTargetQuantityFromWeight(currentAsset, targetWeight) {
    const price = Number(currentAsset?.price || 0);
    const currentValue = Number(currentAsset?.quantity || 0) * price;
    const otherAssetValue = assets.reduce((sum, asset) => sum + Number(asset.quantity || 0) * Number(asset.price || 0), 0) - currentValue;
    const safeWeight = Math.max(0, Math.min(99.99, Number(targetWeight || 0)));
    if (price <= 0) return Number(currentAsset?.quantity || 0);
    if (safeWeight <= 0) return 0;
    const targetValue = (safeWeight * otherAssetValue) / (100 - safeWeight);
    return Number((targetValue / price).toFixed(6));
  }

  function updateAsset(index, field, value) {
    const nextAssets = [...assets];
    const currentAsset = nextAssets[index];
    if (!currentAsset) return;

    const currentPlan = getCurrentPlanConfig();
    const assetLimit = currentPlan.limits.assetsPerPortfolio;
    if (assetLimit && assetLimit !== Infinity && isActivatingEmptyAsset(currentAsset, field, value) && countRealAssets(nextAssets) >= assetLimit) {
      showPlanLimitNotice("asset");
      return;
    }

    if (field === "targetWeight") {
      nextAssets[index] = { ...currentAsset, quantity: getTargetQuantityFromWeight(currentAsset, value) };
      setAssets(nextAssets);
      return;
    }

    if (field === "ticker") {
      const nextTicker = normalizeTicker(value);
      const previousTicker = normalizeTicker(currentAsset.ticker);
      const tickerChanged = nextTicker !== previousTicker;
      nextAssets[index] = normalizeAsset({
        ...currentAsset,
        ticker: nextTicker,
        name: tickerChanged ? "" : currentAsset.name,
        price: tickerChanged ? 0 : currentAsset.price,
        cagr: tickerChanged ? 0 : currentAsset.cagr,
        beta: tickerChanged ? 0 : currentAsset.beta,
        mdd: tickerChanged ? 0 : currentAsset.mdd,
        dividendYield: tickerChanged ? 0 : currentAsset.dividendYield,
        priceMode: tickerChanged ? "manual" : currentAsset.priceMode,
        metricMode: tickerChanged ? "manual" : currentAsset.metricMode,
        dataSource: tickerChanged ? "manual" : currentAsset.dataSource,
        cacheMode: tickerChanged ? null : currentAsset.cacheMode,
        rawPrice: tickerChanged ? null : currentAsset.rawPrice,
        rawCurrency: tickerChanged ? null : currentAsset.rawCurrency,
        exchangeRate: tickerChanged ? null : currentAsset.exchangeRate,
        lastUpdatedAt: tickerChanged ? null : currentAsset.lastUpdatedAt,
      }, index);
    } else {
      nextAssets[index] = { ...currentAsset, [field]: value };
    }

    setAssets(nextAssets);
  }

  function getAssetStatusKey(asset, index) { return asset?.id || String(index); }
  function isRecentlyFetchedAsset(asset) { if (!asset?.lastUpdatedAt) return false; if (!String(asset?.dataSource || "").includes("alpha-vantage")) return false; const fetchedAt = new Date(asset.lastUpdatedAt).getTime(); if (!Number.isFinite(fetchedAt)) return false; return Date.now() - fetchedAt < 24 * 60 * 60 * 1000; }
  function isRateLimitMessage(message = "") { return /Alpha Vantage|호출 제한|rate limit|premium/i.test(String(message)); }

  function applyTickerCandidateToAsset(currentAsset, candidate = {}, index = assets.length) {
    const ticker = normalizeTicker(candidate.ticker || currentAsset.ticker);
    const currentPrice = Number(currentAsset.price || 0);
    const currentQuantity = Number(currentAsset.quantity || 0);
    return normalizeAsset({ ...currentAsset, ticker, name: candidate.koreanName || candidate.name || currentAsset.name || ticker, market: candidate.market || currentAsset.market || "US", currency: currentAsset.currency || "KRW", quantity: currentQuantity, price: currentPrice, cagr: candidate.expectedCagr ?? candidate.cagr ?? currentAsset.cagr ?? 0, beta: candidate.beta ?? currentAsset.beta ?? 0, mdd: candidate.mdd ?? currentAsset.mdd ?? 0, dividendYield: candidate.dividendYield ?? currentAsset.dividendYield ?? 0, priceMode: currentPrice > 0 ? currentAsset.priceMode : "lookup-required", metricMode: "manual", dataSource: "ticker-master", cacheMode: null, rawPrice: currentAsset.rawPrice || null, rawCurrency: candidate.currency || currentAsset.rawCurrency || null, exchangeRate: currentAsset.exchangeRate || null, lastUpdatedAt: currentAsset.lastUpdatedAt || null }, index);
  }

  async function resolveTickerCandidate(index, options = {}) {
    const targetAsset = assets[index];
    const ticker = normalizeTicker(options.ticker || targetAsset?.ticker);
    if (!ticker) return null;
    try {
      const candidate = await fetchTickerCandidateByTicker(ticker);
      setAssets((previousAssets) => {
        const nextAssets = [...previousAssets];
        const currentAsset = nextAssets[index];
        if (!currentAsset || normalizeTicker(currentAsset.ticker) !== ticker) return previousAssets;
        nextAssets[index] = applyTickerCandidateToAsset(currentAsset, candidate, index);
        return nextAssets;
      });
      if (!options.silent) setAssetLookupSummary(`${ticker} 티커 마스터 정보 적용. 수량 입력 후 조회하면 현재가를 가져올 수 있습니다.`);
      return candidate;
    } catch (error) {
      if (!options.silent) setAssetLookupSummary(`${ticker}는 티커 마스터에서 찾지 못했습니다. 직접 입력값으로 유지합니다.`);
      return null;
    }
  }

  function applyFetchedAssetData(currentAsset, assetData, index) {
    const nextTicker = assetData.ticker || currentAsset.ticker;
    const normalizedTicker = normalizeTicker(nextTicker);
    const fetchedName = assetData.name || "";
    const currentName = currentAsset.name || "";
    const fetchedNameIsTickerOnly = normalizeTicker(fetchedName) === normalizedTicker;
    const currentNameIsTickerOnly = normalizeTicker(currentName) === normalizeTicker(currentAsset.ticker);
    const nextName = fetchedName && (!fetchedNameIsTickerOnly || !currentName || currentNameIsTickerOnly) ? fetchedName : currentName;
    return normalizeAsset({ ...currentAsset, ticker: nextTicker, name: nextName, market: assetData.market || currentAsset.market, currency: assetData.currency || currentAsset.currency, price: assetData.price !== null && assetData.price !== undefined ? assetData.price : currentAsset.price, cagr: assetData.cagr !== null && assetData.cagr !== undefined ? assetData.cagr : currentAsset.cagr, beta: assetData.beta !== null && assetData.beta !== undefined ? assetData.beta : currentAsset.beta, mdd: assetData.mdd !== null && assetData.mdd !== undefined ? assetData.mdd : currentAsset.mdd, dividendYield: assetData.dividendYield !== null && assetData.dividendYield !== undefined ? assetData.dividendYield : currentAsset.dividendYield, priceMode: assetData.priceMode || currentAsset.priceMode, metricMode: assetData.metricMode || currentAsset.metricMode, dataSource: assetData.dataSource || currentAsset.dataSource, cacheMode: assetData.cacheMode || currentAsset.cacheMode || null, rawPrice: assetData.rawPrice !== null && assetData.rawPrice !== undefined ? assetData.rawPrice : currentAsset.rawPrice, rawCurrency: assetData.rawCurrency || currentAsset.rawCurrency || null, exchangeRate: assetData.exchangeRate !== null && assetData.exchangeRate !== undefined ? assetData.exchangeRate : currentAsset.exchangeRate, lastUpdatedAt: assetData.fetchedAt || currentAsset.lastUpdatedAt }, index);
  }

  async function fetchAssetData(index) {
    const targetAsset = assets[index];
    const ticker = normalizeTicker(targetAsset?.ticker);
    const statusKey = getAssetStatusKey(targetAsset, index);
    if (!ticker) { window.alert("티커를 먼저 입력해주세요."); return; }
    const currentPlan = getCurrentPlanConfig();
    if (currentPlan.key === "free") {
      const usage = consumeFreeApiLookup(1);
      if (!usage.ok) { showPlanLimitNotice("api"); setAssetLookupStatus((previousStatus) => ({ ...previousStatus, [statusKey]: { status: "error", message: "Free 조회 한도" } })); return; }
    }
    setAssetLookupStatus((previousStatus) => ({ ...previousStatus, [statusKey]: { status: "loading", message: "조회 중" } }));
    setAssetLookupSummary(`${ticker} 조회 중...`);
    try {
      const tickerCandidate = await resolveTickerCandidate(index, { silent: true });
      const assetData = await fetchAssetDataByTicker(ticker);
      setAssets((previousAssets) => {
        const nextAssets = [...previousAssets];
        const currentAsset = nextAssets[index];
        if (!currentAsset) return previousAssets;
        const candidateAppliedAsset = tickerCandidate ? applyTickerCandidateToAsset(currentAsset, tickerCandidate, index) : currentAsset;
        nextAssets[index] = applyFetchedAssetData(candidateAppliedAsset, assetData, index);
        return nextAssets;
      });
      setAssetLookupStatus((previousStatus) => ({ ...previousStatus, [statusKey]: { status: "success", message: assetData?.cacheMode === "hit" ? "캐시값" : "조회 완료" } }));
      setAssetLookupSummary(assetData?.cacheMode === "hit" ? `${ticker} 캐시값 적용` : `${ticker} 조회 완료`);
    } catch (error) {
      const message = error?.message || "자산 데이터를 조회하지 못했습니다.";
      setAssetLookupStatus((previousStatus) => ({ ...previousStatus, [statusKey]: { status: "error", message } }));
      setAssetLookupSummary(isRateLimitMessage(message) ? `Alpha Vantage 호출 제한: ${ticker} 기존값 유지` : `${ticker} 조회 실패: ${message}`);
    }
  }

  async function fetchAllAssetData() {
    if (isBulkAssetLookupLoading) return;
    const targetRows = assets.map((asset, index) => ({ asset, index, ticker: normalizeTicker(asset?.ticker), statusKey: getAssetStatusKey(asset, index) })).filter((row) => { if (!row.ticker) return false; if (row.ticker === "XXX" && isEmptyAssetRow(row.asset)) return false; return true; });
    if (targetRows.length === 0) { window.alert("조회할 티커가 없습니다."); return; }
    const currentPlan = getCurrentPlanConfig();
    if (currentPlan.key === "free") {
      const rowsNeedingLookup = targetRows.filter((row) => !isRecentlyFetchedAsset(row.asset));
      const usage = consumeFreeApiLookup(rowsNeedingLookup.length || 1);
      if (!usage.ok) { showPlanLimitNotice("api"); return; }
    }
    const cachedRows = targetRows.filter((row) => isRecentlyFetchedAsset(row.asset));
    const fetchRows = targetRows.filter((row) => !isRecentlyFetchedAsset(row.asset));
    const uniqueTickers = Array.from(new Set(fetchRows.map((row) => row.ticker)));
    setIsBulkAssetLookupLoading(true);
    setAssetLookupSummary(fetchRows.length > 0 ? `${fetchRows.length}개 자산 전체 조회 준비 중... 최근 조회값 ${cachedRows.length}개 유지` : `전체 조회 완료: 성공 ${targetRows.length}개, 실패 0개 (최근 조회값 유지)`);
    setAssetLookupStatus((previousStatus) => {
      const nextStatus = { ...previousStatus };
      cachedRows.forEach((row) => { nextStatus[row.statusKey] = { status: "success", message: "최근 조회값 유지" }; });
      fetchRows.forEach((row) => { nextStatus[row.statusKey] = { status: "loading", message: "조회 중" }; });
      return nextStatus;
    });
    try {
      const lookupResults = uniqueTickers.length > 0 ? await fetchAssetDataBatch(uniqueTickers, { onProgress: ({ ticker, index, total, status }) => {
        const stepText = `${index + 1}/${total}`;
        if (status === "waiting") { setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 대기 중...`); return; }
        if (status === "loading") { setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 조회 중...`); return; }
        if (status === "success") { setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 조회 완료`); return; }
        if (status === "rate-limit") { setAssetLookupSummary(`Alpha Vantage 호출 제한: ${ticker}부터 기존값 유지`); return; }
        if (status === "error") setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 조회 실패`);
      } }) : [];
      const resultMap = new Map(lookupResults.map((lookupResult) => [lookupResult.ticker, lookupResult]));
      const rowResults = targetRows.map((row) => isRecentlyFetchedAsset(row.asset) ? { ...row, lookupResult: { ticker: row.ticker, status: "success", data: row.asset, cacheMode: "client-recent" } } : { ...row, lookupResult: resultMap.get(row.ticker) });
      const successCount = rowResults.filter((row) => row.lookupResult?.status === "success").length;
      const errorCount = rowResults.filter((row) => row.lookupResult?.status !== "success").length;
      setAssets((previousAssets) => previousAssets.map((asset, index) => { const rowResult = rowResults.find((row) => row.index === index); if (rowResult?.lookupResult?.status === "success") return applyFetchedAssetData(asset, rowResult.lookupResult.data, index); return asset; }));
      setAssetLookupStatus((previousStatus) => {
        const nextStatus = { ...previousStatus };
        rowResults.forEach((row) => { nextStatus[row.statusKey] = row.lookupResult?.status === "success" ? { status: "success", message: row.lookupResult?.cacheMode === "client-recent" || row.lookupResult?.data?.cacheMode === "hit" ? "캐시값" : "조회 완료" } : { status: "error", message: row.lookupResult?.error || "조회 실패" }; });
        return nextStatus;
      });
      const failedTickers = Array.from(new Set(rowResults.filter((row) => row.lookupResult?.status !== "success").map((row) => row.ticker)));
      const failedTickerText = failedTickers.length > 0 ? ` (${failedTickers.join(", ")})` : "";
      const cacheCount = rowResults.filter((row) => row.lookupResult?.cacheMode === "client-recent" || row.lookupResult?.data?.cacheMode === "hit" || String(row.lookupResult?.data?.dataSource || "").includes("cache")).length;
      const cacheText = cacheCount > 0 ? `, 캐시 ${cacheCount}개` : "";
      const rateLimitRows = rowResults.filter((row) => isRateLimitMessage(row.lookupResult?.error || ""));
      setAssetLookupSummary(rateLimitRows.length > 0 ? `Alpha Vantage 호출 제한: 성공 ${successCount}개, 실패 ${errorCount}개${cacheText}. 기존값을 유지합니다.` : `전체 조회 완료: 성공 ${successCount}개, 실패 ${errorCount}개${cacheText}${failedTickerText}`);
    } catch (error) { setAssetLookupSummary(`전체 조회 중 오류: ${error?.message || "알 수 없는 오류"}`); }
    finally { setIsBulkAssetLookupLoading(false); }
  }

  function createAssetFromTickerCandidate(candidate = {}, index = assets.length) {
    return normalizeAsset({ ticker: candidate.ticker || "", name: candidate.koreanName || candidate.name || candidate.ticker || "", market: candidate.market || "US", currency: "KRW", quantity: 0, price: 0, cagr: candidate.expectedCagr ?? candidate.cagr ?? 0, beta: candidate.beta ?? 0, mdd: candidate.mdd ?? 0, dividendYield: candidate.dividendYield ?? 0, priceMode: "lookup-required", metricMode: "manual", dataSource: "ticker-master", cacheMode: null, rawPrice: null, rawCurrency: candidate.currency || null, exchangeRate: null, lastUpdatedAt: null }, index);
  }

  function addAssetFromTickerCandidate(candidate) {
    const ticker = normalizeTicker(candidate?.ticker);
    if (!ticker) { setAssetLookupSummary("추가할 티커 정보가 없습니다."); return { status: "error", message: "추가할 티커 정보가 없습니다." }; }
    const alreadyExists = assets.some((asset) => { const tickerValue = normalizeTicker(asset?.ticker); return tickerValue === ticker && !isEmptyAssetRow(asset); });
    if (alreadyExists) { const message = `${ticker}는 이미 현재 포트폴리오에 추가되어 있습니다.`; setAssetLookupSummary(message); return { status: "duplicate", ticker, message }; }
    const currentPlan = getCurrentPlanConfig();
    const assetLimit = currentPlan.limits.assetsPerPortfolio;
    const activeAssetCount = countRealAssets(assets);
    if (assetLimit && assetLimit !== Infinity && activeAssetCount >= assetLimit) { const message = showPlanLimitNotice("asset"); return { status: "limit", ticker, message }; }
    const nextAsset = createAssetFromTickerCandidate(candidate, assets.length);
    setAssets((previousAssets) => {
      const emptyIndex = previousAssets.findIndex((asset) => { const tickerValue = normalizeTicker(asset?.ticker); return !tickerValue || isEmptyAssetRow(asset); });
      if (emptyIndex >= 0) return previousAssets.map((asset, index) => index === emptyIndex ? normalizeAsset(nextAsset, index) : asset);
      return [...previousAssets, normalizeAsset(nextAsset, previousAssets.length)];
    });
    setRecentlyAddedAssetId(nextAsset.id);
    window.setTimeout(() => setRecentlyAddedAssetId(null), 4200);
    const message = `${ticker} 후보 자산을 현재 포트폴리오에 추가했습니다. 수량 입력 후 조회하세요.`;
    setAssetLookupSummary(message);
    return { status: "success", ticker, asset: nextAsset, message };
  }

  function addAsset() { setAssets([...assets, normalizeAsset({ ...EMPTY_ASSETS[0], id: `asset-${Date.now()}` }, assets.length)]); }
  function removeAsset(index) { setAssets(assets.filter((_, assetIndex) => assetIndex !== index)); }
  function cleanEmptyAssetRows() { const nextAssets = assets.filter((asset) => !isEmptyAssetRow(asset)); setAssets(nextAssets.length > 0 ? nextAssets : cloneAssets(DEFAULT_ASSETS)); }

  function selectPortfolio(id) {
    const nextPortfolio = portfolioList.find((portfolio) => portfolio.id === id);
    if (!nextPortfolio) return;
    setActivePortfolioId(id);
    setAssets(cloneAssets(nextPortfolio.assets));
    setIsPortfolioDropdownOpen(false);
  }

  function createPortfolioFromTemplate(templateKey = "default") {
    const templateMap = { default: DEFAULT_ASSETS, stable: STABLE_ASSETS, growth: GROWTH_ASSETS, dividend: DIVIDEND_ASSETS, empty: EMPTY_ASSETS };
    const nameMap = { default: "기본 포트폴리오", stable: "안정형 포트폴리오", growth: "성장형 포트폴리오", dividend: "배당형 포트폴리오", empty: "빈 포트폴리오" };
    const nextPortfolio = createPortfolio({ name: nameMap[templateKey] || "새 포트폴리오", assets: templateMap[templateKey] || DEFAULT_ASSETS, settings });
    setPortfolioList([nextPortfolio, ...portfolioList]);
    setActivePortfolioId(nextPortfolio.id);
    setAssets(cloneAssets(nextPortfolio.assets));
    setIsNewPortfolioMenuOpen(false);
  }

  function duplicateActivePortfolio() { const duplicatedPortfolio = createPortfolio({ name: `${activePortfolio?.name || "포트폴리오"} 복사본`, assets, settings }); setPortfolioList([duplicatedPortfolio, ...portfolioList]); setActivePortfolioId(duplicatedPortfolio.id); setAssets(cloneAssets(duplicatedPortfolio.assets)); }
  function renameActivePortfolio(nextName) { setPortfolioList((previousList) => previousList.map((portfolio) => portfolio.id === activePortfolioId ? { ...portfolio, name: nextName, updatedAt: new Date().toISOString() } : portfolio)); }
  function deleteActivePortfolio() { if (portfolioList.length <= 1) return; const nextPortfolioList = portfolioList.filter((portfolio) => portfolio.id !== activePortfolioId); const nextActivePortfolio = nextPortfolioList[0]; setPortfolioList(nextPortfolioList); setActivePortfolioId(nextActivePortfolio.id); setAssets(cloneAssets(nextActivePortfolio.assets)); }
  function resetActivePortfolioAssets() { setAssets(cloneAssets(DEFAULT_ASSETS)); }
  function resetGlobalSettings() { setSettings(DEFAULT_SETTINGS); }
  function changeSimulatorTab(nextTab) { setActiveSimulatorTab(nextTab); }
  function scrollToPortfolioTop() { document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function selectPortfolioFromFloating(id) { selectPortfolio(id); }

  function downloadPortfolioBackup() { downloadJsonFile({ portfolioList, activePortfolioId, globalSettings: settings, appVersion: FINPLE_APP_VERSION, backupVersion: FINPLE_BACKUP_VERSION, schemaVersion: FINPLE_BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString() }, createBackupFileName(activePortfolio?.name)); }
  function openPortfolioBackupFile() { backupFileInputRef.current?.click(); }
  function restorePortfolioBackup(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsedData = JSON.parse(reader.result); if (!isValidBackupData(parsedData)) throw new Error("백업 파일 형식이 올바르지 않습니다."); const nextState = applyPortfolioPlanLimitToState(loadPortfolioState(parsedData)); setPortfolioList(nextState.portfolioList); setActivePortfolioId(nextState.activePortfolioId); setAssets(cloneAssets(nextState.activePortfolio.assets)); setSettings(normalizeGlobalSettings(nextState.globalSettings || DEFAULT_SETTINGS)); } catch (error) { window.alert(error?.message || "백업 파일을 복원하지 못했습니다."); } finally { event.target.value = ""; } }; reader.readAsText(file); }
  function downloadReportText() { downloadTextFile(createPortfolioReportText({ activePortfolio, detailReport, settings, result, assets }), `${createSafeFileName(activePortfolio?.name, "FINPLE-report")}.txt`); }
  function saveReportPdf() { window.print(); }
  function printReport() { window.print(); }
  function reportPdfFileName() { return `${createSafeFileName(activePortfolio?.name, "FINPLE-report")}.pdf`; }
  function copyReportSummary() { navigator.clipboard?.writeText(createReportSummaryText({ activePortfolio, detailReport, settings, result, assets })); }

  return { portfolioList, activePortfolioId, activePortfolio, settings, assets, assetLookupStatus, isBulkAssetLookupLoading, assetLookupSummary, recentlyAddedAssetId, dataManagementSummary, activeSimulatorTab, isPortfolioDropdownOpen, setIsPortfolioDropdownOpen, isNewPortfolioMenuOpen, setIsNewPortfolioMenuOpen, backupFileInputRef, result, yearlyContribution, totalAssetValue, simulationStartValue, expectedCagr, expectedDividendYield, expectedBeta, simpleMdd, expectedCalmar, expectedAnnualDividend, performanceRows, futureValue, inflationAdjustedFutureValue, insightComparisonPortfolios, chartComparisonPortfolios, detailReport, updateSetting, updateAsset, fetchAssetData, fetchAllAssetData, resolveTickerCandidate, addAsset, addAssetFromTickerCandidate, removeAsset, cleanEmptyAssetRows, selectPortfolio, createPortfolioFromTemplate, duplicateActivePortfolio, downloadPortfolioBackup, openPortfolioBackupFile, restorePortfolioBackup, downloadReportText, saveReportPdf, printReport, reportPdfFileName, copyReportSummary, renameActivePortfolio, deleteActivePortfolio, resetActivePortfolioAssets, resetGlobalSettings, changeSimulatorTab, scrollToPortfolioTop, selectPortfolioFromFloating, formatNumber, formatDecimal, formatPercent, toNumber, isAutoAsset, isAutoPriceAsset, isAutoMetricAsset, isEmptyAssetRow };
}

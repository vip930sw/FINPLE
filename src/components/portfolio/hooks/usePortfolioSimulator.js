import { useEffect, useRef, useState } from "react";

import {
  ACTIVE_PORTFOLIO_STORAGE_KEY,
  ALL_WEATHER_ASSETS,
  DEFAULT_ASSETS,
  DEFAULT_SETTINGS,
  DIVIDEND_ASSETS,
  EMPTY_ASSETS,
  GLOBAL_SETTINGS_STORAGE_KEY,
  GOLD_DEFENSE_ASSETS,
  GROWTH_ASSETS,
  GROWTH_FOCUS_ASSETS,
  GROWTH_ZERO_ASSETS,
  HIGH_CONVICTION_ASSETS,
  PORTFOLIO_LIST_STORAGE_KEY,
  REIT_INCOME_ASSETS,
  STABLE_ASSETS,
} from "../constants";

import {
  cloneAssets,
  createPortfolio,
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

function parseWeightValue(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, numberValue);
}

function preserveNullableNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getAssetActualValue(asset = {}) {
  const value = Number(asset.quantity || 0) * Number(asset.price || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAssetPlannedValue(asset = {}) {
  const value = Number(asset.targetEvaluationAmount || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAssetWeightValue(asset = {}) {
  return getAssetActualValue(asset) || getAssetPlannedValue(asset);
}

export default function usePortfolioSimulator() {
  const [initialPortfolioState] = useState(() => applyPortfolioPlanLimitToState(loadPortfolioState()));
  const [portfolioList, setPortfolioList] = useState(initialPortfolioState.portfolioList);
  const [activePortfolioId, setActivePortfolioId] = useState(initialPortfolioState.activePortfolioId);
  const [settings, setSettings] = useState(initialPortfolioState.globalSettings || DEFAULT_SETTINGS);
  const [assets, setAssets] = useState(() => cloneAssets(initialPortfolioState.activePortfolio.assets));
  const [targetWeightDrafts, setTargetWeightDrafts] = useState({});
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

  function getAssetDraftKey(asset, index) {
    return asset?.id || `${normalizeTicker(asset?.ticker) || "asset"}-${index}`;
  }

  function getActualAssetWeight(asset) {
    if (!asset || totalAssetValue <= 0) return 0;
    const value = getAssetWeightValue(asset);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return (value / totalAssetValue) * 100;
  }

  function getEffectiveTargetWeight(asset, index) {
    const key = getAssetDraftKey(asset, index);
    if (Object.prototype.hasOwnProperty.call(targetWeightDrafts, key)) return parseWeightValue(targetWeightDrafts[key]);
    return Number(getActualAssetWeight(asset).toFixed(2));
  }

  const targetWeightRows = assets.map((asset, index) => ({
    asset,
    index,
    key: getAssetDraftKey(asset, index),
    ticker: normalizeTicker(asset?.ticker),
    price: Number(asset?.price || 0),
    currentWeight: getActualAssetWeight(asset),
    targetWeight: getEffectiveTargetWeight(asset, index),
    isEmpty: isEmptyAssetRow(asset),
  })).filter((row) => !row.isEmpty && row.ticker);

  const targetWeightTotal = targetWeightRows.reduce((sum, row) => sum + row.targetWeight, 0);
  const targetWeightOverAmount = Math.max(0, targetWeightTotal - 100);
  const targetWeightRemaining = Math.max(0, 100 - targetWeightTotal);
  const targetWeightUnsupportedCount = targetWeightRows.filter((row) => row.targetWeight > 0 && row.price <= 0).length;
  const targetWeightIsBalanced = Math.abs(targetWeightTotal - 100) <= 0.01;
  const targetWeightSummary = { total: Number(targetWeightTotal.toFixed(2)), remaining: Number(targetWeightRemaining.toFixed(2)), overAmount: Number(targetWeightOverAmount.toFixed(2)), hasCash: false, unsupportedCount: targetWeightUnsupportedCount, isOver: targetWeightTotal > 100.01, isApplyDisabled: targetWeightRows.length === 0 || simulationStartValue <= 0 || !targetWeightIsBalanced };

  function showPlanLimitNotice(type) {
    const currentPlan = getCurrentPlanConfig();
    const message = getPlanLimitMessage(currentPlan.key, type);
    setAssetLookupSummary(`${message} 요금제 화면에서 Personal/Pro 기능을 확인할 수 있습니다.`);
    if (typeof window !== "undefined") { const shouldMove = window.confirm(getUpgradePromptText(currentPlan.key, type)); if (shouldMove) openPricingSection(); }
    return message;
  }

  function updateSetting(field, value) { setSettings((previous) => ({ ...previous, [field]: value })); }
  function updateTargetWeightDraft(index, value) { const asset = assets[index]; if (!asset) return; const key = getAssetDraftKey(asset, index); setTargetWeightDrafts((previousDrafts) => ({ ...previousDrafts, [key]: value })); }
  function resetTargetWeights() { setTargetWeightDrafts({}); setAssetLookupSummary("목표비중 입력값을 현재 실제 비중으로 되돌렸습니다."); }

  function equalizeTargetWeights() {
    const rows = targetWeightRows;
    if (rows.length === 0) { window.alert("균등분배할 수 있는 자산이 없습니다. 자산을 먼저 추가해 주세요."); return; }
    const baseWeight = Math.floor((100 / rows.length) * 100) / 100;
    const nextDrafts = {};
    rows.forEach((row, rowIndex) => { const value = rowIndex === rows.length - 1 ? Number((100 - baseWeight * (rows.length - 1)).toFixed(2)) : baseWeight; nextDrafts[row.key] = String(value); });
    setTargetWeightDrafts(nextDrafts);
    setAssetLookupSummary("전체 자산 목표비중을 균등분배했습니다. 계산 버튼을 누르면 평가금액이 반영됩니다.");
  }

  function applyTargetWeights() {
    const startValue = Number(simulationStartValue || 0);
    if (startValue <= 0) { window.alert("시작 평가금액이 0원입니다. 시작 평가금액을 입력해 주세요."); return; }
    const rows = targetWeightRows.filter((row) => row.ticker);
    if (rows.length === 0) { window.alert("목표비중을 적용할 자산이 없습니다."); return; }
    const nextTotal = rows.reduce((sum, row) => sum + row.targetWeight, 0);
    if (Math.abs(nextTotal - 100) > 0.01) { window.alert("목표비중 합계를 100%로 맞춘 뒤 적용해 주세요."); return; }
    const targetMap = new Map(rows.map((row) => [row.index, row.targetWeight]));
    let missingPriceCount = 0;
    setAssets((previousAssets) => previousAssets.map((asset, index) => { if (!targetMap.has(index)) return asset; const price = Number(asset.price || 0); const targetWeight = Number(targetMap.get(index) || 0); const targetValue = startValue * (targetWeight / 100); const quantity = price > 0 ? Number((targetValue / price).toFixed(6)) : 0; if (price <= 0 && targetWeight > 0) missingPriceCount += 1; return { ...asset, quantity, targetEvaluationAmount: Number(targetValue.toFixed(0)) }; }));
    setTargetWeightDrafts({});
    setAssetLookupSummary(missingPriceCount > 0 ? `목표비중을 적용했습니다. 현재가 없는 자산 ${missingPriceCount}개는 평가금액 기준으로 계산하고, 수량은 현재가 조회 후 보정됩니다.` : "목표비중을 적용했습니다. 시작 평가금액 기준으로 수량과 평가금액이 재계산되었습니다.");
  }

  function updateAsset(index, field, value) {
    const nextAssets = [...assets];
    const currentAsset = nextAssets[index];
    if (!currentAsset) return;
    const currentPlan = getCurrentPlanConfig();
    const assetLimit = currentPlan.limits.assetsPerPortfolio;
    if (assetLimit && assetLimit !== Infinity && isActivatingEmptyAsset(currentAsset, field, value) && countRealAssets(nextAssets) >= assetLimit) { showPlanLimitNotice("asset"); return; }
    if (field === "targetWeight") { updateTargetWeightDraft(index, value); return; }
    if (field === "ticker") {
      const currentKey = getAssetDraftKey(currentAsset, index);
      setTargetWeightDrafts((previousDrafts) => { const nextDrafts = { ...previousDrafts }; delete nextDrafts[currentKey]; return nextDrafts; });
      const nextTicker = normalizeTicker(value);
      const previousTicker = normalizeTicker(currentAsset.ticker);
      const tickerChanged = nextTicker !== previousTicker;
      nextAssets[index] = normalizeAsset({ ...currentAsset, ticker: nextTicker, name: tickerChanged ? "" : currentAsset.name, price: tickerChanged ? 0 : currentAsset.price, targetEvaluationAmount: tickerChanged ? null : currentAsset.targetEvaluationAmount, cagr: tickerChanged ? 0 : currentAsset.cagr, beta: tickerChanged ? 0 : currentAsset.beta, mdd: tickerChanged ? 0 : currentAsset.mdd, dividendYield: tickerChanged ? null : currentAsset.dividendYield, priceMode: tickerChanged ? "manual" : currentAsset.priceMode, metricMode: tickerChanged ? "manual" : currentAsset.metricMode, dataSource: tickerChanged ? "manual" : currentAsset.dataSource, cacheMode: tickerChanged ? null : currentAsset.cacheMode, rawPrice: tickerChanged ? null : currentAsset.rawPrice, rawCurrency: tickerChanged ? null : currentAsset.rawCurrency, exchangeRate: tickerChanged ? null : currentAsset.exchangeRate, lastUpdatedAt: tickerChanged ? null : currentAsset.lastUpdatedAt }, index);
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
    return normalizeAsset({ ...currentAsset, ticker, name: candidate.koreanName || candidate.name || currentAsset.name || ticker, market: candidate.market || currentAsset.market || "US", currency: currentAsset.currency || "KRW", quantity: currentQuantity, price: currentPrice, targetEvaluationAmount: currentAsset.targetEvaluationAmount ?? null, cagr: candidate.expectedCagr ?? candidate.cagr ?? currentAsset.cagr ?? 0, beta: candidate.beta ?? currentAsset.beta ?? 0, mdd: candidate.mdd ?? currentAsset.mdd ?? 0, dividendYield: candidate.dividendYield ?? currentAsset.dividendYield ?? null, priceMode: currentPrice > 0 ? currentAsset.priceMode : "lookup-required", metricMode: "manual", dataSource: "ticker-master", cacheMode: null, rawPrice: currentAsset.rawPrice || null, rawCurrency: candidate.currency || currentAsset.rawCurrency || null, exchangeRate: currentAsset.exchangeRate || null, lastUpdatedAt: currentAsset.lastUpdatedAt || null }, index);
  }

  async function resolveTickerCandidate(index, options = {}) {
    const targetAsset = assets[index];
    const ticker = normalizeTicker(options.ticker || targetAsset?.ticker);
    if (!ticker) return null;
    try {
      const candidate = await fetchTickerCandidateByTicker(ticker);
      setAssets((previousAssets) => { const nextAssets = [...previousAssets]; const currentAsset = nextAssets[index]; if (!currentAsset || normalizeTicker(currentAsset.ticker) !== ticker) return previousAssets; nextAssets[index] = applyTickerCandidateToAsset(currentAsset, candidate, index); return nextAssets; });
      if (!options.silent) setAssetLookupSummary(`${ticker} 티커 마스터 정보 적용. 비중을 입력하고 계산 버튼을 누르면 평가금액이 반영됩니다.`);
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
    const nextPrice = assetData.price !== null && assetData.price !== undefined ? Number(assetData.price) : Number(currentAsset.price || 0);
    const plannedValue = getAssetPlannedValue(currentAsset);
    const nextQuantity = plannedValue > 0 && nextPrice > 0 ? Number((plannedValue / nextPrice).toFixed(6)) : currentAsset.quantity;
    return normalizeAsset({ ...currentAsset, ticker: nextTicker, name: nextName, market: assetData.market || currentAsset.market, currency: assetData.currency || currentAsset.currency, quantity: nextQuantity, price: assetData.price !== null && assetData.price !== undefined ? assetData.price : currentAsset.price, targetEvaluationAmount: plannedValue > 0 ? plannedValue : currentAsset.targetEvaluationAmount, cagr: assetData.cagr !== null && assetData.cagr !== undefined ? assetData.cagr : currentAsset.cagr, beta: assetData.beta !== null && assetData.beta !== undefined ? assetData.beta : currentAsset.beta, mdd: assetData.mdd !== null && assetData.mdd !== undefined ? assetData.mdd : currentAsset.mdd, dividendYield: preserveNullableNumber(assetData.dividendYield, currentAsset.dividendYield), priceMode: assetData.priceMode || currentAsset.priceMode, metricMode: assetData.metricMode || currentAsset.metricMode, dataSource: assetData.dataSource || currentAsset.dataSource, cacheMode: assetData.cacheMode || currentAsset.cacheMode || null, rawPrice: assetData.rawPrice !== null && assetData.rawPrice !== undefined ? assetData.rawPrice : currentAsset.rawPrice, rawCurrency: assetData.rawCurrency || currentAsset.rawCurrency || null, exchangeRate: assetData.exchangeRate !== null && assetData.exchangeRate !== undefined ? assetData.exchangeRate : currentAsset.exchangeRate, lastUpdatedAt: assetData.fetchedAt || currentAsset.lastUpdatedAt }, index);
  }

  async function fetchAssetData(index) {
    const targetAsset = assets[index];
    const ticker = normalizeTicker(targetAsset?.ticker);
    const statusKey = getAssetStatusKey(targetAsset, index);
    if (!ticker) { window.alert("티커를 먼저 입력해주세요."); return; }
    const currentPlan = getCurrentPlanConfig();
    if (currentPlan.key === "free") { const usage = consumeFreeApiLookup(1); if (!usage.ok) { showPlanLimitNotice("api"); setAssetLookupStatus((previousStatus) => ({ ...previousStatus, [statusKey]: { status: "error", message: "Free 조회 한도" } })); return; } }
    setAssetLookupStatus((previousStatus) => ({ ...previousStatus, [statusKey]: { status: "loading", message: "조회 중" } }));
    setAssetLookupSummary(`${ticker} 조회 중...`);
    try {
      const tickerCandidate = await resolveTickerCandidate(index, { silent: true });
      const assetData = await fetchAssetDataByTicker(ticker);
      setAssets((previousAssets) => { const nextAssets = [...previousAssets]; const currentAsset = nextAssets[index]; if (!currentAsset) return previousAssets; const candidateAppliedAsset = tickerCandidate ? applyTickerCandidateToAsset(currentAsset, tickerCandidate, index) : currentAsset; nextAssets[index] = applyFetchedAssetData(candidateAppliedAsset, assetData, index); return nextAssets; });
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
    if (currentPlan.key === "free") { const rowsNeedingLookup = targetRows.filter((row) => !isRecentlyFetchedAsset(row.asset)); const usage = consumeFreeApiLookup(rowsNeedingLookup.length || 1); if (!usage.ok) { showPlanLimitNotice("api"); return; } }
    const cachedRows = targetRows.filter((row) => isRecentlyFetchedAsset(row.asset));
    const fetchRows = targetRows.filter((row) => !isRecentlyFetchedAsset(row.asset));
    const uniqueTickers = Array.from(new Set(fetchRows.map((row) => row.ticker)));
    setIsBulkAssetLookupLoading(true);
    setAssetLookupSummary(fetchRows.length > 0 ? `${fetchRows.length}개 자산 전체 조회 준비 중... 최근 조회값 ${cachedRows.length}개 유지` : `전체 조회 완료: 성공 ${targetRows.length}개, 실패 0개 (최근 조회값 유지)`);
    setAssetLookupStatus((previousStatus) => { const nextStatus = { ...previousStatus }; cachedRows.forEach((row) => { nextStatus[row.statusKey] = { status: "success", message: "최근 조회값 유지" }; }); fetchRows.forEach((row) => { nextStatus[row.statusKey] = { status: "loading", message: "조회 중" }; }); return nextStatus; });
    try {
      const lookupResults = uniqueTickers.length > 0 ? await fetchAssetDataBatch(uniqueTickers, { onProgress: ({ ticker, index, total, status }) => { const stepText = `${index + 1}/${total}`; if (status === "waiting") { setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 대기 중...`); return; } if (status === "loading") { setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 조회 중...`); return; } if (status === "success") { setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 조회 완료`); return; } if (status === "rate-limit") { setAssetLookupSummary(`Alpha Vantage 호출 제한: ${ticker}부터 기존값 유지`); return; } if (status === "error") setAssetLookupSummary(`전체 조회 중: ${stepText} ${ticker} 조회 실패`); } }) : [];
      const resultMap = new Map(lookupResults.map((lookupResult) => [lookupResult.ticker, lookupResult]));
      const rowResults = targetRows.map((row) => isRecentlyFetchedAsset(row.asset) ? { ...row, lookupResult: { ticker: row.ticker, status: "success", data: row.asset, cacheMode: "client-recent" } } : { ...row, lookupResult: resultMap.get(row.ticker) });
      const successCount = rowResults.filter((row) => row.lookupResult?.status === "success").length;
      const errorCount = rowResults.filter((row) => row.lookupResult?.status !== "success").length;
      setAssets((previousAssets) => previousAssets.map((asset, index) => { const rowResult = rowResults.find((row) => row.index === index); if (rowResult?.lookupResult?.status === "success") return applyFetchedAssetData(asset, rowResult.lookupResult.data, index); return asset; }));
      setAssetLookupStatus((previousStatus) => { const nextStatus = { ...previousStatus }; rowResults.forEach((row) => { nextStatus[row.statusKey] = row.lookupResult?.status === "success" ? { status: "success", message: row.lookupResult?.cacheMode === "client-recent" || row.lookupResult?.data?.cacheMode === "hit" ? "캐시값" : "조회 완료" } : { status: "error", message: row.lookupResult?.error || "조회 실패" }; }); return nextStatus; });
      const failedTickers = Array.from(new Set(rowResults.filter((row) => row.lookupResult?.status !== "success").map((row) => row.ticker)));
      const failedTickerText = failedTickers.length > 0 ? ` (${failedTickers.join(", ")})` : "";
      const cacheCount = rowResults.filter((row) => row.lookupResult?.cacheMode === "client-recent" || row.lookupResult?.data?.cacheMode === "hit" || String(row.lookupResult?.data?.dataSource || "").includes("cache")).length;
      const cacheText = cacheCount > 0 ? `, 캐시 ${cacheCount}개` : "";
      const rateLimitRows = rowResults.filter((row) => isRateLimitMessage(row.lookupResult?.error || ""));
      setAssetLookupSummary(rateLimitRows.length > 0 ? `Alpha Vantage 호출 제한: 성공 ${successCount}개, 실패 ${errorCount}개${cacheText}. 기존값을 유지합니다.` : `전체 조회 완료: 성공 ${successCount}개, 실패 ${errorCount}개${cacheText}${failedTickerText}`);
    } catch (error) { setAssetLookupSummary(`전체 조회 중 오류: ${error?.message || "알 수 없는 오류"}`); }
    finally { setIsBulkAssetLookupLoading(false); }
  }

  function createAssetFromTickerCandidate(candidate = {}, index = assets.length) { const market = candidate.market || "US"; return normalizeAsset({ ticker: candidate.ticker || "", name: candidate.koreanName || candidate.name || candidate.ticker || "", market, exchange: candidate.exchange, currency: candidate.currency || "KRW", quoteCurrency: candidate.quoteCurrency || (market === "KR" ? "KRW" : "USD"), assetType: candidate.assetType || candidate.type || "ETF", quantity: 0, price: 0, targetEvaluationAmount: null, cagr: candidate.expectedCagr ?? candidate.cagr ?? 0, beta: candidate.beta ?? 0, mdd: candidate.mdd ?? 0, dividendYield: preserveNullableNumber(candidate.dividendYield, null), priceMode: market === "KR" ? "manual" : "lookup-required", metricMode: "manual", dataSource: "ticker-master", cacheMode: null, rawPrice: null, rawCurrency: candidate.quoteCurrency || candidate.currency || (market === "KR" ? "KRW" : "USD"), exchangeRate: null, lastUpdatedAt: null }, index); }

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
    setAssets((previousAssets) => { const emptyIndex = previousAssets.findIndex((asset) => { const tickerValue = normalizeTicker(asset?.ticker); return !tickerValue || isEmptyAssetRow(asset); }); if (emptyIndex >= 0) return previousAssets.map((asset, index) => index === emptyIndex ? normalizeAsset(nextAsset, index) : asset); return [...previousAssets, normalizeAsset(nextAsset, previousAssets.length)]; });
    setRecentlyAddedAssetId(nextAsset.id);
    window.setTimeout(() => setRecentlyAddedAssetId(null), 4200);
    const marketLabel = nextAsset.market === "KR" ? "한국" : "미국";
    const message = `${ticker} ${marketLabel} 후보 자산을 현재 포트폴리오에 추가했습니다. 비중을 입력하고 계산 버튼을 누르세요.`;
    setAssetLookupSummary(message);
    return { status: "success", ticker, asset: nextAsset, message };
  }

  function addAsset() { setAssets([...assets, normalizeAsset({ ...EMPTY_ASSETS[0], id: `asset-${Date.now()}` }, assets.length)]); }
  function removeAsset(index) { const targetAsset = assets[index]; const targetKey = getAssetDraftKey(targetAsset, index); setTargetWeightDrafts((previousDrafts) => { const nextDrafts = { ...previousDrafts }; delete nextDrafts[targetKey]; return nextDrafts; }); setAssets(assets.filter((_, assetIndex) => assetIndex !== index)); }
  function cleanEmptyAssetRows() { const nextAssets = assets.filter((asset) => !isEmptyAssetRow(asset)); setAssets(nextAssets.length > 0 ? nextAssets : cloneAssets(DEFAULT_ASSETS)); setTargetWeightDrafts({}); }

  function selectPortfolio(id) { const nextPortfolio = portfolioList.find((portfolio) => portfolio.id === id); if (!nextPortfolio) return; setActivePortfolioId(id); setAssets(cloneAssets(nextPortfolio.assets)); setTargetWeightDrafts({}); setIsPortfolioDropdownOpen(false); }

  function createPortfolioFromTemplate(templateKey = "default") {
    const templateMap = { default: DEFAULT_ASSETS, balanced: DEFAULT_ASSETS, stable: STABLE_ASSETS, growth: GROWTH_ASSETS, dividend: DIVIDEND_ASSETS, empty: EMPTY_ASSETS, goldDefense: GOLD_DEFENSE_ASSETS, reitIncome: REIT_INCOME_ASSETS, growthZero: GROWTH_ZERO_ASSETS, growthFocus: GROWTH_FOCUS_ASSETS, allWeather: ALL_WEATHER_ASSETS, highConviction: HIGH_CONVICTION_ASSETS };
    const nameMap = { default: "기본 포트폴리오", balanced: "균형형 포트폴리오", stable: "안정형 포트폴리오", growth: "성장형 포트폴리오", dividend: "배당형 포트폴리오", empty: "빈 포트폴리오", goldDefense: "금 방어형 포트폴리오", reitIncome: "리츠 인컴형 포트폴리오", growthZero: "성장주 제로형 포트폴리오", growthFocus: "성장주 집중형 포트폴리오", allWeather: "올웨더형 포트폴리오", highConviction: "하이컨빅션형 포트폴리오" };
    const nextPortfolio = createPortfolio({ name: nameMap[templateKey] || "새 포트폴리오", assets: templateMap[templateKey] || DEFAULT_ASSETS, settings });
    setPortfolioList([nextPortfolio, ...portfolioList]);
    setActivePortfolioId(nextPortfolio.id);
    setAssets(cloneAssets(nextPortfolio.assets));
    setTargetWeightDrafts({});
    setIsNewPortfolioMenuOpen(false);
  }

  function duplicateActivePortfolio() { const duplicatedPortfolio = createPortfolio({ name: `${activePortfolio?.name || "포트폴리오"} 복사본`, assets, settings }); setPortfolioList([duplicatedPortfolio, ...portfolioList]); setActivePortfolioId(duplicatedPortfolio.id); setAssets(cloneAssets(duplicatedPortfolio.assets)); setTargetWeightDrafts({}); }
  function renameActivePortfolio(nextName) { setPortfolioList((previousList) => previousList.map((portfolio) => portfolio.id === activePortfolioId ? { ...portfolio, name: nextName, updatedAt: new Date().toISOString() } : portfolio)); }
  function deleteActivePortfolio() { if (portfolioList.length <= 1) return; const nextPortfolioList = portfolioList.filter((portfolio) => portfolio.id !== activePortfolioId); const nextActivePortfolio = nextPortfolioList[0]; setPortfolioList(nextPortfolioList); setActivePortfolioId(nextActivePortfolio.id); setAssets(cloneAssets(nextActivePortfolio.assets)); setTargetWeightDrafts({}); }
  function resetActivePortfolioAssets() { setAssets(cloneAssets(DEFAULT_ASSETS)); setTargetWeightDrafts({}); }
  function resetGlobalSettings() { setSettings(DEFAULT_SETTINGS); }
  function changeSimulatorTab(nextTab) { setActiveSimulatorTab(nextTab); }
  function scrollToPortfolioTop() { document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function selectPortfolioFromFloating(id) { selectPortfolio(id); }

  function downloadPortfolioBackup() { downloadJsonFile({ portfolioList, activePortfolioId, globalSettings: settings, appVersion: FINPLE_APP_VERSION, backupVersion: FINPLE_BACKUP_VERSION, schemaVersion: FINPLE_BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString() }, createBackupFileName(activePortfolio?.name)); }
  function openPortfolioBackupFile() { backupFileInputRef.current?.click(); }
  function restorePortfolioBackup(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsedData = JSON.parse(reader.result); if (!isValidBackupData(parsedData)) throw new Error("백업 파일 형식이 올바르지 않습니다."); const nextState = applyPortfolioPlanLimitToState(loadPortfolioState(parsedData)); setPortfolioList(nextState.portfolioList); setActivePortfolioId(nextState.activePortfolioId); setAssets(cloneAssets(nextState.activePortfolio.assets)); setTargetWeightDrafts({}); setSettings(normalizeGlobalSettings(nextState.globalSettings || DEFAULT_SETTINGS)); } catch (error) { window.alert(error?.message || "백업 파일을 복원하지 못했습니다."); } finally { event.target.value = ""; } }; reader.readAsText(file); }
  function downloadReportText() { downloadTextFile(createPortfolioReportText({ activePortfolio, detailReport, settings, result, assets }), `${createSafeFileName(activePortfolio?.name, "FINPLE-report")}.txt`); }
  function saveReportPdf() { window.print(); }
  function printReport() { window.print(); }
  function reportPdfFileName() { return `${createSafeFileName(activePortfolio?.name, "FINPLE-report")}.pdf`; }
  function copyReportSummary() { navigator.clipboard?.writeText(createReportSummaryText({ activePortfolio, detailReport, settings, result, assets })); }

  return { portfolioList, activePortfolioId, activePortfolio, settings, assets, targetWeightDrafts, targetWeightSummary, assetLookupStatus, isBulkAssetLookupLoading, assetLookupSummary, recentlyAddedAssetId, dataManagementSummary, activeSimulatorTab, isPortfolioDropdownOpen, setIsPortfolioDropdownOpen, isNewPortfolioMenuOpen, setIsNewPortfolioMenuOpen, backupFileInputRef, result, yearlyContribution, totalAssetValue, simulationStartValue, expectedCagr, expectedDividendYield, expectedBeta, simpleMdd, expectedCalmar, expectedAnnualDividend, performanceRows, futureValue, inflationAdjustedFutureValue, insightComparisonPortfolios, chartComparisonPortfolios, detailReport, updateSetting, updateAsset, updateTargetWeightDraft, applyTargetWeights, resetTargetWeights, equalizeTargetWeights, fetchAssetData, fetchAllAssetData, resolveTickerCandidate, addAsset, addAssetFromTickerCandidate, removeAsset, cleanEmptyAssetRows, selectPortfolio, createPortfolioFromTemplate, duplicateActivePortfolio, downloadPortfolioBackup, openPortfolioBackupFile, restorePortfolioBackup, downloadReportText, saveReportPdf, printReport, reportPdfFileName, copyReportSummary, renameActivePortfolio, deleteActivePortfolio, resetActivePortfolioAssets, resetGlobalSettings, changeSimulatorTab, scrollToPortfolioTop, selectPortfolioFromFloating, formatNumber, formatDecimal, formatPercent, toNumber, isAutoAsset, isAutoPriceAsset, isAutoMetricAsset, isEmptyAssetRow };
}
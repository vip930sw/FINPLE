import { useEffect, useMemo, useRef, useState } from "react";

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
  duplicatePortfolio,
  loadPortfolioState,
  normalizeAsset,
  normalizeGlobalSettings,
} from "../utils/portfolioFactory";
import {
  deletePortfolioState,
  getPortfolioCreationDecision,
} from "../utils/portfolioLifecycle.js";
import { writeScopedPortfolioStorageItem } from "../utils/portfolioStorageScope.js";

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
  getStep4ScenarioAssets,
  isAutoAsset,
  isEmptyAssetRow,
  toNumber,
} from "../utils/portfolioFormatters";
import {
  formatPortfolioEligibilityBlocks,
  formatUserFacingBaselineBlockReasons,
} from "../utils/baselineBlockReasonLabels.js";
import {
  DUPLICATE_ASSET_ALERT_MESSAGE,
  findDuplicateAssetIndex,
} from "../utils/portfolioAssetDuplicatePolicy.js";

import { downloadJsonFile, downloadTextFile } from "../utils/portfolioDownloads";
import { createPortfolioReportText, createReportSummaryText } from "../utils/portfolioReports";
import { normalizeTickerForMarket } from "../config/marketConfig.js";
import { normalizeSimulatorTab } from "../utils/simulatorNavigation";
import {
  getScreenerCandidateSnapshot,
  findScreenerCandidateByTicker,
  hydratePortfolioAssetFromActiveCatalog,
  hydratePortfolioFromActiveCatalog,
  loadScreenerCandidateRuntime,
  subscribeScreenerCandidateSnapshot,
} from "../../../data/tickers/screenerCandidateLoader";
import { reconcileIdentityScopedAssetMetadata } from "../../../data/tickers/portfolioAssetIdentityMetadata";
import { loadMonthlyReturnsForIdentities } from "../../../data/tickers/appPreviewDataSource";
import {
  isProductionMonthlyScenarioArtifactConfigured,
  loadProductionMonthlyReturnsForIdentities,
} from "../../../data/tickers/productionAppExportDataSource";
import { getPortfolioAddDecision } from "../../../data/tickers/portfolioEligibilityPolicy.js";
import { createManualCashAsset, isManualCashAsset } from "../../../data/tickers/manualCashAsset";
import {
  buildAppExportScenarioResult,
  getAppExportScenarioErrorMessage,
  resolveAppExportScenarioState,
} from "../utils/appPreviewScenarioService";
import {
  buildStep5ProductionScenarioState,
  getStep5MonthlyArtifactIdentities,
  getStep5MonthlyArtifactIdentityFingerprint,
} from "../utils/step5ProductionScenarioService.js";

import {
  getPlanLimitMessage,
  getStoredFinplePlan,
  getUpgradePromptText,
  FINPLE_PLAN_CONFIGS,
} from "../config/planConfig";

const FINPLE_APP_VERSION = "1.0.0";
const FINPLE_BACKUP_VERSION = "1.0.0";
const FINPLE_BACKUP_SCHEMA_VERSION = 2;
const DUPLICATE_TICKER_RESOLUTION = Symbol("duplicate-ticker-resolution");

function formatStorageDate(value) { if (!value) return "-"; try { const date = new Date(value); if (Number.isNaN(date.getTime())) return "-"; return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date); } catch (error) { return "-"; } }
function createBackupFileName(portfolioName = "portfolio") { const now = new Date(); const date = now.toISOString().slice(0, 10).replaceAll("-", ""); const time = now.toTimeString().slice(0, 5).replace(":", ""); const safeName = createSafeFileName(portfolioName, "portfolio"); return `FINPLE-backup-${safeName}-${date}-${time}.json`; }
function isValidBackupData(parsedData) { return parsedData && typeof parsedData === "object" && Array.isArray(parsedData.portfolioList) && parsedData.portfolioList.length > 0; }
function getCurrentPlanConfig() { const planKey = getStoredFinplePlan(); return FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free; }

function openPricingSection() { if (typeof window === "undefined") return; try { window.dispatchEvent(new CustomEvent("finple-open-pricing")); } catch (error) {} window.setTimeout(() => { const pricingTarget = document.querySelector("#pricing, .accountPlanGrid, .pricingStatusPanel"); if (pricingTarget) { pricingTarget.scrollIntoView({ behavior: "smooth", block: "start" }); return; } try { window.localStorage.setItem("finple-current-page", "home"); window.location.hash = "pricing"; window.location.reload(); } catch (error) { window.location.hash = "pricing"; } }, 80); }
function countRealAssets(assetList = []) { return assetList.filter((asset) => { const ticker = normalizeTicker(asset?.ticker); return ticker && ticker !== "XXX"; }).length; }
function isActivatingEmptyAsset(currentAsset, field, value) { if (field !== "ticker") return false; const currentTicker = normalizeTicker(currentAsset?.ticker); const nextTicker = normalizeTicker(value); return !currentTicker && Boolean(nextTicker); }
function parseWeightValue(value) { if (value === "" || value === null || value === undefined) return 0; const numberValue = Number(value); if (!Number.isFinite(numberValue)) return 0; return Math.max(0, numberValue); }
function normalizeTicker(ticker, market = "US") { return normalizeTickerForMarket(ticker, market); }
function hydrateLoadedPortfolioState(portfolioState = {}) {
  const portfolioList = Array.isArray(portfolioState.portfolioList)
    ? portfolioState.portfolioList.map(hydratePortfolioFromActiveCatalog)
    : [];
  const activePortfolio = portfolioList.find(
    (portfolio) => portfolio.id === portfolioState.activePortfolioId,
  ) || portfolioList[0] || null;
  return {
    ...portfolioState,
    portfolioList,
    activePortfolioId: activePortfolio?.id || null,
    activePortfolio,
  };
}

export default function usePortfolioSimulator({
  probabilityAnalysisAllowed = false,
  externalShockAnalysisAllowed = false,
} = {}) {
  const [initialPortfolioState] = useState(() => hydrateLoadedPortfolioState(
    loadPortfolioState(),
  ));
  const [portfolioList, setPortfolioList] = useState(initialPortfolioState.portfolioList);
  const [activePortfolioId, setActivePortfolioId] = useState(initialPortfolioState.activePortfolioId);
  const [settings, setSettings] = useState(initialPortfolioState.globalSettings || DEFAULT_SETTINGS);
  const [assets, setAssets] = useState(() =>
    cloneAssets(initialPortfolioState.activePortfolio?.assets || [])
  );
  const [targetWeightDrafts, setTargetWeightDrafts] = useState({});
  const [activeSimulatorTab, setActiveSimulatorTab] = useState("settings");
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [isNewPortfolioMenuOpen, setIsNewPortfolioMenuOpen] = useState(false);
  const [assetLookupSummary, setAssetLookupSummary] = useState("canonical 자산 지표를 사용합니다.");
  const [recentlyAddedAssetId, setRecentlyAddedAssetId] = useState(null);
  const [portfolioAddDialog, setPortfolioAddDialog] = useState(null);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState(() => new Date().toISOString());
  const [portfolioCreationEvent, setPortfolioCreationEvent] = useState({
    id: 0,
    message: "",
  });
  const [screenerCandidateSnapshot, setScreenerCandidateSnapshot] = useState(
    () => getScreenerCandidateSnapshot(),
  );
  const [monthlyScenarioArtifactState, setMonthlyScenarioArtifactState] = useState({
    status: "idle",
    result: null,
    error: null,
    identityFingerprint: "",
  });
  const backupFileInputRef = useRef(null);

  useEffect(() => { writeScopedPortfolioStorageItem(PORTFOLIO_LIST_STORAGE_KEY, JSON.stringify(portfolioList)); setLastLocalSaveAt(new Date().toISOString()); }, [portfolioList]);
  useEffect(() => { writeScopedPortfolioStorageItem(ACTIVE_PORTFOLIO_STORAGE_KEY, activePortfolioId || null); setLastLocalSaveAt(new Date().toISOString()); }, [activePortfolioId]);
  useEffect(() => { setPortfolioList((previousList) => previousList.map((portfolio) => portfolio.id === activePortfolioId ? { ...portfolio, assets, updatedAt: new Date().toISOString() } : portfolio)); }, [assets, activePortfolioId]);
  useEffect(() => { writeScopedPortfolioStorageItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings)); setLastLocalSaveAt(new Date().toISOString()); }, [settings]);
  useEffect(() => {
    let canonicalCatalogApplied = false;
    function applySnapshot(snapshot) {
      setScreenerCandidateSnapshot(snapshot);
      if (snapshot.preview.status === "canonical_catalog_load_error") {
        setAssetLookupSummary(
          "최신 자산 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }
      if (canonicalCatalogApplied || snapshot.candidates.length === 0) {
        return;
      }
      canonicalCatalogApplied = true;
      setPortfolioList((previousList) => previousList.map((portfolio) => ({
          ...portfolio,
          assets: portfolio.assets.map((asset, index) =>
            normalizeAsset(hydratePortfolioAssetFromActiveCatalog(asset), index)
          ),
        })));
        setAssets((previousAssets) => previousAssets.map((asset, index) =>
          normalizeAsset(hydratePortfolioAssetFromActiveCatalog(asset), index)
        ));
      setAssetLookupSummary(
        `최신 canonical 데이터 ${snapshot.candidates.length.toLocaleString("ko-KR")}개 자산을 불러왔습니다.`,
      );
    }
    const unsubscribe = subscribeScreenerCandidateSnapshot(applySnapshot);
    loadScreenerCandidateRuntime()
      .then(applySnapshot)
      .catch((error) => {
        console.error("[FINPLE monthly scenario artifact load error]", error);
      });
    return unsubscribe;
  }, []);

  const isCanonicalCatalogUnavailable =
    screenerCandidateSnapshot.preview.status === "canonical_catalog_load_error";
  const result = isCanonicalCatalogUnavailable
    ? {
        ...calculatePortfolioResult(settings, []),
        blockReasons: ["canonical_catalog_load_error"],
        step3BlockedState: {
          status: "blocked",
          operatorAction: "reload_canonical_catalog",
          userFacingState: "canonical_catalog_load_error",
        },
      }
    : calculatePortfolioResult(settings, assets);
  const { yearlyContribution, totalAssetValue, simulationStartValue, expectedCagr, expectedDividendYield, expectedBeta, simpleMdd, expectedCalmar, expectedAnnualDividend, performanceRows, futureValue, inflationAdjustedFutureValue } = result;
  const effectiveStep4Settings = useMemo(
    () => ({ ...settings, startValue: simulationStartValue }),
    [settings, simulationStartValue],
  );
  const scenarioAssets = useMemo(() => getStep4ScenarioAssets(assets), [assets]);
  const monthlyArtifactIdentities = useMemo(
    () => getStep5MonthlyArtifactIdentities(scenarioAssets),
    [scenarioAssets],
  );
  const monthlyArtifactIdentityFingerprint = useMemo(
    () => getStep5MonthlyArtifactIdentityFingerprint(scenarioAssets),
    [scenarioAssets],
  );
  const step4BaselineBlockMessage = result.status !== "ready"
    ? [
        ...formatUserFacingBaselineBlockReasons(result.blockReasons),
        ...formatPortfolioEligibilityBlocks(result.portfolioEligibilityBlocks),
      ].filter(Boolean).join(" ")
    : Number(effectiveStep4Settings.startValue) > 0
      ? ""
      : "시작 평가금액을 0원보다 크게 입력해 주세요.";
  const comparisonPortfolios = isCanonicalCatalogUnavailable
    ? []
    : createComparisonPortfolios(portfolioList, activePortfolioId, assets, settings);
  const rankedComparisonPortfolios = createRankedComparisonPortfolios(comparisonPortfolios);
  const insightComparisonPortfolios = createInsightComparisonPortfolios(rankedComparisonPortfolios);
  const chartComparisonPortfolios = getChartComparisonPortfolios(insightComparisonPortfolios);
  const activePortfolio = getActivePortfolioById(portfolioList, activePortfolioId);
  const detailPortfolio = getDetailPortfolioById(rankedComparisonPortfolios, activePortfolioId);
  const detailReport = isCanonicalCatalogUnavailable
    ? null
    : activePortfolio
    ? getPortfolioDetailReport({ ...activePortfolio, assets, result }, rankedComparisonPortfolios)
    : detailPortfolio
      ? getPortfolioDetailReport(detailPortfolio, rankedComparisonPortfolios)
      : null;
  const activeAssetCount = assets.filter((asset) => !isEmptyAssetRow(asset)).length;
  const emptyAssetCount = assets.length - activeAssetCount;
  const dataManagementSummary = { appVersion: FINPLE_APP_VERSION, backupVersion: FINPLE_BACKUP_VERSION, portfolioCount: portfolioList.length, activeAssetCount, emptyAssetCount, lastLocalSaveAt, lastLocalSaveText: formatStorageDate(lastLocalSaveAt), activePortfolioUpdatedAt: activePortfolio?.updatedAt || null, activePortfolioUpdatedText: formatStorageDate(activePortfolio?.updatedAt) };

  useEffect(() => {
    if (activeSimulatorTab === "probability" && !probabilityAnalysisAllowed) {
      setMonthlyScenarioArtifactState({ status: "idle", result: null, error: null, identityFingerprint: "" });
      return undefined;
    }
    if (activeSimulatorTab === "shock" && !externalShockAnalysisAllowed) {
      setMonthlyScenarioArtifactState({ status: "idle", result: null, error: null, identityFingerprint: "" });
      return undefined;
    }
    const monthlyArtifactAllowed = ["probability", "shock"].includes(activeSimulatorTab);
    if (!monthlyArtifactAllowed) {
      setMonthlyScenarioArtifactState({ status: "idle", result: null, error: null, identityFingerprint: "" });
      return undefined;
    }
    if (step4BaselineBlockMessage) {
      setMonthlyScenarioArtifactState({
        status: "blocked",
        result: null,
        error: step4BaselineBlockMessage,
        identityFingerprint: monthlyArtifactIdentityFingerprint,
      });
      return undefined;
    }
    const unknownCash = scenarioAssets.find(
      (asset) => normalizeTicker(asset?.ticker) === "CASH" && !isManualCashAsset(asset),
    );
    if (unknownCash) {
      setMonthlyScenarioArtifactState({
        status: "blocked",
        result: null,
        error: "CASH: 포트폴리오에 사용할 수 없는 자산입니다.",
        identityFingerprint: monthlyArtifactIdentityFingerprint,
      });
      return undefined;
    }
    if (scenarioAssets.length > 0 && scenarioAssets.every(isManualCashAsset)) {
      setMonthlyScenarioArtifactState({ status: "cash_only", result: null, error: null, identityFingerprint: monthlyArtifactIdentityFingerprint });
      return undefined;
    }
    const internalPreviewMode =
      screenerCandidateSnapshot.preview.status === "internal_preview_review_only";
    const productionMode = isProductionMonthlyScenarioArtifactConfigured();
    if (!internalPreviewMode && !productionMode) {
      setMonthlyScenarioArtifactState({
        status: "unconfigured",
        result: null,
        error: "검증된 월간 수익률 데이터가 연결되지 않았습니다.",
        identityFingerprint: monthlyArtifactIdentityFingerprint,
      });
      return undefined;
    }
    const identities = monthlyArtifactIdentities;
    if (identities.length === 0) {
      setMonthlyScenarioArtifactState({
        status: "unavailable",
        result: null,
        error: "월수익률을 조회할 자산이 없습니다.",
        identityFingerprint: monthlyArtifactIdentityFingerprint,
      });
      return undefined;
    }
    let cancelled = false;
    setMonthlyScenarioArtifactState({ status: "loading", result: null, error: null, identityFingerprint: monthlyArtifactIdentityFingerprint });
    const monthlyLoader = productionMode
      ? loadProductionMonthlyReturnsForIdentities
      : loadMonthlyReturnsForIdentities;
    resolveAppExportScenarioState({
      identities,
      loadMonthlyReturns: monthlyLoader,
      isCancelled: () => cancelled,
      buildScenario: (monthlyReturns) => monthlyReturns,
    })
      .then((scenarioState) => {
        if (cancelled || scenarioState.status === "cancelled") return;
        setMonthlyScenarioArtifactState({
          status: scenarioState.status,
          result: scenarioState.result,
          error: scenarioState.error,
          identityFingerprint: monthlyArtifactIdentityFingerprint,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setMonthlyScenarioArtifactState({
          status: "unavailable",
          result: null,
          error: "확률분석 시나리오를 계산하지 못했습니다.",
          identityFingerprint: monthlyArtifactIdentityFingerprint,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [
    activePortfolio,
    activeSimulatorTab,
    assets,
    externalShockAnalysisAllowed,
    probabilityAnalysisAllowed,
    screenerCandidateSnapshot.preview.status,
    effectiveStep4Settings,
    monthlyArtifactIdentities,
    monthlyArtifactIdentityFingerprint,
    scenarioAssets,
    step4BaselineBlockMessage,
  ]);

  const previewScenarioState = useMemo(() => {
    if (activeSimulatorTab !== "probability" || monthlyScenarioArtifactState.status !== "ready") {
      return {
        status: activeSimulatorTab === "probability" ? monthlyScenarioArtifactState.status : "idle",
        result: null,
        error: activeSimulatorTab === "probability" ? monthlyScenarioArtifactState.error : null,
      };
    }
    const monthlyReturns = monthlyScenarioArtifactState.result;
    try {
      return {
        status: "ready",
        result: buildAppExportScenarioResult({
          activePortfolio,
          assets: scenarioAssets,
          settings: effectiveStep4Settings,
          rowsByIdentity: monthlyReturns.rowsByIdentity,
          manifest: monthlyReturns.sourceManifest || monthlyReturns.manifest,
          release: monthlyReturns.release || null,
          monthlyRowContract: monthlyReturns.monthlyRowContract || "proxy_aware_v2",
          legacyProductionBindingVerified: monthlyReturns.legacyProductionBindingVerified === true,
          catalogPolicyByIdentity: monthlyReturns.catalogPolicyByIdentity || null,
          runtimeMode: monthlyReturns.release
            ? "production_app_export_ready"
            : "internal_preview_review_only",
        }),
        error: null,
      };
    } catch (error) {
      return { status: "unavailable", result: null, error: getAppExportScenarioErrorMessage(error) };
    }
  }, [
    activePortfolio,
    activeSimulatorTab,
    effectiveStep4Settings,
    monthlyScenarioArtifactState,
    scenarioAssets,
  ]);

  const step5ScenarioState = useMemo(() => {
    if (activeSimulatorTab !== "shock") {
      return { result: null, results: [], status: "idle", error: null };
    }
    if (monthlyScenarioArtifactState.status !== "ready") {
      const status = monthlyScenarioArtifactState.status === "cash_only"
        ? "insufficient_data"
        : ["unavailable", "unconfigured"].includes(monthlyScenarioArtifactState.status)
          ? "error"
          : monthlyScenarioArtifactState.status;
      return { result: null, results: [], status, error: monthlyScenarioArtifactState.error };
    }
    return buildStep5ProductionScenarioState({
      activePortfolio,
      assets: scenarioAssets,
      settings: effectiveStep4Settings,
      monthlyReturns: monthlyScenarioArtifactState.result,
      monthlyArtifactIdentityFingerprint: monthlyScenarioArtifactState.identityFingerprint,
    });
  }, [
    activePortfolio,
    activeSimulatorTab,
    effectiveStep4Settings,
    monthlyScenarioArtifactState,
    scenarioAssets,
  ]);

  function getAssetDraftKey(asset, index) { return asset?.id || `${normalizeTicker(asset?.ticker) || "asset"}-${index}`; }
  function getEffectiveTargetWeight(asset, index) { const key = getAssetDraftKey(asset, index); if (Object.prototype.hasOwnProperty.call(targetWeightDrafts, key)) return parseWeightValue(targetWeightDrafts[key]); return parseWeightValue(asset?.targetWeight); }
  const targetWeightRows = assets.map((asset, index) => ({ asset, index, key: getAssetDraftKey(asset, index), ticker: normalizeTicker(asset?.ticker), targetWeight: getEffectiveTargetWeight(asset, index), isEmpty: isEmptyAssetRow(asset) })).filter((row) => !row.isEmpty && row.ticker);
  const targetWeightTotal = targetWeightRows.reduce((sum, row) => sum + row.targetWeight, 0);
  const targetWeightOverAmount = Math.max(0, targetWeightTotal - 100);
  const targetWeightRemaining = Math.max(0, 100 - targetWeightTotal);
  const targetWeightIsBalanced = Math.abs(targetWeightTotal - 100) <= 0.01;
  const targetWeightSummary = { total: Number(targetWeightTotal.toFixed(2)), remaining: Number(targetWeightRemaining.toFixed(2)), overAmount: Number(targetWeightOverAmount.toFixed(2)), hasCash: false, isOver: targetWeightTotal > 100.01, isApplyDisabled: targetWeightRows.length === 0 || simulationStartValue <= 0 || !targetWeightIsBalanced };

  function showPlanLimitNotice(type) { const currentPlan = getCurrentPlanConfig(); const message = getPlanLimitMessage(currentPlan.key, type); setAssetLookupSummary(`${message} 요금제 화면에서 Personal/Pro 기능을 확인할 수 있습니다.`); if (typeof window !== "undefined") { const shouldMove = window.confirm(getUpgradePromptText(currentPlan.key, type)); if (shouldMove) openPricingSection(); } return message; }
  function canIncreasePortfolioCount(requestedCount = 1, currentCount = portfolioList.length) {
    const currentPlan = getCurrentPlanConfig();
    const decision = getPortfolioCreationDecision({
      portfolioCount: currentCount,
      portfolioLimit: currentPlan.limits.portfolios,
      requestedCount,
    });
    if (!decision.allowed) showPlanLimitNotice("portfolio");
    return decision.allowed;
  }
  function rejectDuplicateAsset({ index = -1, ticker, clearRow = false } = {}) {
    const normalizedTicker = normalizeTicker(ticker);
    if (clearRow && Number.isInteger(index) && assets[index]) {
      const currentAsset = assets[index];
      const currentKey = getAssetDraftKey(currentAsset, index);
      setTargetWeightDrafts((previousDrafts) => {
        const nextDrafts = { ...previousDrafts };
        delete nextDrafts[currentKey];
        return nextDrafts;
      });
      setAssets((previousAssets) => previousAssets.map((asset, assetIndex) =>
        assetIndex === index
          ? normalizeAsset({ ...EMPTY_ASSETS[0], id: asset.id }, assetIndex)
          : asset
      ));
    }
    const message = `${normalizedTicker || "자산"}는 이미 현재 포트폴리오에 포함되어 있습니다.`;
    setAssetLookupSummary(message);
    if (typeof window !== "undefined") {
      window.alert(DUPLICATE_ASSET_ALERT_MESSAGE);
    }
    return { status: "duplicate", ticker: normalizedTicker, message };
  }
  function updateSetting(field, value) { setSettings((previous) => ({ ...previous, [field]: value })); }
  function updateTargetWeightDraft(index, value) { const asset = assets[index]; if (!asset) return; const key = getAssetDraftKey(asset, index); setTargetWeightDrafts((previousDrafts) => ({ ...previousDrafts, [key]: value })); }
  function resetTargetWeights() { setTargetWeightDrafts({}); setAssetLookupSummary("목표비중 입력값을 저장된 목표비중으로 되돌렸습니다."); }
  function equalizeTargetWeights() { const rows = targetWeightRows; if (rows.length === 0) { window.alert("균등분배할 수 있는 자산이 없습니다. 자산을 먼저 추가해 주세요."); return; } const baseWeight = Math.floor((100 / rows.length) * 100) / 100; const nextDrafts = {}; rows.forEach((row, rowIndex) => { const value = rowIndex === rows.length - 1 ? Number((100 - baseWeight * (rows.length - 1)).toFixed(2)) : baseWeight; nextDrafts[row.key] = String(value); }); setTargetWeightDrafts(nextDrafts); setAssetLookupSummary("전체 자산 목표비중을 균등분배했습니다. 계산 버튼을 누르면 평가금액이 반영됩니다."); }
  function applyTargetWeights() { const startValue = Number(simulationStartValue || 0); if (startValue <= 0) { window.alert("시작 평가금액이 0원입니다. 시작 평가금액을 입력해 주세요."); return; } const rows = targetWeightRows.filter((row) => row.ticker); if (rows.length === 0) { window.alert("목표비중을 적용할 자산이 없습니다."); return; } const nextTotal = rows.reduce((sum, row) => sum + row.targetWeight, 0); if (Math.abs(nextTotal - 100) > 0.01) { window.alert("목표비중 합계를 100%로 맞춘 뒤 적용해 주세요."); return; } const targetMap = new Map(rows.map((row) => [row.index, row.targetWeight])); setAssets((previousAssets) => previousAssets.map((asset, index) => { if (!targetMap.has(index)) return asset; const targetWeight = Number(targetMap.get(index) || 0); return { ...asset, targetWeight, targetEvaluationAmount: Number((startValue * targetWeight / 100).toFixed(0)) }; })); setTargetWeightDrafts({}); setAssetLookupSummary("목표비중을 적용했습니다. 시작 평가금액 기준으로 평가금액을 계산했습니다."); }

  function updateAsset(index, field, value) {
    const nextAssets = [...assets];
    const currentAsset = nextAssets[index];
    if (!currentAsset) return false;
    if (
      field === "ticker" &&
      findDuplicateAssetIndex({
        assets: nextAssets,
        ticker: value,
        market: currentAsset.market,
        excludeIndex: index,
      }) >= 0
    ) {
      rejectDuplicateAsset({ index, ticker: value, clearRow: true });
      return false;
    }
    const currentPlan = getCurrentPlanConfig();
    const assetLimit = currentPlan.limits.assetsPerPortfolio;
    if (
      assetLimit &&
      assetLimit !== Infinity &&
      isActivatingEmptyAsset(currentAsset, field, value) &&
      countRealAssets(nextAssets) >= assetLimit
    ) {
      showPlanLimitNotice("asset");
      return false;
    }
    if (field === "targetWeight") {
      updateTargetWeightDraft(index, value);
      return true;
    }
    if (field === "ticker") {
      const currentKey = getAssetDraftKey(currentAsset, index);
      setTargetWeightDrafts((previousDrafts) => {
        const nextDrafts = { ...previousDrafts };
        delete nextDrafts[currentKey];
        return nextDrafts;
      });
      const nextTicker = normalizeTicker(value);
      const previousTicker = normalizeTicker(currentAsset.ticker);
      const tickerChanged = nextTicker !== previousTicker;
      const identityBaseAsset = reconcileIdentityScopedAssetMetadata(
        currentAsset,
        {
          market: currentAsset.market,
          ticker: nextTicker,
        },
      );
      nextAssets[index] = normalizeAsset(
        {
          ...identityBaseAsset,
          ticker: nextTicker,
          name: tickerChanged ? "" : currentAsset.name,
          price: tickerChanged ? 0 : currentAsset.price,
          targetEvaluationAmount: tickerChanged
            ? null
            : currentAsset.targetEvaluationAmount,
          cagr: tickerChanged ? 0 : currentAsset.cagr,
          beta: tickerChanged ? 0 : currentAsset.beta,
          mdd: tickerChanged ? 0 : currentAsset.mdd,
          dividendYield: tickerChanged ? null : currentAsset.dividendYield,
          displayDividendYield: tickerChanged
            ? ""
            : currentAsset.displayDividendYield,
          exposureType: tickerChanged ? "" : currentAsset.exposureType,
          distributionType: tickerChanged
            ? "unknown"
            : currentAsset.distributionType,
          distributionFrequency: tickerChanged
            ? "unknown"
            : currentAsset.distributionFrequency,
          trailingDistributionYield: tickerChanged
            ? null
            : currentAsset.trailingDistributionYield,
          cashDistributionYieldTtm: tickerChanged
            ? null
            : currentAsset.cashDistributionYieldTtm,
          distributionYieldPolicy: tickerChanged
            ? ""
            : currentAsset.distributionYieldPolicy,
          distributionCalculationStatus: tickerChanged
            ? ""
            : currentAsset.distributionCalculationStatus,
          priceMode: tickerChanged ? "manual" : currentAsset.priceMode,
          metricMode: tickerChanged ? "manual" : currentAsset.metricMode,
          dataSource: tickerChanged ? "manual" : currentAsset.dataSource,
          cacheMode: tickerChanged ? null : currentAsset.cacheMode,
          rawPrice: tickerChanged ? null : currentAsset.rawPrice,
          rawCurrency: tickerChanged ? null : currentAsset.rawCurrency,
          exchangeRate: tickerChanged ? null : currentAsset.exchangeRate,
          lastUpdatedAt: tickerChanged ? null : currentAsset.lastUpdatedAt,
        },
        index,
      );
    } else {
      nextAssets[index] = { ...currentAsset, [field]: value };
    }
    setAssets(nextAssets);
    return true;
  }
  function applyTickerCandidateToAsset(currentAsset, candidate = {}, index = assets.length) {
    const candidateHydratedAsset = hydratePortfolioAssetFromActiveCatalog(
      currentAsset,
      { candidate },
    );
    const ticker = normalizeTicker(
      candidateHydratedAsset.ticker || candidate.ticker || currentAsset.ticker,
    );
    return normalizeAsset(
      {
        ...candidateHydratedAsset,
        name:
          candidate.koreanName ||
          candidate.name ||
          currentAsset.name ||
          ticker,
        cacheMode: null,
      },
      index,
    );
  }
  async function resolveTickerCandidate(index, options = {}) {
    const targetAsset = assets[index];
    const ticker = normalizeTicker(options.ticker || targetAsset?.ticker);
    if (!ticker) return null;
    if (
      findDuplicateAssetIndex({
        assets,
        ticker,
        market: options.market || targetAsset?.market,
        excludeIndex: index,
      }) >= 0
    ) {
      rejectDuplicateAsset({ index, ticker, clearRow: true });
      return DUPLICATE_TICKER_RESOLUTION;
    }
    try {
      const market = options.market || targetAsset?.market;
      const candidate = ticker === "CASH"
        ? createManualCashAsset()
        : findScreenerCandidateByTicker(ticker, market);
      if (!candidate) throw new Error(`${ticker}는 canonical catalog에 없습니다.`);
      if (
        findDuplicateAssetIndex({
          assets,
          ticker: candidate?.ticker || ticker,
          market: candidate?.market || options.market || targetAsset?.market,
          excludeIndex: index,
        }) >= 0
      ) {
        rejectDuplicateAsset({ index, ticker, clearRow: true });
        return DUPLICATE_TICKER_RESOLUTION;
      }
      setAssets((previousAssets) => {
        const nextAssets = [...previousAssets];
        const currentAsset = nextAssets[index];
        if (!currentAsset || normalizeTicker(currentAsset.ticker) !== ticker) {
          return previousAssets;
        }
        nextAssets[index] = applyTickerCandidateToAsset(
          currentAsset,
          candidate,
          index,
        );
        return nextAssets;
      });
      if (!options.silent) {
        const decision = getPortfolioAddDecision(candidate);
        if (decision.policy !== "allow") {
          setPortfolioAddDialog({
            candidate,
            decision,
            existingAsset: true,
            existingAssetIndex: index,
          });
        }
        setAssetLookupSummary(
          `${ticker} 티커 마스터 정보 적용. 비중을 입력하고 계산 버튼을 누르면 평가금액이 반영됩니다.`,
        );
      }
      return candidate;
    } catch {
      if (!options.silent) {
        setAssetLookupSummary(
          `${ticker}는 티커 마스터에서 찾지 못했습니다. 직접 입력값으로 유지합니다.`,
        );
      }
      return null;
    }
  }
  function createAssetFromTickerCandidate(candidate = {}, index = assets.length) {
    const market = candidate.market || "US";
    return normalizeAsset(
      hydratePortfolioAssetFromActiveCatalog(
        {
          ticker: candidate.ticker || "",
          name:
            candidate.koreanName ||
            candidate.name ||
            candidate.ticker ||
            "",
          market,
          exchange: candidate.exchange,
          currency: candidate.currency || "KRW",
          quoteCurrency:
            candidate.quoteCurrency || (market === "KR" ? "KRW" : "USD"),
          assetType: candidate.assetType || candidate.type || "ETF",
          quantity: 0,
          price: 0,
          targetEvaluationAmount: null,
          targetWeight: null,
          priceMode: "manual",
          cacheMode: null,
          rawPrice: null,
          rawCurrency:
            candidate.quoteCurrency ||
            candidate.currency ||
            (market === "KR" ? "KRW" : "USD"),
          exchangeRate: null,
          lastUpdatedAt: null,
          portfolioRiskConfirmed: candidate.portfolioRiskConfirmed === true,
        },
        { candidate },
      ),
      index,
    );
  }
  function commitTickerCandidate(candidate) {
    const ticker = normalizeTicker(candidate?.ticker);
    if (!ticker) {
      const message = "추가할 자산 정보가 없습니다.";
      setAssetLookupSummary(message);
      return { status: "error", message };
    }
    if (
      findDuplicateAssetIndex({
        assets,
        ticker,
        market: candidate?.market,
      }) >= 0
    ) {
      return rejectDuplicateAsset({ ticker });
    }
    const assetLimit = getCurrentPlanConfig().limits.assetsPerPortfolio;
    if (
      assetLimit &&
      assetLimit !== Infinity &&
      countRealAssets(assets) >= assetLimit
    ) {
      const message = showPlanLimitNotice("asset");
      return { status: "limit", ticker, message };
    }
    const nextAsset = createAssetFromTickerCandidate(candidate, assets.length);
    setAssets((previousAssets) => {
      const emptyIndex = previousAssets.findIndex((asset) => {
        const tickerValue = normalizeTicker(asset?.ticker);
        return !tickerValue || isEmptyAssetRow(asset);
      });
      if (emptyIndex >= 0) {
        return previousAssets.map((asset, index) =>
          index === emptyIndex ? normalizeAsset(nextAsset, index) : asset
        );
      }
      return [...previousAssets, normalizeAsset(nextAsset, previousAssets.length)];
    });
    setRecentlyAddedAssetId(nextAsset.id);
    window.setTimeout(() => setRecentlyAddedAssetId(null), 1500);
    const message = `${ticker} 후보 자산을 현재 포트폴리오에 추가했습니다.`;
    setAssetLookupSummary(message);
    return { status: "success", ticker, asset: nextAsset, message };
  }
  function addAssetFromTickerCandidate(candidate) {
    if (
      findDuplicateAssetIndex({
        assets,
        ticker: candidate?.ticker,
        market: candidate?.market,
      }) >= 0
    ) {
      return rejectDuplicateAsset({ ticker: candidate?.ticker });
    }
    const decision = getPortfolioAddDecision(candidate);
    if (decision.policy !== "allow") {
      setPortfolioAddDialog({ candidate, decision });
      return {
        status: decision.policy === "deny" ? "denied" : "confirmation_required",
        ticker: normalizeTicker(candidate?.ticker),
        decision,
      };
    }
    return commitTickerCandidate(candidate);
  }
  function confirmPortfolioAssetAdd() {
    const candidate = portfolioAddDialog?.candidate;
    const existingAssetIndex = portfolioAddDialog?.existingAsset
      ? portfolioAddDialog.existingAssetIndex
      : -1;
    if (
      candidate &&
      findDuplicateAssetIndex({
        assets,
        ticker: candidate.ticker,
        market: candidate.market,
        excludeIndex: existingAssetIndex,
      }) >= 0
    ) {
      setPortfolioAddDialog(null);
      return rejectDuplicateAsset({
        index: existingAssetIndex,
        ticker: candidate.ticker,
        clearRow: existingAssetIndex >= 0,
      });
    }
    if (portfolioAddDialog?.existingAsset) {
      const index = existingAssetIndex;
      setAssets((previousAssets) => previousAssets.map((asset, assetIndex) =>
        assetIndex === index
          ? { ...asset, portfolioRiskConfirmed: true }
          : asset
      ));
      setPortfolioAddDialog(null);
      return { status: "confirmed", ticker: normalizeTicker(candidate?.ticker) };
    }
    setPortfolioAddDialog(null);
    return candidate
      ? commitTickerCandidate({ ...candidate, portfolioRiskConfirmed: true })
      : null;
  }
  function discardPendingExistingAsset() {
    const index = portfolioAddDialog?.existingAssetIndex;
    if (!Number.isInteger(index)) return;
    setAssets((previousAssets) => previousAssets.map((asset, assetIndex) =>
      assetIndex === index
        ? normalizeAsset({ ...EMPTY_ASSETS[0], id: asset.id }, assetIndex)
        : asset
    ));
  }
  function closePortfolioAddDialog() {
    discardPendingExistingAsset();
    setPortfolioAddDialog(null);
  }
  function viewPortfolioAddAssetDetails() {
    const ticker = normalizeTicker(portfolioAddDialog?.candidate?.ticker);
    discardPendingExistingAsset();
    setPortfolioAddDialog(null);
    if (typeof window !== "undefined") {
      window.history.pushState(
        {},
        "",
        `/screener${ticker ? `?asset=${encodeURIComponent(ticker)}` : ""}`,
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }
  function addCashAsset() {
    if (
      findDuplicateAssetIndex({
        assets,
        ticker: "CASH",
        market: "CASH",
      }) >= 0
    ) {
      return rejectDuplicateAsset({ ticker: "CASH" });
    }
    const assetLimit = getCurrentPlanConfig().limits.assetsPerPortfolio;
    if (Number.isFinite(assetLimit) && countRealAssets(assets) >= assetLimit) {
      showPlanLimitNotice("asset");
      return;
    }

    const cashAsset = createManualCashAsset({ id: `cash-${Date.now()}` });
    setAssets((previousAssets) => {
      const emptyIndex = previousAssets.findIndex((asset) => isEmptyAssetRow(asset));
      if (emptyIndex < 0) {
        return [...previousAssets, normalizeAsset(cashAsset, previousAssets.length)];
      }
      return previousAssets.map((asset, index) =>
        index === emptyIndex ? normalizeAsset(cashAsset, index) : asset
      );
    });
    setRecentlyAddedAssetId(cashAsset.id);
    window.setTimeout(() => setRecentlyAddedAssetId(null), 1500);
    const message = "현금 자산을 추가했습니다.";
    setAssetLookupSummary(message);
  }
  function addAsset() { setAssets([...assets, normalizeAsset({ ...EMPTY_ASSETS[0], id: `asset-${Date.now()}` }, assets.length)]); }
  function moveAsset(index, direction) { setAssets((previousAssets) => { const targetIndex = index + direction; if (targetIndex < 0 || targetIndex >= previousAssets.length) return previousAssets; const nextAssets = [...previousAssets]; [nextAssets[index], nextAssets[targetIndex]] = [nextAssets[targetIndex], nextAssets[index]]; return nextAssets; }); }
  function removeAsset(index) { const targetAsset = assets[index]; const targetKey = getAssetDraftKey(targetAsset, index); setTargetWeightDrafts((previousDrafts) => { const nextDrafts = { ...previousDrafts }; delete nextDrafts[targetKey]; return nextDrafts; }); setAssets(assets.filter((_, assetIndex) => assetIndex !== index)); }
  function cleanEmptyAssetRows() { const nextAssets = assets.filter((asset) => !isEmptyAssetRow(asset)); setAssets(nextAssets.length > 0 ? nextAssets : cloneAssets(DEFAULT_ASSETS)); setTargetWeightDrafts({}); }
  function selectPortfolio(id) {
    const nextPortfolio = portfolioList.find((portfolio) => portfolio.id === id);
    if (!nextPortfolio) return;
    const hydratedPortfolio = hydratePortfolioFromActiveCatalog(nextPortfolio);
    setActivePortfolioId(id);
    setAssets(cloneAssets(hydratedPortfolio.assets));
    setTargetWeightDrafts({});
    setIsPortfolioDropdownOpen(false);
  }
  function createPortfolioFromTemplate(templateKey = "default") {
    if (!canIncreasePortfolioCount()) return;
    const templateMap = {
      default: DEFAULT_ASSETS,
      balanced: DEFAULT_ASSETS,
      stable: STABLE_ASSETS,
      growth: GROWTH_ASSETS,
      dividend: DIVIDEND_ASSETS,
      empty: EMPTY_ASSETS,
      goldDefense: GOLD_DEFENSE_ASSETS,
      reitIncome: REIT_INCOME_ASSETS,
      growthZero: GROWTH_ZERO_ASSETS,
      growthFocus: GROWTH_FOCUS_ASSETS,
      allWeather: ALL_WEATHER_ASSETS,
      highConviction: HIGH_CONVICTION_ASSETS,
    };
    const nameMap = {
      default: "기본 포트폴리오",
      balanced: "균형형 포트폴리오",
      stable: "안정형 포트폴리오",
      growth: "성장형 포트폴리오",
      dividend: "배당형 포트폴리오",
      empty: "빈 포트폴리오",
      goldDefense: "금 방어형 포트폴리오",
      reitIncome: "리츠 인컴형 포트폴리오",
      growthZero: "성장주 제로형 포트폴리오",
      growthFocus: "성장주 집중형 포트폴리오",
      allWeather: "올웨더형 포트폴리오",
      highConviction: "하이컨빅션형 포트폴리오",
    };
    const sourceAssets = templateMap[templateKey] || DEFAULT_ASSETS;
    const nextAssets = sourceAssets.map(hydratePortfolioAssetFromActiveCatalog);
    const nextPortfolio = createPortfolio({
      name: nameMap[templateKey] || "새 포트폴리오",
      assets: nextAssets,
      settings,
    });
    const message =
      templateKey === "empty"
        ? "빈 포트폴리오를 생성했습니다."
        : `${nextPortfolio.name}를 생성했습니다.`;
    setPortfolioList((previousList) => [nextPortfolio, ...previousList]);
    setActivePortfolioId(nextPortfolio.id);
    setAssets(cloneAssets(nextPortfolio.assets));
    setTargetWeightDrafts({});
    setIsNewPortfolioMenuOpen(false);
    changeSimulatorTab("settings");
    setPortfolioCreationEvent((previous) => ({
      id: previous.id + 1,
      message,
    }));
    setAssetLookupSummary(
      templateKey === "empty"
        ? message
        : `${message} 자산 지표를 적용했습니다.`,
    );
  }
  function duplicateActivePortfolio() {
    if (!activePortfolio) return;
    if (!canIncreasePortfolioCount()) return;
    const duplicatedPortfolio = duplicatePortfolio(activePortfolio, {
      name: `${activePortfolio.name || "포트폴리오"} 복사본`,
      assets: assets.map(hydratePortfolioAssetFromActiveCatalog),
      settings,
    });
    setPortfolioList((previousList) => [duplicatedPortfolio, ...previousList]);
    setActivePortfolioId(duplicatedPortfolio.id);
    setAssets(cloneAssets(duplicatedPortfolio.assets));
    setTargetWeightDrafts({});
    setIsNewPortfolioMenuOpen(false);
    changeSimulatorTab("settings");
    setPortfolioCreationEvent((previous) => ({
      id: previous.id + 1,
      message: `${duplicatedPortfolio.name}을 생성했습니다.`,
    }));
  }
  function renameActivePortfolio(nextName) { setPortfolioList((previousList) => previousList.map((portfolio) => portfolio.id === activePortfolioId ? { ...portfolio, name: nextName, updatedAt: new Date().toISOString() } : portfolio)); }
  function deleteActivePortfolio(portfolioId = activePortfolioId) { const nextState = deletePortfolioState(portfolioList, portfolioId); setPortfolioList(nextState.portfolioList); setActivePortfolioId(nextState.activePortfolioId); setAssets(cloneAssets(nextState.activePortfolio?.assets || [])); setTargetWeightDrafts({}); }
  function resetActivePortfolioAssets() { setAssets(cloneAssets(DEFAULT_ASSETS.map(hydratePortfolioAssetFromActiveCatalog))); setTargetWeightDrafts({}); setAssetLookupSummary("기본 포트폴리오로 초기화하고 자산 지표를 적용했습니다."); }
  function resetGlobalSettings() { setSettings(DEFAULT_SETTINGS); }
  function changeSimulatorTab(nextTab) { setActiveSimulatorTab(normalizeSimulatorTab(nextTab)); }
  function scrollToPortfolioTop() { document.getElementById("saved-portfolios")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function selectPortfolioFromFloating(id) { selectPortfolio(id); }
  function downloadPortfolioBackup() { downloadJsonFile({ portfolioList, activePortfolioId, globalSettings: settings, appVersion: FINPLE_APP_VERSION, backupVersion: FINPLE_BACKUP_VERSION, schemaVersion: FINPLE_BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString() }, createBackupFileName(activePortfolio?.name)); }
  function openPortfolioBackupFile() { backupFileInputRef.current?.click(); }
  function restorePortfolioBackup(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsedData = JSON.parse(reader.result); if (!isValidBackupData(parsedData)) throw new Error("백업 파일 형식이 올바르지 않습니다."); const nextState = loadPortfolioState(parsedData); const requestedCount = Math.max(0, nextState.portfolioList.length - portfolioList.length); if (!canIncreasePortfolioCount(requestedCount)) return; const hydratedPortfolioList = nextState.portfolioList.map(hydratePortfolioFromActiveCatalog); const hydratedActivePortfolio = hydratedPortfolioList.find((portfolio) => portfolio.id === nextState.activePortfolioId) || hydratedPortfolioList[0] || null; setPortfolioList(hydratedPortfolioList); setActivePortfolioId(hydratedActivePortfolio?.id || null); setAssets(cloneAssets(hydratedActivePortfolio?.assets || [])); setTargetWeightDrafts({}); setSettings(normalizeGlobalSettings(nextState.globalSettings || DEFAULT_SETTINGS)); } catch (error) { window.alert(error?.message || "백업 파일을 복원하지 못했습니다."); } finally { event.target.value = ""; } }; reader.readAsText(file); }
  function downloadReportText() { downloadTextFile(createPortfolioReportText({ activePortfolio, detailReport, settings, result, assets }), `${createSafeFileName(activePortfolio?.name, "FINPLE-report")}.txt`); }
  function saveReportPdf() { window.print(); }
  function printReport() { window.print(); }
  function reportPdfFileName() { return `${createSafeFileName(activePortfolio?.name, "FINPLE-report")}.pdf`; }
  function copyReportSummary() { navigator.clipboard?.writeText(createReportSummaryText({ activePortfolio, detailReport, settings, result, assets })); }

  return { portfolioList, activePortfolioId, activePortfolio, settings, effectiveStep4Settings, assets, targetWeightDrafts, targetWeightSummary, assetLookupSummary, recentlyAddedAssetId, portfolioAddDialog, confirmPortfolioAssetAdd, closePortfolioAddDialog, viewPortfolioAddAssetDetails, dataManagementSummary, activeSimulatorTab, screenerCandidateSnapshot, previewScenarioResult: previewScenarioState.result, previewScenarioStatus: previewScenarioState.status, previewScenarioError: previewScenarioState.error, step5ScenarioResult: step5ScenarioState.result, step5ScenarioResults: step5ScenarioState.results, step5ScenarioStatus: step5ScenarioState.status, step5ScenarioError: step5ScenarioState.error, isPortfolioDropdownOpen, setIsPortfolioDropdownOpen, isNewPortfolioMenuOpen, setIsNewPortfolioMenuOpen, portfolioCreationEvent, backupFileInputRef, result, yearlyContribution, totalAssetValue, simulationStartValue, expectedCagr, expectedDividendYield, expectedBeta, simpleMdd, expectedCalmar, expectedAnnualDividend, performanceRows, futureValue, inflationAdjustedFutureValue, insightComparisonPortfolios, chartComparisonPortfolios, detailReport, updateSetting, updateAsset, updateTargetWeightDraft, applyTargetWeights, resetTargetWeights, equalizeTargetWeights, resolveTickerCandidate, addAsset, addCashAsset, addAssetFromTickerCandidate, moveAsset, removeAsset, cleanEmptyAssetRows, selectPortfolio, createPortfolioFromTemplate, duplicateActivePortfolio, hydratePortfolioFromActiveCatalog, downloadPortfolioBackup, openPortfolioBackupFile, restorePortfolioBackup, downloadReportText, saveReportPdf, printReport, reportPdfFileName, copyReportSummary, renameActivePortfolio, deleteActivePortfolio, resetActivePortfolioAssets, resetGlobalSettings, changeSimulatorTab, scrollToPortfolioTop, selectPortfolioFromFloating, formatNumber, formatDecimal, formatPercent, toNumber, isAutoAsset, isEmptyAssetRow };
}

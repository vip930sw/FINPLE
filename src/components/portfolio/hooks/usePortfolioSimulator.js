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

    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
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
  return (
    parsedData &&
    typeof parsedData === "object" &&
    Array.isArray(parsedData.portfolioList) &&
    parsedData.portfolioList.length > 0
  );
}

function getCurrentPlanConfig() {
  const planKey = getStoredFinplePlan();
  return FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free;
}

function applyPortfolioPlanLimitToState(portfolioState) {
  const currentPlan = getCurrentPlanConfig();
  const portfolioLimit = currentPlan?.limits?.portfolios;

  if (!portfolioState || !Array.isArray(portfolioState.portfolioList)) {
    return portfolioState;
  }

  if (!Number.isFinite(portfolioLimit)) {
    return portfolioState;
  }

  const limit = Math.max(1, Number(portfolioLimit));

  if (portfolioState.portfolioList.length <= limit) {
    return portfolioState;
  }

  const activePortfolio =
    portfolioState.portfolioList.find(
      (portfolio) => portfolio.id === portfolioState.activePortfolioId
    ) || portfolioState.portfolioList[0];

  let nextPortfolioList = portfolioState.portfolioList.slice(0, limit);

  if (
    activePortfolio &&
    !nextPortfolioList.some((portfolio) => portfolio.id === activePortfolio.id)
  ) {
    nextPortfolioList = [
      ...nextPortfolioList.slice(0, Math.max(0, limit - 1)),
      activePortfolio,
    ];
  }

  const nextActivePortfolio =
    nextPortfolioList.find((portfolio) => portfolio.id === activePortfolio?.id) ||
    nextPortfolioList[0];

  return {
    ...portfolioState,
    portfolioList: nextPortfolioList,
    activePortfolioId: nextActivePortfolio.id,
    activePortfolio: nextActivePortfolio,
  };
}

function openPricingSection() {
  if (typeof window === "undefined") return;

  try {
    window.dispatchEvent(new CustomEvent("finple-open-pricing"));
  } catch (error) {
    // CustomEvent가 막히는 환경에서는 hash 이동만 사용합니다.
  }

  window.setTimeout(() => {
    const pricingTarget = document.querySelector("#pricing, .accountPlanGrid, .pricingStatusPanel");

    if (pricingTarget) {
      pricingTarget.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    try {
      window.localStorage.setItem("finple-current-page", "home");
      window.location.hash = "pricing";
      window.location.reload();
    } catch (error) {
      window.location.hash = "pricing";
    }
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
    const [initialPortfolioState] = useState(() =>
      applyPortfolioPlanLimitToState(loadPortfolioState())
    );

    const [portfolioList, setPortfolioList] = useState(
      initialPortfolioState.portfolioList
    );

    const [activePortfolioId, setActivePortfolioId] = useState(
      initialPortfolioState.activePortfolioId
    );

    const [settings, setSettings] = useState(
      initialPortfolioState.globalSettings || DEFAULT_SETTINGS
    );

    const [assets, setAssets] = useState(() =>
      cloneAssets(initialPortfolioState.activePortfolio.assets)
    );

    const [activeSimulatorTab, setActiveSimulatorTab] = useState("screener");
    const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
    const [isNewPortfolioMenuOpen, setIsNewPortfolioMenuOpen] = useState(false);
    const [assetLookupStatus, setAssetLookupStatus] = useState({});
    const [isBulkAssetLookupLoading, setIsBulkAssetLookupLoading] = useState(false);
    const [assetLookupSummary, setAssetLookupSummary] = useState(
      `조회 모드: ${getAssetDataProviderLabel()}`
    );
    const [recentlyAddedAssetId, setRecentlyAddedAssetId] = useState(null);
    const [lastLocalSaveAt, setLastLocalSaveAt] = useState(() => new Date().toISOString());

    const backupFileInputRef = useRef(null);

    useEffect(() => {
      localStorage.setItem(
        PORTFOLIO_LIST_STORAGE_KEY,
        JSON.stringify(portfolioList)
      );
      setLastLocalSaveAt(new Date().toISOString());
    }, [portfolioList]);

    useEffect(() => {
      localStorage.setItem(ACTIVE_PORTFOLIO_STORAGE_KEY, activePortfolioId);
      setLastLocalSaveAt(new Date().toISOString());
    }, [activePortfolioId]);

    useEffect(() => {
      setPortfolioList((previousList) =>
        previousList.map((portfolio) =>
          portfolio.id === activePortfolioId
            ? {
                ...portfolio,
                assets,
                updatedAt: new Date().toISOString(),
              }
            : portfolio
        )
      );
    }, [assets, activePortfolioId]);

    useEffect(() => {
      localStorage.setItem(
        GLOBAL_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );
      setLastLocalSaveAt(new Date().toISOString());
    }, [settings]);

    const result = calculatePortfolioResult(settings, assets);

    const {
      yearlyContribution,
      totalAssetValue,
      simulationStartValue,
      expectedCagr,
      expectedDividendYield,
      expectedBeta,
      simpleMdd,
      expectedCalmar,
      expectedAnnualDividend,
      performanceRows,
      futureValue,
      inflationAdjustedFutureValue,
    } = result;

    const comparisonPortfolios = createComparisonPortfolios(
      portfolioList,
      activePortfolioId,
      assets,
      settings
    );

    const rankedComparisonPortfolios = createRankedComparisonPortfolios(
      comparisonPortfolios
    );

    const insightComparisonPortfolios = createInsightComparisonPortfolios(
      rankedComparisonPortfolios
    );

    const chartComparisonPortfolios = getChartComparisonPortfolios(
      insightComparisonPortfolios
    );

    const activePortfolio = getActivePortfolioById(
      portfolioList,
      activePortfolioId
    );

    const detailPortfolio = getDetailPortfolioById(
      rankedComparisonPortfolios,
      activePortfolioId
    );

    const detailReport = detailPortfolio
      ? getPortfolioDetailReport(detailPortfolio, rankedComparisonPortfolios)
      : null;

    const activeAssetCount = assets.filter((asset) => !isEmptyAssetRow(asset)).length;
    const emptyAssetCount = assets.length - activeAssetCount;
    const dataManagementSummary = {
      appVersion: FINPLE_APP_VERSION,
      backupVersion: FINPLE_BACKUP_VERSION,
      portfolioCount: portfolioList.length,
      activeAssetCount,
      emptyAssetCount,
      lastLocalSaveAt,
      lastLocalSaveText: formatStorageDate(lastLocalSaveAt),
      activePortfolioUpdatedAt: activePortfolio?.updatedAt || null,
      activePortfolioUpdatedText: formatStorageDate(activePortfolio?.updatedAt),
    };

    function showPlanLimitNotice(type) {
      const currentPlan = getCurrentPlanConfig();
      const message = getPlanLimitMessage(currentPlan.key, type);
      setAssetLookupSummary(`${message} 요금제 화면에서 Personal/Pro 기능을 확인할 수 있습니다.`);

      if (typeof window !== "undefined") {
        const shouldMove = window.confirm(getUpgradePromptText(currentPlan.key, type));
        if (shouldMove) {
          openPricingSection();
        }
      }

      return message;
    }

    function updateSetting(field, value) {
      setSettings({
        ...settings,
        [field]: value,
      });
    }

    function updateAsset(index, field, value) {
      const nextAssets = [...assets];
      const currentAsset = nextAssets[index];

      if (!currentAsset) return;

      const currentPlan = getCurrentPlanConfig();
      const assetLimit = currentPlan.limits.assetsPerPortfolio;

      if (
        assetLimit &&
        assetLimit !== Infinity &&
        isActivatingEmptyAsset(currentAsset, field, value) &&
        countRealAssets(nextAssets) >= assetLimit
      ) {
        showPlanLimitNotice("asset");
        return;
      }

      if (field === "ticker") {
        const nextTicker = normalizeTicker(value);
        const previousTicker = normalizeTicker(currentAsset.ticker);
        const tickerChanged = nextTicker !== previousTicker;

        nextAssets[index] = normalizeAsset(
          {
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
          },
          index
        );
      } else {
        nextAssets[index] = {
          ...currentAsset,
          [field]: value,
        };
      }

      setAssets(nextAssets);
    }

    function getAssetStatusKey(asset, index) {
      return asset?.id || String(index);
    }

    function isRecentlyFetchedAsset(asset) {
      if (!asset?.lastUpdatedAt) return false;
      if (!String(asset?.dataSource || "").includes("alpha-vantage")) return false;

      const fetchedAt = new Date(asset.lastUpdatedAt).getTime();
      if (!Number.isFinite(fetchedAt)) return false;

      return Date.now() - fetchedAt < 24 * 60 * 60 * 1000;
    }

    function isRateLimitMessage(message = "") {
      return /Alpha Vantage|호출 제한|rate limit|premium/i.test(String(message));
    }

    function applyTickerCandidateToAsset(currentAsset, candidate = {}, index = assets.length) {
      const ticker = normalizeTicker(candidate.ticker || currentAsset.ticker);
      const currentPrice = Number(currentAsset.price || 0);
      const currentQuantity = Number(currentAsset.quantity || 0);

      return normalizeAsset(
        {
          ...currentAsset,
          ticker,
          name: candidate.koreanName || candidate.name || currentAsset.name || ticker,
          market: candidate.market || currentAsset.market || "US",
          currency: currentAsset.currency || "KRW",
          quantity: currentQuantity,
          price: currentPrice,
          cagr: candidate.expectedCagr ?? candidate.cagr ?? currentAsset.cagr ?? 0,
          beta: candidate.beta ?? currentAsset.beta ?? 0,
          mdd: candidate.mdd ?? currentAsset.mdd ?? 0,
          dividendYield: candidate.dividendYield ?? currentAsset.dividendYield ?? 0,
          priceMode: currentPrice > 0 ? currentAsset.priceMode : "lookup-required",
          metricMode: "manual",
          dataSource: "ticker-master",
          cacheMode: null,
          rawPrice: currentAsset.rawPrice || null,
          rawCurrency: candidate.currency || currentAsset.rawCurrency || null,
          exchangeRate: currentAsset.exchangeRate || null,
          lastUpdatedAt: currentAsset.lastUpdatedAt || null,
        },
        index
      );
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

          if (!currentAsset || normalizeTicker(currentAsset.ticker) !== ticker) {
            return previousAssets;
          }

          nextAssets[index] = applyTickerCandidateToAsset(currentAsset, candidate, index);
          return nextAssets;
        });

        if (!options.silent) {
          setAssetLookupSummary(`${ticker} 티커 마스터 정보 적용. 수량 입력 후 조회하면 현재가를 가져올 수 있습니다.`);
        }

        return candidate;
      } catch (error) {
        if (!options.silent) {
          setAssetLookupSummary(`${ticker}는 티커 마스터에서 찾지 못했습니다. 직접 입력값으로 유지합니다.`);
        }

        return null;
      }
    }

    function applyFetchedAssetData(currentAsset, assetData, index) {
      const nextTicker = assetData.ticker || currentAsset.ticker;
      const normalizedTicker = normalizeTicker(nextTicker);
      const fetchedName = assetData.name || "";
      const currentName = currentAsset.name || "";
      const fetchedNameIsTickerOnly =
        normalizeTicker(fetchedName) === normalizedTicker;
      const currentNameIsTickerOnly =
        normalizeTicker(currentName) === normalizeTicker(currentAsset.ticker);

      const nextName =
        fetchedName && (!fetchedNameIsTickerOnly || !currentName || currentNameIsTickerOnly)
          ? fetchedName
          : currentName;

      return normalizeAsset(
        {
          ...currentAsset,
          ticker: nextTicker,
          name: nextName,
          market: assetData.market || currentAsset.market,
          currency: assetData.currency || currentAsset.currency,
          price:
            assetData.price !== null && assetData.price !== undefined
              ? assetData.price
              : currentAsset.price,
          cagr:
            assetData.cagr !== null && assetData.cagr !== undefined
              ? assetData.cagr
              : currentAsset.cagr,
          beta:
            assetData.beta !== null && assetData.beta !== undefined
              ? assetData.beta
              : currentAsset.beta,
          mdd:
            assetData.mdd !== null && assetData.mdd !== undefined
              ? assetData.mdd
              : currentAsset.mdd,
          dividendYield:
            assetData.dividendYield !== null && assetData.dividendYield !== undefined
              ? assetData.dividendYield
              : currentAsset.dividendYield,
          priceMode: assetData.priceMode || currentAsset.priceMode,
          metricMode: assetData.metricMode || currentAsset.metricMode,
          dataSource: assetData.dataSource || currentAsset.dataSource,
          cacheMode: assetData.cacheMode || currentAsset.cacheMode || null,
          rawPrice:
            assetData.rawPrice !== null && assetData.rawPrice !== undefined
              ? assetData.rawPrice
              : currentAsset.rawPrice,
          rawCurrency: assetData.rawCurrency || currentAsset.rawCurrency || null,
          exchangeRate:
            assetData.exchangeRate !== null && assetData.exchangeRate !== undefined
              ? assetData.exchangeRate
              : currentAsset.exchangeRate,
          lastUpdatedAt: assetData.fetchedAt || currentAsset.lastUpdatedAt,
        },
        index
      );
    }

    async function fetchAssetData(index) {
      const targetAsset = assets[index];
      const ticker = normalizeTicker(targetAsset?.ticker);
      const statusKey = getAssetStatusKey(targetAsset, index);

      if (!ticker) {
        window.alert("티커를 먼저 입력해주세요.");
        return;
      }

      const currentPlan = getCurrentPlanConfig();
      if (currentPlan.key === "free") {
        const usage = consumeFreeApiLookup(1);
        if (!usage.ok) {
          const message = showPlanLimitNotice("api");
          setAssetLookupStatus((previousStatus) => ({
            ...previousStatus,
            [statusKey]: {
              status: "error",
              message: "Free 조회 한도",
            },
          }));
          return;
        }
      }

      setAssetLookupStatus((previousStatus) => ({
        ...previousStatus,
        [statusKey]: {
          status: "loading",
          message: "조회 중",
        },
      }));

      setAssetLookupSummary(`${ticker} 조회 중...`);

      try {
        const tickerCandidate = await resolveTickerCandidate(index, { silent: true });
        const assetData = await fetchAssetDataByTicker(ticker);

        setAssets((previousAssets) => {
          const nextAssets = [...previousAssets];
          const currentAsset = nextAssets[index];

          if (!currentAsset) return previousAssets;

          const candidateAppliedAsset = tickerCandidate
            ? applyTickerCandidateToAsset(currentAsset, tickerCandidate, index)
            : currentAsset;

          nextAssets[index] = applyFetchedAssetData(candidateAppliedAsset, assetData, index);

          return nextAssets;
        });

        setAssetLookupStatus((previousStatus) => ({
          ...previousStatus,
          [statusKey]: {
            status: "success",
            message: assetData?.cacheMode === "hit" ? "캐시값" : "조회 완료",
          },
        }));

        setAssetLookupSummary(
          assetData?.cacheMode === "hit"
            ? `${ticker} 캐시값 적용`
            : `${ticker} 조회 완료`
        );
      } catch (error) {
        const message = error?.message || "자산 데이터를 조회하지 못했습니다.";

        setAssetLookupStatus((previousStatus) => ({
          ...previousStatus,
          [statusKey]: {
            status: "error",
            message,
          },
        }));

        setAssetLookupSummary(
          isRateLimitMessage(message)
            ? `Alpha Vantage 호출 제한: ${ticker} 기존값 유지`
            : `${ticker} 조회 실패: ${message}`
        );
      }
    }

    async function fetchAllAssetData() {
      if (isBulkAssetLookupLoading) return;

      const targetRows = assets
        .map((asset, index) => ({
          asset,
          index,
          ticker: normalizeTicker(asset?.ticker),
          statusKey: getAssetStatusKey(asset, index),
        }))
        .filter((row) => {
          if (!row.ticker) return false;

          // XXX는 빈 행을 알아보기 위한 임시 티커로 쓰는 경우가 많아서
          // 전체 조회에서는 제외합니다. 개별 조회 버튼은 그대로 사용할 수 있습니다.
          if (row.ticker === "XXX" && isEmptyAssetRow(row.asset)) return false;

          return true;
        });

      if (targetRows.length === 0) {
        window.alert("조회할 티커가 없습니다.");
        return;
      }

      const currentPlan = getCurrentPlanConfig();
      if (currentPlan.key === "free") {
        const rowsNeedingLookup = targetRows.filter((row) => !isRecentlyFetchedAsset(row.asset));
        const usage = consumeFreeApiLookup(rowsNeedingLookup.length || 1);
        if (!usage.ok) {
          showPlanLimitNotice("api");
          return;
        }
      }

      const cachedRows = targetRows.filter((row) => isRecentlyFetchedAsset(row.asset));
      const fetchRows = targetRows.filter((row) => !isRecentlyFetchedAsset(row.asset));
      const uniqueTickers = Array.from(new Set(fetchRows.map((row) => row.ticker)));

      setIsBulkAssetLookupLoading(true);
      setAssetLookupSummary(
        fetchRows.length > 0
          ? `${fetchRows.length}개 자산 전체 조회 준비 중... 최근 조회값 ${cachedRows.length}개 유지`
          : `전체 조회 완료: 성공 ${targetRows.length}개, 실패 0개 (최근 조회값 유지)`
      );
      setAssetLookupStatus((previousStatus) => {
        const nextStatus = { ...previousStatus };

        cachedRows.forEach((row) => {
          nextStatus[row.statusKey] = {
            status: "success",
            message: "최근 조회값 유지",
          };
        });

        fetchRows.forEach((row) => {
          nextStatus[row.statusKey] = {
            status: "loading",
            message: "조회 중",
          };
        });

        return nextStatus;
      });

      try {
        const lookupResults = uniqueTickers.length > 0
          ? await fetchAssetDataBatch(uniqueTickers, {
              onProgress: ({ ticker, index, total, status }) => {
                const stepText = `${index + 1}/${total}`;

                if (status === "waiting") {
                  setAssetLookupSummary(
                    `전체 조회 중: ${stepText} ${ticker} 대기 중...`
                  );
                  return;
                }

                if (status === "loading") {
                  setAssetLookupSummary(
                    `전체 조회 중: ${stepText} ${ticker} 조회 중...`
                  );
                  return;
                }

                if (status === "success") {
                  setAssetLookupSummary(
                    `전체 조회 중: ${stepText} ${ticker} 조회 완료`
                  );
                  return;
                }

                if (status === "rate-limit") {
                  setAssetLookupSummary(
                    `Alpha Vantage 호출 제한: ${ticker}부터 기존값 유지`
                  );
                  return;
                }

                if (status === "error") {
                  setAssetLookupSummary(
                    `전체 조회 중: ${stepText} ${ticker} 조회 실패`
                  );
                }
              },
            })
          : [];
        const resultMap = new Map(
          lookupResults.map((lookupResult) => [lookupResult.ticker, lookupResult])
        );

        const rowResults = targetRows.map((row) => {
          if (isRecentlyFetchedAsset(row.asset)) {
            return {
              ...row,
              lookupResult: {
                ticker: row.ticker,
                status: "success",
                data: row.asset,
                cacheMode: "client-recent",
              },
            };
          }

          return {
            ...row,
            lookupResult: resultMap.get(row.ticker),
          };
        });

        const successCount = rowResults.filter(
          (row) => row.lookupResult?.status === "success"
        ).length;
        const errorCount = rowResults.filter(
          (row) => row.lookupResult?.status !== "success"
        ).length;

        setAssets((previousAssets) =>
          previousAssets.map((asset, index) => {
            const rowResult = rowResults.find((row) => row.index === index);

            if (rowResult?.lookupResult?.status === "success") {
              return applyFetchedAssetData(
                asset,
                rowResult.lookupResult.data,
                index
              );
            }

            return asset;
          })
        );

        setAssetLookupStatus((previousStatus) => {
          const nextStatus = { ...previousStatus };

          rowResults.forEach((row) => {
            if (row.lookupResult?.status === "success") {
              nextStatus[row.statusKey] = {
                status: "success",
                message:
                  row.lookupResult?.cacheMode === "client-recent" ||
                  row.lookupResult?.data?.cacheMode === "hit"
                    ? "캐시값"
                    : "조회 완료",
              };
              return;
            }

            nextStatus[row.statusKey] = {
              status: "error",
              message: row.lookupResult?.error || "조회 실패",
            };
          });

          return nextStatus;
        });

        const failedTickers = Array.from(
          new Set(
            rowResults
              .filter((row) => row.lookupResult?.status !== "success")
              .map((row) => row.ticker)
          )
        );
        const failedTickerText = failedTickers.length > 0
          ? ` (${failedTickers.join(", ")})`
          : "";

        const cacheCount = rowResults.filter(
          (row) =>
            row.lookupResult?.cacheMode === "client-recent" ||
            row.lookupResult?.data?.cacheMode === "hit" ||
            String(row.lookupResult?.data?.dataSource || "").includes("cache")
        ).length;
        const cacheText = cacheCount > 0 ? `, 캐시 ${cacheCount}개` : "";

        const rateLimitRows = rowResults.filter((row) =>
          isRateLimitMessage(row.lookupResult?.error || "")
        );

        setAssetLookupSummary(
          rateLimitRows.length > 0
            ? `Alpha Vantage 호출 제한: 성공 ${successCount}개, 실패 ${errorCount}개${cacheText}. 기존값을 유지합니다.`
            : `전체 조회 완료: 성공 ${successCount}개, 실패 ${errorCount}개${cacheText}${failedTickerText}`
        );
      } catch (error) {
        setAssetLookupSummary(
          `전체 조회 중 오류: ${error?.message || "알 수 없는 오류"}`
        );
      } finally {
        setIsBulkAssetLookupLoading(false);
      }
    }


    function createAssetFromTickerCandidate(candidate = {}, index = assets.length) {
      return normalizeAsset(
        {
          ticker: candidate.ticker || "",
          name: candidate.koreanName || candidate.name || candidate.ticker || "",
          market: candidate.market || "US",
          currency: "KRW",
          quantity: 0,
          price: 0,
          cagr: candidate.expectedCagr ?? candidate.cagr ?? 0,
          beta: candidate.beta ?? 0,
          mdd: candidate.mdd ?? 0,
          dividendYield: candidate.dividendYield ?? 0,
          priceMode: "lookup-required",
          metricMode: "manual",
          dataSource: "ticker-master",
          cacheMode: null,
          rawPrice: null,
          rawCurrency: candidate.currency || null,
          exchangeRate: null,
          lastUpdatedAt: null,
        },
        index
      );
    }

    function addAssetFromTickerCandidate(candidate) {
      const ticker = normalizeTicker(candidate?.ticker);

      if (!ticker) {
        setAssetLookupSummary("추가할 티커 정보가 없습니다.");
        return { status: "error", message: "추가할 티커 정보가 없습니다." };
      }

      const alreadyExists = assets.some((asset) => {
        const tickerValue = normalizeTicker(asset?.ticker);
        return tickerValue === ticker && !isEmptyAssetRow(asset);
      });

      if (alreadyExists) {
        const message = `${ticker}는 이미 현재 포트폴리오에 추가되어 있습니다.`;
        setAssetLookupSummary(message);
        return { status: "duplicate", ticker, message };
      }

      const currentPlan = getCurrentPlanConfig();
      const assetLimit = currentPlan.limits.assetsPerPortfolio;
      const activeAssetCount = countRealAssets(assets);
      if (assetLimit && assetLimit !== Infinity && activeAssetCount >= assetLimit) {
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

        return [...previousAssets, nextAsset];
      });

      setRecentlyAddedAssetId(nextAsset.id);
      window.setTimeout(() => {
        setRecentlyAddedAssetId((currentId) =>
          currentId === nextAsset.id ? null : currentId
        );
      }, 3500);

      window.setTimeout(() => {
        changeSimulatorTab("settings");
      }, 120);

      const message = `${ticker} 후보 자산 추가 완료. 수량을 입력하고 조회하면 현재가를 가져올 수 있습니다.`;
      setAssetLookupSummary(message);
      return { status: "added", ticker, assetId: nextAsset.id, message };
    }

    function addAsset() {
      const currentPlan = getCurrentPlanConfig();
      const assetLimit = currentPlan.limits.assetsPerPortfolio;

      if (assetLimit && assetLimit !== Infinity && countRealAssets(assets) >= assetLimit) {
        showPlanLimitNotice("asset");
        return;
      }

      setAssets([
        ...assets,
        normalizeAsset(
          {
            ticker: "",
            name: "",
            quantity: 0,
            price: 0,
            cagr: 0,
            beta: 0,
            mdd: 0,
            dividendYield: 0,
          },
          assets.length
        ),
      ]);
    }

    function removeAsset(index) {
      setAssets(assets.filter((_, i) => i !== index));
    }

    function selectPortfolio(portfolioId) {
      const selectedPortfolio = portfolioList.find(
        (portfolio) => portfolio.id === portfolioId
      );

      if (!selectedPortfolio) return;

      setActivePortfolioId(selectedPortfolio.id);
      setAssets(cloneAssets(selectedPortfolio.assets));
    }

    function createPortfolioFromTemplate(templateType) {
      const currentPlan = getCurrentPlanConfig();
      const portfolioLimit = currentPlan.limits.portfolios;

      if (portfolioLimit !== Infinity && portfolioList.length >= portfolioLimit) {
        showPlanLimitNotice("portfolio");
        setIsNewPortfolioMenuOpen(false);
        return;
      }

      const nextNumber = portfolioList.length + 1;

      const templateMap = {
        balanced: {
          name: `균형형 포트폴리오 ${nextNumber}`,
          assets: DEFAULT_ASSETS,
        },
        growth: {
          name: `성장형 포트폴리오 ${nextNumber}`,
          assets: GROWTH_ASSETS,
        },
        dividend: {
          name: `배당형 포트폴리오 ${nextNumber}`,
          assets: DIVIDEND_ASSETS,
        },
        stable: {
          name: `안정형 포트폴리오 ${nextNumber}`,
          assets: STABLE_ASSETS,
        },
        empty: {
          name: `빈 포트폴리오 ${nextNumber}`,
          assets: EMPTY_ASSETS,
        },
      };

      const selectedTemplate = templateMap[templateType] || templateMap.balanced;

      const newPortfolio = createPortfolio({
        name: selectedTemplate.name,
        assets: selectedTemplate.assets,
      });

      setPortfolioList([...portfolioList, newPortfolio]);
      setActivePortfolioId(newPortfolio.id);
      setAssets(cloneAssets(newPortfolio.assets));
      setIsNewPortfolioMenuOpen(false);
    }

    function duplicateActivePortfolio() {
      const currentPlan = getCurrentPlanConfig();
      const portfolioLimit = currentPlan.limits.portfolios;

      if (portfolioLimit !== Infinity && portfolioList.length >= portfolioLimit) {
        showPlanLimitNotice("portfolio");
        setIsNewPortfolioMenuOpen(false);
        return;
      }

      const nextNumber = portfolioList.length + 1;

      const newPortfolio = createPortfolio({
        name: `${activePortfolio?.name || "포트폴리오"} 복제 ${nextNumber}`,
        assets,
      });

      setPortfolioList([...portfolioList, newPortfolio]);
      setActivePortfolioId(newPortfolio.id);
      setAssets(cloneAssets(newPortfolio.assets));
      setIsNewPortfolioMenuOpen(false);
    }

    function downloadPortfolioBackup() {
      const backupData = {
        app: "FINPLE Portfolio Lab",
        appVersion: FINPLE_APP_VERSION,
        backupVersion: FINPLE_BACKUP_VERSION,
        schemaVersion: FINPLE_BACKUP_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        exportedFrom: "browser-local-storage",
        portfolioCount: portfolioList.length,
        activePortfolioId,
        globalSettings: settings,
        portfolioList,
      };

      downloadJsonFile(
        backupData,
        createBackupFileName(activePortfolio?.name || "portfolio")
      );
    }

    function openPortfolioBackupFile() {
      backupFileInputRef.current?.click();
    }

    function restorePortfolioBackup(event) {
      const file = event.target.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const parsedData = JSON.parse(String(reader.result || "{}"));

          if (!isValidBackupData(parsedData)) {
            window.alert(
              "올바른 FINPLE 포트폴리오 백업 파일이 아닙니다.\nportfolioList가 포함된 JSON 파일인지 확인해주세요."
            );
            return;
          }

          const restoredPortfolioList = ensureMinimumPortfolios(
            parsedData.portfolioList
          );

          const restoredActivePortfolio =
            restoredPortfolioList.find(
              (portfolio) => portfolio.id === parsedData.activePortfolioId
            ) || restoredPortfolioList[0];

          const restoredSettings = normalizeGlobalSettings(
            parsedData.globalSettings || DEFAULT_SETTINGS
          );

          const backupVersionText = parsedData.backupVersion
            ? `
백업 버전: ${parsedData.backupVersion}`
            : "";

          const confirmed = window.confirm(
            `백업 파일의 데이터로 복원할까요?

복원 대상: ${restoredPortfolioList.length}개 포트폴리오${backupVersionText}
현재 브라우저에 저장된 포트폴리오 목록과 공통 조건이 교체됩니다.`
          );

          if (!confirmed) return;

          setPortfolioList(restoredPortfolioList);
          setActivePortfolioId(restoredActivePortfolio.id);
          setAssets(cloneAssets(restoredActivePortfolio.assets));
          setSettings(restoredSettings);

          localStorage.setItem(
            PORTFOLIO_LIST_STORAGE_KEY,
            JSON.stringify(restoredPortfolioList)
          );
          localStorage.setItem(
            ACTIVE_PORTFOLIO_STORAGE_KEY,
            restoredActivePortfolio.id
          );
          localStorage.setItem(
            GLOBAL_SETTINGS_STORAGE_KEY,
            JSON.stringify(restoredSettings)
          );

          setLastLocalSaveAt(new Date().toISOString());
          window.alert("백업 데이터가 복원되었습니다.");
        } catch (error) {
          console.error("백업 파일을 불러오지 못했습니다.", error);
          window.alert(
            "백업 파일을 불러오지 못했습니다. JSON 파일 형식을 확인해주세요."
          );
        } finally {
          event.target.value = "";
        }
      };

      reader.readAsText(file);
    }

    function cleanEmptyAssetRows() {
      const cleanedAssets = assets.filter((asset) => {
        const ticker = normalizeTicker(asset?.ticker);

        if (!ticker && isEmptyAssetRow(asset)) return false;
        if (ticker === "XXX" && isEmptyAssetRow(asset)) return false;

        return true;
      });

      if (cleanedAssets.length === assets.length) {
        setAssetLookupSummary("정리할 빈 자산 행이 없습니다.");
        return;
      }

      const removedCount = assets.length - cleanedAssets.length;
      const nextAssets =
        cleanedAssets.length > 0
          ? cleanedAssets.map((asset, index) => normalizeAsset(asset, index))
          : cloneAssets(EMPTY_ASSETS);

      setAssets(nextAssets);
      setAssetLookupSummary(
        cleanedAssets.length > 0
          ? `빈 자산 행 ${removedCount}개를 정리했습니다.`
          : "모든 행이 비어 있어 최소 입력 행 1개를 유지했습니다."
      );
    }

    function getReportFileBaseName() {
      const today = new Date().toISOString().slice(0, 10);
      const safeName = createSafeFileName(activePortfolio?.name, "portfolio");
      return `FINPLE-report-${safeName}-${today}`;
    }

    const reportPdfFileName = `${getReportFileBaseName()}.pdf`;

    function downloadReportText() {
      const reportText = createPortfolioReportText({
        activePortfolio,
        detailReport,
        result,
        assets,
        detailPortfolio,
      });

      downloadTextFile(reportText, `${getReportFileBaseName()}.txt`);
    }

    function runPrintWithTitle(title) {
      if (typeof window === "undefined") {
        return;
      }

      const originalTitle = document.title;
      document.title = title;

      const restoreTitle = () => {
        document.title = originalTitle;
        window.removeEventListener("afterprint", restoreTitle);
      };

      window.addEventListener("afterprint", restoreTitle);
      window.setTimeout(() => window.print(), 80);
      window.setTimeout(() => {
        if (document.title === title) {
          restoreTitle();
        }
      }, 5000);
    }

    function saveReportPdf() {
      const currentPlan = getCurrentPlanConfig();
      if (currentPlan.key === "free") {
        showPlanLimitNotice("pdf");
        return;
      }

      runPrintWithTitle(reportPdfFileName);
    }

    function printReport() {
      const currentPlan = getCurrentPlanConfig();
      if (currentPlan.key === "free") {
        showPlanLimitNotice("pdf");
        return;
      }

      runPrintWithTitle(getReportFileBaseName());
    }

    function copyReportSummary() {
      const reportText = createReportSummaryText({
        activePortfolio,
        detailReport,
        result,
        assets,
      });

      if (navigator.clipboard) {
        navigator.clipboard.writeText(reportText);
        window.alert("공유용 리포트 요약 문구가 복사되었습니다.");
        return;
      }

      window.alert("현재 브라우저에서는 클립보드 복사를 지원하지 않습니다.");
    }

    function renameActivePortfolio(value) {
      setPortfolioList((previousList) =>
        previousList.map((portfolio) =>
          portfolio.id === activePortfolioId
            ? {
                ...portfolio,
                name: value,
                updatedAt: new Date().toISOString(),
              }
            : portfolio
        )
      );
    }

    function deleteActivePortfolio() {
      if (portfolioList.length <= 1) {
        window.alert("최소 1개의 포트폴리오는 남아 있어야 합니다.");
        return;
      }

      const confirmed = window.confirm(
        `현재 포트폴리오를 삭제할까요?\n\n삭제 대상: ${activePortfolio?.name || "현재 포트폴리오"}\n이 작업은 백업 파일이 없으면 되돌리기 어렵습니다.`
      );

      if (!confirmed) return;

      const nextPortfolioList = portfolioList.filter(
        (portfolio) => portfolio.id !== activePortfolioId
      );

      const nextActivePortfolio = nextPortfolioList[0];

      setPortfolioList(nextPortfolioList);
      setActivePortfolioId(nextActivePortfolio.id);
      setAssets(cloneAssets(nextActivePortfolio.assets));
    }

    function resetActivePortfolioAssets() {
      const confirmed = window.confirm(
        `현재 포트폴리오의 자산 구성을 기본값으로 되돌릴까요?\n\n대상: ${activePortfolio?.name || "현재 포트폴리오"}\n공통 조건(월 투자금, 투자기간, 물가상승률, 배당재투자)은 유지됩니다.`
      );

      if (!confirmed) return;

      setAssets(cloneAssets(DEFAULT_ASSETS));
    }

    function resetGlobalSettings() {
      const confirmed = window.confirm(
        "공통 조건을 기본값으로 되돌릴까요?\n현재 포트폴리오의 자산 구성은 유지됩니다."
      );

      if (!confirmed) return;

      setSettings(DEFAULT_SETTINGS);
    }

    function changeSimulatorTab(nextTab) {
      setActiveSimulatorTab(nextTab);

      window.setTimeout(() => {
        const targetMap = {
          screener: "#screener",
          settings: "#settings",
          compare: "#portfolio",
          detail: "#detail",
        };

        const targetSelector = targetMap[nextTab] || "#simulator";

        document.querySelector(targetSelector)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    }
  function scrollToPortfolioTop() {
      document.querySelector(".portfolioManager")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    function selectPortfolioFromFloating(portfolioId) {
      selectPortfolio(portfolioId);
      setIsPortfolioDropdownOpen(false);
    }

  return {
    portfolioList,
    activePortfolioId,
    activePortfolio,
    settings,
    assets,
    assetLookupStatus,
    isBulkAssetLookupLoading,
    assetLookupSummary,
    recentlyAddedAssetId,
    dataManagementSummary,
    activeSimulatorTab,
    isPortfolioDropdownOpen,
    setIsPortfolioDropdownOpen,
    isNewPortfolioMenuOpen,
    setIsNewPortfolioMenuOpen,
    backupFileInputRef,
    result,
    yearlyContribution,
    totalAssetValue,
    simulationStartValue,
    expectedCagr,
    expectedDividendYield,
    expectedBeta,
    simpleMdd,
    expectedCalmar,
    expectedAnnualDividend,
    performanceRows,
    futureValue,
    inflationAdjustedFutureValue,
    insightComparisonPortfolios,
    chartComparisonPortfolios,
    detailReport,
    updateSetting,
    updateAsset,
    fetchAssetData,
    fetchAllAssetData,
    resolveTickerCandidate,
    addAsset,
    addAssetFromTickerCandidate,
    removeAsset,
    cleanEmptyAssetRows,
    selectPortfolio,
    createPortfolioFromTemplate,
    duplicateActivePortfolio,
    downloadPortfolioBackup,
    openPortfolioBackupFile,
    restorePortfolioBackup,
    downloadReportText,
    saveReportPdf,
    printReport,
    reportPdfFileName,
    copyReportSummary,
    renameActivePortfolio,
    deleteActivePortfolio,
    resetActivePortfolioAssets,
    resetGlobalSettings,
    changeSimulatorTab,
    scrollToPortfolioTop,
    selectPortfolioFromFloating,
    formatNumber,
    formatDecimal,
    formatPercent,
    toNumber,
    isAutoAsset,
    isAutoPriceAsset,
    isAutoMetricAsset,
    isEmptyAssetRow,
  };
}

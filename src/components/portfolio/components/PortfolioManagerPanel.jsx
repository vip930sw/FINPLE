import { useState } from "react";

import {
  FINPLE_PLAN_CONFIGS,
  getPlanLimitMessage,
  getStoredFinplePlan,
  getUpgradePromptText,
} from "../config/planConfig";

const PORTFOLIO_LIST_STORAGE_KEY = "finple-portfolio-list";
const ACTIVE_PORTFOLIO_STORAGE_KEY = "finple-active-portfolio-id";
const GLOBAL_SETTINGS_STORAGE_KEY = "finple-global-settings";
const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_FINPLE_API_BASE_URL || "http://localhost:5050/api";

function getApiBaseUrl() {
  const env = import.meta?.env || {};
  const runtimeConfig =
    typeof window !== "undefined" ? window.FINPLE_ASSET_DATA_CONFIG || {} : {};

  return String(
    runtimeConfig.apiBaseUrl || env.VITE_FINPLE_API_BASE_URL || DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
}

function readJsonStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getServerRequestHeaders() {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const userId = window.localStorage.getItem("finple-user-id");
    if (userId) {
      headers["x-finple-user-id"] = userId;
    }
  }

  return headers;
}

async function readApiJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function normalizeServerPortfolioForLocal(portfolio, index = 0) {
  const assets = Array.isArray(portfolio?.assets)
    ? portfolio.assets.map((asset, assetIndex) => ({
        id: asset.id || `server-asset-${index}-${assetIndex}`,
        ticker: asset.ticker || "",
        name: asset.name || asset.ticker || "",
        market: asset.market || "US",
        currency: asset.currency || "KRW",
        quantity: Number(asset.quantity || 0),
        price: Number(asset.price || 0),
        cagr: Number(asset.cagr || 0),
        beta: Number(asset.beta || 0),
        mdd: Number(asset.mdd || 0),
        dividendYield: Number(asset.dividendYield || 0),
        priceMode: asset.priceMode || "manual",
        metricMode: asset.metricMode || "manual",
        dataSource: asset.dataSource || "server-db",
        cacheMode: asset.cacheMode || null,
        rawPrice:
          asset.rawPrice === null || asset.rawPrice === undefined
            ? null
            : Number(asset.rawPrice),
        rawCurrency: asset.rawCurrency || null,
        exchangeRate:
          asset.exchangeRate === null || asset.exchangeRate === undefined
            ? null
            : Number(asset.exchangeRate),
        lastUpdatedAt: asset.lastUpdatedAt || asset.fetchedAt || null,
      }))
    : [];

  return {
    id: portfolio.id || `server-portfolio-${index}`,
    name: portfolio.name || `서버 포트폴리오 ${index + 1}`,
    settings: {
      monthlyCashFlow: Number(portfolio.monthlyInvestment || 1000000),
      years: Number(portfolio.investmentYears || 10),
      inflationRate: Number(portfolio.inflationRate || 2.5),
      dividendReinvest:
        portfolio.dividendReinvest === undefined ? true : Boolean(portfolio.dividendReinvest),
    },
    assets,
    updatedAt: portfolio.updatedAt || portfolio.createdAt || new Date().toISOString(),
  };
}

function getGlobalSettingsFromServerPortfolio(portfolio) {
  return {
    monthlyCashFlow: Number(portfolio?.monthlyInvestment || 1000000),
    years: Number(portfolio?.investmentYears || 10),
    inflationRate: Number(portfolio?.inflationRate || 2.5),
    dividendReinvest:
      portfolio?.dividendReinvest === undefined ? true : Boolean(portfolio.dividendReinvest),
  };
}

function getCurrentPlanPortfolioLimit() {
  const planKey = getStoredFinplePlan();
  const currentPlan = FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free;
  const portfolioLimit = currentPlan?.limits?.portfolios;

  return Number.isFinite(portfolioLimit) ? Math.max(1, Number(portfolioLimit)) : Infinity;
}

function applyPortfolioLimit(portfolioList) {
  const portfolioLimit = getCurrentPlanPortfolioLimit();

  if (!Number.isFinite(portfolioLimit)) {
    return portfolioList;
  }

  return portfolioList.slice(0, portfolioLimit);
}

function openPricingPage() {
  if (typeof window === "undefined") return;
  window.location.href = "/pricing";
}

function showPortfolioLimitNotice() {
  const planKey = getStoredFinplePlan();
  const message = getPlanLimitMessage(planKey, "portfolio");
  const shouldMove = window.confirm(getUpgradePromptText(planKey, "portfolio"));
  if (shouldMove) openPricingPage();
  return message;
}

function getFriendlyServerSyncErrorMessage(error, actionLabel) {
  const rawMessage = String(error?.message || "").trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("network request failed")
  ) {
    return `${actionLabel}에 실패했습니다. 서버가 잠시 대기 상태이거나 네트워크 연결이 불안정할 수 있습니다. 30~60초 후 다시 시도해 주세요.`;
  }

  if (
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("401") ||
    normalizedMessage.includes("403")
  ) {
    return `${actionLabel}에 실패했습니다. 체험 계정 연결 상태를 다시 확인해 주세요.`;
  }

  if (normalizedMessage.includes("timeout") || normalizedMessage.includes("timed out")) {
    return `${actionLabel}에 실패했습니다. 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.`;
  }

  return `${actionLabel}에 실패했습니다. ${rawMessage || "잠시 후 다시 시도해 주세요."}`;
}

export default function PortfolioManagerPanel({
  portfolioList,
  activePortfolioId,
  activePortfolio,
  isNewPortfolioMenuOpen,
  setIsNewPortfolioMenuOpen,
  createPortfolioFromTemplate,
  duplicateActivePortfolio,
  selectPortfolio,
  renameActivePortfolio,
  deleteActivePortfolio,
  downloadPortfolioBackup,
  openPortfolioBackupFile,
  backupFileInputRef,
  restorePortfolioBackup,
  dataManagementSummary,
}) {
  const [serverSyncStatus, setServerSyncStatus] = useState(
    "서버 저장 전입니다. 필요할 때 수동 저장하거나 서버 데이터를 불러오세요. 첫 요청은 서버 준비로 잠시 지연될 수 있습니다."
  );
  const [isServerSyncLoading, setIsServerSyncLoading] = useState(false);
  const portfolioLimit = getCurrentPlanPortfolioLimit();
  const isPortfolioLimitReached =
    Number.isFinite(portfolioLimit) && Array.isArray(portfolioList) && portfolioList.length >= portfolioLimit;

  function handleNewPortfolioButtonClick() {
    if (isPortfolioLimitReached) {
      setIsNewPortfolioMenuOpen(false);
      showPortfolioLimitNotice();
      return;
    }

    setIsNewPortfolioMenuOpen(!isNewPortfolioMenuOpen);
  }

  function handleCreatePortfolioFromTemplate(templateKey) {
    if (isPortfolioLimitReached) {
      setIsNewPortfolioMenuOpen(false);
      showPortfolioLimitNotice();
      return;
    }

    createPortfolioFromTemplate(templateKey);
  }

  function handleDuplicateActivePortfolio() {
    if (isPortfolioLimitReached) {
      setIsNewPortfolioMenuOpen(false);
      showPortfolioLimitNotice();
      return;
    }

    duplicateActivePortfolio();
  }

  async function savePortfoliosToServer() {
    if (isServerSyncLoading) return;

    const localPortfolioList = readJsonStorage(
      PORTFOLIO_LIST_STORAGE_KEY,
      Array.isArray(portfolioList) ? portfolioList : []
    );
    const globalSettings = readJsonStorage(GLOBAL_SETTINGS_STORAGE_KEY, {});

    if (!Array.isArray(localPortfolioList) || localPortfolioList.length === 0) {
      window.alert("저장할 포트폴리오가 없습니다.");
      return;
    }

    setIsServerSyncLoading(true);
    setServerSyncStatus("서버에 포트폴리오를 저장하는 중입니다. 첫 요청은 잠시 걸릴 수 있습니다...");

    try {
      const response = await fetch(`${getApiBaseUrl()}/account/portfolios/sync-local`, {
        method: "POST",
        headers: getServerRequestHeaders(),
        body: JSON.stringify({
          portfolioList: localPortfolioList,
          activePortfolioId,
          globalSettings,
        }),
      });

      const payload = await readApiJson(response);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || "서버 저장에 실패했습니다.");
      }

      setServerSyncStatus(
        payload?.message ||
          `서버 저장 완료: ${payload?.syncedCount || localPortfolioList.length}개 포트폴리오`
      );
    } catch (error) {
      const friendlyMessage = getFriendlyServerSyncErrorMessage(error, "서버 저장");
      setServerSyncStatus(friendlyMessage);
      window.alert(friendlyMessage);
    } finally {
      setIsServerSyncLoading(false);
    }
  }

  async function loadPortfoliosFromServer() {
    if (isServerSyncLoading) return;

    const shouldLoad = window.confirm(
      "서버에 저장된 포트폴리오를 불러오면 현재 브라우저의 포트폴리오 목록이 서버 데이터로 교체됩니다. 계속할까요?"
    );

    if (!shouldLoad) return;

    setIsServerSyncLoading(true);
    setServerSyncStatus("서버 포트폴리오를 불러오는 중입니다. 첫 요청은 잠시 걸릴 수 있습니다...");

    try {
      const response = await fetch(`${getApiBaseUrl()}/account/portfolios`, {
        method: "GET",
        headers: getServerRequestHeaders(),
      });

      const payload = await readApiJson(response);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || "서버 포트폴리오를 불러오지 못했습니다.");
      }

      const serverPortfolios = Array.isArray(payload?.portfolios)
        ? payload.portfolios
        : [];

      if (serverPortfolios.length === 0) {
        setServerSyncStatus("서버에 저장된 포트폴리오가 없습니다.");
        window.alert("서버에 저장된 포트폴리오가 없습니다. 먼저 서버 저장을 실행해주세요.");
        return;
      }

      const normalizedServerPortfolioList = serverPortfolios.map(normalizeServerPortfolioForLocal);
      const nextPortfolioList = applyPortfolioLimit(normalizedServerPortfolioList);
      const nextActivePortfolioId =
        nextPortfolioList.find((portfolio) => portfolio.id === activePortfolioId)?.id ||
        nextPortfolioList[0].id;
      const nextGlobalSettings = getGlobalSettingsFromServerPortfolio(serverPortfolios[0]);

      window.localStorage.setItem(
        PORTFOLIO_LIST_STORAGE_KEY,
        JSON.stringify(nextPortfolioList)
      );
      window.localStorage.setItem(ACTIVE_PORTFOLIO_STORAGE_KEY, nextActivePortfolioId);
      window.localStorage.setItem(
        GLOBAL_SETTINGS_STORAGE_KEY,
        JSON.stringify(nextGlobalSettings)
      );

      const limitedCount = normalizedServerPortfolioList.length - nextPortfolioList.length;
      setServerSyncStatus(
        limitedCount > 0
          ? `서버 불러오기 완료: ${nextPortfolioList.length}개 포트폴리오. 현재 요금제 제한으로 ${limitedCount}개는 제외했습니다.`
          : `서버 불러오기 완료: ${nextPortfolioList.length}개 포트폴리오`
      );
      window.alert("서버 포트폴리오를 불러왔습니다. 화면을 새로고침합니다.");
      window.location.reload();
    } catch (error) {
      const friendlyMessage = getFriendlyServerSyncErrorMessage(error, "서버 불러오기");
      setServerSyncStatus(friendlyMessage);
      window.alert(friendlyMessage);
    } finally {
      setIsServerSyncLoading(false);
    }
  }

  return (
    <div className="portfolioManager">
      <div className="portfolioManagerTop">
        <div>
          <p className="portfolioManagerLabel">Saved Portfolios</p>
          <h3>저장된 포트폴리오</h3>
        </div>

        <div className="newPortfolioMenuWrap">
          <button
            className="newPortfolioButton"
            onClick={handleNewPortfolioButtonClick}
          >
            새 포트폴리오 ▾
          </button>

          {isNewPortfolioMenuOpen && (
            <div className="newPortfolioMenu">
              <button onClick={() => handleCreatePortfolioFromTemplate("balanced")}>
                <strong>균형형으로 시작</strong>
                <span>성장·배당·안정 자산을 혼합</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("growth")}>
                <strong>성장형으로 시작</strong>
                <span>나스닥100 중심의 성장 구성</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("dividend")}>
                <strong>배당형으로 시작</strong>
                <span>배당 현금흐름과 장기 보유 중심</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("stable")}>
                <strong>안정형으로 시작</strong>
                <span>채권·금 비중을 높인 방어 구성</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("goldDefense")}>
                <strong>금 방어형으로 시작</strong>
                <span>금·장기채 중심의 위기 방어 구성</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("reitIncome")}>
                <strong>리츠 인컴형으로 시작</strong>
                <span>리츠·배당 현금흐름 중심</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("growthZero")}>
                <strong>성장주 제로형으로 시작</strong>
                <span>성장주 없이 배당·채권·금 중심</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("growthFocus")}>
                <strong>성장주 집중형으로 시작</strong>
                <span>나스닥100 비중을 극대화</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("allWeather")}>
                <strong>올웨더형으로 시작</strong>
                <span>주식·채권·금·현금 균형 배분</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("highConviction")}>
                <strong>하이컨빅션형으로 시작</strong>
                <span>성장주와 블록체인 테마 집중</span>
              </button>

              <button onClick={() => handleCreatePortfolioFromTemplate("empty")}>
                <strong>빈 포트폴리오로 시작</strong>
                <span>티커와 수량을 직접 입력</span>
              </button>

              <button onClick={handleDuplicateActivePortfolio}>
                <strong>현재 포트폴리오 복제</strong>
                <span>현재 자산 구성을 그대로 복사</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="portfolioTabs">
        {portfolioList.map((portfolio) => (
          <button
            key={portfolio.id}
            className={
              portfolio.id === activePortfolioId
                ? "portfolioTab active"
                : "portfolioTab"
            }
            onClick={() => selectPortfolio(portfolio.id)}
          >
            {portfolio.name}
          </button>
        ))}
      </div>

      <div className="activePortfolioEditor">
        <div>
          <p>현재 포트폴리오 이름</p>
          <input
            value={activePortfolio?.name || ""}
            onChange={(e) => renameActivePortfolio(e.target.value)}
          />
        </div>

        <button className="deletePortfolioButton" onClick={deleteActivePortfolio}>
          현재 포트폴리오 삭제
        </button>
      </div>

      <div className="portfolioDataStatusPanel">
        <div>
          <p>브라우저 저장 상태</p>
          <span>현재 데이터는 이 브라우저의 localStorage에 자동 저장됩니다.</span>
        </div>

        <div className="portfolioDataStatusGrid">
          <div>
            <span>포트폴리오</span>
            <strong>{dataManagementSummary?.portfolioCount || 0}개</strong>
          </div>
          <div>
            <span>현재 자산</span>
            <strong>{dataManagementSummary?.activeAssetCount || 0}개</strong>
          </div>
          <div>
            <span>최근 저장</span>
            <strong>{dataManagementSummary?.lastLocalSaveText || "-"}</strong>
          </div>
          <div>
            <span>백업 버전</span>
            <strong>{dataManagementSummary?.backupVersion || "1.0.0"}</strong>
          </div>
        </div>
      </div>

      <div className="portfolioBackupPanel">
        <div>
          <p>서버 저장 / 불러오기</p>
          <span>
            현재 브라우저의 포트폴리오를 FINPLE 서버에 저장하거나, 서버에 저장된 포트폴리오를 다시 불러옵니다. 첫 요청이 느리면 잠시 후 다시 시도해 주세요.
          </span>
          <span>{serverSyncStatus}</span>
        </div>

        <div className="portfolioBackupActions">
          <button
            type="button"
            onClick={savePortfoliosToServer}
            disabled={isServerSyncLoading}
          >
            {isServerSyncLoading ? "처리 중..." : "서버 저장"}
          </button>

          <button
            type="button"
            onClick={loadPortfoliosFromServer}
            disabled={isServerSyncLoading}
          >
            서버 불러오기
          </button>
        </div>
      </div>

      <div className="portfolioBackupPanel">
        <div>
          <p>저장 데이터 관리</p>
          <span>
            포트폴리오 목록, 현재 선택 포트폴리오, 공통 조건을 JSON 파일로 백업하거나 복원합니다.
          </span>
        </div>

        <div className="portfolioBackupActions">
          <button type="button" onClick={downloadPortfolioBackup}>
            백업 다운로드
          </button>

          <button type="button" onClick={openPortfolioBackupFile}>
            백업 불러오기
          </button>

          <input
            ref={backupFileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={restorePortfolioBackup}
            hidden
          />
        </div>
      </div>
    </div>
  );
}

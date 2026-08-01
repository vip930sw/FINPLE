import { useState } from "react";

import {
  FINPLE_PLAN_CONFIGS,
  getPlanLimitMessage,
  getStoredFinplePlan,
} from "../config/planConfig";
import {
  getLocalPortfolioSnapshot,
  importServerPortfoliosToBrowser,
  listServerPortfolios,
  syncLocalPortfoliosToServer,
} from "../services/serverPortfolioService.js";
import { deletePortfolioWithServerSync } from "../utils/portfolioLifecycle.js";

function getCurrentPlanConfig() {
  const planKey = getStoredFinplePlan();
  return FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free;
}

function getFriendlyServerSyncErrorMessage(error, actionLabel) {
  const rawMessage = String(error?.message || "").trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage === "portfolio_plan_limit_reached") {
    return getPlanLimitMessage(getStoredFinplePlan(), "portfolio");
  }

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
  selectPortfolio,
  renameActivePortfolio,
  deleteActivePortfolio,
  downloadPortfolioBackup,
  openPortfolioBackupFile,
  backupFileInputRef,
  restorePortfolioBackup,
  dataManagementSummary,
  hydratePortfolio,
  goToStepOne,
}) {
  const [serverSyncStatus, setServerSyncStatus] = useState(
    "서버 저장 전입니다. 필요할 때 수동 저장하거나 서버 데이터를 불러오세요. 첫 요청은 서버 준비로 잠시 지연될 수 있습니다."
  );
  const [isServerSyncLoading, setIsServerSyncLoading] = useState(false);
  const currentPlan = getCurrentPlanConfig();
  const portfolioLimit = currentPlan.limits.portfolios;
  const canUseServerStorage = currentPlan.limits.serverStorage;
  async function savePortfoliosToServer() {
    if (isServerSyncLoading) return;
    const localSnapshot = getLocalPortfolioSnapshot();
    const localPortfolioList = Array.isArray(portfolioList) ? portfolioList : [];

    setIsServerSyncLoading(true);
    setServerSyncStatus("서버에 포트폴리오를 저장하는 중입니다. 첫 요청은 잠시 걸릴 수 있습니다...");

    try {
      const payload = await syncLocalPortfoliosToServer({
        ...localSnapshot,
        portfolioList: localPortfolioList,
        activePortfolioId,
      });

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
      const payload = await listServerPortfolios();
      const result = importServerPortfoliosToBrowser(payload, {
        mode: "replace",
        portfolioLimit,
        hydratePortfolio,
      });
      setServerSyncStatus(
        `서버 불러오기 완료: ${result.totalCount}개 포트폴리오`
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

  async function handleDeleteActivePortfolio() {
    if (isServerSyncLoading || !activePortfolio) return;
    const confirmed = window.confirm(
      canUseServerStorage
        ? `"${activePortfolio.name}" 포트폴리오를 삭제할까요? 서버 저장 목록에서도 삭제됩니다.`
        : `"${activePortfolio.name}" 포트폴리오를 브라우저에서 삭제할까요?`,
    );
    if (!confirmed) return;

    if (!canUseServerStorage) {
      deleteActivePortfolio(activePortfolio.id);
      setServerSyncStatus("포트폴리오를 브라우저에서 삭제했습니다.");
      return;
    }

    const snapshot = getLocalPortfolioSnapshot();

    setIsServerSyncLoading(true);
    setServerSyncStatus("서버에서 포트폴리오를 삭제하는 중입니다...");
    try {
      const nextState = await deletePortfolioWithServerSync({
        portfolioList,
        portfolioId: activePortfolio.id,
        snapshot,
        syncSnapshot: syncLocalPortfoliosToServer,
      });
      deleteActivePortfolio(activePortfolio.id);
      setServerSyncStatus(
        nextState.portfolioList.length === 0
          ? "포트폴리오를 삭제했습니다. 현재 저장된 포트폴리오가 없습니다."
          : "포트폴리오를 삭제했습니다.",
      );
    } catch (error) {
      const friendlyMessage = getFriendlyServerSyncErrorMessage(
        error,
        "포트폴리오 삭제",
      );
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

      {activePortfolio ? (
        <div className="activePortfolioEditor">
          <div>
            <p>현재 포트폴리오 이름</p>
            <input
              value={activePortfolio.name || ""}
              onChange={(e) => renameActivePortfolio(e.target.value)}
            />
          </div>

          <button
            className="deletePortfolioButton"
            onClick={handleDeleteActivePortfolio}
            disabled={isServerSyncLoading}
          >
            현재 포트폴리오 삭제
          </button>
        </div>
      ) : (
        <div className="portfolioEmptyState" role="status">
          <strong>저장된 포트폴리오가 없습니다.</strong>
          <span>Step 1에서 새 포트폴리오를 만들 수 있습니다.</span>
          <button type="button" onClick={goToStepOne}>
            Step 1로 이동
          </button>
        </div>
      )}

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

      {canUseServerStorage ? <div className="portfolioBackupPanel">
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
      </div> : null}

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

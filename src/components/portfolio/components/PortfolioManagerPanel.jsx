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
            onClick={() => setIsNewPortfolioMenuOpen(!isNewPortfolioMenuOpen)}
          >
            새 포트폴리오 ▾
          </button>

          {isNewPortfolioMenuOpen && (
            <div className="newPortfolioMenu">
              <button onClick={() => createPortfolioFromTemplate("balanced")}>
                <strong>균형형으로 시작</strong>
                <span>성장·배당·안정 자산을 혼합</span>
              </button>

              <button onClick={() => createPortfolioFromTemplate("growth")}>
                <strong>성장형으로 시작</strong>
                <span>나스닥100 중심의 성장 구성</span>
              </button>

              <button onClick={() => createPortfolioFromTemplate("dividend")}>
                <strong>배당형으로 시작</strong>
                <span>배당 현금흐름과 장기 보유 중심</span>
              </button>

              <button onClick={() => createPortfolioFromTemplate("stable")}>
                <strong>안정형으로 시작</strong>
                <span>채권·금 비중을 높인 방어 구성</span>
              </button>

              <button onClick={() => createPortfolioFromTemplate("empty")}>
                <strong>빈 포트폴리오로 시작</strong>
                <span>티커와 수량을 직접 입력</span>
              </button>

              <button onClick={duplicateActivePortfolio}>
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

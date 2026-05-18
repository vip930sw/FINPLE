import { useEffect, useRef } from "react";
import PortfolioSimulator from "./PortfolioSimulator";

function PersonalPage({ onBack, initialTab = "settings" }) {
  const simulatorRef = useRef(null);

  function moveToSimulatorTab(tabName) {
    simulatorRef.current?.changeTab(tabName);
  }

  useEffect(() => {
    window.setTimeout(() => {
      moveToSimulatorTab(initialTab);
    }, 120);
  }, [initialTab]);

  return (
    <main className="page personalPage">
      <header className="header">
        <button className="brandLogo resetButton" onClick={onBack}>
          <div className="brandIcon">
            <span>F</span>
            <i />
          </div>

          <div className="brandText">
            <strong>FINPLE</strong>
            <span>Personal Lab</span>
          </div>
        </button>

        <nav className="headerNav">
          <button type="button" onClick={() => moveToSimulatorTab("settings")}>
            시뮬레이터
          </button>

          <button type="button" onClick={() => moveToSimulatorTab("screener")}>
            스크리너
          </button>

          <button type="button" onClick={() => moveToSimulatorTab("compare")}>
            포트폴리오
          </button>

          <button type="button" onClick={() => moveToSimulatorTab("detail")}>
            상세분석
          </button>
        </nav>

        <button className="headerButton" onClick={onBack}>
          홈으로
        </button>
      </header>

      <section className="personalHero">
        <p className="sectionLabel">Personal Page</p>
        <h1>나만의 포트폴리오를 시뮬레이션합니다.</h1>
        <p>
          현재 보유 자산의 평가금액을 시작점으로 삼고, 투자금과 자산별
          CAGR, MDD, 배당률을 반영해 장기 포트폴리오 성과를 계산합니다.
        </p>
      </section>

      <PortfolioSimulator ref={simulatorRef} />
    </main>
  );
}

export default PersonalPage;

import { useRef } from "react";
import PortfolioSimulator from "./PortfolioSimulator";

function PersonalPage({ onBack }) {
    const simulatorRef = useRef(null);
  
    function moveToSimulatorTab(tabName) {
      simulatorRef.current?.changeTab(tabName);
    }
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
            <button type="button" onClick={() => moveToSimulatorTab("screener")}>
                스크리너
            </button>

            <button type="button" onClick={() => moveToSimulatorTab("settings")}>
                시뮬레이터
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
      <PortfolioSimulator ref={simulatorRef} />
    </main>
  );
}

export default PersonalPage;
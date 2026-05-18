import { useEffect, useRef, useState } from "react";
import PortfolioSimulator from "./PortfolioSimulator";
import StartHubPage from "./StartHubPage";
import InvestmentMbtiPage from "./InvestmentMbtiPage";

function PersonalPage({ onBack }) {
  const [personalView, setPersonalView] = useState("hub");
  const [initialTab, setInitialTab] = useState("settings");
  const simulatorRef = useRef(null);

  function moveToSimulatorTab(tabName) {
    simulatorRef.current?.changeTab(tabName);
  }

  function openSimulator(tabName = "settings") {
    setInitialTab(tabName);
    setPersonalView("simulator");
  }

  function handleHubNavigate(nextTarget) {
    if (nextTarget === "investment-mbti") {
      setPersonalView("investment-mbti");
      return;
    }

    if (nextTarget === "screener") {
      openSimulator("screener");
      return;
    }

    if (nextTarget === "support") {
      window.location.href = "/support";
      return;
    }

    openSimulator("settings");
  }

  useEffect(() => {
    if (personalView !== "simulator") return;

    window.setTimeout(() => {
      moveToSimulatorTab(initialTab);
    }, 120);
  }, [personalView, initialTab]);

  if (personalView === "hub") {
    return <StartHubPage onBack={onBack} onNavigate={handleHubNavigate} />;
  }

  if (personalView === "investment-mbti") {
    return (
      <InvestmentMbtiPage
        onBack={() => setPersonalView("hub")}
        onNavigate={(nextTarget) => {
          if (nextTarget === "personal") {
            openSimulator("settings");
            return;
          }

          handleHubNavigate(nextTarget);
        }}
      />
    );
  }

  return (
    <main className="page personalPage">
      <header className="header">
        <button className="brandLogo resetButton" onClick={() => setPersonalView("hub")}>
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

        <div className="headerActions">
          <button className="secondaryHeaderButton" onClick={() => setPersonalView("hub")}>
            시작 메뉴
          </button>
          <button className="headerButton" onClick={onBack}>
            홈으로
          </button>
        </div>
      </header>

      <PortfolioSimulator ref={simulatorRef} />
    </main>
  );
}

export default PersonalPage;
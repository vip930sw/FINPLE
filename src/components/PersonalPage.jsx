import { useEffect, useRef, useState } from "react";
import PortfolioSimulator from "./PortfolioSimulator";
import StartHubPage from "./StartHubPage";
import InvestmentMbtiPage from "./InvestmentMbtiPage";
import ScreenerPage from "./ScreenerPage";

function replaceToolPath(path) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  window.history.pushState({ page: "personal", path }, "", path);
  window.dispatchEvent(new CustomEvent("finple-route-changed", { detail: { page: "personal", path } }));
}

function getInitialPersonalView() {
  if (typeof window === "undefined") return "hub";

  const path = window.location.pathname;
  if (path === "/mbti") return "investment-mbti";
  if (path === "/screener") return "screener";
  if (path === "/simulator") return "simulator";

  const tool = new URLSearchParams(window.location.search).get("tool");
  if (tool === "investment-mbti") return "investment-mbti";
  if (tool === "screener") return "screener";
  if (tool === "simulator") return "simulator";

  return "hub";
}

function getPathForPersonalView(view) {
  if (view === "investment-mbti") return "/mbti";
  if (view === "screener") return "/screener";
  if (view === "simulator") return "/simulator";
  return "/start";
}

function PersonalPage({ onBack }) {
  const [personalView, setPersonalView] = useState(getInitialPersonalView);
  const [initialTab, setInitialTab] = useState("settings");
  const simulatorRef = useRef(null);

  function goStartHub() {
    setPersonalView("hub");
    replaceToolPath("/start");
  }

  function moveToSimulatorTab(tabName) {
    simulatorRef.current?.changeTab(tabName);
  }

  function openSimulator(tabName = "settings") {
    setInitialTab(tabName);
    setPersonalView("simulator");
    replaceToolPath("/simulator");
  }

  function handleHubNavigate(nextTarget) {
    if (nextTarget === "investment-mbti") {
      setPersonalView("investment-mbti");
      replaceToolPath("/mbti");
      return;
    }

    if (nextTarget === "screener") {
      setPersonalView("screener");
      replaceToolPath("/screener");
      return;
    }

    if (nextTarget === "support") {
      window.location.href = "/support";
      return;
    }

    openSimulator("settings");
  }

  useEffect(() => {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("finple-route-changed", { detail: { page: "personal", view: personalView } }));
    }, 40);
  }, [personalView]);

  useEffect(() => {
    if (personalView !== "simulator") return;

    window.setTimeout(() => {
      moveToSimulatorTab(initialTab);
    }, 120);
  }, [personalView, initialTab]);

  useEffect(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    if (!tool) return;
    window.history.replaceState({ page: "personal" }, "", getPathForPersonalView(personalView));
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPersonalView(getInitialPersonalView());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (personalView === "hub") {
    return <StartHubPage onBack={onBack} onNavigate={handleHubNavigate} />;
  }

  if (personalView === "investment-mbti") {
    return (
      <InvestmentMbtiPage
        onBack={onBack}
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

  if (personalView === "screener") {
    return (
      <ScreenerPage
        onBack={onBack}
        onHome={onBack}
        onOpenSimulator={() => openSimulator("settings")}
      />
    );
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
            <span>Portfolio Lab</span>
          </div>
        </button>

        <nav className="headerNav">
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
      </header>

      <PortfolioSimulator ref={simulatorRef} />
    </main>
  );
}

export default PersonalPage;
import { useEffect, useRef, useState } from "react";
import PortfolioSimulator from "./PortfolioSimulator";
import StartHubPage from "./StartHubPage";
import InvestmentMbtiPage from "./InvestmentMbtiPage";
import InvestmentMbtiMarketChoiceBridge from "./InvestmentMbtiMarketChoiceBridge";
import ScreenerPage from "./ScreenerPage";

const SIMULATOR_TAB_PATHS = {
  settings: "/simulator",
  compare: "/simulator/portfolio",
  detail: "/simulator/detail",
};

function replaceToolPath(path) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  window.history.pushState({ page: "personal", path }, "", path);
  window.dispatchEvent(new CustomEvent("finple-route-changed", { detail: { page: "personal", path } }));
}

function getSimulatorTabFromPath(pathname = "") {
  if (pathname === "/simulator/portfolio") return "compare";
  if (pathname === "/simulator/detail") return "detail";
  return "settings";
}

function getInitialPersonalView() {
  if (typeof window === "undefined") return "hub";

  const path = window.location.pathname;
  if (path === "/mbti") return "investment-mbti";
  if (path === "/screener") return "screener";
  if (path === "/simulator") return "simulator";
  if (path === "/simulator/us") return "simulator";
  if (path === "/simulator/kr") return "simulator";
  if (path === "/simulator/portfolio") return "simulator";
  if (path === "/simulator/detail") return "simulator";

  const tool = new URLSearchParams(window.location.search).get("tool");
  if (tool === "investment-mbti") return "investment-mbti";
  if (tool === "screener") return "screener";
  if (tool === "simulator" || tool === "us-simulator" || tool === "kr-simulator") return "simulator";

  return "hub";
}

function getInitialSimulatorTab() {
  if (typeof window === "undefined") return "settings";
  return getSimulatorTabFromPath(window.location.pathname);
}

function getPathForPersonalView(view, simulatorTab = "settings") {
  if (view === "investment-mbti") return "/mbti";
  if (view === "screener") return "/screener";
  if (view === "simulator") return SIMULATOR_TAB_PATHS[simulatorTab] || "/simulator";
  return "/start";
}

function PersonalPage({ onBack }) {
  const [personalView, setPersonalView] = useState(getInitialPersonalView);
  const [initialTab, setInitialTab] = useState(getInitialSimulatorTab);
  const simulatorRef = useRef(null);

  function goStartHub() {
    setPersonalView("hub");
    replaceToolPath("/start");
  }

  function moveToSimulatorTab(tabName, options = {}) {
    const nextTab = tabName || "settings";
    setInitialTab(nextTab);
    replaceToolPath(SIMULATOR_TAB_PATHS[nextTab] || "/simulator");
    simulatorRef.current?.changeTab(nextTab, options);
  }

  function openSimulator(tabName = "settings", options = {}) {
    const nextTab = tabName || "settings";
    setInitialTab(nextTab);
    setPersonalView("simulator");
    replaceToolPath(SIMULATOR_TAB_PATHS[nextTab] || "/simulator");

    if (options.scrollTop !== false) {
      window.setTimeout(() => simulatorRef.current?.scrollToTop?.(), 160);
    }
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
      moveToSimulatorTab(initialTab, { scroll: false });
      simulatorRef.current?.scrollToTop?.();
    }, 120);
  }, [personalView, initialTab]);

  useEffect(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    if (!tool) return;
    window.history.replaceState({ page: "personal" }, "", getPathForPersonalView(personalView, initialTab));
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPersonalView(getInitialPersonalView());
      setInitialTab(getInitialSimulatorTab());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (personalView === "hub") {
    return <StartHubPage onBack={onBack} onNavigate={handleHubNavigate} />;
  }

  if (personalView === "investment-mbti") {
    return (
      <>
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
        <InvestmentMbtiMarketChoiceBridge onOpenSimulator={() => openSimulator("settings")} />
      </>
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

      <PortfolioSimulator ref={simulatorRef} initialTab={initialTab} />
    </main>
  );
}

export default PersonalPage;

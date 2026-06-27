import { useCallback, useEffect, useRef, useState } from "react";
import PortfolioSimulator from "./PortfolioSimulator";
import StartHubPage from "./StartHubPage";
import InvestmentMbtiPage from "./InvestmentMbtiPage";
import InvestmentMbtiMarketChoiceBridge from "./InvestmentMbtiMarketChoiceBridge";
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
  if (path === "/simulator/us") return "simulator";
  if (path === "/simulator/kr") return "simulator";

  const tool = new URLSearchParams(window.location.search).get("tool");
  if (tool === "investment-mbti") return "investment-mbti";
  if (tool === "screener") return "screener";
  if (tool === "simulator" || tool === "us-simulator" || tool === "kr-simulator") return "simulator";

  return "hub";
}

function getPathForPersonalView(view) {
  if (view === "investment-mbti") return "/mbti";
  if (view === "screener") return "/screener";
  if (view === "simulator") return "/simulator";
  return "/start";
}

const SIMULATOR_STEP_ITEMS = [
  { key: "settings", step: "Step 1", label: "시뮬레이터" },
  { key: "compare", step: "Step 2", label: "포트폴리오" },
  { key: "detail", step: "Step 3", label: "상세분석" },
  { key: "ai", step: "Step 4", label: "포트폴리오 AI 분석" },
];

function scrollWindowTop(delay = 70) {
  if (typeof window === "undefined") return;
  window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), delay);
}

function PersonalPage({ onBack, onNavigate, onHeaderSubNavChange }) {
  const [personalView, setPersonalView] = useState(getInitialPersonalView);
  const [initialTab, setInitialTab] = useState("settings");
  const [activeSimulatorStep, setActiveSimulatorStep] = useState("settings");
  const simulatorRef = useRef(null);

  const moveToSimulatorTab = useCallback(function moveToSimulatorTab(tabName, options = {}) {
    simulatorRef.current?.changeTab(tabName, options);
  }, []);

  function openSimulator(tabName = "settings", options = {}) {
    setInitialTab(tabName);
    setPersonalView("simulator");
    replaceToolPath("/simulator");

    if (options.scrollTop !== false) {
      window.setTimeout(() => simulatorRef.current?.scrollToTop?.(), 160);
    }
  }

  function handleHubNavigate(nextTarget) {
    if (nextTarget === "investment-mbti") {
      setPersonalView("investment-mbti");
      replaceToolPath("/mbti");
      scrollWindowTop();
      return;
    }

    if (nextTarget === "screener") {
      setPersonalView("screener");
      replaceToolPath("/screener");
      scrollWindowTop();
      return;
    }

    if (nextTarget === "support") {
      if (typeof onNavigate === "function") {
        onNavigate("support");
        return;
      }

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
  }, [personalView, initialTab, moveToSimulatorTab]);

  useEffect(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    if (!tool) return;
    window.history.replaceState({ page: "personal" }, "", getPathForPersonalView(personalView));
  }, [personalView]);

  useEffect(() => {
    function handleOpenPersonalView(event) {
      const nextView = event?.detail?.view || "hub";
      setPersonalView(nextView);
      setInitialTab("settings");
      setActiveSimulatorStep("settings");
      if (nextView === "hub") replaceToolPath("/start");
      scrollWindowTop();
    }

    window.addEventListener("finple-open-personal-view", handleOpenPersonalView);
    return () => window.removeEventListener("finple-open-personal-view", handleOpenPersonalView);
  }, []);

  useEffect(() => {
    if (personalView !== "simulator") {
      onHeaderSubNavChange?.(null);
      return undefined;
    }

    onHeaderSubNavChange?.(
      <nav className="routeSubNav simulatorRouteSubNav" aria-label="시뮬레이터 단계 이동">
        {SIMULATOR_STEP_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-label={`${item.step} ${item.label}`}
            className={activeSimulatorStep === item.key ? "active" : ""}
            onClick={() => {
              setActiveSimulatorStep(item.key);
              moveToSimulatorTab(item.key);
            }}
            title={item.label}
          >
            {item.step}
          </button>
        ))}
      </nav>
    );

    return () => onHeaderSubNavChange?.(null);
  }, [activeSimulatorStep, moveToSimulatorTab, onHeaderSubNavChange, personalView]);

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
      <PortfolioSimulator ref={simulatorRef} onActiveTabChange={setActiveSimulatorStep} />
    </main>
  );
}

export default PersonalPage;

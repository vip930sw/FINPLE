import { useEffect, useRef, useState } from "react";
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

function PersonalPage({ onBack, onNavigate }) {
  const [personalView, setPersonalView] = useState(getInitialPersonalView);
  const [initialTab, setInitialTab] = useState("settings");
  const simulatorRef = useRef(null);

  function goStartHub() {
    setPersonalView("hub");
    replaceToolPath("/start");
  }

  function moveToSimulatorTab(tabName, options = {}) {
    simulatorRef.current?.changeTab(tabName, options);
  }

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
      return;
    }

    if (nextTarget === "screener") {
      setPersonalView("screener");
      replaceToolPath("/screener");
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
      <PortfolioSimulator ref={simulatorRef} />
    </main>
  );
}

export default PersonalPage;

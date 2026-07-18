import { useCallback, useEffect, useRef, useState } from "react";
import PortfolioSimulator from "./PortfolioSimulator";
import StartHubPage from "./StartHubPage";
import InvestmentMbtiPage from "./InvestmentMbtiPage";
import InvestmentMbtiMarketChoiceBridge from "./InvestmentMbtiMarketChoiceBridge";
import ScreenerPage from "./ScreenerPage";
import {
  normalizeSimulatorTab,
  SIMULATOR_TAB_ITEMS,
} from "./portfolio/utils/simulatorNavigation";
import { scrollActiveSimulatorRouteStep } from "./portfolio/utils/simulatorRouteNavScroll";

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

function scrollWindowTop(delay = 70) {
  if (typeof window === "undefined") return;
  window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), delay);
}

function PersonalPage({ onBack, onNavigate, onHeaderSubNavChange }) {
  const [personalView, setPersonalView] = useState(getInitialPersonalView);
  const [initialTab, setInitialTab] = useState(() =>
    normalizeSimulatorTab(typeof window === "undefined" ? "" : window.location.hash)
  );
  const [activeSimulatorStep, setActiveSimulatorStep] = useState(initialTab);
  const simulatorRef = useRef(null);
  const simulatorRouteSubNavRef = useRef(null);
  const simulatorRouteStepButtonRefs = useRef(new Map());
  const simulatorRouteScrollBehaviorRef = useRef("auto");

  const moveToSimulatorTab = useCallback(function moveToSimulatorTab(tabName, options = {}) {
    simulatorRef.current?.changeTab(tabName, options);
  }, []);

  const handleActiveSimulatorStepChange = useCallback((nextStep, context = {}) => {
    simulatorRouteScrollBehaviorRef.current = context.userInitiated === true ? "smooth" : "auto";
    setActiveSimulatorStep(nextStep);
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
      moveToSimulatorTab(initialTab, { scroll: false, history: false });
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
      <nav
        ref={simulatorRouteSubNavRef}
        className="routeSubNav simulatorRouteSubNav"
        aria-label="시뮬레이터 단계 이동"
      >
        {SIMULATOR_TAB_ITEMS.map((item) => (
          <button
            key={item.key}
            ref={(node) => {
              if (node) simulatorRouteStepButtonRefs.current.set(item.key, node);
              else simulatorRouteStepButtonRefs.current.delete(item.key);
            }}
            data-simulator-step={item.key}
            type="button"
            aria-label={`${item.step.replace("STEP", "Step")} ${item.title}`}
            aria-current={activeSimulatorStep === item.key ? "step" : undefined}
            className={activeSimulatorStep === item.key ? "active" : ""}
            onClick={() => {
              simulatorRouteScrollBehaviorRef.current = "smooth";
              setActiveSimulatorStep(item.key);
              moveToSimulatorTab(item.key, { userInitiated: true });
            }}
            title={item.title}
          >
            {item.step.replace("STEP", "Step")}
          </button>
        ))}
      </nav>
    );

    return () => onHeaderSubNavChange?.(null);
  }, [activeSimulatorStep, moveToSimulatorTab, onHeaderSubNavChange, personalView]);

  useEffect(() => {
    if (personalView !== "simulator") return undefined;

    const timeoutId = window.setTimeout(() => {
      scrollActiveSimulatorRouteStep(
        simulatorRouteSubNavRef.current,
        simulatorRouteStepButtonRefs.current.get(activeSimulatorStep),
        { behavior: simulatorRouteScrollBehaviorRef.current }
      );
      simulatorRouteScrollBehaviorRef.current = "auto";
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeSimulatorStep, personalView]);

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
      <PortfolioSimulator ref={simulatorRef} onActiveTabChange={handleActiveSimulatorStepChange} />
    </main>
  );
}

export default PersonalPage;

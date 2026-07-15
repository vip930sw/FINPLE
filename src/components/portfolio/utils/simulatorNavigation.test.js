import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createSimulatorHashNavigator,
  getSimulatorTabAnchorId,
  normalizeSimulatorTab,
  resolveSimulatorTab,
  SIMULATOR_TAB_ITEMS,
  SIMULATOR_TAB_KEYS,
} from "./simulatorNavigation.js";
import { buildAiAnalysisPayload } from "./buildAiAnalysisPayload.js";

function readSource(path) {
  return fs.readFileSync(path, "utf8");
}

test("simulator navigation exposes the final six-step order and labels", () => {
  assert.deepEqual(
    SIMULATOR_TAB_ITEMS.map(({ key, step, title }) => ({ key, step, title })),
    [
      { key: "settings", step: "STEP 1", title: "설정" },
      { key: "compare", step: "STEP 2", title: "비교" },
      { key: "detail", step: "STEP 3", title: "상세분석·기준전망" },
      { key: "probability", step: "STEP 4", title: "확률분석" },
      { key: "shock", step: "STEP 5", title: "외부충격분석" },
      { key: "ai", step: "STEP 6", title: "AI 분석" },
    ]
  );
  assert.deepEqual(SIMULATOR_TAB_KEYS, ["settings", "compare", "detail", "probability", "shock", "ai"]);
});

test("internal keys and anchors preserve Step 4, Step 5, and existing AI identifiers", () => {
  assert.equal(getSimulatorTabAnchorId("probability"), "probability-analysis");
  assert.equal(getSimulatorTabAnchorId("shock"), "external-shock-analysis");
  assert.equal(getSimulatorTabAnchorId("ai"), "ai-analysis");
  assert.equal(normalizeSimulatorTab("#ai-analysis"), "ai");
  assert.equal(normalizeSimulatorTab("ai-analysis"), "ai");
  assert.equal(normalizeSimulatorTab("#external-shock-analysis"), "shock");
  assert.equal(normalizeSimulatorTab("#probability-analysis"), "probability");
});

test("all valid tabs normalize and unknown tab values fail safe to settings", () => {
  for (const key of SIMULATOR_TAB_KEYS) {
    assert.equal(resolveSimulatorTab(key).isKnown, true);
    assert.equal(normalizeSimulatorTab(key), key);
  }
  assert.equal(resolveSimulatorTab("not-a-tab").isKnown, false);
  assert.equal(normalizeSimulatorTab("not-a-tab"), "settings");
  assert.equal(normalizeSimulatorTab(null), "settings");
});

test("hash navigation applies initial ai-analysis once and does not pin later tab selections", () => {
  let hash = "#ai-analysis";
  let selectedTab = "settings";
  const navigator = createSimulatorHashNavigator({
    getHash: () => hash,
    onTabChange: (nextTab) => {
      selectedTab = nextTab;
    },
  });

  assert.deepEqual(navigator.applyCurrentHash(), { status: "applied", key: "ai", isKnown: true });
  assert.equal(selectedTab, "ai");

  selectedTab = normalizeSimulatorTab("settings");
  assert.equal(selectedTab, "settings");
  assert.deepEqual(navigator.applyCurrentHash(), { status: "unchanged", key: null, isKnown: false });
  assert.equal(selectedTab, "settings");
});

test("hash navigation handles real hashchange values and unknown fail-safe hashes", () => {
  let hash = "#ai-analysis";
  const visitedTabs = [];
  const navigator = createSimulatorHashNavigator({
    getHash: () => hash,
    onTabChange: (nextTab) => visitedTabs.push(nextTab),
  });

  assert.equal(navigator.applyCurrentHash().key, "ai");
  hash = "#probability-analysis";
  assert.equal(navigator.applyCurrentHash().key, "probability");
  hash = "#external-shock-analysis";
  assert.equal(navigator.applyCurrentHash().key, "shock");
  hash = "#not-a-simulator-tab";
  assert.deepEqual(navigator.applyCurrentHash(), { status: "fallback", key: "settings", isKnown: false });
  assert.deepEqual(visitedTabs, ["ai", "probability", "shock", "settings"]);
});

test("PortfolioSimulator keeps direct-link refresh, imperative changeTab, and panel anchors", () => {
  const source = readSource("src/components/PortfolioSimulator.jsx");
  assert.match(source, /window\.location\.hash/);
  assert.match(source, /createSimulatorHashNavigator/);
  assert.match(source, /addEventListener\("hashchange"/);
  assert.match(source, /removeEventListener\("hashchange"/);
  assert.match(source, /changeTab\(nextTab, options = \{\}\)/);
  assert.match(source, /onActiveTabChange\?\.\(effectiveActiveSimulatorTab\)/);
  assert.match(source, /id="probability-analysis"/);
  assert.match(source, /id="external-shock-analysis"/);
  assert.match(source, /id="ai-analysis"/);
});

test("SimulatorTabNav uses native step navigation without an incomplete ARIA tab pattern", () => {
  const source = readSource("src/components/portfolio/components/SimulatorTabNav.jsx");
  assert.match(source, /<nav className="simulatorTabNav fourStepNav"/);
  assert.match(source, /type="button"/);
  assert.match(source, /aria-current=/);
  assert.doesNotMatch(source, /role="tablist"|role="tab"|aria-selected=|aria-controls=/);
});

test("AI panel is labeled as Step 6 while preserving the existing prop contract", () => {
  const panelSource = readSource("src/components/portfolio/components/AiAnalysisPanel.jsx");
  const simulatorSource = readSource("src/components/PortfolioSimulator.jsx");
  assert.match(panelSource, /STEP 6\. AI Analysis/);
  assert.match(panelSource, /<h3>AI 분석<\/h3>/);
  assert.match(panelSource, /summarizeScenarioContextState/);
  assert.match(panelSource, /aiScenarioContextState/);
  assert.match(panelSource, /status-\$\{state\.status\}/);
  assert.match(simulatorSource, /buildSimulatorAiScenarioContext/);
  assert.match(simulatorSource, /const scenarioInterpretationContext = useMemo\(/);
  assert.match(simulatorSource, /scenarioInterpretationContext=\{scenarioInterpretationContext\}/);
  assert.match(simulatorSource, /<AiAnalysisPanel\s+activePortfolio=\{activePortfolio\}\s+assets=\{assets\}\s+result=\{result\}\s+settings=\{settings\}\s+scenarioInterpretationContext=\{scenarioInterpretationContext\}\s+formatNumber=\{formatNumber\}\s+formatPercent=\{formatPercent\}\s+isEmptyAssetRow=\{isEmptyAssetRow\}\s+\/>/s);
});

test("AI request payload remains isolated from probability and external shock outputs", () => {
  const payload = buildAiAnalysisPayload({
    activePortfolio: { id: "portfolio-1" },
    activeAssets: [
      {
        ticker: "005930",
        market: "KR",
        name: "Samsung Electronics",
        quantity: 1,
        price: 100,
        cagr: 8,
        beta: 1,
        mdd: -35,
        dividendYield: 2,
      },
    ],
    result: {
      expectedCagr: 8,
      expectedBeta: 1,
      simpleMdd: -35,
      expectedDividendYield: 2,
      futureValue: 120,
      inflationAdjustedFutureValue: 110,
      probabilityScenarioResult: { p50: 999 },
      externalShockScenarioResult: { terminalValue: 1 },
      stressScenarioResult: { terminalValue: 1 },
    },
    settings: { years: 10, inflationRate: 2, dividendReinvest: true },
  });
  const serialized = JSON.stringify(payload);
  assert.equal(payload.analysisContext, "simulator-step6");
  assert.equal(payload.scenarioInterpretationContext, undefined);
  assert.doesNotMatch(serialized, /probability|externalShock|stress|shockScenario|scenarioResult/);
});

test("production AI component does not import browser scenario fixtures", () => {
  const panelSource = readSource("src/components/portfolio/components/AiAnalysisPanel.jsx");
  const payloadSource = readSource("src/components/portfolio/utils/buildAiAnalysisPayload.js");
  const simulatorSource = readSource("src/components/PortfolioSimulator.jsx");
  const combined = `${panelSource}\n${payloadSource}\n${simulatorSource}`;
  assert.doesNotMatch(combined, /fixtures\/probabilityScenarioResultFixture|fixtures\/externalShockScenarioResultFixture/);
});

test("AI service endpoints stay on the existing provider and status routes", () => {
  const serviceSource = readSource("src/components/portfolio/services/aiAnalysisService.js");
  assert.match(serviceSource, /\/ai\/portfolio-analysis[`"]/);
  assert.match(serviceSource, /\/ai\/portfolio-analysis\/status[`"]/);
  assert.doesNotMatch(serviceSource, /probability|external-shock|scenario\/api|billing/);
});

test("six-step nav mobile containment and visible focus styles are present", () => {
  const appStyle = readSource("src/App.css");
  const aiStyle = readSource("src/AiAnalysisPanel.css");
  const combined = `${appStyle}\n${aiStyle}`;
  assert.match(combined, /grid-template-columns:\s*repeat\(6,\s*minmax\(132px,\s*1fr\)\)/);
  assert.match(combined, /@media\s*\(max-width:\s*980px\)[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(132px,\s*1fr\)\)/);
  assert.match(combined, /@media\s*\(max-width:\s*(380|560)px\)[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(118px,\s*1fr\)\)/);
  assert.match(combined, /overflow-x:\s*auto/);
  assert.match(combined, /max-width:\s*100%/);
  assert.match(combined, /min-width:\s*0/);
  assert.match(combined, /:focus-visible/);
});

test("Step 114-2I simulator sources do not introduce MutationObserver or global DOM patching", () => {
  const combined = [
    "src/components/PortfolioSimulator.jsx",
    "src/components/portfolio/components/SimulatorTabNav.jsx",
    "src/components/portfolio/components/AiAnalysisPanel.jsx",
    "src/components/portfolio/hooks/usePortfolioSimulator.js",
    "src/components/portfolio/utils/simulatorNavigation.js",
  ].map(readSource).join("\n");
  assert.doesNotMatch(combined, /new\s+MutationObserver|document\.body|appendChild|insertBefore/);
});

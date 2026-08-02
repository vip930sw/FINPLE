import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test, { after, before } from "node:test";
import { createServer } from "vite";

import { FINPLE_PLAN_CONFIGS } from "../src/components/portfolio/config/planConfig.js";
import { SIMULATOR_TAB_ITEMS } from "../src/components/portfolio/utils/simulatorNavigation.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("../src/App.css");
const navSource = read("../src/components/portfolio/components/SimulatorTabNav.jsx");
const simulatorSource = read("../src/components/PortfolioSimulator.jsx");

let vite;
let SimulatorTabNav;

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    server: { middlewareMode: true },
  });
  ({ default: SimulatorTabNav } = await vite.ssrLoadModule("/src/components/portfolio/components/SimulatorTabNav.jsx"));
});

after(async () => {
  await vite?.close();
});

function renderNav(planKey, activeSimulatorTab = "settings") {
  return renderToStaticMarkup(React.createElement(SimulatorTabNav, {
    activeSimulatorTab,
    changeSimulatorTab() {},
    features: FINPLE_PLAN_CONFIGS[planKey].features,
  }));
}

test("1. Free Step 4-6 use a separate accessible Personal badge in every nav surface", () => {
  const html = renderNav("free", "probability");
  assert.equal((html.match(/class="simulatorPlanBadge"/g) || []).length, 7);
  assert.equal((html.match(/aria-hidden="true"/g) || []).length, 7);
  assert.equal((html.match(/Personal 플랜 기능/g) || []).length, 7);
  assert.doesNotMatch(html, /— Personal/);
  assert.match(html, /aria-current="step"/);
  assert.doesNotMatch(html, /disabled=""[^>]*class="[^"]*locked|class="[^"]*locked[^>]*disabled/);
});

test("2. only capability-gated Steps 4-6 receive the badge", () => {
  assert.deepEqual(
    SIMULATOR_TAB_ITEMS.filter((item) => item.capability).map(({ key, capability }) => ({ key, capability })),
    [
      { key: "probability", capability: "probabilityAnalysis" },
      { key: "shock", capability: "externalShockAnalysis" },
      { key: "ai", capability: "aiAnalysis" },
    ],
  );
  for (const plan of ["personal", "pro"]) {
    assert.doesNotMatch(renderNav(plan, "probability"), /simulatorPlanBadge|Personal 플랜 기능|— Personal/);
  }
});

test("3. existing click, focus, scroll and direct-access gates stay in place", () => {
  assert.match(navSource, /changeSimulatorTab\(key, \{ userInitiated: true \}\)/);
  assert.match(navSource, /scrollIntoView\(/);
  assert.match(navSource, /aria-current=/);
  assert.match(navSource, /aria-label=\{isLocked\(item\)/);
  assert.match(simulatorSource, /planFeatures\.probabilityAnalysis \? <ProbabilityAnalysisPanel/);
  assert.match(simulatorSource, /planFeatures\.externalShockAnalysis \? <ExternalShockAnalysisPanel/);
  assert.match(simulatorSource, /planFeatures\.aiAnalysis \? <AiAnalysisPanel/);
});

test("4. badge and title CSS preserve seven-step and mobile containment", () => {
  assert.match(css, /\.simulatorTabButtonHeader\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*space-between;/s);
  assert.match(css, /\.simulatorMobileStepControls \.simulatorPlanBadge\s*\{[^}]*flex:\s*0 0 auto !important;[^}]*white-space:\s*nowrap;/s);
  assert.match(css, /\.simulatorMobileAllSteps button > strong\s*\{[^}]*overflow-wrap:\s*normal !important;[^}]*word-break:\s*keep-all;/s);
  assert.match(css, /\.simulatorTabNav\.fourStepNav\.sevenStepNav\s*\{[^}]*repeat\(7, minmax\(132px, 1fr\)\)[^}]*overflow-x:\s*auto !important;/s);
  assert.match(css, /\.simulatorMobileAllSteps\.open\s*\{[^}]*overflow-x:\s*auto;/s);
});

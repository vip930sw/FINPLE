import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createSimulatorHashNavigator,
  getSimulatorTabAnchorId,
  normalizeSimulatorTab,
  SIMULATOR_TAB_ITEMS,
} from "./simulatorNavigation.js";

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step 1 through Step 7 use one exact shared definition", () => {
  assert.deepEqual(
    SIMULATOR_TAB_ITEMS.map(({ key, step, anchorId }) => ({ key, step, anchorId })),
    [
      { key: "settings", step: "STEP 1", anchorId: "settings" },
      { key: "compare", step: "STEP 2", anchorId: "compare" },
      { key: "detail", step: "STEP 3", anchorId: "detail" },
      { key: "probability", step: "STEP 4", anchorId: "probability-analysis" },
      { key: "shock", step: "STEP 5", anchorId: "external-shock-analysis" },
      { key: "ai", step: "STEP 6", anchorId: "ai-analysis" },
      { key: "saved", step: "STEP 7", anchorId: "saved-portfolios" },
    ]
  );

  const personalPage = readSource("src/components/PersonalPage.jsx");
  assert.match(personalPage, /import\s*\{[\s\S]*SIMULATOR_TAB_ITEMS[\s\S]*\}\s*from\s*"\.\/portfolio\/utils\/simulatorNavigation"/);
  assert.match(personalPage, /SIMULATOR_TAB_ITEMS\.map/);
  assert.doesNotMatch(personalPage, /const\s+SIMULATOR_STEP_ITEMS\s*=/);
});

test("Step 7 direct hash, refresh, back, and forward resolve to the saved screen", () => {
  let hash = "#saved-portfolios";
  const visited = [];
  const navigator = createSimulatorHashNavigator({
    getHash: () => hash,
    onTabChange: (key) => visited.push(key),
  });

  assert.equal(normalizeSimulatorTab(hash), "saved");
  assert.equal(getSimulatorTabAnchorId("saved"), "saved-portfolios");
  assert.deepEqual(navigator.applyCurrentHash(), { status: "applied", key: "saved", isKnown: true });

  hash = "#ai-analysis";
  assert.equal(navigator.applyCurrentHash().key, "ai");
  hash = "#saved-portfolios";
  assert.equal(navigator.applyCurrentHash().key, "saved");
  assert.deepEqual(visited, ["saved", "ai", "saved"]);
});

test("simulator pushes the canonical Step 7 hash and listens for history hash changes", () => {
  const source = readSource("src/components/PortfolioSimulator.jsx");
  assert.match(source, /const nextHash = `#\$\{getSimulatorTabAnchorId\(normalizedTab\)\}`/);
  assert.match(source, /window\.location\.hash = nextHash/);
  assert.match(source, /addEventListener\("hashchange", handleHashChange\)/);
  assert.match(source, /removeEventListener\("hashchange", handleHashChange\)/);
  assert.match(source, /options\.history !== false/);
});

test("saved portfolios render once and only inside the Step 7 branch", () => {
  const source = readSource("src/components/PortfolioSimulator.jsx");
  assert.equal((source.match(/<PortfolioManagerPanel/g) || []).length, 1);
  assert.match(
    source,
    /effectiveActiveSimulatorTab === "saved"[\s\S]*id="saved-portfolios"[\s\S]*<PortfolioManagerPanel/
  );
  assert.doesNotMatch(source, /<div id="portfolio" className="portfolioAnchor">/);
});

test("existing saved portfolio create, select, delete, server, and backup wiring remains reachable", () => {
  const simulator = readSource("src/components/PortfolioSimulator.jsx");
  const panel = readSource("src/components/portfolio/components/PortfolioManagerPanel.jsx");
  const hook = readSource("src/components/portfolio/hooks/usePortfolioSimulator.js");

  for (const prop of [
    "createPortfolioFromTemplate", "duplicateActivePortfolio", "selectPortfolio",
    "renameActivePortfolio", "deleteActivePortfolio", "downloadPortfolioBackup",
    "openPortfolioBackupFile", "restorePortfolioBackup",
  ]) assert.match(simulator, new RegExp(`${prop}=\\{${prop}\\}`));

  assert.match(panel, /savePortfoliosToServer/);
  assert.match(panel, /loadPortfoliosFromServer/);
  assert.match(panel, /window\.localStorage\.setItem/);
  assert.match(panel, /downloadPortfolioBackup/);
  assert.match(panel, /restorePortfolioBackup/);
  assert.match(hook, /document\.getElementById\("saved-portfolios"\)/);
  assert.match(hook, /FINPLE_BACKUP_VERSION/);
});

test("both navigations expose the same active-state accessibility pattern", () => {
  const tabNav = readSource("src/components/portfolio/components/SimulatorTabNav.jsx");
  const personalPage = readSource("src/components/PersonalPage.jsx");
  assert.match(tabNav, /aria-current=\{activeSimulatorTab === item\.key \? "step" : undefined\}/);
  assert.match(personalPage, /aria-current=\{activeSimulatorStep === item\.key \? "step" : undefined\}/);
  assert.match(tabNav, /sevenStepNav/);
});

test("seven-step desktop and mobile navigation stay contained", () => {
  const appCss = readSource("src/App.css");
  const headerCss = readSource("src/GlobalHeaderOffset.css");
  assert.match(appCss, /sevenStepNav\s*\{[\s\S]*repeat\(7,\s*minmax\(132px,\s*1fr\)\)/);
  assert.match(appCss, /@media\s*\(max-width:\s*980px\)[\s\S]*sevenStepNav[\s\S]*repeat\(2,/);
  assert.match(appCss, /overflow-x:\s*auto/);
  assert.match(headerCss, /\.simulatorRouteSubNav\s*\{[\s\S]*overflow-x:\s*auto\s*!important/);
  assert.match(headerCss, /overscroll-behavior-inline:\s*contain/);
});

test("Step 1 through Step 6 identifiers and anchors remain unchanged", () => {
  assert.deepEqual(
    SIMULATOR_TAB_ITEMS.slice(0, 6).map(({ key, anchorId }) => [key, anchorId]),
    [
      ["settings", "settings"],
      ["compare", "compare"],
      ["detail", "detail"],
      ["probability", "probability-analysis"],
      ["shock", "external-shock-analysis"],
      ["ai", "ai-analysis"],
    ]
  );
});

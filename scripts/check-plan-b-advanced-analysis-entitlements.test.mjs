import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test, { after, before } from "node:test";
import { createServer } from "vite";

import { FINPLE_PLAN_CONFIGS } from "../src/components/portfolio/config/planConfig.js";
import { assertAiAnalysisAccessAllowed, getAiAnalysisAccessState } from "../server/src/services/aiAnalysisAccessControl.js";
import { applyAiAnalysisEntitlement } from "../server/src/services/aiAnalysisEntitlementService.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const simulatorSource = read("../src/components/PortfolioSimulator.jsx");
const hookSource = read("../src/components/portfolio/hooks/usePortfolioSimulator.js");
const subscriptionHookSource = read("../src/components/mypage/hooks/useSubscriptionStatus.js");
const navigationSource = read("../src/components/portfolio/utils/simulatorNavigation.js");
const aiRouteSource = read("../server/src/routes/aiPortfolioAnalysisRoutes.js");
const aiPanelSource = read("../src/components/portfolio/components/AiAnalysisPanel.jsx");
const aiServiceSource = read("../src/components/portfolio/services/aiAnalysisService.js");
const serverIndexSource = read("../server/src/index.js");

let vite;
let SimulatorTabNav;
let AdvancedAnalysisLockedPanel;

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    server: { middlewareMode: true },
  });
  ({ default: SimulatorTabNav } = await vite.ssrLoadModule("/src/components/portfolio/components/SimulatorTabNav.jsx"));
  ({ default: AdvancedAnalysisLockedPanel } = await vite.ssrLoadModule("/src/components/portfolio/components/AdvancedAnalysisLockedPanel.jsx"));
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

test("1. Plan-A portfolio and asset limits stay unchanged", () => {
  assert.equal(FINPLE_PLAN_CONFIGS.free.limits.portfolios, 3);
  assert.equal(FINPLE_PLAN_CONFIGS.personal.limits.portfolios, 30);
  assert.equal(FINPLE_PLAN_CONFIGS.free.limits.assetsPerPortfolio, 5);
  assert.equal(FINPLE_PLAN_CONFIGS.personal.limits.assetsPerPortfolio, 30);
});

test("2. Free allows basic and saved analysis only", () => {
  assert.deepEqual(FINPLE_PLAN_CONFIGS.free.features, {
    basicAnalysis: true,
    probabilityAnalysis: false,
    externalShockAnalysis: false,
    aiAnalysis: false,
    savedPortfolios: true,
  });
});

test("3. Personal and Pro allow all simulator capabilities", () => {
  assert.ok(Object.values(FINPLE_PLAN_CONFIGS.personal.features).every(Boolean));
  assert.ok(Object.values(FINPLE_PLAN_CONFIGS.pro.features).every(Boolean));
});

test("4. Free navigation keeps all seven steps visible with three Personal labels", () => {
  const html = renderNav("free");
  for (let step = 1; step <= 7; step += 1) assert.match(html, new RegExp(`STEP ${step}`));
  assert.equal((html.match(/— Personal/g) || []).length, 6); // desktop and mobile all-steps lists
  assert.match(html, /STEP 4 확률분석, Personal 플랜 기능/);
  assert.match(html, /STEP 5 외부충격분석, Personal 플랜 기능/);
  assert.match(html, /STEP 6 AI 분석, Personal 플랜 기능/);
});

test("5. Personal and Pro navigation expose no locked labels", () => {
  for (const plan of ["personal", "pro"]) {
    assert.doesNotMatch(renderNav(plan), /Personal 플랜 기능|— Personal/);
  }
});

test("6. probability lock panel has feature copy and pricing CTA", () => {
  const html = renderToStaticMarkup(React.createElement(AdvancedAnalysisLockedPanel, { capability: "probabilityAnalysis" }));
  assert.match(html, /확률분석/);
  assert.match(html, /월간 수익률/);
  assert.match(html, /Personal 플랜 기능/);
  assert.match(html, /href="\/pricing"[^>]*>요금제 보기/);
});

test("7. external shock lock panel has feature-specific copy", () => {
  const html = renderToStaticMarkup(React.createElement(AdvancedAnalysisLockedPanel, { capability: "externalShockAnalysis" }));
  assert.match(html, /외부충격분석/);
  assert.match(html, /시장 충격 상황/);
});

test("8. AI lock panel has feature-specific copy", () => {
  const html = renderToStaticMarkup(React.createElement(AdvancedAnalysisLockedPanel, { capability: "aiAnalysis" }));
  assert.match(html, /AI 분석/);
  assert.match(html, /AI로 해석/);
});

test("9. locked controls remain focusable and the panel is an accessible region", () => {
  const nav = renderNav("free", "probability");
  const panel = renderToStaticMarkup(React.createElement(AdvancedAnalysisLockedPanel, { capability: "probabilityAnalysis" }));
  assert.doesNotMatch(nav, /disabled/);
  assert.match(nav, /aria-current="step"/);
  assert.match(panel, /role="region"/);
  assert.match(panel, /aria-labelledby=/);
});

test("10. simulator capabilities come from the server subscription hook", () => {
  assert.match(simulatorSource, /useSubscriptionStatus\(subscriptionUser\)/);
  assert.match(simulatorSource, /normalizeFinplePlan\(subscription\.effectivePlan\)/);
  assert.doesNotMatch(simulatorSource, /getStoredFinplePlan/);
});

test("11. subscription loading and errors fail closed to Free", () => {
  assert.match(subscriptionHookSource, /isCurrentUser \? data\.effectivePlan : "free"/);
  assert.match(subscriptionHookSource, /fetchJsonWithTimeout\("\/payments\/subscription\/me"/);
});

test("12. local plan cache changes trigger an authoritative refresh", () => {
  assert.match(simulatorSource, /finple-plan-updated/);
  assert.match(simulatorSource, /refreshSubscription\(\{ force: true \}\)/);
  assert.match(subscriptionHookSource, /getStoredFinplePlan\(\) !== result\.effectivePlan/);
});

test("13. Free probability access stops before monthly configuration or shard loading", () => {
  const guard = hookSource.indexOf('activeSimulatorTab === "probability" && !probabilityAnalysisAllowed');
  const loader = hookSource.indexOf("isProductionMonthlyScenarioArtifactConfigured()", guard);
  assert.ok(guard >= 0 && loader > guard);
  assert.match(hookSource, /probabilityAnalysisAllowed,/);
});

test("14. advanced components mount only after their capability check", () => {
  assert.match(simulatorSource, /planFeatures\.probabilityAnalysis \? <ProbabilityAnalysisPanel/);
  assert.match(simulatorSource, /planFeatures\.externalShockAnalysis \? <ExternalShockAnalysisPanel/);
  assert.match(simulatorSource, /planFeatures\.aiAnalysis \? <AiAnalysisPanel/);
  assert.match(aiPanelSource, /analysisRequestRef\.current\?\.abort\(\)/);
  assert.match(aiServiceSource, /signal\?\.addEventListener\("abort"/);
});

test("15. direct advanced hashes remain valid and render in place", () => {
  assert.match(navigationSource, /"probability-analysis", "probability"/);
  assert.match(navigationSource, /"external-shock-analysis", "shock"/);
  assert.match(navigationSource, /"ai-analysis", "ai"/);
  assert.match(simulatorSource, /hashNavigator\.applyCurrentHash\(\)/);
});

test("16. Free AI access returns the stable 403 contract and Korean message", () => {
  assert.throws(
    () => assertAiAnalysisAccessAllowed({ id: "free-user", plan: "free" }),
    (error) => error.statusCode === 403 &&
      error.code === "AI_ANALYSIS_PLAN_REQUIRED" &&
      error.message === "포트폴리오 AI 분석은 Personal 플랜에서 사용할 수 있습니다." &&
      !error.details && !error.access,
  );
  assert.match(serverIndexSource, /error\.code \? \{ code: error\.code \}/);
});

test("17. Personal and Pro AI access stays enabled", () => {
  assert.equal(assertAiAnalysisAccessAllowed({ id: "personal-user", plan: "personal" }).allowed, true);
  assert.equal(assertAiAnalysisAccessAllowed({ id: "pro-user", plan: "pro" }).allowed, true);
});

test("18. public mode and unauthenticated callers cannot bypass AI access", () => {
  assert.equal(getAiAnalysisAccessState(null, { accessMode: "public", allowedPlans: ["personal"] }).allowed, false);
  assert.throws(() => assertAiAnalysisAccessAllowed(null), (error) => error.statusCode === 401 && error.code === "AUTH_REQUIRED");
});

test("19. expired authoritative entitlement downgrades access without deleting data", () => {
  const user = { id: "user-a", plan: "personal", customField: "preserved" };
  const result = applyAiAnalysisEntitlement(
    user,
    { plan: "personal", valid_until: "2026-01-01T00:00:00.000Z" },
    { plan: "personal", status: "active", current_period_end: "2026-01-01T00:00:00.000Z" },
    new Date("2026-08-01T00:00:00.000Z"),
  );
  assert.equal(result.plan, "free");
  assert.equal(result.customField, "preserved");
});

test("20. AI POST orders access before payload, usage, and provider while Step 3 and 7 stay available", () => {
  const post = aiRouteSource.slice(aiRouteSource.indexOf('router.post("/portfolio-analysis"'));
  const accessIndex = post.indexOf("assertAiAnalysisAccessAllowed(user)");
  const payloadIndex = post.indexOf("normalizePortfolioAnalysisRequest(request.body)");
  const usageIndex = post.indexOf("reserveUsage({ request, user, payload })");
  const providerIndex = post.indexOf("runPortfolioAnalysis(payload)");
  assert.ok(accessIndex >= 0 && accessIndex < payloadIndex && payloadIndex < usageIndex && usageIndex < providerIndex);
  assert.match(simulatorSource, /effectiveActiveSimulatorTab === "detail"/);
  assert.match(simulatorSource, /effectiveActiveSimulatorTab === "saved"/);
  assert.equal(FINPLE_PLAN_CONFIGS.free.limits.pdfEnabled, false);
});

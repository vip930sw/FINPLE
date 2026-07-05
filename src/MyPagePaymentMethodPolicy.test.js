import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SIDEBAR_SOURCE = new URL("./MyPageSidebarPatch.js", import.meta.url);
const CLIENT_SOURCE = new URL("./components/paymentMethodClient.js", import.meta.url);
const SUBSCRIPTION_SOURCE = new URL("./MyPageSubscriptionStatusPatch.js", import.meta.url);
const SHELL_BRIDGE_SOURCE = new URL("./MyPageShellBridgePatch.js", import.meta.url);
const STABILIZATION_SOURCE = new URL("./MyPageRenderStabilizationPatch.js", import.meta.url);
const PAYMENT_HISTORY_SOURCE = new URL("./MyPagePaymentHistoryPatch.js", import.meta.url);
const SERVER_PORTFOLIO_SERVICE_SOURCE = new URL("./components/portfolio/services/serverPortfolioService.js", import.meta.url);
const INVESTMENT_MBTI_PAGE_SOURCE = new URL("./components/InvestmentMbtiPage.jsx", import.meta.url);

test("mypage payment method refresh preserves stale registered data while loading", async () => {
  const source = await readFile(SIDEBAR_SOURCE, "utf8");
  const loadBody = source.match(/async function loadBillingMethodStatus\(options = \{\}\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(loadBody, /\.\.\.billingMethodState/);
  assert.match(loadBody, /loading: !billingMethodState\.method/);
  assert.match(loadBody, /refreshing: Boolean\(billingMethodState\.method\)/);
  assert.doesNotMatch(loadBody, /registered: false,\s*method: null/);
});

test("mypage payment method requests use force only on explicit refresh and reset on auth change", async () => {
  const source = await readFile(SIDEBAR_SOURCE, "utf8");

  assert.match(source, /fetchBillingMethodStatus\(\{ force: Boolean\(options\.force\) \}\)/);
  assert.match(source, /function resetBillingMethodRequestState\(\)/);
  assert.match(source, /clearBillingMethodStatusCache\(\)/);
  assert.match(source, /window\.addEventListener\("finple-auth-updated"/);
});

test("mypage sidebar patch skips heavy reapply after the shell is stable", async () => {
  const source = await readFile(SIDEBAR_SOURCE, "utf8");
  const fastPathBody = source.match(/if \(sidebarPatchStable && isSidebarPatchStable\(\)\) \{[\s\S]*?\n  \}/)?.[0] || "";

  assert.match(source, /let sidebarPatchStable = false;/);
  assert.match(source, /function isSidebarPatchStable\(\)/);
  assert.match(source, /function applyMyPageSidebarIfNeeded\(\)/);
  assert.match(source, /window\.setTimeout\(applyMyPageSidebarIfNeeded, delay\)/);
  assert.match(source, /sidebarPatchStable = isSidebarPatchStable\(\)/);
  assert.match(fastPathBody, /markPanelKeys\(\)/);
  assert.match(fastPathBody, /normalizePanelStackPlacement\(\)/);
  assert.match(fastPathBody, /setActivePanel\(activeMenuKey\)/);
});

test("mypage sidebar keeps all late panels keyed and inside the single active stack", async () => {
  const source = await readFile(SIDEBAR_SOURCE, "utf8");
  const markBody = source.match(/function markPanelKeys\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  const placementBody = source.match(/function normalizePanelStackPlacement\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  const activeBody = source.match(/function setActivePanel\(nextKey, options = \{\}\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(source, /const PANEL_KEY_SELECTORS = \[/);
  assert.match(source, /const PANEL_ORDER_SELECTORS = \[/);
  assert.match(markBody, /querySelectorAll\(selector\)/);
  assert.match(markBody, /setAttribute\("data-mypage-panel-key", item\.key\)/);
  assert.match(source, /\{ key: "billing", selectors: \["\[data-subscription-status-panel\]", "\.subscriptionStatusPanel", "\.planStatusPanel"\] \}/);
  assert.match(placementBody, /document\.querySelector\("\.accountPanelStack"\)/);
  assert.match(placementBody, /stack\.insertBefore\(panel, nextSibling\)/);
  assert.match(activeBody, /markPanelKeys\(\)/);
  assert.match(activeBody, /normalizePanelStackPlacement\(\)/);
  assert.match(activeBody, /\.accountPanelStack > \[data-mypage-panel-key\]/);
});

test("payment method client dedupes in-flight requests and does not query assets or KIS", async () => {
  const source = await readFile(CLIENT_SOURCE, "utf8");

  assert.match(source, /billingMethodStatusInflight\.has\(cacheKey\)/);
  assert.match(source, /billingMethodStatusInflight\.set\(cacheKey, requestPromise\)/);
  assert.match(source, /BILLING_METHOD_STATUS_CACHE_TTL_MS = 45000/);
  assert.doesNotMatch(source, /\/api\/assets|\/assets\/batch|kis|KIS|token issuance|quote/i);
});

test("mypage subscription observer does not directly trigger repeated network requests", async () => {
  const source = await readFile(SUBSCRIPTION_SOURCE, "utf8");
  const bootBody = source.match(/function bootMyPageSubscriptionPatch\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  const requestBody = source.match(/async function requestSubscriptionStatusOnce\(options = \{\}\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(source, /SUBSCRIPTION_STATUS_CACHE_TTL_MS = 45000/);
  assert.match(source, /let lastSubscriptionFetchAt = 0;/);
  assert.match(source, /subscriptionStatusInflight\.has\(cacheKey\)/);
  assert.match(bootBody, /new MutationObserver\(\(\) => scheduleSubscriptionPatch\(80\)\)/);
  assert.doesNotMatch(bootBody, /fetchSubscriptionStatus\(|requestSubscriptionStatusOnce\(/);
  assert.match(requestBody, /now - lastSubscriptionFetchAt < SUBSCRIPTION_STATUS_CACHE_TTL_MS/);
  assert.match(requestBody, /lastSubscriptionPayload = await fetchSubscriptionStatus\(\{ force: Boolean\(options\.force\) \}\)/);
  assert.match(requestBody, /lastSubscriptionFetchAt = Date\.now\(\)/);
  assert.doesNotMatch(requestBody, /lastSubscriptionPayload = null/);
});

test("mypage investment MBTI prefers server profile with local cache fallback and backfill", async () => {
  const sidebarSource = await readFile(SIDEBAR_SOURCE, "utf8");
  const serviceSource = await readFile(SERVER_PORTFOLIO_SERVICE_SOURCE, "utf8");
  const mbtiPageSource = await readFile(INVESTMENT_MBTI_PAGE_SOURCE, "utf8");

  assert.match(serviceSource, /export async function fetchInvestmentMbtiProfile\(\)/);
  assert.match(serviceSource, /\/account\/investment-mbti/);
  assert.match(serviceSource, /export async function upsertInvestmentMbtiProfile\(profile\)/);
  assert.match(sidebarSource, /INVESTMENT_MBTI_CACHE_TTL_MS = 45000/);
  assert.match(sidebarSource, /fetchInvestmentMbtiProfileCached/);
  assert.match(sidebarSource, /writeInvestmentMbtiProfileToCache\(profile\)/);
  assert.match(sidebarSource, /backfillInvestmentMbtiProfileIfNeeded\(localProfile\)/);
  assert.match(sidebarSource, /storage.*server|서버 저장은 나중에 다시 시도됩니다/s);
  assert.match(mbtiPageSource, /buildMbtiProfileFromResult/);
  assert.match(mbtiPageSource, /saveMbtiProfileToServer\(profile\)/);
  assert.match(mbtiPageSource, /window\.__finpleMbtiServerSavePending/);
});

test("mypage shell-ready events do not restart the whole fallback overlay", async () => {
  const source = await readFile(STABILIZATION_SOURCE, "utf8");

  assert.match(source, /function bootStabilizationUnlessShellReady\(\)/);
  assert.match(source, /isMyPagePath\(\) && isShellReady\(\)/);
  assert.match(source, /revealMyPage\(\)/);
  assert.match(source, /window\.addEventListener\("finple-auth-updated", bootStabilizationUnlessShellReady\)/);
  assert.match(source, /window\.addEventListener\("finple-local-storage-updated", bootStabilizationUnlessShellReady\)/);
});

test("mypage shell bridge observer is throttled and disconnects after stable shell", async () => {
  const source = await readFile(SHELL_BRIDGE_SOURCE, "utf8");
  const scheduleBody = source.match(/function scheduleShellBridgeApply\(delay = 40\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(source, /let shellBridgeScheduled = false;/);
  assert.match(source, /let shellBridgeStable = false;/);
  assert.match(source, /function scheduleShellBridgeApply\(delay = 40\)/);
  assert.match(source, /function syncShellBridgeActiveState\(\)/);
  assert.match(scheduleBody, /syncShellBridgeActiveState\(\)/);
  assert.match(source, /observer\.disconnect\(\)/);
  assert.match(source, /shellBridgeStable && isShellBridgeStable\(\)/);
});

test("mypage payment history keeps stale data during refresh failures", async () => {
  const source = await readFile(PAYMENT_HISTORY_SOURCE, "utf8");
  const loadBody = source.match(/async function loadPaymentHistory\(options = \{\}\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(source, /refreshing: false/);
  assert.match(loadBody, /\.\.\.paymentHistoryState/);
  assert.match(loadBody, /loading: !paymentHistoryState\.payments\.length/);
  assert.doesNotMatch(loadBody, /payments: \[\], error/);
});

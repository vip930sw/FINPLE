import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const APP_SOURCE = new URL("./App.jsx", import.meta.url);
const MAIN_SOURCE = new URL("./main.jsx", import.meta.url);
const ROUTE_SOURCE = new URL("./components/mypage/MyPageRoute.jsx", import.meta.url);
const LAYOUT_SOURCE = new URL("./components/mypage/MyPageLayout.jsx", import.meta.url);
const SUBSCRIPTION_HOOK_SOURCE = new URL("./components/mypage/hooks/useSubscriptionStatus.js", import.meta.url);
const PAYMENT_METHOD_HOOK_SOURCE = new URL("./components/mypage/hooks/usePaymentMethod.js", import.meta.url);
const PAYMENT_HISTORY_HOOK_SOURCE = new URL("./components/mypage/hooks/usePaymentHistory.js", import.meta.url);
const MBTI_HOOK_SOURCE = new URL("./components/mypage/hooks/useInvestmentMbti.js", import.meta.url);

const LEGACY_MYPAGE_PATCH_IMPORTS = [
  "MyPageRenderStabilizationPatch.js",
  "MyPageShellBridgePatch.js",
  "MyPageSubscriptionStatusPatch.js",
  "MyPageBillingStatusDisplayPatch.js",
  "MyPageServerStorageDisplayPatch.js",
  "MyPagePaymentMethodDisplayPatch.js",
  "MyPageSidebarPatch.js",
  "MyPageInvestmentProfileDisplayPatch.js",
  "MyPageAccountStatusDisplayPatch.js",
  "MyPagePaymentHistoryPatch.js",
  "MyPageMenuFinalOrderPatch.js",
  "MyPageBillingPlanMergePatch.js",
  "MyPageHistoryPaginationPatch.js",
];

test("mypage route is served by the React rebuild instead of legacy DOM patches", async () => {
  const appSource = await readFile(APP_SOURCE, "utf8");
  const mainSource = await readFile(MAIN_SOURCE, "utf8");
  const routeSource = await readFile(ROUTE_SOURCE, "utf8");
  const layoutSource = await readFile(LAYOUT_SOURCE, "utf8");

  assert.match(appSource, /import MyPageRoute from "\.\/components\/mypage\/MyPageRoute"/);
  assert.match(appSource, /currentPage === "mypage"[\s\S]*<MyPageRoute onNavigate=\{navigateToPage\}/);
  assert.match(routeSource, /const \[activeSection, setActiveSection\] = useState\(getInitialSection\)/);
  assert.match(routeSource, /switch \(activeSection\)/);
  assert.match(routeSource, /case "payment-method"/);
  assert.match(routeSource, /case "payment-history"/);
  assert.match(layoutSource, /data-finple-mypage-react="true"/);
  assert.match(routeSource, /window\.__FINPLE_REACT_MYPAGE_ROUTE = true/);

  LEGACY_MYPAGE_PATCH_IMPORTS.forEach((patchFile) => {
    assert.doesNotMatch(mainSource, new RegExp(patchFile.replace(".", "\\.")));
  });
});

test("mypage panel data loading stays scoped to the active section", async () => {
  const routeSource = await readFile(ROUTE_SOURCE, "utf8");
  const paymentMethodHook = await readFile(PAYMENT_METHOD_HOOK_SOURCE, "utf8");
  const paymentHistoryHook = await readFile(PAYMENT_HISTORY_HOOK_SOURCE, "utf8");
  const mbtiHook = await readFile(MBTI_HOOK_SOURCE, "utf8");

  assert.match(routeSource, /usePaymentMethod\(user, activeSection === "payment-method"\)/);
  assert.match(routeSource, /usePaymentHistory\(user, activeSection === "payment-history"\)/);
  assert.match(routeSource, /useInvestmentMbti\(user, activeSection === "investment"\)/);
  assert.match(routeSource, /useMyInquiries\(user, activeSection === "inquiries"\)/);
  assert.match(paymentMethodHook, /if \(!enabled \|\| !user\?\.id\) return null/);
  assert.match(paymentMethodHook, /if \(enabled && !state\.requested\) refresh\(\)/);
  assert.match(paymentHistoryHook, /if \(!enabled \|\| !user\?\.id\) return \[\]/);
  assert.match(mbtiHook, /if \(!enabled \|\| !user\?\.id\) return null/);
});

test("mypage subscription and payment method use bounded cached status reads", async () => {
  const subscriptionHook = await readFile(SUBSCRIPTION_HOOK_SOURCE, "utf8");
  const paymentMethodHook = await readFile(PAYMENT_METHOD_HOOK_SOURCE, "utf8");

  assert.match(subscriptionHook, /SUBSCRIPTION_TTL_MS/);
  assert.match(subscriptionHook, /subscriptionInflight\.has\(cacheKey\)/);
  assert.match(subscriptionHook, /fetchJsonWithTimeout\("\/payments\/subscription\/me"/);
  assert.match(paymentMethodHook, /fetchBillingMethodStatus\(\{ force: Boolean\(options\.force\) \}\)/);
  assert.doesNotMatch(subscriptionHook + paymentMethodHook, /\/api\/assets|KIS|kis|quote|currentPrice/);
});

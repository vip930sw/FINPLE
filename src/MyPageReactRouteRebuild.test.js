import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const APP_SOURCE = new URL("./App.jsx", import.meta.url);
const MAIN_SOURCE = new URL("./main.jsx", import.meta.url);
const ROUTE_SOURCE = new URL("./components/mypage/MyPageRoute.jsx", import.meta.url);
const LAYOUT_SOURCE = new URL("./components/mypage/MyPageLayout.jsx", import.meta.url);
const CSS_SOURCE = new URL("./components/mypage/MyPageReact.css", import.meta.url);
const SUBSCRIPTION_HOOK_SOURCE = new URL("./components/mypage/hooks/useSubscriptionStatus.js", import.meta.url);
const PAYMENT_METHOD_HOOK_SOURCE = new URL("./components/mypage/hooks/usePaymentMethod.js", import.meta.url);
const PAYMENT_HISTORY_HOOK_SOURCE = new URL("./components/mypage/hooks/usePaymentHistory.js", import.meta.url);
const MBTI_HOOK_SOURCE = new URL("./components/mypage/hooks/useInvestmentMbti.js", import.meta.url);
const ACCOUNT_PANEL_SOURCE = new URL("./components/mypage/panels/MyAccountPanel.jsx", import.meta.url);
const BILLING_PANEL_SOURCE = new URL("./components/mypage/panels/MyBillingPlanPanel.jsx", import.meta.url);
const INVESTMENT_PANEL_SOURCE = new URL("./components/mypage/panels/MyInvestmentProfilePanel.jsx", import.meta.url);
const PAYMENT_METHOD_PANEL_SOURCE = new URL("./components/mypage/panels/MyPaymentMethodPanel.jsx", import.meta.url);
const PAYMENT_HISTORY_PANEL_SOURCE = new URL("./components/mypage/panels/MyPaymentHistoryPanel.jsx", import.meta.url);
const INQUIRIES_PANEL_SOURCE = new URL("./components/mypage/panels/MyInquiriesPanel.jsx", import.meta.url);
const STORAGE_PANEL_SOURCE = new URL("./components/mypage/panels/MyStoragePanel.jsx", import.meta.url);

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

test("mypage account, billing, and panel UX restore follow-up behavior", async () => {
  const routeSource = await readFile(ROUTE_SOURCE, "utf8");
  const accountPanel = await readFile(ACCOUNT_PANEL_SOURCE, "utf8");
  const billingPanel = await readFile(BILLING_PANEL_SOURCE, "utf8");
  const investmentPanel = await readFile(INVESTMENT_PANEL_SOURCE, "utf8");
  const paymentMethodPanel = await readFile(PAYMENT_METHOD_PANEL_SOURCE, "utf8");
  const paymentHistoryPanel = await readFile(PAYMENT_HISTORY_PANEL_SOURCE, "utf8");
  const inquiriesPanel = await readFile(INQUIRIES_PANEL_SOURCE, "utf8");
  const storagePanel = await readFile(STORAGE_PANEL_SOURCE, "utf8");
  const cssSource = await readFile(CSS_SOURCE, "utf8");

  assert.match(routeSource, /function scrollMyPageContentTop/);
  assert.match(routeSource, /document\.querySelector\("\.accountPanelStack"\)/);
  assert.match(routeSource, /requestAnimationFrame\(scroll\)/);
  assert.match(routeSource, /setTimeout\(scroll, 180\)/);
  assert.match(accountPanel, /updateFinpleProfile/);
  assert.match(accountPanel, /changeFinplePassword/);
  assert.match(accountPanel, /deleteFinpleAccount/);
  assert.match(accountPanel, /닉네임이 변경되었습니다/);
  assert.match(accountPanel, /회원탈퇴 신청/);
  assert.match(accountPanel, /authMode === "email-password"/);
  assert.doesNotMatch(accountPanel, /onNavigate\?\.\("support"\)/);
  assert.match(billingPanel, /requestPortfolioAiAnalysisStatus/);
  assert.match(billingPanel, /현재 플랜[\s\S]*구독 상태[\s\S]*다음 결제일[\s\S]*포트폴리오[\s\S]*AI 분석 사용량[\s\S]*이용 종료 예정일/);
  assert.doesNotMatch(billingPanel, /admin\/ai-analysis-usage/);
  assert.match(investmentPanel, /data-mypage-mbti-detail/);
  assert.match(investmentPanel, /data-mypage-mbti-axis-chart/);
  assert.match(investmentPanel, /data-mypage-mbti-allocation-chart/);
  assert.match(investmentPanel, /결과 자세히 보기/);
  assert.match(investmentPanel, /결과 접기/);
  assert.match(investmentPanel, /추종/);
  assert.doesNotMatch(investmentPanel, /left: "자동"|right: "자동"|>자동</);
  assert.doesNotMatch(investmentPanel, /\/start|\/mbti\?view=result/);
  assert.match(paymentMethodPanel, /paymentMethod\.displayLabel/);
  assert.match(paymentHistoryPanel, /결제내역 보기/);
  assert.match(paymentHistoryPanel, /결제내역 숨기기/);
  assert.match(paymentHistoryPanel, /data-mypage-payment-history-list/);
  assert.match(inquiriesPanel, /sanitizeInquiryMessage/);
  assert.match(inquiriesPanel, /User Agent/);
  assert.match(inquiriesPanel, /페이지 URL/);
  assert.match(inquiriesPanel, /문의내역 보기/);
  assert.match(inquiriesPanel, /문의내역 숨기기/);
  assert.match(investmentPanel, /myPageSummaryGrid--three/);
  assert.match(storagePanel, /myPageSummaryGrid--three/);
  assert.match(cssSource, /myPageReactPanel \.myPageSummaryGrid/);
  assert.match(cssSource, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

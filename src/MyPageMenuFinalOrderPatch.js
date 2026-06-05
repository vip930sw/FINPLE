/* =========================================================
   Step 112-3 - MY PAGE final menu naming/order patch
   - 요금제 상태 패널을 내 구독/플랜 메뉴 안으로 묶습니다.
   - 좌측 메뉴 명칭과 순서를 최종 정리합니다.
========================================================= */

const MENU_LABELS = {
  account: { label: "내 계정", description: "로그인·사용자" },
  "investment-profile": { label: "내 투자성향", description: "투자 MBTI" },
  billing: { label: "내 구독/플랜", description: "구독·요금제" },
  "payment-method": { label: "내 결제수단", description: "자동결제 등록" },
  "payment-history": { label: "내 결제내역", description: "영수증·이력" },
  inquiries: { label: "내 문의내역", description: "접수·처리 현황" },
  storage: { label: "서버 저장", description: "저장·불러오기" },
};

const MENU_ORDER = [
  "account",
  "investment-profile",
  "billing",
  "payment-method",
  "payment-history",
  "inquiries",
  "storage",
];

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function setButtonText(button, key) {
  const config = MENU_LABELS[key];
  if (!button || !config) return;
  const labelNode = button.querySelector("span");
  const descriptionNode = button.querySelector("em");
  if (labelNode && labelNode.textContent !== config.label) labelNode.textContent = config.label;
  if (descriptionNode && descriptionNode.textContent !== config.description) descriptionNode.textContent = config.description;
}

function relabelAndReorderMenu() {
  const nav = document.querySelector(".myPageSidebarNav");
  if (!nav) return;

  const planButton = nav.querySelector('[data-mypage-menu-key="plan"]');
  if (planButton) {
    planButton.hidden = true;
    planButton.style.display = "none";
    planButton.setAttribute("aria-hidden", "true");
  }

  MENU_ORDER.forEach((key) => {
    const button = nav.querySelector(`[data-mypage-menu-key="${key}"]`);
    if (!button) return;
    setButtonText(button, key);
    nav.appendChild(button);
  });
}

function groupPlanPanelWithSubscription() {
  const subscriptionPanel = document.querySelector("[data-subscription-status-panel]");
  const planPanel = document.querySelector(".planStatusPanel");
  if (!subscriptionPanel || !planPanel) return;

  planPanel.setAttribute("data-mypage-panel-key", "billing");
  planPanel.setAttribute("data-mypage-merged-into", "billing");

  if (subscriptionPanel.nextElementSibling !== planPanel && subscriptionPanel.parentNode) {
    subscriptionPanel.insertAdjacentElement("afterend", planPanel);
  }

  const billingActive = document.querySelector('[data-mypage-menu-key="billing"]')?.classList.contains("active");
  if (billingActive) {
    planPanel.classList.add("myPagePanelActive");
    planPanel.classList.remove("myPagePanelHidden");
    planPanel.removeAttribute("hidden");
  }
}

function wireBillingMenuMerge() {
  const billingButton = document.querySelector('[data-mypage-menu-key="billing"]');
  if (!billingButton || billingButton.getAttribute("data-final-billing-merge-wired") === "true") return;
  billingButton.setAttribute("data-final-billing-merge-wired", "true");
  billingButton.addEventListener("click", () => window.setTimeout(groupPlanPanelWithSubscription, 0));
}

function applyFinalMenuPatch() {
  if (!isMyPagePath()) return;
  relabelAndReorderMenu();
  groupPlanPanelWithSubscription();
  wireBillingMenuMerge();
}

function bootFinalMenuPatch() {
  [220, 520, 920, 1500, 2400, 3400].forEach((delay) => window.setTimeout(applyFinalMenuPatch, delay));
  window.addEventListener("popstate", () => window.setTimeout(applyFinalMenuPatch, 160));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(applyFinalMenuPatch, 180));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootFinalMenuPatch, { once: true });
  else bootFinalMenuPatch();
}

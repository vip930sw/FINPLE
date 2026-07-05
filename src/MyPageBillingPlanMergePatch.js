/* =========================================================
   Step 112-3 - MY PAGE billing/plan merge detail patch
   - 구독 상태 카드를 제거하고 Billing Status를 2행 3열로 정리합니다.
   - 플랜 사용량의 포트폴리오/현재 자산/서버 저장 카드를 Billing Status로 옮깁니다.
   - Personal 뱃지와 사용량 안내 박스를 Billing Status 영역으로 옮깁니다.
   - 좌측 메뉴명에 맞춰 각 패널의 영문 라벨/한글 제목을 정리합니다.
========================================================= */

const PANEL_TITLES = [
  { selector: ".accountStatusPanel", eyebrow: "MY ACCOUNT", title: "내 계정" },
  { selector: "[data-investment-profile-panel]", eyebrow: "MY INVESTMENT PROFILE", title: "내 투자성향" },
  {
    selector: "[data-subscription-status-panel]",
    eyebrow: "MY BILLING / PLAN",
    title: "내 구독/플랜",
    description: "현재 이용 중인 플랜, 결제 일정, 사용량과 저장 권한을 한눈에 확인합니다.",
  },
  {
    selector: "[data-payment-method-panel]",
    eyebrow: "MY PAYMENT METHOD",
    title: "내 결제수단",
    description: "정기결제에 사용할 결제수단을 관리하며, 카드번호 원문은 FINPLE 서버에 저장되지 않습니다.",
  },
  { selector: "[data-payment-history-panel]", eyebrow: "MY PAYMENT HISTORY", title: "내 결제내역" },
  { selector: "[data-my-inquiries-panel]", eyebrow: "MY INQUIRIES", title: "내 문의내역" },
  { selector: ".serverStoragePanel", eyebrow: "MY STORAGE HISTORY", title: "내 저장내역" },
];

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function setText(node, value) {
  if (!node || !value) return;
  const nextValue = String(value);
  if (node.textContent !== nextValue) node.textContent = nextValue;
}

function setPanelTitle({ selector, eyebrow, title, description }) {
  const panel = document.querySelector(selector);
  if (!panel) return;

  setText(panel.querySelector(".accountMiniLabel"), eyebrow);
  setText(panel.querySelector("h2"), title);

  if (description) {
    const descriptionNode = panel.querySelector(".serverStorageHeader p:not(.accountMiniLabel)") || panel.querySelector("h2 + p");
    setText(descriptionNode, description);
  }
}

function relabelPanelsToMatchSidebar() {
  PANEL_TITLES.forEach(setPanelTitle);
}

function getCardByLabel(container, label) {
  if (!container) return null;
  return Array.from(container.children).find((card) => {
    const cardLabel = card.querySelector("span")?.textContent?.trim();
    return cardLabel === label;
  }) || null;
}

function removeSubscriptionStatusCard(subscriptionPanel) {
  const statusValue = subscriptionPanel?.querySelector("[data-subscription-status]");
  const statusCard = statusValue?.closest("div");
  if (statusCard) statusCard.remove();
}

function movePlanUsageCards(subscriptionPanel, planPanel) {
  const subscriptionGrid = subscriptionPanel?.querySelector(".subscriptionStatusGrid");
  const planGrid = planPanel?.querySelector(".planUsageGrid");
  if (!subscriptionGrid || !planGrid) return;

  subscriptionGrid.classList.add("billingMergedUsageGrid");

  ["포트폴리오", "현재 자산", "서버 저장"].forEach((label) => {
    const existingCard = getCardByLabel(subscriptionGrid, label);
    if (existingCard) return;

    const card = getCardByLabel(planGrid, label);
    if (!card) return;

    card.classList.add("billingMergedUsageCard");
    subscriptionGrid.appendChild(card);
  });
}

function movePlanBadge(subscriptionPanel, planPanel) {
  const subscriptionBadge = subscriptionPanel?.querySelector("[data-subscription-badge]");
  if (!subscriptionBadge) return;

  const label = subscriptionPanel?.querySelector("[data-subscription-plan]")?.textContent?.trim();
  if (label) subscriptionBadge.textContent = label;
  subscriptionBadge.classList.add("billingMergedPlanBadge");
}

function moveUsageMessage(subscriptionPanel, planPanel) {
  const actions = subscriptionPanel?.querySelector(".subscriptionStatusActions");
  if (!actions) return;

  let message = subscriptionPanel.querySelector("[data-billing-usage-message]");
  if (!message) {
    message = planPanel?.querySelector(".serverStorageMessage.compact, .serverStorageMessage.dangerMessage, .upgradePromptBox");
  }
  if (!message) return;

  message.setAttribute("data-billing-usage-message", "true");
  message.classList.add("billingMergedUsageMessage");
  if (message.parentNode !== subscriptionPanel) {
    actions.insertAdjacentElement("beforebegin", message);
  }
}

function restorePricingButton(subscriptionPanel) {
  const pricingButton = subscriptionPanel?.querySelector("[data-subscription-pricing]");
  if (!pricingButton) return;

  pricingButton.hidden = false;
  pricingButton.removeAttribute("hidden");
  pricingButton.style.removeProperty("display");
  pricingButton.classList.add("billingPlanPrimaryAction");
  setText(pricingButton, "요금제 변경");
}

function hideMergedPlanPanel(planPanel) {
  if (!planPanel) return;
  planPanel.setAttribute("data-billing-plan-merged", "true");
  planPanel.setAttribute("data-mypage-panel-key", "billing");
  planPanel.setAttribute("data-mypage-panel-hidden", "true");
  planPanel.setAttribute("hidden", "true");
  planPanel.classList.add("billingMergedPlanPanelHidden");
  planPanel.classList.add("myPagePanelHidden");
  planPanel.classList.remove("myPagePanelActive");
  planPanel.style.setProperty("display", "none", "important");
}

function syncMyPageActivePanel() {
  window.__finpleSyncMyPageActivePanel?.(window.__finpleMyPageActiveKey || "account");
}

function applyBillingPlanMergePatch() {
  if (!isMyPagePath()) return;

  relabelPanelsToMatchSidebar();

  const subscriptionPanel = document.querySelector("[data-subscription-status-panel]");
  const planPanel = document.querySelector(".planStatusPanel");
  if (!subscriptionPanel || !planPanel) return;

  subscriptionPanel.classList.add("billingPlanMergedPanel");
  removeSubscriptionStatusCard(subscriptionPanel);
  movePlanUsageCards(subscriptionPanel, planPanel);
  movePlanBadge(subscriptionPanel, planPanel);
  moveUsageMessage(subscriptionPanel, planPanel);
  restorePricingButton(subscriptionPanel);
  hideMergedPlanPanel(planPanel);
  syncMyPageActivePanel();
}

function bootBillingPlanMergePatch() {
  [260, 620, 1050, 1700, 2600, 3600].forEach((delay) => window.setTimeout(applyBillingPlanMergePatch, delay));
  window.addEventListener("popstate", () => window.setTimeout(applyBillingPlanMergePatch, 180));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(applyBillingPlanMergePatch, 220));
  window.addEventListener("finple-plan-updated", () => window.setTimeout(applyBillingPlanMergePatch, 220));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootBillingPlanMergePatch, { once: true });
  else bootBillingPlanMergePatch();
}

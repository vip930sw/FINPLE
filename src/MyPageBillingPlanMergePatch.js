/* =========================================================
   Step 112-3 - MY PAGE billing/plan merge detail patch
   - 구독 상태 카드를 제거하고 Billing Status를 2행 3열로 정리합니다.
   - 플랜 사용량의 포트폴리오/현재 자산/서버 저장 카드를 Billing Status로 옮깁니다.
   - Personal 뱃지와 사용량 안내 박스를 Billing Status 영역으로 옮깁니다.
========================================================= */

function isMyPagePath() {
  return window.location.pathname === "/mypage";
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
  const planBadge = planPanel?.querySelector(".serverStorageHeader .serverStatusBadge");
  if (!subscriptionBadge || !planBadge) return;

  const label = planBadge.textContent?.trim();
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

function hideMergedPlanPanel(planPanel) {
  if (!planPanel) return;
  planPanel.setAttribute("data-billing-plan-merged", "true");
  planPanel.classList.add("billingMergedPlanPanelHidden");
}

function applyBillingPlanMergePatch() {
  if (!isMyPagePath()) return;

  const subscriptionPanel = document.querySelector("[data-subscription-status-panel]");
  const planPanel = document.querySelector(".planStatusPanel");
  if (!subscriptionPanel || !planPanel) return;

  subscriptionPanel.classList.add("billingPlanMergedPanel");
  removeSubscriptionStatusCard(subscriptionPanel);
  movePlanUsageCards(subscriptionPanel, planPanel);
  movePlanBadge(subscriptionPanel, planPanel);
  moveUsageMessage(subscriptionPanel, planPanel);
  hideMergedPlanPanel(planPanel);
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

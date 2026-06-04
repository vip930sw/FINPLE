/* Step 111-10 - MY PAGE Billing Status display patch
   - 구독/결제 상태 패널의 사용자 화면 문구와 노출 항목을 정리합니다.
   - MutationObserver 없이 제한된 이벤트와 초기 타이머로만 보정합니다.
*/

let billingStatusDisplayTimer = null;

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function setText(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) node.textContent = nextValue;
}

function hideElement(node, className) {
  if (!node) return;
  if (className) node.classList.add(className);
  node.setAttribute("hidden", "true");
}

function applyBillingStatusDisplayPatch() {
  if (!isMyPagePath()) return;

  const panel = document.querySelector("[data-subscription-status-panel]");
  if (!panel) return;

  const title = panel.querySelector("h2");
  const description = title?.nextElementSibling;
  if (description?.tagName === "P") {
    setText(description, "현재 이용 중인 플랜, 구독 상태, 다음 결제일과 이용 종료 예정일을 한눈에 확인합니다.");
  }

  hideElement(panel.querySelector("[data-subscription-badge]"), "subscriptionStatusBadgeHidden");
  hideElement(panel.querySelector("[data-subscription-refresh]"), "subscriptionStatusRefreshHidden");
  hideElement(panel.querySelector("[data-subscription-message]"), "subscriptionStatusMessageHidden");

  panel.querySelectorAll(".subscriptionStatusGrid em").forEach((node) => {
    node.classList.add("subscriptionStatusGridNoteHidden");
    node.setAttribute("hidden", "true");
  });

  const planCard = panel.querySelector("[data-subscription-plan]")?.closest("div");
  if (planCard) planCard.classList.add("subscriptionPlanHighlight");
}

function scheduleBillingStatusPatch(delay = 120) {
  window.clearTimeout(billingStatusDisplayTimer);
  billingStatusDisplayTimer = window.setTimeout(applyBillingStatusDisplayPatch, delay);
}

function bootBillingStatusDisplayPatch() {
  [150, 350, 800, 1400, 2400].forEach((delay) => window.setTimeout(applyBillingStatusDisplayPatch, delay));

  window.addEventListener("popstate", () => scheduleBillingStatusPatch(120));
  window.addEventListener("finple-auth-updated", () => scheduleBillingStatusPatch(160));
  window.addEventListener("finple-plan-updated", () => scheduleBillingStatusPatch(160));
  window.addEventListener("finple-local-storage-updated", () => scheduleBillingStatusPatch(160));
  window.addEventListener("storage", () => scheduleBillingStatusPatch(160));
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootBillingStatusDisplayPatch, { once: true });
  } else {
    bootBillingStatusDisplayPatch();
  }
}

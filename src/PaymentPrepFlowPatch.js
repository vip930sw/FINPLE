/* =========================================================
   Step 112 - Pricing -> Login -> One-way Personal billing setup
   - Personal 선택 후 결제 준비 배너에서 멈추지 않고 자동결제 등록 화면으로 이어집니다.
   - 로그인 전 사용자는 로그인 후 /payment-method/setup으로 복귀합니다.
   - document-wide MutationObserver를 사용하지 않습니다.
========================================================= */

import {
  clearPendingCheckoutPlan,
  getPendingCheckoutPlan,
  setPendingCheckoutPlan,
} from "./components/paymentFlowService";
import { getStoredFinpleAuthUser } from "./components/portfolio/services/serverPortfolioService";

const BILLING_QUERY = "finpleBillingReady";
const PERSONAL_BILLING_SETUP_PATH = "/payment-method/setup?plan=personal&source=pricing";

let resumeTimer = null;

function isLoggedIn() {
  return Boolean(getStoredFinpleAuthUser()?.id);
}

function normalizePath(pathname) {
  return String(pathname || "/").replace(/\/+$/, "") || "/";
}

function navigateTo(path) {
  if (`${window.location.pathname}${window.location.search}` === path) return;
  window.location.href = path;
}

function isPersonalButton(button) {
  const text = button?.textContent || "";
  const cardText = button?.closest?.("article, .priceCard, .accountPlanCard")?.textContent || "";
  return /Personal|월 9,900원|Personal 선택|선택하기|구독|결제/.test(`${cardText} ${text}`);
}

function isPricingAction(button) {
  return Boolean(
    button?.closest?.("#pricing") ||
    button?.closest?.(".accountPlanCard") ||
    button?.closest?.(".priceCard")
  );
}

function stopCheckoutShellInterception(event) {
  event.preventDefault();
  event.stopImmediatePropagation?.();
  event.stopPropagation();
}

function handlePricingClick(event) {
  const button = event.target?.closest?.("button");
  if (!button || !isPersonalButton(button) || !isPricingAction(button)) return;

  stopCheckoutShellInterception(event);
  setPendingCheckoutPlan("personal");

  if (!isLoggedIn()) {
    navigateTo("/login");
    return;
  }

  navigateTo(PERSONAL_BILLING_SETUP_PATH);
}

function shouldResumePendingPersonalBilling() {
  const pending = getPendingCheckoutPlan();
  if (pending?.planKey !== "personal" || !isLoggedIn()) return false;

  const path = normalizePath(window.location.pathname);
  if (path === "/payment-method/setup" || path === "/payment-method/success" || path === "/payment-method/fail") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  if (path === "/login" || path === "/signup") return true;
  if (path === "/pricing" && (params.has(BILLING_QUERY) || pending?.planKey === "personal")) return true;

  return false;
}

function resumePendingPersonalBilling() {
  if (shouldResumePendingPersonalBilling()) {
    navigateTo(PERSONAL_BILLING_SETUP_PATH);
  }
}

function clearStaleCheckoutOnManualPages() {
  const path = normalizePath(window.location.pathname);
  const params = new URLSearchParams(window.location.search);

  if (path === "/mypage" || (path === "/pricing" && !params.has(BILLING_QUERY))) {
    clearPendingCheckoutPlan();
  }
}

function scheduleResume(delay = 120) {
  window.clearTimeout(resumeTimer);
  resumeTimer = window.setTimeout(resumePendingPersonalBilling, delay);
}

function bootPaymentPrepFlow() {
  clearStaleCheckoutOnManualPages();
  document.addEventListener("click", handlePricingClick, true);

  [120, 400, 900, 1600].forEach((delay) => window.setTimeout(resumePendingPersonalBilling, delay));
  window.addEventListener("popstate", () => scheduleResume(120));
  window.addEventListener("finple-auth-updated", () => scheduleResume(120));
  window.addEventListener("finple-local-storage-updated", () => scheduleResume(120));
  window.addEventListener("storage", () => scheduleResume(120));
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPaymentPrepFlow, { once: true });
  } else {
    bootPaymentPrepFlow();
  }
}

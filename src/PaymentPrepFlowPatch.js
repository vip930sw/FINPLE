/* =========================================================
   Step 134 - Pricing -> Login -> Payment Prep Flow
   - PG 실제 연동 전 결제 준비 흐름을 보강합니다.
   - React 구조 변경을 최소화하기 위해 베타 패치 레이어로 적용합니다.
========================================================= */

import { getPendingCheckoutPlan, setPendingCheckoutPlan } from "./components/paymentFlowService";
import { getStoredFinpleAuthUser } from "./components/portfolio/services/serverPortfolioService";

const BILLING_QUERY = "finpleBillingReady";

function isLoggedIn() {
  return Boolean(getStoredFinpleAuthUser()?.id);
}

function navigateTo(path) {
  window.location.href = path;
}

function isPersonalButton(button) {
  const text = button?.textContent || "";
  const cardText = button?.closest?.("article, .priceCard, .accountPlanCard")?.textContent || "";
  return /Personal|월 9,900원|Personal 선택|선택하기/.test(`${cardText} ${text}`);
}

function handlePricingClick(event) {
  const button = event.target?.closest?.("button");
  if (!button || !isPersonalButton(button)) return;

  const onPricingArea = Boolean(
    button.closest("#pricing") ||
    button.closest(".accountPlanCard") ||
    button.closest(".priceCard")
  );

  if (!onPricingArea) return;

  setPendingCheckoutPlan("personal");

  if (!isLoggedIn()) {
    event.preventDefault();
    event.stopPropagation();
    navigateTo("/login");
    return;
  }

  window.setTimeout(insertBillingPrepBanner, 80);
}

function shouldShowBillingPrep() {
  const pending = getPendingCheckoutPlan();
  if (pending?.planKey === "personal" && isLoggedIn()) return true;
  return new URLSearchParams(window.location.search).has(BILLING_QUERY);
}

function insertBillingPrepBanner() {
  if (!shouldShowBillingPrep()) return;
  if (document.querySelector(".billingPrepBanner")) return;

  const pricingPanel = document.querySelector(".pricingStatusPanel") || document.querySelector(".priceGrid") || document.querySelector(".accountPlanGrid");
  if (!pricingPanel?.parentNode) return;

  const banner = document.createElement("section");
  banner.className = "billingPrepBanner";
  banner.setAttribute("role", "note");
  banner.innerHTML = `
    <div>
      <p class="billingPrepEyebrow">Payment Prep</p>
      <h2>Personal 결제 준비 중입니다.</h2>
      <p>현재 베타 기간에는 결제가 발생하지 않습니다. 실제 결제 전에는 사업자 정보, 환불·해지 정책, 고객센터, 투자 유의문구를 먼저 안내한 뒤 PG 테스트 모드부터 연결합니다.</p>
      <ul>
        <li>예상 상품: FINPLE Personal</li>
        <li>예상 금액: 월 9,900원</li>
        <li>정산 계좌: 사업자 계좌 등록 예정</li>
        <li>카드정보: FINPLE 서버에 직접 저장하지 않음</li>
      </ul>
    </div>
    <div class="billingPrepActions">
      <button type="button" class="primaryButton billingPrepPrimary">베타 무료로 계속 사용</button>
      <button type="button" class="secondaryButton billingPrepSupport">결제 문의</button>
    </div>
  `;

  pricingPanel.parentNode.insertBefore(banner, pricingPanel);

  banner.querySelector(".billingPrepPrimary")?.addEventListener("click", () => navigateTo("/simulator"));
  banner.querySelector(".billingPrepSupport")?.addEventListener("click", () => navigateTo("/support"));
}

function redirectPendingCheckoutAfterLogin() {
  const pending = getPendingCheckoutPlan();
  if (!pending?.planKey || !isLoggedIn()) return;

  const path = window.location.pathname;
  if (path === "/mypage" || path === "/login" || path === "/signup") {
    navigateTo(`/pricing?${BILLING_QUERY}=personal`);
  }
}

function bootPaymentPrepFlow() {
  document.addEventListener("click", handlePricingClick, true);

  const observer = new MutationObserver(() => {
    insertBillingPrepBanner();
    redirectPendingCheckoutAfterLogin();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => {
    insertBillingPrepBanner();
    redirectPendingCheckoutAfterLogin();
  }, 200);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPaymentPrepFlow, { once: true });
  } else {
    bootPaymentPrepFlow();
  }
}

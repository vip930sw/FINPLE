/* =========================================================
   Step 134 - Pricing -> Login -> Payment Prep Flow
   Step 136 - Refund / Cancellation Policy Notice
   Step 137 - Scope payment prep to /pricing only
   - PG 실제 연동 전 결제 준비 흐름과 환불·해지 정책 초안을 안내합니다.
   - React 구조 변경을 최소화하기 위해 베타 패치 레이어로 적용합니다.
========================================================= */

import { getPendingCheckoutPlan, setPendingCheckoutPlan } from "./components/paymentFlowService";
import { getStoredFinpleAuthUser } from "./components/portfolio/services/serverPortfolioService";

const BILLING_QUERY = "finpleBillingReady";

function isLoggedIn() {
  return Boolean(getStoredFinpleAuthUser()?.id);
}

function isPricingPage() {
  return window.location.pathname === "/pricing";
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

  const isPricingAction = Boolean(
    button.closest("#pricing") ||
    button.closest(".accountPlanCard") ||
    button.closest(".priceCard")
  );

  if (!isPricingAction) return;

  setPendingCheckoutPlan("personal");

  if (!isLoggedIn()) {
    event.preventDefault();
    event.stopPropagation();
    navigateTo("/login");
    return;
  }

  if (!isPricingPage()) {
    event.preventDefault();
    event.stopPropagation();
    navigateTo(`/pricing?${BILLING_QUERY}=personal`);
    return;
  }

  window.setTimeout(insertBillingPrepBanner, 80);
}

function shouldShowBillingPrep() {
  if (!isPricingPage()) return false;

  const pending = getPendingCheckoutPlan();
  if (pending?.planKey === "personal" && isLoggedIn()) return true;
  return new URLSearchParams(window.location.search).has(BILLING_QUERY);
}

function insertBillingPrepBanner() {
  if (!shouldShowBillingPrep()) return;
  if (document.querySelector(".billingPrepBanner")) return;

  const pricingPanel = document.querySelector(".pricingStatusPanel");
  if (!pricingPanel?.parentNode) return;

  const banner = document.createElement("section");
  banner.className = "billingPrepBanner billingPrepBanner--policy";
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
      <div class="billingPolicyBox">
        <strong>환불·해지 정책 초안</strong>
        <p>월 구독형 디지털 서비스 특성상 구독 해지 시 즉시 환불 또는 일할 환불을 기본으로 제공하지 않습니다. 해지 후에도 이미 결제된 이용기간 종료일까지 Personal 기능을 계속 사용할 수 있고, 다음 결제일부터 자동 갱신이 중단되는 방향으로 준비합니다.</p>
        <p>중복 결제, 명백한 오결제, FINPLE 귀책으로 핵심 유료 기능을 장시간 제공하지 못한 경우 등은 이용 이력과 결제 내역 확인 후 별도 검토합니다.</p>
      </div>
    </div>
    <div class="billingPrepActions">
      <button type="button" class="primaryButton billingPrepPrimary">베타 무료로 계속 사용</button>
      <button type="button" class="secondaryButton billingPrepTerms">약관 확인</button>
      <button type="button" class="secondaryButton billingPrepSupport">결제 문의</button>
    </div>
  `;

  pricingPanel.parentNode.insertBefore(banner, pricingPanel);

  banner.querySelector(".billingPrepPrimary")?.addEventListener("click", () => navigateTo("/simulator"));
  banner.querySelector(".billingPrepTerms")?.addEventListener("click", () => navigateTo("/terms"));
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
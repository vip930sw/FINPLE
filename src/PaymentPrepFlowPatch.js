/* =========================================================
   Step 134 - Pricing -> Login -> Payment Prep Flow
   Step 136 - Refund / Cancellation Policy Notice
   Step 137 - Scope payment prep to /pricing only
   Step 142 - Prevent stale checkout state from hijacking MY PAGE
   Step 144 - Connect Pricing Personal to prepare API
   Step 144B - Prevent MutationObserver render loop on /pricing
   Step 151 - Expose latest prepare payload for Toss checkout
   - PG 실제 연동 전 결제 준비 흐름과 환불·해지 정책 초안을 안내합니다.
   - React 구조 변경을 최소화하기 위해 베타 패치 레이어로 적용합니다.
========================================================= */

import { preparePersonalCheckout } from "./components/paymentPrepareClient";
import {
  clearPendingCheckoutPlan,
  getPendingCheckoutPlan,
  setPendingCheckoutPlan,
} from "./components/paymentFlowService";
import { getStoredFinpleAuthUser } from "./components/portfolio/services/serverPortfolioService";

const BILLING_QUERY = "finpleBillingReady";

let lastPreparePayload = null;
let isPreparingCheckout = false;
let prepareErrorMessage = "";
let hasAutoPrepareRequested = false;

function publishPreparePayload() {
  if (typeof window === "undefined") return;
  window.__finpleLatestPreparePayload = lastPreparePayload;
  window.dispatchEvent(new CustomEvent("finple:payment-prepare-updated", {
    detail: { payload: lastPreparePayload, error: prepareErrorMessage, loading: isPreparingCheckout },
  }));
}

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

function setTextIfChanged(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) {
    node.textContent = nextValue;
  }
}

function formatWon(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "월 9,900원";
  return `${number.toLocaleString("ko-KR")}원`;
}

async function requestPrepareAndRender() {
  if (isPreparingCheckout) return;

  isPreparingCheckout = true;
  prepareErrorMessage = "";
  insertBillingPrepBanner();
  updateBillingPrepBanner();
  publishPreparePayload();

  try {
    lastPreparePayload = await preparePersonalCheckout();
    prepareErrorMessage = "";
  } catch (error) {
    lastPreparePayload = null;
    prepareErrorMessage = error?.message || "결제 준비 요청에 실패했습니다.";
  } finally {
    isPreparingCheckout = false;
    updateBillingPrepBanner();
    publishPreparePayload();
  }
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

  event.preventDefault();
  event.stopPropagation();
  window.setTimeout(requestPrepareAndRender, 80);
}

function shouldShowBillingPrep() {
  if (!isPricingPage()) return false;

  const pending = getPendingCheckoutPlan();
  if (pending?.planKey === "personal" && isLoggedIn()) return true;
  return new URLSearchParams(window.location.search).has(BILLING_QUERY);
}

function getStatusText() {
  if (isPreparingCheckout) return "서버 결제 준비 정보를 확인하고 있습니다.";
  if (prepareErrorMessage) return prepareErrorMessage;
  if (lastPreparePayload?.checkoutAvailable) return "Toss 테스트 결제창을 열 준비가 완료되었습니다.";
  if (lastPreparePayload?.orderId) return lastPreparePayload.message || "현재는 결제 준비 단계입니다.";
  return "Personal을 선택하면 서버에서 결제 준비 정보를 생성합니다.";
}

function updateBillingPrepBanner() {
  const banner = document.querySelector(".billingPrepBanner");
  if (!banner) return;

  const orderIdNode = banner.querySelector("[data-billing-order-id]");
  const amountNode = banner.querySelector("[data-billing-amount]");
  const statusNode = banner.querySelector("[data-billing-status]");
  const testLink = banner.querySelector("[data-billing-test-link]");

  setTextIfChanged(
    orderIdNode,
    lastPreparePayload?.orderId || (isPreparingCheckout ? "생성 중" : "Personal 선택 후 생성")
  );
  setTextIfChanged(amountNode, formatWon(lastPreparePayload?.amount || 9900));

  if (statusNode) {
    setTextIfChanged(statusNode, getStatusText());
    statusNode.classList.toggle("billingPrepareStatus--error", Boolean(prepareErrorMessage));
  }

  if (testLink) {
    const successUrl = lastPreparePayload?.successUrl || "/billing/success?orderId=prepare_test&amount=9900";
    const nextTarget = successUrl.replace(/^https?:\/\/[^/]+/i, "");
    if (testLink.getAttribute("data-billing-nav") !== nextTarget) {
      testLink.setAttribute("data-billing-nav", nextTarget);
    }
    if (testLink.disabled !== isPreparingCheckout) {
      testLink.disabled = isPreparingCheckout;
    }
  }
}

function insertBillingPrepBanner() {
  if (!shouldShowBillingPrep()) return;
  if (document.querySelector(".billingPrepBanner")) {
    return;
  }

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
        <li>예상 금액: <span data-billing-amount>월 9,900원</span></li>
        <li>주문번호: <span data-billing-order-id>Personal 선택 후 생성</span></li>
        <li>카드정보: FINPLE 서버에 직접 저장하지 않음</li>
      </ul>
      <div class="billingPrepareStatus" data-billing-status>Personal을 선택하면 서버에서 결제 준비 정보를 생성합니다.</div>
      <div class="billingPolicyBox">
        <strong>환불·해지 정책 초안</strong>
        <p>월 구독형 디지털 서비스 특성상 구독 해지 시 즉시 환불 또는 일할 환불을 기본으로 제공하지 않습니다. 해지 후에도 이미 결제된 이용기간 종료일까지 Personal 기능을 계속 사용할 수 있고, 다음 결제일부터 자동 갱신이 중단되는 방향으로 준비합니다.</p>
        <p>중복 결제, 명백한 오결제, FINPLE 귀책으로 핵심 유료 기능을 장시간 제공하지 못한 경우 등은 이용 이력과 결제 내역 확인 후 별도 검토합니다.</p>
      </div>
    </div>
    <div class="billingPrepActions">
      <button type="button" class="primaryButton billingPrepPrimary">베타 무료로 계속 사용</button>
      <button type="button" class="secondaryButton billingPrepTest" data-billing-test-link data-billing-nav="/billing/success?orderId=prepare_test&amount=9900">성공 화면 테스트</button>
      <button type="button" class="secondaryButton billingPrepTerms">약관 확인</button>
      <button type="button" class="secondaryButton billingPrepSupport">결제 문의</button>
    </div>
  `;

  pricingPanel.parentNode.insertBefore(banner, pricingPanel);

  banner.querySelector(".billingPrepPrimary")?.addEventListener("click", () => {
    clearPendingCheckoutPlan();
    navigateTo("/simulator");
  });
  banner.querySelector(".billingPrepTest")?.addEventListener("click", (event) => {
    const target = event.currentTarget?.getAttribute("data-billing-nav") || "/billing/success";
    navigateTo(target);
  });
  banner.querySelector(".billingPrepTerms")?.addEventListener("click", () => navigateTo("/terms"));
  banner.querySelector(".billingPrepSupport")?.addEventListener("click", () => navigateTo("/support"));

  updateBillingPrepBanner();
}

function redirectPendingCheckoutAfterLogin() {
  const pending = getPendingCheckoutPlan();
  if (!pending?.planKey || !isLoggedIn()) return;

  const path = window.location.pathname;

  if (path === "/pricing" || path === "/mypage") {
    return;
  }

  if (path === "/login" || path === "/signup") {
    navigateTo(`/pricing?${BILLING_QUERY}=personal`);
  }
}

function clearStaleCheckoutOnManualPages() {
  const path = window.location.pathname;
  const hasBillingQuery = new URLSearchParams(window.location.search).has(BILLING_QUERY);

  if (path === "/mypage" || (path === "/pricing" && !hasBillingQuery)) {
    clearPendingCheckoutPlan();
    lastPreparePayload = null;
    prepareErrorMessage = "";
    hasAutoPrepareRequested = false;
    publishPreparePayload();
  }
}

function bootPaymentPrepFlow() {
  clearStaleCheckoutOnManualPages();
  document.addEventListener("click", handlePricingClick, true);

  const observer = new MutationObserver(() => {
    insertBillingPrepBanner();
    redirectPendingCheckoutAfterLogin();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => {
    insertBillingPrepBanner();
    redirectPendingCheckoutAfterLogin();
    if (shouldShowBillingPrep() && isLoggedIn() && !hasAutoPrepareRequested) {
      hasAutoPrepareRequested = true;
      requestPrepareAndRender();
    }
  }, 200);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPaymentPrepFlow, { once: true });
  } else {
    bootPaymentPrepFlow();
  }
}
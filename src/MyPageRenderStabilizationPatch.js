/* =========================================================
   Step 112-5A/B/E/F - MY PAGE render stabilization guard
   - /mypage 새로고침 시 기본 화면이 먼저 보였다가 패치 화면으로 바뀌는 깜빡임을 완화합니다.
   - SNS 로그인과 같은 구조의 텍스트 없는 로딩 스피너를 표시합니다.
   - 세부 패널 보정은 화면 표시 후 이어서 적용합니다.
========================================================= */

const MAX_WAIT_MS = 1400;
const MIN_WAIT_MS = 180;
const STYLE_ID = "finple-mypage-render-stabilization-style";
const LOADER_ID = "finple-mypage-loading-overlay";

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function installStabilizationStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html.finple-mypage-booting #root,
    body.finple-mypage-stabilizing #root {
      opacity: 0;
    }

    .finpleMyPageLoadingOverlay.loginSocialLoadingOverlay {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      pointer-events: none;
    }

    .finpleMyPageLoadingOverlay .finpleLoginSpinner {
      position: relative;
      width: 54px;
      height: 54px;
    }

    .finpleMyPageLoadingOverlay .finpleLoginSpinner span {
      position: absolute;
      left: 25px;
      top: 4px;
      width: 4px;
      height: 12px;
      border-radius: 999px;
      background: #0f172a;
      opacity: 0.16;
      transform-origin: 2px 23px;
      animation: finpleMyPageLoginSpinner 1s linear infinite;
    }

    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(1) { transform: rotate(0deg); animation-delay: -0.916s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(2) { transform: rotate(30deg); animation-delay: -0.833s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(3) { transform: rotate(60deg); animation-delay: -0.75s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(4) { transform: rotate(90deg); animation-delay: -0.666s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(5) { transform: rotate(120deg); animation-delay: -0.583s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(6) { transform: rotate(150deg); animation-delay: -0.5s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(7) { transform: rotate(180deg); animation-delay: -0.416s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(8) { transform: rotate(210deg); animation-delay: -0.333s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(9) { transform: rotate(240deg); animation-delay: -0.25s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(10) { transform: rotate(270deg); animation-delay: -0.166s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(11) { transform: rotate(300deg); animation-delay: -0.083s; }
    .finpleMyPageLoadingOverlay .finpleLoginSpinner span:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }

    body.finple-mypage-ready #root {
      opacity: 1;
      transition: opacity 120ms ease-out;
    }

    @keyframes finpleMyPageLoginSpinner {
      0% { opacity: 1; }
      100% { opacity: 0.16; }
    }
  `;
  document.head.appendChild(style);
}

function ensureLoadingOverlay() {
  if (!isMyPagePath()) return;
  if (document.getElementById(LOADER_ID)) return;

  const overlay = document.createElement("div");
  overlay.id = LOADER_ID;
  overlay.className = "loginSocialLoadingOverlay finpleMyPageLoadingOverlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="finpleLoginSpinner">
      <span></span><span></span><span></span><span></span>
      <span></span><span></span><span></span><span></span>
      <span></span><span></span><span></span><span></span>
    </div>
  `;
  document.body.appendChild(overlay);
}

function removeLoadingOverlay() {
  document.getElementById(LOADER_ID)?.remove();
}

function getSidebarText() {
  return document.querySelector(".myPageSidebarNav")?.textContent || "";
}

function hasOldSidebarLabels(sidebarText) {
  return ["계정 상태", "구독 / 결제", "요금제 상태", "결제수단", "서버 저장"].some((label) => sidebarText.includes(label));
}

function isShellReady() {
  const sidebarText = getSidebarText();
  const hasLayout = Boolean(document.querySelector(".myPageDashboardLayout") && document.querySelector(".myPageSidebarNav"));
  const hasFinalMenuNames = sidebarText.includes("내 계정")
    && sidebarText.includes("내 구독/플랜")
    && sidebarText.includes("내 결제수단")
    && sidebarText.includes("내 결제내역")
    && sidebarText.includes("내 문의내역")
    && sidebarText.includes("내 저장내역");
  const hasNoOldMenuNames = !hasOldSidebarLabels(sidebarText);
  const hasAccountPanel = Boolean(document.querySelector('.accountStatusPanel[data-mypage-panel-key="account"]'));

  return hasLayout && hasFinalMenuNames && hasNoOldMenuNames && hasAccountPanel;
}

function isFinalMyPageReady() {
  if (!isMyPagePath()) return true;

  const hasPaymentHistoryPanel = Boolean(document.querySelector("[data-payment-history-panel]"));
  const hasInquiryPagination = Boolean(document.querySelector('[data-history-pagination-control="my-inquiries"]'));
  const hasPaymentPagination = Boolean(document.querySelector('[data-history-pagination-control="payment-history"]'));
  const hasBillingMerge = Boolean(document.querySelector(".billingPlanMergedPanel"));
  const hasBillingUsageMessage = Boolean(document.querySelector("[data-billing-usage-message]"));
  const hasInlineInquiryActions = Boolean(document.querySelector('[data-history-primary-actions="my-inquiries"] [data-my-inquiries-support]'));

  return isShellReady()
    && hasPaymentHistoryPanel
    && hasInquiryPagination
    && hasPaymentPagination
    && hasBillingMerge
    && hasBillingUsageMessage
    && hasInlineInquiryActions;
}

function revealMyPage() {
  removeLoadingOverlay();
  document.documentElement.classList.remove("finple-mypage-booting");
  document.body.classList.remove("finple-mypage-stabilizing");
  document.body.classList.add("finple-mypage-ready");
  window.setTimeout(() => {
    document.body.classList.remove("finple-mypage-ready");
  }, 360);
}

function waitForFinalLayout() {
  const startedAt = Date.now();
  let revealed = false;

  function tryReveal() {
    if (revealed) return;

    const elapsed = Date.now() - startedAt;
    const shellReady = elapsed >= MIN_WAIT_MS && isShellReady();
    const fullyReady = elapsed >= MIN_WAIT_MS && isFinalMyPageReady();
    const timedOut = elapsed >= MAX_WAIT_MS;

    if (shellReady || fullyReady || timedOut) {
      revealed = true;
      revealMyPage();
      return;
    }

    window.requestAnimationFrame(tryReveal);
  }

  window.requestAnimationFrame(tryReveal);
}

function bootMyPageRenderStabilization() {
  if (!isMyPagePath()) {
    document.documentElement.classList.remove("finple-mypage-booting");
    removeLoadingOverlay();
    return;
  }

  installStabilizationStyle();
  document.documentElement.classList.add("finple-mypage-booting");
  document.body.classList.add("finple-mypage-stabilizing");
  document.body.classList.remove("finple-mypage-ready");
  ensureLoadingOverlay();
  waitForFinalLayout();
}

if (typeof window !== "undefined") {
  installStabilizationStyle();

  if (isMyPagePath()) {
    document.documentElement.classList.add("finple-mypage-booting");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyPageRenderStabilization, { once: true });
  } else {
    bootMyPageRenderStabilization();
  }
}

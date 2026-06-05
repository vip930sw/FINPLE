/* =========================================================
   Step 112-5A/B/E/F - MY PAGE render stabilization guard
   - /mypage 새로고침 시 기본 화면이 먼저 보였다가 패치 화면으로 바뀌는 깜빡임을 완화합니다.
   - 빈 화면 대신 텍스트 없는 로딩 스피너를 표시합니다.
   - 세부 패널 보정은 화면 표시 후 이어서 적용합니다.
========================================================= */

const MAX_WAIT_MS = 1400;
const MIN_WAIT_MS = 180;
const STYLE_ID = "finple-mypage-render-stabilization-style";

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

    html.finple-mypage-booting body::before,
    body.finple-mypage-stabilizing::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      background: #f8fafc;
      pointer-events: none;
    }

    html.finple-mypage-booting body::after,
    body.finple-mypage-stabilizing::after {
      content: "";
      position: fixed;
      left: 50%;
      top: 50%;
      width: 36px;
      height: 36px;
      margin-left: -18px;
      margin-top: -18px;
      z-index: 2147483001;
      border: 3px solid rgba(15, 23, 42, 0.14);
      border-top-color: #0f172a;
      border-radius: 999px;
      animation: finpleMyPageSpin 0.82s linear infinite;
      pointer-events: none;
    }

    body.finple-mypage-ready #root {
      opacity: 1;
      transition: opacity 120ms ease-out;
    }

    @keyframes finpleMyPageSpin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
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
    return;
  }

  installStabilizationStyle();
  document.documentElement.classList.add("finple-mypage-booting");
  document.body.classList.add("finple-mypage-stabilizing");
  document.body.classList.remove("finple-mypage-ready");
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

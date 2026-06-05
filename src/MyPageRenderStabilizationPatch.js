/* =========================================================
   Step 112-5A/B/E/F - MY PAGE render stabilization guard
   - /mypage 새로고침 시 기본 화면이 먼저 보였다가 패치 화면으로 바뀌는 깜빡임을 완화합니다.
   - 로그인 → MY PAGE 같은 SPA 이동에서도 로딩 오버레이가 즉시 뜨도록 보정합니다.
   - 세부 패널 보정은 화면 표시 후 이어서 적용합니다.
========================================================= */

const MAX_WAIT_MS = 1200;
const MIN_WAIT_MS = 120;
const STYLE_ID = "finple-mypage-render-stabilization-style";
const LOADER_ID = "finple-mypage-loading-overlay";

let activeBootId = 0;
let lastPathname = typeof window !== "undefined" ? window.location.pathname : "";
let isHistoryPatched = false;

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
      width: 44px;
      height: 44px;
      animation: finpleMyPageSpinnerRotate 0.82s linear infinite;
    }

    .finpleMyPageLoadingOverlay .finpleLoginSpinner::before,
    .finpleMyPageLoadingOverlay .finpleLoginSpinner::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 999px;
    }

    .finpleMyPageLoadingOverlay .finpleLoginSpinner::before {
      border: 4px solid rgba(15, 23, 42, 0.12);
    }

    .finpleMyPageLoadingOverlay .finpleLoginSpinner::after {
      border: 4px solid transparent;
      border-top-color: #0f172a;
      border-right-color: #0f172a;
    }

    .finpleMyPageLoadingOverlay .finpleLoginSpinner span {
      display: none !important;
    }

    body.finple-mypage-ready #root {
      opacity: 1;
      transition: opacity 100ms ease-out;
    }

    @keyframes finpleMyPageSpinnerRotate {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function ensureLoadingOverlay() {
  if (!isMyPagePath() || !document.body) return;
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
  document.body?.classList.remove("finple-mypage-stabilizing");
  document.body?.classList.add("finple-mypage-ready");
  window.setTimeout(() => {
    document.body?.classList.remove("finple-mypage-ready");
  }, 280);
}

function waitForFinalLayout(bootId) {
  const startedAt = Date.now();
  let revealed = false;

  function tryReveal() {
    if (revealed || bootId !== activeBootId) return;

    ensureLoadingOverlay();

    const elapsed = Date.now() - startedAt;
    const shellReady = elapsed >= MIN_WAIT_MS && isShellReady();
    const fullyReady = elapsed >= MIN_WAIT_MS && isFinalMyPageReady();
    const timedOut = elapsed >= MAX_WAIT_MS;

    if (shellReady || fullyReady || timedOut || !isMyPagePath()) {
      revealed = true;
      revealMyPage();
      return;
    }

    window.requestAnimationFrame(tryReveal);
  }

  window.requestAnimationFrame(tryReveal);
}

function bootMyPageRenderStabilization() {
  activeBootId += 1;
  const bootId = activeBootId;

  if (!isMyPagePath()) {
    document.documentElement.classList.remove("finple-mypage-booting");
    document.body?.classList.remove("finple-mypage-stabilizing");
    removeLoadingOverlay();
    return;
  }

  installStabilizationStyle();
  document.documentElement.classList.add("finple-mypage-booting");
  document.body?.classList.add("finple-mypage-stabilizing");
  document.body?.classList.remove("finple-mypage-ready");
  ensureLoadingOverlay();
  waitForFinalLayout(bootId);
}

function handleRouteMaybeChanged() {
  const currentPathname = window.location.pathname;
  if (currentPathname === lastPathname) return;
  lastPathname = currentPathname;
  window.setTimeout(bootMyPageRenderStabilization, 0);
}

function patchHistoryNavigation() {
  if (isHistoryPatched) return;
  isHistoryPatched = true;

  ["pushState", "replaceState"].forEach((methodName) => {
    const original = window.history[methodName];
    window.history[methodName] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      window.setTimeout(handleRouteMaybeChanged, 0);
      return result;
    };
  });

  window.addEventListener("popstate", () => window.setTimeout(handleRouteMaybeChanged, 0));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(bootMyPageRenderStabilization, 0));
  window.addEventListener("finple-local-storage-updated", () => window.setTimeout(bootMyPageRenderStabilization, 0));
}

if (typeof window !== "undefined") {
  installStabilizationStyle();
  patchHistoryNavigation();

  if (isMyPagePath()) {
    document.documentElement.classList.add("finple-mypage-booting");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyPageRenderStabilization, { once: true });
  } else {
    bootMyPageRenderStabilization();
  }
}

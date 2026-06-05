/* =========================================================
   Step 112-5A - MY PAGE render stabilization guard
   - /mypage 새로고침 시 기본 화면이 먼저 보였다가 패치 화면으로 바뀌는 깜빡임을 완화합니다.
   - 최종 MY PAGE 메뉴/패널 구조가 준비되면 화면을 표시합니다.
   - 근본 통합 전 단기 안정화용 가드입니다.
========================================================= */

const MAX_WAIT_MS = 2200;
const MIN_WAIT_MS = 220;
const STYLE_ID = "finple-mypage-render-stabilization-style";

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function installStabilizationStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    body.finple-mypage-stabilizing #root {
      opacity: 0;
    }

    body.finple-mypage-ready #root {
      opacity: 1;
      transition: opacity 140ms ease-out;
    }
  `;
  document.head.appendChild(style);
}

function getSidebarText() {
  return document.querySelector(".myPageSidebarNav")?.textContent || "";
}

function isFinalMyPageReady() {
  if (!isMyPagePath()) return true;

  const sidebarText = getSidebarText();
  const hasLayout = Boolean(document.querySelector(".myPageDashboardLayout") && document.querySelector(".myPageSidebarNav"));
  const hasFinalMenuNames = sidebarText.includes("내 구독/플랜") && sidebarText.includes("내 저장내역");
  const hasPaymentHistoryPanel = Boolean(document.querySelector("[data-payment-history-panel]"));
  const hasInquiryPagination = Boolean(document.querySelector('[data-history-pagination-control="my-inquiries"]'));
  const hasBillingMerge = Boolean(document.querySelector(".billingPlanMergedPanel"));

  return hasLayout && hasFinalMenuNames && hasPaymentHistoryPanel && hasInquiryPagination && hasBillingMerge;
}

function revealMyPage() {
  document.body.classList.remove("finple-mypage-stabilizing");
  document.body.classList.add("finple-mypage-ready");
  window.setTimeout(() => {
    document.body.classList.remove("finple-mypage-ready");
  }, 420);
}

function waitForFinalLayout() {
  const startedAt = Date.now();
  let revealed = false;

  function tryReveal() {
    if (revealed) return;

    const elapsed = Date.now() - startedAt;
    const ready = elapsed >= MIN_WAIT_MS && isFinalMyPageReady();
    const timedOut = elapsed >= MAX_WAIT_MS;

    if (ready || timedOut) {
      revealed = true;
      revealMyPage();
      return;
    }

    window.requestAnimationFrame(tryReveal);
  }

  window.requestAnimationFrame(tryReveal);
}

function bootMyPageRenderStabilization() {
  if (!isMyPagePath()) return;

  installStabilizationStyle();
  document.body.classList.add("finple-mypage-stabilizing");
  document.body.classList.remove("finple-mypage-ready");
  waitForFinalLayout();
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    installStabilizationStyle();
    if (isMyPagePath()) document.documentElement.classList.add("finple-mypage-booting");
    document.addEventListener("DOMContentLoaded", bootMyPageRenderStabilization, { once: true });
  } else {
    bootMyPageRenderStabilization();
  }
}

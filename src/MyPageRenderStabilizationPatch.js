/* =========================================================
   Step 112-5A/B/E/F - MY PAGE render stabilization guard
   - /mypage 새로고침 시 기본 화면이 먼저 보였다가 패치 화면으로 바뀌는 깜빡임을 완화합니다.
   - 빈 화면을 만들지 않고, 화면 위에 로딩 오버레이만 표시합니다.
   - RightBrain 로딩 UX 참고 방향: 명확한 상태 피드백 + 단순하고 안정적인 시각 신호.
========================================================= */

const MAX_WAIT_MS = 900;
const MIN_WAIT_MS = 80;
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
    body.finple-mypage-stabilizing #root,
    body.finple-mypage-ready #root {
      opacity: 1 !important;
    }

    .finpleMyPageLoadingOverlay {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(248, 250, 252, 0.92);
      backdrop-filter: blur(2px);
      pointer-events: none;
    }

    .finpleMyPageLoaderCard {
      width: 82px;
      height: 82px;
      border-radius: 28px;
      background: #ffffff;
      border: 1px solid #dbeafe;
      box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .finpleMyPageLoaderRing {
      position: relative;
      width: 42px;
      height: 42px;
      border-radius: 999px;
      background: conic-gradient(from 0deg, #0f172a 0deg, #0f172a 82deg, rgba(15, 23, 42, 0.1) 82deg, rgba(15, 23, 42, 0.1) 360deg);
      animation: finpleMyPageLoaderSpin 0.78s linear infinite;
    }

    .finpleMyPageLoaderRing::before {
      content: "";
      position: absolute;
      inset: 5px;
      border-radius: 999px;
      background: #ffffff;
    }

    .finpleMyPageLoaderRing::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 0;
      width: 8px;
      height: 8px;
      margin-left: -4px;
      border-radius: 999px;
      background: #0f172a;
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
    }

    @keyframes finpleMyPageLoaderSpin {
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
  overlay.className = "finpleMyPageLoadingOverlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="finpleMyPageLoaderCard">
      <div class="finpleMyPageLoaderRing"></div>
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

function revealMyPage() {
  removeLoadingOverlay();
  document.documentElement.classList.remove("finple-mypage-booting");
  document.body?.classList.remove("finple-mypage-stabilizing");
  document.body?.classList.remove("finple-mypage-ready");
}

function waitForFinalLayout(bootId) {
  const startedAt = Date.now();
  let revealed = false;

  function tryReveal() {
    if (revealed || bootId !== activeBootId) return;

    ensureLoadingOverlay();

    const elapsed = Date.now() - startedAt;
    const shellReady = elapsed >= MIN_WAIT_MS && isShellReady();
    const timedOut = elapsed >= MAX_WAIT_MS;

    if (shellReady || timedOut || !isMyPagePath()) {
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

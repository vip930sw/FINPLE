/* =========================================================
   Step 112-5A/B/E/F - MY PAGE render stabilization guard
   - /mypage 새로고침 및 로그인 → MY PAGE 이동 시 빈 화면을 줄입니다.
   - 화면을 숨기지 않고, 즉시 표시 가능한 파란색 12-bar 로딩 스피너를 오버레이합니다.
   - 세부 패널 보정은 화면 표시 후 이어서 적용합니다.
========================================================= */

const MAX_WAIT_MS = 900;
const OAUTH_MAX_WAIT_MS = 3600;
const MIN_WAIT_MS = 80;
const STYLE_ID = "finple-mypage-render-stabilization-style";
const LOADER_ID = "finple-mypage-loading-overlay";
const FAILSAFE_WAIT_MS = 2600;
const OAUTH_RECOVERY_SESSION_KEY = "finple-oauth-mypage-recovery-signature";

let activeBootId = 0;
let lastPathname = typeof window !== "undefined" ? window.location.pathname : "";
let isHistoryPatched = false;
let forcedLoaderUntil = 0;

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function isOAuthMyPagePath() {
  if (!isMyPagePath()) return false;
  return new URLSearchParams(window.location.search || "").has("oauth");
}

function getOAuthRecoverySignature() {
  const params = new URLSearchParams(window.location.search || "");
  return `${window.location.pathname}?oauth=${params.get("oauth") || ""}&t=${params.get("t") || ""}`;
}

function hasRenderableMyPageContent() {
  return Boolean(
    document.querySelector(".myPageDashboardLayout .accountStatusPanel") ||
      document.querySelector('.accountStatusPanel[data-mypage-panel-key="account"]') ||
      document.querySelector(".accountPanelStack .accountStatusPanel")
  );
}

function recoverBlankOAuthMyPage(expectedHref) {
  if (!isOAuthMyPagePath()) return;
  if (expectedHref && window.location.href !== expectedHref) return;
  if (hasRenderableMyPageContent()) return;

  const signature = getOAuthRecoverySignature();

  try {
    if (window.sessionStorage.getItem(OAUTH_RECOVERY_SESSION_KEY) === signature) return;
    window.sessionStorage.setItem(OAUTH_RECOVERY_SESSION_KEY, signature);
  } catch (error) {
    // If sessionStorage is unavailable, still try a single best-effort recovery.
  }

  window.location.replace(window.location.href);
}

function scheduleOAuthMyPageBlankRecovery() {
  if (!isOAuthMyPagePath()) return;

  const expectedHref = window.location.href;
  [900, 1800, 3200].forEach((delay) => {
    window.setTimeout(() => recoverBlankOAuthMyPage(expectedHref), delay);
  });
}

function shouldKeepLoader() {
  return isMyPagePath() || Date.now() < forcedLoaderUntil;
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
      background: #f8fafc;
      pointer-events: none;
    }

    .finpleMyPageLoaderSpinner {
      position: relative;
      width: 148px;
      height: 148px;
      animation: finpleMyPageLoaderRotate 1.05s steps(12) infinite;
    }

    .finpleMyPageLoaderBar {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 14px;
      height: 40px;
      margin-left: -7px;
      margin-top: -72px;
      border-radius: 999px;
      background: #3b82f6;
      transform-origin: 7px 72px;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16);
    }

    .finpleMyPageLoaderBar:nth-child(1) { transform: rotate(0deg); opacity: 1; }
    .finpleMyPageLoaderBar:nth-child(2) { transform: rotate(30deg); opacity: 0.92; }
    .finpleMyPageLoaderBar:nth-child(3) { transform: rotate(60deg); opacity: 0.82; }
    .finpleMyPageLoaderBar:nth-child(4) { transform: rotate(90deg); opacity: 0.7; }
    .finpleMyPageLoaderBar:nth-child(5) { transform: rotate(120deg); opacity: 0.58; }
    .finpleMyPageLoaderBar:nth-child(6) { transform: rotate(150deg); opacity: 0.46; }
    .finpleMyPageLoaderBar:nth-child(7) { transform: rotate(180deg); opacity: 0.34; }
    .finpleMyPageLoaderBar:nth-child(8) { transform: rotate(210deg); opacity: 0.26; }
    .finpleMyPageLoaderBar:nth-child(9) { transform: rotate(240deg); opacity: 0.2; }
    .finpleMyPageLoaderBar:nth-child(10) { transform: rotate(270deg); opacity: 0.36; }
    .finpleMyPageLoaderBar:nth-child(11) { transform: rotate(300deg); opacity: 0.62; }
    .finpleMyPageLoaderBar:nth-child(12) { transform: rotate(330deg); opacity: 0.86; }

    @keyframes finpleMyPageLoaderRotate {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function ensureLoadingOverlay() {
  if (!shouldKeepLoader() || !document.body) return;
  if (document.getElementById(LOADER_ID)) return;

  const overlay = document.createElement("div");
  overlay.id = LOADER_ID;
  overlay.className = "finpleMyPageLoadingOverlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="finpleMyPageLoaderSpinner">
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
      <span class="finpleMyPageLoaderBar"></span>
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
  forcedLoaderUntil = 0;
  removeLoadingOverlay();
  document.documentElement.classList.remove("finple-mypage-booting");
  document.body?.classList.remove("finple-mypage-stabilizing");
  document.body?.classList.remove("finple-mypage-ready");
}

function revealMyPageFailsafe(bootId) {
  window.setTimeout(() => {
    if (bootId !== activeBootId) return;
    if (isOAuthMyPagePath() && !hasRenderableMyPageContent()) {
      recoverBlankOAuthMyPage(window.location.href);
      return;
    }
    revealMyPage();
  }, FAILSAFE_WAIT_MS);
}

function waitForFinalLayout(bootId) {
  const startedAt = Date.now();
  let revealed = false;

  function tryReveal() {
    if (revealed || bootId !== activeBootId) return;

    ensureLoadingOverlay();

    const elapsed = Date.now() - startedAt;
    const shellReady = elapsed >= MIN_WAIT_MS && isShellReady();
    const isOAuthRoute = isOAuthMyPagePath();
    const timedOut = elapsed >= (isOAuthRoute ? OAUTH_MAX_WAIT_MS : MAX_WAIT_MS);
    const forcedExpiredAwayFromMyPage = !isMyPagePath() && Date.now() >= forcedLoaderUntil;

    if (shellReady || (!isOAuthRoute && timedOut) || (isOAuthRoute && timedOut && hasRenderableMyPageContent()) || forcedExpiredAwayFromMyPage) {
      revealed = true;
      revealMyPage();
      return;
    }

    window.requestAnimationFrame(tryReveal);
  }

  window.requestAnimationFrame(tryReveal);
}

function showImmediateMyPageLoader(duration = 2200) {
  forcedLoaderUntil = Math.max(forcedLoaderUntil, Date.now() + duration);
  installStabilizationStyle();
  document.documentElement.classList.add("finple-mypage-booting");
  document.body?.classList.add("finple-mypage-stabilizing");
  ensureLoadingOverlay();
  window.setTimeout(() => {
    if (!isMyPagePath() && Date.now() >= forcedLoaderUntil) revealMyPage();
  }, duration + 60);
}

function bootMyPageRenderStabilization() {
  activeBootId += 1;
  const bootId = activeBootId;
  scheduleOAuthMyPageBlankRecovery();

  if (!shouldKeepLoader()) {
    document.documentElement.classList.remove("finple-mypage-booting");
    document.body?.classList.remove("finple-mypage-stabilizing");
    removeLoadingOverlay();
    return;
  }

  installStabilizationStyle();
  document.documentElement.classList.add("finple-mypage-booting");
  document.body?.classList.add("finple-mypage-stabilizing");
  ensureLoadingOverlay();
  revealMyPageFailsafe(bootId);
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
  window.addEventListener("finple-mypage-transition-start", () => {
    showImmediateMyPageLoader(2200);
    window.setTimeout(bootMyPageRenderStabilization, 0);
  });
}

if (typeof window !== "undefined") {
  installStabilizationStyle();
  patchHistoryNavigation();
  window.__finpleShowMyPageLoader = showImmediateMyPageLoader;

  if (isMyPagePath()) {
    document.documentElement.classList.add("finple-mypage-booting");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyPageRenderStabilization, { once: true });
  } else {
    bootMyPageRenderStabilization();
  }
}

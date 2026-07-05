/* =========================================================
   Step 112-5A/B/E/F - MY PAGE render stabilization guard
   - /mypage 새로고침 및 로그인 → MY PAGE 이동 시 빈 화면을 줄입니다.
   - 화면을 숨기지 않고, 즉시 표시 가능한 파란색 12-bar 로딩 스피너를 오버레이합니다.
   - 세부 패널 보정은 화면 표시 후 이어서 적용합니다.
   - 로그인 후 /start 복귀처럼 MY PAGE가 아닌 라우트 전환에도 같은 스피너를 재사용합니다.
========================================================= */

import {
  FINPLE_LOADING_MESSAGE_INTERVAL_MS,
  FINPLE_LOADING_MESSAGES,
  getRandomLoadingMessageIndex,
} from "./loadingMessages";

const MAX_WAIT_MS = 10000;
const OAUTH_MAX_WAIT_MS = 10000;
const MIN_WAIT_MS = 80;
const STYLE_ID = "finple-mypage-render-stabilization-style";
const LOADER_ID = "finple-mypage-loading-overlay";
const FAILSAFE_WAIT_MS = 12000;
const OAUTH_RECOVERY_SESSION_KEY = "finple-oauth-mypage-recovery-signature";
const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";

let activeBootId = 0;
let lastPathname = typeof window !== "undefined" ? window.location.pathname : "";
let isHistoryPatched = false;
let forcedLoaderUntil = 0;
let loadingMessageIndex = getRandomLoadingMessageIndex();
let loadingMessageTimer = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function getCurrentLoadingMessage() {
  return FINPLE_LOADING_MESSAGES[loadingMessageIndex] || FINPLE_LOADING_MESSAGES[0] || "";
}

function renderLoadingMessage() {
  const messageNode = document.querySelector("[data-finple-loading-message]");
  if (!messageNode) return;

  const nextMessage = getCurrentLoadingMessage();
  if (messageNode.textContent === nextMessage) return;

  messageNode.textContent = nextMessage;
  messageNode.classList.remove("isChanging");
  void messageNode.offsetWidth;
  messageNode.classList.add("isChanging");
}

function startLoadingMessageRotation() {
  renderLoadingMessage();
  if (loadingMessageTimer) return;

  loadingMessageTimer = window.setInterval(() => {
    loadingMessageIndex = getRandomLoadingMessageIndex(loadingMessageIndex);
    renderLoadingMessage();
  }, FINPLE_LOADING_MESSAGE_INTERVAL_MS);
}

function stopLoadingMessageRotation() {
  if (!loadingMessageTimer) return;

  window.clearInterval(loadingMessageTimer);
  loadingMessageTimer = null;
}

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function isEducationAccountUser() {
  try {
    const user = JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null");
    return user?.authMode === "education-account" || user?.entitlementSource === "education" || Boolean(user?.educationAccount);
  } catch {
    return false;
  }
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
    document.querySelector(".accountPage.myPage .accountPanelStack .accountStatusPanel") ||
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
  } catch {
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

    .finpleMyPageLoadingOverlay.isFallback {
      pointer-events: auto;
      background: #f8fafc;
    }

    .finpleMyPageLoaderSpinner {
      position: relative;
      width: 148px;
      height: 148px;
      animation: finpleMyPageLoaderRotate 1.05s steps(12) infinite;
    }

    .finpleMyPageLoadingStack {
      display: grid;
      justify-items: center;
      gap: 20px;
      width: min(380px, calc(100vw - 48px));
    }

    .finpleMyPageLoadingOverlay.isFallback .finpleMyPageLoadingStack {
      width: min(440px, calc(100vw - 48px));
      padding: 28px;
      border: 1px solid #d7e6ff;
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
    }

    .finpleMyPageLoadingOverlay.isFallback .finpleMyPageLoaderSpinner {
      display: none;
    }

    .finpleMyPageLoadingMessage {
      min-height: 24px;
      max-width: 100%;
      margin: 0;
      color: #334155;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.45;
      letter-spacing: 0;
      text-align: center;
      word-break: keep-all;
    }

    .finpleMyPageLoadingMessage.isChanging {
      animation: finpleMyPageLoadingMessageRise 420ms ease both;
    }

    .finpleMyPageFallbackActions {
      display: none;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .finpleMyPageLoadingOverlay.isFallback .finpleMyPageFallbackActions {
      display: flex;
    }

    .finpleMyPageFallbackActions button {
      min-height: 42px;
      padding: 0 18px;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      background: #fff;
      color: #0f172a;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
    }

    .finpleMyPageFallbackActions button:first-child {
      border-color: #0f172a;
      background: #0f172a;
      color: #fff;
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

    @keyframes finpleMyPageLoadingMessageRise {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .finpleMyPageLoaderSpinner {
        animation-duration: 2.4s;
      }

      .finpleMyPageLoadingMessage.isChanging {
        animation-duration: 1ms;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureLoadingOverlay() {
  if (!shouldKeepLoader() || !document.body) return;
  if (document.getElementById(LOADER_ID)) {
    startLoadingMessageRotation();
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = LOADER_ID;
  overlay.className = "finpleMyPageLoadingOverlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="finpleMyPageLoadingStack">
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
      <p class="finpleMyPageLoadingMessage isChanging" data-finple-loading-message>${escapeHtml(getCurrentLoadingMessage())}</p>
      <div class="finpleMyPageFallbackActions" data-finple-mypage-fallback-actions>
        <button type="button" data-finple-mypage-retry>다시 시도</button>
        <button type="button" data-finple-mypage-home>홈으로 이동</button>
        <button type="button" data-finple-mypage-login>로그인 화면으로 이동</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  startLoadingMessageRotation();
}

function removeLoadingOverlay() {
  stopLoadingMessageRotation();
  document.getElementById(LOADER_ID)?.remove();
}

function updateFallbackMessage() {
  const messageNode = document.querySelector("[data-finple-loading-message]");
  if (!messageNode) return;
  messageNode.textContent = "서버 응답이 지연되고 있습니다. 다시 시도해 주세요.";
  messageNode.classList.remove("isChanging");
}

function showMyPageFallback() {
  installStabilizationStyle();
  ensureLoadingOverlay();
  stopLoadingMessageRotation();
  const overlay = document.getElementById(LOADER_ID);
  overlay?.classList.add("isFallback");
  overlay?.setAttribute("aria-hidden", "false");
  updateFallbackMessage();
  document.documentElement.classList.remove("finple-mypage-booting");
  document.body?.classList.remove("finple-mypage-stabilizing");
}

function handleFallbackAction(event) {
  const target = event.target?.closest?.("[data-finple-mypage-retry], [data-finple-mypage-home], [data-finple-mypage-login]");
  if (!target) return;

  event.preventDefault();
  if (target.hasAttribute("data-finple-mypage-retry")) {
    activeBootId += 1;
    forcedLoaderUntil = Math.max(forcedLoaderUntil, Date.now() + 2200);
    removeLoadingOverlay();
    document.documentElement.classList.add("finple-mypage-booting");
    document.body?.classList.add("finple-mypage-stabilizing");
    window.setTimeout(bootMyPageRenderStabilization, 0);
    return;
  }
  window.location.assign(target.hasAttribute("data-finple-mypage-login") ? "/login" : "/");
}

function getSidebarText() {
  return document.querySelector(".myPageSidebarNav")?.textContent || "";
}

function hasOldSidebarLabels(sidebarText) {
  return ["계정 상태", "구독 / 결제", "요금제 상태", "결제수단", "서버 저장"].some((label) => sidebarText.includes(label));
}

function isShellReady() {
  const hasMyPageRoot = Boolean(document.querySelector(".accountPage.myPage"));
  const hasAccountPanel = Boolean(
    document.querySelector('.accountStatusPanel[data-mypage-panel-key="account"]') ||
      document.querySelector(".accountPage.myPage .accountPanelStack .accountStatusPanel")
  );
  const hasDashboardShell = Boolean(document.querySelector(".myPageDashboardLayout") && document.querySelector(".myPageSidebarNav"));

  return hasMyPageRoot && hasAccountPanel && (hasDashboardShell || Boolean(document.querySelector(".accountPage.myPage .accountPanelStack")));
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
    if (isMyPagePath() && !isShellReady()) {
      showMyPageFallback();
      return;
    }
    revealMyPage();
  }, FAILSAFE_WAIT_MS);
}

function waitForFinalLayout(bootId) {
  const startedAt = Date.now();
  let revealed = false;
  let fallbackShown = false;

  function tryReveal() {
    if (revealed || bootId !== activeBootId) return;

    ensureLoadingOverlay();

    const elapsed = Date.now() - startedAt;
    const shellReady = elapsed >= MIN_WAIT_MS && isShellReady();
    const isOAuthRoute = isOAuthMyPagePath();
    const timedOut = elapsed >= (isOAuthRoute ? OAUTH_MAX_WAIT_MS : MAX_WAIT_MS);
    const forcedExpiredAwayFromMyPage = !isMyPagePath() && Date.now() >= forcedLoaderUntil;

    if (shellReady || (isOAuthRoute && timedOut && hasRenderableMyPageContent()) || forcedExpiredAwayFromMyPage) {
      revealed = true;
      revealMyPage();
      return;
    }

    if (timedOut) {
      if (!fallbackShown) {
        fallbackShown = true;
        showMyPageFallback();
      }
      window.setTimeout(tryReveal, 500);
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

function bootStabilizationUnlessShellReady() {
  if (isMyPagePath() && isShellReady()) {
    revealMyPage();
    return;
  }

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
  window.addEventListener("finple-auth-updated", bootStabilizationUnlessShellReady);
  window.addEventListener("finple-local-storage-updated", bootStabilizationUnlessShellReady);
  window.addEventListener("finple-mypage-transition-start", () => {
    showImmediateMyPageLoader(2200);
    window.setTimeout(bootMyPageRenderStabilization, 0);
  });
  window.addEventListener("finple-route-transition-start", () => {
    showImmediateMyPageLoader(2200);
    window.setTimeout(bootMyPageRenderStabilization, 0);
  });
}

if (typeof window !== "undefined") {
  installStabilizationStyle();
  patchHistoryNavigation();
  document.addEventListener("click", handleFallbackAction);
  window.__finpleShowMyPageLoader = showImmediateMyPageLoader;
  window.__finpleShowRouteTransitionLoader = showImmediateMyPageLoader;

  if (isMyPagePath()) {
    document.documentElement.classList.add("finple-mypage-booting");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyPageRenderStabilization, { once: true });
  } else {
    bootMyPageRenderStabilization();
  }
}

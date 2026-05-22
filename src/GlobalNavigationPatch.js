/* =========================================================
   FINPLE global header normalizer
   - 우측 글로벌 메뉴를 모든 주요 화면에서 동일하게 유지합니다.
   - 홈 내부 내비와 시뮬레이터 내부 내비는 가운데 영역에 남겨둡니다.
   - React 화면 전환/로고 클릭 후 재렌더링되어도 헤더를 다시 정리합니다.
========================================================= */

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const TOOL_PATHS = ["/start", "/tools", "/mbti", "/simulator", "/screener"];
let globalHeaderPatchTimer = null;
let globalHeaderObserver = null;
let isPatchingHeader = false;

function normalizePath(pathname) {
  return String(pathname || "/").replace(/\/+$/, "") || "/";
}

function isLoggedIn() {
  try {
    return Boolean(JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null")?.id);
  } catch (error) {
    return false;
  }
}

function getActiveKey() {
  const path = normalizePath(window.location.pathname);
  if (TOOL_PATHS.includes(path) || path.startsWith("/payment-method")) return "start";
  if (path === "/pricing" || path.startsWith("/billing")) return "pricing";
  if (path === "/support") return "support";
  if (path === "/mypage") return "mypage";
  if (path === "/login" || path === "/signup") return "login";
  if (path === "/admin") return "admin";
  return "home";
}

function getHeaderStateKey() {
  return `${getActiveKey()}|${isLoggedIn() ? "in" : "out"}`;
}

function navigateTo(path) {
  if (window.location.pathname === path) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  window.location.href = path;
}

function logoutAndHome() {
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.dispatchEvent(new Event("finple-auth-updated"));
  window.dispatchEvent(new Event("finple-local-storage-updated"));
  navigateTo("/");
}

function getNavHtml() {
  const activeKey = getActiveKey();
  const loggedIn = isLoggedIn();
  const navItems = [
    { key: "home", label: "홈", path: "/", className: "" },
    { key: "start", label: "시작하기", path: "/start", className: "finpleGlobalStartButton" },
    { key: "pricing", label: "요금제", path: "/pricing", className: "" },
    { key: "support", label: "문의사항", path: "/support", className: "" },
    { key: "mypage", label: "MY PAGE", path: "/mypage", className: "" },
  ];

  return `
    <nav class="finpleGlobalNav" aria-label="FINPLE 주요 메뉴" data-finple-global-nav>
      ${navItems.map((item) => `
        <button type="button" class="${item.className} ${activeKey === item.key ? "active" : ""}" data-finple-nav-path="${item.path}">${item.label}</button>
      `).join("")}
      <button type="button" class="finpleGlobalAuthButton ${activeKey === "login" ? "active" : ""}" data-finple-auth-action="${loggedIn ? "logout" : "login"}">${loggedIn ? "로그아웃" : "로그인"}</button>
    </nav>
  `;
}

function normalizeBrand(header) {
  const brand = header.querySelector(".brandLogo");
  if (!brand) return;

  const strong = brand.querySelector(".brandText strong");
  const span = brand.querySelector(".brandText span");
  if (strong && strong.textContent !== "FINPLE") strong.textContent = "FINPLE";
  if (span && span.textContent !== "Portfolio Lab") span.textContent = "Portfolio Lab";
}

function removeOldRightMenus(header) {
  Array.from(header.children).forEach((child) => {
    if (child.matches(".finpleGlobalNav")) return;
    if (child.matches(".accountNav, .headerActions")) child.remove();
  });
}

function wireGlobalNav(nav) {
  if (!nav || nav.getAttribute("data-finple-global-nav-wired") === "true") return;

  nav.setAttribute("data-finple-global-nav-wired", "true");
  nav.querySelectorAll("[data-finple-nav-path]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-finple-nav-path") || "/"));
  });

  nav.querySelector("[data-finple-auth-action]")?.addEventListener("click", (event) => {
    const action = event.currentTarget.getAttribute("data-finple-auth-action");
    if (action === "logout") logoutAndHome();
    else navigateTo("/login");
  });
}

function ensureGlobalNav(header) {
  const stateKey = getHeaderStateKey();
  let nav = header.querySelector(".finpleGlobalNav");

  if (nav && header.getAttribute("data-finple-global-nav-state") === stateKey) {
    wireGlobalNav(nav);
    return;
  }

  const html = getNavHtml();
  if (!nav) {
    header.insertAdjacentHTML("beforeend", html);
  } else {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    nav.replaceWith(template.content.firstElementChild);
  }

  header.setAttribute("data-finple-global-nav-state", stateKey);
  wireGlobalNav(header.querySelector(".finpleGlobalNav"));
}

function patchHeader(header) {
  if (!header) return;
  header.classList.add("finpleUnifiedHeader");
  normalizeBrand(header);
  removeOldRightMenus(header);
  ensureGlobalNav(header);
}

function patchAllHeaders() {
  if (isPatchingHeader) return;
  isPatchingHeader = true;
  try {
    document.querySelectorAll(".header, .accountHeader").forEach(patchHeader);
  } finally {
    isPatchingHeader = false;
  }
}

function schedulePatch() {
  if (globalHeaderPatchTimer) window.clearTimeout(globalHeaderPatchTimer);
  globalHeaderPatchTimer = window.setTimeout(() => {
    patchAllHeaders();
    [40, 120, 280, 600].forEach((delay) => window.setTimeout(patchAllHeaders, delay));
  }, 0);
}

function bootGlobalNavigationPatch() {
  schedulePatch();
  window.addEventListener("popstate", schedulePatch);
  window.addEventListener("pushstate", schedulePatch);
  window.addEventListener("finple-auth-updated", schedulePatch);
  window.addEventListener("finple-route-changed", schedulePatch);
  window.addEventListener("finple-local-storage-updated", schedulePatch);

  if (!globalHeaderObserver) {
    globalHeaderObserver = new MutationObserver((mutations) => {
      if (isPatchingHeader) return;
      const shouldPatch = mutations.some((mutation) =>
        Array.from(mutation.addedNodes || []).some((node) =>
          node instanceof Element && (node.matches?.(".header, .accountHeader") || node.querySelector?.(".header, .accountHeader"))
        )
      );
      if (shouldPatch) schedulePatch();
    });
    globalHeaderObserver.observe(document.body, { childList: true, subtree: true });
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootGlobalNavigationPatch, { once: true });
  else bootGlobalNavigationPatch();
}
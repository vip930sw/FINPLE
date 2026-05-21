/* =========================================================
   Step 170 - Global navigation / brand normalizer
   - 모든 주요 페이지의 우측 상단 메뉴 구성을 통일합니다.
   - 시작하기는 CTA 버튼으로 강조합니다.
   - 현재 위치는 밑줄/강조로 표시합니다.
   - 좌측 FINPLE 로고 문구를 FINPLE PORTFOLIO LAB으로 통일하고 클릭 시 홈으로 이동합니다.
========================================================= */

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";

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
  if (path === "/simulator" || path.startsWith("/payment-method")) return "start";
  if (path === "/pricing" || path.startsWith("/billing")) return "pricing";
  if (path === "/support") return "support";
  if (path === "/mypage") return "mypage";
  if (path === "/login" || path === "/signup") return "login";
  if (path === "/admin") return "admin";
  return "home";
}

function navigateTo(path) {
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
    { key: "start", label: "시작하기", path: "/simulator", className: "finpleGlobalStartButton" },
    { key: "pricing", label: "요금제", path: "/pricing", className: "" },
    { key: "support", label: "문의사항", path: "/support", className: "" },
    { key: "mypage", label: "MY PAGE", path: "/mypage", className: "" },
  ];

  return `
    <nav class="finpleGlobalNav" aria-label="FINPLE 주요 메뉴" data-finple-global-nav>
      ${navItems.map((item) => `
        <button
          type="button"
          class="${item.className} ${activeKey === item.key ? "active" : ""}"
          data-finple-nav-path="${item.path}"
        >${item.label}</button>
      `).join("")}
      <button
        type="button"
        class="finpleGlobalAuthButton ${activeKey === "login" ? "active" : ""}"
        data-finple-auth-action="${loggedIn ? "logout" : "login"}"
      >${loggedIn ? "로그아웃" : "로그인"}</button>
    </nav>
  `;
}

function normalizeBrand(header) {
  const brand = header.querySelector(".brandLogo");
  if (!brand) return;

  const strong = brand.querySelector(".brandText strong");
  const span = brand.querySelector(".brandText span");
  if (strong) strong.textContent = "FINPLE";
  if (span) span.textContent = "PORTFOLIO LAB";

  if (brand.getAttribute("data-finple-brand-normalized") === "true") return;
  brand.setAttribute("data-finple-brand-normalized", "true");
  brand.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo("/");
  });
}

function removeOldRightMenus(header) {
  Array.from(header.children).forEach((child) => {
    if (child.matches(".finpleGlobalNav")) return;
    if (child.matches(".accountNav, .headerActions")) child.remove();
  });
}

function insertGlobalNav(header) {
  let nav = header.querySelector(".finpleGlobalNav");
  const html = getNavHtml();

  if (!nav) {
    header.insertAdjacentHTML("beforeend", html);
    nav = header.querySelector(".finpleGlobalNav");
  } else {
    nav.outerHTML = html;
    nav = header.querySelector(".finpleGlobalNav");
  }

  nav.querySelectorAll("[data-finple-nav-path]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-finple-nav-path") || "/"));
  });

  nav.querySelector("[data-finple-auth-action]")?.addEventListener("click", (event) => {
    const action = event.currentTarget.getAttribute("data-finple-auth-action");
    if (action === "logout") logoutAndHome();
    else navigateTo("/login");
  });
}

function patchHeader(header) {
  if (!header || header.getAttribute("data-finple-global-header-lock") === "true") return;
  header.classList.add("finpleUnifiedHeader");
  normalizeBrand(header);
  removeOldRightMenus(header);
  insertGlobalNav(header);
}

function patchAllHeaders() {
  document.querySelectorAll(".header, .accountHeader").forEach(patchHeader);
}

function bootGlobalNavigationPatch() {
  const observer = new MutationObserver(() => patchAllHeaders());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", () => window.setTimeout(patchAllHeaders, 60));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(patchAllHeaders, 60));
  window.setTimeout(patchAllHeaders, 80);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootGlobalNavigationPatch, { once: true });
  else bootGlobalNavigationPatch();
}

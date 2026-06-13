/* =========================================================
   Step 112-5D - MY PAGE shell bridge
   - 최종 좌측 메뉴/대시보드 Shell을 패치보다 앞단에서 준비합니다.
   - 기존 DOM 후처리 패치가 실행되기 전 기본 MY PAGE 노출 시간을 줄입니다.
   - AccountPages.jsx 완전 통합 전 중간 안정화 단계입니다.
========================================================= */

const MENU_ITEMS = [
  { key: "account", label: "내 계정", description: "로그인·사용자", selector: ".accountStatusPanel" },
  { key: "investment-profile", label: "내 투자성향", description: "투자 MBTI", selector: "[data-investment-profile-panel]" },
  { key: "billing", label: "내 구독/플랜", description: "구독·요금제", selector: "[data-subscription-status-panel]" },
  { key: "payment-method", label: "내 결제수단", description: "자동결제 등록", selector: "[data-payment-method-panel]" },
  { key: "payment-history", label: "내 결제내역", description: "영수증·이력", selector: "[data-payment-history-panel]" },
  { key: "inquiries", label: "내 문의내역", description: "접수·처리 현황", selector: "[data-my-inquiries-panel]" },
  { key: "storage", label: "내 저장내역", description: "저장·불러오기", selector: ".serverStoragePanel" },
];

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const EDUCATION_HIDDEN_MENU_KEYS = new Set(["payment-method", "payment-history"]);

let activeMenuKey = "account";
let observer = null;
let observerStartedAt = 0;

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isEducationAccountUser() {
  try {
    const user = JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null");
    return user?.authMode === "education-account" || user?.entitlementSource === "education" || Boolean(user?.educationAccount);
  } catch {
    return false;
  }
}

function getVisibleMenuItems() {
  if (!isEducationAccountUser()) return MENU_ITEMS;
  return MENU_ITEMS.filter((item) => !EDUCATION_HIDDEN_MENU_KEYS.has(item.key));
}

function getSidebarHtml() {
  const visibleMenuItems = getVisibleMenuItems();
  return `
    <aside class="myPageSidebar" data-mypage-sidebar data-mypage-shell-bridge>
      <div class="myPageSidebarHeader">
        <strong>MY PAGE</strong>
        <span>내 정보 메뉴</span>
      </div>
      <select class="myPageMobileMenuSelect" data-mypage-mobile-menu aria-label="MY PAGE 메뉴 선택">
        ${visibleMenuItems.map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.label)}</option>`).join("")}
      </select>
      <nav class="myPageSidebarNav" aria-label="MY PAGE 메뉴">
        ${visibleMenuItems.map((item) => `
          <button
            type="button"
            data-mypage-menu-key="${escapeHtml(item.key)}"
            ${item.key === "payment-history" ? "data-payment-history-menu" : ""}
          >
            <span>${escapeHtml(item.label)}</span>
            <em>${escapeHtml(item.description)}</em>
          </button>
        `).join("")}
      </nav>
    </aside>
  `;
}

function ensureShellLayout() {
  const stack = document.querySelector(".accountPanelStack");
  if (!stack) return false;

  let wrapper = stack.closest(".myPageDashboardLayout");

  if (!wrapper) {
    wrapper = document.createElement("section");
    wrapper.className = "myPageDashboardLayout myPageDashboardLayout--singlePanel";
    wrapper.setAttribute("aria-label", "MY PAGE 관리 메뉴와 패널");
    stack.parentNode.insertBefore(wrapper, stack);
    wrapper.appendChild(stack);
  }

  if (!wrapper.querySelector(".myPageSidebarNav")) {
    wrapper.insertAdjacentHTML("afterbegin", getSidebarHtml());
  }

  return true;
}

function markPanelKeys() {
  document.querySelector(".accountStatusPanel")?.setAttribute("data-mypage-panel-key", "account");
  document.querySelector("[data-investment-profile-panel]")?.setAttribute("data-mypage-panel-key", "investment-profile");
  document.querySelector("[data-subscription-status-panel]")?.setAttribute("data-mypage-panel-key", "billing");
  document.querySelector(".planStatusPanel")?.setAttribute("data-mypage-panel-key", "billing");
  document.querySelector("[data-payment-method-panel]")?.setAttribute("data-mypage-panel-key", "payment-method");
  document.querySelector("[data-payment-history-panel]")?.setAttribute("data-mypage-panel-key", "payment-history");
  document.querySelector("[data-my-inquiries-panel]")?.setAttribute("data-mypage-panel-key", "inquiries");
  document.querySelector(".serverStoragePanel")?.setAttribute("data-mypage-panel-key", "storage");
  document.querySelectorAll(".adminInquiryPanel").forEach((panel) => {
    panel.classList.add("myPagePanelHidden");
    panel.hidden = true;
  });
}

function getFallbackKey() {
  return getVisibleMenuItems().find((item) => document.querySelector(item.selector))?.key || "account";
}

function getActiveKey(nextKey) {
  if (getVisibleMenuItems().some((item) => item.key === nextKey)) return nextKey;
  return getFallbackKey();
}

function activatePanel(nextKey, options = {}) {
  activeMenuKey = getActiveKey(nextKey);
  window.__finpleMyPageActiveKey = activeMenuKey;

  document.querySelectorAll("[data-mypage-menu-key]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-mypage-menu-key") === activeMenuKey);
  });

  document.querySelectorAll("[data-mypage-mobile-menu]").forEach((select) => {
    if (select.value !== activeMenuKey) select.value = activeMenuKey;
  });

  document.querySelectorAll(".accountPanelStack > [data-mypage-panel-key]").forEach((panel) => {
    const isActive = panel.getAttribute("data-mypage-panel-key") === activeMenuKey;
    panel.classList.toggle("myPagePanelActive", isActive);
    panel.classList.toggle("myPagePanelHidden", !isActive);
    panel.toggleAttribute("hidden", !isActive);
  });

  if (options.scrollToTop) {
    const layout = document.querySelector(".myPageDashboardLayout");
    const top = layout ? Math.max(0, layout.getBoundingClientRect().top + window.scrollY - 90) : 0;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

function wireMenu() {
  document.querySelectorAll("[data-mypage-menu-key]").forEach((button) => {
    if (button.getAttribute("data-mypage-shell-wired") === "true") return;
    button.setAttribute("data-mypage-shell-wired", "true");
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-mypage-menu-key") || "account";
      activatePanel(key, { scrollToTop: true });
    });
  });

  document.querySelectorAll("[data-mypage-mobile-menu]").forEach((select) => {
    if (select.getAttribute("data-mypage-shell-wired") === "true") return;
    select.setAttribute("data-mypage-shell-wired", "true");
    select.addEventListener("change", () => {
      activatePanel(select.value || "account", { scrollToTop: true });
    });
  });
}

function applyShellBridge() {
  if (!isMyPagePath()) return;
  if (!ensureShellLayout()) return;

  activeMenuKey = window.__finpleMyPageActiveKey || activeMenuKey || getFallbackKey();
  markPanelKeys();
  wireMenu();
  activatePanel(activeMenuKey);
}

function bootShellBridge() {
  if (!isMyPagePath()) return;

  [0, 40, 120, 260, 520, 900, 1500, 2600].forEach((delay) => {
    window.setTimeout(applyShellBridge, delay);
  });

  if (observer) observer.disconnect();
  observerStartedAt = Date.now();
  observer = new MutationObserver(() => {
    applyShellBridge();
    if (Date.now() - observerStartedAt > 3600) {
      observer.disconnect();
      observer = null;
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("popstate", () => window.setTimeout(applyShellBridge, 80));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(applyShellBridge, 120));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootShellBridge, { once: true });
  else bootShellBridge();
}

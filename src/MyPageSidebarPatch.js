/* =========================================================
   Step 166C - MY PAGE single-card menu navigation patch
   - MY PAGE 좌측 메뉴와 오른쪽 카드를 1:1로 매칭합니다.
   - 문의/관리 영역은 /admin 별도 접속으로 분리하고 MY PAGE 메뉴에서는 제외합니다.
   - 페이지가 길어질 상황을 대비해 TOP 버튼을 추가합니다.
========================================================= */

const MENU_ITEMS = [
  { key: "account", label: "계정 상태", description: "로그인·사용자", selector: ".accountStatusPanel" },
  { key: "billing", label: "구독 / 결제", description: "플랜·해지", selector: "[data-subscription-status-panel]" },
  { key: "plan", label: "요금제 상태", description: "한도·권한", selector: ".planStatusPanel" },
  { key: "payment-method", label: "결제수단", description: "자동결제 등록", selector: "[data-payment-method-panel]" },
  { key: "storage", label: "서버 저장", description: "저장·불러오기", selector: ".serverStoragePanel" },
];

const STANDALONE_PANELS_TO_HIDE = [".adminInquiryPanel"];

let activeMenuKey = "account";

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function navigateTo(path) {
  window.location.href = path;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPaymentMethodPanelHtml() {
  return `
    <section class="accountCard paymentMethodEntryPanel" data-payment-method-panel data-mypage-panel-key="payment-method">
      <div class="serverStorageHeader">
        <div>
          <p class="accountMiniLabel">Payment Method</p>
          <h2>자동결제 결제수단</h2>
          <p>FINPLE Personal 월 구독 자동결제를 위한 결제수단 등록 진입 영역입니다.</p>
        </div>
        <span class="serverStatusBadge ready">준비 중</span>
      </div>

      <div class="paymentMethodEntryGrid">
        <div>
          <span>결제 방식</span>
          <strong>월 구독 자동결제</strong>
          <em>빌링키 기반</em>
        </div>
        <div>
          <span>등록 상태</span>
          <strong>미등록</strong>
          <em>Step 166 이후 연동</em>
        </div>
        <div>
          <span>다음 결제일</span>
          <strong>연동 예정</strong>
          <em>D-3 사전 안내</em>
        </div>
      </div>

      <p class="serverStorageMessage compact paymentMethodEntryMessage">
        카드번호는 FINPLE 서버에 직접 저장하지 않고, PG 결제수단 참조값을 사용합니다. 실제 결제수단 등록 API는 다음 단계에서 연결합니다.
      </p>

      <div class="serverStorageActions compactActions">
        <button type="button" class="primaryButton" data-payment-method-setup>자동결제 등록 화면으로 이동</button>
        <button type="button" class="secondaryButton" data-payment-method-pricing>요금제 확인</button>
      </div>
    </section>
  `;
}

function markPanelKeys() {
  MENU_ITEMS.forEach((item) => {
    const panel = document.querySelector(item.selector);
    if (panel) panel.setAttribute("data-mypage-panel-key", item.key);
  });
}

function hideStandalonePanels() {
  STANDALONE_PANELS_TO_HIDE.forEach((selector) => {
    document.querySelectorAll(selector).forEach((panel) => {
      panel.classList.add("myPagePanelHidden");
      panel.toggleAttribute("hidden", true);
    });
  });
}

function ensurePaymentMethodPanel() {
  if (document.querySelector("[data-payment-method-panel]")) return;

  const stack = document.querySelector(".accountPanelStack");
  if (!stack) return;

  const subscriptionPanel = document.querySelector("[data-subscription-status-panel]");
  const planPanel = document.querySelector(".planStatusPanel");
  const insertTarget = subscriptionPanel || planPanel;

  if (insertTarget?.parentNode) {
    insertTarget.insertAdjacentHTML("afterend", getPaymentMethodPanelHtml());
  } else {
    stack.insertAdjacentHTML("beforeend", getPaymentMethodPanelHtml());
  }

  document.querySelector("[data-payment-method-setup]")?.addEventListener("click", () => navigateTo("/payment-method/setup"));
  document.querySelector("[data-payment-method-pricing]")?.addEventListener("click", () => navigateTo("/pricing"));
}

function getSidebarHtml() {
  return `
    <aside class="myPageSidebar" data-mypage-sidebar>
      <div class="myPageSidebarHeader">
        <strong>MY PAGE</strong>
        <span>계정·결제·저장 관리</span>
      </div>
      <nav class="myPageSidebarNav" aria-label="MY PAGE 메뉴">
        ${MENU_ITEMS.map((item) => `
          <button type="button" data-mypage-menu-key="${escapeHtml(item.key)}">
            <span>${escapeHtml(item.label)}</span>
            <em>${escapeHtml(item.description)}</em>
          </button>
        `).join("")}
      </nav>
    </aside>
  `;
}

function ensureTopButton() {
  if (document.querySelector("[data-mypage-top-button]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "myPageTopButton";
  button.setAttribute("data-mypage-top-button", "true");
  button.textContent = "TOP";
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(button);
}

function updateTopButtonVisibility() {
  const button = document.querySelector("[data-mypage-top-button]");
  if (!button) return;

  const shouldShow = isMyPagePath() && window.scrollY > 260;
  button.classList.toggle("visible", shouldShow);
}

function wrapMyPageLayout() {
  const stack = document.querySelector(".accountPanelStack");
  if (!stack || stack.closest(".myPageDashboardLayout")) return;

  const wrapper = document.createElement("section");
  wrapper.className = "myPageDashboardLayout myPageDashboardLayout--singlePanel";
  wrapper.setAttribute("aria-label", "MY PAGE 관리 메뉴와 패널");
  wrapper.innerHTML = getSidebarHtml();

  stack.parentNode.insertBefore(wrapper, stack);
  wrapper.appendChild(stack);
  wireSidebarActions(wrapper);
}

function wireSidebarActions(wrapper) {
  wrapper.querySelectorAll("[data-mypage-menu-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-mypage-menu-key") || "account";
      setActivePanel(key, { scrollToTop: true });
    });
  });
}

function getFallbackActiveKey() {
  const activeItem = MENU_ITEMS.find((item) => document.querySelector(item.selector));
  return activeItem?.key || "account";
}

function setActiveMenu(activeKey) {
  document.querySelectorAll("[data-mypage-menu-key]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-mypage-menu-key") === activeKey);
  });
}

function setActivePanel(nextKey, options = {}) {
  activeMenuKey = MENU_ITEMS.some((item) => item.key === nextKey) ? nextKey : getFallbackActiveKey();

  const selectedPanel = document.querySelector(`[data-mypage-panel-key="${activeMenuKey}"]`);
  if (!selectedPanel) {
    activeMenuKey = getFallbackActiveKey();
  }

  document.querySelectorAll(".accountPanelStack > [data-mypage-panel-key]").forEach((panel) => {
    const isActive = panel.getAttribute("data-mypage-panel-key") === activeMenuKey;
    panel.classList.toggle("myPagePanelActive", isActive);
    panel.classList.toggle("myPagePanelHidden", !isActive);
    panel.toggleAttribute("hidden", !isActive);
  });

  setActiveMenu(activeMenuKey);

  if (options.scrollToTop) {
    const layout = document.querySelector(".myPageDashboardLayout");
    const top = layout ? Math.max(0, layout.getBoundingClientRect().top + window.scrollY - 90) : 0;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

function applyMyPageSidebar() {
  if (!isMyPagePath()) return;

  ensurePaymentMethodPanel();
  markPanelKeys();
  hideStandalonePanels();
  wrapMyPageLayout();
  ensureTopButton();
  setActivePanel(activeMenuKey);
  updateTopButtonVisibility();
}

function bootMyPageSidebarPatch() {
  const observer = new MutationObserver(() => applyMyPageSidebar());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("scroll", updateTopButtonVisibility, { passive: true });
  window.addEventListener("popstate", () => window.setTimeout(applyMyPageSidebar, 80));

  window.setTimeout(applyMyPageSidebar, 150);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyPageSidebarPatch, { once: true });
  } else {
    bootMyPageSidebarPatch();
  }
}
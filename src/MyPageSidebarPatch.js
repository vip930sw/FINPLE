/* =========================================================
   Step 169 - MY PAGE single-card menu navigation patch
   - MY PAGE 좌측 메뉴와 오른쪽 카드를 1:1로 매칭합니다.
   - 결제수단 메뉴에서 실제 자동결제 등록 상태를 조회해 표시합니다.
   - 문의/관리 영역은 /admin 별도 접속으로 분리하고 MY PAGE 메뉴에서는 제외합니다.
========================================================= */

import { fetchBillingMethodStatus } from "./components/paymentMethodClient";

const MENU_ITEMS = [
  { key: "account", label: "계정 상태", description: "로그인·사용자", selector: ".accountStatusPanel" },
  { key: "billing", label: "구독 / 결제", description: "플랜·해지", selector: "[data-subscription-status-panel]" },
  { key: "plan", label: "요금제 상태", description: "한도·권한", selector: ".planStatusPanel" },
  { key: "payment-method", label: "결제수단", description: "자동결제 등록", selector: "[data-payment-method-panel]" },
  { key: "storage", label: "서버 저장", description: "저장·불러오기", selector: ".serverStoragePanel" },
];

const STANDALONE_PANELS_TO_HIDE = [".adminInquiryPanel"];

let activeMenuKey = "account";
let billingMethodRequested = false;
let billingMethodState = {
  loading: false,
  registered: false,
  method: null,
  error: "",
};

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

function setText(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) node.textContent = nextValue;
}

function getPaymentMethodPanelHtml() {
  return `
    <section class="accountCard paymentMethodEntryPanel" data-payment-method-panel data-mypage-panel-key="payment-method">
      <div class="serverStorageHeader">
        <div>
          <p class="accountMiniLabel">Payment Method</p>
          <h2>자동결제 결제수단</h2>
          <p>FINPLE Personal 월 구독 자동결제를 위한 결제수단 관리 영역입니다.</p>
        </div>
        <span class="serverStatusBadge ready" data-billing-method-badge>확인 중</span>
      </div>

      <div class="paymentMethodEntryGrid">
        <div>
          <span>결제 방식</span>
          <strong>월 구독 자동결제</strong>
          <em>빌링키 기반</em>
        </div>
        <div>
          <span>등록 상태</span>
          <strong data-billing-method-status>확인 중</strong>
          <em data-billing-method-status-note>서버 조회 중</em>
        </div>
        <div>
          <span>결제수단</span>
          <strong data-billing-method-label>확인 중</strong>
          <em data-billing-method-updated>카드번호 원문 저장 없음</em>
        </div>
      </div>

      <p class="serverStorageMessage compact paymentMethodEntryMessage" data-billing-method-message>
        등록된 결제수단을 확인하고 있습니다.
      </p>

      <div class="serverStorageActions compactActions">
        <button type="button" class="primaryButton" data-payment-method-setup>결제수단 등록/변경</button>
        <button type="button" class="secondaryButton" data-billing-method-refresh>결제수단 새로고침</button>
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

function bindPaymentMethodPanelActions() {
  document.querySelector("[data-payment-method-setup]")?.addEventListener("click", () => navigateTo("/payment-method/setup"));
  document.querySelector("[data-payment-method-pricing]")?.addEventListener("click", () => navigateTo("/pricing"));
  document.querySelector("[data-billing-method-refresh]")?.addEventListener("click", () => loadBillingMethodStatus({ force: true }));
}

function ensurePaymentMethodPanel() {
  if (document.querySelector("[data-payment-method-panel]")) {
    bindPaymentMethodPanelActions();
    return;
  }

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

  bindPaymentMethodPanelActions();
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

function updateBillingMethodUi() {
  const badge = document.querySelector("[data-billing-method-badge]");
  const status = document.querySelector("[data-billing-method-status]");
  const statusNote = document.querySelector("[data-billing-method-status-note]");
  const label = document.querySelector("[data-billing-method-label]");
  const updated = document.querySelector("[data-billing-method-updated]");
  const message = document.querySelector("[data-billing-method-message]");

  if (!badge || !status || !label || !message) return;

  if (billingMethodState.loading) {
    setText(badge, "확인 중");
    setText(status, "확인 중");
    setText(statusNote, "서버 조회 중");
    setText(label, "확인 중");
    setText(updated, "카드번호 원문 저장 없음");
    setText(message, "등록된 결제수단을 확인하고 있습니다.");
    return;
  }

  if (billingMethodState.error) {
    setText(badge, "확인 필요");
    setText(status, "확인 필요");
    setText(statusNote, "다시 조회 필요");
    setText(label, "확인 실패");
    setText(updated, "카드번호 원문 저장 없음");
    setText(message, billingMethodState.error);
    return;
  }

  if (billingMethodState.registered && billingMethodState.method) {
    const method = billingMethodState.method;
    setText(badge, "등록됨");
    setText(status, "등록 완료");
    setText(statusNote, "자동결제 가능");
    setText(label, method.displayLabel || "등록된 결제수단");
    setText(updated, method.issuedAt ? `등록일 ${String(method.issuedAt).slice(0, 10)}` : "카드번호 원문 저장 없음");
    setText(message, "등록된 결제수단으로 다음 정기결제를 진행할 수 있습니다.");
    return;
  }

  setText(badge, "미등록");
  setText(status, "미등록");
  setText(statusNote, "등록 필요");
  setText(label, "등록된 결제수단 없음");
  setText(updated, "카드번호 원문 저장 없음");
  setText(message, "자동결제를 이용하려면 결제수단을 등록해 주세요.");
}

async function loadBillingMethodStatus(options = {}) {
  if (!isMyPagePath()) return;
  if (billingMethodState.loading) return;
  if (billingMethodRequested && !options.force) {
    updateBillingMethodUi();
    return;
  }

  billingMethodRequested = true;
  billingMethodState = { loading: true, registered: false, method: null, error: "" };
  updateBillingMethodUi();

  try {
    const payload = await fetchBillingMethodStatus();
    billingMethodState = {
      loading: false,
      registered: Boolean(payload?.registered),
      method: payload?.method || null,
      error: "",
    };
  } catch (error) {
    billingMethodState = {
      loading: false,
      registered: false,
      method: null,
      error: error?.message || "결제수단 상태를 확인하지 못했습니다.",
    };
  }

  updateBillingMethodUi();
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

  if (activeMenuKey === "payment-method") {
    loadBillingMethodStatus();
  }

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
  updateBillingMethodUi();
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
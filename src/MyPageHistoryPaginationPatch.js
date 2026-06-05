/* =========================================================
   Step 112-4 - MY PAGE history list open/close + pagination
   - 내 결제내역/내 문의내역 리스트를 기본 접힘 상태로 둡니다.
   - 버튼은 리스트 위에 고정하고, 리스트는 버튼 아래로 펼칩니다.
   - 10개 단위로 이전  1 / 5  다음 페이지네이션을 제공합니다.
========================================================= */

import { fetchFinplePaymentHistory } from "./PaymentHistoryClientPatch.js";
import { fetchMySupportInquiries } from "./components/portfolio/services/serverPortfolioService";

const PAGE_SIZE = 10;

const historyStates = {
  payments: { isOpen: false, page: 0, items: null, loading: false, error: "" },
  inquiries: { isOpen: false, page: 0, items: null, loading: false, error: "" },
};

const INQUIRY_CATEGORY_LABELS = {
  bug: "오류 신고",
  feature: "기능 제안",
  payment: "결제 문의",
  data: "데이터 문의",
  etc: "기타 문의",
};

const INQUIRY_STATUS_LABELS = {
  open: "접수됨",
  in_progress: "확인 중",
  resolved: "답변 완료",
  closed: "종료",
};

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setHtml(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.innerHTML !== nextValue) node.innerHTML = nextValue;
}

function formatDate(value) {
  if (!value) return "없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  } catch (error) {
    return "없음";
  }
}

function formatAmount(amount, currency = "KRW") {
  const value = Number(amount || 0);
  if (!Number.isFinite(value)) return "-";
  if (currency === "KRW") return `${value.toLocaleString("ko-KR")}원`;
  return `${value.toLocaleString("ko-KR")} ${currency}`;
}

function getPaymentStatusLabel(status) {
  const labels = {
    paid: "결제완료",
    confirmed: "결제완료",
    failed: "결제실패",
    canceled: "취소됨",
    cancelled: "취소됨",
    refunded: "환불완료",
    pending: "처리중",
  };
  return labels[String(status || "").toLowerCase()] || status || "처리중";
}

function getInquiryStatusLabel(status) {
  return INQUIRY_STATUS_LABELS[status] || status || "접수됨";
}

function getInquiryCategoryLabel(category) {
  return INQUIRY_CATEGORY_LABELS[category] || "기타 문의";
}

function getInquiryExcerpt(message = "") {
  const body = String(message || "")
    .split("--- 문의 메타 정보 ---")[0]
    .replace(/\s+/g, " ")
    .trim();
  if (!body) return "문의 내용 미리보기가 없습니다.";
  return body.length > 96 ? `${body.slice(0, 96)}…` : body;
}

function renderPaymentItem(payment) {
  const status = String(payment.status || "pending").toLowerCase();
  const receipt = payment.receiptUrl
    ? `<a href="${escapeHtml(payment.receiptUrl)}" target="_blank" rel="noopener noreferrer">영수증 보기</a>`
    : `<span>영수증 없음</span>`;

  return `
    <article class="paymentHistoryItem">
      <div class="paymentHistoryItemTop">
        <span class="paymentStatusBadge status-${escapeHtml(status)}">${escapeHtml(getPaymentStatusLabel(status))}</span>
        <em>${escapeHtml(formatDate(payment.paidAt || payment.createdAt))}</em>
      </div>
      <strong>${escapeHtml(payment.title || "FINPLE 결제")}</strong>
      <p>${escapeHtml(formatAmount(payment.amount, payment.currency))}</p>
      <div class="paymentHistoryItemMeta"><span>${escapeHtml(payment.provider || "toss-payments")}</span>${receipt}</div>
    </article>
  `;
}

function renderInquiryItem(inquiry) {
  const status = inquiry.status || "open";
  return `
    <article class="myInquiryItem">
      <div class="myInquiryItemTop">
        <span class="inquiryStatusBadge status-${escapeHtml(status)}">${escapeHtml(getInquiryStatusLabel(status))}</span>
        <em>${escapeHtml(formatDate(inquiry.createdAt || inquiry.created_at))}</em>
      </div>
      <strong>${escapeHtml(inquiry.title || "제목 없는 문의")}</strong>
      <p>${escapeHtml(getInquiryExcerpt(inquiry.message))}</p>
      <div class="myInquiryItemMeta"><span>${escapeHtml(getInquiryCategoryLabel(inquiry.category))}</span><span>ID ${escapeHtml(String(inquiry.id || "").slice(0, 8))}</span></div>
    </article>
  `;
}

const CONFIGS = {
  payments: {
    panelSelector: "[data-payment-history-panel]",
    listSelector: "[data-payment-history-list]",
    controlKey: "payment-history",
    viewLabel: "결제내역 보기",
    closeLabel: "결제내역 접기",
    loadingText: "결제내역 조회 중입니다.",
    emptyHtml: `<article class="paymentHistoryItem paymentHistoryItem--empty"><strong>아직 결제내역이 없습니다.</strong><p>Personal 구독 결제 후 이 영역에 결제내역이 표시됩니다.</p></article>`,
    errorHtml: `<article class="paymentHistoryItem paymentHistoryItem--empty"><strong>결제내역을 불러오지 못했습니다.</strong><p>잠시 후 다시 확인해 주세요.</p></article>`,
    fetcher: fetchFinplePaymentHistory,
    renderItem: renderPaymentItem,
  },
  inquiries: {
    panelSelector: "[data-my-inquiries-panel]",
    listSelector: "[data-my-inquiries-list]",
    controlKey: "my-inquiries",
    viewLabel: "문의내역 보기",
    closeLabel: "문의내역 접기",
    loadingText: "문의내역 조회 중입니다.",
    emptyHtml: `<article class="myInquiryItem myInquiryItem--empty"><strong>아직 접수된 문의내역이 없습니다.</strong><p>문의사항 화면에서 새 문의를 남길 수 있습니다.</p></article>`,
    errorHtml: `<article class="myInquiryItem myInquiryItem--empty"><strong>문의내역을 불러오지 못했습니다.</strong><p>잠시 후 다시 시도해 주세요.</p></article>`,
    fetcher: fetchMySupportInquiries,
    renderItem: renderInquiryItem,
  },
};

function getTotalPages(items) {
  return Math.max(1, Math.ceil((items?.length || 0) / PAGE_SIZE));
}

function getControlHtml(config) {
  return `
    <div class="historyPaginationToolbar" data-history-pagination-control="${config.controlKey}">
      <div class="historyPrimaryActions" data-history-primary-actions="${config.controlKey}">
        <button type="button" class="primaryButton historyToggleButton" data-history-toggle="${config.controlKey}">${escapeHtml(config.viewLabel)}</button>
      </div>
      <div class="historyPager" data-history-pager="${config.controlKey}" hidden>
        <button type="button" class="secondaryButton historyPagerButton" data-history-prev="${config.controlKey}">이전</button>
        <span data-history-page-label="${config.controlKey}">1 / 1</span>
        <button type="button" class="secondaryButton historyPagerButton" data-history-next="${config.controlKey}">다음</button>
      </div>
    </div>
  `;
}

function hideEmptyInquiryActionRow(panel) {
  const actionRow = panel?.querySelector(".serverStorageActions.compactActions");
  if (!actionRow) return;

  const hasVisibleButton = Array.from(actionRow.querySelectorAll("button")).some((button) => {
    if (button.matches("[data-my-inquiries-refresh]")) return false;
    if (button.hidden) return false;
    if (button.getAttribute("aria-hidden") === "true") return false;
    return button.offsetParent !== null;
  });

  if (!hasVisibleButton) {
    actionRow.hidden = true;
    actionRow.classList.add("historyEmptyActionRow");
  }
}

function alignInquirySupportButton(panel, control) {
  if (!panel || !control) return;

  const primaryActions = control.querySelector('[data-history-primary-actions="my-inquiries"]');
  const supportButton = panel.querySelector("[data-my-inquiries-support]");
  if (!primaryActions || !supportButton) return;

  if (!supportButton.classList.contains("historyInlineActionButton")) {
    supportButton.classList.add("historyInlineActionButton");
  }

  if (supportButton.parentNode !== primaryActions) {
    primaryActions.appendChild(supportButton);
  }

  hideEmptyInquiryActionRow(panel);
}

function ensureControl(type) {
  const config = CONFIGS[type];
  const panel = document.querySelector(config.panelSelector);
  const list = document.querySelector(config.listSelector);
  if (!panel || !list) return null;

  let control = panel.querySelector(`[data-history-pagination-control="${config.controlKey}"]`);
  if (!control) {
    list.insertAdjacentHTML("beforebegin", getControlHtml(config));
    control = panel.querySelector(`[data-history-pagination-control="${config.controlKey}"]`);
  }

  if (type === "inquiries") {
    alignInquirySupportButton(panel, control);
  }

  return { panel, list, control };
}

function renderList(type) {
  const config = CONFIGS[type];
  const state = historyStates[type];
  const refs = ensureControl(type);
  if (!refs) return;

  const { list, control } = refs;
  const toggleButton = control.querySelector(`[data-history-toggle="${config.controlKey}"]`);
  const pager = control.querySelector(`[data-history-pager="${config.controlKey}"]`);
  const pageLabel = control.querySelector(`[data-history-page-label="${config.controlKey}"]`);
  const prevButton = control.querySelector(`[data-history-prev="${config.controlKey}"]`);
  const nextButton = control.querySelector(`[data-history-next="${config.controlKey}"]`);

  if (toggleButton) {
    toggleButton.textContent = state.isOpen ? config.closeLabel : config.viewLabel;
    toggleButton.setAttribute("aria-expanded", state.isOpen ? "true" : "false");
  }

  list.hidden = !state.isOpen;
  list.classList.toggle("historyListCollapsed", !state.isOpen);

  const items = Array.isArray(state.items) ? state.items : [];
  const totalPages = getTotalPages(items);
  state.page = Math.max(0, Math.min(state.page, totalPages - 1));

  if (pager) pager.hidden = !state.isOpen || totalPages <= 1;
  if (pageLabel) pageLabel.textContent = `${state.page + 1} / ${totalPages}`;
  if (prevButton) prevButton.disabled = state.loading || state.page <= 0;
  if (nextButton) nextButton.disabled = state.loading || state.page >= totalPages - 1;

  if (!state.isOpen) {
    return;
  }

  if (state.loading) {
    setHtml(list, `<article class="paymentHistoryItem paymentHistoryItem--empty historyLoadingItem"><strong>${escapeHtml(config.loadingText)}</strong></article>`);
    return;
  }

  if (state.error) {
    setHtml(list, config.errorHtml);
    return;
  }

  if (!items.length) {
    setHtml(list, config.emptyHtml);
    return;
  }

  const start = state.page * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);
  setHtml(list, pageItems.map(config.renderItem).join(""));
}

async function loadItems(type, options = {}) {
  const state = historyStates[type];
  const config = CONFIGS[type];
  if (state.loading) return;
  if (state.items && !options.force) {
    renderList(type);
    return;
  }

  state.loading = true;
  state.error = "";
  renderList(type);

  try {
    const payload = await config.fetcher();
    state.items = Array.isArray(payload) ? payload : [];
    state.page = 0;
  } catch (error) {
    state.items = [];
    state.error = error?.message || "내역을 확인하지 못했습니다.";
  } finally {
    state.loading = false;
    renderList(type);
  }
}

function bindControl(type) {
  const config = CONFIGS[type];
  const refs = ensureControl(type);
  if (!refs) return;

  const { control } = refs;
  if (control.getAttribute("data-history-pagination-wired") === "true") return;
  control.setAttribute("data-history-pagination-wired", "true");

  control.querySelector(`[data-history-toggle="${config.controlKey}"]`)?.addEventListener("click", () => {
    const state = historyStates[type];
    state.isOpen = !state.isOpen;
    if (state.isOpen) loadItems(type);
    else renderList(type);
  });

  control.querySelector(`[data-history-prev="${config.controlKey}"]`)?.addEventListener("click", () => {
    const state = historyStates[type];
    state.page = Math.max(0, state.page - 1);
    renderList(type);
  });

  control.querySelector(`[data-history-next="${config.controlKey}"]`)?.addEventListener("click", () => {
    const state = historyStates[type];
    state.page = Math.min(getTotalPages(state.items) - 1, state.page + 1);
    renderList(type);
  });
}

function applyHistoryPaginationPatch() {
  if (!isMyPagePath()) return;
  ["payments", "inquiries"].forEach((type) => {
    bindControl(type);
    renderList(type);
  });
}

function bootHistoryPaginationPatch() {
  [420, 900, 1600, 2600, 3800].forEach((delay) => window.setTimeout(applyHistoryPaginationPatch, delay));
  window.addEventListener("click", () => window.setTimeout(applyHistoryPaginationPatch, 80), true);
  window.addEventListener("popstate", () => window.setTimeout(applyHistoryPaginationPatch, 160));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(applyHistoryPaginationPatch, 180));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootHistoryPaginationPatch, { once: true });
  else bootHistoryPaginationPatch();
}

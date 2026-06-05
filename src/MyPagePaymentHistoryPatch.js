import { fetchFinplePaymentHistory } from "./PaymentHistoryClientPatch.js";

let paymentHistoryRequested = false;
let paymentHistoryState = { loading: false, payments: [], error: "" };

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

function setText(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) node.textContent = nextValue;
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

function getStatusLabel(status) {
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

function getPanelHtml() {
  return `
    <section class="accountCard paymentHistoryPanel" data-payment-history-panel data-mypage-panel-key="payment-history">
      <div class="serverStorageHeader">
        <div><p class="accountMiniLabel">Payment History</p><h2>결제내역</h2><p>FINPLE 구독 결제 이력과 영수증 링크를 확인합니다.</p></div>
        <span class="serverStatusBadge ready" data-payment-history-badge>확인 중</span>
      </div>
      <div class="paymentMethodEntryGrid paymentHistorySummaryGrid">
        <div><span>전체 결제</span><strong data-payment-history-total>확인 중</strong></div>
        <div><span>최근 결제</span><strong data-payment-history-latest>확인 중</strong></div>
        <div><span>최근 금액</span><strong data-payment-history-amount>확인 중</strong></div>
      </div>
      <p class="serverStorageMessage compact paymentMethodEntryMessage" data-payment-history-message>결제내역을 확인하고 있습니다.</p>
      <div class="paymentHistoryList" data-payment-history-list>
        <article class="paymentHistoryItem paymentHistoryItem--empty"><strong>결제내역을 불러오기 전입니다.</strong></article>
      </div>
    </section>
  `;
}

function getPaymentListHtml(payments) {
  if (!payments.length) {
    return `<article class="paymentHistoryItem paymentHistoryItem--empty"><strong>아직 결제내역이 없습니다.</strong><p>Personal 구독 결제 후 이 영역에 결제내역이 표시됩니다.</p></article>`;
  }

  return payments.slice(0, 10).map((payment) => {
    const status = String(payment.status || "pending").toLowerCase();
    const receipt = payment.receiptUrl
      ? `<a href="${escapeHtml(payment.receiptUrl)}" target="_blank" rel="noopener noreferrer">영수증 보기</a>`
      : `<span>영수증 없음</span>`;

    return `
      <article class="paymentHistoryItem">
        <div class="paymentHistoryItemTop">
          <span class="paymentStatusBadge status-${escapeHtml(status)}">${escapeHtml(getStatusLabel(status))}</span>
          <em>${escapeHtml(formatDate(payment.paidAt || payment.createdAt))}</em>
        </div>
        <strong>${escapeHtml(payment.title || "FINPLE 결제")}</strong>
        <p>${escapeHtml(formatAmount(payment.amount, payment.currency))}</p>
        <div class="paymentHistoryItemMeta"><span>${escapeHtml(payment.provider || "toss-payments")}</span>${receipt}</div>
      </article>
    `;
  }).join("") + (payments.length > 10 ? `<p class="serverPortfolioMore">외 ${payments.length - 10}건은 서버에 보관 중입니다.</p>` : "");
}

function updatePaymentHistoryUi() {
  const badge = document.querySelector("[data-payment-history-badge]");
  const total = document.querySelector("[data-payment-history-total]");
  const latest = document.querySelector("[data-payment-history-latest]");
  const amount = document.querySelector("[data-payment-history-amount]");
  const message = document.querySelector("[data-payment-history-message]");
  const list = document.querySelector("[data-payment-history-list]");
  if (!badge || !total || !latest || !amount || !message || !list) return;

  if (paymentHistoryState.loading) {
    setText(badge, "조회 중");
    setText(total, "확인 중");
    setText(latest, "확인 중");
    setText(amount, "확인 중");
    setText(message, "결제내역을 불러오고 있습니다.");
    setHtml(list, `<article class="paymentHistoryItem paymentHistoryItem--empty"><strong>결제내역 조회 중입니다.</strong></article>`);
    return;
  }

  if (paymentHistoryState.error) {
    setText(badge, "확인 필요");
    setText(total, "-");
    setText(latest, "-");
    setText(amount, "-");
    setText(message, paymentHistoryState.error);
    setHtml(list, `<article class="paymentHistoryItem paymentHistoryItem--empty"><strong>결제내역을 불러오지 못했습니다.</strong><p>잠시 후 다시 확인해 주세요.</p></article>`);
    return;
  }

  const payments = Array.isArray(paymentHistoryState.payments) ? paymentHistoryState.payments : [];
  const first = payments[0];
  setText(badge, payments.length ? "조회됨" : "내역 없음");
  setText(total, `${payments.length}건`);
  setText(latest, first ? formatDate(first.paidAt || first.createdAt) : "없음");
  setText(amount, first ? formatAmount(first.amount, first.currency) : "없음");
  setText(message, payments.length ? "최근 결제내역을 최신순으로 표시합니다." : "아직 결제내역이 없습니다. 구독 결제 후 이 영역에 표시됩니다.");
  setHtml(list, getPaymentListHtml(payments));
}

async function loadPaymentHistory(options = {}) {
  if (!isMyPagePath() || paymentHistoryState.loading) return;
  if (paymentHistoryRequested && !options.force) { updatePaymentHistoryUi(); return; }
  paymentHistoryRequested = true;
  paymentHistoryState = { loading: true, payments: [], error: "" };
  updatePaymentHistoryUi();
  try {
    const payments = await fetchFinplePaymentHistory();
    paymentHistoryState = { loading: false, payments, error: "" };
  } catch (error) {
    paymentHistoryState = { loading: false, payments: [], error: error?.message || "결제내역을 확인하지 못했습니다." };
  }
  updatePaymentHistoryUi();
}

function ensurePaymentHistoryPanel() {
  if (document.querySelector("[data-payment-history-panel]")) return;
  const stack = document.querySelector(".accountPanelStack");
  if (!stack) return;
  const inquiryPanel = document.querySelector("[data-my-inquiries-panel]");
  const paymentMethodPanel = document.querySelector("[data-payment-method-panel]");
  const target = inquiryPanel || paymentMethodPanel;
  if (target?.parentNode) target.insertAdjacentHTML("afterend", getPanelHtml());
  else stack.insertAdjacentHTML("beforeend", getPanelHtml());
}

function ensurePaymentHistoryMenu() {
  const nav = document.querySelector(".myPageSidebarNav");
  if (!nav || nav.querySelector('[data-mypage-menu-key="payment-history"]')) return;
  const inquiryButton = nav.querySelector('[data-mypage-menu-key="inquiries"]');
  const buttonHtml = `<button type="button" data-mypage-menu-key="payment-history" data-payment-history-menu><span>결제내역</span><em>영수증·이력</em></button>`;
  if (inquiryButton) inquiryButton.insertAdjacentHTML("afterend", buttonHtml);
  else nav.insertAdjacentHTML("beforeend", buttonHtml);
}

function setPaymentHistoryActive() {
  document.querySelectorAll("[data-mypage-menu-key]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-mypage-menu-key") === "payment-history");
  });
  document.querySelectorAll(".accountPanelStack > [data-mypage-panel-key]").forEach((panel) => {
    const isActive = panel.getAttribute("data-mypage-panel-key") === "payment-history";
    panel.classList.toggle("myPagePanelActive", isActive);
    panel.classList.toggle("myPagePanelHidden", !isActive);
    panel.toggleAttribute("hidden", !isActive);
  });
  loadPaymentHistory();
}

function bindPaymentHistoryMenu() {
  const button = document.querySelector("[data-payment-history-menu]");
  if (!button || button.getAttribute("data-payment-history-wired") === "true") return;
  button.setAttribute("data-payment-history-wired", "true");
  button.addEventListener("click", () => setPaymentHistoryActive());
}

function applyPaymentHistoryPatch() {
  if (!isMyPagePath()) return;
  ensurePaymentHistoryPanel();
  ensurePaymentHistoryMenu();
  bindPaymentHistoryMenu();
  updatePaymentHistoryUi();
}

function bootPaymentHistoryPatch() {
  [160, 360, 800, 1400, 2400, 3200].forEach((delay) => window.setTimeout(applyPaymentHistoryPatch, delay));
  window.addEventListener("popstate", () => window.setTimeout(applyPaymentHistoryPatch, 120));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(applyPaymentHistoryPatch, 120));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootPaymentHistoryPatch, { once: true });
  else bootPaymentHistoryPatch();
}

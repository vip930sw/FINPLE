/* Step 111-12 - MY PAGE Payment Method display patch
   - 결제수단 패널의 보조 문구와 새로고침 버튼을 사용자 화면에서 정리합니다.
   - 카드번호 원문은 FINPLE 서버에 저장하지 않는다는 안내를 상단 설명에 포함합니다.
   - MutationObserver 없이 초기 타이머와 상태 변경 이벤트에서만 보정합니다.
*/

const PAYMENT_METHOD_STYLE_ID = "finple-payment-method-display-style";
let paymentMethodDisplayTimer = null;

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function setText(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) node.textContent = nextValue;
}

function ensurePaymentMethodDisplayStyle() {
  if (document.getElementById(PAYMENT_METHOD_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = PAYMENT_METHOD_STYLE_ID;
  style.textContent = `
    .paymentMethodEntryPanel [data-billing-method-refresh],
    .paymentMethodEntryPanel .paymentMethodEntryGrid em {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function applyPaymentMethodDisplayPatch() {
  if (!isMyPagePath()) return;

  ensurePaymentMethodDisplayStyle();

  const panel = document.querySelector("[data-payment-method-panel]");
  if (!panel) return;

  const title = panel.querySelector("h2");
  const description = title?.nextElementSibling;
  if (description?.tagName === "P") {
    setText(
      description,
      "자동결제에 사용할 결제수단을 등록하거나 변경하는 곳입니다. FINPLE은 카드번호 원문을 서버에 직접 저장하지 않습니다."
    );
  }

  const refreshButton = panel.querySelector("[data-billing-method-refresh]");
  if (refreshButton) {
    refreshButton.setAttribute("hidden", "true");
    refreshButton.classList.add("paymentMethodRefreshHidden");
  }

  panel.querySelectorAll(".paymentMethodEntryGrid em").forEach((node) => {
    node.setAttribute("hidden", "true");
    node.classList.add("paymentMethodMetaHidden");
  });
}

function schedulePaymentMethodDisplayPatch(delay = 120) {
  window.clearTimeout(paymentMethodDisplayTimer);
  paymentMethodDisplayTimer = window.setTimeout(applyPaymentMethodDisplayPatch, delay);
}

function bootPaymentMethodDisplayPatch() {
  [150, 350, 800, 1400, 2400].forEach((delay) => window.setTimeout(applyPaymentMethodDisplayPatch, delay));

  window.addEventListener("popstate", () => schedulePaymentMethodDisplayPatch(120));
  window.addEventListener("finple-auth-updated", () => schedulePaymentMethodDisplayPatch(160));
  window.addEventListener("finple-plan-updated", () => schedulePaymentMethodDisplayPatch(160));
  window.addEventListener("finple-local-storage-updated", () => schedulePaymentMethodDisplayPatch(160));
  window.addEventListener("storage", () => schedulePaymentMethodDisplayPatch(160));
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPaymentMethodDisplayPatch, { once: true });
  } else {
    bootPaymentMethodDisplayPatch();
  }
}

/* =========================================================
   Step 149 - Payment mode status patch
   Step 111-3 - Hide payment mode status from public pricing review screen
   - 결제 환경변수 준비 상태는 내부 점검용으로만 표시합니다.
========================================================= */

import { fetchPaymentHealth, getPaymentModeLabel, getTossPublicKeyStatus } from "./components/paymentModeClient";

let healthRequested = false;
let healthPayload = null;
let healthError = "";

function isPricingPage() {
  return window.location.pathname === "/pricing";
}

function isPaymentModeDebugVisible() {
  const params = new URLSearchParams(window.location.search || "");
  return params.get("finplePaymentDebug") === "1";
}

function getModeBox() {
  return document.querySelector("[data-payment-mode-box]");
}

function removeModeBox() {
  getModeBox()?.remove();
}

function injectModeStyle() {
  if (document.getElementById("finple-payment-mode-style")) return;

  const style = document.createElement("style");
  style.id = "finple-payment-mode-style";
  style.textContent = `
    .paymentModeBox {
      max-width: 760px;
      margin-top: 16px;
      padding: 14px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #ffffff;
    }
    .paymentModeBox h3 {
      margin: 0 0 10px;
      color: #0f172a;
      font-size: 14px;
      font-weight: 900;
    }
    .paymentModeGrid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .paymentModeGrid div {
      padding: 10px 12px;
      border-radius: 12px;
      background: #f8fafc;
    }
    .paymentModeGrid span {
      display: block;
      margin-bottom: 5px;
      color: #64748b;
      font-size: 11px;
      font-weight: 900;
    }
    .paymentModeGrid strong {
      color: #0f172a;
      font-size: 13px;
      font-weight: 900;
    }
    .paymentModeWarning {
      margin: 10px 0 0;
      color: #475569;
      font-size: 12px;
      font-weight: 800;
      line-height: 1.6;
    }
    @media (max-width: 720px) {
      .paymentModeGrid { grid-template-columns: 1fr; }
    }
  `;

  document.head.appendChild(style);
}

function getModeHtml() {
  return `
    <div class="paymentModeBox" data-payment-mode-box>
      <h3>결제 연동 상태</h3>
      <div class="paymentModeGrid">
        <div><span>현재 모드</span><strong data-payment-mode-label>확인 중</strong></div>
        <div><span>프론트 공개키</span><strong data-payment-public-key>확인 중</strong></div>
        <div><span>서버 Secret Key</span><strong data-payment-secret-key>확인 중</strong></div>
        <div><span>Webhook Secret</span><strong data-payment-webhook-key>확인 중</strong></div>
      </div>
      <p class="paymentModeWarning" data-payment-mode-message>결제 환경변수 상태를 확인하고 있습니다.</p>
    </div>
  `;
}

function setText(node, value) {
  if (!node) return;
  const next = String(value ?? "");
  if (node.textContent !== next) node.textContent = next;
}

function updateModeBox() {
  const box = getModeBox();
  if (!box) return;

  const publicStatus = getTossPublicKeyStatus();
  const serverMode = healthPayload?.mode || publicStatus.mode || "stub";

  setText(box.querySelector("[data-payment-mode-label]"), getPaymentModeLabel(serverMode));
  setText(box.querySelector("[data-payment-public-key]"), publicStatus.hasPublicKey ? "설정됨" : "미설정");
  setText(box.querySelector("[data-payment-secret-key]"), healthPayload?.tossConfigured ? "설정됨" : "미설정");
  setText(box.querySelector("[data-payment-webhook-key]"), healthPayload?.webhookConfigured ? "설정됨" : "미설정");

  const message = healthError
    || healthPayload?.warnings?.[0]
    || (publicStatus.checkoutClientReady ? "프론트 테스트 키가 준비되었습니다. 서버 설정까지 확인되면 테스트 결제 연결이 가능합니다." : "현재는 준비 중 모드입니다. 테스트 키 입력 전까지 실제 결제창으로 이동하지 않습니다.");

  setText(box.querySelector("[data-payment-mode-message]"), message);
}

async function requestPaymentHealthOnce() {
  if (healthRequested) return;

  healthRequested = true;
  healthError = "";
  updateModeBox();

  try {
    healthPayload = await fetchPaymentHealth();
  } catch (error) {
    healthPayload = null;
    healthError = error?.message || "결제 환경변수 상태를 확인하지 못했습니다.";
  }

  updateModeBox();
}

function upsertModeBox() {
  if (!isPricingPage()) {
    removeModeBox();
    return;
  }

  if (!isPaymentModeDebugVisible()) {
    removeModeBox();
    return;
  }

  if (getModeBox()) return;

  const statusNode = document.querySelector("[data-billing-status]");
  if (!statusNode?.parentNode) return;

  injectModeStyle();
  statusNode.insertAdjacentHTML("afterend", getModeHtml());
  updateModeBox();
  requestPaymentHealthOnce();
}

function bootPaymentModePatch() {
  const observer = new MutationObserver(() => upsertModeBox());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(upsertModeBox, 200);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPaymentModePatch, { once: true });
  } else {
    bootPaymentModePatch();
  }
}

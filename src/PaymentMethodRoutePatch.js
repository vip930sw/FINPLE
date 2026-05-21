/* =========================================================
   Step 167C - Recurring payment method setup route patch
   - 자동결제 결제수단 등록 준비와 Toss 등록창 열기를 하나의 버튼으로 통합합니다.
   - orderId/customerKey/successUrl 등 사용자가 알 필요 없는 기술 항목은 화면에서 숨깁니다.
   - 취소/오류 문구는 연두색 안내 박스 안에서 붉은 글씨로만 표시합니다.
   - 실제 billingKey 발급/저장은 Step 168 이후 연결합니다.
========================================================= */

import { prepareBillingAuth, requestTossBillingAuth } from "./components/paymentMethodClient";

const PAYMENT_METHOD_PATHS = new Set([
  "/payment-method/setup",
  "/payment-method/success",
  "/payment-method/fail",
]);

let billingAuthError = "";
let isStartingBillingAuth = false;

function normalizePathname(pathname) {
  return String(pathname || "/").replace(/\/+$/, "") || "/";
}

function navigateTo(path) {
  window.location.href = path;
}

function getQueryValue(key) {
  return new URLSearchParams(window.location.search).get(key) || "";
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

function getPageCopy(path) {
  if (path === "/payment-method/success") {
    return {
      eyebrow: "Payment Method",
      title: "결제수단 등록이 완료되었습니다.",
      description: "자동결제 결제수단 등록 성공 후 표시될 화면입니다. 다음 단계에서 등록 결과 검증과 저장 로직을 연결합니다.",
      tone: "success",
      badge: "SETUP SUCCESS",
      statusLabel: "등록 완료",
    };
  }

  if (path === "/payment-method/fail") {
    return {
      eyebrow: "Payment Method",
      title: "결제수단 등록을 완료하지 못했습니다.",
      description: "사용자 취소, 인증 실패, 카드 확인 실패 등의 상황에서 표시될 화면입니다.",
      tone: "danger",
      badge: "SETUP FAILED",
      statusLabel: "등록 실패",
    };
  }

  return {
    eyebrow: "Recurring Billing Setup",
    title: "자동결제 결제수단 등록",
    description: "FINPLE Personal 월 구독 자동결제를 위한 결제수단 등록 화면입니다. 카드번호는 FINPLE 서버에 직접 저장하지 않습니다.",
    tone: "neutral",
    badge: "STEP 167",
    statusLabel: "등록 준비 중",
  };
}

function getSetupStatusMessage() {
  if (isStartingBillingAuth) return "자동결제 등록창을 준비하고 있습니다.";
  if (billingAuthError) return billingAuthError;
  return "필수 확인 항목을 체크하면 자동결제 결제수단 등록을 시작할 수 있습니다.";
}

function updateSetupUi() {
  const root = document.getElementById("root");
  if (!root) return;

  const status = root.querySelector("[data-payment-method-status]");
  const statusBox = root.querySelector("[data-payment-method-status-box]");
  const startButton = root.querySelector("[data-payment-method-start]");
  const checkedCount = root.querySelectorAll("[data-payment-method-check]:checked").length;
  const allChecked = checkedCount >= 3;

  setText(status, getSetupStatusMessage());
  status?.classList.toggle("paymentMethodStatusText--error", Boolean(billingAuthError));
  statusBox?.classList.add("billingResultMessageBox--success");
  statusBox?.classList.remove("billingResultMessageBox--danger");

  if (startButton) {
    startButton.disabled = !allChecked || isStartingBillingAuth;
    setText(startButton, isStartingBillingAuth ? "등록창 준비 중" : "자동결제 결제수단 등록하기");
  }
}

async function handleStartBillingAuth() {
  if (isStartingBillingAuth) return;

  isStartingBillingAuth = true;
  billingAuthError = "";
  updateSetupUi();

  try {
    const preparePayload = await prepareBillingAuth();
    await requestTossBillingAuth(preparePayload);
  } catch (error) {
    isStartingBillingAuth = false;
    billingAuthError = error?.message || "자동결제 결제수단 등록을 시작하지 못했습니다.";
    updateSetupUi();
  }
}

function getSetupCardHtml() {
  return `
    <div class="paymentMethodNoticeGrid paymentMethodNoticeGrid--compact">
      <div>
        <span>월 구독 금액</span>
        <strong>월 9,900원</strong>
        <em>매월 자동결제 예정</em>
      </div>
      <div>
        <span>해지·실패 정책</span>
        <strong>종료일까지 이용</strong>
        <em>D+1 1회 재시도 후 Free 전환</em>
      </div>
    </div>

    <div class="paymentMethodChecklist">
      <label><input type="checkbox" data-payment-method-check /> 월 9,900원이 매월 자동결제되는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 결제 예정일 전 안내가 제공되며, 결제 실패 시 D+1 1회 재시도 후 Free로 전환될 수 있음을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 구독 해지 예약 시 이용기간 종료일까지 Personal 기능을 사용할 수 있고, 다음 결제부터 자동 갱신이 중단되는 점을 확인했습니다.</label>
    </div>

    <div class="billingResultMessageBox billingResultMessageBox--success paymentMethodMessageBox" data-payment-method-status-box>
      <strong>등록 안내</strong>
      <p data-payment-method-status>필수 확인 항목을 체크하면 자동결제 결제수단 등록을 시작할 수 있습니다.</p>
    </div>

    <ul class="billingResultBulletList paymentMethodUserNoticeList">
      <li>FINPLE은 카드번호 원문을 서버에 직접 저장하지 않습니다.</li>
      <li>등록 후 MY PAGE에서 결제수단, 다음 결제일, 해지 예약 상태를 확인할 수 있도록 연결할 예정입니다.</li>
    </ul>

    <div class="billingResultActions">
      <button type="button" class="primaryButton" data-payment-method-start disabled>자동결제 결제수단 등록하기</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/mypage">MY PAGE로 돌아가기</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/pricing">요금제 확인</button>
    </div>
  `;
}

function getResultCardHtml(path) {
  const message = getQueryValue("message");
  const code = getQueryValue("code");
  const isSuccess = path === "/payment-method/success";

  return `
    <div class="billingResultGrid">
      <div><span>상품</span><strong>FINPLE Personal</strong></div>
      <div><span>결제방식</span><strong>월 구독 자동결제</strong></div>
      <div><span>등록 상태</span><strong>${isSuccess ? "등록 인증 완료" : "등록 실패"}</strong></div>
      <div><span>다음 단계</span><strong>${isSuccess ? "서버 저장 확인" : "다시 등록"}</strong></div>
    </div>

    <div class="billingResultMessageBox ${isSuccess ? "billingResultMessageBox--success" : "billingResultMessageBox--danger"}">
      <strong>${isSuccess ? "결제수단 인증 완료" : escapeHtml(code || "등록 실패")}</strong>
      <p>${escapeHtml(message || (isSuccess ? "결제수단 인증이 완료되었습니다. 다음 단계에서 서버 저장을 연결합니다." : "결제수단 등록을 완료하지 못했습니다. 다시 시도하거나 문의해 주세요."))}</p>
    </div>

    <ul class="billingResultBulletList">
      <li>FINPLE은 카드번호 원문을 서버에 직접 저장하지 않습니다.</li>
      <li>등록된 결제수단은 MY PAGE에서 확인·변경할 수 있도록 연결할 예정입니다.</li>
      <li>정기결제 성공 시 다음 이용기간이 자동 연장됩니다.</li>
    </ul>

    <div class="billingResultActions">
      <button type="button" class="primaryButton" data-payment-method-nav="/mypage">MY PAGE 확인</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/payment-method/setup">결제수단 등록으로 이동</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/support">결제 문의</button>
    </div>
  `;
}

export function isPaymentMethodPath(pathname = window.location.pathname) {
  return PAYMENT_METHOD_PATHS.has(normalizePathname(pathname));
}

export function renderPaymentMethodPage() {
  const path = normalizePathname(window.location.pathname);
  if (!isPaymentMethodPath(path)) return false;

  const root = document.getElementById("root");
  if (!root) return false;

  const copy = getPageCopy(path);
  const isSetup = path === "/payment-method/setup";

  root.innerHTML = `
    <main class="accountPage billingResultPage paymentMethodPage">
      <header class="accountHeader">
        <button type="button" class="brandLogo resetButton" data-payment-method-nav="/">
          <div class="brandIcon"><span>F</span><i></i></div>
          <div class="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
        </button>
        <nav class="accountNav">
          <button type="button" data-payment-method-nav="/">홈</button>
          <button type="button" data-payment-method-nav="/simulator">시작하기</button>
          <button type="button" data-payment-method-nav="/pricing">요금제</button>
          <button type="button" data-payment-method-nav="/support">문의사항</button>
          <button type="button" data-payment-method-nav="/mypage">MY PAGE</button>
        </nav>
      </header>

      <section class="accountHero billingResultHero paymentMethodHero">
        <p class="sectionLabel">${copy.eyebrow}</p>
        <h1>${copy.title}</h1>
        <p>${copy.description}</p>
      </section>

      <section class="accountCard billingResultCard billingResultCard--${copy.tone} paymentMethodCard">
        <div class="billingResultStatusRow">
          <div><span>상태</span><strong>${copy.statusLabel}</strong></div>
          <em>${copy.badge}</em>
        </div>
        ${isSetup ? getSetupCardHtml() : getResultCardHtml(path)}
      </section>
    </main>
  `;

  root.querySelectorAll("[data-payment-method-nav]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-payment-method-nav") || "/"));
  });

  if (isSetup) {
    root.querySelectorAll("[data-payment-method-check]").forEach((checkbox) => {
      checkbox.addEventListener("change", updateSetupUi);
    });
    root.querySelector("[data-payment-method-start]")?.addEventListener("click", handleStartBillingAuth);
    updateSetupUi();
  }

  return true;
}
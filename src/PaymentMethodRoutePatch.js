/* =========================================================
   Step 167 - Recurring payment method setup route patch
   - 자동결제 결제수단 등록 준비 정보를 서버에서 생성합니다.
   - Toss Billing Auth 진입 버튼을 연결합니다.
   - 실제 billingKey 발급/저장은 Step 168 이후 연결합니다.
========================================================= */

import { prepareBillingAuth, requestTossBillingAuth } from "./components/paymentMethodClient";

const PAYMENT_METHOD_PATHS = new Set([
  "/payment-method/setup",
  "/payment-method/success",
  "/payment-method/fail",
]);

let billingAuthPayload = null;
let billingAuthError = "";
let isPreparingBillingAuth = false;
let isOpeningBillingAuth = false;

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
      description: "자동결제 결제수단 등록 성공 후 표시될 화면입니다. 다음 단계에서 PG 응답 검증과 저장 로직을 연결합니다.",
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
    description: "FINPLE Personal 월 구독 자동결제를 위한 결제수단 등록 화면입니다. 카드번호는 FINPLE 서버에 직접 저장하지 않고 PG 결제수단 참조값만 사용합니다.",
    tone: "neutral",
    badge: "STEP 167",
    statusLabel: "등록 준비 중",
  };
}

function getSetupStatusMessage() {
  if (isPreparingBillingAuth) return "서버에서 자동결제 등록 준비 정보를 생성하고 있습니다.";
  if (isOpeningBillingAuth) return "Toss 결제수단 등록창을 열고 있습니다.";
  if (billingAuthError) return billingAuthError;
  if (billingAuthPayload?.billingAuthAvailable) return "자동결제 결제수단 등록창을 열 준비가 완료되었습니다.";
  return "필수 확인 항목을 체크하면 자동결제 등록 준비 정보를 생성할 수 있습니다.";
}

function updateSetupUi() {
  const root = document.getElementById("root");
  if (!root) return;

  const status = root.querySelector("[data-payment-method-status]");
  const orderId = root.querySelector("[data-payment-method-order-id]");
  const customerKey = root.querySelector("[data-payment-method-customer-key]");
  const successUrl = root.querySelector("[data-payment-method-success-url]");
  const prepareButton = root.querySelector("[data-payment-method-prepare]");
  const openButton = root.querySelector("[data-payment-method-open]");
  const checkedCount = root.querySelectorAll("[data-payment-method-check]:checked").length;
  const allChecked = checkedCount >= 4;
  const hasPrepared = Boolean(billingAuthPayload?.billingAuthAvailable);

  setText(status, getSetupStatusMessage());
  status?.classList.toggle("billingResultMessageBox--danger", Boolean(billingAuthError));
  status?.classList.toggle("billingResultMessageBox--success", !billingAuthError && hasPrepared);
  setText(orderId, billingAuthPayload?.orderId || "준비 전");
  setText(customerKey, billingAuthPayload?.customerKey || "준비 전");
  setText(successUrl, billingAuthPayload?.successUrl ? "/payment-method/success" : "준비 전");

  if (prepareButton) {
    prepareButton.disabled = !allChecked || isPreparingBillingAuth || isOpeningBillingAuth;
    setText(prepareButton, isPreparingBillingAuth ? "준비 정보 생성 중" : hasPrepared ? "준비 정보 다시 생성" : "자동결제 등록 준비");
  }

  if (openButton) {
    openButton.disabled = !hasPrepared || isPreparingBillingAuth || isOpeningBillingAuth;
    setText(openButton, isOpeningBillingAuth ? "등록창 여는 중" : "Toss 결제수단 등록창 열기");
  }
}

async function handlePrepareBillingAuth() {
  if (isPreparingBillingAuth) return;

  isPreparingBillingAuth = true;
  billingAuthError = "";
  updateSetupUi();

  try {
    billingAuthPayload = await prepareBillingAuth();
  } catch (error) {
    billingAuthPayload = null;
    billingAuthError = error?.message || "자동결제 등록 준비 요청에 실패했습니다.";
  } finally {
    isPreparingBillingAuth = false;
    updateSetupUi();
  }
}

async function handleOpenBillingAuth() {
  if (isOpeningBillingAuth || !billingAuthPayload) return;

  isOpeningBillingAuth = true;
  billingAuthError = "";
  updateSetupUi();

  try {
    await requestTossBillingAuth(billingAuthPayload);
  } catch (error) {
    isOpeningBillingAuth = false;
    billingAuthError = error?.message || "Toss 결제수단 등록창을 열지 못했습니다.";
    updateSetupUi();
  }
}

function getSetupCardHtml() {
  return `
    <div class="paymentMethodNoticeGrid">
      <div>
        <span>월 구독 금액</span>
        <strong>월 9,900원</strong>
        <em>FINPLE Personal</em>
      </div>
      <div>
        <span>결제 예정 안내</span>
        <strong>D-3 사전 안내</strong>
        <em>이메일 / MY PAGE 우선</em>
      </div>
      <div>
        <span>실패 시 재시도</span>
        <strong>D+1 1회</strong>
        <em>추가 유예 없음</em>
      </div>
      <div>
        <span>해지 정책</span>
        <strong>종료일까지 이용</strong>
        <em>다음 결제 중단</em>
      </div>
    </div>

    <div class="paymentMethodChecklist">
      <label><input type="checkbox" data-payment-method-check /> 월 9,900원이 매월 자동결제되는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 결제 예정일 전 사전 안내가 제공되는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 구독 해지 예약 시 이용기간 종료일까지 Personal 기능을 사용할 수 있음을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 자동결제 실패 시 D+1 1회 재시도 후 Free로 전환될 수 있음을 확인했습니다.</label>
    </div>

    <div class="billingResultGrid paymentMethodPrepareGrid">
      <div><span>주문번호</span><strong data-payment-method-order-id>준비 전</strong></div>
      <div><span>Customer Key</span><strong data-payment-method-customer-key>준비 전</strong></div>
      <div><span>성공 경로</span><strong data-payment-method-success-url>준비 전</strong></div>
      <div><span>저장 방식</span><strong>PG 참조값 저장 예정</strong></div>
    </div>

    <div class="billingResultMessageBox billingResultMessageBox--success paymentMethodMessageBox">
      <strong>등록 준비 상태</strong>
      <p data-payment-method-status>필수 확인 항목을 체크하면 자동결제 등록 준비 정보를 생성할 수 있습니다.</p>
    </div>

    <div class="billingResultActions">
      <button type="button" class="secondaryButton" data-payment-method-prepare disabled>자동결제 등록 준비</button>
      <button type="button" class="primaryButton" data-payment-method-open disabled>Toss 결제수단 등록창 열기</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/mypage">MY PAGE로 돌아가기</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/pricing">요금제 확인</button>
    </div>
  `;
}

function getResultCardHtml(path) {
  const code = getQueryValue("code") || getQueryValue("authKey") || getQueryValue("customerKey");
  const message = getQueryValue("message");
  const orderId = getQueryValue("orderId");
  const isSuccess = path === "/payment-method/success";

  return `
    <div class="billingResultGrid">
      <div><span>상품</span><strong>FINPLE Personal</strong></div>
      <div><span>결제방식</span><strong>월 구독 자동결제</strong></div>
      <div><span>등록 상태</span><strong>${isSuccess ? "등록 완료" : "등록 실패"}</strong></div>
      <div><span>주문번호</span><strong>${escapeHtml(orderId || "확인 필요")}</strong></div>
    </div>

    <div class="billingResultMessageBox ${isSuccess ? "billingResultMessageBox--success" : "billingResultMessageBox--danger"}">
      <strong>${escapeHtml(code || (isSuccess ? "등록 완료" : "등록 실패"))}</strong>
      <p>${escapeHtml(message || (isSuccess ? "결제수단 인증이 완료되었습니다. 다음 단계에서 billingKey 발급과 서버 저장을 연결합니다." : "결제수단 등록 실패 사유가 여기에 표시됩니다."))}</p>
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
    root.querySelector("[data-payment-method-prepare]")?.addEventListener("click", handlePrepareBillingAuth);
    root.querySelector("[data-payment-method-open]")?.addEventListener("click", handleOpenBillingAuth);
    updateSetupUi();
  }

  return true;
}
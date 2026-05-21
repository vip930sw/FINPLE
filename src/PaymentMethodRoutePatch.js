/* =========================================================
   Step 165 - Recurring payment method setup route patch
   - 자동결제 결제수단 등록 준비 화면을 제공합니다.
   - 실제 PG 결제수단 등록 API는 Step 166 이후 연결합니다.
========================================================= */

const PAYMENT_METHOD_PATHS = new Set([
  "/payment-method/setup",
  "/payment-method/success",
  "/payment-method/fail",
]);

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
    title: "자동결제 결제수단 등록 준비",
    description: "FINPLE Personal 월 구독 자동결제를 위한 결제수단 등록 화면입니다. 카드번호는 FINPLE 서버에 직접 저장하지 않고 PG 결제수단 참조값만 사용합니다.",
    tone: "neutral",
    badge: "STEP 165",
    statusLabel: "등록 준비 중",
  };
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
      <label><input type="checkbox" disabled /> 월 9,900원이 매월 자동결제되는 점을 확인했습니다.</label>
      <label><input type="checkbox" disabled /> 결제 예정일 전 사전 안내가 제공되는 점을 확인했습니다.</label>
      <label><input type="checkbox" disabled /> 구독 해지 예약 시 이용기간 종료일까지 Personal 기능을 사용할 수 있음을 확인했습니다.</label>
      <label><input type="checkbox" disabled /> 자동결제 실패 시 D+1 1회 재시도 후 Free로 전환될 수 있음을 확인했습니다.</label>
    </div>

    <div class="billingResultMessageBox billingResultMessageBox--success paymentMethodMessageBox">
      <strong>다음 단계 연결 예정</strong>
      <p>현재 화면은 자동결제 등록 전 사전 고지와 흐름 확인용입니다. Step 166에서 PG 결제수단 등록 API를 연결합니다.</p>
    </div>

    <div class="billingResultActions">
      <button type="button" class="primaryButton" disabled>결제수단 등록 연동 준비 중</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/mypage">MY PAGE로 돌아가기</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/pricing">요금제 확인</button>
    </div>
  `;
}

function getResultCardHtml(path) {
  const code = getQueryValue("code");
  const message = getQueryValue("message");
  const isSuccess = path === "/payment-method/success";

  return `
    <div class="billingResultGrid">
      <div><span>상품</span><strong>FINPLE Personal</strong></div>
      <div><span>결제방식</span><strong>월 구독 자동결제</strong></div>
      <div><span>등록 상태</span><strong>${isSuccess ? "등록 완료" : "등록 실패"}</strong></div>
      <div><span>다음 단계</span><strong>${isSuccess ? "서버 저장 확인" : "다시 등록"}</strong></div>
    </div>

    <div class="billingResultMessageBox ${isSuccess ? "billingResultMessageBox--success" : "billingResultMessageBox--danger"}">
      <strong>${escapeHtml(code || (isSuccess ? "등록 완료" : "등록 실패"))}</strong>
      <p>${escapeHtml(message || (isSuccess ? "결제수단 등록 후 서버 저장 결과가 여기에 표시됩니다." : "결제수단 등록 실패 사유가 여기에 표시됩니다."))}</p>
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

  return true;
}
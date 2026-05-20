/* =========================================================
   Step 141 - Billing Result Route Patch
   Step 141B - Render before React app fallback
   - Toss Payments 실제 연동 전 결제 성공/실패/취소 화면을 제공합니다.
   - App.jsx를 크게 건드리지 않기 위해 main.jsx에서 조건부 렌더링합니다.
========================================================= */

const RESULT_COPY = {
  "/billing/success": {
    eyebrow: "Billing Success",
    title: "결제 요청이 접수되었습니다.",
    description:
      "현재는 Toss Payments 테스트 연동 전 준비 화면입니다. 실제 결제 승인과 Personal 권한 반영은 서버 결제 API 연결 이후 자동 처리됩니다.",
    tone: "success",
    statusLabel: "승인 확인 대기",
    badge: "TEST FLOW",
    bullets: [
      "결제 승인 API 연결 후 payments와 subscriptions에 기록됩니다.",
      "승인 완료 시 user_entitlements가 Personal 권한으로 전환됩니다.",
      "고객 카드번호는 FINPLE 서버에 직접 저장하지 않습니다.",
    ],
  },
  "/billing/fail": {
    eyebrow: "Billing Failed",
    title: "결제를 완료하지 못했습니다.",
    description:
      "결제 실패 또는 승인 오류가 발생한 경우입니다. 실제 PG 연동 후에는 실패 사유와 재시도 안내를 더 구체적으로 표시합니다.",
    tone: "danger",
    statusLabel: "결제 실패",
    badge: "BILLING FLOW",
    bullets: [
      "카드 한도, 인증 실패, 사용자가 입력한 결제정보 오류 등이 원인일 수 있습니다.",
      "현재 플랜과 기존 저장 데이터는 변경되지 않습니다.",
      "문제가 반복되면 결제 문의로 접수해 주세요.",
    ],
  },
  "/billing/cancel": {
    eyebrow: "Billing Canceled",
    title: "결제가 취소되었습니다.",
    description:
      "사용자가 결제창을 닫거나 결제 진행을 중단한 경우입니다. 취소 상태에서는 과금과 권한 변경이 발생하지 않습니다.",
    tone: "neutral",
    statusLabel: "사용자 취소",
    badge: "BILLING FLOW",
    bullets: [
      "결제 취소 시 Personal 권한은 부여되지 않습니다.",
      "필요하면 요금제 페이지에서 다시 결제를 진행할 수 있습니다.",
      "베타 기간에는 무료 체험 흐름을 계속 사용할 수 있습니다.",
    ],
  },
};

function normalizePathname(pathname) {
  return String(pathname || "/").replace(/\/+$/, "") || "/";
}

function getQueryValue(key) {
  return new URLSearchParams(window.location.search).get(key) || "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAmount(value) {
  const number = Number(String(value || "").replace(/,/g, ""));
  if (!Number.isFinite(number) || number <= 0) return "월 9,900원";
  return `${number.toLocaleString("ko-KR")}원`;
}

function navigateTo(path) {
  window.location.href = path;
}

export function isBillingResultPath(pathname = window.location.pathname) {
  return Boolean(RESULT_COPY[normalizePathname(pathname)]);
}

export function renderBillingResultPage() {
  const path = normalizePathname(window.location.pathname);
  const copy = RESULT_COPY[path];
  if (!copy) return false;

  const root = document.getElementById("root");
  if (!root) return false;

  const orderId = getQueryValue("orderId") || getQueryValue("order_id") || "결제 API 연결 후 표시";
  const amount = formatAmount(getQueryValue("amount"));
  const code = getQueryValue("code");
  const message = getQueryValue("message");

  root.innerHTML = `
    <main class="accountPage billingResultPage">
      <header class="accountHeader">
        <button type="button" class="brandLogo resetButton" data-billing-nav="/">
          <div class="brandIcon"><span>F</span><i></i></div>
          <div class="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
        </button>
        <nav class="accountNav">
          <button type="button" data-billing-nav="/">홈</button>
          <button type="button" data-billing-nav="/simulator">시작하기</button>
          <button type="button" data-billing-nav="/pricing">요금제</button>
          <button type="button" data-billing-nav="/support">문의사항</button>
          <button type="button" data-billing-nav="/mypage">MY PAGE</button>
        </nav>
      </header>

      <section class="accountHero billingResultHero">
        <p class="sectionLabel">${copy.eyebrow}</p>
        <h1>${copy.title}</h1>
        <p>${copy.description}</p>
      </section>

      <section class="accountCard billingResultCard billingResultCard--${copy.tone}">
        <div class="billingResultStatusRow">
          <div><span>상태</span><strong>${copy.statusLabel}</strong></div>
          <em>${copy.badge}</em>
        </div>

        <div class="billingResultGrid">
          <div><span>상품</span><strong>FINPLE Personal</strong></div>
          <div><span>예상 금액</span><strong>${amount}</strong></div>
          <div><span>주문번호</span><strong>${escapeHtml(orderId)}</strong></div>
          <div><span>처리 방식</span><strong>월 구독 / 정기결제</strong></div>
        </div>

        ${code || message ? `
          <div class="billingResultMessageBox">
            <strong>${escapeHtml(code || "PG 메시지")}</strong>
            <p>${escapeHtml(message || "결제 처리 중 메시지가 전달되었습니다.")}</p>
          </div>
        ` : ""}

        <ul class="billingResultBulletList">
          ${copy.bullets.map((item) => `<li>${item}</li>`).join("")}
        </ul>

        <div class="billingResultActions">
          <button type="button" class="primaryButton" data-billing-nav="/pricing">요금제로 돌아가기</button>
          <button type="button" class="secondaryButton" data-billing-nav="/mypage">MY PAGE 확인</button>
          <button type="button" class="secondaryButton" data-billing-nav="/support">결제 문의</button>
        </div>
      </section>
    </main>
  `;

  root.querySelectorAll("[data-billing-nav]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-billing-nav") || "/"));
  });

  return true;
}

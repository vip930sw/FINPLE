/* =========================================================
   Step 141 - Billing Result Route Patch
   Step 141B - Render before React app fallback
   Step 152 - Confirm Toss payment from success page
   - Toss Payments 결제 성공/실패/취소 화면을 제공합니다.
   - App.jsx를 크게 건드리지 않기 위해 main.jsx에서 조건부 렌더링합니다.
========================================================= */

import { confirmTossPayment, getBillingSuccessParams, hasBillingConfirmParams } from "./components/paymentConfirmClient";

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const RESULT_COPY = {
  "/billing/success": {
    eyebrow: "Billing Success",
    title: "결제 요청이 접수되었습니다.",
    description:
      "Toss Payments 테스트 결제 요청이 접수되었습니다. 서버 승인 확인 결과에 따라 상태가 갱신됩니다.",
    tone: "success",
    statusLabel: "승인 확인 중",
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

function isLoggedIn() {
  try {
    return Boolean(JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null")?.id);
  } catch {
    return false;
  }
}

function handleLogout() {
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.dispatchEvent(new Event("finple-auth-updated"));
  window.dispatchEvent(new Event("finple-local-storage-updated"));
  navigateTo("/");
}

function setText(node, value) {
  if (!node) return;
  node.textContent = String(value || "");
}

function getSiteFooterHtml() {
  return `
    <footer class="footer siteFooter">
      <div class="siteFooterBrandBlock">
        <strong>FINPLE Portfolio Lab</strong>
        <span>© 2026 FINPLE.</span>
      </div>
      <p class="siteFooterNotice">
        FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며,<br />
        특정 금융상품의 매수·매도 추천이나 수익 보장을 의미하지 않습니다.
      </p>
      <nav class="siteFooterLinks" aria-label="FINPLE 정책 및 업데이트 링크">
        <a href="/updates">업데이트</a>
        <a href="/terms">이용약관</a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/refund">환불정책</a>
        <a href="/disclaimer">투자 유의사항</a>
      </nav>
    </footer>
  `;
}

function getGlobalHeaderHtml() {
  const loggedIn = isLoggedIn();

  return `
    <header class="header homeHeader siteHeader finpleUnifiedHeader" data-finple-global-nav-state="pricing|${loggedIn ? "in" : "out"}">
      <button type="button" class="brandLogo resetButton" data-billing-nav="/">
        <div class="brandIcon"><span>F</span><i></i></div>
        <div class="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
      </button>
      <div class="finpleHeaderLocalNav"></div>
      <nav class="finpleGlobalNav" aria-label="FINPLE 주요 메뉴" data-finple-global-nav>
        <button type="button" data-billing-nav="/">홈</button>
        <button type="button" class="finpleGlobalStartButton" data-billing-nav="/start">시작하기</button>
        <button type="button" class="active" data-billing-nav="/pricing">요금제</button>
        <button type="button" data-billing-nav="/support">문의사항</button>
        <button type="button" data-billing-nav="/mypage">MY PAGE</button>
        <button type="button" class="finpleGlobalAuthButton" data-billing-auth-action="${loggedIn ? "logout" : "login"}">${loggedIn ? "로그아웃" : "로그인"}</button>
      </nav>
    </header>
  `;
}

function updateConfirmStatus({ statusLabel, message, tone = "success", badge = "TEST FLOW" }) {
  const card = document.querySelector(".billingResultCard");
  const statusNode = document.querySelector("[data-billing-confirm-status]");
  const badgeNode = document.querySelector("[data-billing-confirm-badge]");
  const messageBox = document.querySelector("[data-billing-confirm-message]");

  setText(statusNode, statusLabel);
  setText(badgeNode, badge);

  if (messageBox) {
    messageBox.classList.remove("billingResultMessageBox--success", "billingResultMessageBox--danger");
    messageBox.classList.add(tone === "danger" ? "billingResultMessageBox--danger" : "billingResultMessageBox--success");
    messageBox.innerHTML = `<strong>${escapeHtml(statusLabel)}</strong><p>${escapeHtml(message)}</p>`;
  }

  if (card) {
    card.classList.remove("billingResultCard--success", "billingResultCard--danger", "billingResultCard--neutral");
    card.classList.add(`billingResultCard--${tone}`);
  }
}

async function confirmSuccessPaymentIfNeeded() {
  if (normalizePathname(window.location.pathname) !== "/billing/success") return;

  const params = getBillingSuccessParams();

  if (!hasBillingConfirmParams(params)) {
    updateConfirmStatus({
      statusLabel: "승인 정보 부족",
      message: "paymentKey, orderId, amount 중 일부가 없어 서버 승인 확인을 진행하지 못했습니다.",
      tone: "danger",
      badge: "CHECK NEEDED",
    });
    return;
  }

  updateConfirmStatus({
    statusLabel: "승인 확인 중",
    message: "FINPLE 서버에서 Toss 결제 승인 여부를 확인하고 있습니다.",
    tone: "success",
    badge: "CONFIRMING",
  });

  try {
    const result = await confirmTossPayment(params);
    updateConfirmStatus({
      statusLabel: "승인 확인 완료",
      message: result.message || "Toss 결제 승인이 확인되었습니다. Personal 권한 전환은 다음 단계에서 연결합니다.",
      tone: "success",
      badge: result.paymentStatus || "CONFIRMED",
    });
  } catch (error) {
    updateConfirmStatus({
      statusLabel: "승인 확인 실패",
      message: error?.message || "결제 승인 확인에 실패했습니다. 결제 문의로 접수해 주세요.",
      tone: "danger",
      badge: error?.code || "CONFIRM FAILED",
    });
  }
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
      ${getGlobalHeaderHtml()}

      <section class="accountHero billingResultHero">
        <p class="sectionLabel">${copy.eyebrow}</p>
        <h1>${copy.title}</h1>
        <p>${copy.description}</p>
      </section>

      <section class="accountCard billingResultCard billingResultCard--${copy.tone}">
        <div class="billingResultStatusRow">
          <div><span>상태</span><strong data-billing-confirm-status>${copy.statusLabel}</strong></div>
          <em data-billing-confirm-badge>${copy.badge}</em>
        </div>

        <div class="billingResultGrid">
          <div><span>상품</span><strong>FINPLE Personal</strong></div>
          <div><span>예상 금액</span><strong>${amount}</strong></div>
          <div><span>주문번호</span><strong>${escapeHtml(orderId)}</strong></div>
          <div><span>처리 방식</span><strong>월 구독 / 정기결제</strong></div>
        </div>

        <div class="billingResultMessageBox" data-billing-confirm-message>
          <strong>${escapeHtml(code || copy.statusLabel)}</strong>
          <p>${escapeHtml(message || "서버 승인 확인 결과가 여기에 표시됩니다.")}</p>
        </div>

        <ul class="billingResultBulletList">
          ${copy.bullets.map((item) => `<li>${item}</li>`).join("")}
        </ul>

        <div class="billingResultActions">
          <button type="button" class="primaryButton" data-billing-nav="/pricing">요금제로 돌아가기</button>
          <button type="button" class="secondaryButton" data-billing-nav="/mypage">MY PAGE 확인</button>
          <button type="button" class="secondaryButton" data-billing-nav="/support">결제 문의</button>
        </div>
      </section>
      ${getSiteFooterHtml()}
    </main>
  `;

  root.querySelectorAll("[data-billing-nav]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-billing-nav") || "/"));
  });
  root.querySelector("[data-billing-auth-action]")?.addEventListener("click", (event) => {
    const action = event.currentTarget.getAttribute("data-billing-auth-action");
    if (action === "logout") handleLogout();
    else navigateTo("/login");
  });

  window.setTimeout(confirmSuccessPaymentIfNeeded, 80);

  return true;
}

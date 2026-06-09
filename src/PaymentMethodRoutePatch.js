/* =========================================================
   Step 112 - Personal one-way recurring billing setup route
   - 자동결제 결제수단 등록과 첫 달 결제를 하나의 구독 시작 흐름으로 안내합니다.
   - success 페이지에서 authKey를 서버로 전달해 billingKey 발급, 첫 달 결제, Personal 활성화를 진행합니다.
========================================================= */

import { issueBillingKey, prepareBillingAuth, requestTossBillingAuth } from "./components/paymentMethodClient";

const PAYMENT_METHOD_PATHS = new Set([
  "/payment-method/setup",
  "/payment-method/success",
  "/payment-method/fail",
]);
const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";

let billingAuthError = "";
let isStartingBillingAuth = false;
let isIssuingBillingKey = false;
let billingIssueResult = null;
let billingIssueError = "";
let billingIssueStarted = false;

function normalizePathname(pathname) {
  return String(pathname || "/").replace(/\/+$/, "") || "/";
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

function setText(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) node.textContent = nextValue;
}

function getSiteFooterHtml() {
  return `
    <footer class="footer siteFooter">
      <div class="siteFooterBrandBlock">
        <strong>FINPLE Portfolio Lab</strong>
        <span>© 2026 FINPLE. Beta service.</span>
      </div>
      <p class="siteFooterNotice">
        FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며,
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
      <button type="button" class="brandLogo resetButton" data-payment-method-nav="/">
        <div class="brandIcon"><span>F</span><i></i></div>
        <div class="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
      </button>
      <div class="finpleHeaderLocalNav"></div>
      <nav class="finpleGlobalNav" aria-label="FINPLE 주요 메뉴" data-finple-global-nav>
        <button type="button" data-payment-method-nav="/">홈</button>
        <button type="button" class="finpleGlobalStartButton" data-payment-method-nav="/start">시작하기</button>
        <button type="button" class="active" data-payment-method-nav="/pricing">요금제</button>
        <button type="button" data-payment-method-nav="/support">문의사항</button>
        <button type="button" data-payment-method-nav="/mypage">MY PAGE</button>
        <button type="button" class="finpleGlobalAuthButton" data-payment-method-auth-action="${loggedIn ? "logout" : "login"}">${loggedIn ? "로그아웃" : "로그인"}</button>
      </nav>
    </header>
  `;
}

function getPageCopy(path) {
  if (path === "/payment-method/success") {
    return {
      eyebrow: "Personal Billing",
      title: "Personal 구독을 시작하고 있습니다.",
      description: "결제수단 인증 결과를 확인한 뒤 첫 달 결제와 Personal 활성화를 순서대로 처리합니다.",
      tone: "success",
      badge: "SUBSCRIPTION START",
      statusLabel: "처리 중",
    };
  }

  if (path === "/payment-method/fail") {
    return {
      eyebrow: "Personal Billing",
      title: "Personal 구독을 시작하지 못했습니다.",
      description: "사용자 취소, 인증 실패, 카드 확인 실패 등의 상황에서 표시될 화면입니다.",
      tone: "danger",
      badge: "SETUP FAILED",
      statusLabel: "실패",
    };
  }

  return {
    eyebrow: "Personal Billing",
    title: "Personal 구독 시작",
    description: "카드 인증 후 결제수단을 등록하고 첫 달 9,900원 결제를 진행합니다. 카드번호 원문은 FINPLE 서버에 직접 저장하지 않습니다.",
    tone: "neutral",
    badge: "월 자동결제",
    statusLabel: "시작 준비 중",
  };
}

function getSetupStatusMessage() {
  if (isStartingBillingAuth) return "Personal 구독 시작을 준비하고 있습니다.";
  if (billingAuthError) return billingAuthError;
  return "필수 확인 항목을 체크하면 Personal 구독 시작을 진행할 수 있습니다.";
}

function updateSetupUi() {
  const root = document.getElementById("root");
  if (!root) return;

  const status = root.querySelector("[data-payment-method-status]");
  const statusBox = root.querySelector("[data-payment-method-status-box]");
  const startButton = root.querySelector("[data-payment-method-start]");
  const checkboxes = root.querySelectorAll("[data-payment-method-check]");
  const checkedCount = root.querySelectorAll("[data-payment-method-check]:checked").length;
  const allChecked = checkboxes.length > 0 && checkedCount >= checkboxes.length;

  setText(status, getSetupStatusMessage());
  status?.classList.toggle("paymentMethodStatusText--error", Boolean(billingAuthError));
  statusBox?.classList.add("billingResultMessageBox--success");
  statusBox?.classList.remove("billingResultMessageBox--danger");

  if (startButton) {
    startButton.disabled = !allChecked || isStartingBillingAuth;
    setText(startButton, isStartingBillingAuth ? "구독 시작 준비 중" : "Personal 구독 시작하기");
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
    billingAuthError = error?.message || "Personal 구독 시작을 진행하지 못했습니다.";
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
        <span>구독 시작 방식</span>
        <strong>카드 인증 후 첫 결제</strong>
        <em>빌링키 등록 + 첫 달 결제</em>
      </div>
    </div>

    <div class="paymentMethodChecklist">
      <label><input type="checkbox" data-payment-method-check /> 카드 인증 후 첫 달 9,900원이 결제되고, 이후 매월 자동결제되는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> FINPLE은 카드번호 원문을 서버에 직접 저장하지 않고, 토스페이먼츠 자동결제용 식별값을 사용한다는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 구독 해지 예약 시 이용기간 종료일까지 Personal 기능을 사용할 수 있고, 다음 결제부터 자동 갱신이 중단되는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 구독 시작 후 즉시 기능이 제공되는 웹앱 특성상 결제 완료 후 단순 변심, 미사용, 부분 사용에 따른 금액 환불은 제한될 수 있다는 점을 확인했습니다.</label>
    </div>

    <div class="billingResultMessageBox billingResultMessageBox--success paymentMethodMessageBox" data-payment-method-status-box>
      <strong>구독 시작 및 환불 안내</strong>
      <p data-payment-method-status>필수 확인 항목을 체크하면 Personal 구독 시작을 진행할 수 있습니다.</p>
      <p>구독 취소는 다음 갱신 중단을 의미하며, 이미 결제된 이용기간은 종료일까지 제공됩니다. 디지털 기능 제공이 시작된 뒤에는 결제 금액 환불이 어려울 수 있습니다.</p>
    </div>

    <ul class="billingResultBulletList paymentMethodUserNoticeList">
      <li>카드 인증 성공 후 결제수단 등록과 첫 달 결제가 이어서 처리됩니다.</li>
      <li>Personal 기능 활성화 여부와 다음 결제 예정일은 MY PAGE에서 확인할 수 있습니다.</li>
      <li>서비스 장애나 중복 결제 등 회사 귀책 사유가 있는 경우에는 결제 문의를 통해 별도로 확인합니다.</li>
      <li>토스페이먼츠 테스트 환경에서는 실제 카드 청구가 발생하지 않습니다.</li>
    </ul>

    <div class="billingResultActions">
      <button type="button" class="primaryButton" data-payment-method-start disabled>Personal 구독 시작하기</button>
    </div>
  `;
}

function getSuccessStateLabel() {
  if (billingIssueResult?.subscriptionActivated) return "구독 시작 완료";
  if (billingIssueResult?.stored) return "결제수단 등록 완료";
  if (billingIssueError) return "확인 필요";
  return "처리 중";
}

function getSuccessMessage() {
  if (isIssuingBillingKey) return { title: "구독 시작 처리 중", message: "결제수단 등록, 첫 달 결제, Personal 활성화를 순서대로 확인하고 있습니다." };
  if (billingIssueResult?.subscriptionActivated) return { title: "Personal 구독 시작 완료", message: "결제수단 등록과 첫 달 결제가 완료되어 Personal 기능이 활성화되었습니다." };
  if (billingIssueResult?.stored) return { title: "결제수단 등록 완료", message: "결제수단은 등록되었지만 구독 활성화 상태를 다시 확인해 주세요." };
  if (billingIssueError) return { title: "구독 시작 확인 필요", message: billingIssueError };
  return { title: "결제수단 인증 완료", message: "구독 시작 처리를 준비하고 있습니다." };
}

function updateSuccessUi() {
  const root = document.getElementById("root");
  if (!root) return;

  const pageStatus = root.querySelector("[data-payment-method-page-status]");
  const statusTitle = root.querySelector("[data-payment-method-success-title]");
  const statusMessage = root.querySelector("[data-payment-method-success-message]");
  const statusBox = root.querySelector("[data-payment-method-success-box]");
  const statusLabel = root.querySelector("[data-payment-method-result-status]");
  const methodLabel = root.querySelector("[data-payment-method-display-label]");
  const nextStep = root.querySelector("[data-payment-method-next-step]");

  const stateLabel = getSuccessStateLabel();
  const copy = getSuccessMessage();
  setText(pageStatus, stateLabel);
  setText(statusTitle, copy.title);
  setText(statusMessage, copy.message);
  setText(statusLabel, stateLabel);
  setText(methodLabel, billingIssueResult?.method?.displayLabel || billingIssueResult?.storage?.displayLabel || "확인 중");
  setText(nextStep, billingIssueResult?.subscriptionActivated ? "MY PAGE 확인" : billingIssueError ? "다시 시도" : "처리 중");

  statusBox?.classList.toggle("billingResultMessageBox--success", !billingIssueError);
  statusBox?.classList.toggle("billingResultMessageBox--danger", Boolean(billingIssueError));
}

async function handleIssueBillingKeyFromSuccess() {
  if (billingIssueStarted || isIssuingBillingKey) return;

  const authKey = getQueryValue("authKey");
  const customerKey = getQueryValue("customerKey");
  const orderId = getQueryValue("orderId");

  if (!authKey) {
    billingIssueError = "Toss 결제수단 인증값이 없어 Personal 구독 시작을 진행할 수 없습니다.";
    updateSuccessUi();
    return;
  }

  billingIssueStarted = true;
  isIssuingBillingKey = true;
  billingIssueError = "";
  billingIssueResult = null;
  updateSuccessUi();

  try {
    billingIssueResult = await issueBillingKey({ authKey, orderId, customerKey });
  } catch (error) {
    billingIssueError = error?.message || "Personal 구독 시작 처리에 실패했습니다.";
  } finally {
    isIssuingBillingKey = false;
    updateSuccessUi();
  }
}

function getResultCardHtml(path) {
  const message = getQueryValue("message");
  const code = getQueryValue("code");
  const isSuccess = path === "/payment-method/success";

  if (isSuccess) {
    return `
      <div class="billingResultGrid">
        <div><span>상품</span><strong>FINPLE Personal</strong></div>
        <div><span>결제방식</span><strong>월 구독 자동결제</strong></div>
        <div><span>구독 상태</span><strong data-payment-method-result-status>처리 중</strong></div>
        <div><span>결제수단</span><strong data-payment-method-display-label>확인 중</strong></div>
      </div>

      <div class="billingResultMessageBox billingResultMessageBox--success" data-payment-method-success-box>
        <strong data-payment-method-success-title>결제수단 인증 완료</strong>
        <p data-payment-method-success-message>구독 시작 처리를 준비하고 있습니다.</p>
      </div>

      <ul class="billingResultBulletList">
        <li>FINPLE은 카드번호 원문을 서버에 직접 저장하지 않습니다.</li>
        <li>첫 달 결제 후 Personal 기능이 활성화됩니다.</li>
        <li>다음 결제 예정일과 해지 예약 상태는 MY PAGE에서 확인할 수 있습니다.</li>
      </ul>

      <div class="billingResultActions">
        <button type="button" class="primaryButton" data-payment-method-nav="/mypage">MY PAGE 확인</button>
        <button type="button" class="secondaryButton" data-payment-method-nav="/payment-method/setup">다시 시도</button>
        <button type="button" class="secondaryButton" data-payment-method-nav="/support">결제 문의</button>
      </div>
    `;
  }

  return `
    <div class="billingResultGrid">
      <div><span>상품</span><strong>FINPLE Personal</strong></div>
      <div><span>결제방식</span><strong>월 구독 자동결제</strong></div>
      <div><span>상태</span><strong>실패</strong></div>
      <div><span>다음 단계</span><strong>다시 시도</strong></div>
    </div>

    <div class="billingResultMessageBox billingResultMessageBox--danger">
      <strong>${escapeHtml(code || "구독 시작 실패")}</strong>
      <p>${escapeHtml(message || "Personal 구독 시작을 완료하지 못했습니다. 다시 시도하거나 문의해 주세요.")}</p>
    </div>

    <ul class="billingResultBulletList">
      <li>카드 인증을 취소했거나 인증에 실패한 경우에는 결제가 발생하지 않습니다.</li>
      <li>결제수단을 다시 확인한 뒤 Personal 구독 시작을 재시도할 수 있습니다.</li>
      <li>오류가 반복되면 결제 문의를 남겨 주세요.</li>
    </ul>

    <div class="billingResultActions">
      <button type="button" class="primaryButton" data-payment-method-nav="/payment-method/setup">다시 시도</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/mypage">MY PAGE 확인</button>
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
  const isSuccess = path === "/payment-method/success";

  root.innerHTML = `
    <main class="accountPage billingResultPage paymentMethodPage">
      ${getGlobalHeaderHtml()}

      <section class="accountHero billingResultHero paymentMethodHero">
        <p class="sectionLabel">${copy.eyebrow}</p>
        <h1>${copy.title}</h1>
        <p>${copy.description}</p>
      </section>

      <section class="accountCard billingResultCard billingResultCard--${copy.tone} paymentMethodCard">
        <div class="billingResultStatusRow">
          <div><span>상태</span><strong data-payment-method-page-status>${copy.statusLabel}</strong></div>
          <em>${copy.badge}</em>
        </div>
        ${isSetup ? getSetupCardHtml() : getResultCardHtml(path)}
      </section>
      ${getSiteFooterHtml()}
    </main>
  `;

  root.querySelectorAll("[data-payment-method-nav]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-payment-method-nav") || "/"));
  });
  root.querySelector("[data-payment-method-auth-action]")?.addEventListener("click", (event) => {
    const action = event.currentTarget.getAttribute("data-payment-method-auth-action");
    if (action === "logout") handleLogout();
    else navigateTo("/login");
  });

  if (isSetup) {
    root.querySelectorAll("[data-payment-method-check]").forEach((checkbox) => {
      checkbox.addEventListener("change", updateSetupUi);
    });
    root.querySelector("[data-payment-method-start]")?.addEventListener("click", handleStartBillingAuth);
    updateSetupUi();
  }

  if (isSuccess) {
    updateSuccessUi();
    handleIssueBillingKeyFromSuccess();
  }

  return true;
}

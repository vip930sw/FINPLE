/* =========================================================
   Step 112 - Personal one-way recurring billing setup route
   - 자동결제 결제수단 등록과 첫 달 결제를 하나의 구독 시작 흐름으로 안내합니다.
   - success 페이지에서 authKey를 서버로 전달해 billingKey 발급, 첫 달 결제, Personal 활성화를 진행합니다.
========================================================= */

import {
  issueBillingKey,
  issueBillingMethodUpdate,
  prepareBillingAuth,
  prepareBillingMethodUpdate,
  requestTossBillingAuth,
} from "./components/paymentMethodClient";
import { getFrontendPaymentMode } from "./components/paymentModeClient";

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
const ALREADY_PERSONAL_BILLING_MESSAGE = "이미 Personal 구독을 이용 중입니다. 현재 이용 기간 종료 전에는 추가 결제를 시작하지 않습니다.";
const BILLING_TIMEOUT_MESSAGE = "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.";

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

function getPaymentMethodMode() {
  return getQueryValue("mode") === "card_update" ? "card_update" : "subscription_start";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPolicyLinksHtml() {
  return `
    <nav class="paymentMethodPolicyLinks" aria-label="결제 관련 정책">
      <a href="/terms">이용약관</a>
      <a href="/privacy">개인정보처리방침</a>
      <a href="/refund">환불정책</a>
    </nav>
  `;
}

function getPaymentTestNoticeHtml() {
  if (getFrontendPaymentMode() !== "test") return "";
  return `
    <div class="billingResultMessageBox paymentMethodTestNotice" data-payment-test-notice>
      <strong>테스트 결제 안내</strong>
      <p>현재 화면은 토스페이먼츠 테스트 환경입니다. 실제 카드 청구는 발생하지 않습니다.</p>
    </div>
  `;
}

function formatServerDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function getSafeReceiptUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
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
        <span>© 2026 FINPLE.</span>
      </div>
      <div class="siteFooterBusinessInfo" data-site-business-info>
        <p><strong>상호명:</strong> 핀플Finple <span aria-hidden="true">|</span> <strong>대표자명:</strong> 이상원</p>
        <p><strong>사업자등록번호:</strong> 550-21-02319 <span aria-hidden="true">|</span> <strong>통신판매업 신고번호:</strong> 제2025-서울강남-02127호</p>
        <p><strong>사업장 주소:</strong> 서울특별시 강남구 테헤란로70길 12, 4층 402-343A호(대치동, H타워)</p>
        <p><strong>전화번호:</strong> <a href="tel:010-3354-1028">010-3354-1028</a> <span aria-hidden="true">|</span> <strong>이메일:</strong> <a href="mailto:finple_lab@naver.com">finple_lab@naver.com</a></p>
      </div>
      <p class="siteFooterNotice">
        FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며,<span class="siteFooterNoticeMobileSpace"> </span><br class="siteFooterNoticeBreak" />
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
    if (getPaymentMethodMode() === "card_update") {
      return {
        eyebrow: "Payment Method",
        title: "결제수단 등록/변경 완료",
        description: "자동결제에 사용할 결제수단 저장 결과를 확인합니다. 이 경로에서는 즉시 첫 결제가 실행되지 않습니다.",
        tone: "success",
        badge: "PAYMENT METHOD",
        statusLabel: "처리 중",
      };
    }

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

  if (path === "/payment-method/setup" && getPaymentMethodMode() === "card_update") {
    return {
      eyebrow: "Payment Method",
      title: "결제수단 등록/변경",
      description: "자동결제에 사용할 카드를 인증하고 저장합니다. 이 경로에서는 즉시 첫 결제나 구독 재생성을 실행하지 않습니다.",
      tone: "neutral",
      badge: "카드 등록/변경",
      statusLabel: "준비 중",
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
  if (getPaymentMethodMode() === "card_update") {
    if (isStartingBillingAuth) return "결제수단 등록/변경을 준비하고 있습니다.";
    if (billingAuthError) return billingAuthError;
    return "필수 확인 항목을 체크하면 결제수단 등록/변경을 진행할 수 있습니다.";
  }

  if (isStartingBillingAuth) return "구독 상태를 확인하고 있습니다.";
  if (billingAuthError) return billingAuthError;
  return "필수 확인 항목을 체크하면 Personal 구독 시작을 진행할 수 있습니다.";
}

function getSafeBillingStartErrorMessage(error) {
  if (
    error?.code === "ALREADY_PERSONAL_ACTIVE" ||
    error?.code === "ALREADY_SUBSCRIBED" ||
    error?.payload?.code === "ALREADY_PERSONAL_ACTIVE" ||
    error?.payload?.code === "ALREADY_SUBSCRIBED"
  ) {
    return ALREADY_PERSONAL_BILLING_MESSAGE;
  }

  if (error?.code === "REQUEST_TIMEOUT" || error?.name === "AbortError") return BILLING_TIMEOUT_MESSAGE;
  if (error?.code === "AUTH_REQUIRED") return "Personal 구독 시작을 위해 로그인이 필요합니다.";
  return "Personal 구독 시작을 진행하지 못했습니다. 잠시 후 다시 시도하거나 결제 문의를 이용해 주세요.";
}

function getStartButtonLabel() {
  if (isStartingBillingAuth) return "구독 상태 확인 중";
  if (billingAuthError === ALREADY_PERSONAL_BILLING_MESSAGE) return "이미 Personal 이용 중";
  if (billingAuthError) return "다시 시도";
  return "Personal 구독 시작하기";
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
    setText(startButton, getStartButtonLabel());
  }
}

async function handleStartBillingAuth() {
  if (isStartingBillingAuth) return;

  isStartingBillingAuth = true;
  billingAuthError = "";
  updateSetupUi();

  try {
    const isCardUpdate = getPaymentMethodMode() === "card_update";
    const preparePayload = isCardUpdate ? await prepareBillingMethodUpdate() : await prepareBillingAuth();
    if (preparePayload?.alreadySubscribed || preparePayload?.code === "ALREADY_PERSONAL_ACTIVE" || preparePayload?.code === "ALREADY_SUBSCRIBED") {
      billingAuthError = ALREADY_PERSONAL_BILLING_MESSAGE;
      isStartingBillingAuth = false;
      updateSetupUi();
      return;
    }
    await requestTossBillingAuth(preparePayload);
  } catch (error) {
    isStartingBillingAuth = false;
    billingAuthError = getSafeBillingStartErrorMessage(error);
    updateSetupUi();
  }
}

function getSetupCardHtml() {
  if (getPaymentMethodMode() === "card_update") {
    return `
    <div class="paymentMethodNoticeGrid paymentMethodNoticeGrid--compact">
      <div>
        <span>처리 방식</span>
        <strong>카드 인증</strong>
        <em>즉시 결제 없음</em>
      </div>
      <div>
        <span>저장 범위</span>
        <strong>자동결제 결제수단</strong>
        <em>카드번호 원문 저장 없음</em>
      </div>
    </div>

    <div class="paymentMethodChecklist">
      <label><input type="checkbox" data-payment-method-check /> 결제수단 등록/변경을 위해 카드 인증을 진행하며, 이 경로에서는 즉시 첫 결제가 실행되지 않는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> FINPLE은 카드번호 원문을 서버에 직접 저장하지 않고, 토스페이먼츠 자동결제용 식별값을 사용한다는 점을 확인했습니다.</label>
    </div>

    ${getPolicyLinksHtml()}
    ${getPaymentTestNoticeHtml()}

    <div class="billingResultMessageBox billingResultMessageBox--success paymentMethodMessageBox" data-payment-method-status-box>
      <strong>결제수단 등록/변경 안내</strong>
      <p data-payment-method-status>필수 확인 항목을 체크하면 결제수단 등록/변경을 진행할 수 있습니다.</p>
    </div>

    <div class="billingResultActions">
      <button type="button" class="primaryButton" data-payment-method-start disabled>결제수단 등록/변경</button>
    </div>
  `;
  }

  return `
    <div class="paymentMethodNoticeGrid paymentMethodNoticeGrid--compact">
      <div>
        <span>상품명</span>
        <strong>FINPLE Personal</strong>
        <em>디지털 구독 서비스</em>
      </div>
      <div>
        <span>결제금액</span>
        <strong>월 9,900원</strong>
        <em>부가세 포함</em>
      </div>
      <div>
        <span>자동결제 주기</span>
        <strong>매월 자동결제</strong>
        <em>해지 시 다음 결제일부터 중단</em>
      </div>
      <div>
        <span>서비스 제공기간</span>
        <strong>결제일로부터 1개월</strong>
        <em>결제 완료 즉시 Personal 활성화</em>
      </div>
    </div>

    <div class="paymentMethodChecklist">
      <label><input type="checkbox" data-payment-method-check /> FINPLE Personal은 월 9,900원이며, 결제일로부터 1개월 동안 제공되고 이후 매월 자동결제되는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> FINPLE은 카드번호 원문을 서버에 직접 저장하지 않고, 토스페이먼츠 자동결제용 식별값을 사용한다는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 구독 해지 예약 시 이용기간 종료일까지 Personal 기능을 사용할 수 있고, 다음 결제부터 자동 갱신이 중단되는 점을 확인했습니다.</label>
      <label><input type="checkbox" data-payment-method-check /> 결제 후 7일 이내이고 Personal 유료 기능 이용내역이 없으면 환불을 요청할 수 있다는 점을 확인했습니다.</label>
    </div>

    ${getPolicyLinksHtml()}

    <div class="billingResultMessageBox billingResultMessageBox--success paymentMethodMessageBox" data-payment-method-status-box>
      <strong>구독 시작 및 환불 안내</strong>
      <p data-payment-method-status>Personal 구독은 결제 완료 후 즉시 활성화됩니다.</p>
      <p>결제 후 7일 이내이고 Personal 유료 기능 이용내역이 없는 경우 환불을 요청할 수 있습니다. 그 밖의 환불 기준은 환불정책에서 확인할 수 있습니다.</p>
      <p>구독 해지는 다음 결제일부터 자동결제를 중단하며, 이미 결제된 이용기간은 종료일까지 제공됩니다.</p>
    </div>

    <ul class="billingResultBulletList paymentMethodUserNoticeList">
      <li>카드 인증 성공 후 결제수단 등록과 첫 달 결제가 이어서 처리됩니다.</li>
      <li>Personal 기능 활성화 여부와 다음 결제 예정일은 MY PAGE에서 확인할 수 있습니다.</li>
      <li>서비스 장애나 중복 결제 등 회사 귀책 사유가 있는 경우에는 결제 문의를 통해 별도로 확인합니다.</li>
    </ul>

    ${getPaymentTestNoticeHtml()}

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
  return { title: "서버 승인 확인 중", message: "서버의 첫 결제 승인과 Personal 활성화 결과를 확인하고 있습니다." };
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
  const nextPaymentRow = root.querySelector("[data-payment-method-next-payment-row]");
  const nextPaymentDate = root.querySelector("[data-payment-method-next-payment-date]");
  const paymentDateRow = root.querySelector("[data-payment-method-payment-date-row]");
  const paymentDate = root.querySelector("[data-payment-method-payment-date]");
  const receiptRow = root.querySelector("[data-payment-method-receipt-row]");
  const receiptLink = root.querySelector("[data-payment-method-receipt-link]");

  const stateLabel = getSuccessStateLabel();
  const copy = getSuccessMessage();
  setText(pageStatus, stateLabel);
  setText(statusTitle, copy.title);
  setText(statusMessage, copy.message);
  setText(statusLabel, stateLabel);
  setText(methodLabel, billingIssueResult?.storage?.displayLabel || billingIssueResult?.method?.displayLabel || "확인 중");
  setText(nextStep, billingIssueResult?.subscriptionActivated ? "MY PAGE 확인" : billingIssueError ? "다시 시도" : "처리 중");

  const serverNextPaymentDate = billingIssueResult?.nextPaymentDate || billingIssueResult?.storage?.validUntil || "";
  const serverPaymentDate = billingIssueResult?.paymentDate || billingIssueResult?.firstPayment?.approvedAt || "";
  const safeReceiptUrl = getSafeReceiptUrl(billingIssueResult?.receiptUrl || billingIssueResult?.firstPayment?.receiptUrl);
  setText(nextPaymentDate, formatServerDate(serverNextPaymentDate));
  setText(paymentDate, formatServerDate(serverPaymentDate));
  if (nextPaymentRow) nextPaymentRow.hidden = !serverNextPaymentDate;
  if (paymentDateRow) paymentDateRow.hidden = !serverPaymentDate;
  if (receiptRow) receiptRow.hidden = !safeReceiptUrl;
  if (receiptLink) {
    if (safeReceiptUrl) receiptLink.href = safeReceiptUrl;
    else receiptLink.removeAttribute("href");
  }

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
    const isCardUpdate = getPaymentMethodMode() === "card_update";
    billingIssueResult = isCardUpdate
      ? await issueBillingMethodUpdate({ authKey, orderId, customerKey })
      : await issueBillingKey({ authKey, orderId, customerKey });
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
        <div><span>결제금액</span><strong>9,900원</strong></div>
        <div><span>서비스 제공기간</span><strong>1개월</strong></div>
        <div><span>결제주기</span><strong>월 자동결제</strong></div>
        <div><span>구독 상태</span><strong data-payment-method-result-status>처리 중</strong></div>
        <div><span>결제수단</span><strong data-payment-method-display-label>확인 중</strong></div>
        <div data-payment-method-payment-date-row hidden><span>결제일</span><strong data-payment-method-payment-date></strong></div>
        <div data-payment-method-next-payment-row hidden><span>다음 결제 예정일</span><strong data-payment-method-next-payment-date></strong></div>
        <div data-payment-method-receipt-row hidden><span>영수증</span><strong><a data-payment-method-receipt-link target="_blank" rel="noopener noreferrer">영수증 보기</a></strong></div>
      </div>

      <div class="billingResultMessageBox billingResultMessageBox--success" data-payment-method-success-box>
        <strong data-payment-method-success-title>서버 승인 확인 중</strong>
        <p data-payment-method-success-message>서버의 첫 결제 승인과 Personal 활성화 결과를 확인하고 있습니다.</p>
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
        <div><span>결제금액</span><strong>9,900원 · 월 자동결제</strong></div>
        <div><span>상태</span><strong>실패</strong></div>
        <div><span>구독 상태</span><strong>미활성</strong></div>
    </div>

    <div class="billingResultMessageBox billingResultMessageBox--danger">
      <strong>${escapeHtml(code || "구독 시작 실패")}</strong>
      <p>${escapeHtml(message || "결제가 승인되지 않았으며 Personal 구독도 활성화되지 않았습니다. 다시 시도하거나 문의해 주세요.")}</p>
    </div>

    <ul class="billingResultBulletList">
      <li>사용자가 결제수단 인증을 취소했거나 인증에 실패한 경우 결제는 승인되지 않고 구독도 활성화되지 않습니다.</li>
      <li>결제수단을 다시 확인한 뒤 Personal 구독 시작을 재시도할 수 있습니다.</li>
      <li>오류가 반복되면 결제 문의를 남겨 주세요.</li>
    </ul>

    <div class="billingResultActions">
      <button type="button" class="primaryButton" data-payment-method-nav="/payment-method/setup">다시 시도</button>
      <button type="button" class="secondaryButton" data-payment-method-nav="/pricing">요금제로 돌아가기</button>
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
      ${isSetup ? "" : getPaymentTestNoticeHtml()}
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

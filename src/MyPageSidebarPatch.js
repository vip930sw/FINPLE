/* =========================================================
   Hotfix - MY PAGE single-card menu navigation patch
   - MY PAGE MutationObserver 반복 갱신을 중단해 무한로딩/렉을 방지합니다.
   - 내 투자성향 메뉴에서 최근 투자 MBTI 결과와 포트폴리오 비율을 다시 확인합니다.
   - 각 도구별 진입 링크를 분리합니다.
========================================================= */

import { fetchBillingMethodStatus } from "./components/paymentMethodClient";
import { fetchMySupportInquiries } from "./components/portfolio/services/serverPortfolioService";

const MBTI_PRESET_STORAGE_KEY = "finple-mbti-simulator-preset";
const ASSET_LABELS = {
  growthStock: "성장주",
  valueStock: "가치·배당",
  bond: "채권",
  reit: "리츠",
  gold: "금",
  crypto: "코인",
  cash: "현금",
};

const INQUIRY_CATEGORY_LABELS = {
  bug: "오류 신고",
  feature: "기능 제안",
  payment: "결제 문의",
  data: "데이터 문의",
  etc: "기타 문의",
};

const INQUIRY_STATUS_LABELS = {
  open: "접수됨",
  in_progress: "확인 중",
  resolved: "답변 완료",
  closed: "종료",
};

const MENU_ITEMS = [
  { key: "account", label: "계정 상태", description: "로그인·사용자", selector: ".accountStatusPanel" },
  { key: "investment-profile", label: "내 투자성향", description: "투자 MBTI", selector: "[data-investment-profile-panel]" },
  { key: "billing", label: "구독 / 결제", description: "플랜·해지", selector: "[data-subscription-status-panel]" },
  { key: "plan", label: "요금제 상태", description: "한도·권한", selector: ".planStatusPanel" },
  { key: "payment-method", label: "결제수단", description: "자동결제 등록", selector: "[data-payment-method-panel]" },
  { key: "inquiries", label: "내 문의내역", description: "접수·처리 현황", selector: "[data-my-inquiries-panel]" },
  { key: "storage", label: "서버 저장", description: "저장·불러오기", selector: ".serverStoragePanel" },
];

const STANDALONE_PANELS_TO_HIDE = [".adminInquiryPanel"];

let activeMenuKey = "account";
let isInvestmentResultOpen = false;
let billingMethodRequested = false;
let billingMethodState = { loading: false, registered: false, method: null, error: "" };
let myInquiriesRequested = false;
let myInquiriesState = { loading: false, inquiries: [], error: "" };

function isMyPagePath() { return window.location.pathname === "/mypage"; }
function navigateTo(path) { window.location.href = path; }
function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
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
function readJson(key) {
  try { return JSON.parse(window.localStorage.getItem(key) || "null"); } catch (error) { return null; }
}
function formatMbtiDate(value) {
  if (!value) return "저장일 없음";
  try { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); } catch (error) { return "저장일 없음"; }
}
function getPresetEntries(result) {
  const preset = result?.preset || result?.allocation || {};
  return Object.entries(preset)
    .map(([key, value]) => ({ key, label: ASSET_LABELS[key] || key, value: Number(value) }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value);
}
function getArrayItems(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}
function formatShortDate(value) {
  if (!value) return "일자 없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  } catch (error) {
    return "일자 없음";
  }
}
function getInquiryStatusLabel(status) {
  return INQUIRY_STATUS_LABELS[status] || status || "접수됨";
}
function getInquiryCategoryLabel(category) {
  return INQUIRY_CATEGORY_LABELS[category] || "기타 문의";
}
function getInquiryExcerpt(message = "") {
  const body = String(message || "")
    .split("--- 문의 메타 정보 ---")[0]
    .replace(/\s+/g, " ")
    .trim();
  if (!body) return "문의 내용 미리보기가 없습니다.";
  return body.length > 96 ? `${body.slice(0, 96)}…` : body;
}

function getInvestmentProfilePanelHtml() {
  return `
    <section class="accountCard investmentProfilePanel" data-investment-profile-panel data-mypage-panel-key="investment-profile">
      <div class="serverStorageHeader">
        <div>
          <p class="accountMiniLabel">Investment Profile</p>
          <h2>내 투자성향</h2>
          <p>최근 투자 MBTI 결과와 예시 포트폴리오 프리셋을 다시 확인합니다.</p>
        </div>
        <span class="serverStatusBadge ready" data-investment-profile-badge>확인 중</span>
      </div>
      <div class="paymentMethodEntryGrid investmentProfileGrid">
        <div><span>투자 MBTI</span><strong data-investment-profile-nickname>확인 중</strong><em data-investment-profile-created>최근 결과</em></div>
        <div><span>FINPLE 유형</span><strong data-investment-profile-type>확인 중</strong><em>성향 분류</em></div>
        <div><span>위험성향</span><strong data-investment-profile-risk>확인 중</strong><em>참고용</em></div>
      </div>
      <p class="serverStorageMessage compact paymentMethodEntryMessage" data-investment-profile-message>투자 MBTI 결과를 확인하고 있습니다.</p>
      <div class="investmentProfileResultBox" data-investment-profile-result-box hidden>
        <div class="investmentProfileResultHeader">
          <strong data-investment-profile-summary-title>투자 MBTI 결과</strong>
          <span data-investment-profile-result-date>저장일 없음</span>
        </div>
        <p data-investment-profile-summary>저장된 요약이 없습니다.</p>
        <div class="investmentProfileVisualLayout">
          <div class="investmentProfileRatioList" data-investment-profile-ratios></div>
          <div class="investmentProfileMiniPreview" data-investment-profile-preview></div>
        </div>
        <div class="investmentProfileInsightCards">
          <article><span>강점</span><p data-investment-profile-strength>저장된 강점 정보가 없습니다.</p></article>
          <article><span>주의점</span><p data-investment-profile-caution>저장된 주의점 정보가 없습니다.</p></article>
        </div>
        <div class="investmentProfileResultColumns">
          <div><span>관심 섹터</span><ul data-investment-profile-sectors></ul></div>
          <div><span>권장 액션</span><ul data-investment-profile-actions></ul></div>
        </div>
      </div>
      <div class="serverStorageActions compactActions investmentProfileActions">
        <button type="button" class="primaryButton" data-investment-profile-result>결과 자세히 보기</button>
        <button type="button" class="secondaryButton" data-investment-profile-start>투자 MBTI 다시 하기</button>
      </div>
    </section>
  `;
}

function renderList(listNode, items, fallback) {
  if (!listNode) return;
  const nextItems = items.length ? items : [fallback];
  setHtml(listNode, nextItems.map((item) => `<li>${escapeHtml(item)}</li>`).join(""));
}

function getMiniPreviewHtml(ratios) {
  if (!ratios.length) return `<div class="investmentProfilePreviewEmpty">그래프 데이터 없음</div>`;
  return `<div class="investmentProfilePreviewCard"><strong>예시 비중</strong>${ratios.slice(0, 7).map((item) => `<div><span>${escapeHtml(item.label)}</span><i><b style="width:${Math.max(4, Math.min(100, item.value))}%"></b></i><em>${item.value}%</em></div>`).join("")}</div>`;
}

function updateInvestmentResultDetails(panel, result, hasResult) {
  const box = panel.querySelector("[data-investment-profile-result-box]");
  const resultButton = panel.querySelector("[data-investment-profile-result]");
  if (!box || !resultButton) return;

  resultButton.disabled = !hasResult;
  setText(resultButton, isInvestmentResultOpen ? "결과 접기" : "결과 자세히 보기");
  box.hidden = !hasResult || !isInvestmentResultOpen;
  if (!hasResult || !isInvestmentResultOpen) return;

  setText(panel.querySelector("[data-investment-profile-summary-title]"), `${result?.nickname || "투자 MBTI"} 결과`);
  setText(panel.querySelector("[data-investment-profile-result-date]"), formatMbtiDate(result?.createdAt));
  setText(panel.querySelector("[data-investment-profile-summary]"), result?.summary || "저장된 요약이 없습니다.");
  setText(panel.querySelector("[data-investment-profile-strength]"), result?.strengths || "성향에 맞는 포트폴리오 점검 기준을 세우는 데 활용할 수 있습니다.");
  setText(panel.querySelector("[data-investment-profile-caution]"), result?.cautions || "본 결과는 참고용이며 실제 투자 전 손실 가능성을 확인해야 합니다.");

  const ratioNode = panel.querySelector("[data-investment-profile-ratios]");
  const ratios = getPresetEntries(result);
  setHtml(ratioNode, ratios.length
    ? ratios.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${item.value}%</strong><i style="width:${Math.max(4, Math.min(100, item.value))}%"></i></div>`).join("")
    : `<p class="investmentProfileEmptyRatio">저장된 포트폴리오 비율이 없습니다.</p>`);
  setHtml(panel.querySelector("[data-investment-profile-preview]"), getMiniPreviewHtml(ratios));

  renderList(panel.querySelector("[data-investment-profile-sectors]"), getArrayItems(result?.sectors), "저장된 섹터 정보 없음");
  renderList(panel.querySelector("[data-investment-profile-actions]"), getArrayItems(result?.actions), "저장된 권장 액션 없음");
}

function updateInvestmentProfileUi() {
  const panel = document.querySelector("[data-investment-profile-panel]");
  if (!panel) return;
  const result = readJson(MBTI_PRESET_STORAGE_KEY);
  const hasResult = Boolean(result?.typeId || result?.nickname || result?.finpleType);
  setText(panel.querySelector("[data-investment-profile-badge]"), hasResult ? "저장됨" : "미검사");
  setText(panel.querySelector("[data-investment-profile-nickname]"), result?.nickname || "검사 결과 없음");
  setText(panel.querySelector("[data-investment-profile-created]"), hasResult ? formatMbtiDate(result?.createdAt) : "투자 MBTI 필요");
  setText(panel.querySelector("[data-investment-profile-type]"), result?.finpleType || "-영역");
  setText(panel.querySelector("[data-investment-profile-risk]"), result?.riskProfile || "-영역");
  setText(panel.querySelector("[data-investment-profile-message]"), hasResult
    ? "최근 투자 MBTI 결과가 저장되어 있습니다. 결과 자세히 보기에서 포트폴리오 비율과 권장 액션을 다시 확인할 수 있습니다."
    : "아직 저장된 투자 MBTI 결과가 없습니다. 투자 MBTI를 먼저 진행해 주세요.");
  updateInvestmentResultDetails(panel, result, hasResult);
}

function bindInvestmentProfileActions() {
  const resultButton = document.querySelector("[data-investment-profile-result]");
  if (resultButton && resultButton.getAttribute("data-investment-profile-wired") !== "true") {
    resultButton.setAttribute("data-investment-profile-wired", "true");
    resultButton.addEventListener("click", () => {
      isInvestmentResultOpen = !isInvestmentResultOpen;
      updateInvestmentProfileUi();
    });
  }
  const startButton = document.querySelector("[data-investment-profile-start]");
  if (startButton && startButton.getAttribute("data-investment-profile-wired") !== "true") {
    startButton.setAttribute("data-investment-profile-wired", "true");
    startButton.addEventListener("click", () => navigateTo("/mbti"));
  }
}

function ensureInvestmentProfilePanel() {
  if (document.querySelector("[data-investment-profile-panel]")) { bindInvestmentProfileActions(); updateInvestmentProfileUi(); return; }
  const stack = document.querySelector(".accountPanelStack");
  if (!stack) return;
  const accountPanel = document.querySelector(".accountStatusPanel");
  if (accountPanel?.parentNode) accountPanel.insertAdjacentHTML("afterend", getInvestmentProfilePanelHtml());
  else stack.insertAdjacentHTML("afterbegin", getInvestmentProfilePanelHtml());
  bindInvestmentProfileActions();
  updateInvestmentProfileUi();
}

function getPaymentMethodPanelHtml() {
  return `
    <section class="accountCard paymentMethodEntryPanel" data-payment-method-panel data-mypage-panel-key="payment-method">
      <div class="serverStorageHeader">
        <div><p class="accountMiniLabel">Payment Method</p><h2>자동결제 결제수단</h2><p>FINPLE Personal 월 구독 자동결제를 위한 결제수단 관리 영역입니다.</p></div>
        <span class="serverStatusBadge ready" data-billing-method-badge>확인 중</span>
      </div>
      <div class="paymentMethodEntryGrid">
        <div><span>결제 방식</span><strong>월 구독 자동결제</strong><em>빌링키 기반</em></div>
        <div><span>등록 상태</span><strong data-billing-method-status>확인 중</strong><em data-billing-method-status-note>서버 조회 중</em></div>
        <div><span>결제수단</span><strong data-billing-method-label>확인 중</strong><em data-billing-method-updated>카드번호 원문 저장 없음</em></div>
      </div>
      <p class="serverStorageMessage compact paymentMethodEntryMessage" data-billing-method-message>등록된 결제수단을 확인하고 있습니다.</p>
      <div class="serverStorageActions compactActions">
        <button type="button" class="primaryButton" data-payment-method-setup>결제수단 등록/변경</button>
        <button type="button" class="secondaryButton" data-billing-method-refresh>결제수단 새로고침</button>
        <button type="button" class="secondaryButton" data-payment-method-pricing>요금제 확인</button>
      </div>
    </section>
  `;
}

function getMyInquiriesPanelHtml() {
  return `
    <section class="accountCard myInquiriesPanel" data-my-inquiries-panel data-mypage-panel-key="inquiries">
      <div class="serverStorageHeader">
        <div><p class="accountMiniLabel">My Inquiries</p><h2>내 문의내역</h2><p>내가 남긴 문의의 접수 상태와 최근 처리 현황을 확인합니다.</p></div>
        <span class="serverStatusBadge ready" data-my-inquiries-badge>확인 중</span>
      </div>
      <div class="paymentMethodEntryGrid myInquiriesSummaryGrid">
        <div><span>전체 문의</span><strong data-my-inquiries-total>확인 중</strong><em>최근 50건 기준</em></div>
        <div><span>진행 중</span><strong data-my-inquiries-active>확인 중</strong><em>접수·확인 중</em></div>
        <div><span>최근 문의</span><strong data-my-inquiries-latest>확인 중</strong><em>작성일 기준</em></div>
      </div>
      <p class="serverStorageMessage compact paymentMethodEntryMessage" data-my-inquiries-message>문의내역을 확인하고 있습니다.</p>
      <div class="myInquiriesList" data-my-inquiries-list>
        <p class="serverPortfolioEmpty">문의내역을 불러오기 전입니다.</p>
      </div>
      <div class="serverStorageActions compactActions">
        <button type="button" class="primaryButton" data-my-inquiries-refresh>문의내역 새로고침</button>
        <button type="button" class="secondaryButton" data-my-inquiries-support>새 문의 작성</button>
      </div>
    </section>
  `;
}

function markPanelKeys() {
  MENU_ITEMS.forEach((item) => {
    const panel = document.querySelector(item.selector);
    if (panel) panel.setAttribute("data-mypage-panel-key", item.key);
  });
}
function hideStandalonePanels() {
  STANDALONE_PANELS_TO_HIDE.forEach((selector) => document.querySelectorAll(selector).forEach((panel) => { panel.classList.add("myPagePanelHidden"); panel.toggleAttribute("hidden", true); }));
}
function bindPaymentMethodPanelActions() {
  const setupButton = document.querySelector("[data-payment-method-setup]");
  if (setupButton && setupButton.getAttribute("data-payment-method-wired") !== "true") {
    setupButton.setAttribute("data-payment-method-wired", "true");
    setupButton.addEventListener("click", () => navigateTo("/payment-method/setup"));
  }
  const pricingButton = document.querySelector("[data-payment-method-pricing]");
  if (pricingButton && pricingButton.getAttribute("data-payment-method-wired") !== "true") {
    pricingButton.setAttribute("data-payment-method-wired", "true");
    pricingButton.addEventListener("click", () => navigateTo("/pricing"));
  }
  const refreshButton = document.querySelector("[data-billing-method-refresh]");
  if (refreshButton && refreshButton.getAttribute("data-payment-method-wired") !== "true") {
    refreshButton.setAttribute("data-payment-method-wired", "true");
    refreshButton.addEventListener("click", () => loadBillingMethodStatus({ force: true }));
  }
}
function ensurePaymentMethodPanel() {
  if (document.querySelector("[data-payment-method-panel]")) { bindPaymentMethodPanelActions(); return; }
  const stack = document.querySelector(".accountPanelStack");
  if (!stack) return;
  const subscriptionPanel = document.querySelector("[data-subscription-status-panel]");
  const planPanel = document.querySelector(".planStatusPanel");
  const insertTarget = subscriptionPanel || planPanel;
  if (insertTarget?.parentNode) insertTarget.insertAdjacentHTML("afterend", getPaymentMethodPanelHtml());
  else stack.insertAdjacentHTML("beforeend", getPaymentMethodPanelHtml());
  bindPaymentMethodPanelActions();
}
function bindMyInquiriesPanelActions() {
  const refreshButton = document.querySelector("[data-my-inquiries-refresh]");
  if (refreshButton && refreshButton.getAttribute("data-my-inquiries-wired") !== "true") {
    refreshButton.setAttribute("data-my-inquiries-wired", "true");
    refreshButton.addEventListener("click", () => loadMyInquiries({ force: true }));
  }
  const supportButton = document.querySelector("[data-my-inquiries-support]");
  if (supportButton && supportButton.getAttribute("data-my-inquiries-wired") !== "true") {
    supportButton.setAttribute("data-my-inquiries-wired", "true");
    supportButton.addEventListener("click", () => navigateTo("/support"));
  }
}
function ensureMyInquiriesPanel() {
  if (document.querySelector("[data-my-inquiries-panel]")) { bindMyInquiriesPanelActions(); return; }
  const stack = document.querySelector(".accountPanelStack");
  if (!stack) return;
  const paymentMethodPanel = document.querySelector("[data-payment-method-panel]");
  const storagePanel = document.querySelector(".serverStoragePanel");
  if (paymentMethodPanel?.parentNode) paymentMethodPanel.insertAdjacentHTML("afterend", getMyInquiriesPanelHtml());
  else if (storagePanel?.parentNode) storagePanel.insertAdjacentHTML("beforebegin", getMyInquiriesPanelHtml());
  else stack.insertAdjacentHTML("beforeend", getMyInquiriesPanelHtml());
  bindMyInquiriesPanelActions();
}
function getSidebarHtml() {
  return `<aside class="myPageSidebar" data-mypage-sidebar><div class="myPageSidebarHeader"><strong>MY PAGE</strong><span>계정·성향·결제·문의·저장 관리</span></div><nav class="myPageSidebarNav" aria-label="MY PAGE 메뉴">${MENU_ITEMS.map((item) => `<button type="button" data-mypage-menu-key="${escapeHtml(item.key)}"><span>${escapeHtml(item.label)}</span><em>${escapeHtml(item.description)}</em></button>`).join("")}</nav></aside>`;
}
function ensureTopButton() {
  if (document.querySelector("[data-mypage-top-button]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "myPageTopButton";
  button.setAttribute("data-mypage-top-button", "true");
  button.textContent = "TOP";
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(button);
}
function updateTopButtonVisibility() {
  const button = document.querySelector("[data-mypage-top-button]");
  if (!button) return;
  button.classList.toggle("visible", isMyPagePath() && window.scrollY > 260);
}
function updateBillingMethodUi() {
  const badge = document.querySelector("[data-billing-method-badge]");
  const status = document.querySelector("[data-billing-method-status]");
  const statusNote = document.querySelector("[data-billing-method-status-note]");
  const label = document.querySelector("[data-billing-method-label]");
  const updated = document.querySelector("[data-billing-method-updated]");
  const message = document.querySelector("[data-billing-method-message]");
  if (!badge || !status || !label || !message) return;
  if (billingMethodState.loading) {
    setText(badge, "확인 중"); setText(status, "확인 중"); setText(statusNote, "서버 조회 중"); setText(label, "확인 중"); setText(updated, "카드번호 원문 저장 없음"); setText(message, "등록된 결제수단을 확인하고 있습니다."); return;
  }
  if (billingMethodState.error) {
    setText(badge, "확인 필요"); setText(status, "확인 필요"); setText(statusNote, "다시 조회 필요"); setText(label, "확인 실패"); setText(updated, "카드번호 원문 저장 없음"); setText(message, billingMethodState.error); return;
  }
  if (billingMethodState.registered && billingMethodState.method) {
    const method = billingMethodState.method;
    setText(badge, "등록됨"); setText(status, "등록 완료"); setText(statusNote, "자동결제 가능"); setText(label, method.displayLabel || "등록된 결제수단"); setText(updated, method.issuedAt ? `등록일 ${String(method.issuedAt).slice(0, 10)}` : "카드번호 원문 저장 없음"); setText(message, "등록된 결제수단으로 다음 정기결제를 진행할 수 있습니다."); return;
  }
  setText(badge, "미등록"); setText(status, "미등록"); setText(statusNote, "등록 필요"); setText(label, "등록된 결제수단 없음"); setText(updated, "카드번호 원문 저장 없음"); setText(message, "자동결제를 이용하려면 결제수단을 등록해 주세요.");
}
async function loadBillingMethodStatus(options = {}) {
  if (!isMyPagePath() || billingMethodState.loading) return;
  if (billingMethodRequested && !options.force) { updateBillingMethodUi(); return; }
  billingMethodRequested = true;
  billingMethodState = { loading: true, registered: false, method: null, error: "" };
  updateBillingMethodUi();
  try {
    const payload = await fetchBillingMethodStatus();
    billingMethodState = { loading: false, registered: Boolean(payload?.registered), method: payload?.method || null, error: "" };
  } catch (error) {
    billingMethodState = { loading: false, registered: false, method: null, error: error?.message || "결제수단 상태를 확인하지 못했습니다." };
  }
  updateBillingMethodUi();
}
function getInquiryListHtml(inquiries) {
  if (!inquiries.length) return `<p class="serverPortfolioEmpty">아직 접수된 문의내역이 없습니다.</p>`;
  return inquiries.slice(0, 10).map((inquiry) => {
    const status = inquiry.status || "open";
    return `
      <article class="myInquiryItem">
        <div class="myInquiryItemTop">
          <span class="inquiryStatusBadge status-${escapeHtml(status)}">${escapeHtml(getInquiryStatusLabel(status))}</span>
          <em>${escapeHtml(formatShortDate(inquiry.createdAt || inquiry.created_at))}</em>
        </div>
        <strong>${escapeHtml(inquiry.title || "제목 없는 문의")}</strong>
        <p>${escapeHtml(getInquiryExcerpt(inquiry.message))}</p>
        <div class="myInquiryItemMeta"><span>${escapeHtml(getInquiryCategoryLabel(inquiry.category))}</span><span>ID ${escapeHtml(String(inquiry.id || "").slice(0, 8))}</span></div>
      </article>
    `;
  }).join("") + (inquiries.length > 10 ? `<p class="serverPortfolioMore">외 ${inquiries.length - 10}건은 서버에 보관 중입니다.</p>` : "");
}
function updateMyInquiriesUi() {
  const badge = document.querySelector("[data-my-inquiries-badge]");
  const total = document.querySelector("[data-my-inquiries-total]");
  const active = document.querySelector("[data-my-inquiries-active]");
  const latest = document.querySelector("[data-my-inquiries-latest]");
  const message = document.querySelector("[data-my-inquiries-message]");
  const list = document.querySelector("[data-my-inquiries-list]");
  if (!badge || !total || !active || !latest || !message || !list) return;

  if (myInquiriesState.loading) {
    setText(badge, "조회 중"); setText(total, "확인 중"); setText(active, "확인 중"); setText(latest, "확인 중"); setText(message, "내 문의내역을 불러오고 있습니다.");
    setHtml(list, `<p class="serverPortfolioEmpty">문의내역 조회 중입니다.</p>`);
    return;
  }
  if (myInquiriesState.error) {
    setText(badge, "확인 필요"); setText(total, "-"); setText(active, "-"); setText(latest, "-"); setText(message, myInquiriesState.error);
    setHtml(list, `<p class="serverPortfolioEmpty">문의내역을 불러오지 못했습니다.</p>`);
    return;
  }

  const inquiries = Array.isArray(myInquiriesState.inquiries) ? myInquiriesState.inquiries : [];
  const activeCount = inquiries.filter((inquiry) => ["open", "in_progress"].includes(inquiry.status || "open")).length;
  setText(badge, inquiries.length ? "조회됨" : "내역 없음");
  setText(total, `${inquiries.length}건`);
  setText(active, `${activeCount}건`);
  setText(latest, inquiries[0] ? formatShortDate(inquiries[0].createdAt || inquiries[0].created_at) : "없음");
  setText(message, inquiries.length ? "최근 문의내역을 최신순으로 표시합니다." : "아직 접수된 문의내역이 없습니다. 문의사항 화면에서 새 문의를 남길 수 있습니다.");
  setHtml(list, getInquiryListHtml(inquiries));
}
async function loadMyInquiries(options = {}) {
  if (!isMyPagePath() || myInquiriesState.loading) return;
  if (myInquiriesRequested && !options.force) { updateMyInquiriesUi(); return; }
  myInquiriesRequested = true;
  myInquiriesState = { loading: true, inquiries: [], error: "" };
  updateMyInquiriesUi();
  try {
    const inquiries = await fetchMySupportInquiries();
    myInquiriesState = { loading: false, inquiries: Array.isArray(inquiries) ? inquiries : [], error: "" };
  } catch (error) {
    myInquiriesState = { loading: false, inquiries: [], error: error?.message || "문의내역을 확인하지 못했습니다." };
  }
  updateMyInquiriesUi();
}
function wrapMyPageLayout() {
  const stack = document.querySelector(".accountPanelStack");
  if (!stack || stack.closest(".myPageDashboardLayout")) return;
  const wrapper = document.createElement("section");
  wrapper.className = "myPageDashboardLayout myPageDashboardLayout--singlePanel";
  wrapper.setAttribute("aria-label", "MY PAGE 관리 메뉴와 패널");
  wrapper.innerHTML = getSidebarHtml();
  stack.parentNode.insertBefore(wrapper, stack);
  wrapper.appendChild(stack);
  wireSidebarActions(wrapper);
}
function wireSidebarActions(wrapper) {
  wrapper.querySelectorAll("[data-mypage-menu-key]").forEach((button) => {
    if (button.getAttribute("data-mypage-menu-wired") === "true") return;
    button.setAttribute("data-mypage-menu-wired", "true");
    button.addEventListener("click", () => setActivePanel(button.getAttribute("data-mypage-menu-key") || "account", { scrollToTop: true }));
  });
}
function getFallbackActiveKey() {
  const activeItem = MENU_ITEMS.find((item) => document.querySelector(item.selector));
  return activeItem?.key || "account";
}
function setActiveMenu(activeKey) {
  document.querySelectorAll("[data-mypage-menu-key]").forEach((button) => button.classList.toggle("active", button.getAttribute("data-mypage-menu-key") === activeKey));
}
function setActivePanel(nextKey, options = {}) {
  activeMenuKey = MENU_ITEMS.some((item) => item.key === nextKey) ? nextKey : getFallbackActiveKey();
  if (!document.querySelector(`[data-mypage-panel-key="${activeMenuKey}"]`)) activeMenuKey = getFallbackActiveKey();
  document.querySelectorAll(".accountPanelStack > [data-mypage-panel-key]").forEach((panel) => {
    const isActive = panel.getAttribute("data-mypage-panel-key") === activeMenuKey;
    panel.classList.toggle("myPagePanelActive", isActive);
    panel.classList.toggle("myPagePanelHidden", !isActive);
    panel.toggleAttribute("hidden", !isActive);
  });
  setActiveMenu(activeMenuKey);
  if (activeMenuKey === "payment-method") loadBillingMethodStatus();
  if (activeMenuKey === "investment-profile") updateInvestmentProfileUi();
  if (activeMenuKey === "inquiries") loadMyInquiries();
  if (options.scrollToTop) {
    const layout = document.querySelector(".myPageDashboardLayout");
    const top = layout ? Math.max(0, layout.getBoundingClientRect().top + window.scrollY - 90) : 0;
    window.scrollTo({ top, behavior: "smooth" });
  }
}
function applyMyPageSidebar() {
  if (!isMyPagePath()) return;
  ensureInvestmentProfilePanel();
  ensurePaymentMethodPanel();
  ensureMyInquiriesPanel();
  markPanelKeys();
  hideStandalonePanels();
  wrapMyPageLayout();
  ensureTopButton();
  setActivePanel(activeMenuKey);
  updateTopButtonVisibility();
  updateBillingMethodUi();
  updateInvestmentProfileUi();
  updateMyInquiriesUi();
}
function bootMyPageSidebarPatch() {
  [80, 180, 420, 900, 1600, 2600].forEach((delay) => window.setTimeout(applyMyPageSidebar, delay));
  window.addEventListener("scroll", updateTopButtonVisibility, { passive: true });
  window.addEventListener("popstate", () => window.setTimeout(applyMyPageSidebar, 80));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(applyMyPageSidebar, 120));
}
if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootMyPageSidebarPatch, { once: true });
  else bootMyPageSidebarPatch();
}
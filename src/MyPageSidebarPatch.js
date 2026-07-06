/* =========================================================
   Hotfix - MY PAGE single-card menu navigation patch
   - MY PAGE MutationObserver 반복 갱신을 중단해 무한로딩/렉을 방지합니다.
   - 내 투자성향 메뉴에서 최근 투자 MBTI 결과와 포트폴리오 비율을 다시 확인합니다.
   - 각 도구별 진입 링크를 분리합니다.
========================================================= */

import {
  clearBillingMethodStatusCache,
  fetchBillingMethodStatus,
  getSafeBillingMethodDisplayLabel,
} from "./components/paymentMethodClient";
import { fetchMySupportInquiries } from "./components/portfolio/services/serverPortfolioService";
import {
  fetchInvestmentMbtiProfile,
  upsertInvestmentMbtiProfile,
} from "./components/portfolio/services/serverPortfolioService";
import {
  MBTI_PRESET_STORAGE_KEY,
  restoreMbtiProfileFromPortfolios,
} from "./components/portfolio/utils/mbtiProfileStorage";

const PORTFOLIO_STORAGE_KEY = "finple-portfolio-list";
const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const EDUCATION_HIDDEN_MENU_KEYS = new Set(["payment-method", "payment-history"]);
const ASSET_LABELS = {
  growthStock: "성장주",
  valueStock: "가치·배당",
  bond: "종합채권",
  longBond: "장기국채",
  longbond: "장기국채",
  reit: "리츠",
  gold: "금",
  crypto: "블록체인 테마",
  cash: "현금",
  채권: "종합채권",
  코인: "블록체인 테마",
};

const AXIS_ITEMS = [
  { scoreKey: "returnStyle", left: "안정", right: "성장" },
  { scoreKey: "timeStyle", left: "장기", right: "기회" },
  { scoreKey: "controlStyle", left: "추종", right: "주도", storedLeft: "자동" },
  { scoreKey: "concentrationStyle", left: "분산", right: "확신" },
];

const TYPE_ID_AXIS_KEYS = ["returnStyle", "timeStyle", "controlStyle", "concentrationStyle"];

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
  { key: "billing", label: "구독 / 결제", description: "플랜·해지", selector: "[data-subscription-status-panel], .planStatusPanel" },
  { key: "plan", label: "요금제 상태", description: "한도·권한", selector: ".planStatusPanel" },
  { key: "payment-method", label: "결제수단", description: "자동결제 등록", selector: "[data-payment-method-panel]" },
  { key: "inquiries", label: "내 문의내역", description: "접수·처리 현황", selector: "[data-my-inquiries-panel]" },
  { key: "storage", label: "서버 저장", description: "저장·불러오기", selector: ".serverStoragePanel" },
];
const PANEL_KEY_SELECTORS = [
  { key: "account", selectors: [".accountStatusPanel"] },
  { key: "investment-profile", selectors: ["[data-investment-profile-panel]"] },
  { key: "billing", selectors: ["[data-subscription-status-panel]", ".subscriptionStatusPanel", ".planStatusPanel"] },
  { key: "payment-method", selectors: ["[data-payment-method-panel]"] },
  { key: "payment-history", selectors: ["[data-payment-history-panel]"] },
  { key: "inquiries", selectors: ["[data-my-inquiries-panel]"] },
  { key: "storage", selectors: [".serverStoragePanel"] },
];
const PANEL_ORDER_SELECTORS = [
  ".accountStatusPanel",
  "[data-investment-profile-panel]",
  "[data-subscription-status-panel]",
  ".planStatusPanel",
  "[data-payment-method-panel]",
  "[data-payment-history-panel]",
  "[data-my-inquiries-panel]",
  ".serverStoragePanel",
];

const STANDALONE_PANELS_TO_HIDE = [".adminInquiryPanel"];
const SINGLE_PANEL_SELECTORS = [
  ".accountPanelStack > [data-mypage-panel-key]",
  ".myPageDashboardLayout [data-mypage-panel-key]",
];

let activeMenuKey = "account";
let isInvestmentResultOpen = false;
let sidebarPatchStable = false;
let billingMethodRequested = false;
let billingMethodState = { loading: false, refreshing: false, registered: false, method: null, error: "" };
let myInquiriesRequested = false;
let myInquiriesState = { loading: false, refreshing: false, inquiries: [], error: "" };
let investmentMbtiRequested = false;
let investmentMbtiState = { loading: false, refreshing: false, profile: null, error: "" };
let lastSidebarUserKey = "";
const MY_INQUIRIES_CACHE_TTL_MS = 45000;
const INVESTMENT_MBTI_CACHE_TTL_MS = 45000;
const myInquiriesCache = new Map();
const myInquiriesInflight = new Map();
const investmentMbtiCache = new Map();
const investmentMbtiInflight = new Map();
const investmentMbtiBackfillAttempted = new Set();

function isMyPagePath() { return window.location.pathname === "/mypage"; }
function navigateTo(path) { window.location.href = path; }
function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
  try { return JSON.parse(window.localStorage.getItem(key) || "null"); } catch { return null; }
}
function getCurrentSidebarUserKey() {
  const user = readJson(AUTH_USER_STORAGE_KEY);
  return `${user?.id || ""}::${user?.email || ""}`;
}
function getMyInquiriesCacheKey() {
  return `${getCurrentSidebarUserKey()}::my-inquiries`;
}
function getInvestmentMbtiCacheKey() {
  return `${getCurrentSidebarUserKey()}::investment-mbti`;
}
function isEducationAccountUser() {
  const user = readJson(AUTH_USER_STORAGE_KEY);
  return user?.authMode === "education-account" || user?.entitlementSource === "education" || Boolean(user?.educationAccount);
}
function getVisibleMenuItems() {
  if (!isEducationAccountUser()) return MENU_ITEMS;
  return MENU_ITEMS.filter((item) => !EDUCATION_HIDDEN_MENU_KEYS.has(item.key));
}
function formatMbtiDate(value) {
  if (!value) return "저장일 없음";
  try { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); } catch { return "저장일 없음"; }
}
function normalizeAssetLabel(value) {
  const text = String(value || "").trim();
  return ASSET_LABELS[text] || text;
}
function normalizeAxisLabel(value) {
  return value === "자동" ? "추종" : value;
}
function getPresetFromStoredResult(result) {
  return result?.preset || result?.portfolioPreset || result?.allocation || {};
}
function getPresetEntries(result) {
  const preset = getPresetFromStoredResult(result);
  return Object.entries(preset)
    .map(([key, value]) => ({ key, label: normalizeAssetLabel(key), value: Number(value) }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value);
}
function getArrayItems(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}
function deriveSectorsFromPreset(preset = {}) {
  const sectors = [];
  const push = (condition, label) => {
    if (condition && !sectors.includes(label)) sectors.push(label);
  };

  push(Number(preset.growthStock || 0) > 0, "성장·기술");
  push(Number(preset.valueStock || 0) > 0, "배당·가치");
  push(Number(preset.bond || 0) > 0 || Number(preset.longBond || preset.longbond || 0) > 0, "채권·금리");
  push(Number(preset.reit || 0) > 0, "리츠·부동산");
  push(Number(preset.gold || 0) > 0, "금·원자재");
  push(Number(preset.crypto || 0) > 0, "블록체인 테마");
  push(Number(preset.cash || 0) >= 10, "현금성·대기자금");

  return sectors.slice(0, 5);
}
function getInvestmentProfileSectors(result) {
  const storedSectors = getArrayItems(result?.sectors);
  return storedSectors.length ? storedSectors : deriveSectorsFromPreset(getPresetFromStoredResult(result));
}
function getStoredAxes(result = {}) {
  if (result?.axes && typeof result.axes === "object") return result.axes;
  const values = String(result?.typeId || "")
    .split("-")
    .map((value) => value.trim())
    .filter(Boolean);
  return TYPE_ID_AXIS_KEYS.reduce((axes, key, index) => {
    if (values[index]) axes[key] = values[index];
    return axes;
  }, {});
}
function formatAxisScore(value) {
  if (!Number.isFinite(value)) return "점수 없음";
  return value > 0 ? `+${value}` : String(value);
}
function getAxisSelectedLabel(item, axes, score) {
  if (Number.isFinite(score)) return score > 0 ? item.right : item.left;
  const storedValue = normalizeAxisLabel(axes[item.scoreKey]);
  return storedValue || "저장값 없음";
}
function getFallbackAxisPosition(item, axes) {
  const storedValue = normalizeAxisLabel(axes[item.scoreKey]);
  if (storedValue === item.right) return 93;
  if (storedValue === item.left) return 7;
  return 50;
}
function getFallbackAxisScore(item, axes, result = {}) {
  const storedValue = normalizeAxisLabel(axes[item.scoreKey]);
  if (!storedValue) return null;

  if (item.scoreKey === "returnStyle") {
    const riskProfile = String(result?.riskProfile || "");
    if (storedValue === "성장" && (riskProfile.includes("적극") || riskProfile.includes("공격"))) return 6;
    if (storedValue === "안정" && (riskProfile.includes("안정") || riskProfile.includes("보수"))) return -6;
  }

  if (storedValue === item.right) return 3;
  if (storedValue === item.left) return -3;
  return null;
}
function getInvestmentProfileAxisChartHtml(result) {
  const axes = getStoredAxes(result);
  const axisScores = result?.axisScores && typeof result.axisScores === "object" ? result.axisScores : {};
  const hasAxisInfo = AXIS_ITEMS.some((item) => axes[item.scoreKey] || Number.isFinite(Number(axisScores[item.scoreKey])));
  if (!hasAxisInfo) {
    return `<div class="investmentProfileAxisBox investmentProfileAxisBox--empty">저장된 성향 차트 점수가 없습니다. 새 검사 후 미국/한국자산으로 반영하면 성향 차트가 함께 저장됩니다.</div>`;
  }

  return `
    <div class="investmentProfileAxisBox">
      <div class="investmentProfileAxisHeader">
        <strong>성향 차트</strong>
        <span>${escapeHtml(result?.riskProfile || "위험성향 저장값 없음")}</span>
      </div>
      <div class="investmentProfileAxisRows">
        ${AXIS_ITEMS.map((item) => {
          const scoreValue = Number(axisScores[item.scoreKey]);
          const hasScore = Number.isFinite(scoreValue);
          const fallbackScore = getFallbackAxisScore(item, axes, result);
          const score = hasScore ? Math.max(-6, Math.min(6, scoreValue)) : fallbackScore;
          const hasDisplayScore = Number.isFinite(score);
          const markerPosition = hasDisplayScore ? Math.max(7, Math.min(93, ((score + 6) / 12) * 100)) : getFallbackAxisPosition(item, axes);
          const selectedLabel = getAxisSelectedLabel(item, axes, score);
          const markerText = hasDisplayScore ? formatAxisScore(score) : selectedLabel;
          return `
            <div class="investmentProfileAxisRow">
              <div class="investmentProfileAxisLabels">
                <span>${escapeHtml(item.left)}</span>
                <strong>${escapeHtml(selectedLabel)}</strong>
                <span>${escapeHtml(item.right)}</span>
              </div>
              <div class="investmentProfileAxisTrack">
                <i></i>
                <b style="left:${markerPosition}%">${escapeHtml(markerText)}</b>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
function formatShortDate(value) {
  if (!value) return "일자 없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  } catch {
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
        <div><span>투자 MBTI</span><strong data-investment-profile-nickname>확인 중</strong></div>
        <div><span>투자성향</span><strong data-investment-profile-type>확인 중</strong></div>
        <div><span>위험성향</span><strong data-investment-profile-risk>확인 중</strong></div>
      </div>
      <p class="serverStorageMessage compact paymentMethodEntryMessage" data-investment-profile-message>투자 MBTI 결과를 확인하고 있습니다.</p>
      <div class="serverStorageActions compactActions investmentProfileActions">
        <button type="button" class="primaryButton" data-investment-profile-result>결과 자세히 보기</button>
        <button type="button" class="secondaryButton" data-investment-profile-start>투자 MBTI 다시 하기</button>
      </div>
      <div class="investmentProfileResultBox" data-investment-profile-result-box hidden>
        <div class="investmentProfileResultHeader">
          <strong data-investment-profile-summary-title>투자 MBTI 결과</strong>
          <span data-investment-profile-result-date>저장일 없음</span>
        </div>
        <p data-investment-profile-summary>저장된 요약이 없습니다.</p>
        <div data-investment-profile-axis-chart></div>
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
  setHtml(panel.querySelector("[data-investment-profile-axis-chart]"), getInvestmentProfileAxisChartHtml(result));

  const ratioNode = panel.querySelector("[data-investment-profile-ratios]");
  const ratios = getPresetEntries(result);
  setHtml(ratioNode, ratios.length
    ? ratios.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${item.value}%</strong><i style="width:${Math.max(4, Math.min(100, item.value))}%"></i></div>`).join("")
    : `<p class="investmentProfileEmptyRatio">저장된 포트폴리오 비율이 없습니다.</p>`);
  setHtml(panel.querySelector("[data-investment-profile-preview]"), getMiniPreviewHtml(ratios));

  renderList(panel.querySelector("[data-investment-profile-sectors]"), getInvestmentProfileSectors(result), "저장된 섹터 정보 없음");
  renderList(panel.querySelector("[data-investment-profile-actions]"), getArrayItems(result?.actions), "저장된 권장 액션 없음");
}

function updateInvestmentProfileUi() {
  const panel = document.querySelector("[data-investment-profile-panel]");
  if (!panel) return;
  restoreMbtiProfileFromPortfolios(readJson(PORTFOLIO_STORAGE_KEY) || [], {
    source: "mypage-investment-profile-panel",
  });
  const result = readJson(MBTI_PRESET_STORAGE_KEY);
  const hasResult = Boolean(result?.typeId || result?.nickname || result?.finpleType);
  setText(panel.querySelector("[data-investment-profile-badge]"), investmentMbtiState.loading && !hasResult ? "조회 중" : (hasResult ? "저장됨" : "미검사"));
  setText(panel.querySelector("[data-investment-profile-nickname]"), result?.nickname || "검사 결과 없음");
  setText(panel.querySelector("[data-investment-profile-type]"), result?.finpleType || "-영역");
  setText(panel.querySelector("[data-investment-profile-risk]"), result?.riskProfile || "-영역");
  setText(panel.querySelector("[data-investment-profile-message]"), investmentMbtiState.error
    ? investmentMbtiState.error
    : (hasResult
      ? (investmentMbtiState.refreshing ? "검사 결과가 저장되어 있습니다. 최신 결과를 확인하고 있습니다." : "투자 MBTI 검사 결과가 저장되어 있습니다. 결과 자세히 보기에서 포트폴리오 비율과 권장 액션을 확인할 수 있습니다.")
      : (investmentMbtiState.loading ? "저장된 투자 MBTI 검사 결과를 확인하고 있습니다." : "아직 저장된 투자 MBTI 결과가 없습니다. 투자 MBTI 검사를 진행하고 결과를 저장해 보세요.")));
  updateInvestmentResultDetails(panel, result, hasResult);
}

function writeInvestmentMbtiProfileToCache(profile) {
  if (!profile || typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(MBTI_PRESET_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event("finple-mbti-profile-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
    return true;
  } catch {
    return false;
  }
}

async function fetchInvestmentMbtiProfileCached(options = {}) {
  const cacheKey = getInvestmentMbtiCacheKey();
  const cached = investmentMbtiCache.get(cacheKey);
  const now = Date.now();
  if (!options.force && cached && now - cached.cachedAt < INVESTMENT_MBTI_CACHE_TTL_MS) return cached.profile;
  if (!options.force && investmentMbtiInflight.has(cacheKey)) return investmentMbtiInflight.get(cacheKey);

  const requestPromise = (async () => {
    const profile = await fetchInvestmentMbtiProfile();
    investmentMbtiCache.set(cacheKey, { cachedAt: Date.now(), profile: profile || null });
    return profile || null;
  })();

  investmentMbtiInflight.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    investmentMbtiInflight.delete(cacheKey);
  }
}

async function backfillInvestmentMbtiProfileIfNeeded(localProfile) {
  if (!localProfile?.typeId) return;
  const cacheKey = getInvestmentMbtiCacheKey();
  if (investmentMbtiBackfillAttempted.has(cacheKey)) return;
  investmentMbtiBackfillAttempted.add(cacheKey);
  try {
    const savedProfile = await upsertInvestmentMbtiProfile({
      ...localProfile,
      source: localProfile.source || "mypage-local-cache-backfill",
    });
    if (savedProfile?.typeId) writeInvestmentMbtiProfileToCache(savedProfile);
  } catch (error) {
    investmentMbtiState = {
      ...investmentMbtiState,
      error: "브라우저에 저장된 투자 MBTI 결과는 유지되며, 서버 저장은 나중에 다시 시도됩니다.",
    };
  }
}

async function loadInvestmentMbtiProfile(options = {}) {
  if (!isMyPagePath() || investmentMbtiState.loading) return;
  if (investmentMbtiRequested && !options.force) { updateInvestmentProfileUi(); return; }

  const localProfile = readJson(MBTI_PRESET_STORAGE_KEY);
  investmentMbtiRequested = true;
  investmentMbtiState = {
    ...investmentMbtiState,
    loading: !localProfile,
    refreshing: Boolean(localProfile),
    error: "",
  };
  updateInvestmentProfileUi();

  try {
    const profile = await fetchInvestmentMbtiProfileCached({ force: Boolean(options.force) });
    if (profile?.typeId) {
      writeInvestmentMbtiProfileToCache(profile);
      investmentMbtiState = { loading: false, refreshing: false, profile, error: "" };
    } else {
      investmentMbtiState = { loading: false, refreshing: false, profile: null, error: "" };
      await backfillInvestmentMbtiProfileIfNeeded(localProfile);
    }
  } catch (error) {
    investmentMbtiState = {
      ...investmentMbtiState,
      loading: false,
      refreshing: false,
      error: localProfile
        ? "저장된 투자 MBTI 결과를 유지하며, 서버 최신값 확인은 나중에 다시 시도합니다."
        : (error?.message || "투자 MBTI 결과를 불러오지 못했습니다."),
    };
  }

  updateInvestmentProfileUi();
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
        <div><span>전체 문의</span><strong data-my-inquiries-total>확인 중</strong></div>
        <div><span>처리 중</span><strong data-my-inquiries-active>확인 중</strong></div>
        <div><span>최근 문의</span><strong data-my-inquiries-latest>확인 중</strong></div>
      </div>
      <p class="serverStorageMessage compact paymentMethodEntryMessage" data-my-inquiries-message>문의내역을 확인하고 있습니다.</p>
      <div class="myInquiriesList" data-my-inquiries-list>
        <article class="myInquiryItem myInquiryItem--empty"><strong>문의내역을 불러오기 전입니다.</strong></article>
      </div>
      <div class="serverStorageActions compactActions">
        <button type="button" class="primaryButton" data-my-inquiries-refresh>문의내역 새로고침</button>
        <button type="button" class="secondaryButton" data-my-inquiries-support>새 문의 작성</button>
      </div>
    </section>
  `;
}

function markPanelKeys() {
  PANEL_KEY_SELECTORS.forEach((item) => {
    item.selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((panel) => {
        panel.setAttribute("data-mypage-panel-key", item.key);
      });
    });
  });
}
function getOrderedMyPagePanels() {
  const panels = [];
  const seen = new Set();
  PANEL_ORDER_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((panel) => {
      if (seen.has(panel)) return;
      seen.add(panel);
      panels.push(panel);
    });
  });
  return panels;
}
function normalizePanelStackPlacement() {
  const stack = document.querySelector(".accountPanelStack");
  if (!stack) return;

  let anchor = null;
  getOrderedMyPagePanels().forEach((panel) => {
    if (panel === stack || panel.closest(".myPageSidebar")) return;
    const nextSibling = anchor ? anchor.nextSibling : stack.firstChild;
    if (panel.parentElement !== stack || panel.previousElementSibling !== anchor) {
      stack.insertBefore(panel, nextSibling);
    }
    anchor = panel;
  });
}
function hideStandalonePanels() {
  STANDALONE_PANELS_TO_HIDE.forEach((selector) => document.querySelectorAll(selector).forEach((panel) => { panel.classList.add("myPagePanelHidden"); panel.toggleAttribute("hidden", true); }));
}
function getSinglePanelNodes() {
  const panels = [];
  const seen = new Set();
  SINGLE_PANEL_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((panel) => {
      if (seen.has(panel) || panel.closest(".myPageSidebar")) return;
      seen.add(panel);
      panels.push(panel);
    });
  });
  return panels;
}
function setPanelVisibility(panel, isActive) {
  const isMergedPlanPanel = panel.matches?.('.planStatusPanel[data-billing-plan-merged="true"]');
  const shouldShow = Boolean(isActive && !isMergedPlanPanel);
  panel.classList.toggle("myPagePanelActive", shouldShow);
  panel.classList.toggle("myPagePanelHidden", !shouldShow);
  panel.toggleAttribute("hidden", !shouldShow);
  panel.setAttribute("data-mypage-panel-hidden", shouldShow ? "false" : "true");
  if (shouldShow) panel.style.removeProperty("display");
  else panel.style.setProperty("display", "none", "important");
}
function bindPaymentMethodPanelActions() {
  const setupButton = document.querySelector("[data-payment-method-setup]");
  if (setupButton && setupButton.getAttribute("data-payment-method-wired") !== "true") {
    setupButton.setAttribute("data-payment-method-wired", "true");
    setupButton.addEventListener("click", () => navigateTo("/payment-method/setup?mode=card_update&source=mypage"));
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
  if (isEducationAccountUser()) return;
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
  const visibleMenuItems = getVisibleMenuItems();
  return `<aside class="myPageSidebar" data-mypage-sidebar><div class="myPageSidebarHeader"><strong>MY PAGE</strong><span>내 정보 메뉴</span></div><select class="myPageMobileMenuSelect" data-mypage-mobile-menu aria-label="MY PAGE 메뉴 선택">${visibleMenuItems.map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.label)}</option>`).join("")}</select><nav class="myPageSidebarNav" aria-label="MY PAGE 메뉴">${visibleMenuItems.map((item) => `<button type="button" data-mypage-menu-key="${escapeHtml(item.key)}"><span>${escapeHtml(item.label)}</span><em>${escapeHtml(item.description)}</em></button>`).join("")}</nav></aside>`;
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
  if (billingMethodState.registered && billingMethodState.method) {
    const method = billingMethodState.method;
    const displayLabel = getSafeBillingMethodDisplayLabel(method) || method.displayLabel || "등록된 결제수단";
    setText(badge, "등록됨"); setText(status, "등록 완료"); setText(statusNote, billingMethodState.refreshing ? "서버 조회 중" : "자동결제 가능"); setText(label, displayLabel); setText(updated, method.issuedAt ? `등록일 ${String(method.issuedAt).slice(0, 10)}` : "카드번호 원문 저장 없음"); setText(message, billingMethodState.error || (billingMethodState.refreshing ? "등록된 결제수단을 유지하며 최신 상태를 확인하고 있습니다." : "등록된 결제수단으로 다음 정기결제를 진행할 수 있습니다.")); return;
  }
  if (billingMethodState.loading) {
    setText(badge, "확인 중"); setText(status, "확인 중"); setText(statusNote, "서버 조회 중"); setText(label, "확인 중"); setText(updated, "카드번호 원문 저장 없음"); setText(message, "등록된 결제수단을 확인하고 있습니다."); return;
  }
  if (billingMethodState.error) {
    setText(badge, "확인 필요"); setText(status, "확인 필요"); setText(statusNote, "다시 조회 필요"); setText(label, "확인 실패"); setText(updated, "카드번호 원문 저장 없음"); setText(message, billingMethodState.error); return;
  }
  setText(badge, "미등록"); setText(status, "미등록"); setText(statusNote, "등록 필요"); setText(label, "등록된 결제수단 없음"); setText(updated, "카드번호 원문 저장 없음"); setText(message, "자동결제를 이용하려면 결제수단을 등록해 주세요.");
}
async function loadBillingMethodStatus(options = {}) {
  if (!isMyPagePath() || billingMethodState.loading) return;
  if (billingMethodRequested && !options.force) { updateBillingMethodUi(); return; }
  billingMethodRequested = true;
  billingMethodState = {
    ...billingMethodState,
    loading: !billingMethodState.method,
    refreshing: Boolean(billingMethodState.method),
    error: "",
  };
  updateBillingMethodUi();
  try {
    const payload = await fetchBillingMethodStatus({ force: Boolean(options.force) });
    billingMethodState = { loading: false, refreshing: false, registered: Boolean(payload?.registered), method: payload?.method || null, error: "" };
  } catch (error) {
    billingMethodState = {
      ...billingMethodState,
      loading: false,
      refreshing: false,
      error: error?.message || "결제수단 상태를 확인하지 못했습니다.",
    };
  }
  updateBillingMethodUi();
}
function getInquiryListHtml(inquiries) {
  if (!inquiries.length) {
    return `<article class="myInquiryItem myInquiryItem--empty"><strong>아직 접수된 문의내역이 없습니다.</strong><p>문의사항 화면에서 새 문의를 남길 수 있습니다.</p></article>`;
  }
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

  const inquiries = Array.isArray(myInquiriesState.inquiries) ? myInquiriesState.inquiries : [];
  const hasStaleInquiries = inquiries.length > 0;

  if (myInquiriesState.loading && !hasStaleInquiries) {
    setText(badge, "조회 중"); setText(total, "확인 중"); setText(active, "확인 중"); setText(latest, "확인 중"); setText(message, "내 문의내역을 불러오고 있습니다.");
    setHtml(list, `<article class="myInquiryItem myInquiryItem--empty"><strong>문의내역 조회 중입니다.</strong></article>`);
    return;
  }

  if (myInquiriesState.error && !hasStaleInquiries) {
    setText(badge, "확인 필요"); setText(total, "-"); setText(active, "-"); setText(latest, "-"); setText(message, myInquiriesState.error);
    setHtml(list, `<article class="myInquiryItem myInquiryItem--empty"><strong>문의내역을 불러오지 못했습니다.</strong><p>잠시 후 다시 시도해 주세요.</p></article>`);
    return;
  }

  const activeCount = inquiries.filter((inquiry) => ["open", "in_progress"].includes(inquiry.status || "open")).length;
  setText(badge, myInquiriesState.refreshing ? "조회 중" : (inquiries.length ? "조회됨" : "내역 없음"));
  setText(total, `${inquiries.length}건`);
  setText(active, `${activeCount}건`);
  setText(latest, inquiries[0] ? formatShortDate(inquiries[0].createdAt || inquiries[0].created_at) : "없음");
  setText(message, myInquiriesState.error || (myInquiriesState.refreshing ? "기존 문의내역을 유지하며 최신 내역을 확인하고 있습니다." : (inquiries.length ? "최근 문의내역을 최신순으로 표시합니다." : "아직 접수된 문의내역이 없습니다. 문의사항 화면에서 새 문의를 남길 수 있습니다.")));
  setHtml(list, getInquiryListHtml(inquiries));
}
async function fetchMySupportInquiriesCached(options = {}) {
  const cacheKey = getMyInquiriesCacheKey();
  const cached = myInquiriesCache.get(cacheKey);
  const now = Date.now();
  if (!options.force && cached && now - cached.cachedAt < MY_INQUIRIES_CACHE_TTL_MS) return cached.inquiries;
  if (!options.force && myInquiriesInflight.has(cacheKey)) return myInquiriesInflight.get(cacheKey);

  const requestPromise = (async () => {
    const inquiries = await fetchMySupportInquiries();
    const normalized = Array.isArray(inquiries) ? inquiries : [];
    myInquiriesCache.set(cacheKey, { cachedAt: Date.now(), inquiries: normalized });
    return normalized;
  })();

  myInquiriesInflight.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    myInquiriesInflight.delete(cacheKey);
  }
}
async function loadMyInquiries(options = {}) {
  if (!isMyPagePath() || myInquiriesState.loading) return;
  if (myInquiriesRequested && !options.force) { updateMyInquiriesUi(); return; }
  myInquiriesRequested = true;
  myInquiriesState = {
    ...myInquiriesState,
    loading: !myInquiriesState.inquiries.length,
    refreshing: myInquiriesState.inquiries.length > 0,
    error: "",
  };
  updateMyInquiriesUi();
  try {
    const inquiries = await fetchMySupportInquiriesCached({ force: Boolean(options.force) });
    myInquiriesState = { loading: false, refreshing: false, inquiries: Array.isArray(inquiries) ? inquiries : [], error: "" };
  } catch (error) {
    myInquiriesState = {
      ...myInquiriesState,
      loading: false,
      refreshing: false,
      error: error?.message || "문의내역 새로고침에 실패했습니다.",
    };
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
  wrapper.querySelectorAll("[data-mypage-mobile-menu]").forEach((select) => {
    if (select.getAttribute("data-mypage-menu-wired") === "true") return;
    select.setAttribute("data-mypage-menu-wired", "true");
    select.addEventListener("change", () => setActivePanel(select.value || "account", { scrollToTop: true }));
  });
}
function getFallbackActiveKey() {
  const activeItem = getVisibleMenuItems().find((item) => document.querySelector(item.selector));
  return activeItem?.key || "account";
}
function setActiveMenu(activeKey) {
  document.querySelectorAll("[data-mypage-menu-key]").forEach((button) => button.classList.toggle("active", button.getAttribute("data-mypage-menu-key") === activeKey));
  document.querySelectorAll("[data-mypage-mobile-menu]").forEach((select) => {
    if (select.value !== activeKey) select.value = activeKey;
  });
}
function setActivePanel(nextKey, options = {}) {
  markPanelKeys();
  normalizePanelStackPlacement();
  activeMenuKey = getVisibleMenuItems().some((item) => item.key === nextKey) ? nextKey : getFallbackActiveKey();
  if (!document.querySelector(`[data-mypage-panel-key="${activeMenuKey}"]`)) activeMenuKey = getFallbackActiveKey();
  window.__finpleMyPageActiveKey = activeMenuKey;
  getSinglePanelNodes().forEach((panel) => {
    const isActive = panel.getAttribute("data-mypage-panel-key") === activeMenuKey;
    setPanelVisibility(panel, isActive);
  });
  setActiveMenu(activeMenuKey);
  if (activeMenuKey === "payment-method") loadBillingMethodStatus();
  if (activeMenuKey === "investment-profile") loadInvestmentMbtiProfile();
  if (activeMenuKey === "inquiries") loadMyInquiries();
  if (options.scrollToTop) {
    const layout = document.querySelector(".myPageDashboardLayout");
    const top = layout ? Math.max(0, layout.getBoundingClientRect().top + window.scrollY - 90) : 0;
    window.scrollTo({ top, behavior: "smooth" });
  }
}
function syncActivePanelController(nextKey = activeMenuKey) {
  if (!isMyPagePath()) return;
  markPanelKeys();
  normalizePanelStackPlacement();
  hideStandalonePanels();
  setActivePanel(nextKey || window.__finpleMyPageActiveKey || activeMenuKey || "account");
}
function resetBillingMethodRequestState() {
  billingMethodRequested = false;
  billingMethodState = { loading: false, refreshing: false, registered: false, method: null, error: "" };
  clearBillingMethodStatusCache();
}
function resetSidebarDataForUserChange() {
  const nextUserKey = getCurrentSidebarUserKey();
  if (nextUserKey === lastSidebarUserKey) return;

  lastSidebarUserKey = nextUserKey;
  resetBillingMethodRequestState();
  myInquiriesRequested = false;
  myInquiriesState = { loading: false, refreshing: false, inquiries: [], error: "" };
  myInquiriesCache.clear();
  myInquiriesInflight.clear();
  investmentMbtiRequested = false;
  investmentMbtiState = { loading: false, refreshing: false, profile: null, error: "" };
  investmentMbtiCache.clear();
  investmentMbtiInflight.clear();
  investmentMbtiBackfillAttempted.clear();
}
function isSidebarPatchStable() {
  return Boolean(
    document.querySelector(".myPageDashboardLayout") &&
      document.querySelector("[data-payment-method-panel]") &&
      document.querySelector("[data-my-inquiries-panel]") &&
      document.querySelector("[data-mypage-menu-key]")
  );
}
function applyMyPageSidebarIfNeeded() {
  if (sidebarPatchStable && isSidebarPatchStable()) {
    markPanelKeys();
    normalizePanelStackPlacement();
    hideStandalonePanels();
    setActivePanel(activeMenuKey);
    updateTopButtonVisibility();
    updateBillingMethodUi();
    updateInvestmentProfileUi();
    updateMyInquiriesUi();
    return;
  }

  applyMyPageSidebar();
}
function applyMyPageSidebar() {
  if (!isMyPagePath()) return;
  ensureInvestmentProfilePanel();
  ensurePaymentMethodPanel();
  ensureMyInquiriesPanel();
  markPanelKeys();
  normalizePanelStackPlacement();
  hideStandalonePanels();
  wrapMyPageLayout();
  ensureTopButton();
  setActivePanel(activeMenuKey);
  updateTopButtonVisibility();
  updateBillingMethodUi();
  updateInvestmentProfileUi();
  updateMyInquiriesUi();
  sidebarPatchStable = isSidebarPatchStable();
}
function bootMyPageSidebarPatch() {
  window.__finpleSyncMyPageActivePanel = syncActivePanelController;
  [80, 180, 420, 900, 1600, 2600].forEach((delay) => window.setTimeout(applyMyPageSidebarIfNeeded, delay));
  window.addEventListener("scroll", updateTopButtonVisibility, { passive: true });
  window.addEventListener("popstate", () => {
    sidebarPatchStable = false;
    window.setTimeout(applyMyPageSidebar, 80);
  });
  window.addEventListener("finple-auth-updated", () => {
    sidebarPatchStable = false;
    resetSidebarDataForUserChange();
    window.setTimeout(applyMyPageSidebar, 120);
  });
}
if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootMyPageSidebarPatch, { once: true });
  else bootMyPageSidebarPatch();
}

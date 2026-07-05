/* =========================================================
   Step 170 - MY PAGE subscription status and period-end request patch
   - /api/payments/subscription/me와 MY PAGE 구독 상태 패널을 연결합니다.
   - 서버 구독/권한 상태를 브라우저 사용자·플랜 상태에 동기화합니다.
   - 다음 결제일과 이용 종료 예정일은 current_period_end를 기본 기준으로 표시합니다.
   - Personal 구독의 이용기간 종료 예약 버튼을 제공합니다.
========================================================= */

import {
  getFinpleApiBaseUrl,
  getStoredFinpleAuthUser,
  setStoredFinpleAuthUser,
} from "./components/portfolio/services/serverPortfolioService";
import { getStoredFinpleAuthSession } from "./components/authClientService";
import { normalizeFinplePlan, setStoredFinplePlan } from "./components/portfolio/config/planConfig";
import {
  getPlanFromPayload,
  getSubscriptionPlanDecision,
  isBlockedSubscriptionStatus,
} from "./components/portfolio/utils/subscriptionPlanStatus";

let hasRequestedSubscriptionStatus = false;
let lastSubscriptionPayload = null;
let lastSubscriptionError = "";
let lastSubscriptionFetchAt = 0;
let isFetchingSubscriptionStatus = false;
let isRequestingPeriodEnd = false;
let subscriptionPatchScheduled = false;
let subscriptionObserver = null;
let lastSubscriptionUserKey = "";
const SUBSCRIPTION_EFFECTIVE_STORAGE_KEY = "finple-subscription-effective-status";
const FINPLE_PLAN_STORAGE_KEY = "finple-selected-plan";
const SUBSCRIPTION_STATUS_CACHE_TTL_MS = 45000;
const subscriptionStatusCache = new Map();
const subscriptionStatusInflight = new Map();

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function getSubscriptionStatusCacheKey() {
  const user = getStoredFinpleAuthUser();
  return `${getFinpleApiBaseUrl()}::${user?.id || user?.email || "current-user"}::subscription-status`;
}

function getCurrentSubscriptionUserKey() {
  const user = getStoredFinpleAuthUser();
  return `${user?.id || ""}::${user?.email || ""}`;
}

function formatPlanLabel(plan) {
  const normalized = String(plan || "free").toLowerCase();
  if (normalized === "personal") return "Personal";
  if (normalized === "pro") return "Pro";
  return "Free";
}

function formatStatusLabel(status) {
  const normalized = String(status || "beta_free").toLowerCase();

  const labels = {
    guest: "비로그인",
    beta_free: "베타 무료 이용 중",
    active: "이용 중",
    cancel_at_period_end: "해지 예약",
    expired: "만료",
    refunded: "환불 처리",
    payment_failed: "결제 실패",
    past_due: "결제 재시도 대기",
  };

  return labels[normalized] || normalized;
}

function readDateLabel(value) {
  if (!value) return "해당 없음";

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return "해당 없음";
  }
}

function isPeriodEndScheduled(status, subscription) {
  return status === "cancel_at_period_end" || Boolean(subscription?.cancel_at_period_end || subscription?.cancelAtPeriodEnd);
}

function getSubscriptionMessage(payload) {
  if (lastSubscriptionError) return lastSubscriptionError;
  if (!payload) return "구독 상태를 불러오고 있습니다.";
  if (!payload.authenticated) return payload.message || "로그인 후 구독 상태를 확인할 수 있습니다.";

  const subscription = payload.subscription || {};
  const decision = getSubscriptionPlanDecision(payload);
  const status = decision.status || payload.status || subscription.status || "beta_free";
  const plan = getPlanFromPayload(payload);
  const periodEndLabel = readDateLabel(payload.accessUntil || subscription?.current_period_end || subscription?.currentPeriodEnd || payload.entitlement?.valid_until || payload.entitlement?.validUntil);

  if (plan === "personal" && isPeriodEndScheduled(status, subscription)) {
    return `구독 해지가 예약되었습니다. ${periodEndLabel}까지 Personal 기능을 사용할 수 있고, 다음 결제부터 자동 갱신이 중단됩니다.`;
  }

  if (plan === "personal") {
    return `Personal 이용 중입니다. 다음 결제 예정일과 현재 이용기간 종료 예정일은 ${periodEndLabel} 기준으로 표시됩니다.`;
  }

  if (isBlockedSubscriptionStatus(status)) {
    return payload.message || "서버 기준 유료 권한이 확인되지 않아 Free 기준으로 표시합니다. 결제 갱신/권한 상태는 관리자 확인이 필요합니다.";
  }

  return payload.message || "서버 기준 구독 상태를 확인했습니다.";
}

function setText(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) node.textContent = nextValue;
}

function getSubscriptionPanelHtml() {
  return `
    <section class="accountCard subscriptionStatusPanel" data-subscription-status-panel>
      <div class="serverStorageHeader">
        <div>
          <p class="accountMiniLabel">Billing Status</p>
          <h2>구독 / 결제 상태</h2>
          <p>서버 결제 API 기준으로 현재 구독 상태, 다음 결제일, 이용 종료 예정일을 확인합니다.</p>
        </div>
        <span class="serverStatusBadge ready" data-subscription-badge>확인 중</span>
      </div>

      <div class="subscriptionStatusGrid">
        <div>
          <span>현재 플랜</span>
          <strong data-subscription-plan>확인 중</strong>
          <em>서버 기준</em>
        </div>
        <div>
          <span>구독 상태</span>
          <strong data-subscription-status>확인 중</strong>
          <em>결제 상태</em>
        </div>
        <div>
          <span>다음 결제일</span>
          <strong data-subscription-next-billing>해당 없음</strong>
          <em data-subscription-next-billing-note>정기결제 기준</em>
        </div>
        <div>
          <span>이용 종료 예정일</span>
          <strong data-subscription-period-end>해당 없음</strong>
          <em data-subscription-period-end-note>현재 이용기간 기준</em>
        </div>
      </div>

      <p class="serverStorageMessage compact subscriptionStatusMessage" data-subscription-message>구독 상태를 불러오고 있습니다.</p>

      <div class="serverStorageActions compactActions subscriptionStatusActions">
        <button type="button" class="primaryButton" data-subscription-pricing>요금제 / 결제 준비</button>
        <button type="button" class="secondaryButton" data-subscription-refresh>구독 상태 새로고침</button>
        <button type="button" class="secondaryButton subscriptionEndButton" data-subscription-end-at-period hidden>구독 해지 예약</button>
        <button type="button" class="secondaryButton" data-subscription-support>결제 문의</button>
      </div>
    </section>
  `;
}

function findInsertionTarget() {
  return document.querySelector(".planStatusPanel") || document.querySelector(".accountStatusPanel");
}

function navigateTo(path) {
  window.location.href = path;
}

function syncMyPageActivePanel() {
  window.__finpleSyncMyPageActivePanel?.(window.__finpleMyPageActiveKey || "account");
}

function isSubscriptionPanelVisible() {
  const panel = document.querySelector("[data-subscription-status-panel]");
  if (!panel) return false;
  if (panel.hidden || panel.classList.contains("myPagePanelHidden")) return false;
  const activeKey = window.__finpleMyPageActiveKey || "";
  return activeKey === "billing" || activeKey === "plan" || panel.classList.contains("myPagePanelActive");
}

function upsertSubscriptionPanel() {
  if (!isMyPagePath()) return;
  if (document.querySelector("[data-subscription-status-panel]")) return;

  const target = findInsertionTarget();
  if (!target?.parentNode) return;

  target.insertAdjacentHTML("afterend", getSubscriptionPanelHtml());
  const panel = document.querySelector("[data-subscription-status-panel]");
  panel?.setAttribute("data-mypage-panel-key", "billing");
  wireSubscriptionPanelActions();
  updateSubscriptionPanel();
  syncMyPageActivePanel();
}

function wireSubscriptionPanelActions() {
  const panel = document.querySelector("[data-subscription-status-panel]");
  if (!panel) return;

  panel.querySelector("[data-subscription-pricing]")?.addEventListener("click", () => navigateTo("/pricing"));
  panel.querySelector("[data-subscription-support]")?.addEventListener("click", () => navigateTo("/support"));
  panel.querySelector("[data-subscription-refresh]")?.addEventListener("click", () => {
    hasRequestedSubscriptionStatus = false;
    requestSubscriptionStatusOnce({ force: true });
  });
  panel.querySelector("[data-subscription-end-at-period]")?.addEventListener("click", requestPeriodEndSchedule);
}

function requestSubscriptionStatusWhenVisible() {
  if (!isMyPagePath() || !isSubscriptionPanelVisible()) return;
  requestSubscriptionStatusOnce();
}

function syncSubscriptionPayloadToBrowser(payload) {
  if (!payload?.authenticated) return;

  const plan = getPlanFromPayload(payload);
  const decision = getSubscriptionPlanDecision(payload);
  const storedUser = getStoredFinpleAuthUser();
  const subscription = payload.subscription || {};
  const entitlement = payload.entitlement || {};
  const accessUntil = payload.accessUntil || payload.currentPeriodEnd || subscription.current_period_end || subscription.currentPeriodEnd || entitlement.valid_until || entitlement.validUntil || null;

  try {
    window.localStorage.setItem(SUBSCRIPTION_EFFECTIVE_STORAGE_KEY, JSON.stringify({
      effectivePlan: plan,
      effectiveStatus: decision.status || payload.status || subscription.status || "beta_free",
      accessUntil,
      currentPeriodEnd: payload.currentPeriodEnd || subscription.current_period_end || subscription.currentPeriodEnd || null,
      nextBillingAt: payload.nextBillingAt || subscription.next_billing_at || subscription.nextBillingAt || null,
      serverNow: payload.serverNow || new Date().toISOString(),
    }));
  } catch (error) {
    // Ignore storage sync failures; the visible panel still updates from payload.
  }

  if (storedUser?.id) {
    const nextBillingStatus = decision.status || payload.status || payload.subscription?.status || "beta_free";
    const nextSubscriptionId = plan === "personal" ? payload.subscription?.id || storedUser.subscriptionId || null : null;
    const nextEntitlementValidUntil = plan === "personal" ? payload.entitlement?.valid_until || payload.entitlement?.validUntil || storedUser.entitlementValidUntil || null : null;
    const hasUserChange =
      normalizeFinplePlan(storedUser.plan) !== plan ||
      storedUser.billingStatus !== nextBillingStatus ||
      storedUser.subscriptionId !== nextSubscriptionId ||
      storedUser.entitlementValidUntil !== nextEntitlementValidUntil;

    if (!hasUserChange) {
      setStoredFinplePlanIfChanged(plan);
      return;
    }

    setStoredFinpleAuthUser({
      ...storedUser,
      plan,
      billingStatus: nextBillingStatus,
      subscriptionId: nextSubscriptionId,
      entitlementValidUntil: nextEntitlementValidUntil,
    });
  }

  setStoredFinplePlanIfChanged(plan);
}

function setStoredFinplePlanIfChanged(plan) {
  try {
    if (window.localStorage.getItem(FINPLE_PLAN_STORAGE_KEY) === plan) return;
  } catch (error) {
    // Fall through to the shared setter; it handles storage availability.
  }

  setStoredFinplePlan(plan);
}

function getPeriodEndValue(payload, subscription, entitlement) {
  return payload?.accessUntil || subscription?.current_period_end || subscription?.currentPeriodEnd || entitlement?.valid_until || entitlement?.validUntil || null;
}

function getNextBillingLabel({ payload, plan, status, subscription, entitlement }) {
  if (plan !== "personal") return "해당 없음";
  if (isPeriodEndScheduled(status, subscription)) return "다음 결제 없음";
  return readDateLabel(payload?.nextBillingAt || subscription?.next_billing_at || subscription?.nextBillingAt || getPeriodEndValue(payload, subscription, entitlement));
}

function updatePeriodEndButton({ panel, plan, status, subscription }) {
  const button = panel.querySelector("[data-subscription-end-at-period]");
  if (!button) return;

  const shouldShow = plan === "personal" && ["active", "cancel_at_period_end"].includes(status);
  button.hidden = !shouldShow;

  if (!shouldShow) return;

  const scheduled = isPeriodEndScheduled(status, subscription);
  button.disabled = scheduled || isRequestingPeriodEnd;
  button.classList.toggle("subscriptionEndButton--scheduled", scheduled);

  if (isRequestingPeriodEnd) {
    setText(button, "처리 중");
  } else if (scheduled) {
    setText(button, "해지 예약됨");
  } else {
    setText(button, "구독 해지 예약");
  }
}

function updateSubscriptionPanel() {
  const panel = document.querySelector("[data-subscription-status-panel]");
  if (!panel) return;

  const payload = lastSubscriptionPayload;
  const subscription = payload?.subscription || {};
  const entitlement = payload?.entitlement || {};
  const decision = getSubscriptionPlanDecision(payload);
  const plan = getPlanFromPayload(payload);
  const status = decision.status || payload?.status || subscription?.status || (payload?.authenticated ? "beta_free" : "guest");
  const scheduled = plan === "personal" && isPeriodEndScheduled(status, subscription);
  const periodEndValue = plan === "personal" ? getPeriodEndValue(payload, subscription, entitlement) : null;

  setText(panel.querySelector("[data-subscription-badge]"), formatStatusLabel(status));
  setText(panel.querySelector("[data-subscription-plan]"), formatPlanLabel(plan));
  setText(panel.querySelector("[data-subscription-status]"), formatStatusLabel(status));
  setText(panel.querySelector("[data-subscription-next-billing]"), getNextBillingLabel({ payload, plan, status, subscription, entitlement }));
  setText(panel.querySelector("[data-subscription-next-billing-note]"), scheduled ? "해지 예약됨" : "정기결제 기준");
  setText(panel.querySelector("[data-subscription-period-end]"), readDateLabel(periodEndValue));
  setText(panel.querySelector("[data-subscription-period-end-note]"), scheduled ? "종료 예정" : "현재 이용기간 기준");
  setText(panel.querySelector("[data-subscription-message]"), getSubscriptionMessage(payload));

  updatePeriodEndButton({ panel, plan, status, subscription });
  panel.classList.toggle("subscriptionStatusPanel--error", Boolean(lastSubscriptionError));
  panel.classList.toggle("subscriptionStatusPanel--scheduled", scheduled);
  syncMyPageActivePanel();
}

function getAuthHeaders() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(user?.id ? { "x-finple-user-id": user.id } : {}),
  };
}

async function fetchSubscriptionStatus(options = {}) {
  const cacheKey = getSubscriptionStatusCacheKey();
  const cached = subscriptionStatusCache.get(cacheKey);
  const now = Date.now();

  if (!options.force && cached && now - cached.cachedAt < SUBSCRIPTION_STATUS_CACHE_TTL_MS) {
    return { ...cached.payload, fromCache: true };
  }

  if (!options.force && subscriptionStatusInflight.has(cacheKey)) {
    return subscriptionStatusInflight.get(cacheKey);
  }

  const requestPromise = (async () => {
    const response = await fetch(`${getFinpleApiBaseUrl()}/payments/subscription/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || "구독 상태를 불러오지 못했습니다.");
    }

    subscriptionStatusCache.set(cacheKey, { cachedAt: Date.now(), payload });
    return payload;
  })();

  subscriptionStatusInflight.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    subscriptionStatusInflight.delete(cacheKey);
  }
}

async function postPeriodEndSchedule() {
  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/subscription/end-at-period`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || "구독 해지 예약을 처리하지 못했습니다.");
  }

  return payload;
}

async function requestPeriodEndSchedule() {
  if (isRequestingPeriodEnd) return;

  const subscription = lastSubscriptionPayload?.subscription || {};
  const endLabel = readDateLabel(lastSubscriptionPayload?.accessUntil || subscription?.current_period_end || subscription?.currentPeriodEnd || lastSubscriptionPayload?.entitlement?.valid_until);
  const confirmed = window.confirm(
    `구독 해지를 예약하시겠습니까?\n\n${endLabel}까지 Personal 기능을 계속 사용할 수 있고, 다음 결제부터 자동 갱신이 중단됩니다.`
  );

  if (!confirmed) return;

  isRequestingPeriodEnd = true;
  lastSubscriptionError = "";
  updateSubscriptionPanel();

  try {
    const result = await postPeriodEndSchedule();
    lastSubscriptionPayload = {
      ...(lastSubscriptionPayload || {}),
      authenticated: true,
      plan: result.plan || lastSubscriptionPayload?.plan || "personal",
      status: result.status || "cancel_at_period_end",
      subscription: result.subscription || lastSubscriptionPayload?.subscription,
      message: result.message,
    };
    syncSubscriptionPayloadToBrowser(lastSubscriptionPayload);
    hasRequestedSubscriptionStatus = false;
    await requestSubscriptionStatusOnce({ force: true });
  } catch (error) {
    lastSubscriptionError = error?.message || "구독 해지 예약을 처리하지 못했습니다.";
  } finally {
    isRequestingPeriodEnd = false;
    updateSubscriptionPanel();
  }
}

async function requestSubscriptionStatusOnce(options = {}) {
  if (!isMyPagePath() || isFetchingSubscriptionStatus) return;
  const now = Date.now();
  if (!options.force && lastSubscriptionPayload && now - lastSubscriptionFetchAt < SUBSCRIPTION_STATUS_CACHE_TTL_MS) {
    updateSubscriptionPanel();
    return;
  }
  if (hasRequestedSubscriptionStatus && !options.force && !lastSubscriptionPayload && !lastSubscriptionError) {
    updateSubscriptionPanel();
    return;
  }

  hasRequestedSubscriptionStatus = true;
  isFetchingSubscriptionStatus = true;
  lastSubscriptionUserKey = getCurrentSubscriptionUserKey();
  lastSubscriptionError = "";
  updateSubscriptionPanel();

  try {
    lastSubscriptionPayload = await fetchSubscriptionStatus({ force: Boolean(options.force) });
    lastSubscriptionFetchAt = Date.now();
    syncSubscriptionPayloadToBrowser(lastSubscriptionPayload);
  } catch (error) {
    lastSubscriptionError = error?.message || "구독 상태 새로고침에 실패했습니다.";
  } finally {
    isFetchingSubscriptionStatus = false;
  }

  updateSubscriptionPanel();
}

function resetWhenLeavingMyPage() {
  if (isMyPagePath()) return;
  hasRequestedSubscriptionStatus = false;
  lastSubscriptionPayload = null;
  lastSubscriptionError = "";
  lastSubscriptionFetchAt = 0;
}

function scheduleSubscriptionPatch(delay = 80) {
  if (subscriptionPatchScheduled) return;
  subscriptionPatchScheduled = true;
  window.setTimeout(() => {
    subscriptionPatchScheduled = false;
    resetWhenLeavingMyPage();
    upsertSubscriptionPanel();
    syncMyPageActivePanel();
    requestSubscriptionStatusWhenVisible();
  }, delay);
}

function resetSubscriptionForUserChange() {
  const nextUserKey = getCurrentSubscriptionUserKey();
  if (nextUserKey === lastSubscriptionUserKey) {
    scheduleSubscriptionPatch(120);
    return;
  }

  lastSubscriptionUserKey = nextUserKey;
  hasRequestedSubscriptionStatus = false;
  lastSubscriptionPayload = null;
  lastSubscriptionError = "";
  lastSubscriptionFetchAt = 0;
  isFetchingSubscriptionStatus = false;
  subscriptionStatusCache.clear();
  subscriptionStatusInflight.clear();
  scheduleSubscriptionPatch(120);
}

function bootMyPageSubscriptionPatch() {
  if (subscriptionObserver) subscriptionObserver.disconnect();
  subscriptionObserver = new MutationObserver(() => scheduleSubscriptionPatch(80));

  subscriptionObserver.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => scheduleSubscriptionPatch(0), 150);
  document.addEventListener("click", (event) => {
    if (!event.target?.closest?.('[data-mypage-menu-key="billing"], [data-mypage-menu-key="plan"]')) return;
    window.setTimeout(requestSubscriptionStatusWhenVisible, 80);
  });
  document.addEventListener("change", (event) => {
    if (!event.target?.matches?.("[data-mypage-mobile-menu]")) return;
    window.setTimeout(requestSubscriptionStatusWhenVisible, 80);
  });
  window.addEventListener("finple-auth-updated", resetSubscriptionForUserChange);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyPageSubscriptionPatch, { once: true });
  } else {
    bootMyPageSubscriptionPatch();
  }
}

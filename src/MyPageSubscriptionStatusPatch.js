/* =========================================================
   Step 154 - MY PAGE subscription status patch
   - /api/payments/subscription/me와 MY PAGE 구독 상태 패널을 연결합니다.
   - 서버 구독/권한 상태를 브라우저 사용자·플랜 상태에 동기화합니다.
   - 기존 React 구조 변경을 최소화하기 위해 DOM 패치 레이어로 적용합니다.
========================================================= */

import {
  getFinpleApiBaseUrl,
  getStoredFinpleAuthUser,
  setStoredFinpleAuthUser,
} from "./components/portfolio/services/serverPortfolioService";
import { getStoredFinpleAuthSession } from "./components/authClientService";
import { normalizeFinplePlan, setStoredFinplePlan } from "./components/portfolio/config/planConfig";

let hasRequestedSubscriptionStatus = false;
let lastSubscriptionPayload = null;
let lastSubscriptionError = "";

function isMyPagePath() {
  return window.location.pathname === "/mypage";
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
    active: "구독 활성",
    cancel_at_period_end: "해지 예약",
    expired: "만료",
    refunded: "환불 처리",
    payment_failed: "결제 실패",
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

function getSubscriptionMessage(payload) {
  if (lastSubscriptionError) return lastSubscriptionError;
  if (!payload) return "구독 상태를 불러오고 있습니다.";
  if (!payload.authenticated) return payload.message || "로그인 후 구독 상태를 확인할 수 있습니다.";

  const plan = String(payload.plan || payload.entitlement?.plan || payload.subscription?.plan || "free").toLowerCase();
  if (plan === "personal") {
    return "서버 기준 Personal 권한이 확인되었습니다. 브라우저 표시 상태도 서버 기준으로 동기화됩니다.";
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
          <p>서버 결제 API 기준으로 현재 구독 상태와 권한 반영 상태를 확인합니다.</p>
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
          <em>정기결제 연결 후 표시</em>
        </div>
        <div>
          <span>이용 종료 예정일</span>
          <strong data-subscription-period-end>해당 없음</strong>
          <em>해지 예약 시 표시</em>
        </div>
      </div>

      <p class="serverStorageMessage compact subscriptionStatusMessage" data-subscription-message>구독 상태를 불러오고 있습니다.</p>

      <div class="serverStorageActions compactActions">
        <button type="button" class="primaryButton" data-subscription-pricing>요금제 / 결제 준비</button>
        <button type="button" class="secondaryButton" data-subscription-refresh>구독 상태 새로고침</button>
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

function upsertSubscriptionPanel() {
  if (!isMyPagePath()) return;
  if (document.querySelector("[data-subscription-status-panel]")) return;

  const target = findInsertionTarget();
  if (!target?.parentNode) return;

  target.insertAdjacentHTML("afterend", getSubscriptionPanelHtml());
  wireSubscriptionPanelActions();
  updateSubscriptionPanel();
  requestSubscriptionStatusOnce();
}

function wireSubscriptionPanelActions() {
  const panel = document.querySelector("[data-subscription-status-panel]");
  if (!panel) return;

  panel.querySelector("[data-subscription-pricing]")?.addEventListener("click", () => navigateTo("/pricing"));
  panel.querySelector("[data-subscription-support]")?.addEventListener("click", () => navigateTo("/support"));
  panel.querySelector("[data-subscription-refresh]")?.addEventListener("click", () => {
    hasRequestedSubscriptionStatus = false;
    requestSubscriptionStatusOnce();
  });
}

function getPlanFromPayload(payload) {
  return normalizeFinplePlan(payload?.plan || payload?.entitlement?.plan || payload?.subscription?.plan || "free");
}

function syncSubscriptionPayloadToBrowser(payload) {
  if (!payload?.authenticated) return;

  const plan = getPlanFromPayload(payload);
  const storedUser = getStoredFinpleAuthUser();

  if (storedUser?.id) {
    setStoredFinpleAuthUser({
      ...storedUser,
      plan,
      billingStatus: payload.status || payload.subscription?.status || "beta_free",
      subscriptionId: payload.subscription?.id || storedUser.subscriptionId || null,
      entitlementValidUntil: payload.entitlement?.valid_until || payload.entitlement?.validUntil || storedUser.entitlementValidUntil || null,
    });
  }

  setStoredFinplePlan(plan);

  window.dispatchEvent(new Event("finple-auth-updated"));
  window.dispatchEvent(new Event("finple-plan-updated"));
  window.dispatchEvent(new Event("finple-local-storage-updated"));
}

function updateSubscriptionPanel() {
  const panel = document.querySelector("[data-subscription-status-panel]");
  if (!panel) return;

  const payload = lastSubscriptionPayload;
  const subscription = payload?.subscription || {};
  const entitlement = payload?.entitlement || {};
  const plan = getPlanFromPayload(payload);
  const status = payload?.status || subscription?.status || (payload?.authenticated ? "beta_free" : "guest");

  setText(panel.querySelector("[data-subscription-badge]"), formatStatusLabel(status));
  setText(panel.querySelector("[data-subscription-plan]"), formatPlanLabel(plan));
  setText(panel.querySelector("[data-subscription-status]"), formatStatusLabel(status));
  setText(panel.querySelector("[data-subscription-next-billing]"), readDateLabel(subscription?.next_billing_at || subscription?.nextBillingAt));
  setText(
    panel.querySelector("[data-subscription-period-end]"),
    readDateLabel(subscription?.current_period_end || subscription?.currentPeriodEnd || entitlement?.valid_until || entitlement?.validUntil)
  );
  setText(panel.querySelector("[data-subscription-message]"), getSubscriptionMessage(payload));

  panel.classList.toggle("subscriptionStatusPanel--error", Boolean(lastSubscriptionError));
}

async function fetchSubscriptionStatus() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/subscription/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(user?.id ? { "x-finple-user-id": user.id } : {}),
    },
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

  return payload;
}

async function requestSubscriptionStatusOnce() {
  if (hasRequestedSubscriptionStatus || !isMyPagePath()) return;

  hasRequestedSubscriptionStatus = true;
  lastSubscriptionError = "";
  updateSubscriptionPanel();

  try {
    lastSubscriptionPayload = await fetchSubscriptionStatus();
    syncSubscriptionPayloadToBrowser(lastSubscriptionPayload);
  } catch (error) {
    lastSubscriptionPayload = null;
    lastSubscriptionError = error?.message || "구독 상태를 불러오지 못했습니다.";
  }

  updateSubscriptionPanel();
}

function resetWhenLeavingMyPage() {
  if (isMyPagePath()) return;
  hasRequestedSubscriptionStatus = false;
  lastSubscriptionPayload = null;
  lastSubscriptionError = "";
}

function bootMyPageSubscriptionPatch() {
  const observer = new MutationObserver(() => {
    resetWhenLeavingMyPage();
    upsertSubscriptionPanel();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => {
    resetWhenLeavingMyPage();
    upsertSubscriptionPanel();
  }, 150);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyPageSubscriptionPatch, { once: true });
  } else {
    bootMyPageSubscriptionPatch();
  }
}
import { useCallback, useEffect, useMemo, useState } from "react";
import { setStoredFinpleAuthUser } from "../../portfolio/services/serverPortfolioService";
import { setStoredFinplePlan } from "../../portfolio/config/planConfig";
import {
  getPlanFromPayload,
  getSubscriptionPlanDecision,
} from "../../portfolio/utils/subscriptionPlanStatus";
import {
  fetchJsonWithTimeout,
  formatDateLabel,
  getCurrentUserKey,
  SUBSCRIPTION_TTL_MS,
} from "../utils";

const subscriptionCache = new Map();
const subscriptionInflight = new Map();

function getCacheKey(user) {
  return `${getCurrentUserKey(user)}::subscription`;
}

function getAccessUntil(payload = {}) {
  const subscription = payload.subscription || {};
  const entitlement = payload.entitlement || {};
  return (
    payload.accessUntil ||
    payload.currentPeriodEnd ||
    subscription.current_period_end ||
    subscription.currentPeriodEnd ||
    entitlement.valid_until ||
    entitlement.validUntil ||
    null
  );
}

function normalizePayload(payload, user) {
  const decision = getSubscriptionPlanDecision(payload);
  const subscription = payload?.subscription || {};
  const plan = getPlanFromPayload(payload);
  const status = decision.status || payload?.status || subscription.status || "beta_free";
  const accessUntil = getAccessUntil(payload);

  return {
    payload,
    effectivePlan: plan,
    effectiveStatus: status,
    warnings: decision.warnings || [],
    accessUntil,
    currentPeriodEnd: payload?.currentPeriodEnd || subscription.current_period_end || subscription.currentPeriodEnd || null,
    nextBillingAt: payload?.nextBillingAt || subscription.next_billing_at || subscription.nextBillingAt || null,
    authenticated: Boolean(payload?.authenticated),
    userKey: getCurrentUserKey(user),
    fetchedAt: Date.now(),
  };
}

function syncSubscriptionToStorage(result, user) {
  if (!result?.authenticated) return;

  setStoredFinplePlan(result.effectivePlan);
  if (user?.id) {
    setStoredFinpleAuthUser({
      ...user,
      plan: result.effectivePlan,
      billingStatus: result.effectiveStatus,
      entitlementValidUntil: result.accessUntil || null,
    });
  }

  window.localStorage.setItem("finple-subscription-effective-status", JSON.stringify({
    effectivePlan: result.effectivePlan,
    effectiveStatus: result.effectiveStatus,
    accessUntil: result.accessUntil,
    currentPeriodEnd: result.currentPeriodEnd,
    nextBillingAt: result.nextBillingAt,
    serverNow: new Date().toISOString(),
  }));
}

async function fetchSubscription(user, force = false) {
  const cacheKey = getCacheKey(user);
  const cached = subscriptionCache.get(cacheKey);
  const now = Date.now();

  if (!force && cached && now - cached.fetchedAt < SUBSCRIPTION_TTL_MS) return cached;
  if (!force && subscriptionInflight.has(cacheKey)) return subscriptionInflight.get(cacheKey);

  const request = (async () => {
    const payload = await fetchJsonWithTimeout("/payments/subscription/me", { method: "GET" }, 12000);
    const result = normalizePayload(payload, user);
    subscriptionCache.set(cacheKey, result);
    syncSubscriptionToStorage(result, user);
    return result;
  })();

  subscriptionInflight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    subscriptionInflight.delete(cacheKey);
  }
}

export function useSubscriptionStatus(user) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    refreshing: false,
    error: "",
  });

  const userKey = getCurrentUserKey(user);

  const refresh = useCallback(async (options = {}) => {
    if (!user?.id) return null;
    setState((previous) => ({
      ...previous,
      loading: !previous.data,
      refreshing: Boolean(previous.data),
      error: "",
    }));

    try {
      const data = await fetchSubscription(user, Boolean(options.force));
      setState({ data, loading: false, refreshing: false, error: "" });
      return data;
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error: error?.message || "구독 상태를 불러오지 못했습니다.",
      }));
      return null;
    }
  }, [user, userKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const derived = useMemo(() => {
    const data = state.data;
    return {
      ...state,
      effectivePlan: data?.effectivePlan || "free",
      effectiveStatus: data?.effectiveStatus || "beta_free",
      accessUntilLabel: formatDateLabel(data?.accessUntil),
      nextBillingLabel: data?.effectivePlan === "personal" ? formatDateLabel(data?.nextBillingAt || data?.accessUntil) : "해당 없음",
    };
  }, [state]);

  return { ...derived, refresh };
}

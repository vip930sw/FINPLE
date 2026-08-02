const PAID_ACCESS_STATUSES = new Set(["active", "trialing", "cancel_at_period_end"]);
const BLOCKED_STATUSES = new Set([
  "expired",
  "refunded",
  "payment_failed",
  "past_due",
  "canceled",
  "cancelled",
  "free",
  "beta_free",
]);
const PLAN_RANK = { free: 0, personal: 1, pro: 2 };

export function normalizePlan(plan) {
  const normalized = String(plan || "free").trim().toLowerCase();
  return Object.hasOwn(PLAN_RANK, normalized) ? normalized : "free";
}

function normalizeStatus(status) {
  return String(status || "beta_free").trim().toLowerCase();
}

function getEntitlementValidUntil(entitlement = {}) {
  return entitlement?.valid_until || entitlement?.validUntil || null;
}

function getSubscriptionPeriodEnd(subscription = {}) {
  return subscription?.current_period_end || subscription?.currentPeriodEnd || null;
}

function parseTime(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getFutureState(value, nowMs) {
  const timestamp = parseTime(value);
  if (timestamp === null) return "missing";
  return timestamp > nowMs ? "future" : "past";
}

function getEntitlementCandidate(entitlement, nowMs) {
  const plan = normalizePlan(entitlement?.plan);
  const validUntil = getEntitlementValidUntil(entitlement);
  if (PLAN_RANK[plan] === 0 || getFutureState(validUntil, nowMs) !== "future") return null;
  return { plan, status: "active", source: "entitlement", accessUntil: validUntil, warnings: [] };
}

function getSubscriptionCandidate(subscription, nowMs) {
  const plan = normalizePlan(subscription?.plan);
  const status = normalizeStatus(subscription?.status);
  if (PLAN_RANK[plan] === 0 || !PAID_ACCESS_STATUSES.has(status)) return null;

  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const periodState = getFutureState(periodEnd, nowMs);
  if (periodState === "future") {
    return { plan, status, source: "subscription", accessUntil: periodEnd, warnings: [] };
  }
  return null;
}

function getBlockedState(subscription, entitlement, nowMs) {
  const subscriptionPlan = normalizePlan(subscription?.plan);
  const subscriptionStatus = normalizeStatus(subscription?.status);
  if (PLAN_RANK[subscriptionPlan] > 0 && subscription?.status) {
    if (!PAID_ACCESS_STATUSES.has(subscriptionStatus) && !BLOCKED_STATUSES.has(subscriptionStatus)) {
      return { status: subscriptionStatus, warnings: ["unknown_subscription_status_blocked"] };
    }
    if (PAID_ACCESS_STATUSES.has(subscriptionStatus) &&
        getFutureState(getSubscriptionPeriodEnd(subscription), nowMs) === "past") {
      return { status: "expired", warnings: ["personal_entitlement_expired"] };
    }
    if (BLOCKED_STATUSES.has(subscriptionStatus)) return { status: subscriptionStatus, warnings: [] };
  }

  if (PLAN_RANK[normalizePlan(entitlement?.plan)] > 0 && getEntitlementValidUntil(entitlement)) {
    return { status: "expired", warnings: ["personal_entitlement_expired"] };
  }
  return { status: "beta_free", warnings: [] };
}

export function getEffectiveSubscriptionState({ user, subscription, entitlement, now = new Date() } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const normalizedNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const candidates = [
    normalizePlan(user?.plan) === "pro"
      ? { plan: "pro", status: "active", source: "user", accessUntil: null, warnings: [] }
      : null,
    getEntitlementCandidate(entitlement, normalizedNowMs),
    getSubscriptionCandidate(subscription, normalizedNowMs),
  ].filter(Boolean);
  const winner = candidates.reduce((best, candidate) => (
    !best || PLAN_RANK[candidate.plan] > PLAN_RANK[best.plan] ? candidate : best
  ), null);

  if (winner) {
    return {
      plan: winner.plan,
      status: winner.status,
      effectivePlan: winner.plan,
      effectiveStatus: winner.status,
      effectiveSource: winner.source,
      accessUntil: winner.accessUntil,
      warnings: winner.warnings,
    };
  }

  const blocked = getBlockedState(subscription, entitlement, normalizedNowMs);
  return {
    plan: "free",
    status: blocked.status,
    effectivePlan: "free",
    effectiveStatus: blocked.status,
    effectiveSource: "user",
    accessUntil: null,
    warnings: blocked.warnings,
  };
}

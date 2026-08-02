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
const SOURCE_RANK = { user: 0, entitlement: 1, subscription: 2 };

export function normalizePlan(plan) {
  const normalized = String(plan || "free").trim().toLowerCase();
  return Object.hasOwn(PLAN_RANK, normalized) ? normalized : "free";
}

function normalizeStatus(status) {
  return String(status || "beta_free").trim().toLowerCase();
}

function getEntitlementValidUntil(entitlement = {}) {
  return entitlement?.valid_until ?? entitlement?.validUntil ?? null;
}

function getEntitlementValidFrom(entitlement = {}) {
  return entitlement?.valid_from ?? entitlement?.validFrom ?? null;
}

function getSubscriptionPeriodEnd(subscription = {}) {
  return subscription?.current_period_end || subscription?.currentPeriodEnd || null;
}

function getTimeState(value, nowMs) {
  if (value === null || value === undefined) return "missing";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "invalid";
  return timestamp > nowMs ? "future" : "past";
}

function getEntitlementCandidate(entitlement, nowMs) {
  const plan = normalizePlan(entitlement?.plan);
  const validFromState = getTimeState(getEntitlementValidFrom(entitlement), nowMs);
  const validUntil = getEntitlementValidUntil(entitlement);
  const validUntilState = getTimeState(validUntil, nowMs);
  if (
    PLAN_RANK[plan] === 0 ||
    validFromState === "future" ||
    validFromState === "invalid" ||
    validUntilState === "past" ||
    validUntilState === "invalid"
  ) return null;
  return { plan, status: "active", source: "entitlement", accessUntil: validUntil, warnings: [] };
}

function getSubscriptionCandidate(subscription, nowMs) {
  const plan = normalizePlan(subscription?.plan);
  const status = normalizeStatus(subscription?.status);
  if (PLAN_RANK[plan] === 0 || !PAID_ACCESS_STATUSES.has(status)) return null;

  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const periodState = getTimeState(periodEnd, nowMs);
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
        getTimeState(getSubscriptionPeriodEnd(subscription), nowMs) !== "future") {
      return { status: "expired", warnings: ["personal_entitlement_expired"] };
    }
    if (BLOCKED_STATUSES.has(subscriptionStatus)) return { status: subscriptionStatus, warnings: [] };
  }

  if (PLAN_RANK[normalizePlan(entitlement?.plan)] > 0) {
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
    !best ||
    PLAN_RANK[candidate.plan] > PLAN_RANK[best.plan] ||
    (candidate.plan === best.plan && SOURCE_RANK[candidate.source] > SOURCE_RANK[best.source])
      ? candidate
      : best
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

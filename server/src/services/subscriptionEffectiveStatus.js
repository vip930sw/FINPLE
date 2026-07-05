const PERSONAL_ACCESS_STATUSES = new Set(["active", "trialing", "cancel_at_period_end"]);
const PERSONAL_BLOCKED_STATUSES = new Set([
  "expired",
  "refunded",
  "payment_failed",
  "past_due",
  "canceled",
  "cancelled",
  "free",
  "beta_free",
]);

function normalizePlan(plan) {
  return String(plan || "free").toLowerCase() === "personal" ? "personal" : "free";
}

function normalizeStatus(status) {
  return String(status || "beta_free").toLowerCase();
}

function getEntitlementValidUntil(entitlement = {}) {
  return entitlement?.valid_until || entitlement?.validUntil || null;
}

function getRawStatus({ subscription, entitlement }) {
  if (subscription?.status) return normalizeStatus(subscription.status);
  if (normalizePlan(entitlement?.plan) === "personal" && getEntitlementValidUntil(entitlement)) {
    return "active";
  }
  return "beta_free";
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

function getDateDecision({ status, subscription, entitlement, nowMs }) {
  const subscriptionPeriodState = getFutureState(
    subscription?.current_period_end || subscription?.currentPeriodEnd,
    nowMs
  );
  if (subscriptionPeriodState !== "missing") return subscriptionPeriodState;

  const entitlementState = getFutureState(getEntitlementValidUntil(entitlement), nowMs);
  if (entitlementState !== "missing") return entitlementState;

  return status === "active" || status === "trialing" ? "missing_allowed" : "missing";
}

export function getEffectiveSubscriptionState({ user, subscription, entitlement, now = new Date() } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const normalizedNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const rawStatus = getRawStatus({ subscription, entitlement });
  const rawPlan = normalizePlan(entitlement?.plan || subscription?.plan || user?.plan || "free");
  const warnings = [];

  if (rawPlan !== "personal") {
    return {
      plan: "free",
      status: rawStatus,
      effectivePlan: "free",
      effectiveStatus: rawStatus,
      warnings,
    };
  }

  if (PERSONAL_BLOCKED_STATUSES.has(rawStatus)) {
    return {
      plan: "free",
      status: rawStatus,
      effectivePlan: "free",
      effectiveStatus: rawStatus,
      warnings,
    };
  }

  if (!PERSONAL_ACCESS_STATUSES.has(rawStatus)) {
    return {
      plan: "free",
      status: rawStatus,
      effectivePlan: "free",
      effectiveStatus: rawStatus || "unknown",
      warnings: ["unknown_subscription_status_blocked"],
    };
  }

  const dateDecision = getDateDecision({
    status: rawStatus,
    subscription,
    entitlement,
    nowMs: normalizedNowMs,
  });

  if (dateDecision === "future") {
    return {
      plan: "personal",
      status: rawStatus,
      effectivePlan: "personal",
      effectiveStatus: rawStatus,
      warnings,
    };
  }

  if (dateDecision === "missing_allowed") {
    return {
      plan: "personal",
      status: rawStatus,
      effectivePlan: "personal",
      effectiveStatus: rawStatus,
      warnings: ["personal_period_end_missing_temporary_access"],
    };
  }

  return {
    plan: "free",
    status: "expired",
    effectivePlan: "free",
    effectiveStatus: "expired",
    warnings: ["personal_entitlement_expired"],
  };
}

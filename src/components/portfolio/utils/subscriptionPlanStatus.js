import { normalizeFinplePlan } from "../config/planConfig.js";

export const PERSONAL_ACCESS_STATUSES = new Set(["active", "trialing", "cancel_at_period_end"]);
export const PERSONAL_BLOCKED_STATUSES = new Set([
  "expired",
  "refunded",
  "payment_failed",
  "past_due",
  "canceled",
  "cancelled",
  "free",
  "beta_free",
]);

export function normalizeBillingStatus(status) {
  return String(status || "beta_free").toLowerCase();
}

function isFutureDate(value) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function hasDateValue(value) {
  return Boolean(value);
}

function getPeriodEnd(subscription = {}) {
  return subscription?.current_period_end || subscription?.currentPeriodEnd || null;
}

function getEntitlementValidUntil(entitlement = {}) {
  return entitlement?.valid_until || entitlement?.validUntil || null;
}

function getPayloadStatus({ payload, plan, subscription, entitlement }) {
  if (payload?.status) return payload.status;
  if (subscription?.status) return subscription.status;
  if (plan === "personal" && getEntitlementValidUntil(entitlement)) return "active";
  return "beta_free";
}

export function isBlockedSubscriptionStatus(status) {
  return PERSONAL_BLOCKED_STATUSES.has(normalizeBillingStatus(status));
}

export function hasUsablePersonalEntitlement({ plan, status, subscription, entitlement }) {
  if (plan !== "personal") return false;
  const normalizedStatus = normalizeBillingStatus(status);
  if (PERSONAL_BLOCKED_STATUSES.has(normalizedStatus)) return false;
  if (!PERSONAL_ACCESS_STATUSES.has(normalizedStatus)) return false;

  const periodEnd = getPeriodEnd(subscription);
  if (hasDateValue(periodEnd)) return isFutureDate(periodEnd);

  const entitlementValidUntil = getEntitlementValidUntil(entitlement);
  if (hasDateValue(entitlementValidUntil)) return isFutureDate(entitlementValidUntil);

  return normalizedStatus === "active" || normalizedStatus === "trialing";
}

export function getSubscriptionPlanDecision(payload) {
  const subscription = payload?.subscription || {};
  const entitlement = payload?.entitlement || {};
  const plan = normalizeFinplePlan(payload?.plan || entitlement?.plan || subscription?.plan || "free");
  const status = getPayloadStatus({ payload, plan, subscription, entitlement });
  const warnings = [];

  if (!payload?.authenticated) {
    return { plan: "free", status: "guest", warnings };
  }

  if (hasUsablePersonalEntitlement({ plan, status, subscription, entitlement })) {
    if (!getPeriodEnd(subscription) && !getEntitlementValidUntil(entitlement)) {
      warnings.push("personal_period_end_missing_temporary_access");
    }
    return { plan: "personal", status: normalizeBillingStatus(status), warnings };
  }

  return {
    plan: plan === "pro" ? "pro" : "free",
    status: plan === "personal" && PERSONAL_ACCESS_STATUSES.has(normalizeBillingStatus(status))
      ? "expired"
      : normalizeBillingStatus(status),
    warnings: plan === "personal" ? ["personal_entitlement_expired"] : warnings,
  };
}

export function getPlanFromPayload(payload) {
  return getSubscriptionPlanDecision(payload).plan;
}

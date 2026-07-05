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

export function isBlockedSubscriptionStatus(status) {
  return PERSONAL_BLOCKED_STATUSES.has(normalizeBillingStatus(status));
}

export function hasUsablePersonalEntitlement({ plan, status, subscription, entitlement }) {
  if (plan !== "personal") return false;
  const normalizedStatus = normalizeBillingStatus(status);
  if (PERSONAL_BLOCKED_STATUSES.has(normalizedStatus)) return false;
  if (!PERSONAL_ACCESS_STATUSES.has(normalizedStatus)) return false;
  if (normalizedStatus !== "cancel_at_period_end") return true;

  return isFutureDate(
    subscription?.current_period_end ||
      subscription?.currentPeriodEnd ||
      entitlement?.valid_until ||
      entitlement?.validUntil
  );
}

export function getPlanFromPayload(payload) {
  if (!payload?.authenticated) return "free";

  const subscription = payload.subscription || {};
  const entitlement = payload.entitlement || {};
  const plan = normalizeFinplePlan(payload?.plan || entitlement?.plan || subscription?.plan || "free");
  const status = payload?.status || subscription?.status || "beta_free";

  if (hasUsablePersonalEntitlement({ plan, status, subscription, entitlement })) {
    return "personal";
  }

  return plan === "pro" ? "pro" : "free";
}

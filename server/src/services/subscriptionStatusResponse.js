import { getEffectiveSubscriptionState } from "./subscriptionEffectiveStatus.js";

export function buildSubscriptionStatusFields({ user, subscription, entitlement, now = new Date() } = {}) {
  const effective = getEffectiveSubscriptionState({ user, subscription, entitlement, now });
  const currentPeriodEnd = subscription?.current_period_end || subscription?.currentPeriodEnd || null;

  return {
    plan: effective.plan,
    status: effective.status,
    effectivePlan: effective.effectivePlan,
    effectiveStatus: effective.effectiveStatus,
    accessUntil: effective.accessUntil,
    currentPeriodStart: subscription?.current_period_start || subscription?.currentPeriodStart || null,
    currentPeriodEnd,
    nextBillingAt:
      effective.effectiveSource === "subscription" && effective.effectiveStatus !== "cancel_at_period_end"
        ? currentPeriodEnd
        : null,
    accessReason: effective.effectiveSource === "subscription"
      ? "subscription_current_period_end"
      : effective.effectiveSource === "entitlement"
        ? "entitlement_valid_until"
        : effective.effectiveStatus || "not_paid",
    rawPlan: entitlement?.plan || user?.plan || "free",
    rawStatus: subscription?.status || "beta_free",
    warnings: effective.warnings,
  };
}

import { isDatabaseConfigured, query } from "../db/database.js";
import { getEffectiveSubscriptionState } from "./subscriptionEffectiveStatus.js";

const AI_PAID_PLANS = new Set(["personal", "pro"]);

export function applyAiAnalysisEntitlement(user, entitlement = null, subscription = null, now = new Date()) {
  if (!user?.id) return user || null;

  const effective = getEffectiveSubscriptionState({ user, subscription, entitlement, now });
  const effectivePlan = effective.effectivePlan;
  if (!AI_PAID_PLANS.has(effectivePlan)) {
    return {
      ...user,
      plan: "free",
      aiPlanSource: "user",
    };
  }

  const planSource = effective.effectiveSource === "entitlement"
    ? entitlement?.source || "entitlement"
    : effective.effectiveSource;
  return {
    ...user,
    plan: effectivePlan,
    aiPlanSource: planSource,
    aiEntitlement: {
      plan: effectivePlan,
      source: planSource,
      validUntil: effective.accessUntil,
    },
  };
}

export async function enrichUserWithAiAnalysisEntitlement(user) {
  if (!user?.id || !isDatabaseConfigured()) return applyAiAnalysisEntitlement(user);

  try {
    const entitlementResult = await query(
      `SELECT plan, source, valid_until
       FROM user_entitlements
       WHERE user_id = $1
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until > NOW())
       ORDER BY updated_at DESC NULLS LAST, valid_until DESC NULLS LAST
       LIMIT 1`,
      [user.id]
    );
    const subscriptionResult = await query(
      `SELECT plan, status, current_period_start, current_period_end,
              cancel_at_period_end, ended_at, provider
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY current_period_start DESC NULLS LAST, current_period_end DESC NULLS LAST
       LIMIT 1`,
      [user.id]
    );

    return applyAiAnalysisEntitlement(
      user,
      entitlementResult.rows?.[0] || null,
      subscriptionResult.rows?.[0] || null,
    );
  } catch {
    return applyAiAnalysisEntitlement({ ...user, plan: "free" });
  }
}

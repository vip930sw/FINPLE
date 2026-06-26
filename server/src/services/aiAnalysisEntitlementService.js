import { isDatabaseConfigured, query } from "../db/database.js";

const AI_PAID_PLANS = new Set(["personal", "pro"]);

function normalizePlan(plan) {
  return String(plan || "").trim().toLowerCase();
}

export function applyAiAnalysisEntitlement(user, entitlement = null) {
  if (!user?.id) return user || null;

  const entitlementPlan = normalizePlan(entitlement?.plan);
  if (!AI_PAID_PLANS.has(entitlementPlan)) {
    return {
      ...user,
      aiPlanSource: "user",
    };
  }

  return {
    ...user,
    plan: entitlementPlan,
    aiPlanSource: entitlement?.source || "entitlement",
    aiEntitlement: {
      plan: entitlementPlan,
      source: entitlement?.source || "entitlement",
      validUntil: entitlement?.valid_until || null,
    },
  };
}

export async function enrichUserWithAiAnalysisEntitlement(user) {
  if (!user?.id || !isDatabaseConfigured()) return applyAiAnalysisEntitlement(user);

  try {
    const result = await query(
      `SELECT plan, source, valid_until
       FROM user_entitlements
       WHERE user_id = $1
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
       ORDER BY updated_at DESC NULLS LAST, valid_until DESC NULLS LAST
       LIMIT 1`,
      [user.id]
    );

    return applyAiAnalysisEntitlement(user, result.rows?.[0] || null);
  } catch (error) {
    return applyAiAnalysisEntitlement(user);
  }
}

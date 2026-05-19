const PENDING_CHECKOUT_PLAN_KEY = "finple-pending-checkout-plan";

export function setPendingCheckoutPlan(planKey = "personal") {
  const normalizedPlan = String(planKey || "personal").trim().toLowerCase() || "personal";

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      PENDING_CHECKOUT_PLAN_KEY,
      JSON.stringify({
        planKey: normalizedPlan,
        createdAt: new Date().toISOString(),
      })
    );
  }

  return normalizedPlan;
}

export function getPendingCheckoutPlan() {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(PENDING_CHECKOUT_PLAN_KEY) || "null");
    return parsed?.planKey ? parsed : null;
  } catch (error) {
    return null;
  }
}

export function clearPendingCheckoutPlan() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PENDING_CHECKOUT_PLAN_KEY);
  }
}

export function getPostAuthDestination(defaultPage = "mypage") {
  const pending = getPendingCheckoutPlan();
  if (pending?.planKey === "personal") {
    return "billing";
  }

  return defaultPage;
}

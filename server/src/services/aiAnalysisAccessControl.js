const DEFAULT_ALLOWED_PLANS = ["personal", "pro"];

export function getAiAnalysisAccessMode() {
  return String(process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE || "public").trim().toLowerCase();
}

export function getAiAnalysisAllowedPlans() {
  return String(process.env.FINPLE_AI_ANALYSIS_ALLOWED_PLANS || DEFAULT_ALLOWED_PLANS.join(","))
    .split(",")
    .map((plan) => plan.trim().toLowerCase())
    .filter(Boolean);
}

export function getAiAnalysisAccessState(user, {
  accessMode = getAiAnalysisAccessMode(),
  allowedPlans = getAiAnalysisAllowedPlans(),
} = {}) {
  if (accessMode !== "personal") {
    return {
      allowed: true,
      mode: accessMode,
      reason: null,
      requiredPlans: allowedPlans,
      currentPlan: user?.plan || "guest",
    };
  }

  const plan = String(user?.plan || "free").trim().toLowerCase();
  const allowed = Boolean(user?.id) && allowedPlans.includes(plan);

  return {
    allowed,
    mode: accessMode,
    reason: allowed ? null : "plan_required",
    requiredPlans: allowedPlans,
    currentPlan: plan,
  };
}

export function assertAiAnalysisAccessAllowed(user) {
  const access = getAiAnalysisAccessState(user);
  if (access.allowed) return access;

  const error = new Error("AI analysis is available for Personal plan users.");
  error.statusCode = 403;
  error.details = [`requiredPlans=${access.requiredPlans.join(",")}`];
  error.access = access;
  throw error;
}

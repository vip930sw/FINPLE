const DEFAULT_ALLOWED_PLANS = ["personal", "pro"];

export function getAiAnalysisAccessMode() {
  return String(process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE || "personal").trim().toLowerCase();
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
  if (!user?.id) {
    const error = new Error("로그인이 필요합니다.");
    error.statusCode = 401;
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const access = getAiAnalysisAccessState(user);
  if (access.allowed) return access;

  const error = new Error("포트폴리오 AI 분석은 Personal 플랜에서 사용할 수 있습니다.");
  error.statusCode = 403;
  error.code = "AI_ANALYSIS_PLAN_REQUIRED";
  throw error;
}

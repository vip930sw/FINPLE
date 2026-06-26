export const FINPLE_PLAN_STORAGE_KEY = "finple-selected-plan";
const FINPLE_AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";

export const FINPLE_PLAN_CONFIGS = {
  free: {
    key: "free",
    label: "Free",
    priceLabel: "0원",
    featured: false,
    planRole: "기능 체험판",
    serverStorageLabel: "브라우저 저장 중심 · 서버 저장 제한",
    upgradeHeadline: "Free는 체험판입니다",
    upgradeDescription: "Personal 플랜부터 포트폴리오 저장 수, 자산 수, 서버 저장, PDF 리포트, STEP 4 AI 분석 기능을 확장할 수 있습니다.",
    items: [
      "포트폴리오 1개 저장",
      "포트폴리오당 자산 5개",
      "브라우저 자동 저장",
      "PDF 리포트 제한",
      "STEP 4 AI 분석 제한",
    ],
    limits: {
      portfolios: 1,
      assetsPerPortfolio: 5,
      serverStorage: false,
      apiLookupsPerDay: Infinity,
      apiLookupsLabel: "기본 제공",
      pdfEnabled: false,
      pdfLevel: "제한",
      reportLevel: "AI 분석 제한",
      screenerLevel: "기본 검색",
      supportLevel: "일반 문의",
    },
  },
  personal: {
    key: "personal",
    label: "Personal",
    priceLabel: "월 9,900원",
    featured: true,
    planRole: "개인 투자자 실사용 플랜",
    serverStorageLabel: "서버 저장 · 불러오기 지원",
    upgradeHeadline: "Personal 플랜을 이용 중입니다",
    upgradeDescription: "포트폴리오 30개, 포트폴리오당 자산 30개, 서버 저장, PDF 리포트, STEP 4 AI 분석 기능을 사용할 수 있습니다.",
    items: [
      "포트폴리오 30개 저장",
      "포트폴리오당 자산 30개",
      "서버 저장 및 불러오기",
      "PDF 리포트 저장",
      "STEP 4 AI 분석 20회/일",
      "우선 검토 문의",
    ],
    limits: {
      portfolios: 30,
      assetsPerPortfolio: 30,
      serverStorage: true,
      apiLookupsPerDay: Infinity,
      apiLookupsLabel: "기본 제공",
      pdfEnabled: true,
      pdfLevel: "지원",
      reportLevel: "AI 분석 20회/일",
      screenerLevel: "전체 검색",
      supportLevel: "우선 검토",
    },
  },
  pro: {
    key: "pro",
    label: "Pro",
    priceLabel: "준비 중",
    featured: false,
    planRole: "업무용 확장 준비",
    serverStorageLabel: "고급 분석 + 업무용 확장 준비",
    upgradeHeadline: "Pro 플랜은 준비 중입니다",
    upgradeDescription: "고급 백테스트, 리밸런싱 분석, 업무용 리포트 등은 정식 운영 단계에서 검토합니다.",
    items: [
      "고급 백테스트",
      "리밸런싱 분석",
      "고급 위험 지표",
      "장기 성과 비교",
      "AI 분석 운영 한도 확장",
      "업무용 확장 기능",
    ],
    limits: {
      portfolios: Infinity,
      assetsPerPortfolio: Infinity,
      serverStorage: true,
      apiLookupsPerDay: Infinity,
      apiLookupsLabel: "기본 제공",
      pdfEnabled: true,
      pdfLevel: "업무용",
      reportLevel: "업무용 리포트",
      screenerLevel: "전체 검색 + 고급 필터",
      supportLevel: "우선",
    },
  },
};

export function normalizeFinplePlan(planKey) {
  return FINPLE_PLAN_CONFIGS[planKey] ? planKey : "free";
}

function hasStoredFinpleAuthUser() {
  if (typeof window === "undefined") return false;

  try {
    const storedUser = JSON.parse(window.localStorage.getItem(FINPLE_AUTH_USER_STORAGE_KEY) || "null");
    return Boolean(storedUser?.id);
  } catch (error) {
    return false;
  }
}

export function getStoredFinplePlan() {
  if (typeof window === "undefined") return "free";

  if (!hasStoredFinpleAuthUser()) {
    window.localStorage.removeItem(FINPLE_PLAN_STORAGE_KEY);
    return "free";
  }

  const storedPlan = window.localStorage.getItem(FINPLE_PLAN_STORAGE_KEY);
  return normalizeFinplePlan(storedPlan);
}

export function setStoredFinplePlan(planKey) {
  const normalizedPlanKey = normalizeFinplePlan(planKey);
  const plan = FINPLE_PLAN_CONFIGS[normalizedPlanKey];

  if (typeof window !== "undefined") {
    if (hasStoredFinpleAuthUser()) {
      window.localStorage.setItem(FINPLE_PLAN_STORAGE_KEY, normalizedPlanKey);
    } else {
      window.localStorage.removeItem(FINPLE_PLAN_STORAGE_KEY);
    }

    window.dispatchEvent(new Event("finple-plan-updated"));
  }

  return hasStoredFinpleAuthUser() ? plan : FINPLE_PLAN_CONFIGS.free;
}

export function getPlanUsageStatus(planKey, snapshot = {}) {
  const plan = FINPLE_PLAN_CONFIGS[normalizeFinplePlan(planKey)] || FINPLE_PLAN_CONFIGS.free;
  const portfolioCount = Number(snapshot?.portfolioCount || 0);
  const portfolioLimit = plan.limits.portfolios;
  const isPortfolioUnlimited = portfolioLimit === Infinity;

  return {
    plan,
    portfolios: {
      current: portfolioCount,
      limit: portfolioLimit,
      isUnlimited: isPortfolioUnlimited,
      isOverLimit: !isPortfolioUnlimited && portfolioCount > portfolioLimit,
      isAtLimit: !isPortfolioUnlimited && portfolioCount >= portfolioLimit,
      remaining: isPortfolioUnlimited ? Infinity : Math.max(0, portfolioLimit - portfolioCount),
    },
  };
}

const FREE_API_USAGE_STORAGE_KEY = "finple-free-api-usage";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readFreeApiUsage() {
  if (typeof window === "undefined") {
    return { date: getTodayKey(), count: 0 };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FREE_API_USAGE_STORAGE_KEY) || "{}");
    const today = getTodayKey();

    if (parsed?.date !== today) {
      return { date: today, count: 0 };
    }

    return { date: today, count: Number(parsed?.count || 0) };
  } catch (error) {
    return { date: getTodayKey(), count: 0 };
  }
}

function writeFreeApiUsage(usage) {
  if (typeof window === "undefined") return usage;
  window.localStorage.setItem(FREE_API_USAGE_STORAGE_KEY, JSON.stringify(usage));
  window.dispatchEvent(new Event("finple-plan-usage-updated"));
  return usage;
}

export function getFreeApiUsageStatus() {
  const usage = readFreeApiUsage();
  const limit = Number(FINPLE_PLAN_CONFIGS.free.limits.apiLookupsPerDay || Infinity);

  return {
    ...usage,
    limit,
    remaining: Number.isFinite(limit) ? Math.max(0, limit - usage.count) : Infinity,
    isLimitReached: Number.isFinite(limit) ? usage.count >= limit : false,
  };
}

export function canUseFreeApiLookup(requestCount = 1) {
  const usage = getFreeApiUsageStatus();
  if (!Number.isFinite(usage.limit)) return true;
  return usage.count + Number(requestCount || 1) <= usage.limit;
}

export function consumeFreeApiLookup(requestCount = 1) {
  const countToAdd = Math.max(1, Number(requestCount || 1));
  const usage = getFreeApiUsageStatus();

  if (Number.isFinite(usage.limit) && usage.count + countToAdd > usage.limit) {
    return {
      ok: false,
      ...usage,
      requested: countToAdd,
    };
  }

  if (!Number.isFinite(usage.limit)) {
    return {
      ok: true,
      ...usage,
      requested: countToAdd,
    };
  }

  const nextUsage = writeFreeApiUsage({
    date: usage.date,
    count: usage.count + countToAdd,
  });

  return {
    ok: true,
    ...nextUsage,
    limit: usage.limit,
    remaining: Math.max(0, usage.limit - nextUsage.count),
    requested: countToAdd,
  };
}

export const FINPLE_UPGRADE_TARGET_PLAN = "personal";

export const FINPLE_LIMIT_REASON_MAP = {
  portfolio: {
    title: "포트폴리오 개수 제한",
    blockedLabel: "새 포트폴리오 생성",
    personalBenefit: "Personal 플랜에서는 포트폴리오를 30개까지 저장하고 서버 동기화를 사용할 수 있습니다.",
  },
  asset: {
    title: "자산 개수 제한",
    blockedLabel: "자산 추가",
    personalBenefit: "Personal 플랜에서는 포트폴리오당 자산을 30개까지 구성하고 서버 저장 기능을 사용할 수 있습니다.",
  },
  api: {
    title: "현재가 조회 일시 제한",
    blockedLabel: "현재가·지표 조회",
    personalBenefit: "잠시 후 다시 시도하거나 서버 상태를 확인해 주세요.",
  },
  pdf: {
    title: "PDF 저장 제한",
    blockedLabel: "PDF 저장/인쇄",
    personalBenefit: "Personal 플랜부터 PDF 저장과 고급 리포트 출력이 가능합니다.",
  },
  server: {
    title: "서버 저장 제한",
    blockedLabel: "서버 저장/불러오기",
    personalBenefit: "Personal 플랜에서는 포트폴리오를 서버에 저장하고 다른 환경에서 다시 불러올 수 있습니다.",
  },
};

export function getPlanLimitMessage(planKey, type) {
  const plan = FINPLE_PLAN_CONFIGS[normalizeFinplePlan(planKey)] || FINPLE_PLAN_CONFIGS.free;

  if (type === "portfolio") {
    return `${plan.label} 플랜은 포트폴리오 ${formatPlanLimit(plan.limits.portfolios)}까지만 사용할 수 있습니다. Personal 플랜에서 포트폴리오 저장 개수를 확대할 수 있습니다.`;
  }

  if (type === "asset") {
    return `${plan.label} 플랜은 포트폴리오당 자산 ${formatPlanLimit(plan.limits.assetsPerPortfolio)}까지만 추가할 수 있습니다. Personal 플랜에서 더 많은 자산을 구성할 수 있습니다.`;
  }

  if (type === "pdf") {
    return `${plan.label} 플랜에서는 PDF 저장을 사용할 수 없습니다. Personal 플랜부터 PDF 리포트 저장이 가능합니다.`;
  }

  if (type === "api") {
    return "현재가·지표 조회가 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (type === "server") {
    return `${plan.label} 플랜에서는 서버 저장/불러오기를 사용할 수 없습니다. Personal 플랜부터 서버 저장이 가능합니다.`;
  }

  return `${plan.label} 플랜에서 제한된 기능입니다. Personal 플랜에서 기능을 확장할 수 있습니다.`;
}

export function getPlanLimitUpgradeSummary(planKey, type) {
  const plan = FINPLE_PLAN_CONFIGS[normalizeFinplePlan(planKey)] || FINPLE_PLAN_CONFIGS.free;
  const reason = FINPLE_LIMIT_REASON_MAP[type] || FINPLE_LIMIT_REASON_MAP.server;

  return {
    type,
    planKey: plan.key,
    planLabel: plan.label,
    title: reason.title,
    blockedLabel: reason.blockedLabel,
    message: getPlanLimitMessage(plan.key, type),
    ctaLabel: type === "api" ? "확인" : "요금제 보기",
    targetPlan: FINPLE_UPGRADE_TARGET_PLAN,
    benefit: reason.personalBenefit,
  };
}

export function getUpgradePromptText(planKey, type) {
  const summary = getPlanLimitUpgradeSummary(planKey, type);
  if (type === "api") {
    return `${summary.message}\n\n${summary.benefit}`;
  }
  return `${summary.message}\n\n${summary.benefit}\n\n요금제 화면으로 이동할까요?`;
}

export function formatPlanLimit(value) {
  return value === Infinity ? "무제한" : `${value}개`;
}

export const FINPLE_PLAN_STORAGE_KEY = "finple-selected-plan";

export const FINPLE_PLAN_CONFIGS = {
  free: {
    key: "free",
    label: "Free",
    priceLabel: "0원",
    featured: false,
    serverStorageLabel: "브라우저 저장 중심 · 서버 저장 제한",
    items: [
      "기본 포트폴리오 시뮬레이션",
      "브라우저 자동 저장",
      "제한된 자산 조회",
      "요약 리포트 확인",
    ],
    limits: {
      portfolios: 1,
      assetsPerPortfolio: 5,
      serverStorage: false,
      apiLookupsPerDay: "체험 3회/일",
      pdfLevel: "저장 불가",
      reportLevel: "요약 미리보기",
      screenerLevel: "기본 검색",
      supportLevel: "일반",
    },
  },
  personal: {
    key: "personal",
    label: "Personal",
    priceLabel: "월 9,900원",
    featured: true,
    serverStorageLabel: "서버 저장 지원",
    items: [
      "서버 포트폴리오 저장",
      "여러 포트폴리오 관리",
      "API 조회량 확대",
      "PDF 리포트 저장",
      "문의 지원",
    ],
    limits: {
      portfolios: 30,
      serverStorage: true,
      apiLookupsPerDay: "확대",
      pdfLevel: "고급",
      reportLevel: "고급 리포트",
      screenerLevel: "전체 검색",
      supportLevel: "우선",
    },
  },
  pro: {
    key: "pro",
    label: "Pro",
    priceLabel: "준비 중",
    featured: false,
    serverStorageLabel: "고급 분석 + 업무용 확장 준비",
    items: [
      "고급 백테스트",
      "리밸런싱 분석",
      "고급 위험 지표",
      "장기 성과 비교",
      "업무용 확장 기능",
    ],
    limits: {
      portfolios: Infinity,
      serverStorage: true,
      apiLookupsPerDay: "대량",
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

export function getStoredFinplePlan() {
  if (typeof window === "undefined") return "free";

  const storedPlan = window.localStorage.getItem(FINPLE_PLAN_STORAGE_KEY);
  return normalizeFinplePlan(storedPlan);
}

export function setStoredFinplePlan(planKey) {
  const normalizedPlanKey = normalizeFinplePlan(planKey);
  const plan = FINPLE_PLAN_CONFIGS[normalizedPlanKey];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(FINPLE_PLAN_STORAGE_KEY, normalizedPlanKey);
    window.dispatchEvent(new Event("finple-plan-updated"));
  }

  return plan;
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
  const limit = 3;

  return {
    ...usage,
    limit,
    remaining: Math.max(0, limit - usage.count),
    isLimitReached: usage.count >= limit,
  };
}

export function canUseFreeApiLookup(requestCount = 1) {
  const usage = getFreeApiUsageStatus();
  return usage.count + Number(requestCount || 1) <= usage.limit;
}

export function consumeFreeApiLookup(requestCount = 1) {
  const countToAdd = Math.max(1, Number(requestCount || 1));
  const usage = getFreeApiUsageStatus();

  if (usage.count + countToAdd > usage.limit) {
    return {
      ok: false,
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
    personalBenefit: "Personal 플랜에서는 더 많은 자산을 구성하고 서버 저장 기능을 사용할 수 있습니다.",
  },
  api: {
    title: "API 조회 한도",
    blockedLabel: "현재가 조회",
    personalBenefit: "Personal 플랜에서는 API 조회량을 확대하고 서버 저장/고급 리포트를 사용할 수 있습니다.",
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
    return `${plan.label} 플랜의 API 조회 체험 한도에 도달했습니다. Personal 플랜에서 조회량을 확대할 수 있습니다.`;
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
    ctaLabel: "요금제 보기",
    targetPlan: FINPLE_UPGRADE_TARGET_PLAN,
    benefit: reason.personalBenefit,
  };
}

export function getUpgradePromptText(planKey, type) {
  const summary = getPlanLimitUpgradeSummary(planKey, type);
  return `${summary.message}\n\n${summary.benefit}\n\n요금제 화면으로 이동할까요?`;
}

export function formatPlanLimit(value) {
  return value === Infinity ? "무제한" : `${value}개`;
}

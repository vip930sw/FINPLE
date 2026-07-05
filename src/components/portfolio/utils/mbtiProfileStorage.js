export const MBTI_PRESET_STORAGE_KEY = "finple-mbti-simulator-preset";

export const MBTI_PRESET_MAP = {
  "안정-장기-자동-분산": { growthStock: 10, valueStock: 28, bond: 24, longBond: 8, reit: 6, gold: 8, cash: 16 },
  "안정-장기-자동-확신": { growthStock: 8, valueStock: 36, longBond: 32, gold: 8, cash: 16 },
  "안정-장기-주도-분산": { growthStock: 15, valueStock: 26, bond: 20, longBond: 8, reit: 7, gold: 8, cash: 16 },
  "안정-장기-주도-확신": { growthStock: 12, valueStock: 40, longBond: 28, gold: 8, cash: 12 },
  "안정-기회-자동-분산": { growthStock: 8, valueStock: 26, bond: 20, longBond: 6, reit: 5, gold: 15, cash: 20 },
  "안정-기회-자동-확신": { growthStock: 5, valueStock: 25, longBond: 25, gold: 25, cash: 20 },
  "안정-기회-주도-분산": { growthStock: 15, valueStock: 25, bond: 14, longBond: 8, reit: 8, gold: 15, cash: 15 },
  "안정-기회-주도-확신": { growthStock: 12, valueStock: 23, longBond: 20, gold: 25, crypto: 5, cash: 15 },
  "성장-장기-자동-분산": { growthStock: 35, valueStock: 25, bond: 10, longBond: 5, reit: 7, gold: 8, cash: 10 },
  "성장-장기-자동-확신": { growthStock: 50, valueStock: 20, bond: 8, longBond: 4, gold: 8, cash: 10 },
  "성장-장기-주도-분산": { growthStock: 45, valueStock: 22, bond: 8, longBond: 4, reit: 7, gold: 8, cash: 6 },
  "성장-장기-주도-확신": { growthStock: 60, valueStock: 18, longBond: 8, gold: 4, crypto: 5, cash: 5 },
  "성장-기회-자동-분산": { growthStock: 35, valueStock: 20, bond: 6, longBond: 4, reit: 7, gold: 15, crypto: 3, cash: 10 },
  "성장-기회-자동-확신": { growthStock: 45, valueStock: 15, longBond: 8, gold: 15, crypto: 10, cash: 7 },
  "성장-기회-주도-분산": { growthStock: 45, valueStock: 18, bond: 4, longBond: 4, reit: 8, gold: 12, crypto: 5, cash: 4 },
  "성장-기회-주도-확신": { growthStock: 70, valueStock: 5, gold: 5, crypto: 15, cash: 5 },
};

const MBTI_DISPLAY_NAMES = {
  "안정-장기-자동-분산": "차분한 수호자형",
  "안정-장기-자동-확신": "신중한 코어빌더형",
  "안정-장기-주도-분산": "용의주도한 설계자형",
  "안정-장기-주도-확신": "철저한 전략가형",
  "안정-기회-자동-분산": "침착한 관찰자형",
  "안정-기회-자동-확신": "현명한 선별가형",
  "안정-기회-주도-분산": "민첩한 리스크매니저형",
  "안정-기회-주도-확신": "대담한 수비수형",
  "성장-장기-자동-분산": "꾸준한 개척자형",
  "성장-장기-자동-확신": "믿음직한 항해자형",
  "성장-장기-주도-분산": "균형 잡힌 건축가형",
  "성장-장기-주도-확신": "장기 성장 전략가형",
  "성장-기회-자동-분산": "열린 탐험가형",
  "성장-기회-자동-확신": "예리한 선구자형",
  "성장-기회-주도-분산": "능동적인 지휘관형",
  "성장-기회-주도-확신": "용감한 승부사형",
};

const TYPE_ID_AXIS_KEYS = ["returnStyle", "timeStyle", "controlStyle", "concentrationStyle"];

function getStorage(storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage || null;
}

function safeReadJson(storage, key, fallback = null) {
  try {
    const rawValue = storage?.getItem?.(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function safeWriteJson(storage, key, value) {
  try {
    storage?.setItem?.(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function normalizeTypeId(value) {
  return String(value || "")
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("-");
}

function axesFromTypeId(typeId) {
  const values = normalizeTypeId(typeId).split("-").filter(Boolean);
  return TYPE_ID_AXIS_KEYS.reduce((axes, key, index) => {
    if (values[index]) axes[key] = values[index];
    return axes;
  }, {});
}

function displayAxisValue(value) {
  return value === "자동" ? "추종" : value;
}

function finpleTypeFromTypeId(typeId) {
  const values = normalizeTypeId(typeId).split("-").filter(Boolean).map(displayAxisValue);
  return values.join(" ");
}

function defaultRiskProfileFromTypeId(typeId) {
  const [returnStyle] = normalizeTypeId(typeId).split("-");
  return returnStyle === "성장" ? "적극투자형" : "안정추구형";
}

function getSectorsFromPreset(preset = {}) {
  const sectors = [];
  const push = (condition, label) => {
    if (condition && !sectors.includes(label)) sectors.push(label);
  };

  push(Number(preset.growthStock || 0) > 0, "성장·기술");
  push(Number(preset.valueStock || 0) > 0, "배당·가치");
  push(Number(preset.bond || 0) > 0 || Number(preset.longBond || preset.longbond || 0) > 0, "채권·금리");
  push(Number(preset.reit || 0) > 0, "리츠·부동산");
  push(Number(preset.gold || 0) > 0, "금·원자재");
  push(Number(preset.crypto || 0) > 0, "블록체인 테마");
  push(Number(preset.cash || 0) >= 10, "현금·대기자금");

  return sectors.slice(0, 5);
}

function isUsableProfile(profile) {
  return Boolean(profile?.typeId || profile?.nickname || profile?.finpleType);
}

export function readStoredMbtiProfile(options = {}) {
  const storage = getStorage(options.storage);
  if (!storage) return null;
  return safeReadJson(storage, MBTI_PRESET_STORAGE_KEY, null);
}

export function buildMbtiProfileFromResult(result, options = {}) {
  if (!result?.type) return null;

  const now = options.now || new Date().toISOString();
  const type = result.type;
  const typeId = normalizeTypeId(type.typeId);
  const preset = type.preset || MBTI_PRESET_MAP[typeId] || {};

  return {
    typeId,
    nickname: type.nickname || MBTI_DISPLAY_NAMES[typeId] || "투자 MBTI",
    finpleType: type.finpleType || finpleTypeFromTypeId(typeId),
    riskProfile: result.calculatedRiskProfile || type.riskProfile || defaultRiskProfileFromTypeId(typeId),
    riskScore: result.riskScore,
    axes: result.axes || axesFromTypeId(typeId),
    axisScores: result.axisScores || {},
    sectors: Array.isArray(type.sectors) ? type.sectors.filter(Boolean) : getSectorsFromPreset(preset),
    marketMode: options.marketMode || type.marketMode || "US",
    portfolioPreset: preset,
    preset,
    summary: type.summary || `${finpleTypeFromTypeId(typeId)} 성향을 기반으로 저장된 투자 MBTI 결과입니다.`,
    strengths: type.strengths || "성향에 맞는 포트폴리오 점검 기준을 세우는 데 활용할 수 있습니다.",
    cautions: type.cautions || "본 결과는 참고용이며 실제 투자 전 손실 가능성을 확인해야 합니다.",
    actions: Array.isArray(type.actions) ? type.actions : [],
    details: type.details || null,
    simulatorDefaults: type.defaults || null,
    createdAt: options.createdAt || now,
    restoredAt: options.restoredAt || null,
    source: options.source || "investment-mbti-result",
  };
}

export function storeMbtiProfileFromResult(result, options = {}) {
  const storage = getStorage(options.storage);
  if (!storage) return false;

  const profile = buildMbtiProfileFromResult(result, options);
  if (!profile) return false;

  const saved = safeWriteJson(storage, MBTI_PRESET_STORAGE_KEY, profile);
  if (saved && typeof window !== "undefined") {
    window.dispatchEvent(new Event("finple-mbti-profile-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
  }

  return saved;
}

export function buildMbtiProfileFromPortfolio(portfolio, options = {}) {
  const mbti = portfolio?.mbti;
  if (!mbti || typeof mbti !== "object") return null;

  const now = options.now || new Date().toISOString();
  const typeId = normalizeTypeId(mbti.typeId || mbti.type_id || portfolio?.typeId);
  if (!typeId) return null;

  const preset = mbti.preset || mbti.portfolioPreset || MBTI_PRESET_MAP[typeId] || {};
  const axes = mbti.axes && typeof mbti.axes === "object" ? mbti.axes : axesFromTypeId(typeId);

  return {
    typeId,
    nickname: mbti.nickname || MBTI_DISPLAY_NAMES[typeId] || portfolio?.name || "투자 MBTI",
    finpleType: mbti.finpleType || mbti.finple_type || finpleTypeFromTypeId(typeId),
    riskProfile: mbti.riskProfile || mbti.risk_profile || defaultRiskProfileFromTypeId(typeId),
    riskScore: mbti.riskScore ?? mbti.risk_score ?? null,
    axes,
    axisScores: mbti.axisScores || mbti.axis_scores || {},
    sectors: Array.isArray(mbti.sectors) ? mbti.sectors.filter(Boolean) : getSectorsFromPreset(preset),
    marketMode: mbti.marketMode || mbti.market_mode || (String(portfolio?.source || "").includes("-kr") ? "KR" : "US"),
    portfolioPreset: preset,
    preset,
    summary: mbti.summary || `${finpleTypeFromTypeId(typeId)} 성향을 기반으로 포트폴리오에서 복원한 투자 MBTI 결과입니다.`,
    strengths: mbti.strengths || "저장된 포트폴리오의 MBTI 성향 정보를 기준으로 복원했습니다.",
    cautions: mbti.cautions || "서버 DB 스키마가 별도 MBTI 프로필 저장을 지원하기 전까지 브라우저 저장값과 포트폴리오 메타데이터를 함께 확인해야 합니다.",
    actions: Array.isArray(mbti.actions) ? mbti.actions : [],
    details: mbti.details || null,
    simulatorDefaults: mbti.simulatorDefaults || mbti.simulator_defaults || null,
    createdAt: mbti.createdAt || mbti.created_at || portfolio?.createdAt || portfolio?.updatedAt || now,
    restoredAt: now,
    source: options.source || "portfolio-mbti-restore",
  };
}

export function restoreMbtiProfileFromPortfolios(portfolios = [], options = {}) {
  const storage = getStorage(options.storage);
  if (!storage) return null;

  const existingProfile = readStoredMbtiProfile({ storage });
  if (!options.force && isUsableProfile(existingProfile)) return existingProfile;

  const portfolioList = Array.isArray(portfolios) ? portfolios : [];
  const activePortfolioId = options.activePortfolioId || storage.getItem?.("finple-active-portfolio-id") || "";
  const activePortfolio = activePortfolioId
    ? portfolioList.find((portfolio) => String(portfolio?.id || "") === String(activePortfolioId))
    : null;
  const candidates = [activePortfolio, ...portfolioList].filter(Boolean);

  for (const portfolio of candidates) {
    const profile = buildMbtiProfileFromPortfolio(portfolio, options);
    if (!profile) continue;

    const saved = safeWriteJson(storage, MBTI_PRESET_STORAGE_KEY, profile);
    if (saved && typeof window !== "undefined") {
      window.dispatchEvent(new Event("finple-mbti-profile-updated"));
      window.dispatchEvent(new Event("finple-local-storage-updated"));
    }

    return profile;
  }

  return existingProfile || null;
}

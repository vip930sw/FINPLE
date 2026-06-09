/* =========================================================
   Step 111-6 Hotfix - MY PAGE investment profile display patch
   - 내 투자성향 상세 비중에서 내부 asset key가 노출되지 않도록 한글 표시명을 보정합니다.
   - 저장된 관심 섹터가 없을 때 포트폴리오 프리셋 비중을 기준으로 관심 섹터를 자동 보완합니다.
   - MutationObserver 반복 감지를 제거해 /mypage 렉을 방지합니다.
========================================================= */

const MBTI_PRESET_STORAGE_KEY = "finple-mbti-simulator-preset";

const ASSET_DISPLAY_LABELS = {
  growthStock: "성장주",
  valueStock: "가치·배당",
  bond: "종합채권",
  longBond: "장기국채",
  longbond: "장기국채",
  reit: "리츠",
  gold: "금",
  crypto: "블록체인 테마",
  cash: "현금",
  채권: "종합채권",
  코인: "블록체인 테마",
};

let investmentProfileRenderTimer = null;
let lastInvestmentProfileSignature = "";

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInvestmentProfileResultTitle(result) {
  const fallback = "투자 MBTI";
  const nickname = String(result?.nickname || fallback).trim();
  if (!nickname) return fallback;

  const baseTitle = nickname.replace(/\s+결과$/u, "").trim();
  return baseTitle.replace(/^(.+?)한\s+(.+)$/u, "$1형 $2");
}

function normalizeInvestmentProfileResultCopy(result) {
  let changed = false;
  const titleNode = document.querySelector("[data-investment-profile-summary-title]");
  const nextTitle = getInvestmentProfileResultTitle(result);

  if (titleNode) {
    if (titleNode.textContent !== nextTitle) {
      titleNode.textContent = nextTitle;
      changed = true;
    }
    if (!titleNode.classList.contains("investmentProfileResultTitleHighlight")) {
      titleNode.classList.add("investmentProfileResultTitleHighlight");
      changed = true;
    }
  }

  const summaryNode = document.querySelector("[data-investment-profile-summary]");
  if (summaryNode) {
    if (summaryNode.textContent) {
      summaryNode.textContent = "";
      changed = true;
    }
    if (!summaryNode.hidden) {
      summaryNode.hidden = true;
      changed = true;
    }
    if (!summaryNode.classList.contains("investmentProfileSummaryHidden")) {
      summaryNode.classList.add("investmentProfileSummaryHidden");
      changed = true;
    }
  }

  return changed;
}

function normalizeAssetLabel(value) {
  const text = String(value || "").trim();
  return ASSET_DISPLAY_LABELS[text] || text;
}

function normalizeInvestmentProfileAssetLabels() {
  document
    .querySelectorAll("[data-investment-profile-ratios] span, [data-investment-profile-preview] span")
    .forEach((node) => {
      const nextLabel = normalizeAssetLabel(node.textContent);
      if (nextLabel && node.textContent !== nextLabel) node.textContent = nextLabel;
    });
}

function getPresetFromStoredResult(result) {
  return result?.preset || result?.portfolioPreset || result?.allocation || {};
}

function deriveSectorsFromPreset(preset = {}) {
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
  push(Number(preset.cash || 0) >= 10, "현금성·대기자금");

  return sectors.slice(0, 5);
}

function hasEmptySectorPlaceholder(listNode) {
  const text = String(listNode?.textContent || "").trim();
  return !text || text.includes("섹터 정보 없음") || text.includes("저장된 섹터");
}

function ensureInvestmentProfileSectors(result) {
  const sectorsNode = document.querySelector("[data-investment-profile-sectors]");
  if (!sectorsNode || !hasEmptySectorPlaceholder(sectorsNode)) return;

  const storedSectors = Array.isArray(result?.sectors) ? result.sectors.filter(Boolean) : [];
  const sectors = storedSectors.length ? storedSectors : deriveSectorsFromPreset(getPresetFromStoredResult(result));

  if (!sectors.length) return;
  sectorsNode.innerHTML = sectors.map((sector) => `<li>${escapeHtml(sector)}</li>`).join("");
}

function getInvestmentProfileSignature(result) {
  const ratioText = Array.from(document.querySelectorAll("[data-investment-profile-ratios] span, [data-investment-profile-preview] span"))
    .map((node) => String(node.textContent || "").trim())
    .join("|");
  const sectorText = String(document.querySelector("[data-investment-profile-sectors]")?.textContent || "").trim();
  const resultTitle = String(document.querySelector("[data-investment-profile-summary-title]")?.textContent || "").trim();
  const resultSummary = String(document.querySelector("[data-investment-profile-summary]")?.textContent || "").trim();
  return JSON.stringify({
    resultPreset: getPresetFromStoredResult(result),
    sectors: Array.isArray(result?.sectors) ? result.sectors : [],
    ratioText,
    sectorText,
    resultTitle,
    resultSummary,
  });
}

function applyInvestmentProfileDisplayPatch() {
  if (!isMyPagePath()) return;

  const result = readJson(MBTI_PRESET_STORAGE_KEY);
  const copyChanged = normalizeInvestmentProfileResultCopy(result);
  const signature = getInvestmentProfileSignature(result);
  if (!copyChanged && signature === lastInvestmentProfileSignature) return;

  normalizeInvestmentProfileAssetLabels();
  ensureInvestmentProfileSectors(result);
  normalizeInvestmentProfileResultCopy(result);
  lastInvestmentProfileSignature = getInvestmentProfileSignature(result);
}

function scheduleInvestmentProfilePatch(delay = 120) {
  window.clearTimeout(investmentProfileRenderTimer);
  investmentProfileRenderTimer = window.setTimeout(applyInvestmentProfileDisplayPatch, delay);
}

function bootInvestmentProfileDisplayPatch() {
  [120, 300, 700, 1200, 2200].forEach((delay) => window.setTimeout(applyInvestmentProfileDisplayPatch, delay));

  document.addEventListener("click", (event) => {
    if (event.target?.closest?.("[data-investment-profile-result]")) scheduleInvestmentProfilePatch(0);
  }, true);

  window.addEventListener("popstate", () => scheduleInvestmentProfilePatch(120));
  window.addEventListener("finple-route-changed", () => scheduleInvestmentProfilePatch(120));
  window.addEventListener("finple-auth-updated", () => scheduleInvestmentProfilePatch(120));
  window.addEventListener("storage", () => scheduleInvestmentProfilePatch(120));
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootInvestmentProfileDisplayPatch, { once: true });
  } else {
    bootInvestmentProfileDisplayPatch();
  }
}

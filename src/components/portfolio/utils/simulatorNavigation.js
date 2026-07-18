export const SIMULATOR_TAB_ITEMS = Object.freeze([
  { key: "settings", step: "STEP 1", title: "설정", anchorId: "settings" },
  { key: "compare", step: "STEP 2", title: "비교", anchorId: "compare" },
  { key: "detail", step: "STEP 3", title: "상세분석·기준전망", anchorId: "detail" },
  { key: "probability", step: "STEP 4", title: "확률분석", anchorId: "probability-analysis" },
  { key: "shock", step: "STEP 5", title: "외부충격분석", anchorId: "external-shock-analysis" },
  { key: "ai", step: "STEP 6", title: "AI 분석", anchorId: "ai-analysis" },
  { key: "saved", step: "STEP 7", title: "저장된 포트폴리오", anchorId: "saved-portfolios" },
]);

export const SIMULATOR_TAB_KEYS = Object.freeze(SIMULATOR_TAB_ITEMS.map((item) => item.key));

export const SIMULATOR_TAB_ANCHORS = Object.freeze(
  Object.fromEntries(SIMULATOR_TAB_ITEMS.map((item) => [item.key, item.anchorId]))
);

const SIMULATOR_TAB_ALIAS_PAIRS = [
  ...SIMULATOR_TAB_ITEMS.map((item) => [item.key, item.key]),
  ...SIMULATOR_TAB_ITEMS.map((item) => [item.anchorId, item.key]),
  ["probability", "probability"],
  ["probability-analysis", "probability"],
  ["external-shock", "shock"],
  ["external-shock-analysis", "shock"],
  ["shock-analysis", "shock"],
  ["ai", "ai"],
  ["ai-analysis", "ai"],
];

const SIMULATOR_TAB_ALIAS_MAP = Object.freeze(new Map(SIMULATOR_TAB_ALIAS_PAIRS));

function normalizeTabToken(value) {
  return String(value || "").trim().replace(/^#/, "");
}

export function resolveSimulatorTab(value) {
  const token = normalizeTabToken(value);
  const key = SIMULATOR_TAB_ALIAS_MAP.get(token);
  return {
    key: key || "settings",
    isKnown: Boolean(key),
  };
}

export function normalizeSimulatorTab(value) {
  return resolveSimulatorTab(value).key;
}

export function getSimulatorTabAnchorId(value) {
  const key = normalizeSimulatorTab(value);
  return SIMULATOR_TAB_ANCHORS[key] || "settings";
}

export function createSimulatorHashNavigator({ getHash, onTabChange } = {}) {
  let lastAppliedHash = null;

  return {
    applyCurrentHash() {
      const rawHash = String(typeof getHash === "function" ? getHash() || "" : "").trim();
      if (!rawHash) return { status: "empty", key: null, isKnown: false };
      if (rawHash === lastAppliedHash) return { status: "unchanged", key: null, isKnown: false };

      lastAppliedHash = rawHash;
      const resolved = resolveSimulatorTab(rawHash);
      if (typeof onTabChange === "function") {
        onTabChange(resolved.key, { hash: rawHash, isKnown: resolved.isKnown });
      }

      return {
        status: resolved.isKnown ? "applied" : "fallback",
        key: resolved.key,
        isKnown: resolved.isKnown,
      };
    },
  };
}

/* =========================================================
   MBTI Result UX Patch
   - 결과 공유/저장 안내 박스는 화면에서 제거합니다.
   - 위험성향에 따라 강점/주의점 카드의 표시 순서를 보정합니다.
========================================================= */

function isMbtiRoute() {
  return window.location.pathname === "/mbti" || window.location.search.includes("investment-mbti");
}

function getPanelTitle(panel) {
  return panel?.querySelector("h3")?.textContent?.trim() || "";
}

function findRiskProfileText() {
  const cards = Array.from(document.querySelectorAll(".investmentMbtiResultGrid .investmentMbtiCard"));
  const riskCard = cards.find((card) => card.textContent.includes("위험성향"));
  return riskCard?.querySelector("strong")?.textContent?.trim() || "";
}

function applyInsightOrder() {
  if (!isMbtiRoute()) return;

  const resultPage = document.querySelector(".investmentMbtiResultPage");
  if (!resultPage) return;

  document.querySelectorAll(".investmentMbtiExportStatus").forEach((node) => node.remove());

  const panels = Array.from(resultPage.querySelectorAll(".investmentMbtiTwoColumn .investmentMbtiPanel"));
  const strengthPanel = panels.find((panel) => getPanelTitle(panel).includes("강점"));
  const cautionPanel = panels.find((panel) => getPanelTitle(panel).includes("주의점"));
  if (!strengthPanel || !cautionPanel) return;

  const riskProfile = findRiskProfileText();
  const shouldPrioritizeCaution = /초안정형|공격투자형/.test(riskProfile);

  strengthPanel.style.order = shouldPrioritizeCaution ? "2" : "1";
  cautionPanel.style.order = shouldPrioritizeCaution ? "1" : "2";
  cautionPanel.classList.toggle("priorityInsight", shouldPrioritizeCaution);
}

function bootMbtiResultUxPatch() {
  [80, 200, 500, 1000].forEach((delay) => window.setTimeout(applyInsightOrder, delay));

  const observer = new MutationObserver(() => applyInsightOrder());
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", () => window.setTimeout(applyInsightOrder, 120));
  window.addEventListener("finple-route-changed", () => window.setTimeout(applyInsightOrder, 120));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMbtiResultUxPatch, { once: true });
  } else {
    bootMbtiResultUxPatch();
  }
}

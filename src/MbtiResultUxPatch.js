/* =========================================================
   MBTI Result UX Patch
   - 결과 공유/저장 안내 박스는 화면에서 제거합니다.
   - 카드 배치 순서는 sectors > actions > strength > caution 흐름을 유지합니다.
========================================================= */

function isMbtiRoute() {
  return window.location.pathname === "/mbti" || window.location.search.includes("investment-mbti");
}

function applyResultUxPatch() {
  if (!isMbtiRoute()) return;

  const resultPage = document.querySelector(".investmentMbtiResultPage");
  if (!resultPage) return;

  document.querySelectorAll(".investmentMbtiExportStatus").forEach((node) => node.remove());

  resultPage.querySelectorAll(".investmentMbtiTwoColumn .investmentMbtiPanel").forEach((panel) => {
    panel.style.order = "";
    panel.classList.remove("priorityInsight");
  });
}

function bootMbtiResultUxPatch() {
  [80, 200, 500, 1000].forEach((delay) => window.setTimeout(applyResultUxPatch, delay));

  const observer = new MutationObserver(() => applyResultUxPatch());
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", () => window.setTimeout(applyResultUxPatch, 120));
  window.addEventListener("finple-route-changed", () => window.setTimeout(applyResultUxPatch, 120));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMbtiResultUxPatch, { once: true });
  } else {
    bootMbtiResultUxPatch();
  }
}

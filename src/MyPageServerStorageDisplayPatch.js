/* Step 111-11B - MY PAGE Server Storage display patch
   - Server Storage 뱃지를 DB 연결 상태가 아니라 저장 상태 관점으로 표시합니다.
   - MutationObserver 없이 초기 타이머와 상태 변경 이벤트에서만 보정합니다.
*/

let serverStorageBadgeTimer = null;

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function getNumberFromText(text) {
  const match = String(text || "").match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getStorageStatNumber(panel, labelText) {
  const statItems = Array.from(panel.querySelectorAll(".serverStorageStats > div"));
  const item = statItems.find((node) => String(node.querySelector("span")?.textContent || "").trim() === labelText);
  return getNumberFromText(item?.querySelector("strong")?.textContent);
}

function getBrowserPortfolioCount(panel) {
  return getStorageStatNumber(panel, "브라우저 포트폴리오");
}

function getServerSavedCount(panel) {
  return getStorageStatNumber(panel, "서버 저장 수");
}

function inferServerStorageSaved(panel) {
  const browserPortfolioCount = getBrowserPortfolioCount(panel);
  const serverSavedCount = getServerSavedCount(panel);

  if (serverSavedCount !== null && serverSavedCount > 0) return true;
  if (browserPortfolioCount !== null && browserPortfolioCount > 0) return true;

  const message = String(panel.querySelector(".serverStorageMessage")?.textContent || "");
  if (message.includes("서버 동기화 완료") || message.includes("서버에 저장된 포트폴리오")) return true;
  if (message.includes("업로드할 브라우저 포트폴리오가 없습니다")) return true;

  return false;
}

function updateServerStorageBadge() {
  if (!isMyPagePath()) return;

  const panel = document.querySelector(".serverStoragePanel");
  const badge = panel?.querySelector(".serverStatusBadge");
  if (!panel || !badge) return;

  const saved = inferServerStorageSaved(panel);
  badge.textContent = saved ? "저장됨" : "저장 필요";

  badge.classList.remove("disabled");
  badge.classList.add("ready");
  badge.classList.toggle("serverStorageBadgeSaved", saved);
  badge.classList.toggle("serverStorageBadgeNeedsSave", !saved);
}

function scheduleServerStorageBadgeUpdate(delay = 120) {
  window.clearTimeout(serverStorageBadgeTimer);
  serverStorageBadgeTimer = window.setTimeout(updateServerStorageBadge, delay);
}

function bootServerStorageBadgePatch() {
  [120, 300, 700, 1200, 2200].forEach((delay) => window.setTimeout(updateServerStorageBadge, delay));

  window.addEventListener("popstate", () => scheduleServerStorageBadgeUpdate(120));
  window.addEventListener("finple-auth-updated", () => scheduleServerStorageBadgeUpdate(160));
  window.addEventListener("finple-plan-updated", () => scheduleServerStorageBadgeUpdate(160));
  window.addEventListener("finple-local-storage-updated", () => scheduleServerStorageBadgeUpdate(160));
  window.addEventListener("finple-portfolio-storage-updated", () => scheduleServerStorageBadgeUpdate(160));
  window.addEventListener("storage", () => scheduleServerStorageBadgeUpdate(160));
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootServerStorageBadgePatch, { once: true });
  } else {
    bootServerStorageBadgePatch();
  }
}

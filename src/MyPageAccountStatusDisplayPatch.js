/* =========================================================
   Step 112-6 - MY PAGE / MY ACCOUNT polish
   - 이메일 활용 목적 본문을 푸른색 안내 박스로 표시합니다.
   - Free / Personal 표기를 대소문자 혼용으로 정리합니다.
   - 현재 요금제를 Free 또는 Personal 뱃지로 표시합니다.
   - 계정 상태 새로고침 버튼을 제거합니다.
   - MY ACCOUNT 영문 타이틀 스타일을 복구합니다.
========================================================= */

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const STYLE_ID = "finple-my-account-polish-style";

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function getAccountPanel() {
  return document.querySelector(".accountStatusPanel");
}

function normalizePlanName(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("personal") || text.includes("pro") || text.includes("paid")) return "Personal";
  return "Free";
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function getCurrentPlan() {
  const storedUser = readStoredUser();
  const candidates = [
    storedUser?.plan,
    storedUser?.subscription?.plan,
    storedUser?.subscription?.tier,
    storedUser?.billing?.plan,
    document.querySelector("[data-subscription-plan]")?.textContent,
    document.querySelector("[data-subscription-badge]")?.textContent,
  ];

  const raw = candidates.find((item) => String(item || "").trim());
  return normalizePlanName(raw || "Free");
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .accountStatusPanel .accountMiniLabel,
    .accountStatusPanel .serverStorageHeader .accountMiniLabel {
      color: #2563eb !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      letter-spacing: 0.24em !important;
      text-transform: uppercase !important;
    }

    .accountStatusPanel .accountEmailPurposeBox {
      margin-top: 12px;
      padding: 13px 15px;
      border: 1px solid #bfdbfe;
      border-radius: 14px;
      background: #eff6ff;
      color: #1e3a8a !important;
      font-size: 14px;
      font-weight: 850;
      line-height: 1.65;
    }

    .accountStatusPanel .accountPlanValueLine {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .accountStatusPanel .accountPlanBadge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 26px;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid #86efac;
      background: #dcfce7;
      color: #047857;
      font-size: 12px;
      font-weight: 900;
      line-height: 1;
      white-space: nowrap;
    }

    .accountStatusPanel .accountPlanBadge.free {
      border-color: #bfdbfe;
      background: #eff6ff;
      color: #1d4ed8;
    }

    .accountStatusPanel .accountRefreshHidden {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function normalizePlanTexts(panel, planName) {
  const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const current = node.nodeValue || "";
    const trimmed = current.trim();
    if (["free", "FREE", "Free"].includes(trimmed)) {
      node.nodeValue = current.replace(trimmed, "Free");
    }
    if (["personal", "PERSONAL", "Personal"].includes(trimmed)) {
      node.nodeValue = current.replace(trimmed, "Personal");
    }
  });

  const planCards = Array.from(panel.querySelectorAll("div, article, section")).filter((node) => {
    const label = node.querySelector("span")?.textContent?.trim();
    return label === "플랜" || label === "요금제";
  });

  const planCard = planCards[0];
  if (!planCard) return;

  const valueNode = Array.from(planCard.querySelectorAll("strong, b, p, div")).find((node) => {
    const text = node.textContent?.trim().toLowerCase();
    return text === "free" || text === "personal" || text === "FREE".toLowerCase() || text === "PERSONAL".toLowerCase();
  }) || planCard.querySelector("strong") || planCard;

  if (!valueNode) return;

  if (!valueNode.classList.contains("accountPlanValueLine")) {
    valueNode.classList.add("accountPlanValueLine");
  }

  const textNodes = Array.from(valueNode.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
  if (textNodes.length) {
    textNodes[0].nodeValue = planName;
    textNodes.slice(1).forEach((node) => node.remove());
  } else if (!valueNode.querySelector(".accountPlanText")) {
    const textSpan = document.createElement("span");
    textSpan.className = "accountPlanText";
    textSpan.textContent = planName;
    valueNode.prepend(textSpan);
  } else {
    valueNode.querySelector(".accountPlanText").textContent = planName;
  }

  let badge = valueNode.querySelector(".accountPlanBadge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "accountPlanBadge";
    valueNode.appendChild(badge);
  }
  badge.textContent = planName;
  badge.classList.toggle("free", planName === "Free");
  badge.classList.toggle("personal", planName === "Personal");
}

function markEmailPurpose(panel) {
  const nodes = Array.from(panel.querySelectorAll("p, div"));
  const purposeNode = nodes.find((node) => {
    const text = node.textContent?.trim() || "";
    return text.includes("회원 식별") && text.includes("고객 문의 대응");
  });

  if (purposeNode) {
    purposeNode.classList.add("accountEmailPurposeBox");
  }
}

function hideRefreshButton(panel) {
  Array.from(panel.querySelectorAll("button")).forEach((button) => {
    const text = button.textContent?.trim() || "";
    if (text.includes("계정 상태 새로고침")) {
      button.hidden = true;
      button.classList.add("accountRefreshHidden");
      button.setAttribute("aria-hidden", "true");
    }
  });
}

function applyMyAccountPolish() {
  if (!isMyPagePath()) return;
  installStyle();

  const panel = getAccountPanel();
  if (!panel) return;

  const planName = getCurrentPlan();
  normalizePlanTexts(panel, planName);
  markEmailPurpose(panel);
  hideRefreshButton(panel);
}

function bootMyAccountPolish() {
  [120, 360, 720, 1200, 2200, 3600].forEach((delay) => {
    window.setTimeout(applyMyAccountPolish, delay);
  });
  window.addEventListener("click", () => window.setTimeout(applyMyAccountPolish, 80), true);
  window.addEventListener("popstate", () => window.setTimeout(applyMyAccountPolish, 160));
  window.addEventListener("finple-auth-updated", () => window.setTimeout(applyMyAccountPolish, 180));
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMyAccountPolish, { once: true });
  } else {
    bootMyAccountPolish();
  }
}

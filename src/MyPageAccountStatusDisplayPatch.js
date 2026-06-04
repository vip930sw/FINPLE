/* =========================================================
   Step 111-9C - MY PAGE Account Status safe display patch
   - document-wide MutationObserver를 사용하지 않습니다.
   - /mypage Account Status 영역만 제한적으로 보정합니다.
   - 같은 내용이면 다시 렌더링하지 않아 반복 갱신/렉을 방지합니다.
========================================================= */

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const MY_PAGE_LABEL_STYLE_ID = "finple-mypage-mini-label-blue-style";
let accountStatusRenderTimer = null;
let lastKnownAuthModeLabel = "";

function isMyPagePath() {
  return window.location.pathname === "/mypage";
}

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeAuthModeLabel(value) {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();

  if (lower.includes("naver") || text.includes("네이버")) return "NAVER";
  if (lower.includes("kakao") || text.includes("카카오")) return "카카오";
  if (lower.includes("google") || text.includes("구글")) return "구글";

  return "";
}

function inferExistingAuthModeLabel(panel) {
  const nodes = Array.from(panel.querySelectorAll("div"));
  for (const node of nodes) {
    const label = String(node.querySelector("span")?.textContent || "").trim().replace(/\s+/g, "");
    const value = String(node.querySelector("strong")?.textContent || "").trim();
    if (label === "가입방식" || label === "가입방식" || label === "가입방법") {
      const normalized = normalizeAuthModeLabel(value);
      if (normalized) return normalized;
    }
  }
  return "";
}

function formatAuthMode(user, panel) {
  const fromExistingDom = inferExistingAuthModeLabel(panel);
  if (fromExistingDom) {
    lastKnownAuthModeLabel = fromExistingDom;
    return fromExistingDom;
  }

  const normalized = normalizeAuthModeLabel(user?.authMode || user?.provider || user?.oauthProvider || user?.loginProvider);
  if (normalized) {
    lastKnownAuthModeLabel = normalized;
    return normalized;
  }

  return lastKnownAuthModeLabel || "계정 로그인";
}

function getEmailPurposeText() {
  return "회원 식별, 로그인 계정 확인, 구독 상태 안내, 결제 내역 안내, 서비스 중요 고지 및 고객 문의 대응에 사용됩니다.";
}

function getAccountStatusCards(user, panel) {
  const email = user?.email || "-";
  const authMode = formatAuthMode(user, panel);
  const plan = user?.plan ? String(user.plan).toUpperCase() : "FREE";
  const userName = user?.name || user?.nickname || "-";

  return [
    { label: "로그인 이메일", value: email, note: "계정 식별 정보", className: "monoText" },
    { label: "가입방식", value: authMode, note: "로그인 제공 방식" },
    { label: "현재 플랜", value: plan, note: "요금제 기준" },
    { label: "사용자", value: userName, note: "표시 이름" },
  ];
}

function getCardsHtml(cards) {
  return cards.map((card) => `
    <div class="accountStatusInfoCard">
      <span>${escapeHtml(card.label)}</span>
      <strong class="${escapeHtml(card.className || "")}">${escapeHtml(card.value)}</strong>
      <em>${escapeHtml(card.note)}</em>
    </div>
  `).join("");
}

function ensureMyPageTitleStyle() {
  if (document.getElementById(MY_PAGE_LABEL_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = MY_PAGE_LABEL_STYLE_ID;
  style.textContent = `
    .accountPage .accountPanelStack .accountMiniLabel,
    .accountPage .myPageBetaCompactNotice .accountMiniLabel {
      color: #2563eb !important;
    }
  `;
  document.head.appendChild(style);
}

function normalizeAccountStatusTitle(panel) {
  const title = panel.querySelector("h2");
  if (title && title.textContent.trim() === "계정 연결 상태") {
    title.textContent = "계정 상태";
  }
}

function ensureEmailPurposeNote(panel) {
  const text = getEmailPurposeText();
  let note = panel.querySelector("[data-account-email-purpose-note]");
  if (!note) {
    note = document.createElement("div");
    note.className = "accountStatusPurposeNote";
    note.setAttribute("data-account-email-purpose-note", "true");
    const grid = panel.querySelector(".accountStatusGrid");
    if (grid?.parentNode) grid.insertAdjacentElement("afterend", note);
    else panel.appendChild(note);
  }

  note.innerHTML = `<span>이메일 활용 목적</span><strong>${escapeHtml(text)}</strong>`;
}

function hideLowValueAccountStatusElements(panel) {
  panel.querySelectorAll(".serverStorageMessage.compact").forEach((node) => {
    node.classList.add("accountStatusMessageHidden");
    node.setAttribute("hidden", "true");
  });

  panel.querySelectorAll(".serverStorageActions button").forEach((button) => {
    const text = String(button.textContent || "").trim();
    if (text === "계정 상태 새로고침" || text === "체험 사용자 연결") {
      button.classList.add("accountStatusRefreshHidden");
      button.setAttribute("hidden", "true");
    }
  });
}

function renderAccountStatusCards() {
  if (!isMyPagePath()) return;

  ensureMyPageTitleStyle();

  const panel = document.querySelector(".accountStatusPanel");
  const grid = panel?.querySelector(".accountStatusGrid");
  if (!panel || !grid) return;

  normalizeAccountStatusTitle(panel);

  const user = readJson(AUTH_USER_STORAGE_KEY);
  const cards = getAccountStatusCards(user, panel);
  const signature = JSON.stringify({ cards, purpose: getEmailPurposeText() });

  grid.classList.add("accountStatusGrid--sixCards");
  hideLowValueAccountStatusElements(panel);
  ensureEmailPurposeNote(panel);

  if (grid.getAttribute("data-account-status-signature") === signature) return;

  grid.innerHTML = getCardsHtml(cards);
  grid.setAttribute("data-account-status-signature", signature);
}

function scheduleAccountStatusRender(delay = 120) {
  window.clearTimeout(accountStatusRenderTimer);
  accountStatusRenderTimer = window.setTimeout(renderAccountStatusCards, delay);
}

function bootAccountStatusDisplayPatch() {
  [120, 300, 700, 1200].forEach((delay) => window.setTimeout(renderAccountStatusCards, delay));

  window.addEventListener("popstate", () => scheduleAccountStatusRender(120));
  window.addEventListener("finple-auth-updated", () => scheduleAccountStatusRender(120));
  window.addEventListener("finple-plan-updated", () => scheduleAccountStatusRender(120));
  window.addEventListener("finple-local-storage-updated", () => scheduleAccountStatusRender(120));
  window.addEventListener("storage", () => scheduleAccountStatusRender(120));
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAccountStatusDisplayPatch, { once: true });
  } else {
    bootAccountStatusDisplayPatch();
  }
}

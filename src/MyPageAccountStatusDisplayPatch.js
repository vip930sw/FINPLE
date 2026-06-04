/* =========================================================
   Step 111-8 - MY PAGE Account Status display patch
   - ACCOUNT STATUS를 3 x 2 카드 배열로 정리합니다.
   - 로그인 이메일, 가입방식, 이메일 활용 목적을 명확히 표시합니다.
   - 체험 세션 안내 문구와 계정 상태 새로고침 버튼은 사용자 화면에서 숨깁니다.
   - 반복 렌더링을 방지하기 위해 MutationObserver를 사용하지 않습니다.
========================================================= */

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
let lastAccountStatusSignature = "";
let accountStatusTimer = null;

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

function formatAuthMode(authMode) {
  const normalized = String(authMode || "").toLowerCase();
  const labels = {
    "email-password": "이메일 가입",
    google: "Google 로그인",
    kakao: "Kakao 로그인",
    naver: "Naver 로그인",
    "trial-user": "체험 계정",
  };
  return labels[normalized] || "계정 로그인";
}

function getEmailPurposeText(user) {
  if (!user?.email || user.email === "trial@finple.local") {
    return "계정 식별 및 서비스 안내";
  }

  return "계정 식별 · 인증 · 결제/구독 안내";
}

function getAccountStatusCards(user) {
  const isLoggedIn = Boolean(user?.id);
  const email = user?.email || "-";
  const authMode = formatAuthMode(user?.authMode);
  const emailPurpose = getEmailPurposeText(user);
  const loginStatus = isLoggedIn ? "로그인됨" : "미연결";
  const plan = user?.plan ? String(user.plan).toUpperCase() : "FREE";
  const userName = user?.name || user?.nickname || "-";

  return [
    { label: "로그인 이메일", value: email, note: "계정 식별 정보", className: "monoText" },
    { label: "가입방식", value: authMode, note: "로그인 제공 방식" },
    { label: "이메일 활용 목적", value: emailPurpose, note: "필수 안내 수신" },
    { label: "로그인 상태", value: loginStatus, note: isLoggedIn ? "이용 가능" : "로그인 필요" },
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

function hideLowValueAccountStatusElements(panel) {
  panel.querySelectorAll(".serverStorageMessage.compact").forEach((node) => {
    if (!node.hasAttribute("hidden")) {
      node.classList.add("accountStatusMessageHidden");
      node.setAttribute("hidden", "true");
    }
  });

  panel.querySelectorAll(".serverStorageActions button").forEach((button) => {
    const text = String(button.textContent || "").trim();
    if (text === "계정 상태 새로고침" || text === "체험 사용자 연결") {
      if (!button.hasAttribute("hidden")) {
        button.classList.add("accountStatusRefreshHidden");
        button.setAttribute("hidden", "true");
      }
    }
  });
}

function renderAccountStatusCards() {
  if (!isMyPagePath()) return;

  const panel = document.querySelector(".accountStatusPanel");
  const grid = panel?.querySelector(".accountStatusGrid");
  if (!panel || !grid) return;

  const user = readJson(AUTH_USER_STORAGE_KEY);
  const cards = getAccountStatusCards(user);
  const signature = JSON.stringify(cards);

  grid.classList.add("accountStatusGrid--sixCards");
  hideLowValueAccountStatusElements(panel);

  if (grid.getAttribute("data-account-status-signature") === signature) return;

  grid.innerHTML = getCardsHtml(cards);
  grid.setAttribute("data-account-status-signature", signature);
  lastAccountStatusSignature = signature;
}

function scheduleAccountStatusRender(delay = 80) {
  window.clearTimeout(accountStatusTimer);
  accountStatusTimer = window.setTimeout(renderAccountStatusCards, delay);
}

function bootAccountStatusDisplayPatch() {
  [100, 240, 520, 1000, 1800].forEach((delay) => window.setTimeout(renderAccountStatusCards, delay));

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

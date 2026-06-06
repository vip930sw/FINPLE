const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const STYLE_ID = "finple-mypage-account-polish-style";
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
    .replace(/
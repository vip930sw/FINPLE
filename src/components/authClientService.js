import {
  clearStoredFinpleAuthUser,
  getFinpleApiBaseUrl,
  setStoredFinpleAuthUser,
} from "./portfolio/services/serverPortfolioService";
import {
  archiveVisiblePortfolioStorageForUser,
  dispatchPortfolioStorageUpdated,
  resetVisiblePortfolioStorageToGuest,
  restoreVisiblePortfolioStorageForUser,
} from "./portfolio/utils/portfolioStorageScope";

const AUTH_SESSION_STORAGE_KEY = "finple-auth-session";
const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const EDUCATION_STORAGE_RESET_MARKER_KEY = "finple-education-storage-reset-user-id";
const EDUCATION_LOCAL_STORAGE_KEYS = [
  "finple-portfolio-list",
  "finple-active-portfolio-id",
  "finple-global-settings",
  "finple-portfolio-simulator",
  "finple-simulator-state",
  "finple-mbti-simulator-preset",
];
const OAUTH_WAKEUP_TIMEOUT_MS = 12000;
const OAUTH_WAKEUP_MAX_ATTEMPTS = 3;
const OAUTH_LOADING_MESSAGE = "잠시만 기다려주세요. 불러오는 중입니다.";
const OAUTH_READY_MESSAGE = "곧 이동합니다.";
const OAUTH_RETRY_MESSAGE = "일시적으로 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return value;

  if (value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  } else {
    window.localStorage.removeItem(key);
  }

  return value;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = OAUTH_WAKEUP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function dispatchOAuthWakeupStatus(message) {
  if (typeof window === "undefined") return;

  try {
    window.dispatchEvent(new CustomEvent("finple-oauth-wakeup-status", { detail: { message } }));
  } catch {
    // 상태 이벤트 전파 실패는 로그인 흐름을 막지 않습니다.
  }
}

async function ensureFinpleApiReadyForOAuth() {
  if (typeof window === "undefined") return;

  const apiBaseUrl = getFinpleApiBaseUrl().replace(/\/+$/, "");
  const healthUrl = `${apiBaseUrl}/health`;

  for (let attempt = 1; attempt <= OAUTH_WAKEUP_MAX_ATTEMPTS; attempt += 1) {
    try {
      dispatchOAuthWakeupStatus(OAUTH_LOADING_MESSAGE);
      const response = await fetchWithTimeout(healthUrl, { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => null);

      if (response.ok && payload?.ok !== false) {
        dispatchOAuthWakeupStatus(OAUTH_READY_MESSAGE);
        return;
      }
    } catch (error) {
      if (attempt >= OAUTH_WAKEUP_MAX_ATTEMPTS) {
        throw new Error(OAUTH_RETRY_MESSAGE, { cause: error });
      }
    }

    await sleep(1200 * attempt);
  }

  throw new Error(OAUTH_RETRY_MESSAGE);
}

async function startOAuthLoginWithWakeup(startUrl) {
  if (typeof window === "undefined") return;

  try {
    await ensureFinpleApiReadyForOAuth();
    window.location.href = startUrl;
  } catch (error) {
    const message = error?.message || OAUTH_RETRY_MESSAGE;
    dispatchOAuthWakeupStatus(message);
    window.alert(message);
  }
}

export function getStoredFinpleAuthSession() {
  return readJson(AUTH_SESSION_STORAGE_KEY, null);
}

export function setStoredFinpleAuthSession(session) {
  return writeJson(AUTH_SESSION_STORAGE_KEY, session || null);
}

export function clearStoredFinpleAuthSession() {
  return setStoredFinpleAuthSession(null);
}

export function normalizeFinpleAuthMessage(message = "", status = null) {
  const text = String(message || "").trim();
  if (text.includes("이메일 또는 비밀번호")) return "이메일 또는 비밀번호를 확인해 주세요.";
  if (text.includes("이메일 인증") && (text.includes("필요") || text.includes("완료"))) return "이메일 인증 후 로그인할 수 있습니다.";
  if (text.includes("카카오") && (text.includes("취소") || text.includes("실패"))) return "카카오 로그인이 취소되었습니다.";
  if (text.includes("카카오") && text.includes("이메일")) return "카카오계정 이메일 제공 동의가 필요합니다.";
  if (text.includes("네이버") && text.includes("검수")) return "네이버 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  if (status === 401 && !text.includes("이메일 또는 비밀번호")) return "로그인 시간이 만료되었습니다. 다시 로그인해 주세요.";
  return text || "인증 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function normalizeAuthUser(user, authMode = "email-password") {
  if (!user?.id) return null;

  return {
    ...user,
    authMode,
    connectedAt: new Date().toISOString(),
  };
}

function isEducationAuthUser(user, authMode = user?.authMode) {
  return authMode === "education-account" || user?.entitlementSource === "education" || Boolean(user?.educationAccount);
}

function resetEducationLocalDataIfNeeded(user, authMode, previousUser = null) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  if (!isEducationAuthUser(user, authMode)) return false;

  const markerValue = user?.educationAccount?.id || user?.id || "education";
  const previousUserId = previousUser?.id || null;
  if (window.localStorage.getItem(EDUCATION_STORAGE_RESET_MARKER_KEY) === markerValue && (!previousUserId || previousUserId === user?.id)) return false;

  const scopedSuffix = user?.id ? `:user:${user.id}` : "";
  EDUCATION_LOCAL_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    if (scopedSuffix) window.localStorage.removeItem(`${key}${scopedSuffix}`);
  });
  window.localStorage.setItem(EDUCATION_STORAGE_RESET_MARKER_KEY, markerValue);
  return true;
}

async function requestAuth(path, body, options = {}) {
  const session = getStoredFinpleAuthSession();
  const method = options.method || (body ? "POST" : "GET");
  const response = await fetch(`${getFinpleApiBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.ok === false) {
    const rawMessage = payload?.message || "인증 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    const error = new Error(normalizeFinpleAuthMessage(rawMessage, response.status));
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}

function storeAuthResult(payload) {
  const authMode = payload?.authMode || "email-password";
  const user = normalizeAuthUser(payload?.user, authMode);

  if (!user?.id) {
    throw new Error("사용자 정보를 확인하지 못했습니다.");
  }

  const previousUser = readJson(AUTH_USER_STORAGE_KEY, null);
  setStoredFinpleAuthUser(user);
  const educationLocalDataReset = resetEducationLocalDataIfNeeded(user, authMode, previousUser);
  restoreVisiblePortfolioStorageForUser(user);

  if (payload?.session?.token) {
    setStoredFinpleAuthSession({
      token: payload.session.token,
      expiresAt: payload.session.expiresAt || null,
      authMode,
    });
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("finple-auth-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
    if (educationLocalDataReset) window.dispatchEvent(new Event("finple-portfolio-storage-reset"));
  }

  return user;
}

function decodeOAuthPayload(payloadText) {
  try {
    return JSON.parse(decodeURIComponent(escape(window.atob(payloadText.replace(/-/g, "+").replace(/_/g, "/")))));
  } catch {
    throw new Error("소셜 로그인 결과를 확인하지 못했습니다.");
  }
}

export function consumeGoogleOAuthRedirectResult() {
  if (typeof window === "undefined") return null;

  const hash = String(window.location.hash || "");
  const match = hash.match(/finpleOAuth=([^&]+)/);
  if (!match?.[1]) return null;

  const payload = decodeOAuthPayload(match[1]);
  const user = storeAuthResult(payload);
  window.history.replaceState({ page: "login" }, "", "/login");

  return user;
}

export function getGoogleOAuthStartUrl() {
  return `${getFinpleApiBaseUrl()}/auth/google/start`;
}

export function startGoogleOAuthLogin() {
  return startOAuthLoginWithWakeup(getGoogleOAuthStartUrl());
}

export function getNaverOAuthStartUrl() {
  return `${getFinpleApiBaseUrl()}/auth/naver/start`;
}

export function startNaverOAuthLogin() {
  return startOAuthLoginWithWakeup(getNaverOAuthStartUrl());
}

export function getKakaoOAuthStartUrl() {
  return `${getFinpleApiBaseUrl()}/auth/kakao/start`;
}

export function startKakaoOAuthLogin() {
  return startOAuthLoginWithWakeup(getKakaoOAuthStartUrl());
}

export async function checkEmailAvailability(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("올바른 이메일 주소를 입력해 주세요.");
  }

  const query = new URLSearchParams({ email: normalizedEmail });
  const payload = await requestAuth(`/auth/check-email?${query.toString()}`);

  return {
    email: payload.email || normalizedEmail,
    available: Boolean(payload.available),
  };
}

export async function signupWithEmailPassword({
  email,
  password,
  name,
  nickname,
  privacyAccepted,
  termsAccepted,
  marketingAgreed,
}) {
  return requestAuth("/auth/signup", {
    email,
    password,
    name,
    nickname,
    privacyAccepted,
    termsAccepted,
    marketingAgreed,
  });
}

export async function verifyEmailToken(token) {
  return requestAuth("/auth/verify-email", { token });
}

export async function resendVerificationEmail(email) {
  return requestAuth("/auth/resend-verification", { email });
}

export async function loginWithEmailPassword({ email, password }) {
  const payload = await requestAuth("/auth/login", { email, password });
  return storeAuthResult(payload);
}

export async function loginWithEducationAccount({ loginId, password }) {
  const payload = await requestAuth("/auth/education-login", { loginId, password });
  return storeAuthResult(payload);
}

export async function logoutFinpleAuth() {
  const session = getStoredFinpleAuthSession();
  const storedUser = readJson(AUTH_USER_STORAGE_KEY, null);

  try {
    if (session?.token) {
      await requestAuth("/auth/logout", { sessionToken: session.token });
    }
  } catch {
    // 로그아웃은 사용자 화면을 막지 않기 위해 로컬 정리를 우선합니다.
  }

  if (storedUser?.id) archiveVisiblePortfolioStorageForUser(storedUser);
  clearStoredFinpleAuthSession();
  clearStoredFinpleAuthUser();
  resetVisiblePortfolioStorageToGuest();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("finple-auth-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
    window.dispatchEvent(new Event("finple-portfolio-storage-reset"));
    dispatchPortfolioStorageUpdated();

    const pathname = String(window.location.pathname || "");
    if (pathname.includes("/simulator")) {
      window.setTimeout(() => window.location.reload(), 0);
    }
  }

  return { ok: true };
}

export async function changeFinplePassword({ currentPassword, newPassword }) {
  return requestAuth(
    "/auth/password",
    { currentPassword, newPassword },
    { method: "PATCH" }
  );
}

export async function deleteFinpleAccount({
  confirmText,
  privacyDeletionConfirmed,
  subscriptionAccessConfirmed,
  refundPolicyConfirmed,
}) {
  const storedUser = readJson(AUTH_USER_STORAGE_KEY, null);
  const payload = await requestAuth(
    "/auth/me",
    {
      confirmText,
      privacyDeletionConfirmed,
      subscriptionAccessConfirmed,
      refundPolicyConfirmed,
    },
    { method: "DELETE" }
  );

  if (storedUser?.id) archiveVisiblePortfolioStorageForUser(storedUser);
  clearStoredFinpleAuthSession();
  clearStoredFinpleAuthUser();
  resetVisiblePortfolioStorageToGuest();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("finple-auth-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
    window.dispatchEvent(new Event("finple-portfolio-storage-reset"));
    dispatchPortfolioStorageUpdated();
  }

  return payload;
}

export async function fetchCurrentAuthUser() {
  const payload = await requestAuth("/auth/me");
  return payload?.user || null;
}

import {
  clearStoredFinpleAuthUser,
  getFinpleApiBaseUrl,
  setStoredFinpleAuthUser,
} from "./portfolio/services/serverPortfolioService";

const AUTH_SESSION_STORAGE_KEY = "finple-auth-session";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
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

export function getStoredFinpleAuthSession() {
  return readJson(AUTH_SESSION_STORAGE_KEY, null);
}

export function setStoredFinpleAuthSession(session) {
  return writeJson(AUTH_SESSION_STORAGE_KEY, session || null);
}

export function clearStoredFinpleAuthSession() {
  return setStoredFinpleAuthSession(null);
}

function normalizeAuthUser(user, authMode = "email-password") {
  if (!user?.id) return null;

  return {
    ...user,
    authMode,
    connectedAt: new Date().toISOString(),
  };
}

async function requestAuth(path, body) {
  const session = getStoredFinpleAuthSession();
  const response = await fetch(`${getFinpleApiBaseUrl()}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || "인증 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
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

  setStoredFinpleAuthUser(user);

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
  }

  return user;
}

function decodeOAuthPayload(payloadText) {
  try {
    return JSON.parse(decodeURIComponent(escape(window.atob(payloadText.replace(/-/g, "+").replace(/_/g, "/")))));
  } catch (error) {
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
  if (typeof window === "undefined") return;
  window.location.href = getGoogleOAuthStartUrl();
}

export function getNaverOAuthStartUrl() {
  return `${getFinpleApiBaseUrl()}/auth/naver/start`;
}

export function startNaverOAuthLogin() {
  if (typeof window === "undefined") return;
  window.location.href = getNaverOAuthStartUrl();
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

export async function logoutFinpleAuth() {
  const session = getStoredFinpleAuthSession();

  try {
    if (session?.token) {
      await requestAuth("/auth/logout", { sessionToken: session.token });
    }
  } catch (error) {
    // 로그아웃은 사용자 화면을 막지 않기 위해 로컬 정리를 우선합니다.
  }

  clearStoredFinpleAuthSession();
  clearStoredFinpleAuthUser();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("finple-auth-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
  }

  return { ok: true };
}

export async function fetchCurrentAuthUser() {
  const payload = await requestAuth("/auth/me");
  return payload?.user || null;
}

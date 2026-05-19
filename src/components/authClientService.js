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
    throw new Error(payload?.message || "인증 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
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

export async function signupWithEmailPassword({ email, password, name, privacyAccepted, termsAccepted, marketingAgreed }) {
  const payload = await requestAuth("/auth/signup", {
    email,
    password,
    name,
    privacyAccepted,
    termsAccepted,
    marketingAgreed,
  });

  return storeAuthResult(payload);
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

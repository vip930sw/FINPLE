import { getStoredFinpleAuthSession } from "../authClientService";
import {
  getFinpleApiBaseUrl,
  getStoredFinpleAuthUser,
} from "../portfolio/services/serverPortfolioService";
import { normalizeFinpleApiBaseUrl } from "../portfolio/services/apiBaseUrl.js";
import { normalizeFinplePlan } from "../portfolio/config/planConfig";

export const SUBSCRIPTION_TTL_MS = 45000;
export const PAYMENT_METHOD_TTL_MS = 45000;

export function getCurrentUserKey(user = getStoredFinpleAuthUser()) {
  return `${user?.id || ""}::${user?.email || ""}`;
}

export function getAuthHeaders() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(user?.id ? { "x-finple-user-id": user.id } : {}),
  };
}

export async function fetchJsonWithTimeout(path, options = {}, timeoutMs = 30000) {
  const apiBase = normalizeFinpleApiBaseUrl(getFinpleApiBaseUrl());
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || "서버 응답을 확인하지 못했습니다.");
    }
    return payload;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function formatPlanLabel(plan) {
  const normalized = normalizeFinplePlan(plan);
  if (normalized === "personal") return "Personal";
  if (normalized === "pro") return "Pro";
  return "Free";
}

export function formatDateLabel(value) {
  if (!value) return "해당 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "해당 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatShortDate(value) {
  if (!value) return "없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatAmount(value, currency = "KRW") {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "-";
  if (currency === "KRW") return `${amount.toLocaleString("ko-KR")}원`;
  return `${amount.toLocaleString("ko-KR")} ${currency}`;
}

export function isEducationAccount(user) {
  return Boolean(
    user?.authMode === "education-account" ||
      user?.entitlementSource === "education" ||
      user?.educationAccount
  );
}

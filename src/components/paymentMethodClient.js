import { getStoredFinpleAuthSession } from "./authClientService";
import {
  getFinpleApiBaseUrl,
  getStoredFinpleAuthUser,
} from "./portfolio/services/serverPortfolioService";

async function readResponseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function getAuthHeaders() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(user?.id ? { "x-finple-user-id": user.id } : {}),
  };
}

const BILLING_PREPARE_TIMEOUT_MS = 10000;
const BILLING_METHOD_STATUS_TIMEOUT_MS = 8000;
export const BILLING_METHOD_STATUS_CACHE_TTL_MS = 45000;

const billingMethodStatusCache = new Map();
const billingMethodStatusInflight = new Map();
const CARD_COMPANY_LABELS = {
  33: "우리은행",
  W1: "우리은행",
};

async function fetchPaymentJsonWithTimeout(url, options = {}, timeoutMs = BILLING_PREPARE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      timeoutError.code = "REQUEST_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function getTossClientKey() {
  return String(import.meta.env.VITE_TOSS_CLIENT_KEY || import.meta.env.VITE_TOSS_BILLING_CLIENT_KEY || "").trim();
}

function getBillingMethodStatusCacheKey() {
  const user = getStoredFinpleAuthUser();
  return `${getFinpleApiBaseUrl()}::${user?.id || user?.email || "current-user"}::billing-method`;
}

function getDigitsTail(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : "";
}

function getPaymentMethodLast4(method = {}) {
  return (
    getDigitsTail(method.cardLast4) ||
    getDigitsTail(method.card_last4) ||
    getDigitsTail(method.last4) ||
    getDigitsTail(method.maskedCardNumber) ||
    getDigitsTail(method.masked_card_number) ||
    getDigitsTail(method.displayLabel) ||
    getDigitsTail(method.display_label)
  );
}

function getPaymentMethodCompany(method = {}) {
  return String(
    method.cardCompany ||
      method.card_company ||
      method.issuer ||
      method.bank ||
      method.company ||
      ""
  ).trim();
}

function getCleanDisplayLabel(value, last4 = "") {
  let label = String(value || "").trim();
  if (!label) return "";

  if (last4) {
    label = label.replace(new RegExp(`\\s*${last4}\\s*$`), "").trim();
  }
  label = label
    .replace(/^[0-9A-Z]{2,3}\s*/i, "")
    .replace(/[\s*.\-()]+$/g, "")
    .trim();

  if (!label || /^\d+$/.test(label)) return "";
  if (/^[*\s.\-()·]+$/.test(label)) return "";
  if (/^(card registered|registered card|payment method registered)$/i.test(label)) return "";
  if (/^(카드 등록 완료|등록된 결제수단|등록 카드)$/.test(label)) return "";
  return label;
}

function resolvePaymentMethodCompanyLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const code = raw.match(/^\s*([0-9A-Z]{2,3})\b/i)?.[1]?.toUpperCase() || "";
  if (code && CARD_COMPANY_LABELS[code]) return CARD_COMPANY_LABELS[code];
  if (/^[0-9A-Z]{2,3}$/i.test(raw)) return "";
  return raw;
}

export function getSafeBillingMethodDisplayLabel(method = {}) {
  if (!method || typeof method !== "object") return "";

  const last4 = getPaymentMethodLast4(method);
  const company =
    getCleanDisplayLabel(resolvePaymentMethodCompanyLabel(getPaymentMethodCompany(method)), last4) ||
    getCleanDisplayLabel(resolvePaymentMethodCompanyLabel(method.displayLabel || method.display_label), last4);
  const storedLabel = getCleanDisplayLabel(method.displayLabel || method.display_label, last4);
  const labelCompany = company || storedLabel;

  if (labelCompany && last4) return `${labelCompany} · **** ${last4}`;
  if (last4) return `등록 카드 · **** ${last4}`;
  if (labelCompany) return `${labelCompany} 등록 완료`;
  return "카드 등록 완료";
}

function normalizeBillingMethodStatusPayload(payload) {
  if (!payload || typeof payload !== "object" || !payload.method || typeof payload.method !== "object") {
    return payload;
  }

  const method = { ...payload.method };
  const safeLabel = getSafeBillingMethodDisplayLabel(method);
  const safeLast4 = getPaymentMethodLast4(method);

  method.displayLabel = safeLabel;
  if (safeLast4) method.cardLast4 = safeLast4;

  return {
    ...payload,
    method,
  };
}

export function clearBillingMethodStatusCache() {
  billingMethodStatusCache.clear();
  billingMethodStatusInflight.clear();
}

export async function prepareBillingAuth() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("자동결제 결제수단 등록을 위해 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const response = await fetchPaymentJsonWithTimeout(`${getFinpleApiBaseUrl()}/payments/toss/billing/prepare`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan: "personal" }),
  });

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || "자동결제 등록 준비 요청에 실패했습니다.");
    error.code = payload?.code || "BILLING_AUTH_PREPARE_FAILED";
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function prepareBillingMethodUpdate() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("자동결제 결제수단 등록/변경을 위해 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const response = await fetchPaymentJsonWithTimeout(`${getFinpleApiBaseUrl()}/payments/toss/billing/method/prepare`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ purpose: "card_update" }),
  });

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || "자동결제 결제수단 등록/변경 준비 요청에 실패했습니다.");
    error.code = payload?.code || "BILLING_METHOD_PREPARE_FAILED";
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function issueBillingKey({ authKey, orderId, customerKey }) {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("자동결제 결제수단 저장을 위해 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/toss/billing/issue`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ authKey, orderId, customerKey }),
  });

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || "자동결제 결제수단 저장에 실패했습니다.");
    error.code = payload?.code || "BILLING_KEY_ISSUE_FAILED";
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function issueBillingMethodUpdate({ authKey, orderId, customerKey }) {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("자동결제 결제수단 저장을 위해 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/toss/billing/method/issue`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ authKey, orderId, customerKey }),
  });

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || "자동결제 결제수단 저장에 실패했습니다.");
    error.code = payload?.code || "BILLING_METHOD_ISSUE_FAILED";
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function fetchBillingMethodStatus(options = {}) {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("결제수단 확인을 위해 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const cacheKey = getBillingMethodStatusCacheKey();
  const cached = billingMethodStatusCache.get(cacheKey);
  const now = Date.now();
  if (!options.force && cached && now - cached.cachedAt < BILLING_METHOD_STATUS_CACHE_TTL_MS) {
    return { ...cached.payload, fromCache: true };
  }

  if (!options.force && billingMethodStatusInflight.has(cacheKey)) {
    return billingMethodStatusInflight.get(cacheKey);
  }

  const requestPromise = (async () => {
    const response = await fetchPaymentJsonWithTimeout(`${getFinpleApiBaseUrl()}/payments/toss/billing/method`, {
      method: "GET",
      headers: getAuthHeaders(),
    }, BILLING_METHOD_STATUS_TIMEOUT_MS);

    const payload = normalizeBillingMethodStatusPayload(await readResponseJson(response));

    if (!response.ok || payload?.ok === false) {
      const error = new Error(payload?.message || "결제수단 상태를 확인하지 못했습니다.");
      error.code = payload?.code || "BILLING_METHOD_STATUS_FAILED";
      error.payload = payload;
      throw error;
    }

    billingMethodStatusCache.set(cacheKey, { cachedAt: Date.now(), payload });
    return payload;
  })();

  billingMethodStatusInflight.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    billingMethodStatusInflight.delete(cacheKey);
  }
}

function loadTossPaymentsSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 결제수단 등록을 진행할 수 있습니다."));
  }

  if (window.TossPayments) return Promise.resolve(window.TossPayments);

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector("script[data-finple-toss-sdk]");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.TossPayments), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Toss Payments SDK를 불러오지 못했습니다.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    script.setAttribute("data-finple-toss-sdk", "true");
    script.onload = () => resolve(window.TossPayments);
    script.onerror = () => reject(new Error("Toss Payments SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

export async function requestTossBillingAuth(preparePayload) {
  const clientKey = getTossClientKey();

  if (!clientKey) {
    throw new Error("Vercel 환경변수 VITE_TOSS_CLIENT_KEY가 필요합니다.");
  }

  if (!preparePayload?.customerKey || !preparePayload?.successUrl || !preparePayload?.failUrl) {
    throw new Error("자동결제 등록 준비 정보가 올바르지 않습니다.");
  }

  const TossPayments = await loadTossPaymentsSdk();
  const tossPayments = TossPayments(clientKey);

  if (typeof tossPayments.requestBillingAuth !== "function") {
    throw new Error("현재 Toss SDK에서 자동결제 등록 함수를 찾지 못했습니다.");
  }

  return tossPayments.requestBillingAuth("카드", {
    customerKey: preparePayload.customerKey,
    successUrl: preparePayload.successUrl,
    failUrl: preparePayload.failUrl,
  });
}

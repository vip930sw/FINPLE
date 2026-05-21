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

export function getTossClientKey() {
  return String(import.meta.env.VITE_TOSS_CLIENT_KEY || import.meta.env.VITE_TOSS_BILLING_CLIENT_KEY || "").trim();
}

export async function prepareBillingAuth() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("자동결제 결제수단 등록을 위해 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/toss/billing/prepare`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan: "personal" }),
  });

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || "자동결제 등록 준비 요청에 실패했습니다.");
    error.code = payload?.code || "BILLING_AUTH_PREPARE_FAILED";
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
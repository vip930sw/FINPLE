import { getStoredFinpleAuthSession } from "./authClientService";
import {
  getFinpleApiBaseUrl,
  getStoredFinpleAuthUser,
  setStoredFinpleAuthUser,
} from "./portfolio/services/serverPortfolioService";
import { setStoredFinplePlan } from "./portfolio/config/planConfig";

async function readResponseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function syncConfirmedPlanToBrowser(payload) {
  if (!payload?.ok) return;

  const confirmedPlan = payload.entitlementUpdated || payload.entitlementUpdate?.applied
    ? payload.plan || payload.entitlementUpdate?.plan || "personal"
    : "";

  if (confirmedPlan !== "personal") return;

  const storedUser = getStoredFinpleAuthUser();
  if (storedUser?.id) {
    setStoredFinpleAuthUser({
      ...storedUser,
      plan: "personal",
      billingStatus: "active",
      subscriptionId: payload.entitlementUpdate?.subscriptionId || storedUser.subscriptionId || null,
      entitlementValidUntil: payload.entitlementUpdate?.validUntil || storedUser.entitlementValidUntil || null,
    });
  }

  setStoredFinplePlan("personal");

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("finple-auth-updated"));
    window.dispatchEvent(new Event("finple-plan-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
  }
}

export function getBillingSuccessParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    paymentKey: params.get("paymentKey") || "",
    orderId: params.get("orderId") || "",
    amount: params.get("amount") || "",
  };
}

export function hasBillingConfirmParams(params = getBillingSuccessParams()) {
  return Boolean(params.paymentKey && params.orderId && params.amount);
}

export async function confirmTossPayment(params = getBillingSuccessParams()) {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("결제 승인을 확인하려면 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  if (!hasBillingConfirmParams(params)) {
    const error = new Error("결제 승인 확인에 필요한 값이 부족합니다.");
    error.code = "MISSING_CONFIRM_PARAMS";
    throw error;
  }

  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/toss/confirm`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(user?.id ? { "x-finple-user-id": user.id } : {}),
    },
    body: JSON.stringify({
      plan: "personal",
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    }),
  });

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || "결제 승인 확인에 실패했습니다.");
    error.code = payload?.code || "PAYMENT_CONFIRM_FAILED";
    error.payload = payload;
    throw error;
  }

  syncConfirmedPlanToBrowser(payload);

  return payload;
}

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

export async function preparePersonalCheckout() {
  const session = getStoredFinpleAuthSession();
  const user = getStoredFinpleAuthUser();

  if (!session?.token && !user?.id) {
    const error = new Error("결제 준비를 위해 로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/toss/prepare`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(user?.id ? { "x-finple-user-id": user.id } : {}),
    },
    body: JSON.stringify({
      plan: "personal",
      amount: 9900,
    }),
  });

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(
      payload?.message || "결제 준비 요청에 실패했습니다. 잠시 후 다시 시도해 주세요."
    );
    error.code = payload?.code || "PAYMENT_PREPARE_FAILED";
    throw error;
  }

  return payload;
}

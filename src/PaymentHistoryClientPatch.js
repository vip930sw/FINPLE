const PAYMENT_HISTORY_CACHE_TTL_MS = 45000;
const paymentHistoryCache = new Map();
const paymentHistoryInflight = new Map();

function getPaymentHistoryCacheKey(user) {
  const baseUrl = window.FINPLE_ASSET_DATA_CONFIG?.apiBaseUrl || import.meta.env.VITE_FINPLE_API_BASE_URL || "http://localhost:5050/api";
  return `${baseUrl}::${user?.id || user?.email || "current-user"}::payment-history`;
}

export async function fetchFinplePaymentHistory() {
  const rawUser = window.localStorage.getItem("finple-trial-auth-user") || "null";
  const user = JSON.parse(rawUser);
  if (!user?.id) throw new Error("Login required");
  const baseUrl = window.FINPLE_ASSET_DATA_CONFIG?.apiBaseUrl || import.meta.env.VITE_FINPLE_API_BASE_URL || "http://localhost:5050/api";
  const cacheKey = getPaymentHistoryCacheKey(user);
  const cached = paymentHistoryCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < PAYMENT_HISTORY_CACHE_TTL_MS) return cached.payments;
  if (paymentHistoryInflight.has(cacheKey)) return paymentHistoryInflight.get(cacheKey);

  const requestPromise = (async () => {
    const response = await fetch(`${baseUrl}/payments/history`, {
      method: "GET",
      headers: { "x-finple-user-id": user.id },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok === false) throw new Error(payload?.message || "Request failed");
    const payments = Array.isArray(payload?.payments) ? payload.payments : [];
    paymentHistoryCache.set(cacheKey, { cachedAt: Date.now(), payments });
    return payments;
  })();

  paymentHistoryInflight.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    paymentHistoryInflight.delete(cacheKey);
  }
}

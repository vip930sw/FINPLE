export async function fetchFinplePaymentHistory() {
  const rawUser = window.localStorage.getItem("finple-trial-auth-user") || "null";
  const user = JSON.parse(rawUser);
  if (!user?.id) throw new Error("Login required");
  const baseUrl = window.FINPLE_ASSET_DATA_CONFIG?.apiBaseUrl || import.meta.env.VITE_FINPLE_API_BASE_URL || "http://localhost:5050/api";
  const response = await fetch(`${baseUrl}/payments/history`, {
    method: "GET",
    headers: { "x-finple-user-id": user.id },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) throw new Error(payload?.message || "Request failed");
  return Array.isArray(payload?.payments) ? payload.payments : [];
}

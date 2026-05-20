import { getFinpleApiBaseUrl } from "./portfolio/services/serverPortfolioService";

export function getFrontendPaymentMode() {
  const rawMode = String(import.meta.env.VITE_FINPLE_PAYMENT_MODE || "stub").trim().toLowerCase();
  return ["stub", "test", "live"].includes(rawMode) ? rawMode : "stub";
}

export function getTossPublicKeyStatus() {
  const publicKey = String(import.meta.env.VITE_TOSS_CLIENT_KEY || "").trim();
  const mode = getFrontendPaymentMode();

  return {
    hasPublicKey: Boolean(publicKey),
    mode,
    publicKeyLabel: publicKey ? "configured" : "not configured",
    checkoutClientReady: Boolean(publicKey && mode !== "stub"),
  };
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function fetchPaymentHealth() {
  const response = await fetch(`${getFinpleApiBaseUrl()}/payments/health`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const payload = await readJson(response);

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || "결제 설정 상태를 확인하지 못했습니다.");
  }

  return payload;
}

export function getPaymentModeLabel(mode) {
  const normalized = String(mode || "stub").toLowerCase();

  if (normalized.includes("live")) return "실결제 전환 주의";
  if (normalized.includes("test")) return "Toss 테스트 준비";
  return "결제 준비 중";
}

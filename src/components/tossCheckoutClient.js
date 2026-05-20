const TOSS_SDK_URL = "https://js.tosspayments.com/v1/payment";

let tossSdkPromise = null;

function getTossClientKey() {
  return String(import.meta.env.VITE_TOSS_CLIENT_KEY || "").trim();
}

function loadTossSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 결제창을 열 수 있습니다."));
  }

  if (window.TossPayments) return Promise.resolve(window.TossPayments);
  if (tossSdkPromise) return tossSdkPromise;

  tossSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${TOSS_SDK_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.TossPayments));
      existingScript.addEventListener("error", () => reject(new Error("Toss 결제 SDK를 불러오지 못했습니다.")));
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.TossPayments);
    script.onerror = () => reject(new Error("Toss 결제 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return tossSdkPromise;
}

function buildCheckoutOptions(preparePayload) {
  const amount = Number(preparePayload?.amount || 0);
  const orderId = String(preparePayload?.orderId || "");
  const orderName = String(preparePayload?.orderName || "FINPLE Personal");
  const successUrl = String(preparePayload?.successUrl || "");
  const failUrl = String(preparePayload?.failUrl || "");
  const customerName = String(preparePayload?.customer?.name || "FINPLE 사용자");
  const customerEmail = String(preparePayload?.customer?.email || "");

  if (!amount || !orderId || !successUrl || !failUrl) {
    throw new Error("결제 준비 정보가 부족합니다. Personal을 다시 선택해 주세요.");
  }

  return {
    amount,
    orderId,
    orderName,
    customerName,
    customerEmail,
    successUrl,
    failUrl,
  };
}

export function canOpenTossCheckout(preparePayload) {
  return Boolean(
    getTossClientKey() &&
    preparePayload?.checkoutAvailable &&
    preparePayload?.orderId &&
    preparePayload?.amount &&
    preparePayload?.successUrl &&
    preparePayload?.failUrl
  );
}

export async function openTossTestCheckout(preparePayload) {
  const clientKey = getTossClientKey();

  if (!clientKey) {
    throw new Error("Toss Client Key가 설정되지 않았습니다. Vercel 환경변수를 확인해 주세요.");
  }

  if (!preparePayload?.checkoutAvailable) {
    throw new Error("서버 결제 준비 상태가 아직 활성화되지 않았습니다.");
  }

  const TossPayments = await loadTossSdk();
  const tossPayments = TossPayments(clientKey);
  const options = buildCheckoutOptions(preparePayload);

  return tossPayments.requestPayment("카드", options);
}

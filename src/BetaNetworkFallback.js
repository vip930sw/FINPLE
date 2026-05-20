/* =========================================================
   Step 123 - Beta Network Fallback
   - 운영 백엔드 연결 실패 시 `Failed to fetch` 원문 노출 방지
   - 체험 계정 로그인은 로컬 베타 세션으로 우선 진입 허용
   - 문의 전송 실패 시 브라우저에 임시 저장
========================================================= */

const NETWORK_FALLBACK_MESSAGE =
  "서버 연결을 확인하지 못했습니다. 백엔드 배포 주소 또는 CORS 설정을 확인한 뒤 다시 시도해 주세요.";

function isNetworkFetchError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
}

function getRequestUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input?.url || "";
}

function createJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createLocalTrialUser() {
  const now = new Date().toISOString();
  return {
    id: `local-trial-${Date.now()}`,
    email: "trial@finple.local",
    name: "FINPLE 체험 사용자",
    nickname: "trial",
    plan: "free",
    authMode: "trial-local-fallback",
    connectedAt: now,
  };
}

function saveLocalPendingInquiry(requestUrl, requestInit) {
  const now = new Date().toISOString();
  let body = {};

  try {
    body = JSON.parse(requestInit?.body || "{}");
  } catch (error) {
    body = {};
  }

  const inquiry = {
    id: `임시저장-${Date.now()}`,
    status: "pending_server_connection",
    category: body.category || "etc",
    email: body.email || "",
    title: body.title || "FINPLE 문의사항",
    message: body.message || "",
    pageUrl: body.pageUrl || requestUrl,
    userAgent: body.userAgent || "",
    createdAt: now,
  };

  try {
    const storageKey = "finple-pending-support-inquiries";
    const current = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    const next = Array.isArray(current) ? [inquiry, ...current].slice(0, 20) : [inquiry];
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  } catch (error) {
    // localStorage 사용이 막힌 환경에서는 화면 흐름만 유지합니다.
  }

  return inquiry;
}

if (typeof window !== "undefined" && typeof window.fetch === "function" && !window.__finpleBetaNetworkFallbackApplied) {
  window.__finpleBetaNetworkFallbackApplied = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const requestUrl = getRequestUrl(input);

    try {
      return await originalFetch(input, init);
    } catch (error) {
      if (!isNetworkFetchError(error)) {
        throw error;
      }

      if (requestUrl.includes("/api/db/dev-user") || requestUrl.includes("/db/dev-user")) {
        return createJsonResponse({
          ok: true,
          user: createLocalTrialUser(),
          fallback: true,
          message: "서버 연결 전 임시 체험 계정으로 시작합니다.",
        });
      }

      if (requestUrl.includes("/api/inquiries") || requestUrl.includes("/inquiries")) {
        const inquiry = saveLocalPendingInquiry(requestUrl, init);
        return createJsonResponse({
          ok: true,
          inquiry,
          fallback: true,
          message: "서버 연결 실패로 문의를 브라우저에 임시 저장했습니다.",
        });
      }

      throw new Error(NETWORK_FALLBACK_MESSAGE);
    }
  };
}

if (typeof window !== "undefined") {
  import("./PricingButtonScrollPatch.js");
}

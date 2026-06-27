const DEFAULT_API_BASE_URL = "https://finple-api.onrender.com/api";
const DEFAULT_APP_URL = "https://finple.co.kr/";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, "").split("=");
    return [key, valueParts.join("=") || "true"];
  })
);

const apiBaseUrl = String(args.get("api") || process.env.FINPLE_PROD_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
const appUrl = String(args.get("app") || process.env.FINPLE_PROD_APP_URL || DEFAULT_APP_URL);
const expectedCommit = String(args.get("commit") || process.env.FINPLE_EXPECTED_COMMIT || "").trim();

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  return { response, payload };
}

function assertCheck(condition, message, detail = "") {
  if (!condition) {
    throw new Error(detail ? `${message}: ${detail}` : message);
  }
}

function printCheck(label, value) {
  console.log(`[ok] ${label}: ${value}`);
}

const health = await requestJson(`${apiBaseUrl}/health`);
assertCheck(health.response.ok, "health endpoint failed", `${health.response.status}`);
assertCheck(health.payload?.ok === true, "health payload is not ok");
assertCheck(health.payload?.deployment?.branch === "main", "backend branch is not main");

const commitShortSha = health.payload?.deployment?.commitShortSha || "";
if (expectedCommit) {
  assertCheck(
    commitShortSha.startsWith(expectedCommit.slice(0, 7)),
    "backend commit does not match expected commit",
    `${commitShortSha} !== ${expectedCommit}`
  );
}

printCheck("backend commit", commitShortSha || "unknown");

const status = await requestJson(`${apiBaseUrl}/ai/portfolio-analysis/status`);
assertCheck(status.response.ok, "AI status endpoint failed", `${status.response.status}`);
assertCheck(status.payload?.ok === true, "AI status payload is not ok");
assertCheck(status.payload?.mode === "live", "AI mode is not live", status.payload?.mode);
assertCheck(status.payload?.provider === "openai", "AI provider is not openai", status.payload?.provider);
assertCheck(status.payload?.accessMode === "personal", "AI access mode is not personal", status.payload?.accessMode);
assertCheck(
  status.payload?.usagePolicy?.persistence?.available === true,
  "AI usage persistence is not available"
);
assertCheck(status.payload?.usage?.storage === "postgres", "AI usage storage is not postgres", status.payload?.usage?.storage);
assertCheck(Array.isArray(status.payload?.allowedPlans), "allowedPlans is missing");

printCheck("AI status", `${status.payload.mode}/${status.payload.provider}/${status.payload.accessMode}`);
printCheck("AI usage", `${status.payload.usage.used}/${status.payload.usage.limit} used, storage=${status.payload.usage.storage}`);

const admin = await requestJson(`${apiBaseUrl}/admin/ai-analysis-usage`);
assertCheck(
  admin.response.status === 403 || admin.response.ok,
  "admin AI usage endpoint returned unexpected status",
  `${admin.response.status}`
);
printCheck("admin usage endpoint", admin.response.ok ? "authorized response" : "403 without admin token");

const appHead = await fetch(appUrl, { method: "HEAD" });
assertCheck(appHead.ok, "frontend HEAD failed", `${appHead.status}`);
printCheck("frontend HEAD", `${appHead.status} ${appHead.headers.get("last-modified") || ""}`.trim());

console.log("[done] FINPLE portfolio AI analysis production smoke check passed.");

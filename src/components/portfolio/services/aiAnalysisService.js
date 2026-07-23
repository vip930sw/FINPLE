import { getStoredFinpleAuthSession } from "../../authClientService";

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_FINPLE_API_BASE_URL || "http://localhost:5050/api";
const DEFAULT_AI_ANALYSIS_TIMEOUT_MS = 60000;

function getBuildTimeEnv() {
  return import.meta?.env || {};
}

function readNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function getRuntimeAiAnalysisConfig(options = {}) {
  const runtimeConfig =
    typeof window !== "undefined" ? window.FINPLE_AI_ANALYSIS_CONFIG || {} : {};
  const buildEnv = getBuildTimeEnv();

  return {
    apiBaseUrl:
      options.apiBaseUrl ||
      runtimeConfig.apiBaseUrl ||
      buildEnv.VITE_FINPLE_API_BASE_URL ||
      DEFAULT_API_BASE_URL,
    aiAnalysisTimeoutMs: readNumber(
      options.aiAnalysisTimeoutMs ||
        runtimeConfig.aiAnalysisTimeoutMs ||
        buildEnv.VITE_FINPLE_AI_ANALYSIS_TIMEOUT_MS,
      DEFAULT_AI_ANALYSIS_TIMEOUT_MS
    ),
  };
}

function getTimerApi() {
  if (typeof window !== "undefined") {
    return {
      setTimeout: window.setTimeout.bind(window),
      clearTimeout: window.clearTimeout.bind(window),
    };
  }

  return {
    setTimeout,
    clearTimeout,
  };
}

async function fetchWithTimeout(url, { timeoutMs, body, method = "POST" }) {
  const controller = new AbortController();
  const timerApi = getTimerApi();
  const timerId = timerApi.setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    const session = getStoredFinpleAuthSession();
    return await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        "포트폴리오 AI 분석 응답 시간이 예상보다 길어지고 있습니다. 잠시 후 다시 생성해주세요."
      );
    }
    throw error;
  } finally {
    timerApi.clearTimeout(timerId);
  }
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function createErrorMessage(payload, fallback) {
  const details = Array.isArray(payload?.details) ? payload.details.filter(Boolean) : [];
  if (details.length > 0) return `${payload?.message || fallback} ${details.join(" ")}`;
  return payload?.message || fallback;
}

function createPayloadError(payload, fallback) {
  const error = new Error(createErrorMessage(payload, fallback));
  if (payload?.access) error.access = payload.access;
  if (payload?.usage) error.usage = payload.usage;
  return error;
}

export async function requestPortfolioAiAnalysisResult(payload, options = {}) {
  const config = getRuntimeAiAnalysisConfig(options);
  const apiBaseUrl = String(config.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const response = await fetchWithTimeout(`${apiBaseUrl}/ai/portfolio-analysis`, {
    timeoutMs: config.aiAnalysisTimeoutMs,
    body: payload,
  });
  const responsePayload = await readJsonSafely(response);

  if (!response.ok || responsePayload?.ok === false) {
    throw createPayloadError(
      responsePayload,
      "포트폴리오 AI 분석 요청에 실패했습니다. 백엔드 API 설정과 입력값을 확인해주세요."
    );
  }

  if (!responsePayload?.analysis) {
    throw new Error("포트폴리오 AI 분석 응답 형식이 올바르지 않습니다.");
  }

  return {
    analysis: responsePayload.analysis,
    usage: responsePayload.usage || null,
  };
}

export async function requestPortfolioAiAnalysisStatus(options = {}) {
  const config = getRuntimeAiAnalysisConfig(options);
  const apiBaseUrl = String(config.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const response = await fetchWithTimeout(`${apiBaseUrl}/ai/portfolio-analysis/status`, {
    timeoutMs: config.aiAnalysisTimeoutMs,
    method: "GET",
  });
  const responsePayload = await readJsonSafely(response);

  if (!response.ok || responsePayload?.ok === false) {
    throw createPayloadError(responsePayload, "포트폴리오 AI 분석 상태를 확인하지 못했습니다.");
  }

  return responsePayload;
}

export async function requestPortfolioAiAnalysis(payload, options = {}) {
  const result = await requestPortfolioAiAnalysisResult(payload, options);
  return result.analysis;
}

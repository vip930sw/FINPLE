import { createHash } from "node:crypto";

import { createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";
import { buildMockPortfolioAnalysis } from "./aiPortfolioAnalysisMock.js";
import { requestOpenAiPortfolioAnalysis } from "./aiPortfolioAnalysisOpenAi.js";
import { validateAiPortfolioAnalysisOutput } from "./aiOutputValidator.js";

const DEFAULT_MODE = "mock";
const DEFAULT_PROVIDER = "none";
const LIVE_ANALYSIS_VERSION = "ai-analysis-openai-v1";
const DEFAULT_VALIDATION_RETRY_COUNT = 1;

export function getAiAnalysisMode() {
  return String(process.env.FINPLE_AI_ANALYSIS_MODE || DEFAULT_MODE).trim().toLowerCase();
}

export function getAiAnalysisProvider() {
  return String(process.env.FINPLE_AI_ANALYSIS_PROVIDER || DEFAULT_PROVIDER).trim().toLowerCase();
}

function hashPayload(payload) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function toNonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function getLiveValidationRetryCount() {
  return Math.min(
    toNonNegativeInteger(
      process.env.FINPLE_AI_ANALYSIS_VALIDATION_RETRY_COUNT,
      DEFAULT_VALIDATION_RETRY_COUNT
    ),
    2
  );
}

function buildLiveOutput({ payload, mode, provider, inputHash, providerOutput }) {
  return {
    analysisVersion: LIVE_ANALYSIS_VERSION,
    portfolioId: payload.portfolioId,
    generatedAt: new Date().toISOString(),
    mode,
    provider,
    inputHash,
    ...providerOutput,
  };
}

export async function runPortfolioAnalysis(payload) {
  const mode = getAiAnalysisMode();
  const provider = getAiAnalysisProvider();
  const inputHash = hashPayload(payload);

  if (mode === "live" && provider === "openai") {
    let lastValidationError = null;
    const attempts = getLiveValidationRetryCount() + 1;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const providerOutput = await requestOpenAiPortfolioAnalysis(payload);
      const output = buildLiveOutput({ payload, mode, provider, inputHash, providerOutput });

      try {
        return validateAiPortfolioAnalysisOutput(output, payload);
      } catch (error) {
        lastValidationError = error;
        if (Number(error?.statusCode || 0) !== 422 || attempt >= attempts) throw error;
      }
    }

    throw lastValidationError;
  }

  if (mode !== "mock" || provider !== "none") {
    throw createHttpError(
      502,
      "AI 분석 provider 설정을 확인해주세요.",
      [`mode=${mode}`, `provider=${provider}`]
    );
  }

  const output = {
    ...buildMockPortfolioAnalysis(payload),
    inputHash,
  };

  return validateAiPortfolioAnalysisOutput(output, payload);
}

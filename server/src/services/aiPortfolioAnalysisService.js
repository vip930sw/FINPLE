import { createHash } from "node:crypto";

import { createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";
import { buildMockPortfolioAnalysis } from "./aiPortfolioAnalysisMock.js";
import { requestOpenAiPortfolioAnalysis } from "./aiPortfolioAnalysisOpenAi.js";
import { validateAiPortfolioAnalysisOutput } from "./aiOutputValidator.js";

const DEFAULT_MODE = "mock";
const DEFAULT_PROVIDER = "none";
const LIVE_ANALYSIS_VERSION = "ai-analysis-openai-v1";

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

export async function runPortfolioAnalysis(payload) {
  const mode = getAiAnalysisMode();
  const provider = getAiAnalysisProvider();
  const inputHash = hashPayload(payload);

  if (mode === "live" && provider === "openai") {
    const providerOutput = await requestOpenAiPortfolioAnalysis(payload);
    const output = {
      analysisVersion: LIVE_ANALYSIS_VERSION,
      portfolioId: payload.portfolioId,
      generatedAt: new Date().toISOString(),
      mode,
      provider,
      inputHash,
      ...providerOutput,
    };

    return validateAiPortfolioAnalysisOutput(output, payload);
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

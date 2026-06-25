import { createHash } from "node:crypto";

import { createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";
import { buildMockPortfolioAnalysis } from "./aiPortfolioAnalysisMock.js";
import { validateAiPortfolioAnalysisOutput } from "./aiOutputValidator.js";

const DEFAULT_MODE = "mock";
const DEFAULT_PROVIDER = "none";

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

  if (mode !== "mock" || provider !== "none") {
    throw createHttpError(
      502,
      "AI 분석 live provider는 아직 연결되지 않았습니다.",
      [`mode=${mode}`, `provider=${provider}`]
    );
  }

  const output = {
    ...buildMockPortfolioAnalysis(payload),
    inputHash: hashPayload(payload),
  };

  return validateAiPortfolioAnalysisOutput(output, payload);
}

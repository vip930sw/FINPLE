import express from "express";

import { normalizePortfolioAnalysisRequest } from "../schemas/aiPortfolioAnalysisSchema.js";
import { runPortfolioAnalysis } from "../services/aiPortfolioAnalysisService.js";

const router = express.Router();

router.post("/portfolio-analysis", async (request, response, next) => {
  try {
    const payload = normalizePortfolioAnalysisRequest(request.body);
    const analysis = await runPortfolioAnalysis(payload);

    response.json({
      ok: true,
      source: `ai-analysis-${analysis.mode}`,
      analysis,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

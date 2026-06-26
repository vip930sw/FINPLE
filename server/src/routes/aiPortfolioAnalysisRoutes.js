import express from "express";

import { getUserBySessionToken } from "../db/authRepository.js";
import { normalizePortfolioAnalysisRequest } from "../schemas/aiPortfolioAnalysisSchema.js";
import { assertAiAnalysisUsageAllowed } from "../services/aiAnalysisUsageControl.js";
import { runPortfolioAnalysis } from "../services/aiPortfolioAnalysisService.js";

const router = express.Router();
const DEFAULT_ALLOWED_PLANS = ["personal", "pro"];

function getSessionToken(request) {
  const header = request.get("authorization") || "";
  const bearerMatch = header.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1] || request.get("x-finple-session-token") || request.body?.sessionToken || "";
}

async function getOptionalUser(request) {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) return null;
  return getUserBySessionToken(sessionToken);
}

function getAccessMode() {
  return String(process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE || "public").trim().toLowerCase();
}

function getAllowedPlans() {
  return String(process.env.FINPLE_AI_ANALYSIS_ALLOWED_PLANS || DEFAULT_ALLOWED_PLANS.join(","))
    .split(",")
    .map((plan) => plan.trim().toLowerCase())
    .filter(Boolean);
}

function assertAccessAllowed(user) {
  const accessMode = getAccessMode();
  if (accessMode !== "personal") return;

  const plan = String(user?.plan || "free").trim().toLowerCase();
  if (!user?.id || !getAllowedPlans().includes(plan)) {
    const error = new Error("AI analysis is available for Personal plan users.");
    error.statusCode = 403;
    error.details = [`requiredPlans=${getAllowedPlans().join(",")}`];
    throw error;
  }
}

function setUsageHeaders(response, usage) {
  if (!usage?.limited) return;
  response.setHeader("X-Finple-AI-Limit", String(usage.limit));
  response.setHeader("X-Finple-AI-Remaining", String(usage.remaining));
  response.setHeader("X-Finple-AI-Reset-At", new Date(usage.resetAt).toISOString());
}

router.post("/portfolio-analysis", async (request, response, next) => {
  try {
    const user = await getOptionalUser(request);
    assertAccessAllowed(user);
    const payload = normalizePortfolioAnalysisRequest(request.body);
    const usage = assertAiAnalysisUsageAllowed({ request, user });
    const analysis = await runPortfolioAnalysis(payload);

    setUsageHeaders(response, usage);
    response.json({
      ok: true,
      source: `ai-analysis-${analysis.mode}`,
      usage: usage?.limited
        ? {
            limit: usage.limit,
            remaining: usage.remaining,
            resetAt: new Date(usage.resetAt).toISOString(),
          }
        : null,
      analysis,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

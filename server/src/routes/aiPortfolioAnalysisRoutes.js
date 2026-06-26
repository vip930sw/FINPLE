import express from "express";

import { getUserBySessionToken } from "../db/authRepository.js";
import { normalizePortfolioAnalysisRequest } from "../schemas/aiPortfolioAnalysisSchema.js";
import { getAiAnalysisUsagePolicy, reserveAiAnalysisUsage } from "../services/aiAnalysisUsageControl.js";
import { enrichUserWithAiAnalysisEntitlement } from "../services/aiAnalysisEntitlementService.js";
import {
  getAiAnalysisUsageSnapshot,
  getAiAnalysisUsagePersistenceStatus,
  reservePersistentAiAnalysisUsage,
} from "../services/aiAnalysisUsageRepository.js";
import {
  getAiAnalysisMode,
  getAiAnalysisProvider,
  runPortfolioAnalysis,
} from "../services/aiPortfolioAnalysisService.js";

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
  const user = await getUserBySessionToken(sessionToken);
  return enrichUserWithAiAnalysisEntitlement(user);
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
  if (usage.storage) response.setHeader("X-Finple-AI-Usage-Storage", usage.storage);
}

async function reserveUsage({ request, user, payload }) {
  try {
    const persistentUsage = await reservePersistentAiAnalysisUsage({
      request,
      user,
      payload,
      mode: getAiAnalysisMode(),
      provider: getAiAnalysisProvider(),
    });
    if (persistentUsage) return persistentUsage;
  } catch (error) {
    if (error.statusCode === 429) throw error;
  }

  const memoryUsage = reserveAiAnalysisUsage({ request, user });
  memoryUsage.storage = "memory";
  return memoryUsage;
}

router.get("/portfolio-analysis/status", async (request, response, next) => {
  try {
    const user = await getOptionalUser(request);
    const persistence = await getAiAnalysisUsagePersistenceStatus();
    const usage = persistence.available
      ? await getAiAnalysisUsageSnapshot({ request, user })
      : null;
    response.json({
      ok: true,
      mode: getAiAnalysisMode(),
      provider: getAiAnalysisProvider(),
      accessMode: getAccessMode(),
      allowedPlans: getAllowedPlans(),
      user: user
        ? {
            id: user.id,
            plan: user.plan || "free",
            planSource: user.aiPlanSource || "user",
          }
        : null,
      usagePolicy: {
        ...getAiAnalysisUsagePolicy(user),
        persistence,
      },
      usage,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/portfolio-analysis", async (request, response, next) => {
  let usage = null;

  try {
    const user = await getOptionalUser(request);
    assertAccessAllowed(user);
    const payload = normalizePortfolioAnalysisRequest(request.body);
    usage = await reserveUsage({ request, user, payload });
    const analysis = await runPortfolioAnalysis(payload);
    await usage.commit();

    setUsageHeaders(response, usage);
    response.json({
      ok: true,
      source: `ai-analysis-${analysis.mode}`,
      usage: usage?.limited
        ? {
            limit: usage.limit,
            remaining: usage.remaining,
            resetAt: new Date(usage.resetAt).toISOString(),
            storage: usage.storage || "memory",
          }
        : null,
      analysis,
    });
  } catch (error) {
    await usage?.cancel?.(error);
    next(error);
  }
});

export default router;

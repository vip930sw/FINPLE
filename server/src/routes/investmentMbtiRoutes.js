import { randomUUID } from "node:crypto";

import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query } from "../db/database.js";

const router = express.Router();

function getSessionToken(request) {
  const authHeader = request.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1] || request.get("x-finple-session-token") || request.body?.sessionToken || "";
}

async function getRequestUser(request) {
  const sessionToken = getSessionToken(request);
  const headerUserId = request.get("x-finple-user-id") || request.query?.userId || "";
  if (sessionToken) return getUserBySessionToken(sessionToken);
  return getUserByAuthHeader(headerUserId);
}

async function ensureInvestmentMbtiProfileSchema() {
  await query(`CREATE TABLE IF NOT EXISTS user_investment_mbti_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type_id TEXT NOT NULL,
    result_name TEXT,
    nickname TEXT,
    finple_type TEXT,
    risk_profile TEXT,
    risk_score NUMERIC,
    axes JSONB NOT NULL DEFAULT '{}'::jsonb,
    axis_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    preset_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    market_mode TEXT,
    source TEXT NOT NULL DEFAULT 'investment-mbti',
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_investment_mbti_profiles_user_unique UNIQUE (user_id)
  )`);

  await query(`CREATE INDEX IF NOT EXISTS idx_user_investment_mbti_profiles_user_updated
    ON user_investment_mbti_profiles(user_id, updated_at DESC)`);
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeMbtiProfile(input = {}) {
  const profile = safeObject(input.profile || input);
  const typeId = String(profile.typeId || profile.type_id || "").trim();

  if (!typeId) {
    const error = new Error("투자 MBTI typeId가 필요합니다.");
    error.statusCode = 400;
    error.code = "MBTI_TYPE_ID_REQUIRED";
    throw error;
  }

  const preset = safeObject(profile.preset || profile.portfolioPreset || profile.preset_weights);
  const normalized = {
    typeId,
    nickname: String(profile.nickname || profile.resultName || profile.result_name || "투자 MBTI").trim(),
    resultName: String(profile.resultName || profile.result_name || profile.nickname || "투자 MBTI").trim(),
    finpleType: String(profile.finpleType || profile.finple_type || "").trim(),
    riskProfile: String(profile.riskProfile || profile.risk_profile || "").trim(),
    riskScore: Number.isFinite(Number(profile.riskScore ?? profile.risk_score)) ? Number(profile.riskScore ?? profile.risk_score) : null,
    axes: safeObject(profile.axes),
    axisScores: safeObject(profile.axisScores || profile.axis_scores),
    preset,
    portfolioPreset: preset,
    marketMode: String(profile.marketMode || profile.market_mode || "US").trim() || "US",
    source: String(profile.source || "investment-mbti").trim() || "investment-mbti",
    summary: profile.summary || "",
    strengths: profile.strengths || "",
    cautions: profile.cautions || "",
    sectors: Array.isArray(profile.sectors) ? profile.sectors.filter(Boolean) : [],
    actions: Array.isArray(profile.actions) ? profile.actions.filter(Boolean) : [],
    details: profile.details || null,
    simulatorDefaults: profile.simulatorDefaults || profile.simulator_defaults || null,
    createdAt: profile.createdAt || profile.created_at || new Date().toISOString(),
  };

  return normalized;
}

function serializeProfile(row) {
  if (!row) return null;
  const storedProfile = safeObject(row.profile);
  return {
    ...storedProfile,
    typeId: row.type_id,
    nickname: row.nickname || row.result_name || storedProfile.nickname || "투자 MBTI",
    resultName: row.result_name || row.nickname || storedProfile.resultName || storedProfile.result_name || "투자 MBTI",
    finpleType: row.finple_type || storedProfile.finpleType || "",
    riskProfile: row.risk_profile || storedProfile.riskProfile || "",
    riskScore: row.risk_score ?? storedProfile.riskScore ?? null,
    axes: row.axes || storedProfile.axes || {},
    axisScores: row.axis_scores || storedProfile.axisScores || {},
    preset: row.preset_weights || storedProfile.preset || storedProfile.portfolioPreset || {},
    portfolioPreset: row.preset_weights || storedProfile.portfolioPreset || storedProfile.preset || {},
    marketMode: row.market_mode || storedProfile.marketMode || "US",
    source: row.source || storedProfile.source || "investment-mbti",
    createdAt: row.created_at || storedProfile.createdAt || null,
    updatedAt: row.updated_at || storedProfile.updatedAt || null,
  };
}

router.get("/", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "투자 MBTI 결과 확인을 위해 로그인이 필요합니다.",
      });
      return;
    }

    if (!isDatabaseConfigured()) {
      response.json({ ok: true, profile: null, reason: "database_not_configured" });
      return;
    }

    await ensureInvestmentMbtiProfileSchema();

    const result = await query(
      `SELECT id, user_id, type_id, result_name, nickname, finple_type, risk_profile,
              risk_score, axes, axis_scores, preset_weights, market_mode, source,
              profile, created_at, updated_at
         FROM user_investment_mbti_profiles
        WHERE user_id = $1
        LIMIT 1`,
      [user.id]
    );

    response.json({
      ok: true,
      profile: serializeProfile(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

router.put("/", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "투자 MBTI 결과 저장을 위해 로그인이 필요합니다.",
      });
      return;
    }

    if (!isDatabaseConfigured()) {
      response.json({ ok: true, stored: false, profile: normalizeMbtiProfile(request.body), reason: "database_not_configured" });
      return;
    }

    await ensureInvestmentMbtiProfileSchema();

    const profile = normalizeMbtiProfile(request.body);
    const now = new Date().toISOString();
    const profileJson = {
      ...profile,
      updatedAt: now,
    };

    const result = await query(
      `INSERT INTO user_investment_mbti_profiles (
         id, user_id, type_id, result_name, nickname, finple_type, risk_profile,
         risk_score, axes, axis_scores, preset_weights, market_mode, source, profile
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14::jsonb)
       ON CONFLICT (user_id)
       DO UPDATE SET
         type_id = EXCLUDED.type_id,
         result_name = EXCLUDED.result_name,
         nickname = EXCLUDED.nickname,
         finple_type = EXCLUDED.finple_type,
         risk_profile = EXCLUDED.risk_profile,
         risk_score = EXCLUDED.risk_score,
         axes = EXCLUDED.axes,
         axis_scores = EXCLUDED.axis_scores,
         preset_weights = EXCLUDED.preset_weights,
         market_mode = EXCLUDED.market_mode,
         source = EXCLUDED.source,
         profile = EXCLUDED.profile,
         updated_at = NOW()
       RETURNING id, user_id, type_id, result_name, nickname, finple_type, risk_profile,
                 risk_score, axes, axis_scores, preset_weights, market_mode, source,
                 profile, created_at, updated_at`,
      [
        randomUUID(),
        user.id,
        profile.typeId,
        profile.resultName,
        profile.nickname,
        profile.finpleType,
        profile.riskProfile,
        profile.riskScore,
        JSON.stringify(profile.axes),
        JSON.stringify(profile.axisScores),
        JSON.stringify(profile.preset),
        profile.marketMode,
        profile.source,
        JSON.stringify(profileJson),
      ]
    );

    response.json({
      ok: true,
      stored: true,
      profile: serializeProfile(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

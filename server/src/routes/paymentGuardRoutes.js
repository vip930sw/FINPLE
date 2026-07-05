import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query } from "../db/database.js";

const router = express.Router();

function getRequestedPaymentMode() {
  const mode = String(process.env.FINPLE_PAYMENT_MODE || "stub").trim().toLowerCase();
  return ["stub", "test", "live"].includes(mode) ? mode : "stub";
}

function getPaymentMode() {
  const requestedMode = getRequestedPaymentMode();
  const hasSecretKey = Boolean(process.env.TOSS_SECRET_KEY);

  if (!hasSecretKey) return "stub";
  return requestedMode === "live" ? "live-ready" : "test-ready";
}

function getSessionToken(request) {
  const authHeader = request.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);

  return (
    bearerMatch?.[1] ||
    request.get("x-finple-session-token") ||
    request.body?.sessionToken ||
    ""
  );
}

async function getRequestUser(request) {
  const sessionToken = getSessionToken(request);
  const headerUserId = request.get("x-finple-user-id") || request.body?.userId || "";

  if (sessionToken) {
    return getUserBySessionToken(sessionToken);
  }

  return getUserByAuthHeader(headerUserId);
}

function normalizePlan(plan = "personal") {
  return String(plan || "personal").trim().toLowerCase();
}

function normalizeAmount(amount) {
  if (amount === undefined || amount === null || amount === "") return null;
  const parsed = Number(String(amount).replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : NaN;
}

async function getPlanConfig(plan) {
  const fallback = {
    plan: "personal",
    label: "Personal",
    priceKrw: 9900,
    billingCycle: "monthly",
  };

  if (!isDatabaseConfigured()) return fallback;

  try {
    const result = await query(
      `SELECT plan, label, price_krw, billing_cycle
       FROM plan_entitlements
       WHERE plan = $1
       LIMIT 1`,
      [plan]
    );

    const row = result.rows[0];
    if (!row) return fallback;

    return {
      plan: row.plan,
      label: row.label,
      priceKrw: Number(row.price_krw || 0),
      billingCycle: row.billing_cycle || "monthly",
    };
  } catch (error) {
    return fallback;
  }
}

async function getActivePersonalSubscription(userId) {
  if (!isDatabaseConfigured() || !userId) return null;

  try {
    const result = await query(
      `SELECT
         s.id,
         s.plan,
         s.status,
         s.provider,
         s.provider_subscription_id,
         s.billing_cycle,
         s.current_period_start,
         s.current_period_end,
         s.cancel_at_period_end,
         ue.plan AS entitlement_plan,
         ue.valid_until AS entitlement_valid_until
       FROM subscriptions s
       LEFT JOIN user_entitlements ue ON ue.user_id = s.user_id
       WHERE s.user_id = $1
         AND s.plan = 'personal'
         AND s.status IN ('active', 'trialing', 'cancel_at_period_end')
         AND COALESCE(s.current_period_end, NOW() + INTERVAL '100 years') > NOW()
       ORDER BY s.current_period_end DESC NULLS LAST, s.current_period_start DESC NULLS LAST
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

router.post("/toss/prepare", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);
    const plan = normalizePlan(request.body?.plan || "personal");

    if (!user || plan !== "personal") {
      next();
      return;
    }

    const planConfig = await getPlanConfig(plan);
    const amount = normalizeAmount(request.body?.amount) || Number(planConfig.priceKrw || 9900);
    const activeSubscription = await getActivePersonalSubscription(user.id);

    if (!activeSubscription) {
      next();
      return;
    }

    response.json({
      ok: true,
      mode: getPaymentMode(),
      requestedMode: getRequestedPaymentMode(),
      provider: "toss-payments",
      checkoutAvailable: false,
      alreadySubscribed: true,
      code: "ALREADY_PERSONAL_ACTIVE",
      tossConfigured: Boolean(process.env.TOSS_SECRET_KEY),
      webhookConfigured: Boolean(process.env.TOSS_WEBHOOK_SECRET),
      orderId: activeSubscription.provider_subscription_id || activeSubscription.id,
      orderName: "FINPLE Personal",
      plan: planConfig.plan,
      amount,
      billingCycle: planConfig.billingCycle,
      effectivePlan: "personal",
      effectiveStatus: activeSubscription.status || "active",
      accessUntil: activeSubscription.current_period_end || activeSubscription.entitlement_valid_until || null,
      currentPeriodEnd: activeSubscription.current_period_end || null,
      serverNow: new Date().toISOString(),
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      currentSubscription: activeSubscription,
      message: "이미 Personal을 이용 중입니다. 현재 이용기간 종료일까지 추가 결제 없이 Personal 기능을 사용할 수 있습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import { randomUUID } from "node:crypto";

import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query } from "../db/database.js";

const router = express.Router();

const PLAN_FALLBACKS = {
  free: {
    plan: "free",
    label: "Free",
    priceKrw: 0,
    billingCycle: "none",
    isPaymentEnabled: false,
  },
  personal: {
    plan: "personal",
    label: "Personal",
    priceKrw: 9900,
    billingCycle: "monthly",
    isPaymentEnabled: false,
  },
  pro: {
    plan: "pro",
    label: "Pro",
    priceKrw: null,
    billingCycle: "monthly",
    isPaymentEnabled: false,
  },
};

function getSiteUrl() {
  return String(process.env.FINPLE_SITE_URL || "https://finple.co.kr").replace(/\/+$/, "");
}

function normalizePath(path, fallback) {
  const value = String(path || fallback || "").trim();
  if (!value) return fallback;
  return value.startsWith("/") ? value : `/${value}`;
}

function getPaymentSuccessPath() {
  return normalizePath(process.env.FINPLE_PAYMENT_SUCCESS_PATH, "/billing/success");
}

function getPaymentFailPath() {
  return normalizePath(process.env.FINPLE_PAYMENT_FAIL_PATH, "/billing/fail");
}

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

function getPaymentReadiness() {
  const requestedMode = getRequestedPaymentMode();
  const hasSecretKey = Boolean(process.env.TOSS_SECRET_KEY);
  const hasWebhookSecret = Boolean(process.env.TOSS_WEBHOOK_SECRET);
  const isLiveMode = requestedMode === "live";

  return {
    requestedMode,
    mode: getPaymentMode(),
    provider: "toss-payments",
    tossConfigured: hasSecretKey,
    webhookConfigured: hasWebhookSecret,
    checkoutServerReady: hasSecretKey,
    liveModeRequested: isLiveMode,
    secretKeyLocation: "Render environment only",
    clientKeyLocation: "Vercel environment only",
    siteUrl: getSiteUrl(),
    successPath: getPaymentSuccessPath(),
    failPath: getPaymentFailPath(),
    warnings: [
      ...(hasSecretKey ? [] : ["TOSS_SECRET_KEY is not configured. Checkout remains disabled."]),
      ...(hasWebhookSecret ? [] : ["TOSS_WEBHOOK_SECRET is not configured. Webhook signature verification is pending."]),
      ...(isLiveMode ? ["Live mode is requested. Confirm that live keys are intentional before enabling checkout."] : []),
    ],
  };
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

function assertPersonalPlan(plan) {
  const normalized = normalizePlan(plan);
  if (normalized !== "personal") {
    const error = new Error("현재 결제 준비 대상은 Personal 플랜입니다.");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function normalizeAmount(amount) {
  if (amount === undefined || amount === null || amount === "") return null;
  const parsed = Number(String(amount).replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : NaN;
}

function mapPlanRow(row) {
  if (!row) return null;

  return {
    plan: row.plan,
    label: row.label,
    priceKrw: row.price_krw === null ? null : Number(row.price_krw),
    billingCycle: row.billing_cycle || "none",
    isPaymentEnabled: Boolean(row.is_payment_enabled),
  };
}

async function getPlanConfig(plan) {
  const fallback = PLAN_FALLBACKS[plan] || PLAN_FALLBACKS.personal;

  if (!isDatabaseConfigured()) return fallback;

  try {
    const result = await query(
      `SELECT plan, label, price_krw, billing_cycle, is_payment_enabled
       FROM plan_entitlements
       WHERE plan = $1
       LIMIT 1`,
      [plan]
    );

    return mapPlanRow(result.rows[0]) || fallback;
  } catch (error) {
    return fallback;
  }
}

function assertAmountMatchesPlan(inputAmount, planConfig) {
  const normalizedAmount = normalizeAmount(inputAmount);
  const expectedAmount = Number(planConfig.priceKrw || 0);

  if (Number.isNaN(normalizedAmount)) {
    const error = new Error("결제 금액 형식이 올바르지 않습니다.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedAmount !== null && normalizedAmount !== expectedAmount) {
    const error = new Error("결제 금액이 서버의 요금제 금액과 일치하지 않습니다.");
    error.statusCode = 400;
    throw error;
  }

  return expectedAmount;
}

function createOrderId(userId, plan) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 16);
  const userPart = String(userId || "guest").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "guest";
  return `finple_${plan}_${userPart}_${suffix}`;
}

function getSuccessUrl(orderId, amount) {
  const queryParams = new URLSearchParams({ orderId, amount: String(amount) });
  return `${getSiteUrl()}${getPaymentSuccessPath()}?${queryParams.toString()}`;
}

function getFailUrl(orderId) {
  const queryParams = new URLSearchParams({ orderId });
  return `${getSiteUrl()}${getPaymentFailPath()}?${queryParams.toString()}`;
}

router.get("/health", (request, response) => {
  response.json({
    ok: true,
    ...getPaymentReadiness(),
    checkedAt: new Date().toISOString(),
  });
});

router.get("/subscription/me", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.json({
        ok: true,
        authenticated: false,
        plan: "free",
        status: "guest",
        message: "로그인 후 구독 상태를 확인할 수 있습니다.",
      });
      return;
    }

    let entitlement = null;
    let subscription = null;

    if (isDatabaseConfigured()) {
      try {
        const entitlementResult = await query(
          `SELECT plan, valid_from, valid_until, updated_at
           FROM user_entitlements
           WHERE user_id = $1
           LIMIT 1`,
          [user.id]
        );
        entitlement = entitlementResult.rows[0] || null;

        const subscriptionResult = await query(
          `SELECT plan, status, current_period_start, current_period_end,
                  cancel_at_period_end, ended_at, provider
           FROM subscriptions
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [user.id]
        );
        subscription = subscriptionResult.rows[0] || null;
      } catch (error) {
        entitlement = null;
        subscription = null;
      }
    }

    response.json({
      ok: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      plan: entitlement?.plan || user.plan || "free",
      status: subscription?.status || "beta_free",
      subscription,
      entitlement,
      message: "현재는 베타 운영 단계입니다. 실제 결제 구독 상태는 Toss 연동 후 반영됩니다.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/toss/prepare", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "결제 준비를 위해 로그인이 필요합니다.",
      });
      return;
    }

    const plan = assertPersonalPlan(request.body?.plan || "personal");
    const planConfig = await getPlanConfig(plan);
    const amount = assertAmountMatchesPlan(request.body?.amount, planConfig);
    const orderId = createOrderId(user.id, plan);
    const readiness = getPaymentReadiness();
    const isTestMode = readiness.requestedMode === "test";
    const checkoutAvailable = Boolean(readiness.checkoutServerReady && (isTestMode || planConfig.isPaymentEnabled));

    response.json({
      ok: true,
      mode: readiness.mode,
      requestedMode: readiness.requestedMode,
      provider: readiness.provider,
      checkoutAvailable,
      tossConfigured: readiness.tossConfigured,
      webhookConfigured: readiness.webhookConfigured,
      orderId,
      orderName: "FINPLE Personal",
      plan: planConfig.plan,
      amount,
      billingCycle: planConfig.billingCycle,
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      successUrl: getSuccessUrl(orderId, amount),
      failUrl: getFailUrl(orderId),
      readinessWarnings: readiness.warnings,
      message: checkoutAvailable
        ? "Toss 테스트 결제 준비 정보가 생성되었습니다."
        : "현재는 결제 준비 단계입니다. Toss 키와 결제 활성화 후 실제 결제를 진행할 수 있습니다.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/toss/confirm", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "결제 승인을 위해 로그인이 필요합니다.",
      });
      return;
    }

    const plan = assertPersonalPlan(request.body?.plan || "personal");
    const planConfig = await getPlanConfig(plan);
    const amount = assertAmountMatchesPlan(request.body?.amount, planConfig);
    const paymentKey = String(request.body?.paymentKey || "").trim();
    const orderId = String(request.body?.orderId || "").trim();

    if (!paymentKey || !orderId) {
      response.status(400).json({
        ok: false,
        code: "MISSING_PAYMENT_CONFIRM_FIELDS",
        message: "paymentKey와 orderId가 필요합니다.",
      });
      return;
    }

    if (!process.env.TOSS_SECRET_KEY) {
      response.status(503).json({
        ok: false,
        code: "TOSS_NOT_CONFIGURED",
        message: "Toss Secret Key가 아직 설정되지 않았습니다. 현재는 결제 준비 단계입니다.",
      });
      return;
    }

    response.status(501).json({
      ok: false,
      code: "TOSS_CONFIRM_NOT_IMPLEMENTED",
      provider: "toss-payments",
      plan,
      amount,
      orderId,
      mode: getPaymentMode(),
      message: "Toss 승인 API 호출은 테스트 키 등록 후 다음 단계에서 연결합니다.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/toss/webhook", async (request, response, next) => {
  try {
    const payload = request.body || {};
    const eventId =
      String(payload.eventId || payload.event_id || payload.id || request.get("x-toss-event-id") || "").trim() ||
      randomUUID();
    const eventType = String(payload.eventType || payload.event_type || payload.type || "unknown").trim();

    let stored = false;
    let storageMessage = "Webhook endpoint가 이벤트를 수신했습니다. 서명 검증과 DB 반영은 다음 단계에서 연결합니다.";

    if (isDatabaseConfigured()) {
      try {
        await query(
          `INSERT INTO payment_events (id, provider, event_id, event_type, payload, processing_status)
           VALUES ($1, 'toss-payments', $2, $3, $4::jsonb, 'received')
           ON CONFLICT (provider, event_id) DO NOTHING`,
          [randomUUID(), eventId, eventType, JSON.stringify(payload)]
        );
        stored = true;
        storageMessage = "Webhook 이벤트를 payment_events에 수신 기록으로 저장했습니다.";
      } catch (error) {
        stored = false;
        storageMessage = "Webhook 이벤트를 수신했지만 DB 저장은 보류되었습니다.";
      }
    }

    response.json({
      ok: true,
      provider: "toss-payments",
      mode: "webhook-stub",
      eventId,
      eventType,
      stored,
      webhookConfigured: Boolean(process.env.TOSS_WEBHOOK_SECRET),
      message: storageMessage,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

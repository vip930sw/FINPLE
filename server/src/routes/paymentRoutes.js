import { randomUUID } from "node:crypto";

import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query, withTransaction } from "../db/database.js";

const router = express.Router();

const TOSS_CONFIRM_ENDPOINT = "https://api.tosspayments.com/v1/payments/confirm";

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

function getSuccessUrl() {
  return `${getSiteUrl()}${getPaymentSuccessPath()}`;
}

function getFailUrl() {
  return `${getSiteUrl()}${getPaymentFailPath()}`;
}

function getTossSecretKey() {
  return String(process.env.TOSS_SECRET_KEY || "").trim();
}

function getTossAuthorizationHeader() {
  const secretKey = getTossSecretKey();
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function readExternalJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function requestTossConfirm({ paymentKey, orderId, amount }) {
  const response = await fetch(TOSS_CONFIRM_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: getTossAuthorizationHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": orderId,
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const payload = await readExternalJson(response);

  if (!response.ok) {
    const error = new Error(payload?.message || "Toss 결제 승인 요청에 실패했습니다.");
    error.statusCode = response.status;
    error.code = payload?.code || "TOSS_CONFIRM_FAILED";
    error.tossPayload = payload;
    throw error;
  }

  return payload;
}

function assertTossPaymentMatches(payment, { orderId, amount }) {
  if (!payment || typeof payment !== "object") {
    const error = new Error("Toss 승인 응답이 올바르지 않습니다.");
    error.statusCode = 502;
    error.code = "INVALID_TOSS_CONFIRM_RESPONSE";
    throw error;
  }

  if (String(payment.orderId || "") !== String(orderId)) {
    const error = new Error("Toss 승인 응답의 주문번호가 요청값과 일치하지 않습니다.");
    error.statusCode = 502;
    error.code = "TOSS_ORDER_ID_MISMATCH";
    throw error;
  }

  if (Number(payment.totalAmount || 0) !== Number(amount)) {
    const error = new Error("Toss 승인 응답의 결제금액이 요청값과 일치하지 않습니다.");
    error.statusCode = 502;
    error.code = "TOSS_AMOUNT_MISMATCH";
    throw error;
  }
}

function getPeriodEndIso() {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return periodEnd.toISOString();
}

async function recordPaymentConfirmation({ user, plan, amount, orderId, payment }) {
  if (!isDatabaseConfigured()) {
    return { stored: false, reason: "database_not_configured" };
  }

  try {
    await query(
      `INSERT INTO payment_events (id, provider, event_id, event_type, user_id, payload, processing_status, processed_at)
       VALUES ($1, 'toss-payments', $2, 'payment.confirmed', $3, $4::jsonb, 'confirmed', NOW())
       ON CONFLICT (provider, event_id) DO UPDATE SET
         payload = EXCLUDED.payload,
         processing_status = 'confirmed',
         processed_at = NOW()`,
      [
        randomUUID(),
        payment.paymentKey || orderId,
        user.id,
        JSON.stringify({ plan, amount, orderId, payment }),
      ]
    );

    return { stored: true };
  } catch (error) {
    return { stored: false, reason: "payment_event_store_failed", message: error.message };
  }
}

async function findExistingConfirmedPayment({ user, paymentKey, orderId, amount }) {
  if (!isDatabaseConfigured()) return null;

  try {
    const result = await query(
      `SELECT
         p.id AS payment_id,
         p.user_id,
         p.plan,
         p.amount,
         p.status,
         p.provider_payment_id,
         p.provider_order_id,
         p.receipt_url,
         p.subscription_id,
         p.metadata,
         p.requested_at,
         p.created_at,
         s.status AS subscription_status,
         s.current_period_end,
         ue.plan AS entitlement_plan,
         ue.valid_until
       FROM payments p
       LEFT JOIN subscriptions s ON s.id = p.subscription_id
       LEFT JOIN user_entitlements ue ON ue.user_id = p.user_id
       WHERE p.provider = 'toss-payments'
         AND p.provider_payment_id = $1
         AND p.provider_order_id = $2
         AND p.user_id = $3
         AND p.amount = $4
         AND p.status = 'confirmed'
       LIMIT 1`,
      [paymentKey, orderId, user.id, amount]
    );

    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

function buildExistingConfirmedPaymentResponse({ existingPayment, plan, amount, orderId, paymentKey }) {
  const entitlementPlan = existingPayment?.entitlement_plan || existingPayment?.plan || plan;
  const entitlementApplied = String(entitlementPlan || "").toLowerCase() === plan;

  return {
    ok: true,
    provider: "toss-payments",
    mode: getPaymentMode(),
    duplicate: true,
    alreadyConfirmed: true,
    plan: entitlementPlan,
    amount: Number(existingPayment?.amount || amount),
    orderId,
    paymentKey,
    paymentStatus: "DONE",
    approvedAt: existingPayment?.requested_at || existingPayment?.created_at || null,
    method: existingPayment?.metadata?.method || null,
    totalAmount: Number(existingPayment?.amount || amount),
    receiptUrl: existingPayment?.receipt_url || null,
    stored: true,
    storage: { stored: true, duplicate: true, reason: "existing_confirmed_payment" },
    entitlementUpdated: entitlementApplied,
    entitlementUpdate: {
      applied: entitlementApplied,
      duplicate: true,
      plan: entitlementPlan,
      subscriptionId: existingPayment?.subscription_id || null,
      paymentId: existingPayment?.payment_id || null,
      validUntil: existingPayment?.valid_until || existingPayment?.current_period_end || null,
    },
    payment: {
      paymentKey,
      orderId,
      status: "DONE",
      totalAmount: Number(existingPayment?.amount || amount),
      receipt: existingPayment?.receipt_url ? { url: existingPayment.receipt_url } : undefined,
    },
    message: entitlementApplied
      ? "이미 승인 처리된 결제입니다. Personal 권한 상태를 다시 확인했습니다."
      : "이미 승인 처리된 결제입니다. 권한 상태 확인이 필요합니다.",
  };
}

async function applyPersonalEntitlementAfterPayment({ user, plan, amount, orderId, payment }) {
  if (!isDatabaseConfigured()) {
    return { applied: false, reason: "database_not_configured" };
  }

  try {
    return await withTransaction(async (tx) => {
      const periodEndIso = getPeriodEndIso();
      const subscriptionId = randomUUID();
      const paymentId = randomUUID();
      const providerPaymentId = payment.paymentKey || orderId;
      const receiptUrl = payment.receipt?.url || payment.checkout?.url || null;
      const metadata = JSON.stringify({ orderId, paymentKey: payment.paymentKey, method: payment.method, status: payment.status });

      await tx(
        `INSERT INTO subscriptions (
           id, user_id, plan, status, provider, provider_subscription_id,
           billing_cycle, current_period_start, current_period_end,
           cancel_at_period_end, metadata
         )
         VALUES ($1, $2, $3, 'active', 'toss-payments', $4,
           'monthly', NOW(), $5, FALSE, $6::jsonb)
         ON CONFLICT (provider, provider_subscription_id) WHERE provider_subscription_id IS NOT NULL
         DO UPDATE SET
           status = 'active',
           plan = EXCLUDED.plan,
           current_period_start = EXCLUDED.current_period_start,
           current_period_end = EXCLUDED.current_period_end,
           cancel_at_period_end = FALSE,
           metadata = EXCLUDED.metadata
         RETURNING id`,
        [subscriptionId, user.id, plan, orderId, periodEndIso, metadata]
      );

      const subscriptionResult = await tx(
        `SELECT id
         FROM subscriptions
         WHERE provider = 'toss-payments' AND provider_subscription_id = $1
         LIMIT 1`,
        [orderId]
      );
      const activeSubscriptionId = subscriptionResult.rows[0]?.id || subscriptionId;

      const paymentResult = await tx(
        `INSERT INTO payments (
           id, user_id, provider, amount, currency, status,
           subscription_id, plan, provider_payment_id, provider_order_id,
           receipt_url, requested_at, metadata
         )
         VALUES ($1, $2, 'toss-payments', $3, 'KRW', 'confirmed',
           $4, $5, $6, $7, $8, NOW(), $9::jsonb)
         ON CONFLICT (provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL
         DO UPDATE SET
           status = 'confirmed',
           subscription_id = EXCLUDED.subscription_id,
           provider_order_id = EXCLUDED.provider_order_id,
           receipt_url = EXCLUDED.receipt_url,
           metadata = EXCLUDED.metadata
         RETURNING id`,
        [paymentId, user.id, amount, activeSubscriptionId, plan, providerPaymentId, orderId, receiptUrl, JSON.stringify(payment)]
      );
      const activePaymentId = paymentResult.rows[0]?.id || paymentId;

      await tx(
        `INSERT INTO user_entitlements (
           user_id, plan, portfolio_limit, assets_per_portfolio_limit,
           server_storage_enabled, api_lookup_limit_per_day, pdf_report_enabled,
           report_level, screener_level, support_level, source, valid_from, valid_until
         )
         SELECT $1, ent.plan, ent.portfolio_limit, ent.assets_per_portfolio_limit,
           ent.server_storage_enabled, ent.api_lookup_limit_per_day, ent.pdf_report_enabled,
           ent.report_level, ent.screener_level, ent.support_level, 'payment', NOW(), $3
         FROM plan_entitlements ent
         WHERE ent.plan = $2
         ON CONFLICT (user_id) DO UPDATE SET
           plan = EXCLUDED.plan,
           portfolio_limit = EXCLUDED.portfolio_limit,
           assets_per_portfolio_limit = EXCLUDED.assets_per_portfolio_limit,
           server_storage_enabled = EXCLUDED.server_storage_enabled,
           api_lookup_limit_per_day = EXCLUDED.api_lookup_limit_per_day,
           pdf_report_enabled = EXCLUDED.pdf_report_enabled,
           report_level = EXCLUDED.report_level,
           screener_level = EXCLUDED.screener_level,
           support_level = EXCLUDED.support_level,
           source = EXCLUDED.source,
           valid_from = EXCLUDED.valid_from,
           valid_until = EXCLUDED.valid_until,
           updated_at = NOW()`,
        [user.id, plan, periodEndIso]
      );

      await tx("UPDATE users SET plan = $2, updated_at = NOW() WHERE id = $1", [user.id, plan]);

      await tx(
        `UPDATE payment_events
         SET payment_id = $1,
             subscription_id = $2,
             user_id = $3,
             processing_status = 'confirmed',
             processed_at = NOW()
         WHERE provider = 'toss-payments' AND event_id = $4`,
        [activePaymentId, activeSubscriptionId, user.id, providerPaymentId]
      );

      return {
        applied: true,
        plan,
        subscriptionId: activeSubscriptionId,
        paymentId: activePaymentId,
        validUntil: periodEndIso,
      };
    });
  } catch (error) {
    return {
      applied: false,
      reason: "entitlement_update_failed",
      message: error.message,
    };
  }
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
      successUrl: getSuccessUrl(),
      failUrl: getFailUrl(),
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

    const existingPayment = await findExistingConfirmedPayment({ user, paymentKey, orderId, amount });
    if (existingPayment) {
      response.json(buildExistingConfirmedPaymentResponse({ existingPayment, plan, amount, orderId, paymentKey }));
      return;
    }

    if (!getTossSecretKey()) {
      response.status(503).json({
        ok: false,
        code: "TOSS_NOT_CONFIGURED",
        message: "Toss Secret Key가 아직 설정되지 않았습니다. 현재는 결제 준비 단계입니다.",
      });
      return;
    }

    const payment = await requestTossConfirm({ paymentKey, orderId, amount });
    assertTossPaymentMatches(payment, { orderId, amount });
    const storage = await recordPaymentConfirmation({ user, plan, amount, orderId, payment });
    const entitlementUpdate = await applyPersonalEntitlementAfterPayment({ user, plan, amount, orderId, payment });

    response.json({
      ok: true,
      provider: "toss-payments",
      mode: getPaymentMode(),
      duplicate: false,
      alreadyConfirmed: false,
      plan,
      amount,
      orderId,
      paymentKey: payment.paymentKey,
      paymentStatus: payment.status,
      approvedAt: payment.approvedAt,
      method: payment.method,
      totalAmount: payment.totalAmount,
      receiptUrl: payment.receipt?.url || payment.checkout?.url || null,
      stored: storage.stored,
      storage,
      entitlementUpdated: entitlementUpdate.applied,
      entitlementUpdate,
      payment,
      message: entitlementUpdate.applied
        ? "Toss 결제 승인이 확인되어 Personal 권한으로 전환되었습니다."
        : "Toss 결제 승인은 확인되었지만 Personal 권한 전환은 확인이 필요합니다.",
    });
  } catch (error) {
    if (error?.tossPayload) {
      response.status(error.statusCode || 400).json({
        ok: false,
        code: error.code || "TOSS_CONFIRM_FAILED",
        message: error.message || "Toss 결제 승인 요청에 실패했습니다.",
        provider: "toss-payments",
        toss: error.tossPayload,
      });
      return;
    }

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

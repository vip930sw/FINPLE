import { randomUUID } from "node:crypto";

import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query } from "../db/database.js";

const router = express.Router();

function getSiteUrl() {
  return String(process.env.FINPLE_SITE_URL || "https://finple.co.kr").replace(/\/+$/, "");
}

function normalizePath(path, fallback) {
  const value = String(path || fallback || "").trim();
  if (!value) return fallback;
  return value.startsWith("/") ? value : `/${value}`;
}

function getBillingAuthSuccessPath() {
  return normalizePath(process.env.FINPLE_BILLING_AUTH_SUCCESS_PATH, "/payment-method/success");
}

function getBillingAuthFailPath() {
  return normalizePath(process.env.FINPLE_BILLING_AUTH_FAIL_PATH, "/payment-method/fail");
}

function getRequestedPaymentMode() {
  const mode = String(process.env.FINPLE_PAYMENT_MODE || "stub").trim().toLowerCase();
  return ["stub", "test", "live"].includes(mode) ? mode : "stub";
}

function getSessionToken(request) {
  const authHeader = request.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1] || request.get("x-finple-session-token") || request.body?.sessionToken || "";
}

async function getRequestUser(request) {
  const sessionToken = getSessionToken(request);
  const headerUserId = request.get("x-finple-user-id") || request.body?.userId || "";
  if (sessionToken) return getUserBySessionToken(sessionToken);
  return getUserByAuthHeader(headerUserId);
}

function createBillingAuthOrderId(userId) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 16);
  const userPart = String(userId || "guest").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "guest";
  return `finple_billing_${userPart}_${suffix}`;
}

function createCustomerKey(userId) {
  const safeUserId = String(userId || "guest").replace(/[^a-zA-Z0-9_-]/g, "").replace(/-/g, "");
  return `finple_${safeUserId}`.slice(0, 50);
}

async function recordBillingAuthPrepare({ user, orderId, customerKey, payload }) {
  if (!isDatabaseConfigured()) return { stored: false, reason: "database_not_configured" };

  try {
    await query(
      `INSERT INTO payment_events (id, provider, event_id, event_type, user_id, payload, processing_status, processed_at)
       VALUES ($1, 'toss-payments', $2, 'billing.auth.prepared', $3, $4::jsonb, 'prepared', NOW())
       ON CONFLICT (provider, event_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         payload = EXCLUDED.payload,
         processing_status = 'prepared',
         processed_at = NOW()`,
      [
        randomUUID(),
        orderId,
        user.id,
        JSON.stringify({ customerKey, orderId, ...payload }),
      ]
    );

    return { stored: true };
  } catch (error) {
    return { stored: false, reason: "billing_auth_prepare_store_failed", message: error.message };
  }
}

router.post("/toss/billing/prepare", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "자동결제 결제수단 등록을 위해 로그인이 필요합니다.",
      });
      return;
    }

    const orderId = createBillingAuthOrderId(user.id);
    const customerKey = createCustomerKey(user.id);
    const requestedMode = getRequestedPaymentMode();
    const clientKeyConfigured = Boolean(process.env.TOSS_CLIENT_KEY || process.env.TOSS_BILLING_CLIENT_KEY);
    const secretKeyConfigured = Boolean(process.env.TOSS_SECRET_KEY);
    const successUrl = `${getSiteUrl()}${getBillingAuthSuccessPath()}?orderId=${encodeURIComponent(orderId)}`;
    const failUrl = `${getSiteUrl()}${getBillingAuthFailPath()}?orderId=${encodeURIComponent(orderId)}`;
    const payload = {
      plan: "personal",
      amount: 9900,
      billingCycle: "monthly",
      orderName: "FINPLE Personal 자동결제 등록",
      successUrl,
      failUrl,
      requestedMode,
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
    const storage = await recordBillingAuthPrepare({ user, orderId, customerKey, payload });

    response.json({
      ok: true,
      provider: "toss-payments",
      mode: requestedMode === "live" ? "billing-live-prepare" : "billing-test-prepare",
      billingAuthAvailable: true,
      billingKeyIssueReady: secretKeyConfigured,
      clientKeyConfigured,
      clientKeyLocation: "Vercel environment or optional Render environment",
      secretKeyLocation: "Render environment only",
      orderId,
      customerKey,
      orderName: payload.orderName,
      plan: payload.plan,
      amount: payload.amount,
      billingCycle: payload.billingCycle,
      successUrl,
      failUrl,
      customer: payload.customer,
      storage,
      warnings: [
        ...(clientKeyConfigured ? [] : ["TOSS_CLIENT_KEY is not configured on Render. The browser can still use VITE_TOSS_CLIENT_KEY if configured on Vercel."]),
        ...(secretKeyConfigured ? [] : ["TOSS_SECRET_KEY is not configured. BillingKey issuing after auth will remain disabled."]),
        ...(requestedMode === "live" ? ["Live mode is requested. Confirm live billing contract and keys before enabling real users."] : []),
      ],
      message: "자동결제 결제수단 등록 준비 정보가 생성되었습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

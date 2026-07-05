import { createCipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query, withTransaction } from "../db/database.js";
import { buildPaymentMethodSummary } from "../services/paymentMethodDisplay.js";

const router = express.Router();
const TOSS_BILLING_KEY_ISSUE_ENDPOINT = "https://api.tosspayments.com/v1/billing/authorizations/issue";

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

function getTossSecretKey() {
  return String(process.env.TOSS_SECRET_KEY || "").trim();
}

function getTossAuthorizationHeader() {
  const secretKey = getTossSecretKey();
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function getBillingKeyEncryptionSecret() {
  return String(process.env.FINPLE_BILLING_KEY_ENCRYPTION_SECRET || process.env.TOSS_SECRET_KEY || "").trim();
}

function encryptBillingKey(billingKey) {
  const value = String(billingKey || "").trim();
  const secret = getBillingKeyEncryptionSecret();
  if (!value || !secret) return null;

  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `aes-256-gcm:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

async function readExternalJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function requestTossBillingKeyIssue({ authKey, customerKey, orderId }) {
  const secretKey = getTossSecretKey();
  if (!secretKey) {
    const error = new Error("TOSS_SECRET_KEY가 설정되어 있지 않아 billingKey 발급을 진행할 수 없습니다.");
    error.statusCode = 503;
    error.code = "TOSS_SECRET_KEY_MISSING";
    throw error;
  }

  const response = await fetch(TOSS_BILLING_KEY_ISSUE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: getTossAuthorizationHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": orderId || authKey,
    },
    body: JSON.stringify({ authKey, customerKey }),
  });

  const payload = await readExternalJson(response);

  if (!response.ok) {
    const error = new Error(payload?.message || "Toss billingKey 발급 요청에 실패했습니다.");
    error.statusCode = response.status;
    error.code = payload?.code || "TOSS_BILLING_KEY_ISSUE_FAILED";
    error.tossPayload = payload;
    throw error;
  }

  return payload;
}

function assertBillingKeyIssueResponse(payload, expectedCustomerKey) {
  if (!payload || typeof payload !== "object") {
    const error = new Error("Toss billingKey 발급 응답이 올바르지 않습니다.");
    error.statusCode = 502;
    error.code = "INVALID_TOSS_BILLING_KEY_RESPONSE";
    throw error;
  }

  if (!payload.billingKey) {
    const error = new Error("Toss 응답에 billingKey가 없습니다.");
    error.statusCode = 502;
    error.code = "TOSS_BILLING_KEY_MISSING";
    throw error;
  }

  if (String(payload.customerKey || "") !== String(expectedCustomerKey || "")) {
    const error = new Error("Toss 응답의 customerKey가 요청값과 일치하지 않습니다.");
    error.statusCode = 502;
    error.code = "TOSS_CUSTOMER_KEY_MISMATCH";
    throw error;
  }
}

function getCardSummary(payload) {
  const card = payload?.card || {};
  const maskedNumber = String(card.number || card.cardNumber || "").trim();
  const digits = maskedNumber.replace(/\D/g, "");
  const last4 = digits.length >= 4 ? digits.slice(-4) : "";
  const company = String(card.company || card.issuerCode || payload?.method || "카드").trim();
  const label = last4 ? `${company} **** ${last4}` : company;
  return {
    method: payload?.method || "카드",
    cardCompany: company,
    cardLast4: last4 || null,
    maskedCardNumber: maskedNumber || null,
    displayLabel: label,
  };
}

function getBillingCardSummary(...sources) {
  const primary = sources[0] || {};
  return buildPaymentMethodSummary(...sources) || {
    method: primary?.method || "card",
    cardCompany: "card",
    cardLast4: null,
    maskedCardNumber: null,
    displayLabel: "card registered",
  };
}

function sanitizeBillingKeyIssuePayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  const { billingKey, ...safePayload } = payload;
  return {
    ...safePayload,
    billingKeyStored: Boolean(billingKey),
  };
}

async function ensureRecurringPaymentMethodSchema(tx = query) {
  await tx(`CREATE TABLE IF NOT EXISTS recurring_payment_methods (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'toss-payments',
    customer_key TEXT NOT NULL,
    billing_key_encrypted TEXT,
    method_type TEXT NOT NULL DEFAULT 'card',
    display_label TEXT,
    card_company TEXT,
    card_last4 TEXT,
    masked_card_number TEXT,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'active',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    disabled_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT recurring_payment_methods_provider_customer_key_unique UNIQUE (provider, customer_key)
  )`);

  await tx(`CREATE INDEX IF NOT EXISTS idx_recurring_payment_methods_user_default
    ON recurring_payment_methods(user_id, is_default, status)`);
}

async function resolvePreparedBillingAuth({ user, orderId, customerKey }) {
  if (!isDatabaseConfigured() || !orderId) {
    return { prepared: null, customerKey: customerKey || "" };
  }

  const result = await query(
    `SELECT id, event_id, user_id, payload
     FROM payment_events
     WHERE provider = 'toss-payments'
       AND event_id = $1
       AND event_type = 'billing.auth.prepared'
       AND user_id = $2
     ORDER BY processed_at DESC NULLS LAST
     LIMIT 1`,
    [orderId, user.id]
  );

  const prepared = result.rows[0] || null;
  const preparedCustomerKey = prepared?.payload?.customerKey || "";

  if (customerKey && preparedCustomerKey && customerKey !== preparedCustomerKey) {
    const error = new Error("자동결제 등록 정보의 customerKey가 준비 정보와 일치하지 않습니다.");
    error.statusCode = 400;
    error.code = "BILLING_CUSTOMER_KEY_MISMATCH";
    throw error;
  }

  return {
    prepared,
    customerKey: customerKey || preparedCustomerKey || "",
  };
}

async function storeBillingKeyIssue({ user, orderId, authKey, customerKey, issuePayload }) {
  if (!isDatabaseConfigured()) return { stored: false, reason: "database_not_configured" };

  const encryptedBillingKey = encryptBillingKey(issuePayload.billingKey);
  if (!encryptedBillingKey) {
    return {
      stored: false,
      reason: "billing_key_encryption_unavailable",
      message: "FINPLE_BILLING_KEY_ENCRYPTION_SECRET 또는 TOSS_SECRET_KEY가 필요합니다.",
    };
  }

  const cardSummary = getBillingCardSummary(issuePayload);
  const safeIssuePayload = sanitizeBillingKeyIssuePayload(issuePayload);

  try {
    return await withTransaction(async (tx) => {
      await ensureRecurringPaymentMethodSchema(tx);

      await tx(
        `UPDATE recurring_payment_methods
         SET is_default = FALSE,
             updated_at = NOW()
         WHERE provider = 'toss-payments' AND user_id = $1`,
        [user.id]
      );

      const methodResult = await tx(
        `INSERT INTO recurring_payment_methods (
           id, user_id, provider, customer_key, billing_key_encrypted,
           method_type, display_label, card_company, card_last4, masked_card_number,
           is_default, status, issued_at, metadata
         )
         VALUES ($1, $2, 'toss-payments', $3, $4,
           'card', $5, $6, $7, $8,
           TRUE, 'active', NOW(), $9::jsonb)
         ON CONFLICT (provider, customer_key)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           billing_key_encrypted = EXCLUDED.billing_key_encrypted,
           display_label = EXCLUDED.display_label,
           card_company = EXCLUDED.card_company,
           card_last4 = EXCLUDED.card_last4,
           masked_card_number = EXCLUDED.masked_card_number,
           is_default = TRUE,
           status = 'active',
           disabled_at = NULL,
           metadata = EXCLUDED.metadata,
           updated_at = NOW()
         RETURNING id, display_label, card_company, card_last4, status, issued_at`,
        [
          randomUUID(),
          user.id,
          customerKey,
          encryptedBillingKey,
          cardSummary.displayLabel,
          cardSummary.cardCompany,
          cardSummary.cardLast4,
          cardSummary.maskedCardNumber,
          JSON.stringify({
            orderId,
            authKeyReceived: Boolean(authKey),
            providerResponse: safeIssuePayload,
          }),
        ]
      );

      const method = methodResult.rows[0] || null;

      await tx(
        `INSERT INTO payment_events (id, provider, event_id, event_type, user_id, payload, processing_status, processed_at)
         VALUES ($1, 'toss-payments', $2, 'billing.key.issued', $3, $4::jsonb, 'confirmed', NOW())
         ON CONFLICT (provider, event_id)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           payload = EXCLUDED.payload,
           processing_status = 'confirmed',
           processed_at = NOW()`,
        [
          randomUUID(),
          issuePayload.billingKey || `${orderId}:billing-key-issued`,
          user.id,
          JSON.stringify({
            orderId,
            customerKey,
            recurringPaymentMethodId: method?.id || null,
            providerResponse: safeIssuePayload,
          }),
        ]
      );

      if (orderId) {
        await tx(
          `UPDATE payment_events
           SET processing_status = 'processed',
               processed_at = NOW(),
               payload = COALESCE(payload, '{}'::jsonb) || $3::jsonb
           WHERE provider = 'toss-payments'
             AND event_id = $1
             AND user_id = $2`,
          [
            orderId,
            user.id,
            JSON.stringify({ billingKeyIssued: true, recurringPaymentMethodId: method?.id || null }),
          ]
        );
      }

      return {
        stored: true,
        recurringPaymentMethodId: method?.id || null,
        displayLabel: method?.display_label || cardSummary.displayLabel,
        cardCompany: method?.card_company || cardSummary.cardCompany,
        cardLast4: method?.card_last4 || cardSummary.cardLast4,
        status: method?.status || "active",
        issuedAt: method?.issued_at || null,
      };
    });
  } catch (error) {
    return { stored: false, reason: "billing_key_store_failed", message: error.message };
  }
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

router.post("/toss/billing/issue", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "자동결제 결제수단 저장을 위해 로그인이 필요합니다.",
      });
      return;
    }

    const authKey = String(request.body?.authKey || "").trim();
    const orderId = String(request.body?.orderId || "").trim();
    const inputCustomerKey = String(request.body?.customerKey || "").trim();

    if (!authKey) {
      response.status(400).json({
        ok: false,
        code: "AUTH_KEY_REQUIRED",
        message: "Toss 결제수단 인증값이 없습니다.",
      });
      return;
    }

    const prepared = await resolvePreparedBillingAuth({ user, orderId, customerKey: inputCustomerKey });
    const customerKey = prepared.customerKey;

    if (!customerKey) {
      response.status(400).json({
        ok: false,
        code: "CUSTOMER_KEY_REQUIRED",
        message: "자동결제 등록 고객 식별값을 확인하지 못했습니다.",
      });
      return;
    }

    const issuePayload = await requestTossBillingKeyIssue({ authKey, customerKey, orderId });
    assertBillingKeyIssueResponse(issuePayload, customerKey);

    const storage = await storeBillingKeyIssue({ user, orderId, authKey, customerKey, issuePayload });

    response.json({
      ok: Boolean(storage.stored),
      provider: "toss-payments",
      mode: getRequestedPaymentMode() === "live" ? "billing-live-issued" : "billing-test-issued",
      plan: "personal",
      customerKey,
      orderId,
      stored: Boolean(storage.stored),
      storage,
      method: storage.stored
        ? {
            displayLabel: storage.displayLabel,
            cardCompany: storage.cardCompany,
            cardLast4: storage.cardLast4,
          }
        : getBillingCardSummary(issuePayload),
      message: storage.stored
        ? "자동결제 결제수단이 등록되었습니다."
        : "billingKey 발급은 완료되었지만 서버 저장에 실패했습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

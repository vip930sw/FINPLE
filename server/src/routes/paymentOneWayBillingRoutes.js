import { createCipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query, withTransaction } from "../db/database.js";
import { sendSubscriptionAdminNotification } from "../services/inquiryNotificationService.js";
import { buildPaymentMethodSummary } from "../services/paymentMethodDisplay.js";
import { sendSubscriptionNotification } from "../services/userNotificationService.js";

const router = express.Router();

const TOSS_BILLING_KEY_ISSUE_ENDPOINT = "https://api.tosspayments.com/v1/billing/authorizations/issue";
const TOSS_BILLING_APPROVE_ENDPOINT_BASE = "https://api.tosspayments.com/v1/billing";
const PERSONAL_PLAN = "personal";
const PERSONAL_PRICE_KRW = 9900;
const PERSONAL_ORDER_NAME = "FINPLE Personal 월 구독";

function getRequestedPaymentMode() {
  const mode = String(process.env.FINPLE_PAYMENT_MODE || "stub").trim().toLowerCase();
  return ["stub", "test", "live"].includes(mode) ? mode : "stub";
}

function getTossSecretKey() {
  return String(process.env.TOSS_SECRET_KEY || "").trim();
}

function getTossAuthorizationHeader() {
  return `Basic ${Buffer.from(`${getTossSecretKey()}:`).toString("base64")}`;
}

function getBillingKeyEncryptionSecret() {
  return String(process.env.FINPLE_BILLING_KEY_ENCRYPTION_SECRET || process.env.TOSS_SECRET_KEY || "").trim();
}

function isFirstChargeEnabled() {
  const value = String(process.env.FINPLE_FIRST_BILLING_CHARGE_ENABLED || "true").trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(value);
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

async function resolvePreparedBillingAuth({ user, orderId, customerKey }) {
  if (!isDatabaseConfigured() || !orderId) return { prepared: null, customerKey: customerKey || "", payload: {} };

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
    payload: prepared?.payload || {},
  };
}

async function requestTossBillingKeyIssue({ authKey, customerKey, orderId }) {
  if (!getTossSecretKey()) {
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
  if (!payload?.billingKey) {
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

function createFirstPaymentOrderId(authOrderId) {
  const base = String(authOrderId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8);
  return `${base || "finple_personal"}_1st_${suffix}`.slice(0, 64);
}

async function requestTossBillingPayment({ billingKey, customerKey, orderId, amount, user }) {
  if (!isFirstChargeEnabled()) {
    return { skipped: true, reason: "first_charge_disabled" };
  }

  const response = await fetch(`${TOSS_BILLING_APPROVE_ENDPOINT_BASE}/${encodeURIComponent(billingKey)}`, {
    method: "POST",
    headers: {
      Authorization: getTossAuthorizationHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": orderId,
    },
    body: JSON.stringify({
      amount,
      customerKey,
      orderId,
      orderName: PERSONAL_ORDER_NAME,
      customerEmail: user?.email || undefined,
      customerName: user?.name || undefined,
      taxFreeAmount: 0,
    }),
  });

  const payload = await readExternalJson(response);
  if (!response.ok) {
    const error = new Error(payload?.message || "첫 달 자동결제 승인에 실패했습니다.");
    error.statusCode = response.status;
    error.code = payload?.code || "TOSS_BILLING_PAYMENT_FAILED";
    error.tossPayload = payload;
    throw error;
  }

  return payload;
}

function assertTossBillingPaymentMatches(payment, { orderId, amount }) {
  if (payment?.skipped) return;

  if (!payment || typeof payment !== "object") {
    const error = new Error("Toss 자동결제 승인 응답이 올바르지 않습니다.");
    error.statusCode = 502;
    error.code = "INVALID_TOSS_BILLING_PAYMENT_RESPONSE";
    throw error;
  }

  if (String(payment.orderId || "") !== String(orderId)) {
    const error = new Error("Toss 자동결제 응답의 주문번호가 요청값과 일치하지 않습니다.");
    error.statusCode = 502;
    error.code = "TOSS_BILLING_ORDER_ID_MISMATCH";
    throw error;
  }

  if (Number(payment.totalAmount || 0) !== Number(amount)) {
    const error = new Error("Toss 자동결제 응답의 결제금액이 요청값과 일치하지 않습니다.");
    error.statusCode = 502;
    error.code = "TOSS_BILLING_AMOUNT_MISMATCH";
    throw error;
  }
}

function sanitizeBillingKeyIssuePayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  const { billingKey, ...safePayload } = payload;
  return { ...safePayload, billingKeyStored: Boolean(billingKey) };
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

function getPeriodEndIso() {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return periodEnd.toISOString();
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

async function storeMethodAndActivateSubscription({ user, authOrderId, firstPaymentOrderId, customerKey, issuePayload, paymentPayload, amount }) {
  if (!isDatabaseConfigured()) return { stored: false, reason: "database_not_configured" };

  const encryptedBillingKey = encryptBillingKey(issuePayload.billingKey);
  if (!encryptedBillingKey) {
    return {
      stored: false,
      reason: "billing_key_encryption_unavailable",
      message: "FINPLE_BILLING_KEY_ENCRYPTION_SECRET 또는 TOSS_SECRET_KEY가 필요합니다.",
    };
  }

  const periodEndIso = getPeriodEndIso();
  const cardSummary = getBillingCardSummary(paymentPayload, issuePayload);
  const safeIssuePayload = sanitizeBillingKeyIssuePayload(issuePayload);
  const paymentKey = paymentPayload?.paymentKey || firstPaymentOrderId;
  const receiptUrl = paymentPayload?.receipt?.url || paymentPayload?.checkout?.url || null;

  try {
    return await withTransaction(async (tx) => {
      await ensureRecurringPaymentMethodSchema(tx);

      await tx(
        `UPDATE recurring_payment_methods
         SET is_default = FALSE, updated_at = NOW()
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
            authOrderId,
            firstPaymentOrderId,
            providerResponse: safeIssuePayload,
          }),
        ]
      );
      const method = methodResult.rows[0] || null;

      const subscriptionId = randomUUID();
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
           metadata = COALESCE(subscriptions.metadata, '{}'::jsonb) || EXCLUDED.metadata
         RETURNING id`,
        [
          subscriptionId,
          user.id,
          PERSONAL_PLAN,
          firstPaymentOrderId,
          periodEndIso,
          JSON.stringify({
            authOrderId,
            customerKey,
            recurringPaymentMethodId: method?.id || null,
            firstPaymentOrderId,
            billingCycle: "monthly",
          }),
        ]
      );

      const subscriptionResult = await tx(
        `SELECT id FROM subscriptions
         WHERE provider = 'toss-payments' AND provider_subscription_id = $1
         LIMIT 1`,
        [firstPaymentOrderId]
      );
      const activeSubscriptionId = subscriptionResult.rows[0]?.id || subscriptionId;

      const paymentId = randomUUID();
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
        [
          paymentId,
          user.id,
          amount,
          activeSubscriptionId,
          PERSONAL_PLAN,
          paymentKey,
          firstPaymentOrderId,
          receiptUrl,
          JSON.stringify({
            ...paymentPayload,
            authOrderId,
            firstPaymentOrderId,
            recurringPaymentMethodId: method?.id || null,
          }),
        ]
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
        [user.id, PERSONAL_PLAN, periodEndIso]
      );

      await tx("UPDATE users SET plan = $2, updated_at = NOW() WHERE id = $1", [user.id, PERSONAL_PLAN]);

      await tx(
        `INSERT INTO payment_events (id, provider, event_id, event_type, user_id, payload, payment_id, subscription_id, processing_status, processed_at)
         VALUES ($1, 'toss-payments', $2, 'billing.key.issued', $3, $4::jsonb, NULL, NULL, 'confirmed', NOW())
         ON CONFLICT (provider, event_id)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           payload = EXCLUDED.payload,
           processing_status = 'confirmed',
           processed_at = NOW()`,
        [
          randomUUID(),
          issuePayload.billingKey || `${authOrderId}:billing-key-issued`,
          user.id,
          JSON.stringify({
            authOrderId,
            firstPaymentOrderId,
            customerKey,
            recurringPaymentMethodId: method?.id || null,
            providerResponse: safeIssuePayload,
          }),
        ]
      );

      await tx(
        `INSERT INTO payment_events (id, provider, event_id, event_type, user_id, payload, payment_id, subscription_id, processing_status, processed_at)
         VALUES ($1, 'toss-payments', $2, 'billing.first_payment.confirmed', $3, $4::jsonb, $5, $6, 'confirmed', NOW())
         ON CONFLICT (provider, event_id)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           payload = EXCLUDED.payload,
           payment_id = EXCLUDED.payment_id,
           subscription_id = EXCLUDED.subscription_id,
           processing_status = 'confirmed',
           processed_at = NOW()`,
        [
          randomUUID(),
          paymentKey,
          user.id,
          JSON.stringify({
            authOrderId,
            firstPaymentOrderId,
            customerKey,
            amount,
            providerResponse: paymentPayload,
          }),
          activePaymentId,
          activeSubscriptionId,
        ]
      );

      if (authOrderId) {
        await tx(
          `UPDATE payment_events
           SET processing_status = 'processed',
               processed_at = NOW(),
               payment_id = $3,
               subscription_id = $4,
               payload = COALESCE(payload, '{}'::jsonb) || $5::jsonb
           WHERE provider = 'toss-payments'
             AND event_id = $1
             AND user_id = $2`,
          [
            authOrderId,
            user.id,
            activePaymentId,
            activeSubscriptionId,
            JSON.stringify({
              billingKeyIssued: true,
              firstPaymentConfirmed: true,
              recurringPaymentMethodId: method?.id || null,
              firstPaymentOrderId,
            }),
          ]
        );
      }

      return {
        stored: true,
        subscriptionActivated: true,
        recurringPaymentMethodId: method?.id || null,
        subscriptionId: activeSubscriptionId,
        paymentId: activePaymentId,
        validUntil: periodEndIso,
        displayLabel: method?.display_label || cardSummary.displayLabel,
        cardCompany: method?.card_company || cardSummary.cardCompany,
        cardLast4: method?.card_last4 || cardSummary.cardLast4,
        status: method?.status || "active",
        issuedAt: method?.issued_at || null,
      };
    });
  } catch (error) {
    return { stored: false, reason: "one_way_billing_store_failed", message: error.message };
  }
}

router.post("/toss/billing/issue", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      response.status(401).json({ ok: false, code: "AUTH_REQUIRED", message: "Personal 구독 시작을 위해 로그인이 필요합니다." });
      return;
    }

    const authKey = String(request.body?.authKey || "").trim();
    const authOrderId = String(request.body?.orderId || "").trim();
    const inputCustomerKey = String(request.body?.customerKey || "").trim();

    if (!authKey) {
      response.status(400).json({ ok: false, code: "AUTH_KEY_REQUIRED", message: "Toss 결제수단 인증값이 없습니다." });
      return;
    }

    const prepared = await resolvePreparedBillingAuth({ user, orderId: authOrderId, customerKey: inputCustomerKey });
    const customerKey = prepared.customerKey;
    if (!customerKey) {
      response.status(400).json({ ok: false, code: "CUSTOMER_KEY_REQUIRED", message: "자동결제 등록 고객 식별값을 확인하지 못했습니다." });
      return;
    }

    const amount = Number(prepared.payload?.amount || PERSONAL_PRICE_KRW);
    const issuePayload = await requestTossBillingKeyIssue({ authKey, customerKey, orderId: authOrderId });
    assertBillingKeyIssueResponse(issuePayload, customerKey);

    const firstPaymentOrderId = createFirstPaymentOrderId(authOrderId);
    const firstPayment = await requestTossBillingPayment({
      billingKey: issuePayload.billingKey,
      customerKey,
      orderId: firstPaymentOrderId,
      amount,
      user,
    });
    assertTossBillingPaymentMatches(firstPayment, { orderId: firstPaymentOrderId, amount });

    const storage = await storeMethodAndActivateSubscription({
      user,
      authOrderId,
      firstPaymentOrderId,
      customerKey,
      issuePayload,
      paymentPayload: firstPayment,
      amount,
    });
    const notification = storage.stored && storage.subscriptionActivated ? await sendSubscriptionNotification({
      to: user.email,
      type: "activated",
      plan: PERSONAL_PLAN,
      amount,
      currentPeriodEnd: storage.validUntil,
      receiptUrl: firstPayment?.receipt?.url || null,
    }).catch((error) => ({
      enabled: true,
      sent: false,
      error: error?.message || "subscription_activation_notification_failed",
    })) : { enabled: false, sent: false, reason: "subscription_not_activated" };
    const adminNotification = storage.stored && storage.subscriptionActivated ? await sendSubscriptionAdminNotification({
      user,
      plan: PERSONAL_PLAN,
      amount,
      currentPeriodEnd: storage.validUntil,
      receiptUrl: firstPayment?.receipt?.url || null,
      orderId: firstPaymentOrderId,
    }).catch((error) => ({
      enabled: true,
      sent: false,
      error: error?.message || "subscription_admin_notification_failed",
    })) : { enabled: false, sent: false, reason: "subscription_not_activated" };

    response.status(storage.stored ? 200 : 500).json({
      ok: Boolean(storage.stored),
      provider: "toss-payments",
      mode: getRequestedPaymentMode() === "live" ? "billing-live-one-way" : "billing-test-one-way",
      plan: PERSONAL_PLAN,
      amount,
      customerKey,
      orderId: authOrderId,
      firstPaymentOrderId,
      stored: Boolean(storage.stored),
      subscriptionActivated: Boolean(storage.subscriptionActivated),
      storage,
      notification,
      adminNotification,
      method: storage.stored
        ? {
            displayLabel: storage.displayLabel,
            cardCompany: storage.cardCompany,
            cardLast4: storage.cardLast4,
          }
        : getBillingCardSummary(firstPayment, issuePayload),
      firstPayment: firstPayment?.skipped ? { skipped: true, reason: firstPayment.reason } : {
        paymentKey: firstPayment?.paymentKey || null,
        orderId: firstPayment?.orderId || firstPaymentOrderId,
        status: firstPayment?.status || null,
        totalAmount: firstPayment?.totalAmount || amount,
        receiptUrl: firstPayment?.receipt?.url || null,
      },
      message: storage.stored
        ? "Personal 구독이 시작되었습니다. 결제수단 등록과 첫 달 결제가 완료되었습니다."
        : storage.message || "첫 달 결제는 완료되었지만 구독 상태 저장에 실패했습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

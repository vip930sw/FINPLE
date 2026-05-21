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

async function ensureRecurringPaymentMethodSchema() {
  await query(`CREATE TABLE IF NOT EXISTS recurring_payment_methods (
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

  await query(`CREATE INDEX IF NOT EXISTS idx_recurring_payment_methods_user_default
    ON recurring_payment_methods(user_id, is_default, status)`);
}

function serializePaymentMethod(row) {
  if (!row) return null;

  return {
    id: row.id,
    provider: row.provider,
    methodType: row.method_type,
    displayLabel: row.display_label || row.card_company || "등록된 결제수단",
    cardCompany: row.card_company || null,
    cardLast4: row.card_last4 || null,
    isDefault: Boolean(row.is_default),
    status: row.status,
    issuedAt: row.issued_at,
    updatedAt: row.updated_at,
  };
}

router.get("/toss/billing/method", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "결제수단 확인을 위해 로그인이 필요합니다.",
      });
      return;
    }

    if (!isDatabaseConfigured()) {
      response.json({
        ok: true,
        registered: false,
        method: null,
        reason: "database_not_configured",
        message: "데이터베이스 연결 전입니다.",
      });
      return;
    }

    await ensureRecurringPaymentMethodSchema();

    const result = await query(
      `SELECT id, provider, method_type, display_label, card_company, card_last4,
              is_default, status, issued_at, updated_at
       FROM recurring_payment_methods
       WHERE provider = 'toss-payments'
         AND user_id = $1
         AND status = 'active'
       ORDER BY is_default DESC, issued_at DESC NULLS LAST, updated_at DESC NULLS LAST
       LIMIT 1`,
      [user.id]
    );

    const method = serializePaymentMethod(result.rows[0]);

    response.json({
      ok: true,
      registered: Boolean(method),
      method,
      message: method ? "등록된 자동결제 결제수단이 있습니다." : "등록된 자동결제 결제수단이 없습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

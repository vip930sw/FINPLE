import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query } from "../db/database.js";
import { buildPaymentMethodSummary, buildStoredPaymentMethodSummary } from "../services/paymentMethodDisplay.js";

const router = express.Router();

const CARD_ISSUER_NAMES = {
  "3K": "IBK카드",
  "46": "광주카드",
  "71": "롯데카드",
  "30": "KDB카드",
  "31": "BC카드",
  "51": "삼성카드",
  "38": "새마을금고카드",
  "41": "신한카드",
  "62": "신협카드",
  "36": "씨티카드",
  "33": "우리카드",
  W1: "우리카드",
  "37": "우체국카드",
  "39": "저축은행카드",
  "35": "전북카드",
  "42": "제주카드",
  "15": "카카오뱅크카드",
  "3A": "케이뱅크카드",
  "24": "토스뱅크카드",
  "21": "하나카드",
  "61": "현대카드",
  "11": "KB국민카드",
  "91": "NH농협카드",
  "34": "수협카드",
};

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

function normalizeCardCode(value) {
  return String(value || "").trim().toUpperCase();
}

function isCodeLike(value) {
  const code = normalizeCardCode(value);
  return /^[0-9A-Z]{2,3}$/.test(code) && Boolean(CARD_ISSUER_NAMES[code] || /^\d{2,3}$/.test(code));
}

function resolveCardCompany(...values) {
  for (const value of values) {
    const raw = String(value || "").trim();
    if (!raw) continue;
    const code = normalizeCardCode(raw);
    if (CARD_ISSUER_NAMES[code]) return CARD_ISSUER_NAMES[code];
    if (!isCodeLike(raw)) {
      const cardCompany = raw.replace(/\s*은행$/u, "").trim();
      return cardCompany;
    }
  }
  return "카드";
}

function getMaskedTail(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const compact = raw.replace(/[^0-9*]/g, "");
  if (!compact) return "";

  if (compact.includes("*")) {
    const tail = compact.slice(-4);
    return /[0-9]/.test(tail) ? tail : "";
  }

  const digits = compact.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : "";
}

function formatCardDisplayLabel(company, tail) {
  const safeCompany = resolveCardCompany(company);
  const safeTail = getMaskedTail(tail);
  return safeTail ? `${safeCompany} · **** ${safeTail}` : (safeCompany === "카드" ? "등록된 카드" : safeCompany);
}

function normalizeStoredDisplayLabel(value) {
  const label = String(value || "").trim();
  if (!label) return "";

  const withoutDefaultBadge = label.replace(/\s*기본\s*$/g, "").trim();
  const withoutRegisteredBadge = withoutDefaultBadge.replace(/\s*등록\s*완료\s*$/u, "").trim();
  const legacyMatch = withoutRegisteredBadge.match(/^(.+?)\s*[·-]\s*\*+\s*([0-9*]{3,4})$/);
  if (legacyMatch) {
    return formatCardDisplayLabel(legacyMatch[1], legacyMatch[2]);
  }

  return withoutRegisteredBadge;
}

function getCardNumberCandidates(card = {}, payload = {}, row = {}) {
  return [
    card.number,
    card.cardNumber,
    card.maskedNumber,
    card.maskedCardNumber,
    card.last4,
    card.cardLast4,
    card.card_last4,
    card.lastFour,
    card.lastFourDigits,
    payload.maskedCardNumber,
    payload.masked_card_number,
    payload.cardLast4,
    payload.card_last4,
    payload.last4,
    payload.lastFour,
    payload.lastFourDigits,
    row.masked_card_number,
    row.card_last4,
  ];
}

function summarizeCardFromPayload(payload, row = {}) {
  if (!payload || typeof payload !== "object") return null;

  const card = payload.card && typeof payload.card === "object" ? payload.card : {};
  const company = resolveCardCompany(
    card.company,
    card.cardCompany,
    payload.cardCompany,
    card.issuerCode,
    card.acquirerCode,
    payload.issuerCode,
    payload.acquirerCode,
    row.card_company
  );
  const numberCandidate = getCardNumberCandidates(card, payload, row).find((value) => getMaskedTail(value));
  const tail = getMaskedTail(numberCandidate);

  if (!tail) return null;

  return {
    displayLabel: formatCardDisplayLabel(company, tail),
    cardCompany: company,
    cardLast4: /^\d{4}$/.test(tail) ? tail : null,
    maskedCardNumber: String(numberCandidate || "").includes("*") ? String(numberCandidate).replace(/[^0-9*]/g, "") : null,
    cardBrandKey: normalizeCardCode(card.issuerCode || card.acquirerCode || row.card_company),
    source: "payment_metadata",
  };
}

function summarizeCardFromRow(row) {
  if (!row) return null;

  const company = resolveCardCompany(row.card_company);
  const tail = getMaskedTail(row.masked_card_number || row.card_last4);

  if (tail && row.card_company && !isCodeLike(row.card_company)) {
    return {
      displayLabel: formatCardDisplayLabel(company, tail),
      cardCompany: company,
      cardLast4: /^\d{4}$/.test(tail) ? tail : null,
      maskedCardNumber: row.masked_card_number || null,
      cardBrandKey: normalizeCardCode(row.card_company),
      source: "stored_method",
    };
  }

  const storedDisplayLabel = normalizeStoredDisplayLabel(row.display_label);
  if (storedDisplayLabel && !/^\d{2,3}\s*\*+/.test(storedDisplayLabel)) {
    return {
      displayLabel: storedDisplayLabel,
      cardCompany: row.card_company || null,
      cardLast4: row.card_last4 || null,
      cardBrandKey: normalizeCardCode(row.card_company),
      source: "stored_display_label",
    };
  }

  return {
    displayLabel: "등록된 카드",
    cardCompany: null,
    cardLast4: null,
    cardBrandKey: null,
    source: "stored_method_safe_fallback",
  };
}

function serializePaymentMethod(row) {
  if (!row) return null;

  const paymentMetadataCandidates = Array.isArray(row.payment_metadata_candidates)
    ? row.payment_metadata_candidates.filter((metadata) => metadata && typeof metadata === "object")
    : [];
  const paymentEventCandidates = Array.isArray(row.payment_event_candidates)
    ? row.payment_event_candidates.filter((metadata) => metadata && typeof metadata === "object")
    : [];
  const providerSummary = buildPaymentMethodSummary(
    ...paymentEventCandidates,
    row.payment_metadata,
    ...paymentMetadataCandidates,
    row.metadata
  );
  const paymentSummary =
    providerSummary ||
    buildStoredPaymentMethodSummary(row) ||
    summarizeCardFromPayload(row.payment_metadata, row) ||
    paymentEventCandidates.map((metadata) => summarizeCardFromPayload(metadata, row)).find(Boolean) ||
    paymentMetadataCandidates.map((metadata) => summarizeCardFromPayload(metadata, row)).find(Boolean);
  const rowSummary = summarizeCardFromRow(row);
  const summary = paymentSummary || rowSummary;
  const displayLabel = summary?.displayLabel || "등록된 카드";
  const cardCompany = summary?.cardCompany || null;
  const cardLast4 = summary?.cardLast4 || null;
  const maskedCardNumber = summary?.maskedCardNumber || row.masked_card_number || null;

  return {
    id: row.id,
    provider: row.provider,
    methodType: row.method_type,
    displayLabel,
    display_label: displayLabel,
    cardCompany,
    card_company: cardCompany,
    cardLast4,
    card_last4: cardLast4,
    maskedCardNumber,
    masked_card_number: maskedCardNumber,
    cardBrandKey: summary?.cardBrandKey || null,
    displaySource: summary?.source || "unknown",
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
      `SELECT rpm.id, rpm.provider, rpm.method_type, rpm.display_label, rpm.card_company,
              rpm.card_last4, rpm.masked_card_number, rpm.metadata, rpm.is_default, rpm.status,
              rpm.issued_at, rpm.updated_at, latest_payment.metadata AS payment_metadata,
              payment_candidates.metadata_list AS payment_metadata_candidates,
              payment_events.payload_list AS payment_event_candidates
       FROM recurring_payment_methods rpm
       LEFT JOIN LATERAL (
         SELECT p.metadata
         FROM payments p
         WHERE p.provider = 'toss-payments'
           AND p.user_id = rpm.user_id
           AND p.status = 'confirmed'
           AND (
             p.metadata->>'recurringPaymentMethodId' = rpm.id::text
             OR (rpm.customer_key IS NOT NULL AND p.metadata->>'customerKey' = rpm.customer_key)
             OR (rpm.metadata->>'authOrderId' IS NOT NULL AND p.metadata->>'authOrderId' = rpm.metadata->>'authOrderId')
             OR (rpm.metadata->>'firstPaymentOrderId' IS NOT NULL AND p.metadata->>'firstPaymentOrderId' = rpm.metadata->>'firstPaymentOrderId')
             OR (rpm.metadata->>'orderId' IS NOT NULL AND p.metadata->>'orderId' = rpm.metadata->>'orderId')
           )
         ORDER BY COALESCE(p.paid_at, p.requested_at, p.created_at) DESC NULLS LAST
         LIMIT 1
       ) latest_payment ON TRUE
       LEFT JOIN LATERAL (
         SELECT COALESCE(
           jsonb_agg(candidate.metadata ORDER BY candidate.payment_at DESC NULLS LAST),
           '[]'::jsonb
         ) AS metadata_list
         FROM (
           SELECT p.metadata,
                  COALESCE(p.paid_at, p.requested_at, p.created_at) AS payment_at
             FROM payments p
            WHERE p.provider = 'toss-payments'
              AND p.user_id = rpm.user_id
              AND p.status = 'confirmed'
              AND p.metadata IS NOT NULL
              AND (
                p.metadata->>'recurringPaymentMethodId' = rpm.id::text
                OR (rpm.customer_key IS NOT NULL AND p.metadata->>'customerKey' = rpm.customer_key)
                OR (rpm.metadata->>'authOrderId' IS NOT NULL AND p.metadata->>'authOrderId' = rpm.metadata->>'authOrderId')
                OR (rpm.metadata->>'firstPaymentOrderId' IS NOT NULL AND p.metadata->>'firstPaymentOrderId' = rpm.metadata->>'firstPaymentOrderId')
                OR (rpm.metadata->>'orderId' IS NOT NULL AND p.metadata->>'orderId' = rpm.metadata->>'orderId')
              )
            ORDER BY payment_at DESC NULLS LAST
            LIMIT 5
         ) candidate
       ) payment_candidates ON TRUE
       LEFT JOIN LATERAL (
         SELECT COALESCE(
           jsonb_agg(event_candidate.payload ORDER BY event_candidate.processed_at DESC NULLS LAST),
           '[]'::jsonb
         ) AS payload_list
         FROM (
           SELECT pe.payload, pe.processed_at
             FROM payment_events pe
            WHERE pe.provider = 'toss-payments'
              AND pe.user_id = rpm.user_id
              AND pe.event_type IN ('billing.key.issued', 'billing.first_payment.confirmed')
              AND pe.processing_status IN ('confirmed', 'processed')
              AND pe.payload IS NOT NULL
              AND (
                pe.payload->>'recurringPaymentMethodId' = rpm.id::text
                OR (rpm.customer_key IS NOT NULL AND pe.payload->>'customerKey' = rpm.customer_key)
                OR (rpm.metadata->>'authOrderId' IS NOT NULL AND pe.payload->>'authOrderId' = rpm.metadata->>'authOrderId')
                OR (rpm.metadata->>'firstPaymentOrderId' IS NOT NULL AND pe.payload->>'firstPaymentOrderId' = rpm.metadata->>'firstPaymentOrderId')
                OR (rpm.metadata->>'orderId' IS NOT NULL AND pe.payload->>'orderId' = rpm.metadata->>'orderId')
              )
            ORDER BY pe.processed_at DESC NULLS LAST
            LIMIT 10
         ) event_candidate
       ) payment_events ON TRUE
       WHERE rpm.provider = 'toss-payments'
         AND rpm.user_id = $1
         AND rpm.status = 'active'
       ORDER BY rpm.is_default DESC, rpm.issued_at DESC NULLS LAST, rpm.updated_at DESC NULLS LAST
       LIMIT 1`,
      [user.id]
    );

    let method = serializePaymentMethod(result.rows[0]);

    if (!method) {
      const paymentResult = await query(
        `SELECT id, provider, metadata, COALESCE(paid_at, requested_at, created_at) AS latest_payment_at
           FROM payments
          WHERE provider = 'toss-payments'
            AND user_id = $1
            AND status = 'confirmed'
          ORDER BY COALESCE(paid_at, requested_at, created_at) DESC NULLS LAST
          LIMIT 1`,
        [user.id]
      );
      const latestPayment = paymentResult.rows[0] || null;
      const paymentSummary = buildPaymentMethodSummary(latestPayment?.metadata);
      if (paymentSummary) {
        method = {
          id: latestPayment.id,
          provider: latestPayment.provider,
          methodType: "card",
          displayLabel: paymentSummary.displayLabel,
          cardCompany: paymentSummary.cardCompany,
          cardLast4: paymentSummary.cardLast4,
          maskedCardNumber: paymentSummary.maskedCardNumber || null,
          cardBrandKey: paymentSummary.cardBrandKey,
          displaySource: "latest_confirmed_payment",
          isDefault: false,
          status: "confirmed",
          issuedAt: latestPayment.latest_payment_at,
          updatedAt: latestPayment.latest_payment_at,
        };
      }
    }

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

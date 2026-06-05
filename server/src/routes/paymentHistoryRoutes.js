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

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePlanLabel(plan) {
  const normalized = String(plan || "").trim().toLowerCase();
  if (normalized === "personal") return "FINPLE Personal";
  if (normalized === "pro") return "FINPLE Pro";
  if (normalized === "free") return "FINPLE Free";
  return plan ? `FINPLE ${plan}` : "FINPLE 결제";
}

function normalizePaymentStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["confirmed", "paid", "done", "success", "approved"].includes(normalized)) return "paid";
  if (["failed", "aborted", "expired"].includes(normalized)) return "failed";
  if (["canceled", "cancelled", "partial_canceled", "partial_cancelled"].includes(normalized)) return "canceled";
  if (["refunded", "refund"].includes(normalized)) return "refunded";
  return normalized || "pending";
}

function getReceiptUrl(row) {
  if (row.receipt_url) return row.receipt_url;
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return (
    metadata.receiptUrl ||
    metadata.receipt_url ||
    metadata?.receipt?.url ||
    metadata?.checkout?.url ||
    metadata?.payment?.receipt?.url ||
    null
  );
}

function mapPaymentRow(row) {
  const paidAt = row.requested_at || row.created_at || null;
  return {
    id: row.id,
    provider: row.provider,
    plan: row.plan,
    title: normalizePlanLabel(row.plan),
    amount: toNumber(row.amount),
    currency: row.currency || "KRW",
    status: normalizePaymentStatus(row.status),
    rawStatus: row.status,
    receiptUrl: getReceiptUrl(row),
    providerPaymentId: row.provider_payment_id || null,
    providerOrderId: row.provider_order_id || null,
    paidAt,
    requestedAt: row.requested_at || null,
    createdAt: row.created_at || null,
  };
}

router.get("/history", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json({
        ok: false,
        code: "AUTH_REQUIRED",
        message: "결제내역 확인을 위해 로그인이 필요합니다.",
      });
      return;
    }

    if (!isDatabaseConfigured()) {
      response.json({
        ok: true,
        payments: [],
        reason: "database_not_configured",
        message: "데이터베이스 연결 전입니다.",
      });
      return;
    }

    const result = await query(
      `SELECT id, user_id, provider, amount, currency, status, subscription_id, plan,
              provider_payment_id, provider_order_id, receipt_url, requested_at, created_at, metadata
         FROM payments
        WHERE user_id = $1
        ORDER BY requested_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 50`,
      [user.id]
    );

    response.json({
      ok: true,
      payments: result.rows.map(mapPaymentRow),
      message: result.rows.length > 0 ? "결제내역을 불러왔습니다." : "결제내역이 없습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

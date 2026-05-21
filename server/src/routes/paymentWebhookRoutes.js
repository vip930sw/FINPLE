import { randomUUID } from "node:crypto";

import express from "express";

import { isDatabaseConfigured, query, withTransaction } from "../db/database.js";

const router = express.Router();

function normalizeAmount(amount) {
  if (amount === undefined || amount === null || amount === "") return null;
  const parsed = Number(String(amount).replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : NaN;
}

function getWebhookData(payload) {
  if (!payload || typeof payload !== "object") return {};
  if (payload.data && typeof payload.data === "object") return payload.data;
  if (payload.payment && typeof payload.payment === "object") return payload.payment;
  return payload;
}

function getWebhookEventId(payload, request) {
  const data = getWebhookData(payload);
  return (
    String(payload.eventId || payload.event_id || payload.id || "").trim() ||
    String(request.get("x-toss-event-id") || request.get("x-tosspayments-event-id") || "").trim() ||
    String(data.eventId || data.event_id || data.id || "").trim() ||
    randomUUID()
  );
}

function getWebhookEventType(payload) {
  return String(payload.eventType || payload.event_type || payload.type || "unknown").trim();
}

function getWebhookIdentifiers(payload) {
  const data = getWebhookData(payload);
  const paymentKey = String(
    data.paymentKey || data.payment_key || payload.paymentKey || payload.payment_key || ""
  ).trim();
  const orderId = String(
    data.orderId || data.order_id || payload.orderId || payload.order_id || ""
  ).trim();
  const status = String(
    data.status || data.paymentStatus || data.payment_status || data.cancelStatus || data.cancel_status || payload.status || ""
  ).trim();
  const cancelStatus = String(
    data.cancelStatus || data.cancel_status || payload.cancelStatus || payload.cancel_status || ""
  ).trim();
  const totalAmount = normalizeAmount(
    data.totalAmount || data.total_amount || data.amount || payload.totalAmount || payload.amount
  );

  return {
    paymentKey,
    orderId,
    status,
    cancelStatus,
    totalAmount: Number.isNaN(totalAmount) ? null : totalAmount,
  };
}

function mapWebhookPaymentStatus(eventType, status, cancelStatus) {
  const normalizedEventType = String(eventType || "").toUpperCase();
  const normalizedStatus = String(status || "").toUpperCase();
  const normalizedCancelStatus = String(cancelStatus || "").toUpperCase();

  if (normalizedEventType === "CANCEL_STATUS_CHANGED") return "canceled";
  if (["DONE", "COMPLETED", "CANCELED", "CANCELLED"].includes(normalizedCancelStatus)) return "canceled";
  if (["CANCELED", "CANCELLED", "PARTIAL_CANCELED", "PARTIAL_CANCELLED"].includes(normalizedStatus)) return "canceled";
  if (["DONE", "APPROVED", "PAID"].includes(normalizedStatus)) return "confirmed";
  if (["WAITING_FOR_DEPOSIT", "IN_PROGRESS", "READY"].includes(normalizedStatus)) return "pending";
  if (["ABORTED", "EXPIRED", "FAILED"].includes(normalizedStatus)) return "failed";

  return null;
}

function isCancellationWebhook(eventType, identifiers) {
  const normalizedEventType = String(eventType || "").toUpperCase();
  const normalizedStatus = String(identifiers?.status || "").toUpperCase();
  const normalizedCancelStatus = String(identifiers?.cancelStatus || "").toUpperCase();

  return (
    normalizedEventType === "CANCEL_STATUS_CHANGED" ||
    ["DONE", "COMPLETED", "CANCELED", "CANCELLED"].includes(normalizedCancelStatus) ||
    ["CANCELED", "CANCELLED", "PARTIAL_CANCELED", "PARTIAL_CANCELLED"].includes(normalizedStatus)
  );
}

async function findPaymentForWebhook({ paymentKey, orderId }) {
  if (!isDatabaseConfigured()) return null;
  if (!paymentKey && !orderId) return null;

  try {
    const result = await query(
      `SELECT id, user_id, subscription_id, plan, amount, status, provider_payment_id, provider_order_id
       FROM payments
       WHERE provider = 'toss-payments'
         AND (
           ($1 <> '' AND provider_payment_id = $1)
           OR ($2 <> '' AND provider_order_id = $2)
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [paymentKey, orderId]
    );

    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

async function processMatchedPaymentWebhook({ tx, matchedPayment, eventType, eventId, identifiers }) {
  const nextPaymentStatus = mapWebhookPaymentStatus(eventType, identifiers.status, identifiers.cancelStatus);
  const cancellation = isCancellationWebhook(eventType, identifiers);
  let subscriptionUpdate = null;

  if (nextPaymentStatus) {
    await tx(
      `UPDATE payments
       SET status = $2,
           metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb
       WHERE id = $1`,
      [
        matchedPayment.id,
        nextPaymentStatus,
        JSON.stringify({
          lastWebhookEventType: eventType,
          lastWebhookStatus: identifiers.status || null,
          lastWebhookCancelStatus: identifiers.cancelStatus || null,
          lastWebhookEventId: eventId,
          lastWebhookReceivedAt: new Date().toISOString(),
        }),
      ]
    );
  }

  if (cancellation && matchedPayment.subscription_id) {
    const result = await tx(
      `UPDATE subscriptions
       SET status = 'cancel_at_period_end',
           cancel_at_period_end = TRUE,
           metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
       WHERE id = $1
       RETURNING id, status, current_period_end, cancel_at_period_end`,
      [
        matchedPayment.subscription_id,
        JSON.stringify({
          cancelPolicyStep: "161",
          cancelReason: "toss_webhook_cancellation",
          cancelWebhookEventType: eventType,
          cancelWebhookStatus: identifiers.status || null,
          cancelWebhookCancelStatus: identifiers.cancelStatus || null,
          cancelWebhookEventId: eventId,
          cancelScheduledAt: new Date().toISOString(),
          entitlementPolicy: "keep_personal_until_current_period_end",
        }),
      ]
    );
    subscriptionUpdate = result.rows[0] || null;
  }

  return {
    paymentStatusUpdatedTo: nextPaymentStatus,
    cancellationScheduled: Boolean(subscriptionUpdate),
    subscriptionUpdate,
  };
}

async function recordAndProcessWebhook({ payload, eventId, eventType }) {
  if (!isDatabaseConfigured()) {
    return {
      stored: false,
      matched: false,
      processed: false,
      processingStatus: "not_stored",
      reason: "database_not_configured",
    };
  }

  const identifiers = getWebhookIdentifiers(payload);
  const matchedPayment = await findPaymentForWebhook(identifiers);
  const processingStatus = matchedPayment ? "processed" : "received";
  const processedAtSql = matchedPayment ? "NOW()" : "NULL";
  let paymentProcessing = {
    paymentStatusUpdatedTo: null,
    cancellationScheduled: false,
    subscriptionUpdate: null,
  };

  try {
    await withTransaction(async (tx) => {
      await tx(
        `INSERT INTO payment_events (
           id, provider, event_id, event_type, user_id, payment_id, subscription_id,
           payload, processing_status, processed_at
         )
         VALUES ($1, 'toss-payments', $2, $3, $4, $5, $6, $7::jsonb, $8, ${processedAtSql})
         ON CONFLICT (provider, event_id) DO UPDATE SET
           event_type = EXCLUDED.event_type,
           user_id = COALESCE(EXCLUDED.user_id, payment_events.user_id),
           payment_id = COALESCE(EXCLUDED.payment_id, payment_events.payment_id),
           subscription_id = COALESCE(EXCLUDED.subscription_id, payment_events.subscription_id),
           payload = EXCLUDED.payload,
           processing_status = EXCLUDED.processing_status,
           processed_at = COALESCE(EXCLUDED.processed_at, payment_events.processed_at)`,
        [
          randomUUID(),
          eventId,
          eventType,
          matchedPayment?.user_id || null,
          matchedPayment?.id || null,
          matchedPayment?.subscription_id || null,
          JSON.stringify({
            ...payload,
            finpleWebhookMatch: {
              identifiers,
              matched: Boolean(matchedPayment),
              cancelPolicy: "keep_personal_until_current_period_end",
            },
          }),
          processingStatus,
        ]
      );

      if (matchedPayment) {
        paymentProcessing = await processMatchedPaymentWebhook({
          tx,
          matchedPayment,
          eventType,
          eventId,
          identifiers,
        });
      }
    });

    return {
      stored: true,
      matched: Boolean(matchedPayment),
      processed: Boolean(matchedPayment),
      processingStatus,
      paymentId: matchedPayment?.id || null,
      subscriptionId: matchedPayment?.subscription_id || null,
      userId: matchedPayment?.user_id || null,
      ...paymentProcessing,
      identifiers,
    };
  } catch (error) {
    return {
      stored: false,
      matched: Boolean(matchedPayment),
      processed: false,
      processingStatus: "store_failed",
      reason: "webhook_store_failed",
      message: error.message,
      identifiers,
    };
  }
}

router.post("/toss/webhook", async (request, response, next) => {
  try {
    const payload = request.body || {};
    const eventId = getWebhookEventId(payload, request);
    const eventType = getWebhookEventType(payload);
    const processing = await recordAndProcessWebhook({ payload, eventId, eventType });

    response.json({
      ok: true,
      provider: "toss-payments",
      mode: "webhook-cancel-policy-processor",
      eventId,
      eventType,
      stored: processing.stored,
      matched: processing.matched,
      processed: processing.processed,
      processingStatus: processing.processingStatus,
      paymentId: processing.paymentId || null,
      subscriptionId: processing.subscriptionId || null,
      paymentStatusUpdatedTo: processing.paymentStatusUpdatedTo || null,
      cancellationScheduled: Boolean(processing.cancellationScheduled),
      currentPeriodEnd: processing.subscriptionUpdate?.current_period_end || null,
      webhookConfigured: Boolean(process.env.TOSS_WEBHOOK_SECRET),
      message: processing.cancellationScheduled
        ? "취소 Webhook을 확인했습니다. Personal 권한은 이용기간 종료일까지 유지되고 다음 결제부터 중단됩니다."
        : processing.processed
          ? "Webhook 이벤트를 기존 결제 기록과 매칭해 처리했습니다."
          : "Webhook 이벤트를 수신 기록으로 저장했습니다. 기존 결제와 매칭되지 않으면 기록만 유지합니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

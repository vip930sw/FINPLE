import express from "express";

import { getUserByAuthHeader, getUserBySessionToken } from "../db/authRepository.js";
import { isDatabaseConfigured, query, withTransaction } from "../db/database.js";
import { sendSubscriptionNotification } from "../services/userNotificationService.js";

const router = express.Router();

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

async function findLatestPersonalSubscription(userId) {
  const result = await query(
    `SELECT id, user_id, plan, status, provider, provider_subscription_id,
            billing_cycle, current_period_start, current_period_end,
            cancel_at_period_end, ended_at, metadata
     FROM subscriptions
     WHERE user_id = $1
       AND provider = 'toss-payments'
       AND plan = 'personal'
       AND status IN ('active', 'cancel_at_period_end')
     ORDER BY current_period_start DESC NULLS LAST, current_period_end DESC NULLS LAST
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

router.post("/subscription/end-at-period", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      response.status(401).json({ ok: false, code: "AUTH_REQUIRED", message: "로그인이 필요합니다." });
      return;
    }

    if (!isDatabaseConfigured()) {
      response.status(503).json({ ok: false, code: "DATABASE_NOT_CONFIGURED", message: "구독 상태 저장소가 연결되지 않았습니다." });
      return;
    }

    const subscription = await findLatestPersonalSubscription(user.id);
    if (!subscription) {
      response.status(404).json({ ok: false, code: "NO_ACTIVE_PERSONAL_SUBSCRIPTION", message: "진행 중인 Personal 구독을 찾지 못했습니다." });
      return;
    }

    if (subscription.status === "cancel_at_period_end" || subscription.cancel_at_period_end) {
      response.json({
        ok: true,
        alreadyScheduled: true,
        plan: "personal",
        status: "cancel_at_period_end",
        subscription,
        currentPeriodEnd: subscription.current_period_end,
        message: "이미 종료 예약된 구독입니다. 이용기간 종료일까지 Personal 기능을 사용할 수 있습니다.",
      });
      return;
    }

    const updated = await withTransaction(async (tx) => {
      const result = await tx(
        `UPDATE subscriptions
         SET status = 'cancel_at_period_end',
             cancel_at_period_end = TRUE,
             metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
         WHERE id = $1
         RETURNING id, user_id, plan, status, provider, provider_subscription_id,
                   billing_cycle, current_period_start, current_period_end,
                   cancel_at_period_end, ended_at`,
        [
          subscription.id,
          JSON.stringify({
            step: "162A",
            reason: "user_requested_period_end",
            requestedAt: new Date().toISOString(),
            entitlementPolicy: "keep_personal_until_current_period_end",
          }),
        ]
      );
      return result.rows[0];
    });
    const notification = await sendSubscriptionNotification({
      to: user.email,
      type: "cancelScheduled",
      plan: "Personal",
      currentPeriodEnd: updated?.current_period_end || null,
    }).catch((error) => ({
      enabled: true,
      sent: false,
      error: error?.message || "subscription_cancel_notification_failed",
    }));

    response.json({
      ok: true,
      alreadyScheduled: false,
      plan: "personal",
      status: "cancel_at_period_end",
      subscription: updated,
      currentPeriodEnd: updated?.current_period_end || null,
      notification,
      message: "구독 종료가 예약되었습니다. 이용기간 종료일까지 Personal 기능을 사용할 수 있습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

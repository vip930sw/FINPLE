import express from "express";

import { isDatabaseConfigured, query, withTransaction } from "../db/database.js";
import {
  buildEducationAccountsCsv,
  buildEducationCredentialsCsv,
  bulkCreateEducationAccounts,
  deleteAllEducationAccounts,
  deleteEducationAccount,
  deleteEducationAccountsByIds,
  deleteExpiredEducationAccounts,
  listEducationAccounts,
  updateEducationAccount,
} from "../db/educationAccountRepository.js";
import { ensureEducationAccountSchema } from "../db/educationAccountSchema.js";
import { requireAdminAccess } from "../middleware/adminGuard.js";
import { getAiAnalysisUsageAdminSummary } from "../services/aiAnalysisUsageRepository.js";
import {
  buildPlanBreakdown,
  collapseAdminSubscriptionsByUser,
  mapAdminMemberRow,
  mapAdminSubscriptionRow,
  getAdminSubscriptionEffectiveState,
  shouldKeepAdminSubscriptionRow,
} from "../services/adminSubscriptionEffectiveStatus.js";

const router = express.Router();
const ADMIN_DELETED_AUTH_STATUS = "admin_deleted";

router.get("/health", (request, response) => {
  response.json({
    ok: true,
    route: "admin",
    databaseConfigured: isDatabaseConfigured(),
  });
});

function requireDatabase(response) {
  if (isDatabaseConfigured()) return true;

  response.status(503).json({
    ok: false,
    message: "DATABASE_URL이 설정되어 있지 않습니다.",
  });
  return false;
}

function normalizeConfirmValue(value) {
  return String(value || "").trim().toLowerCase();
}

async function getLatestPortfolioMbtiByUser() {
  const candidateColumns = ["mbti", "metadata", "portfolio_data", "data"];

  try {
    const columnResult = await query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'portfolios'
          AND data_type IN ('json', 'jsonb')
          AND column_name = ANY($1::text[])`,
      [candidateColumns]
    );
    const columns = new Set(columnResult.rows.map((row) => row.column_name));
    const expressions = [];

    if (columns.has("mbti")) {
      expressions.push("mbti #>> '{nickname}'");
      expressions.push("mbti #>> '{type,nickname}'");
    }
    for (const columnName of ["metadata", "portfolio_data", "data"]) {
      if (!columns.has(columnName)) continue;
      expressions.push(`${columnName} #>> '{mbti,nickname}'`);
      expressions.push(`${columnName} #>> '{portfolio,mbti,nickname}'`);
      expressions.push(`${columnName} #>> '{investmentMbti,nickname}'`);
    }

    if (expressions.length === 0) return new Map();

    const mbtiResult = await query(
      `SELECT DISTINCT ON (user_id)
              user_id,
              NULLIF(BTRIM(COALESCE(${expressions.join(", ")})), '') AS mbti_nickname
         FROM portfolios
        WHERE COALESCE(${expressions.join(", ")}) IS NOT NULL
        ORDER BY user_id,
                 updated_at DESC NULLS LAST,
                 created_at DESC NULLS LAST,
                 id DESC`
    );

    return new Map(
      mbtiResult.rows
        .filter((row) => row.user_id && row.mbti_nickname)
        .map((row) => [row.user_id, row.mbti_nickname])
    );
  } catch (error) {
    console.warn("Admin MBTI summary skipped:", error?.message || error);
    return new Map();
  }
}

async function getAdminMemberDeletionCandidate(tx, userId) {
  const result = await tx(
    `WITH latest_subscriptions AS (
       SELECT DISTINCT ON (user_id)
              id AS subscription_id,
              user_id,
              plan AS subscription_plan,
              status AS subscription_status,
              current_period_start,
              current_period_end,
              cancel_at_period_end
         FROM subscriptions
        ORDER BY user_id,
                 current_period_start DESC NULLS LAST,
                 current_period_end DESC NULLS LAST,
                 id DESC
     ),
     latest_entitlements AS (
       SELECT DISTINCT ON (user_id)
              user_id,
              plan AS entitlement_plan,
              valid_until AS entitlement_valid_until
         FROM user_entitlements
        ORDER BY user_id,
                 updated_at DESC NULLS LAST,
                 valid_until DESC NULLS LAST
     )
     SELECT
       users.id,
       users.email,
       users.name,
       users.nickname,
       users.plan AS user_plan,
       users.auth_status,
       latest_subscriptions.subscription_id,
       latest_subscriptions.subscription_plan,
       latest_subscriptions.subscription_status,
       latest_subscriptions.current_period_start,
       latest_subscriptions.current_period_end,
       latest_subscriptions.cancel_at_period_end,
       latest_entitlements.entitlement_plan,
       latest_entitlements.entitlement_valid_until
      FROM users
      LEFT JOIN latest_subscriptions ON latest_subscriptions.user_id = users.id
      LEFT JOIN latest_entitlements ON latest_entitlements.user_id = users.id
     WHERE users.id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

router.get("/members", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;

      await ensureEducationAccountSchema(query);

      const [membersResult, educationMembersResult, mbtiByUserId] = await Promise.all([
        query(
          `WITH latest_subscriptions AS (
             SELECT DISTINCT ON (user_id)
                    id AS subscription_id,
                    user_id,
                    plan AS subscription_plan,
                    status AS subscription_status,
                    current_period_start,
                    current_period_end,
                    cancel_at_period_end
               FROM subscriptions
              ORDER BY user_id,
                       current_period_start DESC NULLS LAST,
                       current_period_end DESC NULLS LAST,
                       id DESC
           ),
           latest_entitlements AS (
             SELECT DISTINCT ON (user_id)
                    user_id,
                    plan AS entitlement_plan,
                    valid_until AS entitlement_valid_until
               FROM user_entitlements
              ORDER BY user_id,
                       updated_at DESC NULLS LAST,
                       valid_until DESC NULLS LAST
           ),
           portfolio_counts AS (
             SELECT user_id, COUNT(*) AS portfolio_count
               FROM portfolios
              GROUP BY user_id
           ),
           inquiry_counts AS (
             SELECT user_id, COUNT(*) AS inquiry_count
               FROM inquiries
              GROUP BY user_id
           ),
           education_users AS (
             SELECT user_id
               FROM education_accounts
           )
           SELECT
             users.id,
             users.email,
             users.name,
             users.nickname,
             users.plan AS user_plan,
             users.created_at,
             users.updated_at,
             users.last_login_at,
             latest_subscriptions.subscription_id,
             latest_subscriptions.subscription_plan,
             latest_subscriptions.subscription_status,
             latest_subscriptions.current_period_start,
             latest_subscriptions.current_period_end,
             latest_subscriptions.cancel_at_period_end,
             latest_entitlements.entitlement_plan,
             latest_entitlements.entitlement_valid_until,
             COALESCE(portfolio_counts.portfolio_count, 0) AS portfolio_count,
             COALESCE(inquiry_counts.inquiry_count, 0) AS inquiry_count
           FROM users
            LEFT JOIN latest_subscriptions ON latest_subscriptions.user_id = users.id
            LEFT JOIN latest_entitlements ON latest_entitlements.user_id = users.id
            LEFT JOIN portfolio_counts ON portfolio_counts.user_id = users.id
            LEFT JOIN inquiry_counts ON inquiry_counts.user_id = users.id
            LEFT JOIN education_users ON education_users.user_id = users.id
           WHERE education_users.user_id IS NULL
             AND COALESCE(users.auth_status, 'active') <> 'admin_deleted'
            ORDER BY users.created_at DESC`
        ),
        query(
          `SELECT COUNT(DISTINCT user_id)::int AS education_members
             FROM education_accounts`
        ),
        getLatestPortfolioMbtiByUser(),
      ]);

      const now = new Date();
      const members = membersResult.rows.map((row) => mapAdminMemberRow({
        ...row,
        mbti_nickname: mbtiByUserId.get(row.id) || null,
      }, now));
      const planCounts = members.reduce((counts, member) => {
        const plan = member.effectivePlan || member.plan || "free";
        counts.set(plan, (counts.get(plan) || 0) + 1);
        return counts;
      }, new Map());

      response.json({
        ok: true,
        summary: {
          totalMembers: members.length,
          newMembers30d: members.filter((member) => Date.parse(member.createdAt) >= Date.now() - 30 * 86400000).length,
          activeMembers30d: members.filter((member) => Date.parse(member.lastLoginAt) >= Date.now() - 30 * 86400000).length,
          subscriberMembers: members.filter((member) => member.effectivePlan === "personal").length,
          educationMembers: Number(educationMembersResult.rows[0]?.education_members || 0),
        },
        planBreakdown: Array.from(planCounts.entries()).map(([plan, count]) => ({
          plan,
          members: count,
        })).sort((a, b) => b.members - a.members || a.plan.localeCompare(b.plan)),
        members: members.slice(0, 50),
      });
    } catch (error) {
      next(error);
    }
  });
});

router.delete("/members/:id", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;

      const userId = String(request.params.id || "").trim();
      const confirmEmail = normalizeConfirmValue(request.body?.confirmEmail);
      const confirmUserId = normalizeConfirmValue(request.body?.confirmUserId);

      if (!userId) {
        response.status(400).json({
          ok: false,
          code: "ADMIN_MEMBER_ID_REQUIRED",
          message: "삭제할 회원 ID가 필요합니다.",
        });
        return;
      }

      const result = await withTransaction(async (tx) => {
        const member = await getAdminMemberDeletionCandidate(tx, userId);
        if (!member) {
          const error = new Error("삭제할 회원을 찾지 못했습니다.");
          error.statusCode = 404;
          error.code = "ADMIN_MEMBER_NOT_FOUND";
          throw error;
        }

        if (member.auth_status === ADMIN_DELETED_AUTH_STATUS) {
          const error = new Error("This member account is already soft-deleted.");
          error.statusCode = 409;
          error.code = "ADMIN_MEMBER_ALREADY_SOFT_DELETED";
          throw error;
        }

        const expectedEmail = normalizeConfirmValue(member.email);
        const expectedUserId = normalizeConfirmValue(member.id);
        const confirmedByEmail = expectedEmail && confirmEmail === expectedEmail;
        const confirmedById = confirmUserId === expectedUserId;

        if (!confirmedByEmail && !confirmedById) {
          const error = new Error("회원 삭제 확인값이 일치하지 않습니다. 이메일 또는 회원 ID를 다시 입력해 주세요.");
          error.statusCode = 400;
          error.code = "ADMIN_MEMBER_DELETE_CONFIRMATION_REQUIRED";
          throw error;
        }

        const effective = getAdminSubscriptionEffectiveState(member);
        const deletionMeta = JSON.stringify({
          reason: "admin_member_delete",
          deletedBy: "admin",
          deletedAt: new Date().toISOString(),
          effectivePlan: effective.effectivePlan || effective.plan || "free",
          effectiveStatus: effective.effectiveStatus || effective.status || "beta_free",
        });

        await tx(
          `UPDATE subscriptions
              SET status = 'canceled',
                  cancel_at_period_end = FALSE,
                  canceled_at = COALESCE(canceled_at, NOW()),
                  ended_at = COALESCE(ended_at, NOW()),
                  metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
            WHERE user_id = $1`,
          [member.id, deletionMeta]
        );

        await tx(
          `UPDATE recurring_payment_methods
              SET status = 'disabled',
                  disabled_at = COALESCE(disabled_at, NOW()),
                  metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
            WHERE user_id = $1`,
          [member.id, deletionMeta]
        );

        await tx(
          `UPDATE user_entitlements
              SET plan = 'free',
                  valid_until = COALESCE(valid_until, NOW()),
                  source = 'admin_soft_delete',
                  updated_at = NOW()
            WHERE user_id = $1`,
          [member.id]
        );

        await tx(
          `UPDATE user_sessions
              SET revoked_at = COALESCE(revoked_at, NOW())
            WHERE user_id = $1`,
          [member.id]
        );

        const updateResult = await tx(
          `UPDATE users
              SET auth_status = $2,
                  plan = 'free',
                  updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, auth_status`,
          [member.id, ADMIN_DELETED_AUTH_STATUS]
        );

        return {
          deleted: updateResult.rowCount > 0,
          softDeleted: updateResult.rowCount > 0,
          hardDeleted: false,
          member: updateResult.rows[0] || { id: member.id, email: member.email, auth_status: ADMIN_DELETED_AUTH_STATUS },
        };
      });

      response.json({
        ok: true,
        deleted: Boolean(result.deleted),
        softDeleted: Boolean(result.softDeleted),
        hardDeleted: false,
        member: result.member,
        message: "Member account was soft-deleted. Billing access was disabled and historical records were preserved.",
      });
    } catch (error) {
      next(error);
    }
  });
});

router.get("/ai-analysis-usage", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const usage = await getAiAnalysisUsageAdminSummary();
      response.json({
        ok: true,
        usage,
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });
});

router.get("/education-accounts", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const result = await listEducationAccounts();
      response.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  });
});

router.get("/education-accounts.csv", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const result = await listEducationAccounts();
      response.setHeader("Content-Type", "text/csv; charset=utf-8");
      response.setHeader("Content-Disposition", "attachment; filename=\"finple-education-accounts.csv\"");
      response.send(buildEducationAccountsCsv(result.accounts));
    } catch (error) {
      next(error);
    }
  });
});

router.post("/education-accounts/bulk", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const result = await bulkCreateEducationAccounts(request.body);
      response.status(201).json({
        ok: true,
        ...result,
        credentialsCsv: buildEducationCredentialsCsv(result.credentials),
      });
    } catch (error) {
      next(error);
    }
  });
});

router.delete("/education-accounts", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const accountIds = request.body?.accountIds;
      const result = Array.isArray(accountIds) && accountIds.length > 0
        ? await deleteEducationAccountsByIds(accountIds)
        : await deleteAllEducationAccounts();
      response.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  });
});

router.delete("/education-accounts/expired", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const result = await deleteExpiredEducationAccounts();
      response.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  });
});

router.delete("/education-accounts/:id", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const result = await deleteEducationAccount(request.params.id);
      response.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  });
});

router.patch("/education-accounts/:id", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;
      const result = await updateEducationAccount(request.params.id, request.body);
      response.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  });
});

router.get("/subscriptions", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;

      const [subscriptionsResult, revenueResult] = await Promise.all([
        query(
          `WITH latest_payments AS (
             SELECT DISTINCT ON (user_id)
               id,
               user_id,
               amount,
               currency,
               status,
               COALESCE(paid_at, created_at) AS latest_payment_at
              FROM payments
              ORDER BY user_id, COALESCE(paid_at, created_at) DESC
           ),
           latest_entitlements AS (
             SELECT DISTINCT ON (user_id)
               user_id,
               plan AS entitlement_plan,
               valid_until AS entitlement_valid_until
              FROM user_entitlements
              ORDER BY user_id,
                       updated_at DESC NULLS LAST,
                       valid_until DESC NULLS LAST
           )
           SELECT
             subscriptions.id AS subscription_id,
             subscriptions.user_id,
             users.email,
             users.name,
             users.plan AS user_plan,
             subscriptions.plan AS subscription_plan,
             subscriptions.status AS subscription_status,
             subscriptions.started_at,
             subscriptions.current_period_start,
             subscriptions.current_period_end,
             subscriptions.cancel_at_period_end,
             subscriptions.canceled_at,
             latest_entitlements.entitlement_plan,
             latest_entitlements.entitlement_valid_until,
             latest_payments.id AS latest_payment_id,
             latest_payments.amount AS latest_payment_amount,
             latest_payments.currency AS latest_payment_currency,
             latest_payments.status AS latest_payment_status,
             latest_payments.latest_payment_at
            FROM subscriptions
            JOIN users ON users.id = subscriptions.user_id
            LEFT JOIN latest_payments ON latest_payments.user_id = subscriptions.user_id
            LEFT JOIN latest_entitlements ON latest_entitlements.user_id = subscriptions.user_id
            ORDER BY COALESCE(subscriptions.current_period_end, subscriptions.started_at) DESC
            LIMIT 50`
        ),
        query(
          `SELECT
             COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0)::numeric AS confirmed_revenue,
             COALESCE(SUM(amount) FILTER (
               WHERE status = 'confirmed'
                 AND COALESCE(paid_at, requested_at, created_at) >= date_trunc('month', NOW())
                 AND COALESCE(paid_at, requested_at, created_at) < date_trunc('month', NOW()) + INTERVAL '1 month'
             ), 0)::numeric AS monthly_confirmed_revenue
             FROM payments`
        ),
      ]);

      const now = new Date();
      const mappedRows = subscriptionsResult.rows.map((row) => mapAdminSubscriptionRow(row, now));
      const managedSubscriptions = mappedRows.filter((row, index) => (
        shouldKeepAdminSubscriptionRow(subscriptionsResult.rows[index], now)
      ));
      const visibleSubscriptions = collapseAdminSubscriptionsByUser(managedSubscriptions);
      const hiddenDuplicateSubscriptions = managedSubscriptions.length - visibleSubscriptions.length;
      const removedPeriodEndedSubscriptions = mappedRows.length - managedSubscriptions.length;
      const periodEnding7d = visibleSubscriptions.filter((subscription) => (
        subscription.daysUntilEnd !== null &&
        subscription.daysUntilEnd >= 0 &&
        subscription.daysUntilEnd <= 7
      )).length;
      const activeSubscriptions = visibleSubscriptions.filter((subscription) => (
        subscription.effectivePlan === "personal"
      )).length;

      response.json({
        ok: true,
        summary: {
          totalSubscriptions: visibleSubscriptions.length,
          activeSubscriptions,
          periodEnding7d,
          removedPeriodEndedSubscriptions,
          hiddenDuplicateSubscriptions,
          monthlyConfirmedRevenue: Number(revenueResult.rows[0]?.monthly_confirmed_revenue || 0),
          confirmedRevenue: Number(revenueResult.rows[0]?.confirmed_revenue || 0),
        },
        planStatusBreakdown: buildPlanBreakdown(visibleSubscriptions),
        duplicateSubscriptionCandidates: hiddenDuplicateSubscriptions,
        subscriptions: visibleSubscriptions,
      });
    } catch (error) {
      next(error);
    }
  });
});

router.post("/payments/:paymentId/refund-preview", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;

      const paymentId = String(request.params.paymentId || "").trim();
      if (!paymentId) {
        response.status(400).json({ ok: false, code: "PAYMENT_ID_REQUIRED", message: "검토할 결제 ID가 필요합니다." });
        return;
      }

      const result = await query(
        `SELECT payments.id,
                payments.user_id,
                users.email,
                payments.provider,
                payments.provider_payment_id,
                payments.provider_order_id,
                payments.amount,
                payments.currency,
                payments.status,
                payments.metadata,
                payments.paid_at,
                payments.created_at
           FROM payments
           JOIN users ON users.id = payments.user_id
          WHERE payments.id = $1
          LIMIT 1`,
        [paymentId]
      );
      const payment = result.rows[0];
      if (!payment) {
        response.status(404).json({ ok: false, code: "PAYMENT_NOT_FOUND", message: "결제 내역을 찾을 수 없습니다." });
        return;
      }

      const metadata = payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {};
      const paymentKey = payment.provider_payment_id || metadata.paymentKey || metadata.payment?.paymentKey || null;
      const alreadyCanceled = ["canceled", "cancelled", "refunded", "partially_refunded"].includes(String(payment.status || "").toLowerCase()) ||
        Array.isArray(metadata.cancels) && metadata.cancels.length > 0;

      response.json({
        ok: true,
        dryRun: true,
        refundExecutionEnabled: false,
        payment: {
          id: payment.id,
          userId: payment.user_id,
          email: payment.email,
          provider: payment.provider,
          providerOrderId: payment.provider_order_id || null,
          hasPaymentKey: Boolean(paymentKey),
          amount: Number(payment.amount || 0),
          currency: payment.currency || "KRW",
          status: payment.status,
          paidAt: payment.paid_at || payment.created_at || null,
        },
        review: {
          eligibleForOperatorReview: Boolean(paymentKey) && !alreadyCanceled,
          alreadyCanceled,
          requiredOperatorInputs: ["cancelReason", "Idempotency-Key"],
          optionalOperatorInputs: ["cancelAmount"],
          tossCancelApi: "POST /v1/payments/{paymentKey}/cancel",
          note: "이번 endpoint는 검토 전용이며 Toss 결제 취소 API를 호출하지 않습니다.",
        },
      });
    } catch (error) {
      next(error);
    }
  });
});

export default router;

import express from "express";

import { isDatabaseConfigured, query } from "../db/database.js";
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
import { requireAdminAccess } from "../middleware/adminGuard.js";

const router = express.Router();
const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "cancel_at_period_end"];

router.get("/health", (request, response) => {
  response.json({
    ok: true,
    route: "admin",
    databaseConfigured: isDatabaseConfigured(),
  });
});

function mapMemberRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    plan: row.plan || "free",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    activeSubscriptionCount: Number(row.active_subscription_count || 0),
    portfolioCount: Number(row.portfolio_count || 0),
    inquiryCount: Number(row.inquiry_count || 0),
  };
}

function mapSubscriptionRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    plan: row.plan || "free",
    status: row.status || "active",
    startedAt: row.started_at,
    currentPeriodEnd: row.current_period_end,
    canceledAt: row.canceled_at,
    latestPaymentAmount: row.latest_payment_amount === null ? null : Number(row.latest_payment_amount || 0),
    latestPaymentCurrency: row.latest_payment_currency || "KRW",
    latestPaymentStatus: row.latest_payment_status || null,
    latestPaymentAt: row.latest_payment_at || null,
  };
}

function requireDatabase(response) {
  if (isDatabaseConfigured()) return true;

  response.status(503).json({
    ok: false,
    message: "DATABASE_URL이 설정되어 있지 않습니다.",
  });
  return false;
}

router.get("/members", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;

      const activeStatuses = ACTIVE_SUBSCRIPTION_STATUSES;
      const [summaryResult, recentMembersResult, planResult] = await Promise.all([
        query(
          `WITH active_subscriptions AS (
             SELECT user_id, COUNT(*) AS active_subscription_count
               FROM subscriptions
              WHERE status = ANY($1)
              GROUP BY user_id
           ),
           education_users AS (
             SELECT user_id
               FROM education_accounts
           )
           SELECT
             COUNT(*)::int AS total_members,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_members_30d,
             COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '30 days')::int AS active_members_30d,
             COUNT(*) FILTER (WHERE education_users.user_id IS NOT NULL)::int AS education_members,
             COUNT(*) FILTER (
               WHERE education_users.user_id IS NULL
                 AND (
                   COALESCE(plan, 'free') <> 'free'
                   OR COALESCE(active_subscription_count, 0) > 0
                 )
            )::int AS subscriber_members
            FROM users
            LEFT JOIN active_subscriptions ON active_subscriptions.user_id = users.id
            LEFT JOIN education_users ON education_users.user_id = users.id
           WHERE education_users.user_id IS NULL`,
          [activeStatuses]
        ),
        query(
          `WITH active_subscriptions AS (
             SELECT user_id, COUNT(*) AS active_subscription_count
               FROM subscriptions
              WHERE status = ANY($1)
              GROUP BY user_id
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
             users.plan,
             users.created_at,
             users.updated_at,
             users.last_login_at,
             COALESCE(active_subscriptions.active_subscription_count, 0) AS active_subscription_count,
             COALESCE(portfolio_counts.portfolio_count, 0) AS portfolio_count,
             COALESCE(inquiry_counts.inquiry_count, 0) AS inquiry_count
            FROM users
            LEFT JOIN active_subscriptions ON active_subscriptions.user_id = users.id
            LEFT JOIN portfolio_counts ON portfolio_counts.user_id = users.id
            LEFT JOIN inquiry_counts ON inquiry_counts.user_id = users.id
            LEFT JOIN education_users ON education_users.user_id = users.id
           WHERE education_users.user_id IS NULL
            ORDER BY users.created_at DESC
            LIMIT 50`,
          [activeStatuses]
        ),
        query(
          `SELECT COALESCE(plan, 'free') AS plan, COUNT(*)::int AS members
             FROM users
            WHERE NOT EXISTS (
              SELECT 1
                FROM education_accounts
               WHERE education_accounts.user_id = users.id
            )
            GROUP BY COALESCE(plan, 'free')
            ORDER BY members DESC, plan ASC`
        ),
      ]);

      const summary = summaryResult.rows[0] || {};
      response.json({
        ok: true,
        summary: {
          totalMembers: Number(summary.total_members || 0),
          newMembers30d: Number(summary.new_members_30d || 0),
          activeMembers30d: Number(summary.active_members_30d || 0),
          subscriberMembers: Number(summary.subscriber_members || 0),
          educationMembers: Number(summary.education_members || 0),
        },
        planBreakdown: planResult.rows.map((row) => ({
          plan: row.plan || "free",
          members: Number(row.members || 0),
        })),
        members: recentMembersResult.rows.map(mapMemberRow),
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

      const activeStatuses = ACTIVE_SUBSCRIPTION_STATUSES;
      const [summaryResult, planStatusResult, subscriptionsResult] = await Promise.all([
        query(
          `SELECT
             (SELECT COUNT(*) FROM subscriptions)::int AS total_subscriptions,
             (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = ANY($1))::int AS active_subscriptions,
             (SELECT COUNT(*)
                FROM subscriptions
               WHERE current_period_end IS NOT NULL
                 AND current_period_end >= NOW()
                 AND current_period_end < NOW() + INTERVAL '7 days')::int AS period_ending_7d,
             (SELECT COALESCE(SUM(amount), 0)
                FROM payments
               WHERE status = 'confirmed')::numeric AS confirmed_revenue`,
          [activeStatuses]
        ),
        query(
          `SELECT
             subscriptions.plan,
             subscriptions.status,
             COUNT(*)::int AS subscriptions
            FROM subscriptions
            GROUP BY subscriptions.plan, subscriptions.status
            ORDER BY subscriptions DESC, subscriptions.plan ASC, subscriptions.status ASC`
        ),
        query(
          `WITH latest_payments AS (
             SELECT DISTINCT ON (user_id)
               user_id,
               amount,
               currency,
               status,
               COALESCE(paid_at, created_at) AS latest_payment_at
              FROM payments
              ORDER BY user_id, COALESCE(paid_at, created_at) DESC
           )
           SELECT
             subscriptions.id,
             subscriptions.user_id,
             users.email,
             users.name,
             subscriptions.plan,
             subscriptions.status,
             subscriptions.started_at,
             subscriptions.current_period_end,
             subscriptions.canceled_at,
             latest_payments.amount AS latest_payment_amount,
             latest_payments.currency AS latest_payment_currency,
             latest_payments.status AS latest_payment_status,
             latest_payments.latest_payment_at
            FROM subscriptions
            JOIN users ON users.id = subscriptions.user_id
            LEFT JOIN latest_payments ON latest_payments.user_id = subscriptions.user_id
            ORDER BY COALESCE(subscriptions.current_period_end, subscriptions.started_at) DESC
            LIMIT 50`
        ),
      ]);

      const summary = summaryResult.rows[0] || {};
      response.json({
        ok: true,
        summary: {
          totalSubscriptions: Number(summary.total_subscriptions || 0),
          activeSubscriptions: Number(summary.active_subscriptions || 0),
          periodEnding7d: Number(summary.period_ending_7d || 0),
          confirmedRevenue: Number(summary.confirmed_revenue || 0),
        },
        planStatusBreakdown: planStatusResult.rows.map((row) => ({
          plan: row.plan || "free",
          status: row.status || "active",
          subscriptions: Number(row.subscriptions || 0),
        })),
        subscriptions: subscriptionsResult.rows.map(mapSubscriptionRow),
      });
    } catch (error) {
      next(error);
    }
  });
});

export default router;

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
import { getAiAnalysisUsageAdminSummary } from "../services/aiAnalysisUsageRepository.js";
import {
  buildPlanBreakdown,
  mapAdminMemberRow,
  mapAdminSubscriptionRow,
  shouldKeepAdminSubscriptionRow,
} from "../services/adminSubscriptionEffectiveStatus.js";

const router = express.Router();

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

router.get("/members", (request, response, next) => {
  requireAdminAccess(request, response, async () => {
    try {
      if (!requireDatabase(response)) return;

      const [membersResult, educationMembersResult] = await Promise.all([
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
            ORDER BY users.created_at DESC`
        ),
        query(
          `SELECT COUNT(DISTINCT user_id)::int AS education_members
             FROM education_accounts`
        ),
      ]);

      const now = new Date();
      const members = membersResult.rows.map((row) => mapAdminMemberRow(row, now));
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
          `SELECT COALESCE(SUM(amount), 0)::numeric AS confirmed_revenue
             FROM payments
            WHERE status = 'confirmed'`
        ),
      ]);

      const now = new Date();
      const mappedRows = subscriptionsResult.rows.map((row) => mapAdminSubscriptionRow(row, now));
      const managedSubscriptions = mappedRows.filter((row, index) => (
        shouldKeepAdminSubscriptionRow(subscriptionsResult.rows[index], now)
      ));
      const removedPeriodEndedSubscriptions = mappedRows.length - managedSubscriptions.length;
      const periodEnding7d = managedSubscriptions.filter((subscription) => (
        subscription.daysUntilEnd !== null &&
        subscription.daysUntilEnd >= 0 &&
        subscription.daysUntilEnd <= 7
      )).length;
      const activeSubscriptions = managedSubscriptions.filter((subscription) => (
        subscription.effectivePlan === "personal"
      )).length;

      response.json({
        ok: true,
        summary: {
          totalSubscriptions: managedSubscriptions.length,
          activeSubscriptions,
          periodEnding7d,
          removedPeriodEndedSubscriptions,
          confirmedRevenue: Number(revenueResult.rows[0]?.confirmed_revenue || 0),
        },
        planStatusBreakdown: buildPlanBreakdown(managedSubscriptions),
        subscriptions: managedSubscriptions,
      });
    } catch (error) {
      next(error);
    }
  });
});

export default router;

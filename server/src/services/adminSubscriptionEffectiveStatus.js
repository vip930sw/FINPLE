import { getEffectiveSubscriptionState } from "./subscriptionEffectiveStatus.js";

const REMOVED_ADMIN_SUBSCRIPTION_STATUSES = new Set(["superseded"]);
const DAY_MS = 86400000;

function normalizeStatus(status) {
  return String(status || "beta_free").toLowerCase();
}

function parseTime(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getNowMs(now = new Date()) {
  const timestamp = now instanceof Date ? now.getTime() : Date.parse(now);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function getSubscriptionFromRow(row = {}) {
  if (!row.subscription_id && !row.id) return null;

  return {
    id: row.subscription_id || row.id,
    plan: row.subscription_plan || row.plan,
    status: row.subscription_status || row.status,
    current_period_start: row.current_period_start || row.started_at || row.startedAt,
    currentPeriodStart: row.currentPeriodStart,
    current_period_end: row.current_period_end || row.currentPeriodEnd,
    currentPeriodEnd: row.currentPeriodEnd,
    cancel_at_period_end: row.cancel_at_period_end || row.cancelAtPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}

function getEntitlementFromRow(row = {}) {
  if (!row.entitlement_plan && !row.entitlement_valid_until && !row.valid_until) return null;

  return {
    plan: row.entitlement_plan,
    valid_until: row.entitlement_valid_until || row.valid_until,
    validUntil: row.entitlementValidUntil,
  };
}

export function getAdminSubscriptionEffectiveState(row = {}, now = new Date()) {
  return getEffectiveSubscriptionState({
    user: { plan: row.user_plan || row.users_plan || row.plan || "free" },
    subscription: getSubscriptionFromRow(row),
    entitlement: getEntitlementFromRow(row),
    now,
  });
}

export function isAdminSubscriptionRowPeriodEnded(row = {}, now = new Date()) {
  const currentPeriodEnd = row.current_period_end || row.currentPeriodEnd;
  const periodEndMs = parseTime(currentPeriodEnd);
  return periodEndMs !== null && periodEndMs <= getNowMs(now);
}

export function shouldKeepAdminSubscriptionRow(row = {}, now = new Date()) {
  const status = normalizeStatus(row.subscription_status || row.status);
  if (REMOVED_ADMIN_SUBSCRIPTION_STATUSES.has(status)) return false;
  return !isAdminSubscriptionRowPeriodEnded(row, now);
}

export function mapAdminMemberRow(row = {}, now = new Date()) {
  const effective = getAdminSubscriptionEffectiveState(row, now);

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    plan: effective.effectivePlan || effective.plan || "free",
    effectivePlan: effective.effectivePlan || effective.plan || "free",
    billingStatus: effective.effectiveStatus || effective.status || "beta_free",
    rawPlan: row.user_plan || row.plan || "free",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    activeSubscriptionCount: effective.effectivePlan === "personal" ? 1 : 0,
    mbtiNickname: row.mbti_nickname || row.mbtiNickname || null,
    portfolioCount: Number(row.portfolio_count || 0),
    inquiryCount: Number(row.inquiry_count || 0),
  };
}

export function mapAdminSubscriptionRow(row = {}, now = new Date()) {
  const effective = getAdminSubscriptionEffectiveState(row, now);
  const currentPeriodEnd = row.current_period_end || row.currentPeriodEnd || null;
  const currentPeriodStart = row.current_period_start || row.started_at || row.startedAt || null;
  const periodEndMs = parseTime(currentPeriodEnd);
  const nowMs = getNowMs(now);

  return {
    id: row.subscription_id || row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    plan: effective.effectivePlan || effective.plan || "free",
    status: effective.effectiveStatus || effective.status || "beta_free",
    effectivePlan: effective.effectivePlan || effective.plan || "free",
    effectiveStatus: effective.effectiveStatus || effective.status || "beta_free",
    rawPlan: row.subscription_plan || row.plan || "free",
    rawStatus: row.subscription_status || row.status || "active",
    startedAt: currentPeriodStart,
    currentPeriodEnd,
    canceledAt: row.canceled_at,
    daysUntilEnd: periodEndMs === null ? null : Math.ceil((periodEndMs - nowMs) / DAY_MS),
    latestPaymentAmount: row.latest_payment_amount === null ? null : Number(row.latest_payment_amount || 0),
    latestPaymentId: row.latest_payment_id || null,
    latestPaymentCurrency: row.latest_payment_currency || "KRW",
    latestPaymentStatus: row.latest_payment_status || null,
    latestPaymentAt: row.latest_payment_at || null,
  };
}

export function buildPlanBreakdown(rows = []) {
  const counts = new Map();

  rows.forEach((row) => {
    const plan = row.effectivePlan || row.plan || "free";
    const status = row.effectiveStatus || row.status || "beta_free";
    const key = `${plan}:${status}`;
    counts.set(key, {
      plan,
      status,
      subscriptions: (counts.get(key)?.subscriptions || 0) + 1,
    });
  });

  return Array.from(counts.values()).sort((a, b) => (
    b.subscriptions - a.subscriptions ||
    a.plan.localeCompare(b.plan) ||
    a.status.localeCompare(b.status)
  ));
}

export function collapseAdminSubscriptionsByUser(rows = []) {
  const subscriptionsByUser = new Map();

  rows.forEach((subscription) => {
    const key = subscription.userId || subscription.email || subscription.id;
    if (!subscriptionsByUser.has(key)) subscriptionsByUser.set(key, []);
    subscriptionsByUser.get(key).push(subscription);
  });

  return Array.from(subscriptionsByUser.values()).map((group) => {
    const [primary, ...duplicates] = group;
    return {
      ...primary,
      duplicateSubscriptionCount: duplicates.length,
      duplicateSubscriptionIds: duplicates.map((duplicate) => duplicate.id).filter(Boolean),
    };
  });
}

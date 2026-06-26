import { createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";

const DEFAULT_LIMIT = 20;
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;
const usageBuckets = new Map();

function toPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function normalizeIp(value = "") {
  return String(value || "")
    .split(",")[0]
    .trim()
    .replace(/[^a-zA-Z0-9:._-]/g, "-") || "unknown";
}

function getRequestIp(request) {
  return normalizeIp(
    request.get?.("x-forwarded-for") ||
      request.get?.("x-real-ip") ||
      request.ip ||
      request.socket?.remoteAddress ||
      "unknown"
  );
}

function getLimitForUser(user) {
  const plan = String(user?.plan || "guest").trim().toLowerCase();
  const envKey =
    plan === "personal" || plan === "pro"
      ? "FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW"
      : "FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW";

  return toPositiveInteger(process.env[envKey], DEFAULT_LIMIT);
}

function getWindowMs() {
  return toPositiveInteger(process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);
}

function getBucketKey({ request, user }) {
  if (user?.id) return `user:${user.id}`;
  return `ip:${getRequestIp(request)}`;
}

function pruneExpiredBuckets(now = Date.now()) {
  for (const [key, bucket] of usageBuckets.entries()) {
    if (!bucket || bucket.resetAt <= now) usageBuckets.delete(key);
  }
}

export function assertAiAnalysisUsageAllowed({ request, user, now = Date.now() }) {
  const reservation = reserveAiAnalysisUsage({ request, user, now });
  reservation.commit();
  return reservation;
}

export function reserveAiAnalysisUsage({ request, user, now = Date.now() }) {
  if (String(process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED || "").toLowerCase() === "true") {
    return {
      limited: false,
      remaining: null,
      resetAt: null,
      key: "disabled",
      reserved: false,
      committed: true,
      canceled: false,
      commit() {
        return this;
      },
      cancel() {
        return this;
      },
    };
  }

  pruneExpiredBuckets(now);

  const limit = getLimitForUser(user);
  const windowMs = getWindowMs();
  const key = getBucketKey({ request, user });
  const existing = usageBuckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

  if (bucket.count >= limit) {
    const error = createHttpError(429, "AI analysis usage limit reached.", [
      `limit=${limit}`,
      `resetAt=${new Date(bucket.resetAt).toISOString()}`,
    ]);
    error.usage = { limit, remaining: 0, resetAt: bucket.resetAt, key };
    throw error;
  }

  bucket.count += 1;
  usageBuckets.set(key, bucket);

  let committed = false;
  let canceled = false;

  return {
    limited: true,
    limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt,
    key,
    reserved: true,
    get committed() {
      return committed;
    },
    get canceled() {
      return canceled;
    },
    commit() {
      if (!canceled) committed = true;
      return this;
    },
    cancel() {
      if (committed || canceled) return this;

      const current = usageBuckets.get(key);
      if (current === bucket && current.count > 0) {
        current.count -= 1;
        this.remaining = Math.max(limit - current.count, 0);
        if (current.count <= 0) usageBuckets.delete(key);
      }
      canceled = true;
      return this;
    },
  };
}

export function resetAiAnalysisUsageBuckets() {
  usageBuckets.clear();
}

import { randomUUID } from "node:crypto";

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRequestId(request) {
  const incoming = String(request.get?.("x-request-id") || "").trim();
  if (/^[A-Za-z0-9._:-]{8,128}$/.test(incoming)) return incoming;
  return randomUUID();
}

function getClientIp(request) {
  return String(request.ip || request.socket?.remoteAddress || "unknown").trim() || "unknown";
}

export function requestContextMiddleware(request, response, next) {
  const requestId = getRequestId(request);
  request.requestId = requestId;
  request.requestStartedAt = process.hrtime.bigint();
  response.setHeader("X-Request-ID", requestId);
  next();
}

export function requestTimingMiddleware(request, response, next) {
  response.on("finish", () => {
    const startedAt = request.requestStartedAt || process.hrtime.bigint();
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const slowThresholdMs = positiveNumber(process.env.FINPLE_SLOW_REQUEST_MS, 1500);
    const logAll = String(process.env.FINPLE_HTTP_LOG_ALL || "false").toLowerCase() === "true";
    const shouldLog = logAll || response.statusCode >= 400 || durationMs >= slowThresholdMs;

    if (!shouldLog) return;

    const payload = {
      type: "http_request",
      requestId: request.requestId || null,
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      ip: getClientIp(request),
      userAgent: String(request.get?.("user-agent") || "").slice(0, 180),
    };

    const writer = response.statusCode >= 500 ? console.error : response.statusCode >= 400 ? console.warn : console.info;
    writer(JSON.stringify(payload));
  });

  next();
}

export function createIpRateLimiter({
  windowMs = 10 * 60 * 1000,
  max = 60,
  keyPrefix = "default",
  message = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
} = {}) {
  const safeWindowMs = positiveNumber(windowMs, 10 * 60 * 1000);
  const safeMax = Math.max(1, Math.floor(positiveNumber(max, 60)));
  const buckets = new Map();

  return function ipRateLimiter(request, response, next) {
    if (request.method === "OPTIONS") {
      next();
      return;
    }

    const now = Date.now();
    const key = `${keyPrefix}:${getClientIp(request)}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + safeWindowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (buckets.size > 5000) {
      for (const [bucketKey, value] of buckets.entries()) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    const remaining = Math.max(0, safeMax - bucket.count);
    response.setHeader("RateLimit-Limit", String(safeMax));
    response.setHeader("RateLimit-Remaining", String(remaining));
    response.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count <= safeMax) {
      next();
      return;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    response.setHeader("Retry-After", String(retryAfterSeconds));
    response.status(429).json({
      ok: false,
      code: "RATE_LIMITED",
      message,
      retryAfterSeconds,
      requestId: request.requestId || null,
    });
  };
}

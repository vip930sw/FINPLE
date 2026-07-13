# FINPLE Step239 Auth Backend Stability

## Scope

This step improves public authentication reliability without changing UI/CSS, account schema, payment behavior, portfolio calculations, trading readiness, provider credentials, or order capability.

## Runtime changes

- Adds lightweight liveness: `GET /api/health/live`
- Adds DB-backed readiness: `GET /api/health/ready`
- Keeps legacy `GET /api/health` for compatibility
- Returns HTTP 503 from `/api/db/health` when PostgreSQL is unavailable
- Adds PostgreSQL connection, statement, query, and idle-transaction timeouts
- Adds request IDs and slow/error request timing logs
- Adds IP-based auth and login rate limits
- Sets Express `trust proxy = 1` for Render proxy-aware client IP handling
- Moves email-password PBKDF2 verification outside the DB transaction
- Adds frontend auth request timeout handling
- Extends OAuth cold-start wake-up from one 9-second attempt to five 12-second attempts

## Recommended Render health check

Set the Render HTTP health check path to:

```text
/api/health/ready
```

Use `/api/health/live` only for external uptime monitoring or process-only checks. Readiness includes a database query and returns `503` when the application cannot serve authenticated requests.

## Optional environment variables

Defaults are safe for the current single-instance beta deployment. Add only when tuning is required.

```env
DATABASE_POOL_MAX=10
DATABASE_IDLE_TIMEOUT_MS=30000
DATABASE_CONNECTION_TIMEOUT_MS=8000
DATABASE_STATEMENT_TIMEOUT_MS=12000
DATABASE_QUERY_TIMEOUT_MS=15000
DATABASE_IDLE_TRANSACTION_TIMEOUT_MS=15000
DATABASE_HEALTH_TIMEOUT_MS=4500
FINPLE_READINESS_DB_TIMEOUT_MS=4500

FINPLE_AUTH_LOGIN_RATE_WINDOW_MS=600000
FINPLE_AUTH_LOGIN_RATE_MAX=15
FINPLE_AUTH_RATE_WINDOW_MS=600000
FINPLE_AUTH_RATE_MAX=120

FINPLE_SLOW_REQUEST_MS=1500
FINPLE_HTTP_LOG_ALL=false
```

## Deployment verification

After Render redeploy:

```text
1. GET /api/health/live returns 200 quickly.
2. GET /api/health/ready returns 200 and database.ok=true.
3. GET /api/db/health returns 200 when DB is healthy and 503 when unhealthy.
4. Email login succeeds and the response includes X-Request-ID.
5. Google/Kakao login waits through a cold start instead of failing after 9 seconds.
6. Render logs show structured http_request entries for slow or failed requests.
7. Repeated failed login requests eventually return 429 with Retry-After.
```

## Rollback boundary

If authentication regresses, revert this step as one unit. No DB migration is required. Existing sessions, users, subscriptions, portfolio records, and payment records are not transformed.

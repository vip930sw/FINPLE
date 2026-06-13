import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";

import { withTransaction } from "./database.js";

const NAVER_AUTH_BASE_URL = "https://nid.naver.com/oauth2.0/authorize";
const NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
const NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";
const SESSION_DAYS = Number(process.env.FINPLE_SESSION_DAYS || 30);
const NAVER_PROVIDER = "naver";

function getRequiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    const error = new Error(`${name} 환경변수가 필요합니다.`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

function getAppBaseUrl() {
  return (
    process.env.FINPLE_APP_BASE_URL ||
    process.env.FRONTEND_ORIGIN ||
    String(process.env.CORS_ORIGIN || "").split(",")[0]?.trim() ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
}

function getNaverClientId() {
  return getRequiredEnv("NAVER_CLIENT_ID");
}

function getNaverClientSecret() {
  return getRequiredEnv("NAVER_CLIENT_SECRET");
}

function getNaverRedirectUri() {
  return getRequiredEnv("NAVER_OAUTH_REDIRECT_URI");
}

function getStateSecret() {
  return process.env.NAVER_OAUTH_STATE_SECRET || process.env.NAVER_CLIENT_SECRET || "finple-naver-oauth-dev-state";
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseBase64UrlJson(value) {
  return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
}

function signState(payloadText) {
  return createHmac("sha256", getStateSecret()).update(payloadText).digest("base64url");
}

function createOAuthState() {
  const payload = base64UrlJson({
    provider: NAVER_PROVIDER,
    nonce: randomBytes(16).toString("base64url"),
    createdAt: Date.now(),
  });
  return `${payload}.${signState(payload)}`;
}

function verifyOAuthState(state) {
  const [payload, signature] = String(state || "").split(".");
  if (!payload || !signature || signState(payload) !== signature) {
    const error = new Error("네이버 로그인 상태값이 유효하지 않습니다.");
    error.statusCode = 400;
    throw error;
  }

  const parsed = parseBase64UrlJson(payload);
  if (!parsed?.createdAt || Date.now() - Number(parsed.createdAt) > 10 * 60 * 1000) {
    const error = new Error("네이버 로그인 요청이 만료되었습니다. 다시 시도해 주세요.");
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    plan: row.plan || "free",
    authStatus: row.auth_status || "active",
    emailVerifiedAt: row.email_verified_at,
    isEmailVerified: Boolean(row.email_verified_at),
    emailVerificationRequired: row.auth_status === "pending_email_verification" || !row.email_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

function hashSessionToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function getSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

async function createSession(tx, userId, requestMeta = {}) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiry();

  await tx(
    `INSERT INTO user_sessions (
       id, user_id, refresh_token_hash, user_agent, ip_address, expires_at
     )
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), userId, tokenHash, requestMeta.userAgent || null, requestMeta.ipAddress || null, expiresAt]
  );

  return { token, expiresAt: expiresAt.toISOString() };
}

async function ensureDefaultEntitlement(tx, userId, plan = "free") {
  await tx(
    `INSERT INTO user_entitlements (
       user_id, plan, portfolio_limit, assets_per_portfolio_limit,
       server_storage_enabled, api_lookup_limit_per_day, pdf_report_enabled,
       report_level, screener_level, support_level, source
     )
     SELECT $1, ent.plan, ent.portfolio_limit, ent.assets_per_portfolio_limit,
       ent.server_storage_enabled, ent.api_lookup_limit_per_day, ent.pdf_report_enabled,
       ent.report_level, ent.screener_level, ent.support_level, 'naver-oauth'
     FROM plan_entitlements ent
     WHERE ent.plan = $2
     ON CONFLICT (user_id) DO UPDATE SET
       plan = EXCLUDED.plan,
       portfolio_limit = EXCLUDED.portfolio_limit,
       assets_per_portfolio_limit = EXCLUDED.assets_per_portfolio_limit,
       server_storage_enabled = EXCLUDED.server_storage_enabled,
       api_lookup_limit_per_day = EXCLUDED.api_lookup_limit_per_day,
       pdf_report_enabled = EXCLUDED.pdf_report_enabled,
       report_level = EXCLUDED.report_level,
       screener_level = EXCLUDED.screener_level,
       support_level = EXCLUDED.support_level,
       updated_at = NOW()
     WHERE user_entitlements.source <> 'education'`,
    [userId, plan]
  );
}

export function buildNaverOAuthUrl() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getNaverClientId(),
    redirect_uri: getNaverRedirectUri(),
    state: createOAuthState(),
  });

  return `${NAVER_AUTH_BASE_URL}?${params.toString()}`;
}

async function exchangeNaverCodeForToken({ code, state }) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: getNaverClientId(),
    client_secret: getNaverClientSecret(),
    code,
    state,
  });

  const response = await fetch(`${NAVER_TOKEN_URL}?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    const error = new Error(payload?.error_description || payload?.error || "네이버 인증 토큰을 확인하지 못했습니다.");
    error.statusCode = 502;
    throw error;
  }

  return payload;
}

async function fetchNaverProfile(accessToken) {
  const response = await fetch(NAVER_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await response.json().catch(() => null);
  const profile = payload?.response || null;
  if (!response.ok || payload?.resultcode !== "00" || !profile?.id) {
    const error = new Error(payload?.message || "네이버 사용자 정보를 확인하지 못했습니다.");
    error.statusCode = 502;
    throw error;
  }

  if (!profile.email) {
    const error = new Error("네이버 계정의 이메일 제공 동의가 필요합니다.");
    error.statusCode = 403;
    throw error;
  }

  return profile;
}

function makeOAuthRedirectPayload(result) {
  return Buffer.from(JSON.stringify({
    authMode: "naver-oauth",
    user: result.user,
    session: result.session,
  })).toString("base64url");
}

export function buildNaverOAuthSuccessRedirect(result) {
  const payload = makeOAuthRedirectPayload(result);
  return `${getAppBaseUrl()}/login#finpleOAuth=${encodeURIComponent(payload)}`;
}

export function buildNaverOAuthFailureRedirect(message) {
  const params = new URLSearchParams({ oauthError: message || "네이버 로그인에 실패했습니다." });
  return `${getAppBaseUrl()}/login?${params.toString()}`;
}

export async function completeNaverOAuthLogin({ code, state, error, error_description }, requestMeta = {}) {
  if (error) {
    const authError = new Error(error_description || "네이버 로그인이 취소되었거나 실패했습니다.");
    authError.statusCode = 400;
    throw authError;
  }

  if (!code) {
    const codeError = new Error("네이버 인증 코드가 없습니다.");
    codeError.statusCode = 400;
    throw codeError;
  }

  verifyOAuthState(state);

  const tokenPayload = await exchangeNaverCodeForToken({ code, state });
  const profile = await fetchNaverProfile(tokenPayload.access_token);
  const email = normalizeEmail(profile.email);
  const displayName = String(profile.name || profile.nickname || email.split("@")[0] || "네이버 사용자").slice(0, 80);
  const nickname = String(profile.nickname || profile.name || email.split("@")[0] || "naver-user").slice(0, 80);

  return withTransaction(async (tx) => {
    const linkedResult = await tx(
      `SELECT users.id, users.email, users.name, users.nickname, users.plan,
              users.auth_status, users.email_verified_at, users.created_at,
              users.updated_at, users.last_login_at
       FROM oauth_accounts
       JOIN users ON users.id = oauth_accounts.user_id
       WHERE oauth_accounts.provider = $1
         AND oauth_accounts.provider_user_id = $2
       LIMIT 1`,
      [NAVER_PROVIDER, profile.id]
    );

    let user = mapUser(linkedResult.rows[0]);

    if (!user) {
      const existingUserResult = await tx(
        `SELECT id, email, name, nickname, plan, auth_status, email_verified_at, created_at, updated_at, last_login_at
         FROM users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [email]
      );
      user = mapUser(existingUserResult.rows[0]);
    }

    if (!user) {
      const userId = randomUUID();
      const createdUserResult = await tx(
        `INSERT INTO users (id, email, name, nickname, plan, auth_status, email_verified_at)
         VALUES ($1, $2, $3, $4, 'free', 'active', NOW())
         RETURNING id, email, name, nickname, plan, auth_status, email_verified_at, created_at, updated_at, last_login_at`,
        [userId, email, displayName, nickname]
      );
      user = mapUser(createdUserResult.rows[0]);
      await ensureDefaultEntitlement(tx, user.id, "free");
    } else if (!user.emailVerifiedAt || user.authStatus !== "active") {
      const updatedUserResult = await tx(
        `UPDATE users
         SET email_verified_at = COALESCE(email_verified_at, NOW()),
             auth_status = 'active',
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, name, nickname, plan, auth_status, email_verified_at, created_at, updated_at, last_login_at`,
        [user.id]
      );
      user = mapUser(updatedUserResult.rows[0]);
    }

    await tx(
      `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, email, profile, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
       ON CONFLICT (provider, provider_user_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         email = EXCLUDED.email,
         profile = EXCLUDED.profile,
         last_login_at = NOW()`,
      [randomUUID(), user.id, NAVER_PROVIDER, profile.id, email, JSON.stringify(profile)]
    );

    await tx("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [user.id]);
    await ensureDefaultEntitlement(tx, user.id, user.plan || "free");
    const session = await createSession(tx, user.id, requestMeta);

    return { user: { ...user, lastLoginAt: new Date().toISOString() }, session };
  });
}

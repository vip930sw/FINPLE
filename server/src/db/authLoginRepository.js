/* global Buffer, process */
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { query, withTransaction } from "./database.js";
import { verifyPassword } from "./authRepository.js";

const SESSION_DAYS = Number(process.env.FINPLE_SESSION_DAYS || 30);
const DELETED_AUTH_STATUSES = new Set(["admin_deleted", "deleted", "withdrawn"]);

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function assertEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@") || normalized.length > 254) {
    const error = new Error("올바른 이메일 주소를 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

function assertPassword(password) {
  const raw = String(password || "");
  if (raw.length < 8) {
    const error = new Error("비밀번호는 8자 이상으로 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  if (raw.length > 128) {
    const error = new Error("비밀번호가 너무 깁니다.");
    error.statusCode = 400;
    throw error;
  }
  return raw;
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

function isDeletedAuthStatus(status) {
  return DELETED_AUTH_STATUSES.has(String(status || "").trim().toLowerCase());
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

async function ensureDefaultEntitlement(tx, userId, plan = "free") {
  await tx(
    `INSERT INTO user_entitlements (
       user_id, plan, portfolio_limit, assets_per_portfolio_limit,
       server_storage_enabled, api_lookup_limit_per_day, pdf_report_enabled,
       report_level, screener_level, support_level, source
     )
     SELECT $1, ent.plan, ent.portfolio_limit, ent.assets_per_portfolio_limit,
       ent.server_storage_enabled, ent.api_lookup_limit_per_day, ent.pdf_report_enabled,
       ent.report_level, ent.screener_level, ent.support_level, 'auth'
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
       source = EXCLUDED.source,
       updated_at = NOW()
     WHERE user_entitlements.source <> 'education'`,
    [userId, plan]
  );
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
    [
      randomUUID(),
      userId,
      tokenHash,
      requestMeta.userAgent || null,
      requestMeta.ipAddress || null,
      expiresAt,
    ]
  );

  return { token, expiresAt: expiresAt.toISOString() };
}

async function recordFailedLogin(userId) {
  await query(
    `UPDATE auth_credentials
     SET failed_login_count = failed_login_count + 1,
         locked_until = CASE
           WHEN failed_login_count + 1 >= 5 THEN NOW() + INTERVAL '10 minutes'
           ELSE locked_until
         END,
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
}

export async function loginWithEmailStable(input = {}, requestMeta = {}) {
  const email = assertEmail(input.email);
  const password = assertPassword(input.password);

  const result = await query(
    `SELECT users.id, users.email, users.name, users.nickname, users.plan,
            users.auth_status, users.email_verified_at, users.created_at,
            users.updated_at, users.last_login_at,
            auth_credentials.password_hash, auth_credentials.locked_until
     FROM users
     JOIN auth_credentials ON auth_credentials.user_id = users.id
     WHERE LOWER(users.email) = LOWER($1)
     LIMIT 1`,
    [email]
  );

  const row = result.rows[0];
  if (!row || isDeletedAuthStatus(row.auth_status)) {
    const error = new Error("이메일 또는 비밀번호를 확인해 주세요.");
    error.statusCode = 401;
    throw error;
  }

  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    const error = new Error("로그인 시도가 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.");
    error.statusCode = 423;
    throw error;
  }

  // PBKDF2 검증은 DB transaction 밖에서 수행해 pool connection 점유 시간을 줄입니다.
  const isValid = await verifyPassword(password, row.password_hash);
  if (!isValid) {
    await recordFailedLogin(row.id);
    const error = new Error("이메일 또는 비밀번호를 확인해 주세요.");
    error.statusCode = 401;
    throw error;
  }

  if (row.auth_status === "pending_email_verification" || !row.email_verified_at) {
    const error = new Error("이메일 인증이 필요합니다. 가입 시 입력한 이메일의 인증 링크를 확인해 주세요.");
    error.statusCode = 403;
    error.code = "EMAIL_VERIFICATION_REQUIRED";
    throw error;
  }

  const session = await withTransaction(async (tx) => {
    await tx(
      `UPDATE auth_credentials
       SET failed_login_count = 0, locked_until = NULL, updated_at = NOW()
       WHERE user_id = $1`,
      [row.id]
    );
    await tx("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [row.id]);
    await ensureDefaultEntitlement(tx, row.id, row.plan || "free");
    return createSession(tx, row.id, requestMeta);
  });

  return {
    user: mapUser({ ...row, last_login_at: new Date().toISOString() }),
    session,
  };
}

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { query, withTransaction } from "./database.js";

const pbkdf2Async = promisify(randomBytes.constructor.prototype.constructor("return require('node:crypto').pbkdf2")());
const PASSWORD_HASH_ITERATIONS = Number(process.env.FINPLE_PASSWORD_HASH_ITERATIONS || 210000);
const PASSWORD_HASH_KEYLEN = 32;
const PASSWORD_HASH_DIGEST = "sha256";
const SESSION_DAYS = Number(process.env.FINPLE_SESSION_DAYS || 30);

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

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await pbkdf2Async(
    password,
    salt,
    PASSWORD_HASH_ITERATIONS,
    PASSWORD_HASH_KEYLEN,
    PASSWORD_HASH_DIGEST
  );
  return `pbkdf2$${PASSWORD_HASH_DIGEST}$${PASSWORD_HASH_ITERATIONS}$${salt}$${derived.toString("base64url")}`;
}

async function verifyPassword(password, storedHash = "") {
  const parts = String(storedHash || "").split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2") return false;

  const [, digest, iterationsText, salt, expectedText] = parts;
  const iterations = Number(iterationsText);
  const expected = Buffer.from(expectedText, "base64url");
  const actual = await pbkdf2Async(password, salt, iterations, expected.length, digest);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

async function getUserByEmail(email) {
  const result = await query(
    `SELECT id, email, name, nickname, plan, auth_status, email_verified_at, created_at, updated_at, last_login_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );
  return mapUser(result.rows[0]);
}

async function getUserById(userId) {
  const result = await query(
    `SELECT id, email, name, nickname, plan, auth_status, email_verified_at, created_at, updated_at, last_login_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  return mapUser(result.rows[0]);
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
       updated_at = NOW()`,
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

export async function signupWithEmail(input = {}, requestMeta = {}) {
  const email = assertEmail(input.email);
  const password = assertPassword(input.password);
  const name = String(input.name || input.nickname || "FINPLE 사용자").trim().slice(0, 80) || "FINPLE 사용자";
  const nickname = String(input.nickname || name).trim().slice(0, 80) || name;
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();

  return withTransaction(async (tx) => {
    const existing = await tx("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
    if (existing.rowCount > 0) {
      const error = new Error("이미 가입된 이메일입니다. 로그인해 주세요.");
      error.statusCode = 409;
      throw error;
    }

    const userResult = await tx(
      `INSERT INTO users (
         id, email, name, nickname, plan, auth_status,
         privacy_accepted_at, terms_accepted_at, marketing_agreed_at, last_login_at
       )
       VALUES ($1, $2, $3, $4, 'free', 'active',
         CASE WHEN $5 THEN NOW() ELSE NULL END,
         CASE WHEN $6 THEN NOW() ELSE NULL END,
         CASE WHEN $7 THEN NOW() ELSE NULL END,
         NOW()
       )
       RETURNING id, email, name, nickname, plan, auth_status, email_verified_at, created_at, updated_at, last_login_at`,
      [
        userId,
        email,
        name,
        nickname,
        Boolean(input.privacyAccepted),
        Boolean(input.termsAccepted),
        Boolean(input.marketingAgreed),
      ]
    );

    await tx(
      `INSERT INTO auth_credentials (user_id, password_hash)
       VALUES ($1, $2)`,
      [userId, passwordHash]
    );

    await ensureDefaultEntitlement(tx, userId, "free");
    const session = await createSession(tx, userId, requestMeta);

    return { user: mapUser(userResult.rows[0]), session };
  });
}

export async function loginWithEmail(input = {}, requestMeta = {}) {
  const email = assertEmail(input.email);
  const password = assertPassword(input.password);

  return withTransaction(async (tx) => {
    const result = await tx(
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
    if (!row) {
      const error = new Error("이메일 또는 비밀번호를 확인해 주세요.");
      error.statusCode = 401;
      throw error;
    }

    if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
      const error = new Error("로그인 시도가 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.");
      error.statusCode = 423;
      throw error;
    }

    const isValid = await verifyPassword(password, row.password_hash);
    if (!isValid) {
      await tx(
        `UPDATE auth_credentials
         SET failed_login_count = failed_login_count + 1,
             locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN NOW() + INTERVAL '10 minutes' ELSE locked_until END,
             updated_at = NOW()
         WHERE user_id = $1`,
        [row.id]
      );
      const error = new Error("이메일 또는 비밀번호를 확인해 주세요.");
      error.statusCode = 401;
      throw error;
    }

    await tx(
      `UPDATE auth_credentials
       SET failed_login_count = 0, locked_until = NULL, updated_at = NOW()
       WHERE user_id = $1`,
      [row.id]
    );
    await tx("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [row.id]);
    await ensureDefaultEntitlement(tx, row.id, row.plan || "free");
    const session = await createSession(tx, row.id, requestMeta);

    return { user: mapUser({ ...row, last_login_at: new Date().toISOString() }), session };
  });
}

export async function getUserBySessionToken(sessionToken) {
  if (!sessionToken) return null;
  const tokenHash = hashSessionToken(sessionToken);
  const result = await query(
    `SELECT users.id, users.email, users.name, users.nickname, users.plan,
            users.auth_status, users.email_verified_at, users.created_at,
            users.updated_at, users.last_login_at
     FROM user_sessions
     JOIN users ON users.id = user_sessions.user_id
     WHERE user_sessions.refresh_token_hash = $1
       AND user_sessions.revoked_at IS NULL
       AND user_sessions.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return mapUser(result.rows[0]);
}

export async function logoutSession(sessionToken) {
  if (!sessionToken) return { ok: true };
  await query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE refresh_token_hash = $1 AND revoked_at IS NULL`,
    [hashSessionToken(sessionToken)]
  );
  return { ok: true };
}

export async function getUserByAuthHeader(userId) {
  if (!userId) return null;
  return getUserById(userId);
}

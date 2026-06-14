/* global Buffer, process */
import { createHash, pbkdf2, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { query, withTransaction } from "./database.js";
import { ensureEducationAccountSchema } from "./educationAccountSchema.js";
import { sendVerificationEmail } from "../services/emailService.js";

const pbkdf2Async = promisify(pbkdf2);
const PASSWORD_HASH_ITERATIONS = Number(process.env.FINPLE_PASSWORD_HASH_ITERATIONS || 210000);
const PASSWORD_HASH_KEYLEN = 32;
const PASSWORD_HASH_DIGEST = "sha256";
const SESSION_DAYS = Number(process.env.FINPLE_SESSION_DAYS || 30);
const EMAIL_VERIFICATION_HOURS = Number(process.env.FINPLE_EMAIL_VERIFICATION_HOURS || 24);
const EDUCATION_ACCOUNT_VALIDITY_SQL = `(
  education_accounts.valid_until IS NULL
  OR education_accounts.valid_until >= NOW()
  OR (
    (education_accounts.valid_until AT TIME ZONE 'UTC')::time = TIME '00:00:00'
    AND (education_accounts.valid_until AT TIME ZONE 'UTC')::date >= (NOW() AT TIME ZONE 'Asia/Seoul')::date
  )
)`;

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

function getEducationValidUntilTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const isLegacyDateOnlyMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (!isLegacyDateOnlyMidnight) return date.getTime();

  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    14,
    59,
    59,
    999
  );
}

export async function hashPassword(password) {
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

export async function verifyPassword(password, storedHash = "") {
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

function createEmailVerificationToken() {
  return randomBytes(32).toString("base64url");
}

function hashEmailVerificationToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function getSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

function getEmailVerificationExpiry() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_HOURS);
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
    isEmailVerified: Boolean(row.email_verified_at),
    emailVerificationRequired: row.auth_status === "pending_email_verification" || !row.email_verified_at,
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

export async function checkEmailAvailability(email) {
  const normalizedEmail = assertEmail(email);
  const result = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [
    normalizedEmail,
  ]);

  return {
    email: normalizedEmail,
    available: result.rowCount === 0,
  };
}

async function getUserById(userId) {
  await ensureEducationAccountSchema(query);
  const result = await query(
    `SELECT users.id, users.email, users.name, users.nickname, users.plan,
            users.auth_status, users.email_verified_at, users.created_at,
            users.updated_at, users.last_login_at
     FROM users
     LEFT JOIN education_accounts ON education_accounts.user_id = users.id
     WHERE users.id = $1
       AND (
         education_accounts.id IS NULL
         OR (
           education_accounts.status = 'active'
           AND education_accounts.valid_from <= NOW()
           AND ${EDUCATION_ACCOUNT_VALIDITY_SQL}
         )
       )
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

function getVerificationBaseUrl() {
  return (
    process.env.FINPLE_APP_BASE_URL ||
    process.env.FRONTEND_ORIGIN ||
    String(process.env.CORS_ORIGIN || "").split(",")[0]?.trim() ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
}

function buildVerificationUrl(token) {
  return `${getVerificationBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

async function createVerificationToken(tx, userId, email, requestMeta = {}) {
  const token = createEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = getEmailVerificationExpiry();

  await tx(
    `UPDATE auth_email_tokens
     SET used_at = COALESCE(used_at, NOW())
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );

  await tx(
    `INSERT INTO auth_email_tokens (
       id, user_id, email, token_hash, purpose, user_agent, ip_address, expires_at
     )
     VALUES ($1, $2, $3, $4, 'verify_email', $5, $6, $7)`,
    [
      randomUUID(),
      userId,
      email,
      tokenHash,
      requestMeta.userAgent || null,
      requestMeta.ipAddress || null,
      expiresAt,
    ]
  );

  return {
    token,
    verificationUrl: buildVerificationUrl(token),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function signupWithEmail(input = {}, requestMeta = {}) {
  const email = assertEmail(input.email);
  const password = assertPassword(input.password);
  const name = String(input.name || "").trim().slice(0, 80);
  const nickname = String(input.nickname || "").trim().slice(0, 80);

  if (!name || !nickname) {
    const error = new Error("이름과 닉네임/ID를 각각 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }

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
         privacy_accepted_at, terms_accepted_at, marketing_agreed_at
       )
       VALUES ($1, $2, $3, $4, 'free', 'pending_email_verification',
         CASE WHEN $5 THEN NOW() ELSE NULL END,
         CASE WHEN $6 THEN NOW() ELSE NULL END,
         CASE WHEN $7 THEN NOW() ELSE NULL END
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
    const verification = await createVerificationToken(tx, userId, email, requestMeta);
    const emailResult = await sendVerificationEmail({
      to: email,
      name,
      verificationUrl: verification.verificationUrl,
      expiresAt: verification.expiresAt,
    });

    return {
      user: mapUser(userResult.rows[0]),
      verification: {
        email,
        expiresAt: verification.expiresAt,
        sent: Boolean(emailResult?.sent),
        deliveryMode: emailResult?.mode || "development",
        verificationUrl: emailResult?.includeDebugUrl ? verification.verificationUrl : undefined,
      },
    };
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

    if (row.auth_status === "pending_email_verification" || !row.email_verified_at) {
      const error = new Error("이메일 인증이 필요합니다. 가입 시 입력한 이메일의 인증 링크를 확인해 주세요.");
      error.statusCode = 403;
      error.code = "EMAIL_VERIFICATION_REQUIRED";
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

export async function loginWithEducationAccount(input = {}, requestMeta = {}) {
  const loginId = String(input.loginId || input.educationId || "").trim().toLowerCase();
  const password = assertPassword(input.password);

  if (!loginId || loginId.length > 80) {
    const error = new Error("교육용 ID를 확인해 주세요.");
    error.statusCode = 400;
    throw error;
  }

  return withTransaction(async (tx) => {
    await ensureEducationAccountSchema(tx);
    const result = await tx(
      `SELECT
         education_accounts.id AS education_account_id,
         education_accounts.login_id,
         education_accounts.label,
         education_accounts.cohort_name,
         education_accounts.status AS education_status,
         education_accounts.valid_from,
         education_accounts.valid_until,
         users.id,
         users.email,
         users.name,
         users.nickname,
         users.plan,
         users.auth_status,
         users.email_verified_at,
         users.created_at,
         users.updated_at,
         users.last_login_at,
         auth_credentials.password_hash,
         auth_credentials.locked_until
       FROM education_accounts
       JOIN users ON users.id = education_accounts.user_id
       JOIN auth_credentials ON auth_credentials.user_id = users.id
       WHERE LOWER(education_accounts.login_id) = LOWER($1)
       LIMIT 1`,
      [loginId]
    );

    const row = result.rows[0];
    if (!row) {
      const error = new Error("교육용 ID 또는 비밀번호를 확인해 주세요.");
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
      const error = new Error("교육용 ID 또는 비밀번호를 확인해 주세요.");
      error.statusCode = 401;
      throw error;
    }

    if (row.education_status !== "active") {
      const error = new Error("사용할 수 없는 교육용 계정입니다. 관리자에게 문의해 주세요.");
      error.statusCode = 403;
      error.code = "EDUCATION_ACCOUNT_INACTIVE";
      throw error;
    }

    const now = Date.now();
    if (row.valid_from && new Date(row.valid_from).getTime() > now) {
      const error = new Error("아직 사용 시작 전인 교육용 계정입니다.");
      error.statusCode = 403;
      error.code = "EDUCATION_ACCOUNT_NOT_STARTED";
      throw error;
    }

    const validUntilTime = getEducationValidUntilTime(row.valid_until);
    if (validUntilTime && validUntilTime < now) {
      const error = new Error("교육 기간이 종료된 계정입니다. 관리자에게 문의해 주세요.");
      error.statusCode = 403;
      error.code = "EDUCATION_ACCOUNT_EXPIRED";
      throw error;
    }

    await tx(
      `UPDATE auth_credentials
       SET failed_login_count = 0, locked_until = NULL, updated_at = NOW()
       WHERE user_id = $1`,
      [row.id]
    );
    await tx("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [row.id]);
    await tx("UPDATE education_accounts SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [
      row.education_account_id,
    ]);

    await tx(
      `INSERT INTO user_entitlements (
         user_id, plan, portfolio_limit, assets_per_portfolio_limit,
         server_storage_enabled, api_lookup_limit_per_day, pdf_report_enabled,
         report_level, screener_level, support_level, source, valid_from, valid_until
       )
       SELECT $1, ent.plan, ent.portfolio_limit, ent.assets_per_portfolio_limit,
         ent.server_storage_enabled, ent.api_lookup_limit_per_day, ent.pdf_report_enabled,
         ent.report_level, ent.screener_level, ent.support_level, 'education', NOW(), $3
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
         valid_from = EXCLUDED.valid_from,
         valid_until = EXCLUDED.valid_until,
         updated_at = NOW()`,
      [row.id, "personal", row.valid_until || null]
    );

    const session = await createSession(tx, row.id, requestMeta);
    const user = mapUser({ ...row, last_login_at: new Date().toISOString() });

    return {
      user: {
        ...user,
        entitlementSource: "education",
        educationAccount: {
          id: row.education_account_id,
          loginId: row.login_id,
          label: row.label,
          cohortName: row.cohort_name,
          validUntil: row.valid_until,
        },
      },
      session,
    };
  });
}

export async function verifyEmailToken(token) {
  const rawToken = String(token || "").trim();
  if (!rawToken) {
    const error = new Error("이메일 인증 토큰이 없습니다.");
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = hashEmailVerificationToken(rawToken);

  return withTransaction(async (tx) => {
    const result = await tx(
      `SELECT auth_email_tokens.id, auth_email_tokens.user_id, auth_email_tokens.email,
              auth_email_tokens.expires_at, auth_email_tokens.used_at,
              users.auth_status, users.email_verified_at
       FROM auth_email_tokens
       JOIN users ON users.id = auth_email_tokens.user_id
       WHERE auth_email_tokens.token_hash = $1
         AND auth_email_tokens.purpose = 'verify_email'
       LIMIT 1`,
      [tokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      const error = new Error("유효하지 않은 이메일 인증 링크입니다.");
      error.statusCode = 400;
      throw error;
    }

    if (row.used_at || row.email_verified_at) {
      return { ok: true, alreadyVerified: true, user: await getUserById(row.user_id) };
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      const error = new Error("이메일 인증 링크가 만료되었습니다. 인증 메일을 다시 요청해 주세요.");
      error.statusCode = 410;
      throw error;
    }

    await tx(
      `UPDATE auth_email_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [row.id]
    );

    const userResult = await tx(
      `UPDATE users
       SET email_verified_at = NOW(),
           auth_status = 'active',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, name, nickname, plan, auth_status, email_verified_at, created_at, updated_at, last_login_at`,
      [row.user_id]
    );

    return { ok: true, alreadyVerified: false, user: mapUser(userResult.rows[0]) };
  });
}

export async function resendVerificationEmail(input = {}, requestMeta = {}) {
  const email = assertEmail(input.email);
  const user = await getUserByEmail(email);

  if (!user) {
    return { ok: true, email, resent: false };
  }

  if (user.emailVerifiedAt || user.authStatus === "active") {
    return { ok: true, email, alreadyVerified: true };
  }

  return withTransaction(async (tx) => {
    const verification = await createVerificationToken(tx, user.id, email, requestMeta);
    const emailResult = await sendVerificationEmail({
      to: email,
      name: user.name,
      verificationUrl: verification.verificationUrl,
      expiresAt: verification.expiresAt,
    });

    return {
      ok: true,
      email,
      resent: true,
      expiresAt: verification.expiresAt,
      deliveryMode: emailResult?.mode || "development",
      verificationUrl: emailResult?.includeDebugUrl ? verification.verificationUrl : undefined,
    };
  });
}

export async function getUserBySessionToken(sessionToken) {
  if (!sessionToken) return null;
  await ensureEducationAccountSchema(query);
  const tokenHash = hashSessionToken(sessionToken);
  const result = await query(
    `SELECT users.id, users.email, users.name, users.nickname, users.plan,
            users.auth_status, users.email_verified_at, users.created_at,
            users.updated_at, users.last_login_at
     FROM user_sessions
     JOIN users ON users.id = user_sessions.user_id
     LEFT JOIN education_accounts ON education_accounts.user_id = users.id
     WHERE user_sessions.refresh_token_hash = $1
       AND user_sessions.revoked_at IS NULL
       AND user_sessions.expires_at > NOW()
       AND (
         education_accounts.id IS NULL
         OR (
           education_accounts.status = 'active'
           AND education_accounts.valid_from <= NOW()
           AND ${EDUCATION_ACCOUNT_VALIDITY_SQL}
         )
       )
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

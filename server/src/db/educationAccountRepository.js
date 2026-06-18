import { randomBytes, randomUUID } from "node:crypto";

import { query, withTransaction } from "./database.js";
import { ensureEducationAccountSchema } from "./educationAccountSchema.js";
import { hashPassword } from "./authRepository.js";

const EDUCATION_PLAN = "personal";
const EDUCATION_EMAIL_DOMAIN = "education.finple.local";
const EDUCATION_ACCOUNT_STATUSES = new Set(["active", "paused", "expired", "revoked"]);
const EDUCATION_PASSWORD_BASE = "qwerasdf";
const EDUCATION_ACCOUNT_VALIDITY_SQL = `(
  valid_until IS NULL
  OR valid_until >= NOW()
  OR (
    (valid_until AT TIME ZONE 'UTC')::time = TIME '00:00:00'
    AND (valid_until AT TIME ZONE 'UTC')::date >= (NOW() AT TIME ZONE 'Asia/Seoul')::date
  )
)`;

function normalizeLoginId(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function assertLoginId(value = "") {
  const loginId = normalizeLoginId(value);
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(loginId)) {
    const error = new Error("교육용 ID는 영문 소문자, 숫자, ., _, - 조합의 3~64자로 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  return loginId;
}

function normalizeText(value = "", maxLength = 120) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function normalizeDate(value) {
  if (!value) return null;
  const rawValue = String(value || "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T23:59:59.999+09:00`)
    : new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("유효한 날짜를 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  return date.toISOString();
}

function normalizeStatus(value = "active") {
  const status = String(value || "active").trim().toLowerCase();
  if (!EDUCATION_ACCOUNT_STATUSES.has(status)) {
    const error = new Error("교육용 계정 상태값을 확인해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  return status;
}

function assertPassword(password = "") {
  const raw = String(password || "");
  if (raw.length < 8 || raw.length > 128) {
    const error = new Error("비밀번호는 8~128자로 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  return raw;
}

function normalizeBulkNumber(value, fallback = 1) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < 1 || number > 999999) {
    const error = new Error("교육 계정 번호는 1~999999 사이의 정수로 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function getBulkNumberRange(input = {}) {
  const startNumber = normalizeBulkNumber(input.startNumber, 1);
  const endNumber = input.endNumber === undefined
    ? startNumber + Math.min(Math.max(Number(input.count || 1), 1), 200) - 1
    : normalizeBulkNumber(input.endNumber, startNumber);
  const count = endNumber - startNumber + 1;

  if (count < 1) {
    const error = new Error("끝번호는 시작번호보다 크거나 같아야 합니다.");
    error.statusCode = 400;
    throw error;
  }

  if (count > 200) {
    const error = new Error("교육 계정은 한 번에 200개까지 생성할 수 있습니다.");
    error.statusCode = 400;
    throw error;
  }

  return { startNumber, endNumber, count };
}

function normalizeAccountIds(values = []) {
  const ids = Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  return [...new Set(ids)].slice(0, 500);
}

function createEducationPassword(sequenceNumber) {
  const randomCasePrefix = EDUCATION_PASSWORD_BASE
    .split("")
    .map((char) => (randomBytes(1)[0] % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
    .join("");
  const suffix = String(sequenceNumber || 1).padStart(3, "0");
  return `${randomCasePrefix}${suffix}`;
}

function buildEducationEmail(loginId) {
  return `${loginId}@${EDUCATION_EMAIL_DOMAIN}`;
}

function mapEducationAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    initialPassword: row.initial_password,
    label: row.label,
    cohortName: row.cohort_name,
    status: row.status,
    effectiveStatus: row.effective_status || row.status,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    lastLoginAt: row.last_login_at,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function applyEducationEntitlement(tx, userId, validUntil = null) {
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
       valid_until = EXCLUDED.valid_until,
       updated_at = NOW()`,
    [userId, EDUCATION_PLAN, validUntil]
  );
}

async function revokeEducationSessions(tx, userId) {
  await tx(
    `UPDATE user_sessions
        SET revoked_at = COALESCE(revoked_at, NOW())
      WHERE user_id = $1
        AND revoked_at IS NULL`,
    [userId]
  );
}

export async function listEducationAccounts() {
  await ensureEducationAccountSchema(query);
  const [summaryResult, accountResult] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total_accounts,
         COUNT(*) FILTER (WHERE status = 'active' AND ${EDUCATION_ACCOUNT_VALIDITY_SQL})::int AS active_accounts,
         COUNT(*) FILTER (
           WHERE status = 'expired'
              OR (valid_until IS NOT NULL AND NOT ${EDUCATION_ACCOUNT_VALIDITY_SQL})
         )::int AS expired_accounts,
         COUNT(*) FILTER (
           WHERE status = 'active'
             AND valid_until IS NOT NULL
             AND ${EDUCATION_ACCOUNT_VALIDITY_SQL}
             AND valid_until < NOW() + INTERVAL '7 days'
         )::int AS expiring_7d,
         COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '30 days')::int AS logins_30d
       FROM education_accounts`
    ),
    query(
      `SELECT
         education_accounts.*,
         users.email,
         CASE
           WHEN education_accounts.status = 'expired'
             OR (
               education_accounts.valid_until IS NOT NULL
               AND NOT ${EDUCATION_ACCOUNT_VALIDITY_SQL}
             )
           THEN 'expired'
           ELSE education_accounts.status
         END AS effective_status
       FROM education_accounts
       JOIN users ON users.id = education_accounts.user_id
       ORDER BY education_accounts.created_at DESC
       LIMIT 200`
    ),
  ]);

  const summary = summaryResult.rows[0] || {};
  return {
    summary: {
      totalAccounts: Number(summary.total_accounts || 0),
      activeAccounts: Number(summary.active_accounts || 0),
      expiredAccounts: Number(summary.expired_accounts || 0),
      expiring7d: Number(summary.expiring_7d || 0),
      logins30d: Number(summary.logins_30d || 0),
    },
    accounts: accountResult.rows.map(mapEducationAccount),
  };
}

async function createEducationAccount(input = {}) {
  const loginId = assertLoginId(input.loginId);
  const password = assertPassword(input.password);
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const accountId = randomUUID();
  const validUntil = normalizeDate(input.validUntil);
  const label = normalizeText(input.label || loginId);
  const cohortName = normalizeText(input.cohortName);
  const memo = normalizeText(input.memo, 500);

  const account = await withTransaction(async (tx) => {
    await ensureEducationAccountSchema(tx);
    const existing = await tx("SELECT id FROM education_accounts WHERE LOWER(login_id) = LOWER($1) LIMIT 1", [
      loginId,
    ]);
    if (existing.rowCount > 0) {
      const error = new Error("이미 사용 중인 교육용 ID입니다.");
      error.statusCode = 409;
      throw error;
    }

    await tx(
      `INSERT INTO users (
         id, email, name, nickname, plan, auth_status,
         email_verified_at, privacy_accepted_at, terms_accepted_at
       )
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW(), NOW())`,
      [userId, buildEducationEmail(loginId), label || loginId, loginId, EDUCATION_PLAN]
    );

    await tx("INSERT INTO auth_credentials (user_id, password_hash) VALUES ($1, $2)", [
      userId,
      passwordHash,
    ]);

    await applyEducationEntitlement(tx, userId, validUntil);

    const accountResult = await tx(
      `INSERT INTO education_accounts (
         id, user_id, login_id, initial_password, label, cohort_name, status, valid_until, memo
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
       RETURNING *`,
      [accountId, userId, loginId, password, label, cohortName, validUntil, memo]
    );

    return mapEducationAccount({ ...accountResult.rows[0], email: buildEducationEmail(loginId) });
  });

  return { account, initialPassword: password };
}

export async function bulkCreateEducationAccounts(input = {}) {
  const { startNumber, endNumber, count } = getBulkNumberRange(input);
  const prefix = assertLoginId(input.prefix || "finple-class");
  const width = Math.max(String(endNumber).length, 3);
  const loginIds = Array.from(
    { length: count },
    (_, index) => `${prefix}-${String(startNumber + index).padStart(width, "0")}`
  );
  const created = [];

  await ensureEducationAccountSchema(query);
  const existing = await query(
    `SELECT login_id
       FROM education_accounts
      WHERE LOWER(login_id) = ANY($1::text[])`,
    [loginIds]
  );

  if (existing.rowCount > 0) {
    const firstConflict = existing.rows[0]?.login_id || loginIds[0];
    const error = new Error(`이미 사용 중인 교육용 ID가 있습니다: ${firstConflict}`);
    error.statusCode = 409;
    throw error;
  }

  for (let offset = 0; offset < count; offset += 1) {
    const sequenceNumber = startNumber + offset;
    const loginId = loginIds[offset];
    const labelPrefix = normalizeText(input.labelPrefix || input.cohortName || "FINPLE class");
    const result = await createEducationAccount({
      loginId,
      password: createEducationPassword(sequenceNumber),
      label: `${labelPrefix} ${sequenceNumber}`,
      cohortName: input.cohortName,
      validUntil: input.validUntil,
      memo: input.memo,
    });
    created.push(result);
  }

  return {
    accounts: created.map((item) => item.account),
    credentials: created.map((item) => ({
      loginId: item.account.loginId,
      password: item.initialPassword,
      validUntil: item.account.validUntil,
      cohortName: item.account.cohortName,
    })),
  };
}

export async function updateEducationAccount(accountId, input = {}) {
  const status = input.status === undefined ? undefined : normalizeStatus(input.status);
  const validUntil = input.validUntil === undefined ? undefined : normalizeDate(input.validUntil);
  const label = input.label === undefined ? undefined : normalizeText(input.label);
  const cohortName = input.cohortName === undefined ? undefined : normalizeText(input.cohortName);
  const memo = input.memo === undefined ? undefined : normalizeText(input.memo, 500);

  return withTransaction(async (tx) => {
    await ensureEducationAccountSchema(tx);
    const currentResult = await tx("SELECT * FROM education_accounts WHERE id = $1 LIMIT 1", [accountId]);
    const current = currentResult.rows[0];
    if (!current) {
      const error = new Error("교육용 계정을 찾을 수 없습니다.");
      error.statusCode = 404;
      throw error;
    }

    const nextStatus = status ?? current.status;
    const nextValidUntil = validUntil === undefined ? current.valid_until : validUntil;

    const updateResult = await tx(
      `UPDATE education_accounts
          SET status = $2,
              valid_until = $3,
              label = $4,
              cohort_name = $5,
              memo = $6,
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [
        accountId,
        nextStatus,
        nextValidUntil,
        label === undefined ? current.label : label,
        cohortName === undefined ? current.cohort_name : cohortName,
        memo === undefined ? current.memo : memo,
      ]
    );

    if (nextStatus === "active") {
      await applyEducationEntitlement(tx, current.user_id, nextValidUntil);
    } else {
      await revokeEducationSessions(tx, current.user_id);
    }

    const account = mapEducationAccount(updateResult.rows[0]);
    return { account };
  });
}

export async function deleteAllEducationAccounts() {
  return withTransaction(async (tx) => {
    await ensureEducationAccountSchema(tx);
    const result = await tx(
      `WITH target_accounts AS (
         SELECT user_id FROM education_accounts
       ),
       deleted_users AS (
         DELETE FROM users
          WHERE id IN (SELECT user_id FROM target_accounts)
          RETURNING id
       )
       SELECT COUNT(*)::int AS deleted_accounts
         FROM deleted_users`
    );

    return {
      deletedAccounts: Number(result.rows[0]?.deleted_accounts || 0),
    };
  });
}

export async function deleteEducationAccountsByIds(accountIds = []) {
  const ids = normalizeAccountIds(accountIds);
  if (ids.length === 0) {
    const error = new Error("삭제할 교육 계정을 선택해 주세요.");
    error.statusCode = 400;
    throw error;
  }

  return withTransaction(async (tx) => {
    await ensureEducationAccountSchema(tx);
    const result = await tx(
      `WITH target_accounts AS (
         SELECT user_id
           FROM education_accounts
          WHERE id::text = ANY($1::text[])
       ),
       deleted_users AS (
         DELETE FROM users
          WHERE id IN (SELECT user_id FROM target_accounts)
          RETURNING id
       )
       SELECT COUNT(*)::int AS deleted_accounts
         FROM deleted_users`,
      [ids]
    );

    return {
      deletedAccounts: Number(result.rows[0]?.deleted_accounts || 0),
    };
  });
}

export async function deleteExpiredEducationAccounts() {
  return withTransaction(async (tx) => {
    await ensureEducationAccountSchema(tx);
    const result = await tx(
      `WITH target_accounts AS (
         SELECT user_id
           FROM education_accounts
          WHERE status = 'expired'
             OR (
               valid_until IS NOT NULL
               AND NOT ${EDUCATION_ACCOUNT_VALIDITY_SQL}
             )
       ),
       deleted_users AS (
         DELETE FROM users
          WHERE id IN (SELECT user_id FROM target_accounts)
          RETURNING id
       )
       SELECT COUNT(*)::int AS deleted_accounts
         FROM deleted_users`
    );

    return {
      deletedAccounts: Number(result.rows[0]?.deleted_accounts || 0),
    };
  });
}

export async function deleteEducationAccount(accountId) {
  return withTransaction(async (tx) => {
    await ensureEducationAccountSchema(tx);
    const currentResult = await tx("SELECT user_id FROM education_accounts WHERE id = $1 LIMIT 1", [accountId]);
    const current = currentResult.rows[0];

    if (!current) {
      const error = new Error("교육 계정을 찾을 수 없습니다.");
      error.statusCode = 404;
      throw error;
    }

    const deletedResult = await tx(
      `DELETE FROM users
        WHERE id = $1
        RETURNING id`,
      [current.user_id]
    );

    return {
      deletedAccountId: accountId,
      deletedAccounts: deletedResult.rowCount,
    };
  });
}

function escapeCsvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDateForCsv(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

export function buildEducationCredentialsCsv(credentials = []) {
  const rows = [
    ["번호", "교육용 ID", "초기 비밀번호", "만료일", "수업/세미나", "로그인 주소"],
    ...credentials.map((item, index) => [
      index + 1,
      item.loginId,
      item.password,
      formatDateForCsv(item.validUntil),
      item.cohortName || "",
      "https://finple.co.kr/login",
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function buildEducationAccountsCsv(accounts = []) {
  const rows = [
    ["번호", "교육용 ID", "상태", "만료일", "수업/세미나", "최근 로그인", "표시 이름"],
    ...accounts.map((item, index) => [
      index + 1,
      item.loginId,
      item.initialPassword || "",
      item.status,
      formatDateForCsv(item.validUntil),
      item.cohortName || "",
      item.lastLoginAt || "",
      item.label || "",
    ]),
  ];
  rows[0] = ["번호", "교육용 ID", "초기 비밀번호", "상태", "만료일", "수업/세미나", "최근 로그인", "표시 이름"];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

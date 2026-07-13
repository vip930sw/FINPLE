let pool = null;
let pgImportError = null;

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseMode() {
  return isDatabaseConfigured() ? "postgres" : "disabled";
}

function getSslOption() {
  const value = String(process.env.DATABASE_SSL || "false").toLowerCase();

  if (value === "true" || value === "require") {
    return { rejectUnauthorized: false };
  }

  return false;
}

async function getPool() {
  if (!isDatabaseConfigured()) {
    const error = new Error(
      "DATABASE_URL이 설정되어 있지 않습니다. 현재는 브라우저 localStorage 저장 모드로 사용하세요."
    );
    error.statusCode = 503;
    throw error;
  }

  if (pool) return pool;

  let Pool;

  try {
    ({ Pool } = await import("pg"));
  } catch (error) {
    pgImportError = error;
    const pgError = new Error(
      "PostgreSQL 드라이버(pg)가 설치되어 있지 않습니다. server 폴더에서 npm.cmd install을 실행하세요."
    );
    pgError.statusCode = 500;
    throw pgError;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: getSslOption(),
    max: Math.max(1, Math.floor(positiveNumber(process.env.DATABASE_POOL_MAX, 10))),
    idleTimeoutMillis: positiveNumber(process.env.DATABASE_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: positiveNumber(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 8000),
    statement_timeout: positiveNumber(process.env.DATABASE_STATEMENT_TIMEOUT_MS, 12000),
    query_timeout: positiveNumber(process.env.DATABASE_QUERY_TIMEOUT_MS, 15000),
    idle_in_transaction_session_timeout: positiveNumber(
      process.env.DATABASE_IDLE_TRANSACTION_TIMEOUT_MS,
      15000
    ),
  });

  pool.on("error", (error) => {
    console.error(
      JSON.stringify({
        type: "database_pool_error",
        message: error?.message || "Unknown PostgreSQL pool error",
        checkedAt: new Date().toISOString(),
      })
    );
  });

  return pool;
}

export async function query(text, params = []) {
  const dbPool = await getPool();
  return dbPool.query(text, params);
}

export async function withTransaction(callback) {
  const dbPool = await getPool();
  const client = await dbPool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback((text, params = []) => client.query(text, params));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseConnection({ timeoutMs } = {}) {
  const startedAt = Date.now();

  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      mode: "disabled",
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: "DATABASE_URL 미설정. 서버 DB 저장은 아직 비활성화 상태입니다.",
    };
  }

  if (pgImportError) {
    return {
      configured: true,
      mode: "postgres",
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: pgImportError.message,
    };
  }

  try {
    const dbPool = await getPool();
    const safeTimeoutMs = positiveNumber(
      timeoutMs,
      positiveNumber(process.env.DATABASE_HEALTH_TIMEOUT_MS, 4500)
    );
    const result = await dbPool.query({
      text: "SELECT 1 AS ok, NOW() AS now",
      query_timeout: safeTimeoutMs,
    });

    return {
      configured: true,
      mode: "postgres",
      ok: result.rows?.[0]?.ok === 1,
      checkedAt: result.rows?.[0]?.now,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      configured: true,
      mode: "postgres",
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error.message,
    };
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

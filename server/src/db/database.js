let pool = null;
let pgImportError = null;

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
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
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

export async function checkDatabaseConnection() {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      mode: "disabled",
      ok: false,
      message: "DATABASE_URL 미설정. 서버 DB 저장은 아직 비활성화 상태입니다.",
    };
  }

  if (pgImportError) {
    return {
      configured: true,
      mode: "postgres",
      ok: false,
      message: pgImportError.message,
    };
  }

  try {
    const result = await query("SELECT NOW() AS now");
    return {
      configured: true,
      mode: "postgres",
      ok: true,
      checkedAt: result.rows?.[0]?.now,
    };
  } catch (error) {
    return {
      configured: true,
      mode: "postgres",
      ok: false,
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

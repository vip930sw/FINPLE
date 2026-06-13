export async function ensureEducationAccountSchema(runQuery) {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS education_accounts (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      login_id TEXT NOT NULL UNIQUE,
      initial_password TEXT,
      label TEXT,
      cohort_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      valid_until TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      memo TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT education_accounts_status_check
        CHECK (status IN ('active', 'paused', 'expired', 'revoked'))
    )
  `);

  await runQuery(`
    ALTER TABLE education_accounts
      ADD COLUMN IF NOT EXISTS initial_password TEXT
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_education_accounts_cohort
      ON education_accounts(cohort_name, status)
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_education_accounts_valid_until
      ON education_accounts(valid_until)
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_education_accounts_status
      ON education_accounts(status)
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_user_entitlements_source
      ON user_entitlements(source)
  `);
}

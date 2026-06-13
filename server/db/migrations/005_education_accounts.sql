-- FINPLE education accounts
-- Purpose:
-- 1) Provide Personal-level access for offline classes without payment rows.
-- 2) Keep education entitlements separate from paid subscriptions.
-- 3) Allow admin creation, expiry, pause, revoke, and CSV distribution.

BEGIN;

CREATE TABLE IF NOT EXISTS education_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL UNIQUE,
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
);

CREATE INDEX IF NOT EXISTS idx_education_accounts_cohort
  ON education_accounts(cohort_name, status);

CREATE INDEX IF NOT EXISTS idx_education_accounts_valid_until
  ON education_accounts(valid_until);

CREATE INDEX IF NOT EXISTS idx_education_accounts_status
  ON education_accounts(status);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_source
  ON user_entitlements(source);

COMMIT;

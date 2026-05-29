-- FINPLE Step 109-7 — Email verification tokens
-- Purpose:
-- 1) Add a dedicated token table for email verification.
-- 2) Keep the migration idempotent for safe Supabase SQL editor execution.
-- 3) Mark existing users as verified to avoid locking out legacy/demo accounts.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS auth_email_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'verify_email',
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_email_tokens_token_hash
  ON auth_email_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_user_purpose
  ON auth_email_tokens(user_id, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_active
  ON auth_email_tokens(email, expires_at DESC)
  WHERE used_at IS NULL;

UPDATE users
SET email_verified_at = COALESCE(email_verified_at, created_at, NOW()),
    auth_status = CASE
      WHEN auth_status IS NULL OR auth_status = 'pending_email_verification' THEN 'active'
      ELSE auth_status
    END,
    updated_at = NOW()
WHERE email_verified_at IS NULL
  AND created_at < NOW() - INTERVAL '5 minutes';

COMMIT;

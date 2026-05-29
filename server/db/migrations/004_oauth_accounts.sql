-- FINPLE Step 109-8 — OAuth account linking
-- Purpose:
-- 1) Store social login provider identities separately from the users table.
-- 2) Allow Google/Kakao/Naver expansion without changing the core auth schema.
-- 3) Keep migration idempotent for Supabase SQL editor execution.

BEGIN;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

ALTER TABLE oauth_accounts
  ADD COLUMN IF NOT EXISTS id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_user_id TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

UPDATE oauth_accounts
SET profile = COALESCE(profile, '{}'::jsonb),
    linked_at = COALESCE(linked_at, NOW())
WHERE profile IS NULL
   OR linked_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'oauth_accounts_user_id_fkey'
      AND conrelid = 'oauth_accounts'::regclass
  ) THEN
    ALTER TABLE oauth_accounts
      ADD CONSTRAINT oauth_accounts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_accounts_provider_uid
  ON oauth_accounts(provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_provider
  ON oauth_accounts(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_email
  ON oauth_accounts(LOWER(email))
  WHERE email IS NOT NULL;

COMMIT;

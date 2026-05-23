-- FINPLE Step 97 — Auth / subscription operational schema hardening
-- Purpose:
-- 1) Support the existing email login/signup backend tables.
-- 2) Support Toss payment/subscription/webhook tables used by current routes.
-- 3) Keep the migration idempotent so it can be compared safely before Supabase execution.
--
-- Apply manually in Supabase SQL editor or psql after reviewing current production schema.

BEGIN;

-- Users: columns referenced by authRepository.js
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_agreed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS auth_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_refresh_token_hash
  ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
  ON user_sessions(user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS plan_entitlements (
  plan TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  price_krw INTEGER,
  billing_cycle TEXT NOT NULL DEFAULT 'none',
  portfolio_limit INTEGER NOT NULL DEFAULT 1,
  assets_per_portfolio_limit INTEGER NOT NULL DEFAULT 10,
  server_storage_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  api_lookup_limit_per_day INTEGER NOT NULL DEFAULT 20,
  pdf_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  report_level TEXT NOT NULL DEFAULT 'basic',
  screener_level TEXT NOT NULL DEFAULT 'basic',
  support_level TEXT NOT NULL DEFAULT 'standard',
  is_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plan_entitlements (
  plan, label, price_krw, billing_cycle,
  portfolio_limit, assets_per_portfolio_limit, server_storage_enabled,
  api_lookup_limit_per_day, pdf_report_enabled,
  report_level, screener_level, support_level, is_payment_enabled
)
VALUES
  ('free', 'Free', 0, 'none', 1, 10, TRUE, 20, FALSE, 'basic', 'basic', 'standard', FALSE),
  ('personal', 'Personal', 9900, 'monthly', 10, 30, TRUE, 100, TRUE, 'standard', 'standard', 'priority', FALSE),
  ('pro', 'Pro', NULL, 'monthly', 50, 100, TRUE, 500, TRUE, 'advanced', 'advanced', 'priority', FALSE)
ON CONFLICT (plan) DO UPDATE SET
  label = EXCLUDED.label,
  price_krw = EXCLUDED.price_krw,
  billing_cycle = EXCLUDED.billing_cycle,
  portfolio_limit = EXCLUDED.portfolio_limit,
  assets_per_portfolio_limit = EXCLUDED.assets_per_portfolio_limit,
  server_storage_enabled = EXCLUDED.server_storage_enabled,
  api_lookup_limit_per_day = EXCLUDED.api_lookup_limit_per_day,
  pdf_report_enabled = EXCLUDED.pdf_report_enabled,
  report_level = EXCLUDED.report_level,
  screener_level = EXCLUDED.screener_level,
  support_level = EXCLUDED.support_level,
  -- Keep payment disabled by default while Toss approval is pending.
  is_payment_enabled = plan_entitlements.is_payment_enabled,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  portfolio_limit INTEGER NOT NULL DEFAULT 1,
  assets_per_portfolio_limit INTEGER NOT NULL DEFAULT 10,
  server_storage_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  api_lookup_limit_per_day INTEGER NOT NULL DEFAULT 20,
  pdf_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  report_level TEXT NOT NULL DEFAULT 'basic',
  screener_level TEXT NOT NULL DEFAULT 'basic',
  support_level TEXT NOT NULL DEFAULT 'standard',
  source TEXT NOT NULL DEFAULT 'auth',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_plan
  ON user_entitlements(plan);

-- Subscriptions: extend Step 45 base schema for Toss and MY PAGE subscription state.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE subscriptions
SET current_period_start = COALESCE(current_period_start, started_at)
WHERE current_period_start IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
  ON subscriptions(provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_latest
  ON subscriptions(user_id, current_period_start DESC NULLS LAST, current_period_end DESC NULLS LAST);

-- Payments: extend Step 45 base schema for Toss confirm/webhook matching.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE payments
SET requested_at = COALESCE(requested_at, paid_at, created_at)
WHERE requested_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user_created
  ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id
  ON payments(provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'received',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_event_id
  ON payment_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_processing_status
  ON payment_events(processing_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recurring_payment_methods (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'toss-payments',
  customer_key TEXT NOT NULL,
  billing_key_encrypted TEXT,
  method_type TEXT NOT NULL DEFAULT 'card',
  display_label TEXT,
  card_company TEXT,
  card_last4 TEXT,
  masked_card_number TEXT,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_payment_methods_provider_customer_key
  ON recurring_payment_methods(provider, customer_key);
CREATE INDEX IF NOT EXISTS idx_recurring_payment_methods_user_default
  ON recurring_payment_methods(user_id, is_default, status);

-- Give existing demo/local users a default free entitlement when missing.
INSERT INTO user_entitlements (
  user_id, plan, portfolio_limit, assets_per_portfolio_limit,
  server_storage_enabled, api_lookup_limit_per_day, pdf_report_enabled,
  report_level, screener_level, support_level, source
)
SELECT
  u.id,
  ent.plan,
  ent.portfolio_limit,
  ent.assets_per_portfolio_limit,
  ent.server_storage_enabled,
  ent.api_lookup_limit_per_day,
  ent.pdf_report_enabled,
  ent.report_level,
  ent.screener_level,
  ent.support_level,
  'migration'
FROM users u
JOIN plan_entitlements ent ON ent.plan = COALESCE(NULLIF(u.plan, ''), 'free')
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

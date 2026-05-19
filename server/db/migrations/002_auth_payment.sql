-- FINPLE Step 127 — Auth / Payment 운영 스키마 확장
-- 적용 전 DATABASE_URL이 가리키는 DB에서 실행하세요.
-- 예: psql "$DATABASE_URL" -f server/db/migrations/002_auth_payment.sql
--
-- 목적
-- 1) 이메일/비밀번호 기반 회원가입과 로그인 준비
-- 2) 결제/구독 상태와 실제 사용 권한(entitlement) 분리
-- 3) PG webhook 이벤트를 중복 없이 저장할 수 있는 구조 마련

-- =========================
-- 1. users 확장
-- =========================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_agreed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_auth_status ON users (auth_status);

-- 이메일/비밀번호 인증 정보입니다.
-- password_hash는 서버에서 bcrypt/argon2 등으로 해시한 결과만 저장합니다.
CREATE TABLE IF NOT EXISTS auth_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- refresh token 또는 장기 로그인 세션을 저장하는 테이블입니다.
-- 실제 토큰 원문은 저장하지 않고 hash만 저장합니다.
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(revoked_at);

-- 이메일 인증 / 비밀번호 재설정 / 이메일 변경용 토큰입니다.
-- token 원문은 저장하지 않고 hash만 저장합니다.
CREATE TABLE IF NOT EXISTS auth_email_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL,
  target_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_user_purpose ON auth_email_tokens(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_expires ON auth_email_tokens(expires_at);

-- =========================
-- 2. 플랜 권한 템플릿
-- =========================

CREATE TABLE IF NOT EXISTS plan_entitlements (
  plan TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  price_krw INTEGER,
  billing_cycle TEXT NOT NULL DEFAULT 'none',
  portfolio_limit INTEGER,
  assets_per_portfolio_limit INTEGER,
  server_storage_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  api_lookup_limit_per_day INTEGER,
  pdf_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  report_level TEXT NOT NULL DEFAULT 'summary',
  screener_level TEXT NOT NULL DEFAULT 'basic',
  support_level TEXT NOT NULL DEFAULT 'normal',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plan_entitlements (
  plan,
  label,
  price_krw,
  billing_cycle,
  portfolio_limit,
  assets_per_portfolio_limit,
  server_storage_enabled,
  api_lookup_limit_per_day,
  pdf_report_enabled,
  report_level,
  screener_level,
  support_level,
  is_public,
  is_payment_enabled
)
VALUES
  ('free', 'Free', 0, 'none', 1, 5, FALSE, 3, FALSE, 'summary_preview', 'basic', 'normal', TRUE, FALSE),
  ('personal', 'Personal', 9900, 'monthly', 30, NULL, TRUE, NULL, TRUE, 'advanced', 'full', 'priority', TRUE, FALSE),
  ('pro', 'Pro', NULL, 'monthly', NULL, NULL, TRUE, NULL, TRUE, 'business', 'advanced', 'priority', FALSE, FALSE)
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
  is_public = EXCLUDED.is_public,
  is_payment_enabled = EXCLUDED.is_payment_enabled,
  updated_at = NOW();

-- 사용자별 실제 사용 권한입니다.
-- 구독 상태와 별도로 최종 사용 가능 권한을 계산/저장합니다.
CREATE TABLE IF NOT EXISTS user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  portfolio_limit INTEGER,
  assets_per_portfolio_limit INTEGER,
  server_storage_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  api_lookup_limit_per_day INTEGER,
  pdf_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  report_level TEXT NOT NULL DEFAULT 'summary_preview',
  screener_level TEXT NOT NULL DEFAULT 'basic',
  support_level TEXT NOT NULL DEFAULT 'normal',
  source TEXT NOT NULL DEFAULT 'plan',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_plan ON user_entitlements(plan);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_valid_until ON user_entitlements(valid_until);

-- 기존 사용자에게 Free 기본 권한을 부여합니다.
INSERT INTO user_entitlements (
  user_id,
  plan,
  portfolio_limit,
  assets_per_portfolio_limit,
  server_storage_enabled,
  api_lookup_limit_per_day,
  pdf_report_enabled,
  report_level,
  screener_level,
  support_level,
  source
)
SELECT
  users.id,
  COALESCE(users.plan, 'free'),
  ent.portfolio_limit,
  ent.assets_per_portfolio_limit,
  ent.server_storage_enabled,
  ent.api_lookup_limit_per_day,
  ent.pdf_report_enabled,
  ent.report_level,
  ent.screener_level,
  ent.support_level,
  'migration'
FROM users
LEFT JOIN plan_entitlements ent ON ent.plan = COALESCE(users.plan, 'free')
ON CONFLICT (user_id) DO NOTHING;

-- =========================
-- 3. subscriptions / payments 확장
-- =========================

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer ON subscriptions(provider, provider_customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
  ON subscriptions(provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS tax_free_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS failure_code TEXT,
  ADD COLUMN IF NOT EXISTS failure_message TEXT,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_payments_user_created ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments(provider, provider_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- PG webhook 이벤트 원본 저장소입니다.
-- 동일 이벤트가 여러 번 들어와도 provider + event_id로 중복 처리를 막습니다.
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_events_status_created ON payment_events(processing_status, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_events_user_created ON payment_events(user_id, created_at DESC);

-- =========================
-- 4. inquiries 확장
-- =========================

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS page_url TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

CREATE INDEX IF NOT EXISTS idx_inquiries_user_created ON inquiries(user_id, created_at DESC);

-- =========================
-- 5. 운영 메모
-- =========================
-- 실제 회원가입 API 구현 시 필요한 서버 의존성 후보:
-- - bcrypt 또는 argon2: 비밀번호 해시
-- - jsonwebtoken 또는 cookie-session: 세션/JWT 처리
-- - crypto: 토큰 생성 및 hash 처리
--
-- 결제 PG 연동 전에는 plan_entitlements.is_payment_enabled를 FALSE로 유지합니다.
-- 테스트 결제 연동 시 personal부터 TRUE로 전환하고 webhook 검증 로직을 먼저 붙입니다.
